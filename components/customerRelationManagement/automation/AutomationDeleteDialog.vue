<template>
  <v-dialog v-model="model" max-width="480px">
    <v-card class="rounded-lg elevation-8 pa-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <h5 class="modal-title">Delete Automation</h5>
        <v-btn icon variant="text" @click="model = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <p class="text-body-2 mb-4">
        Are you sure you want to delete
        <strong>{{ targetName }}</strong>?
        This cannot be undone.
      </p>
      <div class="d-flex justify-end gap-2">
        <v-btn variant="text" @click="model = false">Cancel</v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="loading"
          @click="$emit('confirm')"
        >
          Delete
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  targetName: {
    type: String,
    default: 'this automation',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.modal-title {
  font-weight: 600;
  font-size: 18px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}
</style>
