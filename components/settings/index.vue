<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1"
         :style="selectedSetting ? 'color: blue; cursor: pointer;' : ''"
         @click="selectedSetting = null"
      >Settings</p>
      <p v-if="selectedSetting">
        {{ " / " + getSettingTitle(selectedSetting) }}
      </p>
    </div>
    
    <!-- Primary View - Card Grid -->
    <div v-if="!selectedSetting" class="settings-grid pa-8">
      <v-row>
        <!-- SMTP Settings Card -->
        <v-col cols="12" sm="6" md="4" lg="3">
          <div class="settings-card" @click="selectedSetting = 'smtp'">
            <div class="card-content">
              <div class="card-icon-wrapper" style="background-color: #008AFE;">
                <lord-icon
                  src="https://cdn.lordicon.com/gcmzyunj.json"
                  trigger="hover"
                  colors="primary:#ffffff"
                  class="card-icon"
                />
              </div>
              <p class="card-title">SMTP Settings</p>
              <p class="card-subtitle">Email server configuration</p>
            </div>
          </div>
        </v-col>

        <!-- Diary Settings Card -->
        <v-col cols="12" sm="6" md="4" lg="3">
          <div class="settings-card" @click="selectedSetting = 'diary'">
            <div class="card-content">
              <div class="card-icon-wrapper" style="background-color: #FFA977;">
                <lord-icon
                  src="https://cdn.lordicon.com/uoljexdg.json"
                  trigger="hover"
                  colors="primary:#ffffff"
                  class="card-icon"
                />
              </div>
              <p class="card-title">Diary Settings</p>
              <p class="card-subtitle">Appointment configurations</p>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Secondary View - Detailed Settings with Tabs -->
    <div v-else style="background-color: white" class="px-5 rounded-lg">

      <!-- All Settings Tabs -->
      <v-tabs
        v-model="currentTab"
        class="custom-tabs"
        slider-color="primary"
      >
        <v-tab class="tab-text" value="smtp">
          <img src="@/assets/icons/mainDrawerIcons/settings.svg" alt="SMTP Settings" class="tab-icon" />
          SMTP Settings
        </v-tab>
        <v-tab class="tab-text" value="diary">
          <img src="@/assets/images/diary/diary.svg" alt="Diary Settings" class="tab-icon" />
          Diary Settings
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item value="smtp">
          <SettingsItSupport />
        </v-tabs-window-item>
          <v-tabs-window-item value="diary">
  <SettingsDiary />
</v-tabs-window-item>
          <!-- <div class="pa-8 text-center">
            <p class="text-h6 text-grey">Diary settings coming soon...</p>
          </div> -->
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Settings component for roleId 16
const selectedSetting = ref(null); // null = primary view, 'smtp' or 'diary' = secondary view
const currentTab = ref("smtp");

// Get setting title for breadcrumb
const getSettingTitle = (setting) => {
  const titles = {
    smtp: 'SMTP Settings',
    diary: 'Diary Settings'
  };
  return titles[setting] || '';
};

// When clicking a card, set the appropriate tab
watch(selectedSetting, (newVal) => {
  if (newVal === 'smtp') {
    currentTab.value = 'smtp';
  } else if (newVal === 'diary') {
    currentTab.value = 'diary';
  }
});
</script>

<style scoped lang="scss">
.parent {
  background-color: white;
}

.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}

.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}

.custom-tabs .v-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
  color: #1e1e1e !important;
  min-height: 40px;
  min-width: max-content;
}

.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
  color: #1e1e1e !important;
}

.custom-tabs .v-tabs-slider {
  height: 4px;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.settings-grid {
  background-color: white;
  min-height: 80vh;
}

.settings-card {
  position: relative;
  border-radius: 24px;
  padding: 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 200px;
  width: 100%;
  transition: all 0.3s ease;
  border: 1px solid #dbdbdb;
}

.settings-card:hover {
  box-shadow: 0px 8px 28px 0px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  padding: 20px;
}

.card-icon {
  width: 40px;
  height: 40px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: #000000;
  margin: 0;
}

.card-subtitle {
  font-size: 12px;
  font-weight: 400;
  text-align: center;
  color: #737373;
  margin: 0;
}
</style>
