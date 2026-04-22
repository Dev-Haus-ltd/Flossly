<template>
  <div class="cn-editor">
    <div class="cn-toolbar">
      <div class="cn-toolbar__title">Template</div>
      <slot name="header-actions" />
    </div>

    <div class="cn-template-row">
      <v-select
        :model-value="selectedTemplateId"
        :items="templateOptions"
        item-title="label"
        item-value="id"
        variant="solo"
        density="compact"
        class="cn-select"
        bg-color="white"
        flat
        hide-details
        :loading="loadingTemplates"
        @update:model-value="handleTemplateSelect"
      />
      <v-btn
        variant="outlined"
        size="small"
        :disabled="!selectedTemplate"
        @click="applyTemplateContent(true)"
      >
        Load Template
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        :loading="applyingAi"
        :disabled="!selectedTemplateId || !rawNoteValue.trim()"
        @click="applyAi"
      >
        Apply AI
      </v-btn>
    </div>

    <div v-if="warnings.length" class="cn-warnings">
      <div v-for="warning in warnings" :key="warning" class="cn-warning">
        <v-icon size="15">mdi-alert-outline</v-icon>
        <span>{{ warning }}</span>
      </div>
    </div>

    <ChartRichTextEditor
      :model-value="modelValue"
      :placeholder="editorPlaceholder"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <div class="cn-raw-label">Raw notes / dictation</div>
    <v-textarea
      :model-value="rawNoteValue"
      :placeholder="rawPlaceholder"
      variant="solo"
      density="compact"
      rows="4"
      auto-grow
      class="cn-raw-input"
      bg-color="white"
      flat
      hide-details
      @update:model-value="$emit('update:rawNote', $event)"
    />
  </div>
</template>

<script setup>
import ChartRichTextEditor from './ChartRichTextEditor.vue'
import { usePatientChartingStore } from '~/stores/patientCharting'

const props = defineProps({
  type: { type: String, required: true },
  modelValue: { type: String, default: '' },
  templateId: { type: [String, Number], default: null },
  rawNote: { type: String, default: '' },
  patientId: { type: [String, Number, null], default: null },
  patientName: { type: String, default: '' },
  itemContext: { type: Object, default: () => ({}) },
  editorPlaceholder: { type: String, default: 'Write notes...' },
  rawPlaceholder: { type: String, default: 'Add raw dictated or manual notes...' },
})

const emit = defineEmits(['update:modelValue', 'update:templateId', 'update:rawNote', 'warnings-change'])
const chartingStore = usePatientChartingStore()

const templates = ref([])
const loadingTemplates = ref(false)
const applyingAi = ref(false)
const warnings = ref([])
const lastInjectedTemplateId = ref(null)

const rawNoteValue = computed(() => props.rawNote || '')
const selectedTemplateId = computed(() => {
  const id = props.templateId
  return id == null || id === '' ? null : Number(id)
})
const selectedTemplate = computed(() =>
  templates.value.find((item) => Number(item.id) === Number(selectedTemplateId.value)) || null
)
const templateOptions = computed(() =>
  templates.value.map((item) => ({
    ...item,
    label: `${item.title}${item.scope === 'system' ? ' (System)' : ''}${item.isDefault ? ' [Default]' : ''}`,
  }))
)

function setWarnings(nextWarnings = []) {
  warnings.value = nextWarnings.filter(Boolean)
  emit('warnings-change', warnings.value)
}

async function loadTemplates() {
  loadingTemplates.value = true
  try {
    templates.value = await chartingStore.fetchClinicalNoteTemplates(props.type)
    hydrateSelectedTemplate()
  } catch (err) {
    console.error('Failed to load clinical note templates:', err)
    templates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

function resolveDefaultTemplate() {
  return templates.value.find((item) => item.scope === 'organisation' && item.isDefault)
    || templates.value.find((item) => item.scope === 'system' && item.isDefault)
    || templates.value[0]
    || null
}

function hydrateSelectedTemplate() {
  const existing = selectedTemplate.value
  if (existing) return
  if (props.templateId) return
  const defaultTemplate = resolveDefaultTemplate()
  if (!defaultTemplate) return
  emit('update:templateId', defaultTemplate.id)
  if (!(props.modelValue || '').trim()) {
    emit('update:modelValue', defaultTemplate.content || '')
    lastInjectedTemplateId.value = defaultTemplate.id
  }
}

function applyTemplateContent(force = false) {
  if (!selectedTemplate.value) return
  const current = String(props.modelValue || '').trim()
  const canReplace = force || !current || Number(lastInjectedTemplateId.value) === Number(selectedTemplate.value.id)
  if (!canReplace) return
  emit('update:modelValue', selectedTemplate.value.content || '')
  lastInjectedTemplateId.value = selectedTemplate.value.id
  setWarnings([])
}

function handleTemplateSelect(value) {
  const nextId = value ? Number(value) : null
  const nextTemplate = templates.value.find((item) => Number(item.id) === nextId) || null
  emit('update:templateId', nextId)
  if (!nextTemplate) return
  const current = String(props.modelValue || '').trim()
  const canReplace = !current || Number(lastInjectedTemplateId.value) === Number(nextTemplate.id)
  if (!canReplace) return
  emit('update:modelValue', nextTemplate.content || '')
  lastInjectedTemplateId.value = nextTemplate.id
  setWarnings([])
}

async function applyAi() {
  if (!selectedTemplate.value || !rawNoteValue.value.trim()) return
  applyingAi.value = true
  try {
    const data = await chartingStore.generateClinicalNoteTemplate({
      type: props.type,
      templateId: selectedTemplate.value.id,
      rawNote: rawNoteValue.value,
      currentNote: props.modelValue || '',
      patientId: props.patientId || null,
      patientName: props.patientName || '',
      ...props.itemContext,
    })
    emit('update:templateId', data.templateId || selectedTemplate.value.id)
    emit('update:modelValue', data.finalNote || props.modelValue || '')
    lastInjectedTemplateId.value = data.templateId || selectedTemplate.value.id
    setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
  } catch (err) {
    console.error('Failed to apply AI note template:', err)
    setWarnings(['Some information may be incomplete or inaccurate. Please review before saving.'])
  } finally {
    applyingAi.value = false
  }
}

watch(() => props.type, loadTemplates, { immediate: true })
watch(() => props.templateId, () => {
  if (!loadingTemplates.value) hydrateSelectedTemplate()
})
</script>

<style scoped>
.cn-editor {
  display: grid;
  gap: 12px;
}

.cn-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cn-toolbar__title,
.cn-raw-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.cn-template-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.cn-select {
  min-width: 260px;
  flex: 1 1 320px;
}

.cn-warnings {
  display: grid;
  gap: 8px;
}

.cn-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 10px;
  color: #92400e;
  font-size: 12px;
}

.cn-raw-input :deep(.v-field) {
  border: 1px solid #d1d5db;
  border-radius: 10px;
}
</style>
