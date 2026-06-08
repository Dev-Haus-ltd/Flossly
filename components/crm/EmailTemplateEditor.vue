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

      <div v-if="allowAttachments" class="ete-attachments-actions">
        <input
          ref="attachmentInput"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
          class="d-none"
          @change="onAttachmentSelect"
        >
        <v-btn
          size="small"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-paperclip"
          :loading="uploadingAttachment"
          :disabled="uploadingAttachment"
          @click="openAttachmentPicker"
        >
          Attach files
        </v-btn>
      </div>
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

    <div v-if="allowAttachments" class="ete-attachments">
      <div class="ete-attachments__header">
        <span class="ete-attachments__title">Email attachments</span>
        <span class="ete-attachments__count">{{ localAttachments.length }}</span>
      </div>

      <div v-if="localAttachments.length" class="ete-attachments__list">
        <div
          v-for="(attachment, index) in localAttachments"
          :key="`${attachment.link || attachment.url || attachment.name}-${index}`"
          class="ete-attachment-row"
        >
          <a
            :href="attachment.link || attachment.url"
            target="_blank"
            rel="noopener noreferrer"
            class="ete-attachment-row__name"
          >
            {{ attachment.name || attachment.filename || `Attachment ${index + 1}` }}
          </a>
          <span class="ete-attachment-row__type">
            {{ attachment.contentType || attachment.mimeType || 'File' }}
          </span>
          <v-btn icon size="x-small" variant="text" color="error" @click="removeAttachment(index)">
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div v-else class="ete-attachments__empty">No attachments added.</div>
    </div>
  </div>
</template>

<script setup>
import { PostFormData, Post } from '@/services/apiWrapper'
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'

const props = defineProps({
  modelValue: { type: String, default: '' },
  attachments: { type: Array, default: () => [] },
  allowAttachments: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:attachments'])

const mode = ref('rich')
const htmlView = ref('code')
const rawHtml = ref(props.modelValue || '')
const editorHolder = ref(null)
const attachmentInput = ref(null)
const uploadingAttachment = ref(false)
const localAttachments = ref(Array.isArray(props.attachments) ? [...props.attachments] : [])
const crmStore = useCrmStore()
const mainStore = useMainStore()

let EditorCtor = null
let Header = null
let List = null
let ImageTool = null
let ej = null
let suppressExternalSync = false
const lastEditorHtml = ref('')

const normalizeAttachment = (item = {}) => ({
  link: item?.link || item?.url || item?.path || null,
  name: item?.name || item?.filename || item?.title || 'Attachment',
  contentType: item?.contentType || item?.mimeType || 'application/octet-stream',
  type: item?.type || null,
  size: item?.size || null,
})

// ── Uploader for @editorjs/image ────────────────────────
const imageUploader = {
  async uploadByFile(file) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await PostFormData('/misc/uploadEmailImage', fd)
      if (res?.code === 0 && res.data?.url) {
        return { success: 1, file: { url: res.data.url } }
      }
      return { success: 0 }
    } catch {
      return { success: 0 }
    }
  },
  async uploadByUrl(url) {
    try {
      const res = await Post('/misc/uploadEmailImageByUrl', { url })
      if (res?.code === 0 && res.data?.url) {
        return { success: 1, file: { url: res.data.url } }
      }
      return { success: 0 }
    } catch {
      return { success: 0 }
    }
  },
}

// ── EditorJS lifecycle ──────────────────────────────────

const loadModules = async () => {
  if (EditorCtor) return
  const [{ default: E }, { default: H }, { default: L }, { default: I }] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
    import('@editorjs/image'),
  ])
  EditorCtor = E; Header = H; List = L; ImageTool = I
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
    tools: {
      header: Header,
      list: List,
      image: {
        class: ImageTool,
        config: { uploader: imageUploader },
      },
    },
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

const openAttachmentPicker = () => {
  attachmentInput.value?.click?.()
}

const onAttachmentSelect = async (event) => {
  const files = Array.from(event?.target?.files || [])
  if (!files.length) return

  uploadingAttachment.value = true
  try {
    const uploaded = []
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await crmStore.uploadLeadAttachment(formData)
      if (res?.code !== 0 || !res?.data) {
        throw new Error(res?.message || `Failed to upload ${file.name}`)
      }
      uploaded.push(normalizeAttachment(res.data))
    }
    localAttachments.value = [...localAttachments.value, ...uploaded]
    emit('update:attachments', [...localAttachments.value])
  } catch (error) {
    mainStore?.setSnackbar?.({
      title: error?.message || 'Failed to upload attachment',
      type: 'error',
    })
  } finally {
    uploadingAttachment.value = false
    if (event?.target) event.target.value = ''
  }
}

const removeAttachment = (index) => {
  localAttachments.value.splice(index, 1)
  emit('update:attachments', [...localAttachments.value])
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

watch(
  () => props.attachments,
  (val) => {
    localAttachments.value = Array.isArray(val) ? val.map(normalizeAttachment) : []
  },
  { deep: true }
)

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

.ete-attachments-actions {
  margin-left: auto;
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

.ete-attachments {
  border-top: 1px solid #e4e7ec;
  background: #fcfcfd;
  padding: 14px 16px;
}

.ete-attachments__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ete-attachments__title {
  font-size: 13px;
  font-weight: 700;
  color: #344054;
}

.ete-attachments__count {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #eaf2ff;
  color: #0061fb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.ete-attachments__list {
  display: grid;
  gap: 8px;
}

.ete-attachment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
  background: #fff;
}

.ete-attachment-row__name {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ete-attachment-row__name:hover {
  color: #0061fb;
}

.ete-attachment-row__type {
  font-size: 12px;
  color: #667085;
}

.ete-attachments__empty {
  font-size: 13px;
  color: #667085;
}

/* ── Transitions ─────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
