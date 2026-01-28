import { DiaryPatient, PatientAutomationDictionary, PatientAutomationTemplate } from '../models'
import { success, error } from '../utils/response'
import { defaultTemplatesByGroup, defaultAutomationGroups, legacyAutomationGroupKeys } from '@shared/defaults/patientJourneyDefaults.js'

const ensureDictionarySeed = async () => {
  await PatientAutomationDictionary.sync()
  await PatientAutomationTemplate.sync()
  const items = defaultAutomationGroups.map((g) => ({
    ...g,
    templates: defaultTemplatesByGroup[g.key] || [],
  }))
  await PatientAutomationDictionary.bulkCreate(items, {
    updateOnDuplicate: ['title', 'description', 'itemCount', 'image', 'templates'],
  })
  const defaultKeys = new Set(defaultAutomationGroups.map((g) => g.key))
  const legacyKeys = (legacyAutomationGroupKeys || []).filter((k) => !defaultKeys.has(k))
  if (legacyKeys.length) {
    await PatientAutomationDictionary.destroy({ where: { key: legacyKeys } })
  }
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
    const q = getQuery(event) || {}
    const patientId = q.patientId ? Number(q.patientId) : null
    if (!patientId) return error(400, 'patientId required')
    await ensureDictionarySeed()
    const rows = await PatientAutomationDictionary.findAll({ order: [['id', 'ASC']] })
    const saved = await PatientAutomationTemplate.findAll({
      where: { organisationId: Number(orgId), patientId },
    })
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
    const patientId = q.patientId ? Number(q.patientId) : null
    if (!groupKey) return error(400, 'groupKey required')
    if (!patientId) return error(400, 'patientId required')
    await ensureDictionarySeed()
    const dict = await PatientAutomationDictionary.findOne({ where: { key: groupKey } })
    if (!dict) return error(404, 'Automation group not found')
    const patient = await DiaryPatient.findOne({
      where: { id: Number(patientId), organisationId: Number(orgId) },
    })
    if (!patient) return error(404, 'Patient not found')
    const saved = await PatientAutomationTemplate.findAll({
      where: { organisationId: Number(orgId), patientId, groupKey },
    })
    const merged = mergeTemplates(groupKey, saved)
    const sentKeys = patient?.rawData?.automationSentKeys || {}
    const sentKeyList = Object.keys(sentKeys)
    const withSent = merged.map((row) => ({
      ...row,
      sent: sentKeyList.some((key) => key.startsWith(`${row.key}:`)),
    }))
    return success(withSent)
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
    const { key, groupKey, patientId, type = 'Email', name, sending, enabled, template, roleName } = payload || {}
    if (!key || !groupKey) return error(400, 'key and groupKey required')
    if (!patientId) return error(400, 'patientId required')
    await ensureDictionarySeed()
    const defaults = mergeTemplates(groupKey, [])
    const fallback = defaults.find((d) => d.key === key) || {}
    const where = { organisationId: Number(orgId), patientId: Number(patientId), key }
    const existing = await PatientAutomationTemplate.findOne({ where })
    if (existing) {
      if (name !== undefined) existing.name = name
      if (sending !== undefined) existing.sending = sending
      if (enabled !== undefined) existing.enabled = !!enabled
      if (type !== undefined) existing.type = type
      if (template !== undefined) existing.template = template
      if (roleName !== undefined) existing.roleName = roleName
      if (groupKey !== undefined) existing.groupKey = groupKey
      if (patientId !== undefined) existing.patientId = Number(patientId)
      await existing.save()
      return success(existing)
    }
    const created = await PatientAutomationTemplate.create({
      organisationId: Number(orgId),
      patientId: Number(patientId),
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
    const { groupKey, enabled, patientId } = payload || {}
    if (!groupKey || enabled === undefined) return error(400, 'groupKey and enabled required')
    if (!patientId) return error(400, 'patientId required')
    await ensureDictionarySeed()
    const saved = await PatientAutomationTemplate.findAll({
      where: { organisationId: Number(orgId), patientId: Number(patientId), groupKey },
    })
    const merged = mergeTemplates(groupKey, saved)
    const rows = merged.map((d) => ({
      organisationId: Number(orgId),
      patientId: Number(patientId),
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
