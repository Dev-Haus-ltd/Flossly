<template>
  <div class="image-wrapper">
    <img :src="diaryImage" alt="Diary image" class="diary-image" />
  </div>
</template>

<script lang="ts" setup>
import diaryImage from '@/assets/diary/finance.png'
</script>

<style scoped>
.image-wrapper {
  width: 100vw;
  height: 100vh;          /* Fit full screen */
  display: flex;
  align-items: left;    /* Vertical center */
  justify-content: start;/* Horizontal center */
  background-color: #f5f6f8; /* Optional soft background */
  overflow: hidden;
}

.diary-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;    /* Keep aspect ratio */
}
</style>
