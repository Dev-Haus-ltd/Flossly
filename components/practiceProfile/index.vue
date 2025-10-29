<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-btn
          v-if="smAndDown"
          icon="mdi-menu"
          variant="text"
          class="mr-2"
          @click="showMobileSidebar = !showMobileSidebar"
        />
        <span>Practice profile</span>
      </div>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="px-5 py-0" style="max-height: 100%; overflow: auto">
      <div class="d-flex">
        <!-- Sidebar -->
        <v-slide-x-transition>
          <CommonSideBar
            v-if="!smAndDown || showMobileSidebar"
            :items="menuItems"
            :selected="selectedSection"
            @select="selectedSection = $event"
            class="mr-4 sidebar"
          />
        </v-slide-x-transition>
        <div
          v-if="smAndDown && showMobileSidebar"
          class="mobile-sidebar-backdrop"
          @click="showMobileSidebar = false"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" :style="{ marginLeft: smAndDown ? '0' : '200px', height: '85vh' }">
          <component
            v-if="practiceDetails && practiceDetails.id"
            :is="currentComponent"
            :practiceDetails="practiceDetails"
            @updateDetails="getDetails"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Dummy components for each section
import PracticeProfile from "./practiceProfile/index.vue";
import Contact from "./contact/index.vue";
import RoomManagement from "./roomManagement/index.vue";
import ImportantPeople from "./importantPeople/index.vue";
import GroupManagement from "./groupManagement/index.vue";
import Equipment from "./equipment/index.vue";
import { useDisplay } from "vuetify";


import profileImg from "@/assets/icons/practiceProfile/profile.svg";
import RoomImg from "@/assets/icons/practiceProfile/room.svg";
import ContactImg from "@/assets/icons/practiceProfile/contact.svg";
const { smAndDown } = useDisplay();

import GroupImg from "@/assets/icons/practiceProfile/group.svg";
import ImportantPeopleImg from "@/assets/icons/practiceProfile/importantPeople.svg";
const showMobileSidebar = ref(false);


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

const selectedSection = ref("profile");
const orgStore = useOrgStore();
const practiceDetails = ref({});
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
const getDetails = async () => {
  try {
    const res = await orgStore.getPracticeDetails();

    if (res.code === 0) {
      practiceDetails.value = res.data;
    } else {
      // snack
      return null;
    }
  } catch (err) {
    // snack
    return err;
  }
};
</script>
<style scoped>
.sidebar {
  height: 85vh;
  min-width: 200px;
  top: 65px;
  left: 0;
  position: fixed;
}

@media (max-width: 600px) {
  .sidebar {
    position: fixed;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    width: 80vw;
    min-width: unset;
    background: white;
    z-index: 2001;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  }
  .mobile-sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 2000;
  }
}
</style>
