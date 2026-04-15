<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">

    <v-card-title class="title d-flex justify-space-between align-center py-3 px-6">
      <span>Diary Settings</span>

      <!-- <div class="d-flex" style="gap: 12px;">
        <v-btn variant="outlined" @click="resetSettings">Reset</v-btn>
        <v-btn color="primary" @click="saveSettings">Save Settings</v-btn>
      </div> -->
    </v-card-title>

    <v-divider />

    <v-card-text class="px-5 py-0">
      <div class="d-flex">

        <!-- Sidebar -->
        <CommonSideBar
          :items="menuItems"
          :selected="selectedSection"
          @select="selectedSection = $event"
          class="mr-4 sidebar"
        />

        <!-- Dynamic Content -->
        <div class="flex-grow-1 mb-4">
          <component
            :is="currentComponent"
            ref="diaryRef"
            :initial-dentist-id="selectedSection === 'Dentist Schedules' ? route.query.dentistId : null"
          />
        </div>

      </div>
    </v-card-text>

  </v-card>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import AppointmentReason from './appointmentReason/index.vue'
import DentistSchedule from './dentistSchedules/index.vue'
const selectedSection = ref('Appointment Reasons')
const diaryRef = ref(null)
const route = useRoute()

const menuItems = [
  // { key: 'diary', label: 'Diary Settings' },
  { key: 'Appointment Reasons', label: 'Treatment Names' } , 
  { key: 'Dentist Schedules', label: 'Dentist Schedules' }  
]

const componentsMap = {
  // diary: SettingsDiary,
  'Appointment Reasons': AppointmentReason,  
  'Dentist Schedules': DentistSchedule
}

const currentComponent = computed(() => componentsMap[selectedSection.value])

const saveSettings = async () => {
  if (diaryRef.value?.saveSettings) {
    await diaryRef.value.saveSettings()
  }
}

const resetSettings = () => {
  if (diaryRef.value?.resetSettings) {
    diaryRef.value.resetSettings()
  }
}

watch(
  () => route.query.diarySection,
  (section) => {
    if (section && componentsMap[section]) {
      selectedSection.value = section
    }
  },
  { immediate: true }
)
</script>
<style scoped >
.title {
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 18px;
}

.sidebar {
  height: 60vh;
  min-width: 200px;
}
</style>
