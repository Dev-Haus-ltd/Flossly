<template>
    <v-card
      class="pa-4 rounded-lg file-card d-flex flex-column"
      style="border: 1px solid #dbdbdb; cursor: pointer;"
      @click="$emit('open', file)"
      flat
    >
      <!-- Content with equal vertical gap -->
      <div class="d-flex flex-column align-start h-100 content-container">
        <!-- Top Row: File Image + Action Icon -->
        <div class="d-flex justify-space-between w-100">
          <img
            src="@/assets/images/flosslydocs/file.svg"
            alt="File"
            width="50"
            height="68"
          />
          <img
            src="@/assets/icons/dashBoard/link.svg"
            alt="Action"
            class="action-icon"
            @click.stop="$emit('action', file)"
          />
        </div>
  
        <!-- File Name -->
        <div class="file-name">
          {{ file.name }}
        </div>
  
        <!-- Folder Name -->
        <div class="folder-name">
          Folder: {{ file.folder?.name || folder?.name }}
        </div>
      </div>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    file: {
      type: Object,
      required: true,
    },
    folder: {
      type: Object,
      required: false
    }
  });
  
  defineEmits(["open", "action"]);
  </script>
  
  <style scoped>
 
  
  .content-container {
    gap: 12px; /* equal gap between elements */
  }
  
  .file-name {
    
    font-weight: 400;
    font-size: 13px;
    color: #1e1e1e;
  }
  
  .folder-name {
    
    font-weight: 400;
    font-size: 13px;
    color: #737373;
  }
  
  .action-icon {
    width: 36px;
    height: 36px;
    cursor: pointer;
  }
  </style>
  