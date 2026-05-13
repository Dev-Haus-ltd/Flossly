<template>
  <v-dialog v-model="open" max-width="560" scrollable :persistent="isSaving">
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          Record Payment
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="cancel" class="mr-2">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Payment Method Selection -->
      <v-card-text class="pa-4" style="background: #f9fafb">
        <div class="payment-method-selector">
          <v-btn-toggle
            v-model="paymentMethodType"
            mandatory
            divided
            class="w-100"
            :disabled="isSaving"
          >
            <v-btn value="manual" class="flex-grow-1" variant="outlined">
              <v-icon start size="18">mdi-cash</v-icon>
              Manual Payment
            </v-btn>
            <v-btn value="gocardless" class="flex-grow-1" variant="outlined">
              <v-icon start size="18">mdi-credit-card-check</v-icon>
              GoCardless
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-card-text>

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <!-- Manual Payment Form -->
        <v-card elevation="0" rounded="lg" class="pa-4" color="white" v-if="paymentMethodType === 'manual'">
          <v-row dense>
            <v-col cols="12" v-if="props.invoice">
              <div class="invoice-linked-info">
                <div class="invoice-linked-info__row">
                  <span class="invoice-linked-info__label">Invoice</span>
                  <strong>{{ props.invoice.invoiceNumber }}</strong>
                </div>
                <div class="invoice-linked-info__row">
                  <span class="invoice-linked-info__label">Amount Due</span>
                  <strong>£{{ Number(props.invoice.balance ?? 0).toFixed(2) }}</strong>
                </div>
              </div>
            </v-col>

            <!-- Amount -->
            <v-col cols="6">
              <label class="fld-lbl">
                Amount (£) <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.amount"
                :error-messages="errors.amount ? [errors.amount] : []"
                hide-details="auto"
              />
            </v-col>

            <!-- Date -->
            <v-col cols="6">
              <label class="fld-lbl">
                Date <span class="req-star">*</span>
              </label>
              <v-menu v-model="dateMenu" :close-on-content-click="false">
                <template #activator="{ props: dp }">
                  <v-text-field
                    v-bind="dp"
                    :model-value="form.paymentDate"
                    variant="outlined"
                    density="compact"
                    class="mt-1"
                    readonly
                    hide-details
                  >
                    <template #append-inner>
                      <v-icon size="16" @click.stop="dateMenu = true">
                        mdi-calendar
                      </v-icon>
                    </template>
                  </v-text-field>
                </template>

                <v-date-picker
                  v-model="form.paymentDate"
                  @update:model-value="dateMenu = false"
                  color="primary"
                />
              </v-menu>
            </v-col>

            <!-- Payment Method -->
            <v-col cols="12">
              <label class="fld-lbl">
                Payment Method <span class="req-star">*</span>
              </label>
              <v-select
                v-model="form.method"
                :items="methods"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
              />
            </v-col>

            <!-- Reference -->
            <v-col cols="12">
              <label class="fld-lbl">Reference / Transaction No.</label>
              <v-text-field
                v-model="form.reference"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 123456"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details
              />
            </v-col>

            <!-- Practitioner -->
            <v-col cols="12">
              <label class="fld-lbl">Practitioner</label>
              <v-select
                v-model="form.practitionerId"
                :items="practitioners"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
                placeholder="Select practitioner"
              />
            </v-col>

            <!-- Allocate Invoice -->
            <v-col cols="12" v-if="outstandingInvoices.length">
              <label class="fld-lbl">Allocate to Invoice</label>
              <v-select
                v-model="form.allocateToInvoiceId"
                :items="outstandingInvoices"
                item-title="invoiceNumber"
                item-value="id"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
              >
                <template #prepend-item>
                  <v-list-item title="— None (unallocated) —" value="" />
                </template>

                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>
                      {{ item.raw.invoiceNumber }} —
                      {{ fmtBalance(item.raw) }} outstanding
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <label class="fld-lbl">Notes</label>
              <v-textarea
                v-model="form.notes"
                rows="2"
                variant="outlined"
                density="compact"
                class="mt-1"
                auto-grow
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>

        <!-- GoCardless Info -->
        <v-card elevation="0" rounded="lg" class="pa-4" color="white" v-else>
          <v-row dense>
            <v-col cols="12" v-if="props.invoice">
              <div class="invoice-linked-info">
                <div class="invoice-linked-info__row">
                  <span class="invoice-linked-info__label">Invoice</span>
                  <strong>{{ props.invoice.invoiceNumber }}</strong>
                </div>
                <div class="invoice-linked-info__row">
                  <span class="invoice-linked-info__label">Amount Due</span>
                  <strong class="amount-due">
                    £{{ Number(props.invoice.balance ?? 0).toFixed(2) }}
                  </strong>
                </div>
              </div>
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-alert type="info" variant="tonal" closable class="text-caption">
                A secure GoCardless payment link will be emailed to the patient. Click "Proceed" to continue.
              </v-alert>
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="cancel"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          :loading="isSaving"
          :disabled="isSaving"
          @click="submit"
        >
          {{ paymentMethodType === 'manual' ? 'Record Payment' : 'Proceed to Payment' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAccountsStore } from "@/stores/accounts";
import { useMainStore } from "@/stores/index";
import { useDiaryStore } from "@/stores/diary";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  invoice: { type: Object, default: null },
  patientName: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "proceed-gocardless"]);

const store = useAccountsStore();
const mainStore = useMainStore();
const diaryStore = useDiaryStore();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const paymentMethodType = ref("manual");
const today = new Date().toISOString().slice(0, 10);

const blankForm = () => ({
  amount: props.invoice?.balance ? Number(props.invoice.balance).toFixed(2) : "",
  paymentDate: today,
  method: "cash",
  reference: props.invoice ? `Invoice ${props.invoice.invoiceNumber}` : "",
  practitionerId: props.invoice?.practitionerId || "",
  notes: props.invoice ? `Payment for ${props.invoice.invoiceNumber}` : "",
  allocateToInvoiceId: props.invoice?.id || "",
});

const form = ref(blankForm());
const errors = ref({});
const isSaving = computed(() => store.isSaving);
const dateMenu = ref(false);
const methods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

const outstandingInvoices = computed(() => store.outstandingInvoices);
const dentists = ref([]);
const practitioners = computed(() => dentists.value);
const fmtBalance = (inv) => `£${Number(inv.balance ?? 0).toFixed(2)}`;

watch(open, (v) => {
  if (v) {
    form.value = blankForm();
    errors.value = {};
    paymentMethodType.value = "manual";
    loadDentists();
  }
});

watch(
  () => props.invoice,
  (invoice) => {
    if (open.value && invoice) {
      form.value = blankForm();
    }
  },
);

const validate = () => {
  errors.value = {};
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    errors.value.amount = "Enter a valid amount";
  }
  return !Object.keys(errors.value).length;
};

const cancel = () => {
  open.value = false;
};

const loadDentists = async () => {
  try {
    const res = await diaryStore.listDentists();
    if (res?.code === 0) {
      dentists.value = res.data || [];
    }
  } catch (error) {
    console.error("Failed to load Dentists", error);
  }
};

const submit = async () => {
  if (paymentMethodType.value === "gocardless") {
    // Emit event to open GoCardless dialog
    emit("proceed-gocardless", props.invoice);
    open.value = false;
  } else {
    // Manual payment flow
    if (!validate()) return;
    const selected = dentists.value.find(
      (d) => d.id === form.value.practitionerId,
    );
    const payload = {
      paymentDate: form.value.paymentDate,
      method: form.value.method,
      amount: Number(form.value.amount),
      reference: form.value.reference,
      practitionerId: form.value.practitionerId
        ? Number(form.value.practitionerId)
        : null,
      practitionerName: selected?.name || "",
      notes: form.value.notes,
      allocateToInvoiceId: form.value.allocateToInvoiceId || null,
    };

    const res = await store.recordPayment(payload);
    if (res?.code === 0) {
      mainStore.setSnackbar({
        message: "Payment recorded successfully",
        color: "success",
      });
      open.value = false;
    } else {
      mainStore.setSnackbar({
        message: res?.message || "Failed to record payment",
        color: "error",
      });
    }
  }
};
</script>

<style scoped lang="scss">
.title-text {
  font-weight: 600;
  color: #1d2433;
}

.payment-method-selector {
  display: flex;
  gap: 8px;
}

.invoice-linked-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
}

.amount-due {
  color: #0061fb;
  font-size: 16px;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  display: block;
}

.req-star {
  color: #ef4444;
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
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.invoice-linked-info {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.invoice-linked-info__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #374151;
}

.invoice-linked-info__label {
  color: #6b7280;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.req-star {
  color: #ef4444;
}

:deep(.v-field) {
  border-radius: 8px !important;
}
</style>