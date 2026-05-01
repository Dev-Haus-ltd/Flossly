<template>
  <div class="ete-root">
    <!-- ── Top bar ─────────────────────────────────────── -->
    <div class="ete-toolbar">
      <!-- Mode toggle -->
      <div class="toolbar-wrapper">
        <v-btn-toggle
          :model-value="mode"
          mandatory
          class="custom-toggle"
          @update:modelValue="setMode"
        >
          <v-btn value="rich" class="toggle-btn">
            <v-icon size="14" class="mr-1">mdi-format-text</v-icon>
            Rich Text
          </v-btn>
          <v-btn value="html" class="toggle-btn">
            <v-icon size="14" class="mr-1">mdi-code-tags</v-icon>
            Custom HTML
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- Sub-toggle for HTML mode -->
      <Transition name="fade">
        <v-btn-toggle
          v-if="mode === 'html'"
          v-model="htmlView"
          mandatory
          class="custom-toggle ete-sub-toggle"
        >
          <v-btn value="code" class="toggle-btn ete-sub-btn">Code</v-btn>
          <v-btn value="preview" class="toggle-btn ete-sub-btn">Preview</v-btn>
        </v-btn-toggle>
      </Transition>
    </div>

    <!-- ── Rich Text (EditorJS) ──────────────────────── -->
    <div v-show="mode === 'rich'" ref="editorHolder" class="ete-editor-surface" />

    <!-- ── HTML – Code ────────────────────────────────── -->
    <textarea
      v-if="mode === 'html' && htmlView === 'code'"
      v-model="rawHtml"
      class="ete-html-code"
      placeholder="Paste your HTML here…"
      spellcheck="false"
      @input="onRawInput"
    />

    <!-- ── HTML – Preview ─────────────────────────────── -->
    <div
      v-else-if="mode === 'html' && htmlView === 'preview'"
      class="ete-html-preview"
      v-html="rawHtml"
    />
  </div>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const mode = ref('rich')
const htmlView = ref('code')
const rawHtml = ref(props.modelValue || '')
const editorHolder = ref(null)

let EditorCtor = null
let Header = null
let List = null
let ej = null
let suppressExternalSync = false
const lastEditorHtml = ref('')

// ── EditorJS lifecycle ──────────────────────────────────

const loadModules = async () => {
  if (EditorCtor) return
  const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
  ])
  EditorCtor = E; Header = H; List = L
}

const destroyEditor = () => {
  if (ej) { try { ej.destroy() } catch {} ; ej = null }
}

const initEditor = async (html) => {
  if (typeof window === 'undefined') return
  destroyEditor()
  await loadModules()
  await nextTick()
  if (!editorHolder.value) return
  lastEditorHtml.value = html || ''
  ej = new EditorCtor({
    holder: editorHolder.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(html || ''),
    onChange: async (api) => {
      const saved = await api.saver.save()
      const converted = blocksToHtml(saved)
      suppressExternalSync = true
      lastEditorHtml.value = converted
      emit('update:modelValue', converted)
      suppressExternalSync = false
    },
  })
}

// ── Mode switching ──────────────────────────────────────

const setMode = async (next) => {
  if (next === mode.value) return
  if (mode.value === 'rich' && ej) {
    try { const saved = await ej.save(); rawHtml.value = blocksToHtml(saved) } catch {}
  }
  mode.value = next
  if (next === 'rich') {
    await nextTick()
    initEditor(rawHtml.value)
  }
}

// ── HTML mode input ─────────────────────────────────────

const onRawInput = () => {
  emit('update:modelValue', rawHtml.value)
}

// ── External value sync ─────────────────────────────────

watch(() => props.modelValue, (val) => {
  if (suppressExternalSync) return
  const v = val || ''
  if (mode.value === 'html') {
    if (v !== rawHtml.value) rawHtml.value = v
    return
  }
  if (v !== lastEditorHtml.value) initEditor(v)
})

// ── Mount / unmount ─────────────────────────────────────

onMounted(async () => {
  rawHtml.value = props.modelValue || ''
  await nextTick()
  initEditor(props.modelValue || '')
})

onUnmounted(destroyEditor)
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────── */
.ete-root {
  width: 100%;
  border: 1.5px solid #e4e7ec;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

/* ── Toolbar ─────────────────────────────────────────── */
.ete-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
  gap: 8px;
  flex-wrap: wrap;
}

/* Toggle wrapper */
.toolbar-wrapper {
  height: 46px;
  display: inline-flex;
  align-items: center;
}

.custom-toggle {
  height: 46px;
  display: flex;
  align-items: center;
  background-color: #f3f6fa;
  gap: 4px;
  padding: 4px !important;
  border-radius: 8px;
}

.toggle-btn {
  background-color: #f3f6fa !important;
  display: flex;
  align-items: center;
  text-transform: none;
  font-size: 14px;
  font-weight: 500;
  color: #737373;
  transition: all 0.2s ease-in-out;
  height: 38px;
  min-height: 38px;
}

:deep(.v-btn--active.toggle-btn) {
  background-color: #ffffff !important;
  --v-theme-overlay-multiplier: 0 !important;
  --v-theme-primary: #ffffff !important;
  border-radius: 6px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
  color: #1e1e1e;
}

.ete-sub-toggle {
  height: 40px;
  padding: 3px !important;
}

.ete-sub-btn {
  font-size: 13px;
  font-weight: 500;
  height: 32px;
  min-height: 32px;
}

/* ── EditorJS surface ─────────────────────────────────── */
.ete-editor-surface {
  min-height: 220px;
  padding: 6px 4px;
}

/* ── HTML code textarea ───────────────────────────────── */
.ete-html-code {
  display: block;
  width: 100%;
  min-height: 220px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.65;
  padding: 12px 14px;
  background: #f8f9fc;
  color: #1a1a2e;
  resize: vertical;
  outline: none;
  border: none;
  box-sizing: border-box;
  transition: background 0.15s;
}

.ete-html-code:focus {
  background: #fff;
}

/* ── HTML preview ────────────────────────────────────── */
.ete-html-preview {
  min-height: 220px;
  max-height: 480px;
  overflow-y: auto;
  padding: 14px 16px;
  background: #fff;
}

/* ── Transitions ─────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
