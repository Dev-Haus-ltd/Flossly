<template>
  <div class="psp-wrap">
    <div class="psp-header">
      <span class="psp-title">Content</span>
      <span class="psp-hint">Select what to include in the live PDF</span>
    </div>

    <div class="psp-list">
      <div v-for="section in SECTIONS" :key="section.key" class="psp-item">
        <div class="psp-item__row" @click="toggleSection(section.key)">
          <div class="psp-check" :class="{ 'psp-check--on': isSectionEnabled(section.key) }">
            <v-icon v-if="isSectionEnabled(section.key)" size="12" color="white">mdi-check</v-icon>
          </div>
          <span class="psp-item__label" :class="{ 'psp-item__label--on': isSectionEnabled(section.key) }">{{ section.label }}</span>
          <button
            v-if="section.expandable"
            class="psp-expand-btn"
            :class="{ 'psp-expand-btn--open': expanded === section.key }"
            @click.stop="toggleExpand(section.key)"
          >
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="expanded === 'treatmentPlan' && section.key === 'treatmentPlan'" class="psp-expand-body">
          <div v-if="!hasItems" class="psp-expand-empty">No treatment items yet</div>
          <div v-else class="psp-tp-list">
            <div v-for="item in planItems" :key="item.id || item._tempId" class="psp-tp-item">
              <span class="psp-tp-tooth">{{ toothLabel(item) }}</span>
              <span class="psp-tp-name">{{ item.treatmentName || item.conditionLabel || item.condition || '—' }}</span>
              <span class="psp-tp-cost">£{{ Number(item.cost || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div v-if="expanded === 'diagnosis' && section.key === 'diagnosis'" class="psp-expand-body">
          <div v-if="!baseItems.length" class="psp-expand-empty">No diagnosis findings yet</div>
          <div v-else class="psp-tp-list">
            <div v-for="item in baseItems" :key="item.id || item._tempId" class="psp-tp-item">
              <span class="psp-tp-tooth">{{ toothLabel(item) }}</span>
              <span class="psp-tp-name">{{ item.conditionLabel || item.condition || '—' }}</span>
              <span class="psp-tp-cost">{{ item.surface || 'Full tooth' }}</span>
            </div>
          </div>
        </div>

        <div v-if="expanded === 'paymentPlan' && section.key === 'paymentPlan'" class="psp-expand-body">
          <div class="psp-expand-empty">Payment section is generated from treatment totals.</div>
        </div>

        <div v-if="expanded === 'consentForm' && section.key === 'consentForm'" class="psp-expand-body">
          <div class="psp-expand-empty">Consent statements will be shown in PDF.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getToothLabel } from './toothData.js'

const props = defineProps({
  sections: { type: Object, required: true },
  baseItems: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:sections'])

const expanded = ref(null)
const SECTIONS = [
  { key: 'clinicInfo', label: 'About the clinic', expandable: false },
  { key: 'dentistInfo', label: 'About the Dentist', expandable: false },
  { key: 'diagnosis', label: 'Diagnoses', expandable: true },
  { key: 'treatmentPlan', label: 'Treatment Plan', expandable: true },
  { key: 'paymentPlan', label: 'Payment Plan', expandable: true },
  { key: 'consentForm', label: 'Consent Form', expandable: true },
  { key: 'testimonial', label: 'Testimonial', expandable: false },
]

const planItems = computed(() => props.items.filter((i) => i.status !== 'existing'))
const hasItems = computed(() => planItems.value.length > 0)

function isSectionEnabled(key) {
  return !!props.sections?.[key]
}

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation)
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function toggleSection(key) {
  emit('update:sections', { ...props.sections, [key]: !props.sections[key] })
}

function toggleExpand(key) {
  expanded.value = expanded.value === key ? null : key
}
</script>

<style scoped>
.psp-wrap { width: 320px; flex-shrink: 0; background: #fff; border: 1px solid #d9dde5; border-radius: 28px; overflow: hidden; position: sticky; top: 16px; }
.psp-header { padding: 18px 22px 14px; border-bottom: 1px solid #eceff4; }
.psp-title { display: block; font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.psp-hint { font-size: 12px; color: #7b8190; }
.psp-item { border-bottom: 1px solid #eceff4; }
.psp-item__row { display: flex; align-items: center; gap: 14px; min-height: 62px; padding: 0 22px; cursor: pointer; user-select: none; }
.psp-check { width: 24px; height: 24px; border-radius: 6px; border: 2px solid #d7dbe3; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.psp-check--on { background: #0061FB; border-color: #0061FB; }
.psp-item__label { flex: 1; font-size: 16px; color: #7a7f89; font-weight: 500; }
.psp-item__label--on { color: #0061FB; }
.psp-expand-btn { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0; display: flex; align-items: center; }
.psp-expand-btn--open :deep(.v-icon) { transform: rotate(90deg); }
.psp-expand-body { padding: 10px 22px 14px 60px; background: #fafbfd; border-top: 1px solid #eceff4; }
.psp-expand-empty { font-size: 12px; color: #9ca3af; padding: 4px 0; }
.psp-tp-list { display: flex; flex-direction: column; gap: 4px; }
.psp-tp-item { display: flex; gap: 6px; font-size: 12px; color: #374151; align-items: center; }
.psp-tp-tooth { font-weight: 600; color: #0061FB; min-width: 36px; }
.psp-tp-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.psp-tp-cost { color: #6b7280; flex-shrink: 0; }
</style>

