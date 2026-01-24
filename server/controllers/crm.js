import { Op } from 'sequelize'
import { CrmLead, CrmLeadTreatment, CrmLeadNote, CrmOption, CrmLeadCommunication, CrmLeadAssignee, CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, MetaPage, User, UserOrganisation } from '../models'
import { crmAutomationDefaults, crmAutomationGroups } from '~/lib/crmAutomationDefaults'
import { CONTACT_METHODS, APPOINTMENT_DAYS, BEST_TIMES } from '../models/crm/leadCommunications'
import { success, error } from '../utils/response'
import { sendLeadBulkEmail } from '../utils/emailNotifications.js'
import { sendImmediateCrmAutomationsForLead } from '../utils/crmAutomation.js'
import DB from '../utils/db'

const parseDateValue = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  return null;
};

const slugifyKey = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  const base = raw
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-|-$|^_+|_+$/g, '')
  return base || 'automation_group'
}

const ensureUniqueGroupKey = async ({ orgId, key, excludeId = null }) => {
  let candidate = slugifyKey(key)
  let suffix = 1
  while (true) {
    const existing = await CrmAutomationGroup.findOne({
      where: {
        organisationId: Number(orgId),
        key: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    })
    if (!existing) return candidate
    candidate = `${slugifyKey(key)}_${suffix}`
    suffix += 1
  }
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
    if (!includeArchived) where.softDeleted = archivedOnly ? true : false
    if (archivedOnly) where.softDeleted = true

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
    const rows = await CrmLead.findAll({
      where,
      include: [
        {
          model: CrmLeadAssignee,
          as: 'assignees',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    })
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
    return success(shaped)
  } catch (e) {
    return error(500, e.message)
  }
}

export const createLead = async (event) => {
  try {
    const logged = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const required = ['name', 'email', 'telephone']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    const data = {
      organisationId: Number(logged.orgId),
      alert: payload.alert || null,
      name: payload.name,
      email: payload.email,
      telephone: payload.telephone,
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
    try {
      await sendImmediateCrmAutomationsForLead(created)
    } catch (e) {}
    return success(created)
  } catch (e) {
    return error(500, e.message)
  }
}

export const updateLead = async (event) => {
  try {
    const logged = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
      const toRemove = existing.filter((a) => !desiredUserIds.includes(a.userId)).map((a) => a.id)
      if (toRemove.length) await CrmLeadAssignee.destroy({ where: { id: { [Op.in]: toRemove } } })
      if (toAdd.length) {
        const rows = toAdd.map((userId) => ({ organisationId: Number(logged.orgId), leadId: lead.id, userId }))
        await CrmLeadAssignee.bulkCreate(rows, { ignoreDuplicates: true })
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { id } = payload || {}
    if (!orgId) return error(401, 'Unauthenticated')
    if (!id) return error(400, 'id required')
    await CrmOption.destroy({ where: { id, organisationId: Number(orgId) } })
    return success('deleted')
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const { leadId } = typeof body === 'string' ? JSON.parse(body) : body
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const { leadId } = typeof body === 'string' ? JSON.parse(body) : body
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
    const { leadId } = typeof body === 'string' ? JSON.parse(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!leadId) return error(400, 'leadId required')
    const rows = await CrmLeadNote.findAll({ where: { organisationId: Number(orgId), leadId: Number(leadId) }, order: [['createdAt', 'DESC']] })
    return success(rows)
  } catch (e) {
    return error(500, e.message)
  }
}

export const addLeadNote = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const { id } = typeof body === 'string' ? JSON.parse(body) : body
    if (!orgId) return error(401, 'Unauthenticated')
    if (!id) return error(400, 'id required')
    await CrmLeadNote.destroy({ where: { id, organisationId: Number(orgId) } })
    return success('deleted')
  } catch (e) {
    return error(500, e.message)
  }
}

// Automation templates
export const listAutomationGroups = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    try { await CrmAutomationGroup.sync() } catch {}
    try { await CrmAutomationGroupTemplate.sync() } catch {}

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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { id, key, title, description, enabled } = payload || {}

    try { await CrmAutomationGroup.sync() } catch {}

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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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

    await CrmAutomationGroupTemplate.destroy({
      where: { organisationId: Number(orgId), groupId: group.id },
    })
    await group.destroy()
    return success('deleted')
  } catch (e) {
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
    if (leadId) {
      const lead = await CrmLead.findOne({ where: { organisationId: Number(orgId), id: leadId } })
      if (!lead) return error(404, 'Lead not found')
      overrides = lead?.rawData?.crmAutomationOverrides || {}
    }

    let groupMappings = []
    let groups = []
    try {
      await CrmAutomationGroup.sync()
      await CrmAutomationGroupTemplate.sync()
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

    return success(merged)
  } catch (e) {
    return error(500, e.message)
  }
}

export const saveAutomation = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { key, type = 'Email', name, subject, sending, enabled, template, leadId, groupKey, trigger } = payload || {}
    if (!key) return error(400, 'key required')
    if (leadId) {
      const lead = await CrmLead.findOne({ where: { organisationId: Number(orgId), id: Number(leadId) } })
      if (!lead) return error(404, 'Lead not found')
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
        trigger: trigger ?? null,
      }
      lead.rawData = { ...raw, crmAutomationOverrides: overrides }
      await lead.save()
      return success(overrides[key])
    }
    if (groupKey) {
      try { await CrmAutomationGroup.sync() } catch {}
      try { await CrmAutomationGroupTemplate.sync() } catch {}
      const group = await CrmAutomationGroup.findOne({ where: { organisationId: Number(orgId), key: String(groupKey) } })
      if (!group) return error(400, 'Invalid group key')
      await CrmAutomationGroupTemplate.destroy({
        where: { organisationId: Number(orgId), templateKey: String(key) },
      })
      await CrmAutomationGroupTemplate.create({
        organisationId: Number(orgId),
        groupId: group.id,
        templateKey: String(key),
        ordering: 0,
      })
    }
    const where = { organisationId: Number(orgId), key }
    const exists = await CrmAutomationTemplate.findOne({ where })
    if (exists) {
      if (name !== undefined) exists.name = name
      if (sending !== undefined) exists.sending = sending
      if (enabled !== undefined) exists.enabled = !!enabled
      if (type !== undefined) exists.type = type
      if (template !== undefined) exists.template = template
      if (subject !== undefined) exists.subject = subject
      if (trigger !== undefined) exists.trigger = trigger
      await exists.save()
      return success(exists)
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
      trigger: trigger ?? null
    })
    return success(created)
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { leadIds = [], subject, html, key } = payload || {}
    if (!subject || !html) return error(400, 'subject and html required')
    if (!Array.isArray(leadIds) || !leadIds.length) return error(400, 'leadIds required')

    // Optionally fetch a template to persist edits
    if (key) {
      const where = { organisationId: Number(orgId), key }
      const existing = await CrmAutomationTemplate.findOne({ where })
      if (existing) {
        existing.name = existing.name || subject
        existing.subject = existing.subject || subject
        existing.template = html
        await existing.save()
      } else {
        await CrmAutomationTemplate.create({
          organisationId: Number(orgId),
          key,
          type: 'Email',
          name: subject,
          subject,
          sending: 'Manual',
          enabled: true,
          template: html
        })
      }
    }

    const leads = await CrmLead.findAll({ where: { id: { [Op.in]: leadIds }, organisationId: Number(orgId), softDeleted: false } })
    const result = await sendLeadBulkEmail({ leads, subject, html, senderName: fullName })
    return success({ sent: result.sent })
  } catch (e) {
    return error(500, e.message)
  }
}
