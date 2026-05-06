<template>
  <div class="consent-form-page">
    <ConsentFormViewer />
  </div>
</template>

<script setup>
// This page is public and doesn't require authentication
// It's accessed via a token-based link from authentication
</script>

<style scoped>
.consent-form-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
