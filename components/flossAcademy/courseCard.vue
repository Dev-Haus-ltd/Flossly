<template>
    <v-card class="course-card pa-1" flat>
      <!-- Image -->
      <v-img
        :src="course?.thumbnail"
        height="240px"
        cover
        class="card-image rounded-lg"
      ></v-img>
  
      <!-- Content -->
      <div class="card-content">
        <!-- Time + Verified -->
        <div class="d-flex justify-space-between align-center mb-4">
          <!-- Time -->
          <div class="d-flex align-center">
            <v-icon size="16" color="#737373" class="mr-1">mdi-clock-outline</v-icon>
            <span class="time-text">{{ course?.creditHours }}</span>
          </div>
  
          <!-- Verified -->
          <div v-if="course?.isVerified" class="d-flex align-center">
            <v-icon size="16" color="#33B93C" class="mr-1">mdi-check-circle-outline</v-icon>
            <span class="verified-text">Verified CPD</span>
          </div>
        </div>
  
        <!-- Title -->
        <div class="title-text mb-6">
          {{ course?.title }}
        </div>
  
        <!-- Actions -->
        <div class="d-flex justify-space-between align-center">
          <!-- Learn More -->
          <v-btn
            variant="outlined"
            size="default"
            class="learn-more-btn"
            append-icon="mdi-arrow-right"
            @click="onLearnMore"
            flat
          >
            Learn More
          </v-btn>
  
          <!-- Assign To -->
          <v-btn
            variant="text"
            size="default"
            class="assign-btn"
            append-icon="mdi-arrow-top-right"
            @click="onAssign"
            flat
          >
            Assign To
          </v-btn>
        </div>
      </div>
    </v-card>
  </template>
  
  <script setup>
  const emit= defineEmits(['showCourse'])
  const props = defineProps({
    course: {
      type: Object,
      required: true,
    }
  })
  
  function onLearnMore() {
    console.log("Learn More clicked, ID:", props.course)
    emit('showCourse', props.course)
  }
  
  function onAssign() {
    console.log("Assign clicked, ID:", props.course)
  }
  </script>
  
  <style scoped>
  .course-card {
    border: 1px solid #DBDBDB;
    background-color: #FFFFFF;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .card-content {
    padding: 12px 12px 16px 12px; /* more padding on bottom */
  }
  
  .time-text {
    font-family: Poppins, sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #737373;
  }
  
  .verified-text {
    font-family: Poppins, sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #33B93C;
  }
  
  .title-text {
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: #1E1E1E;
    line-height: 1.4;
  }
  
  .learn-more-btn {
    border: 1px solid #3ADF8D !important;
    color: #1E1E1E !important;
    font-size: 13px;
    font-weight: 500;
    text-transform: none;
  }
  
  .learn-more-btn .v-icon {
    color: #1E1E1E !important;
  }
  
  .assign-btn {
    color: #3ADF8D !important;
    font-size: 13px;
    font-weight: 500;
    text-transform: none;
  }
  
  .assign-btn .v-icon {
    color: #3ADF8D !important;
  }
  </style>
  