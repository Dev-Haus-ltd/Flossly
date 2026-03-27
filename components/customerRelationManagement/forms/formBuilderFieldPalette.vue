<template>
  <div class="pa-4">
    <p class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-3" style="letter-spacing: 0.05em;">
      Available Fields
    </p>
    <p class="text-caption text-medium-emphasis mb-3">
      Click a field to add it to your form. Fields already on the canvas are greyed out.
    </p>

    <div
      v-for="field in availableFields"
      :key="field.key"
      class="palette-field d-flex align-center pa-3 mb-2 rounded-lg"
      :class="{ 'palette-field--used': canvasKeys.includes(field.key) }"
      @click="!canvasKeys.includes(field.key) && $emit('add-field', { ...field })"
    >
      <v-icon size="18" class="mr-2" :color="canvasKeys.includes(field.key) ? 'grey' : 'primary'">
        {{ fieldIcon(field.type) }}
      </v-icon>
      <div>
        <p class="mb-0 text-body-2 font-weight-medium" style="line-height:1.3;">{{ field.label }}</p>
        <p class="mb-0 text-caption text-medium-emphasis">{{ fieldTypeLabel(field.type) }}</p>
      </div>
      <v-spacer />
      <v-icon v-if="canvasKeys.includes(field.key)" size="14" color="grey">mdi-check</v-icon>
      <v-icon v-else size="16" color="primary">mdi-plus</v-icon>
    </div>
  </div>
</template>

<script setup>
defineProps({
  availableFields: { type: Array, default: () => [] },
  canvasKeys: { type: Array, default: () => [] },
})
defineEmits(['add-field'])

const fieldIcon = (type) => {
  const icons = { text: 'mdi-format-text', email: 'mdi-email-outline', tel: 'mdi-phone-outline', select: 'mdi-chevron-down-box-outline', textarea: 'mdi-text-box-outline' }
  return icons[type] || 'mdi-form-textbox'
}

const fieldTypeLabel = (type) => {
  const labels = { text: 'Text input', email: 'Email input', tel: 'Phone number', select: 'Dropdown', textarea: 'Multi-line text' }
  return labels[type] || type
}
</script>

<style scoped>
.palette-field {
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  background: white;
  user-select: none;
}
.palette-field:hover:not(.palette-field--used) {
  background: #eff6ff;
  border-color: #0061FB;
}
.palette-field--used {
  opacity: 0.45;
  cursor: default;
  background: #f9fafb;
}
</style>
