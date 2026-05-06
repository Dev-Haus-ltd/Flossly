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
      <template v-if="tooth.missing">
        <path :d="outlinePath" :transform="outlineTransform" fill="#f3f4f6" stroke="#d0d0d0" stroke-width="1.2" />
        <line
          :x1="missingX1"
          :y1="missingY1"
          :x2="missingX2"
          :y2="missingY2"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linecap="round"
        />
        <line
          :x1="missingX2"
          :y1="missingY1"
          :x2="missingX1"
          :y2="missingY2"
          stroke="#dc2626"
          stroke-width="2"
          stroke-linecap="round"
        />
      </template>

      <template v-else>
        <path
          :d="outlinePath"
          :transform="outlineTransform"
          :fill="isSelected ? '#EEF4FF' : '#fff'"
          :stroke="isSelected ? '#0061FB' : isBridgePending ? '#fb8c00' : '#202020'"
          :stroke-width="isSelected || isBridgePending ? 2 : 1.2"
        />

        <!-- surfaces via orderedSurfaceItems (handles single + multi-path surfaces) -->
        <path
          v-for="(item, i) in orderedSurfaceItems"
          :key="i"
          :d="item.d"
          :transform="`scale(${PATH_SCALE})`"
          :fill="sfColor(item.logicalName)"
          :stroke="sfStroke(item.logicalName)"
          stroke-width="0.9"
          class="tooth-surface"
          :class="{ 'tooth-surface--deletable': isSurfaceDeletable(item.logicalName) }"
          @click.stop="onSurface(item.logicalName)"
          @mousedown.stop="onSurfaceMouseDown(item.logicalName, $event)"
          @mouseenter="onSurfaceMouseEnter(item.logicalName, $event)"
          @mousemove="onSurfaceMouseMove(item.logicalName, $event)"
          @mouseleave="onSurfaceMouseLeave(item.logicalName)"
          @contextmenu.prevent
        />

        <g v-if="hoveredDeleteSurface && deleteBadgePosition" pointer-events="none">
          <circle :cx="deleteBadgePosition.x" :cy="deleteBadgePosition.y" r="7" fill="#dc2626" />
          <path
            :d="`M ${deleteBadgePosition.x - 3} ${deleteBadgePosition.y - 3} L ${deleteBadgePosition.x + 3} ${deleteBadgePosition.y + 3} M ${deleteBadgePosition.x + 3} ${deleteBadgePosition.y - 3} L ${deleteBadgePosition.x - 3} ${deleteBadgePosition.y + 3}`"
            stroke="#fff"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </g>

        <path
          v-if="isCrown"
          :d="outlinePath"
          :transform="outlineTransform"
          fill="none"
          :stroke="condColor(tooth.toothCondition)"
          stroke-width="4"
          stroke-linejoin="round"
        />

        <path
          v-if="tooth.toothCondition === 'veneer'"
          :d="veneerPath"
          :transform="outlineTransform"
          fill="none"
          :stroke="condColor('veneer')"
          stroke-width="4"
          stroke-linecap="round"
        />

        <path
          v-if="(tooth.toothCondition === 'rct' || tooth.toothCondition === 'post-core') && rctOverlayD"
          :d="rctOverlayD"
          :transform="`scale(${PATH_SCALE})`"
          :fill="condColor(tooth.toothCondition)"
          fill-opacity="0.9"
          pointer-events="none"
        />

        <line
          v-if="tooth.toothCondition === 'fracture'"
          :x1="fracture.x1"
          :y1="fracture.y1"
          :x2="fracture.x2"
          :y2="fracture.y2"
          :stroke="condColor('fracture')"
          stroke-width="1.5"
          stroke-dasharray="2,2"
        />

        <polygon
          v-if="tooth.implant || tooth.toothCondition === 'implant' || tooth.toothCondition === 'implant-crown'"
          :points="implantPoints"
          :fill="condColor('implant')"
        />

        <rect
          v-if="tooth.bridgeStart || tooth.bridgeEnd"
          :x="2"
          :y="centerY - 2.5"
          :width="VB - 4"
          height="5"
          :fill="condColor('bridge')"
          fill-opacity="0.55"
          pointer-events="none"
        />

        <path
          v-if="tooth.bridgePontic"
          :d="outlinePath"
          :transform="outlineTransform"
          fill="#fb8c00"
          fill-opacity="0.12"
          pointer-events="none"
        />

        <path
          v-if="hasAnyPlanned"
          :d="outlinePath"
          :transform="outlineTransform"
          :fill="`url(#planned-hatch-${fdi})`"
          pointer-events="none"
        />

        <g v-if="hasAllCompleted" pointer-events="none">
          <circle :cx="VB - 7" cy="7" r="5" fill="#43a047" />
          <polyline
            :points="`${VB - 10},7 ${VB - 7},10 ${VB - 4},4`"
            fill="none"
            stroke="white"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </g>

        <path
          v-if="isSelected"
          :d="outlinePath"
          :transform="outlineTransform"
          fill="none"
          stroke="#0061FB"
          stroke-width="1.5"
          stroke-dasharray="3,2"
        />
      </template>

      <defs>
        <pattern :id="`planned-hatch-${fdi}`" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30,136,229,0.2)" stroke-width="2" />
        </pattern>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { CONDITIONS, TEETH_BY_FDI, TOOTH_TYPE, getConditionColor, getSurfaceColor } from './toothData.js'
import { OCCLUSAL_PATHS, OCCLUSAL_SOURCE_VIEWBOX, OCCLUSAL_VIEWBOX } from './toothPaths.js'

const props = defineProps({
  fdi:             { type: Number, required: true },
  tooth:           { type: Object, required: true },
  mesialRight:     { type: Boolean, default: false },
  isSelected:      { type: Boolean, default: false },
  activeCondition: { type: String, default: null },
  isBridgePending: { type: Boolean, default: false },
  size:            { type: Number, default: 44 },
})

const emit = defineEmits(['surface-click', 'tooth-click'])

const VB = OCCLUSAL_VIEWBOX
const PATH_SCALE = OCCLUSAL_VIEWBOX / OCCLUSAL_SOURCE_VIEWBOX
const SIZE = computed(() => props.size)
const centerX = VB / 2
const centerY = VB / 2

const toothMeta = computed(() => TEETH_BY_FDI[props.fdi] || null)
const occlusalFamily = computed(() => {
  const type = toothMeta.value?.type
  if (type === TOOTH_TYPE.MOLAR)    return 'molar'
  if (type === TOOTH_TYPE.PREMOLAR) return 'premolar'
  return 'anterior'
})
const geometry = computed(() => OCCLUSAL_PATHS[occlusalFamily.value] || OCCLUSAL_PATHS.molar)
const outlinePath = computed(() => geometry.value.outline)
const surfacePaths = computed(() => geometry.value.surfaces)
const outlineTransform = computed(() => `scale(${PATH_SCALE})`)

const leftSurface = computed(() => (props.mesialRight ? 'distal' : 'mesial'))
const rightSurface = computed(() => (props.mesialRight ? 'mesial' : 'distal'))

const missingX1 = computed(() => 12)
const missingY1 = computed(() => 12)
const missingX2 = computed(() => VB - 12)
const missingY2 = computed(() => VB - 12)

const fracture = computed(() => ({
  x1: 14,
  y1: 8,
  x2: 38,
  y2: 43,
}))

const implantPoints = computed(() => (
  `${centerX},${centerY - 15} ${centerX + 4},${centerY - 10} ${centerX},${centerY - 5} ${centerX - 4},${centerY - 10}`
))

// Ordered surface draw list — handles both single { d } and array [{ d }, { d }] surfaces.
// Array surfaces (molar buccal/lingual/occlusal) render as separate <path> elements so
// each sub-section hovers independently while all fire the same logical surface click.
const SURFACE_DRAW_ORDER = ['buccal', 'lingual', 'left', 'right', 'occlusal']
const orderedSurfaceItems = computed(() => {
  const result = []
  for (const key of SURFACE_DRAW_ORDER) {
    const sf = surfacePaths.value[key]
    if (!sf) continue
    const logicalName = key === 'left' ? leftSurface.value
      : key === 'right' ? rightSurface.value
      : key
    const items = Array.isArray(sf) ? sf : [sf]
    for (const item of items) {
      result.push({ logicalName, d: item.d })
    }
  }
  return result
})

// RCT/post-core overlay path — only valid for single-path occlusal (premolar/anterior).
// Multi-path occlusal (molar inner circle) is skipped to avoid partial overlap.
const rctOverlayD = computed(() => {
  const occ = surfacePaths.value.occlusal
  if (!occ || Array.isArray(occ)) return null
  return occ.d
})

const veneerPath = computed(() => 'M 15 12 C 11 18 11 34 15 40')
const hoveredDeleteSurface = ref(null)
const hoverPoint = ref(null)
const rightDragSurfaces = ref([])
const isRightDragging = ref(false)

function surfaceTransform(surface) {
  return surface?.transform
    ? `scale(${PATH_SCALE}) ${surface.transform}`
    : `scale(${PATH_SCALE})`
}

function sfColor(surface) {
  const sf = props.tooth.surfaces?.[surface]
  if (!sf?.condition) return '#f7f7f7'
  return getSurfaceColor(sf.condition, sf.status)
}

function sfStroke(surface) {
  const sf = props.tooth.surfaces?.[surface]
  return sf?.condition ? 'transparent' : '#b8b8b8'
}

function condColor(cond) {
  return getConditionColor(cond)
}

const isCrown = computed(() => {
  const c = props.tooth.toothCondition
  return c === 'crown' || c === 'crown-gold' || c === 'crown-zirconia'
})

const hasAnyPlanned = computed(() => {
  const t = props.tooth
  if (t.toothConditionStatus === 'planned') return true
  return Object.values(t.surfaces || {}).some((s) => s.status === 'planned')
})

const hasAllCompleted = computed(() => {
  const t = props.tooth
  const conditioned = Object.values(t.surfaces || {}).filter((s) => s.condition)
  return conditioned.length > 0 && conditioned.every((s) => s.status === 'completed')
})

const deleteBadgePosition = computed(() => {
  if (!hoverPoint.value) return null
  return {
    x: Math.max(8, Math.min(VB - 8, hoverPoint.value.x)),
    y: Math.max(8, Math.min(VB - 8, hoverPoint.value.y)),
  }
})

function isSurfaceDeletable(surface) {
  return !!props.tooth.surfaces?.[surface]?.condition
}

function pointFromEvent(event) {
  const rect = event.currentTarget?.ownerSVGElement?.getBoundingClientRect?.() || event.currentTarget?.getBoundingClientRect?.()
  if (!rect) return null
  const scaleX = VB / rect.width
  const scaleY = VB / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function onSurfaceMouseMove(surface, event) {
  if (isSurfaceDeletable(surface)) {
    hoveredDeleteSurface.value = surface
    hoverPoint.value = pointFromEvent(event)
  } else if (hoveredDeleteSurface.value === surface) {
    hoveredDeleteSurface.value = null
    hoverPoint.value = null
  }
}

function onSurfaceMouseEnter(surface, event) {
  if (isRightDragging.value && event.buttons === 2) {
    if (!rightDragSurfaces.value.includes(surface)) rightDragSurfaces.value.push(surface)
  }
  onSurfaceMouseMove(surface, event)
}

function onSurfaceMouseLeave(surface) {
  if (hoveredDeleteSurface.value !== surface) return
  hoveredDeleteSurface.value = null
  hoverPoint.value = null
}

function finishRightDrag() {
  if (!isRightDragging.value) return
  const surfaces = [...rightDragSurfaces.value]
  isRightDragging.value = false
  rightDragSurfaces.value = []
  if (!surfaces.length) return
  emit('surface-click', {
    fdi: props.fdi,
    surface: surfaces[0],
    surfaces,
    combine: surfaces.length > 1,
  })
}

function onSurfaceMouseDown(surface, event) {
  if (event.button !== 2) return
  event.preventDefault()
  event.stopPropagation()
  isRightDragging.value = true
  rightDragSurfaces.value = [surface]
}

function onSurface(surface) {
  if (isRightDragging.value) return
  if (isSurfaceDeletable(surface)) {
    emit('surface-click', { fdi: props.fdi, surface, surfaces: [surface], remove: true })
    return
  }
  emit('surface-click', { fdi: props.fdi, surface, surfaces: [surface] })
}

function onToothBodyClick() {
  const cond = props.activeCondition
  if (cond && CONDITIONS[cond]?.fullTooth) {
    emit('surface-click', { fdi: props.fdi, surface: null })
    return
  }
  emit('tooth-click', props.fdi)
}

onMounted(() => {
  window.addEventListener('mouseup', finishRightDrag)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', finishRightDrag)
})
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

.tooth-svg--cursor {
  cursor: crosshair;
}

.tooth-surface {
  cursor: crosshair;
  transition: filter 0.1s;
}

.tooth-surface--deletable {
  cursor: not-allowed;
}

.tooth-surface:hover {
  filter: brightness(0.85);
}

.tooth--selected .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(0, 97, 251, 0.35));
}

.tooth--bridge-pending .tooth-svg {
  filter: drop-shadow(0 0 3px rgba(251, 140, 0, 0.5));
}
</style>
