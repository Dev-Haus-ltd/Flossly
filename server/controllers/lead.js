import { Op } from 'sequelize'
import { CrmLead, CrmLeadTreatment, CrmLeadNote, CrmOption, CrmLeadCommunication, CrmLeadAssignee, CrmAutomationTemplate, User } from '../models'
import { CONTACT_METHODS, APPOINTMENT_DAYS, BEST_TIMES } from '../models/crm/leadCommunications'
import { success, error } from '../utils/response'
import { transporter } from '../utils/nodeMailer.js'
import { template as EMAIL_TEMPLATE } from '../utils/emailTemplate.js'
 

export const listLeads = async (event) => {
  try {
    const logged = event.context.user
    const q = getQuery(event) || {}
    const where = { organisationId: Number(logged.orgId) }
    const archivedOnly = String(q.archivedOnly || '').toLowerCase() === 'true'
    const includeArchived = String(q.includeArchived || '').toLowerCase() === 'true'
    if (!includeArchived) where.softDeleted = archivedOnly ? true : false
    if (archivedOnly) where.softDeleted = true
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
    const shaped = rows.map((l) => {
      const assigned = (l.assignees || [])
        .map((a) => (a.user ? { id: a.user.id, fullName: a.user.fullName, email: a.user.email } : null))
        .filter(Boolean)
      l.setDataValue('assigned', assigned)
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
export const listAutomation = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')
    const rows = await CrmAutomationTemplate.findAll({ where: { organisationId: Number(orgId) }, order: [['createdAt','ASC']] })
    return success(rows)
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
    const { key, type = 'Email', name, sending, enabled, template } = payload || {}
    if (!key) return error(400, 'key required')
    const where = { organisationId: Number(orgId), key }
    const exists = await CrmAutomationTemplate.findOne({ where })
    if (exists) {
      if (name !== undefined) exists.name = name
      if (sending !== undefined) exists.sending = sending
      if (enabled !== undefined) exists.enabled = !!enabled
      if (type !== undefined) exists.type = type
      if (template !== undefined) exists.template = template
      await exists.save()
      return success(exists)
    }
    const created = await CrmAutomationTemplate.create({ organisationId: Number(orgId), key, type, name: name || key, sending: sending || '', enabled: !!enabled, template: template || null })
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
        existing.template = html
        await existing.save()
      } else {
        await CrmAutomationTemplate.create({ organisationId: Number(orgId), key, type: 'Email', name: subject, sending: 'Manual', enabled: true, template: html })
      }
    }

    const leads = await CrmLead.findAll({ where: { id: { [Op.in]: leadIds }, organisationId: Number(orgId), softDeleted: false } })
    const from = process.env.MAIL_FROM || 'helloflossly@gmail.com'

    for (const l of leads) {
      if (!l?.email) continue
      const content = html
        .replaceAll('[Patient Name]', l.name || 'there')
        .replaceAll('[First Name]', (l.name || '').split(' ')[0] || 'there')
        .replaceAll('[Your Name]', fullName || 'Team')

      try {
        const wrapped = EMAIL_TEMPLATE
          .replaceAll('{subject}', subject)
          .replace('{content}', content)
        await transporter.sendMail({ to: l.email, from, subject, html: wrapped })
      } catch (e) {
        // continue with others
      }
    }

    return success({ sent: leads.filter(l => !!l.email).length })
  } catch (e) {
    return error(500, e.message)
  }
}
