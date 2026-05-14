<template>
  <div
    class="tooth-front-wrap"
    :class="{ 'is-selected': selected, 'is-missing': toothData.missing, 'is-lower': isLower }"
    :title="label"
    @click.stop="$emit('tooth-click', fdi)"
  >
    <svg
      viewBox="0 0 48 82"
      xmlns="http://www.w3.org/2000/svg"
      class="tooth-svg"
    >
      <defs>
        <pattern :id="`planned-f-${fdi}`" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" :stroke="crownColor" stroke-width="1.5" />
        </pattern>
      </defs>

      <!-- Roots (hidden when missing) -->
      <template v-if="!toothData.missing">
        <path
          v-for="(rootD, i) in paths.roots"
          :key="`root-${i}`"
          :d="rootD"
          :fill="rootFill"
          stroke="#c8bfb2"
          stroke-width="0.6"
        />
        <!-- RCT: fill root pink/red -->
        <template v-if="hasRct">
          <path
            v-for="(rootD, i) in paths.roots"
            :key="`rct-${i}`"
            :d="rootD"
            fill="#d81b60"
            opacity="0.5"
          />
        </template>
      </template>

      <!-- Crown -->
      <path
        :d="paths.crown"
        :fill="crownFill"
        :stroke="crownStroke"
        :stroke-width="selected ? 2 : 1"
        :opacity="toothData.missing ? 0.15 : 1"
      />

      <!-- Crown overlay for planned status (hatch) -->
      <path
        v-if="crownPlanned"
        :d="paths.crown"
        :fill="`url(#planned-f-${fdi})`"
        opacity="0.6"
      />

      <!-- Missing: X marks -->
      <template v-if="toothData.missing">
        <line x1="14" y1="14" x2="34" y2="42" stroke="#b0b0b0" stroke-width="2.5" stroke-linecap="round" />
        <line x1="34" y1="14" x2="14" y2="42" stroke="#b0b0b0" stroke-width="2.5" stroke-linecap="round" />
      </template>

      <!-- Bridge bar across crown -->
      <rect
        v-if="toothData.bridgeStart || toothData.bridgePontic || toothData.bridgeEnd"
        x="0" :y="bridgeBarY" width="48" height="5"
        :fill="toothData.bridgePontic ? '#fb8c0030' : 'none'"
        stroke="#fb8c00"
        stroke-width="1.2"
      />

      <!-- Implant screw symbol in root area -->
      <line v-if="toothData.implant" x1="24" y1="50" x2="24" y2="74" stroke="#43a047" stroke-width="2.5" stroke-dasharray="3,2" />
      <circle v-if="toothData.implant" cx="24" cy="50" r="4" fill="none" stroke="#43a047" stroke-width="1.5" />

      <!-- Fracture line -->
      <polyline
        v-if="toothData.toothCondition === 'fracture'"
        points="20,10 26,22 19,30 25,42"
        fill="none"
        stroke="#f57f17"
        stroke-width="1.5"
        stroke-linecap="round"
      />

      <!-- Selected ring -->
      <path
        v-if="selected"
        :d="paths.crown"
        fill="none"
        stroke="#0061FB"
        stroke-width="2.5"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TEETH_BY_FDI, getToothLabel, getSurfaceColor, getConditionColor, CONDITIONS, ARCH } from './toothData.js'
import { FRONT_PATHS } from './toothPaths.js'

const props = defineProps({
  fdi:       { type: Number, required: true },
  toothData: { type: Object, required: true },
  notation:  { type: String, default: 'FDI' },
  selected:  { type: Boolean, default: false },
})

const emit = defineEmits(['tooth-click'])

const meta    = computed(() => TEETH_BY_FDI[props.fdi])
const isLower = computed(() => meta.value?.arch === ARCH.LOWER)
const label   = computed(() => getToothLabel(props.fdi, props.notation))

const paths = computed(() => {
  const type = meta.value?.type || 'incisor'
  return FRONT_PATHS[type] || FRONT_PATHS.incisor
})

// ── Condition helpers ─────────────────────────────────────────────────────
const crownCondition = computed(() => props.toothData.toothCondition)
const crownColor     = computed(() => crownCondition.value ? getConditionColor(crownCondition.value) : '#f5f0e8')
const crownPlanned   = computed(() =>
  props.toothData.toothConditionStatus === 'planned' && !!crownCondition.value
)
const hasRct = computed(() => crownCondition.value === 'rct' || crownCondition.value === 'post-core')

const crownFill = computed(() => {
  if (props.toothData.missing) return '#e8e8e8'
  if (!crownCondition.value) return '#f5f0e8'
  const status = props.toothData.toothConditionStatus || 'existing'
  if (status === 'planned') return crownColor.value + '40'
  if (status === 'completed') return crownColor.value + 'cc'
  return crownColor.value + 'aa'
})

const crownStroke = computed(() => {
  if (props.selected) return '#0061FB'
  if (props.toothData.missing) return '#bdbdbd'
  return '#b0a898'
})

const rootFill = computed(() => {
  if (props.toothData.implant) return '#e8f5e9'
  return '#ede8e0'
})

// Bridge bar is at the crown base — for upper teeth that's near y≈40, lower (flipped) same
const bridgeBarY = computed(() => 35)
</script>

<style scoped>
.tooth-front-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* Lower teeth: flip so roots point up, crown points down */
.tooth-front-wrap.is-lower .tooth-svg {
  transform: scaleY(-1);
}

.tooth-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.tooth-front-wrap:hover .tooth-svg path:first-of-type {
  filter: brightness(0.95);
}
</style>
