<template>
  <!-- <TeamFlossRotaManagement/> -->
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Rota management</p>
    </div>
    <div class="pa-5 bg-white" v-if="step === 1">
      <v-row>
        <v-col v-for="(item, idx) in data" :key="idx" cols="12" md="3">
          <v-card class="stat-card pa-6" elevation="0">
            <!-- Lordicon -->
            <lord-icon :src="item.icon" trigger="hover" class="lordicon" />

            <!-- Text Section -->
            <div class="">
              <h3 class="stat-title">{{ item.title }}</h3>
              <p class="stat-count" :style="{ color: item.color }">
                {{ item.count }}
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <!-- rota tabs -->
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
                  color="primary"
                  class="rounded-lg"
                  @click="onCreateNewRota"
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
                        :style="{ backgroundColor: '#8C3BC51A' }"
                        prepend-icon="mdi-open-in-new"
                      >
                        Published
                      </v-chip>
                      <v-chip
                        class="rounded-lg"
                        size="large"
                        :style="{ backgroundColor: '#8C3BC51A' }"
                      >
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
                      <!-- Header slot (same structure as your original code) -->
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

                              <div v-else>
                                <v-checkbox
                                  :model-value="allSelected"
                                  :indeterminate="someSelected && !allSelected"
                                  @update:model-value="
                                    (val) => toggleAll('published', val)
                                  "
                                  density="compact"
                                  hide-details
                                  variant="outlined"
                                  class="custom-checkbox"
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
                          {{ formattedDate(item.startDate) }}
                        </div>
                      </template>

                      <template v-slot:[`item.employees`]="{ item }">
                        <div class="px-2">{{ item.employees }}</div>
                      </template>

                      <template v-slot:[`item.status`]="{ item }">
                        <div class="px-2">
                          <v-chip
                            size="small"
                            :style="{
                              backgroundColor:
                                item.status === 'In Progress'
                                  ? '#33B93C1A'
                                  : '#FF7C001A',
                            }"
                          >
                            {{ item.status }}
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
                            src="@/assets/icons/teamfloss/userDetails/edit.svg"
                            alt="Edit"
                            class="action-icon ml-3"
                            @click.stop="onEdit(item)"
                          />
                          <img
                            src="@/assets/icons/teamfloss/userDetails/unpublish.svg"
                            alt="Edit"
                            class="action-icon ml-3"
                            @click.stop="onUnpublish(item)"
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
                        :style="{ backgroundColor: '#0165B91A' }"
                        prepend-icon="mdi-cancel"
                      >
                        Unpublished
                      </v-chip>
                      <v-chip
                        class="rounded-lg"
                        size="large"
                        :style="{ backgroundColor: '#0165B91A' }"
                      >
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
                      <!-- Header slot (same as above) -->
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

                              <div v-else>
                                <v-checkbox
                                  :model-value="allSelected"
                                  :indeterminate="someSelected && !allSelected"
                                  @update:model-value="
                                    (val) => toggleAll('unpublished', val)
                                  "
                                  density="compact"
                                  hide-details
                                  variant="outlined"
                                  class="custom-checkbox"
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
                          {{ formattedDate(item.startDate) }}
                        </div>
                      </template>

                      <template v-slot:[`item.employees`]="{ item }">
                        <div class="px-2">{{ item.employees }}</div>
                      </template>

                      <template v-slot:[`item.status`]="{ item }">
                        <div class="px-2">
                          <v-chip
                            size="small"
                            :style="{
                              backgroundColor:
                                item.status === 'In Progress'
                                  ? '#33B93C1A'
                                  : '#FF7C001A',
                            }"
                          >
                            {{ item.status }}
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
                            src="@/assets/icons/teamfloss/userDetails/edit.svg"
                            alt="Edit"
                            class="action-icon ml-3"
                            @click.stop="onEdit(item)"
                          />
                          <img
                            src="@/assets/icons/teamfloss/userDetails/publish.svg"
                            alt="Publish"
                            class="action-icon ml-3"
                            @click.stop="onPublish(item)"
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
    </div>
    <div class="pa-5 bg-white" v-else-if="step === 2">
      <div class="rota-section">
        <!-- First block -->
        <div>
          <h3 class="rota-title">Create a Rota</h3>
          <p class="rota-subtitle">
            Create and manage staggered shift patterns to support your back to
            work plans and manage shift rotas for employees who regularly change
            their hours of work.
          </p>
        </div>

        <!-- Second block -->
        <div class="mt-4">
          <h3 class="rota-title">Select Practice</h3>
          <p class="rota-subtitle">
            Choose the practice for which you would like to create a rota.
          </p>
        </div>
        <v-row cols="2" class="d-flex flex-wrap mt-5">
          <v-col
            v-for="(practice, index) in practices"
            :key="index"
            cols="12"
            sm="6"
            md="2"
          >
            <v-card
              class="practice-card"
              :class="{ selected: selectedPractice === practice.value }"
              :elevation="0"
              :style="{
                border: '1px solid #3ADF8D',
                position: 'relative',
                cursor: 'pointer',
                height: '100%',
              }"
              @click="selectPractice(practice.value)"
            >
              <!-- Radio at top-right -->
              <v-radio
                :value="practice.value"
                :model-value="selectedPractice"
                color="#3ADF8D"
                class="practice-radio"
              />

              <!-- Center content -->
              <div
                class="content-wrapper d-flex flex-column align-center justify-center"
              >
                <img
                  src="@/assets/icons/teamfloss/userDetails/createRota/logo.svg"
                  alt="practice icon"
                  class="practice-img mb-4"
                />
                <p class="practice-title">
                  {{ practice.label }}
                </p>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <div>
          <h3 class="rota-title my-4">What would you like to do?</h3>

          <v-row>
            <v-col cols="2" v-for="option in rotaOptions" :key="option.value">
              <v-card
                class="d-flex flex-column align-center justify-center pa-6 option-card"
                :class="{ 'selected-card': selectedOption === option.value }"
                @click="selectedOptionHandle(option.value)"
              >
                <v-radio
                  :value="option.value"
                  :model-value="selectedOption"
                  color="#3ADF8D"
                  class="option-radio"
                />

                <div
                  class="d-flex flex-column align-center justify-center text-center flex-1"
                >
                  <v-icon
                    size="40"
                    :color="
                      selectedOption === option.value ? '#FFFFFF' : '#1E1E1E'
                    "
                    class="mb-4"
                  >
                    {{ option.icon }}
                  </v-icon>
                  <p
                    class="option-title"
                    :class="{
                      'selected-text': selectedOption === option.value,
                    }"
                  >
                    {{ option.label }}
                  </p>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
definePageMeta({
  layout: "home",
});
const step = ref(1);
const currentTab = ref("active");
const data = [
  {
    icon: "https://cdn.lordicon.com/pnlvdria.json",
    title: "Total Rotas",
    count: "20",
    color: "#1E1E1E",
  },
  {
    icon: "https://cdn.lordicon.com/txshdzva.json",
    title: "Published Rotas",
    count: "03",
    color: "#8C3BC5",
  },
  {
    icon: "https://cdn.lordicon.com/ltlvgdli.json",
    title: "Unpublished Rotas",
    count: "02",
    color: "#0165B9",
  },
];
// expansion table
const openedPanels = ref([0]);

// UI / control
const menuDate = ref(false);
const tempRange = ref([]); // temporary picker selection (array: [start, end])
const dateRangeModel = ref([]); // applied range
const search = ref("");

// Data (replace these with API data later)
const published = ref([
  {
    id: 1,
    name: "Rota A",
    startDate: "2025-08-20",
    employees: 10,
    status: "In Progress",
  },
  {
    id: 2,
    name: "Rota B",
    startDate: "2025-09-01",
    employees: 8,
    status: "Future",
  },
]);

const unpublished = ref([
  {
    id: 3,
    name: "Rota C",
    startDate: "2025-09-10",
    employees: 12,
    status: "Future",
  },
]);

// Selection models
const selectedPublished = ref([]);
const selectedUnpublished = ref([]);

// Headers (matching your original shape)
const headers = [
  { title: "Rota Name", key: "name", sortable: true },
  { title: "Start Date", key: "startDate", sortable: true },
  { title: "No of Employees", key: "employees", sortable: false },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

// formatting helper
const formattedDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Filtering: search + date range
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

// watchers to console.log selections
watch(selectedPublished, (val) => {
  console.log("Selected Published items:", val);
});
watch(selectedUnpublished, (val) => {
  console.log("Selected Unpublished items:", val);
});

// toggle all handler (triggered by header checkbox)
function toggleAll(which, val) {
  if (which === "published") {
    if (val) selectedPublished.value = filteredPublished.value.slice();
    else selectedPublished.value = [];
    console.log("Select All (published):", val);
  } else {
    if (val) selectedUnpublished.value = filteredUnpublished.value.slice();
    else selectedUnpublished.value = [];
    console.log("Select All (unpublished):", val);
  }
}

// Actions
const onView = (item) => console.log("View", item);
const onEdit = (item) => console.log("Edit", item);
const onPublish = (item) => console.log("Publish", item);
const onUnpublish = (item) => console.log("unPublish", item);

const onCreateNewRota = () => {
  step.value = 2;
};

// Date picker apply / clear
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
  return `${formattedDate(dateRangeModel.value[0])} - ${formattedDate(
    dateRangeModel.value[1]
  )}`;
});

const onSelectionChangePublished = () => {
  console.log(selectedPublished.value);
};
const onSelectionChangeUnPublished = () => {
  console.log(selectedUnpublished.value);
};
// create rota section
const selectedPractice = ref(null);

const practices = [
  {
    label: "Smile Dental Care - London",
    value: "london",
  },
  {
    label: "Smile Dental Care - Essex",
    value: "essex",
  },
  {
    label: "Smile Dental Care - York",
    value: "york",
  },
];

const selectPractice = (value) => {
  selectedPractice.value = value;
  console.log("Selected practice:", value);
};

const selectedOption = ref(null);

const rotaOptions = [
  {
    value: "new",
    label: "Create a new rota",
    icon: "mdi-calendar-plus",
  },
  {
    value: "copy",
    label: "Copy an existing rota",
    icon: "mdi-content-copy",
  },
];
const selectedOptionHandle = (value) => {
  selectedOption.value = value;
  console.log("Selected Option:", value);
};
</script>
<style scoped>
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 20px;
  background-color: white;
}
.cust-border p {
  font-size: 12px;
  color: #c3c3c3;
}
.stat-card {
  border: 1px solid #dbdbdb;
  background-color: #f3f6fa;
  border-radius: 16px;
}

.lordicon {
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.stat-title {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 14px;
  font-style: normal; /* SemiBold is represented by font-weight 600 */
  margin: 0;
}

.stat-count {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 40px;
  font-style: normal;
  margin: 0;
}
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
  font-family: "Poppins", sans-serif;
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

.custom-checkbox .v-input--selection-controls__ripple {
  display: none;
}

/* make the date activator look flat */

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}

/* create rota screen */
.rota-title {
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-style: SemiBold;
  font-size: 14px;
  margin-bottom: 4px;
}

.rota-subtitle {
  font-family: Poppins, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #737373;
  margin: 0;
}
.practice-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 180px;
}

.practice-card.selected {
  background-color: #1e1e1e !important;
}

.practice-card.selected .practice-title {
  color: white !important;
}

.practice-radio {
  position: absolute;
  top: 8px;
  right: 8px;
}
::v-deep(.practice-radio .v-selection-control__input .v-icon) {
  color: #3adf8d !important;
}

.practice-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 200px; /* adjust as needed */
  display: flex; /* make card a flex container */
}

.content-wrapper {
  flex: 1; /* take full height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* centers vertically */
}

.option-card {
  border: 1px solid #3adf8d;
  border-radius: 12px;
  background-color: #f3f6fa;
  cursor: pointer;
  position: relative;
  min-height: 200px;
}

.selected-card {
  background-color: #1e1e1e !important;
}

.option-radio {
  position: absolute;
  top: 8px;
  right: 8px;
}

.option-title {
  font-family: Poppins, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 130%;
  text-align: center;
  color: #1e1e1e;
}

.selected-text {
  color: #ffffff;
}

/* radio border color */
::v-deep(.option-radio .v-selection-control__input .v-icon) {
  color: #3adf8d !important;
}
</style>
