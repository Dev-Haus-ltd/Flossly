<template>
  <div class="tooth-chart" @click.self="closePopup">

    <!-- ── Status popup (click — no active condition) ────────────────── -->
    <Teleport to="body">
      <div
        v-if="statusPopup.visible"
        class="status-popup"
        :style="{ top: statusPopup.y + 'px', left: statusPopup.x + 'px' }"
        ref="statusPopupEl"
      >
        <div class="status-popup__title">{{ statusPopup.label }}</div>
        <div class="status-popup__sub">Current Status</div>
        <select
          class="status-popup__select"
          :value="toothStatuses[statusPopup.fdi] || ''"
          @change="onStatusChange(statusPopup.fdi, $event.target.value)"
        >
          <option value="">Select</option>
          <option
            v-for="s in TOOTH_STATUSES"
            :key="s.value"
            :value="s.value"
          >{{ s.label }}</option>
        </select>
      </div>
    </Teleport>

    <!-- ── Hover popup (conditions) ──────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="hoverPopup.visible"
        class="hover-popup"
        :style="{ top: hoverPopup.y + 'px', left: hoverPopup.x + 'px' }"
        @mouseenter="onHoverPopupEnter"
        @mouseleave="onHoverPopupLeave"
      >
        <div class="hover-popup__label">{{ hoverPopup.label }}</div>
        <div class="hover-popup__date">{{ hoverPopup.date }}</div>
        <div class="hover-popup__icons">
          <span
            v-for="(ic, i) in hoverPopup.icons"
            :key="i"
            class="hover-popup__icon-dot"
            :style="{ background: ic.color }"
            :title="ic.label"
          />
        </div>
      </div>
    </Teleport>

    <!-- ── Main grid ─────────────────────────────────────────────────── -->
    <div class="chart-grid">

      <!-- ──────────── HEADER ROW ──────────────────────────────────── -->
      <div class="row-label-cell" />
      <div class="arch-numbers-row">
        <!-- Upper Right numbers -->
        <div class="quadrant-nums quadrant-nums--right">
          <span class="arch-tag">UR</span>
          <span v-for="fdi in UPPER_RIGHT" :key="`hn-${fdi}`" class="tooth-num">
            {{ toothNumber(fdi) }}
          </span>
        </div>
        <div class="midline-gap" />
        <!-- Upper Left numbers -->
        <div class="quadrant-nums quadrant-nums--left">
          <span v-for="fdi in UPPER_LEFT" :key="`hn-${fdi}`" class="tooth-num">
            {{ toothNumber(fdi) }}
          </span>
          <span class="arch-tag">UL</span>
        </div>
      </div>

      <!-- ──────────── ROW 1: Upper Front (ToothFront) ──────────────── -->
      <div class="row-label-cell">
        <span class="row-label-text">Front</span>
      </div>
      <div class="teeth-row-wrap">
        <div class="quadrant">
          <div
            v-for="fdi in UPPER_RIGHT"
            :key="`ufr-${fdi}`"
            class="tooth-cell tooth-cell--front"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <ToothFront
              :fdi="fdi"
              :tooth-data="getTooth(fdi)"
              :notation="notation"
              :selected="selectedToothFdi === fdi"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
        <div class="midline-gap" />
        <div class="quadrant">
          <div
            v-for="fdi in UPPER_LEFT"
            :key="`ufl-${fdi}`"
            class="tooth-cell tooth-cell--front"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <ToothFront
              :fdi="fdi"
              :tooth-data="getTooth(fdi)"
              :notation="notation"
              :selected="selectedToothFdi === fdi"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
      </div>

      <!-- ──────────── ROW 2: Upper Occlusal (Tooth) ────────────────── -->
      <div class="row-label-cell">
        <span class="row-label-text">Top</span>
      </div>
      <div class="teeth-row-wrap">
        <div class="quadrant">
          <div
            v-for="fdi in UPPER_RIGHT"
            :key="`uor-${fdi}`"
            class="tooth-cell"
            @click="onToothCellClick(fdi, $event)"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <Tooth
              :fdi="fdi"
              :tooth="getTooth(fdi)"
              :mesial-right="true"
              :is-selected="selectedToothFdi === fdi"
              :active-condition="activeCondition"
              :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
              :size="44"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
        <div class="midline-gap" />
        <div class="quadrant">
          <div
            v-for="fdi in UPPER_LEFT"
            :key="`uol-${fdi}`"
            class="tooth-cell"
            @click="onToothCellClick(fdi, $event)"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <Tooth
              :fdi="fdi"
              :tooth="getTooth(fdi)"
              :mesial-right="false"
              :is-selected="selectedToothFdi === fdi"
              :active-condition="activeCondition"
              :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
              :size="44"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
      </div>

      <!-- ──────────── DIVIDER ROW ─────────────────────────────────── -->
      <div class="row-label-cell" />
      <div class="arch-divider-row">
        <div class="arch-divider-line" />
      </div>

      <!-- ──────────── ROW 3: Lower Occlusal (Tooth) ────────────────── -->
      <div class="row-label-cell row-label-cell--multi">
        <span class="row-label-text row-label-text--sm">Present</span>
        <span class="row-label-text row-label-text--sm">Dental</span>
        <span class="row-label-text row-label-text--sm">Status</span>
      </div>
      <div class="teeth-row-wrap">
        <div class="quadrant">
          <div
            v-for="fdi in LOWER_RIGHT"
            :key="`lor-${fdi}`"
            class="tooth-cell"
            @click="onToothCellClick(fdi, $event)"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <Tooth
              :fdi="fdi"
              :tooth="getTooth(fdi)"
              :mesial-right="true"
              :is-selected="selectedToothFdi === fdi"
              :active-condition="activeCondition"
              :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
              :size="44"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
        <div class="midline-gap" />
        <div class="quadrant">
          <div
            v-for="fdi in LOWER_LEFT"
            :key="`lol-${fdi}`"
            class="tooth-cell"
            @click="onToothCellClick(fdi, $event)"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <Tooth
              :fdi="fdi"
              :tooth="getTooth(fdi)"
              :mesial-right="false"
              :is-selected="selectedToothFdi === fdi"
              :active-condition="activeCondition"
              :is-bridge-pending="bridgeSelectMode && bridgeStartFdi === fdi"
              :size="44"
              @surface-click="onSurfaceClick"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
      </div>

      <!-- ──────────── ROW 4: Lower Front (ToothFront) ──────────────── -->
      <div class="row-label-cell row-label-cell--multi">
        <span class="row-label-text row-label-text--sm">Work to</span>
        <span class="row-label-text row-label-text--sm">be carried</span>
        <span class="row-label-text row-label-text--sm">out</span>
      </div>
      <div class="teeth-row-wrap">
        <div class="quadrant">
          <div
            v-for="fdi in LOWER_RIGHT"
            :key="`lfr-${fdi}`"
            class="tooth-cell tooth-cell--front"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <ToothFront
              :fdi="fdi"
              :tooth-data="getTooth(fdi)"
              :notation="notation"
              :selected="selectedToothFdi === fdi"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
        <div class="midline-gap" />
        <div class="quadrant">
          <div
            v-for="fdi in LOWER_LEFT"
            :key="`lfl-${fdi}`"
            class="tooth-cell tooth-cell--front"
            @mouseenter="onToothMouseEnter(fdi, $event)"
            @mouseleave="onToothMouseLeave"
          >
            <ToothFront
              :fdi="fdi"
              :tooth-data="getTooth(fdi)"
              :notation="notation"
              :selected="selectedToothFdi === fdi"
              @tooth-click="onToothClick"
            />
          </div>
        </div>
      </div>

      <!-- ──────────── FOOTER ROW ───────────────────────────────────── -->
      <div class="row-label-cell" />
      <div class="arch-numbers-row">
        <div class="quadrant-nums quadrant-nums--right">
          <span class="arch-tag">LR</span>
          <span v-for="fdi in LOWER_RIGHT" :key="`fn-${fdi}`" class="tooth-num">
            {{ toothNumber(fdi) }}
          </span>
        </div>
        <div class="midline-gap" />
        <div class="quadrant-nums quadrant-nums--left">
          <span v-for="fdi in LOWER_LEFT" :key="`fn-${fdi}`" class="tooth-num">
            {{ toothNumber(fdi) }}
          </span>
          <span class="arch-tag">LL</span>
        </div>
      </div>

    </div><!-- /chart-grid -->

    <!-- Bridge hint -->
    <div v-if="bridgeSelectMode" class="bridge-hint">
      <v-icon size="16" color="warning" class="mr-1">mdi-bridge</v-icon>
      Bridge: click the <strong>second abutment tooth</strong> to complete the span
    </div>

  </div>
</template>

<script setup>
import Tooth from './Tooth.vue'
import ToothFront from './ToothFront.vue'
import {
  TEETH_BY_FDI, getToothLabel, createDefaultTooth,
  CONDITIONS, getConditionColor, TOOTH_STATUSES,
} from './toothData.js'

const props = defineProps({
  chart:            { type: Object,  default: () => ({}) },
  notation:         { type: String,  default: 'FDI' },
  activeCondition:  { type: String,  default: null },
  selectedToothFdi: { type: Number,  default: null },
  bridgeSelectMode: { type: Boolean, default: false },
  bridgeStartFdi:   { type: Number,  default: null },
  toothStatuses:    { type: Object,  default: () => ({}) },
})

const emit = defineEmits(['surface-click', 'tooth-click', 'tooth-status-change'])

// Quadrant arrays
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]

function getTooth(fdi) {
  return props.chart[fdi] || createDefaultTooth(fdi)
}

// Palmer tooth number (1–8) for header display
function toothNumber(fdi) {
  const meta = TEETH_BY_FDI[fdi]
  if (!meta) return ''
  // Palmer number is the digit after the quadrant letter pair
  const p = meta.palmer  // e.g. 'UR8'
  return p ? p.slice(2) : ''
}

// ── Status popup ──────────────────────────────────────────────────────────
const statusPopupEl = ref(null)
const statusPopup = reactive({
  visible: false,
  fdi: null,
  label: '',
  x: 0,
  y: 0,
})

function openStatusPopup(fdi, event) {
  const meta = TEETH_BY_FDI[fdi]
  const rect = event.currentTarget.getBoundingClientRect()
  statusPopup.fdi = fdi
  statusPopup.label = meta?.palmer || String(fdi)
  statusPopup.x = rect.left + window.scrollX
  statusPopup.y = rect.bottom + window.scrollY + 4
  statusPopup.visible = true
}

function closePopup() {
  statusPopup.visible = false
}

function onStatusChange(fdi, value) {
  emit('tooth-status-change', { fdi, status: value })
  statusPopup.visible = false
}

// Close status popup on outside click
onMounted(() => {
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
function onDocClick(e) {
  if (statusPopup.visible && statusPopupEl.value && !statusPopupEl.value.contains(e.target)) {
    statusPopup.visible = false
  }
}

// ── Hover popup ───────────────────────────────────────────────────────────
let hoverLeaveTimer = null
const hoverPopup = reactive({
  visible: false,
  fdi: null,
  label: '',
  date: '',
  icons: [],
  x: 0,
  y: 0,
})

function toothHasConditions(fdi) {
  const t = props.chart[fdi]
  if (!t) return false
  if (t.toothCondition) return true
  return Object.values(t.surfaces || {}).some(s => s.condition)
}

function buildHoverIcons(fdi) {
  const t = props.chart[fdi]
  if (!t) return []
  const icons = []
  if (t.toothCondition) {
    icons.push({ color: getConditionColor(t.toothCondition), label: CONDITIONS[t.toothCondition]?.label || t.toothCondition })
  }
  Object.entries(t.surfaces || {}).forEach(([, s]) => {
    if (s.condition) {
      icons.push({ color: getConditionColor(s.condition), label: CONDITIONS[s.condition]?.label || s.condition })
    }
  })
  return icons
}

function buildHoverLabel(fdi) {
  const meta = TEETH_BY_FDI[fdi]
  const t = props.chart[fdi]
  let label = meta?.palmer || String(fdi)
  if (t?.toothCondition) {
    label += ' - ' + (CONDITIONS[t.toothCondition]?.label || t.toothCondition)
  }
  return label
}

function buildHoverDate(fdi) {
  const t = props.chart[fdi]
  const iso = t?.updatedAt || t?.createdAt
  if (!iso) return 'Not dated'
  const d = new Date(iso)
  if (isNaN(d)) return 'Not dated'
  return d.toLocaleDateString('en-GB')
}

function onToothMouseEnter(fdi, event) {
  if (hoverLeaveTimer) { clearTimeout(hoverLeaveTimer); hoverLeaveTimer = null }
  if (!toothHasConditions(fdi)) return
  const rect = event.currentTarget.getBoundingClientRect()
  hoverPopup.fdi = fdi
  hoverPopup.label = buildHoverLabel(fdi)
  hoverPopup.date = buildHoverDate(fdi)
  hoverPopup.icons = buildHoverIcons(fdi)
  hoverPopup.x = rect.left + window.scrollX
  hoverPopup.y = rect.bottom + window.scrollY + 4
  hoverPopup.visible = true
}

function onToothMouseLeave() {
  hoverLeaveTimer = setTimeout(() => {
    hoverPopup.visible = false
  }, 120)
}

function onHoverPopupEnter() {
  if (hoverLeaveTimer) { clearTimeout(hoverLeaveTimer); hoverLeaveTimer = null }
}

function onHoverPopupLeave() {
  hoverPopup.visible = false
}

// ── Tooth interactions ────────────────────────────────────────────────────
function onToothCellClick(fdi, event) {
  // If no active condition, show status popup
  if (!props.activeCondition) {
    event.stopPropagation()
    openStatusPopup(fdi, event)
  }
  // If there IS an active condition the Tooth component handles it via @tooth-click
}

function onSurfaceClick(payload) {
  emit('surface-click', payload)
}

function onToothClick(fdi) {
  emit('tooth-click', fdi)
}
</script>

<style scoped>
.tooth-chart {
  user-select: none;
  padding: 8px 4px;
}

/* ── Grid layout ────────────────────────────────────────────────── */
.chart-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  row-gap: 0;
  align-items: center;
}

/* ── Row label cell ─────────────────────────────────────────────── */
.row-label-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding-right: 8px;
  min-height: 48px;
}

.row-label-cell--multi {
  align-items: flex-end;
  justify-content: center;
}

.row-label-text {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
  line-height: 1.5;
  text-align: right;
}

.row-label-text--sm {
  font-size: 9px;
}

/* ── Numbers row ────────────────────────────────────────────────── */
.arch-numbers-row {
  display: flex;
  align-items: center;
  padding: 2px 0;
}

.quadrant-nums {
  display: flex;
  align-items: center;
  gap: 0;
}

.quadrant-nums--right {
  flex-direction: row;
}

.quadrant-nums--left {
  flex-direction: row;
}

.tooth-num {
  width: 46px;
  text-align: center;
  font-size: 10px;
  color: #666;
  line-height: 1.4;
  flex-shrink: 0;
}

.arch-tag {
  font-size: 10px;
  font-weight: 700;
  color: #444;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

/* ── Teeth row ──────────────────────────────────────────────────── */
.teeth-row-wrap {
  display: flex;
  align-items: center;
}

.quadrant {
  display: flex;
  gap: 2px;
}

.tooth-cell {
  width: 44px;
  height: 46px;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  overflow: visible;
}

/* Front-view rows (ToothFront SVG is 48×82 — taller than occlusal) */
.tooth-cell--front {
  height: 76px;
}

/* ── Midline gap ────────────────────────────────────────────────── */
.midline-gap {
  width: 8px;
  flex-shrink: 0;
}

/* ── Divider row ────────────────────────────────────────────────── */
.arch-divider-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.arch-divider-line {
  flex: 1;
  height: 2px;
  background: #d0d0d0;
  border-radius: 1px;
}

/* ── Bridge hint ────────────────────────────────────────────────── */
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

/* ── Status popup ───────────────────────────────────────────────── */
.status-popup {
  position: absolute;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.13);
  min-width: 180px;
}

.status-popup__title {
  font-size: 13px;
  font-weight: 700;
  color: #222;
  margin-bottom: 2px;
}

.status-popup__sub {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.status-popup__select {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: #333;
  outline: none;
  background: #fafafa;
  cursor: pointer;
}

.status-popup__select:focus {
  border-color: #0061FB;
}

/* ── Hover popup ────────────────────────────────────────────────── */
.hover-popup {
  position: absolute;
  z-index: 9998;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.10);
  min-width: 140px;
  pointer-events: auto;
}

.hover-popup__label {
  font-size: 12px;
  font-weight: 600;
  color: #222;
  margin-bottom: 2px;
}

.hover-popup__date {
  font-size: 10px;
  color: #999;
  margin-bottom: 6px;
}

.hover-popup__icons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.hover-popup__icon-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}
</style>
