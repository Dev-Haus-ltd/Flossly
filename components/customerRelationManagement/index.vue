<template>
    <div 
      class="crm-page"
      :style="{ backgroundImage: `url(${images[currentIndex]})` }"
    >
      <!-- Floating buttons -->
      <div class="nav-buttons">
        <button @click="prevImage" :disabled="currentIndex === 0">⬅️</button>
        <button @click="nextImage" :disabled="currentIndex === images.length - 1">➡️</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  // Import CRM assets (7 screens)
  import crm1 from "@/assets/images/crm/crm.svg";
  import crm2 from "@/assets/images/crm/crm2.svg";
  import crm3 from "@/assets/images/crm/crm3.svg";
  import crm4 from "@/assets/images/crm/crm4.svg";
  import crm5 from "@/assets/images/crm/crm5.svg";
  import crm6 from "@/assets/images/crm/crm6.svg";
  import crm7 from "@/assets/images/crm/crm7.svg";
  
  // Put them in an array
  const images = [crm1, crm2, crm3, crm4, crm5, crm6, crm7];
  
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
  .crm-page {
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
  