<template>
  <div class="pa-4">
    <p class="text-caption font-weight-medium text-uppercase text-medium-emphasis mb-4" style="letter-spacing:0.05em;">
      Live Preview
    </p>

    <v-card rounded="xl" elevation="0" border class="overflow-hidden">
      <!-- Practice header -->
      <div class="pa-3 d-flex align-center" style="background: #0061FB;">
        <v-icon color="white" size="18" class="mr-2">mdi-tooth-outline</v-icon>
        <span class="text-white text-body-2 font-weight-medium">{{ formName || 'Your Practice Name' }}</span>
      </div>

      <div class="pa-4">
        <div v-if="!fields.length" class="text-center py-6 text-medium-emphasis">
          <v-icon size="28" color="grey-lighten-2" class="mb-2">mdi-form-select</v-icon>
          <p class="text-caption">Add fields to see a preview</p>
        </div>

        <template v-else>
          <div v-for="field in fields" :key="field.key" class="mb-3">
            <label class="preview-label d-block mb-1">
              {{ field.label }}
              <span v-if="field.required" style="color: #ef4444;">*</span>
            </label>

            <!-- Text / email -->
            <div v-if="field.type === 'text' || field.type === 'email'" class="preview-input">
              {{ field.placeholder || ' ' }}
            </div>

            <!-- Tel -->
            <div v-else-if="field.type === 'tel'" class="preview-input d-flex align-center">
              <span class="mr-2" style="color:#6b7280; font-size:12px;">🇬🇧 +44</span>
              <span>{{ field.placeholder || 'Phone number' }}</span>
            </div>

            <!-- Select -->
            <div v-else-if="field.type === 'select'" class="preview-input d-flex align-center justify-space-between">
              <span>{{ field.placeholder || 'Select...' }}</span>
              <v-icon size="16" color="grey">mdi-chevron-down</v-icon>
            </div>

            <!-- Textarea -->
            <div v-else-if="field.type === 'textarea'" class="preview-textarea">
              {{ field.placeholder || ' ' }}
            </div>
          </div>

          <div class="mt-4 py-2 rounded-lg text-center text-body-2 font-weight-medium text-white" style="background:#0061FB;">
            Send Enquiry
          </div>
          <p class="text-caption text-medium-emphasis mt-2 text-center">
            By submitting you consent to being contacted about your enquiry.
          </p>
        </template>
      </div>
    </v-card>
  </div>
</template>

<script setup>
defineProps({
  formName: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
})
</script>

<style scoped>
.preview-label { font-size: 12px; font-weight: 500; color: #374151; }
.preview-input {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
  color: #9ca3af;
  min-height: 34px;
}
.preview-textarea {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
  color: #9ca3af;
  min-height: 70px;
}
</style>
