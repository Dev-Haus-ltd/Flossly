<template>
  <div class="tm-wrap">
    <!-- Header -->
    <div class="tm-header">
      <div>
        <div class="tm-title">Clinical Note Templates</div>
        <div class="tm-subtitle">Manage organisation templates and customise shared defaults for this practice.</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="openCreateDialog">
        New Template
      </v-btn>
    </div>

    <!-- Type Tabs -->
    <div class="tm-tabs">
      <button
        v-for="tab in typeTabs"
        :key="tab.value"
        class="tm-tab"
        :class="{ 'tm-tab--active': activeType === tab.value }"
        @click="activeType = tab.value"
      >
        <v-icon size="16" class="mr-1">{{ tab.icon }}</v-icon>
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="tm-state">
      <v-progress-circular indeterminate color="primary" size="32" />
      <span class="tm-state__text">Loading templates…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!templates.length" class="tm-state tm-state--empty">
      <v-icon size="48" color="#cbd5e1">mdi-file-document-outline</v-icon>
      <span class="tm-state__text">No templates found for this type.</span>
      <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-plus" @click="openCreateDialog">
        Create one
      </v-btn>
    </div>

    <!-- Template Cards -->
    <div v-else class="tm-grid">
      <div v-for="item in templates" :key="item.id" class="tm-card">
        <div class="tm-card__head">
          <div class="tm-card__icon">
            <v-icon size="20" color="#0061FB">mdi-file-document-edit-outline</v-icon>
          </div>
          <div class="tm-card__info">
            <div class="tm-card__title">{{ item.title }}</div>
            <div class="tm-card__badges">
              <span class="tm-badge tm-badge--scope">
                {{ item.scope === 'system' ? 'System' : 'Organisation' }}
              </span>
              <span v-if="item.isDefault" class="tm-badge tm-badge--default">
                <v-icon size="10" class="mr-1">mdi-check-circle</v-icon>Default
              </span>
            </div>
            <div class="tm-card__meta">
              <span>v{{ item.currentVersionNumber || 1 }}</span>
              <span class="tm-dot" />
              <span>{{ item.status }}</span>
            </div>
          </div>
          <div class="tm-card__actions">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              icon="mdi-history"
              @click="viewVersions(item)"
            />
            <v-btn
              v-if="canManage(item)"
              size="small"
              variant="tonal"
              color="primary"
              rounded="lg"
              @click="editTemplate(item)"
            >
              Edit
            </v-btn>
            <v-btn
              v-if="canManage(item) && !item.isDefault"
              size="small"
              variant="tonal"
              color="success"
              rounded="lg"
              @click="setDefault(item)"
            >
              Set Default
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :icon="collapsedIds.has(item.id) ? 'mdi-chevron-down' : 'mdi-chevron-up'"
              @click="toggleCollapse(item.id)"
            />
          </div>
        </div>
        <div v-if="!collapsedIds.has(item.id)" class="tm-card__preview" v-html="item.content || '<p>No content yet.</p>'" />
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="editorOpen" max-width="820" scrollable>
      <v-card rounded="xl">
        <v-card-title class="tm-dialog__title">
          <div class="d-flex align-center" style="gap: 8px;">
            <v-icon size="20" color="primary">mdi-file-document-edit-outline</v-icon>
            {{ editingId ? 'Edit Template' : 'New Template' }}
          </div>
          <v-btn flat icon size="32" @click="editorOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6" style="background:#f5f5f5;">
          <v-card elevation="0" class="pa-4">
            <v-row dense>
              <v-col cols="6">
                <label class="fld-lbl">Title <span class="fld-required">*</span></label>
                <v-text-field
                  v-model="form.title"
                  variant="solo"
                  density="compact"
                  class="input-bordered"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <label class="fld-lbl">Type</label>
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  variant="solo"
                  density="compact"
                  class="input-bordered"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <label class="fld-lbl">Status</label>
                <v-select
                  v-model="form.status"
                  :items="statusOptions"
                  variant="solo"
                  density="compact"
                  class="input-bordered"
                  bg-color="white"
                  flat
                  hide-details
                />
              </v-col>
              <v-col cols="6" class="d-flex align-end pb-2">
                <v-checkbox
                  v-model="form.isDefault"
                  label="Set as default for this type"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <label class="fld-lbl">Template Content</label>
                <div class="mt-1">
                  <PatientsChartingChartRichTextEditor
                    :key="editorKey"
                    v-model="form.content"
                    placeholder="Write your template content…"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="editorOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="saving" @click="saveTemplate">
            Save Template
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Versions Dialog -->
    <v-dialog v-model="versionsOpen" max-width="660" scrollable>
      <v-card rounded="xl">
        <v-card-title class="tm-dialog__title">
          <v-icon size="20" class="mr-2" color="primary">mdi-history</v-icon>
          Version History
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div v-if="versionsLoading" class="tm-state">
            <v-progress-circular indeterminate color="primary" size="28" />
            <span class="tm-state__text">Loading versions…</span>
          </div>
          <div v-else-if="!versions.length" class="tm-state tm-state--empty">
            <v-icon size="40" color="#cbd5e1">mdi-history</v-icon>
            <span class="tm-state__text">No versions found.</span>
          </div>
          <div v-else class="tm-versions">
            <div v-for="version in versions" :key="version.id" class="tm-version">
              <div class="tm-version__marker">
                <div class="tm-version__dot" />
                <div class="tm-version__line" />
              </div>
              <div class="tm-version__body">
                <div class="tm-version__head">
                  <span class="tm-version__num">Version {{ version.versionNumber }}</span>
                  <span class="tm-version__date">{{ formatDate(version.createdAt) }}</span>
                </div>
                <div v-if="version.changeNote" class="tm-version__note">{{ version.changeNote }}</div>
                <div class="tm-version__preview">{{ previewText(version.content) }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="versionsOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import adminService from '~/services/adminService'
import orgService from '~/services/orgService'
import patientChartingService from '~/services/patientChartingService'
import { plainTextToHtml } from '~/lib/editorFormatter'

const props = defineProps({
  mode: { type: String, default: 'organisation' },
})

const mainStore = useMainStore()
const activeType = ref('diagnosis')
const loading = ref(false)
const saving = ref(false)
const templates = ref([])
const editorOpen = ref(false)
const editingId = ref(null)
const editorKey = ref(0)
const versionsOpen = ref(false)
const versionsLoading = ref(false)
const versions = ref([])
const collapsedIds = ref(new Set())

const typeTabs = [
  { label: 'Diagnosis', value: 'diagnosis', icon: 'mdi-stethoscope' },
  { label: 'Treatment Plan', value: 'treatment_plan', icon: 'mdi-clipboard-text-outline' },
]

const typeOptions = [
  { label: 'Diagnosis', value: 'diagnosis' },
  { label: 'Treatment Plan', value: 'treatment_plan' },
]
const statusOptions = ['active', 'archived']

const form = reactive({
  title: '',
  key: '',
  type: 'diagnosis',
  category: 'user',
  sortOrder: 0,
  status: 'active',
  isDefault: false,
  content: '',
})

function toggleCollapse(id) {
  const next = new Set(collapsedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedIds.value = next
}

function resetForm() {
  editingId.value = null
  form.title = ''
  form.key = ''
  form.type = activeType.value
  form.category = props.mode === 'admin' ? 'ai' : 'user'
  form.sortOrder = 0
  form.status = 'active'
  form.isDefault = false
  form.content = ''
}

function canManage(item) {
  return props.mode === 'admin' || ['organisation', 'system'].includes(item.scope)
}

async function loadTemplates() {
  loading.value = true
  try {
    const res = props.mode === 'admin'
      ? await adminService.listClinicalNoteTemplates({ type: activeType.value, status: 'active' })
      : await patientChartingService.listClinicalNoteTemplates(activeType.value)
    const data = Array.isArray(res?.data) ? res.data : []
    templates.value = props.mode === 'admin'
      ? data.filter((item) => item.scope === 'system')
      : data
  } catch (err) {
    console.error('Failed to load clinical note templates:', err)
    mainStore?.setSnackbar?.({ title: err?.message || 'Failed to load templates', type: 'error' })
    templates.value = []
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  resetForm()
  editorKey.value++
  editorOpen.value = true
}

function editTemplate(item) {
  editingId.value = item.id
  form.title = item.title || ''
  form.key = item.key || ''
  form.type = item.type || activeType.value
  form.category = item.category || (item.scope === 'system' ? 'ai' : 'user')
  form.sortOrder = Number(item.sortOrder || 0)
  form.status = item.status || 'active'
  form.isDefault = item.isDefault === true
  form.content = plainTextToHtml(item.content || '')
  editorKey.value++
  editorOpen.value = true
}

async function saveTemplate() {
  saving.value = true
  try {
    const payload = {
      ...(editingId.value ? { id: editingId.value } : {}),
      title: form.title,
      key: form.key || form.title.toLowerCase().replace(/\s+/g, '_'),
      type: form.type,
      category: form.category,
      sortOrder: Number(form.sortOrder || 0),
      status: form.status,
      isDefault: form.isDefault,
      changeNote: editingId.value ? 'Updated' : 'Initial version',
      content: form.content,
    }
    if (props.mode === 'admin') {
      if (editingId.value) await adminService.updateClinicalNoteTemplate(payload)
      else await adminService.createClinicalNoteTemplate(payload)
    } else {
      if (editingId.value) await orgService.updateClinicalNoteTemplate(payload)
      else await orgService.createClinicalNoteTemplate(payload)
    }
    editorOpen.value = false
    await loadTemplates()
    mainStore?.setSnackbar?.({ title: 'Template saved successfully', type: 'success' })
  } catch (err) {
    console.error('Failed to save template:', err)
    mainStore?.setSnackbar?.({ title: err?.message || 'Failed to save template', type: 'error' })
  } finally {
    saving.value = false
  }
}

async function setDefault(item) {
  try {
    if (props.mode === 'admin') {
      await adminService.updateClinicalNoteTemplate({
        id: item.id,
        title: item.title,
        key: item.key,
        type: item.type,
        sortOrder: item.sortOrder,
        status: item.status,
        isDefault: true,
        changeNote: 'Updated default selection',
      })
    } else {
      await orgService.setDefaultClinicalNoteTemplate({ id: item.id, isDefault: true })
    }
    await loadTemplates()
    mainStore?.setSnackbar?.({ title: 'Default template updated', type: 'success' })
  } catch (err) {
    console.error('Failed to set default template:', err)
    mainStore?.setSnackbar?.({ title: err?.message || 'Failed to set default', type: 'error' })
  }
}

async function viewVersions(item) {
  versionsOpen.value = true
  versionsLoading.value = true
  versions.value = []
  try {
    const res = props.mode === 'admin'
      ? await adminService.getClinicalNoteTemplateVersions(item.id)
      : await orgService.listClinicalNoteTemplateVersions(item.id)
    versions.value = Array.isArray(res?.data) ? res.data : []
  } catch (err) {
    console.error('Failed to load versions:', err)
    mainStore?.setSnackbar?.({ title: err?.message || 'Failed to load versions', type: 'error' })
  } finally {
    versionsLoading.value = false
  }
}

function previewText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240) || 'No content'
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(activeType, () => {
  resetForm()
  loadTemplates()
})

onMounted(loadTemplates)
</script>

<style scoped>
/* ── Layout ── */
.tm-wrap {
  display: grid;
  gap: 20px;
  padding: 20px 4px;
}

/* ── Header ── */
.tm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tm-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.tm-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

/* ── Type Tabs (pill bar) ── */
.tm-tabs {
  display: flex;
  gap: 6px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
}

.tm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.18s ease;
}

.tm-tab:hover {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.6);
}

.tm-tab--active {
  background: #fff;
  color: #0061FB;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.10);
}

/* ── State (loading / empty) ── */
.tm-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  border: 1.5px dashed #e2e8f0;
  border-radius: 16px;
  background: #fafafa;
}

.tm-state__text {
  font-size: 14px;
  color: #94a3b8;
}

/* ── Template Grid ── */
.tm-grid {
  display: grid;
  gap: 12px;
}

/* ── Template Card ── */
.tm-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 16px 20px;
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.tm-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 18px rgba(0, 97, 251, 0.07);
}

.tm-card__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.tm-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.tm-card__info {
  flex: 1;
  min-width: 0;
}

.tm-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tm-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.tm-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.tm-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #cbd5e1;
}

.tm-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tm-card__preview {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Badges ── */
.tm-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.tm-badge--scope {
  color: #0369a1;
  background: #e0f2fe;
}

.tm-badge--default {
  color: #15803d;
  background: #dcfce7;
}

/* ── Dialog ── */
.tm-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* ── Form (matches addTask.vue style) ── */
.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
  display: block;
  margin-bottom: 4px;
}

.fld-required {
  color: red;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

/* ── Version History ── */
.tm-versions {
  display: grid;
  gap: 0;
}

.tm-version {
  display: flex;
  gap: 14px;
}

.tm-version__marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 4px;
}

.tm-version__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0061FB;
  flex-shrink: 0;
}

.tm-version__line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  margin-top: 4px;
}

.tm-version:last-child .tm-version__line {
  display: none;
}

.tm-version__body {
  padding-bottom: 20px;
  flex: 1;
}

.tm-version__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.tm-version__num {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.tm-version__date {
  font-size: 12px;
  color: #94a3b8;
}

.tm-version__note {
  font-size: 12px;
  color: #0061FB;
  margin-bottom: 4px;
  font-style: italic;
}

.tm-version__preview {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}
</style>
