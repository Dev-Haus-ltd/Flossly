const resolvePlaceholder = (placeholders, key, fallback) => {
  const val = placeholders?.[key]
  if (val === undefined || val === null || val === '') return fallback
  return String(val)
}

const replaceBracketToken = (input, token, value) => {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'gi')
  return input.replace(re, value)
}

export const applyCrmPlaceholders = (
  text,
  { lead = null, recipient = {}, practiceName = '[Practice Name]', org = {}, format = '' } = {}
) => {
  if (!text) return ''

  const safeRecipient = {
    name: recipient?.name || '[Patient Name]',
    firstName: recipient?.firstName || recipient?.name?.split?.(' ')?.[0] || '[First Name]',
    email: recipient?.email || '[Email]',
    yourName: recipient?.yourName || '[Your Name]',
  }

  const placeholders = org?.automationPlaceholders || {}
  const phone =
    org.phone ||
    org.phoneNumber ||
    org.telephone ||
    org.contactPhone ||
    org.contact ||
    org.contactNumber ||
    '[Phone Number]'

  const website =
    resolvePlaceholder(placeholders, 'website', '') ||
    resolvePlaceholder(placeholders, 'practiceWebsite', '') ||
    org.website ||
    org.site ||
    org.web ||
    ''
  const websiteUrl = website || 'https://flossly.ai/'
  const websiteLabel = website || 'Flossly'
  const isHtml = /<[^>]+>/.test(text)
  const useHtmlWebsite = String(format).toLowerCase() === 'html' || isHtml
  const websiteReplacement = useHtmlWebsite
    ? `<a href="${websiteUrl}" target="_blank" rel="noopener">${websiteLabel}</a>`
    : `${websiteLabel} (${websiteUrl})`

  const email = org.email || org.contactEmail || safeRecipient.email || '[Email]'
  const address = org.address || org.location || '[Address]'
  const street = org.streetAddress || org.addressLine1 || '[Street Address]'
  const cityStateZip = org.cityStateZip || org.city || '[City, State ZIP Code]'
  const officeHours = org.officeHours || org.hours || '[Days and Times]'
  const coordinator = org.treatmentCoordinator || org.coordinatorName || org.ownerName || '[Treatment Coordinator Name]'
  const principalDentist =
    resolvePlaceholder(placeholders, 'principalDentistName', '') ||
    org.ownerName ||
    org.principalDentist ||
    '[Practice Owner/Principal Dentist]'
  const yourName = org.ownerName || org.contactName || safeRecipient.yourName || '[Your Name]'
  const location = org.city || org.location || '[Location]'

  const bookingLink = resolvePlaceholder(placeholders, 'bookingLink', '[Booking Link]')
  const diaryBookingLink = resolvePlaceholder(placeholders, 'diaryBookingLink', '[Diary Booking Link]')
  const promoX = resolvePlaceholder(placeholders, 'promoX', '[X]')
  const promoY = resolvePlaceholder(placeholders, 'promoY', '[Y]')
  const promoZ = resolvePlaceholder(placeholders, 'promoZ', '[Z]')
  const promoHigherAmount = resolvePlaceholder(placeholders, 'promoHigherAmount', '[higher amount]')
  const promoDate = resolvePlaceholder(placeholders, 'promoDate', '[Date]')
  const promoTime = resolvePlaceholder(placeholders, 'promoTime', '[Time]')
  const promoDateTime = resolvePlaceholder(placeholders, 'promoDateTime', '[Date/Time]')

  const leadDob = lead?.dob || lead?.dateOfBirth || lead?.birthDate || ''
  const resolvedDob = leadDob ? new Date(leadDob) : null
  const monthName = resolvedDob && !Number.isNaN(resolvedDob.getTime())
    ? resolvedDob.toLocaleString('en-GB', { month: 'long' })
    : new Date().toLocaleString('en-GB', { month: 'long' })
  const promoMonth = resolvePlaceholder(placeholders, 'promoMonth', '') || monthName || '[Month]'

  const promoDayTime = resolvePlaceholder(placeholders, 'promoDayTime', '[Day/Time]')
  const promoDaysTimes = resolvePlaceholder(placeholders, 'promoDaysTimes', '[Days/Times]')
  const futureDate = resolvePlaceholder(placeholders, 'futureDate', '[Future Date]')
  const dateRange = resolvePlaceholder(placeholders, 'dateRange', '[Date range]')
  const specificDate = resolvePlaceholder(placeholders, 'specificDate', '[Specific Date]')
  const mothersDayDate = resolvePlaceholder(placeholders, 'mothersDayDate', "[Mother's Day date]")
  const parkingDetails = resolvePlaceholder(placeholders, 'parkingDetails', '[on-site/nearby/street parking details]')
  const publicTransportDetails = resolvePlaceholder(
    placeholders,
    'publicTransportDetails',
    '[public transportation details if applicable]'
  )
  const localCharity = resolvePlaceholder(placeholders, 'localCharity', '[Local Charity]')
  const localBusiness1 = resolvePlaceholder(placeholders, 'localBusiness1', '[Local Business 1]')
  const localBusiness2 = resolvePlaceholder(placeholders, 'localBusiness2', '[Local Business 2]')
  const localBusiness3 = resolvePlaceholder(placeholders, 'localBusiness3', '[Local Business 3]')

  let output = String(text)
  const replacements = [
    ['practice name', practiceName],
    ['patient name', safeRecipient.name],
    ['name', safeRecipient.name],
    ['first name', safeRecipient.firstName],
    ['phone number', phone],
    ['website', websiteReplacement],
    ['email', email],
    ['address', address],
    ['street address', street],
    ['city, state zip code', cityStateZip],
    ['days and times', officeHours],
    ['days / times', promoDaysTimes],
    ['day / time', promoDayTime],
    ['treatment coordinator name', coordinator],
    ['practice owner / principal dentist', principalDentist],
    ['your name', yourName],
    ['location', location],
    ['booking link', bookingLink],
    ['diary booking link', diaryBookingLink],
    ['date / time', promoDateTime],
    ['date', promoDate],
    ['time', promoTime],
    ['month', promoMonth],
    ['future date', futureDate],
    ['date range', dateRange],
    ['specific date', specificDate],
    ["mother's day date", mothersDayDate],
    ['mothers day date', mothersDayDate],
    ['on-site/nearby/street parking details', parkingDetails],
    ['public transportation details if applicable', publicTransportDetails],
    ['local charity', localCharity],
    ['local business 1', localBusiness1],
    ['local business 2', localBusiness2],
    ['local business 3', localBusiness3],
    ['X', promoX],
    ['Y', promoY],
    ['Z', promoZ],
    ['higher amount', promoHigherAmount],
  ]

  for (const [token, value] of replacements) {
    output = replaceBracketToken(output, token, value)
  }

  return output
}
