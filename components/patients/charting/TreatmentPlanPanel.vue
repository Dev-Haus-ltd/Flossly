<template>
  <div class="tp-panel">
    <div class="tp-header">
      <div class="tp-header__left">
        <div class="tp-plans-wrap">
          <button v-if="canScrollLeft" class="tp-scroll-btn" @click="scrollPlans('left')">
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
                      @click.stop="onUpdatePlanColor(plan.id, color)"
                    />
                  </div>
                </v-list>
              </v-menu>
            </div>
          </div>
          <button v-if="canScrollRight" class="tp-scroll-btn" @click="scrollPlans('right')">
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
        <button class="tp-add-plan-btn" title="Add treatment plan" @click="openCreatePlanDrawer">
          <v-icon size="16">mdi-plus</v-icon>
        </button>
      </div>

      <div class="tp-header__right">
        <button class="tp-hdr-btn" :class="{ 'tp-hdr-btn--active': activeView === 'base' }" @click="activeView = 'base'">Base Chart</button>
        <button class="tp-hdr-btn" :class="{ 'tp-hdr-btn--active': activeView === 'plan' }" @click="activeView = 'plan'">Treatment Plan</button>
        <button class="tp-hdr-btn" :class="{ 'tp-hdr-btn--active': activeView === 'images' }" @click="activeView = 'images'">
          <v-icon size="15" class="mr-1">mdi-image-outline</v-icon>Images
        </button>
        <button class="tp-hdr-btn" :class="{ 'tp-hdr-btn--active': activeView === 'history' }" @click="activeView = 'history'">
          <v-icon size="15" class="mr-1">mdi-history</v-icon>History
        </button>
      </div>
    </div>

    <div v-if="activeView === 'base'" class="tp-body">
      <div v-if="!baseChartItems.length" class="tp-empty">
        <v-icon size="36" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
        <p>No base chart items yet.</p>
      </div>

      <div v-for="item in baseChartItems" :key="rowKey(item)" :data-item-key="rowKey(item)" class="tp-item-wrap">
        <div class="tp-item-row" @click="toggleExpand(item)">
          <button class="tp-row-toggle" :class="{ 'tp-row-toggle--open': isExpanded(item) }">
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
          <span class="tp-col tp-col--date">{{ formatDate(item.createdAt) }}</span>
          <span class="tp-col tp-col--tooth">{{ toothLabel(item) }}</span>
          <span class="tp-col tp-col--name">{{ itemDisplayLabel(item) }}</span>
          <span class="tp-col tp-col--source">Base chart</span>
          <span class="tp-col tp-col--duration">{{ Number(item.duration || 0) }} min</span>
          <span class="tp-col tp-col--price">{{ currencySymbol }}{{ formatCost(item.cost) }}</span>
          <button class="tp-icon-btn tp-icon-btn--danger" title="Remove item" @click.stop="$emit('remove', item.id || item._tempId)">
            <v-icon size="14">mdi-trash-can-outline</v-icon>
          </button>
        </div>

        <div v-if="isExpanded(item)" class="tp-expand">
          <div class="tp-expand-fields">
            <label class="tp-field">
              <span>Practitioner</span>
              <select v-model.number="draft.practitionerId">
                <option :value="null">Select practitioner</option>
                <option v-for="p in practitioners" :key="p.id" :value="Number(p.id)">{{ p.name }}</option>
              </select>
            </label>
            <label class="tp-field">
              <span>Duration (min)</span>
              <select v-model.number="draft.duration">
                  <option :value="15">15 min</option>
                  <option :value="30">30 min</option>
                  <option :value="45">45 min</option>
                  <option :value="60">60 min</option>
                </select>
            </label>
            <label class="tp-field">
              <span>Price</span>
              <input v-model.number="draft.cost" type="number" min="0" step="0.01" />
            </label>
            <label class="tp-field">
              <span>Status</span>
              <select v-model="draft.status">
                <option value="existing">Existing</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
          <textarea v-model="draft.notes" class="tp-notes-input" placeholder="Notes..." />
          <div class="tp-expand-actions">
            <v-btn variant="text" @click="cancelExpanded">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="saveExpanded">Save</v-btn>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeView === 'plan'" class="tp-body">
      <div v-if="!appointments.length && !planItems.length" class="tp-empty">
        <v-icon size="36" color="grey-lighten-2">mdi-tooth-outline</v-icon>
        <p>No treatment plan items yet.</p>
        <p class="tp-empty__hint">Select a treatment code and click a tooth to add items.</p>
      </div>

      <div v-for="appt in appointments" :key="appt.id" class="tp-appt-group">
        <div class="tp-appt-header">
          <div class="tp-appt-header__left">
            <span class="tp-appt-name">{{ appt.name }}</span>
            <!-- Booking status badge -->
            <span v-if="appt.status === 'scheduled' || appt.diaryAppointmentId" class="tp-appt-badge tp-appt-badge--booked">
              <v-icon size="12">mdi-check-circle</v-icon> Booked in Diary
            </span>
            <span v-else-if="planItemsForAppt(appt.id).length" class="tp-appt-badge tp-appt-badge--unbooked">
              <v-icon size="12">mdi-calendar-alert</v-icon> Not yet in Diary — click
              <button class="tp-appt-badge__book-btn" @click.stop="$emit('book-appointment', appt.id)">Book</button>
            </span>
          </div>
          <div class="tp-appt-header__right">
            <button class="tp-appt-icon-btn tp-appt-icon-btn--danger" title="Delete appointment" @click="$emit('delete-appointment', appt.id)">
              <v-icon size="15">mdi-trash-can-outline</v-icon>
            </button>
            <button class="tp-appt-icon-btn" title="Link" @click="$emit('link-appointment', appt.id)">
              <v-icon size="15">mdi-link-variant</v-icon>
            </button>
            <button
              class="tp-appt-icon-btn"
              :class="{ 'tp-appt-icon-btn--scheduled': appt.status === 'scheduled' || appt.diaryAppointmentId }"
              title="Book in Diary"
              @click="$emit('book-appointment', appt.id)"
            >
              <v-icon size="15" :color="(appt.status === 'scheduled' || appt.diaryAppointmentId) ? 'success' : undefined">mdi-calendar-outline</v-icon>
            </button>
          </div>
        </div>

        <div class="tp-appt-items">
          <div v-for="item in planItemsForAppt(appt.id)" :key="rowKey(item)" :data-item-key="rowKey(item)" class="tp-item-wrap">
            <div class="tp-item-row" @click="toggleExpand(item)">
              <button class="tp-row-toggle" :class="{ 'tp-row-toggle--open': isExpanded(item) }">
                <v-icon size="16">mdi-chevron-right</v-icon>
              </button>
              <span class="tp-col tp-col--date">{{ formatDate(item.createdAt) }}</span>
              <span class="tp-col tp-col--tooth">{{ toothLabel(item) }}</span>
              <span class="tp-col tp-col--name">{{ itemDisplayLabel(item) }}</span>
              <span class="tp-col tp-col--source">{{ item.planName || 'Treatment plan' }}</span>
              <span class="tp-col tp-col--duration">{{ Number(item.duration || 0) }} min</span>
              <span class="tp-col tp-col--price">{{ currencySymbol }}{{ formatCost(item.cost) }}</span>
              <button class="tp-icon-btn tp-icon-btn--danger" title="Remove item" @click.stop="$emit('remove', item.id || item._tempId)">
                <v-icon size="14">mdi-trash-can-outline</v-icon>
              </button>
            </div>

            <div v-if="isExpanded(item)" class="tp-expand">
              <div class="tp-expand-fields">
                <label class="tp-field">
                  <span>Practitioner</span>
                  <select v-model.number="draft.practitionerId">
                    <option :value="null">Select practitioner</option>
                    <option v-for="p in practitioners" :key="p.id" :value="Number(p.id)">{{ p.name }}</option>
                  </select>
                </label>
                <label class="tp-field">
                  <span>Duration (min)</span>
                  <select v-model.number="draft.duration">
                  <option :value="15">15 min</option>
                  <option :value="30">30 min</option>
                  <option :value="45">45 min</option>
                  <option :value="60">60 min</option>
                </select>
                </label>
                <label class="tp-field">
                  <span>Price</span>
                  <input v-model.number="draft.cost" type="number" min="0" step="0.01" />
                </label>
                <label class="tp-field">
                  <span>Status</span>
                  <select v-model="draft.status">
                    <option value="planned">Planned</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <textarea v-model="draft.notes" class="tp-notes-input" placeholder="Notes..." />
              <div class="tp-expand-actions">
                <v-btn variant="text" @click="cancelExpanded">Cancel</v-btn>
                <v-btn
                  v-if="draft.status !== 'completed'"
                  color="success"
                  variant="outlined"
                  prepend-icon="mdi-check-circle-outline"
                  @click="$emit('mark-complete', {
                    id: draft.id,
                    practitionerId: draft.practitionerId || null,
                    practitionerName: resolvePractitionerName(draft.practitionerId) || draft.practitionerName || '',
                  }); cancelExpanded()"
                >Mark Complete</v-btn>
                <v-btn color="primary" variant="flat" @click="saveExpanded">Save</v-btn>
              </div>
            </div>
          </div>

          <div v-if="!planItemsForAppt(appt.id).length" class="tp-appt-empty">No items in this appointment</div>
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
            <button class="tp-icon-btn tp-icon-btn--danger" @click="$emit('remove-image', img.id)">
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

    <div class="tp-footer" v-if="activeView !== 'images' && activeView !== 'history'">
      <v-btn variant="outlined" size="small" rounded="lg" prepend-icon="mdi-calendar-plus" @click="$emit('add-appointment')">Add Appointment</v-btn>
      <v-btn variant="outlined" size="small" rounded="lg" prepend-icon="mdi-clock-outline" @click="$emit('set-interval')">Set Interval</v-btn>
      <div class="tp-footer__right">
        <v-btn v-if="activeView === 'plan'" variant="outlined" size="small" rounded="lg" prepend-icon="mdi-printer-outline" @click="$emit('print-plan')">Print Plan</v-btn>
        <span v-if="nhsBand" class="tp-nhs-badge" :class="`tp-nhs-badge--${nhsBand}`">NHS Band {{ nhsBand }}</span>
        <div class="tp-footer__total">
          <span class="tp-footer__total-label">Total</span>
          <span class="tp-footer__total-value">{{ currencySymbol }}{{ totalFormatted }}</span>
        </div>
      </div>
    </div>

    <v-navigation-drawer v-model="planDrawerOpen" location="right" temporary :width="520">
      <v-toolbar flat color="white">
        <v-toolbar-title class="tp-drawer__title">{{ planDrawerMode === 'add' ? 'Add Treatment Plan' : 'Edit Treatment Plan' }}</v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="outlined" color="#8B8B8B" @click="closePlanDrawer" class="mr-4" style="width: 20px; height: 20px; min-width: 20px; border-radius: 50%; padding: 0;">
          <v-icon size="14">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <div class="tp-drawer__body">
        <v-card class="pa-4" color="white" elevation="0">
          <label class="mb-1 tp-drawer__label">Plan Name</label>
          <v-text-field v-model="planDraft.name" variant="solo" density="compact" class="mb-4 tp-drawer__input" bg-color="white" flat hide-details="auto" />
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
        <v-btn color="white" class="text-primary" style="width: 48%; border-radius: 8px; border: 1px solid #dfdfdf" flat @click="closePlanDrawer">Back</v-btn>
        <v-btn color="primary" class="text-white" style="width: 48%; border-radius: 8px" flat @click="submitPlanDrawer">{{ planDrawerMode === 'add' ? 'Save' : 'Update' }}</v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { getToothLabel } from './toothData.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  plannedCount: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  notation: { type: String, default: 'FDI' },
  appointments: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] },
  activePlanId: { type: String, default: 'plan-1' },
  images: { type: Array, default: () => [] },
  history: { type: Array, default: () => [] },
  appointmentLinks: { type: Object, default: () => ({}) },
  practitioners: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'remove', 'update', 'reorder', 'add-appointment', 'delete-appointment', 'update-appointment', 'book-appointment',
  'add-plan', 'select-plan', 'rename-plan', 'duplicate-plan', 'delete-plan', 'set-interval', 'link-appointment',
  'add-image', 'remove-image', 'update-plan-color', 'chart-scope-change',
  'mark-complete', 'print-plan',
])

const activeView = ref('base')
// Fix #10 — use £ not the verbose 'GBP ' prefix
const currencySymbol = '£'
const totalFormatted = computed(() => Number(props.total || 0).toFixed(2))

const NHS_BAND3_KEYS = ['crown', 'bridge', 'denture', 'veneer', 'implant', 'onlay', 'inlay', 'post and core', 'post & core']
const NHS_BAND2_KEYS = ['fill', 'extract', 'root canal', 'rct', 'composite', 'amalgam', 'deep scale', 'periodon', 'surgery']

function itemMatchesKeys(item, keys) {
  const text = `${item.treatmentName || ''} ${item.treatmentCode || ''} ${item.condition || ''} ${item.conditionLabel || ''}`.toLowerCase()
  return keys.some(k => text.includes(k))
}

const nhsBand = computed(() => {
  const items = planItems.value
  if (!items.length) return null
  if (items.some(i => itemMatchesKeys(i, NHS_BAND3_KEYS))) return 3
  if (items.some(i => itemMatchesKeys(i, NHS_BAND2_KEYS))) return 2
  return 1
})

const planColors = ['#0061FB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
const plansScrollEl = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const resolvedActivePlanId = computed(() => {
  if (props.plans.some((p) => p.id === props.activePlanId)) return props.activePlanId
  return props.plans[0]?.id || null
})

// Fix #6 — use status as the sole discriminator; avoids items with null appointmentGroupId
// but non-existing status falling through to nowhere
function isBaseEntry(item) {
  return String(item?.status || '').toLowerCase() === 'existing'
}

const baseChartItems = computed(() => [...props.items].filter(isBaseEntry).sort((a, b) => a.priority - b.priority))
const planItems = computed(() => [...props.items].filter((i) => !isBaseEntry(i)).sort((a, b) => a.priority - b.priority))

// Fix #14 — computed map avoids re-filtering the full array on every render cycle
const planItemsByAppt = computed(() => {
  const map = {}
  planItems.value.forEach((item) => {
    const key = item.appointmentGroupId || 'appt-1'
    if (!map[key]) map[key] = []
    map[key].push(item)
  })
  return map
})

function planItemsForAppt(apptId) {
  return planItemsByAppt.value[apptId] || []
}

function rowKey(item) {
  return item.id || item._tempId
}

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation || 'FDI')
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function itemDisplayLabel(item) {
  return item.treatmentName || item.conditionLabel || item.condition || 'Treatment'
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })
}

function formatCost(val) {
  return Number(val || 0).toFixed(2)
}

function canMove(apptId, item, direction) {
  const scoped = planItemsForAppt(apptId)
  const from = scoped.findIndex((i) => rowKey(i) === rowKey(item))
  if (from < 0) return false
  const to = from + direction
  return to >= 0 && to < scoped.length
}

function moveItem(apptId, item, direction) {
  const scoped = planItemsForAppt(apptId)
  const from = scoped.findIndex((i) => rowKey(i) === rowKey(item))
  if (from < 0) return
  const to = from + direction
  if (to < 0 || to >= scoped.length) return
  emit('reorder', { appointmentId: apptId, from, to })
}

const expandedRowId = ref(null)
const draft = reactive({
  id: null,
  practitionerId: null,
  practitionerName: '',
  duration: 0,
  cost: 0,
  status: 'planned',
  notes: '',
})

function isExpanded(item) {
  return expandedRowId.value === rowKey(item)
}

function resetDraft() {
  draft.id = null
  draft.practitionerId = null
  draft.practitionerName = ''
  draft.duration = 0
  draft.cost = 0
  draft.status = 'planned'
  draft.notes = ''
}

function resolvePractitionerName(id) {
  if (!id) return ''
  return props.practitioners.find((p) => Number(p.id) === Number(id))?.name || ''
}

async function openExpanded(item) {
  draft.id = rowKey(item)
  draft.practitionerId = item.practitionerId ? Number(item.practitionerId) : null
  draft.practitionerName = item.practitionerName || item.clinicianName || ''
  draft.duration = Number(item.duration || 0)
  draft.cost = Number(item.cost || 0)
  draft.status = item.status || (isBaseEntry(item) ? 'existing' : 'planned')
  draft.notes = item.notes || ''
  expandedRowId.value = rowKey(item)
}

async function closeExpanded() {
  expandedRowId.value = null
  resetDraft()
}

async function toggleExpand(item) {
  const key = rowKey(item)
  if (expandedRowId.value === key) {
    await closeExpanded()
    return
  }
  await closeExpanded()
  await openExpanded(item)
  // Fix #8 — scroll the expanded form into view so the user doesn't have to hunt for it
  await nextTick()
  document.querySelector(`[data-item-key="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// Fix #5 — the previous code set savingExpanded = true then turned it off in finally,
// but emit() is synchronous so the spinner showed for ~0ms before the form closed.
// Save is now optimistic: emit the update, close immediately, trust the store handles persistence.
async function saveExpanded() {
  if (!draft.id) return
  const practitionerName = resolvePractitionerName(draft.practitionerId) || draft.practitionerName || ''
  emit('update', {
    id: draft.id,
    practitionerId: draft.practitionerId || null,
    practitionerName,
    clinicianName: practitionerName,
    duration: Number(draft.duration || 0),
    cost: Number(draft.cost || 0),
    status: draft.status,
    notes: draft.notes || '',
  })
  await closeExpanded()
}

async function cancelExpanded() {
  await closeExpanded()
}

const planDrawerOpen = ref(false)
const planDrawerMode = ref('add')
const planDraft = reactive({ id: null, name: '', color: planColors[0] })

function onSelectPlan(planId, fromUser = false) {
  emit('select-plan', planId)
  if (fromUser) {
    activeView.value = 'plan'
    nextTick(updateScrollButtons)
  }
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
  emit('chart-scope-change', activeView.value === 'base' ? 'base' : (activeView.value === 'plan' ? 'plan' : 'both'))
  if (!props.activePlanId && props.plans?.length) emit('select-plan', props.plans[0].id)
  nextTick(updateScrollButtons)
  window.addEventListener('resize', updateScrollButtons, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollButtons)
})

watch(
  () => props.plans,
  async () => {
    await nextTick()
    if (!props.plans?.length) return
    if (!props.plans.some((p) => p.id === props.activePlanId)) {
      emit('select-plan', props.plans[0].id)
    }
    updateScrollButtons()
  },
  { deep: true }
)

watch(
  () => props.activePlanId,
  async () => {
    await nextTick()
    updateScrollButtons()
  }
)

watch(activeView, async () => {
  if (activeView.value === 'base') emit('chart-scope-change', 'base')
  else if (activeView.value === 'plan') emit('chart-scope-change', 'plan')
  else emit('chart-scope-change', 'both')
  await closeExpanded()
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

.tp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
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
}

.tp-plan-tab--active {
  border-radius: 20px;
  border-width: 2px;
  font-weight: 700;
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
}

.tp-plan-tab:hover .tp-plan-tab__menu,
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
}

.tp-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tp-hdr-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
}

.tp-hdr-btn--active {
  background: #0061FB;
  border-color: #0061FB;
  color: #fff;
  font-weight: 600;
}

/* Fix #9 — 92px bottom padding was dead space (footer sits outside this scroll container) */
.tp-body {
  flex: 1;
  overflow: auto;
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 430px;
}

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

.tp-item-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.tp-item-row {
  display: grid;
  grid-template-columns: 32px 150px 90px minmax(180px, 1fr) 140px 80px 100px 34px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 8px 10px;
  cursor: pointer;
  background: #fff;
}

.tp-col {
  font-size: 13px;
  color: #374151;
}

.tp-col--name {
  font-weight: 600;
  color: #111827;
}

.tp-col--source,
.tp-col--duration,
.tp-col--tooth,
.tp-col--date {
  color: #6b7280;
  font-size: 12px;
}

.tp-col--price {
  font-weight: 600;
  text-align: right;
}

.tp-row-toggle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tp-row-toggle--open {
  background: #eef4ff;
  border-color: #0061FB;
  color: #0061FB;
}

.tp-row-toggle--open :deep(.v-icon) {
  transform: rotate(90deg);
}

.tp-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tp-icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tp-icon-btn--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.tp-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}

.tp-expand {
  border-top: 1px solid #eef2f7;
  padding: 12px;
  background: #f8fbff;
}

.tp-expand-fields {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.tp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tp-field span {
  font-size: 11px;
  color: #6b7280;
}

.tp-field input,
.tp-field select {
  height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
  background: #fff;
}

.tp-notes-input {
  width: 100%;
  min-height: 200px;
  border: 1px solid #d6dde8;
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  font-size: 13px;
  color: #334155;
  resize: none;
  outline: none;
}

.tp-expand-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

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
  gap: 8px;
}

.tp-appt-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.tp-appt-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.tp-appt-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.tp-appt-badge--booked {
  background: #dcfce7;
  color: #166534;
}

.tp-appt-badge--unbooked {
  background: #fef9c3;
  color: #854d0e;
}

.tp-appt-badge__book-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: #0061FB;
  cursor: pointer;
  text-decoration: underline;
  line-height: 1;
}

.tp-appt-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
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
}

.tp-appt-icon-btn--danger:hover {
  background: #ffebee;
  color: #e53935;
}

.tp-appt-icon-btn--scheduled {
  color: #2e7d32;
}

.tp-appt-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}

.tp-appt-empty {
  padding: 12px 14px;
  font-size: 12px;
  color: #9ca3af;
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

.tp-footer {
  border-top: 1px solid #f0f0f0;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fafafa;
  flex-wrap: wrap;
}

.tp-footer__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tp-footer__total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tp-nhs-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.tp-nhs-badge--1 { background: #dcfce7; color: #166534; }
.tp-nhs-badge--2 { background: #fef9c3; color: #854d0e; }
.tp-nhs-badge--3 { background: #fee2e2; color: #991b1b; }

.tp-footer__total-label {
  font-size: 10px;
  color: #999;
}

.tp-footer__total-value {
  font-size: 15px;
  font-weight: 700;
  color: #222;
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

@media (max-width: 1200px) {
  .tp-item-row {
    grid-template-columns: 28px 120px 70px minmax(140px, 1fr) 100px 70px 90px 34px;
  }
}
</style>
