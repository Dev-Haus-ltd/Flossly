<template>
  <div class="init-page bg-secondary"> 
    <div class="water-mark"></div>
    <div class="init-pg-content" :style="{ padding: smAndDown ? '0 20px' : '0' }">
      <div class="text-center">
        <img
          src="/assets/logos/signupSetupScreen/init-logo.svg"
          class="mx-auto h-20 w-20"
          :style="{
            width: smAndDown ? '70%' : mdAndUp && !lgAndUp ? '50%' : '33.33%',
            maxWidth: smAndDown ? '280px' : mdAndUp && !lgAndUp ? '250px' : '220px'
          }"
          alt=""
        />
        <h2 class="init-title mt-2 text-h2 text-md-h3 text-sm-h4">Welcome to Flossly</h2>
        <p class="init-sub-title mt-2 text-subtitle-1 text-sm-body-1">Let's tidy up your dental ops.</p>
        <div class="d-flex justify-center my-7">
          <v-btn
            class="button rounded-lg"
            @click="handleScreen()"
            color="secondary-dark"
            >Get Started</v-btn
          >
          <v-btn
            class="ml-2 button rounded-lg"
            @click="initialPage = false"
            color="primary"
            >Watch Demo</v-btn
          >
        </div>

        <h2 class="mt-5 init-info text-h4 text-md-h5 text-sm-h6">
          This setup takes 4-5 minutes and gives your clinic a clean start.
        </h2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
const { smAndDown, mdAndUp, lgAndUp } = useDisplay();
const emit = defineEmits(["handle-init-screen"]);
const handleScreen = () => {
  emit("handle-init-screen");
};
</script>

<style scoped>
.init-page {
  position: relative;
  background-color: #162627;
}
.init-pg-content {
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  max-width: 800px;
  width: 100%;
  box-sizing: border-box;
}
.water-mark {
  background-image: url("/assets/logos/loginLogos/watermark.svg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
  width: 100%;
  opacity: 0.3;
}
.init-title {
  font-weight: 600;
  line-height: 100%;
  color: #ffffff;
}

.init-sub-title {
  font-weight: 600;
  line-height: 100%;
  color: #ffffff;
}
.init-info {
  font-weight: 600;
  line-height: 100%;
  color: #ffffff;
}
.button {
  height: 52px;
  width: 152px;
}
</style>
