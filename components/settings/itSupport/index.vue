<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-space-between align-center py-3 px-6">
      <span>SMTP Settings</span>
      <div class="d-flex" style="gap: 12px;">
        <v-btn
          variant="outlined"
          @click="testConnection"
          :loading="testing"
          class="px-6"
        >
          Test Connection
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveSettings" 
          :loading="saving"
          class="px-6"
        >
          Save Settings
        </v-btn>
      </div>
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
        <div class="flex-grow-1" style="height: 60vh">
          <component
            v-if="selectedSection"
            :is="currentComponent"
            ref="smtpComponentRef"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';

// Import components
import SmtpSettings from './smtpSettings/index.vue';

// Sidebar menu items
const menuItems = [
  { key: 'smtp', label: 'SMTP Configuration', icon: null },
];

const selectedSection = ref('smtp');
const smtpComponentRef = ref(null);
const testing = ref(false);
const saving = ref(false);

// Map key → component
const componentsMap = {
  smtp: SmtpSettings,
};

const currentComponent = computed(() => componentsMap[selectedSection.value]);

const isFormValid = ref(true); // Just enable buttons for now

const testConnection = async () => {
  if (smtpComponentRef.value) {
    testing.value = true;
    try {
      await smtpComponentRef.value.testConnection();
    } finally {
      testing.value = false;
    }
  }
};

const saveSettings = async () => {
  if (smtpComponentRef.value) {
    saving.value = true;
    try {
      await smtpComponentRef.value.saveSettings();
    } finally {
      saving.value = false;
    }
  }
};
</script>

<style scoped>
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
