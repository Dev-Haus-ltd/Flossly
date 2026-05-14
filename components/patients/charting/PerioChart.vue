<template>
  <div class="perio-chart">

    <!-- BPE Scores -->
    <div class="perio-section">
      <div class="perio-section__title">BPE Scores (Basic Periodontal Examination)</div>
      <div class="perio-bpe-grid">
        <div v-for="sextant in SEXTANTS" :key="sextant.id" class="perio-sextant">
          <div class="perio-sextant__label">{{ sextant.label }}</div>
          <div class="perio-sextant__teeth">{{ sextant.teeth }}</div>
          <select
            class="perio-bpe-select"
            :class="bpeClass(localBpe[sextant.id])"
            :value="localBpe[sextant.id] || ''"
            @change="onBpeChange(sextant.id, $event.target.value)"
          >
            <option value="">–</option>
            <option v-for="score in BPE_SCORES" :key="score" :value="score">{{ score }}</option>
          </select>
        </div>
      </div>
      <div class="perio-bpe-legend">
        <span class="bpe-key bpe-key--0">0 = Healthy</span>
        <span class="bpe-key bpe-key--1">1 = Bleeding</span>
        <span class="bpe-key bpe-key--2">2 = Calculus</span>
        <span class="bpe-key bpe-key--3">3 = Pocket 4–5mm</span>
        <span class="bpe-key bpe-key--4">4 = Pocket ≥6mm</span>
        <span class="bpe-key bpe-key--star">* = Furcation</span>
      </div>
    </div>

    <!-- Pocket Depths -->
    <div class="perio-section">
      <div class="perio-section__title d-flex align-center justify-space-between">
        <span>Pocket Depths (mm)</span>
        <span class="perio-hint">3 buccal sites (MB · B · DB) + 3 lingual sites (ML · L · DL)</span>
      </div>
      <div class="perio-pd-scroll">
        <table class="perio-pd-table">
          <thead>
            <tr>
              <th class="perio-td--tooth">Tooth</th>
              <th v-for="h in PD_HEADERS" :key="h" class="perio-td--site">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fdi in CHARTED_TEETH" :key="fdi">
              <td class="perio-td--tooth">{{ fdi }}</td>
              <td v-for="site in PD_SITES" :key="site" class="perio-td--val">
                <input
                  type="number"
                  min="0"
                  max="20"
                  class="perio-pd-input"
                  :class="pdClass(getPd(fdi, site))"
                  :value="getPd(fdi, site)"
                  @change="onPdChange(fdi, site, $event.target.value)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notes -->
    <div class="perio-section">
      <div class="perio-section__title">Periodontal Notes</div>
      <textarea
        class="perio-notes"
        placeholder="Record periodontal findings, treatment plan, recall interval..."
        :value="localNotes"
        @input="onNotesChange($event.target.value)"
      />
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  periData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update'])

const SEXTANTS = [
  { id: 'UR', label: 'Upper Right', teeth: '18–14' },
  { id: 'UF', label: 'Upper Front', teeth: '13–23' },
  { id: 'UL', label: 'Upper Left',  teeth: '24–28' },
  { id: 'LL', label: 'Lower Left',  teeth: '38–34' },
  { id: 'LF', label: 'Lower Front', teeth: '33–43' },
  { id: 'LR', label: 'Lower Right', teeth: '44–48' },
]

const BPE_SCORES = ['0', '1', '2', '3', '4', '4*']
const PD_SITES   = ['mb', 'b', 'db', 'ml', 'l', 'dl']
const PD_HEADERS = ['MB', 'B', 'DB', 'ML', 'L', 'DL']

const CHARTED_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

const localBpe   = reactive({ ...(props.periData?.bpe || {}) })
const localPd    = reactive({ ...(props.periData?.pocketDepths || {}) })
const localNotes = ref(props.periData?.notes || '')

watch(() => props.periData, (v) => {
  Object.keys(localBpe).forEach(k => delete localBpe[k])
  Object.assign(localBpe, v?.bpe || {})
  Object.keys(localPd).forEach(k => delete localPd[k])
  Object.assign(localPd, v?.pocketDepths || {})
  localNotes.value = v?.notes || ''
}, { deep: true })

function emitUpdate() {
  emit('update', {
    bpe: { ...localBpe },
    pocketDepths: JSON.parse(JSON.stringify(localPd)),
    notes: localNotes.value,
  })
}

function onBpeChange(sextant, val) {
  localBpe[sextant] = val
  emitUpdate()
}

function getPd(fdi, site) {
  return localPd[fdi]?.[site] ?? ''
}

function onPdChange(fdi, site, val) {
  if (!localPd[fdi]) localPd[fdi] = {}
  localPd[fdi][site] = val === '' ? null : Number(val)
  emitUpdate()
}

function onNotesChange(val) {
  localNotes.value = val
  emitUpdate()
}

function bpeClass(score) {
  if (!score && score !== '0') return ''
  if (score === '0') return 'bpe--0'
  if (score === '1') return 'bpe--1'
  if (score === '2') return 'bpe--2'
  if (score === '3') return 'bpe--3'
  return 'bpe--4'
}

function pdClass(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  if (n <= 3) return 'pd--green'
  if (n === 4) return 'pd--amber'
  return 'pd--red'
}
</script>

<style scoped>
.perio-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.perio-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.perio-section__title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.perio-hint {
  font-size: 11px;
  font-weight: 400;
  color: #9ca3af;
}

.perio-bpe-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.perio-sextant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.perio-sextant__label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
}

.perio-sextant__teeth {
  font-size: 10px;
  color: #9ca3af;
}

.perio-bpe-select {
  width: 80px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.bpe--0 { border-color: #86efac; background: #f0fdf4; color: #166534; }
.bpe--1 { border-color: #fde047; background: #fefce8; color: #854d0e; }
.bpe--2 { border-color: #fb923c; background: #fff7ed; color: #9a3412; }
.bpe--3 { border-color: #f87171; background: #fef2f2; color: #991b1b; }
.bpe--4 { border-color: #dc2626; background: #fef2f2; color: #7f1d1d; }

.perio-bpe-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bpe-key {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.bpe-key--0  { background: #f0fdf4; border-color: #86efac; color: #166534; }
.bpe-key--1  { background: #fefce8; border-color: #fde047; color: #854d0e; }
.bpe-key--2  { background: #fff7ed; border-color: #fb923c; color: #9a3412; }
.bpe-key--3  { background: #fef2f2; border-color: #f87171; color: #991b1b; }
.bpe-key--4  { background: #fef2f2; border-color: #dc2626; color: #7f1d1d; }
.bpe-key--star { background: #fdf4ff; border-color: #d8b4fe; color: #6b21a8; }

.perio-pd-scroll {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.perio-pd-table {
  border-collapse: collapse;
  font-size: 12px;
  min-width: 520px;
  width: 100%;
}

.perio-pd-table th,
.perio-pd-table td {
  border: 1px solid #f0f0f0;
  padding: 3px 4px;
  text-align: center;
}

.perio-pd-table th {
  background: #fafafa;
  font-weight: 600;
  color: #374151;
}

.perio-td--tooth {
  font-weight: 600;
  color: #374151;
  min-width: 44px;
  background: #f9fafb;
  font-size: 11px;
}

.perio-td--val {
  padding: 2px;
}

.perio-pd-input {
  width: 34px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  outline: none;
  padding: 0;
}

.perio-pd-input:focus { border-color: #0061FB; }

.pd--green { background: #f0fdf4; border-color: #86efac; color: #166534; }
.pd--amber { background: #fefce8; border-color: #fde047; color: #854d0e; }
.pd--red   { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }

.perio-notes {
  width: 100%;
  min-height: 80px;
  border: 1px solid #d6dde8;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  resize: vertical;
  outline: none;
  color: #334155;
}
</style>
