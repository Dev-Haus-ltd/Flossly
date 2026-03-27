<template>
  <div class="risk-panel">
    <div class="risk-grid">
      <div v-for="section in SECTIONS" :key="section.key" class="risk-section">
        <div class="risk-section__header">
          <div class="risk-section__title">{{ section.label }}</div>
          <span
            v-if="localData[section.key]?.level"
            class="risk-chip"
            :class="`risk-chip--${localData[section.key].level}`"
          >
            {{ capitalise(localData[section.key].level) }} Risk
          </span>
        </div>

        <div class="risk-levels">
          <label
            v-for="level in LEVELS"
            :key="level"
            class="risk-level-btn"
            :class="{ [`risk-level-btn--${level}`]: localData[section.key]?.level === level }"
          >
            <input type="radio" :name="section.key" :value="level" :checked="localData[section.key]?.level === level" @change="setLevel(section.key, level)" />
            {{ capitalise(level) }}
          </label>
        </div>

        <div class="risk-factors">
          <div class="risk-factors__label">Contributing Factors</div>
          <div class="risk-factors__list">
            <label v-for="factor in section.factors" :key="factor" class="risk-factor-check">
              <input type="checkbox" :checked="hasFlag(section.key, factor)" @change="toggleFlag(section.key, factor)" />
              <span>{{ factor }}</span>
            </label>
          </div>
        </div>

        <textarea
          class="risk-notes"
          placeholder="Notes..."
          :value="localData[section.key]?.notes || ''"
          @input="setNotes(section.key, $event.target.value)"
        />
      </div>
    </div>

    <div class="risk-meta">
      <span v-if="localData.assessedAt">Last assessed: {{ formatDate(localData.assessedAt) }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  riskData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update'])

const LEVELS = ['low', 'medium', 'high']

const SECTIONS = [
  {
    key: 'caries',
    label: 'Caries Risk',
    factors: [
      'High sugar / acidic diet',
      'Poor oral hygiene',
      'Previous caries experience',
      'Xerostomia / dry mouth',
      'Orthodontic appliances',
      'Fluoride deficiency',
      'Gastric reflux',
    ],
  },
  {
    key: 'periodontal',
    label: 'Periodontal Risk',
    factors: [
      'Smoking / tobacco use',
      'Diabetes (poorly controlled)',
      'BPE sextant score ≥ 3',
      'Previous periodontal disease',
      'Chronic stress',
      'Medications (calcium channel blockers, phenytoin)',
      'Immunosuppression',
    ],
  },
  {
    key: 'oralCancer',
    label: 'Oral Cancer Risk',
    factors: [
      'Tobacco use (any form)',
      'Alcohol excess (>14 units/week)',
      'HPV exposure',
      'Previous oral cancer or leukoplakia',
      'Age > 45',
      'Prolonged sun exposure (lip)',
      'Betel nut / areca nut use',
    ],
  },
]

function _buildDefault() {
  const base = {
    caries:      { level: '', flags: [], notes: '' },
    periodontal: { level: '', flags: [], notes: '' },
    oralCancer:  { level: '', flags: [], notes: '' },
    assessedAt:  null,
  }
  return base
}

const localData = reactive(_buildDefault())

watch(() => props.riskData, (v) => {
  if (!v) return
  SECTIONS.forEach(s => {
    if (v[s.key]) {
      localData[s.key] = {
        level: v[s.key].level || '',
        flags: Array.isArray(v[s.key].flags) ? [...v[s.key].flags] : [],
        notes: v[s.key].notes || '',
      }
    }
  })
  localData.assessedAt = v.assessedAt || null
}, { immediate: true, deep: true })

function setLevel(key, level) {
  localData[key] = { ...localData[key], level }
  localData.assessedAt = new Date().toISOString()
  emitUpdate()
}

function setNotes(key, val) {
  localData[key] = { ...localData[key], notes: val }
  emitUpdate()
}

function hasFlag(key, flag) {
  return (localData[key]?.flags || []).includes(flag)
}

function toggleFlag(key, flag) {
  const flags = [...(localData[key]?.flags || [])]
  const idx = flags.indexOf(flag)
  if (idx === -1) flags.push(flag)
  else flags.splice(idx, 1)
  localData[key] = { ...localData[key], flags }
  emitUpdate()
}

function emitUpdate() {
  emit('update', JSON.parse(JSON.stringify(localData)))
}

function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.risk-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.risk-section {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}

.risk-section__title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.risk-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.risk-chip--low    { background: #dcfce7; color: #166534; }
.risk-chip--medium { background: #fef9c3; color: #854d0e; }
.risk-chip--high   { background: #fee2e2; color: #991b1b; }

.risk-levels {
  display: flex;
  gap: 6px;
}

.risk-level-btn {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  color: #6b7280;
  background: #fafafa;
  transition: all 0.1s;
}

.risk-level-btn input { display: none; }

.risk-level-btn--low    { background: #f0fdf4; border-color: #86efac; color: #166534; font-weight: 600; }
.risk-level-btn--medium { background: #fefce8; border-color: #fde047; color: #854d0e; font-weight: 600; }
.risk-level-btn--high   { background: #fef2f2; border-color: #fca5a5; color: #991b1b; font-weight: 600; }

.risk-factors__label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.risk-factors__list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.risk-factor-check {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: #374151;
  cursor: pointer;
  line-height: 1.4;
}

.risk-factor-check input {
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: #0061FB;
}

.risk-notes {
  width: 100%;
  min-height: 56px;
  border: 1px solid #d6dde8;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  resize: vertical;
  outline: none;
  color: #334155;
}

.risk-meta {
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}
</style>
