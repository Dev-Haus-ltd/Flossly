export const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim())

export const normalizeMetaVideoPermalink = ({ permalink, videoId, platform }) => {
  const raw = String(permalink || '').trim()
  if (raw) {
    if (isAbsoluteUrl(raw)) return raw
    if (raw.startsWith('/')) return `https://www.facebook.com${raw}`
  }

  if (!videoId) return null
  if (String(platform || '').toLowerCase() === 'instagram') return null

  return `https://www.facebook.com/watch/?v=${encodeURIComponent(String(videoId))}`
}
