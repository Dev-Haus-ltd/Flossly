<template>
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">My Team Tasks</p>
    </div>
    <div class="pa-5 rounded-lg">
      <div class="task-summary">
        <!-- Cards Grid -->
        <v-row v-if="taskStats && taskStats.length > 0"
          style="flex-wrap: nowrap; overflow: auto;"
          >
          <v-col cols="12"  md="3"
          lg="2" v-for="(item, i) in taskStats" :key="i">
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
          :value="null"
          @click.stop.prevent="addNewCategoryDialog"
        >
          <v-icon size="20">mdi-plus</v-icon>
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item :value="currentTab">
          <TasksListView
            :headers="headers"
            :availableHeaders="availableHeaders"
            :taskDetails="taskDetails"
            :orgStatuses="taskStatuses"
            :priorities="taskPriorities"
            :categories="categories"
            :users="userList"
            :clearSelection="isTrayHidden"
            @onFilter="applyFilters"
            @onUpdate="updateTasks"
            @updateSelectedRowItems="updateSelectedRowItems"
          />
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

            <div class="actions-container d-flex align-center" :style="{ gap: xs ? '4px' : '8px' }">
              <!-- Quick Status Actions -->
              <div
                v-for="action in quickStatusActions"
                :key="action.key"
                class="action-item d-flex flex-column align-center"
                :class="{
                  disabled: !selectedRowItems.length || !findStatusByKey(action.key),
                }"
                @click="handleQuickStatus(action.key)"
              >
                <v-icon :color="action.color" size="20">
                  {{ action.icon }}
                </v-icon>
                <span class="action-label" :style="{ color: action.color }">
                  {{ action.label }}
                </span>
              </div>

            <div
              v-if="!hasArchivedTasks"
              class="action-item d-flex flex-column align-center"
              @click="handleArchive"
            >
              <v-icon size="24">mdi-archive-outline</v-icon>
              <span class="action-label">Archive</span>
            </div>

            <div
              v-if="hasArchivedTasks"
              class="action-item d-flex flex-column align-center"
              @click="handleUnarchive"
            >
              <v-icon size="24">mdi-archive-arrow-up-outline</v-icon>
              <span class="action-label">Unarchive</span>
            </div>

            <div
              v-if="!hasArchivedTasks"
              class="action-item d-flex flex-column align-center"
              @click="handleComplete"
            >
              <v-icon size="24">mdi-check-circle-outline</v-icon>
              <span class="action-label">Complete</span>
            </div>

            <div
              class="action-item d-flex flex-column align-center"
              @click="handleExportCSV"
            >
              <v-icon size="24">mdi-file-export-outline</v-icon>
              <span class="action-label">Exporttell</span>
            </div>

            <div
                class="action-item d-flex flex-column align-center"
                @click="handleDelete"
              >
                <v-icon size="20" color="#6d6d6d">mdi-delete-outline</v-icon>
                <span class="action-label">Delete</span>
              </div>

            <!-- Divider before close -->
            <v-divider vertical class="ml-4" />

              <!-- Close Button -->
              <div
                class="action-item d-flex flex-column align-center"
                @click="hideTray()"
              >
                <v-icon size="20" color="#6d6d6d">mdi-close</v-icon>
                <span class="action-label">Close</span>
              </div>
            </div>
          </v-card>
          <RecommendPracticeDialog v-model="recommendDialog" />
          <CommonConfirmDialog
            v-model="showDeleteConfirm"
            title="Delete tasks?"
            message="Are you sure you want to delete the selected tasks?"
            confirm-text="Delete"
            :loading="deleteLoading"
            @confirm="confirmDelete"
            @cancel="cancelDelete"
          />
        </v-tabs-window-item>
      </v-tabs-window>
      <CommonAddCategorySideBar
        v-model="addCategoryDialog"
        @close="handleCategoryDialogClose"
        @success="handleCategorySuccess"
        :categories="categories"
      />
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { nextTick } from "vue";

const bus = useBus();
const { xs } = useDisplay();

// Stores
const taskStore = useTaskStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const userStore = useUserStore();
const addCategoryDialog = ref(false);
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
const isTrayHidden = ref(false);
const recommendDialog = ref(false);
const showDeleteConfirm = ref(false);
const deleteLoading = ref(false);
onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
  if (user && user.preferences) {
    headers.value = user.preferences.taskTableColumns;
  } else {
    headers.value = mainStore.getTeamTaskTableHeaders;
  }
  getCategories();
  getTeamStats();
  getTaskPriorities();
  getTaskStatuses();
  getUsers();
});
const updateTasks = () => {
  getTeamStats();
};
bus.on("updateTeamTasks", updateTasks);
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
const availableHeaders = computed(() => {
  return mainStore.getTeamTaskAllHeaders;
});
const selectedStatusId = ref(null);
const statusUpdateLoading = ref(false);
const getCategories = () => {
  taskStore.listCategories().then((res) => {
    if (res.code === 0) {
      categories.value = res.data;
    }
  });
};
const hideTray = () => {
  selectedRowItems.value = [];
  isTrayHidden.value = true;
  selectedStatusId.value = null;
};
const addNewCategoryDialog = () => {
  addCategoryDialog.value = true;
};
const quickStatusActions = computed(() => [
  { key: "todo", label: "To Do", icon: "mdi-calendar-check", color: "#e15b64" },
  { key: "progress", label: "In Progress", icon: "mdi-timer-sand", color: "#f6a609" },
  { key: "upcoming", label: "Upcoming", icon: "mdi-calendar-clock", color: "#5d87ff" },
]);
const findStatusByKey = (key) => taskStatuses.value.find((s) => s.key === key);

const handleStatusUpdate = async (statusId) => {
  if (!statusId) return;
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "Select at least one task first.",
      type: "warning",
    });
    selectedStatusId.value = null;
    return;
  }

  const status = taskStatuses.value.find((s) => s.id === statusId);
  if (!status) {
    mainStore.setSnackbar({
      title: "Selected status not found.",
      type: "error",
    });
    return;
  }

  statusUpdateLoading.value = true;
  try {
    const updates = selectedRowItems.value.flatMap((item) => {
      const baseTaskId = item.taskId || item.id || item.taskDetails?.id;
      if (Array.isArray(item.assignedUsers) && item.assignedUsers.length) {
        return item.assignedUsers
          .filter((au) => au.userTaskId)
          .map((au) => ({
            id: au.userTaskId,
            taskId: baseTaskId,
            statusId,
          }));
      }
      if (item.userTaskId || item.id) {
        return [
          {
            id: item.userTaskId || item.id,
            taskId: baseTaskId,
            statusId,
          },
        ];
      }
      return [];
    });

    if (!updates.length) {
      mainStore.setSnackbar({
        title: "Unable to update status for selected tasks.",
        type: "error",
      });
      return;
    }

    const results = await Promise.all(
      updates.map((payload) => taskStore.updateUserTask(payload))
    );

    const allSucceeded = results.every((res) => res.code === 0);
    if (allSucceeded) {
      updateTasksList();
      hideTray();
      mainStore.setSnackbar({
        title: "Task status updated successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: "Some tasks failed to update. Please try again.",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "Status update failed",
      type: "error",
    });
  } finally {
    statusUpdateLoading.value = false;
  }
};

const handleQuickStatus = (statusKey) => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "Select at least one task first.",
      type: "warning",
    });
    return;
  }
  const status = findStatusByKey(statusKey);
  if (!status) {
    mainStore.setSnackbar({
      title: "Status not available for this organisation.",
      type: "error",
    });
    return;
  }
  selectedStatusId.value = status.id;
  handleStatusUpdate(status.id);
};

const handleCategoryDialogClose = () => {
  addCategoryDialog.value = false;
};

const handleCategorySuccess = () => {
  // Refresh categories after successful addition
  getCategories();
  getTeamStats();
  addCategoryDialog.value = false;
};
const getTeamStats = () => {
  taskStore.getTeamTaskStatsByCategory().then((res) => {
    if (res.code === 0) {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Filter out categories with 0 tasks
        const filteredData = res.data.filter(cat => cat.taskCount > 0);
        
        if (filteredData.length > 0) {
          if (!currentTab.value) {
            currentTab.value = filteredData[0].categoryId;
          }
          taskStats.value = filteredData;
          getTeamTasks(currentTab.value);
        } else {
          taskStats.value = [];
        }
      } else {
        taskStats.value = [];
      }
    }
  }).catch((err) => {
    taskStats.value = [];
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
  getTeamTasks(currentTab.value);
};
const applyFilters = (filters) => {
  filters.categoryId = currentTab.value;
  taskStore
    .teamTasksGroupedByStatus(filters)
    .then((res) => {
      if (res.code === 0) {
        const myId = user.value?.id;
        const filteredData = res.data
          .map(group => ({
            ...group,
            tasks: group.tasks.filter(task =>
              !task.assignedUsers?.some(u => u.id === myId)
            )
          }))
          .filter(group => group.tasks && group.tasks.length > 0); // Filter out status groups with 0 tasks
        taskDetails.value = sortByCustomStatus(filteredData);
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) userList.value = res.data;
  });
};
function sortByCustomStatus(arr) {
  const order = ["upcoming", "todo", "progress", "cancelled", "completed"];
  const priority = Object.fromEntries(
    order.map((status, index) => [status, index])
  );

  return [...arr].sort((a, b) => {
    // Archived tasks always go last
    if (a.status?.toLowerCase() === "archived") return 1;
    if (b.status?.toLowerCase() === "archived") return -1;
    
    const aPriority = priority[a.status?.toLowerCase()] ?? Infinity;
    const bPriority = priority[b.status?.toLowerCase()] ?? Infinity;
    return aPriority - bPriority;
  });
}
const getTeamTasks = (categoryId) => {
  taskStore
    .teamTasksGroupedByStatus({ categoryId })
    .then((res) => {
      if (res.code === 0) {
        const myId = user.value?.id;
        
        const filteredData = res.data
          .map(group => ({
            ...group,
            tasks: group.tasks.filter(task => {
              const isAssignedToMe = task.assignedUsers?.some(u => u.id === myId);
              return !isAssignedToMe;
            })
          }))
          .filter(group => group.tasks && group.tasks.length > 0); // Filter out status groups with 0 tasks
        
        taskDetails.value = sortByCustomStatus(filteredData);
      }
    })
    .catch((err) => {
      // Silent error handling
    });
};
const selectedRowItems = ref([]);

const updateSelectedRowItems = (items) => {
  isTrayHidden.value = false;
  selectedRowItems.value = items;
};
watch(
  selectedRowItems,
  (items) => {
    if (!items.length) {
      selectedStatusId.value = null;
      return;
    }
    const uniqueStatusIds = [
      ...new Set(items.map((item) => item.statusId || item.status?.id)),
    ];
    selectedStatusId.value = uniqueStatusIds.length === 1 ? uniqueStatusIds[0] : null;
  },
  { deep: true }
);
const getAllUserTaskIds = (tasks) => {
  return tasks.flatMap((task) =>
    task.assignedUsers.map((user) => user.userTaskId)
  );
};
const handleDelete = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to delete.",
      type: "warning",
    });
    return;
  }
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  const ids = getAllUserTaskIds(selectedRowItems.value);
  try {
    const res = await taskStore.unAssignBulkTasks({
      userTasksIds: ids,
    });

    if (res.code === 0) {
      updateTasksList();
      hideTray();
      recommendDialog.value = true;

      mainStore.setSnackbar({
        title: selectedRowItems.value.length === 1 ? "Task deleted successfully." : "Tasks deleted successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title:
          res.data?.message ||
          res.message ||
          "Unable to delete tasks. Please try again.",
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

const hasArchivedTasks = computed(() => {
  if (!selectedRowItems.value || selectedRowItems.value.length === 0) {
    return false;
  }
  return selectedRowItems.value.some(item => 
    item.isArchieved === true || item.status?.key === 'archived'
  );
});

const handleArchive = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to archive.",
      type: "warning",
    });
    return;
  }

  const ids = getAllUserTaskIds(selectedRowItems.value);

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
  } finally {
    deleteLoading.value = false;
    showDeleteConfirm.value = false;
  }
};

const handleUnarchive = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to unarchive.",
      type: "warning",
    });
    return;
  }

  const ids = getAllUserTaskIds(selectedRowItems.value);

  try {
    const res = await taskStore.unarchiveBulkTasks({
      userTasksIds: ids,
    });

    if (res.code === 0) {
      // Clear selection immediately - this will update hasArchivedTasks computed
      selectedRowItems.value = [];
      isTrayHidden.value = true;
      
      // Wait for next tick to ensure reactivity updates
      await nextTick();
      
      // Refresh tasks list
      updateTasksList();
      
      mainStore.setSnackbar({
        title: "Tasks unarchived successfully.",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title:
          res.data?.message ||
          res.message ||
          "Unable to unarchive tasks. Please try again.",
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

const handleExportCSV = () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to export.",
      type: "warning",
    });
    return;
  }

  // Define CSV headers
  const headers = [
    "Title",
    "Description",
    "Category",
    "Priority",
    "Status",
    "Frequency",
    "Due Date",
    "Assigned Users",
    "Created At",
    "Updated At",
  ];

  // Convert tasks to CSV rows
  const rows = selectedRowItems.value.map((task) => {
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // If value contains comma, newline, or quote, wrap in quotes and escape quotes
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Get assigned users (for team tasks, there might be multiple)
    const assignedUsers = task.assignedUsers
      ? task.assignedUsers.map((u) => u.fullName).join("; ")
      : task.assignedUser?.fullName || "";

    return [
      escapeCSV(task.title || ""),
      escapeCSV(task.taskDetails?.description || ""),
      escapeCSV(task.taskDetails?.category?.name || ""),
      escapeCSV(task.priority?.name || ""),
      escapeCSV(task.status?.name || ""),
      escapeCSV(task.frequency || ""),
      escapeCSV(task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ""),
      escapeCSV(assignedUsers),
      escapeCSV(task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ""),
      escapeCSV(task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : ""),
    ].join(",");
  });

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `tasks_export_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  mainStore.setSnackbar({
    title: `${selectedRowItems.value.length} task(s) exported successfully`,
    type: "success",
  });
}
const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

const handleComplete = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to complete.",
      type: "warning",
    });
    return;
  }

  const ids = getAllUserTaskIds(selectedRowItems.value);

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
  height: 2px;
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
