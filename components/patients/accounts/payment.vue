<template>
  <div class="payments-view">
    <div v-if="!payments.length" class="empty-state">
      No payments recorded yet.
    </div>

    <div v-else class="payments-table-wrap">
      <table class="payments-table">
        <thead>
          <tr>
            <th class="expander-cell"></th>
            <th>Payment</th>
            <th>Date</th>
            <th>Practitioner</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Allocated to</th>
            <th>Unallocated</th>
            <th>Total</th>
            <th class="menu-cell"></th>
          </tr>
        </thead>

        <tbody>
          <template v-for="payment in payments" :key="payment.id">
            <tr>
              <td class="expander-cell">
                <button
                  v-if="payment.allocations?.length"
                  type="button"
                  class="row-toggle"
                  @click="toggleExpanded(payment.id)"
                >
                  <v-icon size="16">
                    {{ expanded.includes(payment.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                </button>
              </td>
              <td class="payment-number">{{ payment.paymentNumber }}</td>
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>
                <div v-if="payment.practitionerName" class="practitioner-cell">
                  <div class="avatar">{{ initials(payment.practitionerName) }}</div>
                  <span>{{ payment.practitionerName }}</span>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span class="method-badge">{{ methodLabel(payment.method) }}</span>
              </td>
              <td>{{ payment.reference || '—' }}</td>
              <td>
                <div v-if="payment.allocations?.length" class="allocation-list">
                  <span
                    v-for="alloc in payment.allocations"
                    :key="alloc.id"
                    class="alloc-chip"
                  >
                    {{ alloc.invoiceNumber }}
                  </span>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td :class="{ 'balance-due': Number(payment.unallocated) > 0 }">
                {{ fmtGbp(payment.unallocated) }}
              </td>
              <td class="amount-cell">{{ fmtGbp(payment.amount) }}</td>
              <td class="menu-cell">
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <button type="button" class="menu-trigger" v-bind="menuProps">&#8942;</button>
                  </template>
                  <v-list density="compact" min-width="140">
                    <v-list-item title="Delete" @click="$emit('delete-payment', payment.id)" />
                  </v-list>
                </v-menu>
              </td>
            </tr>

            <tr v-if="expanded.includes(payment.id)">
              <td colspan="10" class="expanded-row-cell">
                <div class="expanded-card">
                  <table class="expanded-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Allocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="alloc in payment.allocations" :key="alloc.id">
                        <td>{{ alloc.invoiceNumber }}</td>
                        <td>{{ fmtGbp(alloc.amount) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="7"></td>
            <td class="totals-label">Totals:</td>
            <td class="totals-value">{{ totalUnallocated }}</td>
            <td class="totals-value">{{ totalAmount }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  payments: { type: Array, default: () => [] },
})
defineEmits(['delete-payment'])

const expanded = ref([])

const toggleExpanded = (id) => {
  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter((x) => x !== id)
  } else {
    expanded.value = [...expanded.value, id]
  }
}

const METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  finance: 'Finance',
  other: 'Other',
}
const methodLabel = (m) => METHOD_LABELS[m] || m

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const fmtGbp = (v) => `£${Number(v ?? 0).toFixed(2)}`

const formatDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const totalAmount = computed(() =>
  fmtGbp(props.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0))
)
const totalUnallocated = computed(() =>
  fmtGbp(props.payments.reduce((s, p) => s + Number(p.unallocated ?? 0), 0))
)
</script>

<style scoped lang="scss">
.payments-view {
  width: 100%;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #8b96a7;
  font-size: 13px;
}

.payments-table-wrap {
  overflow-x: auto;
}

.payments-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.payments-table th,
.payments-table td {
  border-bottom: 1px solid #edf1f5;
  border-right: 1px solid #edf1f5;
  padding: 9px 10px;
  font-size: 12px;
  color: #4b5563;
  text-align: left;
  white-space: nowrap;
  vertical-align: middle;
}

.payments-table th {
  font-size: 11px;
  font-weight: 600;
  color: #757f8f;
  background: #fff;
}

.payments-table th:last-child,
.payments-table td:last-child {
  border-right: 0;
}

.expander-cell,
.menu-cell {
  width: 32px;
  text-align: center !important;
}

.row-toggle,
.menu-trigger {
  border: 0;
  background: transparent;
  color: #8b96a7;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0 auto;
}

.payment-number {
  font-weight: 600;
  color: #0061fb;
}

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

.method-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: #f0f4ff;
  color: #0061fb;
}

.allocation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.alloc-chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: #edf4f8;
  color: #394150;
}

.muted {
  color: #b0b8c6;
}

.amount-cell {
  font-weight: 600;
  color: #1d2433;
}

.balance-due {
  color: #ff6b76 !important;
  font-weight: 600;
}

.expanded-row-cell {
  padding: 10px 12px !important;
  background: #fff;
}

.expanded-card {
  background: #f7f9fc;
  border: 1px solid #e8edf3;
  border-radius: 10px;
  padding: 8px 12px;
}

.expanded-table {
  width: 100%;
  border-collapse: collapse;
}

.expanded-table th,
.expanded-table td {
  border: 0;
  padding: 6px 8px 6px 0;
  background: transparent;
  font-size: 11px;
  color: #4b5563;
  white-space: nowrap;
}

.expanded-table th {
  color: #757f8f;
  font-weight: 600;
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
</style>
