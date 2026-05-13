<template>
  <div class="invoices-container">
    <!-- Table Controls -->
    <div class="table-controls">
      <div class="controls-left">
        <div style="width: 180px">
          <v-text-field
            v-model="search"
            placeholder="Search invoices..."
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
        </div>
        <div style="width: 180px">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            placeholder="All Status"
            variant="solo"
            density="compact"
            bg-color="#F3F4F6"
            hide-details
            flat
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
    </div>

    <!-- Invoices Table -->
    <div class="table-container">
      <v-data-table
        :headers="invoiceHeaders"
        :items="filteredInvoices"
        :search="search"
        item-key="id"
        class="full-width-table"
        :items-per-page="10"
        :loading="loading"
        loading-text="Loading invoices..."
      >
        <template v-slot:headers="{ columns }">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{
                width: column.width + 'px',
                minWidth: column.width + 'px',
                position: 'relative',
                padding: '0px 7px',
                fontSize: '14px',
                backgroundColor: '#f6f6f6',
              }"
            >
              <div class="d-flex align-center th-content">
                <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                <span
                  v-if="column.resizable"
                  class="resize-handle"
                  @mousedown="startResize($event, column)"
                ></span>
              </div>
            </th>
          </tr>
        </template>

        <template v-slot:item="{ item }">
          <tr class="table-row">
            <td class="text-left">
              <div class="invoice-link">
                <button
                  type="button"
                  class="inv-number"
                  @click="$emit('view-invoice', item)"
                >
                  {{ item.invoiceNumber }}
                  <img :src="expandDetailIcon" alt="" width="13" height="13" />
                </button>
              </div>
            </td>
            <td class="text-left">
              <span class="status-badge" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="text-left">{{ formatDate(item.invoiceDate) }}</td>
            <td class="text-left">{{ invoiceSummary(item) }}</td>
            <td class="text-left">
              <div v-if="item.practitionerName" class="practitioner-cell">
                <CommonAvatar
                  :user="{ name: item.practitionerName }"
                  size="32px"
                />
                <span>{{ item.practitionerName }}</span>
              </div>
              <span v-else class="text-grey-darken-1">—</span>
            </td>
            <td class="text-left">
              <span :class="{ 'balance-due': Number(item.balance) > 0 }">
                {{ fmtGbp(item.balance) }}
              </span>
            </td>
            <td class="text-left font-weight-medium">
              {{ fmtGbp(item.total) }}
            </td>
            <td class="text-left">
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <button
                    type="button"
                    class="action-menu-trigger"
                    v-bind="menuProps"
                  >
                    <v-icon size="18" color="#6B7280">mdi-dots-vertical</v-icon>
                  </button>
                </template>
                <v-list density="compact" min-width="160">
                  <v-list-item
                    title="Take Payment"
                    @click="$emit('take-payment', item)"
                  />
                  <v-list-item
                    title="Mark as Written Off"
                    @click="$emit('update-status', item, 'written_off')"
                  />
                  <v-list-item
                    title="Delete Invoice"
                    class="text-error"
                    @click="$emit('delete-invoice', item.id)"
                  />
                </v-list>
              </v-menu>
            </td>
          </tr>

          <!-- Expanded row for line items -->
          <tr v-if="expandedInvoices.includes(item.id) && item.items?.length">
            <td colspan="8" class="expanded-row-cell">
              <div class="expanded-card">
                <div class="expanded-header">
                  <span class="font-weight-medium">Invoice Items</span>
                </div>
                <v-table density="compact" class="expanded-table">
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
                    <tr v-for="lineItem in item.items" :key="lineItem.id">
                      <td>{{ lineItem.description }}</td>
                      <td>
                        {{
                          lineItem.fdi
                            ? `${lineItem.fdi}${lineItem.surface ? "/" + lineItem.surface : ""}`
                            : "—"
                        }}
                      </td>
                      <td>{{ lineItem.quantity }}</td>
                      <td>{{ fmtGbp(lineItem.unitPrice) }}</td>
                      <td>{{ fmtGbp(lineItem.total) }}</td>
                      <td>{{ lineItem.practitionerName || "—" }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </td>
          </tr>
        </template>

        <template v-slot:bottom>
          <div v-if="filteredInvoices.length" class="table-footer">
            <div class="footer-totals">
              <span class="totals-label">Totals:</span>
              <span class="totals-value"
                >Balance: {{ invoiceTotals.balance }}</span
              >
              <span class="totals-value">Total: {{ invoiceTotals.total }}</span>
            </div>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="empty-state">
            {{
              invoices.length
                ? "No invoices match your search."
                : 'No invoices yet. Use "Generate Invoice" to create one from completed treatments.'
            }}
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import filterIcon from "@/assets/icons/listView/filter-icon.svg";
import expandDetailIcon from "@/assets/diary/expand_detail_icon.svg";

const props = defineProps({
  invoices: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  invoiceTotals: {
    type: Object,
    default: () => ({ balance: "£0.00", total: "£0.00" }),
  },
});

const emit = defineEmits([
  "view-invoice",
  "take-payment",
  "update-status",
  "delete-invoice",
]);

// State
const search = ref("");
const statusFilter = ref(null);
const expandedInvoices = ref([]);

// Table headers
const invoiceHeaders = ref([
  {
    title: "Invoice",
    key: "invoiceNumber",
    align: "start",
    width: 130,
    resizable: true,
  },
  {
    title: "Status",
    key: "status",
    align: "start",
    width: 110,
    resizable: true,
  },
  {
    title: "Date",
    key: "invoiceDate",
    align: "start",
    width: 110,
    resizable: true,
  },
  {
    title: "Treatment Plan",
    key: "summary",
    align: "start",
    width: 200,
    resizable: true,
  },
  {
    title: "Practitioner",
    key: "practitionerName",
    align: "start",
    width: 150,
    resizable: true,
  },
  {
    title: "Balance",
    key: "balance",
    align: "start",
    width: 100,
    resizable: true,
  },
  {
    title: "Total",
    key: "total",
    align: "start",
    width: 100,
    resizable: true,
  },
  {
    title: "Actions",
    key: "actions",
    align: "center",
    width: 80,
    resizable: false,
  },
]);

// Status filter options
const statusOptions = [
  { title: "Unpaid", value: "unpaid" },
  { title: "Part Paid", value: "part_paid" },
  { title: "Paid", value: "paid" },
  { title: "Written Off", value: "written_off" },
  { title: "Credited", value: "credited" },
  { title: "Draft", value: "draft" },
];

const STATUS_LABELS = {
  unpaid: "Unpaid",
  part_paid: "Part Paid",
  paid: "Paid",
  written_off: "Written Off",
  credited: "Credited",
  draft: "Draft",
};

const statusLabel = (s) => STATUS_LABELS[s] || s;

const statusClass = (s) => ({
  "status-badge--paid": s === "paid",
  "status-badge--unpaid": s === "unpaid",
  "status-badge--part": s === "part_paid",
  "status-badge--written": s === "written_off",
  "status-badge--draft": s === "draft",
});

// Filtered invoices
const filteredInvoices = computed(() => {
  let filtered = [...props.invoices];

  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    filtered = filtered.filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
        invoice.practitionerName?.toLowerCase().includes(searchTerm) ||
        invoiceSummary(invoice).toLowerCase().includes(searchTerm),
    );
  }

  if (statusFilter.value) {
    filtered = filtered.filter(
      (invoice) => invoice.status === statusFilter.value,
    );
  }

  return filtered;
});

// Formatters
const fmtGbp = (v) => `£${Number(v ?? 0).toFixed(2)}`;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const invoiceSummary = (invoice) => {
  return invoice.planName || "—";
};

const toggleExpand = (id) => {
  if (expandedInvoices.value.includes(id)) {
    expandedInvoices.value = expandedInvoices.value.filter((x) => x !== id);
  } else {
    expandedInvoices.value = [...expandedInvoices.value, id];
  }
};

const clearSearch = () => {
  search.value = "";
};

// Resize handler
const startResize = (event, column) => {
  if (typeof window === "undefined") return;
  const startX = event.clientX || 0;
  const startWidth = Number(column.width) || 140;
  const onMouseMove = (e) => {
    const delta = (e.clientX || 0) - startX;
    column.width = Math.max(80, startWidth + delta);
  };
  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};
</script>

<style scoped lang="scss">
.invoices-container {
  width: 100%;
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 10px;
  gap: 16px;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.custom-search {
  width: 100%;
  :deep(.v-field) {
    border-radius: 8px;
    background-color: #f3f4f6 !important;
  }
}

.filter-select {
  width: 180px;
  :deep(.v-field) {
    border-radius: 8px;
    background-color: #f3f4f6 !important;
  }
}

.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
}

.full-width-table {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: unset;

  :deep(table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100% !important;
    table-layout: fixed;
  }

  /* Vertical lines between columns - consistent with payment table */
  :deep(thead tr th) {
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: #f6f6f6 !important;
    padding: 0px 7px !important;
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

  :deep(.v-table__wrapper) {
    margin-top: 0 !important;

    tbody tr {
      height: 48px !important;
    }

    tbody tr:hover {
      background-color: #f9fafb;
      transition: background-color 0.2s ease;
    }
  }
}

.table-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  transition: background 0.15s;
}

.table-row td {
  padding: 4px 8px !important;
  font-size: 14px;
  color: #374151;
  height: 48px !important;
  vertical-align: middle;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
  margin-left: auto;
}

.invoice-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.practitioner-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.balance-due {
  color: #dc2626 !important;
  font-weight: 600;
}

.action-menu-trigger {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #8b96a7;
  font-size: 13px;
}

.expanded-row-cell {
  padding: 0 !important;
  background: #f9fafb;
}

.expanded-card {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.expanded-header {
  margin-bottom: 16px;
  font-size: 14px;
  color: #111827;
}

.expanded-table {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;

  :deep(th) {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    background: #f3f4f6;
    padding: 10px 12px;
  }

  :deep(td) {
    font-size: 13px;
    color: #374151;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
  }
}

.table-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #edf1f5;
  display: flex;
  justify-content: flex-end;
}

.footer-totals {
  display: flex;
  align-items: center;
  gap: 16px;
}

.totals-label {
  font-weight: 600;
  color: #4b5563;
  font-size: 13px;
}

.totals-value {
  font-weight: 700;
  color: #303846;
  font-size: 14px;
}

@media (max-width: 768px) {
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
    width: 100%;
  }

  .filter-select {
    max-width: 100%;
  }
}
</style>
