<template>
  <div class="pa-4">
    <p class="text-caption font-weight-medium text-uppercase text-medium-emphasis mb-4" style="letter-spacing:0.05em;">
      Form Settings
    </p>

    <!-- Form name -->
    <label class="fld-lbl d-block mb-1">Form Name</label>
    <v-text-field
      :model-value="formName"
      variant="outlined"
      density="compact"
      hide-details
      class="mb-5"
      placeholder="Form name..."
      @update:model-value="emit('update-form-name', $event)"
    />

    <!-- Brand colour -->
    <label class="fld-lbl d-block mb-2">Brand Colour</label>

    <!-- Preset swatches -->
    <div class="d-flex flex-wrap mb-3" style="gap: 8px;">
      <div
        v-for="swatch in presetColors"
        :key="swatch"
        class="color-swatch"
        :style="{ background: swatch, outline: formColor === swatch ? '2px solid #111' : '2px solid transparent' }"
        @click="emit('update-form-color', swatch)"
      />
    </div>

    <!-- Custom colour input -->
    <div class="d-flex align-center" style="gap: 10px;">
      <div
        class="color-swatch"
        :style="{ background: formColor, outline: '2px solid #e5e7eb', cursor: 'default', flexShrink: 0 }"
      />
      <v-text-field
        :model-value="formColor"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="#0061FB"
        style="font-family: monospace; font-size: 13px;"
        @update:model-value="onHexInput"
      />
      <input
        type="color"
        :value="formColor"
        class="native-color-btn"
        title="Open colour picker"
        @input="emit('update-form-color', $event.target.value)"
      />
    </div>

    <div class="mt-4 pa-3 rounded-lg" style="background:#f9fafb; border:1px solid #e5e7eb;">
      <p class="text-caption text-medium-emphasis mb-0">
        <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
        Applied to the form header and submit button on the public page.
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formName: { type: String, default: '' },
  formColor: { type: String, default: '#0061FB' },
})
const emit = defineEmits(['update-form-name', 'update-form-color'])

const presetColors = [
  '#0061FB', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6',
  '#F97316', '#6366F1', '#374151', '#111827',
]

const onHexInput = (val) => {
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) emit('update-form-color', val)
}
</script>

<style scoped>
.fld-lbl { font-size: 13px; font-weight: 500; color: #374151; }

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.1s;
  outline-offset: 2px;
}
.color-swatch:hover { transform: scale(1.15); }

.native-color-btn {
  width: 32px;
  height: 32px;
  padding: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  background: none;
}
</style>
