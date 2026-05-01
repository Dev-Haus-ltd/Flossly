<template>
  <v-dialog v-model="open" max-width="520" persistent>
    <v-card class="payment-dialog" rounded="xl">
      <div class="payment-dialog__header">
        <span>Record Payment</span>
        <button type="button" class="close-btn" @click="cancel">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="payment-dialog__body">
        <div class="field-row">
          <div class="field-group">
            <label>Amount (£) <span class="req">*</span></label>
            <input
              v-model="form.amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              class="field-input"
              :class="{ 'field-input--error': errors.amount }"
            />
            <span v-if="errors.amount" class="field-error">{{ errors.amount }}</span>
          </div>

          <div class="field-group">
            <label>Date <span class="req">*</span></label>
            <input
              v-model="form.paymentDate"
              type="date"
              class="field-input"
            />
          </div>
        </div>

        <div class="field-group">
          <label>Payment Method <span class="req">*</span></label>
          <select v-model="form.method" class="field-select">
            <option v-for="m in methods" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>

        <div class="field-group">
          <label>Reference / Transaction No.</label>
          <input
            v-model="form.reference"
            type="text"
            placeholder="e.g. card transaction ID, cheque number"
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label>Practitioner</label>
          <input
            v-model="form.practitionerName"
            type="text"
            placeholder="Who the payment is for"
            class="field-input"
          />
        </div>

        <div v-if="outstandingInvoices.length" class="field-group">
          <label>Allocate to Invoice</label>
          <select v-model="form.allocateToInvoiceId" class="field-select">
            <option value="">— None (unallocated) —</option>
            <option
              v-for="inv in outstandingInvoices"
              :key="inv.id"
              :value="inv.id"
            >
              {{ inv.invoiceNumber }} — {{ fmtBalance(inv) }} outstanding
            </option>
          </select>
        </div>

        <div class="field-group">
          <label>Notes</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Optional notes"
            class="field-textarea"
          />
        </div>
      </div>

      <div class="payment-dialog__footer">
        <button type="button" class="btn-cancel" @click="cancel">Cancel</button>
        <button
          type="button"
          class="btn-submit"
          :disabled="isSaving"
          @click="submit"
        >
          <v-progress-circular v-if="isSaving" size="14" width="2" indeterminate />
          <span v-else>Record Payment</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const store = useAccountsStore()
const mainStore = useMainStore()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const today = new Date().toISOString().slice(0, 10)

const blankForm = () => ({
  amount: '',
  paymentDate: today,
  method: 'cash',
  reference: '',
  practitionerName: '',
  notes: '',
  allocateToInvoiceId: '',
})

const form = ref(blankForm())
const errors = ref({})
const isSaving = computed(() => store.isSaving)

const methods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
]

const outstandingInvoices = computed(() => store.outstandingInvoices)

const fmtBalance = (inv) => `£${Number(inv.balance ?? 0).toFixed(2)}`

watch(open, (v) => {
  if (v) {
    form.value = blankForm()
    errors.value = {}
  }
})

const validate = () => {
  errors.value = {}
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    errors.value.amount = 'Enter a valid amount'
  }
  return !Object.keys(errors.value).length
}

const cancel = () => {
  open.value = false
}

const submit = async () => {
  if (!validate()) return

  const payload = {
    paymentDate: form.value.paymentDate,
    method: form.value.method,
    amount: Number(form.value.amount),
    reference: form.value.reference,
    practitionerName: form.value.practitionerName,
    notes: form.value.notes,
    allocateToInvoiceId: form.value.allocateToInvoiceId || null,
  }

  const res = await store.recordPayment(payload)
  if (res?.code === 0) {
    mainStore.setSnackbar({ message: 'Payment recorded successfully', color: 'success' })
    open.value = false
  } else {
    mainStore.setSnackbar({ message: res?.message || 'Failed to record payment', color: 'error' })
  }
}
</script>

<style scoped lang="scss">
.payment-dialog {
  border-radius: 20px !important;
  overflow: hidden;
}

.payment-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #edf1f5;
  font-size: 15px;
  font-weight: 700;
  color: #1d2433;
}

.close-btn {
  border: 0;
  background: transparent;
  color: #8b96a7;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.payment-dialog__body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-group label {
  font-size: 11px;
  font-weight: 700;
  color: #394150;
}

.req {
  color: #ff6b76;
}

.field-input,
.field-select,
.field-textarea {
  height: 38px;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
  color: #1d2433;
  background: #fff;
  outline: none;
  width: 100%;

  &:focus {
    border-color: #0061fb;
  }
}

.field-textarea {
  height: auto;
  padding: 8px 10px;
  resize: none;
}

.field-input--error {
  border-color: #ff6b76;
}

.field-error {
  font-size: 11px;
  color: #ff6b76;
}

.payment-dialog__footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #edf1f5;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel,
.btn-submit {
  height: 36px;
  border-radius: 8px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-cancel {
  border: 1px solid #dfe5ec;
  background: #fff;
  color: #4b5563;
}

.btn-submit {
  border: 0;
  background: #0061fb;
  color: #fff;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
