<template>
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">My Tasks</p>
    </div>
    <div class="pa-5 rounded-lg">
      <div class="task-summary">
        <!-- Cards Grid -->
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="3"
            lg="2"
            v-for="(item, i) in taskStats"
            :key="i"
          >
            <CommonStatCard
              :icon="getIcon(item.categoryName)"
              :label="item.categoryName"
              :value="item.taskCount"
              :uid="i"
              hide-chip
            />
          </v-col>
        </v-row>
      </div>
      <v-tabs
        v-model="currentTab"
        class="custom-tabs mt-5"
        slider-color="primary"
      >
        <v-tab
          v-for="(cat, index) in taskStats"
          :value="cat.categoryId"
          :key="index"
          class="tab-text"
          @click="updateTasksList"
          >{{ cat.categoryName }}</v-tab
        >

        <!-- Plus Button Tab -->
        <v-tab
          class="tab-text d-flex align-center justify-center"
          style="min-width: 40px; padding: 0 8px"
          @click="addNewCategoryDialog"
        >
          <v-icon size="20">mdi-plus</v-icon>
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item :value="currentTab">
          <TasksListView
            v-if="
              taskStatuses.length &&
              taskPriorities.length &&
              userList.length &&
              categories.length
            "
            :clearSelection="isTrayHidden"
            :headers="headers"
            :availableHeaders="availableHeaders"
            :taskDetails="taskDetails"
            :orgStatuses="taskStatuses"
            :priorities="taskPriorities"
            :users="userList"
            :categories="categories"
            @onFilter="applyFilters"
            @onUpdate="updateTasks"
            @updateSelectedRowItems="updateSelectedRowItems"
          />
        </v-tabs-window-item>
        <v-card
          v-if="selectedRowItems.length"
          class="action-bar py-4 d-flex justify-center align-center rounded-lg"
          :style="{
            padding: xs ? '0px 20px' : '0px 50px',
            gap: xs ? '10px' : '40px',
          }"
          :elevation="5"
          flat
        >
          <div class="selected-count d-flex align-center">
            <span class="selected-text">
              {{ selectedRowItems.length }}
            </span>
            <p class="ml-3 mt-1">Items Selected</p>
          </div>

          <div
            class="action-item d-flex flex-column align-center"
            @click="handleDelete"
          >
            <v-icon size="24">mdi-delete-outline</v-icon>
            <span class="action-label">Delete</span>
          </div>

          <div
            class="action-item d-flex flex-column align-center"
            @click="handleArchive"
          >
            <v-icon size="24">mdi-archive-outline</v-icon>
            <span class="action-label">Archive</span>
          </div>

          <div
            class="action-item d-flex flex-column align-center"
            @click="handleComplete"
          >
            <v-icon size="24">mdi-check-circle-outline</v-icon>
            <span class="action-label">Complete</span>
          </div>

          <v-divider vertical class="ml-4" />

          <div
            class="action-item d-flex flex-column align-center"
            @click="hideTray()"
          >
            <v-icon size="24">mdi-close</v-icon>
          </div>
        </v-card>
      </v-tabs-window>
      <CommonAddCategorySideBar
        v-model="addCategoryDialog"
        @close="addCategoryDialog = false"
        :categories="categories"
      />
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
const bus = useBus();
// Stores
const { xs } = useDisplay();
const taskStore = useTaskStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const userStore = useUserStore();
//Variables
const taskDetails = ref([]);
const headers = ref([]);
const taskStatuses = ref([]);
const taskPriorities = ref([]);
const currentTab = ref(0);
const categories = ref([]);
const taskStats = ref([]);
const user = ref(null);
const userList = ref([]);
const addCategoryDialog = ref(false);
const isTrayHidden = ref(false);

onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
  if (user && user.preferences) {
    headers.value = user.preferences.taskTableColumns;
  } else {
    headers.value = mainStore.getTeamTaskTableHeaders;
  }
  getCategories();
  getMyStats();
  getTaskPriorities();
  getTaskStatuses();
  getUsers();
});

watch(currentTab.value, (newVal) => {
  getMyTasks(newVal);
});

const updateTasks = () => {
  getMyStats();
};
bus.on("updateMyTasks", updateTasks);
const availableHeaders = computed(() => {
  return mainStore.getTeamTaskAllHeaders;
});
const getIcon = (categoryName) => {
  switch (categoryName) {
    case "Marketing":
      return "https://cdn.lordicon.com/excswhey.json";
    case "Staff Management":
      return "https://cdn.lordicon.com/kphwxuxr.json";
    case "Finance":
      return "https://cdn.lordicon.com/tzynxkwl.json";
    case "Compliance":
      return "https://cdn.lordicon.com/yraqammt.json";
    default:
      return "https://cdn.lordicon.com/qlpudrww.json"; // fallback
  }
};
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) userList.value = res.data;
  });
};

const addNewCategoryDialog = () => {
  addCategoryDialog.value = true;
};

const applyFilters = (filters) => {
  filters.categoryId = currentTab.value;
  taskStore
    .tasksGroupedByStatus(filters)
    .then((res) => {
      if (res.code === 0) {
        taskDetails.value = sortByCustomStatus(res.data);
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};
const getCategories = () => {
  taskStore.listCategories().then((res) => {
    if (res.code === 0) {
      categories.value = res.data;
    }
  });
};

const getMyStats = () => {
  taskStore.getMyTaskStatsByCategory().then((res) => {
    if (res.code === 0) {
      if (!currentTab.value) {
        currentTab.value = res.data[0].categoryId;
      }
      taskStats.value = res.data;
      getMyTasks(currentTab.value);
    }
  });
};

const getTaskStatuses = () => {
  orgStore
    .getTaskStatuses()
    .then((res) => {
      if (res.code === 0) {
        taskStatuses.value = res.data;
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};

const getTaskPriorities = () => {
  orgStore
    .getTaskPriorities()
    .then((res) => {
      if (res.code === 0) {
        taskPriorities.value = res.data;
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};
const updateTasksList = () => {
  selectedRowItems.value = [];
  getMyTasks(currentTab.value);
};
function sortByCustomStatus(arr) {
  const order = ["upcoming", "todo", "progress", "cancelled", "completed"];
  const priority = Object.fromEntries(
    order.map((status, index) => [status, index])
  );

  return [...arr].sort((a, b) => {
    const aPriority = priority[a.status?.toLowerCase()] ?? Infinity;
    const bPriority = priority[b.status?.toLowerCase()] ?? Infinity;
    return aPriority - bPriority;
  });
}
const getMyTasks = (categoryId) => {
  taskStore
    .tasksGroupedByStatus({ categoryId })
    .then((res) => {
      if (res.code === 0) {
        taskDetails.value = sortByCustomStatus(res.data);
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};
const selectedRowItems = ref([]);
const hideTray = () => {
  selectedRowItems.value = [];
  isTrayHidden.value = true;
};
const updateSelectedRowItems = (items) => {
  isTrayHidden.value = false;
  selectedRowItems.value = items;
};
const handleDelete = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to delete.",
      type: "warning",
    });
    return;
  }
  const ids = selectedRowItems.value.map((item) => item.id);
  try {
    const res = await taskStore.unAssignBulkTasks({
      userTasksIds: ids,
    });

    if (res.code === 0) {
      updateTasksList();
      mainStore.setSnackbar({
        title: "Tasks unassigned successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title:
          res.data?.message ||
          res.message ||
          "Unable to unassign tasks. Please try again.",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title:
        err.message || "An unexpected error occurred. Please try again later.",
      type: "error",
    });
  }
};

const handleArchive = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to archive.",
      type: "warning",
    });
    return;
  }

  const ids = selectedRowItems.value.map((item) => item.id);

  try {
    const res = await taskStore.archieveBulkTasks({
      userTasksIds: ids,
    });

    if (res.code === 0) {
      updateTasksList();
      mainStore.setSnackbar({
        title: "Tasks archived successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title:
          res.data?.message ||
          res.message ||
          "Unable to archive tasks. Please try again.",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title:
        err.message || "An unexpected error occurred. Please try again later.",
      type: "error",
    });
  }
};

const handleComplete = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to complete.",
      type: "warning",
    });
    return;
  }

  const ids = selectedRowItems.value.map((item) => item.id);

  try {
    const res = await taskStore.completeBulkTasks({
      userTasksIds: ids,
    });

    if (res.code === 0) {
      updateTasksList();
      mainStore.setSnackbar({
        title: "Tasks marked as completed successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title:
          res.data?.message ||
          res.message ||
          "Unable to complete tasks. Please try again.",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title:
        err.message || "An unexpected error occurred. Please try again later.",
      type: "error",
    });
  }
};
</script>

<style scoped>
.page-title {
  font-weight: 400;
  font-size: 28px;
  line-height: 100%;
  color: #1e1e1e;
}

.page-description {
  font-weight: 400;
  font-size: 13px;
  line-height: 130%;
  color: #6d6d6d;
  width: 90%;
}

.task-card {
  border-radius: 8px;
  border: 1px solid #dbdbdb;
}

.card-number {
  font-weight: 600;
  font-size: 24px;
  color: #1e1e1e;
}

.card-label {
  font-weight: 400;
  font-size: 13px;
  color: #737373;
}
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.custom-tabs .v-tab {
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
.action-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;

  transform: translateX(-50%);
  background-color: white;
  z-index: 1000;
}

.selected-text {
  font-weight: 600;
  font-size: 14px;
  padding: 5px 13px;
  border-radius: 50%;
  color: #fff;
  background: #0061fb;
}

.action-item {
  cursor: pointer;
}

.action-label {
  font-size: 13px;
  margin-top: 4px;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
}
.cust-border p {
  font-size: 12px;
  color: #c3c3c3;
}
</style>
