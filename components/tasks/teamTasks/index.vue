<template>
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">My Team Tasks</p>
    </div>
    <div class="pa-5 rounded-lg">
      <div class="task-summary">
        <!-- Cards Grid -->
        <v-row
          v-if="orderedTaskStats && orderedTaskStats.length > 0"
          style="flex-wrap: nowrap; overflow: auto;"
        >
          <v-col
            cols="12"
            md="3"
            lg="2"
            v-for="(item, i) in orderedTaskStats"
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
      <div class="mt-5">
        <div class="tabs-bar fill-color">
          <!-- Custom scroll navigation buttons -->
          <v-btn
            v-show="showScrollButtons && canScrollLeft"
            class="scroll-nav-btn scroll-nav-left"
            icon
            variant="flat"
            size="small"
            color="white"
            @click="scrollTabs('left')"
          >
            <v-icon color="#1e1e1e">mdi-chevron-left</v-icon>
          </v-btn>

          <!-- Custom scrollable tabs container (no Vuetify scrolling) -->
          <div class="tabs-scroll-wrapper" ref="tabsScrollContainer">
            <div class="custom-tabs-container">
              <draggable
                tag="div"
                class="tabs-draggable-list"
                :model-value="orderedTaskStats"
                item-key="categoryId"
                direction="horizontal"
                handle=".tab-inner"
                @update:model-value="updateCategoryOrder"
              >
                <template #item="{ element: cat }">
                  <div
                    :key="cat.categoryId"
                    class="custom-tab-item"
                    :class="{ 'custom-tab-active': currentTab === cat.categoryId }"
                    :style="getTabStyle(cat)"
                    :ref="(el) => setTabRef(el, cat.categoryId)"
                    @click="handleTabClick(cat.categoryId)"
                  >
                    <div class="d-flex align-center justify-center tab-inner">
                      <span class="tab-label">{{ cat.categoryName }}</span>
                      <v-menu offset-y>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon
                            variant="text"
                            size="x-small"
                            class="ml-1 category-menu-btn"
                            @click.stop
                          >
                            <v-icon size="16">mdi-dots-horizontal</v-icon>
                          </v-btn>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            v-if="canHideCategory(cat)"
                            @click.stop="hideCategory(cat)"
                          >
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
                  </div>
                </template>
              </draggable>
            </div>
          </div>

          <!-- Custom scroll navigation buttons -->
          <v-btn
            v-show="showScrollButtons && canScrollRight"
            class="scroll-nav-btn scroll-nav-right"
            icon
            variant="flat"
            size="small"
            color="white"
            @click="scrollTabs('right')"
          >
            <v-icon color="#1e1e1e">mdi-chevron-right</v-icon>
          </v-btn>

          <v-btn
            class="add-tab-btn"
            icon
            variant="text"
            @click.stop.prevent="addNewCategoryDialog"
          >
            <v-icon size="20">mdi-plus</v-icon>
          </v-btn>

        </div>
      </div>
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
            :page="page"
            :page-size="pageSize"
            :status-totals="statusTotals"
            hide-add-custom-column
            @onFilter="applyFilters"
            @onUpdate="updateTasks"
            @updateSelectedRowItems="updateSelectedRowItems"
            @onPageChange="handlePageChange"
            @onPageSizeChange="handlePageSizeChange"
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
              class="action-item d-flex flex-column align-center"
              @click="handleExportCSV"
            >
              <v-icon size="24">mdi-file-export-outline</v-icon>
              <span class="action-label">Exporttell</span>
            </div>

            <div
                v-if="canDeleteSelectedTasks"
                class="action-item d-flex flex-column align-center"
                @click="handleDelete"
              >
                <img src="@/assets/tasks/delete.svg" alt="Delete" width="20" height="20" style="opacity: 0.7;" />
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
        :edit-category="categoryToEdit"
      />
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { nextTick } from "vue";
import {
  applyCategoryOrder as applyCategoryOrderUtil,
  autoUnhideCategoryIds,
  canHideCategory,
  getContrastingTextColor,
  getTaskCategoryIcon,
  isDefaultNamedCategory,
  isMandatoryCategory,
  mergeCategoriesWithStats,
  sortByCustomStatus,
  syncCategoryOrder as syncCategoryOrderUtil,
} from "~/lib/misc";
import draggable from "vuedraggable";

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
const activeFilters = ref({});
const page = ref(1);
const pageSize = ref(10);
const statusTotals = ref({});
const totalCount = ref(0);
const hiddenCategoryIds = ref([]);
const categoryToEdit = ref(null);
const hiddenCategoryStorageKey = "teamTasksHiddenCategoryIds";
const categoryOrder = ref([]);
const categoryOrderStorageKey = "teamTasksCategoryOrder";
const defaultCategoryNames = [
  "Staff Management",
  "Marketing",
  "Finance",
  "HR",
];

// Custom scrolling functionality
const tabsScrollContainer = ref(null);
const tabRefs = ref({});
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const showScrollButtons = ref(false);
const isScrolling = ref(false); // Prevent infinite loops

const setTabRef = (el, categoryId) => {
  if (el) {
    tabRefs.value[categoryId] = el;
  }
};

// Handle tab click
const handleTabClick = (categoryId) => {
  currentTab.value = categoryId;
};

const visibleTaskStats = computed(() =>
  (taskStats.value || [])
    .filter((cat) => !hiddenCategoryIds.value.includes(cat.categoryId))
    .filter((cat) => !cat?.parentId)
);
const loadCategoryOrder = () => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(categoryOrderStorageKey) || "[]"
    );
    categoryOrder.value = Array.isArray(stored) ? stored : [];
  } catch (err) {
    categoryOrder.value = [];
  }
};

const persistCategoryOrder = () => {
  localStorage.setItem(
    categoryOrderStorageKey,
    JSON.stringify(categoryOrder.value)
  );
};

const applyCategoryOrder = (list) => {
  return applyCategoryOrderUtil(list, categoryOrder.value || []);
};

const orderedTaskStats = computed(() =>
  applyCategoryOrder(visibleTaskStats.value || [])
);

const syncCategoryOrder = (list) => {
  const nextOrder = syncCategoryOrderUtil(categoryOrder.value || [], list || []);
  const isSame =
    nextOrder.length === categoryOrder.value.length &&
    nextOrder.every((id, idx) => id === categoryOrder.value[idx]);
  if (!isSame) {
    categoryOrder.value = nextOrder;
    persistCategoryOrder();
  }
};

const updateCategoryOrder = (newOrder = []) => {
  categoryOrder.value = newOrder.map((cat) => cat.categoryId);
  persistCategoryOrder();
};

watch(
  visibleTaskStats,
  (list) => {
    syncCategoryOrder(list || []);
  },
  { immediate: true }
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

const autoUnhideCategories = (list = []) => {
  const nextHidden = autoUnhideCategoryIds(hiddenCategoryIds.value, list || []);
  const isSame =
    nextHidden.length === hiddenCategoryIds.value.length &&
    nextHidden.every((id, idx) => id === hiddenCategoryIds.value[idx]);
  if (!isSame) {
    hiddenCategoryIds.value = nextHidden;
    persistHiddenCategories();
  }
};

const canEditCategory = () => true;

const ensureCurrentTabVisible = () => {
  if (!orderedTaskStats.value.length) {
    currentTab.value = null;
    return;
  }
  const hasCurrent = orderedTaskStats.value.some(
    (cat) => cat.categoryId === currentTab.value
  );
  if (!hasCurrent) {
    currentTab.value = orderedTaskStats.value[0].categoryId;
  }
};

const setTaskStats = (stats = []) => {
  const merged = mergeCategoriesWithStats(categories.value || [], stats);
  autoUnhideCategories(merged);
  const filtered = merged.filter((cat) => {
    const count = Number(
      cat.taskCount ?? cat.total ?? cat.count ?? cat.taskTotal ?? 0
    );
    return (
      isMandatoryCategory(cat) ||
      isDefaultNamedCategory(cat) ||
      count > 0
    );
  });
  taskStats.value = filtered;
  ensureCurrentTabVisible();
};

const resetCategoryEditing = () => {
  categoryToEdit.value = null;
};

// Custom scroll methods - completely independent of Vuetify
const updateScrollButtons = () => {
  if (!tabsScrollContainer.value || isScrolling.value) {
    return;
  }

  const container = tabsScrollContainer.value;
  const scrollLeft = container.scrollLeft;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;

  // Check if content overflows
  const hasOverflow = scrollWidth > clientWidth + 1; // +1 for rounding
  showScrollButtons.value = hasOverflow;

  // Update individual button states
  canScrollLeft.value = hasOverflow && scrollLeft > 5;
  canScrollRight.value = hasOverflow && scrollLeft < scrollWidth - clientWidth - 5;
};

const scrollTabs = (direction) => {
  if (!tabsScrollContainer.value) return;

  const container = tabsScrollContainer.value;
  const scrollAmount = 200; // Pixels to scroll

  const targetScroll = direction === 'left'
    ? container.scrollLeft - scrollAmount
    : container.scrollLeft + scrollAmount;

  // Set scrolling flag to prevent event loops
  isScrolling.value = true;

  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });

  // Update button states after scroll completes
  setTimeout(() => {
    isScrolling.value = false;
    updateScrollButtons();
  }, 350);
};

const scrollToActiveTab = () => {
  if (!currentTab.value || !tabsScrollContainer.value || isScrolling.value) return;

  const activeTabEl = tabRefs.value[currentTab.value];
  if (!activeTabEl) return;

  const container = tabsScrollContainer.value;
  const tabElement = activeTabEl;

  const containerRect = container.getBoundingClientRect();
  const tabRect = tabElement.getBoundingClientRect();

  // Calculate if tab is fully visible
  const isFullyVisible =
    tabRect.left >= containerRect.left + 10 &&
    tabRect.right <= containerRect.right - 10;

  if (!isFullyVisible) {
    // Calculate scroll position to center the tab
    const tabOffsetLeft = tabElement.offsetLeft;
    const tabWidth = tabElement.offsetWidth;
    const containerWidth = container.clientWidth;

    const targetScroll = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);

    // Set scrolling flag
    isScrolling.value = true;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrolling.value = false;
      updateScrollButtons();
    }, 350);
  }
};

onMounted(async () => {
  loadHiddenCategories();
  loadCategoryOrder();
  user.value = JSON.parse(localStorage.getItem("user"));
  if (user && user.preferences && user.preferences.length) {
    headers.value = user.preferences[0].taskTableColumns;
  } else {
    headers.value = mainStore.getTeamTaskTableHeaders;
  }
  await getCategories();
  await getTeamStats();
  getTaskPriorities();
  getTaskStatuses();
  getUsers();
  mainStore.getCustomColumns();

  // Initialize custom scroll functionality
  nextTick(() => {
    if (tabsScrollContainer.value) {
      console.log('🎯 Initializing custom scroll container (Team Tasks)');

      const container = tabsScrollContainer.value;

      // Add scroll event listener with debouncing
      let scrollTimeout;
      const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (!isScrolling.value) {
            updateScrollButtons();
          }
        }, 100);
      };

      container.addEventListener('scroll', handleScroll, { passive: true });

      // Add resize observer to update buttons when container size changes
      const resizeObserver = new ResizeObserver(() => {
        if (!isScrolling.value) {
          updateScrollButtons();
        }
      });
      resizeObserver.observe(container);

      // Initial update after DOM is fully rendered
      setTimeout(() => {
        updateScrollButtons();
      }, 300);
    }
  });
});

// Watch for tab changes and update scroll
watch(currentTab, (newVal) => {
  getTeamTasks(newVal);
  // Scroll selected tab into view after a delay to account for width changes
  // Only if not already scrolling to prevent loops
  if (!isScrolling.value) {
    nextTick(() => {
      setTimeout(() => {
        scrollToActiveTab();
      }, 150);
    });
  }
});

// Update scroll button visibility when tabs change
watch(orderedTaskStats, () => {
  if (!isScrolling.value) {
    nextTick(() => {
      setTimeout(() => updateScrollButtons(), 200);
    });
  }
}, { deep: true });

const updateTasks = () => {
  getTeamStats();
};
bus.on("updateTeamTasks", updateTasks);
const getIcon = (categoryName) => getTaskCategoryIcon(categoryName);

const availableHeaders = computed(() => {
  return mainStore.getTeamTaskAllHeaders;
});
const selectedStatusId = ref(null);
const statusUpdateLoading = ref(false);
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
const hideTray = () => {
  selectedRowItems.value = [];
  isTrayHidden.value = true;
  selectedStatusId.value = null;
};
const addNewCategoryDialog = () => {
  resetCategoryEditing();
  addCategoryDialog.value = true;
};
const quickStatusActions = computed(() => [
  { key: "todo", label: "To Do", icon: "mdi-calendar-check", color: "#e15b64" },
  { key: "progress", label: "In Progress", icon: "mdi-timer-sand", color: "#f6a609" },
  { key: "upcoming", label: "Upcoming", icon: "mdi-calendar-clock", color: "#5d87ff" },
]);

const getTabStyle = (cat) => {
  const bgColor = cat?.color;
  if (!bgColor) return {};
  const textColor = getContrastingTextColor(bgColor);
  return {
    backgroundColor: bgColor,
    "--tab-text-color": textColor,
  };
};
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
  resetCategoryEditing();
  addCategoryDialog.value = false;
};

const handleCategorySuccess = () => {
  // Refresh categories after successful addition
  resetCategoryEditing();
  getCategories();
  getTeamStats();
  addCategoryDialog.value = false;
};
const getTeamStats = async () => {
  try {
    const res = await taskStore.getTeamTaskStatsByCategory();
    if (res.code === 0) {
      setTaskStats(res.data || []);
      if (!currentTab.value && orderedTaskStats.value.length) {
        currentTab.value = orderedTaskStats.value[0].categoryId;
      }
      getTeamTasks(currentTab.value ?? null);
    } else {
      setTaskStats([]);
      getTeamTasks(null);
    }
  } catch (err) {
    setTaskStats([]);
    getTeamTasks(null);
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

const setTaskResponse = (payload) => {
  const groups = payload?.statuses || payload || [];
  const myId = user.value?.id;

  const mapped = groups.map((group) => ({
    ...group,
    tasks:
      group.tasks?.filter(
        (task) => !task.assignedUsers?.some((u) => u.id === myId)
      ) || [],
  }));

  taskDetails.value = sortByCustomStatus(mapped);

  const totals = {};
  mapped.forEach((group) => {
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

  const request = {
    ...activeFilters.value,
    ...filters,
    categoryId: currentTab.value,
    page: page.value,
    pageSize: pageSize.value,
  };

  activeFilters.value = request;

  taskStore
    .teamTasksGroupedByStatus(request)
    .then((res) => {
      if (res.code === 0) {
        setTaskResponse(res.data);
      }
    })
    .catch(() => {});
};

const handlePageChange = (val) => {
  page.value = val;
  loadTasks(activeFilters.value, false);
};

const handlePageSizeChange = (val) => {
  pageSize.value = val;
  loadTasks(activeFilters.value, true);
};
const updateTasksList = () => {
  getTeamStats();
};
const applyFilters = (filters) => {
  loadTasks(filters, true);
};
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) userList.value = res.data;
  });
};
const getTeamTasks = (categoryId) => {
  if (categoryId !== undefined && categoryId !== null) {
    currentTab.value = categoryId;
  }
  loadTasks({}, true);
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


const isNormalUser = computed(() => {
  if (!user.value || !user.value.roleId) return true;
  const privilegedRoleIds = [1, 8]; // Manager and Owner roles
  return !privilegedRoleIds.includes(Number(user.value.roleId));
});

const hasPracticeProfileTasks = computed(() => {
  if (!selectedRowItems.value || selectedRowItems.value.length === 0) {
    return false;
  }
  const taskAssignedByPracticeProfile = selectedRowItems.value.some(item => 
    item.isAssignedByPracticeProfile === true
  );
  const userTaskAssignedByPracticeProfile = selectedRowItems.value.some(item => 
    item.assignedUsers?.some(user => user.isAssignedByPracticeProfile === true)
  );
  return taskAssignedByPracticeProfile || userTaskAssignedByPracticeProfile;
});

const canDeleteSelectedTasks = computed(() => {
  if (!isNormalUser.value) return true;
  return !hasPracticeProfileTasks.value;
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

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #F3F4F6;
  position: relative;
  padding: 6px;
}

.tabs-scroll-wrapper {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tabs-scroll-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.custom-tabs-container {
  display: flex;
  align-items: center;
  min-width: min-content;
  height: 100%;
}

.tabs-draggable-list {
  display: flex;
  gap: 10px;
  padding: 6px;
  align-items: center;
  flex-wrap: nowrap;
}

.custom-tab-item {
  font-size: 13px;
  font-weight: 400;
  text-transform: none;
  color: var(--tab-text-color, #1e1e1e);
  min-height: 34px;
  height: 34px;
  min-width: max-content;
  padding: 0 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  flex-shrink: 0;
}

.custom-tab-item:hover {
  opacity: 0.8;
}

.custom-tab-item.custom-tab-active {
  font-weight: 600;
  border-radius: 999px;
  border: 2px solid currentColor;
}

.scroll-nav-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 6px !important;
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 1 !important;
  visibility: visible !important;
}

.scroll-nav-btn :deep(.v-btn__overlay),
.scroll-nav-btn :deep(.v-btn__underlay) {
  display: none !important;
}

.scroll-nav-btn :deep(.v-icon) {
  color: #1e1e1e !important;
  opacity: 1 !important;
}

.scroll-nav-btn:hover {
  background-color: #f5f5f5 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  border-color: #d0d0d0 !important;
}

.scroll-nav-left {
  margin-right: 4px;
  z-index: 10;
}

.scroll-nav-right {
  margin-left: 4px;
  z-index: 10;
}

.add-tab-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 10px;
  flex-shrink: 0;
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
.category-tab {
  border-radius: 999px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.tab-inner {
  gap: 6px;
  min-width: 0;
  align-items: center;
}
.tab-label {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  line-height: 1;
}
.category-menu-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
  width: 18px;
  height: 18px;
}
.custom-tab-item:hover .category-menu-btn,
.category-menu-btn:focus-visible {
  opacity: 1;
}
.custom-tab-item.custom-tab-active .category-menu-btn {
  opacity: 1;
}
.category-tab .v-icon {
  color: var(--tab-text-color, #1e1e1e) !important;
}
.fill-color {
  background-color: #F3F4F6;
}
</style>
