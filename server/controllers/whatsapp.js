import { Op } from 'sequelize'
import { CrmLead, MetaWhatsAppConfig, CrmWhatsAppMessageLog } from '../models'
import { decrypt } from '../utils/crypto'
import { uploadBufferFile } from '../utils/storage'
import { normalizeWhatsAppNumber, logWhatsAppMessage } from '../utils/whatsapp'
import { success, error } from '../utils/response'

const META_VERSION = 'v24.0'

const inferExtension = (mimeType = '') => {
  const lower = String(mimeType || '').toLowerCase()
  if (lower.includes('jpeg')) return '.jpg'
  if (lower.includes('png')) return '.png'
  if (lower.includes('gif')) return '.gif'
  if (lower.includes('mp4')) return '.mp4'
  if (lower.includes('mpeg')) return '.mpeg'
  if (lower.includes('mp3')) return '.mp3'
  if (lower.includes('pdf')) return '.pdf'
  return ''
}

const buildAttachmentFilename = ({ originalName, mimeType }) => {
  const base = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  if (originalName && originalName.includes('.')) return originalName
  const ext = inferExtension(mimeType)
  return `${base}${ext}`
}

const fetchMetaMediaUrl = async ({ mediaId, accessToken }) => {
  if (!mediaId || !accessToken) return null
  const resp = await $fetch(`https://graph.facebook.com/${META_VERSION}/${mediaId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp?.url || null
}

const downloadMetaMediaToS3 = async ({ mediaId, accessToken, mimeType, filename }) => {
  const url = await fetchMetaMediaUrl({ mediaId, accessToken })
  if (!url) return null
  const data = await $fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'arrayBuffer',
  })
  const fileName = buildAttachmentFilename({ originalName: filename, mimeType })
  const s3Path = await uploadBufferFile({
    data: Buffer.from(data),
    filename: fileName,
    contentType: mimeType || undefined,
    baseDir: 'chat-attachments',
  })
  return s3Path
}

const extractInboundAttachments = async ({ msg, accessToken }) => {
  const msgType = String(msg?.type || '').toLowerCase()
  const supported = ['image', 'video', 'audio', 'document', 'sticker']
  if (!supported.includes(msgType)) return null
  const media = msg?.[msgType] || {}
  const mediaId = media?.id || null
  const mimeType = media?.mime_type || null
  const name = media?.filename || null
  if (!mediaId) return null
  const s3Url = await downloadMetaMediaToS3({ mediaId, accessToken, mimeType, filename: name })
  if (!s3Url) return null
  return [{
    url: s3Url,
    type: msgType === 'sticker' ? 'image' : msgType,
    mimeType: mimeType || null,
    name: name || null,
  }]
}

const resolveConfigByPhoneNumberId = async (phoneNumberId) => {
  if (!phoneNumberId) return null
  return await MetaWhatsAppConfig.findOne({
    where: { phoneNumberId: String(phoneNumberId).trim(), status: 'Active' },
  })
}

const resolveConfigByWabaId = async (wabaId) => {
  if (!wabaId) return null
  return await MetaWhatsAppConfig.findOne({
    where: { wabaId: String(wabaId).trim(), status: 'Active' },
  })
}

const resolveConfigFromPayload = async (payload) => {
  const metadata = payload?.metadata || {}
  const phoneNumberId = metadata.phone_number_id || metadata.phoneNumberId
  const wabaId = payload?.waba_id || payload?.wabaId
  if (phoneNumberId) {
    const byPhone = await resolveConfigByPhoneNumberId(phoneNumberId)
    if (byPhone) return byPhone
  }
  if (wabaId) {
    const byWaba = await resolveConfigByWabaId(wabaId)
    if (byWaba) return byWaba
  }
  return null
}

const findLeadByPhone = async (orgId, phoneDigits) => {
  if (!orgId || !phoneDigits) return null
  const last6 = phoneDigits.slice(-6)
  const candidates = await CrmLead.findAll({
    where: {
      organisationId: Number(orgId),
      telephone: { [Op.ne]: null, [Op.like]: `%${last6}%` },
    },
    limit: 25,
  })
  for (const lead of candidates) {
    const leadDigits = normalizeWhatsAppNumber(lead.telephone)
    if (!leadDigits) continue
    if (leadDigits === phoneDigits) return lead
    if (leadDigits.endsWith(phoneDigits) || phoneDigits.endsWith(leadDigits)) return lead
  }
  return null
}

const updateLeadWhatsAppMeta = async (lead, updates = {}) => {
  const raw = lead.rawData || {}
  const existing = raw.whatsapp || {}
  lead.rawData = {
    ...raw,
    whatsapp: {
      ...existing,
      ...updates,
    },
  }
  if (!lead.telephone && updates.lastInboundFrom) {
    lead.telephone = updates.lastInboundFrom
  }
  await lead.save()
}

const getMessageContent = (msg) => {
  if (!msg || typeof msg !== 'object') return ''
  if (typeof msg?.text?.body === 'string') return msg.text.body
  if (typeof msg?.text === 'string') return msg.text
  if (typeof msg?.message?.body === 'string') return msg.message.body
  if (typeof msg?.button?.text === 'string') return msg.button.text
  if (typeof msg?.interactive?.button_reply?.title === 'string') return msg.interactive.button_reply.title
  if (typeof msg?.interactive?.list_reply?.title === 'string') return msg.interactive.list_reply.title
  return ''
}

const updateMessageStatus = async ({ providerMessageId, status }) => {
  if (!providerMessageId) return
  try {
    await CrmWhatsAppMessageLog.update(
      { status: String(status || '').toLowerCase() || 'sent' },
      { where: { providerMessageId: String(providerMessageId) } }
    )
  } catch {
    // ignore status update failures
  }
}

const matchesVerifyToken = async (verifyToken) => {
  const config = useRuntimeConfig()
  const expectedEnv =
    config.META_WA_VERIFY_TOKEN ||
    config.WHATSAPP_VERIFY_TOKEN ||
    process.env.META_WA_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    ''
  if (expectedEnv && String(expectedEnv).trim() === String(verifyToken || '').trim()) return true

  const rows = await MetaWhatsAppConfig.findAll({
    where: { verifyTokenEnc: { [Op.ne]: null }, status: 'Active' },
    limit: 50,
  })
  for (const row of rows) {
    const candidate = decrypt(row.verifyTokenEnc)
    if (candidate && String(candidate).trim() === String(verifyToken || '').trim()) {
      return true
    }
  }
  return false
}

export const webhook = async (event) => {
  if (getMethod(event) === 'HEAD') {
    return send(event, 'ok')
  }

  if (getMethod(event) === 'GET') {
    const q = getQuery(event)
    const verifyToken = String(q['hub.verify_token'] || '').trim()
    const mode = q['hub.mode']
    const challenge = q['hub.challenge'] || ''
    if (mode === 'subscribe' && verifyToken && await matchesVerifyToken(verifyToken)) {
      return send(event, challenge)
    }
    return error(403, 'Verification failed')
  }

  if (getMethod(event) === 'POST') {
    const body = await readBody(event)
    const entries = Array.isArray(body?.entry) ? body.entry : []

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : []
      for (const change of changes) {
        if (change?.field !== 'messages') continue
        const value = change?.value || {}
        const config = await resolveConfigFromPayload(value)
        if (!config) continue

        const orgId = config.organisationId
        const messages = Array.isArray(value?.messages) ? value.messages : []
        const statuses = Array.isArray(value?.statuses) ? value.statuses : []

        for (const msg of messages) {
          const fromDigits = normalizeWhatsAppNumber(msg?.from)
          if (!fromDigits) continue
          const lead = await findLeadByPhone(orgId, fromDigits)
          if (!lead) continue
          const content = getMessageContent(msg)
          const accessToken = config?.accessTokenEnc ? decrypt(config.accessTokenEnc) : null
          const attachments = await extractInboundAttachments({ msg, accessToken })
          const msgType = String(msg?.type || '').toLowerCase() || (attachments?.length ? attachments[0].type : 'text')
          await updateLeadWhatsAppMeta(lead, {
            lastInboundAt: new Date(Number(msg?.timestamp || Date.now()) * 1000 || Date.now()).toISOString(),
            lastInboundFrom: fromDigits,
            lastInboundMessageId: msg?.id || null,
            lastMessageAt: new Date().toISOString(),
          })
          await logWhatsAppMessage({
            organisationId: orgId,
            leadId: lead.id,
            to: fromDigits,
            direction: 'inbound',
            type: msgType || 'text',
            status: 'received',
            providerMessageId: msg?.id || null,
            content,
            attachments,
          })
        }

        for (const st of statuses) {
          const toDigits = normalizeWhatsAppNumber(st?.recipient_id)
          const lead = toDigits ? await findLeadByPhone(orgId, toDigits) : null
          if (!lead) continue
          await updateLeadWhatsAppMeta(lead, {
            lastStatus: {
              id: st?.id || null,
              status: st?.status || null,
              timestamp: st?.timestamp || null,
            },
            lastMessageAt: new Date().toISOString(),
          })
          await updateMessageStatus({ providerMessageId: st?.id, status: st?.status })
        }
      }
    }

    return success({ received: true })
  }

  return success('ok')
}
