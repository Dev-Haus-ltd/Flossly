<!-- components/LogoUpload.vue -->
<template>
  <div>

    <div
      class="dotted-box"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <img src="../../assets/logos/signupSetupScreen/uploadimg.svg" class="mr-2" alt="">
      <span>
        Drag and drop a file here or <strong>choose one to upload</strong>
      </span>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileChange"
        class="hidden-input"
      />
    </div>
  
    <div v-if="modelValue" class="mt-2">
      <p>Selected: {{ modelValue.name }}</p>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="tonal"
          color="error"
          @click="removeFile"
        />
      <v-img :src="previewUrl" max-width="120" class="mt-2" v-if="previewUrl" />
    </div>
  </div>
  </template>
  
  <script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const modelValue = defineModel() // v-model for parent binding

const fileInput = ref(null)
const previewUrl = ref(null)

// Store previous object URL to revoke it later
let previousUrl = null

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    setFile(file)
  }
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) {
    setFile(file)
  }
}

const setFile = (file) => {
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file && file.size > maxSize) {
    const mainStore = useMainStore();
    mainStore.setSnackbar({
      title: "Image file is too large. Please choose an image smaller than 5MB.",
      type: "Error",
    });
    return;
  }

  modelValue.value = file
  if (previousUrl) URL.revokeObjectURL(previousUrl)
  if (file && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file)
    previewUrl.value = url
    previousUrl = url
  } else {
    previewUrl.value = null
  }
}

const removeFile = () => {
  modelValue.value = null
  previewUrl.value && URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  previousUrl = null
}

// Clean up when component is destroyed
onBeforeUnmount(() => {
  if (previousUrl) URL.revokeObjectURL(previousUrl)
})
</script>

  
  <style scoped>
  .dotted-box {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    transition: border-color 0.2s;
    text-align: center;
    font-size: 14px;
  }
  .dotted-box:hover {
    border-color: #008AFE;
    color: #0061FB;
  }
  .hidden-input {
    display: none;
  }
  </style>
  