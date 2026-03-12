<template>
  <div class="charting-root">

    <!-- ── Loading ──────────────────────────────────────────────────── -->
    <div v-if="store.isLoading" class="charting-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-3 text-body-2 text-medium-emphasis">Loading chart...</p>
    </div>

    <template v-else>
      <!-- ── Top row: chart card + codes panel ────────────────────── -->
      <div class="charting-body">

        <!-- Left: chart card -->
        <div class="chart-card">
          <!-- Toolbar: teeth-type dropdown, mode pills, 3D toggle -->
          <div class="chart-card__toolbar">
            <div class="teeth-type-control">
              <span class="teeth-type-label">Teeth Type</span>
              <v-select
                :model-value="store.teethType"
                :items="teethTypeOptions"
                item-title="label"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="teeth-type-select"
                @update:model-value="store.setTeethType($event)"
              />
            </div>
            <!-- 3D / 2D toggle -->
            <v-btn
              :variant="view3d ? 'flat' : 'outlined'"
              :color="view3d ? 'primary' : undefined"
              size="small"
              rounded="lg"
              prepend-icon="mdi-rotate-3d"
              @click="view3d = !view3d"
            >{{ view3d ? '3D' : '2D' }}</v-btn>
          </div>

          <!-- Tooth chart -->
          <div class="chart-scroll">
            <ToothChart3D
              v-if="view3d"
              :chart="store.chart"
              :notation="store.notation"
              :active-condition="store.activeCondition"
              :selected-tooth-fdi="store.selectedToothFdi"
              style="width: 100%; height: 420px;"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
            <ToothChart
              v-else
              :chart="displayChart"
              :notation="store.notation"
              :active-condition="store.activeCondition"
              :selected-tooth-fdi="store.selectedToothFdi"
              :chart-scope="store.chartScope"
              :bridge-select-mode="store.bridgeSelectMode"
              :bridge-start-fdi="store.bridgeStartFdi"
              :tooth-statuses="store.toothStatuses"
              :treatment-items="store.treatmentPlan"
              :teeth-type="store.teethType"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
              @tooth-status-change="onToothStatusChange"
              @tooth-diagnosis-change="onToothDiagnosisChange"
            />
            <div v-if="view3d && isSurfaceConditionActive" class="surface-hint mt-2">
              Surface mapping in 3D is approximate. Use 2D mode for maximum precision.
            </div>
          </div>
        </div>

        <!-- Right: codes panel -->
        <div class="codes-side">
          <CodesPanel
            :active-code-id="store.activeCodeId"
            :favorite-code-ids="store.favoriteCodeIds"
            :codes="store.treatmentCatalog"
            @code-select="onCodeSelect"
            @toggle-favorite="store.toggleFavoriteCode($event)"
          />
        </div>

      </div>

      <!-- ── Bottom: treatment plan panel ─────────────────────────── -->
      <div class="treatment-plan-wrap">
        <TreatmentPlanPanel
          :items="store.treatmentItems"
          :total="store.treatmentTotal"
          :planned-count="store.plannedCount"
          :completed-count="store.completedCount"
          :notation="store.notation"
          :appointments="store.appointments"
          :plans="store.plans"
          :active-plan-id="store.activePlanId"
          :images="store.chartImages"
          :history="store.historyEntries"
          :appointment-links="store.appointmentLinks"
          :practitioners="store.practitioners"
          @remove="store.removeTreatmentItemById($event)"
          @update="onTreatmentUpdate"
          @reorder="onReorder"
          @add-appointment="store.addAppointment()"
          @add-plan="store.addTreatmentPlan($event)"
          @select-plan="store.selectTreatmentPlan($event)"
          @rename-plan="store.renameTreatmentPlan($event.id, $event.name)"
          @duplicate-plan="store.duplicateTreatmentPlan($event)"
          @delete-plan="onDeletePlan"
          @update-plan-color="store.updateTreatmentPlanColor($event.id, $event.color)"
          @set-interval="onSetInterval"
          @link-appointment="onLinkAppointment"
          @add-image="store.addChartImage($event)"
          @remove-image="store.removeChartImage($event)"
          @delete-appointment="store.deleteAppointment($event)"
          @update-appointment="onUpdateAppointment"
          @book-appointment="onBookAppointment"
          @chart-scope-change="onChartScopeChange"
          @mark-complete="onMarkComplete"
          @print-plan="printDialogOpen = true"
        />
      </div>

      <!-- ── Clinical tabs: Perio / Soft Tissue / Risk ──────────── -->
      <div class="clinical-panel">
        <div class="clinical-tabs">
          <button
            v-for="tab in CLINICAL_TABS"
            :key="tab.key"
            class="clinical-tab"
            :class="{ 'clinical-tab--active': activeClinicalTab === tab.key }"
            @click="activeClinicalTab = tab.key"
          >{{ tab.label }}</button>
        </div>
        <div class="clinical-tab-body">
          <PerioChart
            v-if="activeClinicalTab === 'perio'"
            :peri-data="store.periData"
            @update="store.setPerioData($event)"
          />
          <SoftTissueExam
            v-else-if="activeClinicalTab === 'soft-tissue'"
            :soft-tissue-data="store.softTissueData"
            @update="store.setSoftTissueData($event)"
          />
          <RiskAssessment
            v-else-if="activeClinicalTab === 'risk'"
            :risk-data="store.riskData"
            @update="store.setRiskData($event)"
          />
        </div>
      </div>
    </template>

    <!-- ── Booking dialog ────────────────────────────────────────────── -->
    <!-- Fix #1 — added practitioner selector; dentistId is now required before booking -->
    <v-dialog v-model="bookingDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pt-4 px-5">Book Appointment in Diary</v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-select
            v-model="bookingForm.dentistId"
            :items="store.practitioners"
            item-title="name"
            item-value="id"
            label="Practitioner"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field v-model="bookingForm.date" label="Date" type="date" variant="outlined" density="compact" class="mb-3" />
          <div class="d-flex gap-3 mb-3">
            <v-text-field v-model="bookingForm.startTime" label="Start" type="time" variant="outlined" density="compact" />
            <v-text-field v-model="bookingForm.endTime" label="End" type="time" variant="outlined" density="compact" />
          </div>
          <v-textarea v-model="bookingForm.notes" label="Notes" variant="outlined" density="compact" rows="2" auto-grow />
          <div v-if="conflictWarning" class="conflict-warning mt-2">
            <v-icon size="16" color="error" class="mr-1">mdi-alert</v-icon>
            {{ conflictWarning }}
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="bookingDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="bookingLoading" :disabled="bookingDisabled" @click="confirmBooking">Book</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Fix #11 — replace window.prompt() with proper inline dialogs -->
    <v-dialog v-model="intervalDialog" max-width="360">
      <v-card rounded="lg">
        <v-card-title class="pt-4 px-5">Set Appointment Interval</v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-text-field
            v-model.number="intervalDraft"
            label="Days between appointments"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="intervalDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="confirmInterval">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="linkDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="pt-4 px-5">Set Appointment Link</v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-text-field
            v-model="linkDraft"
            label="External link URL"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="linkDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="confirmLink">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <CommonConfirmDialog
      v-model="deletePlanDialog"
      title="Delete treatment plan"
      message="Delete this treatment plan and all its items?"
      confirm-text="Delete"
      icon="mdi-trash-can-outline"
      @cancel="onCancelDeletePlan"
      @confirm="onConfirmDeletePlan"
    />
  </div>
</template>

<script setup>
import ToothChart from './ToothChart.vue'
import ToothChart3D from './ToothChart3D.vue'
import TreatmentPlanPanel from './TreatmentPlanPanel.vue'
import CodesPanel from './CodesPanel.vue'
import PerioChart from './PerioChart.vue'
import SoftTissueExam from './SoftTissueExam.vue'
import RiskAssessment from './RiskAssessment.vue'
import { usePatientChartingStore } from '@/stores/patientCharting'
import { useMainStore } from '@/stores/index'
import { CONDITIONS } from './toothData.js'
import { DEFAULT_PLAN_ID } from '~/shared/defaults/charting/chartingDefaults.js'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
})

const store = usePatientChartingStore()
const mainStore = useMainStore()

const teethTypeOptions = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Deciduous', value: 'deciduous' },
  { label: 'Mixed', value: 'mixed' },
]

const view3d = ref(false)
const activeClinicalTab = ref('perio')
const printDialogOpen = ref(false)

const CLINICAL_TABS = [
  { key: 'perio', label: 'Periodontal' },
  { key: 'soft-tissue', label: 'Soft Tissue Exam' },
  { key: 'risk', label: 'Risk Assessment' },
]

const isSurfaceConditionActive = computed(() => {
  const key = store.activeCondition
  return !!(key && CONDITIONS[key]?.surface)
})

// ── Fix #4 — per-scope display chart ────────────────────────────────────────
// base scope: strip planned/completed conditions so only existing findings show
// plan scope:  start from base (existing only) then overlay the active plan's items
// both scope:  raw chart unchanged
const displayChart = computed(() => {
  const raw = store.chart
  if (store.chartScope === 'both') return raw

  // Build a map of active plan condition keys for 'plan' scope filtering
  const activePlanId = store.activePlanId || DEFAULT_PLAN_ID
  const activePlanKeys = new Set()
  if (store.chartScope === 'plan') {
    store.treatmentPlan
      .filter((i) => (i.planId || DEFAULT_PLAN_ID) === activePlanId && i.status !== 'existing')
      .forEach((i) => {
        activePlanKeys.add(`${i.fdi}:${i.surface || ''}:${i.condition || ''}`)
      })
  }

  const result = {}
  Object.entries(raw).forEach(([fdiStr, tooth]) => {
    const fdi = Number(fdiStr)
    const t = { ...tooth }

    // Filter tooth-level condition
    if (t.toothConditionStatus && t.toothConditionStatus !== 'existing') {
      const keep = store.chartScope === 'plan' && activePlanKeys.has(`${fdi}::${t.toothCondition || ''}`)
      if (!keep) {
        t.toothCondition = null
        t.toothConditionStatus = null
      }
    }

    // Filter surface conditions
    if (tooth.surfaces) {
      const newSurfaces = {}
      Object.entries(tooth.surfaces).forEach(([s, sv]) => {
        if (!sv.status || sv.status === 'existing') {
          newSurfaces[s] = { ...sv }
        } else {
          const keep = store.chartScope === 'plan' && activePlanKeys.has(`${fdi}:${s}:${sv.condition || ''}`)
          newSurfaces[s] = keep ? { ...sv } : { condition: null, status: 'existing' }
        }
      })
      t.surfaces = newSurfaces
    }

    result[fdi] = t
  })
  return result
})

// Load chart on mount / patientId change
watch(() => props.patientId, async (id, prevId) => {
  if (!id) return
  if (prevId && prevId !== id) store.reset()
  await store.loadChart(id)
}, { immediate: true })

// ── Event handlers ──────────────────────────────────────────────────────────
function onSurfaceClick({ fdi, surface }) {
  store.applyCondition(fdi, surface)
}

function onToothClick(fdi) {
  if (store.activeCondition && CONDITIONS[store.activeCondition]?.fullTooth) {
    store.applyCondition(fdi, null)
  } else if (store.activeCondition && view3d.value) {
    store.selectTooth(fdi)
  } else {
    store.selectTooth(fdi)
  }
}

function onToothStatusChange({ fdi, status, rowId }) {
  store.setToothStatus(fdi, status, rowId)
}

function onToothDiagnosisChange({ fdi, diagnosis, rowId }) {
  store.setToothDiagnosis(fdi, diagnosis, rowId)
}

function onChartScopeChange(scope) {
  store.setChartScope(scope)
  if (scope === 'base' && store.mode !== 'examination') store.setMode('examination')
  if (scope === 'plan' && store.mode !== 'treatment') store.setMode('treatment')
}

function onCodeSelect(codeId, conditionKey) {
  store.setActiveCode(codeId)
  if (String(store.activeCodeId || '') !== String(codeId)) {
    if (store.activeCondition) store.setCondition(store.activeCondition)
    return
  }
  if (conditionKey) {
    if (store.activeCondition !== conditionKey) store.setCondition(conditionKey)
  } else if (store.activeCondition) {
    store.setCondition(store.activeCondition)
  }
}

function onTreatmentUpdate({ id, ...patch }) {
  store.updateTreatmentItem(id, patch)
}

function onMarkComplete(payload) {
  const itemId = typeof payload === 'object' ? payload?.id : payload
  if (!itemId) return
  store.markItemComplete(
    itemId,
    typeof payload === 'object' ? (payload?.practitionerId || null) : null,
    typeof payload === 'object' ? (payload?.practitionerName || '') : ''
  )
}

function onReorder(payload) {
  store.reorderTreatmentPlan(payload)
}

function onUpdateAppointment({ id, patch }) {
  store.updateAppointment(id, patch)
}

function onDeletePlan(planId) {
  deletePlanId.value = planId
  deletePlanDialog.value = true
}

function onCancelDeletePlan() {
  deletePlanDialog.value = false
  deletePlanId.value = null
}

function onConfirmDeletePlan() {
  const planId = deletePlanId.value
  if (!planId) return onCancelDeletePlan()
  store.deleteTreatmentPlan(planId)
  onCancelDeletePlan()
}

// Fix #11 — replace window.prompt() with proper v-dialog dialogs
const intervalDialog = ref(false)
const intervalDraft = ref(7)

function onSetInterval() {
  intervalDraft.value = store.appointments?.[1]?.intervalDays ?? 7
  intervalDialog.value = true
}

function confirmInterval() {
  store.setIntervalDays(Number(intervalDraft.value || 0))
  intervalDialog.value = false
}

const linkDialog = ref(false)
const linkGroupId = ref(null)
const linkDraft = ref('')

function onLinkAppointment(appointmentGroupId) {
  linkGroupId.value = appointmentGroupId
  linkDraft.value = store.appointmentLinks?.[appointmentGroupId] || ''
  linkDialog.value = true
}

function confirmLink() {
  if (linkGroupId.value) store.setAppointmentLink(linkGroupId.value, linkDraft.value.trim())
  linkDialog.value = false
  linkGroupId.value = null
}

// ── Booking dialog ──────────────────────────────────────────────────────────
const bookingDialog = ref(false)
const bookingApptId = ref(null)
const bookingLoading = ref(false)
const conflictWarning = ref('')
const deletePlanDialog = ref(false)
const deletePlanId = ref(null)

// Fix #1 — include dentistId in the booking form
const bookingForm = reactive({ date: '', startTime: '09:00', endTime: '09:30', notes: '', dentistId: null })

// Fix #1 — require a practitioner before the Book button enables
const bookingDisabled = computed(() =>
  !bookingForm.date || !bookingForm.startTime || !bookingForm.endTime ||
  !bookingForm.dentistId || bookingLoading.value
)

async function onBookAppointment(appointmentId) {
  bookingApptId.value = appointmentId
  // Pre-fill practitioner + notes from the first plan item in this appointment
  const apptItems = store.treatmentItems.filter((i) => (i.appointmentGroupId || 'appt-1') === appointmentId)
  const firstItem = apptItems[0]
  bookingForm.dentistId = firstItem?.practitionerId ? Number(firstItem.practitionerId) : null
  bookingForm.notes = firstItem?.notes || ''
  if (!bookingForm.date) {
    const now = new Date()
    bookingForm.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  bookingDialog.value = true
  conflictWarning.value = ''
}

function getAppointmentItems(appointmentId) {
  return store.treatmentItems.filter((i) => (i.appointmentGroupId || 'appt-1') === appointmentId)
}

function parseDateTime(date, time) {
  if (!date || !time) return null
  const t = time.length === 5 ? `${time}:00` : time
  const dt = new Date(`${date}T${t}`)
  return isNaN(dt) ? null : dt
}

function validateBooking() {
  if (!bookingApptId.value) return 'No appointment selected.'
  if (!bookingForm.dentistId) return 'Please select a practitioner.'
  if (!getAppointmentItems(bookingApptId.value).length) return 'Add at least one treatment item before booking.'
  if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) return 'Please provide date, start, and end time.'
  const start = parseDateTime(bookingForm.date, bookingForm.startTime)
  const end = parseDateTime(bookingForm.date, bookingForm.endTime)
  if (!start || !end) return 'Invalid date or time format.'
  if (end <= start) return 'End time must be after start time.'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (start < today) return 'Appointment date cannot be in the past.'
  return ''
}

async function confirmBooking() {
  bookingLoading.value = true
  conflictWarning.value = ''
  const validationError = validateBooking()
  if (validationError) {
    conflictWarning.value = validationError
    bookingLoading.value = false
    return
  }
  // Fix #1 — pass dentistId to conflict check so it's practitioner-specific
  const check = await store.checkAppointmentConflict({
    date: bookingForm.date,
    startTime: bookingForm.startTime,
    endTime: bookingForm.endTime,
    dentistId: bookingForm.dentistId,
  })
  if (check?.hasConflict) {
    conflictWarning.value = `Conflict: overlaps with ${check.conflicts?.[0]?.patientName || 'another appointment'} at ${check.conflicts?.[0]?.startTime || bookingForm.startTime}`
    bookingLoading.value = false
    return
  }
  const res = await store.bookInDiary({ appointmentId: bookingApptId.value, ...bookingForm })
  bookingLoading.value = false
  if (res?.code === 0) {
    bookingDialog.value = false
    // Fix #2 & #12 — show success snackbar; diary will load fresh appointments when navigated to
    mainStore?.setSnackbar?.({ title: 'Appointment booked. Open the Diary to view it.', type: 'success' })
  } else {
    conflictWarning.value = res?.message || 'Unable to book appointment.'
  }
}
</script>

<style scoped>
.charting-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

/* ── Loading ────────────────────────────────────────────────────── */
.charting-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* ── Body row ───────────────────────────────────────────────────── */
.charting-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* ── Chart card ─────────────────────────────────────────────────── */
.chart-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: visible;
}

.chart-card__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 10px;
  border-bottom: 1px solid #f2f2f2;
  gap: 12px;
}

.teeth-type-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
}

.teeth-type-label {
  font-size: 20px;
  color: #7b7b7b;
  font-weight: 400;
  white-space: nowrap;
}

.teeth-type-select {
  max-width: 420px;
  min-width: 260px;
}

.teeth-type-select :deep(.v-field) {
  border-radius: 16px;
}

.chart-scroll {
  display: block;
  width: 100%;
  padding: 12px 8px;
  overflow-x: auto;
  min-height: 320px;
}

/* ── Codes side panel ───────────────────────────────────────────── */
.codes-side {
  width: 260px;
  flex-shrink: 0;
}

/* ── Treatment plan ─────────────────────────────────────────────── */
.treatment-plan-wrap {
  width: 100%;
}

/* ── Conflict warning ───────────────────────────────────────────── */
.conflict-warning {
  background: #fff5f5;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #b91c1c;
  display: flex;
  align-items: center;
}

.surface-hint {
  border: 1px solid #f0e3bb;
  background: #fff8e6;
  color: #8a6d1d;
  border-radius: 8px;
  font-size: 12px;
  padding: 8px 12px;
}
</style>
