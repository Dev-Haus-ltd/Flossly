<template>
  <div class="ste-panel">
    <div class="ste-intro">
      Record findings for each anatomical site. Mark as <strong>Abnormal</strong> and add notes for any site requiring investigation or follow-up. This forms part of the patient's clinical record.
    </div>

    <div class="ste-grid">
      <div v-for="site in SITES" :key="site.key" class="ste-site" :class="{ 'ste-site--abnormal': getStatus(site.key) === 'abnormal' }">
        <div class="ste-site__header">
          <span class="ste-site__name">{{ site.label }}</span>
          <div class="ste-site__controls">
            <label
              class="ste-radio"
              :class="{ 'ste-radio--active-normal': getStatus(site.key) === 'normal' }"
            >
              <input type="radio" :name="site.key" value="normal" :checked="getStatus(site.key) === 'normal'" @change="setStatus(site.key, 'normal')" />
              NAD
            </label>
            <label
              class="ste-radio"
              :class="{ 'ste-radio--active-abnormal': getStatus(site.key) === 'abnormal' }"
            >
              <input type="radio" :name="site.key" value="abnormal" :checked="getStatus(site.key) === 'abnormal'" @change="setStatus(site.key, 'abnormal')" />
              Abnormal
            </label>
          </div>
        </div>
        <textarea
          v-if="getStatus(site.key) === 'abnormal' || getNotes(site.key)"
          class="ste-notes"
          placeholder="Describe findings, size, colour, texture, duration..."
          :value="getNotes(site.key)"
          @input="setNotes(site.key, $event.target.value)"
        />
      </div>
    </div>

    <div v-if="hasAbnormal" class="ste-alert">
      <v-icon size="16" color="warning" class="mr-1">mdi-alert</v-icon>
      {{ abnormalSites.join(', ') }} — refer for further investigation if lesion persists &gt;3 weeks.
    </div>

    <div class="ste-footer">
      <span class="ste-timestamp" v-if="lastUpdated">Last updated: {{ lastUpdated }}</span>
      <v-btn variant="text" size="small" @click="markAllNormal">Mark all NAD</v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  softTissueData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update'])

const SITES = [
  { key: 'lips',         label: 'Lips' },
  { key: 'tongue',       label: 'Tongue' },
  { key: 'floorMouth',   label: 'Floor of Mouth' },
  { key: 'buccalMucosa', label: 'Buccal Mucosa' },
  { key: 'hardPalate',   label: 'Hard Palate' },
  { key: 'softPalate',   label: 'Soft Palate' },
  { key: 'oropharynx',   label: 'Oropharynx' },
]

const local = reactive(
  Object.fromEntries(SITES.map(s => [s.key, { status: 'normal', notes: '' }]))
)
const lastUpdated = ref('')

watch(() => props.softTissueData, (v) => {
  if (!v) return
  SITES.forEach(s => {
    if (v[s.key]) {
      local[s.key] = { status: v[s.key].status || 'normal', notes: v[s.key].notes || '' }
    }
  })
  if (v._updatedAt) lastUpdated.value = new Date(v._updatedAt).toLocaleString('en-GB')
}, { immediate: true, deep: true })

const hasAbnormal = computed(() => SITES.some(s => local[s.key]?.status === 'abnormal'))
const abnormalSites = computed(() => SITES.filter(s => local[s.key]?.status === 'abnormal').map(s => s.label))

function getStatus(key) { return local[key]?.status || 'normal' }
function getNotes(key)  { return local[key]?.notes  || '' }

function setStatus(key, val) {
  local[key] = { ...local[key], status: val }
  emitUpdate()
}

function setNotes(key, val) {
  local[key] = { ...local[key], notes: val }
  emitUpdate()
}

function markAllNormal() {
  SITES.forEach(s => { local[s.key] = { status: 'normal', notes: '' } })
  emitUpdate()
}

function emitUpdate() {
  const now = new Date().toISOString()
  lastUpdated.value = new Date(now).toLocaleString('en-GB')
  emit('update', { ...JSON.parse(JSON.stringify(local)), _updatedAt: now })
}
</script>

<style scoped>
.ste-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ste-intro {
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  line-height: 1.5;
}

.ste-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.ste-site {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s;
}

.ste-site--abnormal {
  border-color: #fca5a5;
  background: #fff8f8;
}

.ste-site__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ste-site__name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.ste-site__controls {
  display: flex;
  gap: 6px;
}

.ste-radio {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  user-select: none;
  background: #fafafa;
  color: #6b7280;
  transition: all 0.1s;
}

.ste-radio input { display: none; }

.ste-radio--active-normal   { background: #f0fdf4; border-color: #86efac; color: #166534; font-weight: 700; }
.ste-radio--active-abnormal { background: #fef2f2; border-color: #fca5a5; color: #991b1b; font-weight: 700; }

.ste-notes {
  width: 100%;
  min-height: 50px;
  border: 1px solid #d6dde8;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  resize: vertical;
  outline: none;
  color: #334155;
}

.ste-alert {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: #92400e;
  display: flex;
  align-items: flex-start;
}

.ste-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ste-timestamp {
  font-size: 11px;
  color: #9ca3af;
}
</style>
