import { Op } from 'sequelize'
import { DiaryPatient, DiaryAppointment, DiaryNote, DiaryPatientComfort, DiaryPatientSurvey, DiaryPatientForm, DiaryPatientChart, DiaryTreatmentPlan, DiaryTreatmentPlanItem, User, RotaShift, Rota, OrganisationTreatment, Role, UserOrganisation } from '../models'
import { success, error } from '../utils/response'
import { readBody, getQuery, createError } from 'h3'
import formidable from 'formidable'
import path from 'path'
import os from "os";
import { uploadTempFile } from "../utils/storage";
import { parseJsonBody } from "../utils/body";
import { DEFAULT_ORGANISATION_TREATMENTS } from '~/shared/defaults/charting/treatmentDefaults.js'

const pad2 = (n) => String(n).padStart(2, '0')
const resolveTimeMode = () => {
  const publicMode = process.env.NUXT_PUBLIC_CLINIC_TIME_MODE
  const serverMode = process.env.CLINIC_TIME_MODE
  return String(publicMode || serverMode || 'agnostic').toLowerCase()
}
const TIME_MODE = resolveTimeMode()
const USE_TZ_AGNOSTIC = TIME_MODE === 'agnostic'
const parseDateParts = (dateStr) => {
  if (typeof dateStr !== 'string') return null
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}
const buildUtcDate = ({ year, month, day }, hour = 0, minute = 0, second = 0, ms = 0) => {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms))
}
const setClinicHours = (dateObj, hour, minute = 0, second = 0, ms = 0) => {
  if (USE_TZ_AGNOSTIC) dateObj.setUTCHours(hour, minute, second, ms)
  else dateObj.setHours(hour, minute, second, ms)
}
const toLocalHM = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d)
  const hours = USE_TZ_AGNOSTIC ? dt.getUTCHours() : dt.getHours()
  const minutes = USE_TZ_AGNOSTIC ? dt.getUTCMinutes() : dt.getMinutes()
  return `${pad2(hours)}:${pad2(minutes)}`
}
const toLocalYMD = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d)
  const year = USE_TZ_AGNOSTIC ? dt.getUTCFullYear() : dt.getFullYear()
  const month = USE_TZ_AGNOSTIC ? dt.getUTCMonth() + 1 : dt.getMonth() + 1
  const day = USE_TZ_AGNOSTIC ? dt.getUTCDate() : dt.getDate()
  return `${year}-${pad2(month)}-${pad2(day)}`
}
const parseLocalDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  if (!USE_TZ_AGNOSTIC) {
    const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr
    return new Date(`${dateStr}T${t}`)
  }
  // Treat the provided clinic date/time as timezone-agnostic so it remains consistent across hosts
  const dateParts = parseDateParts(dateStr)
  if (!dateParts) return null
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const segments = t.split(':').map((n) => Number(n))
  if (segments.length < 2 || segments.some((n) => Number.isNaN(n))) return null
  const [hour, minute, second = 0] = segments
  return buildUtcDate(dateParts, hour, minute, second)
}
const getUtcRangeForDate = (dateStr) => {
  if (!USE_TZ_AGNOSTIC) {
    const day = new Date(dateStr)
    if (Number.isNaN(day.valueOf())) return null
    const start = new Date(day); start.setHours(0,0,0,0)
    const end = new Date(day); end.setHours(23,59,59,999)
    return { start, end }
  }
  const parts = parseDateParts(dateStr)
  if (!parts) return null
  return {
    start: buildUtcDate(parts, 0, 0, 0, 0),
    end: buildUtcDate(parts, 23, 59, 59, 999),
  }
}
const requirePatientInOrg = async (orgId, patientId) => {
  if (!patientId) return null
  return await DiaryPatient.findOne({
    where: { id: Number(patientId), organisationId: Number(orgId) },
    attributes: ['id', 'organisationId'],
  })
}
const parsePositiveIntOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) return null
  return num
}
const overlapWindowClause = (start, end, excludeAppointmentId = null) => {
  const clause = {
    [Op.and]: [{ startTime: { [Op.lt]: end } }, { endTime: { [Op.gt]: start } }],
  }
  if (excludeAppointmentId) clause.id = { [Op.ne]: Number(excludeAppointmentId) }
  return clause
}
const normalizeTreatmentPlanItem = (row) => ({
  id: row.id,
  organisationId: row.organisationId,
  patientId: row.patientId,
  planId: row.planId || null,
  planName: row.planName || null,
  appointmentGroupId: row.appointmentGroupId || null,
  appointmentId: row.appointmentId,
  fdi: row.fdi,
  surface: row.surface,
  condition: row.condition,
  conditionLabel: row.conditionLabel,
  treatmentId: row.treatmentId || null,
  treatmentCode: row.treatmentCode || null,
  treatmentName: row.treatmentName || null,
  treatmentCategory: row.treatmentCategory || null,
  status: row.status,
  priority: row.priority,
  cost: Number(row.cost || 0),
  duration: Number(row.duration || 0),
  notes: row.notes || '',
  clinicianName: row.clinicianName || '',
  practitionerId: row.practitionerId || null,
  practitionerName: row.practitionerName || row.clinicianName || '',
  completedAt: row.completedAt || null,
  completedByPractitionerId: row.completedByPractitionerId || null,
  paymentPlan: row.paymentPlan || 'private',
  referrerId: row.referrerId || null,
  referrerName: row.referrerName || '',
  invoiceDesc: row.invoiceDesc || '',
  showOnInvoice: row.showOnInvoice !== false,
  completedByPractitionerName: row.completedByPractitionerName || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})
const normalizeTreatmentPlan = (row) => ({
  id: row.id,
  organisationId: row.organisationId,
  patientId: row.patientId,
  planKey: row.planKey,
  name: row.name,
  color: row.color || null,
  priority: Number(row.priority || 1),
  appointments: Array.isArray(row.appointmentsJson) ? row.appointmentsJson : [],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})
const sanitizeChartMeta = (meta = {}) => {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return { images: [], history: [], links: {}, favoriteCodeIds: [], softTissue: {}, riskAssessment: {} }
  }
  const images = Array.isArray(meta.images) ? meta.images.slice(0, 100) : []
  const history = Array.isArray(meta.history) ? meta.history.slice(0, 200) : []
  const links = (meta.links && typeof meta.links === 'object' && !Array.isArray(meta.links)) ? meta.links : {}
  const favoriteCodeIds = Array.isArray(meta.favoriteCodeIds) ? meta.favoriteCodeIds : []
  const softTissue = (meta.softTissue && typeof meta.softTissue === 'object' && !Array.isArray(meta.softTissue)) ? meta.softTissue : {}
  const riskAssessment = (meta.riskAssessment && typeof meta.riskAssessment === 'object' && !Array.isArray(meta.riskAssessment)) ? meta.riskAssessment : {}
  return { images, history, links, favoriteCodeIds, softTissue, riskAssessment }
}

// Fix #15 — seed default treatments once per org per server process lifetime, not on every request
const _seededOrgs = new Set()

// --- Treatments ---
export const listTreatments = async (event) => {
  try {
    const { orgId } = event.context.user
    const orgIdNum = Number(orgId)

    if (!_seededOrgs.has(orgIdNum)) {
      const existingAll = await OrganisationTreatment.findAll({
        where: { organisationId: orgIdNum },
        attributes: ['id', 'code', 'name'],
        order: [['name', 'ASC']],
      })
      const existingCodes = new Set(
        existingAll.map((t) => String(t.code || '').trim().toUpperCase()).filter(Boolean)
      )
      const existingNames = new Set(
        existingAll.map((t) => String(t.name || '').trim().toLowerCase()).filter(Boolean)
      )
      const missingDefaults = DEFAULT_ORGANISATION_TREATMENTS.filter((seed) => {
        const codeKey = String(seed.code || '').trim().toUpperCase()
        const nameKey = String(seed.name || '').trim().toLowerCase()
        if (codeKey && existingCodes.has(codeKey)) return false
        if (nameKey && existingNames.has(nameKey)) return false
        return true
      })
      if (missingDefaults.length) {
        await OrganisationTreatment.bulkCreate(missingDefaults.map((s) => ({
          ...s,
          price: s.price ?? 0,
          organisationId: orgIdNum,
        })))
      }
      _seededOrgs.add(orgIdNum)
    }

    const rows = await OrganisationTreatment.findAll({ where: { organisationId: orgIdNum, active: true }, order: [['name','ASC']] })
    return success(
      rows.map((t) => ({
        ...t.toJSON(),
        amount: Number(t.price ?? 0),
      }))
    )
  } catch (e) {
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error'
    return error(500, msg)
  }
}

// --- Patients ---
export const listPatients = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const search = (q.search || q.q || '').trim()
    const where = { organisationId: Number(orgId) }
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const rows = await DiaryPatient.findAll({ where, order: [['createdAt','DESC']], limit: 50 })
    return success(rows)
  } catch (e) {
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error'
    return error(500, msg)
  }
}

export const listPatientsPaged = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const page = Math.max(1, Number(q.page || 1))
    const itemsPerPage = Math.max(1, Math.min(100, Number(q.itemsPerPage || q.perPage || 10)))
    const search = (q.search || q.q || '').trim()
    const where = { organisationId: Number(orgId) }
    if (q.sex) where.sex = q.sex
    if (q.paymentPlan) where.paymentPlan = q.paymentPlan
    if (q.marketingConsent) where.marketingConsent = q.marketingConsent
    if (q.dentistId) where.defaultDentistId = Number(q.dentistId)
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const order = []
    if (q.sortBy) {
      const dir = String(q.sortDesc).toLowerCase() === 'true' ? 'DESC' : 'ASC'
      order.push([q.sortBy, dir])
    } else {
      order.push(['createdAt', 'DESC'])
    }
    const result = await DiaryPatient.findAndCountAll({
      where,
      order,
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
    })
    return success({ rows: result.rows || [], total: result.count || 0 })
  } catch (e) {
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error'
    return error(500, msg)
  }
}

export const getPatientStats = async (event) => {
  try {
    const { orgId } = event.context.user
    const where = { organisationId: Number(orgId) }
    const total = await DiaryPatient.count({ where })
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const newThisMonth = await DiaryPatient.count({
      where: { ...where, createdAt: { [Op.gte]: startOfMonth } },
    })
    const withEmail = await DiaryPatient.count({
      where: { ...where, email: { [Op.ne]: null } },
    })
    const withMobile = await DiaryPatient.count({
      where: { ...where, mobile: { [Op.ne]: null } },
    })
    return success({ total, newThisMonth, withEmail, withMobile })
  } catch (e) {
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error'
    return error(500, msg)
  }
}

export const createPatient = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const required = ['firstName','lastName']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    const data = {
      organisationId: Number(orgId),
      title: payload.title || null,
      sex: payload.sex || null,
      firstName: payload.firstName,
      lastName: payload.lastName,
      niNumber: payload.niNumber || null,
      nhsNumber: payload.nhsNumber || null,
      insuranceNumber: payload.insuranceNumber || null,
      legacyId: payload.legacyId || null,
      imagingId: payload.imagingId || null,
      ethnicity: payload.ethnicity || null,
      address1: payload.address1 || null,
      address2: payload.address2 || null,
      address3: payload.address3 || null,
      town: payload.town || null,
      county: payload.county || null,
      postcode: payload.postcode || null,
      homePhone: payload.homePhone || null,
      workPhone: payload.workPhone || null,
      dob: payload.dob || null,
      mobile: payload.mobile || null,
      preferredPhone: payload.preferredPhone || null,
      email: payload.email || null,
      doctor: payload.doctor || null,
      occupation: payload.occupation || null,
      family: payload.family || null,
      marketingConsent: payload.marketingConsent || null,
      receiveSms: payload.receiveSms === true || payload.receiveSms === 'Yes',
      receiveEmail: payload.receiveEmail === true || payload.receiveEmail === 'Yes',
      paymentPlan: payload.paymentPlan || null,
      dentist: payload.dentist || null,
      hygienist: payload.hygienist || null,
      dentistRecallInterval: payload.dentistRecallInterval || payload.recallInterval || null,
      nextDentistRecall: payload.nextDentistRecall || null,
      hygienistRecallInterval: payload.hygienistRecallInterval || null,
      nextHygienistRecall: payload.nextHygienistRecall || null,
      acquisitionSource: payload.acquisitionSource || null,
      defaultDentistId: payload.dentistId || null,
      recallMethod: payload.recallMethod || null,
      recallInterval: payload.recallInterval || null,
    }
    const created = await DiaryPatient.create(data)
    return success(created)
  } catch (e) {
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error'
    return error(500, msg)
  }
}

// --- Patient: update ---
export const updatePatient = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const id = Number(payload.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryPatient.findOne({ where: { id, organisationId: Number(orgId) } })
    if (!row) return error(404, 'Patient not found')
    const fields = [
      'title','sex','firstName','lastName',
      'niNumber','nhsNumber','insuranceNumber','legacyId','imagingId','ethnicity',
      'address1','address2','address3','town','county','postcode',
      'homePhone','workPhone','mobile','preferredPhone','email',
      'doctor','occupation','family',
      'marketingConsent','receiveSms','receiveEmail','paymentPlan',
      'dentist','hygienist','dentistRecallInterval','nextDentistRecall','hygienistRecallInterval','nextHygienistRecall','acquisitionSource',
      'defaultDentistId','recallMethod','recallInterval'
    ]
    for (const f of fields) {
      if (payload[f] !== undefined) {
        row[f] = payload[f]
      }
    }
    await row.save()
    return success(row)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Appointments ---
export const listAppointments = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const dateStr = q.date
    const patientId = q.patientId ? Number(q.patientId) : null
    if (!dateStr && !patientId) return error(400, 'date or patientId is required')
    const where = { organisationId: Number(orgId) }
    if (dateStr) {
      const range = getUtcRangeForDate(dateStr)
      if (!range) return error(400, 'Invalid date format')
      const { start, end } = range
      where.startTime = { [Op.between]: [start, end] }
    }
    if (patientId) where.patientId = patientId
    if (q.dentistId) where.dentistId = Number(q.dentistId)
    if (q.status) where.status = q.status
    if (q.treatmentId) where.treatmentId = Number(q.treatmentId)
    const search = (q.search || q.q || '').trim()
    const include = [
      { model: DiaryPatient, as: 'patient' },
      { model: User, as: 'dentist', attributes: ['id','fullName'] },
    ]
    if (search) {
      include[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
        ],
      }
      include[0].required = true
    }
    const rows = await DiaryAppointment.findAll({ where, include })
    const shaped = rows.map(r => ({
      id: r.id,
      dentistId: r.dentistId,
      dentistName: r.dentist?.fullName || null,
      patientId: r.patientId || null,
      patient: r.patient ? `${r.patient.firstName} ${r.patient.lastName}`.trim() : r.treatmentName || 'Appointment',
      date: toLocalYMD(r.startTime),
      start: toLocalHM(r.startTime),
      end: toLocalHM(r.endTime),
      status: r.status,
      treatmentName: r.treatmentName || null,
      notes: r.notes || null,
      amount: Number(r.amount || 0),
    }))
    return success(shaped)
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

export const createAppointment = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const required = ['dentistId','date','time','duration']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    let patientId = payload.patientId || null
    if (!patientId && payload.patientName) {
      const [firstName, ...rest] = String(payload.patientName).split(' ')
      const lastName = rest.join(' ')
      const p = await DiaryPatient.create({ organisationId: Number(orgId), firstName, lastName: lastName || '-' })
      patientId = p.id
    }
    // Normalize incoming date & time (local) and compute end
    const start = parseLocalDateTime(payload.date, payload.time)
    if (!start || isNaN(start.getTime())) return error(400, 'Invalid date/time')
    const end = new Date(start); end.setMinutes(end.getMinutes() + Number(payload.duration || 10))

    // Working hours validation (09:00–17:00 local)
        const workStart = new Date(start); setClinicHours(workStart, 9,0,0,0)
        const workEnd = new Date(start); setClinicHours(workEnd, 17,0,0,0)
    if (start < workStart) return error(400, 'Appointment must start at or after 09:00')
    if (end > workEnd) return error(400, 'Appointment must end by 17:00')

    // Overlap validation for dentist and patient
    const overlapWindow = { [Op.and]: [{ startTime: { [Op.lt]: end } }, { endTime: { [Op.gt]: start } }] }
    const orgClause = { organisationId: Number(orgId) }
    const notCancelled = { status: { [Op.ne]: 'Cancelled' } }

    const dentistOverlap = await DiaryAppointment.count({
      where: { ...orgClause, ...overlapWindow, ...notCancelled, dentistId: Number(payload.dentistId) },
    })
    if (dentistOverlap > 0) return error(409, 'Dentist already has an appointment at this time')

    if (patientId) {
      const patientOverlap = await DiaryAppointment.count({
        where: { ...orgClause, ...overlapWindow, ...notCancelled, patientId: Number(patientId) },
      })
      if (patientOverlap > 0) return error(409, 'Patient already has an appointment at this time')
    }
    let amount = 0
    let treatmentId = null // kept null; appointment currently uses treatmentName/amount snapshot
    let treatmentName = payload.treatmentName || null
    const incomingOrgTreatmentId = payload.treatmentId ? Number(payload.treatmentId) : null
    if (incomingOrgTreatmentId) {
      const t = await OrganisationTreatment.findOne({ where: { id: incomingOrgTreatmentId, organisationId: Number(orgId) } })
      if (t) {
        // Use dictionary amount unless explicitly overridden in payload
        amount = Number(t.price ?? 0)
        if (!treatmentName) treatmentName = t.name
        else treatmentName = treatmentName || t.name
      }
    }
    // If amount provided explicitly, prefer it
    if (payload.amount !== undefined && payload.amount !== null && String(payload.amount).trim() !== '' && !isNaN(Number(payload.amount))) {
      amount = Number(payload.amount)
    }
    const created = await DiaryAppointment.create({
      organisationId: Number(orgId),
      patientId,
      dentistId: Number(payload.dentistId),
      treatmentId: treatmentId, // keep null; UI uses treatmentName
      treatmentName,
      status: payload.status || 'Pending',
      startTime: start,
      endTime: end,
      notes: payload.notes || null,
      amount: amount || 0,
    })
    // Return consistent time fields for UI convenience
    return success({
      id: created.id,
      organisationId: created.organisationId,
      patientId: created.patientId,
      dentistId: created.dentistId,
      treatmentId: created.treatmentId,
      treatmentName: created.treatmentName,
      status: created.status,
      startTime: created.startTime,
      endTime: created.endTime,
      date: toLocalYMD(created.startTime),
      time: toLocalHM(created.startTime),
      amount: created.amount,
      notes: created.notes,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Patient: get by id ---
export const getPatient = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const id = Number(q.id || 0)
    if (!id) return error(400, 'id required')
    const p = await DiaryPatient.findOne({ where: { id, organisationId: Number(orgId) } })
    if (!p) return error(404, 'Patient not found')
    return success(p)
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Patient Charting ---
export const getPatientChart = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const row = await DiaryPatientChart.findOne({
      where: { organisationId: Number(orgId), patientId },
    })
    return success({ chart: row?.chartJson || {}, meta: sanitizeChartMeta(row?.metaJson || {}) })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientChart = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    if (!payload || typeof payload.chart !== 'object' || Array.isArray(payload.chart)) {
      return error(400, 'chart must be an object')
    }
    const hasMeta = payload?.meta !== undefined
    if (hasMeta && (typeof payload.meta !== 'object' || Array.isArray(payload.meta))) {
      return error(400, 'meta must be an object')
    }
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const existing = await DiaryPatientChart.findOne({
      where: { organisationId: Number(orgId), patientId },
    })
    if (!existing) {
      const created = await DiaryPatientChart.create({
        organisationId: Number(orgId),
        patientId,
        chartJson: payload.chart,
        metaJson: hasMeta ? sanitizeChartMeta(payload.meta) : {},
      })
      return success({ id: created.id, chart: created.chartJson, meta: sanitizeChartMeta(created.metaJson || {}) })
    }
    existing.chartJson = payload.chart
    if (hasMeta) existing.metaJson = sanitizeChartMeta(payload.meta)
    await existing.save()
    return success({ id: existing.id, chart: existing.chartJson, meta: sanitizeChartMeta(existing.metaJson || {}) })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientChartTooth = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    const fdi = Number(payload?.fdi || 0)
    if (!patientId) return error(400, 'patientId is required')
    if (!fdi) return error(400, 'fdi is required')
    if (!payload || typeof payload.toothData !== 'object' || Array.isArray(payload.toothData)) {
      return error(400, 'toothData must be an object')
    }
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    let row = await DiaryPatientChart.findOne({
      where: { organisationId: Number(orgId), patientId },
    })
    if (!row) {
      row = await DiaryPatientChart.create({
        organisationId: Number(orgId),
        patientId,
        chartJson: {},
      })
    }
    const nextChart = { ...(row.chartJson || {}) }
    nextChart[String(fdi)] = payload.toothData
    row.chartJson = nextChart
    await row.save()
    return success({ id: row.id, fdi, toothData: nextChart[String(fdi)] })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const getPatientChartMeta = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const row = await DiaryPatientChart.findOne({
      where: { organisationId: Number(orgId), patientId },
      attributes: ['id', 'metaJson'],
    })
    return success({ meta: sanitizeChartMeta(row?.metaJson || {}) })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientChartMeta = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    if (!payload || typeof payload.meta !== 'object' || Array.isArray(payload.meta)) {
      return error(400, 'meta must be an object')
    }
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    let row = await DiaryPatientChart.findOne({
      where: { organisationId: Number(orgId), patientId },
    })
    if (!row) {
      row = await DiaryPatientChart.create({
        organisationId: Number(orgId),
        patientId,
        chartJson: {},
        metaJson: sanitizeChartMeta(payload.meta),
      })
    } else {
      row.metaJson = sanitizeChartMeta(payload.meta)
      await row.save()
    }
    return success({ id: row.id, meta: sanitizeChartMeta(row.metaJson || {}) })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Treatment Plan Containers ---
export const listTreatmentPlans = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const rows = await DiaryTreatmentPlan.findAll({
      where: { organisationId: Number(orgId), patientId },
      order: [['priority', 'ASC'], ['id', 'ASC']],
    })
    return success((rows || []).map(normalizeTreatmentPlan))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const createTreatmentPlan = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const planKey = String(payload?.planKey || '').trim() || `plan-${Date.now()}`
    const name = String(payload?.name || '').trim() || 'Treatment Plan'
    const existing = await DiaryTreatmentPlan.findOne({
      where: { organisationId: Number(orgId), patientId, planKey },
    })
    if (existing) return success(normalizeTreatmentPlan(existing))
    const count = await DiaryTreatmentPlan.count({ where: { organisationId: Number(orgId), patientId } })
    const created = await DiaryTreatmentPlan.create({
      organisationId: Number(orgId),
      patientId,
      planKey,
      name,
      color: payload?.color || null,
      priority: Number(payload?.priority || 0) || (count + 1),
      appointmentsJson: Array.isArray(payload?.appointments) ? payload.appointments : [],
    })
    return success(normalizeTreatmentPlan(created))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const updateTreatmentPlan = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    const planKey = String(payload?.planKey || '').trim()
    if (!patientId) return error(400, 'patientId is required')
    if (!planKey) return error(400, 'planKey is required')
    const row = await DiaryTreatmentPlan.findOne({
      where: { organisationId: Number(orgId), patientId, planKey },
    })
    if (!row) return error(404, 'Treatment plan not found')
    if (payload.name !== undefined) row.name = String(payload.name || '').trim() || row.name
    if (payload.color !== undefined) row.color = payload.color || null
    if (payload.priority !== undefined) row.priority = Number(payload.priority || row.priority)
    if (payload.appointments !== undefined) row.appointmentsJson = Array.isArray(payload.appointments) ? payload.appointments : []
    await row.save()
    if (payload.name !== undefined) {
      await DiaryTreatmentPlanItem.update(
        { planName: row.name },
        { where: { organisationId: Number(orgId), patientId, planId: planKey } }
      )
    }
    return success(normalizeTreatmentPlan(row))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const deleteTreatmentPlan = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    const planKey = String(payload?.planKey || '').trim()
    if (!patientId) return error(400, 'patientId is required')
    if (!planKey) return error(400, 'planKey is required')
    const row = await DiaryTreatmentPlan.findOne({
      where: { organisationId: Number(orgId), patientId, planKey },
    })
    if (!row) return error(404, 'Treatment plan not found')
    await DiaryTreatmentPlanItem.destroy({
      where: { organisationId: Number(orgId), patientId, planId: planKey },
    })
    await row.destroy()
    return success({ planKey })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Treatment Plan ---
export const listTreatmentPlanItems = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const rows = await DiaryTreatmentPlanItem.findAll({
      where: { organisationId: Number(orgId), patientId },
      order: [['priority', 'ASC'], ['id', 'ASC']],
    })
    return success((rows || []).map(normalizeTreatmentPlanItem))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const createTreatmentPlanItem = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    if (!patientId) return error(400, 'patientId is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const incomingPlanId = payload?.planId || null
    let resolvedPlanName = payload?.planName || null
    if (incomingPlanId && !resolvedPlanName) {
      const plan = await DiaryTreatmentPlan.findOne({
        where: { organisationId: Number(orgId), patientId, planKey: incomingPlanId },
        attributes: ['name'],
      })
      resolvedPlanName = plan?.name || null
    }
    const count = await DiaryTreatmentPlanItem.count({ where: { organisationId: Number(orgId), patientId } })
    const appointmentId = parsePositiveIntOrNull(payload?.appointmentId)
    const practitionerId = parsePositiveIntOrNull(payload?.practitionerId)
    const practitionerName = payload?.practitionerName || payload?.clinicianName || null
    const status = String(payload?.status || 'planned')
    const isCompleted = status.toLowerCase() === 'completed'
    const completedAt = payload?.completedAt ? new Date(payload.completedAt) : (isCompleted ? new Date() : null)
    const completedByPractitionerId = parsePositiveIntOrNull(payload?.completedByPractitionerId) || (isCompleted ? practitionerId : null)
    const completedByPractitionerName = payload?.completedByPractitionerName || (isCompleted ? practitionerName : null)
    const created = await DiaryTreatmentPlanItem.create({
      organisationId: Number(orgId),
      patientId,
      planId: incomingPlanId,
      planName: resolvedPlanName,
      appointmentGroupId: payload?.appointmentGroupId || null,
      appointmentId,
      fdi: payload?.fdi ? Number(payload.fdi) : null,
      surface: payload?.surface || null,
      condition: payload?.condition || null,
      conditionLabel: payload?.conditionLabel || null,
      treatmentId: payload?.treatmentId ? Number(payload.treatmentId) : null,
      treatmentCode: payload?.treatmentCode || null,
      treatmentName: payload?.treatmentName || null,
      treatmentCategory: payload?.treatmentCategory || null,
      status,
      priority: Number(payload?.priority || 0) || (count + 1),
      cost: Number(payload?.cost || 0),
      duration: Number(payload?.duration || 0),
      notes: payload?.notes || null,
      clinicianName: practitionerName,
      practitionerId,
      practitionerName,
      completedAt,
      completedByPractitionerId,
      completedByPractitionerName,
    })
    return success(normalizeTreatmentPlanItem(created))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const updateTreatmentPlanItem = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const id = Number(payload?.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryTreatmentPlanItem.findOne({
      where: { id, organisationId: Number(orgId) },
    })
    if (!row) return error(404, 'Treatment plan item not found')
    const patient = await requirePatientInOrg(orgId, row.patientId)
    if (!patient) return error(404, 'Patient not found')
    if (payload.status !== undefined) row.status = payload.status
    if (payload.planId !== undefined) row.planId = payload.planId || null
    if (payload.planName !== undefined) row.planName = payload.planName || null
    if (payload.appointmentGroupId !== undefined) row.appointmentGroupId = payload.appointmentGroupId || null
    if (payload.priority !== undefined) row.priority = Number(payload.priority || row.priority)
    if (payload.cost !== undefined) row.cost = Number(payload.cost || 0)
    if (payload.duration !== undefined) row.duration = Number(payload.duration || 0)
    if (payload.notes !== undefined) row.notes = payload.notes || null
    if (payload.clinicianName !== undefined || payload.practitionerName !== undefined) {
      const practitionerName = payload.practitionerName || payload.clinicianName || null
      row.clinicianName = practitionerName
      row.practitionerName = practitionerName
    }
    if (payload.practitionerId !== undefined) row.practitionerId = parsePositiveIntOrNull(payload.practitionerId)
    if (payload.completedAt !== undefined) row.completedAt = payload.completedAt ? new Date(payload.completedAt) : null
    if (payload.completedByPractitionerId !== undefined) {
      row.completedByPractitionerId = parsePositiveIntOrNull(payload.completedByPractitionerId)
    }
    if (payload.completedByPractitionerName !== undefined) {
      row.completedByPractitionerName = payload.completedByPractitionerName || null
    }
    if (payload.conditionLabel !== undefined) row.conditionLabel = payload.conditionLabel || null
    if (payload.treatmentId !== undefined) row.treatmentId = payload.treatmentId ? Number(payload.treatmentId) : null
    if (payload.treatmentCode !== undefined) row.treatmentCode = payload.treatmentCode || null
    if (payload.treatmentName !== undefined) row.treatmentName = payload.treatmentName || null
    if (payload.treatmentCategory !== undefined) row.treatmentCategory = payload.treatmentCategory || null
    if (payload.surface !== undefined) row.surface = payload.surface || null
    if (payload.condition !== undefined) row.condition = payload.condition || null
    if (payload.fdi !== undefined) row.fdi = payload.fdi ? Number(payload.fdi) : null
    if (payload.appointmentId !== undefined) {
      row.appointmentId = parsePositiveIntOrNull(payload.appointmentId)
    }
    if (payload.paymentPlan !== undefined) row.paymentPlan = payload.paymentPlan || 'private'
    if (payload.referrerId !== undefined) row.referrerId = parsePositiveIntOrNull(payload.referrerId)
    if (payload.referrerName !== undefined) row.referrerName = payload.referrerName || null
    if (payload.invoiceDesc !== undefined) row.invoiceDesc = payload.invoiceDesc || null
    if (payload.showOnInvoice !== undefined) row.showOnInvoice = payload.showOnInvoice !== false
    const normalizedStatus = String(row.status || '').toLowerCase()
    if (normalizedStatus === 'completed') {
      if (!row.completedAt) row.completedAt = new Date()
      if (!row.completedByPractitionerId && row.practitionerId) row.completedByPractitionerId = row.practitionerId
      if (!row.completedByPractitionerName) row.completedByPractitionerName = row.practitionerName || row.clinicianName || null
    } else if (
      payload.status !== undefined &&
      payload.completedAt === undefined &&
      payload.completedByPractitionerId === undefined &&
      payload.completedByPractitionerName === undefined
    ) {
      row.completedAt = null
      row.completedByPractitionerId = null
      row.completedByPractitionerName = null
    }
    await row.save()
    return success(normalizeTreatmentPlanItem(row))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const deleteTreatmentPlanItem = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const id = Number(payload?.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryTreatmentPlanItem.findOne({
      where: { id, organisationId: Number(orgId) },
    })
    if (!row) return error(404, 'Treatment plan item not found')
    const patient = await requirePatientInOrg(orgId, row.patientId)
    if (!patient) return error(404, 'Patient not found')
    await row.destroy()
    return success({ id })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const reorderTreatmentPlanItems = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    const orderedIds = Array.isArray(payload?.orderedIds) ? payload.orderedIds.map((v) => Number(v)).filter(Boolean) : []
    const appointmentIdRaw = payload?.appointmentId
    const appointmentId = Number(appointmentIdRaw)
    const appointmentGroupId = payload?.appointmentGroupId || null
    if (!patientId) return error(400, 'patientId is required')
    if (!orderedIds.length) return error(400, 'orderedIds is required')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')
    const existing = await DiaryTreatmentPlanItem.findAll({
      where: { organisationId: Number(orgId), patientId },
      order: [['priority', 'ASC'], ['id', 'ASC']],
    })
    const idToRow = new Map(existing.map((r) => [r.id, r]))
    const selectedRows = orderedIds.map((id) => idToRow.get(id)).filter(Boolean)
    if (selectedRows.length !== orderedIds.length) return error(400, 'orderedIds contains invalid items')

    let finalOrder = existing
    if (appointmentIdRaw !== undefined || appointmentGroupId !== null) {
      const expectedAppointmentId = Number.isFinite(appointmentId) ? appointmentId : null
      for (const row of selectedRows) {
        const byIdValid = appointmentIdRaw === undefined ? true : ((row.appointmentId || null) === expectedAppointmentId)
        const byGroupValid = appointmentGroupId === null ? true : ((row.appointmentGroupId || null) === appointmentGroupId)
        if (!byIdValid || !byGroupValid) {
          return error(400, 'orderedIds must belong to the same appointment group')
        }
      }
      const selectedIdSet = new Set(orderedIds)
      let cursor = 0
      finalOrder = existing.map((row) => {
        if (!selectedIdSet.has(row.id)) return row
        const replacement = selectedRows[cursor]
        cursor += 1
        return replacement
      })
    } else {
      if (orderedIds.length !== existing.length) {
        return error(400, 'orderedIds must include all treatment plan items when appointmentId is not provided')
      }
      finalOrder = orderedIds.map((id) => idToRow.get(id)).filter(Boolean)
    }

    let priority = 1
    for (const row of finalOrder) {
      row.priority = priority
      priority += 1
      await row.save()
    }
    const reloaded = await DiaryTreatmentPlanItem.findAll({
      where: { organisationId: Number(orgId), patientId },
      order: [['priority', 'ASC'], ['id', 'ASC']],
    })
    return success(reloaded.map(normalizeTreatmentPlanItem))
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Treatment Plan -> Appointment Integration ---
export const appointmentConflictCheck = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const date = payload?.date
    const startTime = payload?.startTime
    const endTime = payload?.endTime
    const payloadDentistId = parsePositiveIntOrNull(payload?.dentistId)
    const patientId = payload?.patientId ? Number(payload.patientId) : null
    const excludeAppointmentId = payload?.excludeAppointmentId ? Number(payload.excludeAppointmentId) : null
    const start = parseLocalDateTime(date, startTime)
    const end = parseLocalDateTime(date, endTime)
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return error(400, 'Invalid date/time')
    if (end <= start) return error(400, 'Invalid booking time range')
    const workStart = new Date(start); setClinicHours(workStart, 9, 0, 0, 0)
    const workEnd = new Date(start); setClinicHours(workEnd, 17, 0, 0, 0)
    if (start < workStart) return error(400, 'Appointment must start at or after 09:00')
    if (end > workEnd) return error(400, 'Appointment must end by 17:00')
    const where = {
      organisationId: Number(orgId),
      status: { [Op.ne]: 'Cancelled' },
      ...overlapWindowClause(start, end, excludeAppointmentId),
    }
    if (payloadDentistId) where.dentistId = payloadDentistId
    if (patientId) where.patientId = patientId
    const overlaps = await DiaryAppointment.findAll({
      where,
      include: [{ model: DiaryPatient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['startTime', 'ASC']],
      limit: 10,
    })
    return success({
      hasConflict: overlaps.length > 0,
      conflicts: overlaps.map((row) => ({
        id: row.id,
        patientName: row.patient ? `${row.patient.firstName || ''} ${row.patient.lastName || ''}`.trim() : null,
        startTime: toLocalHM(row.startTime),
        endTime: toLocalHM(row.endTime),
        status: row.status,
      })),
    })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const bookFromTreatmentPlan = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const patientId = Number(payload?.patientId || 0)
    const treatmentItemIds = Array.isArray(payload?.treatmentItemIds)
      ? payload.treatmentItemIds.map((v) => Number(v)).filter(Boolean)
      : []
    const date = payload?.date
    const startTime = payload?.startTime
    const endTime = payload?.endTime
    const payloadDentistId = parsePositiveIntOrNull(payload?.dentistId)
    const notes = payload?.notes || null
    if (!patientId) return error(400, 'patientId is required')
    if (!treatmentItemIds.length) return error(400, 'No treatment items selected for booking')
    const patient = await requirePatientInOrg(orgId, patientId)
    if (!patient) return error(404, 'Patient not found')

    const selectedItems = await DiaryTreatmentPlanItem.findAll({
      where: {
        organisationId: Number(orgId),
        patientId,
        id: { [Op.in]: treatmentItemIds },
      },
      order: [['priority', 'ASC'], ['id', 'ASC']],
    })
    if (!selectedItems.length || selectedItems.length !== treatmentItemIds.length) {
      return error(400, 'Selected treatment items are invalid')
    }
    const fallbackDentistId = selectedItems.find((item) => Number(item.practitionerId || 0) > 0)?.practitionerId || null
    const dentistId = payloadDentistId || fallbackDentistId
    if (!dentistId) return error(400, 'dentistId is required')

    const start = parseLocalDateTime(date, startTime)
    const end = parseLocalDateTime(date, endTime)
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return error(400, 'Invalid booking time range')
    }
    const workStart = new Date(start); setClinicHours(workStart, 9, 0, 0, 0)
    const workEnd = new Date(start); setClinicHours(workEnd, 17, 0, 0, 0)
    if (start < workStart) return error(400, 'Appointment must start at or after 09:00')
    if (end > workEnd) return error(400, 'Appointment must end by 17:00')

    const overlapWhere = {
      organisationId: Number(orgId),
      status: { [Op.ne]: 'Cancelled' },
      ...overlapWindowClause(start, end),
    }
    const dentistOverlap = await DiaryAppointment.count({ where: { ...overlapWhere, dentistId } })
    if (dentistOverlap > 0) return error(409, 'Dentist already has an appointment at this time')
    const patientOverlap = await DiaryAppointment.count({ where: { ...overlapWhere, patientId } })
    if (patientOverlap > 0) return error(409, 'Patient already has an appointment at this time')

    const treatmentName = selectedItems
      .map((item) => item.treatmentName || item.conditionLabel || item.condition || `Tooth ${item.fdi || ''}`.trim())
      .filter(Boolean)
      .join(', ')
      .slice(0, 120) || 'Treatment Plan'
    const amount = selectedItems.reduce((sum, item) => sum + Number(item.cost || 0), 0)

    const created = await DiaryAppointment.create({
      organisationId: Number(orgId),
      patientId,
      dentistId,
      treatmentId: null,
      treatmentName,
      status: 'Pending',
      startTime: start,
      endTime: end,
      notes,
      amount,
    })

    for (const item of selectedItems) {
      item.appointmentId = created.id
      if (String(item.status || '').toLowerCase() !== 'completed') item.status = 'scheduled'
      await item.save()
    }

    return success({
      id: created.id,
      patientId: created.patientId,
      dentistId: created.dentistId,
      treatmentName: created.treatmentName,
      status: created.status,
      startTime: created.startTime,
      endTime: created.endTime,
      date: toLocalYMD(created.startTime),
      time: toLocalHM(created.startTime),
      amount: Number(created.amount || 0),
      linkedTreatmentItemIds: selectedItems.map((item) => item.id),
    })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const updateAppointment = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { id } = payload
    if (!id) return error(400, 'id is required')
    const row = await DiaryAppointment.findOne({ where: { id: Number(id), organisationId: Number(orgId) } })
    if (!row) return error(404, 'Appointment not found')

    // Prefer date+time+duration updates to keep create/update validation semantics aligned.
    if (payload?.date && payload?.time) {
      const start = parseLocalDateTime(payload.date, payload.time)
      if (!start || Number.isNaN(start.getTime())) return error(400, 'Invalid date/time')
      const currentStart = row.startTime instanceof Date ? row.startTime : new Date(row.startTime)
      const currentEnd = row.endTime instanceof Date ? row.endTime : new Date(row.endTime)
      const currentDuration = (!Number.isNaN(currentStart?.getTime?.()) && !Number.isNaN(currentEnd?.getTime?.()))
        ? Math.max(1, Math.round((currentEnd.getTime() - currentStart.getTime()) / 60000))
        : 15
      const duration = Number(payload.duration || currentDuration || 15)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + duration)
      row.startTime = start
      row.endTime = end
    }

    const fields = ['status','notes','startTime','endTime','amount','treatmentName','dentistId','patientId']
    for (const f of fields) if (payload[f] !== undefined) row[f] = payload[f]

    // Optional safety validations if time or assignees changed
    const start = row.startTime instanceof Date ? row.startTime : new Date(row.startTime)
    const end = row.endTime instanceof Date ? row.endTime : new Date(row.endTime)
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Working hours (09:00–17:00)
      const workStart = new Date(start); setClinicHours(workStart, 9,0,0,0)
      const workEnd = new Date(start); setClinicHours(workEnd, 17,0,0,0)
      if (start < workStart) return error(400, 'Appointment must start at or after 09:00')
      if (end > workEnd) return error(400, 'Appointment must end by 17:00')

      // Overlaps (exclude self)
      const orgClause = { organisationId: Number(orgId) }
      const notCancelled = { status: { [Op.ne]: 'Cancelled' } }
      const overlapWindow = { [Op.and]: [ { startTime: { [Op.lt]: end } }, { endTime: { [Op.gt]: start } } ], id: { [Op.ne]: Number(id) } }

      const dentistId = Number(row.dentistId)
      const patientId = row.patientId ? Number(row.patientId) : null

      const dentistOverlap = await DiaryAppointment.count({ where: { ...orgClause, ...notCancelled, ...overlapWindow, dentistId } })
      if (dentistOverlap > 0) return error(409, 'Dentist already has an appointment at this time')
      if (patientId) {
        const patientOverlap = await DiaryAppointment.count({ where: { ...orgClause, ...notCancelled, ...overlapWindow, patientId } })
        if (patientOverlap > 0) return error(409, 'Patient already has an appointment at this time')
      }
    }
    await row.save()
    return success({ ok: true })
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Dentists available from rota ---
export const listDentistsForDate = async (event) => {
  try {
    const { orgId } = event.context.user
    // Return all dentists in organisation, no rota binding
    // Only include Active users (exclude Invited, Disabled, Expired)
    const users = await User.findAll({
      attributes: ['id','fullName','email','photo','roleId'],
      where: { status: 'Active' },
      include: [
        { model: Role, as: 'role', attributes: ['title'] },
        { model: UserOrganisation, as: 'userOrganisations', attributes: [], where: { organisationId: Number(orgId) } },
      ],
    })
    const dentistRoleIds = new Set([1, 2, 5])
    const out = users
      .filter((u) => {
        const roleId = Number(u.roleId)
        const title = (u.role?.title || '').toLowerCase()
        return dentistRoleIds.has(roleId) || title.includes('dentist')
      })
      .map(u => ({ id: u.id, name: u.fullName, role: u.role?.title || 'Dentist', start: null, end: null }))
    return success(out)
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Stats ---
export const getStats = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const period = (q.period || 'day').toLowerCase()
    let baseDate
    if (q.date) {
      if (USE_TZ_AGNOSTIC) {
        const parsed = parseDateParts(q.date)
        if (!parsed) return error(400, 'Invalid date')
        baseDate = buildUtcDate(parsed, 12, 0, 0, 0) // midday avoids DST jumps when shifting days
      } else {
        baseDate = new Date(q.date)
      }
    } else {
      baseDate = new Date()
    }
    let start = new Date(baseDate); let end = new Date(baseDate)
    if (USE_TZ_AGNOSTIC) {
      if (period === 'day') {
        setClinicHours(start, 0,0,0,0); setClinicHours(end, 23,59,59,999)
      }
      else if (period === 'week') {
        const day = baseDate.getUTCDay()
        const diff = (day + 6) % 7 // Monday-based
        start = new Date(baseDate); start.setUTCDate(baseDate.getUTCDate() - diff); setClinicHours(start, 0,0,0,0)
        end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); setClinicHours(end, 23,59,59,999)
      } else if (period === 'month') {
        start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1, 0, 0, 0, 0))
        end = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth()+1, 0, 23, 59, 59, 999))
      }
    } else {
      if (period === 'day') {
        start.setHours(0,0,0,0); end.setHours(23,59,59,999)
      }
      else if (period === 'week') {
        const day = baseDate.getDay()
        const diff = (day + 6) % 7 // Monday-based
        start = new Date(baseDate); start.setDate(baseDate.getDate() - diff); start.setHours(0,0,0,0)
        end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999)
      } else if (period === 'month') {
        start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        end = new Date(baseDate.getFullYear(), baseDate.getMonth()+1, 0, 23, 59, 59, 999)
      }
    }
    const rows = await DiaryAppointment.findAll({ where: { organisationId: Number(orgId), startTime: { [Op.between]: [start, end] } } })
    const accounts = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    return success({ accounts })
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Notes ---
export const listNotes = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const dentistId = Number(q.dentistId || 0)
    const date = q.date
    if (!dentistId) return error(400, 'dentistId is required')
    if (!date) return error(400, 'date is required')
    const rows = await DiaryNote.findAll({ where: { organisationId: Number(orgId), dentistId, date }, order: [['createdAt','DESC']] })
    return success(rows)
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

export const createNote = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const required = ['dentistId','title','date','time','channel','summary']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    const created = await DiaryNote.create({
      organisationId: Number(orgId),
      dentistId: Number(payload.dentistId),
      title: payload.title,
      date: payload.date,
      time: payload.time,
      channel: payload.channel,
      summary: payload.summary,
    })
    return success(created)
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

export const deleteNote = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const id = Number(payload.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryNote.findOne({ where: { id, organisationId: Number(orgId) } })
    if (!row) return error(404, 'Note not found')
    await row.destroy()
    return success({ ok: true })
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}

// --- Patient Comfort (Unique Patient Comfort) ---
export const getPatientComfort = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Get or create comfort record
    let comfort = await DiaryPatientComfort.findOne({
      where: { patientId, organisationId: Number(orgId) },
    })

    // If not found, return empty structure
    if (!comfort) {
      return success({
        patientId,
        beveragePreference: null,
        blanketPreference: null,
        entertainmentOptions: null,
        lightingPreference: null,
        roomTemperaturePreference: null,
        aromatherapyPreference: null,
        communicationStyle: null,
        anxietyLevel: null,
        customQuestions: [],
      })
    }

    return success(comfort)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientComfort = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    
    const patientId = Number(payload.patientId || 0)
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Validate custom questions (max 10)
    const customQuestions = payload.customQuestions || []
    if (customQuestions.length > 10) {
      return error(400, 'Maximum 10 custom questions allowed')
    }

    // Validate anxiety level if provided
    if (payload.anxietyLevel !== undefined && payload.anxietyLevel !== null) {
      const anxietyLevel = Number(payload.anxietyLevel)
      if (isNaN(anxietyLevel) || anxietyLevel < 1 || anxietyLevel > 10) {
        return error(400, 'Anxiety level must be between 1 and 10')
      }
    }

    // Validate communication style if provided
    if (payload.communicationStyle && !['Detailed', 'Minimal', 'Visual'].includes(payload.communicationStyle)) {
      return error(400, 'Communication style must be one of: Detailed, Minimal, Visual')
    }

    // Check if comfort record exists
    let comfort = null
    try {
      comfort = await DiaryPatientComfort.findOne({
        where: { patientId, organisationId: Number(orgId) },
      })
    } catch (dbError) {
      // Handle case where table might not exist yet
      if (dbError.message && dbError.message.includes('does not exist')) {
        console.warn('DiaryPatientComforts table not found, attempting to sync:', dbError.message)
        try {
          await DiaryPatientComfort.sync({ alter: true })
          console.log('DiaryPatientComforts table synced successfully')
        } catch (syncError) {
          console.error('Failed to sync DiaryPatientComforts table:', syncError)
          return error(500, `Database table not found. Please ensure the DiaryPatientComforts table exists. Error: ${syncError.message || dbError.message}`)
        }
        // Retry the findOne after sync
        comfort = await DiaryPatientComfort.findOne({
          where: { patientId, organisationId: Number(orgId) },
        })
      } else {
        throw dbError
      }
    }

    const comfortData = {
      patientId,
      organisationId: Number(orgId),
      beveragePreference: payload.beveragePreference || null,
      blanketPreference: payload.blanketPreference || null,
      entertainmentOptions: payload.entertainmentOptions || null,
      lightingPreference: payload.lightingPreference || null,
      roomTemperaturePreference: payload.roomTemperaturePreference || null,
      aromatherapyPreference: payload.aromatherapyPreference || null,
      communicationStyle: payload.communicationStyle || null,
      anxietyLevel: payload.anxietyLevel !== undefined && payload.anxietyLevel !== null ? Number(payload.anxietyLevel) : null,
      customQuestions: customQuestions,
    }

    if (comfort) {
      // Update existing record
      await comfort.update(comfortData)
      return success(comfort)
    } else {
      // Create new record
      const created = await DiaryPatientComfort.create(comfortData)
      return success(created)
    }
  } catch (e) {
    // Log the full error for debugging
    console.error('Error in savePatientComfort:', e)
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && (e.original.message || e.original.detail)))) || 'Internal server error'
    return error(500, msg)
  }
}

export const updatePatientComfort = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    
    const patientId = Number(payload.patientId || 0)
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Find existing comfort record
    const comfort = await DiaryPatientComfort.findOne({
      where: { patientId, organisationId: Number(orgId) },
    })

    if (!comfort) {
      return error(404, 'Patient comfort record not found. Use save endpoint to create it first.')
    }

    // Validate custom questions if provided
    if (payload.customQuestions !== undefined) {
      if (payload.customQuestions.length > 10) {
        return error(400, 'Maximum 10 custom questions allowed')
      }
    }

    // Validate anxiety level if provided
    if (payload.anxietyLevel !== undefined && payload.anxietyLevel !== null) {
      const anxietyLevel = Number(payload.anxietyLevel)
      if (isNaN(anxietyLevel) || anxietyLevel < 1 || anxietyLevel > 10) {
        return error(400, 'Anxiety level must be between 1 and 10')
      }
    }

    // Validate communication style if provided
    if (payload.communicationStyle && !['Detailed', 'Minimal', 'Visual'].includes(payload.communicationStyle)) {
      return error(400, 'Communication style must be one of: Detailed, Minimal, Visual')
    }

    // Update only provided fields
    const updateFields = [
      'beveragePreference',
      'blanketPreference',
      'entertainmentOptions',
      'lightingPreference',
      'roomTemperaturePreference',
      'aromatherapyPreference',
      'communicationStyle',
      'anxietyLevel',
      'customQuestions',
    ]

    for (const field of updateFields) {
      if (payload[field] !== undefined) {
        if (field === 'anxietyLevel') {
          comfort[field] = payload[field] !== null ? Number(payload[field]) : null
        } else {
          comfort[field] = payload[field]
        }
      }
    }

    await comfort.save()
    return success(comfort)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Static Survey Structure Helper ---
export const getSurveyStructure = () => {
  return {
    categories: [
      {
        id: 'category1',
        name: 'Current Dental Concerns',
        questions: [
          {
            id: 'question1',
            text: 'Do you currently experience any of the following? (Select all that apply)',
            type: 'checkbox',
            options: [
              'Tooth sensitivity (hot/cold/sweet)',
              'Tooth pain or discomfort when chewing',
              'Bleeding or swollen gums',
              'Loose or shifting teeth',
              'Jaw joint pain or clicking',
              'Grinding or clenching teeth (especially at night)',
              'Teeth or fillings breaking/chipping',
              'None of the above',
            ],
          },
        ],
      },
      {
        id: 'category2',
        name: 'Smile Aesthetic Concerns',
        questions: [
          {
            id: 'question2',
            text: 'What would you most like to change about your smile? (Select all that apply)',
            type: 'checkbox',
            subcategories: [
              {
                id: 'color_brightness',
                name: 'Color and Brightness',
                options: [
                  'Make my teeth whiter/brighter',
                  'Remove stains or discoloration',
                ],
              },
              {
                id: 'alignment_spacing',
                name: 'Alignment and Spacing',
                options: [
                  'Make my teeth straighter',
                  'Close gaps between my teeth',
                ],
              },
              {
                id: 'tooth_appearance',
                name: 'Tooth Appearance',
                options: [
                  'Repair chipped or cracked teeth',
                  'Replace old/dark fillings with natural-looking ones',
                  'Replace old crowns that don\'t match my teeth',
                  'Fix uneven or worn teeth',
                  'Make my teeth look more even in size',
                ],
              },
              {
                id: 'missing_teeth',
                name: 'Missing Teeth',
                options: [
                  'Replace missing teeth',
                  'Replace my removable denture with a permanent solution',
                ],
              },
              {
                id: 'overall',
                name: 'Overall',
                options: [
                  'Complete smile makeover',
                  'I\'m happy with my smile as it is',
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'category3',
        name: 'Smile Confidence Assessment',
        questions: [
          {
            id: 'question3',
            text: 'How important is your smile to you?',
            type: 'range',
            min: 1,
            max: 10,
          },
          {
            id: 'question4',
            text: 'How confident do you feel about your smile?',
            type: 'range',
            min: 1,
            max: 10,
          },
          {
            id: 'question5',
            text: 'Do you ever feel self-conscious about your smile in social situations?',
            type: 'checkbox',
            options: [
              'Yes, frequently',
              'Yes, sometimes',
              'Rarely',
              'Never',
            ],
          },
        ],
      },
      {
        id: 'category4',
        name: 'Treatment Interest & Priorities',
        questions: [
          {
            id: 'question6',
            text: 'Which treatments are you most interested in learning more about? (Select all that apply)',
            type: 'checkbox',
            subcategories: [
              {
                id: 'teeth_whitening',
                name: 'Teeth Whitening',
                options: [
                  'Professional teeth whitening (in-office)',
                  'Take-home whitening kits',
                ],
              },
              {
                id: 'orthodontics',
                name: 'Orthodontics',
                options: [
                  'Invisalign (clear aligners)',
                  'Traditional braces',
                  'Quick cosmetic alignment (6-month braces)',
                ],
              },
              {
                id: 'cosmetic_treatments',
                name: 'Cosmetic Treatments',
                options: [
                  'Porcelain veneers',
                  'Composite bonding',
                  'Tooth contouring/reshaping',
                  'Gum recontouring',
                ],
              },
              {
                id: 'restorative',
                name: 'Restorative',
                options: [
                  'Dental implants',
                  'Crowns or bridges',
                  'White fillings (replacing silver/amalgam)',
                ],
              },
              {
                id: 'other',
                name: 'Other',
                options: [
                  'Smile makeover consultation',
                  'Not sure - I\'d like professional advice',
                ],
              },
            ],
          },
          {
            id: 'question7',
            text: 'What is your main priority for improving your smile?',
            type: 'checkbox',
            options: [
              'Appearance and aesthetics',
              'Function and comfort',
              'Both equally important',
              'Health concerns (pain, decay, gum disease)',
            ],
          },
        ],
      },
      {
        id: 'category5',
        name: 'Photo Upload (Optional)',
        questions: [
          {
            id: 'question8',
            text: 'Would you like to upload photos of your smile?',
            type: 'file_upload',
            accept: 'image/*',
            multiple: true,
          },
        ],
      },
      {
        id: 'category6',
        name: 'Timeline & Budget (Conditional)',
        questions: [
          {
            id: 'question9',
            text: 'When are you hoping to start treatment?',
            type: 'checkbox',
            options: [
              'As soon as possible',
              'Within the next 3 months',
              'Within the next 6 months',
              'Within the next year',
              'Just exploring options for now',
            ],
          },
          {
            id: 'question10',
            text: 'Do you have a budget in mind for your smile improvement?',
            type: 'checkbox',
            options: [
              'Under £500',
              '£500 - £1,000',
              '£1,000 - £2,500',
              '£2,500 - £5,000',
              'Over £5,000',
              'Over £5,000',
              'Not sure yet',
            ],
          },
        ],
      },
      {
        id: 'category7',
        name: 'Additional Information',
        questions: [
          {
            id: 'question11',
            text: 'Is there anything else you\'d like us to know about your smile concerns or goals?',
            type: 'textarea',
          },
          {
            id: 'question12',
            text: 'How would you like us to follow up with you?',
            type: 'checkbox',
            options: [
              'Phone Call',
              'Email',
              'Text Message',
              'Via Patient Portal Message',
            ],
            preferredContactTime: {
              label: 'Preferred contact time:',
              options: [
                'Morning (9am-12pm)',
                'Afternoon (12pm-5pm)',
                'Evening (5pm-7pm)',
                'Anytime',
              ],
            },
          },
        ],
      },
    ],
  }
}

// --- Patient Survey ---
export const getPatientSurvey = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Get survey structure (always available, static)
    const surveyStructure = getSurveyStructure()

    // Try to get existing survey, but handle case where table doesn't exist yet
    let survey = null
    try {
      survey = await DiaryPatientSurvey.findOne({
        where: { patientId, organisationId: Number(orgId), surveyType: 'smile_concern' },
      })
    } catch (dbError) {
      // Table doesn't exist yet - that's okay, return empty structure
      // This allows the form to load even before migrations are run
      console.warn('DiaryPatientSurveys table not found, returning empty survey structure:', dbError.message)
    }

    if (!survey) {
      return success({
        patientId,
        surveyType: 'smile_concern',
        structure: surveyStructure,
        answers: {},
        uploadedPhotos: [],
        isCompleted: false,
        completedAt: null,
      })
    }

    return success({
      ...survey.toJSON(),
      structure: surveyStructure,
    })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientSurvey = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    
    const patientId = Number(payload.patientId || 0)
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Find or create survey
    let survey = await DiaryPatientSurvey.findOne({
      where: { patientId, organisationId: Number(orgId), surveyType: 'smile_concern' },
    })

    const surveyData = {
      patientId,
      organisationId: Number(orgId),
      surveyType: 'smile_concern',
      answers: payload.answers || {},
      uploadedPhotos: payload.uploadedPhotos || survey?.uploadedPhotos || [],
      isCompleted: payload.isCompleted || false,
      completedAt: payload.isCompleted ? new Date() : null,
    }

    if (survey) {
      await survey.update(surveyData)
      return success(survey)
    } else {
      const created = await DiaryPatientSurvey.create(surveyData)
      return success(created)
    }
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const uploadSurveyPhotos = async (event) => {
  try {
    const { orgId } = event.context.user

    const form = formidable({
      multiples: true,
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      filename: (name, ext, part) => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        return `survey-${timestamp}-${random}${ext}`
      },
    })

    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err)
        resolve({ files, fields })
      })
    })

    const patientId = Number(fields.patientId?.[0] || 0)
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Get or create survey
    let survey = await DiaryPatientSurvey.findOne({
      where: { patientId, organisationId: Number(orgId), surveyType: 'smile_concern' },
    })

    const uploadedFiles = Array.isArray(files.photos) ? files.photos : [files.photos]
    const filePaths = []

    for (const file of uploadedFiles) {
      const baseName = path.basename(file.filepath)
      const link = await uploadTempFile({
        filepath: file.filepath,
        filename: baseName,
        contentType: file.mimetype || file.type,
        baseDir: "uploads/survey",
      })
      filePaths.push(link)
    }

    const existingPhotos = survey?.uploadedPhotos || []
    const updatedPhotos = [...existingPhotos, ...filePaths]

    if (survey) {
      await survey.update({ uploadedPhotos: updatedPhotos })
      return success({ uploadedPhotos: updatedPhotos, newFiles: filePaths })
    } else {
      const created = await DiaryPatientSurvey.create({
        patientId,
        organisationId: Number(orgId),
        surveyType: 'smile_concern',
        answers: {},
        uploadedPhotos: updatedPhotos,
        isCompleted: false,
      })
      return success({ uploadedPhotos: updatedPhotos, newFiles: filePaths })
    }
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const downloadPatientSurvey = async (event) => {
  try {
    const { orgId } = event.context.user
    const q = getQuery(event) || {}
    const patientId = Number(q.patientId || 0)
    
    if (!patientId) {
      return error(400, 'patientId is required')
    }

    const survey = await DiaryPatientSurvey.findOne({
      where: { patientId, organisationId: Number(orgId), surveyType: 'smile_concern' },
      include: [
        {
          model: DiaryPatient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'mobile'],
        },
      ],
    })

    if (!survey) {
      return error(404, 'Survey not found')
    }

    const surveyStructure = getSurveyStructure()
    
    // Format data for download (JSON format)
    const downloadData = {
      patient: {
        name: `${survey.patient.firstName} ${survey.patient.lastName}`,
        email: survey.patient.email,
        mobile: survey.patient.mobile,
      },
      surveyType: survey.surveyType,
      completedAt: survey.completedAt,
      answers: survey.answers,
      uploadedPhotos: survey.uploadedPhotos,
      structure: surveyStructure,
    }

    return success(downloadData)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const printPatientSurvey = async (event) => {
  // Same as download but can be formatted differently for printing
  return await downloadPatientSurvey(event)
}

export const sharePatientSurvey = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    
    const patientId = Number(payload.patientId || 0)
    const shareMethod = payload.shareMethod || 'email' // email, link, etc.
    const recipientEmail = payload.recipientEmail

    if (!patientId) {
      return error(400, 'patientId is required')
    }

    const survey = await DiaryPatientSurvey.findOne({
      where: { patientId, organisationId: Number(orgId), surveyType: 'smile_concern' },
      include: [
        {
          model: DiaryPatient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    })

    if (!survey) {
      return error(404, 'Survey not found')
    }

    // For now, return the survey data that can be shared
    // Email sending can be implemented separately
    const shareData = {
      patient: {
        name: `${survey.patient.firstName} ${survey.patient.lastName}`,
      },
      survey: survey.toJSON(),
      shareMethod,
      recipientEmail,
    }

    // TODO: Implement actual email sending or link generation
    return success({ message: 'Survey shared successfully', shareData })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

// --- Patient Forms ---
export const listPatientForms = async (event) => {
  try {
    const { orgId, userId } = event.context.user
    const query = getQuery(event)
    const patientId = Number(query.patientId || 0)

    if (!patientId) {
      return error(400, 'patientId is required')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Get all forms for this patient
    const forms = await DiaryPatientForm.findAll({
      where: {
        patientId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    // Format response
    const formattedForms = forms.map((form) => ({
      id: form.id,
      formType: form.formType,
      answers: form.answers || {},
      patientComments: form.patientComments || '',
      ourComments: form.ourComments || '',
      additionalInfo: form.additionalInfo || '',
      createdBy: form.creator
        ? form.creator.fullName || form.creator.email || 'Unknown'
        : 'Unknown',
      createdAt: form.createdAt ? new Date(form.createdAt).toLocaleDateString() : '',
      updatedAt: form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '',
    }))

    return success(formattedForms)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const getPatientForm = async (event) => {
  try {
    const { orgId } = event.context.user
    const query = getQuery(event)
    const formId = Number(query.id || 0)

    if (!formId) {
      return error(400, 'Form id is required')
    }

    const form = await DiaryPatientForm.findOne({
      where: {
        id: formId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    })

    if (!form) {
      return error(404, 'Form not found')
    }

    const formattedForm = {
      id: form.id,
      patientId: form.patientId,
      formType: form.formType,
      answers: form.answers || {},
      patientComments: form.patientComments || '',
      ourComments: form.ourComments || '',
      additionalInfo: form.additionalInfo || '',
      createdBy: form.creator
        ? form.creator.fullName || form.creator.email || 'Unknown'
        : 'Unknown',
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }

    return success(formattedForm)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const savePatientForm = async (event) => {
  try {
    const { orgId, userId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const patientId = Number(payload.patientId || 0)
    const formType = payload.formType

    if (!patientId) {
      return error(400, 'patientId is required')
    }

    if (!formType || !['medical_history', 'consent'].includes(formType)) {
      return error(400, 'formType must be either "medical_history" or "consent"')
    }

    // Verify patient belongs to organization
    const patient = await DiaryPatient.findOne({
      where: { id: patientId, organisationId: Number(orgId) },
    })

    if (!patient) {
      return error(404, 'Patient not found')
    }

    // Validate answers structure
    const answers = payload.answers || {}
    if (typeof answers !== 'object') {
      return error(400, 'answers must be an object')
    }

    // For medical_history forms, answers can be a complex nested structure
    // For consent forms, validate yes/no answers
    if (formType === 'consent') {
      // Validate that all answer values are 'yes' or 'no' for consent forms
      for (const key in answers) {
        if (answers[key] !== 'yes' && answers[key] !== 'no') {
          return error(400, `Answer for ${key} must be either "yes" or "no"`)
        }
      }
    }
    // For medical_history forms, accept any structure (nested objects, arrays, strings, etc.)

    const formData = {
      patientId,
      organisationId: Number(orgId),
      formType,
      answers,
      patientComments: payload.patientComments || null,
      ourComments: payload.ourComments || null,
      additionalInfo: payload.additionalInfo || null,
      createdBy: userId,
    }

    let created
    try {
      created = await DiaryPatientForm.create(formData)
    } catch (dbError) {
      // Handle case where table might not exist yet
      if (dbError.message && dbError.message.includes('does not exist')) {
        console.warn('DiaryPatientForms table not found, attempting to sync:', dbError.message)
        try {
          await DiaryPatientForm.sync({ alter: true })
          console.log('DiaryPatientForms table synced successfully')
          // Retry the create after sync
          created = await DiaryPatientForm.create(formData)
        } catch (syncError) {
          console.error('Failed to sync DiaryPatientForms table:', syncError)
          return error(500, `Database table not found. Please ensure the DiaryPatientForms table exists. Error: ${syncError.message || dbError.message}`)
        }
      } else {
        throw dbError
      }
    }

    // Fetch with creator info
    let form
    try {
      form = await DiaryPatientForm.findByPk(created.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'fullName', 'email'],
          },
        ],
      })
    } catch (includeError) {
      // If include fails, just return the form without creator info
      console.warn('Failed to include creator info:', includeError.message)
      form = created
    }

    const formattedForm = {
      id: form.id,
      patientId: form.patientId,
      formType: form.formType,
      answers: form.answers || {},
      patientComments: form.patientComments || '',
      ourComments: form.ourComments || '',
      additionalInfo: form.additionalInfo || '',
      createdBy: form.creator
        ? form.creator.fullName || form.creator.email || 'Unknown'
        : 'Unknown',
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }

    return success(formattedForm)
  } catch (e) {
    // Log the full error for debugging
    console.error('Error in savePatientForm:', e)
    console.error('Error stack:', e.stack)
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && (e.original.message || e.original.detail)))) || 'Internal server error'
    return error(500, msg)
  }
}

export const updatePatientForm = async (event) => {
  try {
    const { orgId, userId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body

    const formId = Number(payload.id || 0)

    if (!formId) {
      return error(400, 'Form id is required')
    }

    // Find existing form
    const form = await DiaryPatientForm.findOne({
      where: {
        id: formId,
        organisationId: Number(orgId),
      },
    })

    if (!form) {
      return error(404, 'Form not found')
    }

    // Validate answers if provided
    if (payload.answers !== undefined) {
      if (typeof payload.answers !== 'object') {
        return error(400, 'answers must be an object')
      }

      // Validate that all answer values are 'yes' or 'no'
      for (const key in payload.answers) {
        if (payload.answers[key] !== 'yes' && payload.answers[key] !== 'no') {
          return error(400, `Answer for ${key} must be either "yes" or "no"`)
        }
      }
    }

    // Update form
    const updateData = {}
    if (payload.answers !== undefined) updateData.answers = payload.answers
    if (payload.patientComments !== undefined) updateData.patientComments = payload.patientComments || null
    if (payload.ourComments !== undefined) updateData.ourComments = payload.ourComments || null
    if (payload.additionalInfo !== undefined) updateData.additionalInfo = payload.additionalInfo || null

    await form.update(updateData)

    // Fetch updated form with creator info
    const updatedForm = await DiaryPatientForm.findByPk(form.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    })

    const formattedForm = {
      id: updatedForm.id,
      patientId: updatedForm.patientId,
      formType: updatedForm.formType,
      answers: updatedForm.answers || {},
      patientComments: updatedForm.patientComments || '',
      ourComments: updatedForm.ourComments || '',
      additionalInfo: updatedForm.additionalInfo || '',
      createdBy: updatedForm.creator
        ? updatedForm.creator.fullName || updatedForm.creator.email || 'Unknown'
        : 'Unknown',
      createdAt: updatedForm.createdAt,
      updatedAt: updatedForm.updatedAt,
    }

    return success(formattedForm)
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const deletePatientForm = async (event) => {
  try {
    const { orgId } = event.context.user
    const query = getQuery(event)
    const formId = Number(query.id || 0)

    if (!formId) {
      return error(400, 'Form id is required')
    }

    const form = await DiaryPatientForm.findOne({
      where: {
        id: formId,
        organisationId: Number(orgId),
      },
    })

    if (!form) {
      return error(404, 'Form not found')
    }

    await form.destroy()

    return success({ message: 'Form deleted successfully' })
  } catch (e) {
    const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'
    return error(500, msg)
  }
}

export const uploadChartImage = async (event) => {
  try {
    const { orgId } = event.context.user

    const form = formidable({
      multiples: false,
      uploadDir: os.tmpdir(),
      keepExtensions: true,
    })

    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err)
        resolve({ files, fields })
      })
    })

    const patientId = Number(fields.patientId?.[0] || 0)
    if (!patientId) return error(400, 'patientId is required')

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return error(400, 'file is required')

    const ext = path.extname(file.originalFilename || file.newFilename || '')
    const baseName = `chart-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    const link = await uploadTempFile({
      filepath: file.filepath,
      filename: baseName,
      contentType: file.mimetype || file.type,
      baseDir: 'chart-images',
    })

    return success({ url: link, name: file.originalFilename || baseName })
  } catch (e) {
    return error(500, (e && e.message) || 'Internal server error')
  }
}
