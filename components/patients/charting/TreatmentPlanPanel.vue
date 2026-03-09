<template>
  <div class="tp-panel">

    <!-- ── Header bar ────────────────────────────────────────────── -->
    <div class="tp-header">
      <div class="tp-header__left">
        <div class="tp-plans-wrap">
          <button
            v-if="canScrollLeft"
            class="tp-scroll-btn tp-scroll-btn--left"
            title="Scroll plans left"
            @click="scrollPlans('left')"
          >
            <v-icon size="16">mdi-chevron-left</v-icon>
          </button>
          <div ref="plansScrollEl" class="tp-plans-scroll" @wheel.prevent="onPlansWheel">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="tp-plan-tab"
              :class="{ 'tp-plan-tab--active': plan.id === resolvedActivePlanId }"
              :style="planStyle(plan, plan.id === resolvedActivePlanId)"
              @click="onSelectPlan(plan.id, true)"
            >
              <span class="tp-plan-tab__text">{{ plan.name }}</span>
              <v-menu location="bottom start" :offset="6">
                <template #activator="{ props: menuProps }">
                  <button class="tp-plan-tab__menu" v-bind="menuProps" @click.stop>
                    <v-icon size="16">mdi-dots-horizontal</v-icon>
                  </button>
                </template>
                <v-list density="compact" min-width="220">
                  <v-list-item title="Rename Plan" @click="onRenamePlan(plan.id, plan.name)" />
                  <v-list-item title="Duplicate Plan" @click="onDuplicatePlan(plan.id)" />
                  <v-list-item title="Delete Plan" @click="onDeletePlan(plan.id)" />
                  <v-divider />
                  <v-list-subheader>Plan Color</v-list-subheader>
                  <div class="tp-plan-colors">
                    <button
                      v-for="color in planColors"
                      :key="`${plan.id}-${color}`"
                      class="tp-plan-color-btn"
                      :style="{ background: color }"
                      :title="`Set color ${color}`"
                      @click.stop="onUpdatePlanColor(plan.id, color)"
                    />
                  </div>
                </v-list>
              </v-menu>
            </div>
          </div>
          <button
            v-if="canScrollRight"
            class="tp-scroll-btn tp-scroll-btn--right"
            title="Scroll plans right"
            @click="scrollPlans('right')"
          >
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
        <button class="tp-add-plan-btn" title="Add treatment plan" @click="openCreatePlanDrawer">
          <v-icon size="16">mdi-plus</v-icon>
        </button>
      </div>

      <div class="tp-header__right">
        <!-- Base Chart toggle -->
        <button
          class="tp-hdr-btn"
          :class="{ 'tp-hdr-btn--active': activeView === 'chart' }"
          @click="activeView = 'chart'"
        >Base Chart</button>

        <!-- Images -->
        <button class="tp-hdr-btn" @click="activeView = 'images'">
          <v-icon size="15" class="mr-1">mdi-image-outline</v-icon>Images
        </button>

        <!-- History -->
        <button class="tp-hdr-btn" @click="activeView = 'history'">
          <v-icon size="15" class="mr-1">mdi-history</v-icon>History
        </button>
      </div>
    </div>

    <!-- ── Appointment groups ─────────────────────────────────────── -->
    <div v-if="activeView === 'chart'" class="tp-body">

      <!-- Empty state -->
      <div v-if="!appointments.length && !items.length" class="tp-empty">
        <v-icon size="36" color="grey-lighten-2">mdi-tooth-outline</v-icon>
        <p>No treatment items yet.</p>
        <p class="tp-empty__hint">Select a treatment code and click a tooth to add items.</p>
      </div>

      <div
        v-for="appt in appointments"
        :key="appt.id"
        class="tp-appt-group"
      >
        <!-- Appointment header -->
        <div class="tp-appt-header">
          <span class="tp-appt-name">{{ appt.name }}</span>
          <div class="tp-appt-header__right">
            <span
              v-if="appt.status === 'completed'"
              class="tp-appt-completed-badge"
            >
              Completed
              <v-icon size="12">mdi-chevron-down</v-icon>
            </span>
            <button class="tp-appt-icon-btn tp-appt-icon-btn--danger" title="Delete appointment" @click="$emit('delete-appointment', appt.id)">
              <v-icon size="15">mdi-trash-can-outline</v-icon>
            </button>
            <button class="tp-appt-icon-btn" title="Link">
              <v-icon size="15" @click="$emit('link-appointment', appt.id)">mdi-link-variant</v-icon>
            </button>
            <button
              class="tp-appt-icon-btn"
              :class="{ 'tp-appt-icon-btn--scheduled': appt.status === 'scheduled' || appt.diaryAppointmentId }"
              title="Book in Diary"
              @click="$emit('book-appointment', appt.id)"
            >
              <v-icon
                size="15"
                :color="(appt.status === 'scheduled' || appt.diaryAppointmentId) ? 'success' : undefined"
              >mdi-calendar-outline</v-icon>
            </button>
          </div>
        </div>

        <!-- Items for this appointment -->
        <div class="tp-appt-items">
          <div
            v-for="item in itemsForAppt(appt.id)"
            :key="item.id || item._tempId"
            class="tp-item"
          >
            <!-- Chevron circle button -->
            <button class="tp-item__chevron-btn">
              <v-icon size="14" color="white">mdi-chevron-right</v-icon>
            </button>

            <!-- Clinician -->
            <span class="tp-item__clinician">{{ item.clinicianName || 'Unassigned' }} <span class="tp-item__private">(Private)</span></span>

            <!-- Tooth label -->
            <span class="tp-item__tooth">{{ toothLabel(item) }}</span>

            <!-- Treatment name -->
            <span class="tp-item__name">{{ item.conditionLabel }}</span>

            <!-- Document icon -->
            <v-icon size="16" color="grey-lighten-1" class="tp-item__doc">mdi-file-document-outline</v-icon>

            <!-- Spacer -->
            <div class="tp-item__spacer" />

            <!-- Date -->
            <span class="tp-item__date">{{ formatDate(item.createdAt) }}</span>

            <!-- Duration -->
            <input
              class="tp-item__duration-input"
              type="number"
              min="0"
              step="5"
              :value="item.duration || 0"
              @change="updateItem(item, { duration: Number($event.target.value || 0) })"
            />

            <!-- Price -->
            <span class="tp-item__price">{{ currencySymbol }}{{ formatCost(item.cost) }}</span>
            <input
              class="tp-item__price-input"
              type="number"
              min="0"
              step="0.01"
              :value="formatCost(item.cost)"
              @change="updateItem(item, { cost: Number($event.target.value || 0) })"
            />
            <select
              class="tp-item__status"
              :value="item.status || 'planned'"
              @change="updateItem(item, { status: $event.target.value })"
            >
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
            </select>
            <div class="tp-item__actions">
              <button
                class="tp-item__icon-btn"
                title="Move up"
                :disabled="!canMove(appt.id, item, -1)"
                @click="moveItem(appt.id, item, -1)"
              >
                <v-icon size="14">mdi-chevron-up</v-icon>
              </button>
              <button
                class="tp-item__icon-btn"
                title="Move down"
                :disabled="!canMove(appt.id, item, 1)"
                @click="moveItem(appt.id, item, 1)"
              >
                <v-icon size="14">mdi-chevron-down</v-icon>
              </button>
              <button class="tp-item__icon-btn tp-item__icon-btn--danger" title="Remove item" @click="$emit('remove', item.id || item._tempId)">
                <v-icon size="14">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>

          <!-- Empty appointment placeholder -->
          <div v-if="!itemsForAppt(appt.id).length" class="tp-appt-empty">
            No items in this appointment
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="activeView === 'images'" class="tp-body">
      <div class="tp-images-toolbar">
        <v-file-input
          accept="image/*"
          density="compact"
          variant="outlined"
          hide-details
          prepend-icon="mdi-image-plus"
          label="Add image"
          @update:model-value="onImagePicked"
        />
      </div>
      <div v-if="!images.length" class="tp-appt-empty">No images uploaded</div>
      <div class="tp-images-grid">
        <div v-for="img in images" :key="img.id" class="tp-image-card">
          <img :src="img.url" :alt="img.name" class="tp-image" />
          <div class="tp-image-meta">
            <span class="tp-image-name">{{ img.name }}</span>
            <button class="tp-item__icon-btn tp-item__icon-btn--danger" @click="$emit('remove-image', img.id)">
              <v-icon size="14">mdi-trash-can-outline</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="tp-body">
      <div v-if="!history.length" class="tp-appt-empty">No history yet</div>
      <div v-for="entry in history" :key="entry.id" class="tp-history-item">
        <div class="tp-history-title">{{ entry.action }}</div>
        <div class="tp-history-sub">{{ entry.details }}</div>
        <div class="tp-history-time">{{ formatDate(entry.at) }}</div>
      </div>
    </div>

    <!-- ── Footer ────────────────────────────────────────────────── -->
    <div class="tp-footer">
      <v-btn
        variant="outlined"
        size="small"
        rounded="lg"
        prepend-icon="mdi-calendar-plus"
        @click="$emit('add-appointment')"
      >
        Add Appointment
      </v-btn>
      <v-btn
        variant="outlined"
        size="small"
        rounded="lg"
        prepend-icon="mdi-clock-outline"
        @click="$emit('set-interval')"
      >
        Set Interval
      </v-btn>
      <div class="tp-footer__total">
        <span class="tp-footer__total-label">Total</span>
        <span class="tp-footer__total-value">{{ currencySymbol }}{{ totalFormatted }}</span>
      </div>
    </div>
    <v-navigation-drawer
      v-model="planDrawerOpen"
      location="right"
      temporary
      :width="520"
    >
      <v-toolbar flat color="white">
        <v-toolbar-title class="tp-drawer__title">
          {{ planDrawerMode === 'add' ? 'Add Treatment Plan' : 'Edit Treatment Plan' }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="outlined"
          color="#8B8B8B"
          @click="closePlanDrawer"
          class="mr-4"
          style="width: 20px; height: 20px; min-width: 20px; border-radius: 50%; padding: 0;"
        >
          <v-icon size="14">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <div class="tp-drawer__body">
        <v-card class="pa-4" color="white" elevation="0">
          <label class="mb-1 tp-drawer__label">Plan Name</label>
          <v-text-field
            v-model="planDraft.name"
            variant="solo"
            density="compact"
            class="mb-4 tp-drawer__input"
            bg-color="white"
            flat
            hide-details="auto"
          />
          <label class="mb-1 tp-drawer__label">Plan Color</label>
          <div class="tp-plan-colors tp-plan-colors--drawer">
            <button
              v-for="color in planColors"
              :key="`drawer-${color}`"
              class="tp-plan-color-btn"
              :class="{ 'tp-plan-color-btn--selected': planDraft.color === color }"
              :style="{ background: color }"
              @click="planDraft.color = color"
            />
          </div>
        </v-card>
      </div>
      <div class="tp-drawer__footer">
        <v-btn
          color="white"
          class="text-primary"
          style="width: 48%; border-radius: 8px; border: 1px solid #dfdfdf"
          flat
          @click="closePlanDrawer"
        >
          Back
        </v-btn>
        <v-btn
          color="primary"
          class="text-white"
          style="width: 48%; border-radius: 8px"
          flat
          @click="submitPlanDrawer"
        >
          {{ planDrawerMode === 'add' ? 'Save' : 'Update' }}
        </v-btn>
      </div>
    </v-navigation-drawer>

  </div>
</template>

<script setup>
import { getToothLabel } from './toothData.js'

const props = defineProps({
  items:          { type: Array,  default: () => [] },
  total:          { type: Number, default: 0        },
  plannedCount:   { type: Number, default: 0        },
  completedCount: { type: Number, default: 0        },
  notation:       { type: String, default: 'FDI'   },
  appointments:   { type: Array,  default: () => [] },
  plans:          { type: Array,  default: () => [] },
  activePlanId:   { type: String, default: 'plan-1' },
  images:         { type: Array,  default: () => [] },
  history:        { type: Array,  default: () => [] },
  appointmentLinks: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'remove', 'update', 'reorder', 'add-appointment', 'delete-appointment', 'update-appointment', 'book-appointment',
  'add-plan', 'select-plan', 'rename-plan', 'duplicate-plan', 'delete-plan', 'set-interval', 'link-appointment',
  'add-image', 'remove-image', 'update-plan-color',
])

const activeView = ref('chart')
const planColors = ['#0061FB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
const plansScrollEl = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const resolvedActivePlanId = computed(() => {
  if (props.plans.some((p) => p.id === props.activePlanId)) return props.activePlanId
  return props.plans[0]?.id || null
})
const planDrawerOpen = ref(false)
const planDrawerMode = ref('add') // add | edit
const planDraft = reactive({ id: null, name: '', color: planColors[0] })

const totalFormatted = computed(() => Number(props.total || 0).toFixed(2))
const currencySymbol = 'GBP '

function itemsForAppt(apptId) {
  return props.items.filter(i => (i.appointmentGroupId || 'appt-1') === apptId)
}

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation || 'FDI')
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'long', year: '2-digit' })
}

function formatCost(val) {
  return Number(val || 0).toFixed(2)
}

function updateItem(item, patch) {
  emit('update', { id: item.id || item._tempId, ...patch })
}

function canMove(apptId, item, direction) {
  const scoped = itemsForAppt(apptId)
  const from = scoped.findIndex(i => (i.id || i._tempId) === (item.id || item._tempId))
  if (from < 0) return false
  const to = from + direction
  return to >= 0 && to < scoped.length
}

function moveItem(apptId, item, direction) {
  const scoped = itemsForAppt(apptId)
  const from = scoped.findIndex(i => (i.id || i._tempId) === (item.id || item._tempId))
  if (from < 0) return
  const to = from + direction
  if (to < 0 || to >= scoped.length) return
  emit('reorder', { appointmentId: apptId, from, to })
}
function onSelectPlan(planId, fromUser = false) {
  emit('select-plan', planId)
  if (fromUser) nextTick(updateScrollButtons)
}
function onRenamePlan(planId, currentName) {
  const current = props.plans.find((p) => p.id === planId)
  planDrawerMode.value = 'edit'
  planDraft.id = planId
  planDraft.name = currentName || current?.name || 'Treatment Plan'
  planDraft.color = current?.color || planColors[0]
  planDrawerOpen.value = true
}
function onDuplicatePlan(planId) {
  emit('duplicate-plan', planId)
}
function onDeletePlan(planId) {
  emit('delete-plan', planId)
}
function onUpdatePlanColor(planId, color) {
  emit('update-plan-color', { id: planId, color })
}
function openCreatePlanDrawer() {
  const usedNumbers = new Set(
    props.plans
      .map((p) => /^Treatment Plan\s+(\d+)$/i.exec(String(p.name || '').trim()))
      .filter(Boolean)
      .map((m) => Number(m[1]))
  )
  let nextNumber = 1
  while (usedNumbers.has(nextNumber)) nextNumber += 1
  planDrawerMode.value = 'add'
  planDraft.id = null
  planDraft.name = `Treatment Plan ${nextNumber}`
  planDraft.color = planColors[props.plans.length % planColors.length]
  planDrawerOpen.value = true
}
function closePlanDrawer() {
  planDrawerOpen.value = false
}
function submitPlanDrawer() {
  const name = String(planDraft.name || '').trim()
  if (!name) return
  if (planDrawerMode.value === 'add') {
    emit('add-plan', { name, color: planDraft.color })
  } else if (planDraft.id) {
    emit('rename-plan', { id: planDraft.id, name })
    emit('update-plan-color', { id: planDraft.id, color: planDraft.color })
  }
  closePlanDrawer()
}
function planStyle(plan, isActive) {
  const color = plan?.color || '#0061FB'
  return {
    backgroundColor: color,
    color: '#ffffff',
    borderColor: isActive ? '#ffffff' : 'transparent',
  }
}
function updateScrollButtons() {
  const el = plansScrollEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
function scrollPlans(direction) {
  const el = plansScrollEl.value
  if (!el) return
  const delta = direction === 'left' ? -220 : 220
  el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
  setTimeout(updateScrollButtons, 180)
}
function onPlansWheel(e) {
  const el = plansScrollEl.value
  if (!el) return
  el.scrollLeft += e.deltaY
  updateScrollButtons()
}
onMounted(() => {
  if (!props.activePlanId && props.plans?.length) emit('select-plan', props.plans[0].id)
  nextTick(updateScrollButtons)
  window.addEventListener('resize', updateScrollButtons, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollButtons)
})
watch(() => props.plans, async () => {
  await nextTick()
  if (!props.plans?.length) return
  if (!props.plans.some((p) => p.id === props.activePlanId)) {
    emit('select-plan', props.plans[0].id)
  }
  updateScrollButtons()
}, { deep: true })
watch(() => props.activePlanId, async () => {
  await nextTick()
  updateScrollButtons()
})
function onImagePicked(value) {
  const file = Array.isArray(value) ? value[0] : value
  if (!file) return
  emit('add-image', file)
}
</script>

<style scoped>
.tp-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────── */
.tp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
}

.tp-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tp-plans-wrap {
  min-width: 0;
  max-width: min(780px, 72vw);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tp-plans-scroll {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tp-plans-scroll::-webkit-scrollbar {
  display: none;
}

.tp-plan-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 10px 6px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease, border-radius 0.2s ease, border-color 0.2s ease;
}

.tp-plan-tab:hover {
  opacity: 0.86;
}

.tp-plan-tab--active {
  border-radius: 20px;
  border-width: 2px;
  font-weight: 700;
  opacity: 1;
}

.tp-plan-tab__text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tp-plan-tab__menu {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.tp-plan-tab:hover .tp-plan-tab__menu,
.tp-plan-tab__menu:focus-visible,
.tp-plan-tab--active .tp-plan-tab__menu {
  opacity: 1;
}

.tp-plan-colors {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 12px 12px;
}

.tp-plan-color-btn {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #d1d5db;
  cursor: pointer;
}
.tp-plan-color-btn--selected {
  box-shadow: 0 0 0 2px #111827;
}
.tp-scroll-btn {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.tp-scroll-btn:hover {
  background: #f9fafb;
}

.tp-add-plan-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.tp-add-plan-btn:hover {
  background: #0061FB;
}
.tp-drawer__title {
  font-weight: 600;
  font-size: 16px;
}
.tp-drawer__body {
  background-color: #f5f5f5;
  height: calc(100% - 64px - 64px);
  overflow-y: auto;
  padding: 16px;
}
.tp-drawer__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: white;
  height: 64px;
}
.tp-drawer__label {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
.tp-drawer__input :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
.tp-plan-colors--drawer {
  max-width: 280px;
}

.tp-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tp-hdr-btn {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tp-hdr-btn:hover {
  border-color: #0061FB;
  color: #0061FB;
}

.tp-hdr-btn--active {
  background: #0061FB;
  border-color: #0061FB;
  color: #fff;
  font-weight: 600;
}

/* ── Body ───────────────────────────────────────────────────────── */
.tp-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
}

/* ── Empty state ────────────────────────────────────────────────── */
.tp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  gap: 6px;
}

.tp-empty__hint {
  font-size: 11px;
  color: #bbb;
  margin: 0;
}

/* ── Appointment group ──────────────────────────────────────────── */
.tp-appt-group {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.tp-appt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.tp-appt-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.tp-appt-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tp-appt-completed-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;
}

.tp-appt-icon-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.tp-appt-icon-btn:hover {
  background: #f0f0f0;
  color: #555;
}

.tp-appt-icon-btn--danger:hover {
  background: #ffebee;
  color: #e53935;
}

.tp-appt-icon-btn--scheduled {
  color: #2e7d32;
}

.tp-appt-icon-btn--scheduled:hover {
  background: #e8f5e9;
  color: #1b5e20;
}

/* ── Appointment items ──────────────────────────────────────────── */
.tp-appt-items {
  display: flex;
  flex-direction: column;
}

.tp-appt-empty {
  padding: 12px 14px;
  font-size: 12px;
  color: #ccc;
  font-style: italic;
}
.tp-images-toolbar {
  margin-bottom: 10px;
}
.tp-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.tp-image-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.tp-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}
.tp-image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
}
.tp-image-name {
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tp-history-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
}
.tp-history-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}
.tp-history-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.tp-history-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* ── Item row ───────────────────────────────────────────────────── */
.tp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.1s;
  border-radius: 8px;
  margin: 4px 8px;
  border: 1px solid #f0f0f0;
}


.tp-item:hover {
  background: #fafcff;
}

/* Chevron circle */
.tp-item__chevron-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0061FB;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: background 0.15s;
}

.tp-item__chevron-btn:hover {
  background: #0050d0;
}


.tp-item__clinician {
  font-size: 11px;
  color: #888;
}

.tp-item__private {
  font-size: 10px;
  color: #bbb;
}

.tp-item__tooth {
  font-size: 11px;
  color: #888;
  flex-shrink: 0;
}

.tp-item__spacer {
  flex: 1;
}

.tp-item__name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}


.tp-item__date {
  font-size: 11px;
  color: #aaa;
  flex: 1;
}

.tp-item__duration {
  font-size: 11px;
  color: #bbb;
}

.tp-item__price {
  font-size: 12px;
  font-weight: 700;
  color: #333;
}

.tp-item__doc {
  flex-shrink: 0;
  cursor: pointer;
}

.tp-item__duration-input,
.tp-item__price-input,
.tp-item__status {
  height: 26px;
  border: 1px solid #dedede;
  border-radius: 6px;
  background: #fff;
  font-size: 11px;
  color: #555;
  padding: 0 6px;
}

.tp-item__duration-input {
  width: 58px;
}

.tp-item__price-input {
  width: 74px;
}

.tp-item__status {
  width: 92px;
}

.tp-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tp-item__icon-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8a8a8a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tp-item__icon-btn:hover {
  background: #f0f0f0;
  color: #555;
}

.tp-item__icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tp-item__icon-btn--danger:hover {
  background: #ffebee;
  color: #d32f2f;
}

/* ── Footer ─────────────────────────────────────────────────────── */
.tp-footer {
  border-top: 1px solid #f0f0f0;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: #fafafa;
  flex-wrap: wrap;
}

.tp-footer__total {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

.tp-footer__total-label {
  font-size: 10px;
  color: #999;
}

.tp-footer__total-value {
  font-size: 15px;
  font-weight: 700;
  color: #222;
}
</style>


