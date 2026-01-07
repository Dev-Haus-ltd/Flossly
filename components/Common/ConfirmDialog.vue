<template>
  <v-dialog v-model="model" max-width="420">
    <v-card class="pa-4">
      <div class="d-flex align-center mb-2">
        <v-icon color="warning" class="mr-2">mdi-alert-outline</v-icon>
        <h4 class="mb-0">{{ title || 'Please confirm' }}</h4>
      </div>
      <p class="mb-4">{{ message || 'Are you sure?' }}</p>
      <div class="d-flex justify-end" style="gap: 10px;">
        <v-btn variant="flat" :disabled="loading" @click="$emit('cancel')">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="$emit('confirm')">
          {{ confirmText || 'Confirm' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
  
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: String,
  message: String,
  confirmText: String,
  loading: Boolean,
})
const emit = defineEmits(['update:modelValue','confirm','cancel'])
const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
</script>

<style scoped>
h4 { font-weight: 600; font-size: 16px; }
p { font-size: 14px; }
</style>

