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
        <template v-for="(step, idx) in STEPS" :key="idx">
          <div
            class="cw-step"
            :class="{
              'cw-step--active':    currentStep === idx + 1,
              'cw-step--completed': currentStep > idx + 1,
              'cw-step--future':    currentStep < idx + 1,
            }"
            @click="currentStep = idx + 1"
          >
            <span class="cw-step__icon">
              <v-icon size="16" color="white">mdi-check</v-icon>
            </span>
            <span class="cw-step__label">{{ step }}</span>
          </div>
        </template>
      </div>

      <!-- ── Step guidance hint ───────────────────────────────────────── -->
      <div class="step-hint">
        <v-icon size="15" color="primary" class="flex-shrink-0 mt-px">{{ stepHint.icon }}</v-icon>
        <span class="step-hint__text">{{ stepHint.text }}</span>
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
              :tooth-statuses="toothChartStatuses"
              :treatment-items="toothChartItems"
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
      <div v-if="currentStep === 1" class="notes-layout" :class="{ 'notes-layout--sidebar-open': isNoteSidebarOpen }">
        <div class="notes-layout__main">
          <DiagnosePanel
            :base-items="baseChartItems"
            :notation="store.notation"
            :selected-note-item-id="selectedNoteItemId"
            :images="store.chartImages"
            :history="store.historyEntries"
            :practitioners="store.practitioners"
            @save-success="mainStore?.setSnackbar?.({ title: 'Diagnosis saved.', type: 'success' })"
            @remove="store.removeTreatmentItemById($event)"
            @update="onTreatmentUpdate"
            @select-note-item="onSelectNoteItem"
            @add-image="onAddChartImage"
            @remove-image="store.removeChartImage($event)"
          />
        </div>
        <div v-if="isNoteSidebarOpen" class="notes-side notes-side--panel">
          <ChartClinicalNoteSidebar
            :item="selectedNoteItem"
            type="diagnosis"
            :patient-id="patientId"
            :patient-name="patientName"
            @apply-template="onNoteSidebarTemplate"
            @apply-summary="onNoteSidebarSummary"
            @close="closeNoteSidebar"
          />
        </div>
      </div>

      <!-- Step 2: Full treatment plan panel -->
      <div v-if="currentStep === 2" class="notes-layout" :class="{ 'notes-layout--sidebar-open': isNoteSidebarOpen }">
        <div class="notes-layout__main treatment-plan-wrap">
          <TreatmentPlanPanel
            :items="store.treatmentItems"
            :patient-id="patientId"
            :patient-name="patientName"
            :selected-note-item-id="selectedNoteItemId"
            :total="store.treatmentTotal"
            :planned-count="store.plannedCount"
            :completed-count="store.completedCount"
            :notation="store.notation"
            :appointments="store.appointments"
            :active-appointment-id="store.activeAppointmentId"
            :plans="store.plans"
            :active-plan-id="store.activePlanId"
            :images="store.chartImages"
            :history="store.historyEntries"
            :appointment-links="store.appointmentLinks"
            :practitioners="store.practitioners"
            @remove="store.removeTreatmentItemById($event)"
            @update="onTreatmentUpdate"
            @select-note-item="onSelectNoteItem"
            @select-appointment="store.setActiveAppointment($event)"
            @reorder="onReorder"
            @move-item="onMoveTreatmentItem"
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
        <div v-if="isNoteSidebarOpen" class="notes-side notes-side--panel">
          <ChartClinicalNoteSidebar
            :item="selectedNoteItem"
            type="treatment_plan"
            :patient-id="patientId"
            :patient-name="patientName"
            @apply-template="onNoteSidebarTemplate"
            @apply-summary="onNoteSidebarSummary"
            @close="closeNoteSidebar"
          />
        </div>
      </div>

      <!-- Step 3 & 4: Two-column layout — sections control + live document preview -->
      <div v-if="currentStep === 3" class="tpd-layout">
        <TreatmentPlanEditorPanel
          :patient-id="patientId"
          :patient-name="patientName"
          :active-plan-id="store.activePlanId"
          :active-plan="activePlanObj"
          :sections="planSections"
          :content="activePlanContent"
          :default-content="organisationPlanDefaults"
          @update:sections="Object.assign(planSections, $event)"
          @update-plan-content="store.updateTreatmentPlanContent(store.activePlanId, $event)"
        />
        <div class="tpd-preview-pane">
          <div class="tpd-preview-topbar no-print">
            <span class="tpd-preview-topbar__label">
              <v-icon size="14" class="mr-1">mdi-eye-outline</v-icon>Live Preview
            </span>
            <v-btn color="primary" variant="flat" size="small" rounded="lg" append-icon="mdi-arrow-right" @click="currentStep = 4">
              Proceed to Overview
            </v-btn>
          </div>
          <TreatmentPlanDocument
            :active-plan="activePlanObj"
            :plan-ref="activePlanRef"
            :items="store.treatmentItems"
            :appointments="store.appointments"
            :notation="store.notation"
            :patient-name="patientName"
            :practice-name="practiceName"
            :practitioner-name="activePractitionerName"
            :practitioners="planPractitioners"
            :base-items="baseChartItems"
            :sections="planSections"
            :organisation-email="organisationEmail"
            :content="activePlanContent"
            :default-content="organisationPlanDefaults"
            :diagnosis-chart="diagnosisSnapshotChart"
            :treatment-chart="treatmentSnapshotChart"
            :tooth-statuses="store.toothStatuses"
            :teeth-type="store.teethType"
          />
        </div>
      </div>

      <div v-if="currentStep === 4" class="tpd-layout tpd-layout--overview">
        <TreatmentPlanDocument
          :active-plan="activePlanObj"
          :plan-ref="activePlanRef"
          :items="store.treatmentItems"
          :appointments="store.appointments"
          :notation="store.notation"
          :patient-name="patientName"
          :practice-name="practiceName"
          :practitioner-name="activePractitionerName"
          :practitioners="planPractitioners"
          :base-items="baseChartItems"
          :sections="planSections"
          :organisation-email="organisationEmail"
          :content="activePlanContent"
          :default-content="organisationPlanDefaults"
          :diagnosis-chart="diagnosisSnapshotChart"
          :treatment-chart="treatmentSnapshotChart"
          :tooth-statuses="store.toothStatuses"
          :teeth-type="store.teethType"
          :show-actions="true"
          :whatsapp-enabled="whatsAppAvailable"
          @share-email="onSharePlanByChannel('email')"
          @share-whatsapp="onSharePlanByChannel('whatsapp')"
          @download="onDownloadPlan"
        />
      </div>

    </template>

    <!-- ── Dialogs ─────────────────────────────────────────────────── -->
    <v-dialog v-model="bookingDialog" max-width="560">
      <v-card rounded="xl" class="booking-card">
        <v-card-title class="booking-card__title">Book Appointment in Diary</v-card-title>
        <v-card-text class="booking-card__body">
          <div class="booking-summary">
            <div class="booking-summary__icon">
              <v-icon size="18">mdi-calendar-check-outline</v-icon>
            </div>
            <div>
              <div class="booking-summary__title">{{ bookingSummaryTitle }}</div>
              <div class="booking-summary__sub">{{ bookingSummaryDisplay }}</div>
            </div>
          </div>

          <v-card elevation="0" rounded="lg" class="booking-fields">
            <v-row dense>
              <v-col cols="12">
                <label class="fld-lbl">Practitioner <span class="req-star">*</span></label>
                <v-select
                  v-model="bookingForm.dentistId"
                  :items="store.practitioners"
                  item-title="name"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0 mt-1"
                  bg-color="white"
                  flat
                  hide-details
                  placeholder="Select practitioner"
                />
              </v-col>

              <v-col cols="12">
                <label class="fld-lbl">Date <span class="req-star">*</span></label>
                <v-text-field
                  v-model="bookingForm.date"
                  type="date"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0 mt-1"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">Start Time <span class="req-star">*</span></label>
                <v-text-field
                  v-model="bookingForm.startTime"
                  type="time"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0 mt-1"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">End Time <span class="req-star">*</span></label>
                <v-text-field
                  v-model="bookingForm.endTime"
                  type="time"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0 mt-1"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <label class="fld-lbl">Notes</label>
                <v-textarea
                  v-model="bookingForm.notes"
                  variant="solo"
                  density="compact"
                  rows="3"
                  auto-grow
                  class="input-bordered mb-0 mt-1"
                  bg-color="white"
                  flat
                  hide-details
                  placeholder="Add any notes for this diary booking"
                />
              </v-col>
            </v-row>
          </v-card>

          <div v-if="conflictWarning" class="conflict-warning mt-2">
            <v-icon size="16" color="error" class="mr-1">mdi-alert</v-icon>
            {{ conflictWarning }}
          </div>
        </v-card-text>
        <v-card-actions class="booking-card__actions">
          <v-btn variant="outlined" class="booking-card__btn booking-card__btn--secondary" @click="bookingDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="booking-card__btn" :loading="bookingLoading" :disabled="bookingDisabled" @click="confirmBooking">Book</v-btn>
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
import ChartClinicalNoteSidebar from './ChartClinicalNoteSidebar.vue'
import TreatmentPlanPanel from './TreatmentPlanPanel.vue'
import CodesPanel from './CodesPanel.vue'
import DiagnosePanel from './DiagnosePanel.vue'
import TreatmentPlanDocument from './TreatmentPlanDocument.vue'
import TreatmentPlanEditorPanel from './TreatmentPlanEditorPanel.vue'
import { formatDateDDMMYYYY, formatTime12Hour } from '@/lib/dateFormatter'
import { usePatientChartingStore } from '@/stores/patientCharting'
import { useMainStore } from '@/stores/index'
import { useOrgStore } from '@/stores/organisation'
import { useCrmStore } from '@/stores/crm'
import { CONDITIONS, getToothLabel } from './toothData.js'
import { DEFAULT_PLAN_ID } from '~/shared/defaults/charting/chartingDefaults.js'
import { buildOrganisationTreatmentPlanDefaults, mergeTreatmentPlanContent } from '~/shared/defaults/charting/treatmentPlanContent.js'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
  patientName: { type: String, default: '' },
  patient: { type: Object, default: null },
})

const store = usePatientChartingStore()
const mainStore = useMainStore()
const orgStore = useOrgStore()
const crmStore = useCrmStore()

const STEPS = ['Diagnose', 'Treatment', 'Treatment Plan', 'Overview']
const currentStep = ref(1)

const STEP_HINTS = [
  {
    icon: 'mdi-tooth-outline',
    text: 'Select a condition from the panel on the right, then click a tooth or surface on the chart to record a finding. All findings appear in the Diagnoses list below.',
  },
  {
    icon: 'mdi-medical-bag',
    text: 'Select a treatment code from the panel on the right, then click a tooth to add it to the plan. Assign a practitioner, cost, and notes to each item in the list below.',
  },
  {
    icon: 'mdi-file-edit-outline',
    text: 'Customise the treatment plan document. Click "Generate AI Draft" to auto-fill content from your practice details, then review and edit each section. The live preview updates as you type.',
  },
  {
    icon: 'mdi-send-outline',
    text: 'Review the final document. Share it directly with the patient via email or WhatsApp, or click "Download" to save a printable PDF copy.',
  },
]
const stepHint = computed(() => STEP_HINTS[currentStep.value - 1] || STEP_HINTS[0])
const whatsAppAvailable = ref(false)

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

const planSections = reactive({
  clinicInfo: true,
  dentistInfo: true,
  diagnosis: true,
  treatmentPlan: true,
  paymentPlan: true,
  consentForm: false,
  testimonial: false,
})
const organisationEmail = computed(() =>
  String(
    orgStore?.organisation?.email
      || orgStore?.organisation?.contactEmail
      || orgStore?.organisation?.automationPlaceholders?.email
      || ''
  ).trim()
)
// Base chart items (status=existing) — shown in DiagnosePanel findings
const baseChartItems = computed(() =>
  (store.treatmentPlan || [])
    .filter(i => String(i.status || '') === 'existing')
)

const plannedItems = computed(() =>
  (store.treatmentItems || []).filter(i => String(i.status || '').toLowerCase() !== 'existing')
)
const toothChartItems = computed(() =>
  currentStep.value === 1 ? baseChartItems.value : plannedItems.value
)
const currentStepNoteItems = computed(() => {
  if (currentStep.value === 1) return baseChartItems.value
  if (currentStep.value === 2) return store.treatmentItems || []
  return []
})
const isNoteSidebarOpen = ref(false)
const selectedNoteItemId = ref(null)
const selectedNoteItem = computed(() =>
  currentStepNoteItems.value.find((item) => String(item.id || item._tempId) === String(selectedNoteItemId.value || '')) || null
)
const toothChartStatuses = computed(() => store.toothStatuses)
const planPractitioners = computed(() => {
  const map = new Map()
  ;(store.treatmentItems || []).forEach((item) => {
    const idKey = item.practitionerId ? `id:${item.practitionerId}` : ''
    const nameKey = String(item.practitionerName || item.clinicianName || '').trim().toLowerCase()
    const key = idKey || (nameKey ? `name:${nameKey}` : '')
    if (!key || map.has(key)) return
    map.set(key, {
      id: item.practitionerId || null,
      name: String(item.practitionerName || item.clinicianName || '').trim(),
    })
  })
  return [...map.values()].filter((p) => p.name)
})
const organisationPlanDefaults = computed(() =>
  buildOrganisationTreatmentPlanDefaults(orgStore?.organisation || {}, planPractitioners.value)
)
const activePlanOverrides = computed(() => activePlanObj.value?.content || {})
const activePlanContent = computed(() =>
  mergeTreatmentPlanContent(activePlanOverrides.value, organisationPlanDefaults.value)
)

const patientEmail = computed(() => String(props.patient?.email || '').trim())
const patientPhone = computed(() => String(props.patient?.preferredPhone || props.patient?.mobile || '').trim())

// Conditions list for CodesPanel in diagnosis mode
const diagnosisConditions = computed(() =>
  Object.entries(CONDITIONS).map(([key, meta]) => ({
    key,
    label: meta.label,
    color: meta.color,
    category: meta.category || 'Other',
  }))
)

function buildChartByScope(scope = 'both') {
  const raw = store.chart
  if (scope === 'both') return raw

  const surfaceList = (value) => String(value || '').split('+').map((item) => item.trim()).filter(Boolean)

  const activePlanId = store.activePlanId || DEFAULT_PLAN_ID
  const activePlanKeys = new Set()
  if (scope === 'plan') {
    store.treatmentPlan
      .filter(i => (i.planId || DEFAULT_PLAN_ID) === activePlanId && i.status !== 'existing')
      .forEach((i) => {
        const surfaces = surfaceList(i.surface)
        if (surfaces.length) {
          surfaces.forEach((surface) => activePlanKeys.add(`${i.fdi}:${surface}:${i.condition || ''}`))
          return
        }
        activePlanKeys.add(`${i.fdi}::${i.condition || ''}`)
      })
  }

  const result = {}
  Object.entries(raw).forEach(([fdiStr, tooth]) => {
    const fdi = Number(fdiStr)
    const t = { ...tooth }
    if (scope === 'plan') {
      const keepPlannedToothCondition = !!(t.toothCondition && activePlanKeys.has(`${fdi}::${t.toothCondition || ''}`))
      if (!keepPlannedToothCondition) {
        t.toothCondition = null
        t.toothConditionStatus = null
      }
      // Hide baseline status overlays in treatment scope so only selected plan treatment is shown.
      t.unerupted = false
      t.partiallyErupted = false
      t.retainedRoot = false
      t.missing = keepPlannedToothCondition && (t.toothCondition === 'missing' || t.toothCondition === 'extraction-planned')
      t.implant = keepPlannedToothCondition && t.toothCondition === 'implant'
    } else if (t.toothConditionStatus && t.toothConditionStatus !== 'existing') {
      const keep = activePlanKeys.has(`${fdi}::${t.toothCondition || ''}`)
      if (!keep) { t.toothCondition = null; t.toothConditionStatus = null }
    }
    if (tooth.surfaces) {
      const ns = {}
      Object.entries(tooth.surfaces).forEach(([s, sv]) => {
        if (scope === 'plan') {
          const keep = activePlanKeys.has(`${fdi}:${s}:${sv.condition || ''}`)
          ns[s] = keep ? { ...sv } : { condition: null, status: 'existing' }
        } else if (!sv.status || sv.status === 'existing') ns[s] = { ...sv }
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
}

// Display chart filtered by scope
const displayChart = computed(() => {
  const scope = currentStep.value === 1 ? 'base' : store.chartScope
  return buildChartByScope(scope)
})
const diagnosisSnapshotChart = computed(() => buildChartByScope('base'))
const treatmentSnapshotChart = computed(() => buildChartByScope('plan'))

// Load chart
watch(() => props.patientId, async (id, prevId) => {
  if (!id) return
  if (prevId && prevId !== id) store.reset()
  await store.loadChart(id)
}, { immediate: true })

watch([currentStep, currentStepNoteItems], () => {
  const hasSelected = currentStepNoteItems.value.some(
    (item) => String(item.id || item._tempId) === String(selectedNoteItemId.value || '')
  )
  if (hasSelected) return
  selectedNoteItemId.value = currentStepNoteItems.value[0]?.id || currentStepNoteItems.value[0]?._tempId || null
}, { immediate: true, deep: true })

watch(currentStep, () => {
  isNoteSidebarOpen.value = false
})

// ── Event handlers ───────────────────────────────────────────────────────────
function onSurfaceClick({ fdi, surface, surfaces = [], combine = false, remove = false }) {
  if (!remove && currentStep.value === 1 && !store.activeCondition) {
    mainStore?.setSnackbar?.({ title: 'Select a condition from the panel first.', type: 'warning' })
    return
  }
  if (!remove && currentStep.value === 2 && !store.activeCodeId && !store.activeCondition) {
    mainStore?.setSnackbar?.({ title: 'Select a treatment code from the panel first.', type: 'warning' })
    return
  }
  store.applyCondition(fdi, surface, { surfaces, combine, remove })
}

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

function onSelectNoteItem(item) {
  selectedNoteItemId.value = item?.id || item?._tempId || null
  isNoteSidebarOpen.value = !!selectedNoteItemId.value
}

function onTreatmentUpdate({ id, ...patch }) { store.updateTreatmentItem(id, patch) }
function onNoteSidebarTemplate({ id, ...patch }) { store.updateTreatmentItem(id, patch) }
function onNoteSidebarSummary({ id, warnings = [], ...patch }) {
  store.updateTreatmentItem(id, patch)
  if (warnings.length) {
    mainStore?.setSnackbar?.({
      title: warnings[0],
      type: 'warning',
    })
  }
}

function closeNoteSidebar() {
  isNoteSidebarOpen.value = false
}

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
function onMoveTreatmentItem(payload) { store.moveTreatmentItem(payload) }
function onUpdateAppointment({ id, patch }) { store.updateAppointment(id, patch) }

function onDeletePlan(planId) { deletePlanId.value = planId; deletePlanDialog.value = true }
function onCancelDeletePlan() { deletePlanDialog.value = false; deletePlanId.value = null }
function onConfirmDeletePlan() {
  const id = deletePlanId.value
  if (!id) return onCancelDeletePlan()
  store.deleteTreatmentPlan(id)
  onCancelDeletePlan()
}

function formatShareTooth(item) {
  const base = getToothLabel(item.fdi, store.notation)
  const surfaces = String(item.surface || '').split('+').filter(Boolean)
  return surfaces.length ? `${base}-${surfaces.map((surface) => surface.charAt(0).toUpperCase()).join('/')}` : base
}

const shareModel = computed(() => {
  const sections = []
  const content = activePlanContent.value

  if (planSections.clinicInfo) {
    const clinicText = content.practice.about || practiceName.value || 'Practice details will be shared by the clinic.'
    sections.push({
      title: content.practice.title || 'About the clinic',
      text: clinicText,
      html: `<p>${clinicText}</p>`,
    })
  }

  if (planSections.dentistInfo && content.dentists.length) {
    const dentistText = content.dentists.map((dentist) => `${dentist.name}${dentist.role ? ` (${dentist.role})` : ''}${dentist.bio ? `: ${dentist.bio}` : ''}`).join('\n')
    sections.push({
      title: 'About the Dentist',
      text: dentistText,
      html: content.dentists.map((dentist) => `<p><strong>${dentist.name}</strong>${dentist.role ? ` (${dentist.role})` : ''}${dentist.bio ? ` — ${dentist.bio}` : ''}</p>`).join(''),
    })
  }

  if (planSections.diagnosis && baseChartItems.value.length) {
    const rows = baseChartItems.value.map((item) => ({
      tooth: formatShareTooth(item),
      condition: item.conditionLabel || item.condition || '—',
      surface: String(item.surface || '').split('+').filter(Boolean).join(' / ') || 'Full tooth',
    }))
    sections.push({
      title: 'Diagnoses',
      text: rows.map((row) => `- ${row.tooth}: ${row.condition} (${row.surface})`).join('\n'),
      html: `<ul>${rows.map((row) => `<li><strong>${row.tooth}</strong> ${row.condition} (${row.surface})</li>`).join('')}</ul>`,
    })
  }

  if (planSections.treatmentPlan) {
    const rows = plannedItems.value.map((item) => ({
      tooth: formatShareTooth(item),
      name: item.treatmentName || item.conditionLabel || item.condition || '—',
      duration: item.duration ? `${item.duration} min` : '—',
      fee: Number(item.cost || 0).toFixed(2),
    }))
    sections.push({
      title: 'Treatment Plan',
      text: rows.length
        ? rows.map((row) => `- ${row.tooth}: ${row.name} | ${row.duration} | £${row.fee}`).join('\n')
        : 'No treatment items added yet.',
      html: rows.length
        ? `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th align="left">Tooth</th><th align="left">Treatment</th><th align="left">Duration</th><th align="right">Fee (£)</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.tooth}</td><td>${row.name}</td><td>${row.duration}</td><td align="right">${row.fee}</td></tr>`).join('')}</tbody></table>`
        : '<p>No treatment items added yet.</p>',
    })
  }

  if (planSections.paymentPlan) {
    const paymentText = content.paymentPlan?.intro || 'Payment arrangement details will be confirmed at reception.'
    sections.push({
      title: 'Payment Plan',
      text: paymentText,
      html: `<p>${paymentText}</p>`,
    })
  }

  if (planSections.consentForm) {
    const consentText = content.consentForm?.intro || 'Please review the consent points on the shared treatment plan.'
    sections.push({
      title: 'Consent Form',
      text: consentText,
      html: `<p>${consentText}</p>`,
    })
  }

  if (planSections.testimonial && content.testimonials.length) {
    sections.push({
      title: 'Testimonials',
      text: content.testimonials.map((item) => `- ${item}`).join('\n'),
      html: `<ul>${content.testimonials.map((item) => `<li>${item}</li>`).join('')}</ul>`,
    })
  }

  const total = plannedItems.value.reduce((sum, item) => sum + Number(item.cost || 0), 0).toFixed(2)
  const introName = props.patientName || 'Patient'

  return {
    subject: `Treatment Plan - ${introName}`,
    html: [
      `<p>Hi ${introName},</p>`,
      '<p>Please find your treatment plan summary below.</p>',
      ...sections.map((section) => `<h3>${section.title}</h3>${section.html}`),
      `<p><strong>Total estimated fee:</strong> £${total}</p>`,
    ].join(''),
    text: [
      `Treatment Plan - ${introName}`,
      '',
      ...sections.flatMap((section) => [section.title, section.text, '']),
      `Total estimated fee: £${total}`,
    ].join('\n'),
  }
})

async function loadWhatsAppAvailability() {
  try {
    const [whapiRes, waConfigRes] = await Promise.allSettled([
      crmStore.getWhapiStatus(),
      crmStore.getWhatsAppConfig(),
    ])
    const whapiConnected = whapiRes.status === 'fulfilled' && (
      !!whapiRes.value?.data?.connected
      || !!whapiRes.value?.data?.phoneNumber
      || !!whapiRes.value?.data?.displayName
    )
    const metaConnected = waConfigRes.status === 'fulfilled' && (
      !!waConfigRes.value?.data?.phoneNumberId
      || !!waConfigRes.value?.data?.accessToken
      || !!waConfigRes.value?.data?.provider
    )
    whatsAppAvailable.value = !!(whapiConnected || metaConnected)
  } catch {
    whatsAppAvailable.value = false
  }
}

async function onSharePlanByChannel(channel = 'email') {
  if (channel === 'email' && !patientEmail.value) {
    mainStore?.setSnackbar?.({ title: 'No patient email found.', type: 'warning' })
    return
  }
  if (channel === 'whatsapp' && !patientPhone.value) {
    mainStore?.setSnackbar?.({ title: 'No patient phone number found.', type: 'warning' })
    return
  }
  if (channel === 'whatsapp' && !whatsAppAvailable.value) {
    mainStore?.setSnackbar?.({ title: 'WhatsApp is not connected for this organisation.', type: 'warning' })
    return
  }

  const recipient = {
    id: props.patient?.id || null,
    name: props.patientName || 'Patient',
    email: patientEmail.value,
    telephone: patientPhone.value,
  }
  const payload = shareModel.value

  try {
    if (channel === 'email') {
      const res = await crmStore.sendLeadMail({
        recipients: [recipient],
        subject: payload.subject,
        html: payload.html,
        key: 'manual_treatmentPlan',
      })
      if (res?.code !== 0) throw new Error(res?.message || res?.error || 'Unable to send email')
      mainStore?.setSnackbar?.({ title: `Treatment plan emailed to ${patientEmail.value}`, type: 'success' })
      return
    }

    const res = await crmStore.sendLeadWhatsApp({
      recipients: [recipient],
      message: payload.text,
    })
    if (res?.code !== 0) throw new Error(res?.message || res?.error || 'Unable to send WhatsApp message')
    mainStore?.setSnackbar?.({ title: `Treatment plan sent to ${patientPhone.value}`, type: 'success' })
  } catch (error) {
    mainStore?.setSnackbar?.({ title: error?.message || `Unable to share by ${channel}.`, type: 'error' })
  }
}

function onDownloadPlan() {
  currentStep.value = 4
  nextTick(() => {
    const docEl = document.querySelector('.tpd-doc')
    if (!docEl) { window.print(); return }
    const origin = window.location.origin
    const rawHtml = docEl.outerHTML
    const html = rawHtml.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, src, post) => {
      if (src.startsWith('data:') || /^https?:\/\//i.test(src)) return match
      return `${pre}${origin}${src.startsWith('/') ? '' : '/'}${src}${post}`
    })
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
const bookingAppointment = computed(() => store.appointments.find((appt) => appt.id === bookingApptId.value) || null)
const bookingSummaryDate = computed(() => formatDateDDMMYYYY(bookingForm.date))
const bookingSummaryRange = computed(() => {
  if (!bookingForm.startTime || !bookingForm.endTime) return ''
  return `${formatTime12Hour(bookingForm.startTime)} - ${formatTime12Hour(bookingForm.endTime)}`
})
const bookingSummaryTitle = computed(() => bookingAppointment.value?.name || 'Appointment')
const bookingSummarySubtitle = computed(() => {
  const practitioner = store.practitioners.find((item) => Number(item.id) === Number(bookingForm.dentistId))
  const parts = []
  if (practitioner?.name) parts.push(practitioner.name)
  if (bookingSummaryDate.value) parts.push(bookingSummaryDate.value)
  if (bookingSummaryRange.value) parts.push(bookingSummaryRange.value)
  return parts.join(' • ') || 'Choose practitioner, date, and time'
})

const bookingSummaryDisplay = computed(() => {
  const practitioner = store.practitioners.find((item) => Number(item.id) === Number(bookingForm.dentistId))
  const parts = []
  if (practitioner?.name) parts.push(practitioner.name)
  if (bookingSummaryDate.value) parts.push(bookingSummaryDate.value)
  if (bookingSummaryRange.value) parts.push(bookingSummaryRange.value)
  return parts.join(' | ') || 'Choose practitioner, date, and time'
})

function addMinutesToTime(time, minutesToAdd) {
  const [hours, minutes] = String(time || '09:00').split(':').map(Number)
  const totalMinutes = (hours * 60) + (minutes || 0) + minutesToAdd
  const normalized = Math.max(0, totalMinutes)
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

function getAppointmentBookingDefaults(appointmentId) {
  const activeAppointment = store.appointments.find((item) => item.id === appointmentId)
  const items = store.treatmentItems.filter(i => (i.appointmentGroupId || 'appt-1') === appointmentId)
  const totalDuration = Math.max(
    15,
    Number(activeAppointment?.durationMinutes) ||
      items.reduce((sum, item) => sum + (Number(item?.duration) || 0), 0) ||
      30,
  )
  const startTime = activeAppointment?.startTime || '09:00'
  return {
    activeAppointment,
    items,
    totalDuration,
    startTime,
    endTime: activeAppointment?.endTime || addMinutesToTime(startTime, totalDuration),
    date: activeAppointment?.date || bookingForm.date || new Date().toISOString().slice(0, 10),
  }
}

function resolveBookingPractitioner(items = []) {
  const byId = items.find((item) => item?.practitionerId)
  if (byId?.practitionerId) return Number(byId.practitionerId)

  const byName = items.find((item) => item?.practitionerName || item?.clinicianName)
  const rawName = String(byName?.practitionerName || byName?.clinicianName || '').trim().toLowerCase()
  if (!rawName) return null

  const matched = (store.practitioners || []).find((practitioner) => String(practitioner.name || '').trim().toLowerCase() === rawName)
  return matched?.id ? Number(matched.id) : null
}

async function onBookAppointment(appointmentId) {
  bookingApptId.value = appointmentId
  const { items, startTime, endTime, date } = getAppointmentBookingDefaults(appointmentId)
  const first = items[0]
  bookingForm.dentistId = resolveBookingPractitioner(items)
  bookingForm.notes = first?.notes || ''
  bookingForm.startTime = startTime
  bookingForm.endTime = endTime
  bookingForm.date = date
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
  const activeAppointment = store.appointments.find((item) => item.id === bookingApptId.value)
  const excludeAppointmentId = activeAppointment?.diaryAppointmentId || null
  const res = await store.bookInDiary({ appointmentId: bookingApptId.value, excludeAppointmentId, ...bookingForm })
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

onMounted(() => {
  loadWhatsAppAvailability()
})
</script>

<style scoped>
.charting-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

/* ── Step hint ───────────────────────────────────────────────────── */
.step-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  color: #1e3a5f;
  line-height: 1.5;
}

.step-hint__text {
  flex: 1;
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
  gap: 12px;
  height: 42px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.18s;
}

.cw-step--active,
.cw-step--completed,
.cw-step--future {
  background: transparent;
}

.cw-step__icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #0061FB;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(0, 97, 251, 0.12);
}

.cw-step--future .cw-step__icon {
  background: #d5d9e1;
  box-shadow: none;
}

.cw-step__label {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.cw-step--active    .cw-step__label { color: #2f2f35; font-weight: 600; }
.cw-step--completed .cw-step__label { color: #555; }
.cw-step--future    .cw-step__label { color: #999; }

.cw-chevron {
  color: #ccc;
  flex-shrink: 0;
}

.cw-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
}

.cw-done-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0061FB;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Body row ────────────────────────────────────────────────────── */
.charting-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
  --charting-panel-height: clamp(420px, 60vh, 520px);
}

/* ── Chart card ──────────────────────────────────────────────────── */
.chart-card {
  flex: 1;
  min-width: 0;
  height: var(--charting-panel-height);
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  width: 100%;
  padding: 12px 8px;
  overflow: auto;
  min-height: 0;
}

/* ── Codes side ──────────────────────────────────────────────────── */
.codes-side {
  width: 260px;
  height: var(--charting-panel-height);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow: hidden;
  min-height: 0;
}

.notes-layout {
  display: block;
}

.notes-layout--sidebar-open {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.notes-layout__main {
  flex: 1;
  min-width: 0;
}

.notes-side {
  width: 360px;
  flex-shrink: 0;
  min-height: 0;
}

.notes-side--panel {
  align-self: flex-start;
  position: sticky;
  top: 12px;
}

/* ── Treatment plan ──────────────────────────────────────────────── */
.treatment-plan-wrap { width: 100%; }

/* ── Treatment plan 2-column layout ───────────────── */
.tpd-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.tpd-layout--overview {
  display: block;
}

.tpd-preview-pane {
  flex: 1;
  min-width: 0;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tpd-preview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
}

.tpd-preview-topbar__label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

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

.booking-card {
  overflow: hidden;
}

.booking-card__title {
  padding: 18px 20px 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.booking-card__body {
  background: #f5f5f5;
  padding: 0 20px 12px;
}

.booking-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  margin-bottom: 16px;
}

.booking-summary__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: #eff6ff;
  flex-shrink: 0;
}

.booking-summary__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.booking-summary__sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.booking-fields {
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.booking-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 20px 20px;
  background: #ffffff;
}

.booking-card__btn {
  min-width: 124px;
  min-height: 40px;
  border-radius: 10px;
}

.booking-card__btn--secondary {
  border-color: #dfdfdf !important;
  color: #374151 !important;
}

.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.req-star {
  color: #ef4444;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  box-shadow: none !important;
}

.input-bordered :deep(.v-field__input) {
  color: #334155;
}

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

@media (max-width: 1280px) {
  .notes-layout {
    flex-direction: column;
  }

  .notes-side,
  .notes-side--panel {
    width: 100%;
    position: static;
  }
}
</style>
