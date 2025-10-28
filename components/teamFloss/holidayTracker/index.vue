<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Holiday Tracker</p>
    </div>
    <div style="background-color: white" class="px-5 rounded-lg">
      <!-- Tabs -->
      <v-tabs v-model="currentTab" class="custom-tabs" slider-color="primary">
        <v-tab class="tab-text" :value="0"> Calender </v-tab>
        <v-tab class="tab-text" :value="1" v-if="isManager">
          Pending Requests
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item :value="0">
          <TeamFlossHolidayTrackerCalender
            :events="teamHolidays"
            @onUpdate="getTeamHolidays"
          />
        </v-tabs-window-item>

        <v-tabs-window-item :value="1">
          <v-table class="custom-table mt-3" density="comfortable">
            <thead>
              <tr>
                <th style="width: 300px">User</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(leave, index) in teamHolidays" :key="index">
                <td>
                  <div class="px-4" style="width: 300px">
                    <p class="editable-text">
                      {{ leave.user.fullName }}
                    </p>
                  </div>
                </td>
                <td>
                  <div class="px-4">{{ leave.title }}</div>
                </td>
                <td>
                  <div class="px-4">{{ getParsedDate(leave.start) }}</div>
                </td>
                <td>
                  <div class="px-4">{{ getParsedDate(leave.end) }}</div>
                </td>
                <td>
                  <div class="px-4">{{ leave.status }}</div>
                </td>
                <td>
                  <div class="px-4 d-flex align-center cursor-pointer">
                    <v-icon
                      @click="updateStatus('Approved', leave.id)"
                      v-if="leave.status === 'Pending'"
                      class="mr-5"
                      color="primary"
                      >mdi-check-circle-outline</v-icon
                    >
                    <v-icon
                      @click="updateStatus('Rejected', leave.id)"
                      v-if="leave.status === 'Pending'"
                      color="error"
                      >mdi-minus-circle-outline</v-icon
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup>
const { isManager } = useUser();
const userStore = useUserStore();
const mainStore = useMainStore();
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
const getParsedDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const updateStatus = (status, id) => {
  userStore.updateLeaveStatus({ id, status }).then((res) => {
    if (res.code === 0) {
      mainStore.setSnackbar({
        title: "Leave Status updated successfully",
        type: "success",
      });
      getTeamHolidays()
    } else {
      mainStore.setSnackbar({
        title: res.data.message || res.data,
        type: "error",
      });
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
:deep(.v-table__wrapper table) {
  width: 100% !important;
  border-collapse: collapse;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  table-layout: fixed; /* Ensures columns align */
}

.custom-table th,
.custom-table td {
  font-weight: 400;
  font-size: 13px;
  padding: 8px 12px; /* same for both */
  border: 1px solid #dbdbdb;
  text-align: left;
  vertical-align: middle;
}

.custom-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.custom-table tbody tr:hover {
  background-color: #f9f9f9;
}

/* Remove borders overlapping with parent container */
.custom-table th:first-child,
.custom-table td:first-child {
  border-left: none;
}

.custom-table th:last-child,
.custom-table td:last-child {
  border-right: none;
}

.custom-table thead tr:first-child th {
  border-top: none;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
