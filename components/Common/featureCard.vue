<template>
    <v-card
      class="feature-card d-flex align-center pa-4"
      elevation="0"
      bg-color="#171952"
    >
      <!-- Left image (static) -->
      <img
        src="@/assets/images/dashboard/feature-icon.svg"
        alt="feature icon"
        class="feature-img"
      />
  
      <!-- Text content -->
      <div class="text-content">
        <div class="heading">{{ heading }}</div>
        <div class="sub-heading">
          {{ subheading }}
        </div>
      </div>
  
      <!-- Background image (static) -->
      <!-- <div
        class="bg-image"
      ></div> -->
  
      <!-- Close icon -->
      <v-icon class="close-icon" @click="$emit('close')">mdi-close</v-icon>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    heading: {
      type: String,
      required: true
    },
    subheading: {
      type: String,
      required: true
    }
  });
  
  defineEmits(['close']);
  </script>
  
  <style scoped>
  .feature-card {
    border-radius: 24px;
    position: relative;
    background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
    padding: 4px;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
    border-radius: 20px;
    z-index: 1;
  }
  
  /* Left image */
  .feature-img {
    width: 68px;
    height: 68px;
    object-fit: cover;
    flex-shrink: 0;
    z-index: 2;
    position: relative;
  }
  
  /* Text styles */
  .text-content {
    margin-left: 16px;
    color: #fff;
    flex: 1;
    z-index: 2;
    position: relative;
  }
  
  .heading {
    
    font-weight: 600;
    font-size: 16px;
    color: #ffffff;
  }
  
  .sub-heading {
    
    font-weight: 400;
    font-size: 14px;
    margin-top: 4px;
    color: #ffffff;
  }
  
  /* Background image in middle */
  .bg-image {
    background-image: url('@/assets/images/dashboard/feature-bg.svg');
    background-size: contain;
    background-repeat: no-repeat;
    position: absolute;
    top: 0;
    right: 40px; /* leave space for close icon */
    bottom: 0;
    width: 625px;
  }
  
  /* Close icon */
  .close-icon {
    color: #fff;
    cursor: pointer;
    z-index: 3;
    position: relative;
  }
  </style>
  