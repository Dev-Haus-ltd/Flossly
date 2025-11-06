<!-- 
  Example usage of the TranscriptionEditor component
  
  This is an example file showing how to use the transcription component
  in your application. You can copy this pattern to integrate it into
  your own components.
-->

<template>
  <div>
    <!-- Button to open transcription editor -->
    <v-btn
      color="primary"
      prepend-icon="mdi-microphone"
      @click="showTranscription = true"
    >
      Start Transcription
    </v-btn>

    <!-- Transcription Editor Component -->
    <TranscriptionEditor
      v-model="showTranscription"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import TranscriptionEditor from '@/components/Common/transcriptionEditor.vue'

const showTranscription = ref(false)

// Handle save event - receives the transcribed text
const handleSave = async (transcribedText) => {
  console.log('Transcribed text:', transcribedText)
  
  // Example: Save to a form field
  // formData.description = transcribedText
  
  // Example: Save to database via API
  // try {
  //   const response = await someService.saveTranscription({
  //     text: transcribedText,
  //     timestamp: new Date()
  //   })
  //   // Handle success
  // } catch (error) {
  //   // Handle error
  // }
  
  // Close the editor after saving
  showTranscription.value = false
}

// Handle close event
const handleClose = () => {
  showTranscription.value = false
}
</script>

