<template>
  <div class="consent-forms-container">
    <div class="forms-grid">
      <div
        v-for="form in consentForms"
        :key="form.id"
        class="form-card"
        @click="selectForm(form)"
      >
        <div class="form-icon">
          <v-icon size="48" color="primary">mdi-file-document-outline</v-icon>
        </div>
        <div class="form-title">{{ form.title }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  formData: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'reset'])

// List of consent forms
const consentForms = ref([
  { id: 1, title: 'Aligner Consent' },
  { id: 2, title: 'Bonded Retainer Consent' },
  { id: 3, title: 'Bonding Info Consent' },
  { id: 4, title: 'Bonding Info Ts&Cs' },
  { id: 5, title: 'Composite Bonding Consent' },
  { id: 6, title: 'Cooling Off Period for Tabeo' },
  { id: 7, title: 'Crown Consent' },
  { id: 8, title: 'Crown Veneer & Bridge' },
  { id: 9, title: 'Denture Reline Consent' },
  { id: 10, title: 'Direct Access' },
  { id: 11, title: 'End of Alinger Treatment' },
  { id: 12, title: 'Full & Partial Denture Consent' },
  { id: 13, title: 'Immediate Denture' },
  { id: 14, title: 'Informed Consent for Onlay' },
  { id: 15, title: 'Instructions For Whitening' },
  { id: 16, title: 'Patient Agreement & Informed' },
  { id: 17, title: 'Perio Consent' },
  { id: 18, title: 'Photograph Consent Form' },
  { id: 19, title: 'Reason For Treatment' },
  { id: 20, title: 'Root Canal Treatment' },
  { id: 21, title: 'Temp Filling Consent' },
  { id: 22, title: 'Wisdom Tooth Extraction' },
])

const selectForm = (form) => {
  if (props.disabled) return
  // TODO: Handle form selection - open form details or navigate to form
  console.log('Selected form:', form)
}

const reset = () => {
  // Reset form selection if needed
}

defineExpose({ reset })
</script>

<style scoped>
.consent-forms-container {
  width: 100%;
  padding: 24px;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  max-width: 100%;
}

.form-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 160px;
}

.form-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.form-card:active {
  transform: translateY(0);
}

.form-icon {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-title {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.4;
  color: #1e1e1e;
  text-align: center;
  word-wrap: break-word;
  max-width: 100%;
}
</style>
