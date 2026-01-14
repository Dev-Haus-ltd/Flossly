<template>
  <v-dialog v-model="isOpen" max-width="500px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="font-weight: 600; font-size: 16px; border-bottom: 1px solid #dbdbdb;"
      >
        Rename Folder
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

      <!-- Text Field -->
      <v-card-text class="mt-2">
        <v-label class="mb-2" style="font-size: 14px">Folder Name</v-label>
        <v-text-field
          v-model="folderName"
          placeholder="Enter folder name"
          hide-details
          variant="solo"
          density="compact"
          class="input-bordered"
          flat
          @keyup.enter="save"
        />
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          variant="flat"
          @click="close"
          :disabled="loading"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="save"
          :disabled="!folderName.trim() || folderName === originalName"
          style="font-weight: 500; text-transform: none"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  folder: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "updated"]);

const docStore = useDocStore();
const mainStore = useMainStore();

const isOpen = ref(props.modelValue);
const folderName = ref("");
const originalName = ref("");
const loading = ref(false);

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val && props.folder) {
    folderName.value = props.folder.name || "";
    originalName.value = props.folder.name || "";
  }
});

watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
  folderName.value = "";
  originalName.value = "";
};

const save = async () => {
  if (!props.folder || !folderName.value.trim()) return;
  if (folderName.value === originalName.value) return;
  
  loading.value = true;
  try {
    const res = await docStore.updateFolder({
      id: props.folder.id,
      name: folderName.value.trim(),
      color: props.folder.color,
      description: props.folder.description,
    });
    
    if (res.code === 0) {
      mainStore.setSnackbar({
        title: "Folder renamed successfully",
        type: "success",
      });
      emit("updated");
      close();
    } else {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Failed to rename folder",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An error occurred",
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};
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

