import { PatientAutomationDictionary, PatientAutomationTemplate } from '../models'
import { success, error } from '../utils/response'
const defaultTemplatesByGroup = {
  appointment_reminder: [
    {
      key: 'appt_conf_0',
      type: 'Email',
      name: 'Thank you for confirming your appointment',
      sending: 'Immediately',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>Your appointment at [Practice Name] is confirmed for <strong>[Appointment Date]</strong> at <strong>[Appointment Time]</strong>. Please arrive 5 minutes early to complete any quick checks.</p><p>If you need to reschedule, reply to this email or call us on [Practice Phone].</p><p>See you soon,<br/>The [Practice Name] Team</p>`
    },
    {
      key: 'appt_conf_12h',
      type: 'Email',
      name: 'We are looking forward to seeing you',
      sending: '12 hours before',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>Just a reminder that your appointment is tomorrow at <strong>[Appointment Time]</strong>.</p><ul><li>Location: [Practice Address]</li><li>Parking: [Parking Details]</li><li>Bring: Photo ID and any medical notes</li></ul><p>Questions? Reply to this email and we will help.</p>`
    },
    {
      key: 'appt_conf_5h',
      type: 'Email',
      name: 'See you in a few hours',
      sending: '5 hours before',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>We are ready for your visit later today at <strong>[Appointment Time]</strong>. If anything changes, let us know so we can offer your slot to another patient.</p><p>Thank you for choosing [Practice Name].</p>`
    },
  ],
  dentist_recall: [
    {
      key: 'recall_6m',
      type: 'Email',
      name: '6 month dentist recall',
      sending: '6 months after last visit',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>Your routine dental health check is due. Regular visits help us keep your teeth and gums healthy.</p><p><strong>Book now</strong> at a time that suits you: [Booking Link]</p><p>We look forward to seeing you,<br/>[Practice Name]</p>`
    },
    {
      key: 'recall_8m',
      type: 'Email',
      name: 'Recall reminder',
      sending: '8 months after last visit',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>This is a friendly reminder that your dental check-up is overdue. Early visits help us spot small problems before they become big ones.</p><p>Tap to schedule: [Booking Link]</p><p>Thanks,<br/>[Practice Name]</p>`
    },
  ],
  google_review: [
    {
      key: 'review_immediate',
      type: 'Email',
      name: 'Thank you - review invite',
      sending: 'After appointment completed',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>Thank you for visiting [Practice Name] today. If you had a good experience, would you mind leaving us a quick Google review? It helps other patients find us.</p><p><a href=\"[Review Link]\">Leave a quick review</a></p><p>We appreciate your support!</p>`
    },
    {
      key: 'review_followup',
      type: 'Email',
      name: 'Friendly reminder to review us',
      sending: '3 days after visit',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>We hope you are feeling great after your recent visit. If you have 60 seconds, please share your feedback on Google.</p><p><a href=\"[Review Link]\">Share feedback</a></p><p>Thank you,<br/>[Practice Name]</p>`
    },
  ],
  patient_cancellation: [
    {
      key: 'cancel_rebook',
      type: 'Email',
      name: 'Help rebook your appointment',
      sending: 'When patient cancels',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>We noticed your appointment was cancelled. Can we help you find a new time?</p><p>Choose a slot here: [Booking Link]<br/>or call us on [Practice Phone] and we will rebook for you.</p>`
    },
    {
      key: 'cancel_followup',
      type: 'Email',
      name: 'We saved a slot for you',
      sending: '2 days after cancel',
      enabled: false,
      template: `<p>Hi [First Name],</p><p>We have a couple of openings this week if you would like to rebook.</p><ul><li>[Slot Option 1]</li><li>[Slot Option 2]</li></ul><p>Reply with your preference or tap here to pick another time: [Booking Link]</p>`
    },
  ],
}
const defaultAutomationGroups = [
  {
    key: 'appointment_reminder',
    title: 'Appointment Reminder',
    description: 'Send a series of appointment reminders to reduce no-show',
    itemCount: (defaultTemplatesByGroup.appointment_reminder || []).length,
    image: null,
  },
  {
    key: 'dentist_recall',
    title: 'Dentist Recall',
    description: 'Send a series of dentist and hygienist recall automations',
    itemCount: (defaultTemplatesByGroup.dentist_recall || []).length,
    image: null,
  },
  {
    key: 'google_review',
    title: 'Google Review',
    description: 'Send a series of google review request automations',
    itemCount: (defaultTemplatesByGroup.google_review || []).length,
    image: null,
  },
  {
    key: 'patient_cancellation',
    title: 'Patient Cancellation',
    description: 'Send a series of automations asking the patient to rebook their appointment',
    itemCount: (defaultTemplatesByGroup.patient_cancellation || []).length,
    image: null,
  },
]

const ensureDictionarySeed = async () => {
  await PatientAutomationDictionary.sync()
  await PatientAutomationTemplate.sync()
  const count = await PatientAutomationDictionary.count()
  if (count > 0) return
  const items = defaultAutomationGroups.map((g) => ({
    ...g,
    templates: defaultTemplatesByGroup[g.key] || [],
  }))
  await PatientAutomationDictionary.bulkCreate(items, { ignoreDuplicates: true })
}

const mergeTemplates = (groupKey, saved = []) => {
  const defaults = defaultTemplatesByGroup[groupKey] || []
  const savedMap = new Map((saved || []).map((r) => [r.key, r]))
  return defaults.map((d) => {
    const s = savedMap.get(d.key) || {}
    return {
      ...d,
      ...s,
      type: s.type || d.type,
      name: s.name || d.name,
      sending: s.sending || d.sending,
      enabled: s.enabled !== undefined ? !!s.enabled : !!d.enabled,
      template: s.template || d.template || '',
      roleName: s.roleName || null,
    }
  })
}

export const listJourneyAutomationGroups = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    await ensureDictionarySeed()
    const rows = await PatientAutomationDictionary.findAll({ order: [['id', 'ASC']] })
    const saved = await PatientAutomationTemplate.findAll({ where: { organisationId: Number(orgId) } })
    const byGroup = new Map()
    saved.forEach((s) => {
      const arr = byGroup.get(s.groupKey) || []
      arr.push(s)
      byGroup.set(s.groupKey, arr)
    })
    const shaped = rows.map((r) => {
      const groupSaved = byGroup.get(r.key) || []
      const groupEnabled = groupSaved.length ? groupSaved.every((t) => t.enabled) : false
      return { ...r.toJSON(), enabled: groupEnabled }
    })
    return success(shaped)
  } catch (e) {
    return error(500, e?.message || 'Internal error')
  }
}

export const listJourneyAutomationTemplates = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const q = getQuery(event) || {}
    const groupKey = q.groupKey || q.key
    if (!groupKey) return error(400, 'groupKey required')
    await ensureDictionarySeed()
    const dict = await PatientAutomationDictionary.findOne({ where: { key: groupKey } })
    if (!dict) return error(404, 'Automation group not found')
    const saved = await PatientAutomationTemplate.findAll({ where: { organisationId: Number(orgId), groupKey } })
    const merged = mergeTemplates(groupKey, saved)
    return success(merged)
  } catch (e) {
    return error(500, e?.message || 'Internal error')
  }
}

export const saveJourneyAutomationTemplate = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { key, groupKey, type = 'Email', name, sending, enabled, template, roleName } = payload || {}
    if (!key || !groupKey) return error(400, 'key and groupKey required')
    await ensureDictionarySeed()
    const defaults = mergeTemplates(groupKey, [])
    const fallback = defaults.find((d) => d.key === key) || {}
    const where = { organisationId: Number(orgId), key }
    const existing = await PatientAutomationTemplate.findOne({ where })
    if (existing) {
      if (name !== undefined) existing.name = name
      if (sending !== undefined) existing.sending = sending
      if (enabled !== undefined) existing.enabled = !!enabled
      if (type !== undefined) existing.type = type
      if (template !== undefined) existing.template = template
      if (roleName !== undefined) existing.roleName = roleName
      if (groupKey !== undefined) existing.groupKey = groupKey
      await existing.save()
      return success(existing)
    }
    const created = await PatientAutomationTemplate.create({
      organisationId: Number(orgId),
      groupKey,
      key,
      type,
      name: name || fallback.name || key,
      sending: sending || fallback.sending || '',
      enabled: enabled !== undefined ? !!enabled : !!fallback.enabled,
      template: template || fallback.template || '',
      roleName: roleName || null,
    })
    return success(created)
  } catch (e) {
    return error(500, e?.message || 'Internal error')
  }
}

export const toggleJourneyAutomationGroup = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { groupKey, enabled } = payload || {}
    if (!groupKey || enabled === undefined) return error(400, 'groupKey and enabled required')
    await ensureDictionarySeed()
    const defaults = mergeTemplates(groupKey, [])
    const rows = defaults.map((d) => ({
      organisationId: Number(orgId),
      groupKey,
      key: d.key,
      type: d.type,
      name: d.name,
      sending: d.sending,
      enabled: !!enabled,
      template: d.template || '',
      roleName: d.roleName || null,
    }))
    await PatientAutomationTemplate.bulkCreate(rows, { updateOnDuplicate: ['type','name','sending','enabled','template','roleName'] })
    return success({ groupKey, enabled: !!enabled })
  } catch (e) {
    return error(500, e?.message || 'Internal error')
  }
}
