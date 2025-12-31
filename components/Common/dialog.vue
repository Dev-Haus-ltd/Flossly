<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :max-width="size"
    persistent
  >
    <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
      <!-- Header -->
      <div
        class="pa-4 d-flex justify-space-between align-center"
        style="background-color: white"
      >
        <h3 class="text-h6 m-0">{{ title }}</h3>
        <div class="d-flex align-center">
          <v-tooltip text="You will get 10 points on completion of each task">
    <template #activator="{ props }">
      <v-chip
        v-bind="props"
        class="bonus-chip"
        variant="flat"
        size="small"
        prepend-icon="mdi-star"
        label
      >
        +10
      </v-chip>
    </template>
  </v-tooltip>
          <v-menu location="bottom right" >
  <template #activator="{ props }">
    <v-btn icon v-bind="props" size="32" variant="text" class="ml-2 mr-1">
      <v-icon size="18">mdi-dots-horizontal</v-icon>
    </v-btn>
  </template>

  <v-card style="min-width: 130px;">
    <v-list density="compact">
      <v-list-item @click="editItem" class="menu-item" rounded="lg">
        <template #prepend>
          <img src="@/assets/tasks/edit.svg" alt="Edit" width="18" height="18" class="mr-2" />
        </template>
        <v-list-item-title >Edit</v-list-item-title>
      </v-list-item>

      <v-list-item @click="anotherAction" class="menu-item" rounded="lg">
        <template #prepend>
          <v-icon size="18" class="mr-2">mdi-eye</v-icon>
        </template>
        <v-list-item-title>View</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</v-menu>



          <v-btn flat icon size="32" @click="$emit('update:modelValue', false)">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>

        </div>
      </div>

      <!-- Scrollable content -->
      <div
        class="flex-grow-1 px-4 py-2"
        style="overflow-y: auto; background-color: #f9f9f9"
      >
        <slot />
      </div>

      <!-- Footer -->
      <div
        class="d-flex justify-end px-4 py-3 gap-2"
        style="background-color: white; border-top: 1px solid #eee"
      >
        <v-btn
          color="white"
          class="text-primary mr-2"
          style="width: 120px"
          @click="$emit('cancel')"
        >
          Back
        </v-btn>

        <v-btn
          color="primary"
          class="text-white"
          style="width: 120px"
          @click="$emit('save')"
        >
          Save
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: "Dialog Title",
  },
  size: {
    type: String,
    default: "600px",
  },
});

defineEmits(["update:modelValue", "cancel", "save"]);
const editItem = () => {
  console.log("Edit clicked")
}

const anotherAction = () => {
  console.log("View clicked")
}
</script>
<style scoped>
.menu-item:hover {
  background-color: #f5f5f5 !important;
  cursor: pointer;
}
.bonus-chip {
  border: 1px solid #FEA200;
  background-color: #FFF0D5;
  color: #1E1E1E; /* Text color */
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}

/* Deep selector to target the icon inside the chip */
::v-deep(.bonus-chip .v-icon) {
  color: #FEA200;
}
</style>