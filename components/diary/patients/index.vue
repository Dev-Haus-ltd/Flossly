<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Patients</p>
    </div>

    <div class="mt-5 px-5">
      <v-row class="stat-row" align="stretch">
        <v-col style="flex: 1 1 0;" v-for="(stat, i) in patientStatsCards" :key="i">
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
          <div style="width: 150px">
            <v-text-field
              v-model="search"
              placeholder="Search"
              append-inner-icon="mdi-magnify"
              variant="solo"
              density="compact"
              hide-details
              flat
              class="custom-search"
            />
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
          @click="editingPatient = null; showAddPatient = true"
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
                  padding: '0px 7px',
                  fontSize: '14px',
                  backgroundColor: '#F6F6F6',
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
          {{ item.dob || '-' }}
        </template>
        <template #item.dentist="{ item }">
          {{ item.dentist || '-' }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center" style="gap: 8px;">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              icon
              @click="openEditPatient(item)"
            >
              <img src="@/assets/tasks/edit.svg" alt="Edit" width="18" height="18" />
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="primary"
              icon
              @click="openPatient(item)"
            >
              <v-icon size="18">mdi-eye</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>

      <ClientOnly>
        <AddPatient v-model="showAddPatient" :patient="editingPatient" @save="onPatientSaved" @cancel="editingPatient = null" />
      </ClientOnly>
    </div>
  </v-sheet>
</template>

<script setup>
import { formatDateDDMMYYYY } from '@/lib/dateFormatter'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
import AddPatient from '@/components/diary/addPatient.vue'
import DiaryPatientsFilterMenu from '@/components/diary/patients/filterMenu.vue'

const diaryStore = useDiaryStore()
const mainStore = useMainStore()
const search = ref('')
const filters = ref({})
const loading = ref(false)
const patients = ref([])
const totalItems = ref(0)
const dentists = ref([])
const showAddPatient = ref(false)
const editingPatient = ref(null)

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
})

const headers = [
  { title: 'Patient', key: 'name', width: 240, sortable: true },
  { title: 'Mobile', key: 'mobile', width: 160, sortable: false },
  { title: 'DOB', key: 'dob', width: 140, sortable: false },
  { title: 'Payment Plan', key: 'paymentPlan', width: 160, sortable: false },
  { title: 'Dentist', key: 'dentist', width: 180, sortable: false },
  { title: 'Created', key: 'createdAt', width: 160, sortable: true },
  { title: 'Actions', key: 'actions', width: 120, sortable: false },
]

const stats = ref({ total: 0, newThisMonth: 0, withEmail: 0, withMobile: 0 })
const patientStatsCards = computed(() => [
  { icon: 'https://cdn.lordicon.com/asyunleq.json', label: 'Total Patients', value: stats.value.total || 0 },
  { icon: 'https://cdn.lordicon.com/kphwxuxr.json', label: 'New This Month', value: stats.value.newThisMonth || 0 },
])

const debounce = (fn, ms = 400) => {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const loadDentists = async () => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const res = await diaryStore.listDentists(todayStr)
  if (res?.code === 0) dentists.value = res.data || []
}

const loadStats = async () => {
  const res = await diaryStore.getPatientStats()
  if (res?.code === 0) stats.value = res.data || stats.value
}

const formatDob = (dob) => (dob ? formatDateDDMMYYYY(dob) : '')

const loadPatients = async () => {
  loading.value = true
  try {
    const sort = options.value.sortBy?.[0] || {}
    const payload = {
      page: options.value.page,
      itemsPerPage: options.value.itemsPerPage,
      search: search.value || '',
      sortBy: sort.key || '',
      sortDesc: sort.order === 'desc',
      ...filters.value,
    }
    const res = await diaryStore.listPatientsPaged(payload)
    if (res?.code === 0) {
      const rows = res.data?.rows || []
      patients.value = rows.map((p) => ({
        id: p.id,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        email: p.email || '',
        mobile: p.mobile || '',
        dob: formatDob(p.dob),
        paymentPlan: p.paymentPlan || '',
        dentist: dentists.value.find((d) => String(d.id) === String(p.defaultDentistId))?.name || '',
        createdAt: p.createdAt ? formatDateDDMMYYYY(p.createdAt) : '',
        raw: p,
      }))
      totalItems.value = res.data?.total || 0
    } else {
      patients.value = []
      totalItems.value = 0
    }
  } finally {
    loading.value = false
  }
}

const onOptionsUpdate = (opts) => {
  options.value = opts
  loadPatients()
}

const onFilters = (f) => {
  filters.value = f || {}
  options.value.page = 1
  loadPatients()
}

const openPatient = (item) => {
  if (!item?.id) return
  navigateTo(`/patients/${item.id}`)
}

const openEditPatient = (item) => {
  editingPatient.value = item?.raw || null
  showAddPatient.value = true
}

const onPatientSaved = async (payload) => {
  try {
    if (payload?.id) {
      const res = await diaryStore.updatePatient(payload)
      if (res?.code === 0) {
        mainStore.setSnackbar({ title: 'Patient updated', type: 'success' })
      } else {
        mainStore.setSnackbar({ title: res?.message || 'Update failed', type: 'error' })
      }
    } else {
      const res = await diaryStore.createPatient(payload)
      if (res?.code === 0) {
        mainStore.setSnackbar({ title: 'Patient created', type: 'success' })
      } else {
        mainStore.setSnackbar({ title: res?.message || 'Create failed', type: 'error' })
      }
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Save failed', type: 'error' })
  } finally {
    editingPatient.value = null
    showAddPatient.value = false
    await Promise.all([loadPatients(), loadStats()])
  }
}

onMounted(async () => {
  await Promise.all([loadDentists(), loadStats()])
  loadPatients()
})

watch(search, debounce(() => {
  options.value.page = 1
  loadPatients()
}, 400))
</script>

<style scoped lang="scss">
.cust-border { border-bottom: 1px solid #dbdbdb; padding: 17px; p { font-size: 12px; } }

.patients-table {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

:deep(.patients-table .v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

:deep(.patients-table .v-table__wrapper > table > thead > tr > th) {
  height: 40px;
  padding: 0 7px !important;
  font-size: 14px;
  font-weight: 500;
  background-color: #f6f6f6;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  vertical-align: middle;
}

:deep(.patients-table .v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.patients-table tbody tr) {
  height: 30px !important;
}

:deep(.patients-table td) {
  height: 30px !important;
  padding: 0 7px !important;
  font-size: 14px;
  vertical-align: middle !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.patients-table .v-table__wrapper > table > tbody > tr > td:not(:last-child)) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.patients-table tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.15s ease-in-out;
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

