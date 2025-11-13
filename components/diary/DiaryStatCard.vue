<template>
  <div class="stat-card" :id="`diary-stat-card-${uid}`">
    <div class="d-flex justify-space-between align-center w-100 header">
      <div class="d-flex align-center">
        <lord-icon
          v-if="icon"
          :src="icon"
          trigger="hover"
          :target="`#diary-stat-card-${uid}`"
          colors="primary:#1e2b80"
          style="width: 22px; height: 22px"
        />
        <v-icon v-else size="22" color="primary">mdi-chart-box</v-icon>
        <p class="ml-2 ellipsis-text">{{ label }}</p>
      </div>

      <template v-if="selectItems && selectItems.length">
        <v-select
          v-model="selectModel"
          :items="selectItems"
          density="compact"
          hide-details
          class="compact-select"
          variant="outlined"
          style="max-width: 140px"
        />
      </template>
    </div>

    <div class="content">
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
      <div class="value">{{ value }}</div>
      <div v-if="note" class="note">{{ note }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  uid: { type: [String, Number], required: true },
  icon: { type: String, default: '' },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  subtitle: { type: String, default: '' },
  note: { type: String, default: '' },
  select: { type: [String, Number], default: null },
  selectItems: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:select']);

const selectModel = computed({
  get: () => props.select,
  set: (value) => emit('update:select', value),
});
</script>

<style scoped lang="scss">
.stat-card {
  border: 1px solid #f2d9ec;
  border-radius: 14px;
  padding: 14px;
  background: #ffffff;
  min-height: 140px;
  display: flex;
  flex-direction: column;

}
.header {
  border-bottom: 1px solid #eee6f3;
  padding-bottom: 8px;
}
.content {
  padding: 8px 6px 0 6px;
}
.subtitle {
  font-size: 13px;
  color: #6b7280;
}
.value {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 700;
  color: #101010;
}
.note {
  margin-top: 2px;
  font-size: 13px;
  color: #4b5563;
}
.compact-select {
  :deep(.v-field) {
    height: 32px !important;
    min-height: 32px !important;
    border-radius: 8px;
    background-color: #e8f1ff !important; /* light blue like image */
    border: 1px solid #d3e2ff !important;
    padding: 0 6px !important;
  }

  :deep(.v-field__input) {
    display: flex;
    align-items: center;
    padding: 0 6px 0 8px !important;
    min-height: 32px !important;
  }

  :deep(.v-select__selection-text) {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  /* ↓ this part fixes the gap between text & icon */
  :deep(.v-field__append-inner) {
    margin-left: 2px !important;  /* reduce space between text and chevron */
    padding-right: 4px !important;
  }

  :deep(.v-icon) {
    font-size: 16px !important;
    opacity: 0.7;
  }
}



.ellipsis-text { white-space: nowrap; }
</style>

