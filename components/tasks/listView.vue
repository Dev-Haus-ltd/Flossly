<template>
  <div>
    <div
      class="d-flex align-center my-2"
      style="flex-wrap: nowrap; overflow-x: auto;"
    >
      <div class="d-inline-flex align-center py-1" style="flex-wrap: nowrap;">
        <v-btn-toggle v-model="viewType" mandatory class="custom-toggle">
          <v-btn value="list" class="toggle-btn">
            <img
              :src="listicon"
              alt="list icon"
              class="mr-1"
              width="16"
              height="16"
            />
            List
          </v-btn>
          <v-btn value="calender" class="toggle-btn">
            <img
              :src="calendericon"
              alt="calendar icon"
              class="mr-1"
              width="16"
              height="16"
            />
            Calender
          </v-btn>
        </v-btn-toggle>
        <!-- Search Field -->
        <div style="width: 150px">
          <v-text-field
            v-model="search"
            placeholder="Search"
            append-inner-icon="mdi-magnify"
            variant="solo"
            :elevation="0"
            density="compact"
            hide-details
            bg-color="#FAFAFA"
            flat
            class="custom-search"
          />
        </div>

        <!-- Filter Button + Menu -->
        <TasksMenuItemsFilterMenu
          :priorities="priorities"
          :users="users"
          @update:filters="onFiltersUpdated"
        />
        <div class="">
          <v-menu :close-on-content-click="false">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="flat"
                density="compact"
                class="tbl-top-btn"
                style="width: 200px"
              >
                <span>Manage Columns</span>
                <v-icon class="ml-2" size="20">mdi-table-column</v-icon>
              </v-btn>
            </template>

            <v-card class="pa-2" max-width="500">
              <p>Selected Columns</p>
              <div class="d-flex flex-wrap">
                <div
                  v-for="(item, index) in selectedHeaders"
                  :key="index"
                  class="color-box ma-1 pa-2 d-flex align-center justify-space-between position-relative"
                  :style="{ backgroundColor: getRandomHexColor(item.title) }"
                >
                  <span> {{ item.title }}</span>
                  <v-icon
                    color="white"
                    class="tick-icon"
                    @click="removeHeaderFromSeleted(item)"
                    >mdi-close-circle</v-icon
                  >
                </div>
              </div>

              <p>Available Columns</p>
              <div class="d-flex flex-wrap">
                <div
                  v-for="(item, index) in filteredAvailableHeaders"
                  :key="index"
                  class="color-box ma-1 pa-2 d-flex align-center justify-center"
                  :style="{ backgroundColor: getRandomHexColor(item.title) }"
                  @click="addHeaderInSelected(item)"
                >
                  {{ item.title }}
                </div>
              </div>
            </v-card>
          </v-menu>
        </div>
      </div>
      <div class="d-inline-flex" style="flex-wrap: nowrap;">
        <v-btn
          color="tertiary"
          variant="flat"
          rounded="lg"
          @click="taskPoolDialog = true"
          class="add-task-btn"
        >
          <template #prepend>
            <v-icon size="18">mdi-checkbox-marked-outline</v-icon>
          </template>
          Tasks Pool
        </v-btn>
        <v-btn
          color="secondary"
          variant="flat"
          rounded="lg"
          @click="bulkTaskUploadDialog = true"
          class="add-task-btn mx-2"
        >
          <template #prepend>
            <v-icon size="18">mdi-upload</v-icon>
          </template>
          Upload bulk tasks
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          @click="openAddTaskDialog"
          class="add-task-btn"
        >
          <template #prepend>
            <v-icon size="18">mdi-plus-circle-outline</v-icon>
          </template>
          Add task
        </v-btn>
      </div>
    </div>

    <v-expansion-panels
      v-if="viewType === 'list' && taskDetails && taskDetails.length"
      v-model="openedPanels"
      :elevation="0"
      flat
      multiple
    >
      <v-expansion-panel
        v-for="(group, index) in taskDetails"
        :key="index"
        rounded="lg"
        class="border-sm pb-1"
      >
        <v-expansion-panel-title>
          <template v-slot:default="{}">
            <div class="d-flex">
              <v-chip :color="getColor(group.status)" label>
                <v-icon v-if="group.status === 'todo'" class="mr-2"
                  >mdi-calendar-clock</v-icon
                >
                <v-icon v-else-if="group.status === 'archived'" class="mr-2">
                  mdi-archive-outline
                </v-icon>
                <v-icon v-else class="mr-2">
                  mdi-calendar-check-outline
                </v-icon>

                {{ getStatuses(group.status) }}
              </v-chip>
              <v-chip class="ml-2" :color="getColor(group.status)" label>
                {{ group.tasks.length }}
              </v-chip>
            </div>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            v-if="group.tasks.length"
            :items="group.tasks"
            v-model="selectedTasks"
            v-model:search="search"
            :headers="selectedHeaders"
            :expanded="expanded"
            item-value="id"
            class="resizable-table"
            density="compact"
            :item-selectable="() => true"
            @update:modelValue="onSelectionChange"
            return-object
            show-select
            hover
          >
            <template
              v-slot:[`item.data-table-select`]="{
                internalItem,
                isSelected,
                toggleSelect,
              }"
            >
              <input
                type="checkbox"
                :checked="isSelected(internalItem)"
                @change="() => toggleSelect(internalItem)"
                class="cust-checkbox"
              />
            </template>

            <template
              v-slot:headers="{
                columns,
                getSortIcon,
                toggleSort,
                allSelected,
                someSelected,
              }"
            >
              <draggable
                tag="tr"
                :model-value="columns"
                item-key="key"
                direction="horizontal"
                :disabled="isResizing"
                handle=".th-content"
                @update:model-value="updateHeaderOrder"
              >
                <template #item="{ element: column, index: i }">
                  <th
                    :style="{
                      minWidth: column.width + 'px',
                      padding: '0px 7px',
                      backgroundColor: '#F6F6F6',
                      fontSize: '14px',
                      position: 'relative',
                    }"
                    @mouseover="showHandles(column.key, index)"
                    @mouseleave="hideHandles(column.key, index)"
                  >
                    <div
                      v-if="!column.title && i === 0"
                      class="d-flex align-center justify-center"
                    >
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allSelected"
                        :indeterminate.prop="someSelected && !allSelected"
                        @change="toggleAll(group)"
                      />
                    </div>
                    <div v-else class="d-flex align-center th-content">
                      <p
                        v-if="!isEditing(column, index)"
                        @click="enableEditing(column, index)"
                        style="cursor: text;"
                      >
                        {{ column.title }}
                      </p>
                      <v-text-field
                        v-else
                        v-model="column.title"
                        @update:model-value="
                          (val) => updateHeaderTitle(column.key, val)
                        "
                        :variant="
                          isFocused('header', column.key) ? 'outlined' : 'plain'
                        "
                        density="compact"
                        hide-details
                        @focus="setFocus('header', column.key, true)"
                        @blur="updateValueColumn(column, index)"
                        class="small-input"
                      />

                     <div class="d-flex justify-end">
                      <v-icon
                        size="14"
                        color="black"
                        style="cursor: pointer"
                        @click.stop="removeHeaderFromSeleted(column)"
                      >
                        mdi-minus
                      </v-icon>
                      <v-icon
                        v-if="column.sortable"
                        size="12"
                        class="ml-2"
                        @click="toggleSort(column)"
                      >
                        {{ getSortIcon(column) }}
                      </v-icon>
                     </div>
                      <span
                        class="resize-handle"
                        :id="`resize-handle-${column.key}-${index}`"
                        @pointerdown="startResize($event, column, index)"
                      >
                      </span>
                    </div>
                  </th>
                </template>
              </draggable>
            </template>
            <template
              v-for="col in selectedHeaders"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <template v-if="col.key === 'title'">
                <div class="pa-1 d-flex justify-space-between align-center">
                  <v-text-field
                    v-model="item.title"
                    :variant="isFocused(item.id, 'title') ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, 'title', true); storeOriginalValue(item.id, 'title', item); }"
                    @blur="updateValueRow(item, 'title')"
                    density="compact"
                    hide-details
                    @keyup.enter="(e) => handleEnterKey(e, item, 'title')"
                    @keyup.escape="(e) => handleEscapeKey(e, item, 'title')"
                    class="small-input"
                  />
                  <img
                    src="../../assets/dashboard/expandIcon.svg"
                    alt=""
                    class="ml-2"
                    @click="getDetails(item)"
                    style="cursor: pointer"
                  />
                </div>
              </template>

              <!-- Inside v-slot:[`item.${col.key}`] -->
              <!-- <template v-else-if="col.key === 'status.name'">
                <DataTableColumnsStatus
                  :statuses="statuses"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'status')"
                />
              </template> -->
              <template v-else-if="col.key === 'priority.name'">
                <DataTableColumnsPriorities
                  :priorities="priorities"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'priority')"
                />
              </template>
              <template v-else-if="col.key === 'frequency'">
                <DataTableColumnsFrequencies
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'frequency')"
                />
              </template>
              <template v-else-if="col.key === 'attachments'">
                <DataTableColumnsAttachments :attachments="item.attachments" />
              </template>
              <template v-else-if="col.key === 'createdAt'">
                <p class="text-center">{{ formattedDate(item.createdAt) }}</p>
              </template>
              <template v-else-if="col.key == 'dueDate'">
                <DataTableColumnsDueDate
                  v-model="item.dueDate"
                  @update:modelValue="updateValueRow(item, 'dueDate')"
                />
              </template>
              <template v-else-if="col.key === 'updatedAt'">
                <p class="text-center">{{ formattedDate(item.updatedAt) }}</p>
              </template>

              <!-- Delete icon for 'actions' column -->
              <template v-else-if="col.key === 'actions'">
                <v-icon
                  color="error"
                  class="cursor-pointer"
                  @click="deleteRow(item.id)"
                >
                  mdi-delete
                </v-icon>
              </template>
              <!-- avatar assignedUser -->
              <template v-else-if="col.key === 'assignedUser.fullName'">
                <DataTableColumnsAssignedUsers
                  :assigned-users="item.assignedUsers || [user]"
                  :all-users="getTaskUsers(item)"
                  :current-user="user"
                  @assign="assignTask(item, $event)"
                  @unassign="unAssign(item, $event)"
                />
              </template>
              <!-- Generic editable field for all other columns -->
              <template v-else>
                <div class="d-flex align-center pa-1">
                  <v-text-field
                    :model-value="getNestedValue(item, col.key)"
                    @update:modelValue="(val) => {
                      setNestedValue(item, col.key, val);
                    }"
                    :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, col.key, true); storeOriginalValue(item.id, col.key, item); }"
                    @blur="updateValueRow(item, col.key)"
                    density="compact"
                    @keyup.enter="(e) => handleEnterKey(e, item, col.key)"
                    @keyup.escape="(e) => handleEscapeKey(e, item, col.key)"
                    hide-details
                    class="small-input"
                  />
                </div>
              </template>
            </template>
            <!-- Expanded subtasks -->
            <template #expanded-row="{ item }">
              <td :colspan="selectedHeaders.length" style="padding: 24px">
                <v-card class="w-100">
                  <v-card-title>Subtasks</v-card-title>
                  <v-data-table
                    :headers="selectedHeaders"
                    :items="item.subtasks"
                    v-model="selectedSubtasks"
                    class="resizable-table"
                    density="compact"
                    hover
                    hide-default-footer
                    show-select
                    return-object
                  >
                    <template
                      v-slot:headers="{
                        columns,
                        getSortIcon,
                        toggleSort,
                        allSelected,
                        someSelected,
                      }"
                    >
                      <tr>
                        <template
                          v-for="(column, i) in columns"
                          :key="column.key"
                        >
                          <th :style="{ width: column.width + 'px' }">
                            <div
                              v-if="i !== 0"
                              class="d-flex align-center th-content"
                            >
                              <v-text-field
                                :model-value="column.title"
                                @update:model-value="
                                  (val) =>
                                    updateSubtaskHeaderTitle(column.key, val)
                                "
                                :variant="
                                  isFocused('subheader', column.key)
                                    ? 'outlined'
                                    : 'plain'
                                "
                                density="compact"
                                hide-details
                                @focus="setFocus('subheader', column.key, true)"
                                @blur="updateSubtaskValueColumn(column)"
                              />
                              <v-icon
                                v-if="column.sortable !== false"
                                size="18"
                                class="ml-2"
                                @click="toggleSort(column)"
                              >
                                {{ getSortIcon(column) }}
                              </v-icon>
                              <span
                                class="resize-handle"
                                :id="`resize-handle-${column.key}-${index}`"
                                @pointerdown="startResize($event, column, index)"
                              >
                              </span>
                            </div>
                            <div v-else>
                              <v-checkbox
                                :model-value="allSelected"
                                :indeterminate="someSelected && !allSelected"
                                @update:model-value="toggleAll(group)"
                                density="compact"
                                hide-details
                                class="custom-checkbox"
                              />
                            </div>
                          </th>
                        </template>
                      </tr>
                    </template>
                    <template
                      v-for="col in selectedHeaders"
                      :key="col.key"
                      v-slot:[`item.${col.key}`]="{ item }"
                    >
                      <!-- Inside v-slot:[`item.${col.key}`] -->
                      <template v-if="col.key === 'status'">
                        <v-menu
                          v-model="item.statusMenu"
                          :close-on-content-click="false"
                          offset-y
                        >
                          <template #activator="{ props }">
                            <v-text-field
                              v-bind="props"
                              v-model="item.status"
                              density="compact"
                              readonly
                              hide-details
                              @focus="setFocus(item.id, col.key, true)"
                              @blur="updateValueRow(item, col.key)"
                              :variant="
                                isFocused(item.id, col.key)
                                  ? 'outlined'
                                  : 'plain'
                              "
                            />
                          </template>

                          <v-card>
                            <v-list>
                              <template v-if="!item.statusMenu">
                                <v-list-item
                                  v-for="(s, i) in statuses"
                                  :key="i"
                                  @click="
                                    () => {
                                      item.status = s;
                                      item.statusId = s.id;
                                      item.statusMenu = false;
                                      updateValueRow(item, col.key);
                                    }
                                  "
                                >
                                  <v-list-item-title>{{
                                    s.name
                                  }}</v-list-item-title>
                                </v-list-item>
                              </template>
                              <template v-else>
                                <v-list-item
                                  v-for="(editStatus, i) in statuses"
                                  :key="i"
                                >
                                  <v-text-field
                                    v-model="editStatus.name"
                                    density="compact"
                                    variant="outlined"
                                    hide-details
                                  />
                                </v-list-item>
                              </template>

                              <v-divider></v-divider>

                              <v-list-item @click="toggleStatusEdit">
                                <v-list-item-title class="text-primary">
                                  {{
                                    toggleStatusEdit ? "Done Editing" : "Edit"
                                  }}
                                </v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-card>
                        </v-menu>
                      </template>

                      <!-- Delete icon for 'actions' column -->
                      <template v-else-if="col.key === 'actions'">
                        <v-icon
                          color="error"
                          class="cursor-pointer"
                          @click="deleteSubtaskRow(item.id)"
                        >
                          mdi-delete
                        </v-icon>
                      </template>

                      <!-- Generic editable field for all other columns -->
                      <template v-else>
                        <v-text-field
                          v-model="item[col.key]"
                          :variant="
                            isFocused(item.id, col.key) ? 'outlined' : 'plain'
                          "
                          @focus="setFocus(item.id, col.key, true)"
                          @blur="updateValueRow(item, col.key)"
                          density="compact"
                          hide-details
                        />
                      </template>
                    </template>
                  </v-data-table>
                </v-card>
              </td>
            </template>
            <template #[`footer.prepend`]>
              <v-btn
                v-if="group.status !== 'archived'"
                size="small"
                color="primary"
                variant="flat"
                rounded="lg"
                @click="openAddTaskDialogForStatus(group.status, currentCategoryId)"
                class="add-status-task-btn"
              >
                <v-icon size="16" class="mr-1">mdi-plus-circle-outline</v-icon>
                Add Task
              </v-btn>
              <v-spacer></v-spacer>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <TasksCalenderView v-else-if="viewType === 'calender' && taskDetails && taskDetails.length" :tasks="tasksForCalender" />

    <div v-else class="d-flex justify-center mt-5">
      <p class="mt-7">No current task found.</p>
    </div>

    <TasksTaskDetailsDialog
      v-model="dialogOpen"
      :selectedItem="selectedItem"
      @close="dialogOpen = false"
      @save="updateTaskInfo"
    />

    <!-- Add Task Panel - Only render after page loads -->
    <ClientOnly>
      <template v-if="categories && categories.length > 0 && priorities && priorities.length > 0 && users && users.length > 0">
        <TasksAddTask
          v-model="drawerOpen"
          :preSelectedStatus="selectedStatusForNewTask"
          :preSelectedCategory="selectedCategoryForNewTask"
          @close="drawerOpen = false"
          @success="updateTasks"
        />
        <TasksTaskPoolDialog
          :model-value="taskPoolDialog"
          @close="taskPoolDialog = false"
          @onUpdate="updateTasks"
        />
        <TasksBulkTaskUploadDialog
          v-model="bulkTaskUploadDialog"
          :categories="categories"
          :priorities="priorities"
          :roles="rolesList"
          :users="users"
          @close="bulkTaskUploadDialog = false"
          @onUpdate="updateTasks"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";
import draggable from "vuedraggable";
import listicon from "@/assets/icons/listView/listicon.svg";
import calendericon from "@/assets/icons/listView/calendericon.svg";
const {
  headers,
  availableHeaders,
  taskDetails,
  orgStatuses,
  priorities,
  users,
  categories,
  clearSelection,
} = defineProps({
  headers: Array,
  taskDetails: Array,
  availableHeaders: Array,
  orgStatuses: Array,
  priorities: Array,
  users: Array,
  categories: Array,
  clearSelection: Boolean,
    currentCategoryId: {  // ← ADD THIS NEW PROP
    type: Number,
    default: null,
  },
});
watch(
  () => clearSelection,
  (newVal) => {
    if (newVal) {
      isAllSelected.value = false;
      selectedTasks.value = [];
    }
  }
);
const updateHeaderOrder = (newOrder) => {
  const selectable = newOrder.findIndex((x) => !x.title);
  newOrder.splice(selectable, 1);
  selectedHeaders.value = newOrder;
};
const emit = defineEmits(["onFilter", "onUpdate", "updateSelectedRowItems"]);
const fixedColumnOrder = [
  "title",
  "priority.name",
  "taskDetails.category.name",
  "frequency",
  "assignedUser.fullName",
  "createdAt",
  "dueDate",
  "comments",
  "documentLink",
  "assignedBy",
  "attachments",
  "taskDetails.description",
  "updatedAt",
];
const sortHeaders = (headers) => {
  return fixedColumnOrder
    .map((key) => headers.find((h) => h.key === key))
    .filter(Boolean);
};
const getRandomHexColor = (name) => {
  if (!name) return "#999999";
  const firstChar = name.trim().charAt(0).toUpperCase();
  const colors = [
    "#FF6B6B",
    "#FF8E72",
    "#FFD93D",
    "#6BCB77",
    "#4D96FF",
    "#8358E8",
    "#FF6EC7",
    "#00B8A9",
    "#F15BB5",
    "#FF7F11",
    "#FF9F1C",
    "#2EC4B6",
    "#6A4C93",
    "#8338EC",
    "#3A86FF",
    "#FF006E",
    "#FB5607",
    "#FFBE0B",
    "#06D6A0",
    "#118AB2",
    "#073B4C",
    "#EF476F",
    "#06AED5",
    "#4CC9F0",
    "#8AC926",
    "#FF595E",
  ];
  const index = firstChar.charCodeAt(0) - 65;
  return index >= 0 && index < 26 ? colors[index] : "#999999";
};
const showHandles = (key, i) => {
  const handle = document.getElementById(`resize-handle-${key}-${i}`);
  if (handle) {
    handle.style.display = "block";
  }
};
const hideHandles = (key, i) => {
  const handle = document.getElementById(`resize-handle-${key}-${i}`);
  if (handle) {
    handle.style.display = "none";
  }
};
const search = ref("");
const expanded = ref([]);
const focusedField = ref({});
const originalFieldValues = ref({}); // Store original values for Escape key functionality
const statuses = ref([]);
const priorityStatuses = ref([]);
const viewType = ref("list");
const selectedHeaders = ref([]);
const toggleStatusEdit = ref(false);
const selectedTasks = ref([]);
const user = ref(null);
const selectedItem = ref({});
const userStore = useUserStore();
const taskStore = useTaskStore();
const mainStore = useMainStore();
const drawerOpen = ref(false);
const openedPanels = ref([0]);
const dialogOpen = ref(false);
const taskPoolDialog = ref(false);
const isAllSelected = ref(false);
const selectedStatusForNewTask = ref(null);
const selectedCategoryForNewTask = ref(null);

const openAddTaskDialog = () => {
  selectedStatusForNewTask.value = null;
  selectedCategoryForNewTask.value = null;
  drawerOpen.value = true;
};
const tasksForCalender = ref([]);
const bulkTaskUploadDialog = ref(false);
const rolesList = ref([]);
const isResizing = ref(false);
const editingColumn = ref({})

const enableEditing = (column, index) => {
  editingColumn.value[`${index}-${column.key}`] = true;
  setFocus('header', column.key, true)
}

const isEditing = (column, index) => {
  return editingColumn.value[`${index}-${column.key}`] === true
}

// Computed property to filter available headers (exclude already selected ones)
const filteredAvailableHeaders = computed(() => {
  if (!availableHeaders || !selectedHeaders.value) {
    return [];
  }

  // Get the keys of all selected headers
  const selectedKeys = new Set(selectedHeaders.value.map(h => h.key));

  // Filter out headers that are already selected
  return availableHeaders.filter(header => !selectedKeys.has(header.key));
});

const getRoles = () => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data;
      }
    })
    .catch((err) => {
      return err;
    });
};
onMounted(() => {
  getRoles();
  selectedHeaders.value = sortHeaders(headers);
  statuses.value = orgStatuses;
  priorityStatuses.value = priorities;
  user.value = JSON.parse(localStorage.getItem("user"));
    // Add keyboard shortcut listener
  window.addEventListener('keydown', handleKeyboardShortcut);

});

// Add cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut);
});

// Add this new function to handle keyboard shortcuts
const handleKeyboardShortcut = (event) => {
  
  // Option 1: Ctrl/Cmd + Shift + +
  if (event.shiftKey && event.key === '+') {
    event.preventDefault();
    openAddTaskDialog();
  }
};

watch(
  () => headers,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      selectedHeaders.value = sortHeaders(newVal); // Updates whenever headers changes
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => orgStatuses,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      statuses.value = newVal; // Updates whenever orgStatuses changes
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => taskDetails,
  (newVal) => {
    selectedItem.value = [];
    tasksForCalender.value = newVal.flatMap((group) =>
      group.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        name: task.title,
        start: calenderDate(task.dueDate || task.createdAt),
        end: calenderDate(task.dueDate || task.createdAt),
        color: task.status?.color || task.priority?.color || "#2196F3",
        status: task.status,
        priority: task.priority,
        userId: task.userId,
        assignedUsers: task.assignedUsers ? task.assignedUsers : [user.value],
        category: task.taskDetails?.category,
      }))
    );
  }
);
const calenderDate = (data) => {
  const date = new Date(data);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const formatted = `${year}-${month}-${day} ${hours}:${minutes}`;

  return formatted;
};
const getTaskUsers = (task) => {
  if (users) {
    return users.filter((x) => x.roleId !== task.taskDetails.roleId && x.status === "Active");
  } else return [];
};
const updateTasks = () => {
  drawerOpen.value = false;
  taskPoolDialog.value = false;
  emit("onUpdate");
};
// sub tasks
const selectedSubtasks = ref(null);
const isFocused = (id, key) => {
  return focusedField.value[`${id}-${key}`] === true;
};

const getStatuses = (key) => {
  if (key === "archived") {
    return "Archived";
  }
  if (statuses.value.find((x) => x.key === key)) {
    return statuses.value.find((x) => x.key === key).name;
  } else {
    return "Upcoming";
  }
};
const getColor = (key) => {
  if (key === "archived") {
    return "#9E9E9E"; // Gray color for archived
  }
  if (statuses.value.find((x) => x.key === key)) {
    return statuses.value.find((x) => x.key === key).color;
  } else {
    return "#EF3131";
  }
};
const formattedDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
};
const setFocus = (id, key, state) => {
  focusedField.value[`${id}-${key}`] = state;
};
const removeHeaderFromSeleted = async (column) => {
  selectedHeaders.value = selectedHeaders.value.filter(
    (x) => x.key !== column.key
  );
  await updateUserPreferences();
};
const unAssign = async (task, user) => {
  try {
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length) {
      const match = task.assignedUsers.find((x) => x.id === user.id);

      if (!match?.userTaskId) {
        mainStore.setSnackbar({
          title: "Unable to find user assignment",
          type: "error",
        });
        return;
      }

      const res = await taskStore.unAssignTask({
        userTaskId: match.userTaskId,
      });

      if (res.code === 0) {
        emit("onUpdate");
        mainStore.setSnackbar({
          title: "Task un-assigned successfully",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res.data?.message || res.message || "Task un-assigned failed",
          type: "error",
        });
      }
    } else {
      mainStore.setSnackbar({
        title: "You can't unassign yourself from this task",
        type: "warning",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};

const assignTask = async (task, user) => {
  try {
    task.id = task.taskId;
    const res = await taskStore.assignTask({ userId: user.id, tasks: [task] });

    if (res.code === 0) {
      emit("onUpdate");

      mainStore.setSnackbar({
        title: "Task assigned successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Task assigned failed",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};
const addHeaderInSelected = async (column) => {
  if (!selectedHeaders.value.find((x) => x.key === column.key)) {
    selectedHeaders.value.push(column);
    selectedHeaders.value = sortHeaders(selectedHeaders.value);
    await updateUserPreferences();
  }
};
const updateUserPreferences = async () => {
  await userStore.updatePreferences({
    userId: user.value.id,
    taskTableColumns: selectedHeaders.value,
  });
  user.value.preferences.taskTableColumns = selectedHeaders.value;
  localStorage.setItem("user", JSON.stringify(user.value));
};

const updateValueColumn = (column) => {
  editingColumn.value = {}
  setFocus("header", column.key, false);
};
const updateSubtaskValueColumn = (column) => {
  setFocus("subheader", column.key, false);
};

const updateTaskInfo = (task) => {
  // Format the task data for the backend
  const updateData = {
    id: task.id,
    taskId: task.taskId || task.taskDetails?.id,
    title: task.title,
    comments: task.comments,
    statusId: task.statusId,
    priorityId: task.priorityId,
    frequency: task.frequency,
    dueDate: task.dueDate,
    documentLink: task.documentLink,
    // Include description from taskDetails if it exists
    description: task.taskDetails?.description,
  };
  
  taskStore
    .updateUserTask(updateData)
    .then((res) => {
      if (res.code === 0) {
        dialogOpen.value = false;
        emit("onUpdate");
      } else {
        mainStore.setSnackbar({
          title: "Error while updating the task",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: "Error while updating the task",
        type: "error",
      });
    });
};
const storeOriginalValue = (id, key, row) => {
  // Create a unique identifier for this field
  const fieldId = `${id}-${key}`;

  // Store the original value (handle both simple and nested values)
  if (key.includes('.')) {
    originalFieldValues.value[fieldId] = getNestedValue(row, key);
  } else {
    originalFieldValues.value[fieldId] = row[key];
  }
};

const handleEscapeKey = (event, row, key) => {
  const fieldId = `${row.id}-${key}`;

  // Retrieve the original value
  const originalValue = originalFieldValues.value[fieldId];

  if (originalValue !== undefined) {
    // Revert to the original value
    if (key.includes('.')) {
      setNestedValue(row, key, originalValue);
    } else {
      row[key] = originalValue;
    }

    // Clean up the stored original value
    delete originalFieldValues.value[fieldId];
  }

  // Remove focus without triggering save
  setFocus(row.id, key, false);
  event.target.blur();
};

const handleEnterKey = (event, row, key) => {
  // Clean up the stored original value since we're saving
  const fieldId = `${row.id}-${key}`;
  delete originalFieldValues.value[fieldId];

  // Blur the input field to trigger the blur event
  // This prevents duplicate API calls by ensuring only blur fires
  event.target.blur();
};

const updateValueRow = async (row, key) => {
  // Clean up the stored original value after successful save
  const fieldId = `${row.id}-${key}`;
  delete originalFieldValues.value[fieldId];

  setFocus(row.id, key, false);

  if (key === "name" && row.title) {
    if (!row.title.trim()) {
      mainStore.setSnackbar({
        title: "Task title cannot be only spaces",
        type: "error",
      });
      return;
    }
    if (row.title.length > 150) {
      mainStore.setSnackbar({
        title: "Task title must be 150 characters or less",
        type: "error",
      });
      return;
    }
  }

  // New nested-value handling
  const currentValue = getNestedValue(row, key);

  if (key.includes('.')) {
    const nestedValue = getNestedValue(row, key);
    console.log(`Sending update for ${key}:`, nestedValue);
  }

  try {
    const res = await taskStore.updateUserTask(row);

    if (res.code !== 0) {
      mainStore.setSnackbar({
        title: err.message || "Error while updating the task",
        type: "error",
      });
      return;
    }

    if (key === "status") {
      emit("onUpdate");
    }

    mainStore.setSnackbar({
      title: "Task updated successfully",
      type: "success",
    });

  } catch (err) {
    mainStore.setSnackbar({
      title: "Error while updating the task",
      type: "error",
    });
  }
};


function getNestedValue(obj, path) {
  return path
    .split(".")
    .reduce((o, key) => (o && o[key] !== undefined ? o[key] : ""), obj);
}
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  
  // Navigate through all keys except the last one
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    // Create intermediate objects if they don't exist
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the final value
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}
let startX = 0;
let startWidth = 0;
let currentCol = null;

function startResize(e, col, i) {
  e.stopPropagation(); // ✅ Block draggable from detecting drag
  e.preventDefault();

  isResizing.value = true;
  currentCol = col;
  startX = e.clientX;
  startWidth = col.width;
  const handleEl = document.getElementById(`resize-handle-${col.key}-${i}`) || e.target;

  // use pointer capture on the actual handle if available
  try {
    handleEl.setPointerCapture && handleEl.setPointerCapture(e.pointerId);
  } catch (err) {
    // some elements might not support pointer capture; ignore
  }

  handleEl.addEventListener("pointermove", resizeColumn);
  handleEl.addEventListener("pointerup", stopResize);
}

function resizeColumn(e) {
  if (!isResizing.value || !currentCol) return;
  const diff = e.clientX - startX;
  currentCol.width = Math.max(120, startWidth + diff);
}

function stopResize(e) {
  isResizing.value = false;

  let handleEl;

  // When using pointer capture, e.target may not be the handle.
  // So we look for the handle based on the column + panelIndex
  // which we stored temporarily on the event during startResize.
  if (e.currentTarget) {
    handleEl = e.currentTarget;
  } else {
    // Safety fallback (rarely triggered)
    handleEl = e.target;
  }

  // Remove listeners cleanly
  handleEl.removeEventListener("pointermove", resizeColumn);
  handleEl.removeEventListener("pointerup", stopResize);

  // Release pointer capture if active
  try {
    if (e.pointerId) {
      handleEl.releasePointerCapture &&
        handleEl.releasePointerCapture(e.pointerId);
    }
  } catch (err) {
    // ignore capture release errors
  }
  currentCol = null
}


const updateHeaderTitle = (key, value) => {
  const target = selectedHeaders.value.find((col) => col.key === key);
  if (target) {
    target.title = value;
  }
};
const updateSubtaskHeaderTitle = (key, value) => {
  const target = selectedHeaders.value.find((col) => col.key === key);
  if (target) {
    target.title = value;
  }
};

const toggleAll = (group) => {
  if (isAllSelected.value) {
    isAllSelected.value = false;
    selectedTasks.value = [];
  } else {
    const selected = [];
    taskDetails.forEach((el) => {
      if (el.status === group.status) {
        el.tasks.forEach((t) => {
          selected.push(t);
        });
      }
    });
    selectedTasks.value = selected;
    isAllSelected.value = true;
  }

  emit("updateSelectedRowItems", selectedTasks.value);
  console.log(selectedTasks.value);
};
const getDetails = (item) => {
  selectedItem.value = item;
  dialogOpen.value = true;
};

function onFiltersUpdated(newFilters) {
  emit("onFilter", newFilters);
}

const onSelectionChange = (newSelected) => {
  emit("updateSelectedRowItems", selectedTasks.value);
};

const openAddTaskDialogForStatus = (status, categoryId) => {
  // Store both the selected status and the currently selected category
  selectedStatusForNewTask.value = status;
  selectedCategoryForNewTask.value = categoryId;
  drawerOpen.value = true;
};
</script>

<style scoped>
.v-data-table tbody tr {
  height: 30px !important;
}
th {
  position: relative;
  user-select: none;
}
/* Make all cells match that height */
.v-data-table td {
  height: 30px !important;
  padding: 0 !important;
  vertical-align: middle !important;
}
:deep() .v-table .v-table__wrapper > table > thead > tr > th {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep() .v-table .v-table__wrapper > table > thead > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep() .v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child),
.v-table .v-table__wrapper > table > tbody > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.custom-toggle {
  background-color: #f3f6fa;
  display: flex;
  height: 40px;
}

.toggle-btn {
  background-color: #f3f6fa !important;
  text-transform: none;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease-in-out;
}

.v-btn--active.toggle-btn {
  background-color: #ffffff !important;
  --v-theme-overlay-multiplier: 0 !important; /* reset overlay */
  --v-theme-primary: #ffffff !important; /* force white */
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-radius: 6px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08); /* subtle shadow under */
}
.custom-search,
.tbl-top-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #ffffff !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
}
.resizable-table .th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: grab;
}

.resizable-table .th-content:active {
  cursor: grabbing;
}

.resize-handle {
  width: 10px;
  cursor: col-resize;
  height: 70%;
  display: none;
  position: absolute;
  right: -12px;
  z-index: 99999;
  top: 0px;
  user-select: none;
}
.table-border {
  border: 1px solid #dbdbdb;
}
.color-box {
  width: calc(33.33% - 8px);
  color: white;
  border-radius: 6px;
  text-align: center;
  font-weight: 400;
  font-size: 14px;
  cursor: pointer;
  min-height: 40px;
}
.stickyClass {
  position: sticky;
  left: 0;
  z-index: 999;
}
::v-deep(.small-input input) {
  font-size: 14px !important;
}
.add-task-btn {
  font-weight: 400;
  font-size: 16px;
  text-align: center;
}
.action-bar {
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  background-color: #fff;
  margin-top: 16px;
  gap: 16px;
}
.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  /* remove default styling in some browsers if you want a fully custom look */
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  margin-left: 14px;
  margin-top: 5px;
}
.cust-checkbox:checked {
  background: #0061fb;
  border-color: #0061fb;
}
.cust-checkbox:checked::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px; /* consistent spacing between all items */
}
</style>