import { CrmLead, MetaPage, Organisation, User, MetaUserToken } from '../models'
import { encrypt, decrypt } from '../utils/crypto'
import { success, error } from '../utils/response'

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
  const { userId, orgId } = event.context.user || {}
  if (!userId || !orgId) return error(401, 'Unauthenticated')

  try {
    // Remove user token
    await MetaUserToken.destroy({ where: { organisationId: orgId, userId } })
    
    // Optionally deactivate pages (or remove them)
    await MetaPage.update(
      { status: 'Disconnected' },
      { where: { organisationId: orgId, userId } }
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
        const leadsUrl = `https://graph.facebook.com/${META_VERSION}/${form.id}/leads?fields=created_time,field_data&limit=100&access_token=${encodeURIComponent(pageToken)}`
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
          
          const existing = await CrmLead.findOne({ 
            where: { organisationId: orgId, leadId: le.id } 
          })
          
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

export const webhook = async (event) => {
  const config = useRuntimeConfig()
  
  if (getMethod(event) === 'HEAD') {
    console.log('[META][WEBHOOK][HEAD] ping')
    return send(event, 'ok')
  }
  
  if (getMethod(event) === 'GET') {
    const q = getQuery(event)
    console.log('[META][WEBHOOK][VERIFY]', {
      mode: q['hub.mode'],
      hasToken: Boolean(q['hub.verify_token']),
    })
    
    if (q['hub.mode'] === 'subscribe' && 
        q['hub.verify_token'] === config.META_VERIFY_TOKEN) {
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
    } catch (e) {
      console.error('[META][WEBHOOK] Processing error:', e)
    }
    
    return success({ received: true })
  }
  
  return success('ok')
}
