<template>
  <div class="reward-card d-flex flex-column rounded-xl">
    <!-- Image Top -->
    <img :src="img" alt="card image" class="card-img" />

    <!-- Content -->
    <div class="pa-4 d-flex flex-column flex-grow-1">
      <!-- Chip -->
      <v-chip
        class="bonus-chip mb-3"
        variant="flat"
        size="small"
        prepend-icon="mdi-star"
        label
      >
        +{{ points }}
      </v-chip>

      <!-- Title -->
      <div class="card-title mb-2">{{ title }}</div>

      <!-- Detail -->
      <div class="card-detail mb-4">{{ detail }}</div>

      <!-- Link Button -->
      <a rel="noopener noreferrer" class="link-btn mt-auto" @click="emitCardId(id)">
        {{ linkLabel }}
        <v-icon class="ml-1" size="16">mdi-open-in-new</v-icon>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
    id:Number,
  img: String,
  points: String,
  title: String,
  detail: String,
  linkLabel: String,
});
const emit= defineEmits(['emitCardId'])
const emitCardId= (id)=>{
   emit('emitCardId', id)
}
</script>

<style scoped>
.reward-card {
  border: 1px solid #60e5a3;
  background: #fff;
  overflow: hidden;
  height: 100%;
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid #60e5a3;
}

.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
  width: fit-content; /* 👈 prevents full width */
}
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}

.card-title {
  
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
}

.card-detail {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.link-btn {
  
  font-weight: 500;
  font-size: 14px;
  color: #213536;
  text-transform: none;
  align-self: flex-start; /* 👈 keeps button left-aligned */
  width: fit-content; /* 👈 prevents full width */
  color: #266df0;
  cursor: pointer;
}
</style>
