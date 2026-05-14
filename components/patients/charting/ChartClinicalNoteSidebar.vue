<template>
  <aside class="cns-shell">
    <div class="cns-head">
      <div class="cns-head__title">{{ sidebarTitle }}</div>
      <div class="cns-head__meta">
        <span class="cns-pill">{{ itemTypeLabel }}</span>
        <span v-if="statusText" class="cns-status">{{ statusText }}</span>
      </div>
      <button class="cns-close" title="Close note helper" @click="$emit('close')">
        <v-icon size="18">mdi-close</v-icon>
      </button>
    </div>

    <div v-if="!item" class="cns-empty">
      Select a chart item to edit its clinical note.
    </div>

    <template v-else>
      <div class="cns-banner">
        <div class="cns-banner__title">
          <v-icon size="15" class="cns-banner__icon">mdi-robot-outline</v-icon>
          AI-assisted clinical notes
        </div>
        <div class="cns-banner__sub">Choose a template, dictate your raw notes, then generate a structured summary. <strong>AI will replace the note with its output — always review before saving.</strong></div>
      </div>

      <div class="cns-template">
        <div class="cns-label">Select a template for this note</div>
        <v-select
          v-model="draft.templateId"
          :items="templateOptions"
          item-title="title"
          item-value="id"
          variant="solo"
          density="compact"
          flat
          bg-color="white"
          hide-details
          class="cns-template__select"
          placeholder="Select template"
          @update:model-value="selectTemplateById"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-subheader
              v-if="item.raw.isHeader"
              class="cns-template__group"
            >
              {{ item.raw.title }}
            </v-list-subheader>
            <v-list-item
              v-else
              v-bind="itemProps"
            />
          </template>
        </v-select>
      </div>

      <div v-if="warnings.length" class="cns-warnings cns-warnings--error">
        <div v-for="warning in warnings" :key="warning" class="cns-warning">
          <v-icon size="15">mdi-alert-circle-outline</v-icon>
          <span>{{ warning }}</span>
        </div>
      </div>

      <div class="cns-raw">
        <div class="cns-raw__head">
          <div class="cns-label">Clinical notes</div>
          <button
            class="cns-mic"
            :class="{ 'cns-mic--active': isTranscribing }"
            :disabled="!speechSupported"
            @click="toggleTranscribe"
          >
            <v-icon size="15">{{ isTranscribing ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
          </button>
        </div>
        <v-textarea
          :model-value="displayRawNote"
          :readonly="isTranscribing"
          variant="solo"
          density="compact"
          rows="6"
          auto-grow
          flat
          bg-color="white"
          hide-details
          placeholder="Type or dictate your notes"
          class="cns-raw__input"
          :class="{ 'cns-raw__input--transcribing': isTranscribing }"
          @update:model-value="v => { if (!isTranscribing) draft.rawNote = v }"
        />
      </div>

      <div class="cns-footer">
        <transition name="cns-flash">
          <div v-if="noteApplied" class="cns-applied-flash">
            <v-icon size="15">mdi-check-circle-outline</v-icon>
            Note applied to chart
          </div>
        </transition>
        <div v-if="statusText && !noteApplied" class="cns-footer__save">{{ statusText }}</div>
        <v-btn
          class="cns-generate"
          color="primary"
          block
          :loading="applyingAi"
          :disabled="!draft.templateId || !draft.rawNote.trim()"
          @click="generateSummary"
        >
          Generate summary
        </v-btn>
      </div>
    </template>
  </aside>
</template>

<script setup>
import { plainTextToHtml } from '@/lib/editorFormatter'
import { usePatientChartingStore } from '~/stores/patientCharting'

const props = defineProps({
  item: { type: Object, default: null },
  type: { type: String, default: null },
  patientId: { type: [String, Number], default: null },
  patientName: { type: String, default: '' },
})

const emit = defineEmits(['apply-template', 'apply-summary', 'close'])
const chartingStore = usePatientChartingStore()

const templates = ref([])
const applyingAi = ref(false)
const warnings = ref([])
const noteApplied = ref(false)
const saveState = ref('idle')
const lastSavedAt = ref(null)
const draft = reactive({
  id: null,
  type: 'diagnosis',
  templateId: null,
  rawNote: '',
})

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null
const speechSupported = !!SpeechRecognition
const isTranscribing = ref(false)
const interimText = ref('')
let recognition = null

const displayRawNote = computed(() =>
  isTranscribing.value && interimText.value
    ? `${draft.rawNote} ${interimText.value}`.trim()
    : draft.rawNote
)
const sidebarTitle = computed(() => props.item?.treatmentName || props.item?.conditionLabel || props.item?.condition || 'Clinical note')
const itemTypeLabel = computed(() => draft.type === 'treatment_plan' ? 'Treatment Plan' : 'Diagnosis')
const templateOptions = computed(() => {
  const grouped = [
    { key: 'ai', label: 'System Templates' },
    { key: 'user', label: 'User Templates' },
  ]
  return grouped.flatMap((group) => {
    const items = templates.value.filter((item) => (item.category === 'ai' ? 'ai' : 'user') === group.key)
    if (!items.length) return []
    return [
      { id: `header-${group.key}`, title: group.label, isHeader: true, props: { disabled: true } },
      ...items,
    ]
  })
})
const statusText = computed(() => {
  if (saveState.value === 'saving') return 'Applying...'
  if (saveState.value === 'saved' && lastSavedAt.value) {
    return `Applied to note ${formatRelative(lastSavedAt.value)}`
  }
  return null
})

async function loadTemplates() {
  if (!draft.type) return
  try {
    templates.value = await chartingStore.fetchClinicalNoteTemplates(draft.type)
    if (!draft.templateId) {
      const preferred = templates.value.find((item) => item.scope === 'organisation' && item.isDefault)
        || templates.value.find((item) => item.scope === 'system' && item.isDefault)
        || templates.value[0]
      if (preferred) {
        draft.templateId = preferred.id
      }
    }
  } catch (err) {
    console.error('Failed to load sidebar templates:', err)
    templates.value = []
  }
}

function syncFromItem(item) {
  saveState.value = 'idle'
  warnings.value = []
  noteApplied.value = false
  draft.id = item?.id || item?._tempId || null
  draft.type = props.type || (String(item?.status || '').toLowerCase() === 'existing' ? 'diagnosis' : 'treatment_plan')
  draft.templateId = item?.templateId || null
  draft.rawNote = ''
  loadTemplates()
}

function applyTemplate(template) {
  if (!template) return
  draft.templateId = template.id
  emit('apply-template', {
    id: props.item?.id || props.item?._tempId || null,
    templateId: template.id,
    notes: plainTextToHtml(template.content || ''),
  })
  lastSavedAt.value = new Date()
  saveState.value = 'saved'
}

function selectTemplateById(value) {
  const template = templates.value.find((item) => Number(item.id) === Number(value))
  if (!template) return
  applyTemplate(template)
}

async function generateSummary() {
  if (!props.item || !draft.templateId || !draft.rawNote.trim()) return
  applyingAi.value = true
  warnings.value = []
  try {
    const data = await chartingStore.generateClinicalNoteTemplate({
      type: draft.type,
      templateId: draft.templateId,
      rawNote: draft.rawNote,
      currentNote: props.item?.notes || '',
      patientId: props.patientId || null,
      patientName: props.patientName || '',
      itemId: props.item.id || null,
      fdi: props.item.fdi || null,
      surface: props.item.surface || null,
      condition: props.item.condition || null,
      conditionLabel: props.item.conditionLabel || null,
      treatmentCode: props.item.treatmentCode || null,
      treatmentName: props.item.treatmentName || null,
      treatmentCategory: props.item.treatmentCategory || null,
    })
    const aiWarnings = Array.isArray(data.warnings) ? data.warnings : []
    draft.templateId = data.templateId || draft.templateId
    emit('apply-summary', {
      id: props.item?.id || props.item?._tempId || null,
      templateId: draft.templateId || null,
      notes: plainTextToHtml(data.finalNote || props.item?.notes || ''),
      warnings: aiWarnings,
    })
    if (aiWarnings.length) warnings.value = aiWarnings
    draft.rawNote = ''
    noteApplied.value = true
    setTimeout(() => { noteApplied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to generate note summary:', err)
    warnings.value = ['Failed to generate note. Please try again.']
  } finally {
    applyingAi.value = false
  }
}

function toggleTranscribe() {
  if (!SpeechRecognition) return
  if (isTranscribing.value) {
    recognition?.stop()
    isTranscribing.value = false
    interimText.value = ''
    return
  }
  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-GB'
  recognition.onresult = (e) => {
    let finalChunk = ''
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalChunk += e.results[i][0].transcript
      } else {
        interim += e.results[i][0].transcript
      }
    }
    if (finalChunk) {
      draft.rawNote = draft.rawNote ? `${draft.rawNote} ${finalChunk}`.trim() : finalChunk.trim()
    }
    interimText.value = interim
  }
  recognition.onerror = () => { isTranscribing.value = false; interimText.value = '' }
  recognition.onend = () => { isTranscribing.value = false; interimText.value = '' }
  recognition.start()
  isTranscribing.value = true
}

function formatRelative(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const sec = Math.max(1, Math.round(diffMs / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  return `${hr}h ago`
}

watch(() => props.item, syncFromItem, { immediate: true })

onBeforeUnmount(() => {
  recognition?.stop()
  interimText.value = ''
})
</script>

<style scoped>
.cns-shell {
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 14px;
}
.cns-head {
  display: flex;
  align-items: start;
  gap: 12px;
}
.cns-head__title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  flex: 1;
  min-width: 0;
}
.cns-head__meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}
.cns-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.cns-close:hover {
  background: #f8fafc;
}
.cns-pill {
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}
.cns-status {
  font-size: 11px;
  color: #64748b;
}
.cns-banner {
  border: 1px solid #c7d2fe;
  background: linear-gradient(180deg, #eef2ff 0%, #f8faff 100%);
  border-radius: 12px;
  padding: 12px;
}
.cns-banner__title {
  font-size: 13px;
  font-weight: 700;
  color: #312e81;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cns-banner__icon {
  color: #4f46e5;
  flex-shrink: 0;
}
.cns-banner__sub {
  margin-top: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}
.cns-banner__sub strong {
  color: #b45309;
}
.cns-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.cns-template__select :deep(.v-field) {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: none !important;
}

.cns-template__group {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}
.cns-warnings {
  display: grid;
  gap: 8px;
}
.cns-warning {
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
}
.cns-raw__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cns-mic {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 10px;
  width: 34px;
  height: 34px;
}
.cns-mic--active {
  border-color: #2563eb;
  color: #2563eb;
}
.cns-raw__input :deep(.v-field) {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  transition: border-color 0.2s;
}

.cns-raw__input--transcribing :deep(.v-field) {
  border-color: #3b82f6;
  background: #f0f9ff !important;
}

.cns-raw__input--transcribing :deep(textarea) {
  color: #1d4ed8;
}

.cns-warnings--error .cns-warning {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #991b1b;
}

.cns-applied-flash {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 10px;
  color: #166534;
  font-size: 12px;
  font-weight: 600;
}

.cns-flash-enter-active { transition: opacity 0.25s ease; }
.cns-flash-leave-active { transition: opacity 0.8s ease; }
.cns-flash-enter-from,
.cns-flash-leave-to { opacity: 0; }
.cns-footer {
  margin-top: auto;
  display: grid;
  gap: 10px;
}
.cns-footer__save {
  font-size: 11px;
  color: #64748b;
}
.cns-generate {
  border-radius: 10px;
  text-transform: none;
  font-weight: 600;
}
.cns-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  color: #64748b;
  font-size: 13px;
}
</style>
