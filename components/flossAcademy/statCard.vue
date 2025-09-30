<template>
    <v-card
      class="custom-card"
      flat
    >
      <!-- Top Row -->
      <div class="card-header py-1">
        <!-- Title -->
        <span class="card-title">{{ title }}</span>
  
        <!-- Points Chip -->
        <v-tooltip :text="`${points} points`">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              class="bonus-chip"
              variant="flat"
              density="comfortable"
              size="small"
              prepend-icon="mdi-star"
              label
            >
              {{ points }}
            </v-chip>
          </template>
        </v-tooltip>
      </div>
  
      <!-- Divider -->
      <div class="divider"></div>
  
      <!-- Content Row -->
      <div class="card-content mt-5">
        <!-- Lord Icon -->
        <lord-icon
          :src="icon"
          trigger="hover"
          style="width: 60px; height: 60px"
        >
        </lord-icon>
  
        <!-- Hours Wrapper -->
        <span class="total-hours">{{ totalHours }}</span>
        <span class="hours-label">hours</span>
      </div>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    points: {
      type: [String, Number],
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    totalHours: {
      type: [String, Number],
      required: true
    }
  })
  </script>
  
  <style scoped>
  .custom-card {
    border: 1px solid #DBDBDB;
    background-color: #FFFFFF;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    height: 165px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-title {
    
    font-weight: 600;
    font-size: 14px;
    color: #000000;
  }
  
  /* Chip Styling */
  .bonus-chip {
    border: 1px solid #fea200;
    background-color: #fff0d5;
    color: #1e1e1e;
    font-weight: 500;
    font-size: 13px;
    border-radius: 16px;
  }
  
  ::v-deep(.bonus-chip .v-icon) {
    color: #fea200;
  }
  
  /* Divider */
  .divider {
    border-top: 1px solid #DBDBDB;
    margin: 8px 0;
  }
  
  /* Content Section */
  .card-content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 24px; /* Equal spacing between icon, hours, and label */
    padding-top: 8px;
    
  }
  
  .total-hours {
    
    font-weight: 500;
    font-size: 40px;
    color: #000000;
    line-height: 1;
  }
  
  .hours-label {
    
    font-weight: 500;
    font-size: 14px;
    color: #000000;
  }
  </style>
  