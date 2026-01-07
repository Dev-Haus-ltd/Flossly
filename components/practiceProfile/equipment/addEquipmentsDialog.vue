<!-- Add Equipment Dialog Component -->
<template>
  <v-dialog v-model="isOpen" max-width="700px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Add Equipment
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Equipment List -->
      <v-card-text>
        <div
          v-for="(equipment, index) in equipments"
          :key="index"
          class="equipment-row"
        >
          <!-- Name -->
          <div class="equipment-field">
            <label class="field-label">Name</label>
            <v-text-field
              v-model="equipment.name"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Serial Number -->
          <div class="equipment-field">
            <label class="field-label">Serial Number</label>
            <v-text-field
              v-model="equipment.serialNumber"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Details -->
          <div class="equipment-field">
            <label class="field-label">Details</label>
            <v-text-field
              v-model="equipment.details"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Remove Button -->
          <div class="equipment-remove">
            <v-icon size="18" @click="removeEquipment(index)">mdi-close</v-icon>
          </div>
        </div>

        <!-- Add Equipment Button -->
        <v-btn
          variant="outlined"
          size="small"
          color="primary"
          class="mt-4"
          @click="addEquipment"
        >
          <v-icon left>mdi-plus</v-icon>
          Add Equipment
        </v-btn>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end pa-5">
        <v-btn
          text
          @click="close"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="save"
          variant="flat"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);
const equipments = ref([{ name: "", serialNumber: "", details: "" }]);

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);

watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
};

const addEquipment = () => {
  equipments.value.push({ name: "", serialNumber: "", details: "" });
};

const removeEquipment = (index) => {
  equipments.value.splice(index, 1);
};

const save = () => {
  emit("update:modelValue", false);
  emit("onUpdate", equipments.value);

  // Reset after save
  equipments.value = [{ name: "", serialNumber: "", details: "" }];
};
</script>

<style scoped>
/* Equipment Row - Responsive Layout */
.equipment-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  padding: 10px;
  background-color: #f7f8f9;
  border-radius: 8px;
  margin-bottom: 10px;
  align-items: flex-end;
}

/* Desktop: 4-column layout (Name, Serial, Details, Remove) */
@media (min-width: 960px) {
  .equipment-row {
    grid-template-columns: 1fr 1fr 1fr auto;
  }
}

/* Tablet: 2x2 grid */
@media (max-width: 959px) and (min-width: 600px) {
  .equipment-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* Mobile: Single column */
@media (max-width: 599px) {
  .equipment-row {
    grid-template-columns: 1fr;
  }
}

.equipment-field {
  width: 100%;
}

.equipment-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
}

/* Field Label */
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #737373;
}

/* Input Styling */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>
