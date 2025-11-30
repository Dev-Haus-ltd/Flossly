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
            :disabled="!isRecording && isProcessing"
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
            Audio recorded
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
        
        <!-- Summarizing indicator -->
        <v-alert
          v-if="isSummarizing"
          type="info"
          variant="tonal"
          class="mb-3"
          density="compact"
        >
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              size="20"
              width="2"
              class="mr-3"
            />
            Summarizing transcription with AI...
          </div>
        </v-alert>
        
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
        :disabled="(!transcribedText && !summarizedText) || isProcessing || isRecording"
        prepend-icon="mdi-content-save"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { useTranscription } from '@/composables/useTranscription';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'close']);

const editorEl = ref(null);

const {
  isRecording,
  isProcessing,
  isSaving,
  isSummarizing,
  error,
  audioBlob,
  recordingTime,
  transcribedText,
  summarizedText,
  toggleRecording,
  formatTime,
  clearEditor,
  handleSummarize,
  stopRecording,
} = useTranscription(editorEl);

// Save handler
const handleSave = async () => {
  // Always save summarized text if available, otherwise save original
  const textToSave = summarizedText.value || transcribedText.value;
  
  if (!textToSave) return;

  isSaving.value = true;
  try {
    emit('save', textToSave);
  } catch (err) {
    error.value = 'Failed to save transcription.';
    console.error('Save error:', err);
  } finally {
    isSaving.value = false;
  }
};

// Close handler
const handleClose = () => {
  if (isRecording.value) {
    stopRecording();
  }
  emit('close');
  emit('update:modelValue', false);
};
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
  aspect-ratio: 1 / 1;
  width: 64px;
  height: auto;
  max-width: 100%;
  max-height: 100%;
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