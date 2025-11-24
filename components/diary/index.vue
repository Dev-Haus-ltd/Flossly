<template>
  <v-sheet color="background" class="diary-dashboard">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Flossly Diary</p>
    </div>
  

    <!-- Stats -->
    <div class="stats-section">
      <v-row class="stat-row" align="stretch">
        <v-col v-for="(card, i) in statCards" :key="i" class="stat-col">
          <DiaryStatCard
            :uid="i"
            :icon="card.icon"
            :label="card.label"
            :value="card.value"
            :subtitle="card.subtitle"
            :note="card.note"
            :select="card.select"
            :select-items="card.selectItems"
            @update:select="(v) => onCardSelect(i, v)"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Tabs & actions -->
    <div class="content-section">
      <v-tabs v-model="activeTab" bg-color="transparent" color="primary" class="custom-tabs">
        <v-tab value="takings">Today's Taking</v-tab>
        <v-tab value="patients">Patient Coming Today</v-tab>
        <v-tab value="staff">Staff Working Today</v-tab>
      </v-tabs>

      <div class="table-controls">
        <div class="controls-left">
           <v-text-field v-model="search" placeholder="Search" append-inner-icon="mdi-magnify" variant="solo" density="compact" hide-details flat class="custom-search" />
          <DiaryFilterMenu :dentists="dentists" :treatments="treatments" :init-date="todayStr" @update:filters="onFilters" />
        </div>

        <v-btn color="primary" variant="flat" rounded="lg" @click="showAddPatient = true">
          <v-icon start size="18">mdi-plus</v-icon>
          Add Patient
        </v-btn>
      </div>

      <!-- Tables -->
      <div class="table-container">
        <template v-if="activeTab === 'takings'">
          <div class="table-header">
            <h3 class="table-title">Today's Taking</h3>
          </div>
          <v-data-table
            :headers="takingsHeaders"
            :items="takings"
            :search="search"
            item-key="id"
            class="full-width-table"
            :items-per-page="10"
          >
            <template v-slot:headers="{ columns }">
              <tr>
                <template v-for="(column, i) in columns" :key="column.key">
                  <th
                    :style="{
                      width: column.width + 'px',
                      padding: '0px 7px',
                      fontSize: '14px',
                      backgroundColor: '#F6F6F6',
                    }"
                  >
                    <div v-if="i !== 0" class="d-flex align-center th-content">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                      <span
                        class="resize-handle"
                        @mousedown="startResize($event, column)"
                      ></span>
                    </div>
                    <div v-else class="d-flex justify-center">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allSelectedState('takings')"
                        :indeterminate.prop="someSelectedState('takings')"
                        @change="toggleAllRows('takings')"
                      />
                    </div>
                  </th>
                </template>
              </tr>
            </template>
            <template v-slot:item="{ item }">
              <tr class="table-row">
                <td class="text-center">
                  <input
                    type="checkbox"
                    class="cust-checkbox"
                    :checked="isRowSelected('takings', item)"
                    @change="toggleRow('takings', item)"
                  />
                </td>
                <td class="text-left">{{ item.name }}</td>
                <td class="text-left">{{ item.amount }}</td>
                <td class="text-left">{{ item.practitioner }}</td>
                <td class="text-left">{{ item.payment }}</td>
              </tr>
            </template>
          </v-data-table>
        </template>

        <template v-else-if="activeTab === 'patients'">
          <div class="table-header">
            <h3 class="table-title">Patient Coming Today</h3>
          </div>
          <v-data-table
            :headers="patientsHeaders"
            :items="patients"
            :search="search"
            item-key="id"
            class="full-width-table"
            :items-per-page="10"
          >
            <template v-slot:headers="{ columns }">
              <tr>
                <template v-for="(column, i) in columns" :key="column.key">
                  <th
                    :style="{
                      width: column.width + 'px',
                      padding: '0px 7px',
                      fontSize: '14px',
                      backgroundColor: '#F6F6F6',
                    }"
                  >
                    <div v-if="i !== 0" class="d-flex align-center th-content">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                      <span
                        class="resize-handle"
                        @mousedown="startResize($event, column)"
                      ></span>
                    </div>
                    <div v-else class="d-flex justify-center">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allSelectedState('patients')"
                        :indeterminate.prop="someSelectedState('patients')"
                        @change="toggleAllRows('patients')"
                      />
                    </div>
                  </th>
                </template>
              </tr>
            </template>
            <template v-slot:item="{ item }">
              <tr class="table-row">
                <td class="text-center">
                  <input
                    type="checkbox"
                    class="cust-checkbox"
                    :checked="isRowSelected('patients', item)"
                    @change="toggleRow('patients', item)"
                  />
                </td>
                <td class="text-left">{{ item.name }}</td>
                <td class="text-left">{{ item.treatment }}</td>
                <td class="text-left">{{ item.time }}</td>
                <td class="text-left">{{ item.practitioner }}</td>
                <td class="text-left">{{ item.alert }}</td>
              </tr>
            </template>
          </v-data-table>
        </template>

        <template v-else>
          <div class="table-header">
            <h3 class="table-title">Staff Working Today</h3>
          </div>
          <v-data-table
            :headers="staffHeaders"
            :items="staff"
            :search="search"
            item-key="id"
            class="full-width-table"
            :items-per-page="10"
          >
            <template v-slot:headers="{ columns }">
              <tr>
                <template v-for="(column, i) in columns" :key="column.key">
                  <th
                    :style="{
                      width: column.width + 'px',
                      padding: '0px 7px',
                      fontSize: '14px',
                      backgroundColor: '#F6F6F6',
                    }"
                  >
                    <div v-if="i !== 0" class="d-flex align-center th-content">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                      <span
                        class="resize-handle"
                        @mousedown="startResize($event, column)"
                      ></span>
                    </div>
                    <div v-else class="d-flex justify-center">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allSelectedState('staff')"
                        :indeterminate.prop="someSelectedState('staff')"
                        @change="toggleAllRows('staff')"
                      />
                    </div>
                  </th>
                </template>
              </tr>
            </template>
            <template v-slot:item="{ item }">
              <tr class="table-row">
                <td class="text-center">
                  <input
                    type="checkbox"
                    class="cust-checkbox"
                    :checked="isRowSelected('staff', item)"
                    @change="toggleRow('staff', item)"
                  />
                </td>
                <td class="text-left">{{ item.name }}</td>
                <td class="text-left">{{ item.role }}</td>
                <td class="text-left">{{ item.start }}</td>
                <td class="text-left">{{ item.end }}</td>
              </tr>
            </template>
          </v-data-table>
        </template>
      </div>
    </div>
  </v-sheet>

  <!-- Add Patient Modal -->
  <AddPatient v-model="showAddPatient" @save="onSavePatient" />
</template>

<script setup>
import DiaryStatCard from '@/components/diary/DiaryStatCard.vue'
import DiaryFilterMenu from '@/components/diary/filterMenu.vue'
import { useDiaryStore } from '@/stores/diary'
import { useOrgStore } from '@/stores/organisation'
import AddPatient from '@/components/diary/addPatient.vue'

const activeTab = ref('takings')
const search = ref('')
const diaryStore = useDiaryStore()
const debounce = (fn, ms=400) => { let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), ms) } }

// Stats cards (dynamic)
const accountsPeriod = ref('Today')
const statCards = reactive([
  { icon: 'https://cdn.lordicon.com/akqsdstj.json', label: 'Accounts', subtitle: 'Total', value: '£0.00', note: '', select: accountsPeriod.value, selectItems: ['Today','Week','Month'] },
  { icon: 'https://cdn.lordicon.com/axteoudt.json', label: 'Highest Grossing Practitioner', subtitle: '', value: '£0.00', note: '', selectItems: [] },
  { icon: 'https://cdn.lordicon.com/hjbrplhx.json', label: 'Total Patients Coming Today', subtitle: 'Patients', value: 0, note: '', selectItems: [] },
  { icon: 'https://cdn.lordicon.com/vduvxizq.json', label: 'VIP Patients for the Day', subtitle: "VIP's", value: 0, note: '', selectItems: [] },
])

const takingsHeaders = [
  { title: '', key: 'checkbox', sortable: false, width: 48 },
  { title: 'Patient Name', key: 'name', align: 'start', width: 180 },
  { title: 'Amount', key: 'amount', align: 'start', width: 120 },
  { title: 'Practitioner', key: 'practitioner', align: 'start', width: 180 },
  { title: 'Payment Method', key: 'payment', align: 'start', width: 180 },
]
const takings = ref([])

const patientsHeaders = [
  { title: '', key: 'checkbox', sortable: false, width: 48 },
  { title: 'Patient Name', key: 'name', align: 'start', width: 180 },
  { title: 'Treatment', key: 'treatment', align: 'start', width: 180 },
  { title: 'Time', key: 'time', align: 'start', width: 120 },
  { title: 'Practitioner', key: 'practitioner', align: 'start', width: 180 },
  { title: 'Alert', key: 'alert', align: 'start', width: 140 },
]
const patients = ref([])

const staffHeaders = [
  { title: '', key: 'checkbox', sortable: false, width: 48 },
  { title: 'Name of Staff', key: 'name', align: 'start', width: 180 },
  { title: 'Role', key: 'role', align: 'start', width: 160 },
  { title: 'Shift Start time', key: 'start', align: 'start', width: 150 },
  { title: 'Shift End time', key: 'end', align: 'start', width: 150 },
]
const staff = ref([])

const todayStr = computed(() => new Date().toISOString().slice(0,10))

function currency(n) { return `£${Number(n || 0).toFixed(2)}` }

const filters = ref({})
const selectedTakings = ref([])
const selectedPatients = ref([])
const selectedStaff = ref([])

const tableRefs = {
  takings,
  patients,
  staff,
}
const selectedRefs = {
  takings: selectedTakings,
  patients: selectedPatients,
  staff: selectedStaff,
}

const isRowSelected = (type, row) =>
  selectedRefs[type]?.value?.some((r) => r.id === row.id)

const toggleRow = (type, row) => {
  const target = selectedRefs[type]
  if (!target) return
  const exists = target.value.some((r) => r.id === row.id)
  target.value = exists
    ? target.value.filter((r) => r.id !== row.id)
    : [...target.value, row]
}

const allSelectedState = (type) => {
  const total = tableRefs[type]?.value?.length || 0
  const selected = selectedRefs[type]?.value?.length || 0
  return total > 0 && selected === total
}

const someSelectedState = (type) => {
  const total = tableRefs[type]?.value?.length || 0
  const selected = selectedRefs[type]?.value?.length || 0
  return selected > 0 && selected < total
}

const toggleAllRows = (type) => {
  const all = tableRefs[type]?.value || []
  const target = selectedRefs[type]
  if (!target) return
  if (allSelectedState(type)) {
    target.value = []
  } else {
    target.value = [...all]
  }
}
async function loadAppointments() {
  const payload = { date: (filters.value.date || todayStr.value), dentistId: filters.value.dentistId || null, status: filters.value.status || null, treatmentId: filters.value.treatmentId || null, search: search.value || '' }
  const res = await diaryStore.listAppointments(payload)
  if (res?.code === 0) {
    const rows = res.data || []
    // Patients Coming Today -> Pending
    const pending = rows.filter(r => (r.status || '').toLowerCase() === 'pending')
    patients.value = pending.map((r, i) => ({ id: i + 1, name: r.patient, treatment: r.treatmentName || '-', time: r.start, practitioner: r.dentistName || '', alert: '-' }))
    // Today's Takings -> Confirmed (or Complete)
    const confirmed = rows.filter(r => ['confirmed','complete','arrived'].includes((r.status || '').toLowerCase()))
    takings.value = confirmed.map((r, i) => ({ id: i + 1, name: r.patient, amount: currency(r.amount), practitioner: r.dentistName || '', payment: '-' }))
    // Stats based on rows
    const totalAccounts = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    statCards[0].value = currency(totalAccounts)
    statCards[2].value = rows.length
    // Highest Grossing Practitioner (for current filter span)
    const perDent = rows.reduce((acc, r) => {
      const key = r.dentistId || 'unknown'
      acc[key] = (acc[key] || 0) + Number(r.amount || 0)
      return acc
    }, {})
    let topDentistId = null; let topAmount = 0
    for (const [k, v] of Object.entries(perDent)) { if (v > topAmount) { topAmount = v; topDentistId = k } }
    const topName = (rows.find(r => String(r.dentistId) === String(topDentistId)) || {}).dentistName || ''
    statCards[1].subtitle = topName || '—'
    statCards[1].value = currency(topAmount)
  } else {
    patients.value = []
    takings.value = []
  }
  selectedPatients.value = []
  selectedTakings.value = []
}

async function loadAccounts() {
  const map = { 'Today': 'day', 'Week': 'week', 'Month': 'month' }
  const period = map[accountsPeriod.value] || 'day'
  const res = await diaryStore.getStats({ period, date: todayStr.value })
  if (res?.code === 0) statCards[0].value = currency(res.data?.accounts || 0)
}

async function loadStaff() {
  const res = await diaryStore.listDentists(todayStr.value)
  if (res?.code === 0) {
    staff.value = (res.data || []).map((d, i) => ({ id: d.id || i + 1, name: d.name, role: d.role || 'Dentist', start: d.start || '-', end: d.end || '-' }))
  } else { staff.value = [] }
  selectedStaff.value = []
}

const dentists = ref([])
const treatments = ref([])
const organisationStore = useOrgStore()

onMounted(async () => {
  const [d1, t1] = await Promise.all([
    diaryStore.listDentists(todayStr.value),
    organisationStore.listTreatments(),
  ])
  if (d1?.code === 0) dentists.value = d1.data || []
  if (t1?.code === 0) treatments.value = t1.data || []
  loadAppointments(); loadAccounts(); loadStaff()
})

function onCardSelect(index, value) {
  const card = statCards[index]
  if (!card) return
  card.select = value
  if (index === 0) { // Accounts card
    accountsPeriod.value = value
    loadAccounts()
  }
}

const showAddPatient = ref(false)
const onSavePatient = async (p) => {
  await diaryStore.createPatient(p)
  await loadAppointments()
}

const onFilters = (f) => { filters.value = f || {}; loadAppointments() }

const startResize = (event, column) => {
  if (typeof window === 'undefined') return
  const startX = event.clientX || 0
  const startWidth = Number(column.width) || 140
  const onMouseMove = (e) => {
    const delta = (e.clientX || 0) - startX
    column.width = Math.max(80, startWidth + delta)
  }
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

watch(search, debounce(() => loadAppointments(), 400))
</script>

<style scoped lang="scss">
.diary-dashboard {
  min-height: 100vh;
  background: #fafafa;
}

.page-header {
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.stats-section {
  padding: 24px;
}

.stat-row {
  display: flex;
  align-items: stretch;
}

.stat-col {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
}

.content-section {
  padding: 0 24px 24px;
}

.custom-tabs {
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-field {
  width: 240px;
}

.search-field :deep(.v-field) {
  border-radius: 8px;
}

.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.custom-table {
  background: white;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}
.table-row:hover {
  background: #f9fafb;
}

.table-row td {
  padding: 16px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}
.full-width-table {
  border-top: 1px solid rgb(var(--v-theme-outline));
  border-radius: unset;
}
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}
:deep() .v-table .v-table__wrapper > table > thead > tr > th:not(:last-child) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}
:deep() .v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}
:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
}
.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
  border: solid rgb(var(--v-theme-on-primary));
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
