<template>
  <v-card
    class="pa-3 d-flex align-center recent-card"
    style="border: 1px solid #dbdbdb; cursor: pointer"
    @click="$emit('open', file)"
    flat
  >
   
   
    <img
      :src="isExcel 
        ? 'https://cdn-icons-png.flaticon.com/512/732/732220.png' 
        : Image"
      :width="60"
      :height="60"
      class="mr-3"
      alt="file icon"
    />


    <!-- File Details --> 
    <div>
      <div class="file-name">
        {{ file.name }}
      </div>
      <div
      v-if="file.folder?.name || folder?.name"
        class="folder-file-count"
      >
        Folder: {{ file.folder?.name || folder?.name }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import Image from '@/assets/images/flosslydocs/file.svg'
defineProps({
  file: {
    type: Object,
    required: true,
  },
  folder: {
    type: Object,
    required: false
  },
   isExcel: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["open"]);
</script>

<style scoped>
.recent-card {
  border-radius: 12px !important;
}
.file-name {
  font-weight: 400;
  font-size: 13px;
  color: #1E1E1E;
  font-style: normal;
  font-family: Poppins, sans-serif;
  line-height: 130%;
}
.folder-file-count {
  font-weight: 400;
  font-size: 13px;
  color: #737373;
  font-style: normal;
  font-family: Poppins, sans-serif;
  line-height: 130%;
}
</style>
