<template>
  <v-card class="holiday-card pa-4" flat>
    <div class="d-flex align-center gap-3 mb-3">
      <img :src="iconImg" class="holiday-icon" />
      <div>
        <p class="holiday-title mb-0">{{ title }}</p>
        <div class="d-flex align-baseline">
          <p class="holiday-days mb-0">{{ total }}</p>
          <p class="holiday-days-text ml-1 mb-0">days</p>
        </div>
      </div>
    </div>

    <div class="d-flex flex-column gap-2">
      <div class="stat-row">
        <span class="stat-label">Entitlement</span>
        <v-chip :color="color" variant="flat" size="small" class="stat-chip">{{ total }}</v-chip>
      </div>
      <div class="stat-row">
        <span class="stat-label">Taken</span>
        <v-chip :color="color" variant="flat" size="small" class="stat-chip">{{ taken }}</v-chip>
      </div>
      <div class="stat-row">
        <span class="stat-label">Remaining</span>
        <v-chip :color="color" variant="flat" size="small" class="stat-chip">{{ Math.max(0, total - taken) }}</v-chip>
      </div>
    </div>
  </v-card>
</template>

  
  <script setup>
  const props = defineProps({
    title: { type: String, required: true },
    iconImg: { type: String },
    total: { type: Number },
    taken: { type: Number },
    color: { type: String, default: "blue-lighten-4" },
  });
  </script>
  
  <style scoped>
  .holiday-card {
    border: 1px solid #DBDBDB;
    background: white;
    border-radius: 8px;
  }

  .holiday-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .holiday-title {
    font-weight: 600;
    font-size: 13px;
    color: #1e1e1e;
  }

  .holiday-days {
    font-weight: 700;
    font-size: 32px;
    line-height: 1.2;
    color: #101010;
  }

  .holiday-days-text {
    font-weight: 400;
    font-size: 13px;
    color: #6e6e6e;
  }

  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .stat-label {
    font-size: 13px;
    font-weight: 400;
    color: #4a4a4a;
    white-space: nowrap;
  }

  .stat-chip {
    font-size: 12px;
    font-weight: 600;
    min-width: 36px;
    justify-content: center;
  }

  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  </style>
  