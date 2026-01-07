<template>
  <div class="task-div" :id="`stat-card-${uid}`">
    <div class="d-flex justify-space-between w-100 border-b pb-3">
      <div class="d-flex align-center title-row">
        <lord-icon
          :src="icon"
          trigger="hover"
          :target="`#stat-card-${uid}`"
          colors="primary:#1e2b80"
          style="width: 24px; height: 24px"
        >
        </lord-icon>

        <p class="ml-2 ellipsis-text">{{ label }}</p>

      </div>

      <v-tooltip :text="tooltip">
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
defineProps({
  cols: { type: Number, default: 3 },
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  bonus: { type: String, default: "+10" },
  tooltip: { type: String, default: "Bonus points awarded" },
  hideChip: { type: Boolean, default: false },
  uid: { type: [String, Number], required: true },
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
.ellipsis-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 170px;
}
</style>
