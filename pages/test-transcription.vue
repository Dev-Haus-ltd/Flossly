<template>
  <v-container class="pa-8">
    <v-card class="pa-6" elevation="0" rounded="lg">
      <v-card-title class="mb-4">
        <h2 class="text-h5">Transcription Component Test</h2>
      </v-card-title>

      <v-card-text>
        <p class="mb-4 text-body-1">
          Click the button below to test the transcription component. Make sure you:
        </p>
        <ul class="mb-6">
          <li>Grant microphone permissions when prompted</li>
          <li>Speak clearly into your microphone</li>
          <li>Click the stop button when finished recording</li>
        </ul>

        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-microphone"
          @click="showTranscription = true"
        >
          Open Transcription Editor
        </v-btn>

        <!-- Transcription Result Display -->
        <v-card v-if="transcribedResult" class="mt-6 pa-4" elevation="0" color="grey-lighten-5">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Transcribed Text Result:
          </v-card-title>
          <v-card-text>
            <div class="transcribed-text" v-html="transcribedResult"></div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Transcription Editor Dialog -->
    <v-dialog
      v-model="showTranscription"
      max-width="900"
      persistent
      scrollable
    >
      <TranscriptionEditor
        v-model="showTranscription"
        @save="handleSave"
        @close="handleClose"
      />
    </v-dialog>
  </v-container>
</template>

<script setup>
import TranscriptionEditor from '@/components/Common/transcriptionEditor.vue'

definePageMeta({
  layout: 'home',
})

const showTranscription = ref(false)
const transcribedResult = ref(null)

const handleSave = (transcribedText) => {
  console.log('Transcribed text received:', transcribedText)
  transcribedResult.value = transcribedText
  showTranscription.value = false
  
  // Show success message
  const mainStore = useMainStore?.()
  if (mainStore && mainStore.setSnackbar) {
    mainStore.setSnackbar({
      title: 'Transcription saved successfully!',
      type: 'success',
    })
  }
}

const handleClose = () => {
  showTranscription.value = false
}
</script>

<style scoped>
.transcribed-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.6;
}
</style>

