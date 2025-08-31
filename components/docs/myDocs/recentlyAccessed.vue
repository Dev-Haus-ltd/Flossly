<template>
  <v-card
    class="pa-3 d-flex align-center rounded-lg"
    style="border: 1px solid #dbdbdb; cursor: pointer"
    @click="$emit('open', file)"
    flat
  >
    <!-- File Image -->
    <img
      src="@/assets/images/flosslydocs/file.svg"
      :width="34"
      :height="45.8"
      class="mr-3"
    />

    <!-- File Details --> 
    <div>
      <div
        style="
          font-family: Poppins;
          font-weight: 400;
          font-size: 13px;
          font-style: Regular;
        "
      >
        {{ file.name }}
      </div>
      <div
      v-if="file.folder?.name || folder?.name"
        style="
          color: #737373;
          font-family: Poppins;
          font-weight: 400;
          font-size: 13px;
          font-style: Regular;
        "
      >
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

defineEmits(["open"]);
</script>
