import { Op } from 'sequelize'
import { DiaryTreatment, DiaryPatient, DiaryAppointment, DiaryNote, User, RotaShift, Rota, OrganisationTreatment, Role, UserOrganisation } from '../models'
import { success, error } from '../utils/response'

// ---- Helpers: local date/time parsing + formatting ----
const pad2 = (n) => String(n).padStart(2, '0')
const toLocalHM = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d)
  return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
}
const toLocalYMD = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}
const parseLocalDateTime = (dateStr, timeStr) => {
  // Ensures local-time parsing (no timezone) to keep UI/server consistent
  // Accepts time in HH:mm or HH:mm:ss
  if (!dateStr || !timeStr) return null
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  // Using the ISO-like local format (no Z) makes Node treat as local time
  return new Date(`${dateStr}T${t}`)
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
      lastName: payload.lastName,
      address1: payload.address1 || null,
      postcode: payload.postcode || null,
      dob: payload.dob || null,
      mobile: payload.mobile || null,
      email: payload.email || null,
      marketingConsent: payload.marketingConsent || null,
      receiveSms: payload.receiveSms === true || payload.receiveSms === 'Yes',
      receiveEmail: payload.receiveEmail === true || payload.receiveEmail === 'Yes',
      paymentPlan: payload.paymentPlan || null,
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
    const fields = ['title','sex','firstName','lastName','address1','postcode','dob','mobile','email','marketingConsent','receiveSms','receiveEmail','paymentPlan','defaultDentistId','recallMethod','recallInterval']
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
    if (!dateStr) return error(400, 'date is required')
    const day = new Date(dateStr)
    const start = new Date(day); start.setHours(0,0,0,0)
    const end = new Date(day); end.setHours(23,59,59,999)
    const where = { organisationId: Number(orgId), startTime: { [Op.between]: [start, end] } }
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
    const workStart = new Date(start); workStart.setHours(9,0,0,0)
    const workEnd = new Date(start); workEnd.setHours(17,0,0,0)
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
      const workStart = new Date(start); workStart.setHours(9,0,0,0)
      const workEnd = new Date(start); workEnd.setHours(17,0,0,0)
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
    const users = await User.findAll({
      attributes: ['id','fullName','email','photo','roleId'],
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
    const baseDate = q.date ? new Date(q.date) : new Date()
    let start = new Date(baseDate); let end = new Date(baseDate)
    if (period === 'day') { start.setHours(0,0,0,0); end.setHours(23,59,59,999) }
    else if (period === 'week') {
      const day = baseDate.getDay();
      const diff = (day + 6) % 7; // Monday-based
      start = new Date(baseDate); start.setDate(baseDate.getDate() - diff); start.setHours(0,0,0,0)
      end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999)
    } else if (period === 'month') {
      start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
      end = new Date(baseDate.getFullYear(), baseDate.getMonth()+1, 0, 23,59,59,999)
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

