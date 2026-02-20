const COMMON_PHONE_COUNTRIES = [
  { name: 'United States', iso2: 'US', dialCode: '1' },
  { name: 'United Kingdom', iso2: 'GB', dialCode: '44' },
  { name: 'Canada', iso2: 'CA', dialCode: '1' },
  { name: 'Australia', iso2: 'AU', dialCode: '61' },
  { name: 'New Zealand', iso2: 'NZ', dialCode: '64' },
  { name: 'Ireland', iso2: 'IE', dialCode: '353' },
  { name: 'South Africa', iso2: 'ZA', dialCode: '27' },
  { name: 'India', iso2: 'IN', dialCode: '91' },
  { name: 'Pakistan', iso2: 'PK', dialCode: '92' },
  { name: 'United Arab Emirates', iso2: 'AE', dialCode: '971' },
  { name: 'Saudi Arabia', iso2: 'SA', dialCode: '966' },
  { name: 'Qatar', iso2: 'QA', dialCode: '974' },
  { name: 'Kuwait', iso2: 'KW', dialCode: '965' },
  { name: 'Oman', iso2: 'OM', dialCode: '968' },
  { name: 'Bahrain', iso2: 'BH', dialCode: '973' },
  { name: 'Egypt', iso2: 'EG', dialCode: '20' },
  { name: 'Nigeria', iso2: 'NG', dialCode: '234' },
  { name: 'Kenya', iso2: 'KE', dialCode: '254' },
  { name: 'Ghana', iso2: 'GH', dialCode: '233' },
  { name: 'Morocco', iso2: 'MA', dialCode: '212' },
  { name: 'France', iso2: 'FR', dialCode: '33' },
  { name: 'Germany', iso2: 'DE', dialCode: '49' },
  { name: 'Spain', iso2: 'ES', dialCode: '34' },
  { name: 'Italy', iso2: 'IT', dialCode: '39' },
  { name: 'Netherlands', iso2: 'NL', dialCode: '31' },
  { name: 'Belgium', iso2: 'BE', dialCode: '32' },
  { name: 'Switzerland', iso2: 'CH', dialCode: '41' },
  { name: 'Austria', iso2: 'AT', dialCode: '43' },
  { name: 'Sweden', iso2: 'SE', dialCode: '46' },
  { name: 'Norway', iso2: 'NO', dialCode: '47' },
  { name: 'Denmark', iso2: 'DK', dialCode: '45' },
  { name: 'Finland', iso2: 'FI', dialCode: '358' },
  { name: 'Poland', iso2: 'PL', dialCode: '48' },
  { name: 'Portugal', iso2: 'PT', dialCode: '351' },
  { name: 'Greece', iso2: 'GR', dialCode: '30' },
  { name: 'Turkey', iso2: 'TR', dialCode: '90' },
  { name: 'Israel', iso2: 'IL', dialCode: '972' },
  { name: 'Brazil', iso2: 'BR', dialCode: '55' },
  { name: 'Argentina', iso2: 'AR', dialCode: '54' },
  { name: 'Chile', iso2: 'CL', dialCode: '56' },
  { name: 'Mexico', iso2: 'MX', dialCode: '52' },
  { name: 'Colombia', iso2: 'CO', dialCode: '57' },
  { name: 'Peru', iso2: 'PE', dialCode: '51' },
  { name: 'Japan', iso2: 'JP', dialCode: '81' },
  { name: 'China', iso2: 'CN', dialCode: '86' },
  { name: 'Hong Kong', iso2: 'HK', dialCode: '852' },
  { name: 'Singapore', iso2: 'SG', dialCode: '65' },
  { name: 'Malaysia', iso2: 'MY', dialCode: '60' },
  { name: 'Philippines', iso2: 'PH', dialCode: '63' },
  { name: 'Thailand', iso2: 'TH', dialCode: '66' },
  { name: 'Indonesia', iso2: 'ID', dialCode: '62' },
  { name: 'Vietnam', iso2: 'VN', dialCode: '84' },
  { name: 'South Korea', iso2: 'KR', dialCode: '82' },
  { name: 'Russia', iso2: 'RU', dialCode: '7' },
]

const flagFromIso = (iso2) => {
  if (!iso2 || iso2.length !== 2) return ''
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const buildCountryOptions = () =>
  COMMON_PHONE_COUNTRIES.map((c) => ({
    ...c,
    dialCode: `+${c.dialCode}`,
    label: `${flagFromIso(c.iso2)} ${c.name} +${c.dialCode}`,
  }))

const normalizeDialCode = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

const normalizeNationalNumber = (value) =>
  String(value || '').replace(/\D/g, '')

const isValidE164 = (value) => {
  const text = String(value || '').trim()
  return /^\+\d{7,15}$/.test(text)
}

const splitPhoneToParts = (value, fallbackDial = '+1') => {
  const raw = String(value || '').trim()
  if (!raw) return { dialCode: fallbackDial, national: '' }
  if (!raw.startsWith('+')) {
    return { dialCode: fallbackDial, national: normalizeNationalNumber(raw) }
  }
  const all = buildCountryOptions()
  const dialCodes = Array.from(new Set(all.map((c) => c.dialCode))).sort(
    (a, b) => b.length - a.length
  )
  const match = dialCodes.find((code) => raw.startsWith(code))
  if (match) {
    return { dialCode: match, national: normalizeNationalNumber(raw.slice(match.length)) }
  }
  return { dialCode: fallbackDial, national: normalizeNationalNumber(raw.slice(1)) }
}

const buildE164 = (dialCode, national) => {
  const dial = normalizeDialCode(dialCode)
  const local = normalizeNationalNumber(national)
  if (!dial || !local) return ''
  return `${dial}${local}`
}

export {
  COMMON_PHONE_COUNTRIES,
  buildCountryOptions,
  normalizeDialCode,
  normalizeNationalNumber,
  isValidE164,
  splitPhoneToParts,
  buildE164,
}
