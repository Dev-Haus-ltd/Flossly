import { CrmLead, MetaPage, Organisation, User } from '../models'
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

  // Exchange code -> short lived token
  const tokenUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(
    appSecret
  )}&code=${encodeURIComponent(code)}`
  const shortResp = await $fetch(tokenUrl, { method: 'GET' })
  const shortToken = shortResp.access_token
  if (!shortToken) return error(500, 'Failed to get access token')

  // Exchange to long-lived user token
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

// Webhook verification (GET) and receiver (POST)
export const webhook = async (event) => {
  const config = useRuntimeConfig()
  if (getMethod(event) === 'GET') {
    const q = getQuery(event)
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === config.META_VERIFY_TOKEN) {
      return send(event, q['hub.challenge'] || '')
    }
    return error(403, 'Verification failed')
  }
  if (getMethod(event) === 'POST') {
    const body = await readBody(event)
    // Typically, handle leadgen events here; for now just acknowledge
    return success({ received: true })
  }
  return success('ok')
}
