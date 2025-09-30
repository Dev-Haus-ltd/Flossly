<template>
    <div class="dashboard-header d-flex align-center">
      <div class="text-section">
        <h1 class="dashboard-title">{{title}}</h1>
        <p class="dashboard-subtitle ml-3">
         {{subTitle}}
        </p>
      </div>
    </div>
  </template>

  <script setup>
const {title, subTitle}= defineProps(['title', 'subTitle'])
</script>
<style scoped>
.dashboard-header {
  height: 100%; /* Optional: adjust as needed */
  padding: 16px;
}

.text-section {
  display: flex;
align-items: center;
}

.dashboard-title {
  
  font-weight: 400;
  font-size: 24px;
  margin: 0;
  color: #1E1E1E;
}

.dashboard-subtitle {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
  margin-top: 4px;
}
</style>
  