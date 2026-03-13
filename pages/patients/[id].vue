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
        <PatientsCharting :patient-id="patient?.id" :patient-name="patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : ''" />
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

        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-3">
          <div class="d-flex align-center" style="gap: 12px">
            <v-text-field
              v-model="appointmentSearch"
              placeholder="Search appointments..."
              append-inner-icon="mdi-magnify"
              variant="solo"
              density="compact"
              hide-details
              flat
              class="custom-search"
              style="width: 220px"
            />
            <v-select
              v-model="appointmentStatus"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              variant="solo"
              density="compact"
              hide-details
              class="input-bordered"
              bg-color="white"
              style="width: 180px"
            />
          </div>
          <div class="d-flex align-center" style="gap: 12px">
            <v-btn color="primary" variant="flat" rounded="lg" class="action-btn" prepend-icon="mdi-plus-circle-outline" @click="openNewAppointment">
              Add Appointment
            </v-btn>
          </div>
        </div>

        <v-card class="with-border rounded-lg elevation-0">
          <v-data-table-server
            :items="pagedAppointments"
            :items-length="appointmentTotal"
            :headers="appointmentHeaders"
            :loading="appointmentLoading"
            :items-per-page="appointmentOptions.itemsPerPage"
            :page="appointmentOptions.page"
            density="comfortable"
            class="automation-data-table full-width-table"
            @update:options="onAppointmentOptions"
          >
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
              <v-btn icon variant="text" color="primary" @click="openEditAppointment(item)">
                <v-icon size="18">mdi-pencil</v-icon>
              </v-btn>
            </template>
            <template #no-data>
              <div class="text-center py-6">No appointments found</div>
            </template>
          </v-data-table-server>
        </v-card>

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

definePageMeta({ layout: 'home' })

const route = useRoute()
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
const appointmentOptions = ref({ page: 1, itemsPerPage: 10 })
const appointmentTotal = ref(0)
const appointmentSearch = ref('')
const appointmentStatus = ref('all')
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

watch(appointmentStatus, () => { fetchAppointments() })
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
.automation-data-table :deep(thead th) { background:#f8f9fa; font-weight:600 !important; font-size:12px !important; }
.automation-data-table :deep(tbody td) { font-size:14px; }
.full-width-table :deep(.v-table__wrapper) { width: 100%; }
.full-width-table :deep(table) { width: 100% !important; table-layout: auto; }
.automation-data-table :deep(tbody tr:hover) { background:#fafafa !important; }
.automation-data-table :deep(th:nth-child(1)) { width: 200px; }
.automation-data-table :deep(th:nth-child(2)) { width: 100px; }
.automation-data-table :deep(th:nth-child(3)) { width: 200px; }
.automation-data-table :deep(th:nth-child(4)) { width: 150px; }
.automation-data-table :deep(th:nth-child(5)) { width: 200px; }
.automation-data-table :deep(th:nth-child(6)) { width: 240px; }
.automation-data-table :deep(th:nth-child(7)) { width: 140px; }
.automation-data-table :deep(th:nth-child(8)) { width: 160px; }
.automation-data-table :deep(th:nth-child(9)) { width: 80px; }
.custom-search { height: 40px; border-radius: 8px; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background: #fff !important; min-height: 44px; font-size: 14px; }
.action-btn { height: 40px; text-transform: none; font-weight: 500; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
</style>
