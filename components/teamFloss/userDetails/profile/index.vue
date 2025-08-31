<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-start align-center py-3">
      {{ user?.fullName +"'s Profile"}}
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
        <div class="flex-grow-1" style="margin-left: 220px; height: 60vh">
          <component
            v-if="selectedSection"
            :is="currentComponent"
            :details="mockDetails"
            :user="user"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const { user } = defineProps({
  user: Object,
});
import { ref, computed } from "vue";

// Dummy components for each section
import PersonalInfo from "./personalInformation/index";
import EmploymentDetails from "./employmentDetails/index";

// import your icons here
import PersonalIcon from "@/assets/icons/teamfloss/userDetails/personal.svg";
import EmploymentIcon from "@/assets/icons/teamfloss/userDetails/employment.svg";

// Sidebar menu items
const menuItems = [
  { key: "personal", label: "Personal Information", icon: PersonalIcon },
  { key: "employment", label: "Employment Details", icon: EmploymentIcon },
];

const selectedSection = ref("personal");

// Mock details (replace with API later)
const mockDetails = ref({
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+44 123 456 7890",
  designation: "Software Engineer",
  department: "Development",
  joiningDate: "2021-06-01",
});

// Map key → component
const componentsMap = {
  personal: PersonalInfo,
  employment: EmploymentDetails,
};

const currentComponent = computed(() => componentsMap[selectedSection.value]);
</script>

<style scoped>
.title {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 18px;
}
.sidebar {
  height: 60vh;
  min-width: 200px;

  position: fixed;
}
</style>
