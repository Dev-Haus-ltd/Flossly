<template>
  <Transition name="fade">
    <div v-if="isOpen" class="docx-editor-dialog-overlay" @click="handleOverlayClick">
      <div class="docx-editor-dialog" @click.stop>
        <!-- Header -->
        <div class="docx-editor-dialog-header">
          <h3 class="docx-editor-dialog-title">{{ doc?.name }}</h3>
          <button class="docx-editor-dialog-close" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <!-- Editor Container -->
        <div class="docx-editor-dialog-content">
          <ClientOnly>
            <DocsMyDocsDocumentEditor
              v-if="editorShouldMount"
              :key="docxFileUrl"
              ref="documentEditorRef"
              :document-url="editorBlobUrl"
              class="editor-wrapper"
              @editor-ready="handleEditorReady"
              @editor-error="handleEditorError"
            />
          </ClientOnly>
          <div v-if="showEditorOverlay" class="docx-editor-loading">
            <div class="docx-editor-loading-inner">
              <div class="docx-editor-spinner-row">
                <div class="docx-editor-spinner"></div>
                <div class="docx-editor-loading-text">
                  <span v-if="downloadProgress > 0 && downloadProgress < 100">Downloading… {{ downloadProgress }}%</span>
                  <span v-else-if="downloadProgress >= 100">Preparing document…</span>
                  <span v-else>Loading document…</span>
                </div>
              </div>
              <div v-if="downloadProgress > 0" class="docx-progress-bar-track">
                <div class="docx-progress-bar-fill" :style="{ width: downloadProgress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="docx-editor-dialog-actions">
          <button class="docx-editor-dialog-button docx-editor-dialog-button-cancel" @click="close" :disabled="isLoading">
            Cancel
          </button>
          <button 
            class="docx-editor-dialog-button docx-editor-dialog-button-save" 
            @click="saveDocument"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Saving...</span>
            <span v-else>Save</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { buildAbsoluteLink } from '~/lib/misc'

const props = defineProps({
  modelValue: Boolean,
  doc: Object,
  isSystem: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue", "onUpdate"])

const isOpen = ref(props.modelValue)
const docxFileUrl = ref(null)
const editorBlobUrl = ref(null)
const cacheKey = ref(null)
const cacheSizeBytes = ref(0)
const isLoading = ref(false)
const isPreloading = ref(false)
const isEditorReady = ref(false)
const isEditorErrored = ref(false)
const preloadedUrl = ref(null)
const downloadProgress = ref(0)
const documentEditorRef = ref(null)
const mainStore = useMainStore()
const docStore = useDocStore()

const appendCacheBuster = (absoluteUrl) => {
  const sep = absoluteUrl.includes('?') ? '&' : '?'
  const ver = props?.doc?.updatedAt
    ? new Date(props.doc.updatedAt).getTime()
    : props?.doc?.createdAt
      ? new Date(props.doc.createdAt).getTime()
      : null
  return ver ? `${absoluteUrl}${sep}v=${ver}` : absoluteUrl
}

const editorShouldMount = computed(() => {
  return Boolean(editorBlobUrl.value && isOpen.value && preloadedUrl.value === docxFileUrl.value)
})

const showEditorOverlay = computed(() => {
  if (!isOpen.value) return false
  return isPreloading.value || !isEditorReady.value
})

const resetEditorState = () => {
  isPreloading.value = false
  isEditorReady.value = false
  isEditorErrored.value = false
  preloadedUrl.value = null
  downloadProgress.value = 0
  if (editorBlobUrl.value) {
    try {
      URL.revokeObjectURL(editorBlobUrl.value)
    } catch (_) {}
  }
  editorBlobUrl.value = null
  cacheKey.value = null
  cacheSizeBytes.value = 0
}

const buildCacheKey = (docId, url) => {
  if (!docId || !url) return null
  return `docxCache:${docId}:${url}`
}

const readCachedBlob = async (key) => {
  try {
    const cache = await caches.open("docx-viewer-v1")
    const match = await cache.match(key)
    if (!match) return null
    const blob = await match.blob()
    cacheSizeBytes.value = blob.size || 0
    return blob
  } catch (_) {
    return null
  }
}

const writeCachedBlob = async (key, response) => {
  try {
    const cache = await caches.open("docx-viewer-v1")
    await cache.put(key, response)
  } catch (_) {}
}

const preloadDocument = async () => {
  if (!docxFileUrl.value || isPreloading.value) return
  if (preloadedUrl.value === docxFileUrl.value) return
  isPreloading.value = true
  try {
    const key = buildCacheKey(props.doc?.id, docxFileUrl.value)
    cacheKey.value = key
    if (key && typeof caches !== "undefined") {
      const cachedBlob = await readCachedBlob(key)
      if (cachedBlob) {
        if (editorBlobUrl.value) {
          try {
            URL.revokeObjectURL(editorBlobUrl.value)
          } catch (_) {}
        }
        editorBlobUrl.value = URL.createObjectURL(cachedBlob)
        preloadedUrl.value = docxFileUrl.value
        return
      }
    }

    const res = await fetch(docxFileUrl.value, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Failed to load document (${res.status})`)
    }
    const cloneForCache = res.clone()

    // Stream the response to track download progress
    const contentLength = res.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    const reader = res.body.getReader()
    const chunks = []
    let loaded = 0
    downloadProgress.value = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      if (total > 0) {
        downloadProgress.value = Math.round((loaded / total) * 100)
      }
    }

    const blob = new Blob(chunks, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    if (editorBlobUrl.value) {
      try {
        URL.revokeObjectURL(editorBlobUrl.value)
      } catch (_) {}
    }
    editorBlobUrl.value = URL.createObjectURL(blob)
    preloadedUrl.value = docxFileUrl.value
    cacheSizeBytes.value = blob.size || 0
    if (cacheKey.value && typeof caches !== "undefined") {
      await writeCachedBlob(cacheKey.value, cloneForCache)
    }
  } catch (err) {
    isEditorErrored.value = true
    mainStore.setSnackbar({
      title: err?.message || 'Failed to load document',
      type: 'error',
    })
  } finally {
    isPreloading.value = false
  }
}

const handleEditorReady = () => {
  isEditorReady.value = true
}

const handleEditorError = (err) => {
  isEditorErrored.value = true
  mainStore.setSnackbar({
    title: err?.message || 'Failed to initialize editor',
    type: 'error',
  })
}

// Set document URL immediately when doc changes
watch(
  () => props.doc,
  (newDoc) => {
    if (newDoc?.id) {
      const config = useRuntimeConfig()
      const baseUrl = typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : config.public?.BASE_URL
      const path = props.isSystem
        ? `/api/docs/viewSystemDoc?id=${newDoc.id}`
        : `/api/docs/view?id=${newDoc.id}`
      const abs = buildAbsoluteLink(path, baseUrl)
      docxFileUrl.value = appendCacheBuster(abs)
      resetEditorState()
      if (isOpen.value) {
        preloadDocument()
      }
    }
  },
  { immediate: true }
)

// Sync prop with local state
watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val
    if (!val) {
      docxFileUrl.value = null
      resetEditorState()
      return
    }
    // Ensure URL is set when dialog opens
    if (props.doc?.id && !docxFileUrl.value) {
      const config = useRuntimeConfig()
      const baseUrl = typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : config.public?.BASE_URL
    const path = props.isSystem
      ? `/api/docs/viewSystemDoc?id=${props.doc.id}`
      : `/api/docs/view?id=${props.doc.id}`
      const abs = buildAbsoluteLink(path, baseUrl)
      docxFileUrl.value = appendCacheBuster(abs)
    }
    resetEditorState()
    preloadDocument()
  },
  { immediate: true }
)

watch(isOpen, (val) => emit("update:modelValue", val))

const handleOverlayClick = () => {
  // Close when clicking outside
  close()
}

const saveDocument = async () => {
  if (!documentEditorRef.value || typeof documentEditorRef.value.exportDocument !== 'function') {
    mainStore.setSnackbar({
      title: 'Editor is not ready yet. Please wait a moment and try again.',
      type: 'warning',
    })
    return
  }

  try {
    isLoading.value = true

    const blob = await documentEditorRef.value.exportDocument()
    if (!blob) {
      throw new Error('Failed to export document')
    }

    const arrayBuffer = await blob.arrayBuffer()
    const materializedBlob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    // Create FormData for upload
    const formData = new FormData()
    formData.append('id', props.doc.id)
    

    const fileName = props.doc.name || 'document.docx'
    const file = new File([materializedBlob], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    formData.append('file', file)

    // Upload the document
    const res = await docStore.updateDocument(formData)

    if (res.code === 0) {
      mainStore.setSnackbar({
        title: 'Document saved successfully',
        type: 'success',
      })
      emit('onUpdate')
      close()
    } else {
      mainStore.setSnackbar({
        title: res?.message || res?.data?.message || 'Failed to save document',
        type: 'error',
      })
    }
  } catch (error) {
    console.error('Error saving document:', error)
    mainStore.setSnackbar({
      title: error?.message || 'An error occurred while saving the document',
      type: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  isOpen.value = false
  resetEditorState()
}
</script>

<style scoped>
.docx-editor-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.docx-editor-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1400px;
  height: 90vh;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.docx-editor-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #dbdbdb;
  flex-shrink: 0;
}

.docx-editor-dialog-title {
  font-weight: 600;
  font-size: 16px;
  margin: 0;
  color: #1a1a1a;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docx-editor-dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #737373;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
  transition: color 0.2s;
}

.docx-editor-dialog-close:hover {
  color: #1a1a1a;
}

.docx-editor-dialog-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.docx-editor-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.docx-editor-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #444;
}

.docx-editor-spinner-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.docx-progress-bar-track {
  width: 220px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
}

.docx-progress-bar-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.15s ease;
}

.docx-editor-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #d0d0d0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: docx-spin 0.8s linear infinite;
}

@keyframes docx-spin {
  to {
    transform: rotate(360deg);
  }
}

.editor-wrapper {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.docx-editor-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #dbdbdb;
  flex-shrink: 0;
}

.docx-editor-dialog-button {
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  border: none;
  text-transform: none;
  transition: background-color 0.2s, opacity 0.2s;
  min-width: 80px;
}

.docx-editor-dialog-button-cancel {
  background-color: transparent;
  color: #1a1a1a;
}

.docx-editor-dialog-button-cancel:hover {
  background-color: #f5f5f5;
}

.docx-editor-dialog-button-save {
  background-color: #0061FB;
  color: white;
}

.docx-editor-dialog-button-save:hover:not(:disabled) {
  background-color: #0052d9;
}

.docx-editor-dialog-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .docx-editor-dialog,
.fade-leave-active .docx-editor-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-enter-from .docx-editor-dialog,
.fade-leave-to .docx-editor-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>

