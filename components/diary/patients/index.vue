<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Patients</p>
    </div>

    <div class="mt-5 px-5">
      <v-row class="stat-row" align="stretch">
        <v-col
          style="flex: 1 1 0"
          v-for="(stat, i) in patientStatsCards"
          :key="i"
        >
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"
            hide-chip
          />
        </v-col>
      </v-row>
    </div>

    <div class="mt-5 px-5">
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="d-flex align-center">
          <div style="width: 120px">
            <v-text-field
              v-model="search"
              placeholder="Search"
              clearable
              @click:clear="clearSearch"
              variant="solo"
              :elevation="0"
              density="compact"
              bg-color="#F3F4F6"
              hide-details
              flat
              class="custom-search"
            >
              <template #append-inner>
                <img
                  :src="searchIcon"
                  alt="search icon"
                  width="14"
                  height="14"
                />
              </template>
            </v-text-field>
          </div>

          <DiaryPatientsFilterMenu
            :dentists="dentists"
            @update:filters="onFilters"
          />
        </div>

        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          class="add-task-btn"
          @click="
            editingPatient = null;
            showAddPatient = true;
          "
        >
          <template #prepend>
            <v-icon size="18">mdi-plus-circle-outline</v-icon>
          </template>
          Add Patient
        </v-btn>
      </div>

      <v-data-table-server
        class="patients-table resizable-table full-width-table"
        :headers="headers"
        :items="patients"
        :items-length="totalItems"
        :loading="loading"
        item-value="id"
        density="compact"
        hover
        :items-per-page="options.itemsPerPage"
        :page="options.page"
        @update:options="onOptionsUpdate"
      >
        <template #headers="{ columns }">
          <tr>
            <template v-for="(column, i) in columns" :key="column.key">
              <th
                :style="{
                  width: (column.width || 160) + 'px',
                  minWidth: (column.width || 160) + 'px',
                  padding: '0px 7px',
                  fontSize: '14px',
                  backgroundColor: '#f6f6f6',
                  position: 'relative',
                }"
              >
                <div class="d-flex align-center th-content">
                  <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.dob="{ item }">
          {{ item.dob || "-" }}
        </template>
        <template #item.dentist="{ item }">
          {{ item.dentist || "-" }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center" style="gap: 8px">
            <v-tooltip text="Edit" location="top">
              <template #activator="{ props }">
                <span
                  v-bind="props"
                  style="display: inline-flex; cursor: pointer"
                  @click="openEditPatient(item)"
                >
                  <img :src="editIcon" alt="edit" width="18" height="18" />
                </span>
              </template>
            </v-tooltip>
            <v-tooltip text="View" location="top">
              <template #activator="{ props }">
                <span
                  v-bind="props"
                  style="display: inline-flex; cursor: pointer"
                  @click="openPatient(item)"
                >
                  <img :src="viewIcon" alt="view" width="18" height="18" />
                </span>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }">
                <span
                  v-bind="props"
                  style="display: inline-flex; cursor: pointer"
                  @click="openDeleteDialog(item)"
                >
                  <img :src="deleteIcon" alt="delete" width="18" height="18" />
                </span>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table-server>

      <ClientOnly>
        <AddPatient
          v-model="showAddPatient"
          :patient="editingPatient"
          @save="onPatientSaved"
          @cancel="editingPatient = null"
        />
      </ClientOnly>
    </div>

    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      :loading="deleting"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
    />
  </v-sheet>
</template>

<script setup>
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
import { useDiaryStore } from "@/stores/diary";
import { useMainStore } from "@/stores/index";
import AddPatient from "@/components/diary/addPatient.vue";
import DiaryPatientsFilterMenu from "@/components/diary/patients/filterMenu.vue";

//icon
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import editIcon from "@/assets/icons/edit.svg";
import viewIcon from "@/assets/icons/view.svg";
import deleteIcon from "@/assets/icons/delete_1.svg";

const diaryStore = useDiaryStore();
const mainStore = useMainStore();
const search = ref("");
const filters = ref({});
const loading = ref(false);
const patients = ref([]);
const totalItems = ref(0);
const dentists = ref([]);
const showAddPatient = ref(false);
const editingPatient = ref(null);
const openingPatient = ref(false);

// Delete confirmation state - following lead component pattern
const showDeleteConfirm = ref(false);
const deleting = ref(false); // Renamed from isDeleting to match lead component
const deleteConfirmTitle = ref("");
const deleteConfirmMessage = ref("");
const patientToDelete = ref(null);

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
});

const headers = [
  { title: "Patient", key: "name", width: 240, sortable: true },
  { title: "Mobile", key: "mobile", width: 160, sortable: false },
  { title: "DOB", key: "dob", width: 140, sortable: false },
  { title: "Payment Plan", key: "paymentPlan", width: 160, sortable: false },
  { title: "Dentist", key: "dentist", width: 180, sortable: false },
  { title: "Created", key: "createdAt", width: 160, sortable: true },
  { title: "Actions", key: "actions", width: 120, sortable: false },
];

const stats = ref({ total: 0, newThisMonth: 0, withEmail: 0, withMobile: 0 });
const patientStatsCards = computed(() => [
  {
    icon: "https://cdn.lordicon.com/asyunleq.json",
    label: "Total Patients",
    value: stats.value.total || 0,
  },
  {
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
    label: "New This Month",
    value: stats.value.newThisMonth || 0,
  },
]);

const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const loadDentists = async () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const res = await diaryStore.listDentists(todayStr);
  if (res?.code === 0) dentists.value = res.data || [];
};

const loadStats = async () => {
  const res = await diaryStore.getPatientStats();
  if (res?.code === 0) stats.value = res.data || stats.value;
};

const formatDob = (dob) => (dob ? formatDateDDMMYYYY(dob) : "");

const loadPatients = async () => {
  loading.value = true;
  try {
    const sort = options.value.sortBy?.[0] || {};
    const payload = {
      page: options.value.page,
      itemsPerPage: options.value.itemsPerPage,
      search: search.value || "",
      sortBy: sort.key || "",
      sortDesc: sort.order === "desc",
      ...filters.value,
    };
    const res = await diaryStore.listPatientsPaged(payload);
    if (res?.code === 0) {
      const rows = res.data?.rows || [];
      patients.value = rows.map((p) => ({
        id: p.id,
        name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        email: p.email || "",
        mobile: p.mobile || "",
        dob: formatDob(p.dob),
        paymentPlan: p.paymentPlan || "",
        dentist:
          dentists.value.find(
            (d) => String(d.id) === String(p.defaultDentistId),
          )?.name || "",
        createdAt: p.createdAt ? formatDateDDMMYYYY(p.createdAt) : "",
        raw: p,
      }));
      totalItems.value = res.data?.total || 0;
    } else {
      patients.value = [];
      totalItems.value = 0;
    }
  } finally {
    loading.value = false;
  }
};

const onOptionsUpdate = (opts) => {
  options.value = opts;
  loadPatients();
};

const onFilters = (f) => {
  filters.value = f || {};
  options.value.page = 1;
  loadPatients();
};

const openPatient = async (item) => {
  if (!item?.id || openingPatient.value) return;
  openingPatient.value = true;
  diaryStore._start();
  try {
    await navigateTo(`/patients/${item.id}`);
  } catch (err) {
    mainStore?.setSnackbar?.({
      title: err?.message || "Unable to open patient details",
      type: "error",
    });
  } finally {
    diaryStore._end();
    openingPatient.value = false;
  }
};

const openEditPatient = (item) => {
  editingPatient.value = item?.raw || null;
  showAddPatient.value = true;
};

const openDeleteDialog = (item) => {
  patientToDelete.value = item;
  deleteConfirmTitle.value = "Delete Patient";
  deleteConfirmMessage.value = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
  showDeleteConfirm.value = true;
};

// Close delete dialog
const closeDeleteDialog = () => {
  showDeleteConfirm.value = false;
  patientToDelete.value = null;
};

const confirmDelete = async () => {
  if (!patientToDelete.value || deleting.value) return;

  try {
    deleting.value = true;
    const patientId = patientToDelete.value.id;
    const res = await diaryStore.deletePatient(patientId);

    if (res && res.code === 0) {
      if (mainStore?.setSnackbar) {
        mainStore.setSnackbar({
          title: "Patient deleted successfully",
          type: "success",
        });
      }

      showDeleteConfirm.value = false;
      patientToDelete.value = null;

      await Promise.all([loadPatients(), loadStats()]);
    } else {
      if (mainStore?.setSnackbar) {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.statusMessage || res?.message || "Failed to delete patient",
          type: "error",
        });
      }
    }
  } catch (err) {
    console.error("Delete error:", err);
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({
        title: err?.data?.message || err?.statusMessage || err?.message || "An error occurred while deleting the patient",
        type: "error",
      });
    }
  } finally {
    deleting.value = false;
  }
};

const onPatientSaved = async (payload) => {
  try {
    if (payload?.id) {
      const res = await diaryStore.updatePatient(payload);
      if (res?.code === 0) {
        mainStore.setSnackbar({ title: "Patient updated", type: "success" });
      } else {
        mainStore.setSnackbar({
          title: res?.message || "Update failed",
          type: "error",
        });
      }
    } else {
      const res = await diaryStore.createPatient(payload);
      if (res?.code === 0) {
        mainStore.setSnackbar({ title: "Patient created", type: "success" });
      } else {
        mainStore.setSnackbar({
          title: res?.message || "Create failed",
          type: "error",
        });
      }
    }
  } catch (e) {
    mainStore.setSnackbar({
      title: e?.message || "Save failed",
      type: "error",
    });
  } finally {
    editingPatient.value = null;
    showAddPatient.value = false;
    await Promise.all([loadPatients(), loadStats()]);
  }
};

const clearSearch = () => {
  search.value = "";
  options.value.page = 1;
  loadPatients();
};

onMounted(async () => {
  await Promise.all([loadDentists(), loadStats()]);
  loadPatients();
});

watch(
  search,
  debounce(() => {
    options.value.page = 1;
    loadPatients();
  }, 400),
);
</script>

<style scoped lang="scss">
.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f3f4f6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
  align-items: center;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}
.patients-table {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

:deep(.patients-table .v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.patients-table .v-table__wrapper > table > thead > tr > th) {
  height: 48px !important;
  padding: 0px 7px !important;
  font-size: 14px;
  font-weight: 600;
  background-color: #f6f6f6;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  vertical-align: middle;
  color: #374151;
}

:deep(.patients-table .v-table__wrapper > table > thead > tr > th:last-child) {
  border-right: none;
}

:deep(.patients-table tbody tr) {
  height: 48px !important;
}

:deep(.patients-table td) {
  height: 48px !important;
  padding: 4px 8px !important;
  font-size: 14px;
  vertical-align: middle !important;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  color: #374151;
}

:deep(.patients-table .v-table__wrapper > table > tbody > tr > td:last-child) {
  border-right: none;
}

:deep(.patients-table tbody tr:hover) {
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}

.th-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.text-caption {
  font-size: 12px !important;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.6);
}

:deep(.patients-table .v-btn) {
  min-width: unset;
}

:deep(.patients-table .v-table__wrapper table:focus-visible) {
  outline: none;
}
</style>
