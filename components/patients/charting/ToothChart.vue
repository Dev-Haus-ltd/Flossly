<template>
  <div class="tooth-chart" @click.self="closePopup">
    <Teleport to="body">
      <!-- Treatment hover tooltip -->
      <div
        v-if="hoverTooltip.visible && hoverTooltip.lines.length"
        class="tooth-hover-tip"
        :style="{ top: hoverTooltip.y + 'px', left: hoverTooltip.x + 'px' }"
      >
        <div class="tooth-hover-tip__title">{{ hoverTooltip.label }}</div>
        <div v-for="(line, i) in hoverTooltip.lines" :key="i" class="tooth-hover-tip__line">
          <span class="tooth-hover-tip__dot" :style="{ background: line.color }" />
          <div>
            <div>{{ line.text }}</div>
            <div v-if="line.sub" class="tooth-hover-tip__sub">{{ line.sub }}</div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="statusPopup.visible"
        ref="statusPopupEl"
        class="status-popup"
        :style="{ top: statusPopup.y + 'px', left: statusPopup.x + 'px' }"
      >
        <div class="status-popup__title">{{ statusPopup.label }}</div>
        <div class="status-popup__menu-col">
          <button
            class="status-popup__menu-btn"
            :class="{ 'status-popup__menu-btn--active': statusPopup.section === 'status' }"
            @click="statusPopup.section = 'status'"
          >
            <span>Status</span>
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
          <button
            class="status-popup__menu-btn"
            :class="{ 'status-popup__menu-btn--active': statusPopup.section === 'diagnosis' }"
            @click="statusPopup.section = 'diagnosis'"
          >
            <span>Diagnosis</span>
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
        <div class="status-popup__submenu">
          <template v-if="statusPopup.section === 'status'">
            <button
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              class="status-popup__sub-btn"
              @click="onSelectStatus(opt.value)"
            >
              <span>{{ opt.label }}</span>
              <v-icon v-if="currentStatus === opt.value" size="16" color="primary">mdi-check</v-icon>
            </button>
          </template>
          <template v-else>
            <button
              v-for="opt in DIAGNOSIS_OPTIONS"
              :key="opt.value"
              class="status-popup__sub-btn"
              @click="onSelectDiagnosis(opt.value)"
            >
              <span>{{ opt.label }}</span>
              <v-icon v-if="currentDiagnosis === opt.value" size="16" color="primary">mdi-check</v-icon>
            </button>
          </template>
        </div>
      </div>
    </Teleport>

    <div class="chart-grid">
      <div class="row-label-cell" />
      <div class="arch-numbers-row">
        <div class="quadrant-nums quadrant-nums--right">
          <span class="arch-tag">R</span>
          <span v-for="fdi in UPPER_RIGHT" :key="`hn-${fdi}`" class="tooth-num">{{ toothNumber(fdi) }}</span>
        </div>
        <div class="midline-gap" />
        <div class="quadrant-nums quadrant-nums--left">
          <span v-for="fdi in UPPER_LEFT" :key="`hn-${fdi}`" class="tooth-num">{{ toothNumber(fdi) }}</span>
          <span class="arch-tag">L</span>
        </div>
      </div>

      <template v-for="row in ROWS" :key="row.id">
        <div class="row-label-cell" />
        <div class="teeth-row-wrap" :class="{ 'teeth-row-wrap--inactive': isRowDimmed(row.id) }">
          <div class="quadrant">
            <div
              v-for="fdi in (row.arch === 'upper' ? UPPER_RIGHT : LOWER_RIGHT)"
              :key="`${row.id}-r-${fdi}`"
              class="tooth-cell"
              :class="{ 'tooth-cell--inactive': !isRowInteractive(row.id), 'tooth-cell--profile': usesProfileRow(row.id) }"
              @mouseenter="onToothMouseEnter(fdi, $event)"
              @mouseleave="onToothMouseLeave"
              @click.capture="onToothCellClick(row.id, fdi, $event)"
            >
              <ToothProfile
                v-if="usesProfileRow(row.id) && hasProfileAsset(fdi)"
                :fdi="fdi"
                :orientation="row.arch"
                :tooth="getDisplayTooth(row.id, fdi)"
                :is-selected="selectedToothFdi === fdi"
                :label="TEETH_BY_FDI[fdi]?.palmer || String(fdi)"
              />
              <Tooth
                v-else
                :fdi="fdi"
                :tooth="getTooth(fdi)"
                :mesial-right="true"
                :is-selected="selectedToothFdi === fdi"
                :active-condition="isRowInteractive(row.id) ? activeCondition : null"
                :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
                :size="usesProfileRow(row.id) ? profileToothSize : standardToothSize"
                @surface-click="onSurfaceClickRow(row.id, $event)"
                @tooth-click="onToothClickRow(row.id, $event)"
              />
              <div v-if="markerByRow[row.id]?.[fdi]" class="tooth-marker" :class="`tooth-marker--${markerByRow[row.id][fdi].type}`">
                <span v-if="markerByRow[row.id][fdi].type === 'text'">{{ markerByRow[row.id][fdi].text }}</span>
                <span v-else class="tooth-marker-line" />
                <span v-if="markerByRow[row.id][fdi].treatmentCount" class="tooth-marker-treatment-badge">
                  {{ markerByRow[row.id][fdi].treatmentCount > 1 ? `T${markerByRow[row.id][fdi].treatmentCount}` : 'T' }}
                </span>
              </div>
            </div>
          </div>
          <div class="midline-gap" />
          <div class="quadrant">
            <div
              v-for="fdi in (row.arch === 'upper' ? UPPER_LEFT : LOWER_LEFT)"
              :key="`${row.id}-l-${fdi}`"
              class="tooth-cell"
              :class="{ 'tooth-cell--inactive': !isRowInteractive(row.id), 'tooth-cell--profile': usesProfileRow(row.id) }"
              @mouseenter="onToothMouseEnter(fdi, $event)"
              @mouseleave="onToothMouseLeave"
              @click.capture="onToothCellClick(row.id, fdi, $event)"
            >
              <ToothProfile
                v-if="usesProfileRow(row.id) && hasProfileAsset(fdi)"
                :fdi="fdi"
                :orientation="row.arch"
                :tooth="getDisplayTooth(row.id, fdi)"
                :is-selected="selectedToothFdi === fdi"
                :label="TEETH_BY_FDI[fdi]?.palmer || String(fdi)"
              />
              <Tooth
                v-else
                :fdi="fdi"
                :tooth="getTooth(fdi)"
                :mesial-right="false"
                :is-selected="selectedToothFdi === fdi"
                :active-condition="isRowInteractive(row.id) ? activeCondition : null"
                :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
                :size="usesProfileRow(row.id) ? profileToothSize : standardToothSize"
                @surface-click="onSurfaceClickRow(row.id, $event)"
                @tooth-click="onToothClickRow(row.id, $event)"
              />
              <div v-if="markerByRow[row.id]?.[fdi]" class="tooth-marker" :class="`tooth-marker--${markerByRow[row.id][fdi].type}`">
                <span v-if="markerByRow[row.id][fdi].type === 'text'">{{ markerByRow[row.id][fdi].text }}</span>
                <span v-else class="tooth-marker-line" />
                <span v-if="markerByRow[row.id][fdi].treatmentCount" class="tooth-marker-treatment-badge">
                  {{ markerByRow[row.id][fdi].treatmentCount > 1 ? `T${markerByRow[row.id][fdi].treatmentCount}` : 'T' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="row-label-cell" />
      <div class="arch-numbers-row">
        <div class="quadrant-nums quadrant-nums--right">
          <span class="arch-tag">R</span>
          <span v-for="fdi in LOWER_RIGHT" :key="`fn-${fdi}`" class="tooth-num">{{ toothNumber(fdi) }}</span>
        </div>
        <div class="midline-gap" />
        <div class="quadrant-nums quadrant-nums--left">
          <span v-for="fdi in LOWER_LEFT" :key="`fn-${fdi}`" class="tooth-num">{{ toothNumber(fdi) }}</span>
          <span class="arch-tag">L</span>
        </div>
      </div>
    </div>

    <div v-if="bridgeSelectMode" class="bridge-hint">
      <v-icon size="16" color="warning" class="mr-1">mdi-bridge</v-icon>
      Bridge: click the <strong>second abutment tooth</strong> to complete the span
    </div>
    <div v-if="layerHint" class="layer-hint">
      {{ layerHint }}
    </div>
  </div>
</template>

<script setup>
import Tooth from './Tooth.vue'
import ToothProfile from './ToothProfile.vue'
import {
  TEETH_BY_FDI, createDefaultTooth, TOOTH_STATUSES,
  DECIDUOUS_UPPER_RIGHT, DECIDUOUS_UPPER_LEFT, DECIDUOUS_LOWER_RIGHT, DECIDUOUS_LOWER_LEFT,
} from './toothData.js'
import { getDiagnosisAbbr, getStatusMarker } from '~/shared/defaults/charting/chartingDefaults.js'

const props = defineProps({
  chart: { type: Object, default: () => ({}) },
  notation: { type: String, default: 'FDI' },
  activeCondition: { type: String, default: null },
  selectedToothFdi: { type: Number, default: null },
  chartScope: { type: String, default: 'both' },
  bridgeSelectMode: { type: Boolean, default: false },
  bridgeStartFdi: { type: Number, default: null },
  toothStatuses: { type: Object, default: () => ({}) },
  // all treatment items so we can show a per-tooth hover tooltip
  treatmentItems: { type: Array, default: () => [] },
  teethType: { type: String, default: 'permanent' },
})

const emit = defineEmits(['surface-click', 'tooth-click', 'tooth-status-change', 'tooth-diagnosis-change'])
const STATUS_ANNOTATION_CODE = '__STATUS_ANNOTATION__'
const DIAGNOSIS_ANNOTATION_CODE = '__DIAGNOSIS_ANNOTATION__'

const PERM_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const PERM_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
const PERM_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
const PERM_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]

const UPPER_RIGHT = computed(() => props.teethType === 'deciduous' ? [...DECIDUOUS_UPPER_RIGHT].reverse() : props.teethType === 'mixed' ? [...DECIDUOUS_UPPER_RIGHT, ...PERM_UPPER_RIGHT].filter((v, i, a) => a.indexOf(v) === i) : PERM_UPPER_RIGHT)
const UPPER_LEFT  = computed(() => props.teethType === 'deciduous' ? DECIDUOUS_UPPER_LEFT  : props.teethType === 'mixed' ? [...PERM_UPPER_LEFT, ...DECIDUOUS_UPPER_LEFT].filter((v, i, a) => a.indexOf(v) === i) : PERM_UPPER_LEFT)
const LOWER_RIGHT = computed(() => props.teethType === 'deciduous' ? [...DECIDUOUS_LOWER_RIGHT].reverse() : props.teethType === 'mixed' ? [...DECIDUOUS_LOWER_RIGHT, ...PERM_LOWER_RIGHT].filter((v, i, a) => a.indexOf(v) === i) : PERM_LOWER_RIGHT)
const LOWER_LEFT  = computed(() => props.teethType === 'deciduous' ? DECIDUOUS_LOWER_LEFT  : props.teethType === 'mixed' ? [...PERM_LOWER_LEFT, ...DECIDUOUS_LOWER_LEFT].filter((v, i, a) => a.indexOf(v) === i) : PERM_LOWER_LEFT)

const ROWS = [
  { id: 'upper-plan', arch: 'upper', layer: 'plan' },
  { id: 'upper-base', arch: 'upper', layer: 'base' },
  { id: 'lower-base', arch: 'lower', layer: 'base' },
  { id: 'lower-plan', arch: 'lower', layer: 'plan' },
]

const MIRROR_ROW = {
  'upper-plan': 'upper-base',
  'lower-plan': 'lower-base',
}

const STATUS_OPTIONS = TOOTH_STATUSES
const DIAGNOSIS_OPTIONS = [
  { value: 'drifted_mesially', label: 'Drifted Mesially' },
  { value: 'drifted_distally', label: 'Drifted Distally' },
  { value: 'rotated_mesially', label: 'Rotated Mesially' },
  { value: 'rotated_distally', label: 'Rotated Distally' },
  { value: 'over_erupted', label: 'Over Erupted' },
  { value: 'impacted', label: 'Impacted' },
  { value: 'mobile', label: 'Mobile' },
]
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((opt) => [opt.value, opt.label]))
const DIAGNOSIS_LABELS = Object.fromEntries(DIAGNOSIS_OPTIONS.map((opt) => [opt.value, opt.label]))

const statusPopupEl = ref(null)
const statusPopup = reactive({
  visible: false,
  rowId: null,
  fdi: null,
  label: '',
  x: 0,
  y: 0,
  section: 'status',
})
const layerHint = ref('')
let layerHintTimer = null

const currentStatus = computed(() => {
  if (!statusPopup.rowId || !statusPopup.fdi) return ''
  return getAnnotation(targetRowForSelection(statusPopup.rowId), statusPopup.fdi).status || ''
})

const currentDiagnosis = computed(() => {
  if (!statusPopup.rowId || !statusPopup.fdi) return ''
  return getAnnotation(targetRowForSelection(statusPopup.rowId), statusPopup.fdi).diagnosis || ''
})

const standardToothSize = computed(() => 48)
const profileToothSize = computed(() => 56)

function getTooth(fdi) {
  return props.chart[fdi] || createDefaultTooth(fdi)
}

function getDisplayTooth(rowId, fdi) {
  const tooth = getTooth(fdi)
  if (!usesProfileRow(rowId)) return tooth
  return {
    ...tooth,
    surfaces: {
      top: null,
      left: null,
      center: null,
      right: null,
      bottom: null,
    },
    toothCondition: null,
    toothConditionStatus: null,
    bridgeStart: false,
    bridgeEnd: false,
    bridgePontic: false,
    implant: false,
    missing: false,
  }
}

function toothNumber(fdi) {
  const p = TEETH_BY_FDI[fdi]?.palmer
  return p ? p.slice(2) : ''
}

function usesProfileRow(rowId) {
  const row = ROWS.find((r) => r.id === rowId)
  return !!row && row.layer === 'plan'
}

function hasProfileAsset(fdi) {
  return Number.isFinite(Number(fdi))
}

// Fix #3 — 'both' scope previously only allowed plan rows to be interactive, silently swallowing
// base row clicks with a confusing hint message. Now both layers are fully interactive in 'both' mode.
function isRowInteractive(rowId) {
  const row = ROWS.find((r) => r.id === rowId)
  return !!row && row.layer === 'base'
}

function isRowDimmed(rowId) {
  return false
}

function targetRowForSelection(rowId) {
  return MIRROR_ROW[rowId] || rowId
}

function annotationKey(rowId, fdi) {
  return `${rowId}:${fdi}`
}

function getAnnotation(rowId, fdi) {
  const keyed = props.toothStatuses?.[annotationKey(rowId, fdi)]
  if (keyed && typeof keyed === 'object') {
    return { status: keyed.status || '', diagnosis: keyed.diagnosis || '' }
  }
  const legacy = props.toothStatuses?.[fdi]
  if (typeof legacy === 'string') return { status: legacy, diagnosis: '' }
  if (legacy && typeof legacy === 'object') {
    return { status: legacy.status || '', diagnosis: legacy.diagnosis || '' }
  }
  return { status: '', diagnosis: '' }
}

function buildMarker(rowId, fdi) {
  const row = ROWS.find((r) => r.id === rowId)
  if (!row || row.layer !== 'plan') return null
  const a = getAnnotation(rowId, fdi)
  const treatmentCount = usesProfileRow(rowId) ? 0 : getVisibleTreatmentItems(fdi).length
  if (a.diagnosis) {
    const abbr = getDiagnosisAbbr(a.diagnosis)
    if (abbr) return { type: 'text', text: abbr, treatmentCount }
  }
  const statusMarker = getStatusMarker(a.status)
  if (statusMarker) return { ...statusMarker, treatmentCount }
  if (treatmentCount) return { type: 'text', text: treatmentCount > 1 ? `T${treatmentCount}` : 'T', treatmentCount: 0 }
  return null
}

const markerByRow = computed(() =>
  Object.fromEntries(
    ROWS.map((row) => {
      const teeth = row.arch === 'upper'
        ? [...UPPER_RIGHT.value, ...UPPER_LEFT.value]
        : [...LOWER_RIGHT.value, ...LOWER_LEFT.value]
      return [
        row.id,
        Object.fromEntries(
          teeth
            .map((fdi) => [fdi, buildMarker(row.id, fdi)])
            .filter(([, marker]) => marker)
        ),
      ]
    })
  )
)

// Hover tooltip state
const hoverTooltip = reactive({ visible: false, fdi: null, label: '', lines: [], x: 0, y: 0 })
let hoverTimer = null

const CONDITION_COLORS = {
  existing: '#6b7280',
  planned: '#0061FB',
  scheduled: '#10b981',
  completed: '#22c55e',
}
const ANNOTATION_LINE_COLORS = {
  status: '#64748b',
  diagnosis: '#0f172a',
}
const showTreatmentInChart = computed(() => props.chartScope !== 'base')
const visibleTreatmentItems = computed(() =>
  !showTreatmentInChart.value
    ? []
    :
  (props.treatmentItems || []).filter((item) => {
    const code = String(item?.treatmentCode || '')
    return code !== STATUS_ANNOTATION_CODE && code !== DIAGNOSIS_ANNOTATION_CODE
  })
)

function baseRowForFdi(fdi) {
  return String(fdi).startsWith('1') || String(fdi).startsWith('2') || String(fdi).startsWith('5') || String(fdi).startsWith('6')
    ? 'upper-base'
    : 'lower-base'
}

function getBaseAnnotation(fdi) {
  return getAnnotation(baseRowForFdi(fdi), fdi)
}

function getVisibleTreatmentItems(fdi) {
  return visibleTreatmentItems.value.filter((item) => Number(item.fdi) === Number(fdi))
}

function surfaceShortLabel(surfaceValue) {
  const surfaces = String(surfaceValue || '').split('+').filter(Boolean)
  return surfaces.map((surface) => surface.charAt(0).toUpperCase()).join('/')
}

function onToothMouseEnter(fdi, event) {
  const items = getVisibleTreatmentItems(fdi)
  const annotation = getBaseAnnotation(fdi)
  const lines = []

  if (annotation.status) {
    lines.push({
      text: STATUS_LABELS[annotation.status] || annotation.status,
      sub: 'Status',
      color: ANNOTATION_LINE_COLORS.status,
    })
  }

  if (annotation.diagnosis) {
    lines.push({
      text: DIAGNOSIS_LABELS[annotation.diagnosis] || annotation.diagnosis,
      sub: 'Diagnosis',
      color: ANNOTATION_LINE_COLORS.diagnosis,
    })
  }

  lines.push(...items.map((i) => {
    const toothLabel = TEETH_BY_FDI[fdi]?.palmer || String(fdi)
    const surf = i.surface ? ` - ${surfaceShortLabel(i.surface)}` : ''
    const label = i.treatmentName || i.conditionLabel || i.condition || 'Treatment'
    const text = `${toothLabel}${surf} - ${label}`
    const dateStr = i.createdAt
      ? new Date(i.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
      : ''
    const practitioner = i.practitionerName || i.clinicianName || ''
    const scope = i.status === 'existing' ? 'Base chart' : (i.planName || 'Treatment plan')
    const parts = [dateStr, practitioner, scope].filter(Boolean)
    return { text, sub: parts.join(' - '), color: CONDITION_COLORS[i.status] || '#0061FB' }
  }))

  if (!lines.length) return
  const rect = event.currentTarget.getBoundingClientRect()
  hoverTooltip.fdi = fdi
  hoverTooltip.label = TEETH_BY_FDI[fdi]?.palmer || String(fdi)
  hoverTooltip.lines = lines
  hoverTooltip.x = rect.right + window.scrollX + 6
  hoverTooltip.y = rect.top + window.scrollY - 4
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => { hoverTooltip.visible = true }, 120)
}

function onToothMouseLeave() {
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = null
  hoverTooltip.visible = false
}

function openStatusPopup(rowId, fdi, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  statusPopup.rowId = rowId
  statusPopup.fdi = fdi
  statusPopup.section = 'status'
  statusPopup.label = TEETH_BY_FDI[fdi]?.palmer || String(fdi)
  statusPopup.x = rect.left + window.scrollX + 56
  statusPopup.y = rect.top + window.scrollY + 6
  statusPopup.visible = true
}

function closePopup() {
  statusPopup.visible = false
}

function onSelectStatus(status) {
  if (!statusPopup.fdi || !statusPopup.rowId) return
  emit('tooth-status-change', {
    fdi: statusPopup.fdi,
    rowId: targetRowForSelection(statusPopup.rowId),
    status,
  })
  closePopup()
}

function onSelectDiagnosis(diagnosis) {
  if (!statusPopup.fdi || !statusPopup.rowId) return
  emit('tooth-diagnosis-change', {
    fdi: statusPopup.fdi,
    rowId: targetRowForSelection(statusPopup.rowId),
    diagnosis,
  })
  closePopup()
}

function onToothCellClick(rowId, fdi, event) {
  const row = ROWS.find((r) => r.id === rowId)
  if (!isRowInteractive(rowId)) {
    event.preventDefault()
    event.stopPropagation()
    if (row?.layer === 'plan') {
      layerHint.value = 'Use the middle tooth rows to select and chart treatment.'
    }
    if (layerHint.value) {
      if (layerHintTimer) clearTimeout(layerHintTimer)
      layerHintTimer = setTimeout(() => { layerHint.value = '' }, 2200)
    }
    return
  }
  if (!props.activeCondition) {
    if (props.chartScope !== 'base') return
    event.preventDefault()
    event.stopPropagation()
    openStatusPopup(rowId, fdi, event)
  }
}

function onSurfaceClickRow(rowId, payload) {
  if (!isRowInteractive(rowId)) return
  emit('surface-click', payload)
}

function onToothClickRow(rowId, fdi) {
  if (!isRowInteractive(rowId)) return
  emit('tooth-click', fdi)
}

function onDocClick(e) {
  if (statusPopup.visible && statusPopupEl.value && !statusPopupEl.value.contains(e.target)) {
    statusPopup.visible = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  if (layerHintTimer) clearTimeout(layerHintTimer)
  if (hoverTimer) clearTimeout(hoverTimer)
})
</script>

<style scoped>
.tooth-chart {
  --tooth-size: 48px;
  --tooth-gap: 1px;
  --tooth-step: calc(var(--tooth-size) + var(--tooth-gap));
  user-select: none;
  padding: 8px 2px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 24px 1fr;
  row-gap: 6px;
  align-items: center;
}

.row-label-cell {
  min-height: 24px;
}

.arch-numbers-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.quadrant-nums {
  display: flex;
  align-items: center;
  position: relative;
}

.tooth-num {
  width: var(--tooth-step);
  text-align: center;
  font-size: 10px;
  color: #374151;
  flex-shrink: 0;
}

.arch-tag {
  width: 16px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  position: absolute;
  top: 0;
}

.quadrant-nums--right .arch-tag {
  right: 100%;
}

.quadrant-nums--left .arch-tag {
  left: 100%;
}

.teeth-row-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.teeth-row-wrap--inactive {
  opacity: 0.28;
}

.quadrant {
  display: flex;
  gap: var(--tooth-gap);
}

.tooth-cell {
  width: var(--tooth-size);
  height: var(--tooth-size);
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooth-cell--profile {
  width: var(--tooth-size);
  height: 88px;
  align-items: center;
}

.tooth-cell--inactive {
  cursor: not-allowed;
}

.tooth-cell--inactive :deep(.tooth-surface),
.tooth-cell--inactive :deep(.tooth-svg) {
  cursor: not-allowed !important;
}

.tooth-cell--inactive :deep(.tooth-surface:hover) {
  filter: none;
}

.midline-gap {
  width: 4px;
  flex-shrink: 0;
}

.tooth-marker {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.tooth-marker > span:first-child {
  line-height: 1;
}

.tooth-marker--line {
  align-items: flex-start;
  padding-top: 4px;
}

.tooth-marker-line {
  display: inline-block;
  width: 32px;
  height: 4px;
  border-radius: 999px;
  background: #64748b;
  border: 1px solid #0f172a;
}

.tooth-marker-treatment-badge {
  position: absolute;
  right: 7px;
  top: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #0061FB;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 97, 251, 0.25);
}

.bridge-hint {
  margin-top: 8px;
  padding: 6px 12px;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 6px;
  font-size: 12px;
  color: #e65100;
  display: flex;
  align-items: center;
}

.layer-hint {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #f6b0b0;
  background: #fff1f1;
  color: #bf1f1f;
  font-size: 12px;
  font-weight: 500;
}

.tooth-hover-tip {
  position: absolute;
  z-index: 10000;
  background: #1e293b;
  color: #f8fafc;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 160px;
  max-width: 260px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.tooth-hover-tip__title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.tooth-hover-tip__line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #f1f5f9;
  padding: 2px 0;
}

.tooth-hover-tip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}

.tooth-hover-tip__sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 1px;
}

.status-popup {
  position: absolute;
  z-index: 9999;
  display: grid;
  grid-template-columns: 250px 250px;
  align-items: start;
  background: #fff;
  border: 1px solid #d8dee7;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.status-popup__title {
  grid-column: 1 / span 2;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f7;
}

.status-popup__menu-col {
  display: flex;
  flex-direction: column;
}

.status-popup__menu-btn {
  height: 46px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
}

.status-popup__menu-btn--active {
  background: #eef2f7;
}

.status-popup__submenu {
  border-left: 1px solid #eef2f7;
  display: flex;
  flex-direction: column;
}

.status-popup__sub-btn {
  height: 46px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
}

.status-popup__sub-btn:hover {
  background: #f8fafc;
}
</style>
