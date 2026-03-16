<template>
  <div class="diag-panel">
    <div class="diag-panel__header">
      <span class="diag-panel__title">Diagnosis Chart</span>
      <div class="diag-panel__tabs">
        <button
          class="diag-tab-btn"
          :class="{ 'diag-tab-btn--active': activeTab === 'findings' }"
          @click="activeTab = 'findings'"
        >
          Findings
        </button>
        <button
          class="diag-tab-btn"
          :class="{ 'diag-tab-btn--active': activeTab === 'images' }"
          @click="activeTab = 'images'"
        >
          <v-icon size="15" class="mr-1">mdi-image-outline</v-icon>
          Images
        </button>
        <button
          class="diag-tab-btn"
          :class="{ 'diag-tab-btn--active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <v-icon size="15" class="mr-1">mdi-history</v-icon>
          History
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'findings'" class="diag-body">
      <div v-if="!baseItems.length" class="diag-empty">
        No findings recorded. Select a condition on the left and click a tooth above.
      </div>

      <div v-else class="diag-findings-list">
        <div
          v-for="item in baseItems"
          :key="rowKey(item)"
          :data-item-key="rowKey(item)"
          class="diag-item-wrap"
        >
          <div class="diag-row" @click="toggleExpand(item)">
            <button class="diag-row-toggle" :class="{ 'diag-row-toggle--open': isExpanded(item) }">
              <v-icon size="16">mdi-chevron-right</v-icon>
            </button>
            <span class="diag-dot" :style="{ background: condColor(item.condition) }" />
            <span class="diag-col diag-col--date">{{ formatDate(item.createdAt) }}</span>
            <span class="diag-col diag-col--tooth">{{ toothLabel(item) }}</span>
            <span class="diag-col diag-col--name">{{ item.conditionLabel || item.condition || 'Finding' }}</span>
            <span class="diag-col diag-col--surface">{{ item.surface || 'Full tooth' }}</span>
            <button class="diag-icon-btn diag-icon-btn--danger" title="Remove" @click.stop="emit('remove', item.id || item._tempId)">
              <v-icon size="14">mdi-trash-can-outline</v-icon>
            </button>
          </div>

          <div v-if="isExpanded(item)" class="diag-expand">
            <div class="diag-fields">
              <label class="diag-field">
                <span>Status</span>
                <select v-model="draft.status">
                  <option value="existing">Existing</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label class="diag-field">
                <span>Completed on</span>
                <input v-model="draft.completedOn" type="date" />
              </label>
              <label class="diag-field">
                <span>Practitioner</span>
                <select v-model.number="draft.practitionerId">
                  <option :value="null">Select practitioner</option>
                  <option v-for="p in practitioners" :key="p.id" :value="Number(p.id)">{{ p.name }}</option>
                </select>
              </label>
              <label class="diag-field">
                <span>Invoice desc.</span>
                <input v-model="draft.invoiceDesc" type="text" placeholder="Optional description..." />
              </label>
            </div>

            <ChartRichTextEditor
              v-model="draft.notes"
              placeholder="Add diagnosis notes for this chart entry..."
            />

            <div class="diag-expand-actions">
              <v-btn variant="text" @click="closeExpanded">Cancel</v-btn>
              <v-btn color="primary" variant="flat" @click="saveExpanded">Save</v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'images'" class="diag-body diag-body--images">
      <div class="diag-upload-card">
        <div class="diag-upload-form">
          <label class="diag-field">
            <span>Type</span>
            <select v-model="imgForm.type">
              <option v-for="t in IMAGE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label class="diag-field">
            <span>Grade</span>
            <select v-model="imgForm.grade">
              <option v-for="g in IMAGE_GRADES" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
          </label>
          <label class="diag-field">
            <span>Developed by</span>
            <select v-model.number="imgForm.developedBy">
              <option :value="null">-</option>
              <option v-for="p in practitioners" :key="p.id" :value="Number(p.id)">{{ p.name }}</option>
            </select>
          </label>
          <label class="diag-field">
            <span>Taken by</span>
            <select v-model.number="imgForm.takenBy">
              <option :value="null">-</option>
              <option v-for="p in practitioners" :key="p.id" :value="Number(p.id)">{{ p.name }}</option>
            </select>
          </label>
          <label class="diag-field">
            <span>Date taken</span>
            <input v-model="imgForm.dateTaken" type="date" />
          </label>
          <label class="diag-field">
            <span>Justification</span>
            <select v-model="imgForm.justification">
              <option v-for="j in IMAGE_JUSTIFICATIONS" :key="j" :value="j === '-' ? '' : j">{{ j }}</option>
            </select>
          </label>
          <label class="diag-field diag-field--full">
            <span>Description</span>
            <textarea v-model="imgForm.description" rows="2" placeholder="Optional description..." />
          </label>
        </div>

        <div class="diag-upload-drop">
          <DirectFileUpload :disabled="imgUploading" @upload="onImagesSelected" />
          <p v-if="imgUploading" class="diag-upload-state">Uploading {{ pendingImageName || 'image' }}...</p>
          <p v-else-if="pendingImageName" class="diag-upload-state">{{ pendingImageName }} selected</p>
        </div>
      </div>

      <div v-if="!images.length" class="diag-empty">No images uploaded yet</div>
      <div v-else class="diag-images-grid">
        <div v-for="img in images" :key="img.id" class="diag-image-card">
          <a :href="img.url" target="_blank" rel="noopener">
            <img :src="img.url" :alt="img.name" class="diag-image" />
          </a>
          <div class="diag-image-meta">
            <div class="diag-image-badges">
              <span v-if="img.type" class="diag-badge">{{ img.type }}</span>
              <span v-if="img.grade" class="diag-badge diag-badge--grade">Grade {{ img.grade }}</span>
            </div>
            <div class="diag-image-info">
              <span v-if="img.dateTaken" class="diag-image-sub">{{ img.dateTaken }}</span>
              <span v-if="img.takenByName || img.developedByName" class="diag-image-sub">{{ img.takenByName || img.developedByName }}</span>
              <span v-if="img.justification" class="diag-image-sub">{{ img.justification }}</span>
              <span v-if="img.description" class="diag-image-desc">{{ img.description }}</span>
            </div>
            <div class="diag-image-actions">
              <span class="diag-image-name">{{ img.name }}</span>
              <button class="diag-icon-btn diag-icon-btn--danger" @click="emit('remove-image', img.id)">
                <v-icon size="14">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="diag-body">
      <div v-if="!history.length" class="diag-empty">No history yet</div>
      <div v-for="entry in history" :key="entry.id" class="diag-history-item">
        <div class="diag-history-title">{{ entry.action }}</div>
        <div class="diag-history-sub">{{ entry.details }}</div>
        <div class="diag-history-time">{{ formatDate(entry.at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DirectFileUpload from '@/components/Common/directFileUpload.vue'
import ChartRichTextEditor from './ChartRichTextEditor.vue'
import { getToothLabel, CONDITIONS } from './toothData.js'

const props = defineProps({
  baseItems: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  practitioners: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  history: { type: Array, default: () => [] },
})

const emit = defineEmits(['remove', 'update', 'add-image', 'remove-image'])

const activeTab = ref('findings')
const expandedRowId = ref(null)
const imgUploading = ref(false)
const pendingImageName = ref('')

const draft = reactive({
  id: null,
  status: 'existing',
  completedOn: '',
  practitionerId: null,
  invoiceDesc: '',
  notes: '',
})

const imgForm = reactive({
  type: 'Radiograph',
  grade: '',
  developedBy: null,
  justification: '',
  takenBy: null,
  dateTaken: new Date().toISOString().slice(0, 10),
  description: '',
})

const IMAGE_TYPES = ['Radiograph', 'Photograph', 'Study model', 'Other']
const IMAGE_GRADES = [
  { label: '-', value: '' },
  { label: 'Acceptable (A)', value: 'A' },
  { label: 'Not acceptable (N)', value: 'N' },
]
const IMAGE_JUSTIFICATIONS = ['-', 'Caries diagnosis', 'Investigation', 'Periodontal', 'Endodontic', 'Periapical Status', 'Surgical/Implant', 'Extraction', 'Orthodontics']

function rowKey(item) {
  return item.id || item._tempId
}

function isExpanded(item) {
  return expandedRowId.value === rowKey(item)
}

function resetDraft() {
  draft.id = null
  draft.status = 'existing'
  draft.completedOn = ''
  draft.practitionerId = null
  draft.invoiceDesc = ''
  draft.notes = ''
}

async function openExpanded(item) {
  draft.id = rowKey(item)
  draft.status = item.status || 'existing'
  draft.completedOn = item.completedAt ? new Date(item.completedAt).toISOString().slice(0, 10) : ''
  draft.practitionerId = item.practitionerId ? Number(item.practitionerId) : null
  draft.invoiceDesc = item.invoiceDesc || item.conditionLabel || item.condition || ''
  draft.notes = item.notes || ''
  expandedRowId.value = rowKey(item)
}

function closeExpanded() {
  expandedRowId.value = null
  resetDraft()
}

async function toggleExpand(item) {
  if (isExpanded(item)) {
    closeExpanded()
    return
  }
  closeExpanded()
  await openExpanded(item)
}

function saveExpanded() {
  if (!draft.id) return
  const practitionerName = props.practitioners.find((p) => Number(p.id) === Number(draft.practitionerId))?.name || ''
  emit('update', {
    id: draft.id,
    status: draft.status,
    notes: draft.notes,
    practitionerId: draft.practitionerId || null,
    practitionerName,
    clinicianName: practitionerName,
    invoiceDesc: draft.invoiceDesc || '',
    completedAt: draft.completedOn ? new Date(draft.completedOn).toISOString() : null,
  })
  closeExpanded()
}

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation)
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function condColor(key) {
  return CONDITIONS[key]?.color || '#9e9e9e'
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })
}

async function onImagesSelected(files) {
  const selected = Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean)
  if (!selected.length) return
  imgUploading.value = true
  pendingImageName.value = selected.map((file) => file.name).join(', ')
  const practitionerList = props.practitioners || []
  const devPrac = practitionerList.find((p) => Number(p.id) === Number(imgForm.developedBy))
  const takenPrac = practitionerList.find((p) => Number(p.id) === Number(imgForm.takenBy))
  selected.forEach((file) => {
    emit('add-image', {
      file,
      meta: {
        type: imgForm.type,
        grade: imgForm.grade,
        developedBy: imgForm.developedBy,
        developedByName: devPrac?.name || '',
        justification: imgForm.justification,
        takenBy: imgForm.takenBy,
        takenByName: takenPrac?.name || '',
        dateTaken: imgForm.dateTaken,
        description: imgForm.description,
      },
    })
  })
  imgUploading.value = false
}

watch(
  () => props.images.length,
  () => {
    pendingImageName.value = ''
  }
)
</script>

<style scoped>
.diag-panel {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
}

.diag-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
  flex-wrap: wrap;
}

.diag-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}

.diag-panel__tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.diag-tab-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  color: #555;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.diag-tab-btn--active {
  background: #0061fb;
  border-color: #0061fb;
  color: #fff;
  font-weight: 600;
}

.diag-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 430px;
  overflow: auto;
}

.diag-body--images {
  max-height: none;
}

.diag-empty {
  padding: 18px 4px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

.diag-findings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diag-item-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.diag-row {
  display: grid;
  grid-template-columns: 32px 14px 150px 80px minmax(180px, 1fr) 110px 34px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 8px 10px;
  cursor: pointer;
  background: #fff;
}

.diag-row-toggle,
.diag-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
}

.diag-row-toggle {
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
}

.diag-row-toggle--open {
  background: #eef4ff;
  border-color: #0061fb;
  color: #0061fb;
}

.diag-row-toggle--open :deep(.v-icon) {
  transform: rotate(90deg);
}

.diag-icon-btn--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.diag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.diag-col {
  font-size: 13px;
  color: #374151;
}

.diag-col--date,
.diag-col--tooth,
.diag-col--surface {
  color: #6b7280;
  font-size: 12px;
}

.diag-col--name {
  color: #111827;
  font-weight: 600;
}

.diag-expand {
  border-top: 1px solid #eef2f7;
  padding: 12px;
  background: #f8fbff;
}

.diag-fields,
.diag-upload-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.diag-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diag-field--full {
  grid-column: 1 / -1;
}

.diag-field span {
  font-size: 11px;
  color: #6b7280;
}

.diag-field input,
.diag-field select,
.diag-field textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  padding: 8px 10px;
  font-size: 13px;
  color: #334155;
}

.diag-field input,
.diag-field select {
  height: 34px;
}

.diag-expand-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.diag-upload-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: #f8fbff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
}

.diag-upload-drop {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diag-upload-state {
  text-align: center;
  font-size: 12px;
  color: #0061fb;
}

.diag-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.diag-image-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.diag-image {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
}

.diag-image-meta {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diag-image-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.diag-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
}

.diag-badge--grade {
  background: #fef9c3;
  color: #854d0e;
}

.diag-image-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.diag-image-sub {
  font-size: 11px;
  color: #6b7280;
}

.diag-image-desc {
  font-size: 11px;
  color: #374151;
  font-style: italic;
}

.diag-image-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 4px;
}

.diag-image-name {
  flex: 1;
  font-size: 11px;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.diag-history-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
}

.diag-history-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.diag-history-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.diag-history-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .diag-upload-card,
  .diag-fields,
  .diag-upload-form {
    grid-template-columns: 1fr;
  }

  .diag-row {
    grid-template-columns: 32px 14px 110px 60px minmax(120px, 1fr) 90px 34px;
  }
}
</style>
