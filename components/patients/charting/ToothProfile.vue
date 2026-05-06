<template>
  <div
    class="tooth-profile"
    :class="{
      'tooth-profile--selected': isSelected,
    }"
  >
    <svg
      v-if="geometry"
      :viewBox="geometry.viewBox"
      class="tooth-profile__svg"
      :style="{ width: `${renderWidth}px`, height: `${renderHeight}px` }"
      aria-hidden="true"
    >
      <g :transform="groupTransform">
        <path
          v-for="(path, index) in geometry.paths"
          :key="`fill-${index}`"
          :d="path.d"
          :fill="path.fill"
          :fill-opacity="path.fillOpacity"
          stroke="none"
        />
      </g>

      <defs>
        <clipPath :id="clipId">
          <g :transform="groupTransform">
            <path
              v-for="(path, index) in geometry.paths"
              :key="`clip-${index}`"
              :d="path.d"
            />
          </g>
        </clipPath>
      </defs>

      <g :clip-path="`url(#${clipId})`">
        <g :transform="groupTransform">
          <rect
            v-for="(overlay, index) in surfaceOverlays"
            :key="`surface-${index}`"
            :x="overlay.x"
            :y="overlay.y"
            :width="overlay.width"
            :height="overlay.height"
            :fill="overlay.fill"
            :fill-opacity="overlay.opacity"
            rx="2"
            ry="2"
          />
          <rect
            v-if="fullToothFill"
            x="0"
            y="0"
            :width="VB_WIDTH_VALUE"
            :height="VB_HEIGHT_VALUE"
            :fill="fullToothFill"
            :fill-opacity="fullToothOpacity"
          />
        </g>
      </g>

      <g :transform="groupTransform">
        <path
          v-for="(path, index) in geometry.paths"
          :key="`stroke-${index}`"
          :d="path.d"
          fill="none"
          :stroke="props.isSelected ? '#0061FB' : (path.stroke || strokeColor)"
          :stroke-width="path.strokeWidth || '1.2'"
          :stroke-linejoin="path.strokeLinejoin || 'round'"
          :stroke-linecap="path.strokeLinecap || 'round'"
          :stroke-miterlimit="path.strokeMiterlimit || undefined"
        />

        <path
          v-if="fullToothOutline"
          v-for="(path, index) in geometry.paths"
          :key="`outline-${index}`"
          :d="path.d"
          fill="none"
          :stroke="fullToothOutline"
          stroke-width="2.4"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <path
          v-if="tooth?.bridgePontic"
          v-for="(path, index) in geometry.paths"
          :key="`pontic-${index}`"
          :d="path.d"
          fill="#fb8c00"
          fill-opacity="0.14"
          stroke="none"
        />

        <line
          v-if="tooth?.missing"
          :x1="12"
          :y1="12"
          :x2="VB_WIDTH_VALUE - 12"
          :y2="VB_HEIGHT_VALUE - 12"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linecap="round"
        />
        <line
          v-if="tooth?.missing"
          :x1="VB_WIDTH_VALUE - 12"
          :y1="12"
          :x2="12"
          :y2="VB_HEIGHT_VALUE - 12"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linecap="round"
        />

        <path
          v-if="tooth?.toothCondition === 'fracture'"
          :d="fracturePath"
          fill="none"
          stroke="#f57f17"
          stroke-width="1.7"
          stroke-dasharray="3 2"
          stroke-linecap="round"
        />

        <circle
          v-if="tooth?.implant || tooth?.toothCondition === 'implant' || tooth?.toothCondition === 'implant-crown'"
          :cx="VB_WIDTH_VALUE / 2"
          :cy="implantMarkerY"
          r="5"
          fill="#43a047"
        />

        <rect
          v-if="tooth?.bridgeStart || tooth?.bridgeEnd"
          x="6"
          :y="bridgeBarY"
          :width="VB_WIDTH_VALUE - 12"
          height="4"
          rx="2"
          fill="#fb8c00"
          fill-opacity="0.55"
        />

        <path
          v-if="plannedOverlay"
          v-for="(path, index) in geometry.paths"
          :key="`planned-${index}`"
          :d="path.d"
          :fill="`url(#${hatchId})`"
          stroke="none"
        />

        <g v-if="hasAllCompleted" :transform="completionBadgeTransform">
          <circle cx="0" cy="0" r="5" fill="#43a047" />
          <polyline
            points="-3,0 -1,2 3,-3"
            fill="none"
            stroke="#fff"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </g>

      <defs>
        <pattern :id="hatchId" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30,136,229,0.3)" stroke-width="2" />
        </pattern>
      </defs>
    </svg>
    <div
      v-else
      class="tooth-profile__fallback"
      :style="{ width: `${renderWidth}px`, height: `${renderHeight}px` }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CONDITIONS, TEETH_BY_FDI, TOOTH_TYPE, createDefaultTooth, getConditionColor, getSurfaceColor } from './toothData.js'
import LL1Svg from '../../../assets/charting/LL1.svg?raw'
import LL3Svg from '../../../assets/charting/LL3.svg?raw'
import LL4Svg from '../../../assets/charting/LL4.svg?raw'
import LL5Svg from '../../../assets/charting/LL5.svg?raw'
import LL6Svg from '../../../assets/charting/LL6.svg?raw'
import LL7Svg from '../../../assets/charting/LL7.svg?raw'
import LL8Svg from '../../../assets/charting/LL8.svg?raw'
import UL1Svg from '../../../assets/charting/UL1.svg?raw'
import UL2Svg from '../../../assets/charting/UL2.svg?raw'
import UL3Svg from '../../../assets/charting/UL3.svg?raw'
import UL4Svg from '../../../assets/charting/UL4.svg?raw'
import UL5Svg from '../../../assets/charting/UL5.svg?raw'
import UL6Svg from '../../../assets/charting/UL6.svg?raw'
import UL7Svg from '../../../assets/charting/UL7.svg?raw'
import UL8Svg from '../../../assets/charting/UL8.svg?raw'

const props = defineProps({
  fdi: { type: Number, required: true },
  orientation: { type: String, default: 'upper' },
  isSelected: { type: Boolean, default: false },
  label: { type: String, default: '' },
  tooth: { type: Object, default: () => createDefaultTooth(null) },
})

const RAW_SVGS = {
  LL1: LL1Svg,
  LL3: LL3Svg,
  LL4: LL4Svg,
  LL5: LL5Svg,
  LL6: LL6Svg,
  LL7: LL7Svg,
  LL8: LL8Svg,
  UL1: UL1Svg,
  UL2: UL2Svg,
  UL3: UL3Svg,
  UL4: UL4Svg,
  UL5: UL5Svg,
  UL6: UL6Svg,
  UL7: UL7Svg,
  UL8: UL8Svg,
}

function parseSvgGeometry(svgText) {
  if (!svgText) return null
  const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/i)
  const widthMatch = svgText.match(/width="([^"]+)"/i)
  const heightMatch = svgText.match(/height="([^"]+)"/i)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${widthMatch?.[1] || '48'} ${heightMatch?.[1] || '82'}`
  const paths = [...svgText.matchAll(/<path\s+([^>]+?)\s*\/?>/gi)]
    .map(([, attrs]) => {
      const read = (attr) => attrs.match(new RegExp(`${attr}="([^"]+)"`, 'i'))?.[1]
      const d = read('d')
      if (!d) return null
      return {
        d,
        fill: read('fill') || 'none',
        fillOpacity: read('fill-opacity'),
        stroke: read('stroke'),
        strokeWidth: read('stroke-width'),
        strokeLinejoin: read('stroke-linejoin'),
        strokeLinecap: read('stroke-linecap'),
        strokeMiterlimit: read('stroke-miterlimit'),
      }
    })
    .filter(Boolean)
  return paths.length ? { viewBox, paths } : null
}

const STATIC_GEOMETRY = Object.fromEntries(
  Object.entries(RAW_SVGS).map(([name, svg]) => [name, parseSvgGeometry(svg)])
)

const toothMeta = computed(() => TEETH_BY_FDI[props.fdi] || null)
const quadrant = computed(() => Math.floor(props.fdi / 10))
const toothIndex = computed(() => props.fdi % 10)
const mirrored = computed(() => [1, 4, 5, 8].includes(quadrant.value))
const clipId = computed(() => `tooth-profile-clip-${props.fdi}-${props.orientation}`)
const hatchId = computed(() => `tooth-profile-hatch-${props.fdi}-${props.orientation}`)
const assetName = computed(() => {
  if (props.orientation === 'upper') return `UL${toothIndex.value}`
  if (toothIndex.value === 2) return 'LL1'
  return `LL${toothIndex.value}`
})

const geometry = computed(() => STATIC_GEOMETRY[assetName.value] || null)

const strokeColor = computed(() => (props.isSelected ? '#0061FB' : '#1D1D1B'))
const family = computed(() => {
  const type = toothMeta.value?.type
  if (type === TOOTH_TYPE.MOLAR) return 'molar'
  if (type === TOOTH_TYPE.PREMOLAR) return 'premolar'
  if (type === TOOTH_TYPE.CANINE) return 'canine'
  return 'incisor'
})
const renderWidth = computed(() => {
  if (family.value === 'molar') return 52
  if (family.value === 'premolar') return 42
  return 34
})
const renderHeight = computed(() => {
  if (family.value === 'molar') return 84
  if (family.value === 'premolar') return 78
  return 74
})
const VB_WIDTH_VALUE = computed(() => {
  if (!geometry.value) return 48
  const [, , width = '48'] = geometry.value.viewBox.split(/\s+/)
  return Number(width) || 48
})
const VB_HEIGHT_VALUE = computed(() => {
  if (!geometry.value) return 82
  const [, , , height = '82'] = geometry.value.viewBox.split(/\s+/)
  return Number(height) || 82
})
const groupTransform = computed(() => {
  if (!geometry.value) return ''
  const [, , width = '0', height = '0'] = geometry.value.viewBox.split(/\s+/)
  const vbWidth = Number(width) || 0
  const transforms = []
  if (mirrored.value) transforms.push(`translate(${vbWidth} 0) scale(-1 1)`)
  return transforms.join(' ')
})
const completionBadgeTransform = computed(() => `translate(${VB_WIDTH_VALUE.value - 7} 7)`)
const fracturePath = computed(() => `M ${VB_WIDTH_VALUE.value * 0.32} ${VB_HEIGHT_VALUE.value * 0.18} L ${VB_WIDTH_VALUE.value * 0.68} ${VB_HEIGHT_VALUE.value * 0.78}`)
const implantMarkerY = computed(() => props.orientation === 'upper' ? VB_HEIGHT_VALUE.value * 0.24 : VB_HEIGHT_VALUE.value * 0.76)
const bridgeBarY = computed(() => props.orientation === 'upper' ? VB_HEIGHT_VALUE.value * 0.68 : VB_HEIGHT_VALUE.value * 0.28)

function regionBox(region) {
  const w = VB_WIDTH_VALUE.value
  const h = VB_HEIGHT_VALUE.value
  const upper = props.orientation === 'upper'
  const crownTop = upper ? h * 0.52 : h * 0.10
  const crownHeight = h * 0.30
  if (region === 'occlusal') return { x: w * 0.18, y: upper ? h * 0.68 : h * 0.12, width: w * 0.64, height: h * 0.14 }
  if (region === 'buccal') return { x: w * 0.16, y: crownTop + h * 0.06, width: w * 0.68, height: crownHeight * 0.55 }
  if (region === 'lingual') return { x: w * 0.22, y: crownTop + h * 0.12, width: w * 0.56, height: crownHeight * 0.46 }
  if (region === 'mesial') return mirrored.value
    ? { x: w * 0.52, y: crownTop, width: w * 0.24, height: crownHeight }
    : { x: w * 0.24, y: crownTop, width: w * 0.24, height: crownHeight }
  if (region === 'distal') return mirrored.value
    ? { x: w * 0.24, y: crownTop, width: w * 0.24, height: crownHeight }
    : { x: w * 0.52, y: crownTop, width: w * 0.24, height: crownHeight }
  return null
}

const surfaceOverlays = computed(() => {
  const surfaces = props.tooth?.surfaces || {}
  return Object.entries(surfaces)
    .filter(([, surface]) => surface?.condition)
    .map(([surfaceName, surface]) => {
      const box = regionBox(surfaceName)
      if (!box) return null
      return {
        ...box,
        fill: getSurfaceColor(surface.condition, surface.status),
        opacity: surface.status === 'planned' ? 0.7 : 1,
      }
    })
    .filter(Boolean)
})

const fullToothCondition = computed(() => {
  const condition = props.tooth?.toothCondition
  return condition && CONDITIONS[condition]?.fullTooth ? condition : null
})
const fullToothFill = computed(() => {
  const condition = fullToothCondition.value
  if (!condition) return ''
  if (condition === 'missing') return '#9e9e9e'
  if (condition === 'bridge') return '#fb8c00'
  if (condition === 'veneer') return '#7e57c2'
  return getConditionColor(condition)
})
const fullToothOpacity = computed(() => {
  const status = props.tooth?.toothConditionStatus
  if (!fullToothCondition.value) return 0
  if (fullToothCondition.value === 'missing') return 0.14
  if (status === 'planned') return 0.16
  if (status === 'completed') return 0.24
  return 0.12
})
const fullToothOutline = computed(() => {
  if (!fullToothCondition.value || fullToothCondition.value === 'missing') return ''
  return getConditionColor(fullToothCondition.value)
})
const plannedOverlay = computed(() => {
  if (props.tooth?.toothConditionStatus === 'planned' && fullToothCondition.value) return true
  return Object.values(props.tooth?.surfaces || {}).some((surface) => surface?.condition && surface?.status === 'planned')
})
const hasAllCompleted = computed(() => {
  const conditioned = Object.values(props.tooth?.surfaces || {}).filter((surface) => surface?.condition)
  if (conditioned.length) return conditioned.every((surface) => surface.status === 'completed')
  return props.tooth?.toothCondition && props.tooth?.toothConditionStatus === 'completed'
})
</script>

<style scoped>
.tooth-profile {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.tooth-profile__svg {
  display: block;
  overflow: visible;
}

.tooth-profile--selected .tooth-profile__svg {
  filter: drop-shadow(0 0 3px rgba(0, 97, 251, 0.35));
}

.tooth-profile__fallback {
  border: 1.5px solid #1d1d1b;
  border-radius: 42% 42% 35% 35% / 20% 20% 80% 80%;
  background: #fceeeb;
}
</style>
