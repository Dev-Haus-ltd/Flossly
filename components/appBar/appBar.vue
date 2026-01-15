<template>
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
  <v-app-bar
    elevation="0"
    height="70"
    class="pr-5 cust-border bg-secondary"
    :style="{ top: 'var(--trial-banner-height, 0px)', marginTop: 'var(--trial-banner-height, 0px)' }"
  >
    <v-btn icon class="d-md-none" @click="handleDrawer">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
    <template v-slot:prepend>
      <div 
        :class="
          !rail
            ? 'logo-parent pl-5 bg-secondary'
            : 'logo-parent-sm pl-3 bg-secondary'
        "
      >
        <div class="logo-wrapper">
          <!-- Expanded state: logo + title -->
          <template v-if="!rail">
            <img
              :src="logoIcon"
              alt="My Logo"
              width="35"
              height="100%"
            />
            <span class="text-h6 text-sm-h5 text-md-h5 font-weight-bold text-white ml-4 text-no-wrap">Flossly</span>
          </template>

          <!-- Collapsed state: only icon -->
          <template v-else>
            <img
              :src="logoIcon"
              alt="My Logo"
              width="30"
              height="100%"
            />
          </template>
        </div>
      </div>
    </template>
    <!-- Middle: Spacer to push icons right -->
    <!-- <CommonDashboardHeaderContent
      title="Flossy Dashboard"
      subTitle=" Stay organized, track progress, and collaborate seamlessly with your team. Your tasks, simplified"
    /> -->
    <v-spacer />

    <!-- Right: Icon -->
    <div class="d-flex align-center">
      <CommonRewardChip
        :text="user?.userPoints?.balance"
        tooltip="Reward points"
      />
      <!-- <v-text-field
        placeholder="Search..."
        append-inner-icon="mdi-magnify"
        variant="solo"
        flat
        hide-details
        density="compact"
        bg-color="#F3F6FA"
        rounded="xl"
        class="mx-3"
        style="width: 202px"
      /> -->
      <AppBarNottficationMenu />
      <appBarRightMenu :user="props.user" />
    </div>
  </v-app-bar>
</template>

<script setup>
const { user } = useUser();
import logoIcon from "@/assets/logos/Logoicon2.svg";
const emit = defineEmits(["small-screen-drawer"]);
const router = useRouter();
const trialBanner = ref(null);

const props = defineProps({
  drawer: Boolean,
  user: Object,
  rail: Boolean,
});
const handleDrawer = () => {
  emit("small-screen-drawer",!props.rail);
};
console.log(props.drawer);
watch(
  () => props.drawer,
  (newVal) => {
    console.log("Drawer changed:", newVal);
  }
);

const resolvePreference = () => {
  const raw = props.user || user.value || {};
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

</script>

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

.logo-parent {
  width: 255px;
  /* background-color: black; */
  height: 100%;
  margin-left: 20px; /* spacing from logo */
}
.logo-parent-sm {
  width: 56px;
  /* background-color: black; */
  height: 100%;
}
.cust-border { border-bottom: 1px solid rgba(0,0,0,0.08); }
::v-deep(.v-toolbar__prepend) {
  margin-inline: 0 !important;
}
.logo-wrapper {
  display: flex;
  align-items: center; /* align title vertically with logo */
  height: 100%;
}
</style>
