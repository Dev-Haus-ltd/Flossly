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
      <p class="mb-2">Selected: {{ modelValue.name }}</p>
      <div class="image-preview-container" v-if="previewUrl">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
        <v-btn
          icon
          size="small"
          variant="flat"
          color="error"
          class="remove-image-btn"
          @click.stop="removeImage"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
  </template>
  
  <script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const modelValue = defineModel() // v-model for parent binding

const fileInput = ref(null)
const previewUrl = ref(null)
const config = useRuntimeConfig()

// Store previous object URL to revoke it later
let previousUrl = null

// Get max file size from env variable (defaults to 5MB if not set)
const maxFileSize = computed(() => {
  const sizeFromEnv = config.public.MAX_FILE_SIZE_FOR_LOGO;
  // If it's a string, parse it; if it's already a number, use it; otherwise default to 5MB
  if (typeof sizeFromEnv === 'string') {
    return parseInt(sizeFromEnv, 10) || 5 * 1024 * 1024;
  }
  return sizeFromEnv || 5 * 1024 * 1024;
});

// Format bytes to human readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

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
  // Check file size using env variable
  if (file && file.size > maxFileSize.value) {
    const mainStore = useMainStore();
    const maxSizeFormatted = formatFileSize(maxFileSize.value);
    mainStore.setSnackbar({
      title: `Image file is too large. Please choose an image smaller than ${maxSizeFormatted}.`,
      type: "error",
    });
    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
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

const removeImage = () => {
  // Clear the model value
  modelValue.value = null
  
  // Revoke and clear preview URL
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl)
    previousUrl = null
  }
  previewUrl.value = null
  
  // Clear file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
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
  
  .image-preview-container {
    position: relative;
    display: inline-block;
    margin-top: 8px;
  }
  
  .preview-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    display: block;
  }
  
  .remove-image-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    min-width: 28px;
    width: 28px;
    height: 28px;
    z-index: 1;
    background-color: #f44336 !important;
  }
  
  .remove-image-btn:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    background-color: #d32f2f !important;
  }
  </style>
  