<template>
  <div class="pa-5">
    <div v-if="!field" class="text-center py-12 text-medium-emphasis">
      <v-icon size="36" color="grey-lighten-2" class="mb-2">mdi-cursor-pointer</v-icon>
      <p class="text-body-2">Select a field on the canvas to configure it</p>
    </div>

    <template v-else>
      <p class="section-title mb-6">Field Setting</p>

      <!-- Label -->
      <p class="field-label mb-2">Label</p>
      <v-text-field
        :model-value="field.label"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-6 label-input"
        @update:model-value="emit('update', { ...field, label: $event })"
      />

      <!-- Placeholder -->
      <p class="field-label mb-2">Placeholder Text</p>
      <v-text-field
        :model-value="field.placeholder"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-6 placeholder-input"
        placeholder="e.g Johnsmith"
        @update:model-value="emit('update', { ...field, placeholder: $event })"
      />

      <!-- Required toggle -->
      <div class="required-card d-flex align-center justify-space-between mb-3">
        <div>
          <p class="required-title mb-1">Required</p>
          <p class="required-subtitle mb-0">Visitors must fill this field</p>
        </div>
        <v-switch
          :model-value="field.required"
          :disabled="coreRequired"
          color="primary"
          hide-details
          density="compact"
          inset
          @update:model-value="emit('update', { ...field, required: $event })"
        />
      </div>

      <p v-if="coreRequired" class="core-note">
        Name, Email and Phone are always required.
      </p>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  field: { type: Object, default: null },
})
const emit = defineEmits(['update'])

const CORE_REQUIRED_KEYS = ['name', 'email', 'telephone']
const coreRequired = computed(() => CORE_REQUIRED_KEYS.includes(props.field?.key))
</script>

<style scoped>
.section-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #111827;
}

.field-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #111827;
}

.label-input :deep(.v-field) {
  border-radius: 10px;
}

.placeholder-input :deep(.v-field) {
  border-radius: 10px;
}

.placeholder-input :deep(input::placeholder),
.placeholder-input :deep(.v-field__input) {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
}

.label-input :deep(.v-field__input) {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
}

.required-card {
  background: hsla(180, 23%, 95%, 1);
  border-radius: 16px;
  padding: 16px 20px;
}

.required-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 130%;
  color: #111827;
}

.required-subtitle {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 130%;
  color: #6b7280;
}

.core-note {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 130%;
  color: #9ca3af;
}
</style>
