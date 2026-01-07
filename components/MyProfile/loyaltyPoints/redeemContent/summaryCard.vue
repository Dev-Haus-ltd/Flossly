<template>
  <v-card class="custom-card pa-4 flex-grow-1" :elevation="0">
    <!-- Header -->
    <div class="card-header mb-4">Redeem Item</div>

    <!-- Content Row -->
    <div class="d-flex">
      <!-- Left Image -->
      <img :src="img" alt="Reward Image" class="reward-img mr-4" />

      <!-- Right Content -->
      <div class="flex-grow-1 d-flex flex-column">
        <!-- Title -->
        <div class="reward-title mb-2">{{ title }}</div>

        <!-- Chip -->
        <v-chip
          class="bonus-chip mb-3"
          variant="flat"
          size="small"
          prepend-icon="mdi-star"
          label
        >
          {{ points }} Points
        </v-chip>

        <!-- Description -->
        <div class="reward-description mb-4">
          {{ description }}
        </div>

        <!-- Divider -->
        <v-divider class="my-2"></v-divider>

        <!-- Remaining Points -->
        <div class="d-flex justify-space-between align-center mt-2">
          <div class="remaining-label">Remaining Points</div>
          <v-chip
            class="bonus-chip"
            variant="flat"
            size="small"
            prepend-icon="mdi-star"
            label
          >
            {{ remainingPoints }} Points
          </v-chip>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  img: String,
  title: String,
  points: Number,
  description: String,
  remainingPoints: Number,
});
</script>

<style scoped>
.custom-card {
  border: 1px solid #60e5a3;
  background: #fff;
  border-radius: 12px;
}

.card-header {
  
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
}

.reward-img {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #ddd;
}

.reward-title {
  
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
}

.reward-description {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.remaining-label {
  
  font-weight: 500;
  font-size: 14px;
  color: #1e1e1e;
}

.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
  width: fit-content;
  align-self: flex-start;
}
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
</style>
