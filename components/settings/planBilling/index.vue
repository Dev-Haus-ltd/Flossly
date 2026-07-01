<template>
  <div class="plan-billing">
    <div class="plan-billing__grid">
      <TierCard
        v-for="plan in plans"
        :key="plan.tier"
        :plan="plan"
        :is-active="plan.tier === resolvedTier"
        :badge-label="plan.tier === resolvedTier ? currentBadgeLabel : ''"
        :action-label="getActionLabel(plan)"
        :action-disabled="isActionDisabled(plan)"
        :loading="plan.tier === resolvedTier && shouldShowManageBilling(plan) ? portalLoading : false"
        @action="handlePlanAction(plan)"
      />
    </div>
  </div>
</template>

<script setup>
import TierCard from "./TierCard.vue";
import { Post } from "~/services/apiWrapper";
import liteLogo from "@/assets/logos/Logoicon2.svg";
import mainLogo from "@/assets/logos/logo-blue.svg";

const emit = defineEmits(["upgrade"]);

const authStore = useAuthStore();
const mainStore = useMainStore();

const LEGACY_MAP = {
  System: "Pro",
  Trial: "Lite",
  Drift: "Lite",
  Glide: "CRM",
  Soar: "Pro",
};

const PLAN_ORDER = { Lite: 0, CRM: 1, Pro: 2 };

const licenseType = computed(() => authStore.loggedUser?.licenseType ?? "Lite");
const resolvedTier = computed(() => LEGACY_MAP[licenseType.value] ?? licenseType.value);
const isSystemOrg = computed(() => licenseType.value === "System");

const isTrialAccess = computed(
  () =>
    !isSystemOrg.value &&
    ["CRM", "Pro"].includes(resolvedTier.value) &&
    !authStore.loggedUser?.licenseBillingCycle &&
    !!authStore.loggedUser?.licenseRenewalDate,
);

const currentBadgeLabel = computed(() =>
  isTrialAccess.value ? "Current trial" : "Current plan",
);

const allPlans = computed(() => [
  {
    tier: "Lite",
    title: "FlosslyLite",
    subtitle: "FREE Forever",
    price: "£0",
    description: "Perfect for individuals or small teams getting started with FlosslyOS.",
    logo: liteLogo,
    features: [
      "Task Management - Create and manage basic tasks",
      "FlosslyDoc - Limited document storage",
      "FlosslyHR - Full HR module included",
      "FlosslyCRM - Lead management (Meta integration only)",
      "Flossly Diary - Single diary view",
    ],
  },
  {
    tier: "CRM",
    title: "FlosslyCRM",
    subtitle: "For everyday productivity",
    price: "£169 / month",
    description: "Ideal for marketing teams and clinics that need a powerful CRM with appointment booking.",
    logo: mainLogo,
    features: [
      "Full Task Management",
      "FlosslyDoc - Unlimited Storage",
      "FlosslyHR - Full Module",
      "FlosslyCRM - Full Lead & Pipeline Management",
      "WhatsApp, Automation & Task Pool",
    ],
  },
  {
    tier: "Pro",
    title: "FlosslyPro",
    subtitle: "For Squad Practice Owners",
    price: "£499 / month",
    description: "The complete operating system for modern clinics. Full access. Full control.",
    logo: mainLogo,
    features: [
      "All FlosslyOS modules unlocked",
      "Complete workflow automation",
      "Full CRM + HR + Diary + Docs + Tasks",
      "Advanced integrations & clinic-wide controls",
      "Designed for owners scaling and systemising their practice",
    ],
  },
]);

const plans = computed(() => allPlans.value.filter((plan) => plan.tier !== "Pro"));

const hasStripeSubscription = computed(
  () => !isSystemOrg.value && resolvedTier.value !== "Lite" && !isTrialAccess.value,
);

const shouldShowManageBilling = (plan) =>
  plan.tier === resolvedTier.value && hasStripeSubscription.value;

const isDowngradeOrSameTier = (plan) =>
  PLAN_ORDER[plan.tier] <= PLAN_ORDER[resolvedTier.value];

const getActionLabel = (plan) => {
  if (plan.tier === resolvedTier.value) {
    if (shouldShowManageBilling(plan)) return "Manage billing";
    if (isTrialAccess.value) return "Upgrade";
    return "Active";
  }
  return isDowngradeOrSameTier(plan) ? "Included" : "Upgrade";
};

const isActionDisabled = (plan) => {
  if (plan.tier === resolvedTier.value)
    return !shouldShowManageBilling(plan) && !isTrialAccess.value;
  return isDowngradeOrSameTier(plan);
};

const portalLoading = ref(false);

const openPortal = async () => {
  portalLoading.value = true;
  try {
    const res = await Post("/stripe/portal", { returnUrl: window.location.href });
    if (res?.data?.url) window.location.href = res.data.url;
  } catch {
    mainStore.setSnackbar({ message: "Could not open billing portal", color: "error" });
  } finally {
    portalLoading.value = false;
  }
};

const handlePlanAction = (plan) => {
  if (plan.tier === resolvedTier.value) {
    if (shouldShowManageBilling(plan)) { openPortal(); return; }
    if (isTrialAccess.value) emit("upgrade", plan.tier);
    return;
  }
  if (!isDowngradeOrSameTier(plan)) emit("upgrade", plan.tier);
};
</script>

<style scoped lang="scss">
.plan-billing {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px 24px 32px;
}

.plan-billing__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

@media (max-width: 1100px) {
  .plan-billing__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .plan-billing {
    padding: 20px 16px 24px;
  }

  .plan-billing__intro {
    flex-direction: column;
  }

  .plan-billing__title {
    font-size: 22px;
  }

  .plan-billing__status-card {
    width: 100%;
    min-width: 0;
  }

  .plan-billing__grid {
    grid-template-columns: 1fr;
  }
}
</style>
