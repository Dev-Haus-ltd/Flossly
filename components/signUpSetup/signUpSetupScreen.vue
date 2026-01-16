<template>
  <div class="init-screen" v-if="isInitScreen">
    <initial-screen @handle-init-screen="isInitScreen = false" />
  </div>
  <div class="parent" v-else>
    <v-row class="ma-0">
      <!-- Left Column: Banner (hidden on mobile) -->
      <v-col class="pa-0 d-none d-md-flex">
        <left-stepper-template 
          :active-step="currentStep" 
          :is-mobile-view="false"
        />
      </v-col>
      
      <!-- Right Column: Form (full-width on mobile) -->
      <v-col class="right-column" :class="{ 'mobile-view': true }">
        <!-- Mobile Stepper (shown only on mobile/tablet) -->
        <div class="d-flex d-md-none mobile-stepper-container">
          <left-stepper-template 
            :active-step="currentStep" 
            :is-mobile-view="true"
          />
        </div>
        
        <!-- Form Content -->
        <sign-up-setup 
          @update:current-step="currentStep = $event"
          @go-to-initial-screen="handleGoToInitialScreen"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import initialScreen from "./initialScreen.vue";
import leftStepperTemplate from "./leftStepperTemplate.vue";
const currentStep = ref(0);
const orgStore = useOrgStore();
const router = useRouter();

const isNewPractice = computed(() => orgStore.getIsNewPractice);
const isInitScreen = ref(!isNewPractice.value);

const handleGoToInitialScreen = () => {
  if (isNewPractice.value) {
    router.push("/");
  } else {
    isInitScreen.value = true;
  }
};
</script>

<style scoped>
.init-screen {
  position: relative;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}

.parent {
  position: relative;
  height: 100vh;
  overflow: hidden;
}


.right-column {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-left: 48px;
  padding-right: 48px;
  padding-top: 48px;
  position: relative;
}

/* Mobile view adjustments */
@media (max-width: 959px) {
  .right-column {
    padding: 0 !important;
    width: 100%;
    max-width: 100%;
  }
  
  .mobile-stepper-container {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    margin-bottom: 0;
  }
}

/* Tablet adjustments */
@media (min-width: 600px) and (max-width: 959px) {
  .right-column {
    padding: 0 24px !important;
  }
}

/* Medium laptop adjustments */
@media (min-width: 960px) and (max-width: 1279px) {
  .right-column {
    padding-left: 32px;
    padding-right: 32px;
    padding-top: 32px;
  }
}
</style>
