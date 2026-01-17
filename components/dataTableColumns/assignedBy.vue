<template>
  <div class="d-flex align-center mx-2">
    <!-- Avatar with tooltip -->
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props }">
        <div v-bind="props" class="avatar-trigger">
          <CommonAvatar :user="assigner" :size="32" />
        </div>
      </template>
      <span>{{ assigner?.fullName || 'Unknown' }}</span>
    </v-tooltip>
  </div>
</template>

<script setup>
const props = defineProps({
  assigner: { 
    type: Object, 
    default: null 
  },
});
</script>

<style scoped>
.avatar-trigger {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar-trigger:hover {
  transform: scale(1.1);
}
</style>
