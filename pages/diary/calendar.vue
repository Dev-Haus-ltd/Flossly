<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Flossly Diary</p>
    </div>

    <!-- Controls -->
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center" style="gap: 8px">
        <v-btn icon variant="text" @click="prevDay"><v-icon>mdi-chevron-left</v-icon></v-btn>
        <v-btn icon variant="text" @click="nextDay"><v-icon>mdi-chevron-right</v-icon></v-btn>
        <div class="text-subtitle-1 font-weight-600 ml-2">{{ dayLabel }}</div>
      
        <v-btn-toggle v-model="view" mandatory class="custom-toggle ml-6" >
  <v-btn value="day" class="toggle-btn">
    <img
              :src="listicon"
              alt="list icon"
              class="mr-1"
              width="16"
              height="16"
            /> Day
  </v-btn>
  <v-btn value="week" class="toggle-btn">
     <img
              :src="calendericon"
              alt="calendar icon"
              class="mr-1"
              width="16"
              height="16"
            />
          
    Week
  </v-btn>
</v-btn-toggle>

        <div class="ml-4" style="width: 180px">
          <v-text-field v-model="search" placeholder="Search" append-inner-icon="mdi-magnify" variant="solo" density="compact" hide-details flat />
        </div>
        <DiaryFilterMenu
          class="ml-2"
          :dentists="dentists"
          :treatments="treatments"
          :init-date="dateStr"
          @update:filters="onFilters"
        />
        <v-select
          class="ml-2"
          v-model="selectedDentistIds"
          :items="dentistSelect"
          item-title="name"
          item-value="id"
          multiple
          chips
          style="max-width: 320px;border-radius:10px"
          density="compact"
          hide-details
          variant="outlined"
          
        />
      </div>
      <div>
        <v-btn color="primary" rounded="lg" variant="flat" @click="showAddPatient = true">
          <template #prepend><v-icon size="18">mdi-plus-circle-outline</v-icon></template>
          Add Patient
        </v-btn>
      </div>
    </div>

    <!-- Global snackbar handled by app Snackbar component -->

    <!-- Calendar grid -->
    <div>
      <DiaryCalendar
        :date="dateStr"
        :view="view"
        :dentists="dentists"
        :selected-dentist-ids="selectedDentistIds"
        :appointments="appointmentsByDentist"
        @slot-click="openAppointment"
        @slot-full="onSlotFull"
        @open-notes="onOpenNotes"
        @update-status="onUpdateStatus"
      />
    </div>

    <!-- Modals -->
    <AddAppointment
      v-model="showAppointment"
      :initial-date="dateLabel"
      :initial-time="modalTime"
      :initial-practitioner="modalDentist?.name || ''"
      :practitioner-options="dentists.map(d=>d.name)"
      :patient-options="patientOptions"
      :preselected-patient="preselectedPatientName"
      :preselected-patient-id="preselectedPatientId"
      @add-patient="onAddPatientFromAppointment"
      @save="onSaveAppointment"
    />
    <AddPatient v-model="showAddPatient" @save="onPatientSaved" />
    <NotesModal
      v-model="showNotes"
      :date="dateStr"
      :dentist-id="notesDentist?.id || null"
      :dentist-name="notesDentist?.name || ''"
    />
  </v-sheet>
</template>

<script setup>
import DiaryCalendar from '@/components/diary/calendar/index.vue'
import DiaryFilterMenu from '@/components/diary/filterMenu.vue'
import AddAppointment from '@/components/diary/addAppointment.vue'
import AddPatient from '@/components/diary/addPatient.vue'
import NotesModal from '@/components/diary/NotesModal.vue'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
import { useOrgStore } from '@/stores/organisation'
import listicon from "@/assets/icons/listView/listicon.svg";
import calendericon from "@/assets/icons/listView/calendericon.svg";
import { formatDateDDMMYYYY } from '@/lib/dateFormatter'

definePageMeta({ layout: 'home' })

const search = ref('')
const view = ref('day')
const date = ref(new Date())
const selectedDentistIds = ref([])
watch(view, v => console.log('current view ->', v))
const diaryStore = useDiaryStore()
const dentists = ref([])
const treatments = ref([])
const organisationStore = useOrgStore()

const dentistSelect = computed(() => dentists.value)

// Simple appointment storage keyed by dentist id
const appointmentsByDentist = reactive({})

// Use global snackbar via store
const mainStore = useMainStore()
function showError(message) { mainStore?.setSnackbar?.({ title: message || 'Something went wrong', type: 'error' }) }
function showSuccess(message) { mainStore?.setSnackbar?.({ title: message || 'Done', type: 'success' }) }

const dateStr = computed(() => date.value.toISOString().slice(0,10))
const dateLabel = computed(() => formatDateDDMMYYYY(date.value))
const dayLabel = computed(() => formatDateDDMMYYYY(date.value))

const prevDay = () => { const d = new Date(date.value); d.setDate(d.getDate()-1); date.value = d }
const nextDay = () => { const d = new Date(date.value); d.setDate(d.getDate()+1); date.value = d }
const dateMenu = ref(false)
const onPickDate = (d) => { date.value = new Date(d); dateMenu.value = false }
const filters = ref({})
function onFilters(f){
  filters.value = f || {}
  if (f?.date) {
    try { date.value = new Date(f.date) } catch {}
  }
  loadDentists().then(loadAppointments)
}

// Appointment modal coordination
const showAppointment = ref(false)
const modalTime = ref('09:00')
const modalDentist = ref(null)
const showNotes = ref(false)
const notesDentist = ref(null)
const preselectedPatientName = ref('')
const preselectedPatientId = ref(null)
const patientOptions = ref([]) // [{ id, name }]

function openAppointment({ dentist, hour, minute }) {
  modalDentist.value = dentist
  modalTime.value = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
  preselectedPatientName.value = ''
  showAppointment.value = true
}

function onSlotFull({ dentist, hour }) {
  const hLabel = hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`
  showError(`No available 15-min slots at ${hLabel} for ${dentist?.name || 'this dentist'}`)
}

function onOpenNotes(dentist) {
  notesDentist.value = dentist
  showNotes.value = true
}

// Add patient button in header
const showAddPatient = ref(false)
function onPatientSaved(p) {
  diaryStore.createPatient(p).then((res) => {
    const name = `${p.firstName} ${p.lastName}`.trim()
    preselectedPatientName.value = name
    const id = res?.data?.id
    preselectedPatientId.value = id
    if (name) patientOptions.value.unshift({ id, name })
    showAddPatient.value = false
    showAppointment.value = true
  })
}

function onAddPatientFromAppointment() {
  showAppointment.value = false
  showAddPatient.value = true
}

function onSaveAppointment(appt) {
  const id = modalDentist.value?.id
  if (!id) return
  const payload = {
    dentistId: id,
    patientId: appt.patientId || preselectedPatientId.value || null,
    patientName: appt.patient || preselectedPatientName.value,
    date: dateStr.value,
    time: appt.time || modalTime.value,
    duration: appt.duration || 10,
    treatmentId: appt.treatmentId || null,
    treatmentName: appt.treatmentName || null,
    status: appt.status || 'Pending',
    notes: appt.notes || '',
  }
  diaryStore.createAppointment(payload)
    .then(() => { showSuccess('Appointment created'); loadAppointments() })
    .catch((e) => {
      const msg = e?.message || e?.data?.message || 'Failed to create appointment'
      showError(msg)
    })
}

function loadDentists() {
  return diaryStore.listDentists(dateStr.value).then((res) => {
    if (res?.code === 0) dentists.value = res.data || []
    // Keep selection valid
    selectedDentistIds.value = (selectedDentistIds.value || []).filter(id => (dentists.value || []).some(d => String(d.id) === String(id)))
    return res
  })
}

function buildWeekDates() {
  const base = new Date(date.value)
  const day = base.getDay()
  const diff = (day + 6) % 7 // Monday index
  const start = new Date(base); start.setDate(base.getDate() - diff)
  const days = []
  for (let i=0;i<7;i++) { const d = new Date(start); d.setDate(start.getDate()+i); days.push(d) }
  return days.map(d => d.toISOString().slice(0,10))
}

function loadAppointments() {
  for (const k of Object.keys(appointmentsByDentist)) delete appointmentsByDentist[k]
  const dates = view.value === 'week' ? buildWeekDates() : [dateStr.value]
  const promises = []
  const selected = filters.value.dentistId
    ? (dentists.value || []).filter(d => String(d.id) === String(filters.value.dentistId))
    : (selectedDentistIds.value && selectedDentistIds.value.length)
      ? dentists.value.filter(d => selectedDentistIds.value.map(String).includes(String(d.id)))
      : (dentists.value || [])
  for (const dnt of selected) {
    for (const d of dates) {
      promises.push(
        diaryStore.listAppointments({ date: d, dentistId: dnt.id, status: filters.value.status || null, treatmentId: filters.value.treatmentId || null, search: search.value || '' }).then((r) => ({ key: dnt.id, rows: (r?.data || []).map(x => ({ ...x, date: d })) }))
      )
    }
  }
  Promise.all(promises).then((results) => {
    results.forEach(({ key, rows }) => {
      if (!appointmentsByDentist[key]) appointmentsByDentist[key] = []
      appointmentsByDentist[key].push(...rows.map((r) => ({ id: r.id, patientId: r.patientId, patient: r.patient, start: r.start, end: r.end, status: r.status, treatmentName: r.treatmentName, notes: r.notes, date: r.date })))
    })
  })
}

function onUpdateStatus({ appt, status, dentistId }) {
  diaryStore.updateAppointment({ id: appt.id, status })
    .then(() => { showSuccess('Appointment updated'); loadAppointments() })
    .catch((e) => {
      const msg = e?.message || e?.data?.message || 'Failed to update appointment'
      showError(msg)
    })
}

onMounted(() => {
  loadDentists().then(loadAppointments)
  organisationStore.listTreatments().then((res) => { if (res?.code === 0) treatments.value = res.data || [] })
})
watch(dateStr, () => { loadDentists().then(loadAppointments) })
watch(view, () => { loadDentists().then(loadAppointments) })

// Load patients for autocomplete once
onMounted(() => {
  diaryStore.listPatients('').then((res) => {
    if (res?.code === 0) {
      patientOptions.value = (res.data || []).map(p => ({ id: p.id, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() })).filter(x => x.name)
    }
  })
})
</script>

<style scoped>
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
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
</style>
