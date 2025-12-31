<template>
  <div class="mt-5">
    <v-card elevation="0" class="rounded-lg pa-4" flat>
      <v-data-table
        :items="rowItems"
        v-model="selected"
        :headers="visibleHeaders"
        :expanded="expanded"
        item-value="id"
        class="resizable-table"
        :item-selectable="() => true"
        :density="compact"
        return-object
        show-select
        :show-expand="true"
        hover
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
            <template v-for="(column, i) in columns" :key="column.key">
              <th :style="{ width: column.width + 'px' }">
                <div v-if="i !== 0" class="d-flex align-center th-content">
                  <v-text-field
                    :model-value="column.title"
                    @update:model-value="
                      (val) => updateHeaderTitle(column.key, val)
                    "
                    :variant="
                      isFocused('header', column.key) ? 'outlined' : 'plain'
                    "
                    density="compact"
                    hide-details
                    @focus="setFocus('header', column.key, true)"
                    @blur="updateValueColumn(column)"
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
                    @mousedown="startResize($event, column)"
                  ></span>
                </div>
                <div v-else>
                  <v-checkbox
                    :model-value="allSelected"
                    :indeterminate="someSelected && !allSelected"
                    @update:model-value="toggleAll"
                    density="compact"
                    hide-details
                  />
                </div>
              </th>
            </template>
          </tr>
        </template>
        <!-- Expand icon in Task Name -->
        <!-- Dynamic cell template for editable fields -->
        <template
          v-for="col in visibleHeaders"
          :key="col.key"
          v-slot:[`item.${col.key}`]="{ item }"
        >
          <!-- Custom logic for 'name' column -->
          <template v-if="col.key === 'name'">
            <div class="d-flex align-center">
              <v-icon
                class="mr-2"
                @click.stop="toggleExpand(item)"
                style="cursor: pointer"
              >
                {{
                  expanded.includes(item.id)
                    ? "mdi-chevron-up"
                    : "mdi-chevron-down"
                }}
              </v-icon>
              <v-text-field
                v-model="item.name"
                :variant="isFocused(item.id, 'name') ? 'outlined' : 'plain'"
                @focus="setFocus(item.id, 'name', true)"
                @blur="updateValueRow(item, 'name')"
                density="compact"
                hide-details
              />
            </div>
          </template>
          <!-- Inside v-slot:[`item.${col.key}`] -->
          <template v-else-if="col.key === 'status'">
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
                  :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                />
              </template>

              <v-card>
                <v-list>
                  <template v-if="!statusEditMode">
                    <v-list-item
                      v-for="(statusOption, i) in statuses"
                      :key="i"
                      @click="
                        () => {
                          item.status = statusOption;
                          item.statusMenu = false;
                          updateValueRow(item, col.key);
                        }
                      "
                    >
                      <v-list-item-title>{{ statusOption }}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <template v-else>
                    <v-list-item
                      v-for="(editStatus, i) in editableStatuses"
                      :key="i"
                    >
                      <v-text-field
                        v-model="editableStatuses[i]"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                    </v-list-item>
                  </template>

                  <v-divider></v-divider>
                   
                 <!-- + Add Status Button -->
  <v-list-item @click="addStatusAndEdit">
    <v-list-item-title class="text-primary">+ Add Status</v-list-item-title>
  </v-list-item>

  <!-- Edit / Done Editing Toggle -->
  <v-list-item @click="toggleStatusEdit">
    <v-list-item-title class="text-primary">
      {{ statusEditMode ? "Done Editing" : "Edit" }}
    </v-list-item-title>
  </v-list-item>

  <!-- Done Editing toggle -->
 
                </v-list>
              </v-card>
            </v-menu>
          </template>

          <!-- Delete icon for 'actions' column -->
          <template v-else-if="col.key === 'actions'">
            <img
              src="@/assets/tasks/delete.svg"
              alt="Delete"
              width="18"
              height="18"
              class="cursor-pointer"
              style="filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);"
              @click="deleteRow(item.id)"
            />
          </template>

          <!-- Generic editable field for all other columns -->
          <template v-else>
            <v-text-field
              v-model="item[col.key]"
              :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
              @focus="setFocus(item.id, col.key, true)"
              @blur="updateValueRow(item, col.key)"
              density="compact"
              hide-details
            />
          </template>
        </template>
        <!-- Expanded subtasks -->
        <template #expanded-row="{ item }">
          <td :colspan="visibleHeaders.length" style="padding: 24px">
            <v-card class="w-100">
              <v-card-title>Subtasks</v-card-title>
              <v-data-table
                :headers="subTaskHeadersValue"
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
                    <template v-for="(column, i) in columns" :key="column.key">
                      <th :style="{ width: column.width + 'px' }">
                        <div
                          v-if="i !== 0"
                          class="d-flex align-center th-content"
                        >
                          <v-text-field
                            :model-value="column.title"
                            @update:model-value="
                              (val) => updateSubtaskHeaderTitle(column.key, val)
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
                            @mousedown="startResize($event, column)"
                          ></span>
                        </div>
                        <div v-else>
                          <v-checkbox
                            :model-value="allSelected"
                            :indeterminate="someSelected && !allSelected"
                            @update:model-value="toggleAll"
                            density="compact"
                            hide-details
                          />
                        </div>
                      </th>
                    </template>
                  </tr>
                </template>
                <template
                  v-for="col in subTaskHeadersValue"
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
                            isFocused(item.id, col.key) ? 'outlined' : 'plain'
                          "
                        />
                      </template>

                      <v-card>
                        <v-list>
                          <template v-if="!statusEditMode">
                            <v-list-item
                              v-for="(statusOption, i) in statuses"
                              :key="i"
                              @click="
                                () => {
                                  item.status = statusOption;
                                  item.statusMenu = false;
                                  updateValueRow(item, col.key);
                                }
                              "
                            >
                              <v-list-item-title>{{
                                statusOption
                              }}</v-list-item-title>
                            </v-list-item>
                          </template>
                          <template v-else>
                            <v-list-item
                              v-for="(editStatus, i) in editableStatuses"
                              :key="i"
                            >
                              <v-text-field
                                v-model="editableStatuses[i]"
                                density="compact"
                                variant="outlined"
                                hide-details
                              />
                            </v-list-item>
                          </template>

                          <v-divider></v-divider>

                          <v-list-item @click="toggleStatusEdit">
                            <v-list-item-title class="text-primary">
                              {{ statusEditMode ? "Done Editing" : "Edit" }}
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-card>
                    </v-menu>
                  </template>

                  <!-- Delete icon for 'actions' column -->
                  <template v-else-if="col.key === 'actions'">
                    <img
                      src="@/assets/tasks/delete.svg"
                      alt="Delete"
                      width="18"
                      height="18"
                      class="cursor-pointer"
                      style="filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);"
                      @click="deleteSubtaskRow(item.id)"
                    />
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
                <template #bottom="{ props }">
                  <div
                    class="d-flex justify-space-between align-center px-4 py-2"
                  >
                    <!-- Left side: Your custom button -->
                    <v-btn
                      @click="
                        () => {
                          console.log(props);
                          addSubtaskRow(item.id);
                        }
                      "
                      color="primary"
                      variant="tonal"
                    >
                      Add Row
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </td>
        </template>
        <template #bottom="{ props }">
          <div class="d-flex justify-space-between align-center px-4 py-2">
            <!-- Left side: Your custom button -->
            <v-btn @click="addRow" color="primary" variant="tonal">
              Add Row
            </v-btn>

            <!-- Right side: Default pagination component -->
            <v-data-table-footer v-bind="props" />
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
const { headers, rowItems, multiSelectOptions, subtaskHeaders } = defineProps({
  tableName: String,
  headers: Array,
  rowItems: Array,
  subtaskHeaders: Array,
  multiSelectOptions: Array,
});
const emit = defineEmits(["add-row", "add-subtask-row"]);
const expanded = ref([]);
const focusedField = ref({});
const visibleHeaders = ref([]);
const selected = ref(null);
const statuses = ref(["Pending", "In Progress", "Completed", "On Hold"]);


const editableStatuses = ref([...statuses.value]);
const statusEditMode = ref(false);
// sub tasks
const selectedSubtasks = ref(null);
const subTaskHeadersValue = subtaskHeaders;
const isFocused = (id, key) => {
  return focusedField.value[`${id}-${key}`] === true;
};

const setFocus = (id, key, state) => {
  focusedField.value[`${id}-${key}`] = state;
};

const favorites = ref([]);
const isInitialized = ref(false);

const updateValueColumn = (column) => {
  console.log(column);
  setFocus("header", column.key, false);
};
const updateSubtaskValueColumn = (column) => {
  console.log(column);
  setFocus("subheader", column.key, false);
};
const updateValueRow = (row, key) => {
  console.log(row, key);
  setFocus(row.id, key, false);
};

onMounted(() => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("favorites");
    console.log(stored);
    if (stored) {
      favorites.value = JSON.parse(stored);
    }
    isInitialized.value = true;
  }
});

watch(
  favorites,
  (newKeys) => {
    if (isInitialized.value && typeof window !== "undefined") {
      localStorage.setItem("favorites", JSON.stringify(newKeys));
    }
    visibleHeaders.value = headers.filter(
      (header) => header.key === "actions" || newKeys.includes(header.key)
    );
  },
  { immediate: true }
);
watch(selected, (newVal) => {
  console.log("Selected rows:", newVal);
});
watch(selectedSubtasks, (newVal) => {
  console.log("Selected subTasks rows:", newVal);
});
const toggleExpand = (item) => {
  console.log(item);
  const index = expanded.value.indexOf(item.id);
  if (index >= 0) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item.id);
  }
  console.log(expanded.value);
};

const deleteRow = (id) => {
  const index = rowItems.findIndex((item) => item.id === id);
  if (index !== -1) {
    rowItems.splice(index, 1);
  }
};
const deleteSubtaskRow = (subtaskId) => {
  for (const task of rowItems) {
    const index = task.subtasks.findIndex((sub) => sub.id === subtaskId);
    if (index !== -1) {
      task.subtasks.splice(index, 1);
      break; // subtask found and removed, exit loop
    }
  }
};
let currentCol = null;
let startX = 0;
let startWidth = 0;
function startResize(e, col) {
  currentCol = col;
  startX = e.clientX;
  startWidth = col.width;
  document.addEventListener("mousemove", resizeColumn);
  document.addEventListener("mouseup", stopResize);
}

function resizeColumn(e) {
  if (!currentCol) return;
  const diff = e.clientX - startX;
  currentCol.width = Math.max(150, startWidth + diff);
}

function stopResize() {
  document.removeEventListener("mousemove", resizeColumn);
  document.removeEventListener("mouseup", stopResize);
  currentCol = null;
}
const updateHeaderTitle = (key, value) => {
  const target = visibleHeaders.value.find((col) => col.key === key);
  if (target) {
    target.title = value;
  }
};
const updateSubtaskHeaderTitle = (key, value) => {
  const target = subTaskHeadersValue.find((col) => col.key === key);
  if (target) {
    target.title = value;
  }
};
const getUpdatedRowItems = () => {
  return rowItems;
};
const addRow = () => {
  emit("add-row");
};
const addSubtaskRow = (parentId) => {
  console.log(parentId);
  emit("add-subtask-row", parentId);
};
const toggleAll = (val) => {
  if (val) {
    selected.value = rowItems.slice(); // select all
  } else {
    selected.value = []; // deselect all
  }
};
const addStatusAndEdit = () => {
  if (!statusEditMode.value) {
    editableStatuses.value = [...statuses.value]; // sync before editing
    statusEditMode.value = true;
  }
  editableStatuses.value.push(""); // add new editable row
};

const toggleStatusEdit = () => {
  if (statusEditMode.value) {
    updateStatus();
  } else {
    editableStatuses.value = [...statuses.value];
    statusEditMode.value = true;
  }
};

const updateStatus = () => {
  const cleaned = editableStatuses.value.filter(s => s.trim() !== '');
  statuses.value = [...cleaned];
  editableStatuses.value = [...cleaned];
  statusEditMode.value = false;
};
</script>

<style scoped>
:deep() .v-table .v-table__wrapper > table > thead > tr > th {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep() .v-table .v-table__wrapper > table > thead > tr > th {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep() .v-table .v-table__wrapper > table > tbody > tr > td,
.v-table .v-table__wrapper > table > tbody > tr > th {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.resizable-table {
  min-height: 85vh;
}
.resizable-table .v-table {
  table-layout: fixed !important;
}
.resizable-table .th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.resize-handle {
  width: 5px;
  cursor: col-resize;
  height: 100%;
  position: absolute;
  right: -16px;
  top: 0;
}
</style>
