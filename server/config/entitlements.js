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
    // CRM & messaging
    metaDms:        true,   // Facebook Messenger + Instagram DMs (1 page connection)
    whatsapp:       false,  // WhatsApp Business via Whapi — CRM+ only
    automation:     false,
    googleAds:      false,
    // Tasks
    taskPool:       false,
    // Diary
    patientBooking: false,
    diary:          false,
    charting:       true,
    // Team (rota, holiday tracker available on all tiers)
    rota:           true,
    holidayTracker: true,
    // Lead forms — 1 active form on Lite, unlimited on CRM+
    leadForms:      true,
    limits: {
      leads:     100,
      storageMB: 1024,
      members:   3,
      forms:     1,
    },
    warnAt: 0.8,
  },
  [TIERS.CRM]: {
    metaDms:        true,
    whatsapp:       true,
    automation:     true,
    googleAds:      false,
    taskPool:       true,
    patientBooking: false, // Patients + Finance diary sections are Pro only
    diary:          'view-only',
    charting:       true,
    rota:           true,
    holidayTracker: true,
    leadForms:      true,
    limits: {
      leads:     Infinity,
      storageMB: Infinity,
      members:   Infinity,
      forms:     Infinity,
    },
    warnAt: 0.8,
  },
  [TIERS.PRO]: {
    metaDms:        true,
    whatsapp:       true,
    automation:     true,
    googleAds:      true,
    taskPool:       true,
    patientBooking: true,
    diary:          'full',
    charting:       true,
    rota:           true,
    holidayTracker: true,
    leadForms:      true,
    limits: {
      leads:     Infinity,
      storageMB: Infinity,
      members:   Infinity,
      forms:     Infinity,
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
