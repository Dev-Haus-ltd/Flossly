<template>
  <div class="stat-card">
    <!-- Count -->
    <div class="count">{{ count }}</div>

    <!-- Title -->
    <div class="title">{{ title }}</div>

    <!-- Percentage + Trend Icon -->
    <div v-if="percentage" class="percentage" :style="{ color: color }">
      <v-icon size="18" :color="color">
        {{ trend === "up" ? "mdi-arrow-up" : "mdi-arrow-down" }}
      </v-icon>
      {{ percentage }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: [Number, String],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  percentage: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "#60E5A3", // default green
  },
  trend: {
    type: String,
    default: "up", // can be 'up' or 'down'
  },
});
</script>

<style scoped>
.stat-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #fff;
  border-radius: 12px !important;
  width: 100%;
}

.count {
  
  font-weight: 700;
  font-size: 24px;
  color: #1e1e1e;
}

.title {
  
  font-weight: 500;
  font-size: 14px;
  color: #737373;
}

.percentage {
  
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
