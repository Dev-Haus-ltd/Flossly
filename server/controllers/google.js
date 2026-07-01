import { getQuery, getCookie, setCookie, sendRedirect, readBody } from 'h3'
import { Op } from 'sequelize'
import sequelize from '../utils/db'
import { success, error } from '../utils/response'
import { encrypt, decrypt } from '../utils/crypto'
import { GoogleOAuthToken, GOOGLE_SCOPES } from '../models/crm/google_analytics/googleOAuthTokens'
import { DiaryGoogleCalendarEvent } from '../models/diary/googleCalendarEvent'
import { DiaryDentistGoogleCalendar } from '../models/diary/dentistGoogleCalendar'
import { GoogleSearchConsoleSite } from '../models/crm/google_analytics/googleSearchConsoleSites'
import { GoogleSearchConsoleSitePage } from '../models/crm/google_analytics/googleSearchConsoleSitePages'
import { GoogleSearchConsolePerformance } from '../models/crm/google_analytics/googleSearchConsolePerformance'
import { GoogleBusinessProfile } from '../models/crm/google_business_analytics/googleBusinessProfiles'
import { GoogleAdsAccount } from '../models/crm/google_Ads_analytics/googleAdsAccounts'
import { GoogleAdsCampaign } from '../models/crm/google_Ads_analytics/googleAdsCampaigns'
import { GoogleAdsAdGroup } from '../models/crm/google_Ads_analytics/googleAdsAdGroups'
import { GoogleAdsAd } from '../models/crm/google_Ads_analytics/googleAdsAds'
import { GoogleAdsInsight } from '../models/crm/google_Ads_analytics/googleAdsInsights'
import { CrmLead } from '../models/crm/leads'


// Google OAuth2 endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// Google Search Console API endpoints
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'
const GSC_SEARCHANALYTICS_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites'

// Google Ads API endpoints
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v17'

// Combined scopes for both GSC and Business Profile
const REQUESTED_SCOPES = [
  GOOGLE_SCOPES.SEARCH_CONSOLE,
  GOOGLE_SCOPES.BUSINESS_PROFILE,
  GOOGLE_SCOPES.GOOGLE_ADS,
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
    redirectUri: config.GOOGLE_REDIRECT_URI,
    developerToken: config.GOOGLE_ADS_DEVELOPER_TOKEN
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
    return sendRedirect(event, `/crm?error=${encodeURIComponent(oauthError)}`)
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

    return sendRedirect(event, `/crm`)
  } catch (e) {
    console.error('[GOOGLE][AUTH] Callback error:', e)
    setCookie(event, 'google_oauth_state', '', { maxAge: -1 })
    const errorMsg = e?.message || 'Connection failed'
    return sendRedirect(event, `/crm?error=${encodeURIComponent(errorMsg)}`)
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
  // Check if ANY active token already exists for this org
  const existingOrgToken = await GoogleOAuthToken.findOne({
    where: {
      organisationId: orgId,
      status: 'Active'
    }
  })

  if (existingOrgToken) {
    // Replace existing token (one account per org rule)
    existingOrgToken.accessTokenEnc = accessTokenEnc
    if (refreshTokenEnc) {
      existingOrgToken.refreshTokenEnc = refreshTokenEnc
    }
    existingOrgToken.scopes = grantedScopes
    existingOrgToken.expiresAt = expiresAt
    existingOrgToken.connectedAt = new Date()
    existingOrgToken.googleAccountEmail = googleAccountEmail
    existingOrgToken.userId = userId
    existingOrgToken.googleAccountId = googleAccountId
    existingOrgToken.status = 'Active'
    existingOrgToken.lastUsedAt = null
    await existingOrgToken.save()

    console.log('[GOOGLE][AUTH] Replaced existing org token with:', googleAccountEmail)
    return existingOrgToken
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

  const token = await GoogleOAuthToken.findOne({
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

  const REQUIRED_SCOPES = [
    GOOGLE_SCOPES.SEARCH_CONSOLE,
    GOOGLE_SCOPES.BUSINESS_PROFILE,
    GOOGLE_SCOPES.GOOGLE_ADS
  ]

  let account = null

  if (token) {
    const granted = token.scopes || []

    const scopeStatus = REQUIRED_SCOPES.map(scope => ({
      scope,
      granted: granted.includes(scope)
    }))

    account = {
      id: token.id,
      email: token.googleAccountEmail,
      scopes: granted,
      scopeStatus,
      hasSearchConsole: granted.includes(GOOGLE_SCOPES.SEARCH_CONSOLE),
      hasBusinessProfile: granted.includes(GOOGLE_SCOPES.BUSINESS_PROFILE),
      hasGoogleAds: granted.includes(GOOGLE_SCOPES.GOOGLE_ADS),
      expiresAt: token.expiresAt,
      connectedAt: token.connectedAt,
      lastUsedAt: token.lastUsedAt
    }
  }

  const activeSite = await GoogleSearchConsoleSite.findOne({
    where: { organisationId: orgId, isActive: true },
    attributes: ['id', 'siteUrl', 'siteType', 'isActive', 'lastSyncAt']
  })

  const adsAccount = await GoogleAdsAccount.findOne({
    where: { organisationId: orgId },
    attributes: ['id', 'googleCustomerId', 'name', 'currency', 'timezone']
  })

  return success({
    connected: !!account,
    account,
    hasSearchConsole: account?.hasSearchConsole || false,
    hasBusinessProfile: account?.hasBusinessProfile || false,
    hasGoogleAds: account?.hasGoogleAds || false,
    selectedSite: activeSite
      ? {
        id: activeSite.id,
        siteUrl: activeSite.siteUrl,
        siteType: activeSite.siteType,
        isActive: activeSite.isActive,
        lastSyncAt: activeSite.lastSyncAt
      }
      : null,
    selectedAdsAccount: adsAccount
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
    try { body = JSON.parse(body) } catch { }
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

/**
 * Get aggregated search console analytics by date
 * GET /api/google/getAnalytics?siteId=X&days=30
 */
export const getSearchConsoleAnalytics = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const siteId = Number(q.siteId)
  const days = Math.min(90, Math.max(1, Number(q.days || 30)))

  try {
    let targetSiteId = siteId
    if (!targetSiteId) {
      const site = await GoogleSearchConsoleSite.findOne({
        where: { organisationId: orgId }
      })
      if (!site) return success([])
      targetSiteId = site.id
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Aggregate daily performance across all pages
    const performance = await GoogleSearchConsolePerformance.findAll({
      where: {
        organisationId: orgId,
        siteId: targetSiteId,
        dimensionType: 'page',
        date: { [Op.gte]: startDateStr }
      },
      attributes: [
        'date',
        [sequelize.fn('SUM', sequelize.col('impressions')), 'impressions'],
        [sequelize.fn('SUM', sequelize.col('clicks')), 'clicks'],
        [sequelize.fn('AVG', sequelize.col('ctr')), 'ctr'],
        [sequelize.fn('AVG', sequelize.col('position')), 'position']
      ],
      group: ['date'],
      order: [['date', 'ASC']]
    })

    return success(performance)
  } catch (e) {
    console.error('[GSC] Error in getSearchConsoleAnalytics:', e)
    return error(500, 'Failed to fetch search console analytics')
  }
}

/**
 * Get an active OAuth token with Google Ads scope for the organization
 */
async function getAdsToken(orgId) {
  const token = await GoogleOAuthToken.findOne({
    where: {
      organisationId: orgId,
      status: 'Active'
    }
  })

  if (!token) {
    throw new Error('No Google account connected')
  }

  if (!token.hasScope(GOOGLE_SCOPES.GOOGLE_ADS)) {
    throw new Error('Google account does not have Google Ads access')
  }

  return token
}

/**
 * Fetch available customer accounts from Google Ads
 * GET /api/google/ads/customers
 */
export const fetchAvailableAdsCustomers = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const { developerToken } = getGoogleConfig()
  if (!developerToken) {
    return error(400, 'Google Ads Developer Token not configured')
  }

  try {
    const token = await getAdsToken(orgId)
    const accessToken = await getValidAccessToken(token)

    console.log('[ADS] Fetching accessible customers for org:', orgId)

    // 1. List accessible customers (POST request with empty body)
    const accessibleResp = await $fetch(
      `${GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json'
        },
        body: {}
      }
    )

    const resourceNames = accessibleResp.resourceNames || []
    const customers = []

    // 2. Get details for each accessible customer
    for (const resourceName of resourceNames) {
      try {
        const customerId = resourceName.split('/')[1]

        // Use googleAds:search to fetch customer details
        const customerDetailsQuery = {
          query: `
            SELECT
              customer.id,
              customer.descriptive_name,
              customer.currency_code,
              customer.time_zone,
              customer.manager
            FROM customer
            LIMIT 1
          `
        }

        const customerDetailsResp = await $fetch(
          `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'login-customer-id': customerId,
              'Content-Type': 'application/json'
            },
            body: customerDetailsQuery
          }
        )

        const customerDetails = customerDetailsResp.results?.[0]?.customer || {}

        customers.push({
          customerId,
          resourceName,
          descriptiveName: customerDetails.descriptiveName || `Account ${customerId}`,
          currencyCode: customerDetails.currencyCode,
          timeZone: customerDetails.timeZone,
          manager: customerDetails.manager || false
        })
      } catch (e) {
        console.error(`[ADS] Failed to fetch details for ${resourceName}:`, e.message)
      }
    }

    token.lastUsedAt = new Date()
    await token.save()

    const selectedAccount = await GoogleAdsAccount.findOne({
      where: { organisationId: orgId }
    })

    return success({
      customers,
      selectedCustomerId: selectedAccount?.googleCustomerId || null,
      tokenId: token.id,
      accountEmail: token.googleAccountEmail
    })
  } catch (e) {
    console.error('[ADS] Error fetching customers:', e)
    return error(500, e?.message || 'Failed to fetch Google Ads customers')
  }
}

/**
 * Select a Google Ads customer account for the organization
 * POST /api/google/ads/selectAccount
 */
export const selectAdsAccount = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const { customerId, name, currency, timezone, tokenId } = body

  if (!customerId) return error(400, 'customerId is required')

  try {
    const [account, created] = await GoogleAdsAccount.findOrCreate({
      where: { organisationId: orgId },
      defaults: {
        googleCustomerId: customerId,
        name,
        currency,
        timezone,
        googleOAuthTokenId: tokenId
      }
    })

    if (!created) {
      account.googleCustomerId = customerId
      if (name) account.name = name
      if (currency) account.currency = currency
      if (timezone) account.timezone = timezone
      if (tokenId) account.googleOAuthTokenId = tokenId
      await account.save()
    }

    // Trigger initial sync in background
    syncAdsDataInternal({ orgId, customerId }).catch(console.error)

    return success({
      message: 'Google Ads account selected and sync started',
      customerId
    })
  } catch (e) {
    console.error('[ADS] Error selecting account:', e)
    return error(500, 'Failed to select Google Ads account')
  }
}

/**
 * Internal sync function for Google Ads (Campaigns, Analytics)
 */
async function syncAdsDataInternal({ orgId, customerId }) {
  const { developerToken } = getGoogleConfig()
  if (!developerToken || !orgId || !customerId) return

  try {
    const token = await getAdsToken(orgId)
    const accessToken = await getValidAccessToken(token)

    console.log(`[ADS] Starting sync for Org: ${orgId}, Customer: ${customerId}`)

    // 1. Fetch Campaigns
    const campaignQuery = {
      query: `
        SELECT 
          campaign.id, 
          campaign.name, 
          campaign.status, 
          campaign.advertising_channel_type,
          campaign_budget.amount_micros,
          campaign_budget.type
        FROM campaign
        WHERE campaign.status != 'REMOVED'
      `
    }

    const campaignResp = await $fetch(`${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId
      },
      body: campaignQuery
    })

    const results = campaignResp.results || []
    for (const row of results) {
      const c = row.campaign
      const budget = row.campaignBudget

      await GoogleAdsCampaign.upsert({
        campaignId: String(c.id),
        organisationId: orgId,
        googleCustomerId: customerId,
        name: c.name,
        status: c.status,
        advertisingChannelType: c.advertisingChannelType,
        amountMicros: budget?.amountMicros,
        budgetType: budget?.type
      })
    }

    // 2. Fetch Daily Performance (Last 30 days)
    const metricsQuery = {
      query: `
        SELECT
          segments.date,
          campaign.id,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.interactions
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
      `
    }

    const metricsResp = await $fetch(`${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId
      },
      body: metricsQuery
    })

    const metricResults = metricsResp.results || []
    for (const row of metricResults) {
      const s = row.segments
      const c = row.campaign
      const m = row.metrics

      await GoogleAdsInsight.upsert({
        organisationId: orgId,
        entityType: 'campaign',
        entityId: String(c.id),
        date: s.date,
        impressions: m.impressions,
        clicks: m.clicks,
        costMicros: m.costMicros,
        conversions: m.conversions,
        interactions: m.interactions
      })
    }

    console.log(`[ADS] Finished sync for Org: ${orgId}, Customer: ${customerId}. Processed ${results.length} campaigns.`)
  } catch (e) {
    console.error(`[ADS] Sync failed for Org: ${orgId}:`, e.message)
  }
}

/**
 * Public webhook for Google Ads Lead Form leads
 * POST /api/google/webhooks/ads-leads
 */
export const handleAdsLeadWebhook = async (event) => {
  // Use a secret from config to verify (Google sends this in headers or as part of URL if configured)
  const body = await readBody(event)

  // Google Lead Form Webhook data structure:
  // {
  //   lead_id: "...",
  //   user_column_data: [ { column_name: "Full Name", string_value: "..." }, ... ],
  //   api_version: "1.0",
  //   form_id: "...",
  //   campaign_id: "...",
  //   google_key: "...", // The secret key configured in Google Ads
  //   adgroup_id: "...",
  //   creative_id: "...",
  //   gclid: "..."
  // }

  const googleKey = body.google_key
  const config = useRuntimeConfig()
  const expectedKey = config.GOOGLE_ADS_WEBHOOK_SECRET

  if (expectedKey && googleKey !== expectedKey) {
    console.warn('[ADS] Webhook secret mismatch')
    return error(401, 'Unauthorized')
  }

  try {
    const userFields = body.user_column_data || []
    const mapped = userFields.reduce((acc, f) => {
      const name = (f.column_name || '').toLowerCase()
      if (name.includes('full name')) acc.name = f.string_value
      if (name.includes('email')) acc.email = f.string_value
      if (name.includes('phone')) acc.phone = f.string_value
      return acc
    }, {})

    // Find the organisation this campaign belongs to
    const campaign = await GoogleAdsCampaign.findOne({
      where: { campaignId: String(body.campaign_id) }
    })

    if (!campaign) {
      console.warn(`[ADS] Webhook received for unknown campaign: ${body.campaign_id}`)
      // Still return 200 to acknowledge receipt
      return success({ received: true, status: 'campaign_not_found' })
    }

    await CrmLead.create({
      organisationId: campaign.organisationId,
      leadId: body.lead_id,
      googleCampaignId: String(body.campaign_id),
      googleAdGroupId: String(body.adgroup_id),
      googleAdId: String(body.creative_id),
      gclid: body.gclid,
      name: mapped.name || 'Google Lead',
      email: mapped.email || null,
      telephone: mapped.phone || null,
      leadSource: 'Google Ads',
      leadStatus: 'New',
      inquiryDate: new Date(),
      rawData: body
    })

    return success({ received: true })
  } catch (e) {
    console.error('[ADS] Webhook handling failed:', e)
    return error(500, 'Internal server error')
  }
}

/**
 * Get Google Ads performance data for the dashboard
 * GET /api/google/ads/performance?startDate=...&endDate=...
 */
export const getAdsPerformance = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const q = getQuery(event) || {}
  const startDate = q.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = q.endDate || new Date().toISOString().split('T')[0]

  try {
    const insights = await GoogleAdsInsight.findAll({
      where: {
        organisationId: orgId,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    })

    const totals = insights.reduce((acc, row) => {
      acc.impressions += Number(row.impressions || 0)
      acc.clicks += Number(row.clicks || 0)
      acc.costMicros += Number(row.costMicros || 0)
      acc.conversions += Number(row.conversions || 0)
      acc.interactions += Number(row.interactions || 0)
      return acc
    }, { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, interactions: 0 })

    return success({
      totals,
      insights,
      startDate,
      endDate
    })
  } catch (e) {
    console.error('[ADS] Failed to get performance:', e)
    return error(500, 'Failed to fetch analytics')
  }
}

// =====================================================
// GOOGLE CALENDAR API FUNCTIONS
// =====================================================

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

const CALENDAR_REQUESTED_SCOPES = [
  GOOGLE_SCOPES.CALENDAR,
  'email',
  'profile'
].join(' ')

/**
 * Start Google Calendar OAuth flow (full calendar scope for per-dentist calendar creation)
 * GET /api/google/calendarAuthStart
 */
export const calendarAuthStart = async (event) => {
  const { clientId, redirectUri } = getGoogleConfig()
  if (!clientId || !redirectUri) {
    return error(400, 'Google OAuth not configured')
  }

  const { userId, orgId } = event.context.user || {}
  if (!userId || !orgId) {
    return error(401, 'User must be logged in to connect Google Calendar')
  }

  const stateData = {
    csrf: Math.random().toString(36).slice(2),
    userId,
    orgId,
    calendarFlow: true,
    timestamp: Date.now()
  }
  const stateToken = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  setCookie(event, 'google_calendar_oauth_state', stateToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    secure: process.env.NODE_ENV === 'production'
  })

  const calendarRedirectUri = redirectUri.replace('/callback', '/calendarCallback')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: calendarRedirectUri,
    response_type: 'code',
    scope: CALENDAR_REQUESTED_SCOPES,
    state: stateToken,
    access_type: 'offline',
    prompt: 'consent'
  })

  return success({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` })
}

/**
 * Handle Google Calendar OAuth callback
 * GET /api/google/calendarCallback
 */
export const calendarAuthCallback = async (event) => {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig()
  const calendarRedirectUri = redirectUri.replace('/callback', '/calendarCallback')

  const q = getQuery(event)
  const { code, state, error: oauthError } = q

  if (oauthError) {
    return sendRedirect(event, `/crm?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) {
    return error(400, 'Missing authorization code')
  }

  const stateCookie = getCookie(event, 'google_calendar_oauth_state')
  if (!state || !stateCookie || state !== stateCookie) {
    return error(401, 'Invalid state - CSRF check failed')
  }

  let userId, orgId
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = stateData.userId
    orgId = stateData.orgId
    if (Date.now() - stateData.timestamp > 600000) throw new Error('State expired')
  } catch (e) {
    return error(401, 'Invalid state data')
  }

  setCookie(event, 'google_calendar_oauth_state', '', { maxAge: -1 })

  try {
    const tokenResponse = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri: calendarRedirectUri
    })

    if (!tokenResponse.access_token) {
      return sendRedirect(event, '/crm?error=Failed+to+get+access+token')
    }

    const grantedScopes = parseGrantedScopes(tokenResponse.scope)
    const userInfo = await fetchUserInfo(tokenResponse.access_token)

    const existing = await GoogleOAuthToken.findOne({
      where: { organisationId: orgId, status: 'Active' }
    })

    const accessTokenEnc = encrypt(tokenResponse.access_token)
    const refreshTokenEnc = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null
    const expiresIn = Number(tokenResponse.expires_in || 0)
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    if (existing) {
      const mergedScopes = [...new Set([...(existing.scopes || []), ...grantedScopes])]
      existing.accessTokenEnc = accessTokenEnc
      if (refreshTokenEnc) existing.refreshTokenEnc = refreshTokenEnc
      existing.scopes = mergedScopes
      existing.expiresAt = expiresAt
      existing.googleAccountEmail = userInfo?.email || existing.googleAccountEmail
      existing.googleAccountId = userInfo?.id || existing.googleAccountId
      existing.status = 'Active'
      existing.connectedAt = new Date()
      await existing.save()
    } else {
      await GoogleOAuthToken.create({
        organisationId: orgId,
        userId,
        googleAccountId: userInfo?.id || null,
        googleAccountEmail: userInfo?.email || null,
        accessTokenEnc,
        refreshTokenEnc,
        scopes: grantedScopes,
        expiresAt,
        status: 'Active',
        connectedAt: new Date()
      })
    }

    return sendRedirect(event, '/crm?google_calendar=connected')
  } catch (e) {
    console.error('[GOOGLE][CALENDAR][AUTH] Callback error:', e)
    return sendRedirect(event, `/crm?error=${encodeURIComponent(e?.message || 'Calendar connection failed')}`)
  }
}

/**
 * Get Google Calendar connection status
 * GET /api/google/calendarConnection
 */
export const calendarConnectionStatus = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const token = await GoogleOAuthToken.findOne({
    where: { organisationId: orgId, status: 'Active' },
    attributes: ['id', 'googleAccountEmail', 'scopes', 'connectedAt', 'expiresAt']
  })

  if (!token || !token.hasCalendarScope()) {
    return success({ connected: false })
  }

  return success({
    connected: true,
    email: token.googleAccountEmail,
    connectedAt: token.connectedAt
  })
}

/**
 * Disconnect Google Calendar.
 * Removes calendar scope from token, cleans up per-dentist calendar mappings.
 * POST /api/google/calendarDisconnect
 */
export const calendarDisconnect = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const token = await GoogleOAuthToken.findOne({
    where: { organisationId: orgId, status: 'Active' }
  })

  if (!token) return success({ disconnected: true })

  const otherScopes = (token.scopes || []).filter(s => s !== GOOGLE_SCOPES.CALENDAR)

  if (otherScopes.length === 0) {
    token.status = 'Revoked'
  } else {
    token.scopes = otherScopes
  }

  await token.save()

  // Clean up per-dentist calendar mappings and event mappings for this org
  await DiaryDentistGoogleCalendar.destroy({ where: { organisationId: orgId } })
  await DiaryGoogleCalendarEvent.destroy({ where: { organisationId: orgId } })

  return success({ disconnected: true })
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Get a valid access token for the org that has calendar scope, or null if not connected.
 */
async function getCalendarToken(orgId) {
  const token = await GoogleOAuthToken.findOne({
    where: { organisationId: orgId, status: 'Active' }
  })
  if (!token || !token.hasCalendarScope()) return null
  return token
}

/**
 * Get the Google Calendar ID for a dentist, creating a dedicated sub-calendar if needed.
 * Returns the googleCalendarId string, or 'primary' on any failure.
 */
async function getOrCreateDentistCalendar(accessToken, orgId, dentistId, dentistName) {
  try {
    // Check if we already created a calendar for this dentist
    const existing = await DiaryDentistGoogleCalendar.findOne({
      where: { organisationId: orgId, dentistId }
    })
    if (existing) return existing.googleCalendarId

    // Create a new secondary calendar under the connected Google account
    const calendarName = dentistName ? `${dentistName} — Flossly` : `Dentist ${dentistId} — Flossly`

    const created = await $fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: { summary: calendarName }
    })

    await DiaryDentistGoogleCalendar.create({
      organisationId: orgId,
      dentistId,
      googleCalendarId: created.id,
      calendarName
    })

    console.log(`[GOOGLE][CALENDAR] Created sub-calendar "${calendarName}" → ${created.id}`)
    return created.id

  } catch (e) {
    console.error(`[GOOGLE][CALENDAR] Failed to get/create dentist calendar for dentist ${dentistId}:`, e?.message || e)
    return 'primary' // Graceful fallback — event still syncs, just to main calendar
  }
}

/**
 * Sync a diary appointment to Google Calendar.
 * Fire-and-forget — never throws to the caller.
 *
 * @param {'create'|'update'|'delete'} action
 * @param {object} appt  { id, organisationId, dentistId, dentistName, startTime, endTime, patient, treatmentName, notes, status }
 */
export async function syncAppointmentToCalendar(action, appt) {
  const orgId = appt.organisationId
  if (!orgId) return

  try {
    const token = await getCalendarToken(orgId)
    if (!token) return

    const accessToken = await getValidAccessToken(token)
    const tz = useRuntimeConfig().CLINIC_TIMEZONE || 'Europe/London'

    if (action === 'create' || action === 'update') {
      const eventBody = buildCalendarEvent(appt, tz)

      if (action === 'create') {
        const calendarId = await getOrCreateDentistCalendar(
          accessToken, orgId, appt.dentistId, appt.dentistName
        )

        const created = await $fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: eventBody
        })

        // Upsert mapping
        const existingMapping = await DiaryGoogleCalendarEvent.findOne({
          where: { organisationId: orgId, appointmentId: appt.id }
        })
        if (existingMapping) {
          existingMapping.googleCalendarId = calendarId
          existingMapping.googleEventId = created.id
          await existingMapping.save()
        } else {
          await DiaryGoogleCalendarEvent.create({
            organisationId: orgId,
            appointmentId: appt.id,
            googleCalendarId: calendarId,
            googleEventId: created.id
          })
        }

      } else {
        // update — use stored calendarId so we update the right sub-calendar
        const mapping = await DiaryGoogleCalendarEvent.findOne({
          where: { organisationId: orgId, appointmentId: appt.id }
        })
        if (!mapping) return

        await $fetch(
          `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(mapping.googleCalendarId)}/events/${mapping.googleEventId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: buildCalendarEvent(appt, tz)
          }
        )
      }

    } else if (action === 'delete') {
      const mapping = await DiaryGoogleCalendarEvent.findOne({
        where: { organisationId: orgId, appointmentId: appt.id }
      })
      if (!mapping) return

      await $fetch(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(mapping.googleCalendarId)}/events/${mapping.googleEventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      ).catch(() => {})

      await mapping.destroy()
    }

  } catch (e) {
    console.error(`[GOOGLE][CALENDAR] sync ${action} failed for appt ${appt.id}:`, e?.message || e)
  }
}

function buildCalendarEvent(appt, tz = 'Europe/London') {
  const title = [appt.patient || appt.patientName, appt.treatmentName]
    .filter(Boolean)
    .join(' — ') || 'Appointment'

  const start = appt.startTime instanceof Date ? appt.startTime : new Date(appt.startTime)
  const end = appt.endTime instanceof Date ? appt.endTime : new Date(appt.endTime)

  const description = [
    appt.dentistName ? `Dentist: ${appt.dentistName}` : null,
    appt.treatmentName ? `Treatment: ${appt.treatmentName}` : null,
    appt.notes ? `Notes: ${appt.notes}` : null,
    `Status: ${appt.status || 'Pending'}`
  ].filter(Boolean).join('\n')

  return {
    summary: title,
    description,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz }
  }
}
