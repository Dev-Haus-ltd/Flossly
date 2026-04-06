<template>
  <div class="d-flex justify-center align-start py-8 px-3" style="min-height: 100vh;">
    <!-- Not found state -->
    <v-card v-if="notFound" max-width="480" width="100%" class="pa-8 text-center" rounded="xl">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-form-select</v-icon>
      <h2 class="text-h6 mb-2">Form not available</h2>
      <p class="text-body-2 text-medium-emphasis">
        This form link is invalid or has been deactivated. Please contact the dental practice directly.
      </p>
    </v-card>

    <!-- Loading state -->
    <div v-else-if="loading" class="d-flex justify-center align-center" style="min-height: 60vh;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Thank you state -->
    <v-card v-else-if="submitted" max-width="480" width="100%" rounded="xl" class="overflow-hidden">
      <div class="pa-4" :style="{ background: meta.color || '#0061FB' }">
        <div class="d-flex align-center">
          <v-img v-if="meta.logo" :src="meta.logo" max-height="40" max-width="120" contain />
          <span v-else class="text-white font-weight-bold text-subtitle-1">{{ meta.practiceName }}</span>
        </div>
      </div>
      <div class="pa-8 text-center">
        <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
        <h2 class="text-h6 mb-2">Thank you!</h2>
        <p class="text-body-2 text-medium-emphasis">
          Your enquiry has been received. A member of the {{ meta.practiceName }} team will be in touch shortly.
        </p>
      </div>
    </v-card>

    <!-- Form -->
    <v-card v-else max-width="560" width="100%" rounded="xl" class="overflow-hidden">
      <!-- Practice header -->
      <div class="pa-4" :style="{ background: meta.color || '#0061FB' }">
        <div class="d-flex align-center">
          <v-img v-if="meta.logo" :src="meta.logo" max-height="40" max-width="120" contain class="mr-2" />
          <span class="text-white font-weight-bold text-subtitle-1">{{ meta.practiceName }}</span>
        </div>
        <p class="text-white text-body-2 mt-1 mb-0" style="opacity: 0.85;">{{ meta.formName }}</p>
      </div>

      <div class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <div v-for="field in meta.fields" :key="field.key" class="mb-4">
            <label class="fld-lbl d-block mb-1">
              {{ field.label }}<span v-if="field.required" style="color: rgb(var(--v-theme-error));"> *</span>
            </label>

            <!-- Text / Email -->
            <v-text-field
              v-if="field.type === 'text' || field.type === 'email'"
              v-model="formData[field.key]"
              :type="field.type"
              :placeholder="field.placeholder"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :rules="field.required ? [v => !!String(v || '').trim() || `${field.label} is required`] : []"
              bg-color="white"
            />

            <!-- Phone -->
            <div
              v-else-if="field.type === 'tel'"
              class="crm-phone-input"
              :class="{ 'crm-phone-input--error': phoneError }"
            >
              <v-phone-input
                v-model="formData[field.key]"
                variant="solo"
                density="compact"
                flat
                default-country="gb"
                :prefer-countries="['gb']"
                :country-props="phoneCountryProps"
                :phone-props="phoneProps"
                @update:phone-object="onPhoneObjectUpdate"
              />
            </div>
            <div v-if="field.type === 'tel' && phoneError" class="phone-error-msg mt-1">{{ phoneError }}</div>

            <!-- Select -->
            <v-select
              v-else-if="field.type === 'select'"
              v-model="formData[field.key]"
              :items="resolveOptions(field)"
              :item-title="field.key === 'treatment' ? 'name' : undefined"
              :item-value="field.key === 'treatment' ? 'name' : undefined"
              :placeholder="field.placeholder"
              variant="outlined"
              density="compact"
              hide-details="auto"
              clearable
              bg-color="white"
              :rules="field.required ? [v => !!v || `${field.label} is required`] : []"
            />

            <!-- Textarea -->
            <v-textarea
              v-else-if="field.type === 'textarea'"
              v-model="formData[field.key]"
              :placeholder="field.placeholder"
              variant="outlined"
              density="compact"
              hide-details="auto"
              auto-grow
              rows="3"
              bg-color="white"
              :rules="field.required ? [v => !!String(v || '').trim() || `${field.label} is required`] : []"
            />
          </div>

          <!-- Error message -->
          <v-alert v-if="submitError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ submitError }}
          </v-alert>

          <v-btn
            type="submit"
            variant="flat"
            block
            size="large"
            rounded="lg"
            :loading="submitting"
            :disabled="submitting"
            :style="{ background: meta.color || '#0061FB', color: 'white' }"
          >
            Send Enquiry
          </v-btn>

          <p class="text-caption text-medium-emphasis mt-3 text-center">
            By submitting this form you consent to {{ meta.practiceName || 'this practice' }} contacting you about your enquiry in accordance with their privacy policy.
          </p>
        </v-form>
      </div>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'form' })

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const notFound = ref(false)
const submitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const formRef = ref(null)
const phoneObject = ref(null)
const phoneError = ref('')
const hasAttemptedSubmit = ref(false)

const meta = ref({
  formId: null,
  formName: '',
  practiceName: '',
  logo: null,
  fields: [],
  color: '#0061FB',
})

const formData = ref({})

const phoneCountryProps = { label: '', hideDetails: true, flat: true, variant: 'solo', bgColor: 'white' }
const phoneProps = { label: '', hideDetails: true, flat: true, variant: 'solo', bgColor: 'white' }

const onPhoneObjectUpdate = (obj) => {
  phoneObject.value = obj
  if (hasAttemptedSubmit.value) validatePhone()
}

const validatePhone = () => {
  const telField = meta.value.fields.find((f) => f.type === 'tel')
  if (!telField) return true
  const val = String(formData.value[telField.key] || '').trim()
  if (telField.required && !val) {
    phoneError.value = `${telField.label} is required`
    return false
  }
  if (val && !phoneObject.value?.valid) {
    phoneError.value = 'Enter a valid telephone number'
    return false
  }
  phoneError.value = ''
  return true
}

const resolveOptions = (field) => {
  if (!Array.isArray(field.options)) return []
  return field.options
}

const initFormData = (fields) => {
  const data = {}
  fields.forEach((f) => { data[f.key] = '' })
  formData.value = data
}

onMounted(async () => {
  try {
    const res = await $fetch(`/api/form/meta?token=${encodeURIComponent(token)}`)
    if (res?.code === 0 && res.data) {
      meta.value = res.data
      initFormData(res.data.fields || [])
    } else {
      notFound.value = true
    }
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  hasAttemptedSubmit.value = true
  const phoneValid = validatePhone()
  const { valid } = await formRef.value.validate()
  if (!valid || !phoneValid) return

  submitting.value = true
  submitError.value = ''
  try {
    const res = await $fetch('/api/form/submit', {
      method: 'POST',
      body: { token, data: formData.value },
    })
    if (res?.code === 0) {
      submitted.value = true
    } else {
      submitError.value = 'Something went wrong. Please try again.'
    }
  } catch (e) {
    submitError.value = e?.data?.message || e?.message || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.fld-lbl {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.crm-phone-input :deep(.v-phone-input) {
  display: flex;
  width: 100%;
  border: 1px solid rgba(0,0,0,0.38);
  border-radius: 4px;
  overflow: hidden;
  background-color: white;
}
.crm-phone-input :deep(.v-phone-input__country__input .v-field),
.crm-phone-input :deep(.v-phone-input__phone__input .v-field) {
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  min-height: 40px;
  font-size: 14px;
}
.crm-phone-input :deep(.v-phone-input__country__input.v-input) {
  min-width: 88px;
  max-width: 88px;
  flex: 0 0 88px;
}
.crm-phone-input :deep(.v-phone-input__phone__input.v-input) {
  flex: 1 1 auto;
  min-width: 0;
}
.crm-phone-input :deep(.v-phone-input__country__input .v-field) {
  border-right: 1px solid rgba(0,0,0,0.12) !important;
}
.crm-phone-input--error {
  border-color: rgb(var(--v-theme-error)) !important;
}
.phone-error-msg {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  padding-left: 4px;
}
</style>
