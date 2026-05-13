<template>
  <div>
    <!-- Empty canvas -->
    <div
      v-if="!modelValue.length"
      class="canvas-empty d-flex flex-column align-center justify-center rounded-xl"
    >
      <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-form-select</v-icon>
      <p class="text-body-2 text-medium-emphasis">Click a field on the left to add it here</p>
    </div>

    <!-- Draggable field list -->
    <draggable
      v-else
      v-model="localFields"
      item-key="key"
      handle=".drag-handle"
      animation="200"
      ghost-class="field-ghost"
    >
      <template #item="{ element: field }">
        <v-card
          class="canvas-field mb-3 rounded-lg"
          :class="{ 'canvas-field--selected': selectedKey === field.key }"
          elevation="0"
          border
          @click="$emit('select', field.key)"
        >
          <div class="d-flex align-center px-3 py-2">
            <!-- Drag handle -->
            <v-icon class="drag-handle mr-2" size="18" color="grey">mdi-drag-vertical</v-icon>

            <!-- Field type icon -->
            <v-icon size="16" color="primary" class="mr-2">{{ fieldIcon(field.type) }}</v-icon>

            <div class="flex-grow-1">
              <span class="text-body-2 font-weight-medium">{{ field.label }}</span>
              <span v-if="field.required" style="color: rgb(var(--v-theme-error)); font-size: 12px;"> *</span>
              <span class="ml-2 text-caption text-medium-emphasis">{{ fieldTypeLabel(field.type) }}</span>
            </div>

            <!-- Remove -->
            <v-btn icon size="x-small" variant="text" @click.stop="$emit('remove', field.key)">
              <v-icon size="16" color="grey">mdi-close</v-icon>
            </v-btn>
          </div>

          <!-- Field preview -->
          <div class="px-3 pb-3">
            <div class="field-preview">{{ field.placeholder || '...' }}</div>
          </div>
        </v-card>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  selectedKey: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'select', 'remove'])

const localFields = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const fieldIcon = (type) => {
  const icons = { text: 'mdi-format-text', email: 'mdi-email-outline', tel: 'mdi-phone-outline', select: 'mdi-chevron-down-box-outline', textarea: 'mdi-text-box-outline' }
  return icons[type] || 'mdi-form-textbox'
}

const fieldTypeLabel = (type) => {
  const labels = { text: 'Text', email: 'Email', tel: 'Phone', select: 'Dropdown', textarea: 'Textarea' }
  return labels[type] || type
}
</script>

<style scoped>
.canvas-empty {
  border: 2px dashed #d1d5db;
  min-height: 220px;
  background: white;
}
.canvas-field {
  background: white;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.canvas-field--selected {
  border-color: #0061FB !important;
  box-shadow: 0 0 0 2px rgba(0,97,251,0.12) !important;
}
.canvas-field:hover {
  border-color: #93c5fd;
}
.drag-handle {
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
}
.field-ghost {
  opacity: 0.4;
}
.field-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: #9ca3af;
  min-height: 34px;
}
</style>
