<template>
  <div
    :class="['upload-box', { 'drag-over': isDragOver, 'upload-box--disabled': disabled }]"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <v-icon size="40" color="#266DF0">mdi-cloud-upload-outline</v-icon>

    <p class="upload-text">
      {{ isDragOver ? "Release to upload files" : "Drag & drop your files here or" }}
      <span v-if="!isDragOver" class="browse-text" @click.stop="triggerFileInput">Browse</span>
    </p>
    <p class="upload-hint">You can select multiple files. Allowed: PDF, DOC/DOCX, PNG, JPG.</p>

    <input
      ref="fileInput"
      type="file"
      class="hidden-input"
      multiple
      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  disabled: { type: Boolean, default: false },
})
const { disabled } = toRefs(props)

const emit = defineEmits(["upload"]);

const fileInput = ref(null);
const isDragOver = ref(false);

const triggerFileInput = () => {
  if (props.disabled) return
  fileInput.value?.click()
}
const resetDragState = () => (isDragOver.value = false);

const emitFiles = (fileList) => {
  const files = Array.from(fileList || []).filter(Boolean);
  if (files.length) emit("upload", files);
};

const handleFileChange = (e) => {
  emitFiles(e.target.files);
  if (fileInput.value) fileInput.value.value = "";
};

const handleDragEnter = () => {
  if (props.disabled) return
  isDragOver.value = true;
};

const handleDragOver = (e) => {
  if (props.disabled) return
  e.dataTransfer.dropEffect = "copy";
  isDragOver.value = true;
};

const handleDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    resetDragState();
  }
};

const handleDrop = (e) => {
  if (props.disabled) return
  const { files } = e.dataTransfer;
  resetDragState();
  emitFiles(files);
};
</script>

<style scoped>
.upload-box {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background-color 0.3s, box-shadow 0.3s;
  background-color: #ffffff;
}

.upload-box:hover {
  border-color: #266df0;
}

.upload-box.drag-over {
  border-color: #266df0;
  background-color: #f4f7ff;
  box-shadow: 0 0 0 3px rgba(38, 109, 240, 0.1);
}

.upload-box--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-text {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.upload-hint {
  margin: 6px 0 0;
  color: #8a8a8a;
  font-size: 12px;
}

.upload-box.drag-over .upload-text {
  color: #1f4fb8;
}

.browse-text {
  color: #266df0;
  font-weight: 500;
  cursor: pointer;
  margin-left: 4px;
}

.hidden-input {
  display: none;
}
</style>
