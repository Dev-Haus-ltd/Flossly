export const normalizeWhatsAppNumber = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits
}

export const hasActiveWhatsAppWindow = (lead) => {
  const lastInboundAt = lead?.rawData?.whatsapp?.lastInboundAt
  if (!lastInboundAt) return false
  const last = new Date(lastInboundAt)
  if (Number.isNaN(last.valueOf())) return false
  const diffMs = Date.now() - last.getTime()
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
}

export const markWhatsAppOutbound = async (lead, to) => {
  const raw = lead.rawData || {}
  const existing = raw.whatsapp || {}
  lead.rawData = {
    ...raw,
    whatsapp: {
      ...existing,
      lastOutboundAt: new Date().toISOString(),
      lastOutboundTo: to || existing.lastOutboundTo || null,
    },
  }
  await lead.save()
}
