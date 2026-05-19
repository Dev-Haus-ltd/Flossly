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

      <!-- <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        label="Unallocated Credit"
        :value="store.fmtUnallocated"
        uid="accounts-unallocated"
        hide-chip
      /> -->

      <div
        class="finance-card"
        @click="
          () => {
            showFinanceDialog = true;
          }
        "
        :class="{ 'finance-card--summary': isSecondarySection }"
      >
        <template v-if="isSecondarySection">
          <div class="finance-card__header">
            <img
              :src="financeIcon"
              alt=""
              class="finance-card__icon finance-card__icon--small"
            />
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

          <!-- <button
            type="button"
            class="primary-action-btn"
            @click="showStatementDialog = true"
          >
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button> -->
        </div>
      </div>

      <div v-else-if="activeSection === 'payments'" class="accounts-toolbar">
        <div class="accounts-toolbar__left">
          <h2>Payments</h2>
        </div>
        <div class="accounts-toolbar__right">
          <button
            type="button"
            class="outline-action-btn"
            @click="showPaymentDialog = true"
          >
            <v-icon start size="16">mdi-plus-circle-outline</v-icon>
            <span>New Payment</span>
          </button>
          <!-- <button
            type="button"
            class="primary-action-btn"
            @click="showStatementDialog = true"
          >
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button> -->
        </div>
      </div>

      <div v-else-if="activeSection === 'gocardless'" class="accounts-toolbar">
        <div class="accounts-toolbar__left">
          <h2>GoCardless</h2>
        </div>
      </div>

      <div
        v-else-if="
          activeSection === 'finance' || activeSection === 'practice-plan'
        "
        class="finance-panel-header"
      >
        <h2>{{ activeSection === "finance" ? "Finance" : "Practice Plan" }}</h2>
        <div
          v-if="activeSection === 'practice-plan'"
          class="accounts-toolbar__right"
        >
          <button type="button" class="primary-action-btn">
            <img :src="refundIcon" alt="" />
            <span>Refund</span>
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

        <!-- Invoices tab -->
        <PatientAccountsInvoice
          v-else-if="activeSection === 'invoices'"
          :invoices="store.invoices"
          :loading="store.isLoading"
          :invoice-totals="store.invoiceTotals"
          @view-invoice="openInvoiceDetails"
          @take-payment="openInvoicePayment"
          @update-status="updateStatus"
          @delete-invoice="confirmDeleteInvoice"
        />

        <!-- Payments tab -->
        <PatientAccountsPayment
          :invoices="store.invoices"
          v-else-if="activeSection === 'payments'"
          :payments="store.payments"
          @delete-payment="confirmDeletePayment"
          @unallocate-payment="confirmUnallocatePayment"
        />

        <!-- Finance tab -->
        <PatientAccountsFinance v-else-if="activeSection === 'finance'" />

        <!-- Practice Plan tab -->
        <PatientAccountsPracticePlan
          v-else-if="activeSection === 'practice-plan'"
        />

        <!-- GoCardless management tab -->
        <PatientAccountsGoCardlessManagement
          v-else-if="activeSection === 'gocardless'"
          :patient-id="patientId"
          @view-invoice="openInvoiceDetails"
        />
      </div>
    </section>

    <!-- Record payment dialog -->
    <PatientAccountsRecordPaymentDialog
      v-model="showPaymentDialog"
      :invoice="invoiceToPay"
      :patient-name="patientName"
      @proceed-gocardless="openGoCardlessPayment"
    />

    <!-- GoCardless payment dialog -->
    <PatientAccountsGoCardlessPaymentDialog
      v-model="showGoCardlessPaymentDialog"
      :invoice="invoiceToPay"
      :patient-name="patientName"
      :patient-email="props.patient?.email"
      :patient-phone="patientPhone"
    />

    <PatientAccountsInvoiceDetailDialog
      v-model="showInvoiceDialog"
      :invoice="selectedInvoice"
      :patient="patient"
      @take-payment="openInvoicePayment"
    />
    <PatientAccountsFinanceCalculatorDialog v-model="showFinanceDialog" />
    <PatientAccountsStatementDialog v-model="showStatementDialog" />
    <!-- Delete confirmation dialog -->
    <CommonConfirmDialog
      v-model="paymentDeleteDialog.open"
      :title="paymentDeleteDialog.title"
      :message="paymentDeleteDialog.message"
      :loading="paymentDeleteDialog.loading"
      confirm-text="Delete"
      @confirm="handleConfirmDeletePayment"
      @cancel="() => (paymentDeleteDialog.open = false)"
    />

    <!-- Invoice delete confirmation dialog -->
    <CommonConfirmDialog
      v-model="invoiceDeleteDialog.open"
      :title="invoiceDeleteDialog.title"
      :message="invoiceDeleteDialog.message"
      :loading="invoiceDeleteDialog.loading"
      confirm-text="Delete"
      @confirm="handleConfirmDeleteInvoice"
      @cancel="() => (invoiceDeleteDialog.open = false)"
    />

    <!-- Unallocate payment confirmation dialog -->
    <CommonConfirmDialog
      v-model="unallocateDialog.open"
      :title="unallocateDialog.title"
      :message="unallocateDialog.message"
      :loading="unallocateDialog.loading"
      confirm-text="Unallocate"
      @confirm="handleConfirmUnallocate"
      @cancel="() => (unallocateDialog.open = false)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useAccountsStore } from "@/stores/accounts";
import { useMainStore } from "@/stores/index";
import CommonStatCard from "@/components/Common/statCard.vue";
import PatientAccountsInvoice from "@/components/patients/accounts/invoice.vue";
import PatientAccountsFinance from "@/components/patients/accounts/finance.vue";
import PatientAccountsPayment from "@/components/patients/accounts/payment.vue";
import PatientAccountsPracticePlan from "@/components/patients/accounts/practicePlan.vue";
import PatientAccountsGoCardlessManagement from "@/components/patients/accounts/GoCardlessManagement.vue";
import PatientAccountsRecordPaymentDialog from "@/components/patients/accounts/RecordPaymentDialog.vue";
import PatientAccountsGoCardlessPaymentDialog from "@/components/patients/accounts/GoCardlessPaymentDialog.vue";
import PatientAccountsStatementDialog from "@/components/patients/accounts/AccountStatementDialog.vue";
import PatientAccountsInvoiceDetailDialog from "@/components/patients/accounts/InvoiceDetailDialog.vue";
import PatientAccountsFinanceCalculatorDialog from "@/components/patients/accounts/FinanceCalculatorDialog.vue";
import financeIcon from "@/assets/diary/finance_icon.svg";
import poundIcon from "@/assets/diary/pound_icon.svg";
import downloadIcon from "@/assets/diary/statements_icon.svg";
import refundIcon from "@/assets/diary/refund_icon.svg";

const props = defineProps({
  patient: { type: Object, default: null },
  patientName: { type: String, default: "" },
});
console.log("PatientAccounts props:", props.patient);
const store = useAccountsStore();
const mainStore = useMainStore();

const patientId = computed(() =>
  props.patient?.id ? Number(props.patient.id) : null,
);
const patientPhone = computed(() =>
  String(
    props.patient?.preferredPhone ||
      props.patient?.mobile ||
      props.patient?.telephone ||
      props.patient?.phone ||
      "",
  ).trim(),
);

const activeSection = ref("invoices");
const showPaymentDialog = ref(false);
const showGoCardlessPaymentDialog = ref(false);
const showStatementDialog = ref(false);
const showInvoiceDialog = ref(false);
const selectedInvoice = ref(null);
const invoiceToPay = ref(null);
const showFinanceDialog = ref(false);
const paymentDeleteDialog = ref({
  open: false,
  id: null,
  title: "Delete Payment",
  message: "",
  loading: false,
});
const unallocateDialog = ref({
  open: false,
  payment: null,
  title: "Unallocate Payment",
  message:
    "Unallocating this payment will remove its association with the invoice. The payment will remain available for future allocations.",
  loading: false,
});
const invoiceDeleteDialog = ref({
  open: false,
  id: null,
  title: "Delete Invoice",
  message:
    "Are you sure you want to delete this invoice? This action cannot be undone.",
  loading: false,
});

const sections = [
  { label: "Invoices", value: "invoices" },
  { label: "Payments", value: "payments" },
  { label: "GoCardless", value: "gocardless" },
  { label: "Finance", value: "finance" },
  { label: "Practice Plan", value: "practice-plan" },
];

const isSecondarySection = computed(() =>
  ["payments", "gocardless", "finance", "practice-plan"].includes(
    activeSection.value,
  ),
);

const confirmUnallocatePayment = (payment) => {
  unallocateDialog.value.open = true;
  unallocateDialog.value.payment = payment;
};
const handleConfirmUnallocate = async () => {
  unallocateDialog.value.loading = true;

  setTimeout(() => {
    unallocateDialog.value.loading = false;
    unallocateDialog.value.open = false;

    mainStore.setSnackbar({
      message: "Payment unallocated (UI only)",
      color: "success",
    });
  }, 500);
};
const confirmDeletePayment = (id) => {
  paymentDeleteDialog.value = {
    open: true,
    id,
    title: "Delete Payment",
    message:
      "Are you sure you want to delete this payment? This action cannot be undone.",
    loading: false,
  };
};

const handleConfirmDeletePayment = async () => {
  paymentDeleteDialog.value.loading = true;

  try {
    const res = await store.deletePayment(paymentDeleteDialog.value.id);

    if (res?.code === 0) {
      mainStore.setSnackbar({
        message: "Payment deleted successfully",
        color: "success",
      });
      paymentDeleteDialog.value.open = false;
    } else {
      mainStore.setSnackbar({
        message: res?.message || "Failed to delete payment",
        color: "error",
      });
    }
  } catch (e) {
    mainStore.setSnackbar({
      message: "Server error while deleting payment",
      color: "error",
    });
  } finally {
    paymentDeleteDialog.value.loading = false;
  }
};

const openInvoiceDetails = (invoiceOrId) => {
  if (!invoiceOrId) return;

  const invoice =
    typeof invoiceOrId === "object"
      ? invoiceOrId
      : store.invoices.find((inv) => Number(inv.id) === Number(invoiceOrId));

  if (!invoice) return;

  selectedInvoice.value = invoice;
  showInvoiceDialog.value = true;
};

const openInvoicePayment = (invoice) => {
  invoiceToPay.value = invoice;
  showPaymentDialog.value = true;
};

const openGoCardlessPayment = (invoice) => {
  invoiceToPay.value = invoice;
  showGoCardlessPaymentDialog.value = true;
};

const confirmDeleteInvoice = async (id) => {
  invoiceDeleteDialog.value.id = id;
  invoiceDeleteDialog.value.open = true;
};

const handleConfirmDeleteInvoice = async () => {
  invoiceDeleteDialog.value.loading = true;

  try {
    const res = await store.deleteInvoice(invoiceDeleteDialog.value.id);

    if (res?.code === 0) {
      mainStore.setSnackbar({
        message: "Invoice deleted successfully",
        color: "success",
      });
      invoiceDeleteDialog.value.open = false;
    } else {
      mainStore.setSnackbar({
        message: res?.message || "Failed to delete invoice",
        color: "error",
      });
    }
  } catch (e) {
    mainStore.setSnackbar({
      message: "Server error while deleting invoice",
      color: "error",
    });
  } finally {
    invoiceDeleteDialog.value.loading = false;
  }
};

// Load data when patientId is available
onMounted(() => {
  if (patientId.value) store.loadAll(patientId.value);
});

watch(patientId, (id) => {
  if (id) store.loadAll(id);
});

// Cleanup when component unmounts to avoid stale state in next patient
onUnmounted(() => store.reset());

// ── Actions ─────────────────────────────────────────────────────────────

const generateFromTreatments = async () => {
  const res = await store.generateFromTreatments();
  if (res?.code === 0) {
    const count = Array.isArray(res.data) ? res.data.length : 1;
    mainStore.setSnackbar({
      message: `${count} invoice${count !== 1 ? "s" : ""} generated successfully`,
      color: "success",
    });
  } else {
    mainStore.setSnackbar({
      message: res?.message || "No uninvoiced treatments found",
      color: "warning",
    });
  }
};

const updateStatus = async (invoice, status) => {
  const res = await store.updateInvoice(invoice.id, { status });
  if (res?.code === 0) {
    mainStore.setSnackbar({
      message: `Invoice marked as ${status.replace("_", " ")}`,
      color: "success",
    });
  } else {
    mainStore.setSnackbar({
      message: "Failed to update invoice",
      color: "error",
    });
  }
};
</script>

<style scoped lang="scss">
.accounts-page {
  margin-top: 18px;
}

.accounts-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.outline-action-btn,
.primary-action-btn {
  height: 34px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 2px;
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
}
</style>
