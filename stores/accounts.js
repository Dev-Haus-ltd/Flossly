import accountsService from '~/services/accountsService'

const fmt = (n) => `£${Number(n ?? 0).toFixed(2)}`

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    patientId: null,
    invoices: [],
    payments: [],
    stats: { outstanding: 0, totalPaid: 0, unallocated: 0 },
    isLoading: false,
    isSaving: false,
  }),

  getters: {
    outstandingInvoices: (state) =>
      state.invoices.filter((inv) => ['unpaid', 'part_paid'].includes(inv.status)),

    fmtOutstanding: (state) => fmt(state.stats.outstanding),
    fmtTotalPaid: (state) => fmt(state.stats.totalPaid),
    fmtUnallocated: (state) => fmt(state.stats.unallocated),

    invoiceTotals: (state) => {
      const balance = state.invoices.reduce((s, inv) => s + Number(inv.balance ?? 0), 0)
      const total = state.invoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0)
      return { balance: fmt(balance), total: fmt(total) }
    },

    paymentTotals: (state) => {
      const total = state.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
      const unallocated = state.payments.reduce((s, p) => s + Number(p.unallocated ?? 0), 0)
      return { total: fmt(total), unallocated: fmt(unallocated) }
    },
  },

  actions: {
    async loadAll(patientId) {
      if (!patientId) return
      this.patientId = Number(patientId)
      this.isLoading = true
      try {
        await Promise.all([this._fetchStats(), this._fetchInvoices(), this._fetchPayments()])
      } finally {
        this.isLoading = false
      }
    },

    async _fetchStats() {
      const res = await accountsService.getAccountStats(this.patientId)
      if (res?.code === 0) this.stats = res.data
    },

    async _fetchInvoices() {
      const res = await accountsService.listInvoices(this.patientId)
      if (res?.code === 0) this.invoices = res.data || []
    },

    async _fetchPayments() {
      const res = await accountsService.listPayments(this.patientId)
      if (res?.code === 0) this.payments = res.data || []
    },

    // Called after any mutation to keep all data fresh
    async _refresh() {
      await Promise.all([this._fetchStats(), this._fetchInvoices(), this._fetchPayments()])
    },

    async createInvoice(payload) {
      this.isSaving = true
      try {
        const res = await accountsService.createInvoice({ ...payload, patientId: this.patientId })
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async updateInvoice(id, patch) {
      this.isSaving = true
      try {
        const res = await accountsService.updateInvoice({ id, ...patch })
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async deleteInvoice(id) {
      this.isSaving = true
      try {
        const res = await accountsService.deleteInvoice(id)
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async generateFromTreatments() {
      this.isSaving = true
      try {
        const res = await accountsService.generateInvoiceFromTreatments(this.patientId)
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },
    async generateCombinedFromTreatments() {
      this.isSaving = true
      try {
        const res = await accountsService.generateCombinedInvoiceFromTreatments(this.patientId)
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async recordPayment(payload) {
      this.isSaving = true
      try {
        const res = await accountsService.createPayment({ ...payload, patientId: this.patientId })
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async allocatePayment(paymentId, invoiceId, amount) {
      this.isSaving = true
      try {
        const res = await accountsService.allocatePayment({ paymentId, invoiceId, amount })
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    async deletePayment(id) {
      this.isSaving = true
      try {
        const res = await accountsService.deletePayment(id)
        if (res?.code === 0) await this._refresh()
        return res
      } finally {
        this.isSaving = false
      }
    },

    /**
     * Record a GoCardless payment initiation
     * Stores billing request info for later tracking and matching
     */
    async recordGoCardlessPayment(payload) {
      // Store billing request info in session storage for tracking
      // This allows us to match the payment when it completes via webhook
      const billingRequestData = {
        billingRequestId: payload.billingRequestId,
        customerId: payload.customerId,
        invoiceId: payload.invoiceId,
        patientId: payload.patientId || this.patientId,
        amount: payload.amount,
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        initiatedAt: new Date().toISOString(),
      }
      
      // Store in session for cross-page tracking
      sessionStorage.setItem(
        `gc_billing_${payload.billingRequestId}`,
        JSON.stringify(billingRequestData)
      )
      
      return { success: true, billingRequestId: payload.billingRequestId }
    },

    reset() {
      this.patientId = null
      this.invoices = []
      this.payments = []
      this.stats = { outstanding: 0, totalPaid: 0, unallocated: 0 }
      this.isLoading = false
      this.isSaving = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountsStore, import.meta.hot))
}
