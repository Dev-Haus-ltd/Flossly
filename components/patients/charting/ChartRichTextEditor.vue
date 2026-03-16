<template>
  <div class="chart-editor-shell">
    <div :id="holderId" ref="holderEl" class="chart-editor" />
  </div>
</template>

<script setup>
import { blocksToHtml, htmlToBlocks } from '@/lib/editorFormatter'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write notes...' },
})

const emit = defineEmits(['update:modelValue'])

const holderEl = ref(null)
const holderId = `chart-editor-${Math.random().toString(36).slice(2, 10)}`

let EditorCtor = null
let HeaderTool = null
let ListTool = null
let editor = null
let syncingFromEditor = false
let lastHtml = props.modelValue || ''

async function loadEditorDeps() {
  if (EditorCtor && HeaderTool && ListTool) return
  const [{ default: EditorJS }, { default: Header }, { default: List }] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
  ])
  EditorCtor = EditorJS
  HeaderTool = Header
  ListTool = List
}

async function destroyEditor() {
  if (editor && typeof editor.destroy === 'function') {
    await editor.isReady?.catch(() => {})
    editor.destroy()
  }
  editor = null
}

async function initEditor(html = '') {
  if (typeof window === 'undefined' || !holderEl.value) return
  await loadEditorDeps()
  await destroyEditor()
  lastHtml = html || ''
  editor = new EditorCtor({
    holder: holderId,
    placeholder: props.placeholder,
    inlineToolbar: true,
    data: htmlToBlocks(lastHtml),
    tools: {
      header: {
        class: HeaderTool,
        inlineToolbar: true,
        config: { levels: [2, 3, 4], defaultLevel: 3 },
      },
      list: {
        class: ListTool,
        inlineToolbar: true,
      },
    },
    async onChange(api) {
      if (!editor) return
      const saved = await api.saver.save()
      const htmlValue = blocksToHtml(saved)
      syncingFromEditor = true
      lastHtml = htmlValue
      emit('update:modelValue', htmlValue)
      nextTick(() => { syncingFromEditor = false })
    },
  })
}

onMounted(async () => {
  await initEditor(props.modelValue || '')
})

watch(
  () => props.modelValue,
  async (value) => {
    const nextHtml = value || ''
    if (!editor || syncingFromEditor || nextHtml === lastHtml) return
    await editor.isReady
    lastHtml = nextHtml
    await editor.render(htmlToBlocks(nextHtml))
  }
)

onBeforeUnmount(async () => {
  await destroyEditor()
})
</script>

<style scoped>
.chart-editor-shell {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.chart-editor {
  min-height: 140px;
  padding: 12px 14px;
}

.chart-editor :deep(.ce-block__content),
.chart-editor :deep(.ce-toolbar__content) {
  max-width: none;
}

.chart-editor :deep(.ce-paragraph),
.chart-editor :deep(.cdx-block) {
  color: #334155;
  font-size: 13px;
}

.chart-editor :deep(.ce-paragraph[data-placeholder]:empty::before) {
  color: #9ca3af;
}
</style>
