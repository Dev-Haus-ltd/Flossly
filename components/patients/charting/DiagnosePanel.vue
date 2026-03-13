<template>
  <div class="diag-panel">
    <div class="diag-panel__header">
      <span class="diag-panel__title">Examination Notes</span>
      <div class="diag-panel__header-actions">
        <!-- Template selector -->
        <v-menu location="bottom end" :offset="4">
          <template #activator="{ props: menuProps }">
            <button class="diag-btn diag-btn--outline" v-bind="menuProps">
              <v-icon size="14" class="mr-1">mdi-text-box-outline</v-icon>
              Templates
              <v-icon size="13" class="ml-1">mdi-chevron-down</v-icon>
            </button>
          </template>
          <v-list density="compact" min-width="260">
            <v-list-item
              v-for="tpl in NOTE_TEMPLATES"
              :key="tpl.label"
              :title="tpl.label"
              @click="insertTemplate(tpl.text)"
            />
          </v-list>
        </v-menu>
        <!-- Voice dictation -->
        <button
          class="diag-btn diag-btn--voice"
          :class="{ 'diag-btn--voice-active': voiceActive }"
          @click="toggleVoice"
        >
          <v-icon size="14" class="mr-1">mdi-microphone</v-icon>
          {{ voiceActive ? 'Stop' : 'Transcribe notes' }}
        </button>
      </div>
    </div>

    <!-- Rich text toolbar -->
    <div class="diag-fmt-bar">
      <button class="diag-fmt-btn" title="Bold" @click.prevent="execCmd('bold')"><b>B</b></button>
      <button class="diag-fmt-btn" title="Italic" @click.prevent="execCmd('italic')"><i>I</i></button>
      <button class="diag-fmt-btn" title="Bullet list" @click.prevent="execCmd('insertUnorderedList')">• List</button>
    </div>

    <!-- Notes editor -->
    <div
      ref="editorEl"
      contenteditable="true"
      class="diag-editor"
      data-placeholder="Begin typing examination notes or select a template..."
      @input="onInput"
    />

    <!-- Base chart findings list -->
    <div class="diag-findings-section">
      <div class="diag-findings-header">
        <span class="diag-findings-title">Findings<span v-if="baseItems.length" class="diag-findings-count">{{ baseItems.length }}</span></span>
      </div>

      <div v-if="!baseItems.length" class="diag-findings-empty">
        No findings recorded. Select a condition on the left and click a tooth above.
      </div>

      <div v-else class="diag-findings-list">
        <div v-for="item in baseItems" :key="item._tempId || item.id" class="diag-finding-row">
          <!-- Condition colour dot -->
          <span class="diag-finding-dot" :style="{ background: condColor(item.condition) }" />
          <!-- Tooth -->
          <span class="diag-finding-tooth">{{ toothLabel(item) }}</span>
          <!-- Condition name -->
          <span class="diag-finding-name">{{ item.conditionLabel || item.condition || 'Finding' }}</span>
          <!-- Surface -->
          <span v-if="item.surface" class="diag-finding-surface">{{ item.surface }}</span>
          <!-- Date -->
          <span class="diag-finding-date">{{ formatDate(item.createdAt) }}</span>
          <!-- Delete -->
          <button class="diag-finding-del" title="Remove" @click="emit('remove', item.id || item._tempId)">
            <v-icon size="14" color="error">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getToothLabel } from './toothData.js'
import { CONDITIONS } from './toothData.js'
import { NOTE_TEMPLATES } from '~/shared/defaults/charting/noteTemplates.js'

const props = defineProps({
  baseItems: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'remove'])

const editorEl = ref(null)
const voiceActive = ref(false)
let _recognition = null

function onInput() {
  emit('update:modelValue', editorEl.value?.innerHTML || '')
}

function execCmd(cmd) {
  editorEl.value?.focus()
  document.execCommand(cmd, false, null)
}

function insertTemplate(text) {
  if (!editorEl.value) return
  editorEl.value.focus()
  const current = editorEl.value.innerHTML
  if (current && !current.endsWith('<br>')) {
    document.execCommand('insertParagraph', false, null)
  }
  document.execCommand('insertText', false, text)
  emit('update:modelValue', editorEl.value.innerHTML)
}

function toggleVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { alert('Speech recognition is not supported in this browser.'); return }
  if (voiceActive.value) {
    _recognition?.stop()
    voiceActive.value = false
    return
  }
  _recognition = new SR()
  _recognition.continuous = true
  _recognition.interimResults = false
  _recognition.lang = 'en-GB'
  _recognition.onresult = (e) => {
    const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
    if (editorEl.value) {
      editorEl.value.focus()
      document.execCommand('insertText', false, (editorEl.value.innerHTML ? ' ' : '') + text)
      emit('update:modelValue', editorEl.value.innerHTML)
    }
  }
  _recognition.onerror = () => { voiceActive.value = false }
  _recognition.onend = () => { voiceActive.value = false }
  _recognition.start()
  voiceActive.value = true
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

onMounted(() => {
  if (editorEl.value && props.modelValue) {
    editorEl.value.innerHTML = props.modelValue
  }
})

watch(() => props.modelValue, (val) => {
  if (editorEl.value && editorEl.value.innerHTML !== val) {
    editorEl.value.innerHTML = val || ''
  }
})
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

.diag-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diag-btn {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}

.diag-btn--outline {
  background: #f5f5f5;
  color: #444;
  border: 1px solid #e0e0e0;
}

.diag-btn--outline:hover {
  background: #efefef;
}

.diag-btn--voice {
  background: #f0f0f0;
  color: #444;
}

.diag-btn--voice:hover {
  background: #e8e8e8;
}

.diag-btn--voice-active {
  background: #fee2e2;
  color: #dc2626;
  animation: pulse-voice 1.5s infinite;
}

@keyframes pulse-voice {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.diag-fmt-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  border-bottom: 1px solid #f5f5f5;
  background: #fafafa;
}

.diag-fmt-btn {
  width: 28px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #555;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.diag-fmt-btn:hover {
  background: #ececec;
}

.diag-editor {
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  outline: none;
}

.diag-editor:empty::before {
  content: attr(data-placeholder);
  color: #bbb;
  pointer-events: none;
}

.diag-findings-section {
  border-top: 1px solid #f0f0f0;
}

.diag-findings-header {
  padding: 8px 14px 6px;
}

.diag-findings-title {
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.diag-findings-count {
  background: #e8f0ff;
  color: #0061FB;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 700;
}

.diag-findings-empty {
  padding: 10px 14px 12px;
  font-size: 12px;
  color: #bbb;
}

.diag-findings-list {
  padding: 0 0 4px;
}

.diag-finding-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-bottom: 1px solid #fafafa;
  transition: background 0.1s;
}

.diag-finding-row:hover {
  background: #f9f9f9;
}

.diag-finding-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.diag-finding-tooth {
  font-size: 12px;
  font-weight: 700;
  color: #0061FB;
  min-width: 28px;
  flex-shrink: 0;
}

.diag-finding-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
  flex: 1;
}

.diag-finding-surface {
  font-size: 11px;
  color: #888;
  background: #f0f0f0;
  border-radius: 4px;
  padding: 1px 5px;
  text-transform: capitalize;
  flex-shrink: 0;
}

.diag-finding-date {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
  min-width: 110px;
}

.diag-finding-del {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.diag-finding-row:hover .diag-finding-del {
  opacity: 1;
}
</style>
