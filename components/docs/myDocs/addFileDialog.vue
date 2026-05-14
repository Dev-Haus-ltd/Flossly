<template>
  <v-dialog v-model="isOpen" max-width="700px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Add File(s) in {{ folder?.name || selectedFolder?.name }}
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div class="pa-5">
        <v-label v-if="!folder?.id" class="mb-2" style="font-size: 14px"
          >Select folder</v-label
        >
        <v-autocomplete
          v-if="!folder?.id"
          v-model="selectedFolder"
          v-model:search="searchQuery"
          :items="filteredFolders"
          item-title="name"
          item-value="id"
          class="input-bordered"
          density="compact"
          variant="solo"
          placeholder="Search folders..."
          clearable
          no-filter
          @update:model-value="handleSelect"
          flat
        />
        <CommonFileUpload 
          v-if="selectedFolder?.id || folder?.id"
          ref="fileUploader"
          @onFiles="getFiles"
        />
      </div>

      <div v-if="uploadedFiles.length" class="pa-5">
        <v-row>
          <v-col
            v-for="(file, index) in uploadedFiles"
            :key="index"
            cols="12"
            sm="6"
            md="6"
          >
            <DocsMyDocsRecentlyAccessed
              class="mb-2"
              :file="file"
              :folder="props.folder || selectedFolder"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          variant="flat"
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="saveFile"
          style="font-weight: 500; text-transform: none"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
const mainStore = useMainStore();
const props = defineProps({
  modelValue: Boolean,
  folder: Object,
  foldersList: Array,
  isSystemDocs:Boolean
});
const selectedFolder = ref(null);
const uploadedFiles = ref([]);
const fileUploader = ref(null);
const docStore = useDocStore();
const { refreshUsage } = useUsageSummary();
const searchQuery = ref("");

// Compute filtered folders based on search query
const filteredFolders = computed(() => {
  if (!searchQuery.value) {
    return props.foldersList;
  }
  const query = searchQuery.value.toLowerCase();
  return props.foldersList.filter((folder) =>
    folder.name.toLowerCase().includes(query)
  );
});

const getFiles = (files) => {
  uploadedFiles.value = files;
};
const saveFile = () => {
  const form = new FormData();
  form.append("tags", "");
  form.append("folderId", props.folder?.id ?? selectedFolder.value?.id);
  uploadedFiles.value.forEach((file) => {
    form.append("file", file);
  });
  const uploadFn = props.isSystemDocs ? docStore.addSystemDocs : docStore.addDocs;
  uploadFn(form)
    .then((res) => {
      if (res.code === 0) {
        close();
        emit("onUpdate");
        refreshUsage();
        mainStore.setSnackbar({
          title:
            uploadedFiles.value.length > 1
              ? "Files uploaded successfully."
              : "File uploaded successfully.",
          type: "success",
        });
        close();
      } else {
        mainStore.setSnackbar({
          title:
            res.data?.message ||
            res.message ||
            "Unable to upload files. Please try again.",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title:
          err.message ||
          "An unexpected error occurred. Please try again later.",
        type: "error",
      });
    });
};
const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);

// Sync prop with local state
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  fileUploader.value?.clearFiles();
  uploadedFiles.value = [];
  selectedFolder.value = null;
  searchQuery.value = "";
  isOpen.value = false;
};
function handleSelect(folder) {
  if (folder && typeof folder === 'object') {
    selectedFolder.value = folder;
  } else if (folder) {
    // If it's an ID, find the folder object
    const foundFolder = props.foldersList.find((f) => f.id === folder);
    selectedFolder.value = foundFolder || null;
  }
}
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
