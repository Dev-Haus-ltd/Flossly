<template>
  <div class="tooth-wrapper" :class="{ 'tooth--selected': isSelected, 'tooth--bridge-pending': isBridgePending }">
    <!-- Tooth number label (above for upper arch, below for lower arch — rendered by ToothChart) -->

    <svg
      :width="SIZE"
      :height="SIZE"
      :viewBox="`0 0 ${VB} ${VB}`"
      class="tooth-svg"
      :class="{ 'tooth-svg--cursor': !!activeCondition }"
      @click.stop="onToothBodyClick"
    >
      <!-- ── BACKGROUND ─────────────────────────────────────────── -->
      <rect
        x="0" y="0" :width="VB" :height="VB"
        rx="2"
        :fill="isSelected ? '#EEF4FF' : '#fff'"
        :stroke="isSelected ? '#0061FB' : isBridgePending ? '#fb8c00' : '#bbb'"
        :stroke-width="isSelected || isBridgePending ? 2 : 1"
      />

      <!-- ── MISSING TOOTH ──────────────────────────────────────── -->
      <template v-if="tooth.missing">
        <line :x1="2" :y1="2" :x2="VB-2" :y2="VB-2" stroke="#555" stroke-width="2" stroke-linecap="round"/>
        <line :x1="VB-2" :y1="2" :x2="2" :y2="VB-2" stroke="#555" stroke-width="2" stroke-linecap="round"/>
      </template>

      <!-- ── NORMAL TOOTH ───────────────────────────────────────── -->
      <template v-else>
        <!-- Bridge bar overlay (pontic) -->
        <rect
          v-if="tooth.bridgePontic"
          x="0" :y="VB*0.35" :width="VB" :height="VB*0.30"
          fill="#fb8c00" fill-opacity="0.15"
          stroke="none"
        />

        <!-- Buccal / Labial (top trapezoid) -->
        <polygon
          :points="buccalPts"
          :fill="sfColor('buccal')"
          :stroke="sfStroke('buccal')"
          stroke-width="0.5"
          class="tooth-surface"
          @click.stop="onSurface('buccal')"
        />

        <!-- Lingual / Palatal (bottom trapezoid) -->
        <polygon
          :points="lingualPts"
          :fill="sfColor('lingual')"
          :stroke="sfStroke('lingual')"
          stroke-width="0.5"
          class="tooth-surface"
          @click.stop="onSurface('lingual')"
        />

        <!-- Left surface (mesial or distal depending on quadrant) -->
        <polygon
          :points="leftPts"
          :fill="sfColor(leftSurface)"
          :stroke="sfStroke(leftSurface)"
          stroke-width="0.5"
          class="tooth-surface"
          @click.stop="onSurface(leftSurface)"
        />

        <!-- Right surface (distal or mesial depending on quadrant) -->
        <polygon
          :points="rightPts"
          :fill="sfColor(rightSurface)"
          :stroke="sfStroke(rightSurface)"
          stroke-width="0.5"
          class="tooth-surface"
          @click.stop="onSurface(rightSurface)"
        />

        <!-- Occlusal / Incisal (center rect) -->
        <rect
          :x="IC" :y="IC" :width="IS" :height="IS"
          :fill="sfColor('occlusal')"
          :stroke="sfStroke('occlusal')"
          stroke-width="0.5"
          class="tooth-surface"
          @click.stop="onSurface('occlusal')"
        />

        <!-- ── TOOTH-CONDITION OVERLAYS ──────────────────────────── -->

        <!-- Crown: thick colored border -->
        <rect
          v-if="isCrown"
          x="1.5" y="1.5" :width="VB-3" :height="VB-3"
          rx="2"
          fill="none"
          :stroke="condColor(tooth.toothCondition)"
          stroke-width="3.5"
        />

        <!-- Veneer: left-side thick bar -->
        <rect
          v-if="tooth.toothCondition === 'veneer'"
          x="0" y="0" width="5" :height="VB"
          :fill="condColor('veneer')"
          fill-opacity="0.85"
        />

        <!-- RCT: pink filled circle in center -->
        <circle
          v-if="tooth.toothCondition === 'rct' || tooth.toothCondition === 'post-core'"
          :cx="VB/2" :cy="VB/2" r="4"
          :fill="condColor(tooth.toothCondition)"
        />

        <!-- Fracture: diagonal crack line -->
        <line
          v-if="tooth.toothCondition === 'fracture'"
          :x1="VB*0.3" :y1="VB*0.05"
          :x2="VB*0.7" :y2="VB*0.95"
          :stroke="condColor('fracture')"
          stroke-width="1.5"
          stroke-dasharray="2,2"
        />

        <!-- Implant indicator: small diamond -->
        <polygon
          v-if="tooth.implant || tooth.toothCondition === 'implant' || tooth.toothCondition === 'implant-crown'"
          :points="`${VB/2},4 ${VB/2+5},9 ${VB/2},14 ${VB/2-5},9`"
          :fill="condColor('implant')"
        />

        <!-- Bridge abutment: top/bottom bar -->
        <rect
          v-if="tooth.bridgeStart || tooth.bridgeEnd"
          x="0" :y="VB*0.4" :width="VB" :height="VB*0.2"
          :fill="condColor('bridge')"
          fill-opacity="0.6"
        />

        <!-- Planned hatching pattern -->
        <rect
          v-if="hasAnyPlanned"
          x="0" y="0" :width="VB" :height="VB"
          fill="url(#planned-hatch)"
          pointer-events="none"
        />

        <!-- Completed tick: small checkmark badge -->
        <g v-if="hasAllCompleted" pointer-events="none">
          <circle :cx="VB-7" :cy="7" r="5" fill="#43a047"/>
          <polyline
            :points="`${VB-10},7 ${VB-7},10 ${VB-4},4`"
            fill="none" stroke="white" stroke-width="1.2" stroke-linecap="round"
          />
        </g>
      </template>

      <!-- ── SVG DEFS (hatch pattern) ──────────────────────────── -->
      <defs>
        <pattern id="planned-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30,136,229,0.25)" stroke-width="2"/>
        </pattern>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSurfaceColor, getConditionColor, CONDITIONS } from './toothData.js'

const props = defineProps({
  fdi:             { type: Number, required: true },
  tooth:           { type: Object, required: true },
  mesialRight:     { type: Boolean, default: false },  // true = mesial is on the right side of the box
  isSelected:      { type: Boolean, default: false },
  activeCondition: { type: String,  default: null  },
  isBridgePending: { type: Boolean, default: false },
  size:            { type: Number,  default: 44 },
})

const emit = defineEmits(['surface-click', 'tooth-click'])

// ── SVG geometry constants ────────────────────────────────────────────────
const SIZE = computed(() => props.size)
const VB   = 44          // viewBox dimension
const INSET = 13         // how far the inner box insets from each edge
const IC   = INSET       // inner rect x/y start
const IS   = VB - INSET * 2  // inner rect width/height = 18

// Polygon points (string format "x,y x,y ...")
const buccalPts  = `0,0 ${VB},0 ${VB-INSET},${INSET} ${INSET},${INSET}`
const lingualPts = `${INSET},${VB-INSET} ${VB-INSET},${VB-INSET} ${VB},${VB} 0,${VB}`
const leftPts    = `0,0 ${INSET},${INSET} ${INSET},${VB-INSET} 0,${VB}`
const rightPts   = `${VB-INSET},${INSET} ${VB},0 ${VB},${VB} ${VB-INSET},${VB-INSET}`

// ── Surface mapping ───────────────────────────────────────────────────────
// mesialRight: if true, right polygon = mesial, left = distal
// if false,    left polygon = mesial, right = distal
const leftSurface  = computed(() => props.mesialRight ? 'distal'  : 'mesial')
const rightSurface = computed(() => props.mesialRight ? 'mesial'  : 'distal')

// ── Color helpers ─────────────────────────────────────────────────────────
function sfColor(surface) {
  const sf = props.tooth.surfaces?.[surface]
  if (!sf?.condition) return '#f9f9f9'
  return getSurfaceColor(sf.condition, sf.status)
}

function sfStroke(surface) {
  const sf = props.tooth.surfaces?.[surface]
  return sf?.condition ? '#999' : '#ccc'
}

function condColor(cond) {
  return getConditionColor(cond)
}

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
function onSurface(surface) {
  emit('surface-click', { fdi: props.fdi, surface })
}

function onToothBodyClick() {
  // Full-tooth condition click or select
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
  border-radius: 2px;
}

.tooth-svg--cursor {
  cursor: crosshair;
}

.tooth-surface {
  cursor: crosshair;
  transition: filter 0.1s;
}

.tooth-surface:hover {
  filter: brightness(0.88);
}

.tooth--selected .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(0, 97, 251, 0.4));
}

.tooth--bridge-pending .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(251, 140, 0, 0.5));
}
</style>
