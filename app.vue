<template>
  <NuxtLayout>
    <NuxtPage class="bck-org" />
    <CommonLoader />
    <Snackbar />
    <div class="floating-buttons" v-if="isAuthenticated()">
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
    v-if="isAuthenticated()"
      v-model="drawerOpen"
      @close="drawerOpen = false"
      @success="updateTasks"
    />
    <TeamFlossSideBarAddNewstaff
    v-if="isAuthenticated()"
      v-model="addStaffDrawer"
      @close="addStaffDrawer = false"
      @success="updateTeams"
    />
  </NuxtLayout>
</template>

<script setup>
import { CommonLoader } from "#components";
import { isAuthenticated } from "./lib/auth.js";

const bus = useBus();
const drawerOpen = ref(false);
const addStaffDrawer = ref(false);

const router = useRouter();
const route = useRoute();

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
  console.log("Open live chat modal here");
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
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Thin.ttf") format("truetype");
  font-weight: 100;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-ThinItalic.ttf") format("truetype");
  font-weight: 100;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-ExtraLight.ttf") format("truetype");
  font-weight: 200;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-ExtraLightItalic.ttf") format("truetype");
  font-weight: 200;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Light.ttf") format("truetype");
  font-weight: 300;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-LightItalic.ttf") format("truetype");
  font-weight: 300;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Italic.ttf") format("truetype");
  font-weight: 400;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Medium.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-MediumItalic.ttf") format("truetype");
  font-weight: 500;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-SemiBold.ttf") format("truetype");
  font-weight: 600;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-SemiBoldItalic.ttf") format("truetype");
  font-weight: 600;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-BoldItalic.ttf") format("truetype");
  font-weight: 700;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-ExtraBold.ttf") format("truetype");
  font-weight: 800;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-ExtraBoldItalic.ttf") format("truetype");
  font-weight: 800;
  font-style: italic;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Black.ttf") format("truetype");
  font-weight: 900;
  font-style: normal;
}

@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-BlackItalic.ttf") format("truetype");
  font-weight: 900;
  font-style: italic;
}
@font-face {
  font-family: "Poppins";
  src: url("@/assets/fonts/Poppins-Thin.ttf") format("truetype");
  font-weight: 100;
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
  background-color: #f5f7f8;
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
  .v-calendar-month__days {
  .v-calendar-month__day {
    // min-height: 100px !important;
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
