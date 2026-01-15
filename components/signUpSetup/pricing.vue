<template>
  <div v-if="prices && !paymentDialogOpen" class="pricing-shell">
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
            <div class="plan-desc">{{ plan.shortSummary }}</div>
          </div>
        </button>
      </div>
      <div class="plan-detail" v-if="selectedPlan">
        <div class="plan-detail-header">
          <div class="plan-detail-title">{{ selectedPlan.displayName }}</div>
        </div>
        <div class="plan-detail-price">
          <span class="plan-price">{{ formatPrice(selectedPlan.unit_amount, selectedPlan.currency) }}</span>
          <span class="plan-price-cycle">per {{ billingLabel(selectedPlan) }}</span>
        </div>
        <div class="plan-feature-title">{{ selectedPlan.shortName }} plan includes:</div>
        <ul class="plan-features">
          <li v-for="(feature, idx) in selectedPlan.features" :key="idx">
            <span class="feature-dot"></span>
            <span>{{ feature }}</span>
          </li>
        </ul>
        <v-btn
          v-if="props.showCta"
          color="primary"
          variant="flat"
          class="plan-cta"
          rounded="lg"
          @click="handleCtaClick"
        >
          Checkout
        </v-btn>
      </div>
    </div>
  </div>
  <v-dialog v-model="paymentDialogOpen" max-width="720" persistent>
    <v-card class="pa-4" :elevation="0" rounded="lg">
      <div class="payment-header">
        <v-card-title class="payment-title">Payment Details</v-card-title>
        <v-btn icon variant="text" @click="cancelPaymentFlow">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text v-if="!isPaymentCompleted">
        <div id="payment-element" class="pa-2" />
        <div v-if="error" class="text-red mt-2">{{ error }}</div>
      </v-card-text>

      <v-card-text v-else>
        <h2 class="payment-success-title">Thank you for choosing Flossly...</h2>
        <p class="payment-success-text">
          You can safely navigate to your Flossly dashboard and start using the
          application.
        </p>
      </v-card-text>

      <v-card-actions class="payment-actions">
        <v-btn
          v-if="!isPaymentCompleted"
          @click="confirmPayment"
          flat
          color="primary"
        >
          Checkout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

const planOrder = { soar: 0, glide: 1, drift: 2, other: 3 };
const planSequence = ["soar", "glide", "drift"];
const selectedPlanId = ref(null);

const planSummaries = {
  soar:
    "Suited for organizations desiring enterprise-level automation, data-driven insights, and seamless scaling across multiple sites.",
  glide:
    "Intended for clinics seeking comprehensive team and compliance management alongside workflow tools.",
  drift:
    "Ideal for small practices needing basic workflow and documentation management without advanced HR or AI.",
};

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
      const featureList =
        features.value.find((x) => getFeatureKeyFromType(x.type) === featureKey)?.features || [];
      return {
        ...plan,
        key,
        displayName,
        shortName,
        shortSummary: planSummaries[key] || plan.product?.description || plan.description || "",
        features: featureList,
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

const handleCtaClick = () => {
  if (!selectedPlan.value) return;
  handleSubscribe(selectedPlan.value.id);
};

const paymentDialogOpen = computed({
  get: () => Boolean(selectedPriceId.value),
  set: (value) => {
    if (!value) {
      cancelPaymentFlow();
    }
  },
});


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
  grid-template-columns: minmax(280px, 360px) minmax(260px, 1fr);
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
  border-radius: 20px;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: 170px;
  width: 100%;
  max-width: 360px;
}

.plan-option.selected {
  border-color: transparent;
  box-shadow: 0 10px 18px rgba(125, 119, 255, 0.18);
  background: linear-gradient(105.87deg, #ffa977 -11.93%, #ff85da 32.01%, #7d77ff 117.29%);
  color: #ffffff;
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
  border-color: #1c2a8c;
  background: #1c2a8c;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.plan-text {
  flex: 1;
}

.plan-name {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.plan-option.selected .plan-name {
  color: #ffffff;
}

.plan-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.plan-option.selected .plan-desc {
  color: #f4f2ff;
}

.plan-detail {
  border: 1px solid #1d5cff;
  border-radius: 20px;
  padding: 18px 20px;
  background: #ffffff;
}

.plan-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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

.feature-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: #1c2a8c;
  flex-shrink: 0;
}

.plan-cta {
  text-transform: none;
  height: 36px;
  min-width: 120px;
  font-size: 13px;
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
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-title {
  padding: 0;
}

.payment-success-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.payment-success-text {
  color: #4b5563;
  font-size: 14px;
}

@media (max-width: 960px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
</style>
