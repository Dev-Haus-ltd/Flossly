<template>
  <div class="tooth-wrapper" :class="{ 'tooth--selected': isSelected, 'tooth--bridge-pending': isBridgePending }">
    <svg
      :width="SIZE"
      :height="SIZE"
      :viewBox="`0 0 ${VB} ${VB}`"
      class="tooth-svg"
      :class="{ 'tooth-svg--cursor': !!activeCondition }"
      @click.stop="onToothBodyClick"
    >
      <!-- ── MISSING TOOTH ───────────────────────────────────────── -->
      <template v-if="tooth.missing">
        <!-- Outer circle (greyed) -->
        <circle :cx="CX" :cy="CY" :r="R_OUT" fill="#f3f4f6" stroke="#d0d0d0" stroke-width="1.2" />
        <!-- X marks -->
        <line :x1="CX-R_OUT*0.55" :y1="CY-R_OUT*0.55" :x2="CX+R_OUT*0.55" :y2="CY+R_OUT*0.55" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
        <line :x1="CX+R_OUT*0.55" :y1="CY-R_OUT*0.55" :x2="CX-R_OUT*0.55" :y2="CY+R_OUT*0.55" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
      </template>

      <!-- ── NORMAL TOOTH ───────────────────────────────────────── -->
      <template v-else>

        <!-- Outer background circle -->
        <circle
          :cx="CX" :cy="CY" :r="R_OUT"
          :fill="isSelected ? '#EEF4FF' : '#fff'"
          :stroke="isSelected ? '#0061FB' : isBridgePending ? '#fb8c00' : '#d0d0d0'"
          :stroke-width="isSelected || isBridgePending ? 2 : 1"
        />

        <!-- ── 4 ARC SECTORS ─────────────────────────────────────── -->

        <!-- Buccal (top) -->
        <path
          :d="BUCCAL_PATH"
          :fill="sfColor('buccal')"
          :stroke="sfStroke('buccal')"
          stroke-width="0.6"
          class="tooth-surface"
          @click.stop="onSurface('buccal')"
        />

        <!-- Lingual (bottom) -->
        <path
          :d="LINGUAL_PATH"
          :fill="sfColor('lingual')"
          :stroke="sfStroke('lingual')"
          stroke-width="0.6"
          class="tooth-surface"
          @click.stop="onSurface('lingual')"
        />

        <!-- Left (mesial or distal) -->
        <path
          :d="LEFT_PATH"
          :fill="sfColor(leftSurface)"
          :stroke="sfStroke(leftSurface)"
          stroke-width="0.6"
          class="tooth-surface"
          @click.stop="onSurface(leftSurface)"
        />

        <!-- Right (distal or mesial) -->
        <path
          :d="RIGHT_PATH"
          :fill="sfColor(rightSurface)"
          :stroke="sfStroke(rightSurface)"
          stroke-width="0.6"
          class="tooth-surface"
          @click.stop="onSurface(rightSurface)"
        />

        <!-- ── OCCLUSAL / INCISAL (centre circle) ────────────────── -->
        <circle
          :cx="CX" :cy="CY" :r="R_IN"
          :fill="sfColor('occlusal')"
          :stroke="sfStroke('occlusal')"
          stroke-width="0.6"
          class="tooth-surface"
          @click.stop="onSurface('occlusal')"
        />

        <!-- ── CONDITION OVERLAYS ─────────────────────────────────── -->

        <!-- Crown: thick coloured outer ring -->
        <circle
          v-if="isCrown"
          :cx="CX" :cy="CY" :r="R_OUT - 2"
          fill="none"
          :stroke="condColor(tooth.toothCondition)"
          stroke-width="4"
        />

        <!-- Veneer: left arc bar -->
        <path
          v-if="tooth.toothCondition === 'veneer'"
          :d="VENEER_PATH"
          fill="none"
          :stroke="condColor('veneer')"
          stroke-width="4"
          stroke-linecap="round"
        />

        <!-- RCT / Post-core: filled dot in centre -->
        <circle
          v-if="tooth.toothCondition === 'rct' || tooth.toothCondition === 'post-core'"
          :cx="CX" :cy="CY" r="3.5"
          :fill="condColor(tooth.toothCondition)"
        />

        <!-- Fracture: diagonal crack -->
        <line
          v-if="tooth.toothCondition === 'fracture'"
          :x1="CX-R_OUT*0.5" :y1="CY-R_OUT*0.8"
          :x2="CX+R_OUT*0.5" :y2="CY+R_OUT*0.8"
          :stroke="condColor('fracture')"
          stroke-width="1.5"
          stroke-dasharray="2,2"
        />

        <!-- Implant: small diamond at top -->
        <polygon
          v-if="tooth.implant || tooth.toothCondition === 'implant' || tooth.toothCondition === 'implant-crown'"
          :points="`${CX},${CY-R_IN-5} ${CX+4},${CY-R_IN} ${CX},${CY-R_IN+5} ${CX-4},${CY-R_IN}`"
          :fill="condColor('implant')"
        />

        <!-- Bridge abutment: horizontal bar through centre -->
        <rect
          v-if="tooth.bridgeStart || tooth.bridgeEnd"
          :x="0" :y="CY - 2.5" :width="VB" height="5"
          :fill="condColor('bridge')"
          fill-opacity="0.55"
          pointer-events="none"
        />

        <!-- Bridge pontic: dimmed ring -->
        <circle
          v-if="tooth.bridgePontic"
          :cx="CX" :cy="CY" :r="R_OUT - 1"
          fill="#fb8c00"
          fill-opacity="0.12"
          pointer-events="none"
        />

        <!-- Planned hatching -->
        <circle
          v-if="hasAnyPlanned"
          :cx="CX" :cy="CY" :r="R_OUT - 1"
          fill="url(#planned-hatch)"
          pointer-events="none"
        />

        <!-- Completed tick badge -->
        <g v-if="hasAllCompleted" pointer-events="none">
          <circle :cx="CX + R_OUT - 5" :cy="CY - R_OUT + 5" r="5" fill="#43a047"/>
          <polyline
            :points="`${CX+R_OUT-8},${CY-R_OUT+5} ${CX+R_OUT-5},${CY-R_OUT+8} ${CX+R_OUT-2},${CY-R_OUT+2}`"
            fill="none" stroke="white" stroke-width="1.2" stroke-linecap="round"
          />
        </g>

        <!-- Selection ring -->
        <circle
          v-if="isSelected"
          :cx="CX" :cy="CY" :r="R_OUT + 1"
          fill="none"
          stroke="#0061FB"
          stroke-width="1.5"
          stroke-dasharray="3,2"
        />
      </template>

      <!-- SVG defs -->
      <defs>
        <pattern id="planned-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30,136,229,0.2)" stroke-width="2"/>
        </pattern>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSurfaceColor, getConditionColor, CONDITIONS } from './toothData.js'

const props = defineProps({
  fdi:             { type: Number,  required: true },
  tooth:           { type: Object,  required: true },
  mesialRight:     { type: Boolean, default: false },
  isSelected:      { type: Boolean, default: false },
  activeCondition: { type: String,  default: null  },
  isBridgePending: { type: Boolean, default: false },
  size:            { type: Number,  default: 44    },
})

const emit = defineEmits(['surface-click', 'tooth-click'])

// ── Geometry ──────────────────────────────────────────────────────────────
const VB    = 44
const CX    = 22
const CY    = 22
const R_OUT = 19   // outer radius
const R_IN  = 8    // inner (occlusal) radius
const SIZE  = computed(() => props.size)
const GAP   = 4    // degrees gap between sectors

// Arc path helper: angles in SVG degrees (0=right, clockwise)
function arcPath(startDeg, endDeg) {
  const toRad = d => d * Math.PI / 180
  const s = toRad(startDeg)
  const e = toRad(endDeg)
  const x1 = (CX + R_OUT * Math.cos(s)).toFixed(3)
  const y1 = (CY + R_OUT * Math.sin(s)).toFixed(3)
  const x2 = (CX + R_OUT * Math.cos(e)).toFixed(3)
  const y2 = (CY + R_OUT * Math.sin(e)).toFixed(3)
  const x3 = (CX + R_IN  * Math.cos(e)).toFixed(3)
  const y3 = (CY + R_IN  * Math.sin(e)).toFixed(3)
  const x4 = (CX + R_IN  * Math.cos(s)).toFixed(3)
  const y4 = (CY + R_IN  * Math.sin(s)).toFixed(3)
  // Sweep angle (clockwise from start to end)
  const sweep = ((endDeg - startDeg) + 360) % 360
  const large = sweep > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${R_IN} ${R_IN} 0 ${large} 0 ${x4} ${y4} Z`
}

// Sector angles (SVG: 0=right, 90=bottom, 180=left, 270=top)
// Buccal=top (centered at 270°), Lingual=bottom (90°), Left (180°), Right (0°)
const BUCCAL_PATH  = arcPath(270 - 90 + GAP, 270 + 90 - GAP)  // 184° → 356°
const LINGUAL_PATH = arcPath(90  - 90 + GAP, 90  + 90 - GAP)  //   4° → 176°
const LEFT_PATH    = arcPath(180 - 90 + GAP, 180 + 90 - GAP)  //  94° → 266°
const RIGHT_PATH   = arcPath(0   - 90 + GAP, 0   + 90 - GAP)  // 274° →  86° (wraps)

// Veneer: left arc of outer circle
const VENEER_PATH = (() => {
  const toRad = d => d * Math.PI / 180
  const s = toRad(120), e = toRad(240)
  const x1 = (CX + (R_OUT-2) * Math.cos(s)).toFixed(3)
  const y1 = (CY + (R_OUT-2) * Math.sin(s)).toFixed(3)
  const x2 = (CX + (R_OUT-2) * Math.cos(e)).toFixed(3)
  const y2 = (CY + (R_OUT-2) * Math.sin(e)).toFixed(3)
  return `M ${x1} ${y1} A ${R_OUT-2} ${R_OUT-2} 0 0 0 ${x2} ${y2}`
})()

// Surface name mapping
const leftSurface  = computed(() => props.mesialRight ? 'distal'  : 'mesial')
const rightSurface = computed(() => props.mesialRight ? 'mesial'  : 'distal')

// ── Color helpers ─────────────────────────────────────────────────────────
function sfColor(surface) {
  const sf = props.tooth.surfaces?.[surface]
  if (!sf?.condition) return '#f7f7f7'
  return getSurfaceColor(sf.condition, sf.status)
}

function sfStroke(surface) {
  const sf = props.tooth.surfaces?.[surface]
  return sf?.condition ? '#aaa' : '#ddd'
}

function condColor(cond) { return getConditionColor(cond) }

// ── Derived states ────────────────────────────────────────────────────────
const isCrown = computed(() => {
  const c = props.tooth.toothCondition
  return c === 'crown' || c === 'crown-gold' || c === 'crown-zirconia'
})

const hasAnyPlanned = computed(() => {
  const t = props.tooth
  if (t.toothConditionStatus === 'planned') return true
  return Object.values(t.surfaces || {}).some(s => s.status === 'planned')
})

const hasAllCompleted = computed(() => {
  const t = props.tooth
  const conditioned = Object.values(t.surfaces || {}).filter(s => s.condition)
  return conditioned.length > 0 && conditioned.every(s => s.status === 'completed')
})

// ── Event handlers ────────────────────────────────────────────────────────
function onSurface(surface) { emit('surface-click', { fdi: props.fdi, surface }) }

function onToothBodyClick() {
  const cond = props.activeCondition
  if (cond && CONDITIONS[cond]?.fullTooth) {
    emit('surface-click', { fdi: props.fdi, surface: null })
  } else {
    emit('tooth-click', props.fdi)
  }
}
</script>

<style scoped>
.tooth-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}

.tooth-svg {
  display: block;
  overflow: visible;
}

.tooth-svg--cursor { cursor: crosshair; }

.tooth-surface {
  cursor: crosshair;
  transition: filter 0.1s;
}

.tooth-surface:hover { filter: brightness(0.85); }

.tooth--selected .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(0, 97, 251, 0.35));
}

.tooth--bridge-pending .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(251, 140, 0, 0.5));
}
</style>
