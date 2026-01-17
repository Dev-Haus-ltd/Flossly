<template>
  <NuxtLayout>
    <NuxtPage :key="pageKey" class="bck-org" />
    <CommonLoader />
    <Snackbar />
    <ClientOnly>
    <div class="floating-buttons" v-if="showFloatingButtons">
      <FloatingButtonsQuickActions
        @create-task="handleCreateTask"
        @add-staff="handleAddStaff"
      />
      <FloatingButtonsCustomerSupport
        @chat-support="openChat"
        @call-support="openCall"
        @email-support="openEmail"
      />
    </div>
    <TasksAddTask
    v-if="loggedIn"
      v-model="drawerOpen"
      @close="drawerOpen = false"
      @success="updateTasks"
    />
    <TeamFlossSideBarAddNewstaff
    v-if="loggedIn"
      v-model="addStaffDrawer"
      :rolesList="rolesList"
      @close="addStaffDrawer = false"
      @success="updateTeams"
    />
    <OnboardingPopup
      v-model="showWelcomeDialog"
      max-width="680"
      persistent
      icon-src="/Logoicon2.svg"
      title="Welcome to FlosslyOS"
      subtitle="UK's Number 1 Productivity Software for Dental Clinics"
      primary-label="Done"
      footnote="After your trial ends, you can continue with our Soar plan or choose our Drift or Glide plan."
      @primary="handleWelcomeDone"
      @close="handleWelcomeClose"
    >
      <div class="onboarding-copy">
        <p class="mb-2">
          Let's get started. Complete this 2-minute setup and save 10 hours this week.
        </p>
        <p class="mb-0">
          <strong>We've upgraded you to a free 14-day trial of our Soar plan.</strong>
          Explore all the features Flossly has to offer and decide what works best for you.
        </p>
      </div>
    </OnboardingPopup>
    <OnboardingPopup
      v-model="showVideoDialog"
      max-width="920"
      icon="mdi-play-circle-outline"
      title="Welcome video from the founder"
      @update:model-value="showVideoDialog = $event"
      @close="closeWelcomeVideo"
    >
      <div class="video-wrapper" v-if="welcomeVideoUrl">
        <iframe
          :src="welcomeVideoUrl"
          title="Welcome to FlosslyOS"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div v-else class="video-placeholder">
        Video link not configured yet.
      </div>
    </OnboardingPopup>
    <OnboardingPopup
      :model-value="showInAppDialog"
      
      max-width="680"
      :show-marker="true"
      :icon="inAppIcon"
      :title="activeInAppMessage?.title || ''"
      :primary-label="activeInAppMessage?.primaryLabel || 'Continue'"
      :secondary-label="activeInAppMessage?.secondaryLabel || ''"
      @primary="handleInAppPrimary"
      @secondary="dismissInAppMessage"
      @update:model-value="handleInAppDialogToggle"
      @close="dismissInAppMessage"
    >
      <p class="onboarding-message">
        {{ activeInAppMessage?.message }}
      </p>
    </OnboardingPopup>
  </ClientOnly>
  </NuxtLayout>
</template>

<script setup>
import { CommonLoader } from "#components";
import { isAuthenticated } from "./lib/auth.js";
const authStore = useAuthStore();
const { user, setUser } = useUser();
const config = useRuntimeConfig();
const loggedIn = computed(() => isAuthenticated());
const onboardingUiStorageKey = "flossly_onboarding_ui";
const onboardingShownInSession = new Set();
const DEFAULT_ONBOARDING_VIDEO_URL = "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC";


onMounted(() => {
  
  document.body.classList.add('app-loaded');
  
  
  setTimeout(() => {
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
      appLoader.classList.add('hide');
      setTimeout(() => {
        appLoader.remove();
      }, 300);
    }
  }, 200);
});

const bus = useBus();
const drawerOpen = ref(false);
const addStaffDrawer = ref(false);
const mainStore = useMainStore();
const rolesList = ref([]);

const route = useRoute();
const router = useRouter();
const pageKey = computed(() => `${route.fullPath}-${user.value?.currentLoggedInOrgId || "no-org"}`);

const showWelcomeDialog = ref(false);
const showVideoDialog = ref(false);
const activeInAppMessage = ref(null);
const isDashboardRoute = computed(() => route.name === "index" || route.path === "/");
const showInAppDialog = computed(
  () => !showWelcomeDialog.value && !showVideoDialog.value && !!activeInAppMessage.value
);
const toEmbedUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? "https://www.youtube.com/embed/" + id : raw;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? "https://www.youtube.com/embed/" + id : raw;
    }
  } catch (err) {
  }
  return raw;
};
const welcomeVideoUrl = computed(() => {
  const configured = config.public.ONBOARDING_WELCOME_VIDEO_URL || "";
  return toEmbedUrl(configured || DEFAULT_ONBOARDING_VIDEO_URL);
});
const inAppIcon = computed(() => {
  const key = activeInAppMessage.value?.key || "";
  const map = {
    onboarding_inapp_day2_meta: "mdi-lightbulb-outline",
    onboarding_inapp_day3_automation: "mdi-check-circle-outline",
    onboarding_inapp_day4_noshows: "mdi-calendar-clock-outline",
    onboarding_inapp_day5_recalls: "mdi-bell-badge-outline",
    onboarding_inapp_day6_automation: "mdi-rocket-launch-outline",
    onboarding_inapp_day7_trial: "mdi-star-circle-outline",
    onboarding_inapp_day13_trial: "mdi-alert-circle-outline",
  };
  return map[key] || "mdi-star-four-points-outline";
});
const onboardingUiConfig = computed(() => {
  const parseNumber = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };
  const quietStart = parseNumber(config.public.ONBOARDING_QUIET_HOUR_START);
  const quietEnd = parseNumber(config.public.ONBOARDING_QUIET_HOUR_END);
  const appliesToRaw = String(config.public.ONBOARDING_QUIET_APPLIES_TO || "inapp");
  const quietAppliesTo = appliesToRaw.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    quietStart,
    quietEnd,
    quietAppliesTo,
    capHours: {
      welcome: parseNumber(config.public.ONBOARDING_WELCOME_CAP_HOURS) || 0,
      video: parseNumber(config.public.ONBOARDING_VIDEO_CAP_HOURS) || 0,
      inapp: parseNumber(config.public.ONBOARDING_INAPP_CAP_HOURS) || 0,
    },
  };
});
const getOnboardingUiState = () => {
  if (typeof window === "undefined") return { lastShown: {}, lastShownByKey: {} };
  try {
    const raw = window.localStorage.getItem(onboardingUiStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      lastShown: parsed.lastShown || {},
      lastShownByKey: parsed.lastShownByKey || {},
    };
  } catch (err) {
    return { lastShown: {}, lastShownByKey: {} };
  }
};
const setOnboardingUiState = (state) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(onboardingUiStorageKey, JSON.stringify(state));
};
const isWithinQuietHours = (date, start, end) => {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  const hour = date.getHours();
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
};
const isPopupAllowed = (type, key) => {
  const configState = onboardingUiConfig.value;
  const now = new Date();
  if (configState.quietAppliesTo.includes(type)) {
    if (isWithinQuietHours(now, configState.quietStart, configState.quietEnd)) {
      return false;
    }
  }
  const capHours = configState.capHours[type] || 0;
  if (capHours > 0) {
    const state = getOnboardingUiState();
    const lastShown = state.lastShown?.[type];
    if (lastShown && now.getTime() - Number(lastShown) < capHours * 3600000) {
      return false;
    }
    if (key) {
      const lastByKey = state.lastShownByKey?.[key];
      if (lastByKey && now.getTime() - Number(lastByKey) < capHours * 3600000) {
        return false;
      }
    }
  }
  return true;
};
const markPopupShown = (type, key) => {
  const state = getOnboardingUiState();
  const now = Date.now();
  state.lastShown = { ...(state.lastShown || {}), [type]: now };
  if (key) {
    state.lastShownByKey = { ...(state.lastShownByKey || {}), [key]: now };
  }
  setOnboardingUiState(state);
};
const trackOnboardingUi = (action, payload = {}) => {
  if (typeof window === "undefined") return;
  const detail = { action, ...payload };
  window.dispatchEvent(new CustomEvent("onboarding:ui", { detail }));
  if (window.dataLayer && typeof window.dataLayer.push === "function") {
    window.dataLayer.push({ event: "onboarding_ui", ...detail });
  }
};
const normalizeToken = (val) => String(val || "").toLowerCase();
const matchesTargeting = (msg) => {
  if (!msg) return false;
  const roleTokens = [
    user.value?.role?.name,
    user.value?.roleName,
    user.value?.role,
    user.value?.roleId,
  ]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => normalizeToken(v));
  if (Array.isArray(msg.targetRoles) && msg.targetRoles.length) {
    const targets = msg.targetRoles.map((v) => normalizeToken(v));
    if (!targets.some((t) => roleTokens.includes(t))) return false;
  }
  if (Array.isArray(msg.targetRoutes) && msg.targetRoutes.length) {
    const routeTokens = [route.name, route.path]
      .filter(Boolean)
      .map((v) => normalizeToken(v));
    const targets = msg.targetRoutes.map((v) => normalizeToken(v));
    if (!targets.some((t) => routeTokens.includes(t))) return false;
  }
  if (Array.isArray(msg.targetModules) && msg.targetModules.length) {
    const path = normalizeToken(route.path || "");
    const targets = msg.targetModules.map((v) => `/${normalizeToken(v)}`);
    if (!targets.some((t) => path.startsWith(t))) return false;
  }
  return true;
};

const practiceName = computed(() => {
  const orgId = user.value?.currentLoggedInOrgId;
  const orgs = user.value?.userOrganisations || [];
  const match = orgs.find((org) => Number(org.organisationId) === Number(orgId));
  return match?.organisation?.name || user.value?.organisationName || "your practice";
});

const updateLocalOnboarding = (updates) => {
  const current = user.value || {};
  const onboarding = { ...(current.onboarding || {}), ...updates };
  setUser({ ...current, onboarding });
};

const syncOnboardingState = () => {
  if (!loggedIn.value) {
    showWelcomeDialog.value = false;
    showVideoDialog.value = false;
    activeInAppMessage.value = null;
    return;
  }
  const onboarding = user.value?.onboarding || {};
  const needsWelcomeFlow = Boolean(onboarding.showWelcomePopup || onboarding.showWelcomeVideoPopup);
  if (needsWelcomeFlow && !isDashboardRoute.value) {
    showWelcomeDialog.value = false;
    showVideoDialog.value = false;
    activeInAppMessage.value = null;
    return;
  }
  const wantsWelcome = Boolean(onboarding.showWelcomePopup);
  showWelcomeDialog.value = wantsWelcome && isPopupAllowed("welcome");
  if (showWelcomeDialog.value) {
    if (!onboardingShownInSession.has("welcome")) {
      onboardingShownInSession.add("welcome");
      trackOnboardingUi("shown", { type: "welcome" });
    }
    markPopupShown("welcome");
  }
  const wantsVideo = !showWelcomeDialog.value && Boolean(onboarding.showWelcomeVideoPopup);
  showVideoDialog.value = wantsVideo && isPopupAllowed("video");
  if (showVideoDialog.value) {
    if (!onboardingShownInSession.has("video")) {
      onboardingShownInSession.add("video");
      trackOnboardingUi("shown", { type: "video" });
    }
    markPopupShown("video");
  }
  const messages = Array.isArray(onboarding.inAppMessages)
    ? onboarding.inAppMessages
    : [];
  const eligibleMessages = messages.filter((msg) => matchesTargeting(msg));
  const candidate =
    !showWelcomeDialog.value && !showVideoDialog.value && eligibleMessages.length
      ? eligibleMessages[0]
      : null;
  if (candidate && isPopupAllowed("inapp", candidate.key)) {
    activeInAppMessage.value = candidate;
    const marker = `inapp:${candidate.key}`;
    if (!onboardingShownInSession.has(marker)) {
      onboardingShownInSession.add(marker);
      trackOnboardingUi("shown", { type: "inapp", key: candidate.key });
    }
    markPopupShown("inapp", candidate.key);
  } else {
    activeInAppMessage.value = null;
  }
};

const recordOnboardingEvent = async (key, payload) => {
  try {
    await authStore.recordOnboardingEvent({ key, payload });
  } catch (err) {
  }
};

const handleWelcomeDone = async () => {
  await recordOnboardingEvent("welcome_quiz_done", {
    skipped: true,
    practiceName: practiceName.value,
  });
  trackOnboardingUi("primary", { type: "welcome" });
  updateLocalOnboarding({ showWelcomePopup: false, showWelcomeVideoPopup: true });
  showWelcomeDialog.value = false;
  showVideoDialog.value = true;
};

const handleWelcomeClose = async () => {
  await recordOnboardingEvent("welcome_quiz_done", {
    skipped: true,
    practiceName: practiceName.value,
  });
  trackOnboardingUi("closed", { type: "welcome" });
  updateLocalOnboarding({ showWelcomePopup: false, showWelcomeVideoPopup: true });
  showWelcomeDialog.value = false;
  showVideoDialog.value = true;
};

const closeWelcomeVideo = async () => {
  await recordOnboardingEvent("welcome_video_done", { closedAt: new Date().toISOString() });
  trackOnboardingUi("primary", { type: "video" });
  updateLocalOnboarding({ showWelcomeVideoPopup: false });
  showVideoDialog.value = false;
  syncOnboardingState();
};

const dismissInAppMessage = async () => {
  if (!activeInAppMessage.value) return;
  await recordOnboardingEvent(activeInAppMessage.value.key, { dismissedAt: new Date().toISOString() });
  trackOnboardingUi("dismissed", { type: "inapp", key: activeInAppMessage.value.key });
  const remaining = (user.value?.onboarding?.inAppMessages || []).filter(
    (msg) => msg.key !== activeInAppMessage.value.key
  );
  updateLocalOnboarding({ inAppMessages: remaining });
  syncOnboardingState();
};

const handleInAppPrimary = async () => {
  if (!activeInAppMessage.value) return;
  await recordOnboardingEvent(activeInAppMessage.value.key, { clickedAt: new Date().toISOString() });
  trackOnboardingUi("primary", { type: "inapp", key: activeInAppMessage.value.key });
  const link = activeInAppMessage.value.primaryLink || "";
  const remaining = (user.value?.onboarding?.inAppMessages || []).filter(
    (msg) => msg.key !== activeInAppMessage.value.key
  );
  updateLocalOnboarding({ inAppMessages: remaining });
  syncOnboardingState();
  if (link.startsWith("http")) {
    window.location.href = link;
    return;
  }
  if (link) {
    router.push(link);
  }
};

const handleInAppDialogToggle = (val) => {
  if (!val) {
    dismissInAppMessage();
  }
};

const showFloatingButtons = computed(() => {
  const excludedRoutes = ["onboarding", "login", "signup"];
  return loggedIn.value && !excludedRoutes.includes(route.name);
});

const handleCreateTask = () => {
  addStaffDrawer.value = false;

  drawerOpen.value = true;
};

const handleAddStaff = () => {
  drawerOpen.value = false;

  addStaffDrawer.value = true;
};
const updateTasks = () => {
  drawerOpen.value = false;

  if (route.path === "/tasks/mytasks") {
    bus.emit("updateMyTasks");
  } else if (route.path === "/tasks/teamtasks") {
    bus.emit("updateTeamTasks");
  }
};

const updateTeams = () => {
  addStaffDrawer.value = false;
  if (route.path === "/teams") {
    bus.emit("updateTeams");
  }
};
const openChat = () => {
  console.log("Open live chat modal");
};

const openCall = () => {
  console.log("Trigger call request form");
};

const openEmail = () => {
  console.log("Open email support dialog");
};

const getRoles = () => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data;
      }
    })
    .catch((err) => {
      return err;
    });
};

onMounted(() => {
  if (loggedIn.value) {
    getRoles();
  }
  syncOnboardingState();
});

watch(loggedIn, (newVal) => {
  if (newVal && rolesList.value.length === 0) {
    getRoles();
  }
  syncOnboardingState();
});

watch(user, () => {
  syncOnboardingState();
}, { deep: true });

watch(
  () => route.path,
  () => {
    syncOnboardingState();
  }
);
</script>

<style lang="scss">

@font-face {
  font-family: "Garnett";
  src: url("@/assets/fonts/Garnett/Garnett-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "Inter";
  src: url("@/assets/fonts/Inter/Inter_18pt-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}


.floating-buttons {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: row;
  gap: 2px;
  z-index: 1000;
}
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #000;
}
.video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.video-placeholder {
  padding: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  text-align: center;
  color: #555;
}
.onboarding-copy strong {
  font-weight: 600;
  color: #101828;
}
.onboarding-message {
  margin: 0;
  white-space: pre-line;
  color: #475467;
}
.v-btn__content {
  letter-spacing: normal;
  text-transform: none;
}
.bck-org {
  background-color: white;
}
.cust-field .v-field {
  border-radius: 10px !important;
  /* width: 445.165px; */
}
.v-expansion-panel-text__wrapper {
  padding: 0px !important;
}
.v-table__wrapper {
  table {
    // width: max-content !important;
    tbody tr {
      max-height: 30px !important;
      td {
        max-height: 30px !important;
        padding: 0px !important;
      }
    }
  }
  max-height: 50vh;
  overflow: auto;
  width: 100%;
}
.team-holidays-calender {
  .v-calendar-header {
    padding-left: 20px;
  }
  .v-calendar__container {
    .v-calendar-weekly__head {
      border-bottom: 1px solid lightgray;
    }
  }
  .v-calendar-weekly__day {
    min-height: 100px !important;
    .v-event, .v-event-timed {
      margin: auto !important;
      margin-bottom: 0px !important;
      height: auto !important;
    }

} 
}
.user-dashboard-calender {
  .v-calendar-month__days {
  .v-calendar-month__day {
    min-height: 70px !important;
}
} 
}

@media (min-width: 1400px) and (max-width: 1610px) {
  .v-container {
    max-width: 1400px;
  }
}
@media (min-width: 1611px) and (max-width: 1919.98px) {
  .v-container {
    max-width: 1611px;
  }
}
.v-navigation-drawer__scrim {
    position: fixed !important;
}
</style>
