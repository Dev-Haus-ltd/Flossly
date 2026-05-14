const asString = (value = '') => String(value || '').trim()

const normalizeUrl = (value = '') => {
  const url = asString(value)
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return url  // allow our own server-relative S3 paths
  return ''
}

const sanitizeArray = (value) => (Array.isArray(value) ? value : [])

export function createEmptyTreatmentPlanContent() {
  return {
    cover: {
      title: '',
      subtitle: '',
      imageUrl: '',
      sourceUrl: '',
      sourceLabel: '',
    },
    practice: {
      title: 'About the Clinic',
      about: '',
      imageUrl: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      sourceUrl: '',
      sourceLabel: '',
    },
    dentists: [],
    testimonials: [],
    paymentPlan: {
      intro: '',
    },
    consentForm: {
      intro: '',
    },
  }
}

export function normalizeTreatmentPlanDentist(dentist = {}, idx = 0) {
  return {
    id: dentist?.id ?? null,
    name: asString(dentist?.name || `Dentist ${idx + 1}`),
    role: asString(dentist?.role || dentist?.title || 'Dentist'),
    bio: asString(dentist?.bio),
    imageUrl: normalizeUrl(dentist?.imageUrl || dentist?.photo || dentist?.photoUrl),
    sourceUrl: normalizeUrl(dentist?.sourceUrl),
    sourceLabel: asString(dentist?.sourceLabel),
  }
}

export function normalizeTreatmentPlanContent(content = {}) {
  const base = createEmptyTreatmentPlanContent()
  const dentists = sanitizeArray(content?.dentists)
    .map((dentist, idx) => normalizeTreatmentPlanDentist(dentist, idx))
    .filter((dentist) => dentist.name || dentist.bio || dentist.imageUrl)

  const testimonials = sanitizeArray(content?.testimonials)
    .map((item) => asString(item))
    .filter(Boolean)

  return {
    cover: {
      ...base.cover,
      ...(content?.cover || {}),
      title: asString(content?.cover?.title),
      subtitle: asString(content?.cover?.subtitle),
      imageUrl: normalizeUrl(content?.cover?.imageUrl),
      sourceUrl: normalizeUrl(content?.cover?.sourceUrl),
      sourceLabel: asString(content?.cover?.sourceLabel),
    },
    practice: {
      ...base.practice,
      ...(content?.practice || {}),
      title: asString(content?.practice?.title || 'About the Clinic'),
      about: asString(content?.practice?.about),
      imageUrl: normalizeUrl(content?.practice?.imageUrl),
      website: normalizeUrl(content?.practice?.website),
      phone: asString(content?.practice?.phone),
      email: asString(content?.practice?.email),
      address: asString(content?.practice?.address),
      sourceUrl: normalizeUrl(content?.practice?.sourceUrl),
      sourceLabel: asString(content?.practice?.sourceLabel),
    },
    dentists,
    testimonials,
    paymentPlan: {
      ...base.paymentPlan,
      ...(content?.paymentPlan || {}),
      intro: asString(content?.paymentPlan?.intro),
    },
    consentForm: {
      ...base.consentForm,
      ...(content?.consentForm || {}),
      intro: asString(content?.consentForm?.intro),
    },
  }
}

const withFallbackString = (value = '', fallback = '') => asString(value) || asString(fallback)

const mergeDentists = (primary = [], fallback = []) => {
  if (sanitizeArray(primary).length) return sanitizeArray(primary).map((dentist, idx) => normalizeTreatmentPlanDentist(dentist, idx))
  return sanitizeArray(fallback).map((dentist, idx) => normalizeTreatmentPlanDentist(dentist, idx))
}

export function mergeTreatmentPlanContent(content = {}, fallback = {}) {
  const normalized = normalizeTreatmentPlanContent(content)
  const defaults = normalizeTreatmentPlanContent(fallback)
  return {
    cover: {
      ...defaults.cover,
      ...normalized.cover,
      title: withFallbackString(normalized.cover.title, defaults.cover.title),
      subtitle: withFallbackString(normalized.cover.subtitle, defaults.cover.subtitle),
      imageUrl: withFallbackString(normalized.cover.imageUrl, defaults.cover.imageUrl),
      sourceUrl: withFallbackString(normalized.cover.sourceUrl, defaults.cover.sourceUrl),
      sourceLabel: withFallbackString(normalized.cover.sourceLabel, defaults.cover.sourceLabel),
    },
    practice: {
      ...defaults.practice,
      ...normalized.practice,
      title: withFallbackString(normalized.practice.title, defaults.practice.title || 'About the Clinic'),
      about: withFallbackString(normalized.practice.about, defaults.practice.about),
      imageUrl: withFallbackString(normalized.practice.imageUrl, defaults.practice.imageUrl),
      website: withFallbackString(normalized.practice.website, defaults.practice.website),
      phone: withFallbackString(normalized.practice.phone, defaults.practice.phone),
      email: withFallbackString(normalized.practice.email, defaults.practice.email),
      address: withFallbackString(normalized.practice.address, defaults.practice.address),
      sourceUrl: withFallbackString(normalized.practice.sourceUrl, defaults.practice.sourceUrl),
      sourceLabel: withFallbackString(normalized.practice.sourceLabel, defaults.practice.sourceLabel),
    },
    dentists: mergeDentists(normalized.dentists, defaults.dentists),
    testimonials: normalized.testimonials.length ? normalized.testimonials : defaults.testimonials,
    paymentPlan: {
      ...defaults.paymentPlan,
      ...normalized.paymentPlan,
      intro: withFallbackString(normalized.paymentPlan.intro, defaults.paymentPlan.intro),
    },
    consentForm: {
      ...defaults.consentForm,
      ...normalized.consentForm,
      intro: withFallbackString(normalized.consentForm.intro, defaults.consentForm.intro),
    },
  }
}

export function buildOrganisationTreatmentPlanDefaults(organisation = {}, practitioners = []) {
  const ap = organisation?.automationPlaceholders || {}
  return normalizeTreatmentPlanContent({
    cover: {
      title: asString(organisation?.name || 'Dental Practice'),
      subtitle: asString(ap.coverSubtitle || 'Personalised Treatment Plan'),
      imageUrl: normalizeUrl(ap.coverImageUrl || ap.clinicImageUrl),
    },
    practice: {
      title: asString(ap.practiceTitle || 'About the Clinic'),
      about: asString(ap.clinicAbout || organisation?.description || `${organisation?.name || 'Our clinic'} provides modern, patient-focused dental care.`),
      imageUrl: normalizeUrl(ap.clinicImageUrl || ap.coverImageUrl),
      website: normalizeUrl(ap.website || ap.bookingLink),
      phone: asString(organisation?.contact || ap.phone),
      email: asString(organisation?.email || organisation?.contactEmail || ap.email),
      address: asString(organisation?.address || ap.address),
      sourceLabel: 'Organisation defaults',
    },
    dentists: sanitizeArray(practitioners).map((practitioner) => ({
      id: practitioner?.id ?? null,
      name: asString(practitioner?.name),
      role: asString(practitioner?.role || 'Dentist'),
      bio: asString(practitioner?.bio || practitioner?.description),
      imageUrl: normalizeUrl(practitioner?.imageUrl || practitioner?.photo),
      sourceLabel: 'Organisation defaults',
    })),
    testimonials: sanitizeArray(ap.testimonials)
      .map((item) => asString(item))
      .filter(Boolean),
    paymentPlan: {
      intro: asString(ap.paymentPlanIntro || ''),
    },
    consentForm: {
      intro: asString(ap.consentIntro || ''),
    },
  })
}
