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

import { MetaUserToken, MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight, MetaPage } from '../models/index.js'
import { decrypt } from './crypto.js'
import { getRedisClient } from './redis.js'
import { metaBatch, withRetry } from './metaBatch.js'

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
    const accounts = allowedBusinessIds.size > 0
      ? allAccounts.filter((acc) => acc.business?.id && allowedBusinessIds.has(acc.business.id))
      : allAccounts

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
      relative_url: `${c.id}/adsets?fields=id,name,daily_budget,lifetime_budget,optimization_goal&limit=200`,
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

    // ── Wave 5: Creatives (batch, only for ads that have a creative id) ───────
    if (creativeIds.size) {
      const ids = Array.from(creativeIds.keys())
      const creativeBatchReqs = ids.map((cid) => ({
        method: 'GET',
        relative_url: `${cid}?fields=image_url,thumbnail_url,body,instagram_permalink_url`,
      }))
      const creativeBatchRes = await metaBatch(creativeBatchReqs, userToken)

      for (let i = 0; i < ids.length; i++) {
        const cr = creativeBatchRes[i]
        if (!cr) continue
        const adId = creativeIds.get(ids[i])
        await MetaAd.update(
          {
            imageUrl: cr.image_url || cr.thumbnail_url || null,
            body: cr.body || null,
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
