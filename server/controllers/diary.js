import { Op } from 'sequelize'
import { DiaryTreatment, DiaryPatient, DiaryAppointment, DiaryNote, User, RotaShift, Rota, OrganisationTreatment, Role, UserOrganisation } from '../models'
import { success, error } from '../utils/response'

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

// --- Treatments ---
export const listTreatments = async (event) => {
  try {
    const { orgId } = event.context.user
    const rows = await OrganisationTreatment.findAll({ where: { organisationId: Number(orgId), active: true }, order: [['name','ASC']] })
    // Seed a few defaults on first run
    if (!rows.length) {
      const seed = [
        { code: 'EXAM', name: 'Exam', amount: 60, defaultDuration: 20 },
        { code: 'SCALE', name: 'Scale & Polish', amount: 80, defaultDuration: 30 },
        { code: 'WHIT', name: 'Teeth Whitening', amount: 200, defaultDuration: 45 },
      ]
      await OrganisationTreatment.bulkCreate(seed.map(s => ({ ...s, organisationId: Number(orgId) })))
      const seeded = await OrganisationTreatment.findAll({ where: { organisationId: Number(orgId) }, order: [['name','ASC']] })
      return success(seeded)
    }
    return success(rows)
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

export const createPatient = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const required = ['firstName','lastName']
    for (const k of required) if (!payload?.[k]) return error(400, `${k} is required`)
    const data = {
      organisationId: Number(orgId),
      title: payload.title || null,
      sex: payload.sex || null,
      firstName: payload.firstName,
      middleName: payload.middleName || null,
      lastName: payload.lastName,
      preferredName: payload.preferredName || null,
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const id = Number(payload.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryPatient.findOne({ where: { id, organisationId: Number(orgId) } })
    if (!row) return error(404, 'Patient not found')
    const fields = [
      'title','sex','firstName','middleName','lastName','preferredName',
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    let treatmentId = null // keep null to avoid FK mismatch with DiaryTreatments
    let treatmentName = payload.treatmentName || null
    const incomingOrgTreatmentId = payload.treatmentId ? Number(payload.treatmentId) : null
    if (incomingOrgTreatmentId) {
      const t = await OrganisationTreatment.findOne({ where: { id: incomingOrgTreatmentId, organisationId: Number(orgId) } })
      if (t) {
        // Use dictionary amount unless explicitly overridden in payload
        amount = Number(t.amount || 0)
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

export const updateAppointment = async (event) => {
  try {
    const { orgId } = event.context.user
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const { id } = payload
    if (!id) return error(400, 'id is required')
    const row = await DiaryAppointment.findOne({ where: { id: Number(id), organisationId: Number(orgId) } })
    if (!row) return error(404, 'Appointment not found')
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
    const out = users
      .filter(u => u.roleId === 5 || (u.role?.title || '').toLowerCase().includes('dentist'))
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const id = Number(payload.id || 0)
    if (!id) return error(400, 'id is required')
    const row = await DiaryNote.findOne({ where: { id, organisationId: Number(orgId) } })
    if (!row) return error(404, 'Note not found')
    await row.destroy()
    return success({ ok: true })
  } catch (e) { const msg = (e && (e.message || (e.data && e.data.message) || (e.original && e.original.detail))) || 'Internal server error'; return error(500, msg) }
}
