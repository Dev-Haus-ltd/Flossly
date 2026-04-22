<template>
  <div class="cnt-wrap">
    <div class="cnt-header">
      <div>
        <div class="cnt-title">{{ title }}</div>
        <div class="cnt-subtitle">{{ subtitle }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">New Template</v-btn>
    </div>

    <v-tabs v-model="activeType" color="primary" class="mb-4">
      <v-tab value="diagnosis">Diagnosis</v-tab>
      <v-tab value="treatment_plan">Treatment Plan</v-tab>
    </v-tabs>

    <div v-if="loading" class="cnt-empty">Loading templates...</div>
    <div v-else-if="!templates.length" class="cnt-empty">No templates found for this type.</div>
    <div v-else class="cnt-list">
      <div v-for="item in templates" :key="item.id" class="cnt-card">
        <div class="cnt-card__top">
          <div>
            <div class="cnt-card__title">
              {{ item.title }}
              <span class="cnt-badge cnt-badge--category">{{ item.category === 'ai' ? 'Dentally' : 'User' }}</span>
              <span v-if="item.isDefault" class="cnt-badge">Default</span>
            </div>
            <div class="cnt-card__meta">
              <span>{{ item.scope === 'system' ? 'System' : 'Organisation' }}</span>
              <span>Version {{ item.currentVersionNumber || 1 }}</span>
              <span>{{ item.status }}</span>
            </div>
          </div>
          <div class="cnt-actions">
            <v-btn size="small" variant="text" @click="viewVersions(item)">Versions</v-btn>
            <v-btn
              v-if="mode === 'organisation' && item.scope === 'system'"
              size="small"
              variant="text"
              @click="cloneTemplate(item)"
            >
              Clone
            </v-btn>
            <v-btn
              v-if="canEdit(item)"
              size="small"
              variant="text"
              @click="editTemplate(item)"
            >
              Edit
            </v-btn>
            <v-btn
              v-if="canSetDefault(item)"
              size="small"
              variant="text"
              color="primary"
              @click="setDefault(item)"
            >
              Set Default
            </v-btn>
          </div>
        </div>
        <div class="cnt-content" v-html="item.content || '<p>No content yet.</p>'"></div>
      </div>
    </div>

    <v-dialog v-model="editorOpen" max-width="860">
      <v-card>
        <v-card-title>{{ editingId ? 'Edit Template' : 'Create Template' }}</v-card-title>
        <v-card-text>
          <div class="cnt-form">
            <v-text-field v-model="form.title" label="Title" variant="solo" density="compact" flat bg-color="white" />
            <v-text-field v-model="form.key" label="Key" variant="solo" density="compact" flat bg-color="white" />
            <v-select
              v-model="form.type"
              :items="typeOptions"
              item-title="label"
              item-value="value"
              label="Type"
              variant="solo"
              density="compact"
              flat
              bg-color="white"
            />
            <v-select
              v-model="form.category"
              :items="categoryOptions"
              item-title="label"
              item-value="value"
              label="Category"
              variant="solo"
              density="compact"
              flat
              bg-color="white"
            />
            <v-text-field v-model="form.sortOrder" label="Sort order" type="number" variant="solo" density="compact" flat bg-color="white" />
            <v-select
              v-model="form.status"
              :items="statusOptions"
              label="Status"
              variant="solo"
              density="compact"
              flat
              bg-color="white"
            />
            <v-checkbox v-model="form.isDefault" label="Set as default for this type" hide-details />
            <v-text-field v-model="form.changeNote" label="Change note" variant="solo" density="compact" flat bg-color="white" />
            <v-textarea v-model="form.content" label="Template content" rows="12" auto-grow variant="solo" density="compact" flat bg-color="white" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveTemplate">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="versionsOpen" max-width="720">
      <v-card>
        <v-card-title>Template Versions</v-card-title>
        <v-card-text>
          <div v-if="versionsLoading" class="cnt-empty">Loading versions...</div>
          <div v-else-if="!versions.length" class="cnt-empty">No versions found.</div>
          <div v-else class="cnt-versions">
            <div v-for="version in versions" :key="version.id" class="cnt-version">
              <div class="cnt-version__meta">
                <strong>Version {{ version.versionNumber }}</strong>
                <span>{{ formatDate(version.createdAt) }}</span>
                <span>{{ version.changeNote || 'No change note' }}</span>
              </div>
              <div class="cnt-version__content">{{ previewText(version.content) }}</div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="versionsOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import adminService from '~/services/adminService'
import orgService from '~/services/orgService'
import patientChartingService from '~/services/patientChartingService'

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
const versionsOpen = ref(false)
const versionsLoading = ref(false)
const versions = ref([])

const typeOptions = [
  { label: 'Diagnosis', value: 'diagnosis' },
  { label: 'Treatment Plan', value: 'treatment_plan' },
]
const categoryOptions = [
  { label: 'Dentally Templates', value: 'ai' },
  { label: 'User Templates', value: 'user' },
]
const statusOptions = ['active', 'archived']
const title = computed(() => props.mode === 'admin' ? 'System Clinical Note Templates' : 'Clinical Note Templates')
const subtitle = computed(() =>
  props.mode === 'admin'
    ? 'Manage system templates and defaults for all practices.'
    : 'Manage organisation templates, clone system templates, and choose defaults.'
)

const form = reactive({
  title: '',
  key: '',
  type: 'diagnosis',
  category: 'user',
  sortOrder: 0,
  status: 'active',
  isDefault: false,
  changeNote: '',
  content: '',
})

function resetForm() {
  editingId.value = null
  form.title = ''
  form.key = ''
  form.type = activeType.value
  form.category = props.mode === 'admin' ? 'ai' : 'user'
  form.sortOrder = 0
  form.status = 'active'
  form.isDefault = false
  form.changeNote = ''
  form.content = ''
}

function canEdit(item) {
  return props.mode === 'admin' || item.scope === 'organisation'
}

function canSetDefault(item) {
  return props.mode === 'admin' || item.scope === 'organisation'
}

function getListService() {
  return props.mode === 'admin'
    ? () => adminService.listClinicalNoteTemplates({ type: activeType.value, status: 'active' })
    : () => patientChartingService.listClinicalNoteTemplates(activeType.value)
}

async function loadTemplates() {
  loading.value = true
  try {
    const res = await getListService()()
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
  form.changeNote = ''
  form.content = item.content || ''
  editorOpen.value = true
}

async function saveTemplate() {
  saving.value = true
  try {
    const payload = {
      ...(editingId.value ? { id: editingId.value } : {}),
      title: form.title,
      key: form.key,
      type: form.type,
      category: form.category,
      sortOrder: Number(form.sortOrder || 0),
      status: form.status,
      isDefault: form.isDefault,
      changeNote: form.changeNote,
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

async function cloneTemplate(item) {
  try {
    await orgService.cloneClinicalNoteTemplate({ sourceTemplateId: item.id, title: item.title })
    await loadTemplates()
    mainStore?.setSnackbar?.({ title: 'Template cloned to organisation', type: 'success' })
  } catch (err) {
    console.error('Failed to clone template:', err)
    mainStore?.setSnackbar?.({ title: err?.message || 'Failed to clone template', type: 'error' })
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
.cnt-wrap {
  display: grid;
  gap: 16px;
}

.cnt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.cnt-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.cnt-subtitle {
  font-size: 13px;
  color: #64748b;
}

.cnt-list,
.cnt-versions {
  display: grid;
  gap: 12px;
}

.cnt-card,
.cnt-version {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
}

.cnt-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.cnt-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.cnt-card__meta,
.cnt-version__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #64748b;
}

.cnt-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.cnt-content {
  color: #334155;
  font-size: 13px;
}

.cnt-badge {
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 3px 8px;
  border-radius: 999px;
}

.cnt-badge--category {
  color: #4338ca;
  background: #e0e7ff;
}

.cnt-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #fff;
  padding: 24px;
  text-align: center;
  color: #64748b;
}

.cnt-form {
  display: grid;
  gap: 12px;
}

.cnt-version__content {
  margin-top: 10px;
  font-size: 13px;
  color: #334155;
}
</style>
