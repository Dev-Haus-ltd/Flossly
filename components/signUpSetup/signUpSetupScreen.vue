<template>
  <div class="init-screen" v-if="isInitScreen">
    <initial-screen @handle-init-screen="isInitScreen = false" />
  </div>
  <div class="parent" v-else>
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <left-stepper-template />
        </v-col>
        <v-col cols="12" md="6" class="d-flex align-center">
          <sign-up-setup />
        </v-col>
      </v-row>
    </v-container>
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
}

.watermark {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}
</style>
