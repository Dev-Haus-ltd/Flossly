export const DEFAULT_APPOINTMENT_ID = 'appt-1'
export const DEFAULT_APPOINTMENT_NAME = 'Appointment 1'
export const DEFAULT_PLAN_ID = 'plan-1'
export const DEFAULT_PLAN_NAME = 'Treatment Plan 1'
export const DEFAULT_PLAN_COLOR = '#0061FB'
export const PLAN_COLORS = ['#0061FB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']

export const DIAGNOSIS_ABBREVIATIONS = {
  drifted_mesially: 'DM',
  drifted_distally: 'DD',
  rotated_mesially: 'RM',
  rotated_distally: 'RD',
  over_erupted: 'OE',
  impacted: 'IM',
  mobile: 'MO',
}

export function makeDefaultAppointment() {
  return { id: DEFAULT_APPOINTMENT_ID, name: DEFAULT_APPOINTMENT_NAME, status: 'pending' }
}

export function makeDefaultPlan() {
  return {
    id: DEFAULT_PLAN_ID,
    name: DEFAULT_PLAN_NAME,
    color: DEFAULT_PLAN_COLOR,
    appointments: [makeDefaultAppointment()],
  }
}

export function getPlanColor(index = 0) {
  return PLAN_COLORS[index % PLAN_COLORS.length] || DEFAULT_PLAN_COLOR
}

const TREATMENT_MAPPING_RULES = [
  { pattern: /\b(amalgam)\b/i, conditionKey: 'amalgam', scope: 'surface' },
  { pattern: /\b(composite|comp|bonding)\b/i, conditionKey: 'composite', scope: 'surface' },
  { pattern: /\b(caries|carious|decay|cavity)\b/i, conditionKey: 'caries', scope: 'surface' },
  { pattern: /\b(gic|glass\s*ionomer)\b/i, conditionKey: 'gic', scope: 'surface' },
  { pattern: /\b(gold\s*inlay|gold\s*onlay|inlay|onlay)\b/i, conditionKey: 'inlay-onlay', scope: 'surface' },
  { pattern: /\b(crown|cap)\b/i, conditionKey: 'crown', scope: 'fullTooth' },
  { pattern: /\b(veneer|laminate)\b/i, conditionKey: 'veneer', scope: 'fullTooth' },
  { pattern: /\b(bridge|pontic)\b/i, conditionKey: 'bridge', scope: 'fullTooth' },
  { pattern: /\b(root\s*canal|endo|rct)\b/i, conditionKey: 'rct', scope: 'fullTooth' },
  { pattern: /\b(post\s*&?\s*core)\b/i, conditionKey: 'post-core', scope: 'fullTooth' },
  { pattern: /\b(implant)\b/i, conditionKey: 'implant', scope: 'fullTooth' },
  { pattern: /\b(extraction|extract|xla)\b/i, conditionKey: 'extraction-planned', scope: 'fullTooth' },
  { pattern: /\b(missing|absent)\b/i, conditionKey: 'missing', scope: 'fullTooth' },
  { pattern: /\b(fracture|fractured|crack)\b/i, conditionKey: 'fracture', scope: 'fullTooth' },
  { pattern: /\b(erosion)\b/i, conditionKey: 'erosion', scope: 'surface' },
  { pattern: /\b(stain|staining|polish)\b/i, conditionKey: 'staining', scope: 'surface' },
]

const CATEGORY_MAPPING_RULES = [
  { pattern: /\b(surface|restorative|filling)\b/i, conditionKey: 'composite', scope: 'surface' },
  { pattern: /\b(crown|inlay)\b/i, conditionKey: 'crown', scope: 'fullTooth' },
  { pattern: /\b(bridge)\b/i, conditionKey: 'bridge', scope: 'fullTooth' },
  { pattern: /\b(implant)\b/i, conditionKey: 'implant', scope: 'fullTooth' },
  { pattern: /\b(oral|surgery|extraction)\b/i, conditionKey: 'extraction-planned', scope: 'fullTooth' },
  { pattern: /\b(periodontic|preventive|hygiene)\b/i, conditionKey: 'staining', scope: 'surface' },
]

export function resolveTreatmentMapping(treatment = {}) {
  const code = String(treatment?.code || '')
  const name = String(treatment?.name || '')
  const category = String(treatment?.category || '')
  const text = `${code} ${name}`.trim()

  for (const rule of TREATMENT_MAPPING_RULES) {
    if (rule.pattern.test(text)) {
      return { conditionKey: rule.conditionKey, scope: rule.scope }
    }
  }
  for (const rule of CATEGORY_MAPPING_RULES) {
    if (rule.pattern.test(category)) {
      return { conditionKey: rule.conditionKey, scope: rule.scope }
    }
  }
  return { conditionKey: null, scope: null }
}

export function inferConditionKeyFromTreatment(name = '', code = '', category = '') {
  return resolveTreatmentMapping({ name, code, category }).conditionKey
}

export function applyBaseToothStatus(tooth, status) {
  if (!tooth) return
  if (status === 'present') {
    tooth.missing = false
    tooth.unerupted = false
    tooth.partiallyErupted = false
    tooth.implant = false
    tooth.retainedRoot = false
    if (tooth.toothCondition === 'implant') tooth.toothCondition = null
    return
  }
  if (status === 'unerupted') {
    tooth.unerupted = true
    tooth.missing = false
    return
  }
  if (status === 'partially_erupted') {
    tooth.unerupted = false
    tooth.missing = false
    tooth.partiallyErupted = true
    return
  }
  if (status === 'missing' || status === 'extracted') {
    tooth.missing = true
    tooth.unerupted = false
    return
  }
  if (status === 'implanted') {
    tooth.missing = false
    tooth.unerupted = false
    tooth.implant = true
    tooth.toothCondition = 'implant'
    return
  }
  if (status === 'retained_root') {
    tooth.missing = false
    tooth.unerupted = false
    tooth.retainedRoot = true
  }
}

export function getDiagnosisAbbr(value) {
  return DIAGNOSIS_ABBREVIATIONS[value] || ''
}

export function getStatusMarker(status) {
  if (!status || status === 'present') return null
  if (status === 'unerupted') return { type: 'line' }
  if (status === 'partially_erupted') return { type: 'text', text: 'PE' }
  if (status === 'missing') return { type: 'text', text: 'M' }
  if (status === 'extracted') return { type: 'text', text: 'EX' }
  if (status === 'implanted') return { type: 'text', text: 'IMP' }
  if (status === 'retained_root') return { type: 'text', text: 'RR' }
  return { type: 'text', text: String(status).toUpperCase().slice(0, 2) }
}
