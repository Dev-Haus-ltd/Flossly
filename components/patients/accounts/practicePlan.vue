<template>
  <div class="practice-plan-view">
    <div class="plans-grid">
      <article
        v-for="plan in plans"
        :key="plan.name + plan.price"
        class="plan-card"
        :class="{ 'plan-card--active': plan.active }"
      >
        <div class="plan-card__top">
          <div class="plan-card__price">{{ plan.price }}</div>
          <span v-if="plan.active" class="plan-card__badge">Active</span>
        </div>

        <div class="plan-card__name">{{ plan.name }}</div>
        <div class="plan-card__copy">{{ plan.copy }}</div>

        <ul class="plan-card__features">
          <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
        </ul>

        <button
          type="button"
          class="plan-card__action"
          :class="{ 'plan-card__action--active': plan.active }"
        >
          {{ plan.active ? "Active" : "Upgrade" }}
        </button>
      </article>
    </div>

    <section class="history-card">
      <div class="history-card__title">Plan History</div>

      <div class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Payment Plan</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.dueDate">
              <td>{{ item.plan }}</td>
              <td>{{ item.amount }}</td>
              <td>{{ item.dueDate }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="{
                    'status-badge--cancelled': item.status === 'Cancelled',
                    'status-badge--pending': item.status === 'Pending',
                    'status-badge--paid': item.status === 'Paid',
                  }"
                >
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
const plans = [
  {
    price: "\u00A330",
    name: "Bright Smile Basic",
    copy: "Includes Annual Comprehensive Check Up",
    features: [
      "Dental Hygiene Appointments",
      "And 10% of all Dental Treatments",
    ],
    active: true,
  },
  {
    price: "\u00A340",
    name: "Radiant Smile Plus",
    copy: "Includes 2 Comprehensive Check Up",
    features: [
      "2 Dental Hygiene Appointments",
      "And 15% of all Dental Treatments",
    ],
    active: false,
  },
  {
    price: "\u00A350",
    name: "Brilliant Smile Premium",
    copy: "Includes 3 Comprehensive Check Up",
    features: [
      "4 Dental Hygiene Appointments",
      "And 15% of all Dental Treatments",
    ],
    active: false,
  },
  {
    price: "\u00A350",
    name: "Brilliant Smile Premium",
    copy: "Includes 3 Comprehensive Check Up",
    features: [
      "4 Dental Hygiene Appointments",
      "And 15% of all Dental Treatments",
    ],
    active: false,
  },
];

const history = [
  { plan: "Bright Smile Basic", amount: "\u00A330", dueDate: "01/08/2025", status: "Cancelled" },
  { plan: "Bright Smile Basic", amount: "\u00A330", dueDate: "01/07/2025", status: "Pending" },
  { plan: "Bright Smile Basic", amount: "\u00A330", dueDate: "01/06/2025", status: "Paid" },
  { plan: "Bright Smile Basic", amount: "\u00A330", dueDate: "01/05/2025", status: "Paid" },
];
</script>

<style scoped lang="scss">
.practice-plan-view {
  padding: 22px 20px 18px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.plan-card {
  border: 1px solid #dfe5ec;
  border-radius: 14px;
  background: #f7f9fc;
  padding: 14px 12px 12px;
  display: flex;
  flex-direction: column;
  min-height: 160px;
}

.plan-card--active {
  background: #ffffff;
}

.plan-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.plan-card__price {
  font-size: 20px;
  font-weight: 700;
  color: #2a2f3a;
}

.plan-card__badge {
  height: 20px;
  padding: 0 10px;
  border-radius: 999px;
  background: #17b26a;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.plan-card__name {
  font-size: 13px;
  font-weight: 700;
  color: #2a2f3a;
  margin-bottom: 8px;
}

.plan-card__copy {
  font-size: 10px;
  font-weight: 600;
  color: #535d6d;
  margin-bottom: 8px;
}

.plan-card__features {
  padding-left: 16px;
  margin: 0 0 12px;
  color: #535d6d;
  font-size: 10px;
  line-height: 1.5;
  flex: 1;
}

.plan-card__action {
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: #0d6efd;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
}

.plan-card__action--active {
  background: #d9d9d9;
  color: #ffffff;
}

.history-card {
  border: 1px solid #dfe5ec;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
}

.history-card__title {
  padding: 12px 12px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #3b4252;
  border-bottom: 1px solid #edf1f5;
}

.history-table-wrap {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  border-bottom: 1px solid #edf1f5;
  border-right: 1px solid #edf1f5;
  padding: 8px 10px;
  text-align: left;
  font-size: 11px;
  color: #5a6576;
}

.history-table th {
  font-size: 10px;
  font-weight: 600;
  color: #757f8f;
}

.history-table th:last-child,
.history-table td:last-child {
  border-right: 0;
}

.history-table tbody tr:last-child td {
  border-bottom: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 20px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.status-badge--cancelled {
  background: #ffe8ea;
  color: #ff6b76;
}

.status-badge--pending {
  background: #fff4d6;
  color: #f59e0b;
}

.status-badge--paid {
  background: #eaf8e6;
  color: #5daf4d;
}

@media (max-width: 1200px) {
  .plans-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .practice-plan-view {
    padding: 16px 14px;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
