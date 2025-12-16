<template>
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">My Tasks</p>
    </div>
    <div class="pa-5 rounded-lg">
      <div class="task-summary">
        <!-- Cards Grid -->
        <v-row
          style="flex-wrap: nowrap; overflow: auto;"
        >
          <v-col
            cols="12"
            sm="6"
            md="3"
            lg="2"
            v-for="(item, i) in visibleTaskStats"
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
          v-for="(cat, index) in visibleTaskStats"
          :value="cat.categoryId"
            :key="index"
            class="tab-text"
            >
          <div class="d-flex align-center justify-center" style="gap: 6px">
            <span>{{ cat.categoryName }}</span>
            <v-menu v-if="shouldShowCategoryMenu(cat)" offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  size="x-small"
                  class="ml-1"
                  @click.stop
                >
                  <v-icon size="16">mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click.stop="hideCategory(cat)">
                  <v-list-item-title>Hide</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="canEditCategory(cat)"
                  @click.stop="startEditCategory(cat)"
                >
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-tab
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
            :clearSelection="isTrayHidden"
            :headers="headers"
            :availableHeaders="availableHeaders"
            :taskDetails="taskDetails"
            :orgStatuses="taskStatuses"
            :priorities="taskPriorities"
            :users="userList"
            :categories="categories"
            :page="page"
            :page-size="pageSize"
            :status-totals="statusTotals"
            :currentCategoryId="currentTab"
            :activeFilters="filterState"
            @onFilter="applyFilters"
            @onSearch="handleSearch"
            @onUpdate="updateTasks"
            @updateSelectedRowItems="updateSelectedRowItems"
            @onPageChange="handlePageChange"
            @onPageSizeChange="handlePageSizeChange"
          />
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
    <!-- Selected Count -->
    <div class="selected-count d-flex align-center">
      <span class="selected-text">
        {{ selectedRowItems.length }}
      </span>
      <p class="ml-3 mt-1">Items Selected</p>
    </div>

    <!-- Actions Container -->
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
            @click="handleStatusAction"
          >
            <v-icon size="24">mdi-check-circle-outline</v-icon>
            <span class="action-label">{{ getActionButtonLabel }}</span>
          </div>

          <div
            class="action-item d-flex flex-column align-center"
            @click="handleExportCSV"
          >
            <v-icon size="24">mdi-file-export-outline</v-icon>
            <span class="action-label">Export</span>
          </div>

          <div
        class="action-item d-flex flex-column align-center"
        @click="handleDelete"
      >
        <v-icon size="20" color="#6d6d6d">mdi-delete-outline</v-icon>
        <span class="action-label">Delete</span>
      </div>

          <v-divider vertical class="ml-4" />

      <!-- Divider -->
      <v-divider vertical class="mx-2" style="height: 40px" />

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
      </v-tabs-window>
      <CommonAddCategorySideBar
        v-model="addCategoryDialog"
        @close="handleCategoryDialogClose"
        @success="handleCategorySuccess"
        :categories="categories"
        :edit-category="categoryToEdit"
      />
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { nextTick } from "vue";
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
const recommendDialog = ref(false);
const showDeleteConfirm = ref(false);
const deleteLoading = ref(false);
const filterState = ref({});
const page = ref(1);
const pageSize = ref(10);
const statusTotals = ref({});
const totalCount = ref(0);
const hiddenCategoryIds = ref([]);
const categoryToEdit = ref(null);
const hiddenCategoryStorageKey = "tasksHiddenCategoryIds";
const visibleTaskStats = computed(() =>
  (taskStats.value || []).filter(
    (cat) => !hiddenCategoryIds.value.includes(cat.categoryId)
  )
);
const loadHiddenCategories = () => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(hiddenCategoryStorageKey) || "[]"
    );
    hiddenCategoryIds.value = Array.isArray(stored) ? stored : [];
  } catch (err) {
    hiddenCategoryIds.value = [];
  }
};

const persistHiddenCategories = () => {
  localStorage.setItem(
    hiddenCategoryStorageKey,
    JSON.stringify(hiddenCategoryIds.value)
  );
};

const defaultCategoryNames = [
  "Staff Management",
  "Marketing",
  "Finance",
  "HR",
];

const isMandatoryCategory = (cat) => !!(cat?.isDefault);

const isDefaultNamedCategory = (cat) =>
  defaultCategoryNames.includes((cat?.categoryName || cat?.name || "").trim());

const shouldShowCategoryMenu = (cat) =>
  !isMandatoryCategory(cat) && !isDefaultNamedCategory(cat);

const canEditCategory = (cat) => {
  if (!cat || !shouldShowCategoryMenu(cat)) return false;
  const count = Number(
    cat.taskCount ?? cat.total ?? cat.count ?? cat.taskTotal ?? 0
  );
  if (Number.isNaN(count)) return false;
  return count <= 0;
};

const ensureCurrentTabVisible = () => {
  if (!visibleTaskStats.value.length) {
    currentTab.value = null;
    return;
  }
  const hasCurrent = visibleTaskStats.value.some(
    (cat) => cat.categoryId === currentTab.value
  );
  if (!hasCurrent) {
    currentTab.value = visibleTaskStats.value[0].categoryId;
  }
};

const mergeCategoriesWithStats = (stats = []) => {
  const map = new Map();

  (categories.value || []).forEach((cat) => {
    const id = cat.id ?? cat.categoryId;
    if (id === undefined || id === null) return;
    map.set(String(id), {
      categoryId: id,
      categoryName: cat.name || cat.categoryName,
      taskCount: 0,
      isMandatory: cat.isMandatory ?? cat.isDefault ?? false,
      color: cat.color,
      parentId: cat.parentId ?? null,
      description: cat.description ?? "",
    });
  });

  (stats || []).forEach((stat) => {
    const id = stat.categoryId ?? stat.id;
    if (id === undefined || id === null) return;
    const key = String(id);
    const existing = map.get(key) || {};
    map.set(key, {
      ...existing,
      ...stat,
      categoryId: id,
      categoryName: stat.categoryName || existing.categoryName,
      isMandatory: stat.isMandatory ?? existing.isMandatory ?? false,
    });
  });

  return Array.from(map.values());
};

const setTaskStats = (stats = []) => {
  taskStats.value = mergeCategoriesWithStats(stats);
  ensureCurrentTabVisible();
};

onMounted(async () => {
  loadHiddenCategories();
  user.value = JSON.parse(localStorage.getItem("user"));
  if (user && user.preferences) {
    headers.value = user.preferences.taskTableColumns;
  } else {
    headers.value = mainStore.getTeamTaskTableHeaders;
  }
  await getCategories();
  await getMyStats();
  getTaskPriorities();
  getTaskStatuses();
  getUsers();
});

watch(currentTab, (newVal) => {
  getMyTasks(newVal);
});

const updateTasks = () => {
  getMyStats();
};
bus.on("updateMyTasks", updateTasks);
const availableHeaders = computed(() => {
  return mainStore.getTeamTaskAllHeaders;
});

const getActionButtonLabel = computed(() => {
  if (!selectedRowItems.value.length) return "Complete";
  
  const uniqueStatuses = [...new Set(selectedRowItems.value.map(item => item.status?.key))];
  
  if (uniqueStatuses.length === 1 && uniqueStatuses[0] === "upcoming") {
    return "Mark In Progress";
  }
  
  return "Complete";
});

const hasArchivedTasks = computed(() => {
  if (!selectedRowItems.value || selectedRowItems.value.length === 0) {
    return false;
  }
  return selectedRowItems.value.some(item => 
    item.isArchieved === true || item.status?.key === 'archived'
  );
});
const selectedStatusId = ref(null);
const statusUpdateLoading = ref(false);
const quickStatusActions = computed(() => [
  { key: "todo", label: "To Do", icon: "mdi-calendar-check", color: "#e15b64" },
  { key: "progress", label: "In Progress", icon: "mdi-timer-sand", color: "#f6a609" },
  { key: "completed", label: "Completed", icon: "mdi-checkbox-marked-circle-outline", color: "#36a863" },
  { key: "overdue", label: "Overdue Task", icon: "mdi-calendar-remove", color: "#d442a6" },
]);
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

const setTaskResponse = (payload) => {
  const groups = payload?.statuses || payload || [];
  taskDetails.value = sortByCustomStatus(groups);

  const totals = {};
  groups.forEach((group) => {
    totals[group.status] = group.total ?? group.tasks?.length ?? 0;
  });
  statusTotals.value = totals;

  totalCount.value =
    typeof payload?.total === "number"
      ? payload.total
      : Object.values(totals).reduce((sum, val) => sum + (Number(val) || 0), 0);

  if (payload?.page) page.value = payload.page;
  if (payload?.pageSize) pageSize.value = payload.pageSize;
};

const loadTasks = (filters = {}, resetPage = false) => {
  if (resetPage) {
    page.value = 1;
  }

  filterState.value = { ...filterState.value, ...filters };

  const request = {
    ...filterState.value,
    categoryId: currentTab.value,
    page: page.value,
    pageSize: pageSize.value,
  };

  taskStore
    .tasksGroupedByStatusWithCache(request)
    .then((res) => {
      if (res.code === 0) {
        setTaskResponse(res.data);
      }
    })
    .catch(() => {});
};

const addNewCategoryDialog = () => {
  resetCategoryEditing();
  addCategoryDialog.value = true;
};

const handleCategoryDialogClose = () => {
  resetCategoryEditing();
  addCategoryDialog.value = false;
};

const handleCategorySuccess = () => {
  // Refresh categories after successful addition or edit
  resetCategoryEditing();
  getCategories();
  getMyStats();
  addCategoryDialog.value = false;
};

const applyFilters = (filters) => {
  loadTasks(filters, true);
};

const handleSearch = (query) => {
  loadTasks({ search: query }, true);
};

const handlePageChange = (val) => {
  page.value = val;
  loadTasks({}, false);
};

const handlePageSizeChange = (val) => {
  pageSize.value = val;
  loadTasks({}, true);
};
const getCategories = async () => {
  try {
    const res = await taskStore.listCategories();
    if (res.code === 0) {
      categories.value = res.data || [];
    }
    return res;
  } catch (err) {
    return err;
  }
};

const ensureCategoriesLoaded = async () => {
  if (categories.value && categories.value.length) return;
  await getCategories();
};

const getMyStats = async () => {
  await ensureCategoriesLoaded();
  try {
    const res = await taskStore.getMyTaskStatsByCategory();
    if (res.code === 0) {
      setTaskStats(res.data || []);
      if (!currentTab.value && visibleTaskStats.value.length) {
        currentTab.value = visibleTaskStats.value[0].categoryId;
      }
      getMyTasks(currentTab.value ?? null);
    } else {
      setTaskStats([]);
      getMyTasks(null);
    }
  } catch (err) {
    setTaskStats([]);
    getMyTasks(null);
  }
};

const hideCategory = (cat) => {
  const id = cat?.categoryId ?? cat?.id;
  if (!id) return;
  if (!hiddenCategoryIds.value.includes(id)) {
    hiddenCategoryIds.value = [...hiddenCategoryIds.value, id];
    persistHiddenCategories();
    ensureCurrentTabVisible();
    mainStore.setSnackbar({
      title: `${cat.categoryName || "Category"} hidden`,
      type: "info",
    });
  }
};

const startEditCategory = (cat) => {
  categoryToEdit.value = {
    id: cat?.categoryId ?? cat?.id,
    name: cat?.categoryName || cat?.name || "",
    description: cat?.description || "",
    parentId: cat?.parentId ?? null,
    color: cat?.color || "",
    isMandatory: cat?.isMandatory ?? false,
  };
  addCategoryDialog.value = true;
};

const resetCategoryEditing = () => {
  categoryToEdit.value = null;
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
    // Archived tasks always go last
    if (a.status?.toLowerCase() === "archived") return 1;
    if (b.status?.toLowerCase() === "archived") return -1;
    
    const aPriority = priority[a.status?.toLowerCase()] ?? Infinity;
    const bPriority = priority[b.status?.toLowerCase()] ?? Infinity;
    return aPriority - bPriority;
  });
}
const getMyTasks = (categoryId) => {
  if (categoryId !== undefined && categoryId !== null) {
    currentTab.value = categoryId;
  }
  loadTasks({}, true);
};
const selectedRowItems = ref([]);
const hideTray = () => {
  selectedRowItems.value = [];
  isTrayHidden.value = true;
  selectedStatusId.value = null;
};
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
  const ids = selectedRowItems.value.map((item) => item.id);
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
  } finally {
    deleteLoading.value = false;
    showDeleteConfirm.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
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

const handleUnarchive = async () => {
  if (!selectedRowItems.value.length) {
    mainStore.setSnackbar({
      title: "No tasks selected to unarchive.",
      type: "warning",
    });
    return;
  }

  const ids = selectedRowItems.value.map((item) => item.id);

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
};

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
    const results = await Promise.all(
      selectedRowItems.value.map((item) =>
        taskStore.updateUserTask({
          id: item.id,
          taskId: item.taskId || item.taskDetails?.id,
          statusId,
        })
      )
    );

    const allSucceeded = results.every((res) => res.code === 0);
    if (allSucceeded) {
      updateTasksList();
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
      title: err.message || "An unexpected error occurred.",
      type: "error",
    });
  } finally {
    statusUpdateLoading.value = false;
  }
};

const findStatusByKey = (key) => taskStatuses.value.find((s) => s.key === key);

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
</script>

<style scoped>
.action-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}



.selected-text {
  font-weight: 600;
  font-size: 14px;
  padding: 5px 13px;
  border-radius: 50%;
  color: #fff;
  background: #0061fb;
  line-height: 1;
}

.actions-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
}

.action-item {
  flex: 0 0 auto;
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 12px;
  transition: background-color 0.15s ease, transform 0.1s ease;
  white-space: nowrap;
  text-align: center;
  min-width: 60px;
}

.action-item:hover:not(.disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.action-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-label {
  font-size: 12px;
  margin-top: 4px;
  font-weight: 400;
  color: #6d6d6d;
  line-height: 1.2;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .action-bar {
    padding: 0px 15px !important;
    gap: 15px !important;
  }

  .action-item {
    padding: 4px 8px;
    min-width: 50px;
  }

  .action-label {
    font-size: 11px;
  }

  .selected-text {
    font-size: 12px;
    padding: 4px 10px;
  }
}
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

.status-action {
  cursor: default;
}
.quick-statuses {
  display: flex;
  align-items: center;
  gap: 14px;
}
.quick-status {
  display: inline-flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}
.quick-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}
.quick-status.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
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
