<template>
  <div v-if="!isPlansLoading && prices && !selectedPriceId" class="pricing-shell">
    <div class="pricing-header">
      <div class="pricing-title">Pricing Plan</div>
      <div class="pricing-subtitle">
        Unlock seamless collaboration across your organisation with Flossly.
      </div>
    </div>
    <div class="pricing-grid">
      <div class="plan-list">
        <button
          v-for="plan in displayPlans"
          :key="plan.id"
          type="button"
          class="plan-option"
          :class="{ selected: plan.id === selectedPlanId, disabled: plan.disabled }"
          :disabled="plan.disabled"
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
          <span class="plan-price">{{ selectedPlan.key === 'lite' ? 'Free' : formatPrice(selectedPlan.displayAmount ?? selectedPlan.unit_amount, selectedPlan.currency) }}</span>
          <span class="plan-price-cycle">{{ selectedPlan.key === 'lite' ? 'forever' : `per ${billingLabel(selectedPlan)}` }}</span>
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

    <div class="payment-actions">
      <v-btn
        v-if="props.showBack"
        variant="text"
        @click="cancelPaymentFlow"
        class="payment-back"
      >
        Back
      </v-btn>
      <v-btn @click="confirmPayment" flat color="primary" :disabled="loading"> Checkout </v-btn>
    </div>
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
    :model-value="isPlansLoading || loading"
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

const props = defineProps({
  showBack: {
    type: Boolean,
    default: false,
  },
});

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

const isPlansLoading = ref(true);


const features = ref([
  {
    type: "Flossy Pro",
    description: "Enterprise-level automation, AI-driven insights, and seamless scaling across multiple sites.",
    badge: "Coming Soon",
    features: [
      "Everything in CRM PLUS",
      "Google Ads integration",
      "AI assistant (task suggestions, smart scheduling)",
      "HR document assistant (AI-generated policies)",
      "Full Payroll + Invoice Management",
      "Dedicated account manager",
      "API & integration support",
    ],
    licenseType: "Pro",
  },
  {
    type: "Flossy CRM",
    description: "WhatsApp messaging, automation, unlimited leads, and patient booking for growing practices.",
    badge: "Most popular",
    features: [
      "Everything in Lite PLUS",
      "WhatsApp Business messaging",
      "CRM automation sequences",
      "Unlimited leads",
      "Patient booking from pipeline",
      "Team task pool",
      "Full diary & appointment management",
    ],
    licenseType: "CRM",
  },
  {
    type: "Flossy Lite",
    description: "Free forever — capture leads, manage tasks, and get started with no commitment.",
    badge: "Free forever",
    features: [
      "Up to 100 leads",
      "Task management",
      "HR essentials (time-off, staff list, docs)",
      "Document management",
      "Basic notifications & onboarding",
      "3 team members",
    ],
    licenseType: "Lite",
  },
]);

const getPlanKey = (plan) => {
  const name = String(plan?.product?.name || "").toLowerCase();
  if (name.includes("soar") || name.includes("pro")) return "pro";
  if (name.includes("glide") || name.includes("crm")) return "crm";
  if (name.includes("drift") || name.includes("lite")) return "lite";
  return "other";
};

const getFeatureKeyFromType = (type) => {
  const name = String(type || "").toLowerCase();
  if (name.includes("soar") || name.includes("pro")) return "pro";
  if (name.includes("glide") || name.includes("crm")) return "crm";
  if (name.includes("drift") || name.includes("lite")) return "lite";
  return "other";
};

const planOrder = { pro: 0, crm: 1, lite: 2, other: 3 };
const planSequence = ["pro", "crm", "lite"];
const selectedPlanId = ref(null);
const getFirstEnabledPlan = (list) =>
  (Array.isArray(list) ? list : []).find((plan) => !plan?.disabled) ||
  (Array.isArray(list) ? list : [])[0] ||
  null;

const displayPlans = computed(() => {
  const list = Array.isArray(prices.value) ? prices.value : [];
  const mapped = list
    .map((plan) => {
      const key = getPlanKey(plan);
      const featureKey = getFeatureKeyFromType(plan.product?.name);
      const displayName =
        key === "pro" ? "Pro"
          : key === "crm" ? "CRM"
          : key === "lite" ? "Lite"
          : plan.product?.name || "Plan";
      const shortName = displayName;
      const badge = key === "crm" ? "Most popular" : key === "lite" ? "Free forever" : "";
      const featureObj = features.value.find((x) => getFeatureKeyFromType(x.type) === featureKey);
      const featureList = featureObj?.features || [];
      const description = featureObj?.description || plan.product?.description || plan.description || "";
      // Lite is the free plan — not purchasable through this modal
      // Hardcoded UI fallbacks until Stripe plans are updated (CRM £199, Pro £499)
      const FALLBACK_PENCE = { crm: 19900, pro: 49900 }
      const displayAmount = key === "lite" ? 0 : (FALLBACK_PENCE[key] ?? plan.unit_amount);
      return {
        ...plan,
        key,
        displayName,
        shortName,
        badge,
        features: featureList,
        description,
        disabled: key === "lite",
        displayAmount,
      };
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
    const crmPlan = list.find((p) => p.key === 'crm' && !p.disabled);
    const fallback = crmPlan || getFirstEnabledPlan(list);
    if (fallback?.id) {
      selectedPlanId.value = fallback.id;
    }
  }
});

onMounted(async () => {
  isPlansLoading.value = true;
  try {
    await fetchPrices();
  } finally {
    isPlansLoading.value = false;
  }
});


// Expose helpers for parent
const isPaymentOpen = computed(() => {
  return Boolean(selectedPriceId.value) && !isPaymentCompleted.value;
});

const cancelPaymentFlow = () => {
  selectedPriceId.value = null;
  if (error.value) error.value = "";
};

const startCheckout = () => {
  if (loading.value) return false;
  const plan = selectedPlan.value;
  if (plan?.id) {
    handleSubscribe(plan.id);
    return true;
  }

  const list = displayPlans.value || [];
  if (!list.length) {
    fetchPrices()
      .then(() => nextTick())
      .then(() => {
        const fallback = getFirstEnabledPlan(displayPlans.value || []);
        if (fallback?.id) {
          selectedPlanId.value = fallback.id;
          handleSubscribe(fallback.id);
        }
      })
      .catch(() => {});
    return true;
  }

  const fallback = getFirstEnabledPlan(list);
  if (!fallback?.id) return false;
  selectedPlanId.value = fallback.id;
  handleSubscribe(fallback.id);
  return true;
};

const resetModal = () => {
  selectedPriceId.value = null;
  selectedPlanId.value = null;
  if (error.value) error.value = "";
};

const startCheckoutForTier = async (tierKey) => {
  const key = String(tierKey || "").toLowerCase();
  if (isPlansLoading.value) {
    await new Promise((resolve) => {
      const stop = watch(isPlansLoading, (loading) => {
        if (!loading) { stop(); resolve(); }
      });
    });
  }
  const plan = displayPlans.value.find((p) => p.key === key && !p.disabled);
  if (!plan?.id) return;
  selectedPlanId.value = plan.id;
  handleSubscribe(plan.id);
};

defineExpose({ isPaymentOpen, cancelPaymentFlow, startCheckout, startCheckoutForTier, resetModal, selectedPriceId, selectedPlanId, isPaymentCompleted, error, loading, handleSubscribe });
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

.plan-option.disabled .plan-name,
.plan-option.disabled .plan-desc {
  color: #888888;
}

.plan-option.disabled {
  background-color: #EBEBEB;
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
  margin-bottom: 8px;
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
  overflow: hidden;
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
  height: calc(530px - 36px - 16px - 120px);
  overflow-y: auto;
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

.payment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-back {
  text-transform: none;
}

@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
</style>
