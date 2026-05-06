<template>
  <div class="pa-4">
    <div v-if="!field" class="text-center py-12 text-medium-emphasis">
      <v-icon size="36" color="grey-lighten-2" class="mb-2">mdi-cursor-pointer</v-icon>
      <p class="text-body-2">Select a field on the canvas to configure it</p>
    </div>

    <template v-else>
      <p class="text-caption font-weight-medium text-uppercase text-medium-emphasis mb-4" style="letter-spacing:0.05em;">
        Field Settings
      </p>

      <!-- Label -->
      <label class="fld-lbl d-block mb-1">Label</label>
      <v-text-field
        :model-value="field.label"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
        @update:model-value="emit('update', { ...field, label: $event })"
      />

      <!-- Placeholder -->
      <label class="fld-lbl d-block mb-1">Placeholder text</label>
      <v-text-field
        :model-value="field.placeholder"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
        @update:model-value="emit('update', { ...field, placeholder: $event })"
      />

      <!-- Required toggle -->
      <div class="d-flex align-center justify-space-between mb-4 py-2 px-3 rounded-lg" style="background:#f9fafb; border:1px solid #e5e7eb;">
        <div>
          <p class="text-body-2 font-weight-medium mb-0">Required</p>
          <p class="text-caption text-medium-emphasis mb-0">Visitors must fill this field</p>
        </div>
        <v-switch
          :model-value="field.required"
          :disabled="coreRequired"
          color="primary"
          hide-details
          density="compact"
          @update:model-value="emit('update', { ...field, required: $event })"
        />
      </div>
      <p v-if="coreRequired" class="text-caption text-medium-emphasis mb-4">
        Name, Email and Phone are always required.
      </p>

      <!-- Field type info -->
      <div class="pa-3 rounded-lg" style="background:#eff6ff; border:1px solid #bfdbfe;">
        <p class="text-caption font-weight-medium mb-0" style="color:#1d4ed8;">
          <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
          Field type: {{ fieldTypeLabel }}
        </p>
        <p class="text-caption mb-0" style="color:#3b82f6;">
          This maps to the <code>{{ field.key }}</code> field in your CRM lead record.
        </p>
      </div>
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

const fieldTypeLabel = computed(() => {
  const labels = { text: 'Text input', email: 'Email input', tel: 'Phone number', select: 'Dropdown', textarea: 'Multi-line text' }
  return labels[props.field?.type] || props.field?.type || ''
})
</script>

<style scoped>
.fld-lbl { font-size: 13px; font-weight: 500; color: #374151; }
</style>
