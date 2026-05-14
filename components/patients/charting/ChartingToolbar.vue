<template>
  <div class="charting-toolbar">

    <!-- ── Row 1: Mode + Notation ───────────────────────────────── -->
    <div class="toolbar-row toolbar-row--top">
      <!-- Mode toggle -->
      <div class="toolbar-group">
        <span class="toolbar-group__label">Mode</span>
        <div class="mode-toggle">
          <button
            v-for="m in MODES"
            :key="m.value"
            class="mode-btn"
            :class="{ 'mode-btn--active': mode === m.value }"
            :style="mode === m.value ? { background: m.color, color: '#fff', borderColor: m.color } : {}"
            @click="$emit('update:mode', m.value)"
          >
            <span class="mode-dot" :style="{ background: m.dotColor }" />
            {{ m.label }}
          </button>
        </div>
      </div>

      <!-- Notation toggle -->
      <div class="toolbar-group ml-auto">
        <span class="toolbar-group__label">Notation</span>
        <div class="notation-toggle">
          <button
            v-for="n in NOTATIONS"
            :key="n"
            class="notation-btn"
            :class="{ 'notation-btn--active': notation === n }"
            @click="$emit('update:notation', n)"
          >{{ n }}</button>
        </div>
      </div>

      <!-- Save / Dirty indicator -->
      <div class="toolbar-group ml-2">
        <v-btn
          v-if="isDirty"
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isSaving"
          @click="$emit('save')"
        >
          <v-icon size="14" class="mr-1">mdi-content-save</v-icon>
          Save
        </v-btn>
        <span v-else-if="!isSaving" class="saved-label">
          <v-icon size="14" color="success">mdi-check-circle</v-icon>
          Saved
        </span>
      </div>
    </div>

    <!-- ── Row 2: Condition palette ─────────────────────────────── -->
    <div class="toolbar-row toolbar-row--conditions">
      <!-- Category tabs -->
      <div class="condition-categories">
        <button
          v-for="cat in CONDITION_CATEGORIES"
          :key="cat"
          class="cat-btn"
          :class="{ 'cat-btn--active': activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat }}</button>
      </div>

      <!-- Condition chips for selected category -->
      <div class="condition-chips">
        <button
          v-for="[key, cond] in conditionsForCategory"
          :key="key"
          class="cond-chip"
          :class="{ 'cond-chip--active': activeCondition === key }"
          :style="activeCondition === key ? { background: cond.color, color: '#fff', borderColor: cond.color } : { borderColor: cond.color }"
          @click="$emit('update:activeCondition', key)"
        >
          <span class="cond-dot" :style="{ background: cond.color }" />
          {{ cond.label }}
        </button>

        <!-- Eraser (clear condition) -->
        <button
          class="cond-chip cond-chip--eraser"
          :class="{ 'cond-chip--active': activeCondition === null }"
          @click="$emit('update:activeCondition', null)"
        >
          <v-icon size="14">mdi-eraser</v-icon>
          None
        </button>
      </div>
    </div>

    <!-- ── Row 3: Active condition indicator ────────────────────── -->
    <div v-if="activeCondition" class="toolbar-row toolbar-row--active">
      <div class="active-indicator" :style="{ borderColor: activeConditionMeta?.color }">
        <span class="active-indicator__dot" :style="{ background: activeConditionMeta?.color }" />
        <strong>{{ activeConditionMeta?.label }}</strong>
        <span class="active-indicator__mode">&nbsp;→ {{ modeLabel }}</span>
        <v-btn size="x-small" icon variant="text" class="ml-2" @click="$emit('update:activeCondition', null)">
          <v-icon size="14">mdi-close</v-icon>
        </v-btn>
      </div>
      <span v-if="bridgeSelectMode" class="bridge-step-hint">
        <v-icon size="14" color="warning">mdi-bridge</v-icon>
        Click second abutment tooth to complete bridge
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CONDITIONS, CONDITION_CATEGORIES } from './toothData.js'

const props = defineProps({
  mode:            { type: String,  default: 'examination' },
  activeCondition: { type: String,  default: null          },
  notation:        { type: String,  default: 'FDI'         },
  isDirty:         { type: Boolean, default: false         },
  isSaving:        { type: Boolean, default: false         },
  bridgeSelectMode:{ type: Boolean, default: false         },
})

defineEmits(['update:mode', 'update:activeCondition', 'update:notation', 'save'])

const MODES = [
  { value: 'examination', label: 'Examination', color: '#546e7a', dotColor: '#78909c' },
  { value: 'treatment',   label: 'Treatment',   color: '#0061FB', dotColor: '#42a5f5' },
  { value: 'completed',   label: 'Completed',   color: '#2e7d32', dotColor: '#66bb6a' },
]
const NOTATIONS = ['FDI', 'Palmer', 'UNS']

const activeCategory = ref('Decay')

const conditionsForCategory = computed(() =>
  Object.entries(CONDITIONS).filter(([, c]) => c.category === activeCategory.value)
)

const activeConditionMeta = computed(() =>
  props.activeCondition ? CONDITIONS[props.activeCondition] : null
)

const modeLabel = computed(() => {
  const m = MODES.find(m => m.value === props.mode)
  return m?.label || ''
})
</script>

<style scoped>
.charting-toolbar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Rows ──────────────────────────────────────────────────────── */
.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Group ─────────────────────────────────────────────────────── */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-group__label {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}

/* ── Mode toggle ───────────────────────────────────────────────── */
.mode-toggle {
  display: flex;
  background: #f3f6fa;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #555;
  transition: all 0.15s;
  white-space: nowrap;
}

.mode-btn:hover:not(.mode-btn--active) {
  background: #e8edf2;
}

.mode-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Notation ──────────────────────────────────────────────────── */
.notation-toggle {
  display: flex;
  background: #f3f6fa;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.notation-btn {
  padding: 3px 8px;
  border-radius: 5px;
  border: none;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #555;
  transition: all 0.15s;
}

.notation-btn--active {
  background: #fff;
  color: #0061FB;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* ── Saved label ───────────────────────────────────────────────── */
.saved-label {
  font-size: 11px;
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* ── Categories ────────────────────────────────────────────────── */
.condition-categories {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 3px 9px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: #f9f9f9;
  color: #555;
  transition: all 0.15s;
  white-space: nowrap;
}

.cat-btn:hover {
  background: #e8edf2;
}

.cat-btn--active {
  background: #0061FB;
  border-color: #0061FB;
  color: #fff;
}

/* ── Condition chips ───────────────────────────────────────────── */
.condition-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cond-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 14px;
  border: 1.5px solid #ddd;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #fff;
  color: #444;
  transition: all 0.15s;
  white-space: nowrap;
}

.cond-chip:hover:not(.cond-chip--active) {
  background: #f5f5f5;
}

.cond-chip--eraser {
  border-color: #ccc;
  color: #777;
}

.cond-chip--eraser.cond-chip--active {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}

.cond-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Active indicator bar ──────────────────────────────────────── */
.toolbar-row--active {
  gap: 16px;
}

.active-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  font-size: 12px;
  background: #fafafa;
}

.active-indicator__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.active-indicator__mode {
  color: #888;
  font-size: 11px;
}

.bridge-step-hint {
  font-size: 11px;
  color: #e65100;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ml-auto {
  margin-left: auto;
}

.ml-2 {
  margin-left: 8px;
}
</style>
