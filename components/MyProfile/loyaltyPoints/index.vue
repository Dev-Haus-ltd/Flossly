<template>
    <div class="mt-5">
      <v-row>
        <!-- My Rewards Points -->
        <v-col cols="6">
          <div
            id="redeem-card"
            class="rewards-card d-flex align-center rounded-xl pa-4"
            :class="{ active: activeTab === 'rewards' }"
            @click="setActive('rewards')"
          >
            <!-- Icon -->
            <lord-icon
              src="https://cdn.lordicon.com/uihwbzln.json"
              trigger="hover"
              target="#redeem-card"
              style="width: 86px; height: 86px"
            />
  
            <!-- Text -->
            <div class="ml-4 mt-2">
              <div class="rewards-title">My Rewards Points</div>
              <div class="rewards-points">2000</div>
            </div>
  
            <!-- Arrow (only shows if other tab is active) -->
            <v-icon v-if="activeTab === 'redeem'" class="ml-auto">mdi-chevron-right</v-icon>
          </div>
        </v-col>
  
        <!-- Redeem Basket -->
        <v-col cols="6">
          <div
            id="redeem-card"
            class="redeem-card d-flex align-center rounded-xl pa-4"
            :class="{ active: activeTab === 'redeem' }"
            @click="setActive('redeem')"
          >
            <!-- Icon -->
            <lord-icon
              src="https://cdn.lordicon.com/jijcyrgq.json"
              trigger="hover"
              target="#redeem-card"
              style="width: 86px; height: 86px"
            />
  
            <!-- Text -->
            <div class="ml-4 mt-2">
              <div class="rewards-title">Redeem Basket</div>
            
            </div>
  
            <!-- Arrow (only shows if other tab is active) -->
            <v-icon v-if="activeTab === 'rewards'" class="ml-auto">mdi-chevron-right</v-icon>
          </div>
        </v-col>
      </v-row>
  
      <!-- Content -->
      <div class="mt-6">
        <div v-if="activeTab === 'rewards'">
          <!-- Rewards content here -->
          <MyProfileLoyaltyPointsRewardsContent /> 

        </div>
        <div v-else>
          <!-- Redeem content here -->
          <MyProfileLoyaltyPointsRedeemContent/>

        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  const activeTab = ref("rewards");
  
  function setActive(tab) {
    activeTab.value = tab;
  }
  </script>
  
  <style scoped>
  .rewards-card {
    background: linear-gradient(135deg, #2f4d4e, #213536);
    color: #fff;
    cursor: pointer;
  }
  .redeem-card {
    background-color: #b9308a;
    color: #fff;
    cursor: pointer;
  }
  
  .rewards-title {
    font-family: Poppins;
    font-weight: 400;
    font-size: 16px;
    color: #ffffff;
  }
  .rewards-points {
    font-family: Poppins;
    font-weight: 600;
    font-size: 32px;
    color: #ffffff;
  }
  
  .active {
    outline: 2px solid #fea200; /* highlight active card */
  }
  </style>
  