<template>
  <v-card class="holiday-card pa-4 d-flex justify-space-between align-start" flat>
    <!-- Left Section -->
    <div class="d-flex flex-column align-start">
      <!-- Icon -->
      <img :src="iconImg" class="holiday-icon mb-2" />

      <!-- Title -->
      <p class="holiday-title mb-1">{{ title }}</p>

      <!-- Days -->
      <div class="d-flex align-baseline">
        <p class="holiday-days">{{ total }}</p>
        <p class="holiday-days-text ml-2">days</p>
      </div>
    </div>  

    <!-- Right Section (Chips with gap) -->
    <div class="d-flex flex-column" style="gap: 20px;">
        <v-chip :color="color" variant="flat" class="chip-item w-100">
  <div class="d-flex justify-space-between w-100">
    <span class="chip-title">Entitlement</span>
    <span class="chip-count">{{ total }}</span>
  </div>
</v-chip>

<v-chip :color="color" variant="flat" class="chip-item mt-2 w-100">
  <div class="d-flex justify-space-between w-100">
    <span class="chip-title">Taken</span>
    <span class="chip-count">{{ taken }}</span>
  </div>
</v-chip>

<v-chip :color="color" variant="flat" class="chip-item mt-2">
  <div class="d-flex justify-space-between w-100">
    <span class="chip-title">Remaining</span>
    <span class="chip-count">{{ total - taken || 0 }}</span>
  </div>
</v-chip>
    </div>
  </v-card>
</template>

  
  <script setup>
  const props = defineProps({
    title: { type: String, required: true },
    iconImg: { type: String },
    total: { type: Number },
    taken: { type: Number },
    color: { type: String, default: "blue-lighten-4" },
  });
  </script>
  
  <style scoped>
  .holiday-card {
    border: 1px solid #DBDBDB;
    background: white;
    border-radius: 8px;
    min-height: 160px;
  }
  
  .holiday-icon {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
  
  .holiday-title {
    font-family: Poppins;
    font-weight: 600;
    font-size: 14px;
    color: #1e1e1e;
  }
  
  .holiday-days {
    font-family: Poppins;
    font-weight: 700;
    font-size: 40px;
    line-height: 130%;
    color: #101010;
  }
  
  .holiday-days-text {
    font-family: Poppins;
    font-weight: 400;
    font-size: 14px;
    color: #6e6e6e;
  }
  
  .chip-item {
  border-radius: 6px;
  padding: 0 8px;
  height: 28px;
  font-size: 14px;
  width: 160px; /* fixed width */
}
  
  .chip-title {
    font-family: Poppins;
    font-weight: 400;
    font-size: 14px;
  }
  
  .chip-count {
    font-family: Poppins;
    font-weight: 600;
    font-size: 14px;
  }
  ::v-deep(.v-chip__content) {
  width: 100% !important;
}
  </style>
  