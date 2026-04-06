import { Op } from 'sequelize'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { CrmLead, CrmLeadTreatment, CrmLeadNote, CrmOption, CrmLeadCommunication, CrmLeadAssignee, CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, MetaPage, User, UserOrganisation, CrmWhatsAppMessageLog, Organisation } from '../models'
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults.js'
import { CONTACT_METHODS, APPOINTMENT_DAYS, BEST_TIMES } from '../models/crm/leadCommunications'
import { formatCrmTriggerPreview } from '~/lib/misc'
import { success, error } from '../utils/response'
import { sendLeadBulkEmail } from '../utils/emailNotifications.js'
import { sendImmediateCrmAutomationsForLead, dispatchSendNowAutomation, dispatchSendNowAutomationWithOptions, previewSendNowAutomation } from '../utils/crmAutomation.js'
import { sendLeadCreatedNotification, sendLeadAssignedNotification, sendLeadUnassignedNotification, sendLeadStatusChangedNotification, sendNotificationToMultipleUsers } from '../utils/fcmNotification.js'
import { decrypt } from '../utils/crypto'
import { normalizeWhatsAppNumber, markWhatsAppOutbound, logWhatsAppMessage, isWhatsAppLimitExceeded } from '../utils/whatsapp'
import { renderLeadTokens } from '../utils/templateTokens'
import { resolveWhatsAppProviderConfig } from '../utils/whatsappProvider'
import { uploadBufferFile } from '../utils/storage'
import DB from '../utils/db'
import { parseJsonBody } from "../utils/body";

const EMAIL_REGEX = /^(?:[a-zA-Z0-9_'^&+\-]+(?:\.[a-zA-Z0-9_'^&+\-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
const SEND_NOW_JOB_TTL_MS = 30 * 60 * 1000
const sendNowJobStore = new Map()

const parseDateValue = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  return null;
};

const makeSendNowJobKey = (orgId, jobId) => `${Number(orgId)}:${String(jobId || '')}`

const pruneSendNowJobs = () => {
  const now = Date.now()
  for (const [jobKey, job] of sendNowJobStore.entries()) {
    const updatedAt = Number(job?.updatedAt || 0)
    if (!updatedAt || now - updatedAt > SEND_NOW_JOB_TTL_MS) {
      sendNowJobStore.delete(jobKey)
    }
  }
}

const createSendNowJob = ({ orgId, key }) => {
  pruneSendNowJobs()
  const jobId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const nowIso = new Date().toISOString()
  const job = {
    jobId,
    key: String(key || ''),
    status: 'running',
    startedAt: nowIso,
    updatedAt: Date.now(),
    completedAt: null,
    result: null,
    error: null,
  }
  sendNowJobStore.set(makeSendNowJobKey(orgId, jobId), job)
  return job
}

const completeSendNowJob = ({ orgId, jobId, result }) => {
  const found = sendNowJobStore.get(makeSendNowJobKey(orgId, jobId))
  if (!found) return
  found.status = 'completed'
  found.completedAt = new Date().toISOString()
  found.updatedAt = Date.now()
  found.result = result || null
  found.error = null
}

const failSendNowJob = ({ orgId, jobId, err }) => {
  const found = sendNowJobStore.get(makeSendNowJobKey(orgId, jobId))
  if (!found) return
  found.status = 'failed'
  found.completedAt = new Date().toISOString()
  found.updatedAt = Date.now()
  found.result = null
  found.error = err?.message || String(err || 'Send now job failed')
}

const getSendNowJob = ({ orgId, jobId }) =>
  sendNowJobStore.get(makeSendNowJobKey(orgId, jobId)) || null

const sanitizeFilename = (filename = 'file') =>
  String(filename || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const getLeadRawData = (lead) =>
  lead?.rawData && typeof lead.rawData === 'object' && !Array.isArray(lead.rawData)
    ? lead.rawData
    : {}

const buildLeadSelectionKey = (leadIds = []) =>
  [...new Set((leadIds || []).map((id) => Number(id)).filter(Boolean))]
    .sort((a, b) => a - b)
    .join(',')

const normalizeLeadContactFields = (payload = {}) => ({
  email: String(payload.email || '').trim(),
  telephone: String(payload.telephone || '').trim(),
})

const validateLeadContactFields = ({ email, telephone }) => {
  if (!EMAIL_REGEX.test(email)) return 'Enter a valid email'
  const phone = parsePhoneNumber(telephone)
  if (!phone?.valid) return 'Enter a valid telephone number'
  return null
}

const slugifyKey = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  const base = raw
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-|-$|^_+|_+$/g, '')
  return base || 'automation_group'
}

const ensureUniqueGroupKey = async ({ orgId, key, excludeId = null, transaction = null }) => {
  let candidate = slugifyKey(key)
  let suffix = 1
  while (true) {
    const existing = await CrmAutomationGroup.findOne({
      where: {
        organisationId: Number(orgId),
        key: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
      transaction,
    })
    if (!existing) return candidate
    candidate = `${slugifyKey(key)}_${suffix}`
    suffix += 1
  }
}

const slugifyAutomationKey = (value, maxLen = 50) => {
  const base = slugifyKey(value)
  return base.length > maxLen ? base.slice(0, maxLen) : base
}

const ensureUniqueTemplateKey = ({ base, existingKeys, reservedKeys, usedKeys }) => {
  const safeBase = slugifyAutomationKey(base || 'automation', 45)
  let candidate = safeBase
  let suffix = 1
  const isUsed = (key) =>
    (existingKeys && existingKeys.has(key)) ||
    (reservedKeys && reservedKeys.has(key)) ||
    (usedKeys && usedKeys.has(key))
  while (isUsed(candidate)) {
    candidate = `${safeBase}_${suffix}`
    if (candidate.length > 50) {
      candidate = `${safeBase.slice(0, Math.max(1, 50 - String(suffix).length - 1))}_${suffix}`
    }
    suffix += 1
  }
  if (usedKeys) usedKeys.add(candidate)
  if (existingKeys) existingKeys.add(candidate)
  return candidate
}

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const plainTextToHtml = (value) => {
  const text = String(value || '').replace(/\r\n/g, '\n').trim()
  if (!text) return ''
  const escaped = escapeHtml(text).replace(/\n/g, '<br/>')
  return `<p>${escaped}</p>`
}

const normalizeAutomationType = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return 'Email'
  if (raw.includes('whatsapp') || raw === 'wa' || raw === 'whats app') return 'WhatsApp'
  return 'Email'
}

const normalizeAutomationTrigger = (trigger) => {
  if (trigger === undefined) return undefined
  if (trigger === null) return null
  if (typeof trigger !== 'object') throw new Error('Invalid trigger')
  const type = String(trigger.type || '').trim()
  if (!type) throw new Error('Trigger type required')
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
  }
  switch (type) {
    case 'send_now':
      return { type }
    case 'inquiry_days':
    case 'birthday_offset':
      return { type, days: safeNumber(trigger.days, 0) }
    case 'birthday_month_start':
      return { type, offsetDays: safeNumber(trigger.offsetDays, 0) }
    case 'black_friday':
      return {
        type,
        offsetDays: safeNumber(trigger.offsetDays, 0),
        ...(trigger.minHour !== undefined ? { minHour: safeNumber(trigger.minHour, 0) } : {}),
      }
    case 'month_day': {
      const month = safeNumber(trigger.month, 0)
      const day = safeNumber(trigger.day, 0)
      if (!month || !day) throw new Error('month_day trigger requires month and day')
      return {
        type,
        month,
        day,
        offsetDays: safeNumber(trigger.offsetDays, 0),
      }
    }
    case 'weekday_of_month': {
      const month = safeNumber(trigger.month, 0)
      const weekday = safeNumber(trigger.weekday, NaN)
      const weekIndex = safeNumber(trigger.weekIndex, 0)
      if (!month || Number.isNaN(weekday) || !weekIndex) {
        throw new Error('weekday_of_month trigger requires month, weekday, and weekIndex')
      }
      return {
        type,
        month,
        weekday,
        weekIndex,
        offsetDays: safeNumber(trigger.offsetDays, 0),
      }
    }
    case 'practice_anniversary':
      return {
        type,
        offsetDays: safeNumber(trigger.offsetDays, 0),
        ...(trigger.minHour !== undefined ? { minHour: safeNumber(trigger.minHour, 0) } : {}),
      }
    case 'practice_anniversary_month_end':
      return {
        type,
        offsetDays: safeNumber(trigger.offsetDays, 0),
        ...(trigger.minHour !== undefined ? { minHour: safeNumber(trigger.minHour, 0) } : {}),
      }
    default:
      throw new Error('Unsupported trigger type')
  }
}

const validateAutomationPayload = (payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const key = String(payload.key || '').trim()
  if (!key) throw new Error('key required')
  const type = normalizeAutomationType(payload.type)
  const trigger = normalizeAutomationTrigger(payload.trigger)
  return { ...payload, key, type, trigger }
}

const seedAutomationGroups = async (orgId) => {
  const rows = await CrmAutomationGroup.findAll({
    where: { organisationId: Number(orgId) },
    order: [['ordering', 'ASC'], ['createdAt', 'ASC']],
  })
  const byKey = new Map(rows.map((g) => [g.key, g]))
  const created = []

  if (!rows.length) {
    const fresh = await CrmAutomationGroup.bulkCreate(
      crmAutomationGroups.map((group, idx) => ({
        organisationId: Number(orgId),
        key: group.key,
        title: group.title,
        description: group.description || null,
        enabled: false,
        ordering: idx,
        source: 'system',
      }))
    )
    return fresh
  }

  for (let idx = 0; idx < crmAutomationGroups.length; idx += 1) {
    const group = crmAutomationGroups[idx]
    if (byKey.has(group.key)) continue
    const row = await CrmAutomationGroup.create({
      organisationId: Number(orgId),
      key: group.key,
      title: group.title,
      description: group.description || null,
      enabled: false,
      ordering: rows.length + created.length,
      source: 'system',
    })
    created.push(row)
    byKey.set(group.key, row)
  }

  const groupIdByKey = new Map([...byKey.entries()].map(([key, g]) => [key, g.id]))
  const existingMappings = await CrmAutomationGroupTemplate.findAll({
    where: { organisationId: Number(orgId) },
  })
  const existingSet = new Set(existingMappings.map((m) => `${m.groupId}:${m.templateKey}`))
  const toCreate = []
  crmAutomationGroups.forEach((group) => {
    const groupId = groupIdByKey.get(group.key)
    if (!groupId) return
    ;(group.templateKeys || []).forEach((templateKey, idx) => {
      const key = `${groupId}:${templateKey}`
      if (existingSet.has(key)) return
      toCreate.push({
        organisationId: Number(orgId),
        groupId,
        templateKey,
        ordering: idx,
      })
    })
  })
  if (toCreate.length) await CrmAutomationGroupTemplate.bulkCreate(toCreate)

  return [...byKey.values()]
}
 

export const listLeads = async (event) => {
  try {
    const logged = event.context.user
    const q = getQuery(event) || {}
    const where = { organisationId: Number(logged.orgId) }
    const archivedOnly = String(q.archivedOnly || '').toLowerCase() === 'true'
    const includeArchived = String(q.includeArchived || '').toLowerCase() === 'true'
    const archivedCondition = {
      [Op.or]: [
        { softDeleted: true },
        { leadStatus: 'Archived' },
      ],
    }
    if (archivedOnly) {
      where[Op.and] = [...(where[Op.and] || []), archivedCondition]
    } else if (!includeArchived) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.not]: {
            [Op.or]: [
              { softDeleted: true },
              { leadStatus: 'Archived' },
            ],
          },
        },
      ]
    }

    // Server-side filtering moved from client
    // Text search across name/email/telephone
    const search = (q.search || q.q || '').trim()
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { telephone: { [Op.iLike]: `%${search}%` } },
      ]
    }

    // Optional equals filters
    if (q.leadStatus) {
      const key = String(q.leadStatus).toLowerCase()
      const map = { new: 'New', converted: 'Converted', contacted: 'Contacted', lost: 'Lost' }
      const value = map[key] || q.leadStatus
      // Use exact match against our canonical stored value
      where.leadStatus = value
    }

    // Map option ids to names for leadSource/treatment if provided
    const optionIds = []
    if (q.leadSourceId) optionIds.push(Number(q.leadSourceId))
    if (q.treatmentId) optionIds.push(Number(q.treatmentId))
    let optionMap = new Map()
    if (optionIds.length) {
      const opts = await CrmOption.findAll({ where: { id: { [Op.in]: optionIds }, organisationId: Number(logged.orgId) } })
      optionMap = new Map(opts.map(o => [o.id, o]))
    }
    if (q.leadSourceId) {
      const o = optionMap.get(Number(q.leadSourceId))
      if (o?.name) where.leadSource = o.name
    }
    if (q.treatmentId) {
      const o = optionMap.get(Number(q.treatmentId))
      if (o?.name) where.treatment = o.name
    }

    // Filter by inquiryDate (same day)
    if (q.inquiryDate) {
      const day = new Date(q.inquiryDate)
      if (!isNaN(day.getTime())) {
        const start = new Date(day); start.setHours(0,0,0,0)
        const end = new Date(day); end.setHours(23,59,59,999)
        where.inquiryDate = { [Op.between]: [start, end] }
      }
    }

    if (q.alert) {
      where.alert = q.alert
    }

    // Filter by Meta campaign attribution
    if (q.campaignId) {
      where.campaignId = q.campaignId
    }
    if (q.adSetId) {
      where.adSetId = q.adSetId
    }
    if (q.adId) {
      where.adId = q.adId
    }

    // Exact lead lookup for route-driven dialog opening
    const exactLeadId = Number(q.id || q.leadId || 0)
    if (exactLeadId) {
      where.id = exactLeadId
    }

    const page = Number(q.page || 0)
    const pageSize = Number(q.pageSize || 0)
    const usePagination = Number.isFinite(page) && page > 0 && Number.isFinite(pageSize) && pageSize > 0
    const sortBy = String(q.sortBy || 'createdAt')
    const sortDirRaw = String(q.sortDir || 'DESC').toUpperCase()
    const sortDir = sortDirRaw === 'ASC' ? 'ASC' : 'DESC'
    const sortable = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'email',
      'telephone',
      'leadStatus',
      'leadSource',
      'inquiryDate',
      'followUpDate',
    ])
    const orderKey = sortable.has(sortBy) ? sortBy : 'createdAt'

    const queryOptions = {
      where,
      include: [
        {
          model: CrmLeadAssignee,
          as: 'assignees',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
        },
      ],
      order: [[orderKey, sortDir]],
    }

    let rows = []
    let total = null
    if (usePagination) {
      const result = await CrmLead.findAndCountAll({
        ...queryOptions,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      rows = result.rows || []
      total = result.count || 0
    } else {
      rows = await CrmLead.findAll(queryOptions)
    }
    const pageIds = [...new Set(rows.map((l) => l.pageId).filter(Boolean))]
    let pageNameById = new Map()
    if (pageIds.length) {
      const pages = await MetaPage.findAll({
        where: { organisationId: Number(logged.orgId), pageId: { [Op.in]: pageIds } },
        attributes: ['pageId', 'pageName'],
      })
      pageNameById = new Map(
        pages.map((p) => [String(p.pageId), p.pageName || null])
      )
    }
    const shaped = rows.map((l) => {
      const assigned = (l.assignees || [])
        .map((a) => (a.user ? { id: a.user.id, fullName: a.user.fullName, email: a.user.email } : null))
        .filter(Boolean)
      l.setDataValue('assigned', assigned)
      if (l.pageId) {
        l.setDataValue('pageName', pageNameById.get(String(l.pageId)) || null)
      } else {
        l.setDataValue('pageName', null)
      }
      const tname = l.treatment || ''
      l.setDataValue('treatment', { id: null, name: tname || '' })
      // do not expose raw assignees relation by default
      return l
    })
    if (!usePagination) return success(shaped)

    let stats = null
    if (String(q.includeStats || '').toLowerCase() === 'true') {
      const counts = await CrmLead.findAll({
        where,
        attributes: ['leadStatus', [DB.fn('COUNT', DB.col('id')), 'count']],
        group: ['leadStatus'],
      })
      const byStatus = {}
      counts.forEach((row) => {
        const status = row.get('leadStatus') || 'Unknown'
        const count = Number(row.get('count') || 0)
        byStatus[status] = count
      })
      const totalCount = await CrmLead.count({ where })
      stats = { total: totalCount, byStatus }
    }

    return success({ rows: shaped, total: total || 0, stats })
  } catch (e) {
    return error(500, e.message)
  }
}

export const createLead = async (event) => {
  console.log('[CRM] createLead API called - checking if endpoint is hit')
  try {
    const logged = event.context.user
    console.log('[CRM] User context:', logged)
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const required = ['name', 'email', 'telephone']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    const { email, telephone } = normalizeLeadContactFields(payload)
    const contactValidationError = validateLeadContactFields({ email, telephone })
    if (contactValidationError) return error(400, contactValidationError)
    const data = {
      organisationId: Number(logged.orgId),
      alert: payload.alert || null,
      name: payload.name,
      email,
      telephone,
      inquiryDate: payload.inquiryDate || new Date(),
      dob: payload.dob || null,
      occupation: payload.occupation || null,
      location: payload.location || null,
      leadSource: payload.leadSource?.name || payload.leadSource || 'Meta Leadgen',
      leadStatus: payload.leadStatus || 'New',
      treatment: payload.treatment?.name || payload.treatment || null,
      followUpDate: payload.followUpDate || null,
      comments: payload.comments || null,
      rawData: payload.rawData || null
    }
    const created = await CrmLead.create(data)
    // shape treatment in response
    created.setDataValue('treatment', { id: null, name: created.treatment || '' })
    // handle assignees if provided
    const assignedUsers = Array.isArray(payload.assigned) ? payload.assigned : []
    if (assignedUsers.length) {
      const rows = assignedUsers
        .map((u) => (u && u.id ? { organisationId: Number(logged.orgId), leadId: created.id, userId: Number(u.id) } : null))
        .filter(Boolean)
      if (rows.length) await CrmLeadAssignee.bulkCreate(rows, { ignoreDuplicates: true })
      // shape response
      const users = await User.findAll({ where: { id: rows.map((r) => r.userId) }, attributes: ['id', 'fullName', 'email'] })
      created.setDataValue('assigned', users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })))
    } else {
      created.setDataValue('assigned', [])
    }
    if (payload.contactMethod && CONTACT_METHODS.includes(payload.contactMethod)) {
      await CrmLeadCommunication.create({
        organisationId: Number(logged.orgId),
        leadId: created.id,
        preferredContactMethod: payload.contactMethod
      })
      created.setDataValue('preferredContact', payload.contactMethod)
    }
    // Send FCM push notification to assigned users
    try {
      if (assignedUsers.length) {
        await sendLeadCreatedNotification({
          lead: created,
          organisationId: Number(logged.orgId),
          assignedUsers: await User.findAll({ 
            where: { id: assignedUsers.map(u => u.id) },
            attributes: ['id', 'fullName', 'email']
          })
        });
      }
    } catch (fcmError) {
      console.warn('FCM notification failed - continuing with lead creation:', fcmError.message);
      // Don't throw the error - let the lead creation succeed even if notifications fail
    }
    
    // Send FCM push notification to all org users
    try {
      const leadSource = created.leadSource || 'Manual'
      console.log('[CRM] Processing lead notification:', { leadId: created.id, leadSource, orgId: logged.orgId })
      const orgUsers = await UserOrganisation.findAll({
        where: {
          organisationId: logged.orgId,
          status: 'Active',
        },
        attributes: ['userId'],
      })
      const userIds = [...new Set(orgUsers.map((u) => u.userId).filter(Boolean))]
      console.log('[CRM] Found org users for notification:', { userIdsCount: userIds.length, userIds })
      if (userIds.length) {
        await sendNotificationToMultipleUsers({
          userIds,
          title: 'New Lead Created',
          body: created.name || created.email || created.telephone || 'A new lead was created',
          type: 'lead_created',
          referenceType: 'lead',
          referenceId: created.id,
          data: {
            leadId: String(created.id),
            leadName: created.name || created.email,
            leadSource: leadSource,
            url: `/crm/leads?leadId=${created.id}`,
          },
          priority: 'high',
        })
        console.log('[CRM] Lead notification sent successfully')
      } else {
        console.log('[CRM] No org users found for notification')
      }
    } catch (notifyErr) {
      console.error('[CRM] Lead creation notification failed:', notifyErr?.message, notifyErr?.stack);
    }
    
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const updateLead = async (event) => {
  try {
    const logged = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { id } = payload
    if (!id) return error(400, 'id required')
    const lead = await CrmLead.findOne({ where: { id, organisationId: Number(logged.orgId) } })
    if (!lead) return error(404, 'Lead not found')
    const fields = ['alert', 'name', 'email', 'telephone', 'inquiryDate', 'dob', 'occupation', 'location', 'leadSource', 'leadStatus', 'followUpDate', 'comments', 'softDeleted']
    for (const f of fields) if (payload[f] !== undefined) lead[f] = payload[f]
    if (payload.treatment !== undefined) {
      lead.treatment = payload.treatment?.name || payload.treatment || null
    }
    await lead.save()
    // Sync assignees if provided
    if (payload.assigned !== undefined && Array.isArray(payload.assigned)) {
      const desiredUserIds = payload.assigned.filter((u) => u && u.id).map((u) => Number(u.id))
      const existing = await CrmLeadAssignee.findAll({ where: { organisationId: Number(logged.orgId), leadId: lead.id } })
      const existingUserIds = existing.map((a) => a.userId)
      const toAdd = desiredUserIds.filter((id) => !existingUserIds.includes(id))
      const toRemoveLinks = existing.filter((a) => !desiredUserIds.includes(a.userId))
      const toRemove = toRemoveLinks.map((a) => a.id)
      if (toRemove.length) await CrmLeadAssignee.destroy({ where: { id: { [Op.in]: toRemove } } })
      if (toAdd.length) {
        const rows = toAdd.map((userId) => ({ organisationId: Number(logged.orgId), leadId: lead.id, userId }))
        await CrmLeadAssignee.bulkCreate(rows, { ignoreDuplicates: true })
      }

      // Send FCM notifications for assignment changes
      try {
        const actor = await User.findByPk(logged.userId, { attributes: ['id', 'fullName', 'email'] });
        if (toAdd.length) {
          const addedUsers = await User.findAll({ where: { id: toAdd }, attributes: ['id', 'fullName', 'email'] });
          await sendLeadAssignedNotification({ lead, assignedUsers: addedUsers, assignedBy: actor, organisationId: Number(logged.orgId) });
        }
        if (toRemoveLinks.length) {
          const removedIds = toRemoveLinks.map(l => l.userId);
          const removedUsers = await User.findAll({ where: { id: removedIds }, attributes: ['id', 'fullName', 'email'] });
          await sendLeadUnassignedNotification({ lead, removedUsers, removedBy: actor, organisationId: Number(logged.orgId) });
        }
      } catch (fcmError) {
        console.warn('FCM notification failed - continuing with lead update:', fcmError.message);
        // Don't throw the error - let the lead update succeed even if notifications fail
      }
      // shape response assigned
      const users = await User.findAll({ where: { id: desiredUserIds }, attributes: ['id', 'fullName', 'email'] })
      lead.setDataValue('assigned', users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })))
    }
    // shape treatment in response
    lead.setDataValue('treatment', { id: null, name: lead.treatment || '' })
    return success(lead)
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteLeads = async (event) => {
  try {
    const logged = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const ids = payload?.ids || []
    if (!ids.length) return error(400, 'ids required')
    await CrmLead.destroy({ where: { id: { [Op.in]: ids }, organisationId: Number(logged.orgId) } })
    return success('deleted')
  } catch (e) {
    return error(500, e.message)
  }
}

export const bulkUploadLeads = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const leads = payload?.leads || []
    if (!orgId) return error(401, 'Unauthenticated')
    if (!Array.isArray(leads) || !leads.length) return error(400, 'leads required')

    const organisationId = Number(orgId)
    const statusMap = new Map([
      ['new', 'New'],
      ['converted', 'Converted'],
      ['contacted', 'Contacted'],
      ['lost', 'Lost'],
      ['archived', 'Archived'],
    ])

    const candidateUserIds = [...new Set(leads.map((l) => Number(l.assignedUserId)).filter(Boolean))]
    let allowedUserIds = new Set()
    if (candidateUserIds.length) {
      const rows = await UserOrganisation.findAll({
        where: { organisationId, userId: { [Op.in]: candidateUserIds } },
      })
      allowedUserIds = new Set(rows.map((r) => r.userId))
    }

    const results = []
    const validLeads = []
    const seenEmails = new Set()

    leads.forEach((raw, index) => {
      const errors = []
      const name = (raw?.name || '').trim()
      const email = (raw?.email || '').trim()
      const telephone = (raw?.telephone || '').trim()
      const leadSource = raw?.leadSource?.trim?.() || 'Manual'
      const treatment = raw?.treatment?.trim?.() || null
      const rawStatus = raw?.leadStatus?.trim?.() || 'New'
      const status = statusMap.get(rawStatus.toLowerCase())
      const assignedUserId = raw?.assignedUserId ? Number(raw.assignedUserId) : null
      const inquiryDate = parseDateValue(raw?.inquiryDate)
      const followUpDate = parseDateValue(raw?.followUpDate)
      const comments = raw?.comments || null

      if (!name) errors.push('Name is required')
      if (!email) errors.push('Email is required')
      else {
        const emailKey = email.toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) errors.push('Invalid email format')
        if (seenEmails.has(emailKey)) errors.push('Duplicate email in upload')
        else seenEmails.add(emailKey)
      }
      if (!telephone) errors.push('Telephone is required')
      if (!status) errors.push('Invalid lead status')
      if (assignedUserId && !allowedUserIds.has(assignedUserId)) {
        errors.push('Assigned user is not part of this organisation')
      }
      if (raw?.inquiryDate && !inquiryDate) errors.push('Invalid inquiry date')
      if (raw?.followUpDate && !followUpDate) errors.push('Invalid follow-up date')

      if (errors.length) {
        results.push({
          index,
          name,
          email,
          status: 'failed',
          message: errors.join('; '),
        })
        return
      }

      validLeads.push({
        index,
        payload: {
          organisationId,
          name,
          email,
          telephone,
          leadSource,
          leadStatus: status || 'New',
          softDeleted: (status || 'New') === 'Archived',
          treatment,
          inquiryDate: inquiryDate || new Date(),
          followUpDate: followUpDate || null,
          comments,
        },
        assignedUserId,
      })
    })

    if (!validLeads.length) {
      return success({
        message: `0 leads added successfully, ${results.length} failed`,
        results,
      })
    }

    const transaction = await DB.transaction()
    try {
      const created = await CrmLead.bulkCreate(
        validLeads.map((l) => l.payload),
        { transaction, returning: true }
      )

      const assignees = []
      created.forEach((lead, idx) => {
        const link = validLeads[idx]
        if (link.assignedUserId) {
          assignees.push({
            organisationId,
            leadId: lead.id,
            userId: link.assignedUserId,
          })
        }
      })
      if (assignees.length) {
        await CrmLeadAssignee.bulkCreate(assignees, {
          transaction,
          ignoreDuplicates: true,
        })
      }

      await transaction.commit()
      created.forEach((lead, idx) => {
        results.push({
          index: validLeads[idx].index,
          name: lead.name,
          email: lead.email,
          status: 'success',
          id: lead.id,
        })
      })
    } catch (err) {
      await transaction.rollback()
      validLeads.forEach((lead) => {
        results.push({
          index: lead.index,
          name: lead.payload.name,
          status: 'failed',
          message: err.message,
        })
      })
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const failCount = results.length - successCount
    return success({
      message: `${successCount} leads added successfully, ${failCount} failed`,
      results,
    })
  } catch (e) {
    return error(500, e.message)
  }
}

export const bulkUploadAutomations = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const items = Array.isArray(payload?.items) ? payload.items : []
    if (!orgId) return error(401, 'Unauthenticated')
    if (!items.length) return error(400, 'items required')

    const organisationId = Number(orgId)
    const results = []
    const defaultKeySet = new Set((crmAutomationDefaults || []).map((d) => d.key))

    const existingTemplates = await CrmAutomationTemplate.findAll({
      where: { organisationId },
      attributes: ['key'],
    })
    const existingKeySet = new Set(existingTemplates.map((row) => row.key))
    const usedKeys = new Set()

    const existingGroups = await CrmAutomationGroup.findAll({
      where: { organisationId },
      order: [['ordering', 'ASC'], ['createdAt', 'ASC']],
    })
    const groupByLowerTitle = new Map()
    const groupByLowerKey = new Map()
    existingGroups.forEach((g) => {
      const title = String(g.title || '').trim().toLowerCase()
      const key = String(g.key || '').trim().toLowerCase()
      if (title) groupByLowerTitle.set(title, g)
      if (key) groupByLowerKey.set(key, g)
    })

    const transaction = await DB.transaction()
    try {
      for (let index = 0; index < items.length; index += 1) {
        const raw = items[index] || {}
        const errors = []
        const groupName = String(raw.groupName || raw.group_name || '').trim()
        const type = normalizeAutomationType(raw.type)
        const name = String(raw.name || '').trim()
        const subjectRaw = String(raw.subject || '').trim()
        const contentRaw = String(raw.content || '').trim()

        if (!groupName) errors.push('Group name is required')
        if (!name) errors.push('Name is required')
        if (!contentRaw) errors.push('Content is required')

        if (errors.length) {
          results.push({
            index,
            name,
            status: 'failed',
            message: errors.join('; '),
          })
          continue
        }

        let group = null
        const groupKeyLookup = groupName.toLowerCase()
        if (groupByLowerTitle.has(groupKeyLookup)) {
          group = groupByLowerTitle.get(groupKeyLookup)
        } else if (groupByLowerKey.has(groupKeyLookup)) {
          group = groupByLowerKey.get(groupKeyLookup)
        }

        if (!group) {
          const safeKey = await ensureUniqueGroupKey({
            orgId: organisationId,
            key: groupName,
            transaction,
          })
          const nextOrder = (await CrmAutomationGroup.count({
            where: { organisationId },
            transaction,
          })) || 0
          group = await CrmAutomationGroup.create({
            organisationId,
            key: safeKey,
            title: groupName,
            description: null,
            enabled: false,
            ordering: nextOrder,
          }, { transaction })
          groupByLowerTitle.set(groupName.toLowerCase(), group)
          groupByLowerKey.set(String(group.key || '').toLowerCase(), group)
        }

        const key = ensureUniqueTemplateKey({
          base: name,
          existingKeys: existingKeySet,
          reservedKeys: defaultKeySet,
          usedKeys,
        })

        const trigger = { type: 'inquiry_days', days: 0 }
        const sending = formatCrmTriggerPreview(trigger)
        const subject = type === 'Email' ? (subjectRaw || name) : ''
        const template = plainTextToHtml(contentRaw)

        const payload = {
          key,
          groupKey: group.key,
          type,
          name,
          subject,
          sending,
          enabled: false,
          template,
          trigger,
        }

        try {
          await applyAutomationSave({ orgId: organisationId, payload, transaction })
          results.push({
            index,
            name,
            status: 'success',
            key,
            groupKey: group.key,
          })
        } catch (e) {
          results.push({
            index,
            name,
            status: 'failed',
            message: e.message,
          })
        }
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      return error(500, err.message)
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const failCount = results.length - successCount
    return success({
      message: `${successCount} automations added successfully, ${failCount} failed`,
      results,
    })
  } catch (e) {
    return error(500, e.message)
  }
}

export const listOptions = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const query = getQuery(event) || {}
    const category = query.category || query.type
    if (!orgId) return error(401, 'Unauthenticated')
    if (!category) return error(400, 'category required')
    const rows = await CrmOption.findAll({ where: { organisationId: Number(orgId), category, active: true }, order: [['ordering', 'ASC'], ['name', 'ASC']] })
    if (!rows.length && ['lead_source', 'treatment', 'lead_status'].includes(category)) {
      const defaults = {
        lead_source: ['Google Ads', 'Website', 'Referral', 'Walk In', 'Meta Advert', 'Call'],
        treatment: ['Teeth Whitening', 'Teeth Straightening', 'Composite Bonding', 'Veneer'],
        lead_status: [
          { name: 'New', color: '#1BA34C' },
          { name: 'Converted', color: '#0D47A1' },
          { name: 'Contacted', color: '#F39C12' },
          { name: 'Lost', color: '#E53935' }
        ]
      }
      const items = (defaults[category] || []).map((n, i) =>
        typeof n === 'string'
          ? { organisationId: Number(orgId), category, name: n, ordering: i }
          : { organisationId: Number(orgId), category, name: n.name, color: n.color, ordering: i }
      )
      if (items.length) await CrmOption.bulkCreate(items)
    }
    const fresh = await CrmOption.findAll({ where: { organisationId: Number(orgId), category, active: true }, order: [['ordering', 'ASC'], ['name', 'ASC']] })
    return success(fresh)
  } catch (e) {
    return error(500, e.message)
  }
}

export const addOption = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { category, name, color } = payload || {}
    if (!orgId) return error(401, 'Unauthenticated')
    if (!category || !name) return error(400, 'category and name required')
    const created = await CrmOption.create({ organisationId: Number(orgId), category, name, color: color || null })
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteOption = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { id } = payload || {}
    if (!orgId) return error(401, 'Unauthenticated')
    if (!id) return error(400, 'id required')
    await CrmOption.destroy({ where: { id, organisationId: Number(orgId) } })
    return success('deleted')
  } catch (e) {
    return error(500, e.message)
  }
}

const DEFAULT_ALERT_OPTIONS = [
  { key: 'hot',      label: 'Hot lead alerts',          emoji: '🔥', color: 'error' },
  { key: 'time',     label: 'Time-sensitive deadlines',  emoji: '⏰', color: 'warning' },
  { key: 'value',    label: 'High-value opportunity',    emoji: '💸', color: 'tertiary' },
  { key: 'follow',   label: 'Follow-up reminders',       emoji: '🔄', color: 'info' },
  { key: 'callback', label: 'Callback scheduled',        emoji: '📞', color: 'success' },
  { key: 'none',     label: 'No response warnings',      emoji: '🚨', color: 'on-surface' },
]

export const getAlertOptions = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const org = await Organisation.findByPk(Number(orgId), { attributes: ['id', 'automationPlaceholders'] })
    if (!org) return error(404, 'Organisation not found')
    const stored = org.automationPlaceholders?.alertOptions
    return success(Array.isArray(stored) && stored.length ? stored : DEFAULT_ALERT_OPTIONS)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveAlertOptions = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const options = payload?.options
    if (!Array.isArray(options) || !options.length) return error(400, 'Options array is required')
    if (options.length > 30) return error(400, 'Cannot exceed 30 alert options')
    const valid = options.filter(o => o.key && typeof o.label === 'string' && o.label.trim())
    if (!valid.length) return error(400, 'Each option must have a key and label')
    const oversized = valid.find(o => o.label.length > 100)
    if (oversized) return error(400, `Label "${oversized.label.slice(0, 30)}..." exceeds 100 characters`)
    const keys = valid.map(o => o.key)
    if (new Set(keys).size !== keys.length) return error(400, 'Alert option keys must be unique')
    const labels = valid.map(o => o.label.trim().toLowerCase())
    if (new Set(labels).size !== labels.length) return error(400, 'Alert option names must be unique (case-insensitive)')
    const org = await Organisation.findByPk(Number(orgId))
    if (!org) return error(404, 'Organisation not found')
    org.automationPlaceholders = { ...(org.automationPlaceholders || {}), alertOptions: valid }
    await org.save()
    return success(valid)
  } catch (e) {
    return error(500, e.message)
  }
}

export const getLeadCommunication = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const q = getQuery(event) || {}
    const leadId = Number(q.leadId || 0)
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const row = await CrmLeadCommunication.findOne({ where: { organisationId: Number(orgId), leadId } })
    return success(row || null)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveLeadCommunication = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { leadId } = payload || {}
    const preferredContactMethod = payload?.preferredContactMethod && CONTACT_METHODS.includes(payload.preferredContactMethod)
      ? payload.preferredContactMethod
      : undefined
    const preferredAppointmentDay = payload?.preferredAppointmentDay && APPOINTMENT_DAYS.includes(payload.preferredAppointmentDay)
      ? payload.preferredAppointmentDay
      : undefined
    const bestTimesToContact = Array.isArray(payload?.bestTimesToContact)
      ? payload.bestTimesToContact.filter(v => BEST_TIMES.includes(v))
      : undefined
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const exists = await CrmLeadCommunication.findOne({ where: { organisationId: Number(orgId), leadId: Number(leadId) } })
    if (exists) {
      if (preferredContactMethod !== undefined) exists.preferredContactMethod = preferredContactMethod
      if (preferredAppointmentDay !== undefined) exists.preferredAppointmentDay = preferredAppointmentDay
      if (bestTimesToContact !== undefined) exists.bestTimesToContact = bestTimesToContact
      await exists.save()
      return success(exists)
    }
    const created = await CrmLeadCommunication.create({
      organisationId: Number(orgId),
      leadId: Number(leadId),
      preferredContactMethod: preferredContactMethod || null,
      preferredAppointmentDay: preferredAppointmentDay || null,
      bestTimesToContact: bestTimesToContact || []
    })
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const getLeadTreatment = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const { leadId } = typeof body === 'string' ? parseJsonBody(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const row = await CrmLeadTreatment.findOne({ where: { organisationId: Number(orgId), leadId: Number(leadId) } })
    return success(row || null)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveLeadTreatment = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { leadId, data } = payload || {}
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const exists = await CrmLeadTreatment.findOne({ where: { organisationId: Number(orgId), leadId: Number(leadId) } })
    const fields = ['primaryTreatment', 'secondaryTreatments', 'concerns', 'treatmentAreas', 'previousExperience', 'budget', 'specialOccasion']
    if (exists) {
      for (const f of fields) if (data?.[f] !== undefined) exists[f] = data[f]
      await exists.save()
      return success(exists)
    }
    const created = await CrmLeadTreatment.create({
      organisationId: Number(orgId),
      leadId: Number(leadId),
      ...data
    })
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteLeadTreatment = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const { leadId } = typeof body === 'string' ? parseJsonBody(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    await CrmLeadTreatment.destroy({ where: { organisationId: Number(orgId), leadId: Number(leadId) } })
    return success('deleted')
  } catch (e) {
    return error(500, e.message)
  }
}

export const listLeadNotes = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const { leadId } = typeof body === 'string' ? parseJsonBody(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const rows = await CrmLeadNote.findAll({ where: { organisationId: Number(orgId), leadId: Number(leadId) }, order: [['createdAt', 'DESC']] })
    return success(rows)
  } catch (e) {
    return error(500, e.message)
  }
}

export const listLeadWhatsAppLogs = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const { leadId, limit = 100 } = typeof body === 'string' ? parseJsonBody(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const rows = await CrmWhatsAppMessageLog.findAll({
      where: {
        organisationId: Number(orgId),
        leadId: Number(leadId),
      },
      order: [['createdAt', 'DESC']],
      limit: Math.min(Math.max(Number(limit) || 100, 1), 500),
    })
    return success(rows)
  } catch (e) {
    return error(500, e.message)
  }
}

export const addLeadNote = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { leadId, title, date, time, channel, summary } = payload || {}
    if (!orgId) return error(401, 'Unauthenticated')
    for (const k of ['leadId', 'title', 'date', 'time', 'channel', 'summary']) if (!payload?.[k]) return error(400, `${k} is required`)
    const created = await CrmLeadNote.create({
      organisationId: Number(orgId),
      leadId: Number(leadId),
      title, date, time, channel, summary
    })
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteLeadNote = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const { id } = typeof body === 'string' ? parseJsonBody(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!id) return error(400, 'id required')
    await CrmLeadNote.destroy({ where: { id, organisationId: Number(orgId) } })
    return success('deleted')
  } catch (e) {
    return error(500, e.message)
  }
}

export const uploadLeadAttachment = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const parts = await readMultipartFormData(event)
    const filePart = Array.isArray(parts)
      ? parts.find((part) => part?.filename && part?.data)
      : null
    if (!filePart) return error(400, 'file required')

    const originalName = String(filePart.filename || 'attachment.pdf')
    const ext = originalName.includes('.') ? originalName.split('.').pop() : ''
    const safeName = sanitizeFilename(originalName) || `attachment.${ext || 'pdf'}`
    const contentType = String(filePart.type || '').toLowerCase()
    const isPdfByType = contentType.includes('pdf')
    const isPdfByName = safeName.toLowerCase().endsWith('.pdf')
    if (!isPdfByType && !isPdfByName) {
      return error(400, 'Only PDF files are allowed')
    }

    const stampedName = `${Date.now()}-${safeName}`
    const baseDir = 'documents/crm/price-lists'
    const link = await uploadBufferFile({
      data: filePart.data,
      filename: stampedName,
      contentType: filePart.type || 'application/pdf',
      baseDir,
    })

    return success({
      link,
      name: originalName,
      contentType: filePart.type || 'application/pdf',
      size: Number(filePart.data?.length || 0),
      uploadedAt: new Date().toISOString(),
    })
  } catch (e) {
    return error(500, e.message || 'Failed to upload attachment')
  }
}

export const uploadLeadWhatsAppMedia = async (event) => {
  try {
    const { orgId, userId } = event.context.user || {}
    if (!orgId || !userId) return error(401, 'Unauthenticated')

    const formData = await readMultipartFormData(event)
    if (!formData || !formData.length) return error(400, 'No file uploaded')

    const fileData = formData.find((item) => item.name === 'file')
    if (!fileData) return error(400, 'Missing file')

    const originalName = fileData.filename || 'file'
    const fileExt = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : ''
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`
    const mimeType = fileData.type || 'application/octet-stream'

    const s3Path = await uploadBufferFile({
      data: fileData.data,
      filename: uniqueFileName,
      contentType: mimeType,
      baseDir: 'chat-attachments',
    })

    const attachmentType = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
        ? 'video'
        : mimeType.startsWith('audio/')
          ? 'audio'
          : 'document'

    return success({
      url: s3Path,
      name: originalName,
      mimeType,
      type: attachmentType,
      size: fileData.data?.length || null,
    })
  } catch (e) {
    return error(500, e.message || 'Failed to upload media')
  }
}

// Alias so legacy route 'whatsappUploadAttachment' still works
export const uploadWhatsAppAttachment = uploadLeadWhatsAppMedia

export const getLeadPriceAttachmentRecent = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const leadIds = Array.isArray(payload?.leadIds)
      ? [...new Set(payload.leadIds.map((id) => Number(id)).filter(Boolean))]
      : []
    if (!leadIds.length) return error(400, 'leadIds required')

    const rows = await CrmLead.findAll({
      where: {
        organisationId: Number(orgId),
        id: { [Op.in]: leadIds },
      },
      attributes: ['id', 'rawData'],
      limit: 200,
    })

    let latest = null
    for (const row of rows) {
      const raw = getLeadRawData(row)
      const sendPriceRecent = raw?.manualSendAssets?.sendPriceRecent || null
      if (!sendPriceRecent) continue
      const ts = new Date(sendPriceRecent.updatedAt || sendPriceRecent.sentAt || 0).getTime()
      if (!latest || ts > latest.ts) {
        latest = { ts, data: sendPriceRecent, leadId: row.id }
      }
    }

    return success({
      attachment: latest?.data?.attachment || null,
      priceLink: latest?.data?.priceLink || '',
      subject: latest?.data?.subject || '',
      updatedAt: latest?.data?.updatedAt || null,
      leadId: latest?.leadId || null,
    })
  } catch (e) {
    return error(500, e.message || 'Failed to fetch recent price attachment')
  }
}

// Automation templates
export const listAutomationGroups = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const groups = await seedAutomationGroups(orgId)
    const mappings = await CrmAutomationGroupTemplate.findAll({
      where: { organisationId: Number(orgId) },
      order: [['ordering', 'ASC'], ['createdAt', 'ASC']],
    })

    const keysByGroup = new Map()
    mappings.forEach((row) => {
      const list = keysByGroup.get(row.groupId) || []
      list.push(row.templateKey)
      keysByGroup.set(row.groupId, list)
    })

    const shaped = groups.map((group) => {
      const g = typeof group?.toJSON === 'function' ? group.toJSON() : group
      return {
        ...g,
        templateKeys: keysByGroup.get(g.id) || [],
      }
    })
    return success(shaped)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveAutomationGroup = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { id, key, title, description, enabled } = payload || {}

    if (!title && !key) return error(400, 'title or key required')

    let group = null
    if (id || key) {
      group = await CrmAutomationGroup.findOne({
        where: {
          organisationId: Number(orgId),
          ...(id ? { id: Number(id) } : {}),
          ...(key ? { key: String(key) } : {}),
        },
      })
    }

    if (group) {
      if (title !== undefined) group.title = title
      if (description !== undefined) group.description = description
      if (enabled !== undefined) group.enabled = !!enabled
      if (key !== undefined) {
        group.key = await ensureUniqueGroupKey({ orgId, key, excludeId: group.id })
      }
      await group.save()
      return success(group)
    }

    const nextOrder = await CrmAutomationGroup.count({ where: { organisationId: Number(orgId) } })
    const safeKey = await ensureUniqueGroupKey({ orgId, key: key || title })
    const created = await CrmAutomationGroup.create({
      organisationId: Number(orgId),
      key: safeKey,
      title: title || safeKey,
      description: description || null,
      enabled: !!enabled,
      ordering: nextOrder,
      source: 'custom',
    })
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteAutomationGroup = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { id, key } = payload || {}
    if (!id && !key) return error(400, 'id or key required')

    const group = await CrmAutomationGroup.findOne({
      where: {
        organisationId: Number(orgId),
        ...(id ? { id: Number(id) } : {}),
        ...(key ? { key: String(key) } : {}),
      },
    })
    if (!group) return error(404, 'Group not found')

    await DB.transaction(async (transaction) => {
      await CrmAutomationGroupTemplate.destroy({
        where: { organisationId: Number(orgId), groupId: group.id },
        transaction,
      })
      await CrmAutomationGroup.destroy({
        where: { organisationId: Number(orgId), id: group.id },
        transaction,
      })
    })
    return success('deleted')
  } catch (e) {
    console.error('[deleteAutomationGroup]', e?.message || e)
    return error(500, e.message)
  }
}

export const listAutomation = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const query = getQuery(event) || {}
    const leadId = Number(query.leadId || 0)
    const rows = await CrmAutomationTemplate.findAll({ where: { organisationId: Number(orgId) }, order: [['createdAt','ASC']] })
    const dbRows = rows.map((tpl) => (typeof tpl?.toJSON === 'function' ? tpl.toJSON() : tpl))
    const dbMap = new Map(dbRows.map((r) => [r.key, r]))
    let overrides = {}
    let sentKeys = {}
    if (leadId) {
      const lead = await CrmLead.findOne({ where: { organisationId: Number(orgId), id: leadId } })
      if (!lead) return error(404, 'Lead not found')
      overrides = lead?.rawData?.crmAutomationOverrides || {}
      sentKeys = lead?.rawData?.automationSentKeys || {}
    }

    let groupMappings = []
    let groups = []
    try {
      groupMappings = await CrmAutomationGroupTemplate.findAll({
        where: { organisationId: Number(orgId) },
      })
      const groupIds = [...new Set(groupMappings.map((m) => Number(m.groupId)).filter(Boolean))]
      groups = groupIds.length
        ? await CrmAutomationGroup.findAll({ where: { organisationId: Number(orgId), id: { [Op.in]: groupIds } } })
        : []
    } catch {}
    const groupKeyById = new Map(groups.map((g) => [Number(g.id), g.key]))
    const groupKeyByTemplate = new Map()
    groupMappings.forEach((m) => {
      const gKey = groupKeyById.get(Number(m.groupId))
      if (!gKey || groupKeyByTemplate.has(m.templateKey)) return
      groupKeyByTemplate.set(m.templateKey, gKey)
    })

    const merged = []
    const seen = new Set()

    crmAutomationDefaults.forEach((def) => {
      const saved = dbMap.get(def.key) || {}
      const override = overrides[def.key] || {}
      const combined = { ...def, ...saved, ...override, key: def.key }
      if (!combined.groupKey) combined.groupKey = groupKeyByTemplate.get(def.key)
      if (!saved?.type) combined.type = def.type
      if (!saved?.sending) combined.sending = def.sending
      if (!saved?.template) combined.template = def.template
      if (!saved?.name || saved.name === saved.key) combined.name = def.name
      if (saved?.trigger === undefined && def.trigger !== undefined) combined.trigger = def.trigger
      merged.push(combined)
      seen.add(def.key)
    })

    dbRows.forEach((row) => {
      if (seen.has(row.key)) return
      const override = overrides[row.key]
      const combined = override ? { ...row, ...override, key: row.key } : row
      if (!combined.groupKey) combined.groupKey = groupKeyByTemplate.get(row.key)
      merged.push(combined)
      seen.add(row.key)
    })

    Object.entries(overrides).forEach(([key, override]) => {
      if (seen.has(key)) return
      const combined = { key, ...override }
      if (!combined.groupKey) combined.groupKey = groupKeyByTemplate.get(key)
      merged.push(combined)
    })

    if (leadId) {
      merged.forEach((item) => {
        const direct = sentKeys[item.key]
        if (direct) {
          item.lastSentAt = direct
        } else {
          const compound = Object.entries(sentKeys).find(([k]) => k.startsWith(item.key + '_'))
          item.lastSentAt = compound ? compound[1] : null
        }
      })
    }

    return success(merged)
  } catch (e) {
    return error(500, e.message)
  }
}

const applyAutomationSave = async ({ orgId, payload, transaction }) => {
  const clean = validateAutomationPayload(payload)
  const {
    key,
    type = 'Email',
    name,
    subject,
    sending,
    enabled,
    template,
    leadId,
    groupKey,
    trigger,
    whatsappTemplateName,
    whatsappTemplateLanguage,
  } = clean
  if (!key) throw new Error('key required')

  if (leadId) {
    const lead = await CrmLead.findOne({
      where: { organisationId: Number(orgId), id: Number(leadId) },
      transaction,
    })
    if (!lead) throw new Error('Lead not found')
    const raw = lead.rawData || {}
    const overrides = { ...(raw.crmAutomationOverrides || {}) }
    overrides[key] = {
      key,
      type,
      name: name || key,
      subject: subject || '',
      sending: sending || '',
      enabled: !!enabled,
      template: template || '',
      whatsappTemplateName: whatsappTemplateName || '',
      whatsappTemplateLanguage: whatsappTemplateLanguage || '',
      trigger: trigger ?? null,
    }
    lead.rawData = { ...raw, crmAutomationOverrides: overrides }
    await lead.save({ transaction })
    return overrides[key]
  }

  if (groupKey) {
    const group = await CrmAutomationGroup.findOne({
      where: { organisationId: Number(orgId), key: String(groupKey) },
      transaction,
    })
    if (!group) throw new Error('Invalid group key')
    await CrmAutomationGroupTemplate.destroy({
      where: { organisationId: Number(orgId), templateKey: String(key) },
      transaction,
    })
    await CrmAutomationGroupTemplate.create({
      organisationId: Number(orgId),
      groupId: group.id,
      templateKey: String(key),
      ordering: 0,
    }, { transaction })
  }

  const where = { organisationId: Number(orgId), key }
  const exists = await CrmAutomationTemplate.findOne({ where, transaction })
  if (exists) {
    if (name !== undefined) exists.name = name
    if (sending !== undefined) exists.sending = sending
    if (enabled !== undefined) exists.enabled = !!enabled
    if (type !== undefined) exists.type = type
    if (template !== undefined) exists.template = template
    if (subject !== undefined) exists.subject = subject
    if (whatsappTemplateName !== undefined) exists.whatsappTemplateName = whatsappTemplateName || null
    if (whatsappTemplateLanguage !== undefined) exists.whatsappTemplateLanguage = whatsappTemplateLanguage || null
    if (trigger !== undefined) exists.trigger = trigger
    await exists.save({ transaction })
    return exists
  }

  const created = await CrmAutomationTemplate.create({
    organisationId: Number(orgId),
    key,
    type,
    name: name || key,
    subject: subject || null,
    sending: sending || '',
    enabled: !!enabled,
    template: template || null,
    whatsappTemplateName: whatsappTemplateName || null,
    whatsappTemplateLanguage: whatsappTemplateLanguage || null,
    trigger: trigger ?? null,
  }, { transaction })
  return created
}

export const saveAutomation = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const result = await applyAutomationSave({ orgId, payload })
    const out =
      result && typeof result.toJSON === 'function'
        ? result.toJSON()
        : { ...(result || {}) }
    if (payload?.trigger?.type === 'send_now' && payload?.enabled && !payload?.leadId) {
      const waitForSendNow =
        payload?.awaitSendNow === true ||
        String(payload?.awaitSendNow || '').toLowerCase() === 'true'
      const forceResend =
        payload?.forceResend === true ||
        String(payload?.forceResend || '').toLowerCase() === 'true'
      if (waitForSendNow) {
        if (!forceResend) {
          const preview = await previewSendNowAutomation(orgId, out)
          if (Number(preview?.alreadySent || 0) > 0) {
            out.sendNowConfirmationRequired = true
            out.sendNowPreview = preview
            return success(out)
          }
        }
        try {
          const summary = await dispatchSendNowAutomationWithOptions(orgId, out, { forceResend })
          out.sendNowResult = summary
        } catch (e) {
          return error(500, e?.message || 'Failed to run send now')
        }
      } else {
        const job = createSendNowJob({ orgId, key: out?.key || payload?.key })
        out.sendNowJob = {
          jobId: job.jobId,
          status: job.status,
          startedAt: job.startedAt,
        }
        dispatchSendNowAutomation(orgId, out)
          .then((summary) => completeSendNowJob({ orgId, jobId: job.jobId, result: summary }))
          .catch((e) => {
            console.error('[CRM send_now] dispatch failed', e?.message)
            failSendNowJob({ orgId, jobId: job.jobId, err: e })
          })
      }
    }
    return success(out)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveAutomationBatch = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const items = Array.isArray(payload?.items) ? payload.items : []
    if (!items.length) return error(400, 'items required')

    const transaction = await DB.transaction()
    try {
      const results = []
      const sendNowItems = []
      for (const item of items) {
        const res = await applyAutomationSave({ orgId, payload: item, transaction })
        results.push(res)
        if (item?.trigger?.type === 'send_now' && item?.enabled && !item?.leadId) {
          sendNowItems.push(res)
        }
      }
      await transaction.commit()
      const sendNowJobs = []
      for (const tpl of sendNowItems) {
        const out =
          tpl && typeof tpl.toJSON === 'function'
            ? tpl.toJSON()
            : { ...(tpl || {}) }
        const job = createSendNowJob({ orgId, key: out?.key })
        sendNowJobs.push({
          key: out?.key || '',
          jobId: job.jobId,
          status: job.status,
          startedAt: job.startedAt,
        })
        dispatchSendNowAutomation(orgId, out)
          .then((summary) => completeSendNowJob({ orgId, jobId: job.jobId, result: summary }))
          .catch((e) => {
            console.error('[CRM send_now] batch dispatch failed', e?.message)
            failSendNowJob({ orgId, jobId: job.jobId, err: e })
          })
      }
      return success({ items: results, updated: results.length, sendNowJobs })
    } catch (e) {
      await transaction.rollback()
      return error(500, e.message)
    }
  } catch (e) {
    return error(500, e.message)
  }
}

export const getAutomationSendNowStatus = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    pruneSendNowJobs()
    const query = getQuery(event) || {}
    const jobId = String(query?.jobId || '').trim()
    if (!jobId) return error(400, 'jobId required')
    const job = getSendNowJob({ orgId, jobId })
    if (!job) return error(404, 'Send now status not found')
    return success({
      jobId: job.jobId,
      key: job.key,
      status: job.status,
      startedAt: job.startedAt,
      updatedAt: new Date(job.updatedAt).toISOString(),
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
    })
  } catch (e) {
    return error(500, e.message)
  }
}

export const resetAutomationOverride = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const leadId = Number(payload?.leadId || 0)
    const key = String(payload?.key || '').trim()
    if (!leadId) return error(400, 'leadId required')
    if (!key) return error(400, 'key required')

    const lead = await CrmLead.findOne({
      where: { organisationId: Number(orgId), id: leadId },
    })
    if (!lead) return error(404, 'Lead not found')

    const raw = lead.rawData || {}
    const overrides = { ...(raw.crmAutomationOverrides || {}) }
    if (overrides[key]) {
      delete overrides[key]
      const nextRaw = { ...raw }
      if (Object.keys(overrides).length) {
        nextRaw.crmAutomationOverrides = overrides
      } else {
        delete nextRaw.crmAutomationOverrides
      }
      lead.rawData = nextRaw
      await lead.save()
    }

    return success({ reset: true, key })
  } catch (e) {
    return error(500, e.message)
  }
}

export const deleteAutomation = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const key = String(payload?.key || '').trim()
    if (!key) return error(400, 'Automation key required')

    const defaultKeys = new Set(crmAutomationDefaults.map((item) => item.key))
    if (defaultKeys.has(key)) {
      return error(400, 'Default automations cannot be deleted')
    }

    await CrmAutomationGroupTemplate.destroy({
      where: { organisationId: Number(orgId), templateKey: key },
    })
    const deleted = await CrmAutomationTemplate.destroy({
      where: { organisationId: Number(orgId), key },
    })

    return success({ deleted: !!deleted, key })
  } catch (e) {
    return error(500, e.message)
  }
}

// Send email to selected leads
export const sendLeadMail = async (event) => {
  try {
    const { orgId, fullName } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { leadIds = [], subject, html, key, attachments = [], metadata = {} } = payload || {}
    const safeSubject = String(subject || '').trim()
    const safeHtml = typeof html === 'string' ? html : ''
    if (!safeSubject) return error(400, 'subject required')
    if (!Array.isArray(leadIds) || !leadIds.length) return error(400, 'leadIds required')
    const normalizedAttachments = Array.isArray(attachments)
      ? attachments
          .map((item) => ({
            link: item?.link || item?.url || item?.path || null,
            name: item?.name || item?.filename || 'Attachment.pdf',
            contentType: item?.contentType || 'application/pdf',
          }))
          .filter((item) => item.link)
      : []

    // Optionally fetch a template to persist edits
    if (key) {
      const where = { organisationId: Number(orgId), key }
      const existing = await CrmAutomationTemplate.findOne({ where })
      if (existing) {
        existing.name = existing.name || safeSubject
        existing.subject = existing.subject || safeSubject
        existing.template = safeHtml || existing.template || ''
        await existing.save()
      } else {
        await CrmAutomationTemplate.create({
          organisationId: Number(orgId),
          key,
          type: 'Email',
          name: safeSubject,
          subject: safeSubject,
          sending: 'Manual',
          enabled: true,
          template: safeHtml || ''
        })
      }
    }

    const leads = await CrmLead.findAll({ where: { id: { [Op.in]: leadIds }, organisationId: Number(orgId), softDeleted: false } })
    const result = await sendLeadBulkEmail({
      leads,
      subject: safeSubject,
      html: safeHtml,
      senderName: fullName,
      attachments: normalizedAttachments,
    })

    const sentAt = new Date().toISOString()
    const isSendPrice = String(key || '') === 'manual_sendPrice'
    const selectionKey = isSendPrice ? buildLeadSelectionKey(leadIds) : null
    const attachmentMeta = isSendPrice ? (normalizedAttachments[0] || null) : null
    const priceLink = isSendPrice ? String(metadata?.priceLink || '').trim() : null

    for (const lead of leads) {
      const raw = getLeadRawData(lead)
      const updatedRaw = { ...raw }

      const log = Array.isArray(raw.manualSentLog) ? [...raw.manualSentLog] : []
      log.push({ type: 'Email', subject: safeSubject, sentAt })
      updatedRaw.manualSentLog = log

      if (isSendPrice) {
        const manual = raw.manualSendAssets && typeof raw.manualSendAssets === 'object'
          ? raw.manualSendAssets
          : {}
        manual.sendPriceRecent = { attachment: attachmentMeta, priceLink, subject: safeSubject, selectionKey, updatedAt: sentAt }
        updatedRaw.manualSendAssets = manual
      }

      lead.rawData = updatedRaw
      await lead.save()
    }

    return success({ sent: result.sent })
  } catch (e) {
    return error(500, e.message)
  }
}

// Send WhatsApp message to selected leads (supports leadIds or direct recipients array)
export const sendLeadWhatsApp = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { leadIds = [], recipients = [], template, message, attachments = [] } = payload || {}
    const normalizedRecipients = Array.isArray(recipients)
      ? recipients
          .map((item) => ({
            id: item?.id ? Number(item.id) : null,
            name: String(item?.name || item?.fullName || '').trim(),
            email: String(item?.email || '').trim(),
            telephone: String(item?.telephone || item?.phone || item?.mobile || '').trim(),
          }))
          .filter((item) => item.telephone)
      : []
    if ((!Array.isArray(leadIds) || !leadIds.length) && !normalizedRecipients.length) return error(400, 'leadIds or recipients required')
    const messageText = String(message || '').trim()
    const hasTemplate = !!template
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0
    if (!hasTemplate && !messageText && !hasAttachments) return error(400, 'template, message, or attachments required for WhatsApp outbound')

    const waConfig = await resolveWhatsAppProviderConfig(orgId)
    if (!waConfig?.provider) {
      return error(400, 'WhatsApp provider not configured')
    }
    if (waConfig.provider === 'meta' && (!waConfig.phoneNumberId || !waConfig.accessToken)) {
      return error(400, 'WhatsApp is not configured')
    }
    if (waConfig.provider === 'whapi' && !waConfig.token) {
      return error(400, 'Whapi token is missing')
    }

    const limitStatus = await isWhatsAppLimitExceeded(orgId, event.context.user?.userId)
    if (limitStatus.exceeded) {
      return error(402, `WhatsApp monthly limit reached (${limitStatus.count}/${limitStatus.limit})`)
    }

    const useTemplate = waConfig.provider === 'meta' && hasTemplate

    const leads = Array.isArray(leadIds) && leadIds.length
      ? await CrmLead.findAll({
          where: { id: { [Op.in]: leadIds }, organisationId: Number(orgId), softDeleted: false },
        })
      : normalizedRecipients
    if (!leads.length) return error(404, 'No leads found')

    const metaUrl = waConfig.provider === 'meta'
      ? `https://graph.facebook.com/v24.0/${waConfig.phoneNumberId}/messages`
      : null
    const whapiBase = waConfig.provider === 'whapi'
      ? String(waConfig.baseUrl || '').replace(/\/+$/, '')
      : null
    let sent = 0
    let failed = 0
    let skipped = 0
    const failures = []

    const toAbsoluteUrl = (value) => {
      const raw = String(value || '').trim()
      if (!raw) return null
      if (/^https?:\/\//i.test(raw)) return raw
      const config = useRuntimeConfig()
      const base = config.public?.BASE_URL || config.BASE_URL || process.env.BASE_URL || ''
      if (!base) return raw
      return `${String(base).replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
    }

    for (const lead of leads) {
      const to = normalizeWhatsAppNumber(lead.telephone)
      if (!to) {
        skipped += 1
        await logWhatsAppMessage({
          organisationId: orgId,
          leadId: lead.id || null,
          to: lead.telephone || null,
          type: useTemplate ? 'template' : 'text',
          templateName: useTemplate ? (template?.name || template?.namespace || null) : null,
          status: 'skipped',
          error: 'Missing or invalid phone number',
        })
        failures.push({ leadId: lead.id, error: 'Missing or invalid phone number' })
        continue
      }

      const leadName = lead?.name || lead?.fullName || lead?.email || 'there'
      const senderName = event.context.user?.fullName || event.context.user?.name || 'Team'
      const resolvedText = renderLeadTokens(messageText, {
        name: leadName,
        email: lead?.email || '',
        telephone: lead?.telephone || '',
        yourName: senderName,
      })

      if (waConfig.provider === 'whapi' && !messageText && !hasAttachments) {
        failed += 1
        await logWhatsAppMessage({
          organisationId: orgId,
          leadId: lead.id || null,
          to,
          type: 'text',
          status: 'failed',
          error: 'Nothing to send (no message text or attachments)',
        })
        failures.push({ leadId: lead.id, error: 'Nothing to send' })
        continue
      }

      try {
        if (useTemplate || resolvedText) {
          const bodyPayload = waConfig.provider === 'meta'
            ? {
                messaging_product: 'whatsapp',
                to,
                type: useTemplate ? 'template' : 'text',
                ...(useTemplate
                  ? { template }
                  : { text: { body: String(resolvedText || '') } }),
              }
            : { to, body: String(resolvedText || '') }

          const resp = await $fetch(waConfig.provider === 'meta' ? metaUrl : `${whapiBase}/messages/text`, {
            method: 'POST',
            headers: waConfig.provider === 'meta'
              ? {
                  Authorization: `Bearer ${waConfig.accessToken}`,
                  'Content-Type': 'application/json',
                }
              : {
                  Authorization: `Bearer ${waConfig.token}`,
                  'Content-Type': 'application/json',
                },
            body: bodyPayload,
          })
          const providerMessageId =
            resp?.messages?.[0]?.id ||
            resp?.message?.id ||
            resp?.id ||
            null
          if (typeof lead?.save === 'function') {
            await markWhatsAppOutbound(lead, to)
          }
          await logWhatsAppMessage({
            organisationId: orgId,
            leadId: lead.id || null,
            to,
            type: useTemplate ? 'template' : 'text',
            templateName: useTemplate ? (template?.name || template?.namespace || null) : null,
            status: 'sent',
            providerMessageId,
            content: useTemplate ? null : String(resolvedText || ''),
          })
          sent += 1
        }

        if (hasAttachments) {
          for (const att of attachments) {
            const url = toAbsoluteUrl(att?.url)
            if (!url) continue
            const mime = String(att?.mimeType || '').toLowerCase()
            const name = att?.name || null
            const type =
              att?.type ||
              (mime.startsWith('image/') ? 'image' :
                mime.startsWith('video/') ? 'video' :
                  mime.startsWith('audio/') ? 'audio' : 'document')

            let resp = null
            if (waConfig.provider === 'meta') {
              const bodyPayload = {
                messaging_product: 'whatsapp',
                to,
                type,
                ...(type === 'image' ? { image: { link: url } } : {}),
                ...(type === 'video' ? { video: { link: url } } : {}),
                ...(type === 'audio' ? { audio: { link: url } } : {}),
                ...(type === 'document' ? { document: { link: url, filename: name || undefined } } : {}),
              }
              resp = await $fetch(metaUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${waConfig.accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: bodyPayload,
              })
            } else {
              const endpoint =
                type === 'image' ? 'image' :
                  type === 'video' ? 'video' :
                    type === 'audio' ? 'audio' : 'document'
              const bodyPayload = {
                to,
                type: 'url',
                ...(endpoint === 'image' ? { image: url } : {}),
                ...(endpoint === 'video' ? { video: url } : {}),
                ...(endpoint === 'audio' ? { audio: url } : {}),
                ...(endpoint === 'document' ? { document: url, filename: name || undefined } : {}),
              }
              resp = await $fetch(`${whapiBase}/messages/${endpoint}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${waConfig.token}`,
                  'Content-Type': 'application/json',
                },
                body: bodyPayload,
              })
            }

            const providerMessageId =
              resp?.messages?.[0]?.id ||
              resp?.message?.id ||
              resp?.id ||
              null
            if (typeof lead?.save === 'function') {
              await markWhatsAppOutbound(lead, to)
            }
            await logWhatsAppMessage({
              organisationId: orgId,
              leadId: lead.id || null,
              to,
              type,
              status: 'sent',
              providerMessageId,
              content: name || null,
              attachments: [{ ...att, url }],
            })
            sent += 1
          }
        }
      } catch (e) {
        failed += 1
        await logWhatsAppMessage({
          organisationId: orgId,
          leadId: lead.id || null,
          to,
          type: useTemplate ? 'template' : 'text',
          templateName: useTemplate ? (template?.name || template?.namespace || null) : null,
          status: 'failed',
          error: e?.data?.error?.message || e?.message || 'Failed to send',
        })
        failures.push({
          leadId: lead.id || null,
          error: e?.data?.error?.message || e?.message || 'Failed to send',
        })
      }
    }

    return success({ sent, failed, skipped, failures })
  } catch (e) {
    return error(500, e.message)
  }
}

export const getWhatsAppUsage = async (event) => {
  try {
    const { orgId, userId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const usage = await isWhatsAppLimitExceeded(orgId, userId)
    return success({ count: usage.count, limit: usage.limit })
  } catch (e) {
    return error(500, e.message)
  }
}

export const getLeadAutomationLog = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const { leadId, page = 1, limit = 25 } = getQuery(event)
    if (!leadId) return error(400, 'leadId required')

    const lead = await CrmLead.findOne({ where: { id: leadId, organisationId: orgId } })
    if (!lead) return error(404, 'Lead not found')

    const sentKeys = lead.rawData?.automationSentKeys || {}
    const manualLog = Array.isArray(lead.rawData?.manualSentLog) ? lead.rawData.manualSentLog : []

    if (!Object.keys(sentKeys).length && !manualLog.length) return success({ rows: [], total: 0 })

    const allRows = []

    if (Object.keys(sentKeys).length) {
      const templates = await CrmAutomationTemplate.findAll({
        where: { organisationId: orgId },
        attributes: ['key', 'name', 'type'],
      })
      const templateMap = new Map(templates.map((t) => [t.key, t]))
      const defaultMap = new Map(crmAutomationDefaults.map((d) => [d.key, d]))

      Object.entries(sentKeys).forEach(([key, sentAt]) => {
        const tpl = templateMap.get(key)
        const def = defaultMap.get(key)
        allRows.push({
          key,
          name: tpl?.name || def?.name || key,
          type: tpl?.type || def?.type || 'Email',
          sentAt,
          source: 'automation',
        })
      })
    }

    manualLog.forEach((entry) => {
      allRows.push({
        key: '',
        name: entry.subject || 'Manual Send',
        type: entry.type || 'Email',
        sentAt: entry.sentAt,
        source: 'manual',
      })
    })

    allRows.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

    const total = allRows.length
    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(100, Math.max(1, Number(limit)))
    const rows = allRows.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return success({ rows, total })
  } catch (e) {
    return error(500, e.message)
  }
}
