<template>
  <div class="payments-container">
    <!-- Table Controls -->
    <div class="table-controls">
      <div class="controls-left">
        <div style="width: 180px">
          <v-text-field
            v-model="search"
            placeholder="Search payments..."
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
            v-model="methodFilter"
            :items="methodOptions"
            item-title="title"
            item-value="value"
            placeholder="All Methods"
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

    <!-- Payments Table -->
    <div class="table-container">
      <v-data-table
        :headers="paymentHeaders"
        :items="filteredPayments"
        :search="search"
        item-key="id"
        class="full-width-table"
        :items-per-page="10"
        :loading="false"
        loading-text="Loading payments..."
      >
        <template v-slot:headers="{ columns }">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{
                width: column.width + 'px',
                minWidth: column.width + 'px',
                padding: '0px 7px',
                fontSize: '14px',
                backgroundColor: '#f6f6f6',
                position: 'relative',
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
              <div class="payment-number">{{ item.paymentNumber }}</div>
            </td>
            <td class="text-left">{{ formatDate(item.paymentDate) }}</td>
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
              <v-chip size="x-small" variant="flat" class="method-chip">
                {{ methodLabel(item.method) }}
              </v-chip>
            </td>
            <td class="text-left">{{ item.reference || "—" }}</td>
            <td class="text-left">
              <div v-if="item.allocations?.length" class="allocation-list">
                <span
                  v-for="alloc in item.allocations.slice(0, 3)"
                  :key="alloc.id"
                  class="alloc-chip"
                >
                  {{ alloc.invoiceNumber }}
                </span>
                <span
                  v-if="item.allocations.length > 3"
                  class="alloc-chip more-chip"
                  @click="toggleExpand(item.id)"
                >
                  +{{ item.allocations.length - 3 }}
                </span>
              </div>
              <span v-else class="text-grey-darken-1">—</span>
            </td>
            <td class="text-left">
              <span :class="{ 'balance-due': Number(item.unallocated) > 0 }">
                {{ fmtGbp(item.unallocated) }}
              </span>
            </td>
            <td class="text-left font-weight-medium">
              {{ fmtGbp(item.amount) }}
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
                <v-list density="compact" min-width="140">
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Delete Payment"
                    class="text-error"
                    @click="$emit('delete-payment', item.id)"
                  />
                  <v-list-item
                    prepend-icon="mdi-link-off"
                    title="Unallocate Payment"
                    @click="$emit('unallocate-payment', item)"
                    :disabled="!item.allocations?.length"
                  />
                </v-list>
              </v-menu>
            </td>
          </tr>

          <!-- Expanded row for allocations -->
          <tr
            v-if="
              expandedPayments.includes(item.id) && item.allocations?.length
            "
          >
            <td colspan="9" class="expanded-row-cell">
              <div class="expanded-card">
                <div class="expanded-header">
                  <span class="font-weight-medium">Payment Allocations</span>
                </div>
                <v-table density="compact" class="expanded-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Allocated Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="alloc in item.allocations" :key="alloc.id">
                      <td>{{ alloc.invoiceNumber }}</td>
                      <td>{{ fmtGbp(alloc.amount) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import filterIcon from "@/assets/icons/listView/filter-icon.svg";

const props = defineProps({
  payments: { type: Array, default: () => [] },
});

defineEmits([
  "delete-payment",
  "new-payment",
  "download-statement",
  "unallocate-payment",
]);

// State
const search = ref("");
const methodFilter = ref(null);
const expandedPayments = ref([]);

// Table headers
const paymentHeaders = ref([
  {
    title: "Payment",
    key: "paymentNumber",
    align: "start",
    width: 130,
    resizable: true,
  },
  {
    title: "Date",
    key: "paymentDate",
    align: "start",
    width: 110,
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
    title: "Method",
    key: "method",
    align: "start",
    width: 70,
    resizable: true,
  },
  {
    title: "Reference",
    key: "reference",
    align: "start",
    width: 70,
    resizable: true,
  },
  {
    title: "Allocated to",
    key: "allocations",
    align: "start",
    width: 120,
    resizable: true,
  },
  {
    title: "Unallocated",
    key: "unallocated",
    align: "start",
    width: 100,
    resizable: true,
  },
  {
    title: "Total",
    key: "amount",
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

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  finance: "Finance",
  other: "Other",
};

const methodOptions = [
  { title: "Cash", value: "cash" },
  { title: "Card", value: "card" },
  { title: "Bank Transfer", value: "bank_transfer" },
  { title: "Cheque", value: "cheque" },
  { title: "Finance", value: "finance" },
  { title: "Other", value: "other" },
];

const methodLabel = (m) => METHOD_LABELS[m] || m;

// Filtered payments
const filteredPayments = computed(() => {
  let filtered = [...props.payments];

  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    filtered = filtered.filter(
      (payment) =>
        payment.paymentNumber?.toLowerCase().includes(searchTerm) ||
        payment.practitionerName?.toLowerCase().includes(searchTerm) ||
        payment.reference?.toLowerCase().includes(searchTerm),
    );
  }

  if (methodFilter.value) {
    filtered = filtered.filter(
      (payment) => payment.method === methodFilter.value,
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

const toggleExpand = (id) => {
  if (expandedPayments.value.includes(id)) {
    expandedPayments.value = expandedPayments.value.filter((x) => x !== id);
  } else {
    expandedPayments.value = [...expandedPayments.value, id];
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
.payments-container {
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

.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

  /* Vertical lines between columns - matches CRM pattern */
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

.payment-number {
  margin-left: 6px;
  font-weight: 500;
  font-size: 12px;
  color: #0061fb;
}

.practitioner-cell {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.method-chip {
  margin-left: 6px;
  border-radius: 100px !important;
  font-weight: 500;
  font-size: 11px;
  padding: 4px 10px;
  height: auto;
  background: #e0e7ff !important;
  color: #4f46e5 !important;
}

.allocation-list {
  margin-left: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.alloc-chip {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
}

.more-chip {
  background: #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d1d5db;
  }
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

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left {
    flex-direction: column;
    width: 100%;
  }

  .controls-right {
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
