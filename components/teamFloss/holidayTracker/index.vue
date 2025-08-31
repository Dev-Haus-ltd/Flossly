<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Holiday Tracker</p>
    </div>
    <div style="background-color: white" class="px-5 rounded-lg">
      <!-- Tabs -->
      <v-tabs v-model="currentTab" class="custom-tabs" slider-color="primary">
        <v-tab class="tab-text" :value="0"> Calender </v-tab>
        <v-tab class="tab-text" :value="1"> Pending Requests </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item :value="0">
          <TeamFlossHolidayTrackerCalender
            v-if="teamHolidays.length"
            :events="teamHolidays"
            @onUpdate="getTeamHolidays"
          />
        </v-tabs-window-item>

        <v-tabs-window-item :value="1"> </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup>
const userStore = useUserStore();
const teamHolidays = ref([]);
const currentTab = ref(0);

onMounted(() => {
  getTeamHolidays();
});

const getTeamHolidays = () => {
  userStore.getTeamLeaves({}).then((res) => {
    if (res.code === 0) {
      res.data.forEach((el) => {
        el.start = new Date(el.start);
        el.end = new Date(el.end);
      });
      teamHolidays.value = res.data;
    }
  });
};
</script>

<style scoped lang="scss">
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
</style>
