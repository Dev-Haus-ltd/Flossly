import crypto from 'crypto'
import { Op } from 'sequelize'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { readBody, getQuery } from 'h3'
import { FormConfig, CrmLead, CrmOption, CrmLeadCommunication, UserOrganisation, Organisation } from '../models'
import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'
import { sendImmediateCrmAutomationsForLead } from '../utils/crmAutomation.js'
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification.js'

const EMAIL_REGEX = /^(?:[a-zA-Z0-9_'^&+\-]+(?:\.[a-zA-Z0-9_'^&+\-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

// Simple in-memory rate limiter keyed by token+ip: max 10 submissions per 10 min
const submitRateMap = new Map()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 10

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
    const orgId = Number(event.context.user.orgId)
    const query = getQuery(event)
    const page = Math.max(1, Number(query?.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 10)))
    const offset = (page - 1) * limit
    const search = String(query?.search || '').trim()
    const activeFilter = query?.active

    const where = { organisationId: orgId }
    if (search) where.name = { [Op.iLike]: `%${search}%` }
    if (activeFilter === 'true') where.active = true
    else if (activeFilter === 'false') where.active = false

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
  try {
    const orgId = Number(event.context.user.orgId)
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const name = String(payload?.name || '').trim()
    if (!name) return error(400, 'Form name is required')

    const token = generateToken()
    const fields = Array.isArray(payload?.fields) && payload.fields.length > 0
      ? payload.fields
      : DEFAULT_FIELDS

    const form = await FormConfig.create({ organisationId: orgId, name, token, fields, active: true })
    return success(form)
  } catch (e) {
    return error(500, e?.message || 'Failed to create form')
  }
}

export const updateForm = async (event) => {
  try {
    const orgId = Number(event.context.user.orgId)
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const formId = Number(payload?.id)
    if (!formId) return error(400, 'Form id is required')

    const form = await FormConfig.findOne({ where: { id: formId, organisationId: orgId } })
    if (!form) return error(404, 'Form not found')

    const updates = {}
    if (payload.name !== undefined) updates.name = String(payload.name || '').trim()
    if (payload.active !== undefined) updates.active = Boolean(payload.active)
    if (Array.isArray(payload.fields)) updates.fields = payload.fields
    if (payload.regenerateToken) updates.token = generateToken()

    await form.update(updates)
    return success(form)
  } catch (e) {
    return error(500, e?.message || 'Failed to update form')
  }
}

export const deleteForm = async (event) => {
  try {
    const orgId = Number(event.context.user.orgId)
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const formId = Number(payload?.id)
    if (!formId) return error(400, 'Form id is required')

    const form = await FormConfig.findOne({ where: { id: formId, organisationId: orgId } })
    if (!form) return error(404, 'Form not found')

    await form.destroy()
    return success({ deleted: true })
  } catch (e) {
    return error(500, e?.message || 'Failed to delete form')
  }
}

export const getAvailableFields = async (event) => {
  return success(AVAILABLE_FIELDS)
}

// ─── Public handlers (no auth) ───────────────────────────────────────────────

export const getFormMeta = async (event) => {
  try {
    const query = getQuery(event)
    const token = String(query?.token || '').trim()
    if (!token) return error(400, 'Token is required')

    const form = await FormConfig.findOne({
      where: { token, active: true },
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
    const ip = event.node?.req?.socket?.remoteAddress || ''
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const token = String(payload?.token || '').trim()
    if (!token) return error(400, 'Token is required')

    if (!checkRateLimit(token, ip)) return error(429, 'Too many submissions. Please try again later.')

    const form = await FormConfig.findOne({ where: { token, active: true } })
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
