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
          @click="goToSubscription"
        >
          Keep Soar
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
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";

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

const goToSubscription = () => {
  router.push("/subscription");
};

const setBannerHeight = (height) => {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--trial-banner-height", `${height}px`);
};

let bannerObserver = null;
const observeBanner = () => {
  if (typeof window === "undefined" || !trialBanner.value) return;
  if (bannerObserver) bannerObserver.disconnect();
  bannerObserver = new ResizeObserver(() => {
    setBannerHeight(trialBanner.value?.offsetHeight || 0);
  });
  bannerObserver.observe(trialBanner.value);
  setBannerHeight(trialBanner.value.offsetHeight || 0);
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
    nextTick(() => observeBanner());
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (bannerObserver) bannerObserver.disconnect();
  bannerObserver = null;
  setBannerHeight(0);
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
</style>
