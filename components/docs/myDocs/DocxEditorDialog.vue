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
              v-if="docxFileUrl && isOpen"
              :key="docxFileUrl"
              ref="documentEditorRef"
              :document-url="docxFileUrl"
              class="editor-wrapper"
            />
          </ClientOnly>
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
})

const emit = defineEmits(["update:modelValue", "onUpdate"])

const isOpen = ref(props.modelValue)
const docxFileUrl = ref(null)
const isLoading = ref(false)
const documentEditorRef = ref(null)
const mainStore = useMainStore()
const docStore = useDocStore()

const appendCacheBuster = (absoluteUrl) => {
  const sep = absoluteUrl.includes('?') ? '&' : '?'
  const ver = props?.doc?.updatedAt ? new Date(props.doc.updatedAt).getTime() : Date.now()
  return `${absoluteUrl}${sep}v=${ver}`
}

// Set document URL immediately when doc changes
watch(
  () => props.doc,
  (newDoc) => {
    if (newDoc?.link) {
      const config = useRuntimeConfig()
      const abs = buildAbsoluteLink(newDoc.link, config.public.BASE_URL)
      docxFileUrl.value = appendCacheBuster(abs)
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
      return
    }
    // Ensure URL is set when dialog opens
    if (props.doc?.link && !docxFileUrl.value) {
      const config = useRuntimeConfig()
      const abs = buildAbsoluteLink(props.doc.link, config.public.BASE_URL)
      docxFileUrl.value = appendCacheBuster(abs)
    }
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

