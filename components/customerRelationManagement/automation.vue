<template>
    <v-row>
      <!-- Dropdown (5 cols) -->
      <v-col cols="12" md="5">
        <label class="mb-1 fld-lbl">Select type of automation</label>
        <v-select
          v-model="localType"
          :items="automationTypes"
          item-title="label"
          item-value="value"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          bg-color="white"
          flat
          @update:modelValue="emit('update:type', $event)"
        />
      </v-col>
  
      <!-- Placeholder (7 cols) -->
      <v-col cols="12" md="7">
        <!-- Reserved for future dynamic content -->
      </v-col>
    </v-row>
  </template>
  
  <script setup>
  const { selectedType } = defineProps({
    selectedType: String,
  });
  
  const emit = defineEmits(["update:type"]);
  
  const localType = ref(selectedType);
  
  // Dummy dropdown values
  const automationTypes = [
    { label: "Welcome Email", value: "welcome_email" },
    { label: "Birthday Greeting", value: "birthday" },
    { label: "Follow-up Reminder", value: "followup" },
    { label: "Inactive Lead Nurture", value: "inactive_lead" },
  ];
  </script>
  
  <style scoped>
  .fld-lbl {
    font-family: "Poppins";
    font-weight: 400;
    font-size: 14px;
    color: #737373;
  }
  .input-bordered :deep(.v-field) {
    border: 1px solid #dfdfdf !important;
    border-radius: 8px !important;
    background-color: white !important;
    min-height: 40px;
    font-size: 14px;
    font-family: "Poppins", sans-serif;
  }
  .placeholder-area {
    height: 100%;
    border: 1px dashed #dfdfdf;
    border-radius: 8px;
    background-color: #fafafa;
  }
  </style>
  