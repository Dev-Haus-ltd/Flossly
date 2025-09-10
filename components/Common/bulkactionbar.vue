<template>
  <transition name="fade">
    <div
      v-if="store.isOpen"
      ref="barRef"
      class="bulk-bar"
      :class="{ 'dragged': hasDragged }"
      :style="barStyle"
      @mousedown.left.prevent.stop="onMouseDown"
    >
      <div class="bar-content" @mousedown.stop>
        <!-- Left Section (Count with circle icon and text) -->
        <div class="left">
          <div class="circle-icon">
            <span class="count">{{ store.count }}</span>
          </div>
          <span class="context-text">{{ contextLabel }}</span>
        </div>

        <!-- Right Section (Action Buttons and Cross Icon) -->
        <div class="right">
          <!-- First Action Button -->
          <div class="action-button first" @click.stop="store.confirm">
            <div class="action-icon-wrap">
              <component :is="isIconName(store.icon1) ? 'v-icon' : 'v-img'"
                         v-bind="iconBind(store.icon1)" />
            </div>
            <span class="action-text">{{ store.action1Label }}</span>
          </div>

          <!-- Second Action Button (Extra Action) -->
          <div v-if="store.extraAction" class="action-button second" @click.stop="store.extraActionHandler">
            <div class="action-icon-wrap">
              <component :is="isIconName(store.icon2) ? 'v-icon' : 'v-img'"
                         v-bind="iconBind(store.icon2)" />
            </div>
            <span class="action-text">{{ store.action2Label }}</span>
          </div>

          <!-- Solid Line -->
          <div class="solid-line"></div>

          <!-- Close (Cross) Icon -->
          <div class="close-icon" @click.stop="store.cancel()">
            <v-icon>mdi-close</v-icon>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
defineOptions({ name: 'BulkActionBar' })
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue'
import { useMyBulkactionbarStore } from '~/stores/bulkactionbar'

const store = useMyBulkactionbarStore()

// Draggable state
const barRef = ref<HTMLElement | null>(null)
const pos = reactive({ x: 0, y: 0 })
const hasDragged = ref(false)
let dragging = false
let offsetX = 0
let offsetY = 0

const defaultBottom = 24 // px above the bottom
const barStyle = computed(() => {
  if (!hasDragged.value) {
    return {
      left: '50%',
      bottom: defaultBottom + 'px',
      transform: 'translateX(-50%)',
    } as Record<string, string>
  }
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    transform: 'none',
  } as Record<string, string>
})

const contextLabel = computed(() => {
  if (store.context === 'rota') return 'rotas'
  return 'items'
})

const actionLabel = computed(() => {
  const verb = store.label ? store.label : 'Apply'
  return `${verb} (${store.count})`
})

function onMouseDown(ev: MouseEvent) {
  const target = ev.target as HTMLElement
  if (target.closest('.right')) return

  const rect = barRef.value?.getBoundingClientRect()
  if (!rect) return
  dragging = true
  hasDragged.value = true
  offsetX = ev.clientX - rect.left
  offsetY = ev.clientY - rect.top
  pos.x = rect.left
  pos.y = rect.top
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(ev: MouseEvent) {
  if (!dragging) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const rect = barRef.value?.getBoundingClientRect()
  const bw = rect?.width || 320
  const bh = rect?.height || 56
  let nextX = ev.clientX - offsetX
  let nextY = ev.clientY - offsetY
  nextX = Math.max(8, Math.min(vw - bw - 8, nextX))
  nextY = Math.max(8, Math.min(vh - bh - 8, nextY))
  pos.x = nextX
  pos.y = nextY
}

function onMouseUp() {
  dragging = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onMounted(() => {})

onBeforeUnmount(() => {
  onMouseUp()
})

// Helpers to render either a Vuetify icon name (mdi-*) or an image URL/module
function isIconName(val: unknown): val is string {
  return typeof val === 'string' && /^(mdi-|fa-|bi-)/i.test(val)
}

function iconBind(val: unknown) {
  // v-icon case
  if (typeof val === 'string' && isIconName(val)) {
    return { icon: val }
  }
  // v-img case: string URL or imported module with default
  if (typeof val === 'string') {
    return { src: val, width: 20, height: 20, cover: true }
  }
  if (val && typeof val === 'object' && 'default' in (val as any) && typeof (val as any).default === 'string') {
    return { src: (val as any).default, width: 20, height: 20, cover: true }
  }
  // Fallback to an icon placeholder
  return { icon: 'mdi-image' }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bulk-bar {
  position: fixed;
  z-index: 2000;
  background: #ffffff;
  border: 1px solid #E6E6E6;
  border-radius: 12px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 3px 6px -4px rgba(0, 0, 0, 0.25);
  padding: 8px 12px;
  min-width: 320px;
  max-width: calc(100vw - 32px);
  cursor: grab;
}
.bulk-bar.dragged { cursor: grabbing; }

.bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
  color: #1e1e1e;
}
.circle-icon {
  width: 32px;
  height: 32px;
  background: #213536;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.count {
  font-weight: 600;
  color: #ffffff;
}
.context-text {
  font-weight: 400;
  font-size: 14px;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 8px;
  background: #F5F5F5; /* Customize if needed */
  border-radius: 8px;
}

.first {
  width: 273px;
  background: #F5F5F5;
}

.second {
  width: 55px;
  background: #FFFFFF;
}

.action-text {
  font-family: Poppins, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #1E1E1E;
}

.solid-line {
  width: 44px;
  height: 0px;
  border: 1px solid #DBDBDB;
  transform: rotate(-90deg);
}

.close-icon {
  width: 24px;
  height: 24px;
}

.action-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;
}
</style>
