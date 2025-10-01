<template>
    <v-tooltip :text="tooltip">
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          :class="['bonus-chip']"
          variant="flat"
          density="comfortable"
          size="small"
          :prepend-icon="icon"
          label
        >
          {{ text }}
        </v-chip>
      </template>
    </v-tooltip>
  </template>
  
  <script setup>
  defineProps({
    text: {
      type: Number,
      default: 10,
    },
    tooltip: {
      type: String,
      default: 'Bonus points awarded',
    },
    icon: {
      type: String,
      default: 'mdi-star',
    },
  })
  </script>
  
  <style scoped>
  .bonus-chip {
    border: 1px solid #fea200;
    background-color: #fff0d5;
    color: #1e1e1e;
    font-weight: 500;
    font-size: 13px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }
  
  /* Ensure the icon inside the chip is colored correctly */
  ::v-deep(.v-icon) {
    color: #fea200 !important;
  }
  </style>
  