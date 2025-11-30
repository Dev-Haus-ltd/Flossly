<template>
    <v-card class="rounded-xl d-flex flex-column h-100" style="border: 1px solid #DFDFDF;" :elevation="0">
      <!-- Upper Half -->
      <div class="flex flex-col items-center p-4">
        <img src="@/assets/images/taskpool/operational.svg" alt="card-img" class="w-100 h-24 object-contain mb-2" />
        <v-divider></v-divider>
      </div>
  
      <!-- Lower Half -->
      <div class="pa-4 text-left">
        <h3 class="title">{{ title }}</h3>
        <p class="text-gray-500 sub-title mb-2">by flossly</p>
        <p class="description text-gray-600 mb-4">{{ description }}</p>
  
        <!-- Total Count -->
        <div class="flex items-center">
          <v-icon size="16" class="mr-2">mdi-format-list-bulleted</v-icon>
          <span class="count">{{ count }}</span>
        </div>
      </div>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    title: String,
    
    description: String,
    count: Number
  })
  </script>
  
  <style scoped>
  
  .title{
    
font-weight: 600;
font-style: 'SemiBold';
font-size: 14px;


  }
  .sub-title{
    
font-weight: 400;
font-size: 10px;
color: #737373;


  }
  .description{
    
font-weight: 400;
font-style: "Regular";
font-size: 11px;
color: #737373;

  }
  .count{
font-weight: 400;
font-style: "Regular";
font-size: 14px;
color: #737373;

  }
  </style>