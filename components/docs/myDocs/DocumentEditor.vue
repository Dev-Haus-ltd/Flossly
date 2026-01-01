<template>
  <div class="document-editor">
    <div :key="documentKey" class="editor-container">
      <div :id="toolbarId" class="toolbar"></div>
      <div :id="editorId" class="editor"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { SuperDoc } from 'superdoc'
import 'superdoc/style.css'

const props = defineProps({
  documentUrl: {
    type: String,
    default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['editor-ready', 'editor-error'])

// Use ref to track the editor instance
const editor = ref(null)
const documentKey = ref(0)

// Method to export document as blob
const exportDocument = async () => {
  if (!editor.value) {
    throw new Error('Editor not initialized')
  }
  
  try {
    // Use exportEditorsToDOCX which explicitly returns an array of Blobs
    if (typeof editor.value.exportEditorsToDOCX === 'function') {
      const blobs = await editor.value.exportEditorsToDOCX({
        isFinalDoc: true
      })
      // Return the first blob (main document)
      if (blobs && blobs.length > 0 && blobs[0] instanceof Blob) {
        return blobs[0]
      }
    }
    
    // Fallback to export method
    if (typeof editor.value.export === 'function') {
      const result = await editor.value.export({
        exportType: ['docx'],
        triggerDownload: false
      })
      // The export method might return a Blob
      if (result instanceof Blob) {
        return result
      }
      // If it's an ArrayBuffer, convert to Blob
      if (result instanceof ArrayBuffer) {
        return new Blob([result], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        })
      }
    }
    
    throw new Error('Export method not available on editor')
  } catch (error) {
    console.error('Error exporting document:', error)
    throw error
  }
}

// Expose methods to parent component
defineExpose({
  exportDocument
})

// Generate unique IDs for multiple editor instances
const editorId = ref(`superdoc-${Math.random().toString(36).substr(2, 9)}`)
const toolbarId = ref(`superdoc-toolbar-${Math.random().toString(36).substr(2, 9)}`)

// Function to safely destroy editor
const destroyEditor = () => {
  if (editor.value) {
    try {
      editor.value = null
    } catch (error) {
      console.error('Error destroying editor:', error)
    }
  }
}

// Function to initialize editor
const initializeEditor = async () => {
  try {
    // Ensure cleanup of previous instance
    destroyEditor()
    
    // Wait for next tick to ensure DOM is ready
    await nextTick()
    
    // Don't initialize if no document URL is provided
    if (!props.documentUrl) {
      return
    }
    
    // Increment key to force re-render
    documentKey.value++

    // Create new editor instance with document URL
    editor.value = new SuperDoc({
      selector: `#${editorId.value}`,
      toolbar: `#${toolbarId.value}`,
      document: props.documentUrl, // URL to the document file
      documentMode: props.readOnly ? 'viewing' : 'editing',
      pagination: true,
      rulers: true,
      onReady: (event) => {
        console.log('SuperDoc is ready', event)
        emit('editor-ready', editor.value)
      },
      onEditorCreate: (event) => {
        console.log('Editor is created', event)
      },
    })
  } catch (error) {
    console.error('Failed to initialize editor:', error)
    emit('editor-error', error)
  }
}

// Watch for changes in props that should trigger re-initialization
watch(
  () => props.documentUrl,
  (newUrl, oldUrl) => {
    // Only initialize if URL actually changed and is not null
    if (newUrl && newUrl !== oldUrl) {
      initializeEditor()
    }
  },
  { immediate: false }
)

watch(
  () => props.readOnly,
  () => {
    if (props.documentUrl) {
      initializeEditor()
    }
  }
)

onMounted(() => {
  initializeEditor()
})

onUnmounted(() => {
  destroyEditor()
})
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.document-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.toolbar {
  flex: 0 0 auto;
  border-bottom: 1px solid #eee;
  min-height: 40px;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

.editor {
  display: flex;
  justify-content: center;
  flex: 1 1 auto;
  overflow: auto;
  margin-top: 10px;
  min-height: 400px;
}
</style>

