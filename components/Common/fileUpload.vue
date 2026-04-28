<template>
  <div
    class="upload-box"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <img
      src="@/assets/logos/signupSetupScreen/uploadimg.svg"
      alt="Upload File"
      width="50"
      height="50"
      draggable="false"
      class="upload-icon"
    />

    <p class="upload-text">
      Drag & drop your file<span v-if="!isSingle">s</span> here or
      <span class="browse-text" @click.stop="triggerFileInput">Browse</span>
    </p>

    <input
      ref="fileInput"
      type="file"
      :multiple="!isSingle"
      class="hidden-input"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, defineExpose } from "vue";

const props = defineProps({
  isSingle: {
    type: Boolean,
    default: false, // default keeps multiple upload
  },
});

const emit = defineEmits(["onFiles"]);
const selectedFiles = ref([]);
const fileInput = ref(null);

const triggerFileInput = () => fileInput.value?.click();

const handleFileChange = (e) => {
  if (!e.target.files.length) return;

  if (props.isSingle) {
    // only keep the last selected file
    selectedFiles.value = [e.target.files[0]];
  } else {
    selectedFiles.value = [
      ...selectedFiles.value,
      ...Array.from(e.target.files),
    ];
  }

  emit("onFiles", selectedFiles.value);
  e.target.value = "";
};

const handleDrop = (e) => {
  if (!e.dataTransfer.files.length) return;

  if (props.isSingle) {
    selectedFiles.value = [e.dataTransfer.files[0]];
  } else {
    selectedFiles.value = [
      ...selectedFiles.value,
      ...Array.from(e.dataTransfer.files),
    ];
  }

  emit("onFiles", selectedFiles.value);
};

defineExpose({
  clearFiles: () => {
    selectedFiles.value = [];
    if (fileInput.value) fileInput.value.value = "";
  },
});
</script>

<style scoped>
.upload-box {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  background-color: #ffffff;
}
.upload-box:hover {
  border-color: #0061fb;
}
.upload-text {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}
.browse-text {
  color: #0061fb;
  font-weight: 500;
  cursor: pointer;
  margin-left: 4px;
}
.hidden-input {
  display: none;
}
.upload-icon {
  user-select: none;           /* prevents selection */
  pointer-events: none;        /* clicks pass through */
  -webkit-user-drag: none;     /* webkit compatibility */
}
</style>
