<template>
    <div 
      class="rota-page"
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
  
  // Import assets explicitly so Vite can resolve them
  import rota1 from "@/assets/images/teamfloss/rota/rota.svg";
  import rota2 from "@/assets/images/teamfloss/rota/rota2.svg";
  import rota3 from "@/assets/images/teamfloss/rota/rota3.svg";
  import rota4 from "@/assets/images/teamfloss/rota/rota4.svg";
  import rota5 from "@/assets/images/teamfloss/rota/rota5.svg";
  import rota6 from "@/assets/images/teamfloss/rota/rota6.svg";
  import rota7 from "@/assets/images/teamfloss/rota/rota7.svg";
  
  // Put them in an array
  const images = [rota1, rota2, rota3, rota4, rota5, rota6, rota7];
  
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
  .rota-page {
    width: 100%;
    height: 100vh;
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
  