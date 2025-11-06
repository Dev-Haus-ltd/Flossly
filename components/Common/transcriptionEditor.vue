<template>
  <v-card class="transcription-card" elevation="0" rounded="lg">
    <!-- Header -->
    <v-card-title class="card-head d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-microphone</v-icon>
        <span>Voice Transcription</span>
      </div>
      <v-btn
        icon
        variant="text"
        size="small"
        @click="handleClose"
        style="min-width: unset; color: #737373"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- Content -->
    <v-card-text class="pa-4">
      <!-- Recording Controls -->
      <div class="recording-controls mb-4">
        <div class="d-flex align-center justify-center gap-3">
          <v-btn
            :color="isRecording ? 'error' : 'primary'"
            :variant="isRecording ? 'flat' : 'outlined'"
            :disabled="isProcessing"
            size="large"
            rounded="circle"
            @click="toggleRecording"
            class="record-btn"
          >
            <v-icon size="24">
              {{ isRecording ? 'mdi-stop' : 'mdi-microphone' }}
            </v-icon>
          </v-btn>
          <div v-if="isRecording" class="recording-indicator">
            <v-chip color="error" size="small" prepend-icon="mdi-circle">
              Recording...
            </v-chip>
            <span class="recording-time ml-2">{{ formatTime(recordingTime) }}</span>
          </div>
        </div>
        <div v-if="audioBlob && !isRecording" class="mt-3 text-center">
          <v-chip color="success" size="small" prepend-icon="mdi-check-circle">
            Audio recorded ({{ formatDuration(audioDuration) }})
          </v-chip>
        </div>
      </div>

      <!-- Processing Indicator -->
      <v-alert
        v-if="isProcessing"
        type="info"
        variant="tonal"
        class="mb-4"
        density="compact"
      >
        <div class="d-flex align-center">
          <v-progress-circular
            indeterminate
            size="20"
            width="2"
            class="mr-3"
          />
          Transcribing audio...
        </div>
      </v-alert>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        density="compact"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <!-- Editor Section -->
      <div class="editor-section">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
            <v-icon size="18" class="mr-2">mdi-text-box</v-icon>
            Transcription
          </div>
          <v-btn
            v-if="transcribedText"
            size="small"
            variant="text"
            @click="clearEditor"
            color="grey"
          >
            <v-icon size="16" class="mr-1">mdi-close-circle</v-icon>
            Clear
          </v-btn>
        </div>
        <div ref="editorEl" class="editor-container"></div>
      </div>
    </v-card-text>

    <v-divider />

    <!-- Actions -->
    <v-card-actions class="pa-4 justify-end">
      <v-btn
        variant="text"
        @click="handleClose"
        :disabled="isProcessing || isRecording"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        @click="handleSave"
        :loading="isSaving"
        :disabled="!transcribedText || isProcessing || isRecording"
        prepend-icon="mdi-content-save"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

// State
const isRecording = ref(false)
const isProcessing = ref(false)
const isSaving = ref(false)
const error = ref(null)
const audioBlob = ref(null)
const audioDuration = ref(0)
const recordingTime = ref(0)
const transcribedText = ref('')
const mediaRecorder = ref(null)
const audioChunks = ref([])
const recordingInterval = ref(null)

// Editor
const editorEl = ref(null)
let EditorCtor = null
let Header = null
let List = null
let editor = null

// Initialize editor
const initEditor = async () => {
  if (typeof window === 'undefined' || !editorEl.value) return
  
  if (!EditorCtor || !Header || !List) {
    const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
    ])
    EditorCtor = E
    Header = H
    List = L
  }

  if (editor) {
    editor.destroy()
    editor = null
  }

  editor = new EditorCtor({
    holder: editorEl.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(transcribedText.value || ''),
    placeholder: 'Transcribed text will appear here...',
    onChange: async (api) => {
      const saved = await api.saver.save()
      transcribedText.value = blocksToHtml(saved)
    }
  })
}

// Recording functions
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks.value = []
    mediaRecorder.value = new MediaRecorder(stream)
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(audioChunks.value, { type: 'audio/webm' })
      audioBlob.value = blob
      stream.getTracks().forEach(track => track.stop())
      
      // Calculate duration
      const audio = new Audio()
      audio.src = URL.createObjectURL(blob)
      audio.onloadedmetadata = () => {
        audioDuration.value = audio.duration
      }
    }

    mediaRecorder.value.start()
    isRecording.value = true
    recordingTime.value = 0
    
    recordingInterval.value = setInterval(() => {
      recordingTime.value++
    }, 1000)
  } catch (err) {
    error.value = 'Failed to access microphone. Please check permissions.'
    console.error('Error accessing microphone:', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    if (recordingInterval.value) {
      clearInterval(recordingInterval.value)
      recordingInterval.value = null
    }
  }
}

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// Transcription
const transcribeAudio = async () => {
  if (!audioBlob.value) return

  isProcessing.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('audio', audioBlob.value, 'recording.webm')

    const transcriptionService = await import('~/services/transcriptionService')
    const response = await transcriptionService.default.transcribeAudio(formData)

    if (response.code === 0 && response.data && response.data.text) {
      transcribedText.value = response.data.text
      await nextTick()
      await initEditor()
    } else {
      error.value = response.message || 'Transcription failed. Please try again.'
    }
  } catch (err) {
    error.value = err.message || 'Failed to transcribe audio. Please try again.'
    console.error('Transcription error:', err)
  } finally {
    isProcessing.value = false
  }
}

// Watch for audio blob to trigger transcription
watch(audioBlob, (newBlob) => {
  if (newBlob && !isRecording.value) {
    transcribeAudio()
  }
})

// Format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

// Clear editor
const clearEditor = async () => {
  transcribedText.value = ''
  audioBlob.value = null
  audioDuration.value = 0
  await nextTick()
  await initEditor()
}

// Save handler
const handleSave = async () => {
  if (!transcribedText.value) return

  isSaving.value = true
  try {
    emit('save', transcribedText.value)
  } catch (err) {
    error.value = 'Failed to save transcription.'
    console.error('Save error:', err)
  } finally {
    isSaving.value = false
  }
}

// Close handler
const handleClose = () => {
  if (isRecording.value) {
    stopRecording()
  }
  emit('close')
  emit('update:modelValue', false)
}

// Initialize editor on mount
onMounted(async () => {
  await nextTick()
  await initEditor()
})

// Cleanup
onBeforeUnmount(() => {
  if (isRecording.value) {
    stopRecording()
  }
  if (editor) {
    editor.destroy()
    editor = null
  }
  if (recordingInterval.value) {
    clearInterval(recordingInterval.value)
  }
})
</script>

<style scoped>
.transcription-card {
  border: 1px solid #dbdbdb;
}

.card-head {
  font-weight: 600;
  font-size: 16px;
  padding: 24px;
  border-bottom: 1px solid #dbdbdb;
}

.recording-controls {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.record-btn {
  width: 64px;
  height: 64px;
}

.recording-indicator {
  display: flex;
  align-items: center;
}

.recording-time {
  font-weight: 600;
  color: #d32f2f;
}

.editor-section {
  margin-top: 16px;
}

.editor-container {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 16px;
  background-color: white;
}

/* EditorJS styles */
.editor-container :deep(.codex-editor) {
  border: none;
}

.editor-container :deep(.codex-editor__redactor) {
  padding: 0;
}

.editor-container :deep(.ce-block__content) {
  max-width: 100%;
}
</style>

