<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      Practice profile
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="px-5 py-0" style="max-height: 100%; overflow: auto">
      <div class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="menuItems"
          :selected="selectedSection"
          @select="selectedSection = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="margin-left: 200px; height: 85vh">
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
import { ref, computed } from "vue";

// Dummy components for each section
import PracticeProfile from "./practiceProfile/index.vue";
import Contact from "./contact/index.vue";
import RoomManagement from "./roomManagement/index.vue";
import ImportantPeople from "./importantPeople/index.vue";
import GroupManagement from "./groupManagement/index.vue";
import Equipment from "./equipment/index.vue";

import profileImg from "@/assets/icons/practiceProfile/profile.svg";
import RoomImg from "@/assets/icons/practiceProfile/room.svg";
import ContactImg from "@/assets/icons/practiceProfile/contact.svg";
import GroupImg from "@/assets/icons/practiceProfile/group.svg";
import ImportantPeopleImg from "@/assets/icons/practiceProfile/importantPeople.svg";

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
</style>
