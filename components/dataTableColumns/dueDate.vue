<template>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-x
      min-width="auto"
    >
      <!-- Activator -->
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          :model-value="formattedDate"
          readonly
          density="compact"
          variant="solo"
          flat
          hide-details
        />
      </template>
  
      <!-- Date Picker Card -->
      <v-card class="rounded-lg">
        <!-- Top Buttons -->
        <v-card-title class="d-flex justify-space-between align-center">
          <v-btn text variant="outlined" @click="selectToday" class="today-btn mt-2">
            Today
          </v-btn>
        </v-card-title>
  
        <!-- Custom Header: Selected Date -->
        <v-card-text class="py-2 px-4">
          <v-text-field
            :model-value="formattedDate"
            readonly
            variant="solo"
            density="compact"
            hide-details
            class="input-bordered" 
            flat
          />
        </v-card-text>
  
        <!-- Date Picker -->
        <v-date-picker
          v-model="selected"
          @update:model-value="onDateSelected"
          show-adjacent-months
          color="primary"
          hide-header
        />
      </v-card>
    </v-menu>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import { useDate } from "vuetify";
  import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
  
  const props = defineProps({
    modelValue: String,
  });
  const emit = defineEmits(["update:modelValue"]);
  
  const selected = ref(props.modelValue);
  const menu = ref(false);
  const dateUtil = useDate();
  
  const formattedDate = computed(() => {
    if (!selected.value) return "";
    return formatDateDDMMYYYY(selected.value);
  });
  
  function onDateSelected(newDate) {
    emit("update:modelValue", newDate);
  }
  
  function selectToday() {
    const today = dateUtil.format(new Date(), "yyyy-MM-dd");
    selected.value = today;
    emit("update:modelValue", today);
  }
  </script>
  
  <style scoped>
  .today-btn {
    border: 1px solid #dfdfdf;
    background-color: #ffffff;
    color: #1e1e1e;
    
    font-weight: 400;
    font-size: 14px;
  }
  .input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
  </style>
  