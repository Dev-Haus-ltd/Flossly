<template>
  <div class="app-shell" :style="{ paddingTop: 'var(--trial-banner-height, 0px)' }">
    <v-layout>
      <div v-if="showTrialBanner" ref="trialBanner" class="trial-banner trial-banner--fixed">
        <div class="trial-banner__content">
          We've upgraded you to a free trial{{ trialPlanName ? ` of our ${trialPlanName} plan` : "" }}. Explore all the features Flossly has to offer and decide what works best for you
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
      max-width="690"
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

        <div v-if="!isModalPaymentOpen" class="modal-actions">
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
    <!-- ── WhatsApp activation banner (persists across navigation) ── -->
    <v-card
      v-if="whapiActivating"
      class="whapi-activation-banner"
      elevation="8"
      rounded="xl"
    >
      <div class="d-flex align-center gap-3 px-4 pt-4 pb-3">
        <div
          class="d-flex align-center justify-center rounded-circle flex-shrink-0"
          style="width:40px;height:40px;background:#e8f5e9"
        >
          <v-icon color="#25D366" size="20">mdi-whatsapp</v-icon>
        </div>
        <div class="flex-grow-1 min-w-0">
          <p class="text-body-2 font-weight-semibold mb-0">Setting up WhatsApp</p>
          <p class="text-caption text-medium-emphasis mb-2">QR code will appear automatically in ~1–2 min</p>
          <v-progress-linear
            :model-value="whapiActivationProgress"
            color="#25D366"
            bg-color="green-lighten-4"
            rounded
            height="5"
          />
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          density="compact"
          class="flex-shrink-0 ml-1"
          @click="dismissActivation"
        >
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </div>
    </v-card>

    <!-- ── WhatsApp QR dialog (persists across navigation) ── -->
    <v-dialog v-model="whapiDialog" max-width="460">
      <v-card class="rounded-xl" elevation="2">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-3">
          <div class="d-flex align-center gap-2">
            <v-icon size="18" color="#25D366">mdi-whatsapp</v-icon>
            <span class="text-subtitle-2 font-weight-semibold">WhatsApp Connection</span>
            <v-chip :color="whapiStatusColor" size="x-small" label class="ml-1">{{ whapiStatusLabel }}</v-chip>
          </div>
          <v-btn icon variant="text" size="small" density="compact" @click="whapiDialog = false">
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="px-5 py-4">
          <div v-if="whapiQr" class="d-flex flex-column align-center gap-3">
            <div style="position:relative;display:inline-block">
              <img
                :src="whapiQr"
                alt="WhatsApp QR"
                style="width:200px;height:200px;border-radius:10px;border:1px solid rgba(0,0,0,0.08);display:block"
              />
            </div>
            <div class="text-center">
              <p class="text-body-2 font-weight-medium mb-1">Scan with WhatsApp</p>
              <p class="text-caption text-medium-emphasis" style="max-width:300px">
                Open WhatsApp → <strong>⋮</strong> Menu (or Settings) →
                <strong>Linked Devices</strong> → <strong>Link a Device</strong>
              </p>
            </div>
            <v-alert type="info" variant="tonal" density="compact" class="w-100 text-caption py-2">
              QR code refreshes automatically — keep this window open while scanning
            </v-alert>
          </div>

          <div v-else-if="whapiDisplayLabel && isWhatsAppConnected" class="d-flex flex-column align-center gap-2 py-3">
            <div
              class="d-flex align-center justify-center rounded-circle"
              style="width:52px;height:52px;background:#e8f5e9"
            >
              <v-icon color="success" size="26">mdi-check</v-icon>
            </div>
            <p class="text-body-2 font-weight-semibold mt-1">WhatsApp Connected</p>
            <p class="text-caption text-medium-emphasis">{{ whapiDisplayLabel }}</p>
          </div>

          <div v-else class="d-flex flex-column align-center gap-3 py-3">
            <v-progress-circular indeterminate color="primary" size="44" width="3" />
            <div class="text-center">
              <p class="text-body-2 font-weight-medium mb-1">{{ whapiSpinnerTitle }}</p>
              <p class="text-caption text-medium-emphasis">{{ whapiSpinnerSubtitle }}</p>
            </div>
            <v-alert
              v-if="isNewChannel"
              type="info"
              variant="tonal"
              density="compact"
              class="w-100 text-caption py-2"
            >
              Do not close this window. The QR code is on its way.
            </v-alert>
            <v-alert
              v-else-if="whapiQrWarning"
              type="warning"
              variant="tonal"
              density="compact"
              class="w-100 text-caption py-2"
            >
              {{ whapiQrWarning }}
            </v-alert>
          </div>
        </div>

        <template v-if="whapiQr">
          <v-divider />
          <div class="d-flex justify-end px-5 py-3">
            <v-btn
              size="small"
              variant="outlined"
              color="grey-darken-1"
              :loading="whapiLoading"
              @click="refreshWhapiQr"
            >
              <v-icon size="13" class="mr-1">mdi-refresh</v-icon>
              Refresh QR
            </v-btn>
          </div>
        </template>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="trialExpiredDialog"
      max-width="640"
      persistent
    >
      <v-card class="trial-expired-card">
        <div class="trial-expired-hero">
          <div class="trial-expired-hero__icon">
            <v-icon size="26">mdi-alert-circle-outline</v-icon>
          </div>
          <div>
            <div class="trial-expired-hero__title">Trial expired for this organisation</div>
            <div class="trial-expired-hero__subtitle">
              Upgrade to keep access, or switch to another organisation with an active license.
            </div>
          </div>
        </div>
        <v-card-text class="trial-expired-body">
          <div v-if="switchableOrgs.length" class="trial-expired-section">
            <div class="trial-expired-section__title">Switch organisation</div>
            <v-list density="compact" class="org-switch-list">
              <v-list-item
                v-for="org in switchableOrgs"
                :key="org.id"
                class="org-switch-item"
                @click="handleOrgSwitch(org)"
              >
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <CommonAvatar :user="org" />
                    <div class="ml-2">
                      <div class="org-switch-item__name">{{ org.name }}</div>
                      <div class="org-switch-item__meta">Active organisation</div>
                    </div>
                  </div>
                  <v-btn size="small" variant="outlined">Switch</v-btn>
                </div>
              </v-list-item>
            </v-list>
          </div>
          <div v-else class="trial-expired-section trial-expired-section--empty">
            No other active organisations found.
          </div>
        </v-card-text>
        <v-card-actions class="trial-expired-actions">
          <v-btn color="primary" variant="flat" @click="openPricingModal">Upgrade now</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import PricingModal from "@/components/signUpSetup/PricingModal.vue";
import { useWhapiStream } from "@/composables/useWhapiStream";

const { smAndDown } = useDisplay();

// ── WhatsApp activation state (shared with overview.vue via composable) ──────
const {
  whapiActivating,
  whapiActivationProgress,
  isNewChannel,
  whapiQr,
  whapiQrWarning,
  whapiDialog,
  isWhatsAppConnected,
  whapiLoading,
  whapiDisplayLabel,
  whapiStatusLabel,
  whapiStatusColor,
  whapiSpinnerTitle,
  whapiSpinnerSubtitle,
  startWhapiStatusStream,
  stopWhapiStatusStream,
  stopActivationProgress,
  stopAllQrTimers,
  dismissActivation,
  refreshWhapiQr,
} = useWhapiStream();
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
const authStore = useAuthStore();
const router = useRouter()
const trialBanner = ref(null);
const pricingModalRef = ref(null);
const showPricingDialog = ref(false);
const trialExpiredDialog = ref(false);
const DEFAULT_TRIAL_BANNER_HEIGHT = 36;

const resolvePreference = () => {
  const raw = user.value || {};
  const pref = raw?.preferences;
  if (Array.isArray(pref)) return pref[0] || {};
  if (pref && typeof pref === "object") return pref;
  return {};
};

const licenseType = computed(() => resolvePreference().licenseType || null);
const trialPlanName = computed(() => {
  const license = String(resolvePreference().licenseType || "").trim();
  if (["Drift", "Glide", "Soar"].includes(license)) return license;
  return "";
});

const trialEndsOn = computed(() => resolvePreference().licenseRenewalDate || null);

const daysLeft = computed(() => {
  if (!trialEndsOn.value) return 14;
  const end = new Date(trialEndsOn.value);
  if (Number.isNaN(end.getTime())) return 14;
  const diff = end.getTime() - Date.now();
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
});

const showTrialBanner = computed(
  () => String(licenseType.value || "").toLowerCase() === "trial"
);

const isTrialExpired = computed(() => {
  if (!showTrialBanner.value) return false;
  if (!trialEndsOn.value) return false;
  const end = new Date(trialEndsOn.value);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
});

const getOrgData = (orgWrapper) => {
  if (orgWrapper?.organisation?.id && orgWrapper?.organisation?.name) {
    return orgWrapper.organisation;
  }
  if (orgWrapper?.id && orgWrapper?.name) {
    return orgWrapper;
  }
  return null;
};

const switchableOrgs = computed(() => {
  const list = user.value?.userOrganisations || [];
  const currentOrgId = user.value?.currentLoggedInOrgId;
  return list
    .filter((org) => org?.status === "Active")
    .map((org) => getOrgData(org))
    .filter((org) => org && Number(org.id) !== Number(currentOrgId));
});

const openPricingModal = () => {
  showPricingDialog.value = true;
};

const isModalPaymentOpen = computed(() => {
  const exposed = pricingModalRef.value?.isPaymentOpen;
  if (typeof exposed === "object" && exposed && "value" in exposed) {
    return Boolean(exposed.value);
  }
  return Boolean(exposed);
});

const closePricingModal = () => {
  showPricingDialog.value = false;
  if (pricingModalRef.value?.resetModal) {
    pricingModalRef.value.resetModal();
  }
};

const handleOrgSwitch = async (org) => {
  if (!org?.id) return;
  try {
    const res = await authStore.switchOrgnanisation({ orgId: org.id });
    if (res?.code !== 0) {
      mainStore.setSnackbar({
        type: "error",
        title: res?.message || res?.data?.message || "Failed to switch organisation",
      });
      return;
    }
    const profile = await authStore.profile();
    if (profile?.code === 0 && profile?.data) {
      setUser(profile.data);
    }
    trialExpiredDialog.value = false;
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err?.message || "An error occurred while switching organisation",
    });
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
  const resolvedPlanId =
    typeof selectedPlanId === "object" && selectedPlanId && "value" in selectedPlanId
      ? selectedPlanId.value
      : selectedPlanId;
  if (!resolvedPlanId) {
    mainStore.setSnackbar({
      title: "Please select a plan to continue.",
      type: "error",
    });
    return;
  }

  if (pricingModalRef.value?.handleSubscribe) {
    pricingModalRef.value.handleSubscribe(resolvedPlanId);
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
  stopWhapiStatusStream();
  stopAllQrTimers();
  stopActivationProgress();
});
const menuItems = computed(() => {
  // Read license type to refresh menu when preferences change.
  const licenseType = user.value?.preferences?.licenseType;
  if (!user.value) return [];
  const items = isManager.value ? mainStore.getManagerOptions : mainStore.getuserOptions;
  return items || [];
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
  // Start SSE here so it persists across page navigation
  startWhapiStatusStream();
});

watch(
  [isTrialExpired, () => router.currentRoute.value?.path, switchableOrgs],
  ([expired, path, orgs]) => {
    if (!expired) {
      trialExpiredDialog.value = false;
      return;
    }
    if (path === "/subscription") return;
    if (!orgs.length) {
      router.push("/subscription");
      return;
    }
    trialExpiredDialog.value = true;
  },
  { immediate: true }
);

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
  padding-right: 20px;
  padding-left: 20px;
  padding-bottom: 20px;
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

.trial-expired-card {
  border-radius: 16px;
  padding: 16px;
}

.trial-expired-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffe6e6, #fef2f2);
  color: #7f1d1d;
}

.trial-expired-hero__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(127, 29, 29, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trial-expired-hero__title {
  font-weight: 600;
  font-size: 16px;
}

.trial-expired-hero__subtitle {
  font-size: 13px;
  color: rgba(127, 29, 29, 0.8);
}

.trial-expired-body {
  padding: 16px 4px 8px;
}

.trial-expired-section__title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.org-switch-list {
  border-radius: 12px;
  background: #f8fafc;
  padding: 4px;
}

.org-switch-item {
  border-radius: 10px;
}

.org-switch-item__name {
  font-weight: 600;
}

.org-switch-item__meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.trial-expired-section--empty {
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

.trial-expired-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 4px 4px;
}

.whapi-activation-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  z-index: 1000;
  border: 1px solid #c8e6c9;
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
