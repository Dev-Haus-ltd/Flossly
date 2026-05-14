import { Op } from 'sequelize'
import { PatientPayment, PatientPaymentAllocation, PatientInvoice, GCPayment, GCMandate } from '../models'

const nextSequence = async (model, orgId, field, prefix) => {
  const last = await model.findOne({
    where: { organisationId: Number(orgId), [field]: { [Op.like]: `${prefix}%` } },
    order: [[field, 'DESC']],
    attributes: [field],
  })
  if (!last || !last[field]) {
    return `${prefix}00001`
  }

  const num = parseInt(String(last[field]).replace(prefix, ''), 10) || 0
  return `${prefix}${String(num + 1).padStart(5, '0')}`
}

/**
 * GoCardless Accounting Sync Service
 * Handles automatic synchronization between GoCardless payments and accounting system
 */
export class GoCardlessAccountingSync {

  /**
   * Get practitioner info from invoice if available
   * @param {number} invoiceId - Invoice ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} - Practitioner info
   */
  static async getPractitionerFromInvoice(invoiceId, transaction = null) {
    if (!invoiceId) return { practitionerId: null, practitionerName: null };
    
    try {
      const invoice = await PatientInvoice.findByPk(invoiceId, {
        attributes: ['practitionerId', 'practitionerName'],
        transaction
      });
      
      if (invoice) {
        return {
          practitionerId: invoice.practitionerId,
          practitionerName: invoice.practitionerName
        };
      }
    } catch (error) {
      console.error('[GoCardlessAccountingSync] Error fetching practitioner from invoice:', error);
    }
    
    return { practitionerId: null, practitionerName: null };
  }

  /**
   * Sync a confirmed/paid_out GoCardless payment to accounting system
   * @param {Object} gcPayment - GCPayment instance
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} - Sync result
   */
  static async syncPaymentToAccounting(gcPayment, transaction = null) {
    const shouldUseTransaction = !transaction
    const t = transaction || await PatientPayment.sequelize.transaction()

    try {
      // Check if already synced
      if (gcPayment.accountingSynced) {
        if (shouldUseTransaction) await t.commit()
        return { success: true, message: 'Already synced', patientPaymentId: gcPayment.patientPaymentId }
      }

      // Get mandate for customer details
      const mandate = await GCMandate.findOne({
        where: { mandateId: gcPayment.mandateId },
        transaction: t
      })

      if (!mandate) {
        throw new Error(`Mandate ${gcPayment.mandateId} not found`)
      }

      // Get practitioner info from invoice
      let practitionerId = null;
      let practitionerName = null;
      
      // Try to get from payment metadata first (if available)
      if (gcPayment.metadata) {
        practitionerId = gcPayment.metadata.practitioner_id || gcPayment.metadata.practitionerId || null;
        practitionerName = gcPayment.metadata.practitioner_name || gcPayment.metadata.practitionerName || null;
      }
      
      // If not found in metadata, try to get from invoice
      if (!practitionerId && gcPayment.invoiceId) {
        const practitionerInfo = await this.getPractitionerFromInvoice(gcPayment.invoiceId, t);
        practitionerId = practitionerInfo.practitionerId;
        practitionerName = practitionerInfo.practitionerName;
      }

      // Generate payment number
      const paymentNumber = await nextSequence(PatientPayment, gcPayment.organisationId, 'paymentNumber', 'PAY-')

      // Create PatientPayment with practitioner info if available
      const patientPaymentData = {
        organisationId: gcPayment.organisationId,
        patientId: gcPayment.patientId,
        paymentNumber,
        paymentDate: new Date().toISOString().slice(0, 10), // Today's date
        method: 'bank_transfer', // GoCardless payments are bank transfers
        amount: gcPayment.amount,
        unallocated: gcPayment.amount, // Initially fully unallocated
        reference: `GC-${gcPayment.paymentId}`,
        notes: `GoCardless payment - ${gcPayment.description || 'Payment'}`,
        takenByUserId: null, // System generated
        takenByName: 'GoCardless',
        practitionerId: practitionerId,
        practitionerName: practitionerName,
      };

      const patientPayment = await PatientPayment.create(patientPaymentData, { transaction: t })

      // Update GCPayment with patientPaymentId
      await gcPayment.update({
        patientPaymentId: patientPayment.id,
        accountingSynced: true
      }, { transaction: t })

      // If invoiceId is specified, allocate the payment
      if (gcPayment.invoiceId) {
        await this.allocatePaymentToInvoice(patientPayment.id, gcPayment.invoiceId, gcPayment.amount, t)
      }

      if (shouldUseTransaction) await t.commit()

      return {
        success: true,
        patientPaymentId: patientPayment.id,
        paymentNumber: patientPayment.paymentNumber,
        allocated: !!gcPayment.invoiceId,
        practitionerId: practitionerId,
        practitionerName: practitionerName
      }

    } catch (error) {
      if (shouldUseTransaction) await t.rollback()
      throw error
    }
  }

  /**
   * Allocate payment to invoice
   * @param {number} paymentId - PatientPayment ID
   * @param {number} invoiceId - PatientInvoice ID
   * @param {number} amount - Amount to allocate
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} - Allocation result
   */
  static async allocatePaymentToInvoice(paymentId, invoiceId, amount, transaction = null) {
    const shouldUseTransaction = !transaction
    const t = transaction || await PatientPaymentAllocation.sequelize.transaction()

    try {
      // Verify invoice exists and belongs to same org/patient
      const invoice = await PatientInvoice.findByPk(invoiceId, { transaction: t })
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`)
      }

      const payment = await PatientPayment.findByPk(paymentId, { transaction: t })
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`)
      }

      // Verify they belong to same org and patient
      if (invoice.organisationId !== payment.organisationId || invoice.patientId !== payment.patientId) {
        throw new Error('Invoice and payment must belong to same organisation and patient')
      }

      // Check available balance on invoice
      const outstanding = Number(invoice.balance || 0)
      if (outstanding <= 0) {
        throw new Error(`Invoice ${invoiceId} has no outstanding balance`)
      }

      // Check available unallocated on payment
      const unallocated = Number(payment.unallocated || 0)
      if (unallocated <= 0) {
        throw new Error(`Payment ${paymentId} has no unallocated amount`)
      }

      // Calculate allocation amount (min of available amounts)
      const allocateAmount = Math.min(amount, outstanding, unallocated)

      // Create allocation
      await PatientPaymentAllocation.create({
        organisationId: payment.organisationId,
        patientId: payment.patientId,
        paymentId,
        invoiceId,
        amount: allocateAmount,
      }, { transaction: t })

      // Update payment unallocated
      await payment.update({
        unallocated: Number(payment.unallocated) - allocateAmount
      }, { transaction: t })

      // Reconcile invoice (this will update balance and status)
      await this.reconcileInvoice(invoiceId, t)

      if (shouldUseTransaction) await t.commit()

      return {
        success: true,
        allocatedAmount: allocateAmount,
        invoiceBalance: Number(invoice.balance) - allocateAmount,
        paymentUnallocated: Number(payment.unallocated) - allocateAmount
      }

    } catch (error) {
      if (shouldUseTransaction) await t.rollback()
      throw error
    }
  }

  /**
   * Reconcile invoice amounts and status
   * @param {number} invoiceId - PatientInvoice ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} - Reconciliation result
   */
  static async reconcileInvoice(invoiceId, transaction = null) {
    const shouldUseTransaction = !transaction
    const t = transaction || await PatientInvoice.sequelize.transaction()

    try {
      // Calculate total allocated
      const totalAllocated = await PatientPaymentAllocation.sum('amount', {
        where: { invoiceId },
        transaction: t
      }) || 0

      const invoice = await PatientInvoice.findByPk(invoiceId, { transaction: t })
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`)
      }

      const amountPaid = Number(totalAllocated)
      const balance = Math.max(0, Number(invoice.total) - amountPaid)

      // Determine status
      let status = 'unpaid'
      if (amountPaid > 0 && amountPaid < Number(invoice.total)) {
        status = 'part_paid'
      } else if (amountPaid >= Number(invoice.total)) {
        status = 'paid'
      }

      // Update invoice
      await invoice.update({
        amountPaid,
        balance,
        status
      }, { transaction: t })

      if (shouldUseTransaction) await t.commit()

      return {
        success: true,
        amountPaid,
        balance,
        status,
        total: Number(invoice.total)
      }

    } catch (error) {
      if (shouldUseTransaction) await t.rollback()
      throw error
    }
  }

  /**
   * Handle payment status change from webhook
   * @param {Object} gcPayment - GCPayment instance
   * @param {string} newStatus - New payment status
   * @param {Object} webhookEvent - Webhook event data
   * @returns {Promise<Object>} - Status change result
   */
  static async handlePaymentStatusChange(gcPayment, newStatus, webhookEvent = null) {
    const transaction = await GCPayment.sequelize.transaction()

    try {
      // Update payment status and webhook tracking
      const webhookEvents = [...(gcPayment.webhookEvents || []), {
        status: newStatus,
        eventId: webhookEvent?.id,
        resource_type: webhookEvent?.resource_type,
        action: webhookEvent?.action,
        timestamp: new Date().toISOString(),
      }]

      const updatePayload = {
        status: newStatus,
        lastWebhookAt: new Date(),
        webhookEvents,
        processedAt: newStatus === 'paid_out' ? new Date() : gcPayment.processedAt,
      };

      if (['failed', 'cancelled', 'charged_back'].includes(newStatus) && webhookEvent?.details) {
        updatePayload.failureReason = webhookEvent.details?.description || webhookEvent.details?.reason || gcPayment.failureReason;
        updatePayload.failureCode = webhookEvent.details?.code || gcPayment.failureCode;
      }

      await gcPayment.update(updatePayload, { transaction })

      // Sync to accounting if payment is confirmed or paid_out
      let accountingResult = null
      if (['confirmed', 'paid_out'].includes(newStatus) && !gcPayment.accountingSynced) {
        accountingResult = await this.syncPaymentToAccounting(gcPayment, transaction)
      }

      await transaction.commit()

      return {
        success: true,
        newStatus,
        accountingSynced: accountingResult !== null,
        accountingResult
      }

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Handle mandate status change from webhook
   * @param {Object} gcMandate - GCMandate instance
   * @param {string} newStatus - New mandate status
   * @param {Object} webhookEvent - Webhook event data
   * @returns {Promise<Object>} - Status change result
   */
  static async handleMandateStatusChange(gcMandate, newStatus, webhookEvent = null) {
    const transaction = await GCMandate.sequelize.transaction()

    try {
      await gcMandate.update({
        status: newStatus,
        updatedAt: new Date(),
      }, { transaction })

      await transaction.commit()

      return {
        success: true,
        newStatus,
        mandateId: gcMandate.mandateId
      }

    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}