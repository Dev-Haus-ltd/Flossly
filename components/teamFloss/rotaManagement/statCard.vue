<template>
    <v-card class="stat-card pa-6" elevation="0">
      <!-- Lordicon -->
      <lord-icon :src="icon" trigger="hover" class="lordicon" />
  
      <!-- Text Section -->
      <div>
        <h3 class="stat-title">{{ title }}</h3>
        <p class="stat-count" :style="{ color }">
          {{ count }}
        </p>
      </div>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    title: { type: String, required: true },
    count: { type: Number, required: true },
    color: { type: String, default: '#000' },
    icon: { type: String, required: true }
  });
  </script>
  
  <style scoped>
.stat-card {
  border: 1px solid #dbdbdb;
  background-color: #f3f6fa;
  border-radius: 16px;
}

.lordicon {
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.stat-title {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 14px;
  font-style: normal; /* SemiBold is represented by font-weight 600 */
  margin: 0;
}

.stat-count {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 40px;
  font-style: normal;
  margin: 0;
}
  </style>
  