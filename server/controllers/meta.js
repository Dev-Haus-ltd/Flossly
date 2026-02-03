import { Op, fn, col } from 'sequelize'
import { CrmLead, MetaPage, Organisation, User, MetaUserToken, MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight } from '../models'
import { encrypt, decrypt } from '../utils/crypto'
import { success, error } from '../utils/response'
import { addMetaClient, broadcastMetaEvent } from '../utils/metaStream'

const META_VERSION = 'v24.0'

const getRedirectUri = (config) => {
  return (
    config.META_REDIRECT_URI ||
    (config.public?.BASE_URL ? `${config.public.BASE_URL}/api/meta/callback` : '')
  )
}

export const authStart = async (event) => {
  const config = useRuntimeConfig()
  const appId = config.META_APP_ID
  const redirectUri = getRedirectUri(config)
  if (!appId || !redirectUri) return error(400, 'Meta App not configured')

  // ✅ FIX: Get user context BEFORE starting OAuth
  const { userId, orgId } = event.context.user || {}
  if (!userId || !orgId) {
    return error(401, 'User must be logged in to connect Meta')
  }

  // ✅ FIX: Include user context in state
  const stateData = {
    csrf: Math.random().toString(36).slice(2),
    userId,
    orgId,
    timestamp: Date.now()
  }
  const stateToken = Buffer.from(JSON.stringify(stateData)).toString('base64url')
  
  // Store state in cookie for verification
  setCookie(event, 'meta_oauth_state', stateToken, { 
    httpOnly: true, 
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    secure: process.env.NODE_ENV === 'production'
  })

  const scope = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'leads_retrieval',
  ].join(',')

  // ✅ FIX: Add auth_type=rerequest to force fresh login
  const url = `https://www.facebook.com/${META_VERSION}/dialog/oauth?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scope
  )}&state=${encodeURIComponent(stateToken)}&auth_type=rerequest&display=popup`
  
  return success({ url })
}

export const authCallback = async (event) => {
  const config = useRuntimeConfig()
  const appId = config.META_APP_ID
  const appSecret = config.META_APP_SECRET
  const redirectUri = getRedirectUri(config)
  if (!appId || !appSecret || !redirectUri) return error(400, 'Meta App not configured')

  const q = getQuery(event)
  const { code, state, error: oauthError, error_description } = q
  
  // ✅ FIX: Handle OAuth errors gracefully
  if (oauthError) {
    console.error('[META][AUTH] OAuth error:', oauthError, error_description)
    return sendRedirect(event, `/crm?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) return error(400, 'Missing authorization code')
  
  const stateCookie = getCookie(event, 'meta_oauth_state')
  if (!state || !stateCookie || state !== stateCookie) {
    return error(401, 'Invalid state - CSRF check failed')
  }

  // ✅ FIX: Extract user context from state
  let userId, orgId
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = stateData.userId
    orgId = stateData.orgId
    
    // Check timestamp (prevent replay attacks)
    if (Date.now() - stateData.timestamp > 600000) { // 10 minutes
      throw new Error('State expired')
    }
  } catch (e) {
    console.error('[META][AUTH] Invalid state data:', e)
    return error(401, 'Invalid state data')
  }

  if (!userId || !orgId) {
    return error(401, 'Missing user context in state')
  }

  try {
    // Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${encodeURIComponent(
      appId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(
      appSecret
    )}&code=${encodeURIComponent(code)}`
    
    const shortResp = await $fetch(tokenUrl, { method: 'GET' })
    const shortToken = shortResp.access_token
    if (!shortToken) return error(500, 'Failed to get access token')

    // Exchange for long-lived token
    const longUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      appId
    )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortToken)}`
    
    const longResp = await $fetch(longUrl, { method: 'GET' })
    const userToken = longResp.access_token || shortToken

    // Fetch user info to verify token
    const meUrl = `https://graph.facebook.com/${META_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(userToken)}`
    const meResp = await $fetch(meUrl, { method: 'GET' })
    const fbUserId = meResp.id
    const fbUserName = meResp.name

    console.log(`[META][AUTH] Connected Facebook user: ${fbUserName} (${fbUserId})`)

    // Fetch pages with page access tokens
    const pagesUrl = `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`
    const pagesResp = await $fetch(pagesUrl, { method: 'GET' })
    const pages = Array.isArray(pagesResp?.data) ? pagesResp.data : []

    // Ensure tables exist
    try { 
      await MetaPage.sync()
      await CrmLead.sync()
      await MetaUserToken.sync()
    } catch (e) {
      console.error('[META][AUTH] Table sync error:', e)
    }

    // Enforce one active org per page to avoid lead routing ambiguity
    const pageIds = pages.map((p) => p?.id).filter(Boolean)
    if (pageIds.length) {
      const conflicts = await MetaPage.findAll({
        where: {
          pageId: { [Op.in]: pageIds },
          organisationId: { [Op.ne]: orgId },
          status: 'Active',
        },
      })
      if (conflicts.length) {
        const names = conflicts.map((c) => c.pageName || c.pageId).join(', ')
        setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
        return sendRedirect(
          event,
          `/crm?error=${encodeURIComponent(
            `Meta connection failed. The following page(s) are already connected to another organisation: ${names}`
          )}`
        )
      }
    }
    // ✅ FIX: Store user token with Facebook user ID for tracking
    const encUser = encrypt(userToken)
    const expiresIn = Number(longResp?.expires_in || 0)
    const expiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
    
    const existingUserTok = await MetaUserToken.findOne({ 
      where: { organisationId: orgId, userId } 
    })
    
    if (existingUserTok) {
      existingUserTok.userTokenEnc = encUser
      existingUserTok.expiresAt = expiry
      existingUserTok.fbUserId = fbUserId
      existingUserTok.fbUserName = fbUserName
      await existingUserTok.save()
    } else {
      await MetaUserToken.create({ 
        organisationId: orgId, 
        userId, 
        userTokenEnc: encUser, 
        expiresAt: expiry,
        fbUserId,
        fbUserName
      })
    }

    // Upsert pages
    for (const p of pages) {
      if (!p?.id || !p?.access_token) continue
      
      const existing = await MetaPage.findOne({ 
        where: { organisationId: orgId, pageId: p.id } 
      })
      
      const enc = encrypt(p.access_token)
      
      if (existing) {
        existing.pageName = p.name || existing.pageName
        existing.accessTokenEnc = enc
        existing.status = 'Active'
        existing.connectedAt = new Date()
        existing.userId = userId // Update user who connected
        await existing.save()
      } else {
        await MetaPage.create({
          organisationId: orgId,
          userId,
          pageId: p.id,
          pageName: p.name || null,
          accessTokenEnc: enc,
          status: 'Active',
        })
      }
    }

    // Auto-subscribe pages to leadgen webhooks
    for (const p of pages) {
      if (!p?.id || !p?.access_token) continue
      try {
        const subscribeUrl = `https://graph.facebook.com/${META_VERSION}/${p.id}/subscribed_apps`
        await $fetch(subscribeUrl, {
          method: 'POST',
          body: new URLSearchParams({ 
            subscribed_fields: 'leadgen', 
            access_token: p.access_token 
          }).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      } catch (e) {
        console.error(`[META][AUTH] Failed to subscribe page ${p.id}:`, e)
      }
    }

    // Clear state cookie
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    
    // ✅ FIX: Better success redirect with details
    return sendRedirect(event, `/crm?meta=connected&pages=${pages.length}&user=${encodeURIComponent(fbUserName)}`)

  } catch (e) {
    console.error('[META][AUTH] Callback error:', e)
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    const errorMsg = e?.data?.error?.message || e?.message || 'Connection failed'
    return sendRedirect(event, `/crm?error=${encodeURIComponent(errorMsg)}`)
  }
}

// ✅ NEW: Add disconnect endpoint to cleanly remove connections
export const disconnect = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  try {
    // Remove all user tokens for the org
    await MetaUserToken.destroy({ where: { organisationId: orgId } })
    
    // Deactivate pages for the org
    await MetaPage.update(
      { status: 'Revoked' },
      { where: { organisationId: orgId } }
    )

    return success({ disconnected: true })
  } catch (e) {
    return error(500, 'Failed to disconnect')
  }
}

// Rest of your functions remain the same...
export const listLeads = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  const rows = await CrmLead.findAll({ 
    where: { organisationId: orgId }, 
    order: [['createdAt', 'DESC']], 
    limit: 500 
  })
  const mapped = rows.map((r) => ({
    id: r.id,
    alert: '',
    name: r.name || '',
    email: r.email || '',
    telephone: r.telephone || '',
    inquiryDate: r.inquiryDate ? new Date(r.inquiryDate).toISOString().slice(0, 10) : '',
    leadSource: { id: 99, name: r.leadSource || 'Meta Leadgen' },
    leadStatus: r.leadStatus || 'New',
    treatment: { id: null, name: '' },
    assigned: [],
    followUpDate: '',
    comments: '',
  }))
  return success(mapped)
}

export const fetchLeadsNow = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  try { await CrmLead.sync() } catch (_) {}
  
  const pages = await MetaPage.findAll({ 
    where: { organisationId: orgId, status: 'Active' } 
  })
  
  let imported = 0
  for (const mp of pages) {
    const pageId = mp.pageId
    const pageToken = decrypt(mp.accessTokenEnc)
    if (!pageToken) continue

    try {
      const formsUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}/leadgen_forms?fields=id,name&access_token=${encodeURIComponent(pageToken)}`
      const formsResp = await $fetch(formsUrl, { method: 'GET' })
      const forms = Array.isArray(formsResp?.data) ? formsResp.data : []
      
      for (const form of forms) {
        const leadsUrl = `https://graph.facebook.com/${META_VERSION}/${form.id}/leads?fields=created_time,field_data,ad_id,adset_id,campaign_id&limit=100&access_token=${encodeURIComponent(pageToken)}`
        const leadsResp = await $fetch(leadsUrl, { method: 'GET' })
        const items = Array.isArray(leadsResp?.data) ? leadsResp.data : []
        
        for (const le of items) {
          const fld = (le.field_data || []).reduce((acc, f) => {
            acc[f.name] = Array.isArray(f.values) ? f.values[0] : f.values
            return acc
          }, {})
          
          const fullName = fld.full_name || fld.name || ''
          const email = fld.email || fld.email_address || ''
          const phone = fld.phone_number || fld.phone || ''
          const on = new Date(le.created_time)
          const campaignId = le.campaign_id || null
          const adSetId = le.adset_id || null
          const adId = le.ad_id || null
          
          const existing = await CrmLead.findOne({ 
            where: { organisationId: orgId, leadId: le.id } 
          })
          
          if (existing) {
            existing.name = existing.name || fullName
            existing.email = existing.email || email
            existing.telephone = existing.telephone || phone
            existing.inquiryDate = existing.inquiryDate || on
            existing.rawData = existing.rawData || le
            existing.campaignId = existing.campaignId || campaignId
            existing.adSetId = existing.adSetId || adSetId
            existing.adId = existing.adId || adId
            await existing.save()
            broadcastMetaEvent('lead', { orgId, leadId: le.id, pageId, formId: form.id })
          } else {
            await CrmLead.create({
              organisationId: orgId,
              pageId,
              formId: form.id,
              leadId: le.id,
              campaignId,
              adSetId,
              adId,
              name: fullName,
              email,
              telephone: phone,
              inquiryDate: on,
              rawData: le,
              leadSource: 'Meta Leadgen',
              leadStatus: 'New',
            })
            imported++
            broadcastMetaEvent('lead', { orgId, leadId: le.id, pageId, formId: form.id })
          }
        }
      }
    } catch (e) {
      console.error(`[META] Error fetching leads for page ${pageId}:`, e)
    }
  }
  return success({ imported })
}


export const subscribePages = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  
  const pages = await MetaPage.findAll({ 
    where: { organisationId: orgId, status: 'Active' } 
  })
  
  let subscribed = 0
  for (const mp of pages) {
    const pageToken = decrypt(mp.accessTokenEnc)
    if (!pageToken) continue
    
    const url = `https://graph.facebook.com/${META_VERSION}/${mp.pageId}/subscribed_apps`
    try {
      await $fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ 
          subscribed_fields: 'leadgen', 
          access_token: pageToken 
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      subscribed++
    } catch (e) {
      console.error(`[META] Failed to subscribe page ${mp.pageId}:`, e)
    }
  }
  return success({ subscribed })
}

export const connectionStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  
  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  const count = pages.filter(p => p.status === 'Active').length
  const lastConnectedAt = pages.reduce((acc, p) => {
    const t = p.connectedAt || p.updatedAt || p.createdAt
    return !acc || (t && t > acc) ? t : acc
  }, null)
  
  const data = pages.map((p) => ({ 
    id: p.pageId, 
    name: p.pageName, 
    status: p.status 
  }))
  
  return success({ count, lastConnectedAt, pages: data })
}

export const stream = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const res = event.node.res
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write(`event: ready\ndata: "ok"\n\n`)

  const cleanup = addMetaClient(res, orgId)
  event.node.req.on('close', () => {
    cleanup()
  })

  return new Promise(() => {})
}

export const healthCheck = async (event) => {
  const config = useRuntimeConfig()
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const appId = config.META_APP_ID
  const verifyTokenSet = Boolean(config.META_VERIFY_TOKEN)

  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  const pageIds = pages.map((p) => p.pageId).filter(Boolean)
  const leadStatsByPage = new Map()
  if (pageIds.length) {
    const leadStats = await CrmLead.findAll({
      attributes: [
        'pageId',
        [fn('COUNT', col('id')), 'leadCount'],
        [fn('MAX', col('inquiryDate')), 'lastLeadAt'],
        [fn('MAX', col('createdAt')), 'lastCreatedAt'],
      ],
      where: { organisationId: orgId, pageId: { [Op.in]: pageIds } },
      group: ['pageId'],
      raw: true,
    })
    leadStats.forEach((row) => {
      const pageId = String(row.pageId || '')
      if (!pageId) return
      const lastLeadAt = row.lastLeadAt || row.lastCreatedAt || null
      leadStatsByPage.set(pageId, {
        leadCount: Number(row.leadCount || 0),
        lastLeadAt,
      })
    })
  }
  const results = []

  for (const page of pages) {
    const pageId = page.pageId
    const pageName = page.pageName
    const status = page.status
    const token = decrypt(page.accessTokenEnc)
    const tokenPresent = Boolean(token)

    let subscribed = false
    let appMatched = false
    let errorMsg = null

    if (tokenPresent && appId) {
      try {
        const url = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(token)}`
        const resp = await $fetch(url, { method: 'GET' })
        const data = Array.isArray(resp?.data) ? resp.data : []
        subscribed = data.length > 0
        appMatched = data.some((a) => String(a.id) === String(appId))
      } catch (e) {
        errorMsg = e?.data?.error?.message || e?.message || 'Failed to check subscription'
      }
    }

    results.push({
      pageId,
      pageName,
      status,
      tokenPresent,
      subscribed,
      appMatched,
      leadCount: leadStatsByPage.get(String(pageId))?.leadCount || 0,
      lastLeadAt: leadStatsByPage.get(String(pageId))?.lastLeadAt || null,
      error: errorMsg,
    })
  }

  return success({
    appId: appId || null,
    verifyTokenSet,
    totalPages: pages.length,
    activePages: pages.filter((p) => p.status === 'Active').length,
    pages: results,
  })
}

export const webhook = async (event) => {
  const config = useRuntimeConfig()
  
  if (getMethod(event) === 'HEAD') {
    console.log('[META][WEBHOOK][HEAD] ping')
    return send(event, 'ok')
  }
  
  if (getMethod(event) === 'GET') {
    const q = getQuery(event)
    const verifyToken = String(q['hub.verify_token'] || '').trim()
    const expectedToken = String(
      config.META_VERIFY_TOKEN ||
      process.env.META_VERIFY_TOKEN ||
      process.env.NUXT_META_VERIFY_TOKEN ||
      ''
    ).trim()
    console.log('[META][WEBHOOK][VERIFY]', {
      mode: q['hub.mode'],
      hasToken: Boolean(verifyToken),
    })
    
    if (q['hub.mode'] === 'subscribe' && verifyToken && verifyToken === expectedToken) {
      return send(event, q['hub.challenge'] || '')
    }
    return error(403, 'Verification failed')
  }
  
  if (getMethod(event) === 'POST') {
    const body = await readBody(event)
    console.log('[META][WEBHOOK][EVENT]', JSON.stringify(body)?.slice(0, 500))
    
    try {
      const entries = Array.isArray(body?.entry) ? body.entry : []
      for (const entry of entries) {
        const pageId = String(entry.id || '')
        const changes = Array.isArray(entry.changes) ? entry.changes : []
        
        for (const ch of changes) {
          if (ch.field !== 'leadgen') continue
          
          const v = ch.value || {}
          const leadId = v.leadgen_id || v.lead_id || v.leadId
          const formId = v.form_id || v.formId
          
          if (!leadId || !pageId) continue
          
          const mp = await MetaPage.findOne({ 
            where: { pageId, status: 'Active' } 
          })
          if (!mp) continue
          
          const pageToken = decrypt(mp.accessTokenEnc)
          if (!pageToken) continue
          
          const url = `https://graph.facebook.com/${META_VERSION}/${leadId}?fields=created_time,field_data,ad_id,adset_id,campaign_id&access_token=${encodeURIComponent(pageToken)}`
          const leadData = await $fetch(url, { method: 'GET' })
          
          const fld = (leadData?.field_data || []).reduce((acc, f) => {
            acc[f.name] = Array.isArray(f.values) ? f.values[0] : f.values
            return acc
          }, {})
          
          const fullName = fld.full_name || fld.name || ''
          const email = fld.email || fld.email_address || ''
          const phone = fld.phone_number || fld.phone || ''
          const on = leadData?.created_time ? new Date(leadData.created_time) : new Date()
          const campaignId = leadData.campaign_id || null
          const adSetId = leadData.adset_id || null
          const adId = leadData.ad_id || null

          const existing = await CrmLead.findOne({ where: { leadId } })
          if (existing) {
            existing.name = existing.name || fullName
            existing.email = existing.email || email
            existing.telephone = existing.telephone || phone
            existing.inquiryDate = existing.inquiryDate || on
            existing.rawData = existing.rawData || leadData
            existing.campaignId = existing.campaignId || campaignId
            existing.adSetId = existing.adSetId || adSetId
            existing.adId = existing.adId || adId
            await existing.save()
            broadcastMetaEvent('lead', { orgId: mp.organisationId, leadId, pageId, formId })
          } else {
            await CrmLead.create({
              organisationId: mp.organisationId,
              pageId,
              formId: formId || null,
              leadId,
              campaignId,
              adSetId,
              adId,
              name: fullName,
              email,
              telephone: phone,
              inquiryDate: on,
              rawData: leadData,
              leadSource: 'Meta Leadgen',
              leadStatus: 'New',
            })
            broadcastMetaEvent('lead', { orgId: mp.organisationId, leadId, pageId, formId })
          }
        }
      }
    } catch (e) {
      console.error('[META][WEBHOOK] Processing error:', e)
    }
    
    return success({ received: true })
  }
  
  return success('ok')
}

export const fetchMetaStructureAndBudgets = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) return error(400, 'Meta not connected')

  const userToken = decrypt(tokenRow.userTokenEnc)

  // 1️⃣ Fetch ad accounts
  const adAccountsResp = await $fetch(
    `https://graph.facebook.com/${META_VERSION}/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${userToken}`
  )

  for (const acc of adAccountsResp.data || []) {
    await MetaAdAccount.upsert({
      organisationId: orgId,
      adAccountId: acc.id,
      name: acc.name,
      currency: acc.currency,
      timezone: acc.timezone_name,
    })

    // 2️⃣ Campaigns
    const campaignsResp = await $fetch(
      `https://graph.facebook.com/${META_VERSION}/${acc.id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${userToken}`
    )

    for (const c of campaignsResp.data || []) {
      await MetaCampaign.upsert({
        organisationId: orgId,
        adAccountId: acc.id,
        campaignId: c.id,
        name: c.name,
        status: c.status,
        dailyBudget: c.daily_budget || null,
        lifetimeBudget: c.lifetime_budget || null,
      })

      // 3️⃣ Ad Sets
      const adSetsResp = await $fetch(
        `https://graph.facebook.com/${META_VERSION}/${c.id}/adsets?fields=id,name,daily_budget,lifetime_budget,optimization_goal&access_token=${userToken}`
      )

      for (const s of adSetsResp.data || []) {
        await MetaAdSet.upsert({
          organisationId: orgId,
          adSetId: s.id,
          campaignId: c.id,
          name: s.name,
          dailyBudget: s.daily_budget || null,
          lifetimeBudget: s.lifetime_budget || null,
          optimizationGoal: s.optimization_goal || null,
        })

        // 4️⃣ Ads
        const adsResp = await $fetch(
          `https://graph.facebook.com/${META_VERSION}/${s.id}/ads?fields=id,name,status,creative{id}&access_token=${userToken}`
        )

        for (const ad of adsResp.data || []) {
          await MetaAd.upsert({
            organisationId: orgId,
            adId: ad.id,
            adSetId: s.id,
            name: ad.name,
            status: ad.status,
            creativeId: ad.creative?.id || null,
          })
        }
      }
    }
  }

  return success({ synced: true })
}


export const fetchDailyMetaInsights = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) return error(400, 'Meta not connected')

  const token = decrypt(tokenRow.userTokenEnc)

  const date =
    event.context?.date ||
    new Date(Date.now() - 86400000).toISOString().slice(0, 10) // yesterday

  const fetchInsights = async (entityType, entityId) => {
    const url = `https://graph.facebook.com/${META_VERSION}/${entityId}/insights?fields=impressions,clicks,spend,actions,ctr,cpc,cpm&time_range[since]=${date}&time_range[until]=${date}&access_token=${token}`
    const resp = await $fetch(url)
    return resp.data?.[0]
  }

  // Campaigns
  const campaigns = await MetaCampaign.findAll({ where: { organisationId: orgId } })
  for (const c of campaigns) {
    const i = await fetchInsights('campaign', c.campaignId)
    if (!i) continue

    await MetaInsight.upsert({
      organisationId: orgId,
      entityType: 'campaign',
      entityId: c.campaignId,
      date,
      impressions: i.impressions,
      clicks: i.clicks,
      spend: Math.round(Number(i.spend || 0) * 100),
      leads: i.actions?.find(a => a.action_type === 'lead')?.value || 0,
      cpc: i.cpc,
      ctr: i.ctr,
      cpm: i.cpm,
    })
  }

  // Ad sets
  const adSets = await MetaAdSet.findAll({ where: { organisationId: orgId } })
  for (const s of adSets) {
    const i = await fetchInsights('adset', s.adSetId)
    if (!i) continue

    await MetaInsight.upsert({
      organisationId: orgId,
      entityType: 'adset',
      entityId: s.adSetId,
      date,
      impressions: i.impressions,
      clicks: i.clicks,
      spend: Math.round(Number(i.spend || 0) * 100),
      leads: i.actions?.find(a => a.action_type === 'lead')?.value || 0,
      cpc: i.cpc,
      ctr: i.ctr,
      cpm: i.cpm,
    })
  }

  // Ads
  const ads = await MetaAd.findAll({ where: { organisationId: orgId } })
  for (const a of ads) {
    const i = await fetchInsights('ad', a.adId)
    if (!i) continue

    await MetaInsight.upsert({
      organisationId: orgId,
      entityType: 'ad',
      entityId: a.adId,
      date,
      impressions: i.impressions,
      clicks: i.clicks,
      spend: Math.round(Number(i.spend || 0) * 100),
      leads: i.actions?.find(a => a.action_type === 'lead')?.value || 0,
      cpc: i.cpc,
      ctr: i.ctr,
      cpm: i.cpm,
    })
  }

  return success({ date, synced: true })
}