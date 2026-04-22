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
          <v-icon size="14">mdi-tooth-outline</v-icon>
          Findings
        </button>
        <button
          class="diag-tab-btn"
          :class="{ 'diag-tab-btn--active': activeTab === 'images' }"
          @click="activeTab = 'images'"
        >
          <v-icon size="14">mdi-image-outline</v-icon>
          Images
        </button>
        <button
          class="diag-tab-btn"
          :class="{ 'diag-tab-btn--active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><path d="M1.75 5.25H12.25M1.75 8.75H12.25M7 1.75V12.25M4.55 1.75H9.45C10.4301 1.75 10.9201 1.75 11.2945 1.94074C11.6238 2.10852 11.8915 2.37623 12.0592 2.70552C12.25 3.07986 12.25 3.56991 12.25 4.55V9.45C12.25 10.4301 12.25 10.9201 12.0592 11.2945C11.8915 11.6238 11.6238 11.8915 11.2945 12.0592C10.9201 12.25 10.4301 12.25 9.45 12.25H4.55C3.56991 12.25 3.07986 12.25 2.70552 12.0592C2.37623 11.8915 2.10852 11.6238 1.94074 11.2945C1.75 10.9201 1.75 10.4301 1.75 9.45V4.55C1.75 3.56991 1.75 3.07986 1.94074 2.70552C2.10852 2.37623 2.37623 2.10852 2.70552 1.94074C3.07986 1.75 3.56991 1.75 4.55 1.75Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
          <div class="diag-row" :class="{ 'diag-row--selected': isSelected(item) }" @click="toggleExpand(item)">
            <button class="diag-row-toggle" :class="{ 'diag-row-toggle--open': isExpanded(item) }">
              <v-icon size="16">mdi-chevron-right</v-icon>
            </button>
            <span class="diag-dot" :style="{ background: rowColor(item) }" />
            <span class="diag-col diag-col--date">{{ formatDate(item.createdAt) }}</span>
            <span class="diag-col diag-col--tooth">
              <span class="diag-tooth-label">{{ toothLabel(item) }}</span>
            </span>
            <span class="diag-col diag-col--name">{{ item.conditionLabel || item.condition || 'Finding' }}</span>
            <span class="diag-col diag-col--surface">{{ rowScopeLabel(item) }}</span>
            <button class="diag-icon-btn diag-icon-btn--danger" title="Remove" @click.stop="emit('remove', item.id || item._tempId)">
              <img :src="deleteIcon" alt="" class="diag-delete-icon" />
            </button>
          </div>
          <div v-if="isExpanded(item)" class="diag-expand">
            <div class="diag-expand__title">Clinical notes</div>
            <ChartRichTextEditor
              v-model="draft.notes"
              placeholder="Write notes..."
            />
            <div class="diag-expand__actions">
              <v-btn variant="text" @click="cancelExpanded">Cancel</v-btn>
              <v-btn color="primary" variant="flat" @click="saveExpanded">Save</v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'images'" class="diag-body diag-body--images">
      <ChartImagesPanel
        :images="images"
        :practitioners="practitioners"
        :uploading="imgUploading"
        @add-image="onAddImage"
        @remove-image="emit('remove-image', $event)"
      />
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
import ChartImagesPanel from './ChartImagesPanel.vue'
import ChartRichTextEditor from './ChartRichTextEditor.vue'
import { CONDITIONS, TEETH_BY_FDI } from './toothData.js'
import deleteIcon from '../../../assets/crm/delete.svg'

const props = defineProps({
  baseItems: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  selectedNoteItemId: { type: [String, Number], default: null },
  practitioners: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  history: { type: Array, default: () => [] },
})

const emit = defineEmits(['remove', 'select-note-item', 'add-image', 'remove-image', 'save-success', 'update'])

const activeTab = ref('findings')
const imgUploading = ref(false)
const STATUS_ANNOTATION_CODE = '__STATUS_ANNOTATION__'
const expandedRowId = ref(null)
const draft = reactive({
  id: null,
  notes: '',
  templateId: null,
})

const toothTypeLabels = {
  incisor: 'Incisor',
  canine: 'Canine',
  premolar: 'Premolar',
  molar: 'Molar',
}

const quadrantLabels = {
  1: 'Upper Right',
  2: 'Upper Left',
  3: 'Lower Left',
  4: 'Lower Right',
}

function rowKey(item) {
  return item.id || item._tempId
}

function isSelected(item) {
  return String(props.selectedNoteItemId || '') === String(rowKey(item))
}

function selectItem(item) {
  emit('select-note-item', item)
}

function isExpanded(item) {
  return String(expandedRowId.value || '') === String(rowKey(item))
}

function openExpanded(item) {
  draft.id = rowKey(item)
  draft.notes = item.notes || ''
  draft.templateId = item.templateId || null
  expandedRowId.value = rowKey(item)
  selectItem(item)
}

function closeExpanded() {
  expandedRowId.value = null
  draft.id = null
  draft.notes = ''
  draft.templateId = null
}

function toggleExpand(item) {
  if (isExpanded(item)) {
    closeExpanded()
    return
  }
  openExpanded(item)
}

function toothLabel(item) {
  const meta = TEETH_BY_FDI[item.fdi] || {}
  const surface = item.surface ? `-${item.surface.charAt(0).toUpperCase()}` : ''
  return `${meta.palmer || item.fdi}${surface}`
}

function condColor(key) {
  return CONDITIONS[key]?.color || '#9e9e9e'
}

function isStatusEntry(item) {
  return String(item?.treatmentCode || '') === STATUS_ANNOTATION_CODE
}

function rowColor(item) {
  if (isStatusEntry(item)) return '#64748b'
  return condColor(item?.condition)
}

function rowScopeLabel(item) {
  if (isStatusEntry(item)) return 'Tooth status'
  return item?.surface || 'Full tooth'
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })
}

async function onAddImage(payload) {
  imgUploading.value = true
  emit('add-image', payload)
  imgUploading.value = false
}

function saveExpanded() {
  if (!draft.id) return
  emit('update', {
    id: draft.id,
    notes: draft.notes || '',
    templateId: draft.templateId || null,
  })
}

function cancelExpanded() {
  const item = props.baseItems.find((entry) => String(rowKey(entry)) === String(draft.id))
  if (!item) {
    closeExpanded()
    return
  }
  draft.notes = item.notes || ''
  draft.templateId = item.templateId || null
}

watch(
  () => props.baseItems,
  (items) => {
    if (!draft.id) return
    const current = (items || []).find((item) => String(rowKey(item)) === String(draft.id))
    if (!current) return
    draft.notes = current.notes || ''
    draft.templateId = current.templateId || null
  },
  { deep: true }
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
  gap: 5px;
  border: none;
  background: #F3F4F6;
  color: #737373;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  height: 32px;
  transition: background 0.15s;
}

.diag-tab-btn:hover:not(.diag-tab-btn--active) {
  background: #e5e7eb;
  color: #374151;
}

.diag-tab-btn--active {
  background: #0061fb;
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
  grid-template-columns: 32px 14px 150px 92px minmax(180px, 1fr) 110px 34px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 8px 10px;
  cursor: pointer;
  background: #fff;
}

.diag-row-toggle {
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

.diag-row-toggle--open {
  background: #eef4ff;
  border-color: #0061FB;
  color: #0061FB;
}

.diag-row-toggle--open :deep(.v-icon) {
  transform: rotate(90deg);
}

.diag-row--selected {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.diag-expand {
  border-top: 1px solid #eef2f7;
  padding: 12px;
  background: #f8fbff;
  display: grid;
  gap: 12px;
}

.diag-expand__title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.diag-expand__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

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

.diag-icon-btn--danger {
  color: #dc2626;
}

.diag-icon-btn--danger:hover {
  background: #fee2e2;
}

.diag-delete-icon {
  width: 14px;
  height: 14px;
  display: block;
  filter: invert(20%) sepia(96%) saturate(2647%) hue-rotate(346deg) brightness(91%) contrast(89%);
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
.diag-col--surface {
  color: #6b7280;
  font-size: 12px;
}

.diag-col--tooth {
  display: inline-flex;
  align-items: center;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.diag-tooth-label {
  color: inherit;
}

.diag-col--name {
  color: #111827;
  font-weight: 600;
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
  .diag-fields {
    grid-template-columns: 1fr;
  }

  .diag-row {
    grid-template-columns: 28px 14px 110px 60px minmax(120px, 1fr) 90px 34px;
  }
}
</style>
