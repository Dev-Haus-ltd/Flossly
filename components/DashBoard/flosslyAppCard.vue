<template>
  <v-card class="flossly-card pa-4 flex-grow-1" elevation="0">
    <!-- Top row -->
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <img :src="img" alt="App" class="app-img mr-3" />
        <div>
          <div class="card-title">{{ title }}</div>
          <div class="card-subtitle">by Flossly</div>
        </div>
      </div>

      <v-btn
        flat
        color="primary"
        height="24"
        class="px-3 text-white text-caption"
      >
        Coming Soon
      </v-btn>
    </div>

    <!-- Details -->
    <div class="card-details mt-4" style="width: 90%">
      {{ details }}
    </div>

    <!-- Downloads -->
    <div class="d-flex align-center mt-3">
      <v-icon size="16" color="#737373">mdi-tray-arrow-down</v-icon>
      <span class="card-downloads ml-2">{{ downloads }}</span>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  title: String,
  img: String,
  details: String,
  downloads: [String, Number],
});
</script>

<style scoped>
.flossly-card {
  border: 1px solid #dbdbdb;
  background: white;
  border-radius: 12px;
}

.app-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: #000000;
}

.card-subtitle {
  font-weight: 400;
  font-size: 12px;
  color: #737373;
}

.card-details {
  font-weight: 400;
  font-size: 12px;
  color: #737373;
}

.card-downloads {
  font-weight: 400;
  font-size: 12px;
  color: #737373;
}
</style>
