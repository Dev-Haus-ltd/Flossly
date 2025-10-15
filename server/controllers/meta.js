import { CrmLead, MetaPage, Organisation, User, MetaUserToken } from '../models'
import { encrypt, decrypt } from '../utils/crypto'
import { success, error } from '../utils/response'

const META_VERSION = 'v24.0'

const getRedirectUri = (config) => {
  // Prefer explicit META_REDIRECT_URI, else use public BASE_URL + api path
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

  // Simple CSRF state via cookie
  const state = Math.random().toString(36).slice(2)
  setCookie(event, 'meta_oauth_state', state, { httpOnly: true, sameSite: 'lax' })

  const scope = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'leads_retrieval',
    'ads_read',
  ].join(',')
  const url = `https://www.facebook.com/${META_VERSION}/dialog/oauth?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scope
  )}&state=${encodeURIComponent(state)}`
  return success({ url })
}

export const authCallback = async (event) => {
  const config = useRuntimeConfig()
  const appId = config.META_APP_ID
  const appSecret = config.META_APP_SECRET
  const redirectUri = getRedirectUri(config)
  if (!appId || !appSecret || !redirectUri) return error(400, 'Meta App not configured')

  const q = getQuery(event)
  const { code, state } = q
  const stateCookie = getCookie(event, 'meta_oauth_state')
  if (!code) return error(400, 'Missing code')
  if (!state || state !== stateCookie) return error(401, 'Invalid state')

  // short lived token
  const tokenUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(
    appSecret
  )}&code=${encodeURIComponent(code)}`
  const shortResp = await $fetch(tokenUrl, { method: 'GET' })
  const shortToken = shortResp.access_token
  if (!shortToken) return error(500, 'Failed to get access token')

  //  long-lived  token
  const longUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
    appId
  )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortToken)}`
  const longResp = await $fetch(longUrl, { method: 'GET' })
  const userToken = longResp.access_token || shortToken

  // Fetch pages with page access tokens
  const pagesUrl = `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
    userToken
  )}`
  const pagesResp = await $fetch(pagesUrl, { method: 'GET' })
  const pages = Array.isArray(pagesResp?.data) ? pagesResp.data : []

  const { userId, orgId } = event.context.user || {}
  // If user context is missing, we still store without user link? Enforce login flow.
  if (!userId || !orgId) {
    // Redirect to login
    return sendRedirect(event, '/login?next=/crm')
  }

  // Ensure tables exist (non-destructive)
  try { await MetaPage.sync(); await CrmLead.sync(); } catch (_) {}

  // Store/refresh the long-lived user token (encrypted)
  try {
    await MetaUserToken.sync()
    const encUser = encrypt(userToken)
    const expiresIn = Number(longResp?.expires_in || 0)
    const expiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
    const existingUserTok = await MetaUserToken.findOne({ where: { organisationId: orgId, userId } })
    if (existingUserTok) {
      existingUserTok.userTokenEnc = encUser
      existingUserTok.expiresAt = expiry
      await existingUserTok.save()
    } else {
      await MetaUserToken.create({ organisationId: orgId, userId, userTokenEnc: encUser, expiresAt: expiry })
    }
  } catch (_) {}

  // Upsert pages
  for (const p of pages) {
    if (!p?.id || !p?.access_token) continue
    const existing = await MetaPage.findOne({ where: { organisationId: orgId, pageId: p.id } })
    const enc = encrypt(p.access_token)
    if (existing) {
      existing.pageName = p.name || existing.pageName
      existing.accessTokenEnc = enc
      existing.status = 'Active'
      existing.connectedAt = new Date()
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

  // Optional: auto subscribe pages to leadgen webhooks
  try {
    for (const p of pages) {
      if (!p?.id || !p?.access_token) continue
      const subscribeUrl = `https://graph.facebook.com/${META_VERSION}/${p.id}/subscribed_apps`;
      await $fetch(subscribeUrl, {
        method: 'POST',
        body: new URLSearchParams({ subscribed_fields: 'leadgen', access_token: p.access_token }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
  } catch (e) {
    // ignore subscription errors; user can retry manually
  }

  // Clear state cookie and redirect to CRM
  setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
  return sendRedirect(event, '/crm?meta=connected')
}

export const listLeads = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  const rows = await CrmLead.findAll({ where: { organisationId: orgId }, order: [['createdAt', 'DESC']], limit: 500 })
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
  const config = useRuntimeConfig()
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  try { await CrmLead.sync() } catch (_) {}
  const pages = await MetaPage.findAll({ where: { organisationId: orgId, status: 'Active' } })
  let imported = 0
  for (const mp of pages) {
    const pageId = mp.pageId
    const pageToken = decrypt(mp.accessTokenEnc)
    if (!pageToken) continue

    // Fetch forms on page
    const formsUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}/leadgen_forms?fields=id,name&access_token=${encodeURIComponent(
      pageToken
    )}`
    const formsResp = await $fetch(formsUrl, { method: 'GET' })
    const forms = Array.isArray(formsResp?.data) ? formsResp.data : []
    for (const form of forms) {
      const leadsUrl = `https://graph.facebook.com/${META_VERSION}/${form.id}/leads?fields=created_time,field_data&limit=100&access_token=${encodeURIComponent(
        pageToken
      )}`
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
        // Upsert by leadId
        const existing = await CrmLead.findOne({ where: { organisationId: orgId, leadId: le.id } })
        if (existing) {
          existing.name = existing.name || fullName
          existing.email = existing.email || email
          existing.telephone = existing.telephone || phone
          existing.inquiryDate = existing.inquiryDate || on
          existing.rawData = existing.rawData || le
          await existing.save()
        } else {
          await CrmLead.create({
            organisationId: orgId,
            pageId,
            formId: form.id,
            leadId: le.id,
            name: fullName,
            email,
            telephone: phone,
            inquiryDate: on,
            rawData: le,
            leadSource: 'Meta Leadgen',
            leadStatus: 'New',
          })
          imported++
        }
      }
    }
  }
  return success({ imported })
}

export const subscribePages = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  const pages = await MetaPage.findAll({ where: { organisationId: orgId, status: 'Active' } })
  let subscribed = 0
  for (const mp of pages) {
    const pageToken = decrypt(mp.accessTokenEnc)
    const url = `https://graph.facebook.com/${META_VERSION}/${mp.pageId}/subscribed_apps`
    try {
      await $fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ subscribed_fields: 'leadgen', access_token: pageToken }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      subscribed++
    } catch (_) {}
  }
  return success({ subscribed })
}

export const connectionStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  const count = pages.length
  const lastConnectedAt = pages.reduce((acc, p) => {
    const t = p.connectedAt || p.updatedAt || p.createdAt
    return !acc || (t && t > acc) ? t : acc
  }, null)
  const data = pages.map((p) => ({ id: p.pageId, name: p.pageName, status: p.status }))
  return success({ count, lastConnectedAt, pages: data })
}

const getLongLivedUserToken = async (orgId, userId) => {
  const rec = await MetaUserToken.findOne({ where: { organisationId: orgId, userId } })
  if (!rec) return null
  return decrypt(rec.userTokenEnc)
}

export const adAccounts = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')
  const token = await getLongLivedUserToken(orgId, userId)
  if (!token) return error(400, 'Meta ads not connected')
  const url = `https://graph.facebook.com/${META_VERSION}/me/adaccounts?fields=id,account_status,name,currency,timezone_name&limit=100&access_token=${encodeURIComponent(token)}`
  const resp = await $fetch(url, { method: 'GET' })
  const data = Array.isArray(resp?.data) ? resp.data : []
  return success(data)
}

export const campaigns = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')
  const q = getQuery(event)
  const accountId = q.account_id || q.accountId
  if (!accountId) return error(400, 'Missing account_id')
  const token = await getLongLivedUserToken(orgId, userId)
  if (!token) return error(400, 'Meta ads not connected')
  const act = accountId.startsWith('act_') ? accountId : `act_${accountId}`
  const fields = 'id,name,status,objective,daily_budget,created_time,updated_time'
  const url = `https://graph.facebook.com/${META_VERSION}/${act}/campaigns?effective_status=%5B%22ACTIVE%22,%22PAUSED%22%5D&fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(token)}`
  const resp = await $fetch(url, { method: 'GET' })
  const data = Array.isArray(resp?.data) ? resp.data : []
  return success(data)
}

export const ads = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')
  const q = getQuery(event)
  const accountId = q.account_id || q.accountId
  const campaignId = q.campaign_id || q.campaignId
  const token = await getLongLivedUserToken(orgId, userId)
  if (!token) return error(400, 'Meta ads not connected')
  let url
  const fields = 'id,name,status,adset{id,name},campaign{id,name},created_time,updated_time'
  if (campaignId) {
    url = `https://graph.facebook.com/${META_VERSION}/${campaignId}/ads?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(token)}`
  } else {
    if (!accountId) return error(400, 'Missing account_id or campaign_id')
    const act = accountId.startsWith('act_') ? accountId : `act_${accountId}`
    url = `https://graph.facebook.com/${META_VERSION}/${act}/ads?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(token)}`
  }
  const resp = await $fetch(url, { method: 'GET' })
  const data = Array.isArray(resp?.data) ? resp.data : []
  return success(data)
}

// Webhook verification (GET) and receiver (POST)
export const webhook = async (event) => {
  const config = useRuntimeConfig()
  if (getMethod(event) === 'HEAD') {
    try { console.log('[META][WEBHOOK][HEAD] ping') } catch (_) {}
    return send(event, 'ok')
  }
  if (getMethod(event) === 'GET') {
    const q = getQuery(event)
    try {
      console.log('[META][WEBHOOK][VERIFY][GET]', {
        mode: q['hub.mode'],
        hasToken: Boolean(q['hub.verify_token']),
        challengeLen: (q['hub.challenge'] || '').length,
      })
    } catch (_) {}
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === config.META_VERIFY_TOKEN) {
      return send(event, q['hub.challenge'] || '')
    }
    return error(403, 'Verification failed')
  }
  if (getMethod(event) === 'POST') {
    const body = await readBody(event)
    try {
      const preview = typeof body === 'string' ? body : JSON.stringify(body)
      console.log('[META][WEBHOOK][EVENT][POST]', preview?.slice(0, 2000) || '')
    } catch (_) {}
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
          // Find page token
          const mp = await MetaPage.findOne({ where: { pageId, status: 'Active' } })
          if (!mp) continue
          const pageToken = decrypt(mp.accessTokenEnc)
          if (!pageToken) continue
          // Fetch lead details
          const url = `https://graph.facebook.com/${META_VERSION}/${leadId}?fields=created_time,field_data&access_token=${encodeURIComponent(pageToken)}`
          const leadData = await $fetch(url, { method: 'GET' })
          const fld = (leadData?.field_data || []).reduce((acc, f) => {
            acc[f.name] = Array.isArray(f.values) ? f.values[0] : f.values
            return acc
          }, {})
          const fullName = fld.full_name || fld.name || ''
          const email = fld.email || fld.email_address || ''
          const phone = fld.phone_number || fld.phone || ''
          const on = leadData?.created_time ? new Date(leadData.created_time) : new Date()

          // Upsert by leadId across organisations linked to this page
          const existing = await CrmLead.findOne({ where: { leadId } })
          if (existing) {
            existing.name = existing.name || fullName
            existing.email = existing.email || email
            existing.telephone = existing.telephone || phone
            existing.inquiryDate = existing.inquiryDate || on
            existing.rawData = existing.rawData || leadData
            await existing.save()
          } else {
            await CrmLead.create({
              organisationId: mp.organisationId,
              pageId,
              formId: formId || null,
              leadId,
              name: fullName,
              email,
              telephone: phone,
              inquiryDate: on,
              rawData: leadData,
              leadSource: 'Meta Leadgen',
              leadStatus: 'New',
            })
          }
        }
      }
    } catch (_) {
      // swallow to avoid retries storm; operational logging can be added later
    }
    return success({ received: true })
  }
  return success('ok')
}
