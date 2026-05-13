<template>
  <v-form ref="form" v-model="valid">
    <label class="lbl required">Clinic Name</label>
    <v-text-field
      v-model="clinic.name"
      :rules="[required]"
      variant="solo"
      single-line
      density="comfortable"
      class="input-bordered mt-2"
      flat
    />
    <label class="lbl">Logo Upload </label>
    <imgUpload v-model="clinic.logo" class="my-2"/>
    <label class="lbl required">Contact</label>
    <CommonPhoneNumberField
      v-model="clinic.contact"
      class="mt-2"
      :error-message="contactError"
      @update:phone-object="onPhoneObjectUpdate"
    />
    <label class="lbl required">Location Address</label>
    <v-text-field
      variant="solo"
      v-model="clinic.address"
      :rules="[required]"
      single-line
      density="comfortable"
      class="mt-2"
      flat
    />
    <!-- <label class="mb-2 lbl"> Clinic Type</label>
    <v-select
      variant="solo"
      :items="['Dental', 'General Practice', 'Dermatology', 'Physiotherapy']"
      v-model="clinic.type"
      :rules="[required]"
      single-line
      density="comfortable"
      class="input-bordered mt-2"
      flat
    /> -->
  </v-form>
</template>

<script setup>
import { ref, defineExpose } from "vue";
import imgUpload from "./imgUpload.vue";
const clinic = defineModel();
const valid = ref(false);
const form = ref(null);
const phoneObject = ref(null)
const contactError = ref("")

const required = (v) => !!v || "Required.";

const normalizeText = (value) => String(value || "").trim()

const validatePhone = () => {
  const val = normalizeText(clinic.value?.contact)
  if (!val) {
    contactError.value = "Contact is required"
    return false
  }
  if (!phoneObject.value?.valid) {
    contactError.value = "Enter a valid contact number"
    return false
  }
  contactError.value = ""
  return true
}

const onPhoneObjectUpdate = (value) => {
  phoneObject.value = value
  if (contactError.value) validatePhone()
}

watch(
  () => clinic.value?.contact,
  (value) => {
    if (!normalizeText(value)) phoneObject.value = null
    if (contactError.value) validatePhone()
  }
)

defineExpose({
  validate: async () => {
    const result = await form.value.validate();
    const phoneValid = validatePhone()
    return result.valid && phoneValid;
  },
  valid,
});
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 12px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
.lbl {
  font-family: "Inter";
  font-weight: 400;
  font-style: "Regular";
  font-size: 16px;
  color: #1e1e1e;
  margin-bottom: 8px;
}

.lbl.required::after {
  content: " *";
  color: #e53935; /* red */
  font-weight: 600;
}
</style>
