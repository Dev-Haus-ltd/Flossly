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
            <v-select
              :model-value="store.teethType"
              :items="teethTypeOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 200px;"
              @update:model-value="store.setTeethType($event)"
            />
            <!-- Mode toggle pills -->
            <div class="mode-pills">
              <button
                v-for="m in modes"
                :key="m.value"
                class="mode-pill"
                :class="{ 'mode-pill--active': store.mode === m.value }"
                @click="store.setMode(m.value)"
              >{{ m.label }}</button>
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
              :chart="store.chart"
              :notation="store.notation"
              :active-condition="store.activeCondition"
              :selected-tooth-fdi="store.selectedToothFdi"
              :bridge-select-mode="store.bridgeSelectMode"
              :bridge-start-fdi="store.bridgeStartFdi"
              :tooth-statuses="store.toothStatuses"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
              @tooth-status-change="onToothStatusChange"
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
        />
      </div>
    </template>

    <!-- ── Booking dialog ────────────────────────────────────────────── -->
    <v-dialog v-model="bookingDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pt-4 px-5">Book Appointment in Diary</v-card-title>
        <v-card-text class="px-5 pb-2">
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
import { usePatientChartingStore } from '@/stores/patientCharting'
import { CONDITIONS } from './toothData.js'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
})

const store = usePatientChartingStore()

// Teeth type options
const teethTypeOptions = [
  { label: 'Permanent', value: 'permanent' },
]

const modes = [
  { label: 'Examination', value: 'examination' },
  { label: 'Treatment',   value: 'treatment'   },
  { label: 'Completed',   value: 'completed'   },
]

// 3D toggle
const view3d = ref(false)
const isSurfaceConditionActive = computed(() => {
  const key = store.activeCondition
  return !!(key && CONDITIONS[key]?.surface)
})

// Load chart on mount / patientId change — reset before loading when patient changes
watch(() => props.patientId, async (id, prevId) => {
  if (!id) return
  if (prevId && prevId !== id) {
    store.reset()
  }
  await store.loadChart(id)
}, { immediate: true })

// ── Event handlers ─────────────────────────────────────────────────────────
function onSurfaceClick({ fdi, surface }) {
  store.applyCondition(fdi, surface)
}

function onToothClick(fdi) {
  if (store.activeCondition && CONDITIONS[store.activeCondition]?.fullTooth) {
    store.applyCondition(fdi, null)
  } else if (store.activeCondition && view3d.value) {
    // Avoid applying surface-only conditions as full-tooth in 3D mode.
    store.selectTooth(fdi)
  } else {
    store.selectTooth(fdi)
  }
}

function onToothStatusChange({ fdi, status }) {
  store.setToothStatus(fdi, status)
}

function onCodeSelect(codeId, conditionKey) {
  store.setActiveCode(codeId)
  if (conditionKey) {
    // Set the matching condition key (if already active, this toggles it off)
    if (store.activeCondition !== conditionKey) {
      store.setCondition(conditionKey)
    }
  } else if (store.activeCondition) {
    store.setCondition(store.activeCondition)
  }
}

function onTreatmentUpdate({ id, ...patch }) {
  store.updateTreatmentItem(id, patch)
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
  const ok = store.deleteTreatmentPlan(planId)
  if (!ok) conflictWarning.value = 'At least one treatment plan is required.'
  onCancelDeletePlan()
}
function onSetInterval() {
  const current = store.appointments?.[1]?.intervalDays || 7
  const next = window.prompt('Set days between appointment groups', String(current))
  if (next === null) return
  store.setIntervalDays(Number(next || 0))
}
function onLinkAppointment(appointmentGroupId) {
  const current = store.appointmentLinks?.[appointmentGroupId] || ''
  const next = window.prompt('Set external link for this appointment group', current)
  if (next === null) return
  store.setAppointmentLink(appointmentGroupId, next.trim())
}

// ── Booking dialog ─────────────────────────────────────────────────────────
const bookingDialog = ref(false)
const bookingApptId = ref(null)
const bookingLoading = ref(false)
const conflictWarning = ref('')
const deletePlanDialog = ref(false)
const deletePlanId = ref(null)
const bookingForm = reactive({ date: '', startTime: '09:00', endTime: '09:30', notes: '' })
const bookingDisabled = computed(() => !bookingForm.date || !bookingForm.startTime || !bookingForm.endTime || bookingLoading.value)

async function onBookAppointment(appointmentId) {
  bookingApptId.value = appointmentId
  if (!bookingForm.date) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    bookingForm.date = `${y}-${m}-${d}`
  }
  bookingForm.notes = ''
  bookingDialog.value = true
  conflictWarning.value = ''
}

function getAppointmentItems(appointmentId) {
  return store.treatmentItems.filter(i => (i.appointmentGroupId || 'appt-1') === appointmentId)
}

function parseDateTime(date, time) {
  if (!date || !time) return null
  const t = time.length === 5 ? `${time}:00` : time
  const dt = new Date(`${date}T${t}`)
  return isNaN(dt) ? null : dt
}

function validateBooking() {
  if (!bookingApptId.value) return 'No appointment selected.'
  if (!getAppointmentItems(bookingApptId.value).length) return 'Add at least one treatment item before booking.'
  if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) return 'Please provide date, start, and end time.'

  const start = parseDateTime(bookingForm.date, bookingForm.startTime)
  const end = parseDateTime(bookingForm.date, bookingForm.endTime)
  if (!start || !end) return 'Invalid date or time format.'
  if (end <= start) return 'End time must be after start time.'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
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
  // Check conflicts first
  const check = await store.checkAppointmentConflict({
    date: bookingForm.date,
    startTime: bookingForm.startTime,
    endTime: bookingForm.endTime,
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

.chart-scroll {
  display: block;
  width: 100%;
  padding: 12px 8px;
  overflow-x: auto;
  min-height: 320px;
}

/* ── Mode pills ─────────────────────────────────────────────────── */
.mode-pills {
  display: flex;
  gap: 4px;
}

.mode-pill {
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.mode-pill:hover {
  border-color: #0061FB;
  color: #0061FB;
}

.mode-pill--active {
  background: #0061FB;
  border-color: #0061FB;
  color: #fff;
  font-weight: 600;
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
