<template>
  <div class="init-screen" v-if="isInitScreen">
    <initial-screen @handle-init-screen="isInitScreen = false" />
  </div>
  <div class="parent" v-else>

      <v-row>
        <v-col cols="12" md="5" class="pa-0 px-4">
          <left-stepper-template />
        </v-col>
        <v-col cols="12" md="7" class="d-flex align-center">
          <sign-up-setup />
        </v-col>
      </v-row>
   
    <!-- <img
      src="../../assets/logos/signupSetupScreen/waterMark.svg"
      alt="watermark"
      class="watermark"
    /> -->
  </div>
</template>

<script setup>
import initialScreen from "./initialScreen.vue";
import leftStepperTemplate from "./leftStepperTemplate.vue";
const isInitScreen = ref(true);
</script>

<style scoped>
.parent {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
}

.watermark {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}
</style>
