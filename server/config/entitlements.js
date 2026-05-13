export const TIERS = {
  LITE: 'Lite',
  CRM:  'CRM',
  PRO:  'Pro',
}

// Legacy tier names still in DB — map them to the nearest new tier
const LEGACY_MAP = {
  System: 'Pro',
  Trial:  'Lite',
  Drift:  'Lite',
  Glide:  'CRM',
  Soar:   'Pro',
}

export const ENTITLEMENTS = {
  [TIERS.LITE]: {
    taskPool:       false,
    whatsapp:       false,
    googleAds:      false,
    automation:     false,
    patientBooking: false,
    diary:          'view-only',
    limits: {
      leads:     100,
      storageMB: 1024,
      members:   3,
    },
    warnAt: 0.8,
  },
  [TIERS.CRM]: {
    taskPool:       true,
    whatsapp:       true,
    googleAds:      false,
    automation:     true,
    patientBooking: true,
    diary:          'full',
    limits: {
      leads:     Infinity,
      storageMB: Infinity,
      members:   Infinity,
    },
    warnAt: 0.8,
  },
  [TIERS.PRO]: {
    taskPool:       true,
    whatsapp:       true,
    googleAds:      true,
    automation:     true,
    patientBooking: true,
    diary:          'full',
    limits: {
      leads:     Infinity,
      storageMB: Infinity,
      members:   Infinity,
    },
    warnAt: 0.8,
  },
}

export const getEntitlements = (licenseType) => {
  const resolved = LEGACY_MAP[licenseType] ?? licenseType
  return ENTITLEMENTS[resolved] ?? ENTITLEMENTS[TIERS.LITE]
}

export const resolveTier = (licenseType) =>
  LEGACY_MAP[licenseType] ?? licenseType ?? TIERS.LITE
