<template>
  <v-card class="practice-card h-100">
    <v-card-title class="d-flex justify-space-between align-center px-4 py-3">
      <div class="d-flex align-center gap-2">
        <v-btn
          v-if="mdAndDown"
          icon="mdi-menu"
          variant="text"
          size="small"
          @click="toggleSidebar"
        />
        <span>Practice profile</span>
      </div>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" />
    </v-card-title>

    <v-divider />

    <div class="practice-body">
      <!-- Desktop Sidebar -->
      <div v-if="!mdAndDown" class="sidebar-wrapper-desktop">
        <CommonSideBar
          :items="menuItems"
          :selected="selectedSection"
          @select="handleSidebarSelect"
        />
      </div>

      <!-- Mobile/Tablet Sidebar with Backdrop -->
      <template v-if="mdAndDown">
        <!-- Backdrop -->
        <div
          v-if="showMobileSidebar"
          class="mobile-backdrop"
          @click="closeSidebar"
        />
        
        <!-- Sidebar Drawer -->
        <div
          v-if="showMobileSidebar"
          class="sidebar-wrapper-mobile"
        >
          <CommonSideBar
            :items="menuItems"
            :selected="selectedSection"
            @select="handleSidebarSelect"
          />
        </div>
      </template>

      <!-- Main Content -->
      <div class="main-content">
        <component
          v-if="practiceDetails && practiceDetails.id"
          :is="currentComponent"
          :practiceDetails="practiceDetails"
          @updateDetails="getDetails"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDisplay } from "vuetify";

// Import components
import PracticeProfile from "./practiceProfile/index.vue";
import Contact from "./contact/index.vue";
import RoomManagement from "./roomManagement/index.vue";
import ImportantPeople from "./importantPeople/index.vue";
import GroupManagement from "./groupManagement/index.vue";
import Equipment from "./equipment/index.vue";

// Import icons
import profileImg from "@/assets/icons/practiceProfile/profile.svg";
import RoomImg from "@/assets/icons/practiceProfile/room.svg";
import ContactImg from "@/assets/icons/practiceProfile/contact.svg";
import GroupImg from "@/assets/icons/practiceProfile/group.svg";
import ImportantPeopleImg from "@/assets/icons/practiceProfile/importantPeople.svg";

const { mdAndDown } = useDisplay();

const props = defineProps({
  initialSection: {
    type: String,
    default: "profile",
  },
});

const showMobileSidebar = ref(false);
const practiceDetails = ref({});
const selectedSection = ref(props.initialSection);
const orgStore = useOrgStore();

// Sidebar menu items
const menuItems = [
  { key: "profile", label: "Practice Profile", icon: profileImg },
  { key: "contact", label: "Contact Directory", icon: ContactImg },
  {
    key: "equipment",
    label: "Equipment directory",
    icon: ContactImg,
  },
  { key: "room", label: "Room Management", icon: RoomImg },
  { key: "importantPeople", label: "Important People", icon: ImportantPeopleImg },
  { key: "group", label: "Group Management", icon: GroupImg },
];

// Map key → component
const componentsMap = {
  profile: PracticeProfile,
  contact: Contact,
  equipment: Equipment,
  room: RoomManagement,
  importantPeople: ImportantPeople,
  group: GroupManagement,
};

const currentComponent = computed(() => componentsMap[selectedSection.value]);

onMounted(() => {
  getDetails();
});

// Watch for prop changes to update selected section
watch(() => props.initialSection, (newSection) => {
  selectedSection.value = newSection;
});

const getDetails = async () => {
  try {
    const res = await orgStore.getPracticeDetails();

    if (res.code === 0) {
      practiceDetails.value = res.data;
    } else {
      // Handle error with snackbar
      return null;
    }
  } catch (err) {
    // Handle error with snackbar
    return err;
  }
};

// Toggle sidebar
const toggleSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value;
};

// Close sidebar
const closeSidebar = () => {
  showMobileSidebar.value = false;
};

// Handle sidebar selection and auto-close on mobile/tablet
const handleSidebarSelect = (selected) => {
  selectedSection.value = selected;
  
  // Auto-close mobile sidebar after selection
  if (mdAndDown.value) {
    closeSidebar();
  }
};
</script>

<style scoped>
.practice-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.practice-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Desktop Sidebar - Always visible side-by-side */
.sidebar-wrapper-desktop {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
  background: white;
}

/* Mobile/Tablet Backdrop */
.mobile-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

/* Mobile/Tablet Sidebar - Overlay drawer */
.sidebar-wrapper-mobile {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background: white;
  border-right: 1px solid #e0e0e0;
  z-index: 101;
  overflow-y: auto;
  animation: slideInLeft 0.3s ease-in-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Main Content Area */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  min-width: 0;
}

/* Scrollbar styling */
.sidebar-wrapper-desktop::-webkit-scrollbar,
.sidebar-wrapper-mobile::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-track,
.sidebar-wrapper-mobile::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-thumb,
.sidebar-wrapper-mobile::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-thumb:hover,
.sidebar-wrapper-mobile::-webkit-scrollbar-thumb:hover,
.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Responsive padding adjustments */
@media (max-width: 600px) {
  .main-content {
    padding: 0.75rem;
  }
}

@media (max-width: 960px) {
  .main-content {
    padding: 1rem;
  }
}
</style>