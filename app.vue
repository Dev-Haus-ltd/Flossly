<template>
  <NuxtLayout>
    <NuxtPage :key="pageKey" class="bck-org" />
    <CommonLoader />
    <Snackbar />
    <ClientOnly>
    <div
      ref="floatingEl"
      class="floating-buttons"
      v-if="showFloatingButtons"
      :style="dragStyle"
      :class="{ 'floating-buttons--dragging': isDragging }"
      @click.capture="onFloatingClick"
    >
      <FloatingButtonsQuickActions
        @create-task="handleCreateTask"
        @add-staff="handleAddStaff"
      />
      <FloatingButtonsChatbot v-if="showChatbot" />
      <!-- <FloatingButtonsCustomerSupport
        @chat-support="openChat"
        @call-support="openCall"
        @email-support="openEmail"
      /> -->
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
      :footnote="welcomeFootnote"
      @primary="handleWelcomeDone"
      @close="handleWelcomeClose"
    >
      <div class="onboarding-copy">
        <p class="mb-2">
          Let's get started. Complete this 2-minute setup and save 10 hours this week.
        </p>
        <p class="mb-0">
          <strong>We've upgraded you to a free {{ trialTotalDaysLabel }} {{ welcomeTrialPlanLabel }}.</strong>
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
      @secondary="handleInAppSecondary"
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
import { useFCM } from '~/composables/useFCM';
import { useDraggable, useStorage } from '@vueuse/core';

const authStore = useAuthStore();
const { user, setUser } = useUser();
const config = useRuntimeConfig();
const loggedIn = computed(() => isAuthenticated());
const onboardingUiStorageKey = "flossly_onboarding_ui";
const onboardingShownInSession = new Set();
const DEFAULT_ONBOARDING_VIDEO_URL = "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC";

// Initialize FCM for real-time notifications
const { isSupported, isPermissionGranted, requestPermission } = useFCM();

onMounted(async () => {
  console.log('🔵 app.vue onMounted - client side');
  
  document.body.classList.add('app-loaded');
  
  // Request notification permission on app load
  if (process.client && isSupported.value && !isPermissionGranted.value) {
    console.log('🔔 Requesting notification permission on app load');
    await requestPermission();
  }
  
  // Global listener for FCM notifications - updates badge in real-time
  let fcmDebounceTimeout = null;
  if (process.client) {
    window.addEventListener('fcm-notification', async () => {
      // Debounce to prevent rapid calls
      if (fcmDebounceTimeout) return;
      
      fcmDebounceTimeout = setTimeout(() => {
        fcmDebounceTimeout = null;
      }, 2000); // 2 second debounce
      
      console.log('🔔 [app.vue] FCM notification received, refreshing unread count globally');
      try {
        const response = await $fetch('/api/notifications/get-unread-count');
        const payload = response?.data || response;
        if (payload?.success || response?.success) {
          const globalUnreadCount = useState('notification-unread-count');
          globalUnreadCount.value = payload.unreadCount || 0;
          console.log('🔔 [app.vue] Updated global unread count:', payload.unreadCount);
        }
      } catch (error) {
        console.error('Error refreshing unread count:', error);
      }
    });
  }
  
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

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const resolvePreference = () => {
  const raw = user.value || {};
  const pref = raw?.preferences;
  if (Array.isArray(pref)) return pref[0] || {};
  if (pref && typeof pref === "object") return pref;
  return {};
};

const trialPlanName = computed(() => {
  const license = String(resolvePreference().licenseType || "").trim();
  if (["Drift", "Glide", "Soar"].includes(license)) return license;
  return "";
});

const trialTotalDays = computed(() => {
  const pref = resolvePreference();
  const end = normalizeDate(pref.licenseRenewalDate);
  const start = normalizeDate(pref.createdAt || user.value?.createdAt);
  if (!end || !start) return 14;
  const diff = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
  return Number.isFinite(diff) && diff > 0 ? diff : 14;
});

const trialTotalDaysLabel = computed(() => `${trialTotalDays.value}-day`);

const welcomeFootnote = computed(() => {
  const plan = trialPlanName.value;
  if (plan) {
    return `After your trial ends, you can continue with our ${plan} plan or choose another plan.`;
  }
  return "After your trial ends, you can choose the plan that fits your practice.";
});

const welcomeTrialPlanLabel = computed(() =>
  trialPlanName.value ? `${trialPlanName.value} plan` : "trial"
);

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

const handleInAppSecondary = async () => {
  if (!activeInAppMessage.value) return;
  await recordOnboardingEvent(activeInAppMessage.value.key, { secondaryClickedAt: new Date().toISOString() });
  trackOnboardingUi("secondary", { type: "inapp", key: activeInAppMessage.value.key });
  const link = activeInAppMessage.value.secondaryLink || "";
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

// Draggable floating buttons
const floatingEl = ref(null);
const savedPos = useStorage('floating-buttons-pos', null);

const defaultPos = savedPos.value ?? (
  process.client
    ? { x: window.innerWidth - 148, y: window.innerHeight - 88 }
    : { x: 0, y: 0 }
);

const clampFloatingPosition = (nextX, nextY) => {
  if (!process.client) return { x: nextX, y: nextY };
  const el = floatingEl.value;
  const width = el?.offsetWidth || 140;
  const height = el?.offsetHeight || 64;
  const maxX = Math.max(0, window.innerWidth - width - 8);
  const maxY = Math.max(0, window.innerHeight - height - 8);
  return {
    x: Math.min(Math.max(8, nextX), maxX),
    y: Math.min(Math.max(8, nextY), maxY),
  };
};

const getDefaultFloatingPosition = () => {
  if (!process.client) return { x: 8, y: 8 };
  const el = floatingEl.value;
  const width = el?.offsetWidth || 140;
  const height = el?.offsetHeight || 64;
  return clampFloatingPosition(
    window.innerWidth - width - 20,
    window.innerHeight - height - 20
  );
};

let _dragMoved = false;
let _pointerStart = null;
const DRAG_THRESHOLD = 4;

const { x, y, style: dragStyle, isDragging } = useDraggable(floatingEl, {
  initialValue: defaultPos,
  // capture:true fires our pointerdown handler BEFORE Vuetify v-menu
  // activators can intercept it, fixing the "first grab does nothing" bug.
  capture: true,
  onStart(_pos, event) {
    _pointerStart = { x: event.clientX, y: event.clientY };
    _dragMoved = false;
  },
  onMove(_pos, event) {
    if (_pointerStart) {
      const dist = Math.hypot(
        event.clientX - _pointerStart.x,
        event.clientY - _pointerStart.y
      );
      if (dist >= DRAG_THRESHOLD) _dragMoved = true;
    }
  },
  onEnd(pos) {
    // Clamp to viewport before saving
    const clamped = clampFloatingPosition(pos.x, pos.y);
    x.value = clamped.x;
    y.value = clamped.y;
    savedPos.value = { x: clamped.x, y: clamped.y };
    _pointerStart = null;
    // Safety: reset _dragMoved even if the post-drag click is swallowed
    // by a Vuetify overlay so the next interaction isn't blocked.
    setTimeout(() => { _dragMoved = false; }, 50);
  },
});

const onFloatingResize = () => {
  const adjusted = clampFloatingPosition(x.value, y.value);
  x.value = adjusted.x;
  y.value = adjusted.y;
  savedPos.value = { x: x.value, y: y.value };
};

// Suppress the click that fires after drag-release so menus don't open
const onFloatingClick = (e) => {
  if (_dragMoved) {
    e.preventDefault();
    e.stopPropagation();
    _dragMoved = false;
  }
};



const showChatbot = computed(() => {
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
  const next = savedPos.value
    ? clampFloatingPosition(x.value, y.value)
    : getDefaultFloatingPosition();
  x.value = next.x;
  y.value = next.y;
  if (!savedPos.value) {
    savedPos.value = { x: x.value, y: y.value };
  }
  window.addEventListener('resize', onFloatingResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onFloatingResize);
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
  bottom: auto;
  right: auto;
  display: inline-flex;
  flex-direction: row;
  gap: 2px;
  width: max-content;
  height: max-content;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.floating-buttons img {
  -webkit-user-drag: none;
  user-select: none;
}

.floating-buttons--dragging {
  cursor: grabbing;
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
