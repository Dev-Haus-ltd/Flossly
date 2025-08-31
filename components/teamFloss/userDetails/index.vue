<template>
  <div style="background-color: white" class="px-5 rounded-lg">
    <!-- Tabs -->
    <v-tabs
      v-model="currentTab"
      class="custom-tabs"
      slider-color="primary"
    >
      <v-tab class="tab-text" value="profile">
        <img src="@/assets/icons/teamfloss/userDetails/profile.svg" alt="Profile" class="tab-icon" />
        Profile
      </v-tab>

      <v-tab class="tab-text" value="leave">
        <img src="@/assets/icons/teamfloss/userDetails/leave.svg" alt="Leave Management" class="tab-icon" />
        Leave Management
      </v-tab>

      <v-tab class="tab-text" value="documents">
        <img src="@/assets/icons/teamfloss/userDetails/documents.svg" alt="Documents" class="tab-icon" />
        Documents
      </v-tab>

      <v-tab class="tab-text" value="performance">
        <img src="@/assets/icons/teamfloss/userDetails/performance.svg" alt="Performance Management" class="tab-icon" />
        Performance Management
      </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-tabs-window v-model="currentTab">
      <v-tabs-window-item value="profile">
          <TeamFlossUserDetailsProfile :user="user" /> 
      </v-tabs-window-item>

      <v-tabs-window-item value="leave">
          <TeamFlossUserDetailsLeaveManagement :user="user" />
      </v-tabs-window-item>

      <v-tabs-window-item value="documents">
          <TeamFlossUserDetailsDocuments />
      </v-tabs-window-item>

      <v-tabs-window-item value="performance">
          <TeamFlossUserDetailsPerformance />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
const { user } = defineProps({
  user: Object
})
const currentTab = ref("profile");
</script>

<style scoped>
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
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
</style>
