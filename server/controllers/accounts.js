import { Op } from 'sequelize'
import { readBody, getQuery } from 'h3'
import {
  DiaryPatient,
  DiaryTreatmentPlan,
  DiaryTreatmentPlanItem,
  PatientInvoice,
  PatientInvoiceItem,
  PatientPayment,
  PatientPaymentAllocation,
} from '../models'
import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'

// ── Helpers ────────────────────────────────────────────────────────────────

const requirePatient = async (orgId, patientId) => {
  if (!patientId) return null
  return DiaryPatient.findOne({
    where: { id: Number(patientId), organisationId: Number(orgId) },
    attributes: ['id', 'organisationId'],
  })
}

const assertPatient = async (orgId, patientId) => {
  const patient = await requirePatient(orgId, patientId)
  if (!patient) error(404, 'Patient not found')
  return patient
}

const pad5 = (n) => String(n).padStart(5, '0')

const nextSequence = async (model, orgId, field, prefix) => {
  const last = await model.findOne({
    where: { organisationId: Number(orgId), [field]: { [Op.like]: `${prefix}%` } },
    order: [[field, 'DESC']],
    attributes: [field],
  })
  if (!last) return `${prefix}00001`
  const num = parseInt(String(last[field]).replace(prefix, ''), 10) || 0
  return `${prefix}${pad5(num + 1)}`
}

const toNum = (v) => Number(v ?? 0)

const deriveInvoiceStatus = (total, amountPaid) => {
  const t = toNum(total)
  const p = toNum(amountPaid)
  if (p <= 0) return 'unpaid'
  if (p >= t) return 'paid'
  return 'part_paid'
}

const serializeInvoice = (inv) => ({
  id: inv.id,
  invoiceNumber: inv.invoiceNumber,
  invoiceDate: inv.invoiceDate,
  dueDate: inv.dueDate,
  status: inv.status,
  subtotal: toNum(inv.subtotal),
  discount: toNum(inv.discount),
  total: toNum(inv.total),
  amountPaid: toNum(inv.amountPaid),
  balance: toNum(inv.balance),
  notes: inv.notes || '',
  practitionerId: inv.practitionerId,
  practitionerName: inv.practitionerName || '',
  appointmentId: inv.appointmentId,
  appointmentGroupId: inv.appointmentGroupId,
  planId: inv.planId,
  planName: inv.planName || '',
  createdAt: inv.createdAt,
  items: Array.isArray(inv.items)
    ? inv.items.map(serializeInvoiceItem)
    : [],
})

const serializeInvoiceItem = (item) => ({
  id: item.id,
  invoiceId: item.invoiceId,
  treatmentPlanItemId: item.treatmentPlanItemId,
  description: item.description,
  quantity: toNum(item.quantity),
  unitPrice: toNum(item.unitPrice),
  total: toNum(item.total),
  fdi: item.fdi,
  surface: item.surface || '',
  treatmentCode: item.treatmentCode || '',
  practitionerId: item.practitionerId,
  practitionerName: item.practitionerName || '',
  sortOrder: item.sortOrder,
})

const serializePayment = (pay) => ({
  id: pay.id,
  paymentNumber: pay.paymentNumber,
  paymentDate: pay.paymentDate,
  method: pay.method,
  amount: toNum(pay.amount),
  unallocated: toNum(pay.unallocated),
  reference: pay.reference || '',
  notes: pay.notes || '',
  takenByUserId: pay.takenByUserId,
  takenByName: pay.takenByName || '',
  practitionerId: pay.practitionerId,
  practitionerName: pay.practitionerName || '',
  createdAt: pay.createdAt,
  allocations: Array.isArray(pay.allocations)
    ? pay.allocations.map((a) => ({
        id: a.id,
        invoiceId: a.invoiceId,
        amount: toNum(a.amount),
        invoiceNumber: a.invoice?.invoiceNumber || '',
      }))
    : [],
})

// Re-compute amountPaid / balance / status from allocations and persist
const reconcileInvoice = async (invoiceId) => {
  const total = await PatientPaymentAllocation.sum('amount', {
    where: { invoiceId },
  })
  const amountPaid = toNum(total)
  const invoice = await PatientInvoice.findByPk(invoiceId)
  if (!invoice) return
  const balance = Math.max(0, toNum(invoice.total) - amountPaid)
  const status = deriveInvoiceStatus(invoice.total, amountPaid)
  await invoice.update({ amountPaid, balance, status })
}

// Re-compute unallocated on a payment and persist
const reconcilePayment = async (paymentId) => {
  const allocated = await PatientPaymentAllocation.sum('amount', {
    where: { paymentId },
  })
  const payment = await PatientPayment.findByPk(paymentId)
  if (!payment) return
  const unallocated = Math.max(0, toNum(payment.amount) - toNum(allocated))
  await payment.update({ unallocated })
}

// ── Stats ──────────────────────────────────────────────────────────────────

export const getAccountStats = async (event) => {
  const { orgId } = event.context.user
  const { patientId } = getQuery(event)
  if (!patientId) return error(400, 'patientId required')
  await assertPatient(orgId, patientId)

  const where = { organisationId: Number(orgId), patientId: Number(patientId) }

  const [outstandingResult, totalPaidResult, unallocatedResult] = await Promise.all([
    PatientInvoice.sum('balance', {
      where: { ...where, status: { [Op.in]: ['unpaid', 'part_paid'] } },
    }),
    PatientPaymentAllocation.sum('amount', { where }),
    PatientPayment.sum('unallocated', { where }),
  ])

  return success({
    outstanding: toNum(outstandingResult),
    totalPaid: toNum(totalPaidResult),
    unallocated: toNum(unallocatedResult),
  })
}

// ── Invoices ───────────────────────────────────────────────────────────────

export const listInvoices = async (event) => {
  const { orgId } = event.context.user
  const { patientId } = getQuery(event)
  if (!patientId) return error(400, 'patientId required')
  await assertPatient(orgId, patientId)

  const rows = await PatientInvoice.findAll({
    where: { organisationId: Number(orgId), patientId: Number(patientId) },
    include: [{ model: PatientInvoiceItem, as: 'items' }],
    order: [['invoiceDate', 'DESC'], ['createdAt', 'DESC']],
  })

  return success(rows.map(serializeInvoice))
}

export const createInvoice = async (event) => {
  const { orgId, userId } = event.context.user
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const { patientId, items = [], invoiceDate, notes, discount, practitionerId, practitionerName, appointmentId, appointmentGroupId, planId, planName } = payload
  if (!patientId) return error(400, 'patientId required')
  if (!Array.isArray(items) || !items.length) return error(400, 'At least one item required')
  await assertPatient(orgId, patientId)

  const invoiceNumber = await nextSequence(PatientInvoice, orgId, 'invoiceNumber', 'INV-')
  const subtotal = items.reduce((sum, i) => sum + toNum(i.unitPrice) * toNum(i.quantity || 1), 0)
  const disc = toNum(discount)
  const total = Math.max(0, subtotal - disc)

  const invoice = await PatientInvoice.create({
    organisationId: Number(orgId),
    patientId: Number(patientId),
    invoiceNumber,
    invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
    status: 'unpaid',
    subtotal,
    discount: disc,
    total,
    amountPaid: 0,
    balance: total,
    notes: notes || '',
    practitionerId: practitionerId || null,
    practitionerName: practitionerName || '',
    appointmentId: appointmentId || null,
    appointmentGroupId: appointmentGroupId || null,
    planId: planId || null,
    planName: planName || '',
    createdByUserId: userId || null,
  })

  const itemRows = items.map((item, idx) => ({
    organisationId: Number(orgId),
    patientId: Number(patientId),
    invoiceId: invoice.id,
    treatmentPlanItemId: item.treatmentPlanItemId || null,
    description: String(item.description || ''),
    quantity: toNum(item.quantity || 1),
    unitPrice: toNum(item.unitPrice),
    total: toNum(item.unitPrice) * toNum(item.quantity || 1),
    fdi: item.fdi || null,
    surface: item.surface || null,
    treatmentCode: item.treatmentCode || null,
    practitionerId: item.practitionerId || null,
    practitionerName: item.practitionerName || '',
    sortOrder: idx,
  }))
  await PatientInvoiceItem.bulkCreate(itemRows)

  const full = await PatientInvoice.findByPk(invoice.id, {
    include: [{ model: PatientInvoiceItem, as: 'items' }],
  })
  return success(serializeInvoice(full))
}

export const updateInvoice = async (event) => {
  const { orgId } = event.context.user
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body
  const { id, ...patch } = payload
  if (!id) return error(400, 'id required')

  const invoice = await PatientInvoice.findOne({
    where: { id: Number(id), organisationId: Number(orgId) },
  })
  if (!invoice) return error(404, 'Invoice not found')

  const allowed = ['status', 'dueDate', 'discount', 'notes', 'practitionerId', 'practitionerName']
  const update = {}
  allowed.forEach((k) => { if (k in patch) update[k] = patch[k] })

  if ('discount' in update) {
    const disc = toNum(update.discount)
    const total = Math.max(0, toNum(invoice.subtotal) - disc)
    update.discount = disc
    update.total = total
    update.balance = Math.max(0, total - toNum(invoice.amountPaid))
    update.status = deriveInvoiceStatus(total, invoice.amountPaid)
  }

  await invoice.update(update)
  const full = await PatientInvoice.findByPk(invoice.id, {
    include: [{ model: PatientInvoiceItem, as: 'items' }],
  })
  return success(serializeInvoice(full))
}

export const deleteInvoice = async (event) => {
  const { orgId } = event.context.user
  const body = await readBody(event)
  const { id } = typeof body === 'string' ? parseJsonBody(body) : body
  if (!id) return error(400, 'id required')

  const invoice = await PatientInvoice.findOne({
    where: { id: Number(id), organisationId: Number(orgId) },
  })
  if (!invoice) return error(404, 'Invoice not found')

  // Cascade: allocations deleted via DB FK; reconcile affected payments
  const allocs = await PatientPaymentAllocation.findAll({ where: { invoiceId: Number(id) } })
  const affectedPaymentIds = [...new Set(allocs.map((a) => a.paymentId))]
  await invoice.destroy()
  await Promise.all(affectedPaymentIds.map((pid) => reconcilePayment(pid)))

  return success({ id: Number(id) })
}

// ── Generate invoice from completed treatment plan items ──────────────────

export const generateInvoiceFromTreatments = async (event) => {
  const { orgId, userId } = event.context.user
  const body = await readBody(event)
  const { patientId, combine } = typeof body === 'string' ? parseJsonBody(body) : body
  if (!patientId) return error(400, 'patientId required')
  await assertPatient(orgId, patientId)

  // Find completed items that showOnInvoice and are not already on an invoice
  const alreadyInvoicedIds = (
    await PatientInvoiceItem.findAll({
      where: {
        organisationId: Number(orgId),
        patientId: Number(patientId),
        treatmentPlanItemId: { [Op.ne]: null },
      },
      attributes: ['treatmentPlanItemId'],
    })
  ).map((r) => r.treatmentPlanItemId)

  const where = {
    organisationId: Number(orgId),
    patientId: Number(patientId),
    status: 'completed',
    showOnInvoice: true,
    cost: { [Op.gt]: 0 },
  }
  if (alreadyInvoicedIds.length) {
    where.id = { [Op.notIn]: alreadyInvoicedIds }
  }

  const items = await DiaryTreatmentPlanItem.findAll({
    where,
    order: [['completedAt', 'ASC'], ['priority', 'ASC']],
  })

  if (!items.length) return error(400, 'No uninvoiced completed treatments found')

  const today = new Date().toISOString().slice(0, 10)
  const created = []

  const invoiceGroups = combine ? new Map([['combined', items]]) : new Map()
  if (!combine) {
    items.forEach((item) => {
      const key = item.appointmentGroupId || item.planId || 'default'
      if (!invoiceGroups.has(key)) invoiceGroups.set(key, [])
      invoiceGroups.get(key).push(item)
    })
  }

  for (const [, groupItems] of invoiceGroups) {
    const invoiceNumber = await nextSequence(PatientInvoice, orgId, 'invoiceNumber', 'INV-')
    const subtotal = groupItems.reduce((sum, i) => sum + toNum(i.cost), 0)
    const firstItem = groupItems[0]

    let planName = ''
    let appointmentGroupId = null
    let appointmentId = null

    if (!combine) {
      planName = firstItem.planName || ''
      if (firstItem.planId) {
        const plan = await DiaryTreatmentPlan.findOne({
          where: {
            organisationId: Number(orgId),
            patientId: Number(patientId),
            planKey: firstItem.planId,
          },
          attributes: ['name'],
        })
        if (plan) planName = plan.name
      }
      appointmentGroupId = firstItem.appointmentGroupId || null
      appointmentId = firstItem.appointmentId || null
    }

    const invoice = await PatientInvoice.create({
      organisationId: Number(orgId),
      patientId: Number(patientId),
      invoiceNumber,
      invoiceDate: today,
      status: 'unpaid',
      subtotal,
      discount: 0,
      total: subtotal,
      amountPaid: 0,
      balance: subtotal,
      notes: combine ? 'Combined treatment plan invoice' : '',
      practitionerId: firstItem.practitionerId || null,
      practitionerName: firstItem.practitionerName || firstItem.clinicianName || '',
      appointmentId: appointmentId,
      appointmentGroupId: appointmentGroupId,
      planId: combine ? null : firstItem.planId || null,
      planName: combine ? 'Combined treatment plans' : planName,
      createdByUserId: userId || null,
    })

    const itemRows = groupItems.map((i, idx) => ({
      organisationId: Number(orgId),
      patientId: Number(patientId),
      invoiceId: invoice.id,
      treatmentPlanItemId: i.id,
      description: i.invoiceDesc || i.treatmentName || i.conditionLabel || 'Treatment',
      quantity: 1,
      unitPrice: toNum(i.cost),
      total: toNum(i.cost),
      fdi: i.fdi || null,
      surface: i.surface || null,
      treatmentCode: i.treatmentCode || null,
      practitionerId: i.practitionerId || null,
      practitionerName: i.practitionerName || i.clinicianName || '',
      sortOrder: idx,
    }))
    await PatientInvoiceItem.bulkCreate(itemRows)

    const full = await PatientInvoice.findByPk(invoice.id, {
      include: [{ model: PatientInvoiceItem, as: 'items' }],
    })
    created.push(serializeInvoice(full))
  }

  return success(created)
}

// ── Payments ───────────────────────────────────────────────────────────────

export const listPayments = async (event) => {
  const { orgId } = event.context.user
  const { patientId } = getQuery(event)
  if (!patientId) return error(400, 'patientId required')
  await assertPatient(orgId, patientId)

  const rows = await PatientPayment.findAll({
    where: { organisationId: Number(orgId), patientId: Number(patientId) },
    include: [
      {
        model: PatientPaymentAllocation,
        as: 'allocations',
        include: [{ model: PatientInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber'] }],
      },
    ],
    order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
  })

  return success(rows.map(serializePayment))
}

export const createPayment = async (event) => {
  const { orgId, userId } = event.context.user
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body

  const {
    patientId, paymentDate, method, amount, reference, notes,
    takenByName, practitionerId, practitionerName,
    // Optional: allocate immediately to one invoice
    allocateToInvoiceId, allocateAmount,
  } = payload

  if (!patientId) return error(400, 'patientId required')
  if (!amount || toNum(amount) <= 0) return error(400, 'Amount must be greater than 0')
  await assertPatient(orgId, patientId)

  const paymentNumber = await nextSequence(PatientPayment, orgId, 'paymentNumber', 'PAY-')
  const amountNum = toNum(amount)

  const payment = await PatientPayment.create({
    organisationId: Number(orgId),
    patientId: Number(patientId),
    paymentNumber,
    paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
    method: method || 'cash',
    amount: amountNum,
    unallocated: amountNum,
    reference: reference || '',
    notes: notes || '',
    takenByUserId: userId || null,
    takenByName: takenByName || '',
    practitionerId: practitionerId || null,
    practitionerName: practitionerName || '',
  })

  if (allocateToInvoiceId) {
    const alloc = Math.min(amountNum, toNum(allocateAmount) || amountNum)
    await _allocate(orgId, patientId, payment.id, Number(allocateToInvoiceId), alloc)
    await reconcilePayment(payment.id)
  }

  const full = await PatientPayment.findByPk(payment.id, {
    include: [
      {
        model: PatientPaymentAllocation,
        as: 'allocations',
        include: [{ model: PatientInvoice, as: 'invoice', attributes: ['id', 'invoiceNumber'] }],
      },
    ],
  })
  return success(serializePayment(full))
}

export const allocatePayment = async (event) => {
  const { orgId } = event.context.user
  const body = await readBody(event)
  const payload = typeof body === 'string' ? parseJsonBody(body) : body
  const { paymentId, invoiceId, amount } = payload

  if (!paymentId || !invoiceId || !amount) return error(400, 'paymentId, invoiceId, amount required')

  const payment = await PatientPayment.findOne({
    where: { id: Number(paymentId), organisationId: Number(orgId) },
  })
  if (!payment) return error(404, 'Payment not found')

  const invoice = await PatientInvoice.findOne({
    where: { id: Number(invoiceId), organisationId: Number(orgId) },
  })
  if (!invoice) return error(404, 'Invoice not found')

  const alloc = Math.min(toNum(payment.unallocated), toNum(amount))
  if (alloc <= 0) return error(400, 'No unallocated balance available')

  await _allocate(orgId, payment.patientId, payment.id, invoice.id, alloc)
  await Promise.all([reconcilePayment(payment.id), reconcileInvoice(invoice.id)])

  return success({ paymentId: payment.id, invoiceId: invoice.id, allocated: alloc })
}

const _allocate = async (orgId, patientId, paymentId, invoiceId, amount) => {
  await PatientPaymentAllocation.create({
    organisationId: Number(orgId),
    patientId: Number(patientId),
    paymentId,
    invoiceId,
    amount,
  })
  await reconcileInvoice(invoiceId)
}

export const deletePayment = async (event) => {
  const { orgId } = event.context.user
  const body = await readBody(event)
  const { id } = typeof body === 'string' ? parseJsonBody(body) : body
  if (!id) return error(400, 'id required')

  const payment = await PatientPayment.findOne({
    where: { id: Number(id), organisationId: Number(orgId) },
  })
  if (!payment) return error(404, 'Payment not found')

  const allocs = await PatientPaymentAllocation.findAll({ where: { paymentId: Number(id) } })
  const affectedInvoiceIds = [...new Set(allocs.map((a) => a.invoiceId))]
  await payment.destroy()
  await Promise.all(affectedInvoiceIds.map((iid) => reconcileInvoice(iid)))

  return success({ id: Number(id) })
}
