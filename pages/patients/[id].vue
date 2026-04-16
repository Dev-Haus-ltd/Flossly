<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <span class="ml-2 text-subtitle-1">{{ patientName }}</span>
    </div>
    <div class="pa-4">
      <v-tabs v-model="activeTab" bg-color="transparent" color="primary" class="custom-tabs">
        <v-tab value="details">Details</v-tab>
        <v-tab value="journey">Patient Journey</v-tab>
        <v-tab value="forms">Forms</v-tab>
        <v-tab value="charting">Charting</v-tab>
        <!-- <v-tab value="perio">Periodontal</v-tab> -->
        <!-- <v-tab value="soft-tissue">Soft Tissue</v-tab> -->
        <!-- <v-tab value="risk">Risk Assessment</v-tab> -->
        <v-tab value="appointments">Appointments</v-tab>
      </v-tabs>
      <PatientsIndex v-if="activeTab === 'details'" :patient="patient" />
      <PatientJourney v-else-if="activeTab === 'journey'" :patient="patient" @save="handleJourneySave" />
      <PatientForms v-else-if="activeTab === 'forms'" :patient="patient" />
      <div v-else-if="activeTab === 'charting'" class="mt-4">
        <PatientsCharting
          :patient-id="patient?.id"
          :patient-name="patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : ''"
          :patient="patient"
        />
      </div>
      <!-- <div v-else-if="activeTab === 'perio'" class="mt-4">
        <PerioChart :peri-data="chartingStore.periData" @update="chartingStore.setPerioData($event)" />
      </div>
      <div v-else-if="activeTab === 'soft-tissue'" class="mt-4">
        <SoftTissueExam :soft-tissue-data="chartingStore.softTissueData" @update="chartingStore.setSoftTissueData($event)" />
      </div>
      <div v-else-if="activeTab === 'risk'" class="mt-4">
        <RiskAssessment :risk-data="chartingStore.riskData" @update="chartingStore.setRiskData($event)" />
      </div> -->
      <div v-else class="mt-4">
        <v-row class="px-1 mb-4" align="stretch">
          <v-col v-for="(card, i) in appointmentStatCards" :key="card.label" style="flex: 1 1 0;">
            <CommonStatCard
              :icon="card.icon"
              :label="card.label"
              :value="card.value"
              :uid="`appt-${i}`"
              hide-chip
            />
          </v-col>
        </v-row>

        <div class="appointments-toolbar mb-4">
          <div class="appointments-toolbar__left">
            <v-text-field
              v-model="appointmentSearch"
              placeholder="Search"
              clearable
              @click:clear="appointmentSearch = ''"
              variant="solo"
              density="compact"
              hide-details
              bg-color="#F3F4F6"
              flat
              class="custom-search appointments-search"
            >
              <template #append-inner>
                <img
                  :src="searchicon"
                  alt="search icon"
                  width="14"
                  height="14"
                />
              </template>
            </v-text-field>
            <v-menu
              v-model="appointmentFilterMenu"
              :close-on-content-click="false"
              transition="fade-transition"
              offset-y
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="flat"
                  density="compact"
                  class="appointments-filter-btn"
                >
                  <span>Filter</span>
                  <v-icon class="ml-2" size="18">mdi-filter-outline</v-icon>
                </v-btn>
              </template>
              <v-card class="appointments-filter-card">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-subtitle-2 font-weight-medium">Filter appointments</div>
                  <v-btn variant="text" color="primary" density="comfortable" @click="clearAppointmentFilters">
                    Clear
                  </v-btn>
                </div>
                <div class="text-caption text-medium-emphasis mb-2">Status</div>
                <v-select
                  v-model="appointmentStatus"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="input-bordered mb-3"
                />
                <div class="text-caption text-medium-emphasis mb-2">Practitioner</div>
                <v-select
                  v-model="appointmentPractitionerId"
                  :items="practitionerFilterOptions"
                  item-title="title"
                  item-value="value"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="input-bordered mb-3"
                />
                <div class="text-caption text-medium-emphasis mb-2">Date</div>
                <v-text-field
                  v-model="appointmentDate"
                  type="date"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="input-bordered"
                />
              </v-card>
            </v-menu>
          </div>
          <div class="appointments-toolbar__right">
            <div class="text-body-2 text-medium-emphasis">{{ appointmentSummary }}</div>
            <v-btn color="primary" variant="flat" rounded="lg" class="action-btn" prepend-icon="mdi-plus-circle-outline" @click="openNewAppointment">
              Add Appointment
            </v-btn>
          </div>
        </div>

        <div v-if="activeAppointmentFilterChips.length" class="appointments-filter-chips mb-4">
          <v-chip
            v-for="chip in activeAppointmentFilterChips"
            :key="chip.key"
            size="small"
            color="primary"
            variant="elevated"
            closable
            @click:close="removeAppointmentFilter(chip.key)"
          >
            {{ chip.label }}
          </v-chip>
          <v-chip size="small" variant="text" color="secondary" @click="clearAppointmentFilters">
            Clear filters
          </v-chip>
        </div>

        <v-expansion-panels
          v-model="appointmentsPanelOpen"
          :elevation="0"
          flat
          multiple
          class="appointments-panels"
        >
          <v-expansion-panel rounded="lg" class="border-sm pb-1">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-chip color="primary" label>
                  <v-icon class="mr-2">mdi-calendar-month-outline</v-icon>
                  Appointments
                </v-chip>
                <v-chip class="ml-2" color="primary" label>
                  {{ appointmentTotal }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-0">
              <v-data-table-server
                :items="pagedAppointments"
                :items-length="appointmentTotal"
                :headers="appointmentHeaders"
                :loading="appointmentLoading"
                :items-per-page="appointmentOptions.itemsPerPage"
                :page="appointmentOptions.page"
                density="comfortable"
                class="appointments-data-table full-width-table"
                @update:options="onAppointmentOptions"
              >
                <template #headers="{ columns }">
                  <tr>
                    <th
                      v-for="(column, index) in columns"
                      :key="column.key"
                      :style="appointmentHeaderStyle(index)"
                    >
                      <div class="appointments-table-th">
                        <p class="mb-0">{{ column.title }}</p>
                      </div>
                    </th>
                  </tr>
                </template>
                <template #item.when="{ item }">
                  <div class="text-body-2">{{ item.when }}</div>
                </template>
                <template #item.duration="{ item }">
                  <div class="text-body-2 text-medium-emphasis">{{ item.duration }}</div>
                </template>
                <template #item.dentistName="{ item }">
                  <div class="d-flex align-center gap-2">
                    <v-avatar size="28" color="primary" class="text-white font-weight-600">
                      {{ item.dentistInitials }}
                    </v-avatar>
                    <div class="text-body-2">{{ item.dentistName || 'Unassigned' }}</div>
                  </div>
                </template>
                <template #item.treatmentPlan="{ item }">
                  <div class="text-body-2 text-medium-emphasis">{{ item.treatmentPlan || '-' }}</div>
                </template>
                <template #item.treatmentName="{ item }">
                  <div class="text-body-2 font-weight-500">{{ item.treatmentName || 'Exam' }}</div>
                </template>
                <template #item.notes="{ item }">
                  <div class="text-body-2" :class="{ 'text-error': item.status?.toLowerCase() === 'cancelled' }">
                    {{ item.notes || '-' }}
                  </div>
                </template>
                <template #item.arrival="{ item }">
                  <div class="text-body-2 text-medium-emphasis">{{ item.arrival || '-' }}</div>
                </template>
                <template #item.status="{ item }">
                  <v-chip size="small" :color="statusColor(item.status)" variant="tonal" class="font-weight-medium">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template #item.actions="{ item }">
                  <div class="appointments-actions">
                    <button
                      class="appointments-action-btn"
                      title="View in Diary"
                      @click="openViewAppointment(item)"
                    >
                      <img :src="viewIcon" alt="View" class="appointments-action-icon" />
                    </button>
                    <button
                      class="appointments-action-btn"
                      title="Edit appointment"
                      @click="openEditAppointment(item)"
                    >
                      <img :src="editIcon" alt="Edit" class="appointments-action-icon" />
                    </button>
                  </div>
                </template>
                <template #no-data>
                  <div class="text-center py-6">No appointments found</div>
                </template>
              </v-data-table-server>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <AddAppointment
          v-model="showAppointmentDrawer"
          :practitioner-options="practitionerOptions"
          :patient-options="patientOptions"
          :preselected-patient-id="patient?.id || null"
          :preselected-patient="patientName"
          :edit-appointment="editAppointment"
          @save="handleAppointmentSave"
        />
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import PatientsIndex from '@/components/patients/index.vue'
import PatientJourney from '@/components/patients/patientJourney.vue'
import PatientForms from '@/components/patients/PatientForms.vue'
import PatientsCharting from '@/components/patients/charting/index.vue'
import PerioChart from '@/components/patients/charting/PerioChart.vue'
import SoftTissueExam from '@/components/patients/charting/SoftTissueExam.vue'
import RiskAssessment from '@/components/patients/charting/RiskAssessment.vue'
import { useDiaryStore } from '@/stores/diary'
import { usePatientChartingStore } from '@/stores/patientCharting'
import { useMainStore } from '@/stores/index'
import AddAppointment from '@/components/diary/addAppointment.vue'
import { ref, computed, onMounted, watch } from 'vue'
import CommonStatCard from '@/components/Common/statCard.vue'
import editIcon from '@/assets/icons/edit.svg'
import viewIcon from '@/assets/icons/view.svg'
import searchicon from '@/assets/icons/listView/serach-icon.svg'

definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const store = useDiaryStore()
const mainStore = useMainStore()
const chartingStore = usePatientChartingStore()
const patient = ref(null)
const activeTab = ref('details')
const patientName = computed(() => {
  if (!patient.value) return ''
  const p = patient.value
  return [p.firstName, p.lastName].filter(Boolean).join(' ')
})

const loadPatient = async (id) => {
  if (!id) return
  const res = await store.getPatient(id)
  if (res?.code === 0) patient.value = res.data
}

onMounted(async () => {
  loadPatient(route.params.id)
  if (route.query.tab === 'journey') {
    activeTab.value = 'journey'
  }
})

watch(() => route.params.id, (id) => {
  loadPatient(id)
})

const handleJourneySave = async (payload) => {
  // Wire up to backend when endpoint is ready.
  console.log('Patient journey payload', payload)
}

// --- Appointments tab ---
const appointmentRows = ref([])
const appointmentLoading = ref(false)
const appointmentsPanelOpen = ref([0])
const appointmentOptions = ref({ page: 1, itemsPerPage: 10 })
const appointmentTotal = ref(0)
const appointmentSearch = ref('')
const appointmentStatus = ref('all')
const appointmentPractitionerId = ref('all')
const appointmentDate = ref('')
const appointmentFilterMenu = ref(false)
const searchTimer = ref(null)
const showAppointmentDrawer = ref(false)
const editAppointment = ref(null)
const practitionerOptions = ref([])
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Arrived', value: 'Arrived' },
  { label: 'Cancelled', value: 'Cancelled' },
]
const practitionerFilterOptions = computed(() => ([
  { title: 'All practitioners', value: 'all' },
  ...practitionerOptions.value,
]))

const appointmentHeaders = [
  { title: 'When', key: 'when', sortable: false },
  { title: 'Duration', key: 'duration', sortable: false },
  { title: 'Practitioner', key: 'dentistName', sortable: false },
  { title: 'Treatment Plan', key: 'treatmentPlan', sortable: false },
  { title: 'Appointment Details', key: 'treatmentName', sortable: false },
  { title: 'Notes', key: 'notes', sortable: false },
  { title: 'Arrived', key: 'arrival', sortable: false },
  { title: 'Appointment Status', key: 'status', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]

const appointmentColumnWidths = [200, 100, 200, 150, 200, 240, 140, 160, 80]

const appointmentHeaderStyle = (index) => ({
  width: `${appointmentColumnWidths[index] || 160}px`,
  minWidth: `${appointmentColumnWidths[index] || 160}px`,
  padding: '0px 12px',
  fontSize: '14px',
  backgroundColor: '#F6F6F6',
  position: 'relative',
})

const patientOptions = computed(() => {
  if (!patient.value) return []
  return [{ id: patient.value.id, name: patientName.value }]
})

const appointmentStats = computed(() => {
  const total = appointmentRows.value.length
  const confirmed = appointmentRows.value.filter((a) => a.status === 'Confirmed').length
  const pending = appointmentRows.value.filter((a) => a.status === 'Pending').length
  const cancelled = appointmentRows.value.filter((a) => a.status === 'Cancelled').length
  return { total, confirmed, pending, cancelled }
})

const appointmentStatCards = computed(() => [
  { label: 'Total Appointments', value: appointmentStats.value.total, icon: 'https://cdn.lordicon.com/asyunleq.json' },
  { label: 'Confirmed', value: appointmentStats.value.confirmed, icon: 'https://cdn.lordicon.com/kphwxuxr.json' },
  { label: 'Pending', value: appointmentStats.value.pending, icon: 'https://cdn.lordicon.com/excswhey.json' },
  { label: 'Cancelled', value: appointmentStats.value.cancelled, icon: 'https://cdn.lordicon.com/tzynxkwl.json' },
])
const appointmentSummary = computed(() => {
  if (!appointmentTotal.value) return 'No appointments found'
  return `${appointmentTotal.value} appointment${appointmentTotal.value === 1 ? '' : 's'} found`
})
const activeAppointmentFilterChips = computed(() => {
  const chips = []
  if (appointmentStatus.value !== 'all') {
    const status = statusOptions.find((item) => item.value === appointmentStatus.value)
    chips.push({ key: 'status', label: `Status: ${status?.label || appointmentStatus.value}` })
  }
  if (appointmentPractitionerId.value !== 'all') {
    const practitioner = practitionerOptions.value.find((item) => String(item.value) === String(appointmentPractitionerId.value))
    chips.push({ key: 'practitioner', label: `Practitioner: ${practitioner?.title || appointmentPractitionerId.value}` })
  }
  if (appointmentDate.value) {
    chips.push({ key: 'date', label: `Date: ${appointmentDate.value}` })
  }
  return chips
})

const statusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return 'success'
    case 'arrived': return 'info'
    case 'cancelled': return 'error'
    case 'complete': return 'success'
    default: return 'warning'
  }
}

const shapeAppointmentRow = (row) => {
  const durationMinutes = (() => {
    const [sh, sm] = (row.start || '').split(':').map(Number)
    const [eh, em] = (row.end || '').split(':').map(Number)
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null
    return (eh * 60 + em) - (sh * 60 + sm)
  })()
  const when = (() => {
    if (!row.date) return `${row.start || ''} - ${row.end || ''}`.trim()
    const d = new Date(row.date)
    const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    return `${day} at ${row.start || ''}`.trim()
  })()
  const initials = (row.dentistName || '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return {
    ...row,
    when,
    duration: durationMinutes ? `${durationMinutes} min` : '-',
    dentistInitials: initials || 'DR',
    treatmentPlan: row.treatmentId || '-',
    arrival: row.arrival || '-',
  }
}

const fetchPractitioners = async () => {
  const res = await store.listDentists()
  if (res?.code === 0) {
    practitionerOptions.value = (res.data || []).map((d) => ({
      title: d.name,
      value: d.id,
    }))
  }
}

const fetchAppointments = async () => {
  if (!route.params.id) return
  appointmentLoading.value = true
  try {
    const params = {
      patientId: route.params.id,
      search: appointmentSearch.value || undefined,
      status: appointmentStatus.value !== 'all' ? appointmentStatus.value : undefined,
      dentistId: appointmentPractitionerId.value !== 'all' ? appointmentPractitionerId.value : undefined,
      date: appointmentDate.value || undefined,
    }
    const res = await store.listAppointments(params)
    const rows = res?.data || []
    appointmentRows.value = rows.map(shapeAppointmentRow)
    appointmentTotal.value = rows.length
  } catch (e) {
    appointmentRows.value = []
    appointmentTotal.value = 0
  } finally {
    appointmentLoading.value = false
  }
}

const pagedAppointments = computed(() => {
  const start = (appointmentOptions.value.page - 1) * appointmentOptions.value.itemsPerPage
  return appointmentRows.value.slice(start, start + appointmentOptions.value.itemsPerPage)
})

const onAppointmentOptions = (opts) => {
  appointmentOptions.value = { ...appointmentOptions.value, ...opts }
}

const clearAppointmentFilters = () => {
  appointmentStatus.value = 'all'
  appointmentPractitionerId.value = 'all'
  appointmentDate.value = ''
}

const removeAppointmentFilter = (key) => {
  if (key === 'status') appointmentStatus.value = 'all'
  if (key === 'practitioner') appointmentPractitionerId.value = 'all'
  if (key === 'date') appointmentDate.value = ''
}

watch(appointmentStatus, () => { fetchAppointments() })
watch(appointmentPractitionerId, () => { fetchAppointments() })
watch(appointmentDate, () => { fetchAppointments() })
watch(activeTab, (val) => {
  if (val === 'appointments') {
    fetchPractitioners()
    fetchAppointments()
  }
  if (['perio', 'soft-tissue', 'risk'].includes(val) && patient.value?.id && chartingStore.patientId !== patient.value.id) {
    chartingStore.loadChart(patient.value.id)
  }
})
watch(appointmentSearch, (val) => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => {
    fetchAppointments()
  }, 400)
})

const openNewAppointment = () => {
  editAppointment.value = null
  showAppointmentDrawer.value = true
}

const openEditAppointment = (row) => {
  const duration = (() => {
    if (!row.start || !row.end) return null
    const [sh, sm] = row.start.split(':').map(Number)
    const [eh, em] = row.end.split(':').map(Number)
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null
    return (eh * 60 + em) - (sh * 60 + sm)
  })()
  editAppointment.value = { ...row, duration }
  showAppointmentDrawer.value = true
}

const openViewAppointment = (row) => {
  const appointmentId = row.diaryAppointmentId || row.id
  if (!appointmentId) return
  router.push({
    path: '/diary/calendar',
    query: {
      date: row.date || '',
      dentistId: row.dentistId ? String(row.dentistId) : '',
      appointmentId: String(appointmentId),
    },
  })
}

const buildDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  return new Date(`${dateStr}T${t}`)
}

const handleAppointmentSave = async (payload) => {
  const dentistId = payload.practitioner || payload.dentistId
  const startTime = buildDateTime(payload.date, payload.time || payload.start)
  const endTime = startTime ? new Date(startTime.getTime() + Number(payload.duration || 15) * 60000) : null
  const base = {
    dentistId,
    patientId: patient.value?.id,
    date: payload.date,
    time: payload.time || payload.start,
    duration: payload.duration,
    status: payload.status,
    treatmentName: payload.exam || payload.treatmentName,
    treatmentId: payload.treatmentId || null,
    notes: payload.notes || '',
  }
  try {
    if (payload.id) {
      await store.updateAppointment({
        id: payload.id,
        ...base,
        startTime,
        endTime,
      })
      mainStore?.setSnackbar?.({ title: 'Appointment updated', type: 'success' })
    } else {
      await store.createAppointment({
        ...base,
      })
      mainStore?.setSnackbar?.({ title: 'Appointment created', type: 'success' })
    }
    await fetchAppointments()
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to save appointment'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
    showAppointmentDrawer.value = true
  }
}
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  } 
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
  height: 4px;
}
.with-border { border:1px solid #e5e7eb; }
.border-sm {
  border: 1px solid rgb(var(--v-theme-outline));
  margin-bottom: 8px;
}
.appointments-panels :deep(.v-expansion-panel-title) {
  border-bottom: 1px solid #e5e7eb;
  min-height: 48px;
}
.appointments-panels :deep(.v-expansion-panel-text) {
  padding: 0 !important;
}
.appointments-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}
.appointments-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.appointments-toolbar__left,
.appointments-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.appointments-search {
  width: 240px;
}
.appointments-filter-btn {
  height: 40px;
  border-radius: 8px;
  text-transform: none;
  background: #fafafa !important;
  color: #4b5563;
  box-shadow: none;
}
.appointments-filter-card {
  min-width: 320px;
  border-radius: 14px;
  padding: 16px;
}
.appointments-filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.appointments-table-th {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-weight: 600;
  color: #374151;
}
.appointments-data-table {
  border-top: none;
  border-radius: unset;
}
.appointments-data-table :deep(.v-table__wrapper) {
  margin-top: 0 !important;
}
.appointments-data-table :deep(.v-data-table tbody tr) {
  height: 52px !important;
}
.appointments-data-table :deep(.v-data-table td) {
  height: 52px !important;
  padding: 6px 12px !important;
  vertical-align: middle !important;
  font-size: 14px;
}
.appointments-data-table :deep(.v-data-table tbody tr:hover) {
  background: #fafafa !important;
}
.appointments-data-table :deep(.v-table .v-table__wrapper > table > thead > tr > th) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.appointments-data-table :deep(.v-table .v-table__wrapper > table > tbody > tr > td) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.appointments-data-table :deep(.v-table .v-table__wrapper > table > thead > tr > th:last-child),
.appointments-data-table :deep(.v-table .v-table__wrapper > table > tbody > tr > td:last-child) {
  border-right: none;
}
.appointments-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.appointments-action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.appointments-action-btn:hover {
  background: #f3f4f6;
}
.appointments-action-icon {
  width: 16px;
  height: 16px;
  display: block;
}
.full-width-table :deep(.v-table__wrapper) { width: 100%; }
.full-width-table :deep(table) { width: 100% !important; table-layout: auto; }
.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  align-items: center;
}
.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background: #fff !important; min-height: 44px; font-size: 14px; }
.action-btn { height: 40px; text-transform: none; font-weight: 500; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
@media (max-width: 960px) {
  .appointments-toolbar__left,
  .appointments-toolbar__right {
    width: 100%;
  }
  .appointments-search {
    width: 100%;
  }
}
</style>
