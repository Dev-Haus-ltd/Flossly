import crypto from 'crypto'
import { Op } from 'sequelize'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { readBody, getQuery } from 'h3'
import { FormConfig, CrmLead, CrmOption, CrmLeadCommunication, UserOrganisation, Organisation } from '../models'
import sequelize from '../utils/db'
import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'
import { getCurrentUsage, requireUsageAllowed } from '../utils/requireUsageAllowed'
import { getEntitlements } from '../config/entitlements'
import { sendImmediateCrmAutomationsForLead } from '../utils/crmAutomation.js'
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification.js'

const EMAIL_REGEX = /^(?:[a-zA-Z0-9_'^&+\-]+(?:\.[a-zA-Z0-9_'^&+\-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

// Simple in-memory rate limiter keyed by token+ip: max 10 submissions per 10 min
const submitRateMap = new Map()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 10
let formSoftDeleteSupported = null

const checkRateLimit = (token, ip) => {
  const key = `${token}:${ip || 'unknown'}`
  const now = Date.now()
  const entry = submitRateMap.get(key)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    submitRateMap.set(key, { windowStart: now, count: 1 })
    return true
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return false
  return true
}

const generateToken = () => crypto.randomBytes(32).toString('hex')
const supportsFormSoftDelete = async () => {
  if (formSoftDeleteSupported !== null) return formSoftDeleteSupported
  try {
    const qi = sequelize.getQueryInterface()
    const columns = await qi.describeTable('FormConfigs')
    formSoftDeleteSupported = !!(columns?.softDeleted && columns?.deletedAt)
  } catch {
    formSoftDeleteSupported = false
  }
  return formSoftDeleteSupported
}

const getFormLimitMessage = ({ action = 'add more' } = {}) =>
  `Lite includes 1 active lead form. Upgrade to ${action}.`

const wouldExceedActiveFormLimit = async ({ orgId, restoringActiveCount = 0 }) => {
  const org = await Organisation.findByPk(orgId, { attributes: ['licenseType'] })
  const ent = getEntitlements(org?.licenseType ?? 'Lite')
  const max = ent.limits.forms
  if (max === Infinity) return false
  const current = await getCurrentUsage(orgId, 'forms')
  return (current + restoringActiveCount) > max
}

// Available lead schema field definitions for the builder
export const AVAILABLE_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. John Smith' },
  { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'e.g. john@example.com' },
  { key: 'telephone', label: 'Phone Number', type: 'tel', required: true, placeholder: '' },
  { key: 'treatment', label: 'Treatment Interest', type: 'select', required: false, placeholder: 'Select a treatment', options: [] },
  { key: 'contactMethod', label: 'Preferred Contact Method', type: 'select', required: false, placeholder: 'Select preferred method', options: ['Email', 'Phone', 'SMS', 'In-Person'] },
  { key: 'comments', label: 'Message / Comments', type: 'textarea', required: false, placeholder: 'Tell us more about your enquiry...' },
  { key: 'location', label: 'Location / Postcode', type: 'text', required: false, placeholder: 'e.g. SW1A 1AA' },
  { key: 'occupation', label: 'Occupation', type: 'text', required: false, placeholder: 'e.g. Teacher' },
]

const DEFAULT_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. John Smith' },
  { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'e.g. john@example.com' },
  { key: 'telephone', label: 'Phone Number', type: 'tel', required: true, placeholder: '' },
  { key: 'treatment', label: 'Treatment Interest', type: 'select', required: false, placeholder: 'Select a treatment', options: [] },
  { key: 'comments', label: 'Message / Comments', type: 'textarea', required: false, placeholder: 'Tell us more about your enquiry...' },
]

// ─── Protected handlers ──────────────────────────────────────────────────────

export const listForms = async (event) => {
  try {
    const softDeleteSupported = await supportsFormSoftDelete()
    const orgId = Number(event.context.user.orgId)
    const query = getQuery(event)
    const page = Math.max(1, Number(query?.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 10)))
    const offset = (page - 1) * limit
    const search = String(query?.search || '').trim()
    const activeFilter = query?.active
    const archived = String(query?.archived || 'false').toLowerCase() === 'true'

    const where = { organisationId: orgId }
    if (softDeleteSupported) {
      where.softDeleted = archived
    } else if (archived) {
      return success({ forms: [], total: 0, page, limit })
    }
    if (search) where.name = { [Op.iLike]: `%${search}%` }
    if (!archived) {
      if (activeFilter === 'true') where.active = true
      else if (activeFilter === 'false') where.active = false
    }

    const { count, rows } = await FormConfig.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    })

    return success({ forms: rows, total: count, page, limit })
  } catch (e) {
    return error(500, e?.message || 'Failed to load forms')
  }
}

export const createForm = async (event) => {
  const softDeleteSupported = await supportsFormSoftDelete()
  const orgId = Number(event.context.user.orgId)
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const name = String(payload?.name || '').trim()
  if (!name) return error(400, 'Form name is required')

  const token = generateToken()
  const fields = Array.isArray(payload?.fields) && payload.fields.length > 0
    ? payload.fields
    : DEFAULT_FIELDS

  try {
    await requireUsageAllowed(event, 'forms')

    const formPayload = {
      organisationId: orgId,
      name,
      token,
      fields,
      active: true,
    }
    if (softDeleteSupported) {
      formPayload.softDeleted = false
      formPayload.deletedAt = null
    }
    const form = await FormConfig.create(formPayload)
    return success(form)
  } catch (e) {
    if (e?.statusCode === 403) {
      return error(403, e?.data?.message || getFormLimitMessage())
    }
    return error(500, e?.message || 'Failed to create form')
  }
}

export const updateForm = async (event) => {
  const softDeleteSupported = await supportsFormSoftDelete()
  const orgId = Number(event.context.user.orgId)
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const formId = Number(payload?.id)
  if (!formId) return error(400, 'Form id is required')

  try {
    const where = { id: formId, organisationId: orgId }
    if (softDeleteSupported) where.softDeleted = false
    const form = await FormConfig.findOne({ where })
    if (!form) return error(404, 'Form not found')

    const isActivating = payload.active !== undefined && Boolean(payload.active) && !form.active
    if (isActivating) {
      await requireUsageAllowed(event, 'forms')
    }

    const updates = {}
    if (payload.name !== undefined) updates.name = String(payload.name || '').trim()
    if (payload.active !== undefined) updates.active = Boolean(payload.active)
    if (Array.isArray(payload.fields)) updates.fields = payload.fields
    if (payload.regenerateToken) updates.token = generateToken()

    await form.update(updates)
    return success(form)
  } catch (e) {
    if (e?.statusCode === 403) {
      return error(403, e?.data?.message || getFormLimitMessage({ action: 'activate more forms' }))
    }
    return error(500, e?.message || 'Failed to update form')
  }
}

export const deleteForm = async (event) => {
  const softDeleteSupported = await supportsFormSoftDelete()
  if (!softDeleteSupported) {
    return error(500, 'Form archive migration is not applied. Please run latest migrations.')
  }
  const orgId = Number(event.context.user.orgId)
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const idsInput = Array.isArray(payload?.ids)
    ? payload.ids
    : payload?.id !== undefined
      ? [payload.id]
      : []
  const ids = [...new Set(idsInput.map((id) => Number(id)).filter(Boolean))]
  if (!ids.length) return error(400, 'Form id(s) are required')

  try {
    const forms = await FormConfig.findAll({
      where: { id: { [Op.in]: ids }, organisationId: orgId, softDeleted: true },
    })
    if (!forms.length) return error(404, 'Archived form(s) not found')

    await sequelize.transaction(async (transaction) => {
      // Prevent a locked row from keeping the request pending indefinitely.
      await sequelize.query(`SET LOCAL lock_timeout = '5s'`, { transaction })

      // Keep historical leads but clear this form reference before delete.
      await CrmLead.update(
        { formId: null },
        {
          where: {
            organisationId: orgId,
            formId: { [Op.in]: ids.map(String) },
          },
          transaction,
        }
      )

      await FormConfig.destroy({
        where: { id: { [Op.in]: ids }, organisationId: orgId, softDeleted: true },
        transaction,
      })
    })

    return success({ deleted: true, count: forms.length })
  } catch (e) {
    if (e?.statusCode && e?.data?.code === 1) {
      throw e
    }
    const msg = String(e?.message || '')
    if (msg.toLowerCase().includes('lock timeout')) {
      return error(409, 'Delete is currently blocked by another operation. Please retry in a few seconds.')
    }
    return error(500, msg || 'Failed to delete form')
  }
}

export const archiveForms = async (event) => {
  const softDeleteSupported = await supportsFormSoftDelete()
  if (!softDeleteSupported) {
    return error(500, 'Form archive migration is not applied. Please run latest migrations.')
  }
  const orgId = Number(event.context.user.orgId)
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const ids = [...new Set((payload?.ids || []).map((id) => Number(id)).filter(Boolean))]
  if (!ids.length) return error(400, 'Form id(s) are required')

  try {
    const [count] = await FormConfig.update(
      { softDeleted: true, deletedAt: new Date() },
      { where: { organisationId: orgId, id: { [Op.in]: ids }, softDeleted: false } }
    )
    return success({ archived: true, count: Number(count || 0) })
  } catch (e) {
    return error(500, e?.message || 'Failed to archive forms')
  }
}

export const restoreForms = async (event) => {
  const softDeleteSupported = await supportsFormSoftDelete()
  if (!softDeleteSupported) {
    return error(500, 'Form archive migration is not applied. Please run latest migrations.')
  }
  const orgId = Number(event.context.user.orgId)
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const ids = [...new Set((payload?.ids || []).map((id) => Number(id)).filter(Boolean))]
  if (!ids.length) return error(400, 'Form id(s) are required')

  try {
    const forms = await FormConfig.findAll({
      where: { organisationId: orgId, id: { [Op.in]: ids }, softDeleted: true },
      attributes: ['id', 'active'],
    })
    if (!forms.length) return error(404, 'Archived form(s) not found')

    const activeRestoreCount = forms.filter((form) => form.active).length
    if (activeRestoreCount > 0 && await wouldExceedActiveFormLimit({ orgId, restoringActiveCount: activeRestoreCount })) {
      return error(403, getFormLimitMessage({ action: 'restore more active forms' }))
    }

    const [count] = await FormConfig.update(
      { softDeleted: false, deletedAt: null },
      { where: { organisationId: orgId, id: { [Op.in]: ids }, softDeleted: true } }
    )
    return success({ restored: true, count: Number(count || 0) })
  } catch (e) {
    return error(500, e?.message || 'Failed to restore forms')
  }
}

export const getAvailableFields = async (event) => {
  return success(AVAILABLE_FIELDS)
}

// ─── Public handlers (no auth) ───────────────────────────────────────────────

export const getFormMeta = async (event) => {
  try {
    const softDeleteSupported = await supportsFormSoftDelete()
    const query = getQuery(event)
    const token = String(query?.token || '').trim()
    if (!token) return error(400, 'Token is required')

    const where = { token, active: true }
    if (softDeleteSupported) where.softDeleted = false
    const form = await FormConfig.findOne({
      where,
      include: [{ model: Organisation, as: 'organisation', attributes: ['id', 'name', 'logo'] }],
    })
    if (!form) return error(404, 'Form not found')

    const orgId = form.organisationId
    const treatments = await CrmOption.findAll({
      where: { organisationId: orgId, category: 'treatment', active: true },
      attributes: ['id', 'name'],
      order: [['ordering', 'ASC'], ['name', 'ASC']],
    })

    const fields = (form.fields || []).map((f) => {
      if (f.key === 'treatment') {
        return { ...f, options: treatments.map((t) => ({ id: t.id, name: t.name })) }
      }
      return f
    })

    return success({
      formId: form.id,
      formName: form.name,
      practiceName: form.organisation?.name || '',
      logo: form.organisation?.logo || null,
      fields,
    })
  } catch (e) {
    return error(500, e?.message || 'Server error')
  }
}

export const submitFormLead = async (event) => {
  try {
    const softDeleteSupported = await supportsFormSoftDelete()
    const ip = event.node?.req?.socket?.remoteAddress || ''
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const token = String(payload?.token || '').trim()
    if (!token) return error(400, 'Token is required')

    if (!checkRateLimit(token, ip)) return error(429, 'Too many submissions. Please try again later.')

    const where = { token, active: true }
    if (softDeleteSupported) where.softDeleted = false
    const form = await FormConfig.findOne({ where })
    if (!form) return error(404, 'Form not found')

    const orgId = form.organisationId
    const fields = form.fields || []
    const submitted = payload?.data || {}

    const name = String(submitted.name || '').trim()
    const email = String(submitted.email || '').trim()
    const telephone = String(submitted.telephone || '').trim()

    const requiredFields = fields.filter((f) => f.required)
    for (const f of requiredFields) {
      const val = String(submitted[f.key] || '').trim()
      if (!val) return error(400, `${f.label || f.key} is required`)
    }

    if (email && !EMAIL_REGEX.test(email)) return error(400, 'Enter a valid email address')
    if (telephone) {
      const phone = parsePhoneNumber(telephone)
      if (!phone?.valid) return error(400, 'Enter a valid telephone number')
    }

    const data = {
      organisationId: orgId,
      name: name || null,
      email: email || null,
      telephone: telephone || null,
      treatment: submitted.treatment || null,
      comments: submitted.comments || null,
      occupation: submitted.occupation || null,
      location: submitted.location || null,
      leadSource: 'Web Form',
      leadStatus: 'New',
      inquiryDate: new Date(),
    }

    const created = await CrmLead.create(data)

    if (submitted.contactMethod) {
      try {
        await CrmLeadCommunication.create({
          organisationId: orgId,
          leadId: created.id,
          preferredContactMethod: submitted.contactMethod,
        })
      } catch {}
    }

    try { await sendImmediateCrmAutomationsForLead(created) } catch {}

    try {
      const orgUsers = await UserOrganisation.findAll({ where: { organisationId: orgId }, attributes: ['userId'] })
      const userIds = orgUsers.map((u) => u.userId).filter(Boolean)
      if (userIds.length) {
        await sendNotificationToMultipleUsers({
          userIds,
          title: 'New Web Form Lead',
          body: `${name || 'A visitor'} submitted a form`,
          data: { type: 'new_lead', leadId: String(created.id) },
        })
      }
    } catch {}

    return success({ id: created.id })
  } catch (e) {
    return error(500, e?.message || 'Failed to submit form')
  }
}
