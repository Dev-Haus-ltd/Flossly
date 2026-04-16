<!-- components/consent/SignaturePlacementEditor.vue -->
<template>
  <div class="signature-placement-editor">
    <div class="editor-container">
      <!-- Preview Mode - Just Visual -->
      <div v-if="mode === 'preview'" class="preview-mode">
        <div 
          class="form-preview-wrapper"
          :style="{ maxHeight: previewHeight + 'px', overflow: 'auto' }"
        >
          <div ref="formPreviewRef" class="form-html-preview" v-html="previewHtmlContent" />
          <div 
            v-if="showSignaturePlaceholder"
            class="signature-placeholder-overlay"
            :style="signatureStyle"
          >
            <div class="signature-placeholder-content">
              <v-icon size="24" color="#0061fb">mdi-draw</v-icon>
              <span>Signature</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Mode - Draggable Signature Field -->
      <div v-else class="edit-mode">
        

        <div 
          ref="editorContainerRef"
          class="form-editor-wrapper"
          :style="{ maxHeight: editorHeight + 'px', overflow: 'auto', position: 'relative' }"
        >
          <div 
            ref="formContentRef" 
            class="form-html-content" 
            v-html="previewHtmlContent"
            @load="calculateInitialPosition"
          />
          
          <!-- Draggable Signature Field -->
          <div
            ref="draggableField"
            class="draggable-signature-field"
            :style="{
              left: position.left + 'px',
              top: position.top + 'px',
              width: position.width + 'px',
              height: position.height + 'px'
            }"
            :class="{ dragging: isDragging, 'field-placed': isPlaced }"
            @mousedown="startDrag"
            @touchstart="startDrag"
          >
            <div class="drag-handle">
              <v-icon size="16" class="drag-icon">mdi-drag-vertical</v-icon>
              <span class="drag-label">Signature Field</span>
              <v-icon size="16" class="resize-icon" @mousedown.stop="startResize" @touchstart.stop="startResize">mdi-arrow-expand</v-icon>
            </div>
            <div class="field-content">
              <v-icon size="20">mdi-draw</v-icon>
              <span>Patient Signature</span>
            </div>
          </div>
        </div>

        <!-- Position Controls (Hidden from users, for debugging only) -->
        <div v-if="showDebug" class="debug-info mt-3">
          <v-card variant="outlined" density="compact">
            <v-card-text class="pa-2">
              <div class="text-caption text-grey">Position: X={{ Math.round(position.left) }}, Y={{ Math.round(position.top) }}</div>
              <div class="text-caption text-grey">Size: {{ Math.round(position.width) }} × {{ Math.round(position.height) }} px</div>
            </v-card-text>
          </v-card>
        </div>

        <!-- <div class="edit-actions mt-4">
          <v-btn 
            variant="outlined" 
            size="small"
            @click="resetPosition"
          >
            Reset Position
          </v-btn>
          <v-btn 
            variant="outlined" 
            size="small"
            @click="toggleDebug"
          >
            {{ showDebug ? 'Hide' : 'Show' }} Debug Info
          </v-btn>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  htmlContent: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Object,
    default: () => ({
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      page: 1
    })
  },
  mode: {
    type: String,
    default: 'edit' // 'edit' or 'preview'
  },
  showSignaturePlaceholder: {
    type: Boolean,
    default: true
  },
  previewHeight: {
    type: Number,
    default: 500
  },
  editorHeight: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Refs
const editorContainerRef = ref(null)
const formContentRef = ref(null)
const formPreviewRef = ref(null)
const draggableField = ref(null)

// State
const position = ref({
  left: props.modelValue.x || 100,
  top: props.modelValue.y || 100,
  width: props.modelValue.width || 200,
  height: props.modelValue.height || 80
})

const isDragging = ref(false)
const isResizing = ref(false)
const showDebug = ref(false)
const containerRect = ref(null)
const dragStart = ref({ x: 0, y: 0, left: 0, top: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// Computed
const isPlaced = computed(() => {
  return position.value.left > 0 && position.value.top > 0
})

const signatureStyle = computed(() => ({
  position: 'absolute',
  left: position.value.left + 'px',
  top: position.value.top + 'px',
  width: position.value.width + 'px',
  height: position.value.height + 'px',
  border: '2px dashed #0061fb',
  borderRadius: '8px',
  backgroundColor: 'rgba(0, 97, 251, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 10
}))

const sanitizedHtml = computed(() => {
  if (!props.htmlContent) return '<div class="empty-content">No content available</div>'
  return props.htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
})
const previewHtmlContent = computed(() => {
  const cleanHtml = sanitizedHtml.value || ''

const signatureHtml = `
  <div style="
    display: block;
    width: 100%;
    margin-top: 24px;
    margin-bottom: 24px;
    clear: both;
  ">

  </div>
`
  if (cleanHtml.includes('[SIGNATURE]')) {
    return cleanHtml.replace('[SIGNATURE]', signatureHtml)
  }

  return cleanHtml + `
    <div style="margin-top: 24px;">
      ${signatureHtml}
    </div>
  `
})
// Methods
const calculateInitialPosition = async () => {
  await nextTick()
  
  if (!editorContainerRef.value) return
  
  const container = editorContainerRef.value
  containerRect.value = container.getBoundingClientRect()
  
  // If position is zero, set a default position
  if (position.value.left === 0 && position.value.top === 0) {
    position.value.left = 50
    position.value.top = 100
  }
  
  // Ensure position is within bounds
  validatePosition()
}

const validatePosition = () => {
  if (!editorContainerRef.value) return
  
  const container = editorContainerRef.value
  const maxLeft = container.scrollWidth - position.value.width - 20
  const maxTop = container.scrollHeight - position.value.height - 20
  
  position.value.left = Math.max(10, Math.min(position.value.left, maxLeft))
  position.value.top = Math.max(10, Math.min(position.value.top, maxTop))
}

const startDrag = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  isDragging.value = true
  
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  dragStart.value = {
    x: clientX,
    y: clientY,
    left: position.value.left,
    top: position.value.top
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  e.preventDefault()
  
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y
  
  let newLeft = dragStart.value.left + deltaX
  let newTop = dragStart.value.top + deltaY
  
  // Constrain within container
  if (editorContainerRef.value) {
    const container = editorContainerRef.value
    const maxLeft = container.scrollWidth - position.value.width - 10
    const maxTop = container.scrollHeight - position.value.height - 10
    
    newLeft = Math.max(5, Math.min(newLeft, maxLeft))
    newTop = Math.max(5, Math.min(newTop, maxTop))
  }
  
  position.value.left = newLeft
  position.value.top = newTop
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  
  emitPosition()
}

const startResize = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  isResizing.value = true
  
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  resizeStart.value = {
    x: clientX,
    y: clientY,
    width: position.value.width,
    height: position.value.height
  }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', onResize)
  document.addEventListener('touchend', stopResize)
}

const onResize = (e) => {
  if (!isResizing.value) return
  
  e.preventDefault()
  
  const clientX = e.clientX ?? e.touches?.[0]?.clientX
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  
  const deltaX = clientX - resizeStart.value.x
  const deltaY = clientY - resizeStart.value.y
  
  let newWidth = Math.max(120, Math.min(resizeStart.value.width + deltaX, 500))
  let newHeight = Math.max(60, Math.min(resizeStart.value.height + deltaY, 200))
  
  position.value.width = newWidth
  position.value.height = newHeight
  
  validatePosition()
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
  
  emitPosition()
}

const resetPosition = () => {
  position.value = {
    left: 100,
    top: 200,
    width: 200,
    height: 80
  }
  validatePosition()
  emitPosition()
}

const emitPosition = () => {
  const coordinates = {
    x: Math.round(position.value.left),
    y: Math.round(position.value.top),
    width: Math.round(position.value.width),
    height: Math.round(position.value.height),
    page: 1
  }
  
  emit('update:modelValue', coordinates)
  emit('change', coordinates)
}

const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

// Watch for container scroll changes
const handleScroll = () => {
  if (isDragging.value || isResizing.value) return
  validatePosition()
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    calculateInitialPosition()
    if (editorContainerRef.value) {
      editorContainerRef.value.addEventListener('scroll', handleScroll)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
  
  if (editorContainerRef.value) {
    editorContainerRef.value.removeEventListener('scroll', handleScroll)
  }
})

// Watch external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    position.value = {
      left: newVal.x || position.value.left,
      top: newVal.y || position.value.top,
      width: newVal.width || position.value.width,
      height: newVal.height || position.value.height
    }
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.signature-placement-editor {
  width: 100%;
}

// Preview Mode
.preview-mode {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
  
  .form-preview-wrapper {
    position: relative;
    
    .form-html-preview {
      padding: 24px;
      min-height: 300px;
      
      :deep(*) {
        max-width: 100%;
      }
    }
    
    .signature-placeholder-overlay {
      .signature-placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 12px;
        color: #0061fb;
        font-weight: 500;
      }
    }
  }
}

// Edit Mode
.edit-mode {
  .edit-header {
    margin-bottom: 16px;
  }
  
  .form-editor-wrapper {
    position: relative;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #ffffff;
    
    .form-html-content {
      padding: 24px;
      min-height: 300px;
      user-select: none;
      
      :deep(*) {
        max-width: 100%;
        pointer-events: none;
      }
    }
    
    .draggable-signature-field {
      position: absolute;
      cursor: move;
      background: rgba(0, 97, 251, 0.08);
      border: 2px solid #0061fb;
      border-radius: 10px;
      transition: box-shadow 0.2s ease;
      z-index: 100;
      
      &.dragging {
        opacity: 0.8;
        cursor: grabbing;
        box-shadow: 0 4px 12px rgba(0, 97, 251, 0.3);
      }
      
      &.field-placed {
        background: rgba(0, 97, 251, 0.05);
      }
      
      .drag-handle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: #0061fb;
        border-radius: 8px 8px 0 0;
        cursor: move;
        
        .drag-icon {
          color: white;
          cursor: move;
        }
        
        .drag-label {
          font-size: 11px;
          font-weight: 500;
          color: white;
          flex: 1;
          text-align: center;
        }
        
        .resize-icon {
          color: white;
          cursor: nw-resize;
          
          &:hover {
            transform: scale(1.1);
          }
        }
      }
      
      .field-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 12px;
        min-height: 50px;
        
        span {
          font-size: 11px;
          font-weight: 500;
          color: #0061fb;
        }
      }
    }
  }
  
  .edit-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .debug-info {
    border-radius: 8px;
    background: #f8fafc;
  }
}

// Empty content styling
:deep(.empty-content) {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

// Responsive
@media (max-width: 768px) {
  .edit-mode .form-editor-wrapper .draggable-signature-field {
    .drag-handle .drag-label {
      display: none;
    }
  }
}
</style>