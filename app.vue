<template>
  <div>
    <!-- Initial Auth Check Loader - Shows during initial load and redirect -->
    <div v-if="showAuthLoader" class="auth-loader-overlay">
      <div class="loader">
        <ClientOnly>
          <lottie-player
            src="/Blue.json"
            background="transparent"
            speed="1"
            style="width: 200px; height: 200px"
            loop
            autoplay
          />
        </ClientOnly>
      </div>
    </div>
    
    <NuxtLayout v-if="!showAuthLoader">
      <NuxtPage class="bck-org" />
      <CommonLoader />
      <Snackbar />
      <ClientOnly>
      <div class="floating-buttons" v-if="loggedIn">
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
        @close="addStaffDrawer = false"
        @success="updateTeams"
      />
    </ClientOnly>
    </NuxtLayout>
  </div>
</template>

<script setup>
import { CommonLoader } from "#components";
import { isAuthenticated } from "./lib/auth.js";
import { useAuthCheck } from "./composables/useAuthCheck.js";
import { currentPath } from "./lib/redirect.js";

const loggedIn = computed(() => isAuthenticated());
const route = useRoute();
const { isCheckingAuth, hasCheckedAuth, completeAuthCheck } = useAuthCheck();

// Track if we're waiting for navigation to complete after auth check
const isWaitingForNavigation = ref(false);
// Track if we've initialized client-side
const isClientMounted = ref(false);

// Initialize immediately on client: check if we're on a protected route
if (process.client && typeof window !== 'undefined') {
  const initialPath = window.location.pathname;
  const isProtectedRoute = currentPath(initialPath);
  if (isProtectedRoute) {
    // Only show loader if not authenticated (authenticated users won't see it)
    const hasAuth = isAuthenticated();
    if (!hasAuth) {
      isWaitingForNavigation.value = true;
    }
  }
}

// Show loader during initial auth check for protected routes or during navigation
const showAuthLoader = computed(() => {
  // Always show loader on server (SSR) for protected routes
  if (!process.client) {
    const path = route.path || (typeof window !== 'undefined' ? window.location.pathname : '');
    return currentPath(path);
  }
  
  // On client, check if we should show loader
  const isProtectedRoute = currentPath(route.path);
  
  if (isProtectedRoute) {
    // Always show loader initially if we haven't mounted yet
    if (!isClientMounted.value) {
      return true;
    }
    
    // Show loader if we're checking auth
    if (isCheckingAuth.value) {
      return true;
    }
    
    // Show loader if we're waiting for navigation (redirect in progress)
    if (isWaitingForNavigation.value) {
      return true;
    }
    
    // Show loader if we haven't checked auth yet and we're not authenticated
    if (!hasCheckedAuth.value && !isAuthenticated()) {
      return true;
    }
  }
  
  return false;
});

// Detect when we land on a protected route
onMounted(() => {
  if (process.client) {
    isClientMounted.value = true;
    
    const isProtectedRoute = currentPath(route.path);
    const isAuth = isAuthenticated();
    
    // If we're authenticated on a protected route, hide loader immediately
    if (isProtectedRoute && isAuth) {
      isWaitingForNavigation.value = false;
      if (isCheckingAuth.value) {
        completeAuthCheck();
      }
      return; // Early return for authenticated users
    }
    
    // If we land on a protected route without auth, we'll redirect
    if (isProtectedRoute && !isAuth) {
      isWaitingForNavigation.value = true;
    }
    
    // Give middleware time to process and redirect
    nextTick(() => {
      // Wait for middleware to run and potential redirect
      setTimeout(() => {
        // Check if we're still on protected route or navigated away
        const currentRoute = route.path;
        const stillProtected = currentPath(currentRoute);
        
        if (!stillProtected) {
          // We've been redirected to login
          isWaitingForNavigation.value = false;
          if (isCheckingAuth.value) {
            completeAuthCheck();
          }
        } else if (isAuthenticated()) {
          // We're authenticated and staying on protected route
          isWaitingForNavigation.value = false;
          if (isCheckingAuth.value) {
            completeAuthCheck();
          }
        } else {
          // Still in transition, wait a bit more
          setTimeout(() => {
            isWaitingForNavigation.value = false;
            if (isCheckingAuth.value) {
              completeAuthCheck();
            }
          }, 200);
        }
      }, 150);
    });
  }
});

// Watch for route changes - track navigation and complete check after navigation
watch(() => route.path, (newPath, oldPath) => {
  if (process.client) {
    const isProtectedRoute = currentPath(newPath);
    
    // If we're navigating to a non-protected route, navigation has completed
    if (!isProtectedRoute && isWaitingForNavigation.value) {
      isWaitingForNavigation.value = false;
    }
    
    // Wait for navigation to complete
    nextTick(() => {
      setTimeout(() => {
        isWaitingForNavigation.value = false;
        
        // Complete auth check after navigation settles
        if (isCheckingAuth.value) {
          completeAuthCheck();
        }
      }, 100);
    });
  }
}, { immediate: false });

const bus = useBus();
const drawerOpen = ref(false);
const addStaffDrawer = ref(false);

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


@import "@/node_modules/@syncfusion/ej2-base/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-buttons/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-inputs/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-popups/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-lists/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-navigations/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-splitbuttons/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-dropdowns/styles/material.css";
@import "@/node_modules/@syncfusion/ej2-vue-documenteditor/styles/material.css";

.loader {
  width: 100px;
}

.auth-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999 !important;
  pointer-events: all;
}

.full-page {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
}

.floating-buttons {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 1000;
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
    width: max-content !important;
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
</style>
