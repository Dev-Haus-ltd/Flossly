export const normalizeFieldName = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
    .trim()
}

export const getFieldValueFromLead = (lead, candidates = []) => {
  const raw = lead?.rawData || {}
  const fieldData = Array.isArray(raw.field_data)
    ? raw.field_data
    : Array.isArray(raw.fieldData)
      ? raw.fieldData
      : []
  if (!fieldData.length) return ''

  const normalizedCandidates = candidates.map(normalizeFieldName)
  for (const field of fieldData) {
    const fieldName = normalizeFieldName(field?.name)
    if (!fieldName) continue
    if (!normalizedCandidates.includes(fieldName)) continue
    const values = Array.isArray(field?.values) ? field.values : [field?.values]
    const value = values.find((v) => v != null && String(v).trim())
    if (value) return String(value).trim()
  }
  return ''
}

export const getLeadDisplayName = (lead) => {
  const direct = typeof lead?.name === 'string' ? lead.name.trim() : ''
  if (direct) return direct

  const fullName = getFieldValueFromLead(lead, ['full name', 'full_name', 'fullname'])
  if (fullName) return fullName

  const name = getFieldValueFromLead(lead, ['name'])
  if (name) return name

  const first = getFieldValueFromLead(lead, ['first name', 'first_name', 'firstname'])
  const last = getFieldValueFromLead(lead, ['last name', 'last_name', 'lastname', 'surname'])
  const combined = `${first} ${last}`.trim()
  return combined || ''
}

export const getLeadEmail = (lead) => {
  const direct = typeof lead?.email === 'string' ? lead.email.trim() : ''
  if (direct) return direct
  return getFieldValueFromLead(lead, [
    'email',
    'email address',
    'email_address',
    'e-mail',
    'email id',
    'email_id',
  ])
}

export const getLeadPhone = (lead) => {
  const direct = typeof lead?.telephone === 'string' ? lead.telephone.trim() : ''
  if (direct) return direct
  return getFieldValueFromLead(lead, [
    'phone',
    'phone number',
    'phone_number',
    'mobile',
    'mobile number',
    'mobile_number',
    'cell',
    'cell phone',
    'telephone',
    'tel',
    'whatsapp',
  ])
}
