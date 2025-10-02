<template>
  <div style="background-color: white" class="rounded-lg mt-5">
    <!-- Tabs -->
    <v-tabs v-model="currentTab" class="custom-tabs" slider-color="primary">
      <v-tab class="tab-text" value="active"> Active Rotas </v-tab>

      <v-tab class="tab-text" value="old"> Old Rotas </v-tab>

      <v-tab class="tab-text" value="shifts"> Shifts </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-tabs-window v-model="currentTab">
      <v-tabs-window-item value="active">
        <div>
          <!-- Toolbar: left = date range + search, right = create button -->
          <div class="d-flex align-center justify-space-between my-4">
            <div class="d-flex align-center" style="gap: 12px">
              <v-menu
                v-model="menuDate"
                max-width="420"
                offset-y
                :close-on-content-click="false"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    readonly
                    variant="solo"
                    density="compact"
                    hide-details
                    class="date-activator rounded-lg input-bordered"
                    width="200"
                    :placeholder="dateRangeText || 'Select date range'"
                    :value="dateRangeText"
                    append-inner-icon="mdi-calendar-range"
                    flat
                  />
                </template>

                <v-card>
                  <v-date-picker
                    v-model="tempRange"
                    range
                    color="primary"
                    locale="en-GB"
                  />
                  <v-card-actions class="px-3">
                    <v-spacer />
                    <v-btn text @click="clearDate">Clear</v-btn>
                    <v-btn color="primary" variant="text" @click="applyDate"
                      >Apply</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-menu>

              <!-- Search -->
              <v-text-field
                v-model="search"
                placeholder="Search "
                density="compact"
                hide-details
                append-inner-icon="mdi-magnify"
                class="rounded-lg input-bordered"
                width="200"
                variant="solo"
                flat
              />
            </div>

            <!-- Create new rota -->
            <v-btn
              v-if="isManager"
              color="primary"
              class="rounded-lg"
              @click="emit('changeComponent', 2)"
              flat
              height="40"
            >
              Create New Rota
            </v-btn>
          </div>

          <!-- Expansion panels -->
          <v-expansion-panels v-model="openedPanels" multiple flat>
            <!-- Published -->
            <v-expansion-panel class="border-sm">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-chip
                    class="rounded-lg mr-2"
                    size="large"
                    color="#8C3BC5"
                    prepend-icon="mdi-open-in-new"
                  >
                    Published
                  </v-chip>
                  <v-chip class="rounded-lg" size="large" color="#8C3BC5">
                    {{ filteredPublished.length }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-data-table
                  :headers="headers"
                  :items="filteredPublished"
                  item-value="id"
                  show-select
                  hover
                  class="rota-table"
                  v-model="selectedPublished"
                  :item-selectable="() => true"
                  @update:modelValue="onSelectionChangePublished"
                  return-object
                >
                <template
              v-slot:[`item.data-table-select`]="{
                internalItem,
                isSelected,
                toggleSelect,
              }"
            >
            <div class="text-center">

              <input
                type="checkbox"
                :checked="isSelected(internalItem)"
                @change="() => toggleSelect(internalItem)"
                class="cust-checkbox"
              />
            </div>
            </template>
                  <!-- Header slot -->
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
                        <th
                          :style="{
                            width: i === 0 ? '50px' : '',
                            padding: '6px 8px',
                            backgroundColor: '#F6F6F6',
                            fontSize: '14px',
                          }"
                        >
                          <div
                            v-if="i !== 0"
                            class="d-flex align-center justify-space-between"
                          >
                            <span>{{ column.title }}</span>
                            <v-icon
                              v-if="column.sortable"
                              size="14"
                              class="ml-1"
                              @click="toggleSort(column)"
                            >
                              {{ getSortIcon(column) }}
                            </v-icon>
                          </div>

                         
                            <div
                         v-else
                      class="d-flex align-center justify-center"
                    >
                      <input
                        type="checkbox"
                        class="cust-checkbox"
                        style="margin-left: 2px;"
                        :checked="allSelected"
                        :indeterminate.prop="someSelected && !allSelected"
                        @change="toggleAll('published')"
                      />
                    </div>
                      
                        </th>
                      </template>
                    </tr>
                  </template>

                  <!-- Cells -->
                  <template v-slot:[`item.name`]="{ item }">
                    <div class="px-2">{{ item.name }}</div>
                  </template>

                  <template v-slot:[`item.startDate`]="{ item }">
                    <div class="px-2">
                      {{ parsedDate(item.startDate) }}
                    </div>
                  </template>

                  <template v-slot:[`item.employees`]="{ item }">
                    <div class="px-2">
                      {{ item.employees ?? "No data" }}
                    </div>
                  </template>
                  <template v-slot:[`item.duration`]="{ item }">
                    <div class="px-2">
                      {{ item?.duration + " days" }}
                    </div>
                  </template>

                  <template v-slot:[`item.status`]="{ item }">
                    <div class="px-2">
                      <v-chip
                        :color="getRotaStatusColor(getRotaStatus(item))"
                        label
                      >
                        {{ getRotaStatus(item) }}
                      </v-chip>
                    </div>
                  </template>

                  <template v-slot:[`item.actions`]="{ item }">
                    <div class="px-4 d-flex align-center">
                      <img
                        src="@/assets/icons/teamfloss/userDetails/view.svg"
                        alt="View"
                        class="action-icon"
                        @click.stop="onView(item)"
                      />
                      <img
                        v-if="isManager"
                        src="@/assets/icons/teamfloss/userDetails/edit.svg"
                        alt="Edit"
                        class="action-icon ml-3"
                        @click.stop="onEdit(item)"
                      />
                      <img
                        v-if="isManager"
                        src="@/assets/icons/teamfloss/userDetails/unpublish.svg"
                        alt="Edit"
                        class="action-icon ml-3"
                        @click.stop="changeRotaStatus('unpublish', item)"
                      />
                    </div>
                  </template>
                </v-data-table>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Unpublished -->
            <v-expansion-panel class="border-sm">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-chip
                    class="rounded-lg mr-2"
                    size="large"
                    color="#0165B9"
                    prepend-icon="mdi-cancel"
                  >
                    Unpublished
                  </v-chip>
                  <v-chip class="rounded-lg" size="large" color="#0165B9">
                    {{ filteredUnpublished.length }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-data-table
                  :headers="headers"
                  :items="filteredUnpublished"
                  item-value="id"
                  show-select
                  hover
                  class="rota-table"
                  v-model="selectedUnpublished"
                  :item-selectable="() => true"
                  @update:modelValue="onSelectionChangeUnPublished"
                  return-object
                >
                <template
              v-slot:[`item.data-table-select`]="{
                internalItem,
                isSelected,
                toggleSelect,
              }"
            >
            <div class="text-center">

              <input
                type="checkbox"
                :checked="isSelected(internalItem)"
                @change="() => toggleSelect(internalItem)"
                class="cust-checkbox"
              />
            </div>
            </template>
                  <!-- Header slot -->
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
                        <th
                          :style="{
                            width: i === 0 ? '50px' : column.width + 'px',
                            padding: '6px 8px',
                            backgroundColor: '#F6F6F6',
                            fontSize: '14px',
                          }"
                        >
                          <div
                            v-if="i !== 0"
                            class="d-flex align-center justify-space-between"
                          >
                            <span>{{ column.title }}</span>
                            <v-icon
                              v-if="column.sortable"
                              size="14"
                              class="ml-1"
                              @click="toggleSort(column)"
                            >
                              {{ getSortIcon(column) }}
                            </v-icon>
                          </div>

                          <div
                         v-else
                      class="d-flex align-center justify-center"
                    >
                      <input
                        type="checkbox"
                        class="cust-checkbox"
                        style="margin-left: 2px;"
                        :checked="allSelected"
                        :indeterminate.prop="someSelected && !allSelected"
                        @change="toggleAll('unpublished')"
                      />
                    </div>
                        </th>
                      </template>
                    </tr>
                  </template>

                  <!-- Cells -->
                  <template v-slot:[`item.name`]="{ item }">
                    <div class="px-2">{{ item.name }}</div>
                  </template>

                  <template v-slot:[`item.startDate`]="{ item }">
                    <div class="px-2">
                      {{ parsedDate(item.startDate) }}
                    </div>
                  </template>

                  <template v-slot:[`item.employees`]="{ item }">
                    <div class="px-2">
                      {{ item.employees ?? "No data" }}
                    </div>
                  </template>
                  <template v-slot:[`item.duration`]="{ item }">
                    <div class="px-2">
                      {{ item?.duration + " days" }}
                    </div>
                  </template>

                  <template v-slot:[`item.status`]="{ item }">
                    <div class="px-2">
                      <v-chip
                        :color="getRotaStatusColor(getRotaStatus(item))"
                        label
                      >
                        {{ getRotaStatus(item) }}
                      </v-chip>
                    </div>
                  </template>

                  <template v-slot:[`item.actions`]="{ item }">
                    <div class="px-4 d-flex align-center">
                      <img
                        src="@/assets/icons/teamfloss/userDetails/view.svg"
                        alt="View"
                        class="action-icon"
                        @click.stop="onView(item)"
                      />
                      <img
                        v-if="isManager"
                        src="@/assets/icons/teamfloss/userDetails/edit.svg"
                        alt="Edit"
                        class="action-icon ml-3"
                        @click.stop="onEdit(item)"
                      />
                      <img
                        v-if="isManager"
                        src="@/assets/icons/teamfloss/userDetails/publish.svg"
                        alt="Publish"
                        class="action-icon ml-3"
                        @click.stop="changeRotaStatus('publish', item)"
                      />
                    </div>
                  </template>
                </v-data-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="old">
        <div class="pa-4">
          <h3 class="tab-content-title">Old Rotas Content</h3>
          <p>Here goes the hardcoded content for Old Rotas.</p>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="shifts">
        <div class="pa-4">
          <h3 class="tab-content-title">Shifts Content</h3>
          <p>Here goes the hardcoded content for Shifts.</p>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
<script setup>
const { isManager } = useUser();
import { parsedDate } from "~/lib/dateFormatter";
const { rotaList } = defineProps({
  rotaList: Array,
});

const emit = defineEmits(["onChangeStatus", "changeComponent", "getAllShifts"]);

const currentTab = ref(0);
const menuDate = ref(false);
const tempRange = ref([]); // temporary picker selection (array: [start, end])
const dateRangeModel = ref([]); // applied range
const search = ref("");
const openedPanels = ref([0]);
const published = computed(() => rotaList.filter((r) => r.isPublished));
const unpublished = computed(() => rotaList.filter((r) => !r.isPublished));
// Selection models
const selectedPublished = ref([]);
const selectedUnpublished = ref([]);
const isAllPublishedSelected=ref(false);
const isAllUnPublishedSelected=ref(false);

const headers = [
  { title: "Rota Name", key: "name", sortable: true },
  { title: "Start Date", key: "startDate", sortable: true },
  { title: "No of Employees", key: "employees", sortable: false },
  { title: "Rota Duration", key: "duration", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

const matchesSearch = (item) => {
  if (!search.value) return true;
  const q = search.value.toLowerCase();
  return (
    (item.name && item.name.toLowerCase().includes(q)) ||
    String(item.employees).includes(q) ||
    (item.status && item.status.toLowerCase().includes(q))
  );
};

const inDateRange = (item) => {
  if (!dateRangeModel.value || dateRangeModel.value.length !== 2) return true;
  if (!item.startDate) return false;
  const [sRaw, eRaw] = dateRangeModel.value;
  const s = new Date(sRaw);
  s.setHours(0, 0, 0, 0);
  const e = new Date(eRaw);
  e.setHours(23, 59, 59, 999);
  const d = new Date(item.startDate);
  return d >= s && d <= e;
};

const filteredPublished = computed(() =>
  published.value.filter((it) => matchesSearch(it) && inDateRange(it))
);
const filteredUnpublished = computed(() =>
  unpublished.value.filter((it) => matchesSearch(it) && inDateRange(it))
);

const toggleAll = (which) => {
  if (which === "published") {

    if (isAllPublishedSelected.value) {
      isAllPublishedSelected.value = false;
      selectedPublished.value = [];
    } else {
      const selected = [];
      filteredPublished.value.forEach((r) => {
        
          selected.push(r);
      
      });
      selectedPublished.value = selected;
      isAllPublishedSelected.value = true;
    }
     console.log(selectedPublished.value)
  } else if(which === "unpublished"){
    if (isAllUnPublishedSelected.value) {
      isAllUnPublishedSelected.value = false;
      selectedUnpublished.value = [];
    } else {
      const selected = [];
      filteredUnpublished.value.forEach((r) => {
        
          selected.push(r);
      
      });
      selectedUnpublished.value = selected;
      isAllUnPublishedSelected.value = true;
    }
     console.log(selectedUnpublished.value)
  }
};
const onSelectionChangePublished=(newSelected) => {
  console.log( selectedPublished.value);
};
const onSelectionChangeUnPublished=(newSelected) => {
  console.log( selectedUnpublished.value);
};
function applyDate() {
  dateRangeModel.value = tempRange.value ? [...tempRange.value] : [];
  menuDate.value = false;
}
function clearDate() {
  tempRange.value = [];
  dateRangeModel.value = [];
}

// date-range display text
const dateRangeText = computed(() => {
  if (!dateRangeModel.value || dateRangeModel.value.length !== 2) return "";
  return `${parsedDate(dateRangeModel.value[0])} - ${parsedDate(
    dateRangeModel.value[1]
  )}`;
});
const changeRotaStatus = (type, item) => {
  emit("onChangeStatus", { type, id: item.id });
};
const onView = (item) => {
  emit("getAllShifts", item);
};
function getRotaStatus(item) {
  const now = new Date();
  const start = new Date(item.startDate);
  const end = new Date(item.endDate);

  if (now < start) {
    return "Up Coming";
  } else if (now >= start && now <= end) {
    return "In Progress";
  } else {
    return "Expired";
  }
}
function getRotaStatusColor(status) {
  switch (status) {
    case "In Progress":
      return "#33B93C"; // green
    case "Up Coming":
      return "#FF7C00"; // blue
    case "Expired":
      return "#D32F2F"; // red
    default:
      return "#6D6D6D"; // gray fallback
  }
}

</script>
<style scoped>
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
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
  height: 2px;
}

.tab-content-title {
  
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}
/* expansion table */
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
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
:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}
.chip-published {
  background-color: #8c3bc51a !important;
  color: #8c3bc5 !important;
}
.chip-unpublished {
  background-color: #0165b91a !important;
  color: #0165b9 !important;
}
.chip-count {
  background-color: #f3f3f3;
  color: #333;
}
.chip-progress {
  background-color: #33b93c1a !important;
  color: #33b93c !important;
}
.chip-future {
  background-color: #ff7c001a !important;
  color: #ff7c00 !important;
}

.action-icon {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  cursor: pointer;
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
  margin-top: 5px;
}
.cust-checkbox:checked {
  background: #0061FB;
  border-color: #0061FB;
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

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
