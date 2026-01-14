<template>
  <div v-if="prices && !selectedPriceId" class="pricing-shell">
    <div class="pricing-header">
      <div class="pricing-title">Pricing Plan</div>
      <div class="pricing-subtitle">
        Enhance your team's collaboration and efficiency by inviting new members to your Key Stone platform.
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
            <div class="plan-name">{{ plan.displayName }}</div>
            <div class="plan-desc">{{ plan.product?.description || plan.description || '' }}</div>
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
            <img src="@/assets/icons/checkbox.svg" alt="checkbox" />
            <span>{{ feature }}</span>
          </li>
        </ul>
        <v-btn
          v-if="showCta"
          color="primary"
          variant="flat"
          class="plan-cta"
          rounded="lg"
          @click="handleCtaClick"
        >
          Continue to checkout
        </v-btn>
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
        src="/loader.json"
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

const props = defineProps({
  col: {
    type: String,
    default: "4",
  },
  showCta: {
    type: Boolean,
    default: true,
  },
});

// get license type from localStorage
const user = JSON.parse(localStorage.getItem("user") || "{}");
const licenseType = user?.preferences[0]?.licenseType || null;

const features = ref([
  {
    type: "Flossly - Drift Package",
    features: [
      "Secure User Auth (Login, Registration, Profile, Forgot Password)",
      "Task Management (Assign, Track, Complete - for you & your staff)",
      "HR Essentials(Time-off tracking,Staff list,Profile & policy docs)",
      "Document Management (Folders, Uploads)",
      "Basic Notifications (task updates, onboarding emails)",
    ],
    licenseType: "drift",
  },
  {
    type: "Flossly - Glide Package",
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
    licenseType: "Monthly",
  },
  {
    type: "Flossly - Soar Package",
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

const planOrder = { drift: 0, glide: 1, soar: 2, other: 3 };
const planSequence = ["drift", "glide", "soar"];
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
      const badge = key === "soar" ? "Soar (Full Access)" : "";
      const featureList =
        features.value.find((x) => getFeatureKeyFromType(x.type) === featureKey)?.features || [];
      return { ...plan, key, displayName, shortName, badge, features: featureList };
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

const handleCtaClick = () => {
  if (!selectedPlan.value) return;
  handleSubscribe(selectedPlan.value.id);
};

watch(displayPlans, (list) => {
  if (!selectedPlanId.value && list.length) {
    selectedPlanId.value = list[0].id;
  }
});


const gotoHome = () => {
  const router = useRouter();
  router.push("/");
};

onMounted(fetchPrices);

// Expose helpers for parent (onboarding) to manage back navigation
const isPaymentOpen = computed(() => {
  return Boolean(selectedPriceId.value) && !isPaymentCompleted.value;
});

const cancelPaymentFlow = () => {
  // Reset the selection to go back to pricing cards
  selectedPriceId.value = null;
  // Also clear any previous error state
  if (error.value) error.value = "";
};

const startCheckout = () => {
  if (!selectedPlan.value) return false;
  handleSubscribe(selectedPlan.value.id);
  return true;
};

defineExpose({ isPaymentOpen, cancelPaymentFlow, startCheckout });
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
  font-size: 22px;
  color: #1e1e1e;
}

.pricing-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(260px, 1fr);
  gap: 20px;
  align-items: start;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.plan-option.selected {
  border-color: #f2a3d7;
  box-shadow: 0 8px 16px rgba(242, 163, 215, 0.2);
  background: linear-gradient(135deg, #f6b0da, #f3c6f1);
}

.plan-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #c7c7c7;
  margin-top: 4px;
  background: #ffffff;
}

.plan-radio.selected {
  border-color: #0b5ff2;
  background: #0b5ff2;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.plan-text {
  flex: 1;
}

.plan-name {
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
  margin-bottom: 4px;
}

.plan-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
}

.plan-detail {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 18px 20px;
  background: #ffffff;
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
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.plan-detail-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 12px 0 8px;
}

.plan-price {
  font-weight: 700;
  font-size: 26px;
  color: #111827;
}

.plan-price-cycle {
  font-size: 11px;
  color: #6b7280;
}

.plan-feature-title {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: grid;
  gap: 8px;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}

.plan-features img {
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.plan-cta {
  text-transform: none;
  height: 34px;
  min-width: 90px;
  font-size: 12px;
}

.plan-trial {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
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
