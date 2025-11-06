<template>
  <div class="init-page bg-secondary">
    <div class="init-page-container">
      <!-- Left Column - Watermark -->
      <div class="watermark-column">
        <img
          src="/assets/logos/loginLogos/watermark.svg"
          alt="Flossly Watermark"
          class="watermark-image"
        />
      </div>

      <!-- Right Column - Content -->
      <div class="content-column">
        <div class="init-pg-content" :style="{ padding: smAndDown ? '0 20px' : '0' }">
          <div class="text-center">
            <img
              src="@/assets/logos/loginLogos/logoWithTitle.svg"
              class="mx-auto h-20 w-20"
              :style="{
                width: smAndDown ? '70%' : mdAndUp && !lgAndUp ? '50%' : '33.33%',
                maxWidth: smAndDown ? '280px' : mdAndUp && !lgAndUp ? '250px' : '220px'
              }"
              alt=""
            />
            <h2 class="init-title mt-5 text-h2 text-md-h2 text-sm-h2">Welcome to Flossly</h2>
            <p class="init-sub-title mt-10 text-h5 text-md-h5">Let's tidy up your dental ops.</p>
            <div class="d-flex justify-center my-7 mb-5 button-container">
              <v-btn
                @click="handleScreen()"
                class="start-setup-btn"
                rounded="lg"
                size="x-large"
                flat
                >Start Setup</v-btn
              >
              <v-btn
                class="watch-demo-btn"
                @click="initialPage = false"
                color="primary"
                rounded="lg"
                size="x-large"
                flat
                >Watch Demo</v-btn
              >
            </div>

            <h2 class="init-info text-h4 text-md-h4 text-sm-h6">
              This setup takes 4-5 mins and gives your
              <br />
              clinic a clean start.
            </h2>
          </div>
        </div>
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
  background-color: #162627;
  min-height: 100vh;
  overflow: hidden;
}

.init-page-container {
  position: relative;
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* Left Column - Watermark */
.watermark-column {
  position: relative;
  flex: 0 0 35%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.watermark-image {
  width: 100%;
  height: 100vh;
  max-width: 600px;
  object-fit: fill;
}

/* Right Column - Content */
.content-column {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: absolute;
  top:0;
  left: 20%;
  z-index: 2;
  width: 75%;
  height: 100%;
}

.init-pg-content {
  max-width: 800px;
  width: 100%;
  margin-top: 5%;
}

/* Hide watermark on screens smaller than 960px */
@media (max-width: 980px) {
  .watermark-column {
    display: none;
  }

  .content-column {
    justify-content: center;
    left: 0;
    width: 100%;
  }
}

.init-title {
  font-weight: 600;
  line-height: 100%;
  color: #ffffff;
}

.init-sub-title {
  font-weight: 400 !important;
  line-height: 100%;
  color: #ffffff;
}

.init-info {
  font-weight: 400;
  line-height: 100%;
  color: #ffffff;
}

.button-container {
  gap: 15px;
}

.start-setup-btn,
.watch-demo-btn {
  font-size: 16px !important;
  border-radius: 12px !important;
}

.start-setup-btn {
  background-color: #7D77FF !important;
  color: #ffffff !important;
}
</style>