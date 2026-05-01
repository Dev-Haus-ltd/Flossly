<template>
  <div class="email-template-editor">
    <!-- Sub-toolbar: Visual / Code toggle (raw_html mode only) -->
    <div v-if="renderMode === 'raw_html'" class="raw-sub-toolbar">
      <div class="d-flex align-center" style="gap: 6px">
        <v-btn-toggle v-model="showCode" density="compact" variant="outlined" divided mandatory class="view-toggle">
          <v-btn :value="false" size="x-small">
            <v-icon size="12" class="mr-1">mdi-eye-outline</v-icon>Visual
          </v-btn>
          <v-btn :value="true" size="x-small">
            <v-icon size="12" class="mr-1">mdi-code-tags</v-icon>Code
          </v-btn>
        </v-btn-toggle>
        <span class="hint-text">
          {{ showCode ? 'Paste or edit HTML directly' : 'Click any text to edit it in place' }}
        </span>
      </div>
    </div>

    <!-- Wrapped mode: EditorJS rich text -->
    <div v-if="renderMode === 'wrapped'" ref="editorHolder" class="editor" />

    <!-- Builder mode: open GrapeJS in fullscreen dialog -->
    <div v-else-if="renderMode === 'builder'" class="builder-surface">
      <div v-if="!modelValue" class="builder-empty">
        <v-icon size="44" color="primary" class="mb-3">mdi-view-dashboard-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis mb-4 text-center" style="max-width: 280px">
          Build a fully-designed email with images, columns, and buttons using the drag-and-drop editor.
        </p>
        <v-btn color="primary" prepend-icon="mdi-pencil-ruler" @click="showBuilder = true">
          Open Visual Builder
        </v-btn>
      </div>
      <div v-else class="builder-ready">
        <div class="builder-ready__icon">
          <v-icon size="20" color="primary">mdi-check-circle-outline</v-icon>
        </div>
        <div class="builder-ready__info">
          <div class="text-body-2 font-weight-medium">Email designed with Visual Builder</div>
          <div class="text-caption text-medium-emphasis">{{ contentSummary }}</div>
        </div>
        <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-pencil-outline" @click="showBuilder = true">
          Edit design
        </v-btn>
      </div>
    </div>

    <!-- Raw HTML – Visual: contenteditable rendered view -->
    <div
      v-else-if="!showCode"
      ref="visualEditorEl"
      class="visual-html-editor"
      contenteditable="true"
      spellcheck="false"
      @input="onVisualInput"
      @blur="onVisualBlur"
    />

    <!-- Raw HTML – Code: plain textarea -->
    <textarea
      v-else
      v-model="rawHtml"
      class="raw-html-editor"
      placeholder="Paste your HTML here (e.g. exported from Canva or any HTML builder)…"
      spellcheck="false"
      @input="onRawInput"
    />

    <!-- GrapeJS fullscreen dialog — mounted here so it stays within the editor scope -->
    <CrmGrapesEmailEditor
      :model-value="modelValue"
      :visible="showBuilder"
      @update:model-value="emit('update:modelValue', $event)"
      @update:visible="showBuilder = $event"
    />
  </div>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'

const props = defineProps({
  modelValue: { type: String, default: '' },
  renderMode: { type: String, default: 'wrapped' },
})
const emit = defineEmits(['update:modelValue'])

const editorHolder = ref(null)
const visualEditorEl = ref(null)
const showBuilder = ref(false)

// Internal view toggle for raw_html mode: true = code editor, false = visual editor
const showCode = ref(true)

let EditorCtor = null
let Header = null
let List = null
let ej = null
let isEditorUpdate = false
const lastSyncedValue = ref('')
const rawHtml = ref(props.modelValue || '')

// ─── Builder mode helpers ────────────────────────────────────────────

const contentSummary = computed(() => {
  if (!props.modelValue) return ''
  const charCount = props.modelValue.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length
  const imgCount = (props.modelValue.match(/<img/gi) || []).length
  const parts = []
  if (imgCount) parts.push(`${imgCount} image${imgCount > 1 ? 's' : ''}`)
  if (charCount) parts.push(`~${charCount} characters`)
  return parts.join(', ') || 'Template ready'
})

// ─── EditorJS helpers ───────────────────────────────────────────────

const loadEditorModules = async () => {
  if (EditorCtor && Header && List) return
  const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
  ])
  EditorCtor = E
  Header = H
  List = L
}

const destroyEditor = () => {
  if (ej && typeof ej.destroy === 'function') ej.destroy()
  ej = null
}

const initEditor = async (html) => {
  if (typeof window === 'undefined') return
  destroyEditor()
  await loadEditorModules()
  await nextTick()
  if (!editorHolder.value) return
  lastSyncedValue.value = html || ''
  ej = new EditorCtor({
    holder: editorHolder.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(html || ''),
    onChange: async (api) => {
      const saved = await api.saver.save()
      const converted = blocksToHtml(saved)
      isEditorUpdate = true
      lastSyncedValue.value = converted
      emit('update:modelValue', converted)
      isEditorUpdate = false
    },
  })
}

// ─── Visual editor helpers ──────────────────────────────────────────

const syncVisualEditor = async () => {
  await nextTick()
  if (visualEditorEl.value) {
    visualEditorEl.value.innerHTML = rawHtml.value
  }
}

const onVisualInput = () => {
  if (!visualEditorEl.value) return
  rawHtml.value = visualEditorEl.value.innerHTML
  emit('update:modelValue', rawHtml.value)
}

const onVisualBlur = () => {
  if (!visualEditorEl.value) return
  rawHtml.value = visualEditorEl.value.innerHTML
  emit('update:modelValue', rawHtml.value)
}

const onRawInput = () => {
  emit('update:modelValue', rawHtml.value)
}

// ─── Watchers ────────────────────────────────────────────────────────

watch(() => props.modelValue, (newVal) => {
  if (isEditorUpdate) return
  if (props.renderMode === 'raw_html') {
    rawHtml.value = newVal || ''
    if (!showCode.value && visualEditorEl.value) {
      visualEditorEl.value.innerHTML = rawHtml.value
    }
    return
  }
  if (props.renderMode === 'builder') return // GrapeJS manages its own state
  if (newVal !== lastSyncedValue.value) initEditor(newVal)
})

watch(() => props.renderMode, async (mode) => {
  if (mode === 'raw_html') {
    destroyEditor()
    rawHtml.value = props.modelValue || ''
    showCode.value = true
  } else if (mode === 'builder') {
    destroyEditor()
  } else {
    await nextTick()
    initEditor(props.modelValue || '')
  }
})

watch(showCode, async (isCode) => {
  if (!isCode) await syncVisualEditor()
})

onMounted(async () => {
  if (props.renderMode === 'wrapped') {
    await nextTick()
    initEditor(props.modelValue || '')
  } else {
    rawHtml.value = props.modelValue || ''
  }
})

onUnmounted(() => {
  destroyEditor()
})
</script>

<style scoped>
.email-template-editor {
  width: 100%;
}

/* ─── Sub-toolbar ─────────────────────────────────────────── */
.raw-sub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 2px 8px;
}

.view-toggle {
  border-radius: 6px !important;
}

.hint-text {
  font-size: 11px;
  color: #9e9e9e;
}

/* ─── EditorJS wrapped mode ───────────────────────────────── */
.editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 4px;
  min-height: 180px;
  background: #fff;
  transition: border-color 0.15s;
}

/* ─── Builder mode surface ─────────────────────────────────── */
.builder-surface {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.builder-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  min-height: 180px;
}

.builder-ready {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f5f8ff;
  border: 1px solid #ccd9ff;
  border-radius: 8px;
}

.builder-ready__icon {
  flex-shrink: 0;
}

.builder-ready__info {
  flex: 1;
  min-width: 0;
}

/* ─── Visual editor ────────────────────────────────────────── */
.visual-html-editor {
  width: 100%;
  min-height: 240px;
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  outline: none;
  cursor: text;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.visual-html-editor:focus {
  border-color: #0061FB;
  box-shadow: 0 0 0 2px rgba(0, 97, 251, 0.08);
}

.visual-html-editor:focus-within *:hover {
  outline: 1px dashed rgba(0, 97, 251, 0.25);
  outline-offset: 1px;
}

/* ─── Code editor ──────────────────────────────────────────── */
.raw-html-editor {
  width: 100%;
  min-height: 240px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.65;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fc;
  color: #1a1a2e;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.raw-html-editor:focus {
  border-color: #0061FB;
  box-shadow: 0 0 0 2px rgba(0, 97, 251, 0.08);
  background: #fff;
}
</style>
