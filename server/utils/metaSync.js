/**
 * Meta Background Sync Engine
 *
 * Handles two sync jobs:
 *   - Structure sync  (ad accounts → campaigns → adsets → ads → creatives)
 *   - Insights sync   (impressions/clicks/spend per campaign, adset, ad)
 *
 * Both jobs are tracked in Redis so callers can poll progress without
 * waiting on the HTTP response.  Jobs are de-duplicated: a second enqueue
 * while one is running is a no-op.
 *
 * Uses Meta's Batch API to collapse N sequential calls into ceil(N/50)
 * batch calls, which keeps us well within Meta's rate limits.
 */

import { MetaUserToken, MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight, MetaPage, Organisation } from '../models/index.js'
import { decrypt } from './crypto.js'
import { getRedisClient } from './redis.js'
import { metaBatch, withRetry } from './metaBatch.js'
import { downloadUrlToS3 } from './storage.js'
import { getMetaAssetLimits } from './commercialPolicy.js'

const META_VERSION = 'v24.0'

// ─── Redis key helpers ────────────────────────────────────────────────────────

const KEYS = {
  structure: (orgId) => `meta:sync:structure:${orgId}`,
  insights:  (orgId) => `meta:sync:insights:${orgId}`,
}
const SYNC_TTL = 24 * 60 * 60 // 24 h

const setState = async (key, state) => {
  try {
    const redis = getRedisClient()
    await redis.setex(key, SYNC_TTL, JSON.stringify(state))
  } catch (e) {
    console.error('[MetaSync] Redis write error:', e?.message)
  }
}

const getState = async (key) => {
  try {
    const redis = getRedisClient()
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ─── Public status readers ────────────────────────────────────────────────────

export const getStructureSyncStatus = async (orgId) =>
  (await getState(KEYS.structure(orgId))) || { status: 'idle' }

export const getInsightsSyncStatus = async (orgId) =>
  (await getState(KEYS.insights(orgId))) || { status: 'idle' }

// ─── Structure sync ───────────────────────────────────────────────────────────

/**
 * Full structure sync using 5 batch waves:
 *   Wave 1 : ad accounts   (plain fetch, usually 1-3 accounts)
 *   Wave 2 : campaigns     (1 batch call for all accounts)
 *   Wave 3 : adsets        (1+ batch calls for all campaigns)
 *   Wave 4 : ads           (1+ batch calls for all adsets)
 *   Wave 5 : creatives     (1+ batch calls for all ads that have a creative)
 */
export const runStructureSync = async (orgId) => {
  const key = KEYS.structure(orgId)

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) {
    await setState(key, { status: 'failed', error: 'Meta not connected', finishedAt: new Date().toISOString() })
    return
  }

  const userToken = decrypt(tokenRow.userTokenEnc)
  if (!userToken) {
    await setState(key, { status: 'failed', error: 'Meta token missing', finishedAt: new Date().toISOString() })
    return
  }


  const startedAt = new Date().toISOString()
  const progress = { accounts: 0, campaigns: 0, adsets: 0, ads: 0 }
  await setState(key, { status: 'running', startedAt, progress })

  try {
    // ── Resolve business IDs from connected pages for this org ───────────────
    const connectedPages = await MetaPage.findAll({ where: { organisationId: orgId, status: 'Active' } })
    const allowedBusinessIds = new Set()

    for (const page of connectedPages) {
      let businessId = page.businessId
      if (!businessId) {
        try {
          const pageResp = await withRetry(() =>
            $fetch(`https://graph.facebook.com/${META_VERSION}/${page.pageId}?fields=business&access_token=${encodeURIComponent(userToken)}`)
          )
          businessId = pageResp?.business?.id || null
          if (businessId) {
            await page.update({ businessId })
          }
        } catch (e) {
          console.warn(`[MetaSync] Could not fetch business for page ${page.pageId}:`, e?.message)
        }
      }
      if (businessId) allowedBusinessIds.add(businessId)
    }

    // ── Wave 1: Ad accounts ──────────────────────────────────────────────────
    const accResp = await withRetry(() =>
      $fetch(
        `https://graph.facebook.com/${META_VERSION}/me/adaccounts?fields=id,name,currency,timezone_name,business&limit=200&access_token=${encodeURIComponent(userToken)}`
      )
    )
    const allAccounts = Array.isArray(accResp?.data) ? accResp.data : []

    // Filter to only ad accounts belonging to the org's connected business(es)
    let accounts = allowedBusinessIds.size > 0
      ? allAccounts.filter((acc) => acc.business?.id && allowedBusinessIds.has(acc.business.id))
      : allAccounts

    const org = await Organisation.findByPk(orgId, { attributes: ['id', 'licenseType'] })
    const metaLimits = getMetaAssetLimits(org)
    if (metaLimits) {
      accounts = accounts.slice(0, metaLimits.adAccounts)
    }

    for (const acc of accounts) {
      await MetaAdAccount.upsert(
        {
          organisationId: orgId,
          adAccountId: acc.id,
          name: acc.name,
          currency: acc.currency,
          timezone: acc.timezone_name,
        },
        { conflictFields: ['adAccountId', 'organisationId'] }
      )
    }
    progress.accounts = accounts.length
    await setState(key, { status: 'running', startedAt, progress })

    if (!accounts.length) {
      await setState(key, { status: 'done', startedAt, finishedAt: new Date().toISOString(), progress })
      return
    }

    // ── Wave 2: Campaigns (one batch request per ad account) ─────────────────
    const campaignBatchReqs = accounts.map((acc) => ({
      method: 'GET',
      relative_url: `${acc.id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&limit=200`,
    }))
    const campaignBatchRes = await metaBatch(campaignBatchReqs, userToken)

    const allCampaigns = []
    for (let i = 0; i < accounts.length; i++) {
      const campaigns = Array.isArray(campaignBatchRes[i]?.data) ? campaignBatchRes[i].data : []
      for (const c of campaigns) {
        await MetaCampaign.upsert(
          {
            organisationId: orgId,
            adAccountId: accounts[i].id,
            campaignId: c.id,
            name: c.name,
            status: c.status,
            dailyBudget: c.daily_budget || null,
            lifetimeBudget: c.lifetime_budget || null,
          },
          { conflictFields: ['campaignId', 'organisationId'] }
        )
        allCampaigns.push({ id: c.id, adAccountId: accounts[i].id })
      }
    }
    progress.campaigns = allCampaigns.length
    await setState(key, { status: 'running', startedAt, progress })

    if (!allCampaigns.length) {
      await setState(key, { status: 'done', startedAt, finishedAt: new Date().toISOString(), progress })
      return
    }

    // ── Wave 3: Ad sets (one batch request per campaign) ─────────────────────
    const adsetBatchReqs = allCampaigns.map((c) => ({
      method: 'GET',
      relative_url: `${c.id}/adsets?fields=id,name,status,daily_budget,lifetime_budget,optimization_goal&limit=200`,
    }))
    const adsetBatchRes = await metaBatch(adsetBatchReqs, userToken)

    const allAdsets = []
    for (let i = 0; i < allCampaigns.length; i++) {
      const adsets = Array.isArray(adsetBatchRes[i]?.data) ? adsetBatchRes[i].data : []
      for (const s of adsets) {
        await MetaAdSet.upsert(
          {
            organisationId: orgId,
            adSetId: s.id,
            campaignId: allCampaigns[i].id,
            name: s.name,
            status: s.status || null,
            dailyBudget: s.daily_budget || null,
            lifetimeBudget: s.lifetime_budget || null,
            optimizationGoal: s.optimization_goal || null,
          },
          { conflictFields: ['adSetId', 'organisationId'] }
        )
        allAdsets.push({ id: s.id, campaignId: allCampaigns[i].id })
      }
    }
    progress.adsets = allAdsets.length
    await setState(key, { status: 'running', startedAt, progress })

    if (!allAdsets.length) {
      await setState(key, { status: 'done', startedAt, finishedAt: new Date().toISOString(), progress })
      return
    }

    // ── Wave 4: Ads (one batch request per adset) ─────────────────────────────
    const adBatchReqs = allAdsets.map((s) => ({
      method: 'GET',
      relative_url: `${s.id}/ads?fields=id,name,status,creative{id}&limit=200`,
    }))
    const adBatchRes = await metaBatch(adBatchReqs, userToken)

    const creativeIds = new Map() // creativeId → adId
    const allAds = []
    for (let i = 0; i < allAdsets.length; i++) {
      const ads = Array.isArray(adBatchRes[i]?.data) ? adBatchRes[i].data : []
      for (const ad of ads) {
        await MetaAd.upsert(
          {
            organisationId: orgId,
            adId: ad.id,
            adSetId: allAdsets[i].id,
            name: ad.name,
            status: ad.status,
            creativeId: ad.creative?.id || null,
            // imageUrl / body / platform filled in Wave 5
          },
          { conflictFields: ['adId', 'organisationId'] }
        )
        if (ad.creative?.id) creativeIds.set(ad.creative.id, ad.id)
        allAds.push(ad.id)
        progress.ads++
      }
    }
    await setState(key, { status: 'running', startedAt, progress })

    const pickCreativeImage = (creative = {}) => {
      const story = creative?.object_story_spec || {}
      const linkData = story?.link_data || {}
      const videoData = story?.video_data || {}
      const photoData = story?.photo_data || {}
      const templateData = story?.template_data || {}

      return (
        creative?.image_url ||          // full-res image upload — best quality
        videoData?.image_url ||         // full-res video frame
        photoData?.image_url ||         // full-res photo ad image
        photoData?.picture ||
        photoData?.url ||
        templateData?.picture ||
        creative?.thumbnail_url ||      // video thumbnail — quality improved via thumbnail_width/height params
        linkData?.picture ||            // last resort: link preview image (often small/low-res)
        null
      )
    }

    const pickCreativeBody = (creative = {}) => {
      const story = creative?.object_story_spec || {}
      const linkData = story?.link_data || {}
      const videoData = story?.video_data || {}
      const photoData = story?.photo_data || {}
      const templateData = story?.template_data || {}

      return (
        creative?.body ||
        linkData?.message ||
        videoData?.message ||
        photoData?.message ||
        templateData?.message ||
        null
      )
    }

    // ── Wave 5a: Creatives (batch, only for ads that have a creative id) ────────
    if (creativeIds.size) {
      const ids = Array.from(creativeIds.keys())
      const creativeBatchReqs = ids.map((cid) => ({
        method: 'GET',
        // Include effective_object_story_id for boosted posts — those ads have no
        // direct image_url; the image lives on the underlying page post instead.
        // thumbnail_width/height lifts the default low-res video thumbnail to a proper HD frame.
        relative_url: `${cid}?fields=image_url,thumbnail_url,body,instagram_permalink_url,video_id,object_story_spec,effective_object_story_id,effective_instagram_story_id&thumbnail_width=1280&thumbnail_height=720`,
      }))
      const creativeBatchRes = await metaBatch(creativeBatchReqs, userToken)

      // ── Wave 5b: For creatives with no direct image, fetch full_picture from the story post ──
      // Boosted posts / page-post ads store their image on the post, not in the creative spec.
      const storyRequests = []  // batch sub-requests
      const storyMeta = []      // parallel array: { creativeIndex, adId }
      for (let i = 0; i < ids.length; i++) {
        const cr = creativeBatchRes[i]
        if (!cr || pickCreativeImage(cr)) continue
        const storyId = cr.effective_object_story_id || cr.effective_instagram_story_id
        if (storyId) {
          storyRequests.push({ method: 'GET', relative_url: `${storyId}?fields=full_picture` })
          storyMeta.push({ creativeIndex: i, adId: creativeIds.get(ids[i]) })
        } else {
          console.warn(`[MetaSync] No image URL and no story ID for creative ${ids[i]}, adId=${creativeIds.get(ids[i])}. Creative payload:`, JSON.stringify(cr))
        }
      }

      const storyRes = storyRequests.length ? await metaBatch(storyRequests, userToken) : []
      // Map story full_picture back to creative index
      const storyImageByCreativeIndex = new Map()
      for (let j = 0; j < storyMeta.length; j++) {
        storyImageByCreativeIndex.set(storyMeta[j].creativeIndex, storyRes[j]?.full_picture || null)
      }

      // ── Wave 5c: Cache images to S3 and write DB ─────────────────────────────
      for (let i = 0; i < ids.length; i++) {
        const cr = creativeBatchRes[i]
        if (!cr) continue
        const adId = creativeIds.get(ids[i])
        const metaImageUrl = pickCreativeImage(cr) || storyImageByCreativeIndex.get(i) || null

        console.log(`[MetaSync] Creative ${ids[i]} (adId=${adId}): imageUrl=${metaImageUrl || 'NONE'}`)

        const urlExt = (metaImageUrl?.split('?')[0] || '').match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpg'
        // Persist to S3 so the URL never expires; fall back to raw Meta URL if upload fails.
        const cachedImageUrl = metaImageUrl
          ? await downloadUrlToS3({ url: metaImageUrl, filename: `${orgId}-${adId}.${urlExt}`, baseDir: 'meta-creatives' })
          : null
        if (metaImageUrl && !cachedImageUrl) {
          console.warn(`[MetaSync] S3 cache failed for adId=${adId}, storing raw Meta URL as fallback`)
        }

        await MetaAd.update(
          {
            imageUrl: cachedImageUrl || metaImageUrl || null,
            videoId: cr.video_id || cr?.object_story_spec?.video_data?.video_id || null,
            body: pickCreativeBody(cr),
            platform: cr.instagram_permalink_url ? 'Instagram' : 'Facebook',
          },
          { where: { adId, organisationId: orgId } }
        )
      }
    }

    await setState(key, { status: 'done', startedAt, finishedAt: new Date().toISOString(), progress })
    console.log(`[MetaSync] Structure sync complete for org ${orgId}`, progress)
  } catch (e) {
    const errMsg = e?.data?.error?.message || e?.message || 'Sync failed'
    console.error(`[MetaSync] Structure sync failed for org ${orgId}:`, errMsg)
    await setState(key, {
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      error: errMsg,
      progress,
    })
  }
}

// ─── Insights sync ────────────────────────────────────────────────────────────

/**
 * Insights sync: fetches impressions/clicks/spend for each campaign, adset,
 * and ad using batch API instead of sequential calls.
 *
 * @param {string|number} orgId
 * @param {number} days  how many days of history to fetch (default 1)
 */
export const runInsightsSync = async (orgId, days = 1) => {
  const key = KEYS.insights(orgId)

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) {
    await setState(key, { status: 'failed', error: 'Meta not connected', finishedAt: new Date().toISOString() })
    return
  }

  const userToken = decrypt(tokenRow.userTokenEnc)
  if (!userToken) {
    await setState(key, { status: 'failed', error: 'Meta token missing', finishedAt: new Date().toISOString() })
    return
  }

  const startedAt = new Date().toISOString()
  await setState(key, { status: 'running', startedAt })

  const until = new Date().toISOString().slice(0, 10)
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const insightFields =
    'impressions,clicks,spend,actions,ctr,cpc,cpm,reach,frequency,purchase_roas'
  const timeParams = `time_range[since]=${since}&time_range[until]=${until}&time_increment=1`

  // Collects insight rows for a single entity and upserts them.
  // Uses conflictFields so ON CONFLICT targets (organisationId, entityType, entityId, date)
  // instead of the autoincrement PK — this prevents a new row being inserted on every sync.
  const upsertInsights = async (entityType, entityId, rows) => {
    if (!rows.length) return
    const records = rows.map((insight) => ({
      organisationId: orgId,
      entityType,
      entityId,
      date: insight.date_start,
      impressions: Number(insight.impressions) || 0,
      clicks: Number(insight.clicks) || 0,
      spend: Math.round(Number(insight.spend || 0) * 100),
      leads: Number(insight.actions?.find((a) => a.action_type === 'lead')?.value) || 0,
      linkClicks: Number(insight.actions?.find((a) => a.action_type === 'link_click')?.value) || 0,
      reach: Number(insight.reach) || 0,
      frequency: Number(insight.frequency) || 0,
      purchase_roas: Number(insight.purchase_roas?.[0]?.value) || 0,
      cpc: insight.cpc != null ? Number(insight.cpc) : null,
      ctr: insight.ctr != null ? Number(insight.ctr) : null,
      cpm: insight.cpm != null ? Number(insight.cpm) : null,
    }))
    for (const record of records) {
      await MetaInsight.upsert(record, {
        conflictFields: ['organisationId', 'entityType', 'entityId', 'date'],
      })
    }
  }

  try {
    // ── Campaigns ─────────────────────────────────────────────────────────────
    const campaigns = await MetaCampaign.findAll({ where: { organisationId: orgId } })
    if (campaigns.length) {
      const reqs = campaigns.map((c) => ({
        method: 'GET',
        relative_url: `${c.campaignId}/insights?fields=${insightFields}&${timeParams}`,
      }))
      const results = await metaBatch(reqs, userToken)
      for (let i = 0; i < campaigns.length; i++) {
        const rows = Array.isArray(results[i]?.data) ? results[i].data : []
        await upsertInsights('campaign', campaigns[i].campaignId, rows)
      }
    }

    // ── Ad sets ───────────────────────────────────────────────────────────────
    const adSets = await MetaAdSet.findAll({ where: { organisationId: orgId } })
    if (adSets.length) {
      const reqs = adSets.map((s) => ({
        method: 'GET',
        relative_url: `${s.adSetId}/insights?fields=${insightFields}&${timeParams}`,
      }))
      const results = await metaBatch(reqs, userToken)
      for (let i = 0; i < adSets.length; i++) {
        const rows = Array.isArray(results[i]?.data) ? results[i].data : []
        await upsertInsights('adset', adSets[i].adSetId, rows)
      }
    }

    // ── Ads ───────────────────────────────────────────────────────────────────
    const ads = await MetaAd.findAll({ where: { organisationId: orgId } })
    if (ads.length) {
      const reqs = ads.map((a) => ({
        method: 'GET',
        relative_url: `${a.adId}/insights?fields=${insightFields}&${timeParams}`,
      }))
      const results = await metaBatch(reqs, userToken)
      for (let i = 0; i < ads.length; i++) {
        const rows = Array.isArray(results[i]?.data) ? results[i].data : []
        await upsertInsights('ad', ads[i].adId, rows)
      }
    }

    // ── Lifetime reach pass ───────────────────────────────────────────────────
    // Reach is not additive across days — we must query with time_increment=lifetime
    // to get the true deduplicated reach for the sync window, matching Ads Manager.
    const lifetimeTimeParams = `time_range[since]=${since}&time_range[until]=${until}`

    const allEntities = [
      ...campaigns.map((c) => ({ type: 'campaign', id: c.campaignId })),
      ...adSets.map((s) => ({ type: 'adset', id: s.adSetId })),
      ...ads.map((a) => ({ type: 'ad', id: a.adId })),
    ]

    if (allEntities.length) {
      const lifetimeReqs = allEntities.map((e) => ({
        method: 'GET',
        relative_url: `${e.id}/insights?fields=reach&${lifetimeTimeParams}`,
      }))
      const lifetimeResults = await metaBatch(lifetimeReqs, userToken)

      for (let i = 0; i < allEntities.length; i++) {
        const rows = Array.isArray(lifetimeResults[i]?.data) ? lifetimeResults[i].data : []
        const lifetimeReach = rows.length > 0 ? Number(rows[0]?.reach || 0) : null
        if (lifetimeReach === null) continue
        await MetaInsight.update(
          { lifetimeReach },
          { where: { organisationId: orgId, entityType: allEntities[i].type, entityId: allEntities[i].id } }
        )
      }
    }

    await setState(key, {
      status: 'done',
      startedAt,
      finishedAt: new Date().toISOString(),
      since,
      until,
    })
    console.log(`[MetaSync] Insights sync complete for org ${orgId} (${since} → ${until})`)
  } catch (e) {
    const errMsg = e?.data?.error?.message || e?.message || 'Insights sync failed'
    console.error(`[MetaSync] Insights sync failed for org ${orgId}:`, errMsg)
    await setState(key, {
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      error: errMsg,
    })
  }
}

// ─── Job enqueuers ────────────────────────────────────────────────────────────

/**
 * Enqueue a structure sync for orgId.
 * Returns immediately; sync runs in the background.
 * If a sync is already running, does nothing.
 */
export const enqueueStructureSync = async (orgId) => {
  const current = await getState(KEYS.structure(orgId))
  if (current?.status === 'running') return { queued: false, reason: 'already_running' }

  await setState(KEYS.structure(orgId), {
    status: 'pending',
    queuedAt: new Date().toISOString(),
    progress: null,
  })

  setImmediate(() =>
    runStructureSync(orgId).catch((e) => console.error('[MetaSync] Unhandled structure sync error:', e))
  )

  return { queued: true }
}

/**
 * Enqueue an insights sync for orgId.
 * Returns immediately; sync runs in the background.
 */
export const enqueueInsightsSync = async (orgId, days = 1) => {
  const current = await getState(KEYS.insights(orgId))
  if (current?.status === 'running') return { queued: false, reason: 'already_running' }

  await setState(KEYS.insights(orgId), {
    status: 'pending',
    queuedAt: new Date().toISOString(),
  })

  setImmediate(() =>
    runInsightsSync(orgId, days).catch((e) => console.error('[MetaSync] Unhandled insights sync error:', e))
  )

  return { queued: true }
}
