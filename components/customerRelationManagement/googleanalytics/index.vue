<template>
  <div class="carousel-container">
    <!-- Page Header (Sticky - stays at top of carousel only) -->
    <div class="cust-border">
      <p>Google Analytics</p>
      <span class="coming-soon-pill">Coming Soon</span>
    </div>
    <!-- Image Area (Scrollable if needed) -->
    <div class="carousel-image-wrapper">
      <img
        :src="currentImage"
        :alt="`Carousel image ${currentIndex + 1}`"
        class="carousel-image"
      />
      <!-- Navigation Controls (Overlay on Image) -->
      <div class="carousel-controls">
        <button
          @click="previousImage"
          class="carousel-button"
          aria-label="Previous image"
        >
          <i class="mdi mdi-chevron-left"></i>
        </button>
        <button
          @click="nextImage"
          class="carousel-button"
          aria-label="Next image"
        >
          <i class="mdi mdi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue'
import image1 from '@/assets/temp_analytics/carousel-1.png'
import image2 from '@/assets/temp_analytics/carousel-2.png'
import image3 from '@/assets/temp_analytics/carousel-3.png'
import image4 from '@/assets/temp_analytics/carousel-4.png'
import image5 from '@/assets/temp_analytics/carousel-5.png'
const images = [image1, image2, image3, image4, image5]
const currentIndex = ref(0)
const currentImage = computed(() => images[currentIndex.value])
const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % images.length
}
const previousImage = () => {
  currentIndex.value =
    (currentIndex.value - 1 + images.length) % images.length
}
</script>
<style scoped>
/* ===== Root Layout (Takes up available space after sidebar) ===== */
.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Header (Sticky within carousel, NOT fixed to viewport) ===== */
.cust-border {
  position: sticky;
  top: 0;
  z-index: 30;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #dbdbdb;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.cust-border p {
  font-size: 12px;
  margin: 0;
  font-weight: 500;
}

/* ===== Pill ===== */
.coming-soon-pill {
  background: #ffe3b3;
  border: 1px solid #f1b658;
  border-radius: 999px;
  color: #7a4b00;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  text-transform: uppercase;
}

/* ===== Image Wrapper (Scrollable area) ===== */
.carousel-image-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

/* ===== Image ===== */
.carousel-image {
  max-width: 100vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin-left: 10px;
  margin-top: 20px;
  flex-shrink: 0;
}

/* ===== Overlay Controls (Position over image) ===== */
.carousel-controls {
  position: absolute;
  top: 50%;
  left: 20px;
  right: 20px;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
  width: calc(100% - 40px);
  pointer-events: none;
}

.carousel-controls button {
  pointer-events: auto;
}

/* ===== Buttons ===== */
.carousel-button {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 26px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.carousel-button:hover {
  transform: scale(1.1);
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.carousel-button:active {
  transform: scale(0.95);
}

/* ===== Scrollbar styling (optional) ===== */
.carousel-image-wrapper::-webkit-scrollbar {
  width: 8px;
}

.carousel-image-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.carousel-image-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.carousel-image-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .carousel-button {
    width: 38px;
    height: 38px;
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .carousel-button {
    width: 34px;
    height: 34px;
    font-size: 20px;
  }
}
</style>