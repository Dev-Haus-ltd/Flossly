<template>
    <div 
      class="payroll-page"
      :style="{ backgroundImage: `url(${images[currentIndex]})` }"
    >
      <!-- Floating buttons (will be useful once more screens are added) -->
      <div class="nav-buttons" v-if="images.length > 1">
        <button @click="prevImage" :disabled="currentIndex === 0">⬅️</button>
        <button @click="nextImage" :disabled="currentIndex === images.length - 1">➡️</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  // Import payroll assets
  import payroll1 from "@/assets/images/teamfloss/payroll/payroll.svg";
  
  // Later you can add payroll2.svg, payroll3.svg, etc.
  const images = [payroll1];
  
  const currentIndex = ref(0);
  
  const nextImage = () => {
    if (currentIndex.value < images.length - 1) {
      currentIndex.value++;
    }
  };
  
  const prevImage = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  };
  </script>
  
  <style scoped>
  .payroll-page {
    margin-top: 40px;
    width: 100%;
    height: 88vh;
    background-size: contain;
    background-position: center;
    position: relative;
  }
  
  /* floating button container */
  .nav-buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
  }
  
  /* button style */
  .nav-buttons button {
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s ease;
  }
  
  .nav-buttons button:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .nav-buttons button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  </style>
  