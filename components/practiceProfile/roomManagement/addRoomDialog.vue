<!-- Add Room Dialog Component -->
<template>
  <v-dialog v-model="isOpen" max-width="600px" class="rounded-lg">
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
        Add Room
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

      <!-- Room Form -->
      <v-card-text class="room-form">
        <!-- Name -->
        <div class="form-group">
          <label class="field-label">Name</label>
          <v-text-field
            v-model="room.name"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="field-label">Description</label>
          <v-text-field
            v-model="room.description"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Color -->
        <div class="form-group">
          <label class="field-label">Color</label>
          <v-text-field
            v-model="room.color"
            density="compact"
            variant="solo"
            hide-details
            class="w-100 input-bordered"
            flat
          >
            <template #prepend-inner>
              <CommonColorPickerInput :item="room" />
            </template>
          </v-text-field>
        </div>

        <!-- Details (Textarea) -->
        <div class="form-group">
          <label class="field-label">Details</label>
          <v-textarea
            v-model="room.details"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            auto-grow
            rows="3"
            flat
          />
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end pa-4">
        <v-btn text @click="close" variant="text">
          Cancel
        </v-btn>
        <v-btn color="primary" @click="save" variant="flat">
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
const room = ref({ name: "", description: "", details: "", color: "#FF0000" });

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);

watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
};

const save = () => {
  emit("update:modelValue", false);
  emit("onUpdate", { ...room.value });

  // Reset after save
  room.value = { name: "", description: "", details: "", color: "#FF0000" };
};
</script>

<style scoped>
.room-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #737373;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

/* Responsive padding for small screens */
@media (max-width: 600px) {
  .room-form {
    gap: 0.75rem;
  }

  .form-group {
    gap: 0.4rem;
  }
}
</style>