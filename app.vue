<template>
  <NuxtLayout>
    <NuxtPage class="bck-org" />
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
  </ClientOnly>
  </NuxtLayout>
</template>

<script setup>
import { CommonLoader } from "#components";
import { isAuthenticated } from "./lib/auth.js";
const loggedIn = computed(() => isAuthenticated());


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
});

watch(loggedIn, (newVal) => {
  if (newVal && rolesList.value.length === 0) {
    getRoles();
  }
});
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
</style>