<template>
  <div class="app-shell" :style="{ paddingTop: 'var(--trial-banner-height, 0px)' }">
    <v-layout>
      <div v-if="showTrialBanner" ref="trialBanner" class="trial-banner trial-banner--fixed">
        <div class="trial-banner__content">
          We've upgraded you to a free trial of our Soar plan. Explore all the features Flossly has to offer and decide what works best for you
          <span class="trial-banner__pill">{{ daysLeft }} days left on trial!</span>
        </div>
        <v-btn
          size="small"
          variant="outlined"
          class="trial-banner__cta"
          @click="openPricingModal"
        >
          Upgrade
        </v-btn>
      </div>
      <!-- App Bar -->
      <appBar
        :rail="rail"
        :drawer="drawer"
        :user="user"
        @small-screen-drawer="onDrawerChange"
      />
      <!-- side bar -->
      <leftSideBar
        v-if="!(smAndDown && rail)"
        :rail="rail"
        :drawer="drawer"
        :menuItems="menuItems"
        @update:drawer="updateDrawer"
        @update:rail="updateRail"
      />
      <v-main>
        <slot />
      </v-main>
    </v-layout>
    <!-- Pricing Modal Dialog -->
    <v-dialog
      v-if="showPricingDialog"
      v-model="showPricingDialog"
      max-width="980"
      scrollable
      @click:outside="closePricingModal"
    >
      <v-card class="pricing-modal-card rounded-xl d-flex flex-column">
        <div class="pricing-modal-header">
          <v-btn
            icon
            variant="text"
            size="32"
            @click="closePricingModal"
            class="pricing-modal-close"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="pricing-modal-body">
          <PricingModal ref="pricingModalRef" />
        </div>

        <div v-if="!pricingModalRef?.isPaymentOpen" class="modal-actions">
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            size="x-large"
            @click="handleBuyNow"
            class="buy-now-btn"
            height="44"
            width="140"
          >
            Buy Now
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import PricingModal from "@/components/signUpSetup/PricingModal.vue";

const { smAndDown } = useDisplay();
const drawer = ref(true);
const rail = ref(false);
const onDrawerChange = () => {
  drawer.value = !drawer.value ;
};
const updateDrawer = (val) => {
  drawer.value = val;
};
const updateRail = (val) => {
  rail.value = val;
};
watch(
  () => smAndDown.value,
  (isSmall) => {
    if (isSmall) {
      // On mobile, close drawer by default
      drawer.value = false;
    } else {
      // On desktop, open drawer by default
      drawer.value = true;
    }
  },
  { immediate: true } 
);
const { user, isManager, setUser } = useUser();
const mainStore = useMainStore();
const userStore = useUserStore();
const router = useRouter()
const trialBanner = ref(null);
const pricingModalRef = ref(null);
const showPricingDialog = ref(false);
const DEFAULT_TRIAL_BANNER_HEIGHT = 36;

const resolvePreference = () => {
  const raw = user.value || {};
  const pref = raw?.preferences;
  if (Array.isArray(pref)) return pref[0] || {};
  if (pref && typeof pref === "object") return pref;
  return {};
};

const licenseType = computed(() => resolvePreference().licenseType || null);

const trialEndsOn = computed(() => resolvePreference().licenseRenewalDate || null);

const daysLeft = computed(() => {
  if (!trialEndsOn.value) return 14;
  const end = new Date(trialEndsOn.value);
  if (Number.isNaN(end.getTime())) return 14;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
});

const showTrialBanner = computed(
  () => String(licenseType.value || "").toLowerCase() === "trial"
);

const openPricingModal = () => {
  showPricingDialog.value = true;
};

const closePricingModal = () => {
  showPricingDialog.value = false;
  if (pricingModalRef.value?.resetModal) {
    pricingModalRef.value.resetModal();
  }
};

const handleBuyNow = () => {
  if (!pricingModalRef.value) {
    mainStore.setSnackbar({
      title: "Please select a plan to continue.",
      type: "error",
    });
    return;
  }

  const selectedPlanId = pricingModalRef.value?.selectedPlanId;
  if (!selectedPlanId) {
    mainStore.setSnackbar({
      title: "Please select a plan to continue.",
      type: "error",
    });
    return;
  }

  if (pricingModalRef.value?.handleSubscribe) {
    pricingModalRef.value.handleSubscribe(selectedPlanId);
  }
};

const setBannerHeight = (height) => {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--trial-banner-height", `${height}px`);
};

const updateBannerHeight = () => {
  if (!trialBanner.value) {
    setBannerHeight(0);
    return;
  }
  const height = trialBanner.value.getBoundingClientRect().height || 0;
  setBannerHeight(height);
};

let bannerObserver = null;
const observeBanner = () => {
  if (typeof window === "undefined" || !trialBanner.value) return;
  if (bannerObserver) bannerObserver.disconnect();
  bannerObserver = new ResizeObserver(() => updateBannerHeight());
  bannerObserver.observe(trialBanner.value);
  updateBannerHeight();
};

watch(
  showTrialBanner,
  (visible) => {
    if (!visible) {
      if (bannerObserver) bannerObserver.disconnect();
      bannerObserver = null;
      setBannerHeight(0);
      return;
    }
    setBannerHeight(DEFAULT_TRIAL_BANNER_HEIGHT);
    nextTick(() => {
      observeBanner();
      requestAnimationFrame(() => updateBannerHeight());
    });
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (bannerObserver) bannerObserver.disconnect();
  bannerObserver = null;
  setBannerHeight(0);
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateBannerHeight);
  }
});
const menuItems = computed(() => {
  // Read license type to refresh menu when preferences change.
  const licenseType = user.value?.preferences?.licenseType;
  if (!user.value) return [];
  return isManager.value ? mainStore.getManagerOptions : mainStore.getuserOptions;
});
const preloadUsers = async () => {
  try {
    await userStore.getUserList({ roleId: null });
  } catch (e) {
    console.error('Failed to preload users', e);
  }
};
onMounted(async () => {
  if (typeof window !== "undefined") {
    window.addEventListener("resize", updateBannerHeight, { passive: true });
    if (document?.fonts?.ready) {
      document.fonts.ready.then(() => updateBannerHeight()).catch(() => {});
    }
  }
  await preloadUsers();
  if (!user.value && process.client) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return;
    }
  }
  if (!user.value) {
    router.push("/logout");
  }
});

</script>

<style scopped>
.v-list-item__overlay {
  opacity: 0 !important;
}
</style>

<style scoped>
.trial-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 16px;
  background: linear-gradient(90deg, #ff8a4c, #ff7aa9, #6aa9ff);
  color: #ffffff;
  font-size: 12px;
  line-height: 1.4;
  width: 100%;
}

.trial-banner--fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
}

.trial-banner__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.trial-banner__pill {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 600;
}

.trial-banner__cta {
  border-color: rgba(255, 255, 255, 0.6);
  color: #ffffff;
  text-transform: none;
}

/* Pricing Modal Styles */
.pricing-modal-card {
  min-height: 70vh;
  background-color: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.pricing-modal-header {
  display: flex;
  align-items: center;
  justify-content:flex-end;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.pricing-modal-title {
  font-weight: 600;
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.pricing-modal-close {
  min-width: 32px;
  height: 32px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 0 16px 16px;
}

.buy-now-btn {
  min-width: 120px;
  text-transform: none;
  font-size: 14px;
}

.cancel-btn {
  min-width: 100px;
  text-transform: none;
  font-size: 14px;
}

.pricing-modal-body {
  padding: 12px 16px 16px;
  overflow-y: auto;
}

.pricing-modal-card :deep(.pricing-title) {
  font-size: 24px;
  line-height: 1.3;
}

.pricing-modal-card :deep(.pricing-subtitle) {
  font-size: 13px;
  line-height: 1.4;
}

.pricing-modal-card :deep(.plan-name) {
  font-size: 16px;
}

.pricing-modal-card :deep(.plan-desc) {
  font-size: 12px;
}

.pricing-modal-card :deep(.plan-detail-title) {
  font-size: 16px;
}

.pricing-modal-card :deep(.plan-price) {
  font-size: 28px;
}

.pricing-modal-card :deep(.plan-feature-title) {
  font-size: 12px;
}

.pricing-modal-card :deep(.plan-features span) {
  font-size: 12px;
}

.pricing-modal-card :deep(.plan-detail) {
  border-radius: 16px;
}

.pricing-modal-card :deep(.plan-option) {
  border-radius: 16px;
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column;
  }

  .buy-now-btn {
    width: 100%;
  }
}
</style>
