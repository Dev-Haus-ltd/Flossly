<template>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y
    >
      <template #activator="{ props: activatorProps }">
        <v-text-field
          v-bind="activatorProps"
        
          :model-value="modelValue ? parsedDate(modelValue) : ''"
          readonly
          variant="solo"
          flat
          density="compact"
          class="input-bordered"
          :rules="rules"
          append-inner-icon="mdi-calendar-clock"
        />
      </template>
  
      <v-card elevation="2">
        <!-- Date + Time side by side -->
        <v-row no-gutters>
          <v-col cols="6">
            <v-date-picker
              v-model="tempDate"
              color="primary"
              show-adjacent-months
            />
          </v-col>
          <v-col cols="6">
            <v-time-picker v-model="tempTime" format="24hr" />
          </v-col>
        </v-row>
  
        <!-- Sticky Actions -->
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="menu = false">Cancel</v-btn>
          <v-btn color="primary" text @click="saveDateTime">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </template>
<script setup>
import { ref, watch } from 'vue'
import { parsedDate } from '~/lib/dateFormatter'

const props = defineProps({
  modelValue: {
    type: String, // ISO string
    default: null,
  },
 
  rules: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const menu = ref(false)
const tempDate = ref(null)
const tempTime = ref(null)

// initialize from modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const date = new Date(val)
      tempDate.value = date
      tempTime.value = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
    }
  },
  { immediate: true }
)

const saveDateTime = () => {
  if (tempDate.value && tempTime.value) {
    const [hours, minutes] = tempTime.value.split(':').map(Number)
    const combined = new Date(tempDate.value)
    combined.setHours(hours, minutes)
    emit('update:modelValue', combined.toISOString())
  }
  menu.value = false
}
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
</style>
