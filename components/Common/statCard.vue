<template>
  <div class="task-div" :id="`stat-card-${uid}`">
    <div class="d-flex justify-space-between w-100 border-b pb-3">
      <div class="d-flex align-center title-row">
        <img
          v-if="resolvedIconType === 'image'"
          :src="icon"
          alt=""
          class="stat-icon"
        />
        <lord-icon
          v-else
          :src="icon"
          trigger="hover"
          :target="`#stat-card-${uid}`"
          colors="primary:#1e2b80"
          style="width: 24px; height: 24px; flex-shrink: 0"
        >
        </lord-icon>

        <CommonTruncatedText
          :text="label"
          :max-width="selectItems && selectItems.length ? 100 : 170"
          text-class="stat-label-text"
        />

      </div>

      <template v-if="selectItems && selectItems.length">
        <v-select
          v-model="selectModel"
          :items="selectItems"
          density="compact"
          hide-details
          class="compact-select ml-2"
          variant="outlined"
          style="max-width: 130px"
        />
      </template>

      <v-tooltip v-else-if="infoText" :text="infoText" location="bottom" max-width="300">
        <template #activator="{ props }">
          <v-icon v-bind="props" size="18" color="#6b7280" style="flex-shrink: 0; cursor: help;">mdi-information-outline</v-icon>
        </template>
      </v-tooltip>

      <v-tooltip v-else :text="tooltip">
        <template #activator="{ props }">
          <v-chip
            v-if="!hideChip"
            v-bind="props"
            class="bonus-chip"
            variant="flat"
            density="comfortable"
            size="small"
            prepend-icon="mdi-star"
            label
          >
            {{ bonus }}
          </v-chip>
        </template>
      </v-tooltip>
    </div>
    <h2 class="ml-2 mt-1">{{ value }}</h2>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cols: { type: Number, default: 3 },
  icon: { type: String, required: true },
  iconType: { type: String, default: 'auto' },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  bonus: { type: String, default: "+10" },
  tooltip: { type: String, default: "Bonus points awarded" },
  hideChip: { type: Boolean, default: false },
  uid: { type: [String, Number], required: true },
  select: { type: [String, Number], default: null },
  selectItems: { type: Array, default: () => [] },
  infoText: { type: String, default: '' },
});

const emit = defineEmits(['update:select']);

const selectModel = computed({
  get: () => props.select,
  set: (value) => emit('update:select', value),
});

const resolvedIconType = computed(() => {
  if (props.iconType !== 'auto') return props.iconType;
  return props.icon?.toLowerCase?.().endsWith('.svg') ? 'image' : 'lord-icon';
});
</script>
<style scoped lang="scss">
.task-div {
  border: 1px solid #dbdbdb;
  border-radius: 20px;
  padding: 15px;
  background: #ffffff;
  height: 120px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;

  img {
    width: 50px;
    height: 50px;
  }

  .stat-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    object-fit: contain;
  }

  :deep(.stat-label-text) {
    font-size: 14px;
    color: #1e1e1e;
    font-weight: 400;
    margin-left: 8px;
  }

  p {
    font-size: 14px;
    color: #1e1e1e;
    font-weight: 400;
  }

  h2 {
    font-size: 28px;
    color: #101010;
    font-weight: 700;
  }
}
.task-div:hover {
  box-shadow: 0px 0px 0px 3px #ff85da29;
}
.title-row {
  min-width: 0;
}
.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}

/* Deep selector to target the icon inside the chip */
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
.compact-select {
  :deep(.v-field) {
    height: 32px !important;
    min-height: 32px !important;
    border-radius: 8px;
    background-color: #e8f1ff !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 2px !important;
  }
  :deep(.v-field__outline) {
    display: none !important;
  }
  :deep(.v-field__input) {
    display: flex;
    align-items: center;
    padding: 0 0 0 8px !important;
    min-height: 32px !important;
  }
  :deep(.v-select__selection-text) {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
  }
  :deep(.v-field__append-inner) {
    margin-left: 0 !important;
    padding-left: 0 !important;
    padding-right: 2px !important;
  }
  :deep(.v-icon) {
    font-size: 16px !important;
    opacity: 0.7;
  }
}
</style>
