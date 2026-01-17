<template>
  <v-container class="pricing-page">
    <div class="pricing-shell">
      <div class="pricing-header">
        <h1 class="pricing-title">Pricing Plan</h1>
        <p class="pricing-subtitle">
          Choose the plan that fits your clinic. Upgrade anytime as your team grows.
        </p>
      </div>

      <div class="pricing-content">
        <div class="plan-list">
          <button
            v-for="plan in plans"
            :key="plan.key"
            type="button"
            class="plan-card"
            :class="{ selected: plan.key === selectedKey }"
            @click="selectedKey = plan.key"
          >
            <span class="plan-dot" :class="{ selected: plan.key === selectedKey }"></span>
            <div class="plan-text">
              <div class="plan-name">{{ plan.title }}</div>
              <div class="plan-desc">{{ plan.summary }}</div>
            </div>
          </button>
        </div>

        <div class="plan-detail" v-if="activePlan">
          <div class="detail-title">{{ activePlan.title }}</div>
          <div class="detail-price">
            <span class="price">{{ activePlan.price }}</span>
            <span class="cycle">{{ activePlan.cycle }}</span>
          </div>
          <div class="detail-caption">{{ activePlan.detail }}</div>
          <ul class="detail-list">
            <li v-for="(item, idx) in activePlan.features" :key="idx">
              <span class="detail-bullet"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
const plans = [
  {
    key: "soar",
    title: "Soar (Full Access)",
    summary:
      "Enterprise-grade automation, insights, and full access to every feature.",
    price: "£89",
    cycle: "per month",
    detail: "Soar plan includes:",
    features: [
      "Task management with task pool access",
      "Advanced HR and payroll workflows",
      "AI assistants and content tools",
      "Dedicated onboarding support",
    ],
  },
  {
    key: "glide",
    title: "Glide",
    summary:
      "Comprehensive team management with compliance workflows and advanced tools.",
    price: "£59",
    cycle: "per month",
    detail: "Glide plan includes:",
    features: [
      "Staff management and onboarding flows",
      "Rota scheduling and holiday approvals",
      "Team payroll overview",
      "Organisation reporting tools",
    ],
  },
  {
    key: "drift",
    title: "Drift",
    summary:
      "Simple essentials for smaller practices managing tasks and documents.",
    price: "£29",
    cycle: "per month",
    detail: "Drift plan includes:",
    features: [
      "Core task management",
      "Document storage and templates",
      "Basic notifications",
      "Team collaboration essentials",
    ],
  },
];

const selectedKey = ref("soar");
const activePlan = computed(() =>
  plans.find((plan) => plan.key === selectedKey.value)
);
</script>

<style scoped>
.pricing-page {
  padding: 32px 20px 64px;
}

.pricing-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.pricing-header {
  margin-bottom: 24px;
}

.pricing-title {
  font-size: 32px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0 0 8px;
}

.pricing-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.pricing-content {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(280px, 1fr);
  gap: 24px;
  align-items: start;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid #e3e6ee;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.plan-card.selected {
  border-color: transparent;
  background: linear-gradient(135deg, #ffa977, #ff85da, #7d77ff);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(125, 119, 255, 0.2);
}

.plan-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #c8cdd9;
  position: relative;
  flex-shrink: 0;
  margin-top: 4px;
}

.plan-dot.selected {
  border-color: #1c2a8c;
  background: #1c2a8c;
}

.plan-dot.selected::after {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  top: 4px;
  left: 4px;
}

.plan-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
}

.plan-desc {
  font-size: 12px;
  color: #7c8291;
}

.plan-card.selected .plan-desc {
  color: #f1f1ff;
}

.plan-detail {
  padding: 20px;
  border-radius: 20px;
  border: 1px solid #e3e6ee;
  background: #ffffff;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.detail-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.price {
  font-size: 28px;
  font-weight: 700;
  color: #1e1e1e;
}

.cycle {
  font-size: 12px;
  color: #6b7280;
}

.detail-caption {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 12px;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  color: #1f2937;
}

.detail-bullet {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: #1c2a8c;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .pricing-content {
    grid-template-columns: 1fr;
  }
}
</style>
