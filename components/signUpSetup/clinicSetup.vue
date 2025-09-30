<template>
  <v-form ref="form" v-model="valid">
    <label class="lbl">Clinic Name </label>
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
    <label class="lbl">Contact </label>
    <v-text-field
      variant="solo"
      v-model="clinic.contact"
      :rules="[required]"
      single-line
      density="comfortable"
      class="input-bordered mt-2"
      flat
    />
    <label class="mb-2 lbl">Location Address</label>
    <v-text-field
      variant="solo"
      v-model="clinic.address"
      :rules="[required]"
      single-line
      density="comfortable"
      class="input-bordered mt-2"
      flat
    />
    <label class="mb-2 lbl"> Clinic Type</label>
    <v-select
      variant="solo"
      :items="['Dental', 'General Practice', 'Dermatology', 'Physiotherapy']"
      v-model="clinic.type"
      :rules="[required]"
      single-line
      density="comfortable"
      class="input-bordered mt-2"
      flat
    />
  </v-form>
</template>

<script setup>
import { ref, defineExpose } from "vue";
import imgUpload from "./imgUpload.vue";
const clinic = defineModel();
const valid = ref(false);
const form = ref(null);

const required = (v) => !!v || "Required.";

defineExpose({
  validate: () => form.value.validate(),
  valid,
});
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
.lbl {
  font-family: "Inter";
  font-weight: 400;
  font-style: "Regular";
  font-size: 16px;
  color: #1e1e1e;
  margin-bottom: 8px;
}
</style>