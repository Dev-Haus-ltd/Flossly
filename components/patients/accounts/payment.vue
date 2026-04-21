<template>
  <div class="payments-view">
    <div class="payments-table-wrap">
      <table class="payments-table">
        <thead>
          <tr>
            <th class="expander-cell"></th>
            <th>Payment</th>
            <th>Payment date</th>
            <th>Practitioner</th>
            <th>Payer</th>
            <th>Method</th>
            <th>Transaction no.</th>
            <th>Allocated to</th>
            <th>Unalloc...</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="payment in payments" :key="payment.id">
            <tr>
              <td class="expander-cell">
                <button type="button" class="row-toggle" @click="toggleExpanded(payment.id)">
                  <v-icon size="16">
                    {{ expandedRows.includes(payment.id) ? "mdi-chevron-down" : "mdi-chevron-right" }}
                  </v-icon>
                </button>
              </td>
              <td>{{ payment.payment }}</td>
              <td>{{ payment.date }}</td>
              <td>
                <div class="practitioner-cell">
                  <div class="avatar">{{ payment.practitionerInitials }}</div>
                  <span>{{ payment.practitioner }}</span>
                </div>
              </td>
              <td>{{ payment.payer }}</td>
              <td>{{ payment.method }}</td>
              <td>{{ payment.transaction }}</td>
              <td>
                <div class="allocation-link">
                  <span>{{ payment.allocatedTo }}</span>
                  <img :src="expandDetailIcon" alt="" />
                  <template v-if="payment.reference">
                    <span>{{ payment.reference }}</span>
                    <img :src="expandDetailIcon" alt="" />
                  </template>
                </div>
              </td>
              <td>{{ payment.unallocated }}</td>
              <td>{{ payment.total }}</td>
            </tr>

            <tr v-if="expandedRows.includes(payment.id)">
              <td colspan="10" class="expanded-row-cell">
                <div class="expanded-card">
                  <table class="expanded-table">
                    <thead>
                      <tr>
                        <th>Invoices</th>
                        <th>Invoices status</th>
                        <th>Invoice date</th>
                        <th>Invoice total</th>
                        <th>Patient</th>
                        <th>Allocation date</th>
                        <th>Notes</th>
                        <th>Practitioner(s)</th>
                        <th>Allocated</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="invoice in payment.invoices" :key="invoice.id">
                        <td>
                          <div class="inline-link">
                            <span>{{ invoice.invoice }}</span>
                            <img :src="expandDetailIcon" alt="" />
                          </div>
                        </td>
                        <td>
                          <span
                            class="status-badge"
                            :class="{
                              'status-badge--paid': invoice.status === 'Paid',
                              'status-badge--unpaid': invoice.status === 'Unpaid',
                            }"
                          >
                            {{ invoice.status }}
                          </span>
                        </td>
                        <td>{{ invoice.invoiceDate }}</td>
                        <td>{{ invoice.invoiceTotal }}</td>
                        <td>{{ invoice.patient }}</td>
                        <td>{{ invoice.allocationDate }}</td>
                        <td>{{ invoice.notes }}</td>
                        <td>{{ invoice.practitioner }}</td>
                        <td>{{ invoice.allocated }}</td>
                        <td class="unallocated-link">Unallocated</td>
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
            <td class="totals-value">{{ totals.unallocated }}</td>
            <td class="totals-value">{{ totals.total }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import expandDetailIcon from "@/assets/diary/expand_detail_icon.svg";

const expandedRows = ref([1047]);

const payments = [
  {
    id: 1047,
    payment: "01047",
    date: "9 Oct 2025",
    practitioner: "John Doe",
    practitionerInitials: "JD",
    payer: "John Doe",
    method: "Cash",
    transaction: "Saba taken",
    allocatedTo: "01047",
    reference: "01047",
    unallocated: "-",
    total: "\u00A360.00",
    invoices: [
      {
        id: 1,
        invoice: "01047",
        status: "Unpaid",
        invoiceDate: "28 Aug 2025",
        invoiceTotal: "\u00A3150.00",
        patient: "KANR CROSFILL",
        allocationDate: "9 Oct 2025",
        notes: "-",
        practitioner: "Marta Ogrodnik",
        allocated: "\u00A315.00",
      },
      {
        id: 2,
        invoice: "01047",
        status: "Paid",
        invoiceDate: "28 Aug 2025",
        invoiceTotal: "\u00A3150.00",
        patient: "KANR CROSFILL",
        allocationDate: "9 Oct 2025",
        notes: "-",
        practitioner: "Marta Ogrodnik",
        allocated: "\u00A315.00",
      },
    ],
  },
  {
    id: 110045,
    payment: "110045",
    date: "9 Sep 2025",
    practitioner: "Marta Ogrodnik",
    practitionerInitials: "MO",
    payer: "Marta Ogrodnik",
    method: "Cash",
    transaction: "-",
    allocatedTo: "01047",
    reference: "",
    unallocated: "-",
    total: "\u00A3130.00",
    invoices: [],
  },
  {
    id: 101045,
    payment: "101045",
    date: "9 Jun 2025",
    practitioner: "John Doe",
    practitionerInitials: "JD",
    payer: "John Doe",
    method: "Debit Card",
    transaction: "-",
    allocatedTo: "01047",
    reference: "",
    unallocated: "-",
    total: "\u00A320.00",
    invoices: [],
  },
  {
    id: 110040,
    payment: "110040",
    date: "9 Jan 2025",
    practitioner: "Marta Ogrodnik",
    practitionerInitials: "MO",
    payer: "Marta Ogrodnik",
    method: "Debit Card",
    transaction: "4whw",
    allocatedTo: "01047",
    reference: "",
    unallocated: "-",
    total: "\u00A3160.00",
    invoices: [],
  },
];

const totals = {
  unallocated: "\u00A30.00",
  total: "\u00A3505.00",
};

const toggleExpanded = (id) => {
  if (expandedRows.value.includes(id)) {
    expandedRows.value = expandedRows.value.filter((rowId) => rowId !== id);
    return;
  }

  expandedRows.value = [...expandedRows.value, id];
};
</script>

<style scoped lang="scss">
.payments-table-wrap {
  overflow-x: auto;
}

.payments-table {
  width: 100%;
  min-width: 980px;
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
  vertical-align: top;
}

.payments-table th {
  font-size: 11px;
  font-weight: 600;
  color: #757f8f;
}

.payments-table th:last-child,
.payments-table td:last-child {
  border-right: 0;
}

.expander-cell {
  width: 26px;
  text-align: center !important;
}

.row-toggle {
  border: 0;
  background: transparent;
  color: #8b96a7;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
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
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.allocation-link,
.inline-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.allocation-link img,
.inline-link img {
  width: 13px;
  height: 13px;
}

.expanded-row-cell {
  padding: 10px 12px !important;
  background: #ffffff;
}

.expanded-card {
  background: #f7f9fc;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  padding: 10px 12px;
}

.expanded-table {
  width: 100%;
  border-collapse: collapse;
}

.expanded-table th,
.expanded-table td {
  border: 0;
  padding: 7px 10px 7px 0;
  background: transparent;
  white-space: nowrap;
}

.expanded-table th {
  font-size: 11px;
  color: #434c5c;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
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

.unallocated-link {
  color: #0061fb !important;
  font-weight: 500;
}

tfoot td {
  border-bottom: 0;
  background: #ffffff;
}

.totals-label,
.totals-value {
  font-weight: 700;
  color: #303846 !important;
}
</style>
