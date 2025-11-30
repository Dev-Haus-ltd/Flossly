<template>
  <div
    style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: auto"
    class="mb-5"
  >
    <!-- Header -->
    <div
      style="border-bottom: 1px solid #dbdbdb"
      class="d-flex align-center justify-space-between px-4 py-2"
    >
      <!-- Title -->
      <h3
        style="
          
          font-weight: 600;
          font-style: SemiBold;
          font-size: 14px;
          color: #1e1e1e;
          margin: 0;
        "
      >
        Invoices Details
      </h3>

      <!-- Actions -->
      <div class="d-flex align-center gap-3">
        <v-btn
          variant="text"
          class="text-link px-0 mr-4"
          @click="$emit('open-terms')"
        >
          Terms & Conditions
        </v-btn>

        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search invoices"
          hide-details
          variant="solo"
          style="width: 180px"
          class="input-bordered"
          flat
          append-inner-icon="mdi-magnify"
        />
      </div>
    </div>

    <!-- Table -->
    <v-table class="invoice-table" density="comfortable">
      <thead>
        <tr>
          <th>Invoice Id</th>
          <th>Payment Id</th>
          <th>Due Date</th>
          <th>Payment</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(invoice, index) in filteredInvoices" :key="index">
          <td>{{ invoice.invoiceId }}</td>
          <td>{{ invoice.paymentId }}</td>
          <td>{{ formatDate(invoice.dueDate) }}</td>
          <td>{{ invoice.payment }}</td>
          <td>{{ invoice.status }}</td>
          <td>
            <div class="d-flex align-center">
              <img
                src="@/assets/icons/download.svg"
                alt="Download"
                width="20"
                height="20"
                style="cursor: pointer"
                @click="$emit('download-invoice', invoice)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { parsedDate } from "~/lib/dateFormatter";

const props = defineProps({
  invoices: {
    type: Array,
    default: () => [],
  },
});

const search = ref("");

// Filter invoices
const filteredInvoices = computed(() =>
  props.invoices.filter((invoice) =>
    Object.values(invoice)
      .join(" ")
      .toLowerCase()
      .includes(search.value.toLowerCase())
  )
);

const formatDate = (date) => parsedDate(date);
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.invoice-table th,
.invoice-table td {
  
  font-weight: 400;
  font-size: 13px;
  padding: 8px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  padding: 0px 16px !important;
  word-break: break-word;
}

.invoice-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.invoice-table tbody tr:hover {
  background-color: #f9f9f9;
}

/* Remove borders overlapping with container */
.invoice-table th:first-child,
.invoice-table td:first-child {
  border-left: none;
}
.invoice-table th:last-child,
.invoice-table td:last-child {
  border-right: none;
}
.invoice-table thead tr:first-child th {
  border-top: none;
}
.invoice-table tbody tr:last-child td {
  border-bottom: none;
}

/* Link button style */
.text-link {
  
  font-size: 13px;
  font-weight: 500;
  color: #1976d2 !important;
  text-transform: none;
}

/* Search input */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
