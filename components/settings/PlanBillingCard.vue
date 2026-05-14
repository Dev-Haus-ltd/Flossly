<template>
  <div class="plan-billing">
    <div class="plan-billing__intro">
      <div>
        <p class="plan-billing__eyebrow">Plan &amp; Billing</p>
        <h2 class="plan-billing__title">Choose the plan that fits your practice</h2>
        <p class="plan-billing__subtitle">
          All plans are shown here. Your current subscription is highlighted and
          available actions stay wired to the existing upgrade and billing flows.
        </p>
      </div>

      <div class="plan-billing__status-card">
        <span class="plan-billing__status-label">Current plan</span>
        <strong class="plan-billing__status-name">{{ currentPlan.title }}</strong>
        <span class="plan-billing__status-meta">
          {{ isTrialAccess ? "Trial access" : billingCycle }}
          <template v-if="renewalDate && resolvedTier !== 'Lite'">
            . Renews on {{ renewalDate }}
          </template>
        </span>
      </div>
    </div>

    <div class="plan-billing__grid">
      <PlanTierCard
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

const PLAN_ORDER = {
  Lite: 0,
  CRM: 1,
  Pro: 2,
};

const licenseType = computed(() => authStore.loggedUser?.licenseType ?? "Lite");
const resolvedTier = computed(() => LEGACY_MAP[licenseType.value] ?? licenseType.value);

const isTrialAccess = computed(
  () =>
    ["CRM", "Pro"].includes(resolvedTier.value) &&
    !authStore.loggedUser?.licenseBillingCycle &&
    !!authStore.loggedUser?.licenseRenewalDate,
);

const renewalDate = computed(() => {
  if (!authStore.loggedUser?.licenseRenewalDate) return null;
  return new Date(authStore.loggedUser.licenseRenewalDate).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
});

const billingCycle = computed(() => {
  if (resolvedTier.value === "Lite") return "Free forever";
  if (isTrialAccess.value) return "Trial";
  return authStore.loggedUser?.licenseBillingCycle ?? "Monthly billing";
});

const currentBadgeLabel = computed(() =>
  isTrialAccess.value ? "Current trial" : "Current plan",
);

const plans = computed(() => [
  {
    tier: "Lite",
    title: "FlosslyLite",
    subtitle: "FREE Forever",
    price: "£0",
    description:
      "Perfect for individuals or small teams getting started with FlosslyOS.",
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
    price: "£199 / month",
    description:
      "Ideal for marketing teams and clinics that need a powerful CRM with appointment booking.",
    logo: mainLogo,
    features: [
      "Full Task Management",
      "FlosslyDoc - Unlimited Storage",
      "FlosslyHR - Full Module",
      "FlosslyCRM - Full Lead & Pipeline Management",
      "Appointment Booking Enabled (Only booking features included; no additional modules)",
    ],
  },
  {
    tier: "Pro",
    title: "FlosslyPro",
    subtitle: "For Squad Practice Owners",
    price: "£499 / month",
    description:
      "The complete operating system for modern clinics. Full access. Full control.",
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

const currentPlan = computed(
  () => plans.value.find((plan) => plan.tier === resolvedTier.value) ?? plans.value[0],
);

const hasStripeSubscription = computed(
  () => resolvedTier.value !== "Lite" && !isTrialAccess.value,
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
  if (plan.tier === resolvedTier.value) return !shouldShowManageBilling(plan) && !isTrialAccess.value;
  return isDowngradeOrSameTier(plan);
};

const portalLoading = ref(false);

const openPortal = async () => {
  portalLoading.value = true;
  try {
    const res = await Post("/stripe/portal", { returnUrl: window.location.href });
    if (res?.data?.url) window.location.href = res.data.url;
  } catch {
    mainStore.setSnackbar({
      message: "Could not open billing portal",
      color: "error",
    });
  } finally {
    portalLoading.value = false;
  }
};

const handlePlanAction = (plan) => {
  if (plan.tier === resolvedTier.value) {
    if (shouldShowManageBilling(plan)) {
      openPortal();
      return;
    }
    if (isTrialAccess.value) {
      emit("upgrade");
    }
    return;
  }

  if (!isDowngradeOrSameTier(plan)) {
    emit("upgrade");
  }
};

</script>

<style scoped lang="scss">
.plan-billing {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px 24px 32px;
}

.plan-billing__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.plan-billing__eyebrow {
  margin: 0 0 8px;
  color: #0061fb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.plan-billing__title {
  margin: 0;
  color: #12182f;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
}

.plan-billing__subtitle {
  max-width: 760px;
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
}

.plan-billing__status-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  padding: 18px 20px;
  border: 1px solid #dbe2f0;
  border-radius: 20px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
}

.plan-billing__status-label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-billing__status-name {
  color: #1d2a70;
  font-size: 20px;
  font-weight: 800;
}

.plan-billing__status-meta {
  color: #54607a;
  font-size: 14px;
  line-height: 1.5;
}

.plan-billing__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.plan-billing__usage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1264px) {
  .plan-billing__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 959px) {
  .plan-billing {
    padding: 20px 16px 24px;
  }

  .plan-billing__intro {
    flex-direction: column;
  }

  .plan-billing__title {
    font-size: 28px;
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
