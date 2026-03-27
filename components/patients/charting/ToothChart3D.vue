<template>
  <div ref="containerEl" class="chart-3d-container">
    <div class="chart-3d-controls">
      <v-chip size="x-small" class="mr-2">Scroll to zoom · Drag to rotate</v-chip>
      <v-btn size="x-small" variant="outlined" @click="resetCamera">Reset View</v-btn>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TEETH_BY_FDI, TOOTH_TYPE, UPPER_ARCH, LOWER_ARCH, getConditionColor, CONDITIONS } from './toothData.js'

const props = defineProps({
  chart:            { type: Object,  default: () => ({}) },
  notation:         { type: String,  default: 'FDI' },
  activeCondition:  { type: String,  default: null },
  selectedToothFdi: { type: Number,  default: null },
})
const emit = defineEmits(['surface-click', 'tooth-click'])

// ── Arch order (screen left → right = patient right → left) ───────────────
const UPPER_ORDER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_ORDER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// Elliptical arch params
const AX = 5.4   // X semi-axis
const AZ = 3.8   // Z semi-axis

// Y levels for each arch (cervical / gum line)
const UPPER_Y =  0.0
const LOWER_Y = -2.8

function archPos(fdi, order, y) {
  const i = order.indexOf(fdi)
  if (i < 0) return null
  const t = (i / (order.length - 1)) * Math.PI  // 0 → π
  return new THREE.Vector3(AX * Math.cos(t), y, -AZ * Math.sin(t))
}

// ── Tooth LatheGeometry profiles ──────────────────────────────────────────
// Each point is [radius, height].
// Y = 0 = cervical (gum line), Y > 0 = crown, Y < 0 = root.
// Lathe revolves around Y axis, so the result is radially symmetric.

function makeProfile(type) {
  switch (type) {
    case TOOTH_TYPE.INCISOR:
      return [
        new THREE.Vector2(0.02, 1.55),
        new THREE.Vector2(0.20, 1.32),
        new THREE.Vector2(0.40, 0.98),
        new THREE.Vector2(0.52, 0.62),
        new THREE.Vector2(0.54, 0.28),
        new THREE.Vector2(0.46, 0.0),
        new THREE.Vector2(0.33, -0.28),
        new THREE.Vector2(0.19, -0.70),
        new THREE.Vector2(0.09, -1.10),
        new THREE.Vector2(0.02, -1.45),
      ]
    case TOOTH_TYPE.CANINE:
      return [
        new THREE.Vector2(0.02, 1.75),
        new THREE.Vector2(0.22, 1.50),
        new THREE.Vector2(0.44, 1.12),
        new THREE.Vector2(0.54, 0.70),
        new THREE.Vector2(0.54, 0.30),
        new THREE.Vector2(0.45, 0.0),
        new THREE.Vector2(0.33, -0.30),
        new THREE.Vector2(0.20, -0.75),
        new THREE.Vector2(0.09, -1.20),
        new THREE.Vector2(0.02, -1.58),
      ]
    case TOOTH_TYPE.PREMOLAR:
      return [
        new THREE.Vector2(0.44, 1.22),
        new THREE.Vector2(0.52, 1.00),
        new THREE.Vector2(0.56, 0.68),
        new THREE.Vector2(0.53, 0.34),
        new THREE.Vector2(0.44, 0.0),
        new THREE.Vector2(0.33, -0.28),
        new THREE.Vector2(0.20, -0.65),
        new THREE.Vector2(0.09, -1.05),
        new THREE.Vector2(0.02, -1.38),
      ]
    default: // MOLAR
      return [
        new THREE.Vector2(0.50, 1.12),
        new THREE.Vector2(0.56, 0.88),
        new THREE.Vector2(0.58, 0.58),
        new THREE.Vector2(0.55, 0.28),
        new THREE.Vector2(0.44, 0.0),
        new THREE.Vector2(0.34, -0.24),
        new THREE.Vector2(0.21, -0.58),
        new THREE.Vector2(0.10, -0.95),
        new THREE.Vector2(0.02, -1.25),
      ]
  }
}

// Non-uniform scale: [scaleX (mesial-distal), scaleY, scaleZ (buccal-lingual)]
// After lookAt, mesh localX ≈ arch-tangent (mesial-distal),
//                 mesh localZ ≈ toward-center (buccal-lingual).
const TOOTH_SCALE = {
  [TOOTH_TYPE.INCISOR]:  [1.62, 1.00, 0.60],
  [TOOTH_TYPE.CANINE]:   [1.05, 1.05, 0.82],
  [TOOTH_TYPE.PREMOLAR]: [1.10, 0.96, 0.95],
  [TOOTH_TYPE.MOLAR]:    [1.28, 0.88, 1.12],
}

// ── Colors ────────────────────────────────────────────────────────────────
const C_TOOTH    = new THREE.Color('#f0ece2')   // ivory enamel
const C_SELECTED = new THREE.Color('#3a8ffa')   // selected highlight
const C_MISSING  = new THREE.Color('#c0b9b0')   // greyed out
const C_GUM      = new THREE.Color('#c87b72')   // gingival tissue

// ── Scene state ───────────────────────────────────────────────────────────
const containerEl = ref(null)
let scene, camera, renderer, controls, animFrameId
const toothMeshes = {}   // fdi → THREE.Mesh
const raycaster   = new THREE.Raycaster()
const mouse       = new THREE.Vector2()

// ── Init ──────────────────────────────────────────────────────────────────
function initScene() {
  const el = containerEl.value
  if (!el) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#f6f4f0')
  scene.fog = new THREE.Fog('#f6f4f0', 28, 45)

  const w = el.clientWidth  || 600
  const h = el.clientHeight || 420

  camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 100)
  camera.position.set(0, 10, 15)
  camera.lookAt(0, -1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  el.appendChild(renderer.domElement)

  // Warm dental-operatory lighting
  scene.add(new THREE.AmbientLight(0xfff5e8, 0.55))

  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  key.position.set(4, 14, 8)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far  = 40
  key.shadow.camera.left = key.shadow.camera.bottom = -12
  key.shadow.camera.right = key.shadow.camera.top = 12
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xffddc8, 0.38)
  fill.position.set(-8, 4, -4)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(0xffffff, 0.22)
  rim.position.set(0, -3, -10)
  scene.add(rim)

  buildGums()
  ;[...UPPER_ARCH, ...LOWER_ARCH].forEach(fdi => buildTooth(fdi))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.08
  controls.minDistance    = 3
  controls.maxDistance    = 28
  controls.target.set(0, -1.4, 0)

  renderer.domElement.addEventListener('click', onCanvasClick)
  window.addEventListener('resize', onResize)
  animate()
}

// ── Gum tissue (TubeGeometry along arch curve) ────────────────────────────
function buildGums() {
  const mat = new THREE.MeshPhysicalMaterial({
    color:     C_GUM,
    roughness: 0.72,
    metalness: 0.0,
    clearcoat: 0.08,
  })

  ;[
    { order: UPPER_ORDER, y: UPPER_Y, upper: true  },
    { order: LOWER_ORDER, y: LOWER_Y, upper: false },
  ].forEach(({ order, y, upper }) => {
    // Sample arch curve points (one per tooth position)
    const pts = order.map((_, i) => {
      const t = (i / (order.length - 1)) * Math.PI
      return new THREE.Vector3(AX * Math.cos(t), y, -AZ * Math.sin(t))
    })

    // Extend slightly past end teeth
    const ext0 = pts[0].clone();             ext0.x += 1.1
    const extN = pts[pts.length - 1].clone(); extN.x -= 1.1
    const curve = new THREE.CatmullRomCurve3([ext0, ...pts, extN])

    const geo = new THREE.TubeGeometry(curve, 80, 0.56, 14, false)

    // Make the tube taller (Y) than wide so it wraps the neck of the tooth
    const yScale = 2.6
    const yShift = upper ? 0.62 : -0.62
    geo.applyMatrix4(new THREE.Matrix4().makeScale(1, yScale, 1))
    geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, yShift, 0))

    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    scene.add(mesh)
  })
}

// ── Individual tooth ───────────────────────────────────────────────────────
function buildTooth(fdi) {
  const meta = TEETH_BY_FDI[fdi]
  if (!meta) return

  const isUpper  = UPPER_ARCH.includes(fdi)
  const order    = isUpper ? UPPER_ORDER : LOWER_ORDER
  const y        = isUpper ? UPPER_Y     : LOWER_Y
  const pos      = archPos(fdi, order, y)
  if (!pos) return

  const type     = meta.type || TOOTH_TYPE.MOLAR
  const [sx, sy, sz] = TOOTH_SCALE[type] || TOOTH_SCALE[TOOTH_TYPE.MOLAR]

  // LatheGeometry (profile revolved around Y, 18 segments = smooth organic shape)
  const profile = makeProfile(type)
  const geo = new THREE.LatheGeometry(profile, 18)
  // Bake non-uniform XZ scale into geometry BEFORE rotation
  geo.applyMatrix4(new THREE.Matrix4().makeScale(sx, sy, sz))
  geo.computeVertexNormals()

  const toothData = props.chart[fdi]
  const color     = getToothColor(fdi, toothData)

  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness:          0.18,
    metalness:          0.0,
    clearcoat:          0.70,
    clearcoatRoughness: 0.08,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.userData.fdi = fdi
  mesh.castShadow   = true
  mesh.receiveShadow = true
  mesh.position.copy(pos)

  // Orient each tooth so its "depth" faces the arch center
  const center = new THREE.Vector3(0, y, 0)
  mesh.lookAt(center)

  // Upper teeth: flip so crown hangs down (root up into gum)
  if (isUpper) {
    mesh.rotateX(Math.PI)
    mesh.position.y -= 0.18   // expose crown below gum line
  } else {
    mesh.position.y += 0.18   // expose crown above gum line
  }

  scene.add(mesh)
  toothMeshes[fdi] = mesh
}

// ── Color helpers ─────────────────────────────────────────────────────────
function getToothColor(fdi, toothData) {
  if (fdi === props.selectedToothFdi) return C_SELECTED.clone()
  if (!toothData) return C_TOOTH.clone()
  if (toothData.missing) return C_MISSING.clone()
  if (toothData.toothCondition) return new THREE.Color(getConditionColor(toothData.toothCondition))
  const condSurf = Object.values(toothData.surfaces || {}).find(s => s.condition)
  if (condSurf) return new THREE.Color(getConditionColor(condSurf.condition))
  return C_TOOTH.clone()
}

function updateToothColors() {
  Object.entries(toothMeshes).forEach(([key, mesh]) => {
    if (!mesh) return
    const fdi  = Number(key)
    const isSelected = fdi === props.selectedToothFdi
    const c = isSelected ? C_SELECTED : getToothColor(fdi, props.chart[fdi])
    mesh.material.color.copy(c)
    mesh.material.emissive.set(isSelected ? '#0a2a5a' : '#000000')
    mesh.material.emissiveIntensity = isSelected ? 0.14 : 0
  })
}

// ── Render loop ───────────────────────────────────────────────────────────
function animate() {
  animFrameId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// ── Interaction ───────────────────────────────────────────────────────────
function onCanvasClick(e) {
  const el = containerEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1
  mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(Object.values(toothMeshes))
  if (!hits.length) return

  const hit = hits[0]
  const fdi = hit.object?.userData?.fdi
  if (!fdi) return

  const condition = props.activeCondition && CONDITIONS[props.activeCondition]
  if (!condition) {
    emit('tooth-click', fdi)
    return
  }

  if (condition.fullTooth && !condition.surface) {
    emit('tooth-click', fdi)
    return
  }

  // Approximate clicked surface from local hit point for surface-level conditions.
  const local = hit.object.worldToLocal(hit.point.clone())
  const surface = detectSurfaceFromLocalPoint(fdi, local)
  emit('surface-click', { fdi, surface })
}

function detectSurfaceFromLocalPoint(fdi, localPoint) {
  const absX = Math.abs(localPoint.x)
  const absY = Math.abs(localPoint.y)
  const absZ = Math.abs(localPoint.z)

  if (absY >= absX && absY >= absZ) {
    return 'occlusal'
  }

  if (absX >= absZ) {
    const mesialRight = !!TEETH_BY_FDI[fdi]?.mesialRight
    if (localPoint.x >= 0) return mesialRight ? 'mesial' : 'distal'
    return mesialRight ? 'distal' : 'mesial'
  }

  // Local +Z points toward arch center in this scene setup.
  return localPoint.z >= 0 ? 'lingual' : 'buccal'
}

function onResize() {
  const el = containerEl.value
  if (!el || !renderer) return
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(el.clientWidth, el.clientHeight)
}

function resetCamera() {
  camera.position.set(0, 10, 15)
  camera.lookAt(0, -1, 0)
  controls.target.set(0, -1.4, 0)
  controls.update()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
function destroyScene() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (controls) {
    controls.dispose()
    controls = null
  }
  if (scene) {
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      if (obj.geometry) obj.geometry.dispose()
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose())
      else if (obj.material) obj.material.dispose()
    })
  }
  Object.keys(toothMeshes).forEach((key) => { delete toothMeshes[key] })
  if (renderer) {
    renderer.domElement.removeEventListener('click', onCanvasClick)
    renderer.dispose()
    const el = containerEl.value
    if (el && renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
  }
  window.removeEventListener('resize', onResize)
  scene = null
  camera = null
  renderer = null
}

onMounted(initScene)
onUnmounted(destroyScene)

watch(() => [props.chart, props.selectedToothFdi], updateToothColors, { deep: true })
</script>

<style scoped>
.chart-3d-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f6f4f0;
  border-radius: 8px;
  overflow: hidden;
}

.chart-3d-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
