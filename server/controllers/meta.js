import { Op, fn, col } from 'sequelize'
import crypto from 'crypto'
import { CrmLead, MetaPage, Organisation, User, UserOrganisation, MetaUserToken, MetaWhatsAppConfig, MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight, CrmDmAccount, CrmDmConversation, CrmDmMessage, OrganisationTreatment } from '../models'
import { encrypt, decrypt } from '../utils/crypto'
import { success, error } from '../utils/response'
import { addMetaClient, broadcastMetaEvent } from '../utils/metaStream'
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification'
import { parseJsonBody } from "../utils/body"
import { chat, generateAutoReply } from '../utils/aiWrapper'
import {
  runStructureSync,
  runInsightsSync,
  enqueueStructureSync,
  enqueueInsightsSync,
  getStructureSyncStatus,
  getInsightsSyncStatus,
} from '../utils/metaSync.js'
import {
  normalizeMetaApiAttachments,
  normalizeWebhookAttachments,
  deriveAttachmentPreview,
  resolveDmParticipantProfile,
} from '../utils/dmAttachments.js'
import { normalizeMetaVideoPermalink } from '../utils/metaVideo.js'

const META_VERSION = 'v24.0'
const STANDARD_MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000
const META_SUBSCRIBED_FIELDS = 'leadgen,messages,messaging_postbacks'

const normalizeBaseUrl = (value = '') => String(value || '').replace(/\/+$/, '')

const getRedirectUri = (config) => {
  const baseUrl = normalizeBaseUrl(config.public?.BASE_URL || '')
  return (
    config.META_REDIRECT_URI ||
    (baseUrl ? `${baseUrl}/api/meta/callback` : '')
  )
}

const getIgRedirectUri = (config) => {
  const baseUrl = normalizeBaseUrl(config.public?.BASE_URL || '')
  return (
    config.META_IG_REDIRECT_URI ||
    (baseUrl ? `${baseUrl}/api/meta/igCallback` : '')
  )
}

const upsertDmAccount = async ({ organisationId, connectedByUserId, platform, accountId, accountName, accessToken, tokenExpiresAt, metadata }) => {
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

const getLatestInboundMessageAt = async ({ organisationId, conversationId }) => {
  const lastInbound = await CrmDmMessage.findOne({
    where: {
      organisationId,
      conversationId,
      direction: 'inbound',
    },
    order: [['createdAt', 'DESC']],
  });
  return lastInbound?.createdAt || null;
};

const isWithinStandardMessagingWindow = (lastInboundAt) => {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() <= STANDARD_MESSAGING_WINDOW_MS;
};

const sendMetaMessage = async ({ accessToken, senderId, recipientId, message, messagingType = 'RESPONSE', tag = null }) => {
  const targetNode = encodeURIComponent(String(senderId || 'me'));
  const url = `https://graph.facebook.com/${META_VERSION}/${targetNode}/messages`;
  const body = {
    recipient: { id: recipientId },
    messaging_type: messagingType,
    message: { text: message },
  };
  if (tag) body.tag = tag;
  return await $fetch(url, {
    method: 'POST',
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const sendAutoReply = async ({ orgId, conversation, messageText, accessToken, senderId, recipientId }) => {
  try {
    const org = await Organisation.findOne({
      where: { id: orgId },
      attributes: ['name', 'type', 'autoReplyEnabled', 'autoReplyConfig'],
    });

    if (!org || !org.autoReplyEnabled) return;
    if (conversation.autoReplyEnabled !== true) return;
    if (conversation.autoReplyDisabledUntil && new Date() < conversation.autoReplyDisabledUntil) return;
    if (conversation.autoReplyDisabledUntil && new Date() >= conversation.autoReplyDisabledUntil) {
      conversation.autoReplyEnabled = true;
      conversation.autoReplyDisabledUntil = null;
      await conversation.save();
    }

    const config = org.autoReplyConfig || {};

    const treatments = await OrganisationTreatment.findAll({
      where: { organisationId: orgId, active: true },
      attributes: ['name', 'category'],
      limit: 20,
    });

    const recentMessages = await CrmDmMessage.findAll({
      where: { organisationId: orgId, conversationId: conversation.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const conversationHistory = recentMessages
      .slice()
      .reverse()
      .filter(m => m.direction === 'inbound' || m.metadata?.autoReply)
      .map(m => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.message,
      }));

    console.log(`[Meta AutoReply] Conversation history: ${conversationHistory.length} messages for org ${orgId}`);

    const { reply: replyText } = await generateAutoReply({
      organisationName: org.name,
      organisationType: org.type,
      message: messageText,
      history: conversationHistory,
      autoReplyConfig: config,
    });

    if (!replyText) return;

    let resolvedAccessToken = accessToken;
    let resolvedSenderId = String(conversation.accountId || senderId || 'me');

    if (conversation.platform === 'instagram') {
      try {
        const metaPage = await MetaPage.findOne({
          where: { organisationId: orgId, status: 'Active' },
          order: [['updatedAt', 'DESC']],
        });
        if (metaPage?.accessTokenEnc) resolvedAccessToken = decrypt(metaPage.accessTokenEnc);
        if (metaPage?.pageId) resolvedSenderId = String(metaPage.pageId);
      } catch {}
    }

    const lastInboundAt = await getLatestInboundMessageAt({
      organisationId: orgId,
      conversationId: conversation.id,
    });

    if (!isWithinStandardMessagingWindow(lastInboundAt)) {
      console.warn(`[Meta AutoReply] Blocked for org ${orgId}: outside 24-hour messaging window`);
      return;
    }

    await sendMetaMessage({
      accessToken: resolvedAccessToken,
      senderId: resolvedSenderId,
      recipientId: String(conversation.threadId),
      message: replyText,
      messagingType: 'RESPONSE',
    });

    await CrmDmMessage.create({
      organisationId: orgId,
      conversationId: conversation.id,
      platform: conversation.platform,
      platformMessageId: null,
      direction: 'outbound',
      senderName: 'Flossly',
      message: replyText,
      attachments: null,
      status: 'sent',
      metadata: { autoReply: true },
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    broadcastMetaEvent('dm', {
      orgId,
      conversationId: conversation.id,
      platform: conversation.platform,
    });

    console.log(`[Meta AutoReply] Sent auto-reply for org ${orgId}: ${replyText.slice(0, 50)}...`);
  } catch (err) {
    console.error(`[Meta AutoReply] Failed for org ${orgId}:`, err?.message || err);
  }
};

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

    // Fire-and-forget backfills so OAuth callback can redirect quickly
    // and avoid upstream (nginx) gateway timeouts.
    void fetchLeadsForOrg(orgId, { days: 30 }).catch(() => {})
    void fetchDmHistoryForOrg(orgId, {
      days: 30,
      platforms: ['messenger', 'instagram'],
    }).catch(() => {})

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

const fetchDmHistoryForOrg = async (
  orgId,
  {
    days = 30,
    maxThreads = 60,
    maxMessagesPerThread = 120,
    platforms = ['messenger', 'instagram'],
    debugEnabled = false,
    traceEnabled = false,
  } = {}
) => {
  if (!orgId) return { ok: false, error: 'Unauthenticated' }

  const lookbackSinceDate = Number.isFinite(days) && days > 0
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    : null

  const accounts = await CrmDmAccount.findAll({
    where: {
      organisationId: orgId,
      status: 'Active',
      platform: { [Op.in]: platforms },
    },
    order: [['updatedAt', 'DESC']],
  })

  const debug = {
    orgId: Number(orgId),
    days,
    accounts: accounts.length,
    conversationsScanned: 0,
    conversationsUpserted: 0,
    messagesScanned: 0,
    messagesImported: 0,
    accountSummaries: [],
    errors: [],
  }
  const trace = () => {}

  let conversationsUpserted = 0
  let messagesImported = 0

  for (const acc of accounts) {
    const platform = String(acc.platform || '').toLowerCase()
    const accountId = String(acc.accountId || '')
    const accountMeta = acc?.metadata || {}
    const lastSyncedAtRaw = accountMeta?.lastSyncedAt || null
    const lastSyncedAt = lastSyncedAtRaw ? new Date(lastSyncedAtRaw) : null
    const hasLastSyncedAt = !!(lastSyncedAt && !Number.isNaN(lastSyncedAt.getTime()))
    // If an explicit lookback window is requested (e.g. days=30), honor it.
    // Only fall back to lastSyncedAt when no explicit lookback is provided.
    const effectiveSinceDate = lookbackSinceDate || (hasLastSyncedAt ? lastSyncedAt : null)
    // For messenger: accountId IS the page ID. For instagram: pageId is stored in metadata.
    let pageIdFromMeta = String(accountMeta?.pageId || '')
    if (platform === 'messenger' && !pageIdFromMeta) {
      pageIdFromMeta = accountId
    }
    if (!pageIdFromMeta) {
      const fallbackPage = await MetaPage.findOne({
        where: { organisationId: orgId, status: 'Active' },
        order: [['updatedAt', 'DESC']],
      })
      pageIdFromMeta = String(fallbackPage?.pageId || '')
    }
    const accessToken = acc.accessTokenEnc ? decrypt(acc.accessTokenEnc) : null
    if (!accountId) continue

    // Always prefer the freshest page access token from MetaPage table over the
    // potentially stale token stored in CrmDmAccount at connection time.
    let pageAccessToken = accessToken || ''
    if (pageIdFromMeta) {
      try {
        const pageRow = await MetaPage.findOne({
          where: { organisationId: orgId, pageId: pageIdFromMeta, status: 'Active' },
        })
        if (pageRow?.accessTokenEnc) {
          pageAccessToken = decrypt(pageRow.accessTokenEnc) || pageAccessToken
        }
      } catch {}
    }
    if (!pageAccessToken) continue

    const selfIds = new Set([accountId])
    if (pageIdFromMeta) selfIds.add(pageIdFromMeta)
    const platformParam = platform === 'instagram' ? 'instagram' : 'messenger'
    // Both platforms use /{page-id}/conversations?platform=<platform> with a page access token.
    const nodeCandidates = platform === 'instagram'
      ? [...new Set([String(pageIdFromMeta || '')].filter(Boolean))]
      : [...new Set([String(pageIdFromMeta || accountId)].filter(Boolean))]
    const accountDebug = {
      platform,
      accountId,
      pageId: pageIdFromMeta || null,
      since: effectiveSinceDate ? effectiveSinceDate.toISOString() : null,
      nodeCandidates,
      nodesTried: [],
      conversationsSeen: 0,
      conversationsUpserted: 0,
      messagesImported: 0,
      errors: [],
    }
    debug.accountSummaries.push(accountDebug)
    const processedConversationIds = new Set()
    let processedThreads = 0

    for (const conversationNodeId of nodeCandidates) {
      if (processedThreads >= maxThreads) break
      const nodeDebug = {
        conversationNodeId,
        pagesFetched: 0,
        conversationsSeen: 0,
        messagesImported: 0,
        errors: [],
      }
      accountDebug.nodesTried.push(nodeDebug)
      const conversationPageSize = platform === 'instagram' ? 50 : 25
      const tokenForNode = pageAccessToken
      // Avoid API-level since filtering here to prevent missing conversations on some Messenger accounts.
      // We still apply effectiveSinceDate filtering in-process and at message fetch level.
      let nextConversationsUrl = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(conversationNodeId)}/conversations?platform=${encodeURIComponent(platformParam)}&fields=id,updated_time,participants.limit(10){id,name,username,profile_pic}&limit=${conversationPageSize}&access_token=${encodeURIComponent(tokenForNode)}`
      trace('list_conversations:start', JSON.stringify({
        orgId: Number(orgId),
        platform,
        accountId,
        conversationNodeId,
        conversationPageSize,
      }))

      while (nextConversationsUrl && processedThreads < maxThreads) {
        let convResp = null
        try {
          convResp = await $fetch(nextConversationsUrl, { method: 'GET' })
        } catch (e) {
          const errorMessage = e?.data?.error?.message || e?.message || 'Failed to fetch conversations'
          const errorCode = e?.data?.error?.code || null
          const errorSubcode = e?.data?.error?.error_subcode || null
          const fbtraceId = e?.data?.error?.fbtrace_id || null
          debug.errors.push({
            platform,
            accountId,
            conversationNodeId,
            stage: 'list_conversations',
            message: errorMessage,
            code: errorCode,
            subcode: errorSubcode,
            fbtraceId,
          })
          nodeDebug.errors.push({
            stage: 'list_conversations',
            message: errorMessage,
            code: errorCode,
            subcode: errorSubcode,
            fbtraceId,
          })
          accountDebug.errors.push({
            conversationNodeId,
            stage: 'list_conversations',
            message: errorMessage,
            code: errorCode,
            subcode: errorSubcode,
            fbtraceId,
          })
          trace('list_conversations:error', JSON.stringify({
            platform,
            accountId,
            conversationNodeId,
            message: errorMessage,
            code: errorCode,
            subcode: errorSubcode,
            fbtraceId,
          }))
          break
        }

        nodeDebug.pagesFetched += 1
        const convItems = Array.isArray(convResp?.data) ? convResp.data : []
        if (!convItems.length) break

        for (const conv of convItems) {
          if (processedThreads >= maxThreads) break
          const convId = String(conv?.id || '')
          if (convId && processedConversationIds.has(convId)) continue
          if (convId) processedConversationIds.add(convId)

          processedThreads += 1
          debug.conversationsScanned += 1
          accountDebug.conversationsSeen += 1
          nodeDebug.conversationsSeen += 1

          const convUpdated = conv?.updated_time ? new Date(conv.updated_time) : null
          if (effectiveSinceDate && convUpdated && !Number.isNaN(convUpdated.getTime()) && convUpdated < effectiveSinceDate) {
            continue
          }

          const participants = Array.isArray(conv?.participants?.data) ? conv.participants.data : []
          const otherParticipant = participants.find((p) => p?.id && !selfIds.has(String(p.id))) || participants[0] || null
          const threadId = String(otherParticipant?.id || conv?.id || '')
          if (!threadId) continue

          let conversation = await CrmDmConversation.findOne({
            where: { organisationId: orgId, platform, threadId },
          })

          const participantNameFromApi = otherParticipant?.name || otherParticipant?.username || null
          const participantAvatarFromApi = otherParticipant?.profile_pic || null

          if (!conversation) {
            conversation = await CrmDmConversation.create({
              organisationId: orgId,
              platform,
              accountId,
              threadId,
              participantName: participantNameFromApi || threadId,
              participantAvatar: participantAvatarFromApi || null,
              lastMessageAt: convUpdated && !Number.isNaN(convUpdated.getTime()) ? convUpdated : new Date(),
              unreadCount: 0,
              metadata: {
                inboxConversationId: conv?.id || null,
                participantName: participantNameFromApi || threadId,
                participantAvatar: participantAvatarFromApi || null,
                assignedUserId: acc.connectedByUserId || null,
                sourceNodeId: conversationNodeId,
              },
            })
            conversationsUpserted += 1
            debug.conversationsUpserted += 1
            accountDebug.conversationsUpserted += 1
          } else {
            // Only overwrite name/avatar if the current value is missing or is a raw numeric ID
            const currentNameIsRaw = /^\d{10,}$/.test(String(conversation.participantName || '').trim())
            const nextName = (!conversation.participantName || currentNameIsRaw)
              ? (participantNameFromApi || conversation.participantName || threadId)
              : conversation.participantName
            const nextAvatar = conversation.participantAvatar || participantAvatarFromApi || null
            conversation.participantName = nextName
            conversation.participantAvatar = nextAvatar
            if (convUpdated && !Number.isNaN(convUpdated.getTime())) {
              conversation.lastMessageAt = convUpdated
            }
            conversation.metadata = {
              ...(conversation.metadata || {}),
              inboxConversationId: conv?.id || conversation?.metadata?.inboxConversationId || null,
              participantName: nextName,
              participantAvatar: nextAvatar,
              assignedUserId: conversation?.metadata?.assignedUserId || acc.connectedByUserId || null,
              sourceNodeId: conversationNodeId,
            }
            await conversation.save()
          }

          // If name or avatar is still missing/raw after the upsert, fire an async profile
          // refresh using the Meta Graph API (doesn't block the sync loop).
          const nameStillRaw = /^\d{10,}$/.test(String(conversation.participantName || '').trim())
          const needsProfileFetch = nameStillRaw || !conversation.participantAvatar
          if (needsProfileFetch && pageAccessToken) {
            ;(async () => {
              try {
                const profile = await resolveDmParticipantProfile({
                  platform,
                  senderId: threadId,
                  accessToken: pageAccessToken,
                })
                if (profile?.name || profile?.avatar) {
                  conversation.participantName = profile?.name || conversation.participantName
                  conversation.participantAvatar = profile?.avatar || conversation.participantAvatar
                  conversation.metadata = {
                    ...(conversation.metadata || {}),
                    participantName: conversation.participantName,
                    participantAvatar: conversation.participantAvatar,
                    profileFetchedAt: new Date().toISOString(),
                  }
                  await conversation.save()
                }
              } catch {}
            })()
          }

          let latestImportedAt = null
          let latestInboundAt = null
          let latestImportedPreview = ''
          let latestImportedMessageId = null

          const collectMessagePage = async (messagePage) => {
            const msgItems = Array.isArray(messagePage?.data) ? messagePage.data : []
            for (const m of msgItems) {
              debug.messagesScanned += 1
              const createdAt = m?.created_time ? new Date(m.created_time) : null
              if (effectiveSinceDate && createdAt && !Number.isNaN(createdAt.getTime()) && createdAt < effectiveSinceDate) {
                continue
              }

              const fromId = String(m?.from?.id || '')
              const isOutbound = !!fromId && selfIds.has(fromId)

              // Normalise attachments from the API's field-expanded format
              const normalizedAttachments = normalizeMetaApiAttachments(m)
              const messageText = String(m?.message || '').trim()
              const hasContent = messageText || normalizedAttachments.length > 0
              if (!hasContent) continue

              const preview = deriveAttachmentPreview(normalizedAttachments, messageText) || ''

              const platformMessageId = String(m?.id || '').trim() || null
              if (platformMessageId) {
                const already = await CrmDmMessage.findOne({
                  where: {
                    organisationId: orgId,
                    conversationId: conversation.id,
                    platformMessageId,
                  },
                })
                if (already) {
                  // Upgrade placeholder records: fill in proper text + normalised attachments
                  const currentMsg = String(already.message || '').trim()
                  const hasPlaceholder = !currentMsg || currentMsg === '[Attachment]'
                  const hasNoAttachments = !already.attachments || (Array.isArray(already.attachments) && !already.attachments.length)
                  if (hasPlaceholder || hasNoAttachments) {
                    if (messageText) already.message = messageText
                    if (normalizedAttachments.length) already.attachments = normalizedAttachments
                    already.metadata = { ...(already.metadata || {}), ...(m || {}) }
                    await already.save()
                  }
                  continue
                }
              } else {
                if (createdAt && !Number.isNaN(createdAt.getTime())) {
                  const duplicate = await CrmDmMessage.findOne({
                    where: {
                      organisationId: orgId,
                      conversationId: conversation.id,
                      message: messageText || null,
                      direction: isOutbound ? 'outbound' : 'inbound',
                      createdAt,
                    },
                  })
                  if (duplicate) continue
                }
              }

              const inserted = await CrmDmMessage.create({
                organisationId: orgId,
                conversationId: conversation.id,
                platform,
                platformMessageId,
                direction: isOutbound ? 'outbound' : 'inbound',
                senderName: m?.from?.name || m?.from?.username || conversation.participantName || threadId,
                message: messageText || null,
                attachments: normalizedAttachments.length ? normalizedAttachments : null,
                status: isOutbound ? 'sent' : 'received',
                metadata: m,
                createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
                updatedAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
              })
              messagesImported += 1
              debug.messagesImported += 1
              accountDebug.messagesImported += 1
              nodeDebug.messagesImported += 1

              const insertedAt = inserted?.createdAt ? new Date(inserted.createdAt) : (createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null)
              if (insertedAt && !Number.isNaN(insertedAt.getTime())) {
                if (!latestImportedAt || insertedAt > latestImportedAt) {
                  latestImportedAt = insertedAt
                  latestImportedPreview = preview
                  latestImportedMessageId = inserted.id
                }
                if (!isOutbound && (!latestInboundAt || insertedAt > latestInboundAt)) {
                  latestInboundAt = insertedAt
                }
              }
            }
          }

          const conversationIdForMessages = String(conv?.id || '')
          const messagePageSize = platform === 'instagram' ? 20 : 50
          const msgFields = 'id,created_time,message,from,to,attachments{id,name,image_data,video_data,file_url,mime_type},story,shares'
          const messageSinceParam = effectiveSinceDate ? `&since=${Math.floor(effectiveSinceDate.getTime() / 1000)}` : ''
          let nextMessagesUrl = conversationIdForMessages
            ? `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(conversationIdForMessages)}/messages?fields=${encodeURIComponent(msgFields)}&limit=${messagePageSize}${messageSinceParam}&access_token=${encodeURIComponent(tokenForNode)}`
            : null
          let processedMessages = 0
          while (nextMessagesUrl && processedMessages < maxMessagesPerThread) {
            let msgResp = null
            try {
              msgResp = await $fetch(nextMessagesUrl, { method: 'GET' })
            } catch (e) {
              const errorMessage = e?.data?.error?.message || e?.message || 'Failed to fetch messages'
              const errorCode = e?.data?.error?.code || null
              const errorSubcode = e?.data?.error?.error_subcode || null
              const fbtraceId = e?.data?.error?.fbtrace_id || null
              debug.errors.push({
                platform,
                accountId,
                conversationId: conv?.id || null,
                conversationNodeId,
                stage: 'list_messages',
                message: errorMessage,
                code: errorCode,
                subcode: errorSubcode,
                fbtraceId,
              })
              nodeDebug.errors.push({
                stage: 'list_messages',
                conversationId: conv?.id || null,
                message: errorMessage,
                code: errorCode,
                subcode: errorSubcode,
                fbtraceId,
              })
              accountDebug.errors.push({
                stage: 'list_messages',
                conversationId: conv?.id || null,
                message: errorMessage,
                code: errorCode,
                subcode: errorSubcode,
                fbtraceId,
              })
              trace('list_messages:error', JSON.stringify({
                platform,
                accountId,
                conversationId: conv?.id || null,
                conversationNodeId,
                message: errorMessage,
                code: errorCode,
                subcode: errorSubcode,
                fbtraceId,
              }))
              break
            }
            const count = Array.isArray(msgResp?.data) ? msgResp.data.length : 0
            if (!count) break
            processedMessages += count
            try {
              await collectMessagePage(msgResp)
            } catch (e) {
              console.error('[META DM SYNC] collectMessagePage error', {
                platform, accountId, conversationNodeId, convId: conv?.id, message: e?.message,
              })
            }
            nextMessagesUrl = msgResp?.paging?.next || null
          }

          if (latestImportedAt) {
            conversation.lastMessageAt = latestImportedAt
            conversation.metadata = {
              ...(conversation.metadata || {}),
              lastMessagePreview: String(latestImportedPreview || '').slice(0, 120),
              lastMessageId: latestImportedMessageId || conversation?.metadata?.lastMessageId || null,
              lastInboundAt: latestInboundAt
                ? latestInboundAt.toISOString()
                : conversation?.metadata?.lastInboundAt || null,
              sourceNodeId: conversationNodeId,
            }
            await conversation.save()
          }
        }

        nextConversationsUrl = convResp?.paging?.next || null
      }
    }
    // Record when this account was last successfully synced for incremental future syncs
    try {
      acc.metadata = { ...(acc.metadata || {}), lastSyncedAt: new Date().toISOString() }
      await acc.save()
    } catch {}

    trace('account:complete', JSON.stringify({
      platform,
      accountId,
      nodeCandidates,
      conversationsSeen: accountDebug.conversationsSeen,
      conversationsUpserted: accountDebug.conversationsUpserted,
      messagesImported: accountDebug.messagesImported,
      errors: accountDebug.errors.length,
    }))
  }

  if (debugEnabled) return { ok: true, debug }
  return {
    ok: true,
    conversationsUpserted,
    messagesImported,
  }
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
    })

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

export const fetchDmHistoryNow = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const q = getQuery(event) || {}
    // Optional JSON payload support (e.g. /meta/fetchDmHistory?options={...})
    // parsed through our safe parser to avoid request-shape errors.
    const options = parseJsonBody(q.options) || {}
    const days = Number(options.days ?? q.days ?? 30)
    const maxThreads = Number(options.maxThreads ?? q.maxThreads ?? 60)
    const maxMessagesPerThread = Number(options.maxMessagesPerThread ?? q.maxMessagesPerThread ?? 120)
    const debugEnabled = String(options.debug ?? q.debug ?? '').toLowerCase() === 'true'
    const traceEnabled = String(options.trace ?? q.trace ?? '').toLowerCase() === 'true'
    const platformRaw = String(options.platform ?? q.platform ?? 'all').toLowerCase()
    const platforms =
      platformRaw === 'messenger' ? ['messenger'] :
      platformRaw === 'instagram' ? ['instagram'] :
      ['messenger', 'instagram']

    const result = await fetchDmHistoryForOrg(orgId, {
      days,
      maxThreads,
      maxMessagesPerThread,
      platforms,
      debugEnabled,
      traceEnabled,
    })
    if (!result.ok) return error(400, result.error || 'Failed to sync DM history')
    if (debugEnabled) {
      return success(result.debug)
    }
    return success({
      conversationsUpserted: result.conversationsUpserted || 0,
      messagesImported: result.messagesImported || 0,
    })
  } catch (e) {
    return error(500, e?.message || 'Failed to sync DM history')
  }
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
  const requiredPermissions = [
    'pages_messaging',
    'instagram_manage_messages',
    'instagram_basic',
    'leads_retrieval',
  ]

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
    pages: results,
  })
}

export const webhook = async (event) => {
  const config = useRuntimeConfig()
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const webhookTrace = () => {}
  
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
                    organisationId: String(mp.organisationId || ''),
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
          const accountByEntryCandidates = await CrmDmAccount.findAll({
            where: { accountId: pageId, status: 'Active' },
            order: [['updatedAt', 'DESC']],
          })
          const accountByEntry = accountByEntryCandidates[0] || null
          const instagramByPageCandidates = pageId
            ? await CrmDmAccount.findAll({
                where: {
                  platform: 'instagram',
                  status: 'Active',
                  metadata: { [Op.contains]: { pageId } },
                },
                order: [['updatedAt', 'DESC']],
              })
            : []

          for (const msgEvent of messaging) {
            const senderId = String(msgEvent?.sender?.id || '')
            const recipientId = String(msgEvent?.recipient?.id || '')
            const platformHintRaw = String(msgEvent?.platform || msgEvent?.messaging_product || '').toLowerCase()
            const platformHint = platformHintRaw || null
            webhookTrace('event:incoming', JSON.stringify({
              pageId,
              senderId,
              recipientId,
              mid: msgEvent?.message?.mid || null,
              hasText: !!msgEvent?.message?.text,
              hasAttachments: Array.isArray(msgEvent?.message?.attachments) && msgEvent.message.attachments.length > 0,
              platformHint,
            }))
            if (!senderId || !recipientId) continue
            if (msgEvent?.message?.is_echo) {
              // Capture messages sent from the native Instagram/Messenger app.
              // Echo events fire when the page itself sends — sender = page, recipient = user.
              const echoMid = msgEvent?.message?.mid || null
              const echoText = String(msgEvent?.message?.text || '').trim()
              const echoAttachments = normalizeWebhookAttachments(msgEvent?.message?.attachments || null)
              if (!echoText && !echoAttachments.length) continue

              // Find the account by senderId (page/account ID in echoes).
              const echoAccount = await CrmDmAccount.findOne({
                where: { accountId: senderId, status: 'Active' },
                order: [['updatedAt', 'DESC']],
              })
              if (!echoAccount) continue

              const echoOrgId = echoAccount.organisationId
              const echoPlatform = echoAccount.platform
              const echoThreadId = recipientId
              const echoTimestamp = msgEvent?.timestamp ? new Date(msgEvent.timestamp) : new Date()

              // Skip if Flossly already tracked this message (our own outbound send).
              if (echoMid) {
                const existing = await CrmDmMessage.findOne({
                  where: { organisationId: echoOrgId, platformMessageId: echoMid },
                })
                if (existing) continue
              }

              let echoConversation = await CrmDmConversation.findOne({
                where: { organisationId: echoOrgId, platform: echoPlatform, threadId: echoThreadId },
              })
              if (!echoConversation) {
                echoConversation = await CrmDmConversation.create({
                  organisationId: echoOrgId,
                  platform: echoPlatform,
                  accountId: echoAccount.accountId,
                  threadId: echoThreadId,
                  participantName: echoThreadId,
                  lastMessageAt: echoTimestamp,
                  unreadCount: 0,
                  metadata: { recipientId: senderId },
                })
              }

              const echoPreview = deriveAttachmentPreview(echoAttachments, echoText) || ''
              await CrmDmMessage.create({
                organisationId: echoOrgId,
                conversationId: echoConversation.id,
                platform: echoPlatform,
                platformMessageId: echoMid,
                direction: 'outbound',
                senderName: 'Flossly',
                message: echoText || null,
                attachments: echoAttachments.length ? echoAttachments : null,
                status: 'sent',
                metadata: msgEvent,
                createdAt: echoTimestamp,
                updatedAt: echoTimestamp,
              })

              echoConversation.lastMessageAt = echoTimestamp
              echoConversation.metadata = {
                ...(echoConversation.metadata || {}),
                lastMessagePreview: echoPreview.slice(0, 120),
              }
              await echoConversation.save()

              broadcastMetaEvent('dm', { orgId: echoOrgId, conversationId: echoConversation.id, platform: echoPlatform })
              continue
            }

            const directMatches = await CrmDmAccount.findAll({
              where: { accountId: recipientId, status: 'Active' },
              order: [['updatedAt', 'DESC']],
            })
            const directInstagram = directMatches.filter((a) => String(a?.platform || '').toLowerCase() === 'instagram')
            const directMessenger = directMatches.filter((a) => String(a?.platform || '').toLowerCase() === 'messenger')
            webhookTrace('account:direct_matches', JSON.stringify({
              recipientId,
              count: directMatches.length,
              matches: directMatches.map((a) => ({
                id: a.id,
                orgId: a.organisationId,
                platform: a.platform,
                accountId: a.accountId,
                pageId: a?.metadata?.pageId || null,
              })),
              instagramByPageCount: instagramByPageCandidates.length,
            }))

            // Instagram webhooks can arrive with entry.pageId while recipient mapping may be ambiguous.
            // Prefer explicit instagram account matches before page-level messenger fallback.
            const looksInstagramEvent =
              platformHintRaw.includes('instagram') ||
              directInstagram.length > 0 ||
              instagramByPageCandidates.length > 0

            let account = null
            if (looksInstagramEvent) {
              const instaEntryOrgIds = new Set(instagramByPageCandidates.map((row) => Number(row.organisationId)))
              const instaSameOrg = directInstagram.find((row) => instaEntryOrgIds.has(Number(row.organisationId)))
              account =
                instaSameOrg ||
                directInstagram[0] ||
                instagramByPageCandidates[0] ||
                null
            }

            // Fallback to original mapping strategy (mostly messenger/page-level events).
            if (!account) account = directMatches[0] || null
            if (accountByEntryCandidates.length && directMatches.length) {
              const entryOrgIds = new Set(accountByEntryCandidates.map((row) => Number(row.organisationId)))
              const sameOrg = directMatches.find((row) => entryOrgIds.has(Number(row.organisationId)))
              if (sameOrg) account = sameOrg
            }
            if (!account) account = accountByEntry

            if (!account) {
              webhookTrace('account:missing', JSON.stringify({
                pageId,
                senderId,
                recipientId,
                entryMatches: accountByEntryCandidates.length,
              }))
              continue
            }
            webhookTrace('account:selected', JSON.stringify({
              accountId: account.id,
              orgId: account.organisationId,
              platform: account.platform,
              mappedAccountId: account.accountId,
              mappedPageId: account?.metadata?.pageId || null,
              looksInstagramEvent,
              directInstagramCount: directInstagram.length,
              directMessengerCount: directMessenger.length,
            }))

            const orgId = account.organisationId
            const platform = account.platform
            const threadId = senderId
            const rawAttachments = msgEvent?.message?.attachments || null
            const normalizedAttachments = normalizeWebhookAttachments(rawAttachments)
            const timestamp = msgEvent?.timestamp ? new Date(msgEvent.timestamp) : new Date()
            const accessToken = account?.accessTokenEnc ? decrypt(account.accessTokenEnc) : null

            let conversation = await CrmDmConversation.findOne({
              where: { organisationId: orgId, platform, threadId },
            })

            if (!conversation) {
              const profile = await resolveDmParticipantProfile({
                platform,
                senderId,
                accessToken,
              })
              conversation = await CrmDmConversation.create({
                organisationId: orgId,
                platform,
                accountId: account.accountId,
                threadId,
                participantName: profile?.name || senderId,
                participantAvatar: profile?.avatar || null,
                lastMessageAt: timestamp,
                unreadCount: 0,
                metadata: {
                  recipientId,
                  participantName: profile?.name || senderId,
                  participantAvatar: profile?.avatar || null,
                  assignedUserId: account.connectedByUserId || null,
                  lastInboundAt: timestamp.toISOString(),
                },
              })
            } else if (!conversation.participantName || !conversation.participantAvatar || !conversation?.metadata?.assignedUserId || /^\d{10,}$/.test(String(conversation.participantName || '').trim())) {
              const profile = await resolveDmParticipantProfile({
                platform,
                senderId,
                accessToken,
              })
              const currentNameIsRaw = /^\d{10,}$/.test(String(conversation.participantName || '').trim())
              const nextName = (!conversation.participantName || currentNameIsRaw) ? (profile?.name || conversation.participantName || senderId) : conversation.participantName
              const nextAvatar = conversation.participantAvatar || profile?.avatar || null
              conversation.participantName = nextName
              conversation.participantAvatar = nextAvatar
              conversation.metadata = {
                ...(conversation.metadata || {}),
                participantName: nextName,
                participantAvatar: nextAvatar,
                assignedUserId: conversation?.metadata?.assignedUserId || account.connectedByUserId || null,
              }
              await conversation.save()
            }

            const messageText = String(msgEvent?.message?.text || '').trim()
            const hasContent = messageText || normalizedAttachments.length > 0
            if (!hasContent) {
              webhookTrace('message:skipped_empty', JSON.stringify({
                senderId,
                recipientId,
                platform,
              }))
              continue
            }
            const messagePreview = deriveAttachmentPreview(normalizedAttachments, messageText) || ''

            const platformMessageId = msgEvent?.message?.mid || null
            if (platformMessageId) {
              const existingInbound = await CrmDmMessage.findOne({
                where: {
                  organisationId: orgId,
                  conversationId: conversation.id,
                  platformMessageId,
                },
              })
              if (existingInbound) {
                webhookTrace('message:duplicate', JSON.stringify({
                  organisationId: orgId,
                  conversationId: conversation.id,
                  platformMessageId,
                }))
                continue
              }
            }

            const newMessage = await CrmDmMessage.create({
              organisationId: orgId,
              conversationId: conversation.id,
              platform,
              platformMessageId,
              direction: 'inbound',
              senderName: conversation.participantName || senderId,
              message: messageText || null,
              attachments: normalizedAttachments.length ? normalizedAttachments : null,
              status: 'received',
              metadata: msgEvent,
              createdAt: timestamp,
              updatedAt: timestamp,
            })

            conversation.lastMessageAt = timestamp
            conversation.unreadCount = Number(conversation.unreadCount || 0) + 1
            conversation.metadata = {
              ...(conversation.metadata || {}),
              lastMessagePreview: messagePreview.slice(0, 120),
              lastMessageId: newMessage.id,
              lastInboundAt: timestamp.toISOString(),
            }
            await conversation.save()

            if (messageText && accessToken) {
              sendAutoReply({
                orgId,
                conversation,
                messageText,
                accessToken,
                senderId,
                recipientId,
              }).catch((err) => console.error('[Meta AutoReply] Error:', err?.message || err));
            }

            broadcastMetaEvent('dm', {
              orgId,
              conversationId: conversation.id,
              platform,
            })
            webhookTrace('message:stored', JSON.stringify({
              orgId,
              conversationId: conversation.id,
              platform,
              threadId,
              platformMessageId: newMessage?.platformMessageId || null,
            }))

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
                  body: messagePreview.length > 80 ? `${messagePreview.slice(0, 80)}...` : messagePreview,
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
    } catch (e) {
      try {
        console.error('[META WEBHOOK]', reqId, 'Unhandled webhook processing error', e?.message || e)
      } catch {}
    }
    
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
  try {
    const q = getQuery(event) || {}
    const where = { organisationId: orgId }

    if (q.entityType) {
      const allowedEntityTypes = new Set(['campaign', 'adset', 'ad'])
      const entityType = String(q.entityType || '').toLowerCase()
      if (allowedEntityTypes.has(entityType)) where.entityType = entityType
    }

    if (q.entityId) where.entityId = String(q.entityId)

    const parseDate = (value) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const from = parseDate(q.dateFrom)
    const to = parseDate(q.dateTo)
    if (from || to) {
      where.date = {}
      if (from) where.date[Op.gte] = from
      if (to) {
        to.setHours(23, 59, 59, 999)
        where.date[Op.lte] = to
      }
    }

    const rows = await MetaInsight.findAll({ where, order: [['date', 'DESC']] })
    return success(rows)
  } catch (err) {
    console.error('[getMetaInsights]', err)
    return error(500, 'Failed to fetch Meta insights')
  }
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

    // Validate and parse date params — reject invalid date strings immediately
    const parseDate = (val) => {
      if (!val) return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }
    const dateFromParsed = parseDate(query.dateFrom)
    const dateToParsed = parseDate(query.dateTo)

    // Build campaign WHERE clause
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

    // Platform filter: scope adSets lookup to campaigns already found (not whole org)
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

    // Filters applied but nothing matched — return empty structure early
    if (filtersActive && !campaignIds.length) {
      const adAccounts = await MetaAdAccount.findAll({ where: { organisationId: orgId } })
      return success({ campaigns: [], adAccounts, adSets: [], ads: [] })
    }

    const adSetsWhere = { organisationId: orgId }
    if (campaignIds.length) adSetsWhere.campaignId = { [Op.in]: campaignIds }

    const adSets = await MetaAdSet.findAll({ where: adSetsWhere })
    const adSetIds = adSets.map((as) => as.adSetId)

    const [adAccounts, ads] = await Promise.all([
      MetaAdAccount.findAll({ where: { organisationId: orgId } }),
      adSetIds.length ? MetaAd.findAll({ where: { organisationId: orgId, adSetId: { [Op.in]: adSetIds } } }) : Promise.resolve([]),
    ])

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

export const getVideoSource = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')

  const body = await readBody(event)
  const { videoId } = typeof body === 'string' ? JSON.parse(body) : (body || {})
  if (!videoId) return error(400, 'videoId required')
  const adRow = await MetaAd.findOne({
    where: { organisationId: orgId, videoId: String(videoId) },
    attributes: ['platform'],
    order: [['updatedAt', 'DESC']],
  })
  const adPlatform = String(adRow?.platform || '').trim()

  const fetchVideoFields = async (token) => {
    try {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(videoId)}?fields=source,permalink_url,picture&access_token=${encodeURIComponent(token)}`
      return await $fetch(url, { method: 'GET' })
    } catch {
      return null
    }
  }

  const sourceUnavailableMessage = 'Meta did not return a direct video source. Per Meta Graph API docs, page-owned video source URLs are only returned when the requesting user has a role on the owning Page.'

  // Try user token first
  const tokenRow = await MetaUserToken.findOne({ where: { organisationId: orgId } })
  if (tokenRow) {
    const userToken = decrypt(tokenRow.userTokenEnc)
    if (userToken) {
      const resp = await fetchVideoFields(userToken)
      if (resp?.source) {
        return success({
          source: resp.source,
          permalink: normalizeMetaVideoPermalink({
            permalink: resp.permalink_url,
            videoId,
            platform: adPlatform,
          }),
          thumbnail: resp.picture || null,
        })
      }
    }
  }

  // Fall back to page tokens — they often have more media permissions
  const pages = await MetaPage.findAll({ where: { organisationId: orgId } })
  for (const page of pages) {
    const pageToken = decrypt(page.accessTokenEnc)
    if (!pageToken) continue
    const resp = await fetchVideoFields(pageToken)
    const normalizedPermalink = normalizeMetaVideoPermalink({
      permalink: resp?.permalink_url,
      videoId,
      platform: adPlatform,
    })
    if (resp?.source) {
      return success({
        source: resp.source,
        permalink: normalizedPermalink,
        thumbnail: resp.picture || null,
      })
    }
    if (normalizedPermalink) {
      return success({
        source: null,
        permalink: normalizedPermalink,
        thumbnail: resp?.picture || null,
        warning: sourceUnavailableMessage,
        requiresPageRole: true,
      })
    }
  }

  return error(404, 'Video source not available — the video may require additional Meta permissions')
}

export const getAllLeadCounts = async (event) => {
  const { orgId } = event.context.user || {}
  if (!orgId) return error(401, 'Unauthenticated')
  try {
    const q = getQuery(event) || {}
    const parseDate = (value) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const dateFrom = parseDate(q.dateFrom)
    const dateTo = parseDate(q.dateTo)

    const where = {
      organisationId: orgId,
      [Op.or]: [
        { campaignId: { [Op.ne]: null } },
        { adSetId: { [Op.ne]: null } },
        { adId: { [Op.ne]: null } },
      ],
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt[Op.gte] = dateFrom
      if (dateTo) {
        dateTo.setHours(23, 59, 59, 999)
        where.createdAt[Op.lte] = dateTo
      }
    }

    const rows = await CrmLead.findAll({
      where,
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

// Meta Deauthorize Callback
export const deauthorize = async (event) => {
  try {
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body || {}
    const signedRequest = payload?.signed_request || ''
    if (!signedRequest) return error(400, 'signed_request required')

    const [sigB64, payloadB64] = String(signedRequest).split('.', 2)
    if (!sigB64 || !payloadB64) return error(400, 'Invalid signed_request')

    const config = useRuntimeConfig()
    const appSecret = config.META_APP_SECRET || process.env.META_APP_SECRET || ''
    if (!appSecret) return error(500, 'META_APP_SECRET not configured')

    const expected = crypto.createHmac('sha256', appSecret).update(payloadB64).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    if (expected !== sigB64) return error(403, 'Invalid signed_request signature')

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8') || '{}')
    const fbUserId = decoded?.user_id
    if (!fbUserId) return success({ status: 'ok' })

    await MetaUserToken.update({ expiresAt: new Date(0) }, { where: { fbUserId } })
    return success({ status: 'ok' })
  } catch (e) {
    return error(500, e?.message || 'Deauthorize failed')
  }
}

// Meta Data Deletion Request Callback
export const dataDeletion = async (event) => {
  try {
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body || {}
    const signedRequest = payload?.signed_request || ''
    if (!signedRequest) return error(400, 'signed_request required')

    const [sigB64, payloadB64] = String(signedRequest).split('.', 2)
    if (!sigB64 || !payloadB64) return error(400, 'Invalid signed_request')

    const config = useRuntimeConfig()
    const appSecret = config.META_APP_SECRET || process.env.META_APP_SECRET || ''
    if (!appSecret) return error(500, 'META_APP_SECRET not configured')

    const expected = crypto.createHmac('sha256', appSecret).update(payloadB64).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    if (expected !== sigB64) return error(403, 'Invalid signed_request signature')

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8') || '{}')
    const fbUserId = decoded?.user_id || 'unknown'

    const baseUrl = config.public?.BASE_URL || ''
    const statusUrl = `${baseUrl}/api/meta/dataDeletionStatus?request=${encodeURIComponent(fbUserId)}`

    return { url: statusUrl, confirmation_code: String(fbUserId) }
  } catch (e) {
    return error(500, e?.message || 'Data deletion failed')
  }
}

export const dataDeletionStatus = async (event) => {
  const query = getQuery(event) || {}
  const requestId = query.request || 'unknown'
  return success({ status: 'completed', request: requestId })
}
