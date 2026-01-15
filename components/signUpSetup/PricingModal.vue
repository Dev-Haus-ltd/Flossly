<template>
  <div v-if="prices && !selectedPriceId" class="pricing-shell">
    <div class="pricing-header">
      <div class="pricing-title">Pricing Plan</div>
      <div class="pricing-subtitle">
        Enhance your team's collaboration and efficiency by inviting new members to Flossly.
      </div>
    </div>
    <div class="pricing-grid">
      <div class="plan-list">
        <button
          v-for="plan in displayPlans"
          :key="plan.id"
          type="button"
          class="plan-option"
          :class="{ selected: plan.id === selectedPlanId }"
          @click="selectedPlanId = plan.id"
        >
          <span class="plan-radio" :class="{ selected: plan.id === selectedPlanId }"></span>
          <div class="plan-text">
            <div class="plan-name" :class="{ selected: plan.id === selectedPlanId }">{{ plan.displayName }}</div>
            <div v-if="plan.product?.description || plan.description" class="plan-desc">
              {{ plan.product?.description || plan.description }}
            </div>
          </div>
        </button>
      </div>
      <div class="plan-detail" v-if="selectedPlan">
        <div class="plan-detail-header">
          <span v-if="selectedPlan.badge" class="plan-badge">{{ selectedPlan.badge }}</span>
          <div class="plan-detail-title">{{ selectedPlan.displayName }}</div>
        </div>
        <div class="plan-detail-price">
          <span class="plan-price">{{ formatPrice(selectedPlan.unit_amount, selectedPlan.currency) }}</span>
          <span class="plan-price-cycle">per {{ billingLabel(selectedPlan) }}</span>
        </div>
        <div class="plan-feature-title">{{ selectedPlan.shortName }} plan includes:</div>
        <ul class="plan-features">
          <li v-for="(feature, idx) in selectedPlan.features" :key="idx">
            <img src="@/assets/icons/checkbox_1.svg" alt="checkbox" />
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <v-card
    v-else-if="selectedPriceId && !isPaymentCompleted"
    :elevation="0"
    flat
    rouneded="lg"
    class="pa-4"
  >
    <v-card-title>Payment Details</v-card-title>

    <v-card-text>
      <div id="payment-element" class="pa-2" />
      <div v-if="error" class="text-red">{{ error }}</div>
    </v-card-text>
    <br />

    <v-btn @click="confirmPayment" flat color="primary"> Checkout </v-btn>
  </v-card>
  <v-card
    v-else-if="selectedPriceId && isPaymentCompleted"
    class="pa-5"
    :elevation="0"
    rouneded="lg"
    flat
  >
    <h1>Thankyou for choosing Flossly...</h1>
    <p>
      You can safely navigate to your flossly dashboard and start using the
      application
    </p>
  </v-card>
  <v-overlay
    v-model="loading"
    contained
    class="justify-center align-center full-page"
  >
    <div class="loader">
      <lottie-player
        src="/FlossslyLogoBlue.json"
        background="transparent"
        speed="1"
        style="width: 200px; height: 200px"
        loop
        autoplay
      />
    </div>
  </v-overlay>
</template>

<script setup>
import { useStripe } from "@/composables/useStripe";

const {
  prices,
  selectedPriceId,
  loading,
  isPaymentCompleted,
  error,
  fetchPrices,
  confirmPayment,
  formatPrice,
  handleSubscribe,
} = useStripe();

const features = ref([
  {
    type: "Flossly - Soar Package",
    description: "Suited for organizations desiring enterprise-level automation, data-driven insights, and seamless scaling across multiple sites",
    features: [
      "Everything in Glide PLUS",
      "AI Assistant(AI-generated task suggestions,Smart staff scheduling suggestions)",
      "HR document assistant (AI-generated policies, templates)",
      "Email & social content writing (coming soon)",
      "Full Payroll + Invoice Management(Integrated with QuickBooks)",
      "Dedicated Onboarding + Migration",
      "Dedicated Account Manager",
      "API & Integration Support",
    ],
    licenseType: "soar",
  },
  {
    type: "Flossly - Glide Package",
    description: "Intended for clinics seeking comprehensive team and compliance management alongside workflow tools",
    features: [
      "Full HR Management (Onboarding workflows, policies, reviews)",
      "Organisation Management (Multi-org login, Role-based views)",
      "Staff Management (Add/manage staff, assign tasks)",
      "Advanced Notifications (promos, approvals)",
      "Rota Scheduling (assign/view staff shifts)",
      "Holiday Approvals (by manager)",
      "Team Payroll Overview",
      "Invoicing (Manual, pre-QB)",
    ],
    licenseType: "glide",
  },
  {
    type: "Flossly - Drift Package",
    description: "This package is ideal for small practices needing basic workflow and documentation management, without advanced HR, CRM, or AI automation.",
    features: [
      "Secure User Auth (Login, Registration, Profile, Forgot Password)",
      "Task Management (Assign, Track, Complete - for you & your staff)",
      "HR Essentials(Time-off tracking,Staff list,Profile & policy docs)",
      "Document Management (Folders, Uploads)",
      "Basic Notifications (task updates, onboarding emails)",
    ],
    licenseType: "drift",
  },
]);

const getPlanKey = (plan) => {
  const name = String(plan?.product?.name || "").toLowerCase();
  if (name.includes("soar")) return "soar";
  if (name.includes("glide")) return "glide";
  if (name.includes("drift")) return "drift";
  return "other";
};

const getFeatureKeyFromType = (type) => {
  const name = String(type || "").toLowerCase();
  if (name.includes("soar")) return "soar";
  if (name.includes("glide")) return "glide";
  if (name.includes("drift")) return "drift";
  return "other";
};

const planOrder = { soar: 0, glide: 1, drift: 2, other: 3 };
const planSequence = ["soar", "glide", "drift"];
const selectedPlanId = ref(null);

const displayPlans = computed(() => {
  const list = Array.isArray(prices.value) ? prices.value : [];
  const mapped = list
    .map((plan) => {
      const key = getPlanKey(plan);
      const featureKey = getFeatureKeyFromType(plan.product?.name);
      const displayName =
        key === "soar"
          ? "Soar (Full Access)"
          : key === "glide"
          ? "Glide"
          : key === "drift"
          ? "Drift"
          : plan.product?.name || "Plan";
      const shortName =
        key === "soar" ? "Soar" : key === "glide" ? "Glide" : key === "drift" ? "Drift" : "Plan";
      const badge = "";
      const featureObj = features.value.find((x) => getFeatureKeyFromType(x.type) === featureKey);
      const featureList = featureObj?.features || [];
      const description = featureObj?.description || plan.product?.description || plan.description || "";
      return { ...plan, key, displayName, shortName, badge, features: featureList, description };
    })
    .sort((a, b) => (planOrder[a.key] || 99) - (planOrder[b.key] || 99));
  const planMap = new Map();
  mapped.forEach((plan) => {
    if (planMap.has(plan.key)) return;
    planMap.set(plan.key, plan);
  });
  const ordered = [];
  planSequence.forEach((key) => {
    const plan = planMap.get(key);
    if (plan) ordered.push(plan);
  });
  const extras = [];
  planMap.forEach((plan, key) => {
    if (planSequence.includes(key)) return;
    extras.push(plan);
  });
  extras.sort((a, b) => String(a.displayName || "").localeCompare(String(b.displayName || "")));
  return ordered.concat(extras);
});

const selectedPlan = computed(() =>
  displayPlans.value.find((plan) => plan.id === selectedPlanId.value) ||
  displayPlans.value[0] ||
  null
);

const billingLabel = (plan) => {
  const interval = plan?.recurring?.interval || "month";
  return interval === "year" ? "year" : "month";
};



watch(displayPlans, (list) => {
  if (!selectedPlanId.value && list.length) {
    selectedPlanId.value = list[0].id;
  }
});

onMounted(fetchPrices);

// Expose helpers for parent
const isPaymentOpen = computed(() => {
  return Boolean(selectedPriceId.value) && !isPaymentCompleted.value;
});

const cancelPaymentFlow = () => {
  selectedPriceId.value = null;
  if (error.value) error.value = "";
};

const startCheckout = () => {
  if (!selectedPlan.value) return false;
  handleSubscribe(selectedPlan.value.id);
  return true;
};

const resetModal = () => {
  selectedPriceId.value = null;
  selectedPlanId.value = null;
  if (error.value) error.value = "";
};

defineExpose({ isPaymentOpen, cancelPaymentFlow, startCheckout, resetModal, selectedPriceId, selectedPlanId, isPaymentCompleted, error, loading, handleSubscribe });
</script>

<style scoped>
.pricing-shell {
  width: 100%;
}

.pricing-header {
  margin-bottom: 20px;
}

.pricing-title {
  font-weight: 600;
  font-family: Garnett Semibold, sans-serif;
  font-style: normal;
  font-size: 40px;
  color: #1e1e1e;
  line-height: 130%;
}

.pricing-subtitle {
  font-size: 16px;
  font-weight: 400;
  font-style: normal;
  line-height: 130%;
  color: #8B8B8B;
  margin-top: 4px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(280px, 320px);
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 14px 16px;
  border: 1px solid #DFDFDF;
  border-radius: 20px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  height: 170px;
  min-height: 170px;
  max-height: 170px;
  width: 100%;
  max-width: 360px;
  gap: 8px;
}

.plan-option.selected {
  background: linear-gradient(105.87deg, #FFA977 -11.93%, #FF85DA 32.01%, #7D77FF 117.29%);
}

.plan-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #6D6D6D;
  background: #ffffff;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.plan-radio.selected {
  background: #1E2B80;
}

.plan-radio.selected {
  position: relative;
}

.plan-radio.selected::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.plan-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
  align-items: flex-start;
}

.plan-name {
  font-weight: 700;
  font-size: 20px;
  color: #1E1E1E;
  margin: 0;
  line-height: 1.2;
}

.plan-option.selected .plan-name {
  color: #ffffff;
}

.plan-desc {
  font-family: Inter, sans-serif;
  font-size: 12px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.3;
  letter-spacing: 0;
  color: #8B8B8B;
  margin: 0;
}

.plan-option.selected .plan-desc {
  color: #ffffff;
}

.plan-detail {
  border: 1px solid #DFDFDF;
  border-radius: 20px;
  padding: 18px 20px;
  background: #ffffff;
  height: 530px;
  min-height: 530px;
  max-height: 530px;
  width: 100%;
  max-width: 320px;
}

.plan-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.plan-badge {
  font-size: 10px;
  padding: 4px 8px;
  border: 1px solid #0b5ff2;
  color: #0b5ff2;
  border-radius: 8px;
}

.plan-detail-title {
  font-weight: 500;
  font-style: normal;
  font-family: Inter, sans-serif;
  font-size: 20px;
  line-height: 130%;
  color: #1E1E1E;
}

.plan-detail-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 12px 0 8px;
}

.plan-price {
  font-weight: 600;
  font-size: 40px;
  line-height: 150%;
  color: #1E1E1E;
}

.plan-price-cycle {
  font-size: 16px;
  color: #737373;
  line-height: 150%;
}

.plan-feature-title {
  font-size: 16px;
  color: #737373;
  font-weight: 600;
  margin-bottom: 8px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: grid;
  gap: 8px;
}

.plan-features span {
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 0;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}

.plan-features img {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.plan-cta {
  text-transform: none;
  height: 34px;
  min-width: 90px;
  font-size: 12px;
}

#payment-element {
  min-height: 50px;
  border: 1px solid #e0e0e0;
  padding: 12px;
  border-radius: 6px;
}

#payment-element :deep(.p-Input--empty),
#payment-element :deep(.p-ErrorMessage),
#payment-element :deep(.p-InputError),
#payment-element :deep(.FieldError),
#payment-element :deep([class*="error"]),
#payment-element :deep([class*="ErrorMessage"]),
#payment-element :deep([class*="InputError"]),
#payment-element :deep([class*="FieldError"]) {
  font-family: inherit !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #d32f2f !important;
  line-height: 1.4 !important;
}

#payment-element :deep(.p-InputError::before),
#payment-element :deep(.FieldError::before),
#payment-element :deep([class*="error"]::before) {
  display: none;
}

#payment-element :deep(span[class*="error"]),
#payment-element :deep(div[class*="error"]),
#payment-element :deep(p[class*="error"]),
#payment-element :deep(label[class*="error"]),
#payment-element :deep(*[class*="ErrorMessage"]),
#payment-element :deep(*[class*="InputError"]),
#payment-element :deep(*[class*="FieldError"]) {
  font-family: inherit !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #d32f2f !important;
  line-height: 1.4 !important;
}

@media (max-width: 960px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
</style>