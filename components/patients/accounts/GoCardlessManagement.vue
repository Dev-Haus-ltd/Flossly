Here is the modernized GoCardless management component with Vuetify tabs and
consistent styling from your invoice table reference. ```vue
<template>
  <div class="gocardless-management">
    <!-- Tabs Header with Refresh -->
    <div class="tabs-header">
      <v-tabs v-model="activeTab" class="custom-tabs">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
        </v-tab>
      </v-tabs>
      <!-- <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-refresh"
        @click="loadData"
        :loading="isLoading"
        class="refresh-btn"
      >
        Refresh
      </v-btn> -->
    </div>

    <!-- Table Controls: Search & Filters -->
    <div class="table-controls">
      <div class="controls-left">
        <v-text-field
          v-model="search"
          placeholder="Search..."
          clearable
          @click:clear="clearSearch"
          variant="solo"
          :elevation="0"
          density="compact"
          bg-color="#F3F4F6"
          hide-details
          flat
          class="custom-search"
        >
          <template #append-inner>
            <img :src="searchIcon" alt="search icon" width="14" height="14" />
          </template>
        </v-text-field>

        <v-select
          v-if="statusOptions.length"
          v-model="statusFilter"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          placeholder="All statuses"
          density="compact"
          variant="solo"
          flat
          hide-details
          class="filter-select"
          clearable
        >
          <template #prepend-inner>
            <img
              :src="filterIcon"
              alt="filter"
              width="14"
              height="14"
              class="mr-2"
            />
          </template>
        </v-select>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <v-data-table-server
        v-model="selectedItems"
        :headers="activeHeaders"
        :items="filteredItems"
        item-value="id"
        :loading="isLoading"
        :items-length="filteredItems.length"
        :page="currentPage"
        :items-per-page="itemsPerPage"
        :items-per-page-options="[10, 25, 50, 100]"
        class="gocardless-table"
        hover
        density="compact"
        @update:page="currentPage = $event"
        @update:items-per-page="itemsPerPage = $event"
      >
        <!-- Custom Checkbox Column -->
        <!-- <template v-slot:[`item.data-table-select`]="{ internalItem, isSelected, toggleSelect }">
          <input
            type="checkbox"
            :checked="isSelected(internalItem)"
            @change="() => toggleSelect(internalItem)"
            class="cust-checkbox"
          />
        </template> -->

        <!-- Payment ID Column (Payments Tab) -->
        <template v-slot:[`item.paymentId`]="{ item }">
          <button class="" >
            {{ formatPaymentId(item.paymentId) }}
          </button>
        </template>

        <!-- Status Column -->
        <template v-slot:[`item.status`]="{ item }">
          <span :class="['status-badge', getStatusClass(item.status)]">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <!-- Amount Column -->
        <template v-slot:[`item.amount`]="{ item }">
          <span class="amount-text">{{ fmtGbp(item.amount) }}</span>
        </template>

        <!-- Customer Name Column -->
        <template v-slot:[`item.customerName`]="{ item }">
          {{ item.customerName || "—" }}
        </template>

        <!-- Dates Column -->
        <template v-slot:[`item.chargeDate`]="{ item }">
          {{ formatDate(item.chargeDate) }}
        </template>

        <template v-slot:[`item.createdAt`]="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <!-- Email Column -->
        <template v-slot:[`item.customerEmail`]="{ item }">
          {{ item.customerEmail || "—" }}
        </template>

        <!-- Synced Status Column -->
        <template v-slot:[`item.accountingSynced`]="{ item }">
          <span
            class="synced-indicator"
            :class="{ synced: item.accountingSynced }"
          >
            {{ item.accountingSynced ? "✓" : "—" }}
          </span>
        </template>

        <!-- Other Columns (generic fallback) -->
        <!-- <template v-slot:[`item.mandateId`]="{ item }">
          {{ item.mandateId || '—' }}
        </template> -->

        <template v-slot:[`item.invoiceId`]="{ item }">
          <template v-if="item.invoiceId">
            <button type="button" class="link-btn" @click="viewInvoice(item)">
              {{ item.invoiceNumber || `INV-${item.invoiceId}` }}
            </button>
          </template>
          <template v-else> — </template>
        </template>

        <template v-slot:[`item.scheme`]="{ item }">
          {{ item.scheme || "—" }}
        </template>

        <!-- <template v-slot:[`item.billingRequestId`]="{ item }">
          {{ item.billingRequestId || '—' }}
        </template> -->

        <template v-slot:[`item.customerId`]="{ item }">
          {{ item.customerId || "—" }}
        </template>

        <template v-slot:[`item.mandateCount`]="{ item }">
          <span class="badge-count">{{ item.mandateCount || 0 }}</span>
        </template>

        <template v-slot:[`item.lastStatus`]="{ item }">
          <span :class="['status-badge', getStatusClass(item.lastStatus)]">
            {{ getStatusLabel(item.lastStatus) || "—" }}
          </span>
        </template>

        <template v-slot:[`item.processed`]="{ item }">
          <span class="synced-indicator" :class="{ synced: item.processed }">
            {{ item.processed ? "Yes" : "No" }}
          </span>
        </template>

        <template v-slot:[`item.eventCount`]="{ item }">
          {{ item.eventCount || 0 }}
        </template>

        <template v-slot:[`item.processingError`]="{ item }">
          <span v-if="item.processingError" class="error-text">
            {{ truncateText(item.processingError, 30) }}
          </span>
          <span v-else>—</span>
        </template>

        <template v-slot:[`item.idempotencyKey`]="{ item }">
          {{ truncateText(item.idempotencyKey, 20) || "—" }}
        </template>

        <!-- Actions Column -->
        <template v-slot:[`item.actions`]="{ item }">
          <div class="action-buttons">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="default"
                >
                  <v-icon size="18">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" min-width="160">
                <!-- Payment Actions -->
                <v-list-item
                  v-if="activeTab === 'payments'"
                  title="View Details"
                  @click="viewPaymentDetails(item)"
                />
                <v-list-item
                  v-if="activeTab === 'payments'"
                  title="Refresh Status"
                  @click="refreshPaymentStatus(item)"
                />

                <!-- Mandate Actions -->
                <v-list-item
                  v-if="activeTab === 'mandates'"
                  title="View Customer"
                  @click="viewCustomerDetails(item)"
                />
                <v-list-item
                  v-if="activeTab === 'mandates'"
                  title="Refresh Status"
                  @click="refreshMandateStatus(item)"
                />
                <v-list-item
                  v-if="activeTab === 'mandates' && item.status !== 'cancelled'"
                  title="Cancel Mandate"
                  @click="cancelMandate(item)"
                />

                <!-- Customer Actions -->
                <v-list-item
                  v-if="activeTab === 'customers'"
                  title="View Mandates"
                  @click="viewCustomerMandates(item)"
                />
              </v-list>
            </v-menu>
          </div>
        </template>

        <!-- No Data State -->
        <template v-slot:no-data>
          <div class="empty-state">
            <!-- <v-icon size="48" color="disabled" class="mb-2">mdi-inbox-outline</v-icon> -->
            <p class="empty-state-text">
              {{
                baseItems.length > 0
                  ? `No ${activeTabLabel.toLowerCase()} match your search`
                  : `No ${activeTabLabel.toLowerCase()} found.`
              }}
            </p>
          </div>
        </template>
      </v-data-table-server>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useMainStore } from "@/stores/index";
import goCardlessService from "@/services/goCardlessService";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import filterIcon from "@/assets/icons/listView/filter-icon.svg";

const props = defineProps({
  patientId: { type: Number, required: true },
});

const emit = defineEmits([
  "view-payment",
  "view-customer",
  "view-webhook",
  "view-invoice",
]);

const mainStore = useMainStore();
const isLoading = ref(false);
const activeTab = ref("payments");
const search = ref("");
const statusFilter = ref(null);
const selectedItems = ref([]);
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Data arrays
const payments = ref([]);
const mandates = ref([]);
const customers = ref([]);

const tabs = [
  { label: "Payments", value: "payments" },
  { label: "Mandates", value: "mandates" },
  { label: "Customers", value: "customers" },
];

const activeTabLabel = computed(() => {
  const tab = tabs.find((item) => item.value === activeTab.value);
  return tab?.label || "Items";
});

const statusOptions = computed(() => {
  if (activeTab.value === "payments") {
    return [
      { label: "Created", value: "created" },
      { label: "Submitted", value: "submitted" },
      { label: "Confirmed", value: "confirmed" },
      { label: "Paid Out", value: "paid_out" },
      { label: "Failed", value: "failed" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Charged Back", value: "charged_back" },
    ];
  }

  if (activeTab.value === "mandates") {
    return [
      { label: "Pending", value: "pending_submission" },
      { label: "Submitted", value: "submitted" },
      { label: "Active", value: "active" },
      { label: "Failed", value: "failed" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Expired", value: "expired" },
    ];
  }

  return [];
});

const STATUS_LABELS = {
  created: "Created",
  submitted: "Submitted",
  confirmed: "Confirmed",
  paid_out: "Paid Out",
  failed: "Failed",
  cancelled: "Cancelled",
  charged_back: "Charged Back",
  pending_submission: "Pending",
  active: "Active",
  expired: "Expired",
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || "Unknown";

const getStatusClass = (status) => {
  const classes = {
    paid_out: "status-badge--paid",
    active: "status-badge--paid",
    created: "status-badge--draft",
    submitted: "status-badge--part",
    confirmed: "status-badge--part",
    pending_submission: "status-badge--part",
    failed: "status-badge--unpaid",
    cancelled: "status-badge--written",
    charged_back: "status-badge--unpaid",
    expired: "status-badge--written",
  };
  return classes[status] || "status-badge--draft";
};

// Table Headers Configuration
const activeHeaders = computed(() => {
  switch (activeTab.value) {
    case "payments":
      return [
        { title: "Payment", key: "paymentId", width: "15%", sortable: false },
        { title: "Status", key: "status", width: "12%", sortable: false },
        { title: "Amount", key: "amount", width: "10%", sortable: false },
        { title: "Invoice", key: "invoiceId", width: "10%", sortable: false },
        {
          title: "Synced",
          key: "accountingSynced",
          width: "10%",
          sortable: false,
        },
        { title: "Actions", key: "actions", width: "19%", sortable: false },
      ];

    case "mandates":
      return [
        {
          title: "Customer",
          key: "customerName",
          width: "16%",
          sortable: false,
        },
        { title: "Status", key: "status", width: "12%", sortable: false },
        { title: "Scheme", key: "scheme", width: "10%", sortable: false },
        { title: "Created", key: "createdAt", width: "12%", sortable: false },
        { title: "Email", key: "customerEmail", width: "16%", sortable: false },
        { title: "Actions", key: "actions", width: "18%", sortable: false },
      ];

    default:
      return [
        { title: "Name", key: "customerName", width: "18%", sortable: false },
        { title: "Email", key: "customerEmail", width: "18%", sortable: false },
        {
          title: "Mandates",
          key: "mandateCount",
          width: "12%",
          sortable: false,
        },
        {
          title: "Last Status",
          key: "lastStatus",
          width: "14%",
          sortable: false,
        },
        { title: "Actions", key: "actions", width: "6%", sortable: false },
      ];
  }
});

const baseItems = computed(() => {
  switch (activeTab.value) {
    case "payments":
      return payments.value;
    case "mandates":
      return mandates.value;
    default:
      return customers.value;
  }
});
const formatPaymentId = (id) => {
  if (!id) return "—";

  // agar already formatted ho to skip
  if (String(id).startsWith("PAY-")) return id;

  // simple clean format
  return `PAY-${String(id).slice(-6)}`;
};
const filteredItems = computed(() => {
  const query = String(search.value || "")
    .trim()
    .toLowerCase();
  return baseItems.value.filter((item) => {
    // Apply status filter
    if (statusFilter.value && item.status !== statusFilter.value) {
      return false;
    }

    // Apply search filter
    if (!query) {
      return true;
    }

    const fields = [];
    if (activeTab.value === "payments") {
      fields.push(
        item.paymentId,
        item.reference,
        item.description,
        item.mandateId,
        item.invoiceId,
      );
    }
    if (activeTab.value === "mandates") {
      fields.push(
        item.customerName,
        item.customerEmail,
        item.mandateId,
        item.billingRequestId,
      );
    }
    if (activeTab.value === "customers") {
      fields.push(item.customerName, item.customerEmail, item.customerId);
    }

    return fields.some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    );
  });
});

// Utility Functions
const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtGbp = (value) => `£${Number(value ?? 0).toFixed(2)}`;

const truncateText = (text, maxLength) => {
  if (!text) return "—";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Data Loading Functions
const loadPayments = async () => {
  const res = await goCardlessService.getPatientPayments(props.patientId);
  if (res?.success) {
    payments.value = res.payments || [];
  } else {
    payments.value = [];
  }
};

const loadMandates = async () => {
  const res = await goCardlessService.getPatientMandates(props.patientId);
  if (res?.success) {
    mandates.value = res.mandates || [];
  } else {
    mandates.value = [];
  }
};

const loadCustomers = async () => {
  const res = await goCardlessService.getPatientCustomers(props.patientId);
  if (res?.success) {
    customers.value = res.customers || [];
  } else {
    customers.value = [];
  }
};

const loadData = async () => {
  if (!props.patientId) return;

  isLoading.value = true;
  try {
    await Promise.all([loadPayments(), loadMandates(), loadCustomers()]);
  } catch (error) {
    console.error("GoCardless management load error:", error);
    mainStore.setSnackbar({
      title: "Unable to load GoCardless data",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

// Action Functions
const refreshPaymentStatus = async (item) => {
  if (!item?.paymentId) return;
  isLoading.value = true;
  try {
    const res = await goCardlessService.refreshPaymentStatus(item.paymentId);
    if (res?.success) {
      await loadPayments();
      mainStore.setSnackbar({
        title: "Payment status refreshed",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: "Unable to refresh payment status",
        type: "error",
      });
    }
  } catch (error) {
    console.error(error);
    mainStore.setSnackbar({
      title: "Server error refreshing payment status",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const refreshMandateStatus = async (item) => {
  if (!item?.mandateId) return;
  isLoading.value = true;
  try {
    const res = await goCardlessService.refreshMandateStatus(item.mandateId);
    if (res?.success) {
      await loadMandates();
      mainStore.setSnackbar({
        title: "Mandate status refreshed",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: "Unable to refresh mandate status",
        type: "error",
      });
    }
  } catch (error) {
    console.error(error);
    mainStore.setSnackbar({
      title: "Server error refreshing mandate status",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const cancelMandate = async (item) => {
  if (!item?.mandateId) return;
  isLoading.value = true;
  try {
    const res = await goCardlessService.cancelMandate(item.mandateId);
    if (res?.success) {
      await loadMandates();
      mainStore.setSnackbar({
        title: "Mandate cancel request sent",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: "Unable to cancel mandate",
        type: "error",
      });
    }
  } catch (error) {
    console.error(error);
    mainStore.setSnackbar({
      title: "Server error cancelling mandate",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const viewPaymentDetails = (item) => {
  emit("view-payment", item);
};

const viewInvoice = (item) => {
  if (!item?.invoiceId) return;
  emit("view-invoice", item.invoiceId);
};

const viewCustomerDetails = (item) => {
  emit("view-customer", item);
};

const viewCustomerMandates = (item) => {
  activeTab.value = "mandates";
  statusFilter.value = null;
  search.value = "";
};

// Lifecycle Hooks
onMounted(() => {
  loadData();
});

watch(
  () => props.patientId,
  (value) => {
    if (value) {
      loadData();
    } else {
      payments.value = [];
      mandates.value = [];
      customers.value = [];
    }
  },
);

watch(activeTab, () => {
  statusFilter.value = null;
  search.value = "";
  selectedItems.value = [];
  currentPage.value = 1;
});
</script>

<style scoped lang="scss">
.gocardless-management {
  width: 100%;
  padding: 0;
}

.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 16px 20px;
  flex-wrap: wrap;

  .custom-tabs {
    flex: 0 1 auto;
  }

  .refresh-btn {
    flex-shrink: 0;
    border-radius: 8px !important;
    text-transform: none !important;
    font-weight: 500 !important;
  }
}

.custom-tabs {
  // background: #f3f4f6;
  // border-radius: 999px;
  padding: 2px 4px;

  :deep(.v-tab) {
    // border-radius: 999px;
    text-transform: none;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: normal;
    min-width: auto;
    padding: 6px 20px;
    margin: 0 2px;

    &.v-tab--selected {
      // background: white;
      color: #0061fb;
      // box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}
.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.custom-search {
  width: 180px;

  :deep(.v-field) {
    border-radius: 8px;
    background: #f3f4f6 !important;
    box-shadow: none !important;
  }

  :deep(.v-field__input) {
    font-size: 14px;
  }
}

.filter-select {
  width: 180px;

  :deep(.v-field) {
    border-radius: 8px;
    background: #f3f4f6 !important;
    box-shadow: none !important;
  }

  :deep(.v-field__input) {
    font-size: 14px;
  }
}
.tabs-header {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;

  .custom-tabs {
    flex: 0 1 auto;
  }
}

.custom-tabs {
  :deep(.v-slide-group__content) {
    gap: 8px;
  }

  :deep(.v-tab) {
    position: relative;
    min-width: auto;
    padding: 14px 4px;
    margin-right: 20px;
    text-transform: none;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: normal;
    color: #6b7280;
    opacity: 1;

    transition: all 0.2s ease;

    &:hover {
      color: #111827;
    }

    &.v-tab--selected {
      color: #0061fb;
      font-weight: 600;
    }

    &.v-tab--selected::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 2px;
      background: #0061fb;
      border-radius: 999px;
    }
  }

  :deep(.v-tabs-slider) {
    display: none !important;
  }
}
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 20px 20px 20px;
}

.gocardless-table {
  border-radius: unset !important;

  :deep(.v-table__wrapper table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100% !important;
    table-layout: auto;
  }

  :deep(thead tr th) {
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: #f6f6f6 !important;
    padding: 0 8px !important;
    height: 48px !important;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    vertical-align: middle;
  }

  :deep(thead tr th:last-child) {
    border-right: none;
  }

  :deep(tbody tr td) {
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding: 4px 8px !important;
    height: 48px !important;
    vertical-align: middle;
    font-size: 14px;
    color: #374151;
  }

  :deep(tbody tr td:last-child) {
    border-right: none;
  }

  :deep(.v-table__wrapper tbody tr:hover) {
    background-color: #f9fafb !important;
    transition: background-color 0.2s ease;
  }
}

.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  margin: 0;
  flex-shrink: 0;

  &:checked {
    background: #0061fb;
    border-color: #0061fb;
  }

  &:checked::after {
    content: "";
    position: absolute;
    left: 6px;
    top: 2px;
    width: 4px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

.link-btn {
  border: none;
  background: transparent;
  color: #0061fb;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.amount-text {
  font-weight: 500;
  color: #374151;
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
  white-space: nowrap;
}

.status-badge--paid {
  background: #eaf8e6;
  color: #5daf4d;
}

.status-badge--unpaid {
  background: #ffe8ea;
  color: #ff6b76;
}

.status-badge--part {
  background: #fff4d6;
  color: #f59e0b;
}

.status-badge--written {
  background: #f3f4f6;
  color: #9ca3af;
}

.status-badge--draft {
  background: #f0f4ff;
  color: #0061fb;
}

.synced-indicator {
  font-weight: 500;
  color: #9ca3af;

  &.synced {
    color: #5daf4d;
  }
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-start;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  min-height: 200px;

  .empty-state-text {
    font-size: 14px;
    margin-top: 12px;
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .tabs-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left {
    flex-direction: column;
    width: 100%;
  }

  .custom-search,
  .filter-select {
    width: 100% !important;
  }

  .table-container {
    margin: 0 12px 16px 12px;
  }
}
</style>
