/**
 * Attachment normalization helpers for Meta DM messages.
 *
 * Meta returns attachments in two different shapes depending on the source:
 *   1. History-sync API  (/{conversation}/messages endpoint)
 *      → message.attachments = { data: [{ image_data, video_data, file_url, mime_type, ... }] }
 *      → message.story       = { link, id }
 *      → message.shares      = { data: [{ name, description, link, url, type }] }
 *
 *   2. Webhook (real-time messaging_event)
 *      → message.attachments = [{ type: 'image'|'video'|'audio'|'file', payload: { url } }]
 *
 * Both are normalised into our standard DB format:
 *   [{ type, url, name?, mimeType?, description? }]
 */

const META_VERSION = 'v24.0'

/**
 * Normalise a single raw Meta API attachment object from the history-sync endpoint.
 */
const normalizeApiAttachment = (att) => {
  if (!att) return null
  if (att.image_data?.media_url) {
    return { type: 'image', url: att.image_data.media_url, name: att.name || null }
  }
  if (att.video_data?.preview_url) {
    return { type: 'video', url: att.video_data.preview_url, name: att.name || null }
  }
  if (att.file_url) {
    const mimeType = att.mime_type || ''
    const type = mimeType.startsWith('audio/') ? 'audio' : 'file'
    return { type, url: att.file_url, name: att.name || null, mimeType: mimeType || null }
  }
  return null
}

/**
 * Normalise a full Meta API message object (history-sync endpoint) into our
 * standard attachment array.  Handles story replies, shared posts/reels, and
 * standard image/video/file/audio attachments.
 *
 * @param {object} metaMsg  - A single message object from the Graph API
 * @returns {Array<{type: string, url: string, name?: string, mimeType?: string, description?: string}>}
 */
export const normalizeMetaApiAttachments = (metaMsg) => {
  const result = []

  // Instagram story replies / mentions – expires quickly
  if (metaMsg?.story?.link) {
    result.push({ type: 'story', url: metaMsg.story.link, name: 'Story' })
  }

  // Shared posts, Reels, products
  for (const share of (metaMsg?.shares?.data ?? [])) {
    const url = share?.link || share?.url
    if (url) {
      result.push({
        type: 'share',
        url,
        name: share?.name || share?.title || 'Shared post',
        description: share?.description || null,
      })
    }
  }

  // Standard attachments (image_data / video_data / file_url)
  const attData = Array.isArray(metaMsg?.attachments?.data)
    ? metaMsg.attachments.data
    : []
  for (const att of attData) {
    const normalized = normalizeApiAttachment(att)
    if (normalized) result.push(normalized)
  }

  return result
}

/**
 * Normalise a Meta webhook message attachment array into our standard format.
 * Webhook shape: [{ type: 'image', payload: { url: '...' }, mime_type?: '...' }]
 *
 * @param {Array|null} rawAttachments - msgEvent.message.attachments from webhook payload
 * @returns {Array}
 */
export const normalizeWebhookAttachments = (rawAttachments) => {
  if (!Array.isArray(rawAttachments)) return []

  return rawAttachments.flatMap((att) => {
    const url =
      att?.payload?.url ||
      att?.payload?.attachment_url ||
      att?.payload?.link ||
      att?.url ||
      null
    if (!url) return []

    const attType = String(att?.type || '').toLowerCase()
    const mimeType = att?.mime_type || att?.mimeType || null
    const validTypes = ['image', 'video', 'audio', 'file', 'story', 'share']
    const type = validTypes.includes(attType) ? attType : 'file'

    return [{ type, url, name: att?.name || null, mimeType: mimeType || null }]
  })
}

/**
 * Derive a human-readable short preview string for use in conversation list
 * previews and last-message tracking.
 *
 * @param {Array}  normalizedAttachments
 * @param {string} messageText
 * @returns {string|null}
 */
export const deriveAttachmentPreview = (normalizedAttachments, messageText) => {
  const text = String(messageText || '').trim()
  if (text) return text

  const first = Array.isArray(normalizedAttachments) ? normalizedAttachments[0] : null
  if (!first) return null

  switch (first.type) {
    case 'image': return '📷 Photo'
    case 'video': return '📹 Video'
    case 'audio': return '🎵 Audio message'
    case 'story': return '📱 Story reply'
    case 'share': return `🔗 ${first.name || 'Shared post'}`
    default:      return `📎 ${first.name || 'Attachment'}`
  }
}

/**
 * Resolve participant profile data for a Meta DM sender.
 */
export const resolveDmParticipantProfile = async ({ platform, senderId, accessToken }) => {
  if (!senderId || !accessToken) return {}
  try {
    if (platform === 'messenger') {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(senderId)}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(accessToken)}`
      const resp = await $fetch(url, { method: 'GET' })
      const name = [resp?.first_name, resp?.last_name].filter(Boolean).join(' ').trim()
      return {
        name: name || resp?.name || null,
        avatar: resp?.profile_pic || null,
      }
    }
    if (platform === 'instagram') {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(senderId)}?fields=name,username,profile_pic&access_token=${encodeURIComponent(accessToken)}`
      const resp = await $fetch(url, { method: 'GET' })
      return {
        name: resp?.name || resp?.username || null,
        avatar: resp?.profile_pic || null,
      }
    }
  } catch {}
  return {}
}
