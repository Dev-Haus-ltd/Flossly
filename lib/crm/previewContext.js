import { getLeadDisplayName, getLeadEmail, getLeadPhone } from '@/lib/normalizers/lead'

const extractTreatment = (lead) => {
  if (!lead) return ''
  if (typeof lead?.treatment === 'object') return String(lead?.treatment?.name || '').trim()
  return String(lead?.treatment || '').trim()
}

export const buildRecipientContext = ({
  lead = null,
  user = null,
  many = false,
  fallbackName = 'User',
  fallbackEmail = '',
  fallbackYourName = 'Team',
} = {}) => {
  const name = many ? fallbackName : (getLeadDisplayName(lead) || fallbackName)
  const firstName = many ? fallbackName : ((name || '').split(' ')[0] || fallbackName)
  const email = many ? '' : (getLeadEmail(lead) || fallbackEmail)
  const yourName = user?.fullName || user?.name || fallbackYourName

  const infoParts = []
  if (!many) {
    const leadEmail = getLeadEmail(lead)
    if (leadEmail) infoParts.push(leadEmail)
    const leadPhone = getLeadPhone(lead)
    if (leadPhone) infoParts.push(leadPhone)
    const treatment = extractTreatment(lead)
    if (treatment) infoParts.push(treatment)
    if (lead?.location) infoParts.push(String(lead.location))
  }

  return {
    name,
    firstName,
    email,
    yourName,
    info: infoParts.join(' | '),
  }
}
