import { getQuery, getCookie, setCookie, sendRedirect, readBody } from 'h3'
import { Op } from 'sequelize'
import sequelize from '../utils/db'
import { success, error } from '../utils/response'
import { encrypt, decrypt } from '../utils/crypto'
import { GoogleOAuthToken, GOOGLE_SCOPES } from '../models/crm/google_analytics/googleOAuthTokens'
import { GoogleSearchConsoleSite } from '../models/crm/google_analytics/googleSearchConsoleSites'
import { GoogleSearchConsoleSitePage } from '../models/crm/google_analytics/googleSearchConsoleSitePages'
import { GoogleSearchConsolePerformance } from '../models/crm/google_analytics/googleSearchConsolePerformance'
import { GoogleBusinessProfile } from '../models/crm/google_business_analytics/googleBusinessProfiles'

// Google OAuth2 endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// Google Search Console API endpoints
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'
const GSC_SEARCHANALYTICS_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites'

// Combined scopes for both GSC and Business Profile
const REQUESTED_SCOPES = [
  GOOGLE_SCOPES.SEARCH_CONSOLE,
  GOOGLE_SCOPES.BUSINESS_PROFILE,
  'email',
  'profile'
].join(' ')

/**
 * Get Google OAuth configuration from runtime config
 */
const getGoogleConfig = () => {
  const config = useRuntimeConfig()
  return {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: config.GOOGLE_REDIRECT_URI
  }
}

/**
 * Start Google OAuth flow
 * GET /api/google/authStart
 */
export const authStart = async (event) => {
  const { clientId, redirectUri } = getGoogleConfig()
  if (!clientId || !redirectUri) {
    return error(400, 'Google OAuth not configured')
  }

  const { userId, orgId } = event.context.user || {}
  if (!userId || !orgId) {
    return error(401, 'User must be logged in to connect Google')
  }

  // Create state token with user context
  const stateData = {
    csrf: Math.random().toString(36).slice(2),
    userId,
    orgId,
    timestamp: Date.now()
  }
  const stateToken = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  // Store state in cookie for verification
  setCookie(event, 'google_oauth_state', stateToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    secure: process.env.NODE_ENV === 'production'
  })

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: REQUESTED_SCOPES,
    state: stateToken,
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    include_granted_scopes: 'true' // Incremental authorization
  })

  const url = `${GOOGLE_AUTH_URL}?${params.toString()}`
  return success({ url })
}

/**
 * Handle Google OAuth callback
 * GET /api/google/callback
 */
export const authCallback = async (event) => {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig()
  if (!clientId || !clientSecret || !redirectUri) {
    return error(400, 'Google OAuth not configured')
  }

  const q = getQuery(event)
  const { code, state, error: oauthError, error_description } = q

  // Handle OAuth errors
  if (oauthError) {
    console.error('[GOOGLE][AUTH] OAuth error:', oauthError, error_description)
    return sendRedirect(event, `/crm/google_analytics?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) {
    return error(400, 'Missing authorization code')
  }

  // Verify state token
  const stateCookie = getCookie(event, 'google_oauth_state')
  if (!state || !stateCookie || state !== stateCookie) {
    return error(401, 'Invalid state - CSRF check failed')
  }

  // Extract user context from state
  let userId, orgId
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = stateData.userId
    orgId = stateData.orgId

    // Check timestamp (prevent replay attacks)
    if (Date.now() - stateData.timestamp > 600000) {
      throw new Error('State expired')
    }
  } catch (e) {
    console.error('[GOOGLE][AUTH] Invalid state data:', e)
    return error(401, 'Invalid state data')
  }

  if (!userId || !orgId) {
    return error(401, 'Missing user context in state')
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri
    })

    if (!tokenResponse.access_token) {
      return error(500, 'Failed to get access token')
    }

    // Parse granted scopes from token response
    const grantedScopes = parseGrantedScopes(tokenResponse.scope)
    console.log('[GOOGLE][AUTH] Granted scopes:', grantedScopes)

    // Get user info
    const userInfo = await fetchUserInfo(tokenResponse.access_token)
    console.log('[GOOGLE][AUTH] User:', userInfo?.email)

    // Store tokens (continued in next section...)
    await storeTokens({
      orgId,
      userId,
      tokenResponse,
      grantedScopes,
      userInfo
    })

    // Clear state cookie
    setCookie(event, 'google_oauth_state', '', { maxAge: -1 })

    // Build success redirect URL with scope info
    const hasGSC = grantedScopes.includes(GOOGLE_SCOPES.SEARCH_CONSOLE)
    const hasGBP = grantedScopes.includes(GOOGLE_SCOPES.BUSINESS_PROFILE)
    const params = new URLSearchParams({
      google: 'connected',
      gsc: hasGSC ? '1' : '0',
      gbp: hasGBP ? '1' : '0',
      account: userInfo?.email || ''
    })

    return sendRedirect(event, `/crm/google_analytics?${params.toString()}`)
  } catch (e) {
    console.error('[GOOGLE][AUTH] Callback error:', e)
    setCookie(event, 'google_oauth_state', '', { maxAge: -1 })
    const errorMsg = e?.message || 'Connection failed'
    return sendRedirect(event, `/crm/google_analytics?error=${encodeURIComponent(errorMsg)}`)
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const response = await $fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  })
  return response
}

/**
 * Parse granted scopes from token response
 * Google returns scopes as space-separated string
 */
function parseGrantedScopes(scopeString) {
  if (!scopeString) return []
  return scopeString.split(' ').filter(Boolean)
}

/**
 * Fetch Google user info
 */
async function fetchUserInfo(accessToken) {
  try {
    const response = await $fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    return response
  } catch (e) {
    console.error('[GOOGLE][AUTH] Failed to fetch user info:', e)
    return null
  }
}

/**
 * Store or update OAuth tokens
 */
async function storeTokens({ orgId, userId, tokenResponse, grantedScopes, userInfo }) {
  const accessTokenEnc = encrypt(tokenResponse.access_token)
  const refreshTokenEnc = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null

  const expiresIn = Number(tokenResponse.expires_in || 0)
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

  const googleAccountId = userInfo?.id || null
  const googleAccountEmail = userInfo?.email || null

  // Check for existing token with same Google account
  const existing = await GoogleOAuthToken.findOne({
    where: {
      organisationId: orgId,
      googleAccountId,
      status: 'Active'
    }
  })

  if (existing) {
    // Update existing token
    existing.accessTokenEnc = accessTokenEnc
    if (refreshTokenEnc) {
      existing.refreshTokenEnc = refreshTokenEnc
    }
    existing.scopes = grantedScopes
    existing.expiresAt = expiresAt
    existing.connectedAt = new Date()
    existing.googleAccountEmail = googleAccountEmail
    await existing.save()
    console.log('[GOOGLE][AUTH] Updated existing token for:', googleAccountEmail)
    return existing
  } else {
    // Create new token
    const token = await GoogleOAuthToken.create({
      organisationId: orgId,
      userId,
      googleAccountId,
      googleAccountEmail,
      accessTokenEnc,
      refreshTokenEnc,
      scopes: grantedScopes,
      expiresAt,
      status: 'Active',
      connectedAt: new Date()
    })
    console.log('[GOOGLE][AUTH] Created new token for:', googleAccountEmail)
    return token
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(tokenRecord) {
  const { clientId, clientSecret } = getGoogleConfig()

  const refreshToken = decrypt(tokenRecord.refreshTokenEnc)
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await $fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  })

  if (!response.access_token) {
    throw new Error('Failed to refresh access token')
  }

  // Update token record
  tokenRecord.accessTokenEnc = encrypt(response.access_token)
  const expiresIn = Number(response.expires_in || 0)
  tokenRecord.expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
  await tokenRecord.save()

  return tokenRecord
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(tokenRecord) {
  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now()
  const expiresAt = tokenRecord.expiresAt ? new Date(tokenRecord.expiresAt).getTime() : 0
  const isExpired = expiresAt && (expiresAt - now) < 300000

  if (isExpired && tokenRecord.refreshTokenEnc) {
    await refreshAccessToken(tokenRecord)
  }

  return decrypt(tokenRecord.accessTokenEnc)
}

/**
 * Get connection status for Google services
 * GET /api/google/connection
 */
export const connectionStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  // 1️⃣ Get active tokens
  const tokens = await GoogleOAuthToken.findAll({
    where: { organisationId: orgId, status: 'Active' },
    attributes: [
      'id',
      'googleAccountEmail',
      'scopes',
      'expiresAt',
      'connectedAt',
      'lastUsedAt'
    ]
  })

  const accounts = tokens.map(t => ({
    id: t.id,
    email: t.googleAccountEmail,
    scopes: t.scopes || [],
    hasSearchConsole: t.hasSearchConsoleScope(),
    hasBusinessProfile: t.hasBusinessProfileScope(),
    expiresAt: t.expiresAt,
    connectedAt: t.connectedAt,
    lastUsedAt: t.lastUsedAt
  }))

  // 2️⃣ Get active selected site
  const activeSite = await GoogleSearchConsoleSite.findOne({
    where: {
      organisationId: orgId,
      isActive: true
    },
    attributes: ['id', 'siteUrl', 'siteType', 'isActive', 'lastSyncAt']
  })

  return success({
    connected: accounts.length > 0,
    accounts,
    hasSearchConsole: accounts.some(a => a.hasSearchConsole),
    hasBusinessProfile: accounts.some(a => a.hasBusinessProfile),

    // 👇 NEW FIELD
    selectedSite: activeSite
      ? {
          id: activeSite.id,
          siteUrl: activeSite.siteUrl,
          siteType: activeSite.siteType,
          isActive: activeSite.isActive,
          lastSyncAt: activeSite.lastSyncAt
        }
      : null
  })
}

/**
 * Disconnect a Google account
 * POST /api/google/disconnect
 */
export const disconnect = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const { tokenId } = body || {}

  if (tokenId) {
    // Disconnect specific account
    const token = await GoogleOAuthToken.findOne({
      where: { id: tokenId, organisationId: orgId }
    })
    if (token) {
      token.status = 'Revoked'
      await token.save()
    }
  } else {
    // Disconnect all accounts
    await GoogleOAuthToken.update(
      { status: 'Revoked' },
      { where: { organisationId: orgId, status: 'Active' } }
    )
  }

  return success({ disconnected: true })
}

// =====================================================
// GOOGLE SEARCH CONSOLE API FUNCTIONS
// =====================================================

/**
 * Get an active OAuth token with GSC scope for the organization
 */
async function getGSCToken(orgId) {
  const token = await GoogleOAuthToken.findOne({
    where: {
      organisationId: orgId,
      status: 'Active'
    }
  })

  if (!token) {
    throw new Error('No Google account connected')
  }

  if (!token.hasSearchConsoleScope()) {
    throw new Error('Google account does not have Search Console access')
  }

  return token
}

/**
 * Fetch available sites from Google Search Console
 * GET /api/google/sites
 */
export const fetchAvailableSites = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  try {
    const token = await getGSCToken(orgId)
    const accessToken = await getValidAccessToken(token)

    console.log('[GSC] Fetching available sites for org:', orgId)

    // Call GSC API to get list of sites
    const response = await $fetch(`${GSC_API_BASE}/sites`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const sites = (response.siteEntry || []).map(site => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel
    }))

    // Update lastUsedAt on token
    token.lastUsedAt = new Date()
    await token.save()

    console.log('[GSC] Found', sites.length, 'sites')

    // Get already selected sites for this org
    const selectedSites = await GoogleSearchConsoleSite.findAll({
      where: { organisationId: orgId, isActive: true },
      attributes: ['siteUrl']
    })
    const selectedUrls = new Set(selectedSites.map(s => s.siteUrl))

    return success({
      sites: sites.map(s => ({
        ...s,
        isSelected: selectedUrls.has(s.siteUrl)
      })),
      tokenId: token.id,
      accountEmail: token.googleAccountEmail
    })
  } catch (e) {
    console.error('[GSC] Error fetching sites:', e)
    return error(500, e?.message || 'Failed to fetch sites')
  }
}

/**
 * Select/activate a site for tracking
 * POST /api/google/selectSite
 */
export const selectSite = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  let body = await readBody(event)
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  const {
    siteUrl,
    tokenId,
    startDate,
    endDate,
    country,
    device
  } = body || {}

  if (!siteUrl) {
    return error(400, 'siteUrl is required')
  }

  try {
    let token
    if (tokenId) {
      token = await GoogleOAuthToken.findOne({
        where: { id: tokenId, organisationId: orgId, status: 'Active' }
      })
    } else {
      token = await getGSCToken(orgId)
    }

    if (!token) {
      return error(400, 'No valid Google token found')
    }

    let site = await GoogleSearchConsoleSite.findOne({
      where: { organisationId: orgId, siteUrl }
    })

    if (site) {
      site.isActive = true
      site.googleOAuthTokenId = token.id
      site.lastSyncError = null
      await site.save()
    } else {
      site = await GoogleSearchConsoleSite.create({
        organisationId: orgId,
        googleOAuthTokenId: token.id,
        siteUrl,
        siteType: siteUrl.startsWith('sc-domain:') ? 'DOMAIN' : 'URL_PREFIX',
        isActive: true
      })
    }

    // Background full sync (pages + analytics)
    fetchSitePagesInternal({
      orgId,
      siteId: site.id,
      token,
      startDate,
      endDate,
      country,
      device
    }).catch(err => {
      console.error('[GSC] Background sync failed:', err)
    })

    return success({
      site: {
        id: site.id,
        siteUrl: site.siteUrl,
        siteType: site.siteType,
        isActive: site.isActive
      },
      message: 'Site selected. Full sync started in background.'
    })

  } catch (e) {
    console.error('[GSC] Error selecting site:', e)
    return error(500, e?.message || 'Failed to select site')
  }
}

/**
 * Internal function to fetch all pages under a site
 * Called as background process after site selection
 */
async function fetchSitePagesInternal({
  orgId,
  siteId,
  token,
  startDate,
  endDate,
  country,
  device
}) {
  const site = await GoogleSearchConsoleSite.findByPk(siteId)
  if (!site) throw new Error('Site not found')

  const accessToken = await getValidAccessToken(token)
  const encodedSiteUrl = encodeURIComponent(site.siteUrl)

  const end = endDate ? new Date(endDate) : new Date()
  const start = startDate ? new Date(startDate) : new Date('2000-01-01')

  const formatDate = (d) => d.toISOString().split('T')[0]

  const filters = []

  if (country) {
    filters.push({ dimension: 'country', operator: 'equals', expression: country })
  }

  if (device) {
    filters.push({ dimension: 'device', operator: 'equals', expression: device })
  }

  let startRow = 0
  const rowLimit = 25000
  let hasMore = true

  const allPages = new Set()
  const analyticsRecords = []

  while (hasMore) {
    const response = await $fetch(
      `${GSC_SEARCHANALYTICS_URL}/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          startDate: formatDate(start),
          endDate: formatDate(end),
          dimensions: ['page', 'date'],
          rowLimit,
          startRow,
          dimensionFilterGroups: filters.length
            ? [{ groupType: 'and', filters }]
            : undefined
        }
      }
    )

    const rows = response.rows || []

    if (rows.length === 0) {
      hasMore = false
    } else {
      for (const row of rows) {
        const [pageUrl, date] = row.keys

        allPages.add(pageUrl)

        analyticsRecords.push({
          organisationId: orgId,
          siteId,
          date,
          dimensionType: 'page',
          dimensionValue: pageUrl,
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: row.ctr || 0,
          position: row.position || 0
        })
      }

      if (rows.length < rowLimit) {
        hasMore = false
      } else {
        startRow += rowLimit
      }
    }
  }

  const existingPages = await GoogleSearchConsoleSitePage.findAll({
    where: { organisationId: orgId, siteId },
    attributes: ['id', 'pageUrl']
  })

  const existingMap = new Map(existingPages.map(p => [p.pageUrl, p.id]))

  const now = new Date()
  const newPages = []
  const updatedUrls = new Set()

  for (const pageUrl of allPages) {
    updatedUrls.add(pageUrl)

    if (existingMap.has(pageUrl)) {
      await GoogleSearchConsoleSitePage.update(
        { lastFetchedAt: now, isActive: true },
        { where: { id: existingMap.get(pageUrl) } }
      )
    } else {
      newPages.push({
        organisationId: orgId,
        siteId,
        pageUrl,
        lastFetchedAt: now,
        isActive: true
      })
    }
  }

  if (newPages.length > 0) {
    await GoogleSearchConsoleSitePage.bulkCreate(newPages, {
      ignoreDuplicates: true
    })
  }

  // Bulk upsert analytics
  if (analyticsRecords.length > 0) {
    await GoogleSearchConsolePerformance.bulkCreate(
      analyticsRecords,
      {
        updateOnDuplicate: ['impressions', 'clicks', 'ctr', 'position']
      }
    )
  }

  site.lastSyncAt = now
  site.lastSyncError = null
  await site.save()

  return {
    pagesFound: allPages.size,
    analyticsStored: analyticsRecords.length
  }
}

/**
 * Manually trigger page fetching for a site
 * POST /api/google/fetchPages
 */
export const fetchSitePages = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  let body = await readBody(event)

  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch {}
  }

  const siteId = Number(body?.siteId)
  const { startDate, endDate, country, device } = body || {}

  if (!siteId) {
    return error(400, 'siteId is required')
  }

  try {
    const site = await GoogleSearchConsoleSite.findOne({
      where: { id: siteId, organisationId: orgId }
    })

    if (!site) {
      return error(404, 'Site not found')
    }

    // 🔥 Use helper instead of findByPk
    const token = await getGSCToken(orgId)

    const result = await fetchSitePagesInternal({
      orgId,
      siteId,
      token,
      startDate,
      endDate,
      country,
      device
    })

    return success({
      siteId,
      ...result
    })

  } catch (e) {
    console.error('[GSC] Error in resync:', e)
    return error(500, e?.message || 'Failed to resync site')
  }
}

/**
 * Fetch analytics for a specific page
 * POST /api/google/fetchAnalytics
 *
 * Request body:
 * - siteId (required): The GSC site ID
 * - pageUrl (required): The page URL to fetch analytics for
 * - country (optional): Country code filter (e.g., "USA", "GBR")
 * - device (optional): Device filter ("MOBILE", "DESKTOP", "TABLET")
 * - startDate (optional): Start date in YYYY-MM-DD format (defaults to 30 days ago)
 * - endDate (optional): End date in YYYY-MM-DD format (defaults to today)
 */
// export const fetchPageAnalytics = async (event) => {
//   const { orgId } = event.context.user || {}
//   if (!orgId) return error(401, 'Unauthenticated')

//   const body = await readBody(event)
//   const { siteId, pageUrl, country, device, startDate, endDate } = body || {}

//   if (!siteId) {
//     return error(400, 'siteId is required')
//   }

//   if (!pageUrl) {
//     return error(400, 'pageUrl is required')
//   }

//   try {
//     const site = await GoogleSearchConsoleSite.findOne({
//       where: { id: siteId, organisationId: orgId }
//     })

//     if (!site) {
//       return error(404, 'Site not found')
//     }

//     const token = await GoogleOAuthToken.findByPk(site.googleOAuthTokenId)
//     if (!token || token.status !== 'Active') {
//       return error(400, 'OAuth token not available')
//     }

//     const result = await fetchPageAnalyticsInternal({
//       orgId,
//       site,
//       token,
//       pageUrl,
//       country,
//       device,
//       startDate,
//       endDate
//     })

//     return success(result)
//   } catch (e) {
//     console.error('[GSC] Error in fetchPageAnalytics:', e)
//     return error(500, e?.message || 'Failed to fetch analytics')
//   }
// }

/**
 * Internal function to fetch analytics for a specific page
 */
// async function fetchPageAnalyticsInternal({
//   orgId,
//   site,
//   token,
//   pageUrl,
//   country,
//   device,
//   startDate,
//   endDate
// }) {
//   const accessToken = await getValidAccessToken(token)
//   const encodedSiteUrl = encodeURIComponent(site.siteUrl)

//   // Calculate date range (default: last 30 days)
//   const end = endDate ? new Date(endDate) : new Date()
//   const start = startDate ? new Date(startDate) : new Date()
//   if (!startDate) {
//     start.setDate(start.getDate() - 30)
//   }

//   const formatDate = (d) => d.toISOString().split('T')[0]

//   // Build dimension filters
//   // Page filter is mandatory
//   const filters = [
//     {
//       dimension: 'page',
//       operator: 'equals',
//       expression: pageUrl
//     }
//   ]

//   // Add optional country filter
//   if (country) {
//     filters.push({
//       dimension: 'country',
//       operator: 'equals',
//       expression: country
//     })
//   }

//   // Add optional device filter
//   if (device) {
//     filters.push({
//       dimension: 'device',
//       operator: 'equals',
//       expression: device
//     })
//   }

//   console.log('[GSC] Fetching analytics for page:', pageUrl, 'filters:', { country, device })

//   const response = await $fetch(
//     `${GSC_SEARCHANALYTICS_URL}/${encodedSiteUrl}/searchAnalytics/query`,
//     {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'Content-Type': 'application/json'
//       },
//       body: {
//         startDate: formatDate(start),
//         endDate: formatDate(end),
//         dimensions: ['date'],
//         dimensionFilterGroups: [
//           {
//             groupType: 'and',
//             filters
//           }
//         ]
//       }
//     }
//   )

//   const rows = response.rows || []
//   console.log('[GSC] Received', rows.length, 'analytics rows for page')

//   // Store analytics data in GoogleSearchConsolePerformance
//   const now = new Date()
//   const analyticsRecords = []

//   for (const row of rows) {
//     const date = row.keys[0] // Date dimension value

//     analyticsRecords.push({
//       organisationId: orgId,
//       siteId: site.id,
//       date,
//       dimensionType: 'page',
//       dimensionValue: pageUrl,
//       impressions: row.impressions || 0,
//       clicks: row.clicks || 0,
//       ctr: row.ctr || 0,
//       position: row.position || 0
//     })
//   }

//   // Upsert analytics records
//   if (analyticsRecords.length > 0) {
//     for (const record of analyticsRecords) {
//       await GoogleSearchConsolePerformance.upsert(record, {
//         conflictFields: ['siteId', 'date', 'dimensionType', 'dimensionValue']
//       })
//     }
//     console.log('[GSC] Stored', analyticsRecords.length, 'analytics records')
//   }

//   // Update page's lastAnalyticsSyncAt
//   await GoogleSearchConsoleSitePage.update(
//     { lastAnalyticsSyncAt: now, lastSyncError: null },
//     { where: { organisationId: orgId, siteId: site.id, pageUrl } }
//   )

//   return {
//     pageUrl,
//     dateRange: { start: formatDate(start), end: formatDate(end) },
//     filters: { country, device },
//     recordsStored: analyticsRecords.length,
//     analytics: analyticsRecords
//   }
// }

/**
 * Get site pages with analytics data (paginated)
 * GET /api/google/getSitePages?siteId=X&page=1&limit=50
 */
export const getSitePages = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const siteId = Number(q.siteId)
  const page = Math.max(1, Number(q.page || 1))
  const limit = Math.max(1, Math.min(100, Number(q.limit || 50)))
  const offset = (page - 1) * limit

  if (!siteId) {
    return error(400, 'siteId is required')
  }

  try {
    // Verify site belongs to this org
    const site = await GoogleSearchConsoleSite.findOne({
      where: { id: siteId, organisationId: orgId }
    })

    if (!site) {
      return error(404, 'Site not found')
    }

    console.log('[GSC] Fetching pages for site:', siteId, 'page:', page, 'limit:', limit)

    // Get total count
    const totalCount = await GoogleSearchConsoleSitePage.count({
      where: { organisationId: orgId, siteId, isActive: true }
    })

    // Get pages with analytics aggregates using raw query for efficiency
    const pages = await GoogleSearchConsoleSitePage.findAll({
      where: { organisationId: orgId, siteId, isActive: true },
      order: [['lastFetchedAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'pageUrl',
        'lastFetchedAt',
        'isActive',
        'lastAnalyticsSyncAt',
        'lastSyncError',
        'createdAt'
      ]
    })

    // Get analytics aggregates for these pages
    const pageUrls = pages.map(p => p.pageUrl)

    let analyticsMap = new Map()
    if (pageUrls.length > 0) {
      const analyticsData = await GoogleSearchConsolePerformance.findAll({
        where: {
          organisationId: orgId,
          siteId,
          dimensionType: 'page',
          dimensionValue: { [Op.in]: pageUrls }
        },
        attributes: [
          'dimensionValue',
          [sequelize.fn('SUM', sequelize.col('impressions')), 'totalImpressions'],
          [sequelize.fn('SUM', sequelize.col('clicks')), 'totalClicks'],
          [sequelize.fn('AVG', sequelize.col('ctr')), 'avgCtr'],
          [sequelize.fn('AVG', sequelize.col('position')), 'avgPosition']
        ],
        group: ['dimensionValue']
      })

      analyticsData.forEach(row => {
        const data = row.get({ plain: true })
        analyticsMap.set(data.dimensionValue, {
          totalImpressions: Number(data.totalImpressions || 0),
          totalClicks: Number(data.totalClicks || 0),
          avgCtr: Number(data.avgCtr || 0),
          avgPosition: Number(data.avgPosition || 0)
        })
      })
    }

    // Combine pages with analytics
    const pagesWithAnalytics = pages.map(p => {
      const pageData = p.get({ plain: true })
      const analytics = analyticsMap.get(pageData.pageUrl) || {
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgPosition: 0
      }
      return { ...pageData, analytics }
    })

    const totalPages = Math.ceil(totalCount / limit)

    console.log('[GSC] Returning', pagesWithAnalytics.length, 'pages, total:', totalCount)

    return success({
      pages: pagesWithAnalytics,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      site: {
        id: site.id,
        siteUrl: site.siteUrl,
        lastSyncAt: site.lastSyncAt
      }
    })
  } catch (e) {
    console.error('[GSC] Error in getSitePages:', e)
    return error(500, e?.message || 'Failed to fetch pages')
  }
}

/**
 * Search site pages with analytics data (paginated)
 * GET /api/google/searchSitePages?siteId=X&searchQuery=Y&page=1&limit=50
 */
export const searchSitePages = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const siteId = Number(q.siteId)
  const searchQuery = (q.searchQuery || q.search || q.q || '').trim()
  const page = Math.max(1, Number(q.page || 1))
  const limit = Math.max(1, Math.min(100, Number(q.limit || 50)))
  const offset = (page - 1) * limit

  if (!siteId) {
    return error(400, 'siteId is required')
  }

  if (!searchQuery) {
    return error(400, 'searchQuery is required')
  }

  try {
    // Verify site belongs to this org
    const site = await GoogleSearchConsoleSite.findOne({
      where: { id: siteId, organisationId: orgId }
    })

    if (!site) {
      return error(404, 'Site not found')
    }

    console.log('[GSC] Searching pages for site:', siteId, 'query:', searchQuery)

    // Build search where clause with case-insensitive partial matching
    const searchWhere = {
      organisationId: orgId,
      siteId,
      isActive: true,
      pageUrl: { [Op.iLike]: `%${searchQuery}%` }
    }

    // Get total count for search results
    const totalCount = await GoogleSearchConsoleSitePage.count({
      where: searchWhere
    })

    // Get matching pages
    const pages = await GoogleSearchConsoleSitePage.findAll({
      where: searchWhere,
      order: [['lastFetchedAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'pageUrl',
        'lastFetchedAt',
        'isActive',
        'lastAnalyticsSyncAt',
        'lastSyncError',
        'createdAt'
      ]
    })

    // Get analytics aggregates for these pages
    const pageUrls = pages.map(p => p.pageUrl)

    let analyticsMap = new Map()
    if (pageUrls.length > 0) {
      const analyticsData = await GoogleSearchConsolePerformance.findAll({
        where: {
          organisationId: orgId,
          siteId,
          dimensionType: 'page',
          dimensionValue: { [Op.in]: pageUrls }
        },
        attributes: [
          'dimensionValue',
          [sequelize.fn('SUM', sequelize.col('impressions')), 'totalImpressions'],
          [sequelize.fn('SUM', sequelize.col('clicks')), 'totalClicks'],
          [sequelize.fn('AVG', sequelize.col('ctr')), 'avgCtr'],
          [sequelize.fn('AVG', sequelize.col('position')), 'avgPosition']
        ],
        group: ['dimensionValue']
      })

      analyticsData.forEach(row => {
        const data = row.get({ plain: true })
        analyticsMap.set(data.dimensionValue, {
          totalImpressions: Number(data.totalImpressions || 0),
          totalClicks: Number(data.totalClicks || 0),
          avgCtr: Number(data.avgCtr || 0),
          avgPosition: Number(data.avgPosition || 0)
        })
      })
    }

    // Combine pages with analytics
    const pagesWithAnalytics = pages.map(p => {
      const pageData = p.get({ plain: true })
      const analytics = analyticsMap.get(pageData.pageUrl) || {
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgPosition: 0
      }
      return { ...pageData, analytics }
    })

    const totalPages = Math.ceil(totalCount / limit)

    console.log('[GSC] Search returned', pagesWithAnalytics.length, 'pages, total:', totalCount)

    return success({
      pages: pagesWithAnalytics,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      searchQuery,
      site: {
        id: site.id,
        siteUrl: site.siteUrl
      }
    })
  } catch (e) {
    console.error('[GSC] Error in searchSitePages:', e)
    return error(500, e?.message || 'Failed to search pages')
  }
}

