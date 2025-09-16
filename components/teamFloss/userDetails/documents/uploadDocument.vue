<template>
    <v-dialog v-model="isOpen" max-width="700px" class="rounded-lg">
      <v-card>
        <!-- Title -->
        <v-card-title
          class="d-flex align-center justify-space-between dialog-title"
        >
          Upload File for {{ doc?.name }}
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
  
        <!-- Upload -->
        <div class="pa-5">
          <CommonFileUpload isSingle ref="fileUploader" @onFiles="getFiles" />
        </div> 
  
        <!-- Uploaded Files -->
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
                :folder="doc"
              />
            </v-col>
          </v-row>
        </div>
  
        <!-- Actions -->
        <v-card-actions class="justify-end">
          <v-btn
            text
            @click="close"
            style="font-weight: 500; text-transform: none"
          >
            Cancel
          </v-btn>
          <v-btn
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
import { ref, watch } from "vue";
  const mainStore = useMainStore();
  const authStore = useAuthStore();
  
  const props = defineProps({
    modelValue: Boolean,
    doc: {
      type: Object,
      required: true,
    },
    user:{
        type:Object,
        required:true
    }
  });
  
  const emit = defineEmits(["update:modelValue", "onUpdate"]);
  
  const isOpen = ref(props.modelValue);
  const uploadedFiles = ref([]);
  const fileUploader = ref(null);
  
  watch(
    () => props.modelValue,
    (val) => (isOpen.value = val)
  );
  watch(isOpen, (val) => emit("update:modelValue", val));
  
  const getFiles = (files) => {
    uploadedFiles.value = files;
    console.log(uploadedFiles.value,files)
  };
  
  const saveFile = async () => {

    try {
      const form = new FormData();
      form.append("userId", props.user?.id);
      form.append("name",  props.doc?.name); 
      form.append("type", props.doc?.type); // attach doc id
      uploadedFiles.value.forEach((file) => { 
        form.append("file", file);
      });
  
      const res = await authStore.addUserHrDoc(form); // API call
      if (res.code === 0) {
        mainStore.setSnackbar({
          title:
            uploadedFiles.value.length > 1
              ? "Files uploaded successfully."
              : "File uploaded successfully.",
          type: "success",
        });
        emit("onUpdate");
        close();
      } else {
        mainStore.setSnackbar({
          title: res?.message || res.data?.message || "Upload failed. Please try again.",
          type: "error",
        });
      }
    } catch (err) {
      mainStore.setSnackbar({
        title: err.message || "Unexpected error. Please try again.",
        type: "error",
      });
    }
  };
  
  const close = () => {
    fileUploader.value?.clearFiles();
    uploadedFiles.value = [];
    isOpen.value = false;
  };
  </script>
  
  <style scoped>
  .dialog-title {
    font-family: Poppins;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid #dbdbdb;
  }
  </style>
  