<template>
  <div class="accounts-page">
    <div class="accounts-stats">
      <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        :label="activeSection === 'payments' ? 'Patient' : 'Patient Outstanding'"
        :value="stats.outstanding"
        uid="accounts-outstanding"
        hide-chip
      />

      <CommonStatCard
        :icon="payAsYouGoIcon"
        icon-type="image"
        label="Pay As You Go"
        :value="stats.payAsYouGo"
        uid="accounts-payg"
        hide-chip
        :select="selectedPlan"
        :select-items="payAsYouGoOptions"
        @update:select="selectedPlan = $event"
      />

      <CommonStatCard
        :icon="poundIcon"
        icon-type="image"
        label="Total Paid"
        :value="stats.totalPaid"
        uid="accounts-paid"
        hide-chip
      />

      <div
        class="finance-card"
        :class="{ 'finance-card--summary': isFinanceSummaryCard }"
      >
        <template v-if="isFinanceSummaryCard">
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

    <section class="accounts-panel">
      <div
        v-if="!['finance', 'practice-plan'].includes(activeSection)"
        class="accounts-toolbar"
      >
        <div class="accounts-toolbar__left">
          <h2>Accounts</h2>

          <div class="toolbar-input">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search"
            />
            <img :src="searchIcon" alt="" />
          </div>

          <button type="button" class="toolbar-filter-btn">
            <span>Filters</span>
            <img :src="filterIcon" alt="" />
          </button>
        </div>

        <div class="accounts-toolbar__right">
          <button type="button" class="outline-action-btn">
            <v-icon start>mdi-plus-circle-outline</v-icon>
            <span>Payment</span>
          </button>

          <button type="button" class="primary-action-btn">
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button>
        </div>
      </div>

      <div v-else class="finance-panel-header">
        <h2>{{ activeSection === "finance" ? "Finance" : "Accounts" }}</h2>
        <div v-if="activeSection === 'practice-plan'" class="accounts-toolbar__right">
          <button type="button" class="primary-action-btn">
            <img :src="refunIcon" alt="" />
            <span>Refund</span>
          </button>
          <button type="button" class="outline-action-btn">
            <v-icon start>mdi-plus-circle-outline</v-icon>
            <span>Make Payment</span>
          </button>
          <button type="button" class="primary-action-btn">
            <img :src="downloadIcon" alt="" />
            <span>Statement</span>
          </button>
        </div>
      </div>

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

        <PatientAccountsPayment v-if="activeSection === 'payments'" />
        <PatientAccountsFinance v-else-if="activeSection === 'finance'" />
        <PatientAccountsPracticePlan v-else-if="activeSection === 'practice-plan'" />

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
                <th>Patient</th>
                <th>Summary</th>
                <th>Practitioner</th>
                <th>Balance</th>
                <th>Total Invoices</th>
                <th class="menu-cell"></th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="invoice in activeRows" :key="invoice.id">
                <td class="checkbox-cell">
                  <input type="checkbox" />
                </td>
                <td>
                  <div class="invoice-link">
                    <a href="#" @click.prevent>{{ invoice.invoice }}</a>
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
                <td>{{ invoice.date }}</td>
                <td>{{ invoice.patient }}</td>
                <td>{{ invoice.summary }}</td>
                <td>
                  <div class="practitioner-cell">
                    <div class="avatar">{{ invoice.initials }}</div>
                    <span>{{ invoice.practitioner }}</span>
                  </div>
                </td>
                <td :class="{ 'balance-due': invoice.balance.includes('due') }">
                  {{ invoice.balance }}
                </td>
                <td>{{ invoice.total }}</td>
                <td class="menu-cell">
                  <span aria-hidden="true">&#8942;</span>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td colspan="7"></td>
                <td class="totals-label">Totals:</td>
                <td class="totals-value">{{ totals.balance }}</td>
                <td class="totals-value">{{ totals.invoice }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import CommonStatCard from "@/components/Common/statCard.vue";
import PatientAccountsFinance from "@/components/patients/accounts/finance.vue";
import PatientAccountsPayment from "@/components/patients/accounts/payment.vue";
import PatientAccountsPracticePlan from "@/components/patients/accounts/practicePlan.vue";
import financeIcon from "@/assets/diary/finance_icon.svg";
import payAsYouGoIcon from "@/assets/diary/payasyougo_icon.svg";
import poundIcon from "@/assets/diary/pound_icon.svg";
import downloadIcon from "@/assets/diary/statements_icon.svg";
import refunIcon from "@/assets/diary/refund_icon.svg";
import filterIcon from "@/assets/icons/listView/filter-icon.svg";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import expandDetailIcon from "@/assets/diary/expand_detail_icon.svg";

const selectedPlan = ref("Monthly");
const searchTerm = ref("");
const activeSection = ref("invoices");

const stats = {
  outstanding: "-\u00A355.00",
  payAsYouGo: "\u00A355.00",
  totalPaid: "\u00A30.00",
};

const payAsYouGoOptions = ["Monthly", "Quarterly", "Yearly"];

const sections = [
  { label: "Payments", value: "payments" },
  { label: "Invoices", value: "invoices" },
  { label: "Finance", value: "finance" },
  { label: "Practice Plan", value: "practice-plan" },
];

const rowsBySection = {
  payments: [
    {
      id: 1,
      invoice: "01051",
      status: "Paid",
      date: "14 Oct 2025",
      patient: "John Doe",
      summary: "Hygiene Visit",
      practitioner: "John Doe",
      initials: "JD",
      balance: "-",
      total: "\u00A380.00",
    },
    {
      id: 2,
      invoice: "01052",
      status: "Paid",
      date: "01 Oct 2025",
      patient: "Marta Ogrodnik",
      summary: "Whitening Deposit",
      practitioner: "Marta Ogrodnik",
      initials: "MO",
      balance: "-",
      total: "\u00A3130.00",
    },
  ],
  invoices: [
    {
      id: 3,
      invoice: "01047",
      status: "Unpaid",
      date: "9 Oct 2025",
      patient: "John Doe",
      summary: "Scale & Polish",
      practitioner: "John Doe",
      initials: "JD",
      balance: "\u00A355.00 due",
      total: "\u00A360.00",
    },
    {
      id: 4,
      invoice: "110045",
      status: "Paid",
      date: "9 Sep 2025",
      patient: "Marta Ogrodnik",
      summary: "Teeth Whitening",
      practitioner: "Marta Ogrodnik",
      initials: "MO",
      balance: "-",
      total: "\u00A3130.00",
    },
    {
      id: 5,
      invoice: "101045",
      status: "Paid",
      date: "9 Jun 2025",
      patient: "John Doe",
      summary: "Periodontal Scaling & Root Planing",
      practitioner: "John Doe",
      initials: "JD",
      balance: "\u00A355.00 due",
      total: "\u00A320.00",
    },
    {
      id: 6,
      invoice: "110040",
      status: "Paid",
      date: "9 Jan 2025",
      patient: "Marta Ogrodnik",
      summary: "Scale & Polish",
      practitioner: "Marta Ogrodnik",
      initials: "MO",
      balance: "-",
      total: "\u00A3160.00",
    },
  ],
  finance: [
    {
      id: 7,
      invoice: "02001",
      status: "Paid",
      date: "2 Dec 2025",
      patient: "Alex Brown",
      summary: "Finance Agreement",
      practitioner: "John Doe",
      initials: "AB",
      balance: "-",
      total: "\u00A3450.00",
    },
  ],
  "practice-plan": [
    {
      id: 8,
      invoice: "03010",
      status: "Paid",
      date: "11 Nov 2025",
      patient: "Marta Ogrodnik",
      summary: "Practice Plan Subscription",
      practitioner: "Marta Ogrodnik",
      initials: "MO",
      balance: "-",
      total: "\u00A339.00",
    },
  ],
};

const activeRows = computed(() => rowsBySection[activeSection.value] || []);

const isFinanceSummaryCard = computed(() =>
  ["payments", "finance", "practice-plan"].includes(activeSection.value),
);

const totals = computed(() => {
  if (activeSection.value === "invoices") {
    return {
      balance: "\u00A355.00",
      invoice: "\u00A3505.00",
    };
  }

  return {
    balance: "-",
    invoice: activeRows.value[0]?.total || "\u00A30.00",
  };
});
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
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
}

.finance-card--summary {
  background: #ffffff;
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
  background: #ffffff;
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
}

.finance-panel-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #242424;
}

.accounts-toolbar {
  padding: 12px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f5;
}

.accounts-toolbar__left,
.accounts-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.accounts-toolbar h2 {
  font-size: 24px;
  font-weight: 700;
  color: #242424;
  margin-right: 8px;
}

.toolbar-input {
  width: 120px;
  height: 34px;
  border-radius: 8px;
  background: #f5f6f8;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
}

.toolbar-input input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: #4b5563;
}

.toolbar-input img,
.toolbar-filter-btn img,
.primary-action-btn img {
  width: 14px;
  height: 14px;
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
  gap: 8px;
  padding: 0 14px;
}

.toolbar-filter-btn {
  border: 0;
  background: #f5f6f8;
  color: #6b7280;
}

.outline-action-btn {
  border: 1px solid #0061fb;
  background: #ffffff;
  color: #1f2937;
}

.btn-icon-circle {
  width: 16px;
  height: 16px;
  border: 1px solid #9ca3af;
  border-radius: 50%;
  font-size: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.primary-action-btn {
  border: 0;
  background: #0061fb;
  color: #ffffff;
}

.refund-action-btn {
  height: 34px;
  border: 0;
  border-radius: 8px;
  padding: 0 16px;
  background: #8b79ff;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
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
}

.sidebar-tab--active {
  background: #edf4f8;
  color: #394150;
  font-weight: 500;
}

.accounts-table-wrap {
  overflow-x: auto;
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
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
  background: #ffffff;
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
}

.invoice-link a {
  color: #0061fb;
  text-decoration: none;
  font-weight: 500;
}

.invoice-link img {
  width: 13px;
  height: 13px;
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

.balance-due {
  color: #ff6b76 !important;
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

@media (max-width: 1200px) {
  .accounts-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .accounts-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

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

  .accounts-toolbar h2 {
    width: 100%;
    margin-right: 0;
  }
}
</style>
