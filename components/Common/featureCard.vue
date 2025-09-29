<template>
    <v-card
      class="feature-card d-flex align-center pa-4"
      color="secondary"
      elevation="0"
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
    background-image: url('@/assets/images/dashboard/feature-card.svg');
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: 0.5rem; /* rounded-lg */
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    border-radius: 24px;
  }
  
  /* Left image */
  .feature-img {
    width: 68px;
    height: 68px;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  /* Text styles */
  .text-content {
    margin-left: 16px;
    color: #fff;
    flex: 1;
    z-index: 1;
  }
  
  .heading {
    font-family: "Poppins", sans-serif;
    font-weight: 600;
    font-size: 16px;
    color: #ffffff;
  }
  
  .sub-heading {
    font-family: "Poppins", sans-serif;
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
    z-index: 2;
  }
  </style>
  