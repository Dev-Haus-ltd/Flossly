<template>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
      transition="scale-transition"
    >
      <!-- Activator -->
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          :style="{
            backgroundColor: '#F3F6FA',
            borderRadius: '9999px',
          }"
          size="40"
          elevation="0"
          class="mx-3"
        >
        <v-icon :style="{ color: '#6D6D6D' }">mdi-bell-outline</v-icon>
        </v-btn>
      </template>
  
      <!-- Dummy Menu Content -->
      <v-card min-width="250">
        <v-list>
          <v-list-item title="No new notifications" />
        </v-list>
      </v-card>
    </v-menu>
  </template>
  
  <script setup>
  const menu = ref(false);
  </script>
  