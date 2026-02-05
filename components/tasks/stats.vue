<template>
  <div class="bg-white">

    <div class="cust-border d-flex align-center">
  
          <p class="mr-1">Flossy Tasks</p>
     
    </div>
    <div class="main pa-4">
      <v-card
        color="#fff"
        class="pa-1"
        rounded="lg"
        style="border-radius: 20px !important"
        flat
        min-width="100%"
      >
        <div class="d-flex justify-lg-space-between mb-4">
          <p style="color: #1e1e1e; font-size: 14px; font-weight: 600">
            Overview
          </p>
        </div>
  
        <v-row>
   
      <v-col cols="12" sm="4"  md="3" v-for="(stat, i) in taskStatsConfig" :key="i">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"

            hide-chip
          />
          </v-col>
    </v-row>
      </v-card>
  
      <div class="myTeamTasks pa-1 my-6">
        <div class="d-flex align-center mb-4">
          <h3
            class="ma-0"
            style="color: #1e1e1e; font-size: 14px; font-weight: 600"
          >
            My Team Tasks
          </h3>
        </div>
  
        <v-row
          v-if="teamTaskStats && teamTaskStats.length && !showListView"
          dense
        >
          <v-col
            cols="12"
            sm="6"
            md="4"
            lg="3"
            xl="2"
            v-for="(userStat, index) in teamTaskStats"
            :key="index"
          >
            <TasksTeamTaskCountTile :userStat="userStat" @openUserDialog="openUserTaskDialog" />
          </v-col>
        </v-row>
      </div>
    </div>
  </div>


</template>
<script setup>
definePageMeta({
  layout: "home",
});

const teamTaskStats = ref([]);
const taskStore = useTaskStore();
const showListView = ref(false);
const myTaskCounts = ref({});
const user = ref({});

onMounted(() => {
  getTeamTasksStats();
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
  }
});

const getTeamTasksStats = () => {
  taskStore.getMyTeamTaskStats().then((res) => {
    if (res.code === 0) {
      // Filter out dummy dentist users
      const filteredData = res.data.filter((userStat) => {
        const email = userStat.user?.email || '';
        return !(email.includes('dummy-dentist') && email.includes('@flossly.local'));
      });
      
      teamTaskStats.value = filteredData;
      const myStats = filteredData.find((x) => x.user.id === user.value.id);
      myTaskCounts.value = myStats ? myStats.taskStats : {};
    }
  });
};

const openUserTaskDialog = (userStat) => {
  // Navigate to the user task page with user name in query params
  navigateTo({
    path: `/tasks/${userStat.user.id}`,
    query: { name: userStat.user.fullName }
  });
};
const taskStatsConfig = computed(() => [
  {
    icon: "https://cdn.lordicon.com/wwcdwkaf.json",
    label: 'Total Tasks',
    value: myTaskCounts.value.pending
      ? myTaskCounts.value.pending + myTaskCounts.value.completed + myTaskCounts.value.todo
      : 0
  },
  {
    icon: "https://cdn.lordicon.com/uvofdfal.json",
    label: 'Completed Tasks',
    value: myTaskCounts.value.completed
  },
  {
    icon: "https://cdn.lordicon.com/ibjcmcbv.json",
    label: 'In Progress Tasks',
    value: myTaskCounts.value.pending
  },
  {
    icon: "https://cdn.lordicon.com/ibjcmcbv.json",
    label: 'To do',
    value: myTaskCounts.value.todo
  }
])
</script>
<style scoped lang="scss">

.task-head {
  
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}

/* No additional styling - let components display as-is */

</style>
