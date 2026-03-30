import { Op, fn, col } from 'sequelize'
import crypto from 'crypto'
import { CrmLead, MetaPage, Organisation, User, UserOrganisation, MetaUserToken, MetaWhatsAppConfig, MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight, CrmDmAccount, CrmDmConversation, CrmDmMessage } from '../models'
import { encrypt, decrypt } from '../utils/crypto'
import { success, error } from '../utils/response'
import { addMetaClient, broadcastMetaEvent } from '../utils/metaStream'
import { getWhatsAppProviderKey, getWhapiEnvConfig, resolveWhapiConfig } from '../utils/whatsappProvider'
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification'
import { parseJsonBody } from "../utils/body"
import {
  runStructureSync,
  runInsightsSync,
  enqueueStructureSync,
  enqueueInsightsSync,
  getStructureSyncStatus,
  getInsightsSyncStatus,
} from '../utils/metaSync.js'

const META_VERSION = 'v24.0'
const META_SUBSCRIBED_FIELDS = 'leadgen,messages,messaging_postbacks'

const getRedirectUri = (config) => {
  return (
    config.META_REDIRECT_URI ||
    (config.public?.BASE_URL ? `${config.public.BASE_URL}/api/meta/callback` : '')
  )
}

const getIgRedirectUri = (config) => {
  return (
    config.META_IG_REDIRECT_URI ||
    (config.public?.BASE_URL ? `${config.public.BASE_URL}/api/meta/igCallback` : '')
  )
}

const upsertDmAccount = async ({ organisationId, connectedByUserId, platform, accountId, accountName, accessToken, tokenExpiresAt, metadata }) => {
  try { await CrmDmAccount.sync() } catch {}
  const existing = await CrmDmAccount.findOne({
    where: { organisationId, platform, accountId },
  })
  const accessTokenEnc = accessToken ? encrypt(accessToken) : null
  if (existing) {
    existing.accountName = accountName || existing.accountName
    if (accessTokenEnc) existing.accessTokenEnc = accessTokenEnc
    if (tokenExpiresAt !== undefined) existing.tokenExpiresAt = tokenExpiresAt
    existing.status = 'Active'
    if (connectedByUserId) existing.connectedByUserId = connectedByUserId
    if (metadata) existing.metadata = metadata
    await existing.save()
    return existing
  }
  return await CrmDmAccount.create({
    organisationId,
    connectedByUserId: connectedByUserId || null,
    platform,
    accountId,
    accountName: accountName || null,
    accessTokenEnc,
    tokenExpiresAt: tokenExpiresAt || null,
    status: 'Active',
    metadata: metadata || null,
  })
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
    'pages_manage_ads',
    'leads_retrieval',
    'ads_read',
    'business_management',
    'pages_messaging',
    'instagram_basic',
    'instagram_manage_messages',
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
  if (!appId || !appSecret || !redirectUri) {
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Meta App not configured')}`)
  }

  const q = getQuery(event)
  const { code, state, error: oauthError, error_description } = q
  
  // ✅ FIX: Handle OAuth errors gracefully
  if (oauthError) {
    const msg = error_description ? `${oauthError}: ${error_description}` : oauthError
    return sendRedirect(event, `/crm?error=${encodeURIComponent(msg)}`)
  }

  if (!code) return sendRedirect(event, `/crm?error=${encodeURIComponent('Missing authorization code')}`)
  
  const stateCookie = getCookie(event, 'meta_oauth_state')
  if (!state || !stateCookie || state !== stateCookie) {
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Invalid state - CSRF check failed')}`)
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
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Invalid state data')}`)
  }

  if (!userId || !orgId) {
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Missing user context in state')}`)
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

    // Fetch pages with page access tokens
    const pagesUrl = `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`
    const pagesResp = await $fetch(pagesUrl, { method: 'GET' })
    const pages = Array.isArray(pagesResp?.data) ? pagesResp.data : []

    // Ensure tables exist
    try { 
      await MetaPage.sync()
      await CrmLead.sync()
      await MetaUserToken.sync()
    } catch (e) {}

    // Enforce one active org per page to avoid lead routing ambiguity
    const pageIds = pages.map((p) => p?.id).filter(Boolean)
    let conflictsById = new Set()
    let conflictsByPage = new Map()
    if (pageIds.length) {
      const conflicts = await MetaPage.findAll({
        where: {
          pageId: { [Op.in]: pageIds },
          organisationId: { [Op.ne]: orgId },
          status: 'Active',
        },
        include: [{ model: Organisation, as: 'organisation', attributes: ['id', 'name'] }],
      })
      if (conflicts.length) {
        conflictsById = new Set(conflicts.map((c) => String(c.pageId)))
        conflicts.forEach((c) => {
          const orgName = c.organisation?.name || `Org ${c.organisationId}`
          conflictsByPage.set(String(c.pageId), orgName)
        })
      }
    }

    const pagesToConnect = pages.filter(
      (p) => p?.id && p?.access_token && !conflictsById.has(String(p.id))
    )


    if (!pagesToConnect.length) {
      const conflictNames = pages
        .filter((p) => p?.id && conflictsById.has(String(p.id)))
        .map((p) => {
          const orgName = conflictsByPage.get(String(p.id))
          const pageName = p.name || p.id
          return orgName ? `${pageName} (Org: ${orgName})` : pageName
        })
        .join(', ')
      setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
      return sendRedirect(
        event,
        `/crm?error=${encodeURIComponent(
          `Meta connection failed. The following page(s) are already connected to another organisation: ${conflictNames}`
        )}`
      )
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
    for (const p of pagesToConnect) {
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

      await upsertDmAccount({
        organisationId: orgId,
        connectedByUserId: userId,
        platform: 'messenger',
        accountId: String(p.id),
        accountName: p.name || null,
        accessToken: p.access_token,
      })

      let igAccount = p?.instagram_business_account || null
      if (!igAccount?.id) {
        try {
          const pageInfoUrl = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(p.id)}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(p.access_token)}`
          const pageInfo = await $fetch(pageInfoUrl, { method: 'GET' })
          igAccount = pageInfo?.instagram_business_account || null
        } catch {}
      }
      const igAccountId = String(igAccount?.id || '')
      if (igAccountId) {
        await upsertDmAccount({
          organisationId: orgId,
          connectedByUserId: userId,
          platform: 'instagram',
          accountId: igAccountId,
          accountName: igAccount?.username || p.name || null,
          accessToken: p.access_token,
          metadata: {
            pageId: String(p.id),
            igAccountId,
          },
        })
      }
    }

    // Auto-subscribe pages to leadgen + messaging webhooks
    for (const p of pagesToConnect) {
      try {
        const subscribeUrl = `https://graph.facebook.com/${META_VERSION}/${p.id}/subscribed_apps`
        await $fetch(subscribeUrl, {
          method: 'POST',
          body: new URLSearchParams({ 
            subscribed_fields: META_SUBSCRIBED_FIELDS, 
            access_token: p.access_token 
          }).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      } catch (e) {}
    }

    // Backfill last 30 days of leads (non-blocking)
    try {
      await fetchLeadsForOrg(orgId, { days: 30 })
    } catch (e) {}

    // Clear state cookie
    setCookie(event, 'meta_oauth_state', '', { maxAge: -1 })
    
    // ✅ FIX: Better success redirect with details
    return sendRedirect(event, `/crm?meta=connected&pages=${pagesToConnect.length}&user=${encodeURIComponent(fbUserName)}`)

  } catch (e) {
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

    // Remove WhatsApp config for the org
    await MetaWhatsAppConfig.destroy({ where: { organisationId: orgId } })
    
    // Deactivate pages for the org
    await MetaPage.update(
      { status: 'Revoked' },
      { where: { organisationId: orgId } }
    )

    // Deactivate DM accounts for the org
    try {
      await CrmDmAccount.update(
        { status: 'Revoked' },
        { where: { organisationId: orgId } }
      )
    } catch (e) {}

    return success({ disconnected: true })
  } catch (e) {
    return error(500, 'Failed to disconnect')
  }
}

const normalizeWaConfigValue = (value) => {
  const raw = String(value || '').trim()
  return raw || null
}

const resolvePhoneNumberFromWaba = async (accessToken, wabaId) => {
  if (!accessToken || !wabaId) return null
  try {
    const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name`
    const resp = await $fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const list = Array.isArray(resp?.data) ? resp.data : []
    if (!list.length) return null
    return list[0]
  } catch {
    return null
  }
}

const exchangeCodeForAccessToken = async ({ code, redirectUri, appId, appSecret }) => {
  if (!code || !appId || !appSecret) return null
  const url = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${encodeURIComponent(
    appId
  )}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}${
    redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ''
  }`
  const resp = await $fetch(url, { method: 'GET' })
  return resp?.access_token || null
}

export const getWhatsAppConfig = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const provider = getWhatsAppProviderKey()
  if (provider === 'whapi') {
    const whapi = await resolveWhapiConfig(orgId)
    return success({
      provider: 'whapi',
      hasToken: !!whapi?.token,
      supportsTemplates: false,
      requiresTemplateOutside24h: false,
      baseUrl: whapi?.baseUrl || getWhapiEnvConfig().baseUrl,
      channelId: whapi?.channelId || null,
    })
  }

  try { await MetaWhatsAppConfig.sync() } catch {}
  const row = await MetaWhatsAppConfig.findOne({ where: { organisationId: orgId } })
  if (!row) {
    return success({
      provider: 'meta',
      hasToken: false,
      supportsTemplates: true,
      requiresTemplateOutside24h: true,
    })
  }

  return success({
    id: row.id,
    organisationId: row.organisationId,
    userId: row.userId,
    phoneNumberId: row.phoneNumberId,
    wabaId: row.wabaId || null,
    displayPhoneNumber: row.displayPhoneNumber || null,
    verifiedName: row.verifiedName || null,
    hasToken: !!row.accessTokenEnc,
    hasVerifyToken: !!row.verifyTokenEnc,
    tokenExpiresAt: row.tokenExpiresAt || null,
    status: row.status || 'Active',
    provider: 'meta',
    supportsTemplates: true,
    requiresTemplateOutside24h: true,
  })
}

export const saveWhatsAppConfig = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body
  const phoneNumberId = normalizeWaConfigValue(payload?.phoneNumberId)
  const wabaId = normalizeWaConfigValue(payload?.wabaId)
  const displayPhoneNumber = normalizeWaConfigValue(payload?.displayPhoneNumber)
  const verifiedName = normalizeWaConfigValue(payload?.verifiedName)
  const accessToken = normalizeWaConfigValue(payload?.accessToken)
  const verifyToken = normalizeWaConfigValue(payload?.verifyToken)
  const tokenExpiresAt = payload?.tokenExpiresAt ? new Date(payload.tokenExpiresAt) : null

  if (!phoneNumberId) return error(400, 'phoneNumberId required')
  if (!accessToken) return error(400, 'accessToken required')

  try { await MetaWhatsAppConfig.sync() } catch {}

  const encAccessToken = encrypt(accessToken)
  const encVerifyToken = verifyToken ? encrypt(verifyToken) : null
  const existing = await MetaWhatsAppConfig.findOne({ where: { organisationId: orgId } })

  if (existing) {
    existing.phoneNumberId = phoneNumberId
    existing.wabaId = wabaId
    existing.displayPhoneNumber = displayPhoneNumber
    existing.verifiedName = verifiedName
    existing.accessTokenEnc = encAccessToken
    existing.verifyTokenEnc = encVerifyToken
    existing.tokenExpiresAt = tokenExpiresAt
    existing.status = 'Active'
    existing.userId = userId
    existing.connectedByUserId = userId
    await existing.save()
    return success({ updated: true })
  }

  await MetaWhatsAppConfig.create({
    organisationId: Number(orgId),
    userId: Number(userId),
    phoneNumberId,
    wabaId,
    displayPhoneNumber,
    verifiedName,
    accessTokenEnc: encAccessToken,
    verifyTokenEnc: encVerifyToken,
    tokenExpiresAt,
    status: 'Active',
    connectedByUserId: Number(userId),
  })
  return success({ created: true })
}

export const whatsappEmbeddedComplete = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')

  const config = useRuntimeConfig()
  const appId = config.META_APP_ID
  const appSecret = config.META_APP_SECRET
  const redirectUri = getRedirectUri(config)

  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body
  const code = normalizeWaConfigValue(payload?.code)
  const accessToken = normalizeWaConfigValue(payload?.accessToken)
  let token = accessToken

  if (!token && code) {
    token = await exchangeCodeForAccessToken({ code, redirectUri, appId, appSecret })
  }
  if (!token) return error(400, 'accessToken or code required')

  let phoneNumberId = normalizeWaConfigValue(payload?.phoneNumberId)
  let wabaId = normalizeWaConfigValue(payload?.wabaId)
  let displayPhoneNumber = normalizeWaConfigValue(payload?.displayPhoneNumber)
  let verifiedName = normalizeWaConfigValue(payload?.verifiedName)

  if (!phoneNumberId && wabaId) {
    const phone = await resolvePhoneNumberFromWaba(token, wabaId)
    if (phone?.id) phoneNumberId = String(phone.id)
    if (!displayPhoneNumber && phone?.display_phone_number) displayPhoneNumber = phone.display_phone_number
    if (!verifiedName && phone?.verified_name) verifiedName = phone.verified_name
  }

  if (!phoneNumberId) return error(400, 'phoneNumberId required')

  try { await MetaWhatsAppConfig.sync() } catch {}

  const encAccessToken = encrypt(token)
  const existing = await MetaWhatsAppConfig.findOne({ where: { organisationId: orgId } })
  if (existing) {
    existing.phoneNumberId = phoneNumberId
    existing.wabaId = wabaId
    existing.displayPhoneNumber = displayPhoneNumber
    existing.verifiedName = verifiedName
    existing.accessTokenEnc = encAccessToken
    existing.status = 'Active'
    existing.userId = userId
    existing.connectedByUserId = userId
    await existing.save()
    return success({ updated: true })
  }

  await MetaWhatsAppConfig.create({
    organisationId: Number(orgId),
    userId: Number(userId),
    phoneNumberId,
    wabaId,
    displayPhoneNumber,
    verifiedName,
    accessTokenEnc: encAccessToken,
    status: 'Active',
    connectedByUserId: Number(userId),
  })

  return success({ created: true })
}

export const fetchWhatsAppTemplates = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  try { await MetaWhatsAppConfig.sync() } catch {}
  const row = await MetaWhatsAppConfig.findOne({ where: { organisationId: orgId } })
  if (!row) return error(400, 'WhatsApp is not configured')

  const accessToken = decrypt(row.accessTokenEnc)
  const wabaId = row.wabaId
  if (!accessToken) return error(400, 'WhatsApp token missing')
  if (!wabaId) return error(400, 'wabaId is required to fetch templates')

  const templates = []
  let nextUrl = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(wabaId)}/message_templates?fields=name,language,category,components,status,quality_score,parameter_format&limit=200`
  while (nextUrl) {
    const resp = await $fetch(nextUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = Array.isArray(resp?.data) ? resp.data : []
    templates.push(...data)
    nextUrl = resp?.paging?.next || null
  }

  return success({
    count: templates.length,
    templates,
  })
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

const fetchLeadsForOrg = async (orgId, { days = 0, maxPerForm = 1000, debugEnabled = false } = {}) => {
  if (!orgId) return { ok: false, error: 'Unauthenticated' }
  try { await CrmLead.sync() } catch (_) {}

  const sinceDate = Number.isFinite(days) && days > 0
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    : null

  const pages = await MetaPage.findAll({
    where: { organisationId: orgId, status: 'Active' }
  })
  const debug = {
    orgId: Number(orgId),
    pagesProcessed: 0,
    formsProcessed: 0,
    leadsScanned: 0,
    imported: 0,
    since: sinceDate ? sinceDate.toISOString() : null,
    maxPerForm,
    errors: [],
  }

  let imported = 0
  for (const mp of pages) {
    const pageId = mp.pageId
    const pageToken = decrypt(mp.accessTokenEnc)
    if (!pageToken) continue
    debug.pagesProcessed += 1

    try {
      const formsUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}/leadgen_forms?fields=id,name&access_token=${encodeURIComponent(pageToken)}`
      const formsResp = await $fetch(formsUrl, { method: 'GET' })
      const forms = Array.isArray(formsResp?.data) ? formsResp.data : []

      for (const form of forms) {
        debug.formsProcessed += 1
        const sinceParam = sinceDate ? `&since=${Math.floor(sinceDate.getTime() / 1000)}` : ''
        let leadsUrl = `https://graph.facebook.com/${META_VERSION}/${form.id}/leads?fields=created_time,field_data,ad_id,adset_id,campaign_id&limit=100${sinceParam}&access_token=${encodeURIComponent(pageToken)}`
        let fetchedForForm = 0

        while (leadsUrl && fetchedForForm < maxPerForm) {
          const leadsResp = await $fetch(leadsUrl, { method: 'GET' })
          const items = Array.isArray(leadsResp?.data) ? leadsResp.data : []
          if (!items.length) break

          for (const le of items) {
            debug.leadsScanned += 1
            if (sinceDate) {
              const createdAt = new Date(le.created_time)
              if (!Number.isNaN(createdAt.getTime()) && createdAt < sinceDate) {
                continue
              }
            }
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
              debug.imported += 1
              broadcastMetaEvent('lead', { orgId, leadId: le.id, pageId, formId: form.id })
            }
            fetchedForForm++
            if (fetchedForForm >= maxPerForm) break
          }

          leadsUrl = leadsResp?.paging?.next || null
        }
      }
    } catch (e) {
      debug.errors.push({
        pageId,
        message: e?.data?.error?.message || e?.message || 'Unknown error',
      })
    }
  }

  if (debugEnabled) return { ok: true, debug }

  // Send notification to org users about imported leads
  if (imported > 0) {
    try {
      const orgUsers = await UserOrganisation.findAll({
        where: {
          organisationId: orgId,
          status: 'Active',
        },
        attributes: ['userId'],
      })
      const userIds = [...new Set(orgUsers.map((u) => u.userId).filter(Boolean))]
      if (userIds.length) {
        await sendNotificationToMultipleUsers({
          userIds,
          title: 'Meta Leads Imported',
          body: `${imported} new lead${imported > 1 ? 's were' : ' was'} imported from Meta`,
          type: 'lead_bulk_import',
          referenceType: 'lead',
          data: {
            importedCount: imported,
            leadSource: 'Meta Leadgen',
            url: '/crm',
          },
          priority: 'high',
        })
      }
    } catch (notifyErr) {
      console.warn('[META BULK IMPORT] Lead notification failed', {
        orgId,
        imported,
        error: notifyErr?.message || 'Unknown notification error',
      })
    }
  }

  return { ok: true, imported }
}

export const igAuthStart = async (event) => {
  const config = useRuntimeConfig()
  const appId = config.META_IG_APP_ID || config.META_APP_ID
  const redirectUri = getIgRedirectUri(config)
  if (!appId || !redirectUri) return error(400, 'Instagram App not configured')

  const { userId, orgId } = event.context.user || {}
  if (!userId || !orgId) {
    return error(401, 'User must be logged in to connect Instagram')
  }

  const stateData = {
    csrf: Math.random().toString(36).slice(2),
    userId,
    orgId,
    timestamp: Date.now()
  }
  const stateToken = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  setCookie(event, 'meta_ig_oauth_state', stateToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    secure: process.env.NODE_ENV === 'production'
  })

  const scope = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_show_list',
  ].join(',')

  const url = `https://www.facebook.com/${META_VERSION}/dialog/oauth?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scope
  )}&state=${encodeURIComponent(stateToken)}&auth_type=rerequest&display=popup`

  return success({ url })
}

export const igAuthCallback = async (event) => {
  const config = useRuntimeConfig()
  const appId = config.META_IG_APP_ID || config.META_APP_ID
  const appSecret = config.META_IG_APP_SECRET || config.META_APP_SECRET
  const redirectUri = getIgRedirectUri(config)
  if (!appId || !appSecret || !redirectUri) {
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Instagram App not configured')}`)
  }

  const q = getQuery(event)
  const { code, state, error: oauthError, error_description } = q
  if (oauthError) {
    const msg = error_description ? `${oauthError}: ${error_description}` : oauthError
    return sendRedirect(event, `/crm?error=${encodeURIComponent(msg)}`)
  }
  if (!code) return sendRedirect(event, `/crm?error=${encodeURIComponent('Missing authorization code')}`)

  const stateCookie = getCookie(event, 'meta_ig_oauth_state')
  if (!state || !stateCookie || state !== stateCookie) {
    setCookie(event, 'meta_ig_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Invalid state - CSRF check failed')}`)
  }

  let userId, orgId
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = stateData.userId
    orgId = stateData.orgId
    if (Date.now() - stateData.timestamp > 600000) throw new Error('State expired')
  } catch (e) {
    setCookie(event, 'meta_ig_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Invalid state data')}`)
  }

  if (!userId || !orgId) {
    setCookie(event, 'meta_ig_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?error=${encodeURIComponent('Missing user context in state')}`)
  }

  try {
    const tokenUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${encodeURIComponent(
      appId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(
      appSecret
    )}&code=${encodeURIComponent(code)}`
    const shortResp = await $fetch(tokenUrl, { method: 'GET' })
    const shortToken = shortResp.access_token
    if (!shortToken) return error(500, 'Failed to get access token')

    // Exchange short-lived user token for long-lived token (60-day expiry)
    const longLivedUrl = `https://graph.facebook.com/${META_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortToken)}`
    let accessToken = shortToken
    let expiresIn = Number(shortResp?.expires_in || 0)
    try {
      const longResp = await $fetch(longLivedUrl, { method: 'GET' })
      if (longResp?.access_token) {
        accessToken = longResp.access_token
        expiresIn = Number(longResp?.expires_in || 0)
      }
    } catch (e) {
      console.warn('[META IG AUTH] Failed to exchange long-lived token, using short-lived:', e?.message)
    }

    const pagesUrl = `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
    const pagesResp = await $fetch(pagesUrl, { method: 'GET' })
    const pages = Array.isArray(pagesResp?.data) ? pagesResp.data : []
    const withIg = pages.find((p) => p?.instagram_business_account?.id)
    const igAccountId = String(withIg?.instagram_business_account?.id || '')
    if (!igAccountId) throw new Error('Instagram business account not found')

    let igUsername = null
    try {
      const igUrl = `https://graph.facebook.com/${META_VERSION}/${igAccountId}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`
      const igResp = await $fetch(igUrl, { method: 'GET' })
      igUsername = igResp?.username || null
    } catch (e) {}

    const expiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    await upsertDmAccount({
      organisationId: orgId,
      connectedByUserId: userId,
      platform: 'instagram',
      accountId: igAccountId,
      accountName: igUsername || withIg?.name || null,
      accessToken,
      tokenExpiresAt: expiry,
      metadata: {
        pageId: String(withIg?.id || ''),
        igAccountId,
      },
    })

    // Subscribe the linked Facebook page to Instagram webhook fields
    const pageId = String(withIg?.id || '')
    if (pageId) {
      try {
        const pageTokenUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}?fields=access_token&access_token=${encodeURIComponent(accessToken)}`
        const pageTokenResp = await $fetch(pageTokenUrl, { method: 'GET' })
        const pageToken = pageTokenResp?.access_token || accessToken
        const subscribeUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps`
        await $fetch(subscribeUrl, {
          method: 'POST',
          body: new URLSearchParams({
            subscribed_fields: META_SUBSCRIBED_FIELDS,
            access_token: pageToken,
          }).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      } catch (e) {
        console.warn('[META IG AUTH] Failed to subscribe page to Instagram webhooks:', e?.message)
      }
    }

    setCookie(event, 'meta_ig_oauth_state', '', { maxAge: -1 })
    return sendRedirect(event, `/crm?meta=ig_connected&account=${encodeURIComponent(igUsername || igAccountId)}`)
  } catch (e) {
    setCookie(event, 'meta_ig_oauth_state', '', { maxAge: -1 })
    const errorMsg = e?.data?.error?.message || e?.message || 'Instagram connection failed'
    return sendRedirect(event, `/crm?error=${encodeURIComponent(errorMsg)}`)
  }
}

export const fetchLeadsNow = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const days = Number(q.days || 0)
  const maxPerForm = Number(q.maxPerForm || 1000)
  const debugEnabled = String(q.debug || '').toLowerCase() === 'true'

  const result = await fetchLeadsForOrg(orgId, { days, maxPerForm, debugEnabled })
  if (!result.ok) return error(401, result.error || 'Unauthenticated')
  if (debugEnabled) return success(result.debug)
  return success({ imported: result.imported || 0 })
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
          subscribed_fields: META_SUBSCRIBED_FIELDS, 
          access_token: pageToken 
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      subscribed++
    } catch (e) {}
  }
  return success({ subscribed })
}

export const connectionStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  
  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  const dmAccounts = await CrmDmAccount.findAll({ where: { organisationId: orgId } })
  const activeDmAccounts = dmAccounts.filter((row) => String(row.status || '').toLowerCase() === 'active')
  const count = pages.filter(p => p.status === 'Active').length
  const lastConnectedAt = pages.reduce((acc, p) => {
    const t = p.connectedAt || p.updatedAt || p.createdAt
    return !acc || (t && t > acc) ? t : acc
  }, null)
  const messengerConnected = activeDmAccounts.some((row) => String(row.platform || '').toLowerCase() === 'messenger')
  const instagramConnected = activeDmAccounts.some((row) => String(row.platform || '').toLowerCase() === 'instagram')
  
  const data = pages.map((p) => ({ 
    id: p.pageId, 
    name: p.pageName, 
    status: p.status 
  }))
  
  return success({
    count,
    lastConnectedAt,
    pages: data,
    dmConnections: {
      messengerConnected,
      instagramConnected,
      anyConnected: messengerConnected || instagramConnected,
      accounts: activeDmAccounts.map((row) => ({
        id: row.id,
        platform: row.platform,
        accountId: row.accountId,
        accountName: row.accountName,
        status: row.status,
      })),
    },
  })
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
  const dmAccounts = await CrmDmAccount.findAll({
    where: { organisationId: orgId, status: 'Active' },
    order: [['updatedAt', 'DESC']],
  })
  const pageIds = pages.map((p) => p.pageId).filter(Boolean)
  const igByPage = new Map()
  for (const acc of dmAccounts) {
    const platform = String(acc.platform || '').toLowerCase()
    const pageId = String(acc?.metadata?.pageId || '')
    if (platform === 'instagram' && pageId && !igByPage.has(pageId)) {
      igByPage.set(pageId, acc)
    }
  }

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
    let messagesSubscribed = false
    let errorMsg = null

    if (tokenPresent && appId) {
      try {
        const url = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps?fields=id,subscribed_fields&access_token=${encodeURIComponent(token)}`
        const resp = await $fetch(url, { method: 'GET' })
        const data = Array.isArray(resp?.data) ? resp.data : []
        subscribed = data.length > 0
        appMatched = data.some((a) => String(a.id) === String(appId))
        const appEntry = (appId ? data.find((a) => String(a?.id) === String(appId)) : data[0]) || null
        const subscribedFields = Array.isArray(appEntry?.subscribed_fields)
          ? appEntry.subscribed_fields.map((f) => String(f || '').trim()).filter(Boolean)
          : []
        messagesSubscribed = subscribedFields.includes('messages')
      } catch (e) {
        errorMsg = e?.data?.error?.message || e?.message || 'Failed to check subscription'
      }
    }

    const igAccount = igByPage.get(String(pageId)) || null

    let instagramProfilePicture = null
    if (igAccount && token) {
      try {
        const igPicUrl = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(igAccount.accountId)}?fields=profile_picture_url&access_token=${encodeURIComponent(token)}`
        const igPicResp = await $fetch(igPicUrl, { method: 'GET' })
        instagramProfilePicture = igPicResp?.profile_picture_url || null
      } catch {}
    }

    results.push({
      pageId,
      pageName,
      status,
      tokenPresent,
      subscribed,
      appMatched,
      messagesSubscribed,
      instagramConnected: !!igAccount,
      instagramAccountId: igAccount?.accountId || null,
      instagramAccountName: igAccount?.accountName || null,
      instagramProfilePicture,
      connectedAt: page.connectedAt || page.updatedAt || page.createdAt || null,
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
    totalInstagramAccounts: dmAccounts.filter((acc) => String(acc.platform || '').toLowerCase() === 'instagram').length,
    pages: results,
  })
}

export const webhook = async (event) => {
  const config = useRuntimeConfig()
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  
  if (getMethod(event) === 'HEAD') {
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
    if (q['hub.mode'] === 'subscribe' && verifyToken && verifyToken === expectedToken) {
      return send(event, q['hub.challenge'] || '')
    }
    return error(403, 'Verification failed')
  }
  
  if (getMethod(event) === 'POST') {
    const body = await readBody(event)
    try {
      console.log('[META WEBHOOK]', reqId, 'POST received', {
        object: body?.object,
        entries: Array.isArray(body?.entry) ? body.entry.length : 0,
      })
    } catch {}
    try {
      const entries = Array.isArray(body?.entry) ? body.entry : []
      for (const entry of entries) {
        const pageId = String(entry.id || '')
        const changes = Array.isArray(entry.changes) ? entry.changes : []
        const messaging = Array.isArray(entry.messaging) ? entry.messaging : []
        
        for (const ch of changes) {
          if (ch.field !== 'leadgen') continue
          
          const v = ch.value || {}
          const leadId = v.leadgen_id || v.lead_id || v.leadId
          const formId = v.form_id || v.formId
          console.log('[META WEBHOOK]', reqId, 'Leadgen event', { pageId, leadId, formId })
          
          if (!leadId || !pageId) continue
          
          const mp = await MetaPage.findOne({ 
            where: { pageId, status: 'Active' } 
          })
          if (!mp) {
            console.warn('[META WEBHOOK]', reqId, 'No active MetaPage for pageId', pageId)
          }
          if (!mp) continue
          
          const pageToken = decrypt(mp.accessTokenEnc)
          if (!pageToken) {
            console.warn('[META WEBHOOK]', reqId, 'Missing page token for pageId', pageId)
          }
          if (!pageToken) continue
          
          const url = `https://graph.facebook.com/${META_VERSION}/${leadId}?fields=created_time,field_data,ad_id,adset_id,campaign_id&access_token=${encodeURIComponent(pageToken)}`
          const leadData = await $fetch(url, { method: 'GET' })
          console.log('[META WEBHOOK]', reqId, 'Fetched lead data', {
            pageId,
            leadId,
            created_time: leadData?.created_time || null,
          })
          
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
            const created = await CrmLead.create({
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

            try {
              const orgUsers = await UserOrganisation.findAll({
                where: {
                  organisationId: mp.organisationId,
                  status: 'Active',
                },
                attributes: ['userId'],
              })
              const userIds = [...new Set(orgUsers.map((u) => u.userId).filter(Boolean))]
              if (userIds.length) {
                await sendNotificationToMultipleUsers({
                  userIds,
                  organisationId: mp.organisationId,
                  title: 'New Meta Lead',
                  body: fullName || email || phone || 'A new lead was received',
                  type: 'lead_created',
                  referenceType: 'lead',
                  referenceId: created.id,
                  data: {
                    leadId: String(created.id),
                    leadSource: 'Meta Leadgen',
                    pageId: String(pageId || ''),
                    url: `/crm/leads?leadId=${created.id}`,
                  },
                  priority: 'high',
                })
              }
            } catch (notifyErr) {
              console.warn('[META WEBHOOK]', reqId, 'Lead notification failed', {
                leadId: created?.id || null,
                pageId: String(pageId || ''),
                error: notifyErr?.message || 'Unknown notification error',
              })
            }
          }
        }

        if (messaging.length) {
          try { await CrmDmConversation.sync() } catch {}
          try { await CrmDmMessage.sync() } catch {}
          try { await CrmDmAccount.sync() } catch {}

          const accountByEntry = await CrmDmAccount.findOne({
            where: { accountId: pageId, status: 'Active' },
          })

          for (const msgEvent of messaging) {
            const senderId = String(msgEvent?.sender?.id || '')
            const recipientId = String(msgEvent?.recipient?.id || '')
            if (!senderId || !recipientId) continue
            if (msgEvent?.message?.is_echo) continue

            const account =
              accountByEntry ||
              (await CrmDmAccount.findOne({
                where: { accountId: recipientId, status: 'Active' },
              }))

            if (!account) continue

            const orgId = account.organisationId
            const platform = account.platform
            const threadId = senderId
            const text = String(msgEvent?.message?.text || '').trim()
            const attachments = msgEvent?.message?.attachments || null
            const timestamp = msgEvent?.timestamp ? new Date(msgEvent.timestamp) : new Date()

            let conversation = await CrmDmConversation.findOne({
              where: { organisationId: orgId, platform, threadId },
            })

            if (!conversation) {
              conversation = await CrmDmConversation.create({
                organisationId: orgId,
                platform,
                accountId: account.accountId,
                threadId,
                participantName: senderId,
                lastMessageAt: timestamp,
                unreadCount: 0,
                metadata: { recipientId },
              })
            }

            // Enrich participant name/avatar from Meta Graph API if not yet resolved
            if (!conversation.participantAvatar || conversation.participantName === senderId) {
              try {
                const pageToken = decrypt(account.accessTokenEnc)
                const profileResp = await $fetch(
                  `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(senderId)}?fields=name,profile_pic&access_token=${encodeURIComponent(pageToken)}`,
                  { method: 'GET' }
                )
                if (profileResp?.name || profileResp?.profile_pic) {
                  if (profileResp.name) conversation.participantName = profileResp.name
                  if (profileResp.profile_pic) conversation.participantAvatar = profileResp.profile_pic
                  await conversation.save()
                }
              } catch {}
            }

            const messageText = text || (attachments ? '[Attachment]' : '')
            if (!messageText) continue

            const newMessage = await CrmDmMessage.create({
              organisationId: orgId,
              conversationId: conversation.id,
              platform,
              platformMessageId: msgEvent?.message?.mid || null,
              direction: 'inbound',
              senderName: senderId,
              message: messageText,
              attachments,
              status: 'received',
              metadata: msgEvent,
            })

            conversation.lastMessageAt = timestamp
            conversation.unreadCount = Number(conversation.unreadCount || 0) + 1
            conversation.metadata = {
              ...(conversation.metadata || {}),
              lastMessagePreview: messageText.slice(0, 120),
              lastMessageId: newMessage.id,
            }
            await conversation.save()

            try {
              const orgUsers = await UserOrganisation.findAll({
                where: { organisationId: orgId },
                attributes: ['userId'],
              })
              const userIds = orgUsers.map((u) => u.userId).filter(Boolean)
              if (userIds.length) {
                await sendNotificationToMultipleUsers({
                  userIds,
                  organisationId: orgId,
                  title: `New ${platform === 'instagram' ? 'Instagram' : 'Messenger'} DM`,
                  body: messageText.length > 80 ? `${messageText.slice(0, 80)}...` : messageText,
                  type: 'meta_dm',
                  referenceType: 'dm_conversation',
                  referenceId: conversation.id,
                  data: {
                    conversationId: String(conversation.id),
                    platform,
                    senderId,
                    url: `/crm/dms?conversationId=${conversation.id}`,
                  },
                  priority: 'high',
                })
              }
            } catch (notifyErr) {}
          }
        }
      }
    } catch (e) {}
    
    return success({ received: true })
  }
  
  return success('ok')
}

export const fetchMetaStructureAndBudgets = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  await runStructureSync(orgId)
  return success({ synced: true })
}


export const fetchDailyMetaInsights = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const days = Number(q.days || 1)

  await runInsightsSync(orgId, days)
  return success({ synced: true })
}

export const getSyncJobStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const [structure, insights] = await Promise.all([
    getStructureSyncStatus(orgId),
    getInsightsSyncStatus(orgId),
  ])

  return success({ structure, insights })
}

export const getMetaInsights = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const rows = await MetaInsight.findAll({
    where: { organisationId: orgId },
    order: [['date', 'DESC']],
  })
  return success(rows)
}

export const getCampaignLeadCounts = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  try {
    const rows = await CrmLead.findAll({
      where: { organisationId: orgId, campaignId: { [Op.ne]: null } },
      attributes: ['campaignId', [fn('COUNT', col('id')), 'count']],
      group: ['campaignId'],
      raw: true,
    })
    const counts = {}
    rows.forEach((r) => { counts[r.campaignId] = Number(r.count) })
    return success(counts)
  } catch (err) {
    console.error('[getCampaignLeadCounts]', err)
    return error(500, 'Failed to fetch campaign lead counts')
  }
}

export const getMetaStructure = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  try {
    const query = getQuery(event)
    const platform = typeof query.platform === 'string' ? query.platform.trim() : null
    const allowedPlatforms = new Set(['Facebook', 'Instagram'])
    const validPlatform = platform && allowedPlatforms.has(platform) ? platform : null

    const parseDate = (val) => {
      if (!val) return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }
    const dateFromParsed = parseDate(query.dateFrom)
    const dateToParsed = parseDate(query.dateTo)

    const campaignWhere = { organisationId: orgId }
    if (dateFromParsed || dateToParsed) {
      campaignWhere.createdAt = {}
      if (dateFromParsed) campaignWhere.createdAt[Op.gte] = dateFromParsed
      if (dateToParsed) {
        dateToParsed.setHours(23, 59, 59, 999)
        campaignWhere.createdAt[Op.lte] = dateToParsed
      }
    }

    let campaigns = await MetaCampaign.findAll({ where: campaignWhere })

    if (validPlatform && campaigns.length) {
      const candidateCampaignIds = campaigns.map((c) => c.campaignId)
      const [adSetsForCampaigns, adsWithPlatform] = await Promise.all([
        MetaAdSet.findAll({ where: { organisationId: orgId, campaignId: { [Op.in]: candidateCampaignIds } } }),
        MetaAd.findAll({ where: { organisationId: orgId, platform: validPlatform } }),
      ])
      const adSetIdsWithPlatform = new Set(adsWithPlatform.map((a) => a.adSetId))
      const matchingCampaignIds = new Set(
        adSetsForCampaigns
          .filter((as) => adSetIdsWithPlatform.has(as.adSetId))
          .map((as) => as.campaignId)
      )
      campaigns = campaigns.filter((c) => matchingCampaignIds.has(c.campaignId))
    }

    const campaignIds = campaigns.map((c) => c.campaignId)
    const filtersActive = validPlatform || dateFromParsed || dateToParsed

    if (filtersActive && !campaignIds.length) {
      const adAccounts = await MetaAdAccount.findAll({ where: { organisationId: orgId } })
      return success({ campaigns: [], adAccounts, adSets: [], ads: [] })
    }

    const [adAccounts, adSets] = await Promise.all([
      MetaAdAccount.findAll({ where: { organisationId: orgId } }),
      MetaAdSet.findAll({ where: { organisationId: orgId, ...(campaignIds.length ? { campaignId: { [Op.in]: campaignIds } } : {}) } }),
    ])
    const adSetIds = adSets.map((s) => s.adSetId)
    const ads = await MetaAd.findAll({ where: { organisationId: orgId, ...(adSetIds.length ? { adSetId: { [Op.in]: adSetIds } } : {}) } })

    return success({ campaigns, adAccounts, adSets, ads })
  } catch (err) {
    console.error('[getMetaStructure]', err)
    return error(500, 'Failed to fetch Meta structure')
  }
}

const fetchAllMetaPages = async (url, accessToken) => {
  if (!url || !accessToken) return []
  const results = []
  let nextUrl = url
  while (nextUrl) {
    const resp = await $fetch(nextUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = Array.isArray(resp?.data) ? resp.data : []
    results.push(...data)
    nextUrl = resp?.paging?.next || null
  }
  return results
}

const buildMetaPageConflictMap = async (orgId) => {
  const activePages = await MetaPage.findAll({ where: { status: 'Active' } })
  const byOrg = new Set()
  const elsewhere = new Set()
  for (const p of activePages) {
    if (!p?.pageId) continue
    if (String(p.organisationId) === String(orgId)) byOrg.add(String(p.pageId))
    else elsewhere.add(String(p.pageId))
  }
  return { byOrg, elsewhere }
}

export const listBusinessPortfolios = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  try {
    const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
    if (!tokenRow) return error(400, 'Meta not connected')

    const userToken = decrypt(tokenRow.userTokenEnc)
    if (!userToken) return error(400, 'Meta token missing')

    const { byOrg, elsewhere } = await buildMetaPageConflictMap(orgId)

    const businesses = await fetchAllMetaPages(
      `https://graph.facebook.com/${META_VERSION}/me/businesses?fields=id,name&limit=200`,
      userToken
    )

    const mapped = []
    for (const biz of businesses) {
      if (!biz?.id) continue
      let ownedPages = []
      let clientPages = []
      try {
        ownedPages = await fetchAllMetaPages(
          `https://graph.facebook.com/${META_VERSION}/${biz.id}/owned_pages?fields=id,name&limit=200`,
          userToken
        )
      } catch (e) {}
      try {
        clientPages = await fetchAllMetaPages(
          `https://graph.facebook.com/${META_VERSION}/${biz.id}/client_pages?fields=id,name&limit=200`,
          userToken
        )
      } catch (e) {}

      const mapPages = (pages, source) =>
        (pages || [])
          .filter((p) => p?.id)
          .map((p) => ({
            id: String(p.id),
            name: p.name || '',
            source,
            connectedToOrg: byOrg.has(String(p.id)),
            connectedElsewhere: elsewhere.has(String(p.id)),
          }))

      mapped.push({
        id: String(biz.id),
        name: biz.name || '',
        ownedPages: mapPages(ownedPages, 'owned'),
        clientPages: mapPages(clientPages, 'client'),
      })
    }

    return success({ businesses: mapped })
  } catch (e) {
    const msg = e?.data?.error?.message || e?.message || 'Failed to load business portfolios'
    return error(400, msg)
  }
}

export const connectBusinessPages = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId || !userId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body
  const pageIds = Array.isArray(payload?.pageIds)
    ? payload.pageIds.map((p) => String(p)).filter(Boolean)
    : []
  if (!pageIds.length) return error(400, 'pageIds required')

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) return error(400, 'Meta not connected')
  const userToken = decrypt(tokenRow.userTokenEnc)
  if (!userToken) return error(400, 'Meta token missing')

  const conflicts = await MetaPage.findAll({
    where: {
      pageId: { [Op.in]: pageIds },
      organisationId: { [Op.ne]: orgId },
      status: 'Active',
    },
  })
  if (conflicts.length) {
    const names = conflicts.map((c) => c.pageName || c.pageId).join(', ')
    return error(
      409,
      `Meta connection failed. The following page(s) are already connected to another organisation: ${names}`
    )
  }

  let connected = 0
  for (const pageId of pageIds) {
    try {
      const pageResp = await $fetch(
        `https://graph.facebook.com/${META_VERSION}/${pageId}?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`,
        { method: 'GET' }
      )
      if (!pageResp?.id || !pageResp?.access_token) continue

      const existing = await MetaPage.findOne({
        where: { organisationId: orgId, pageId: String(pageResp.id) },
      })

      const enc = encrypt(pageResp.access_token)
      if (existing) {
        existing.pageName = pageResp.name || existing.pageName
        existing.accessTokenEnc = enc
        existing.status = 'Active'
        existing.connectedAt = new Date()
        existing.userId = userId
        await existing.save()
      } else {
        await MetaPage.create({
          organisationId: orgId,
          userId,
          pageId: String(pageResp.id),
          pageName: pageResp.name || null,
          accessTokenEnc: enc,
          status: 'Active',
        })
      }

      await upsertDmAccount({
        organisationId: orgId,
        connectedByUserId: userId,
        platform: 'messenger',
        accountId: String(pageResp.id),
        accountName: pageResp.name || null,
        accessToken: pageResp.access_token,
      })

      try {
        const subscribeUrl = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps`
        await $fetch(subscribeUrl, {
          method: 'POST',
          body: new URLSearchParams({
            subscribed_fields: META_SUBSCRIBED_FIELDS,
            access_token: pageResp.access_token,
          }).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      } catch (e) {}

      connected++
    } catch (e) {}
  }

  return success({ connected })
}

export const debugMetaStatus = async (event) => {
  const { orgId, userId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  return success({
    orgId,
    userId: userId || null,
    hasUserToken: !!tokenRow,
    fbUserId: tokenRow?.fbUserId || null,
    fbUserName: tokenRow?.fbUserName || null,
    tokenExpiresAt: tokenRow?.expiresAt || null,
  })
}

export const listMetaPermissions = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (!tokenRow) return error(400, 'Meta not connected')

  const userToken = decrypt(tokenRow.userTokenEnc)
  if (!userToken) return error(400, 'Meta token missing')

  try {
    const url = `https://graph.facebook.com/${META_VERSION}/me/permissions?access_token=${encodeURIComponent(userToken)}`
    const resp = await $fetch(url, { method: 'GET' })
    return success(resp)
  } catch (e) {
    const msg = e?.data?.error?.message || e?.message || 'Failed to fetch permissions'
    return error(400, msg)
  }
}

// Meta Deauthorize Callback
// Meta sends a signed request when a user removes the app.
export const deauthorize = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? parseJsonBody(body) : body || {};
    const signedRequest = payload?.signed_request || '';
    if (!signedRequest) return error(400, 'signed_request required');

    const [sigB64, payloadB64] = String(signedRequest).split('.', 2);
    if (!sigB64 || !payloadB64) return error(400, 'Invalid signed_request');

    const config = useRuntimeConfig();
    const appSecret = config.META_APP_SECRET || process.env.META_APP_SECRET || '';
    if (!appSecret) return error(500, 'META_APP_SECRET not configured');

    const expected = crypto.createHmac('sha256', appSecret).update(payloadB64).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (expected !== sigB64) return error(403, 'Invalid signed_request signature');

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8') || '{}');
    const fbUserId = decoded?.user_id;

    if (!fbUserId) return success({ status: 'ok' });

    await MetaUserToken.update(
      { expiresAt: new Date(0) },
      { where: { fbUserId } }
    );

    return success({ status: 'ok' });
  } catch (e) {
    return error(500, e?.message || 'Deauthorize failed');
  }
};

// Meta Data Deletion Request Callback
export const dataDeletion = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? parseJsonBody(body) : body || {};
    const signedRequest = payload?.signed_request || '';
    if (!signedRequest) return error(400, 'signed_request required');

    const [sigB64, payloadB64] = String(signedRequest).split('.', 2);
    if (!sigB64 || !payloadB64) return error(400, 'Invalid signed_request');

    const config = useRuntimeConfig();
    const appSecret = config.META_APP_SECRET || process.env.META_APP_SECRET || '';
    if (!appSecret) return error(500, 'META_APP_SECRET not configured');

    const expected = crypto.createHmac('sha256', appSecret).update(payloadB64).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (expected !== sigB64) return error(403, 'Invalid signed_request signature');

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8') || '{}');
    const fbUserId = decoded?.user_id || 'unknown';

    const config2 = useRuntimeConfig();
    const baseUrl = config2.public?.BASE_URL || '';
    const statusUrl = `${baseUrl}/api/meta/dataDeletionStatus?request=${encodeURIComponent(fbUserId)}`;

    return {
      url: statusUrl,
      confirmation_code: String(fbUserId),
    };
  } catch (e) {
    return error(500, e?.message || 'Data deletion failed');
  }
};

export const dataDeletionStatus = async (event) => {
  const query = getQuery(event) || {};
  const requestId = query.request || 'unknown';
  return success({
    status: 'completed',
    request: requestId,
  });
};

export const getVideoSource = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const { videoId } = typeof body === 'string' ? JSON.parse(body) : (body || {})
  if (!videoId) return error(400, 'videoId required')

  const fetchVideoFields = async (token) => {
    try {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(videoId)}?fields=source,permalink_url,picture&access_token=${encodeURIComponent(token)}`
      return await $fetch(url, { method: 'GET' })
    } catch {
      return null
    }
  }

  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (tokenRow) {
    const userToken = decrypt(tokenRow.userTokenEnc)
    if (userToken) {
      const resp = await fetchVideoFields(userToken)
      if (resp?.source) return success({ source: resp.source, permalink: resp.permalink_url || null, thumbnail: resp.picture || null })
    }
  }

  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  for (const page of pages) {
    const pageToken = decrypt(page.accessTokenEnc)
    if (!pageToken) continue
    const resp = await fetchVideoFields(pageToken)
    if (resp?.source) return success({ source: resp.source, permalink: resp.permalink_url || null, thumbnail: resp.picture || null })
    if (resp?.permalink_url) return success({ source: null, permalink: resp.permalink_url, thumbnail: resp.picture || null })
  }

  return error(404, 'Video source not available — the video may require additional Meta permissions')
}

export const getAllLeadCounts = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  try {
    const rows = await CrmLead.findAll({
      where: {
        organisationId: orgId,
        [Op.or]: [
          { campaignId: { [Op.ne]: null } },
          { adSetId: { [Op.ne]: null } },
          { adId: { [Op.ne]: null } },
        ],
      },
      attributes: ['campaignId', 'adSetId', 'adId', [fn('COUNT', col('id')), 'count']],
      group: ['campaignId', 'adSetId', 'adId'],
      raw: true,
    })
    const byCampaign = {}
    const byAdSet = {}
    const byAd = {}
    rows.forEach((r) => {
      const count = Number(r.count)
      if (r.campaignId) byCampaign[r.campaignId] = (byCampaign[r.campaignId] || 0) + count
      if (r.adSetId) byAdSet[r.adSetId] = (byAdSet[r.adSetId] || 0) + count
      if (r.adId) byAd[r.adId] = (byAd[r.adId] || 0) + count
    })
    return success({ byCampaign, byAdSet, byAd })
  } catch (err) {
    console.error('[getAllLeadCounts]', err)
    return error(500, 'Failed to fetch lead counts')
  }
}
