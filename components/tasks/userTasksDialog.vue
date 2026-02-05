<template>
  <div>
    <!-- Exact copy from team tasks but without the header -->
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
                      <!-- Remove menu for read-only mode -->
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

          <!-- Remove add button for read-only mode -->
        </div>
      </div>
      <v-tabs-window v-model="currentTab">
        <v-tabs-window-item :value="currentTab">
          <div v-if="taskDetails && taskDetails.length > 0" class="clean-task-display">
            <!-- Clean task display copied from listView but without toolbar -->
            <v-expansion-panels
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
                {{
                  group.total ??
                  getStatusTotal(group.status) ??
                  group.tasks.length
                }}
              </v-chip>
            </div>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table-server
            v-if="group.tasks.length"
            :items="group.tasks"
            :headers="headers"
            :items-per-page="pageSize"
            :items-per-page-options="[10, 25, 50, 100, { value: -1, title: 'All' }]"
            :items-length="group.total ?? group.tasks.length"
            :page="page"
            item-value="id"
            class="resizable-table read-only-table"
            density="compact"
            @update:page="onPageChange"
            @update:items-per-page="onPageSizeChange"
            return-object
            hover
          >

            <template v-slot:headers="{ columns }">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  :style="{
                    width: column.width + 'px',
                    minWidth: column.width + 'px',
                    padding: '0px 7px',
                    backgroundColor: '#F6F6F6',
                    fontSize: '14px',
                    position: column.key === 'title' ? 'sticky' : 'relative',
                    left: column.key === 'title' ? '0px' : undefined,
                    zIndex: column.key === 'title' ? 3 : 1,
                  }"
                >
                  <div class="d-flex align-center th-content">
                    <span>{{ column.title }}</span>
                  </div>
                </th>
              </tr>
            </template>
            <template
              v-for="col in headers"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <template v-if="col.key === 'title'">
                <div class="pa-1 d-flex justify-space-between align-center">
                  <span class="font-weight-medium">{{ item.title }}</span>
                </div>
              </template>

              <!-- Inside v-slot:[`item.${col.key}`] -->
              <template v-else-if="col.key === 'status'">
                <DataTableColumnsStatus
                  :statuses="taskStatuses"
                  :selected="item"
                  :column="col"
                  read-only
                />
              </template>
              <template v-else-if="col.key === 'priority.name'">
                <DataTableColumnsPriorities
                  :priorities="taskPriorities"
                  :selected="item"
                  :column="col"
                  read-only
                />
              </template>
              <template v-else-if="col.key === 'frequency'">
                <DataTableColumnsFrequencies
                  :selected="item"
                  :column="col"
                  read-only
                />
              </template>
              <template v-else-if="col.key === 'attachments'">
                <DataTableColumnsAttachments 
                  :attachments="item.attachments" 
                  read-only 
                />
              </template>
              <template v-else-if="col.key === 'createdAt'">
                <span class="text-caption">{{ formatDate(item.createdAt) }}</span>
              </template>
              <template v-else-if="col.key == 'dueDate'">
                <DataTableColumnsDueDate
                  :model-value="item.dueDate"
                  read-only
                />
              </template>
              <template v-else-if="col.key === 'documentLink'">
                <div class="d-flex align-center pa-1">
                  <template
                    v-if="
                      item.documentLink && item.documentLink.startsWith('http')
                    "
                  >
                    <CommonTruncatedText
                      :text="item.documentLink"
                      :max-width="150"
                      text-class="template-link-text"
                    >
                      <template #default="{ truncatedText, style }">
                        <a
                          :href="item.documentLink"
                          target="_blank"
                          rel="noopener"
                          class="template-link-anchor"
                          :style="style"
                        >
                          {{ truncatedText }}
                        </a>
                      </template>
                    </CommonTruncatedText>
                  </template>
                  <template v-else>
                    <span class="text-caption">{{ item.documentLink || '-' }}</span>
                  </template>
                </div>
              </template>
              <template v-else-if="col.key === 'updatedAt'">
                <span class="text-caption">{{ formatDate(item.updatedAt) }}</span>
              </template>

              <!-- Hide actions column in read-only mode -->
              <template v-else-if="col.key === 'actions'">
                <span class="text-grey">-</span>
              </template>
              <!-- avatar assignedUser -->
              <template v-else-if="col.key === 'assignedUser.fullName'">
                <DataTableColumnsAssignedUsers
                  :user-task-id="item.id"
                  :assigned-users="item.assignedUsers || []"
                  :all-users="userList"
                  :current-user="user"
                  read-only
                />
              </template>
              <!-- Assigned By column with avatar -->
              <template v-else-if="col.key === 'assigner.fullName'">
                <DataTableColumnsAssignedBy
                  :assigner="item.assigner"
                />
              </template>
              <!-- Custom column template -->
              <template v-else-if="col.isCustom">
                <!-- Text field -->
                <div v-if="col.dataType === 'text'" class="d-flex align-center pa-1">
                  <v-text-field
                    :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                    @update:modelValue="(val) => {
                      setCustomFieldValue(item, col.columnDefinitionId, val);
                    }"
                    :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                    @blur="updateCustomFieldRow(item, col.columnDefinitionId, col.key)"
                    density="compact"
                    @keyup.enter="(e) => handleEnterKey(e, item, col.key)"
                    @keyup.escape="(e) => handleEscapeKeyCustom(e, item, col.columnDefinitionId, col.key)"
                    hide-details
                    class="small-input"
                  />
                </div>
                <!-- Number field -->
                <div v-else-if="col.dataType === 'number'" class="d-flex align-center pa-1">
                  <v-text-field
                    :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                    @update:modelValue="(val) => {
                      setCustomFieldValue(item, col.columnDefinitionId, val);
                    }"
                    type="number"
                    :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                    @blur="updateCustomFieldRow(item, col.columnDefinitionId, col.key)"
                    density="compact"
                    @keyup.enter="(e) => handleEnterKey(e, item, col.key)"
                    @keyup.escape="(e) => handleEscapeKeyCustom(e, item, col.columnDefinitionId, col.key)"
                    hide-details
                    class="small-input"
                  />
                </div>
                <!-- Date field -->
                <div v-else-if="col.dataType === 'date'" class="d-flex align-center pa-1">
                  <DataTableColumnsDueDate
                    :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                    @update:modelValue="(val) => {
                      setCustomFieldValue(item, col.columnDefinitionId, val);
                      updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                    }"
                  />
                </div>
                <!-- Boolean field -->
                <div v-else-if="col.dataType === 'boolean'" class="d-flex align-center pa-1">
                  <v-select
                    :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                    @update:modelValue="(val) => {
                      setCustomFieldValue(item, col.columnDefinitionId, val);
                      updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                    }"
                    :items="[{ title: 'True', value: 'true' }, { title: 'False', value: 'false' }]"
                    item-title="title"
                    item-value="value"
                    :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                    @blur="setFocus(item.id, col.key, false)"
                    density="compact"
                    hide-details
                    class="small-input"
                  />
                </div>
                <!-- Dropdown field -->
                <div v-else-if="col.dataType === 'dropdown'" class="d-flex align-center pa-1">
                  <v-select
                    :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                    @update:modelValue="(val) => {
                      setCustomFieldValue(item, col.columnDefinitionId, val);
                      updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                    }"
                    :items="col.dropdownOptions || []"
                    :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                    @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                    @blur="setFocus(item.id, col.key, false)"
                    density="compact"
                    hide-details
                    class="small-input"
                  />
                </div>
              </template>
              <!-- Generic editable field for all other columns -->
              <template v-else>
                <div class="d-flex align-center pa-1">
                  <v-text-field
                    :model-value="getNestedValue(item, col.key)"
                    @update:modelValue="
                      (val) => {
                        setNestedValue(item, col.key, val);
                      }
                    "
                    :variant="
                      isFocused(item.id, col.key) ? 'outlined' : 'plain'
                    "
                    @focus="
                      () => {
                        setFocus(item.id, col.key, true);
                        storeOriginalValue(item.id, col.key, item);
                      }
                    "
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
                                @pointerdown="
                                  startResize($event, column, index)
                                "
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
                        <v-select
                          :model-value="getStatusId(item)"
                          :items="statuses"
                          item-title="name"
                          item-value="id"
                          density="compact"
                          hide-details
                          variant="outlined"
                          class="small-input"
                          bg-color="white"
                          @update:modelValue="onStatusChange(item, $event)"
                        />
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

                      <!-- Custom column template for subtasks -->
                      <template v-else-if="col.isCustom">
                        <!-- Text field -->
                        <div v-if="col.dataType === 'text'" class="d-flex align-center pa-1">
                          <v-text-field
                            :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                            @update:modelValue="(val) => {
                              setCustomFieldValue(item, col.columnDefinitionId, val);
                            }"
                            :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                            @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                            @blur="updateCustomFieldRow(item, col.columnDefinitionId, col.key)"
                            density="compact"
                            @keyup.enter="(e) => handleEnterKey(e, item, col.key)"
                            @keyup.escape="(e) => handleEscapeKeyCustom(e, item, col.columnDefinitionId, col.key)"
                            hide-details
                            class="small-input"
                          />
                        </div>
                        <!-- Number field -->
                        <div v-else-if="col.dataType === 'number'" class="d-flex align-center pa-1">
                          <v-text-field
                            :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                            @update:modelValue="(val) => {
                              setCustomFieldValue(item, col.columnDefinitionId, val);
                            }"
                            type="number"
                            :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                            @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                            @blur="updateCustomFieldRow(item, col.columnDefinitionId, col.key)"
                            density="compact"
                            @keyup.enter="(e) => handleEnterKey(e, item, col.key)"
                            @keyup.escape="(e) => handleEscapeKeyCustom(e, item, col.columnDefinitionId, col.key)"
                            hide-details
                            class="small-input"
                          />
                        </div>
                        <!-- Date field -->
                        <div v-else-if="col.dataType === 'date'" class="d-flex align-center pa-1">
                          <DataTableColumnsDueDate
                            :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                            @update:modelValue="(val) => {
                              setCustomFieldValue(item, col.columnDefinitionId, val);
                              updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                            }"
                          />
                        </div>
                        <!-- Boolean field -->
                        <div v-else-if="col.dataType === 'boolean'" class="d-flex align-center pa-1">
                          <v-select
                            :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                            @update:modelValue="(val) => {
                              setCustomFieldValue(item, col.columnDefinitionId, val);
                              updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                            }"
                            :items="[{ title: 'True', value: 'true' }, { title: 'False', value: 'false' }]"
                            item-title="title"
                            item-value="value"
                            :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                            @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                            @blur="setFocus(item.id, col.key, false)"
                            density="compact"
                            hide-details
                            class="small-input"
                          />
                        </div>
                        <!-- Dropdown field -->
                        <div v-else-if="col.dataType === 'dropdown'" class="d-flex align-center pa-1">
                          <v-select
                            :model-value="getCustomFieldValue(item, col.columnDefinitionId)"
                            @update:modelValue="(val) => {
                              setCustomFieldValue(item, col.columnDefinitionId, val);
                              updateCustomFieldRow(item, col.columnDefinitionId, col.key);
                            }"
                            :items="col.dropdownOptions || []"
                            :variant="isFocused(item.id, col.key) ? 'outlined' : 'plain'"
                            @focus="() => { setFocus(item.id, col.key, true); storeOriginalCustomValue(item.id, col.columnDefinitionId, item); }"
                            @blur="setFocus(item.id, col.key, false)"
                            density="compact"
                            hide-details
                            class="small-input"
                          />
                        </div>
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
                @click="
                  openAddTaskDialogForStatus(group.status, currentCategoryId)
                "
                class="add-status-task-btn"
              >
                <v-icon size="16" class="mr-1">mdi-plus-circle-outline</v-icon>
                Add Task
              </v-btn>
              <v-spacer></v-spacer>
            </template>
          </v-data-table-server>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
          </div>
          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
            <div class="text-h6 text-grey-darken-1 mt-2">No tasks found</div>
            <div class="text-body-2 text-grey">
              {{ isCurrentUser ? 'You have' : `${userName} has` }} no tasks in this category.
            </div>
          </div>
          <!-- Remove action bar for read-only mode -->
        </v-tabs-window-item>
      </v-tabs-window>
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

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  isCurrentUser: {
    type: Boolean,
    default: false
  }
})

const { xs } = useDisplay();

// Stores
const taskStore = useTaskStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const userStore = useUserStore();

// Variables (exact copy from team tasks)
const taskDetails = ref([]);
const headers = ref([]);
const taskStatuses = ref([]);
const taskPriorities = ref([]);
const currentTab = ref(0);
const categories = ref([]);
const taskStats = ref([]);
const user = ref(null);
const userList = ref([]);
const isTrayHidden = ref(true);
const activeFilters = ref({});
const page = ref(1);
const pageSize = ref(10);
const statusTotals = ref({});
const totalCount = ref(0);
const hiddenCategoryIds = ref([]);
const categoryOrder = ref([]);
const selectedRowItems = ref([]);
const openedPanels = ref([]);
const hiddenCategoryStorageKey = `userTasksHiddenCategoryIds_${props.userId}`;
const categoryOrderStorageKey = `userTasksCategoryOrder_${props.userId}`;

// Use the same headers as the original team tasks

// Custom scrolling functionality (exact copy)
const tabsScrollContainer = ref(null);
const tabRefs = ref({});
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const showScrollButtons = ref(false);
const isScrolling = ref(false);

const setTabRef = (el, categoryId) => {
  if (el) {
    tabRefs.value[categoryId] = el;
  }
};

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

const autoUnhideCategories = (list = []) => {
  const nextHidden = autoUnhideCategoryIds(hiddenCategoryIds.value, list || []);
  const isSame =
    nextHidden.length === hiddenCategoryIds.value.length &&
    nextHidden.every((id, idx) => id === hiddenCategoryIds.value[idx]);
  if (!isSame) {
    hiddenCategoryIds.value = nextHidden;
  }
};

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

// Custom scroll methods (exact copy from team tasks)
const updateScrollButtons = () => {
  if (!tabsScrollContainer.value || isScrolling.value) {
    return;
  }

  const container = tabsScrollContainer.value;
  const scrollLeft = container.scrollLeft;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;

  const hasOverflow = scrollWidth > clientWidth + 1;
  showScrollButtons.value = hasOverflow;

  canScrollLeft.value = hasOverflow && scrollLeft > 5;
  canScrollRight.value = hasOverflow && scrollLeft < scrollWidth - clientWidth - 5;
};

const scrollTabs = (direction) => {
  if (!tabsScrollContainer.value) return;

  const container = tabsScrollContainer.value;
  const scrollAmount = 200;

  const targetScroll = direction === 'left'
    ? container.scrollLeft - scrollAmount
    : container.scrollLeft + scrollAmount;

  isScrolling.value = true;

  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });

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

  const isFullyVisible =
    tabRect.left >= containerRect.left + 10 &&
    tabRect.right <= containerRect.right - 10;

  if (!isFullyVisible) {
    const tabOffsetLeft = tabElement.offsetLeft;
    const tabWidth = tabElement.offsetWidth;
    const containerWidth = container.clientWidth;

    const targetScroll = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);

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

// Methods (exact copy from team tasks)
const getIcon = (categoryName) => getTaskCategoryIcon(categoryName);

const availableHeaders = computed(() => {
  return mainStore.getTeamTaskAllHeaders;
});

const getTabStyle = (cat) => {
  const bgColor = cat?.color;
  if (!bgColor) return {};
  const textColor = getContrastingTextColor(bgColor);
  return {
    backgroundColor: bgColor,
    "--tab-text-color": textColor,
  };
};

const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) {
      userList.value = res.data.filter((x) => (x.orgStatus || x.status) === 'Active');
    }
  });
};

// Helper methods for task display
const getColor = (status) => {
  const colors = {
    'todo': 'info',
    'pending': 'warning', 
    'completed': 'success',
    'archived': 'grey',
    'in-progress': 'warning'
  };
  return colors[status] || 'grey';
};

const getStatuses = (key) => {
  const statusMap = {
    'todo': 'To Do',
    'pending': 'In Progress',
    'completed': 'Completed', 
    'archived': 'Archived',
    'in-progress': 'In Progress'
  };
  return statusMap[key] || key;
};

const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return date;
  }
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

  activeFilters.value = { ...activeFilters.value, ...filters };

  const request = {
    ...activeFilters.value,
    categoryId: currentTab.value,
    page: page.value,
    pageSize: pageSize.value,
  };

  // Add user filter for team tasks
  if (!props.isCurrentUser) {
    request.userId = props.userId;
  }

  const storeMethod = props.isCurrentUser 
    ? taskStore.tasksGroupedByStatusWithCache
    : taskStore.teamTasksGroupedByStatus;

  storeMethod(request)
    .then((res) => {
      if (res.code === 0) {
        setTaskResponse(res.data);
      }
    })
    .catch(() => {});
};

const applyFilters = (filters) => {
  loadTasks(filters, true);
};

const handlePageChange = (val) => {
  page.value = val;
  loadTasks({}, false);
};

const handlePageSizeChange = (val) => {
  pageSize.value = val;
  loadTasks({}, true);
};

// Add the event handlers that the data table expects
const onPageChange = (newPage) => {
  page.value = newPage;
  loadTasks({}, false);
};

const onPageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize;
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

const getTaskStatsByCategory = async () => {
  await ensureCategoriesLoaded();
  try {
    // Use different methods for current user vs team member
    const res = props.isCurrentUser
      ? await taskStore.getMyTaskStatsByCategory()
      : await taskStore.getTeamTaskStatsByCategory();
      
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

const getTaskStatuses = () => {
  orgStore.getTaskStatuses().then((res) => {
    if (res.code === 0) {
      taskStatuses.value = res.data;
    }
  });
};

const getTaskPriorities = () => {
  orgStore.getTaskPriorities().then((res) => {
    if (res.code === 0) {
      taskPriorities.value = res.data;
    }
  });
};

const updateTasks = () => {
  getTaskStatsByCategory();
};

const getTeamTasks = (categoryId) => {
  if (categoryId !== undefined && categoryId !== null) {
    currentTab.value = categoryId;
  }
  loadTasks({}, true);
};

const updateSelectedRowItems = (items) => {
  isTrayHidden.value = false;
  selectedRowItems.value = items;
};

onMounted(async () => {
  loadHiddenCategories();
  loadCategoryOrder();
  user.value = JSON.parse(localStorage.getItem("user"));
  
  headers.value = mainStore.getTeamTaskTableHeaders;
  
  // Open all panels by default
  openedPanels.value = [0, 1, 2, 3, 4];
  
  await getCategories();
  await getTaskStatsByCategory();
  getTaskStatuses();
  getTaskPriorities();
  getUsers();

  // Initialize custom scroll functionality
  nextTick(() => {
    if (tabsScrollContainer.value) {
      const container = tabsScrollContainer.value;

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

      const resizeObserver = new ResizeObserver(() => {
        if (!isScrolling.value) {
          updateScrollButtons();
        }
      });
      resizeObserver.observe(container);

      setTimeout(() => {
        updateScrollButtons();
      }, 300);
    }
  });
});

watch(currentTab, (newVal) => {
  getTeamTasks(newVal);
  if (!isScrolling.value) {
    nextTick(() => {
      setTimeout(() => {
        scrollToActiveTab();
      }, 150);
    });
  }
});

watch(orderedTaskStats, () => {
  if (!isScrolling.value) {
    nextTick(() => {
      setTimeout(() => updateScrollButtons(), 200);
    });
  }
}, { deep: true });
</script>

<style scoped lang="scss">
/* Exact copy of team tasks styles */
.task-summary {
  margin-bottom: 20px;
}

.tabs-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 8px;
}

.tabs-scroll-wrapper {
  flex: 1;
  overflow: hidden;
}

.custom-tabs-container {
  display: flex;
}

.tabs-draggable-list {
  display: flex;
  gap: 8px;
}

.custom-tab-item {
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.custom-tab-active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.tab-inner {
  width: 100%;
}

.tab-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-nav-btn {
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-nav-left {
  margin-right: 8px;
}

.scroll-nav-right {
  margin-left: 8px;
}

/* Clean task display styling */
.clean-task-display {
  .border-sm {
    border: 1px solid #e0e0e0;
    margin-bottom: 8px;
  }
  
  .task-title-cell {
    max-width: 300px;
    
    .font-weight-medium {
      font-weight: 500;
      line-height: 1.2;
    }
    
    .text-caption {
      line-height: 1.3;
      margin-top: 2px;
    }
  }
  
  .read-only-table {
    .v-data-table__tr:hover {
      background-color: rgba(var(--v-theme-primary), 0.04);
    }
  }
}
</style>