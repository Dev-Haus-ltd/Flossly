<template>
  <div class="revenue-card d-flex justify-space-between align-center">
    <!-- Left Content -->
    <div class="text-section">
      <div class="title">{{ title }}</div>
      <div class="subtitle">{{ subtitle }}</div>
      <div v-if="label" class="label">{{ label }}</div>
    </div>

      <!-- Right side Lordicon animation -->
      <lord-icon
     src="https://cdn.lordicon.com/mtscaiva.json"
      trigger="loop"
      delay="2000"
      colors="primary:#ffc738,secondary:#e8b400"
      style="width:100px;height:100px"
    >
    </lord-icon>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "This Week",
  },
  subtitle: {
    type: [String, Number],
    default: "£ 29,985",
  },
  label: {
    type: String,
    default: "Total Revenue",
  },
});
</script>

<style scoped>
.revenue-card {
  background-image: url("@/assets/images/dashboard/revenue.svg");
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  min-height: 150px;
}

.text-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.title {
  
  font-weight: 600;
  font-size: 14px;
}

.subtitle {
  
  font-weight: 700;
  font-size: 40px;
  margin-top: 4px;
}

.label {
  
  font-weight: 600;
  font-size: 14px;
  margin-top: 8px;
}
</style>