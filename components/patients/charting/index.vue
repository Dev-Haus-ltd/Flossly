<template>
  <div class="charting-root">

    <!-- ── Loading ────────────────────────────────────────────────── -->
    <div v-if="store.isLoading" class="charting-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-3 text-body-2 text-medium-emphasis">Loading chart...</p>
    </div>

    <template v-else>

      <!-- ── Stepper ───────────────────────────────────────────────── -->
      <div class="cw-stepper">
        <div
          v-for="(step, idx) in STEPS"
          :key="idx"
          class="cw-step"
          :class="{
            'cw-step--active':    currentStep === idx + 1,
            'cw-step--completed': currentStep > idx + 1,
            'cw-step--future':    currentStep < idx + 1,
          }"
          @click="currentStep = idx + 1"
        >
          <span class="cw-step__label">{{ step }}</span>
        </div>
      </div>

      <!-- ── Chart + side panel (steps 1 & 2 only) ──────────────────── -->
      <div v-if="currentStep <= 2" class="charting-body">

        <!-- Tooth chart card -->
        <div class="chart-card">
          <div class="chart-card__toolbar">
            <div class="teeth-type-control">
              <span class="teeth-type-label">Teeth Type</span>
              <transition name="fade-save">
                <span v-if="showSaved" class="save-indicator">
                  <v-icon size="13" color="success">mdi-check-circle</v-icon> Saved
                </span>
              </transition>
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
            <v-btn
              :variant="view3d ? 'flat' : 'outlined'"
              :color="view3d ? 'primary' : undefined"
              size="small"
              rounded="lg"
              prepend-icon="mdi-rotate-3d"
              @click="view3d = !view3d"
            >{{ view3d ? '3D' : '2D' }}</v-btn>
          </div>

          <div class="chart-scroll">
            <ToothChart3D
              v-if="view3d"
              :chart="store.chart"
              :notation="store.notation"
              :active-condition="store.activeCondition"
              :selected-tooth-fdi="store.selectedToothFdi"
              style="width:100%;height:420px"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
            <ToothChart
              v-else
              :chart="displayChart"
              :notation="store.notation"
              :active-condition="store.activeCondition"
              :selected-tooth-fdi="store.selectedToothFdi"
              :chart-scope="currentStep === 1 ? 'base' : store.chartScope"
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
          </div>
        </div>

        <!-- Right panel: conditions (step 1) or treatment codes (step 2) -->
        <div class="codes-side">
          <CodesPanel
            v-if="currentStep === 1"
            mode="diagnosis"
            :conditions="diagnosisConditions"
            :active-condition="store.activeCondition"
            @condition-select="onConditionSelect"
          />
          <CodesPanel
            v-else
            mode="treatment"
            :active-code-id="store.activeCodeId"
            :favorite-code-ids="store.favoriteCodeIds"
            :codes="store.treatmentCatalog"
            @code-select="onCodeSelect"
            @toggle-favorite="store.toggleFavoriteCode($event)"
          />
        </div>
      </div>

      <!-- ── Bottom panel: switches per step ────────────────────────── -->

      <!-- Step 1: Diagnosis notes + findings list -->
      <DiagnosePanel
        v-if="currentStep === 1"
        :base-items="baseChartItems"
        :notation="store.notation"
        :images="store.chartImages"
        :history="store.historyEntries"
        :practitioners="store.practitioners"
        @remove="store.removeTreatmentItemById($event)"
        @update="onTreatmentUpdate"
        @add-image="onAddChartImage"
        @remove-image="store.removeChartImage($event)"
      />

      <!-- Step 2: Full treatment plan panel -->
      <div v-if="currentStep === 2" class="treatment-plan-wrap">
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
          @add-image="onAddChartImage"
          @remove-image="store.removeChartImage($event)"
          @delete-appointment="store.deleteAppointment($event)"
          @update-appointment="onUpdateAppointment"
          @book-appointment="onBookAppointment"
          @chart-scope-change="onChartScopeChange"
          @mark-complete="onMarkComplete"
          @print-plan="currentStep = 3"
        />
      </div>

      <!-- Step 3: Treatment plan document (review) -->
      <TreatmentPlanDocument
        v-if="currentStep === 3"
        :active-plan="activePlanObj"
        :plan-ref="activePlanRef"
        :items="store.treatmentItems"
        :appointments="store.appointments"
        :notation="store.notation"
        :patient-name="patientName"
        :practice-name="practiceName"
        :practitioner-name="activePractitionerName"
        :show-actions="false"
      />

      <!-- Step 4: Overview with share/print/download -->
      <TreatmentPlanDocument
        v-if="currentStep === 4"
        :active-plan="activePlanObj"
        :plan-ref="activePlanRef"
        :items="store.treatmentItems"
        :appointments="store.appointments"
        :notation="store.notation"
        :patient-name="patientName"
        :practice-name="practiceName"
        :practitioner-name="activePractitionerName"
        :show-actions="true"
        @share="onSharePlan"
        @download="onDownloadPlan"
      />

    </template>

    <!-- ── Dialogs ─────────────────────────────────────────────────── -->
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

    <v-dialog v-model="intervalDialog" max-width="360">
      <v-card rounded="lg">
        <v-card-title class="pt-4 px-5">Set Appointment Interval</v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-text-field v-model.number="intervalDraft" label="Days between appointments" type="number" min="0" variant="outlined" density="compact" hide-details />
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
          <v-text-field v-model="linkDraft" label="External link URL" variant="outlined" density="compact" hide-details />
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
import DiagnosePanel from './DiagnosePanel.vue'
import TreatmentPlanDocument from './TreatmentPlanDocument.vue'
import { usePatientChartingStore } from '@/stores/patientCharting'
import { useMainStore } from '@/stores/index'
import { useOrgStore } from '@/stores/organisation'
import { CONDITIONS } from './toothData.js'
import { DEFAULT_PLAN_ID } from '~/shared/defaults/charting/chartingDefaults.js'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
  patientName: { type: String, default: '' },
})

const store = usePatientChartingStore()
const mainStore = useMainStore()
const orgStore = useOrgStore()

const STEPS = ['Diagnose', 'Treatment', 'Treatment Plan', 'Overview']
const currentStep = ref(1)

// Sync store mode with wizard step
watch(currentStep, (step) => {
  if (step === 1) store.setMode('examination')
  else if (step === 2) store.setMode('treatment')
})

const teethTypeOptions = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Deciduous', value: 'deciduous' },
  { label: 'Mixed', value: 'mixed' },
]

const view3d = ref(false)
const practiceName = computed(() => orgStore?.organisation?.name || '')
const activePlanObj = computed(() => store.plans?.find(p => p.id === store.activePlanId) || store.plans?.[0] || null)
const activePlanRef = computed(() => activePlanObj.value?.name || 'TP-01')
const activePractitionerName = computed(() => {
  const first = (store.treatmentItems || []).find(i => i.practitionerName)
  return first?.practitionerName || ''
})

// Base chart items (status=existing) — shown in DiagnosePanel findings
const baseChartItems = computed(() =>
  (store.treatmentPlan || []).filter(i => String(i.status || '') === 'existing')
)

// Conditions list for CodesPanel in diagnosis mode
const diagnosisConditions = computed(() =>
  Object.entries(CONDITIONS).map(([key, meta]) => ({
    key,
    label: meta.label,
    color: meta.color,
    category: meta.category || 'Other',
  }))
)

// Display chart filtered by scope
const displayChart = computed(() => {
  const raw = store.chart
  const scope = currentStep.value === 1 ? 'base' : store.chartScope
  if (scope === 'both') return raw

  const activePlanId = store.activePlanId || DEFAULT_PLAN_ID
  const activePlanKeys = new Set()
  if (scope === 'plan') {
    store.treatmentPlan
      .filter(i => (i.planId || DEFAULT_PLAN_ID) === activePlanId && i.status !== 'existing')
      .forEach(i => activePlanKeys.add(`${i.fdi}:${i.surface || ''}:${i.condition || ''}`))
  }

  const result = {}
  Object.entries(raw).forEach(([fdiStr, tooth]) => {
    const fdi = Number(fdiStr)
    const t = { ...tooth }
    if (t.toothConditionStatus && t.toothConditionStatus !== 'existing') {
      const keep = scope === 'plan' && activePlanKeys.has(`${fdi}::${t.toothCondition || ''}`)
      if (!keep) { t.toothCondition = null; t.toothConditionStatus = null }
    }
    if (tooth.surfaces) {
      const ns = {}
      Object.entries(tooth.surfaces).forEach(([s, sv]) => {
        if (!sv.status || sv.status === 'existing') ns[s] = { ...sv }
        else {
          const keep = scope === 'plan' && activePlanKeys.has(`${fdi}:${s}:${sv.condition || ''}`)
          ns[s] = keep ? { ...sv } : { condition: null, status: 'existing' }
        }
      })
      t.surfaces = ns
    }
    result[fdi] = t
  })
  return result
})

// Load chart
watch(() => props.patientId, async (id, prevId) => {
  if (!id) return
  if (prevId && prevId !== id) store.reset()
  await store.loadChart(id)
}, { immediate: true })

// ── Event handlers ───────────────────────────────────────────────────────────
function onSurfaceClick({ fdi, surface }) { store.applyCondition(fdi, surface) }

function onToothClick(fdi) {
  if (store.activeCondition && CONDITIONS[store.activeCondition]?.fullTooth) {
    store.applyCondition(fdi, null)
  } else {
    store.selectTooth(fdi)
  }
}

function onToothStatusChange({ fdi, status, rowId }) { store.setToothStatus(fdi, status, rowId) }
function onToothDiagnosisChange({ fdi, diagnosis, rowId }) { store.setToothDiagnosis(fdi, diagnosis, rowId) }

function onChartScopeChange(scope) {
  store.setChartScope(scope)
  if (scope === 'base') store.setMode('examination')
  if (scope === 'plan') store.setMode('treatment')
}

function onConditionSelect(key) { store.setCondition(key) }

function onCodeSelect(codeId, conditionKey) {
  store.setActiveCode(codeId)
  if (conditionKey && store.activeCondition !== conditionKey) store.setCondition(conditionKey)
}

function onTreatmentUpdate({ id, ...patch }) { store.updateTreatmentItem(id, patch) }

async function onAddChartImage(payload) {
  const res = await store.addChartImage(payload?.file, payload?.meta)
  if (res?.code === 0) {
    mainStore?.setSnackbar?.({ title: 'Image uploaded.', type: 'success' })
    return
  }
  mainStore?.setSnackbar?.({ title: res?.message || 'Unable to upload image.', type: 'error' })
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

function onReorder(payload) { store.reorderTreatmentPlan(payload) }
function onUpdateAppointment({ id, patch }) { store.updateAppointment(id, patch) }

function onDeletePlan(planId) { deletePlanId.value = planId; deletePlanDialog.value = true }
function onCancelDeletePlan() { deletePlanDialog.value = false; deletePlanId.value = null }
function onConfirmDeletePlan() {
  const id = deletePlanId.value
  if (!id) return onCancelDeletePlan()
  store.deleteTreatmentPlan(id)
  onCancelDeletePlan()
}

async function onSharePlan() {
  const items = (store.treatmentItems || []).filter(i => i.status !== 'existing')
  const lines = items.map(i => `• ${i.treatmentName || i.conditionLabel || i.condition || '—'} - £${Number(i.cost || 0).toFixed(2)}`).join('\n')
  const total = items.reduce((s, i) => s + Number(i.cost || 0), 0).toFixed(2)
  const text = `Treatment Plan — ${props.patientName || 'Patient'}\n\n${lines || 'No items'}\n\nTotal: £${total}`
  if (navigator.share) {
    try { await navigator.share({ title: 'Treatment Plan', text }); return } catch {}
  }
  try {
    await navigator.clipboard.writeText(text)
    mainStore?.setSnackbar?.({ title: 'Plan summary copied to clipboard.', type: 'success' })
  } catch {
    mainStore?.setSnackbar?.({ title: 'Unable to share. Please print the plan.', type: 'info' })
  }
}

function onDownloadPlan() {
  currentStep.value = 4
  nextTick(() => {
    const docEl = document.querySelector('.tpd-doc')
    if (!docEl) { window.print(); return }
    const html = docEl.outerHTML
    const styles = Array.from(document.styleSheets).reduce((acc, ss) => {
      try { return acc + Array.from(ss.cssRules).map(r => r.cssText).join('\n') } catch { return acc }
    }, '')
    const win = window.open('', '_blank', 'width=820,height=700')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Treatment Plan</title><style>${styles}\n body{margin:0;padding:24px;font-family:sans-serif;background:#fff}</style></head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  })
}

// Interval dialog
const intervalDialog = ref(false)
const intervalDraft = ref(7)
function onSetInterval() { intervalDraft.value = store.appointments?.[1]?.intervalDays ?? 7; intervalDialog.value = true }
function confirmInterval() { store.setIntervalDays(Number(intervalDraft.value || 0)); intervalDialog.value = false }

// Link dialog
const linkDialog = ref(false)
const linkGroupId = ref(null)
const linkDraft = ref('')
function onLinkAppointment(gid) { linkGroupId.value = gid; linkDraft.value = store.appointmentLinks?.[gid] || ''; linkDialog.value = true }
function confirmLink() { if (linkGroupId.value) store.setAppointmentLink(linkGroupId.value, linkDraft.value.trim()); linkDialog.value = false; linkGroupId.value = null }

// Booking dialog
const bookingDialog = ref(false)
const bookingApptId = ref(null)
const bookingLoading = ref(false)
const conflictWarning = ref('')
const deletePlanDialog = ref(false)
const deletePlanId = ref(null)
const bookingForm = reactive({ date: '', startTime: '09:00', endTime: '09:30', notes: '', dentistId: null })
const bookingDisabled = computed(() => !bookingForm.date || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.dentistId || bookingLoading.value)

async function onBookAppointment(appointmentId) {
  bookingApptId.value = appointmentId
  const first = store.treatmentItems.filter(i => (i.appointmentGroupId || 'appt-1') === appointmentId)[0]
  bookingForm.dentistId = first?.practitionerId ? Number(first.practitionerId) : null
  bookingForm.notes = first?.notes || ''
  if (!bookingForm.date) {
    const now = new Date()
    bookingForm.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  bookingDialog.value = true
  conflictWarning.value = ''
}

function validateBooking() {
  if (!bookingApptId.value) return 'No appointment selected.'
  if (!bookingForm.dentistId) return 'Please select a practitioner.'
  if (!store.treatmentItems.filter(i => (i.appointmentGroupId || 'appt-1') === bookingApptId.value).length) return 'Add at least one treatment item before booking.'
  if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) return 'Please provide date, start, and end time.'
  const toDate = (d, t) => { const dt = new Date(`${d}T${t.length === 5 ? t + ':00' : t}`); return isNaN(dt) ? null : dt }
  const start = toDate(bookingForm.date, bookingForm.startTime)
  const end = toDate(bookingForm.date, bookingForm.endTime)
  if (!start || !end) return 'Invalid date or time.'
  if (end <= start) return 'End time must be after start time.'
  const today = new Date(); today.setHours(0,0,0,0)
  if (start < today) return 'Appointment date cannot be in the past.'
  return ''
}

async function confirmBooking() {
  bookingLoading.value = true
  conflictWarning.value = ''
  const err = validateBooking()
  if (err) { conflictWarning.value = err; bookingLoading.value = false; return }
  const check = await store.checkAppointmentConflict({ date: bookingForm.date, startTime: bookingForm.startTime, endTime: bookingForm.endTime, dentistId: bookingForm.dentistId })
  if (check?.hasConflict) {
    conflictWarning.value = `Conflict: overlaps with ${check.conflicts?.[0]?.patientName || 'another appointment'} at ${check.conflicts?.[0]?.startTime || bookingForm.startTime}`
    bookingLoading.value = false
    return
  }
  const res = await store.bookInDiary({ appointmentId: bookingApptId.value, ...bookingForm })
  bookingLoading.value = false
  if (res?.code === 0) { bookingDialog.value = false; mainStore?.setSnackbar?.({ title: 'Appointment booked.', type: 'success' }) }
  else conflictWarning.value = res?.message || 'Unable to book appointment.'
}

function advanceStep() { currentStep.value = Math.min(currentStep.value + 1, STEPS.length) }

// Save indicator
const showSaved = ref(false)
let _savedTimer = null
watch(() => store.lastSavedAt, (v) => {
  if (!v) return
  showSaved.value = true
  clearTimeout(_savedTimer)
  _savedTimer = setTimeout(() => { showSaved.value = false }, 2200)
})
</script>

<style scoped>
.charting-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

/* ── Loading ─────────────────────────────────────────────────────── */
.charting-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* ── Stepper ─────────────────────────────────────────────────────── */
.cw-stepper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 5px 8px;
  height: 52px;
  gap: 0;
}

.cw-step {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.18s;
}

.cw-step--active {
  background: #BD6ED7;
}

.cw-step--completed {
  background: transparent;
}

.cw-step--future {
  background: transparent;
}

.cw-step__label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.cw-step--active    .cw-step__label { color: #fff; font-weight: 600; }
.cw-step--completed .cw-step__label { color: #555; }
.cw-step--future    .cw-step__label { color: #999; }

.cw-chevron {
  color: #ccc;
  flex-shrink: 0;
}

/* ── Body row ────────────────────────────────────────────────────── */
.charting-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

/* ── Chart card ──────────────────────────────────────────────────── */
.chart-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
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

/* ── Codes side ──────────────────────────────────────────────────── */
.codes-side {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* ── Treatment plan ──────────────────────────────────────────────── */
.treatment-plan-wrap { width: 100%; }

/* ── Save indicator ──────────────────────────────────────────────── */
.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #43a047;
  font-weight: 500;
  margin-left: 8px;
}

.fade-save-enter-active,
.fade-save-leave-active { transition: opacity 0.4s; }
.fade-save-enter-from,
.fade-save-leave-to   { opacity: 0; }

/* ── Conflict warning ────────────────────────────────────────────── */
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
</style>
