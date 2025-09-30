<template>
  <div class="redeem-card d-flex flex-column rounded-xl">
    <!-- Image Top -->
    <img :src="img" alt="card image" class="card-img" />

    <!-- Content -->
    <div class="pa-4 d-flex flex-column flex-grow-1">
      <!-- Title -->
      <div class="card-title mb-3">{{ title }}</div>

      <!-- Chip -->
      <v-chip
        class="bonus-chip mb-4"
        variant="flat"
        size="small"
        prepend-icon="mdi-star"
        label
      >
        +{{ points }}
      </v-chip>

      <!-- Link -->
      <a
        rel="noopener noreferrer"
        class="link-btn mt-auto"
        @click="emitCardId(id)"
      >
        Redeem
        <v-icon class="ml-1" size="16">mdi-arrow-right</v-icon>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: Number,
  img: String,
  points: String,
  title: String,
});
const emit = defineEmits(["emitCardId"]);
const emitCardId = (id) => {
  emit("emitCardId", id);
};
</script>

<style scoped>
.redeem-card {
  border: 1px solid #60e5a3;
  background: #fff;
  overflow: hidden;
  height: 100%;
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: contain;
  height: 100%;
  border-bottom: 1px solid #60e5a3;
}

.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
  width: fit-content;
}
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}

.card-title {
  font-weight: 500;
  font-size: 16px;
  color: #1e1e1e;
}

.link-btn {
  
  font-weight: 400;
  font-size: 14px;
  text-transform: none;
  align-self: flex-start;
  width: fit-content;
  color: #266df0;
  cursor: pointer;
}
</style>
