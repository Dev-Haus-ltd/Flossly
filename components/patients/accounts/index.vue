<template>
  <div class="accounts-page">
    <!-- Stats bar -->
    <div class="accounts-stats">
      <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        label="Patient Outstanding"
        :value="store.fmtOutstanding"
        uid="accounts-outstanding"
        hide-chip
      />

      <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        label="Total Paid"
        :value="store.fmtTotalPaid"
        uid="accounts-paid"
        hide-chip
      />

      <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        label="Unallocated Credit"
        :value="store.fmtUnallocated"
        uid="accounts-unallocated"
        hide-chip
      />

      <div class="finance-card" :class="{ 'finance-card--summary': isSecondarySection }">
        <template v-if="isSecondarySection">
          <div class="finance-card__header">
            <img :src="financeIcon" alt="" class="finance-card__icon finance-card__icon--small" />
            <span>Finance Calculator</span>
          </div>
          <strong class="finance-card__value">£0.00</strong>
        </template>
        <template v-else>
          <img :src="financeIcon" alt="" class="finance-card__icon" />
          <span>Finance Calculator</span>
        </template>
      </div>
    </div>

    <!-- Main panel -->
    <section class="accounts-panel">
      <!-- Toolbar -->
      <div v-if="activeSection === 'invoices'" class="accounts-toolbar">
        <div class="accounts-toolbar__left">
          <h2>Accounts</h2>
          <div class="toolbar-input">
            <input v-model="searchTerm" type="text" placeholder="Search invoices" />
            <img :src="searchIcon" alt="" />
          </div>
          <button type="button" class="toolbar-filter-btn">
            <span>Filters</span>
            <img :src="filterIcon" alt="" />
          </button>
        </div>
        <div class="accounts-toolbar__right">
          <button
            type="button"
            class="outline-action-btn"
            :disabled="store.isSaving"
            @click="generateFromTreatments"
          >
            <v-icon start size="16">mdi-auto-fix</v-icon>
            <span>Generate Invoice</span>
          </button>
          <button type="button" class="outline-action-btn" @click="showPaymentDialog = true">
            <v-icon start size="16">mdi-plus-circle-outline</v-icon>
            <span>Payment</span>
          </button>
          <button type="button" class="primary-action-btn">
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button>
        </div>
      </div>

      <div v-else-if="activeSection === 'payments'" class="accounts-toolbar">
        <div class="accounts-toolbar__left">
          <h2>Payments</h2>
        </div>
        <div class="accounts-toolbar__right">
          <button type="button" class="outline-action-btn" @click="showPaymentDialog = true">
            <v-icon start size="16">mdi-plus-circle-outline</v-icon>
            <span>Record Payment</span>
          </button>
          <button type="button" class="primary-action-btn">
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button>
        </div>
      </div>

      <div v-else class="finance-panel-header">
        <h2>{{ activeSection === 'finance' ? 'Finance' : 'Practice Plan' }}</h2>
        <div v-if="activeSection === 'practice-plan'" class="accounts-toolbar__right">
          <button type="button" class="primary-action-btn">
            <img :src="refundIcon" alt="" />
            <span>Refund</span>
          </button>
          <button type="button" class="outline-action-btn" @click="showPaymentDialog = true">
            <v-icon start size="16">mdi-plus-circle-outline</v-icon>
            <span>Make Payment</span>
          </button>
          <button type="button" class="primary-action-btn">
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="accounts-content">
        <aside class="accounts-sidebar">
          <button
            v-for="section in sections"
            :key="section.value"
            type="button"
            class="sidebar-tab"
            :class="{ 'sidebar-tab--active': activeSection === section.value }"
            @click="activeSection = section.value"
          >
            {{ section.label }}
          </button>
        </aside>

        <!-- Loading -->
        <div v-if="store.isLoading" class="loading-state">
          <v-progress-circular indeterminate size="28" color="primary" />
        </div>

        <!-- Payments tab -->
        <PatientAccountsPayment
          v-else-if="activeSection === 'payments'"
          :payments="store.payments"
          @delete-payment="confirmDeletePayment"
        />

        <!-- Finance tab -->
        <PatientAccountsFinance v-else-if="activeSection === 'finance'" />

        <!-- Practice Plan tab -->
        <PatientAccountsPracticePlan v-else-if="activeSection === 'practice-plan'" />

        <!-- Invoices tab -->
        <div v-else class="accounts-table-wrap">
          <table class="accounts-table">
            <thead>
              <tr>
                <th class="checkbox-cell">
                  <input type="checkbox" />
                </th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Date</th>
                <th>Summary</th>
                <th>Practitioner</th>
                <th>Balance</th>
                <th>Total</th>
                <th class="menu-cell"></th>
              </tr>
            </thead>

            <tbody>
              <template v-if="!filteredInvoices.length">
                <tr>
                  <td colspan="9" class="empty-cell">
                    {{ store.invoices.length ? 'No invoices match your search.' : 'No invoices yet. Use "Generate Invoice" to create one from completed treatments.' }}
                  </td>
                </tr>
              </template>

              <template v-for="invoice in filteredInvoices" :key="invoice.id">
                <tr>
                  <td class="checkbox-cell"><input type="checkbox" /></td>
                  <td>
                    <div class="invoice-link">
                      <button type="button" class="inv-number" @click="toggleInvoice(invoice.id)">
                        {{ invoice.invoiceNumber }}
                      </button>
                      <img :src="expandDetailIcon" alt="" />
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" :class="statusClass(invoice.status)">
                      {{ statusLabel(invoice.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(invoice.invoiceDate) }}</td>
                  <td>{{ invoiceSummary(invoice) }}</td>
                  <td>
                    <div v-if="invoice.practitionerName" class="practitioner-cell">
                      <div class="avatar">{{ initials(invoice.practitionerName) }}</div>
                      <span>{{ invoice.practitionerName }}</span>
                    </div>
                    <span v-else class="muted">—</span>
                  </td>
                  <td :class="{ 'balance-due': Number(invoice.balance) > 0 }">
                    {{ fmtGbp(invoice.balance) }}
                  </td>
                  <td>{{ fmtGbp(invoice.total) }}</td>
                  <td class="menu-cell">
                    <v-menu>
                      <template #activator="{ props: menuProps }">
                        <button type="button" class="menu-trigger" v-bind="menuProps">&#8942;</button>
                      </template>
                      <v-list density="compact" min-width="160">
                        <v-list-item
                          title="Mark as Written Off"
                          @click="updateStatus(invoice, 'written_off')"
                        />
                        <v-list-item
                          title="Delete Invoice"
                          class="text-error"
                          @click="confirmDeleteInvoice(invoice.id)"
                        />
                      </v-list>
                    </v-menu>
                  </td>
                </tr>

                <!-- Expanded line items -->
                <tr v-if="expandedInvoices.includes(invoice.id)">
                  <td colspan="9" class="expanded-row-cell">
                    <div class="expanded-card">
                      <table class="expanded-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Tooth</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Practitioner</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in invoice.items" :key="item.id">
                            <td>{{ item.description }}</td>
                            <td>{{ item.fdi ? `${item.fdi}${item.surface ? '/' + item.surface : ''}` : '—' }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ fmtGbp(item.unitPrice) }}</td>
                            <td>{{ fmtGbp(item.total) }}</td>
                            <td>{{ item.practitionerName || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>

            <tfoot v-if="filteredInvoices.length">
              <tr>
                <td colspan="6"></td>
                <td class="totals-label">Totals:</td>
                <td class="totals-value">{{ store.invoiceTotals.balance }}</td>
                <td class="totals-value">{{ store.invoiceTotals.total }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>

    <!-- Record payment dialog -->
    <PatientAccountsRecordPaymentDialog v-model="showPaymentDialog" />

    <!-- Delete confirmation snackbar handled via store -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useMainStore } from '@/stores/index'
import CommonStatCard from '@/components/Common/statCard.vue'
import PatientAccountsFinance from '@/components/patients/accounts/finance.vue'
import PatientAccountsPayment from '@/components/patients/accounts/payment.vue'
import PatientAccountsPracticePlan from '@/components/patients/accounts/practicePlan.vue'
import PatientAccountsRecordPaymentDialog from '@/components/patients/accounts/RecordPaymentDialog.vue'
import financeIcon from '@/assets/diary/finance_icon.svg'
import poundIcon from '@/assets/diary/pound_icon.svg'
import downloadIcon from '@/assets/diary/statements_icon.svg'
import refundIcon from '@/assets/diary/refund_icon.svg'
import filterIcon from '@/assets/icons/listView/filter-icon.svg'
import searchIcon from '@/assets/icons/listView/serach-icon.svg'
import expandDetailIcon from '@/assets/diary/expand_detail_icon.svg'

const props = defineProps({
  patient: { type: Object, default: null },
  patientName: { type: String, default: '' },
})

const store = useAccountsStore()
const mainStore = useMainStore()

const patientId = computed(() => props.patient?.id ? Number(props.patient.id) : null)

const activeSection = ref('invoices')
const searchTerm = ref('')
const showPaymentDialog = ref(false)
const expandedInvoices = ref([])

const sections = [
  { label: 'Payments', value: 'payments' },
  { label: 'Invoices', value: 'invoices' },
  { label: 'Finance', value: 'finance' },
  { label: 'Practice Plan', value: 'practice-plan' },
]

const isSecondarySection = computed(() =>
  ['payments', 'finance', 'practice-plan'].includes(activeSection.value)
)

// Load data when patientId is available
onMounted(() => {
  if (patientId.value) store.loadAll(patientId.value)
})

watch(patientId, (id) => {
  if (id) store.loadAll(id)
})

// Cleanup when component unmounts to avoid stale state in next patient
onUnmounted(() => store.reset())

// Filtered invoices for the table
const filteredInvoices = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return store.invoices
  return store.invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.practitionerName || '').toLowerCase().includes(q) ||
      invoiceSummary(inv).toLowerCase().includes(q)
  )
})

const toggleInvoice = (id) => {
  if (expandedInvoices.value.includes(id)) {
    expandedInvoices.value = expandedInvoices.value.filter((x) => x !== id)
  } else {
    expandedInvoices.value = [...expandedInvoices.value, id]
  }
}

// ── Formatters ──────────────────────────────────────────────────────────

const fmtGbp = (v) => `£${Number(v ?? 0).toFixed(2)}`

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const invoiceSummary = (invoice) => {
  if (!invoice.items?.length) return invoice.planName || '—'
  return invoice.items.map((i) => i.description).join(', ').slice(0, 60)
}

const STATUS_LABELS = {
  unpaid: 'Unpaid',
  part_paid: 'Part Paid',
  paid: 'Paid',
  written_off: 'Written Off',
  credited: 'Credited',
  draft: 'Draft',
}
const statusLabel = (s) => STATUS_LABELS[s] || s

const statusClass = (s) => ({
  'status-badge--paid': s === 'paid',
  'status-badge--unpaid': s === 'unpaid',
  'status-badge--part': s === 'part_paid',
  'status-badge--written': s === 'written_off',
  'status-badge--draft': s === 'draft',
})

// ── Actions ─────────────────────────────────────────────────────────────

const generateFromTreatments = async () => {
  const res = await store.generateFromTreatments()
  if (res?.code === 0) {
    const count = Array.isArray(res.data) ? res.data.length : 1
    mainStore.setSnackbar({
      message: `${count} invoice${count !== 1 ? 's' : ''} generated successfully`,
      color: 'success',
    })
  } else {
    mainStore.setSnackbar({ message: res?.message || 'No uninvoiced treatments found', color: 'warning' })
  }
}

const updateStatus = async (invoice, status) => {
  const res = await store.updateInvoice(invoice.id, { status })
  if (res?.code !== 0) {
    mainStore.setSnackbar({ message: 'Failed to update invoice', color: 'error' })
  }
}

const confirmDeleteInvoice = async (id) => {
  const res = await store.deleteInvoice(id)
  if (res?.code === 0) {
    mainStore.setSnackbar({ message: 'Invoice deleted', color: 'success' })
    expandedInvoices.value = expandedInvoices.value.filter((x) => x !== id)
  } else {
    mainStore.setSnackbar({ message: 'Failed to delete invoice', color: 'error' })
  }
}

const confirmDeletePayment = async (id) => {
  const res = await store.deletePayment(id)
  if (res?.code === 0) {
    mainStore.setSnackbar({ message: 'Payment deleted', color: 'success' })
  } else {
    mainStore.setSnackbar({ message: 'Failed to delete payment', color: 'error' })
  }
}
</script>

<style scoped lang="scss">
.accounts-page {
  margin-top: 18px;
}

.accounts-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.finance-card {
  min-height: 120px;
  border: 0;
  border-radius: 20px;
  background: #b9308a;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
}

.finance-card--summary {
  background: #fff;
  border: 1px solid #f1d9ea;
  color: #3b4252;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 16px;
  gap: 12px;
}

.finance-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.finance-card__icon {
  width: 30px;
  height: 30px;
}

.finance-card__icon--small {
  width: 18px;
  height: 18px;
}

.finance-card__value {
  font-size: 34px;
  line-height: 1;
  color: #1d2433;
}

.accounts-panel {
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  overflow: hidden;
}

.finance-panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid #edf1f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #242424;
  }
}

.accounts-toolbar {
  padding: 12px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f5;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #242424;
    margin-right: 8px;
  }
}

.accounts-toolbar__left,
.accounts-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-input {
  width: 160px;
  height: 34px;
  border-radius: 8px;
  background: #f5f6f8;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;

  input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 13px;
    color: #4b5563;
  }

  img {
    width: 14px;
    height: 14px;
  }
}

.toolbar-filter-btn,
.outline-action-btn,
.primary-action-btn {
  height: 34px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  img {
    width: 14px;
    height: 14px;
  }
}

.toolbar-filter-btn {
  border: 0;
  background: #f5f6f8;
  color: #6b7280;
}

.outline-action-btn {
  border: 1px solid #0061fb;
  background: #fff;
  color: #1f2937;
}

.primary-action-btn {
  border: 0;
  background: #0061fb;
  color: #fff;
}

.accounts-content {
  display: grid;
  grid-template-columns: 164px minmax(0, 1fr);
  min-height: 475px;
}

.accounts-sidebar {
  padding: 14px 12px;
  border-right: 1px solid #edf1f5;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-tab {
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7b8494;
  font-size: 13px;
  text-align: left;
  padding: 0 12px;

  &.sidebar-tab--active {
    background: #edf4f8;
    color: #394150;
    font-weight: 500;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.accounts-table-wrap {
  overflow-x: auto;
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
}

.accounts-table th,
.accounts-table td {
  border-bottom: 1px solid #edf1f5;
  border-right: 1px solid #edf1f5;
  padding: 10px 12px;
  font-size: 12px;
  color: #4b5563;
  text-align: left;
  white-space: nowrap;
}

.accounts-table th {
  font-size: 11px;
  font-weight: 600;
  color: #757f8f;
  background: #fff;
}

.accounts-table th:last-child,
.accounts-table td:last-child {
  border-right: 0;
}

.checkbox-cell,
.menu-cell {
  width: 34px;
  text-align: center !important;
}

.invoice-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  img {
    width: 13px;
    height: 13px;
  }
}

.inv-number {
  border: 0;
  background: transparent;
  color: #0061fb;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 22px;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge--paid { background: #eaf8e6; color: #5daf4d; }
.status-badge--unpaid { background: #ffe8ea; color: #ff6b76; }
.status-badge--part { background: #fff4d6; color: #f59e0b; }
.status-badge--written { background: #f3f4f6; color: #9ca3af; }
.status-badge--draft { background: #f0f4ff; color: #0061fb; }

.practitioner-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f2c6aa, #b97a56);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.balance-due {
  color: #ff6b76 !important;
  font-weight: 600;
}

.muted {
  color: #b0b8c6;
}

.menu-trigger {
  border: 0;
  background: transparent;
  color: #8b96a7;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.empty-cell {
  text-align: center !important;
  padding: 40px 20px !important;
  color: #8b96a7;
  font-size: 13px;
  border-right: 0 !important;
}

.expanded-row-cell {
  padding: 10px 12px !important;
  background: #fff;
}

.expanded-card {
  background: #f7f9fc;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  padding: 10px 12px;
  overflow-x: auto;
}

.expanded-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border: 0;
    padding: 7px 10px 7px 0;
    background: transparent;
    white-space: nowrap;
    font-size: 11px;
    color: #4b5563;
  }

  th {
    color: #757f8f;
    font-weight: 600;
  }
}

tfoot td {
  border-bottom: 0;
  background: #fff;
}

.totals-label,
.totals-value {
  font-weight: 700;
  color: #303846 !important;
}

@media (max-width: 1200px) {
  .accounts-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .accounts-toolbar,
  .finance-panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .accounts-toolbar__left,
  .accounts-toolbar__right {
    width: 100%;
    flex-wrap: wrap;
  }

  .accounts-content {
    grid-template-columns: 1fr;
  }

  .accounts-sidebar {
    border-right: 0;
    border-bottom: 1px solid #edf1f5;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .accounts-stats {
    grid-template-columns: 1fr;
  }

  .toolbar-input {
    width: 100%;
  }
}
</style>
