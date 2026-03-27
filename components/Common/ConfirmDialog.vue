<template>
  <v-dialog v-model="model" max-width="420" :persistent="loading">
    <v-card rounded="xl" class="pa-5" elevation="0">
      <div class="d-flex align-start mb-3">
        <v-avatar
          :color="iconBg"
          size="40"
          rounded="lg"
          class="mr-3 flex-shrink-0"
        >
          <v-icon :color="confirmColor" size="20">{{ icon }}</v-icon>
        </v-avatar>
        <div>
          <h4 class="mb-1">{{ title || 'Please confirm' }}</h4>
          <p class="mb-0 text-medium-emphasis" style="font-size:14px; line-height:1.5;">{{ message || 'Are you sure?' }}</p>
        </div>
      </div>

      <div class="d-flex justify-end mt-4" style="gap: 10px;">
        <v-btn
          variant="outlined"
          rounded="lg"
          :disabled="loading"
          style="color:#6b7280; border-color:#e5e7eb;"
          @click="$emit('cancel')"
        >
          {{ cancelText || 'Cancel' }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          rounded="lg"
          :loading="loading"
          :disabled="loading"
          @click="$emit('confirm')"
        >
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
  cancelText: String,
  loading: Boolean,
  confirmColor: {
    type: String,
    default: 'primary',
  },
  icon: {
    type: String,
    default: 'mdi-alert-outline',
  },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
const iconBg = computed(() => {
  if (props.confirmColor === 'error') return 'red-lighten-5'
  if (props.confirmColor === 'warning') return 'orange-lighten-5'
  return 'blue-lighten-5'
})
</script>

<style scoped>
h4 { font-weight: 600; font-size: 15px; color: #111827; }
</style>
