<template>
  <div class="pa-1 d-flex align-center" style="height: 100%;">
    <v-menu
      v-model="selected.treatmentMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p v-bind="props" class="mb-0 ml-2" style="width: 100%; cursor: pointer;">
          {{ getTreatmentDisplay() }}
        </p>
      </template>

      <v-card width="250" class="pa-4" style="border-radius: 12px;">
        <v-list class="pa-0">
          <!-- List existing treatment sources -->
          <v-list-item
            v-for="(t, i) in treatmentSources"
            :key="i"
            style="margin-bottom: 6px; min-height: 30px; cursor: pointer"
            class="rounded-sm"
            @click="handleTreatmentSelect(t)"
          >
            <v-list-item-title>{{ t.name }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <template v-if="!treatmentSources || treatmentSources.length === 0">
          <v-alert type="info" variant="tonal" density="compact">
            No treatments available
          </v-alert>
        </template>

        <v-divider class="my-2"></v-divider>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
const props = defineProps({
  selected: { type: Object, required: true },
  column: { type: Object },
  treatmentSources: { type: Array, default: () => [] }
})
const emit = defineEmits(["update"])

const getTreatmentDisplay = () => {
  const treatment = props.selected?.treatment;
  
  // If treatment is null or undefined
  if (!treatment) return 'N/A';
  
  // If treatment is an object
  if (typeof treatment === 'object') {
    // Check if it has a valid name
    if (treatment.name && treatment.name.trim() !== '') {
      return treatment.name;
    }
    // If it's an empty object or has empty name
    return 'N/A';
  }
  
  // If treatment is a string
  if (typeof treatment === 'string') {
    return treatment.trim() !== '' ? treatment : 'N/A';
  }
  
  return 'N/A';
};

const handleTreatmentSelect = (t) => {
  props.selected.treatmentId = t.id;
  props.selected.treatment = t;
  props.selected.treatmentMenu = false;
  emit('update');
}
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  border-radius: 8px;
}
</style>
