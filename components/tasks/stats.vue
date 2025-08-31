<template>
  <div class="cust-border py-2 px-5">
    <v-row align="center">
      <v-col cols="6">
        <h3 class="task-head">Flossy Dashboard</h3>
      </v-col>
      
    </v-row>
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
    <CommonStatCard 
      v-for="(stat, i) in taskStatsConfig"
      :key="i"
      :icon="stat.icon"
      :label="stat.label"
      :value="stat.value"
    />
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
          sm="12"
          md="3"
          lg="3"
          xl="2"
          v-for="(userStat, index) in teamTaskStats"
          :key="index"
        >
          <TasksTeamTaskCountTile :userStat="userStat" />
        </v-col>
      </v-row>
    </div>
  </div>

  <TasksAddTask
    v-model="drawerOpen"
    @success="getTeamTasks()"
    @close="drawerOpen = false"
  />
</template>
<script setup>
definePageMeta({
  layout: "home",
});

const teamTaskStats = ref([]);
const taskStore = useTaskStore();
const drawerOpen = ref(false);
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
  drawerOpen.value = false;
  taskStore.getMyTeamTaskStats().then((res) => {
    if (res.code === 0) {
      teamTaskStats.value = res.data;
      myTaskCounts.value = res.data.find(
        (x) => x.user.id === user.value.id
      ).taskStats;
    }
  });
};
const taskStatsConfig = computed(() => [
  {
    icon: "https://cdn.lordicon.com/qtdtmioh.json",
    label: 'Total Tasks',
    value: myTaskCounts.value.pending
      ? myTaskCounts.value.pending + myTaskCounts.value.completed + myTaskCounts.value.upcoming
      : 0
  },
  {
    icon: "https://cdn.lordicon.com/txshdzva.json",
    label: 'Completed Tasks',
    value: myTaskCounts.value.completed
  },
  {
    icon: "https://cdn.lordicon.com/cvcslrjt.json",
    label: 'In Progress Tasks',
    value: myTaskCounts.value.pending
  },
  {
    icon: "https://cdn.lordicon.com/cvcslrjt.json",
    label: 'Upcoming Tasks',
    value: myTaskCounts.value.upcoming
  }
])
</script>
<style scoped lang="scss">

.task-head {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
}

</style>
