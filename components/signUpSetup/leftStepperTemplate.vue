<template>
  <!-- Desktop Banner View -->
  <div v-if="!isMobileView" class="banner-wrapper pa-2 pa-sm-4 pa-md-5 pa-lg-8 pa-xl-10">
    <div class="content-wrapper">
      <div class="content-box pa-2 pa-sm-4 pa-md-5 pa-lg-7 pa-xl-9">
        <h1 class="banner-heading text-subtitle-1 text-sm-h6 text-md-h5 text-lg-h4 text-xl-h3 mb-2 mb-sm-4 mb-md-5 mb-lg-7 mb-xl-9">
          A few clicks away from Organising your dental practice.
        </h1>

        <div class="steps-container d-flex flex-column">
          <div class="step-item mb-1 mb-sm-3 mb-md-3 mb-lg-5 mb-xl-6">
            <div class="step d-flex align-center">
              <div class="icon-circle icon-xs icon-sm-sm icon-md-md icon-lg-lg icon-xl-xl" :class="{ 'active': activeStep >= 0 }">
                <img
                  class="icon-image icon-image-xs icon-image-sm-sm icon-image-md-md icon-image-lg-lg icon-image-xl-xl"
                  src="@/assets/logos/signupSetupScreen/leftStepper/clinicsetup.svg"
                  alt="Step 1 Icon"
                />
              </div>
              <div class="text ml-2 ml-sm-3 ml-md-4">
                <div class="step-title text-caption">Step 1</div>
                <div class="step-subtitle text-caption text-sm-body-2 text-md-body-1 text-lg-body-1 font-weight-medium">Clinic Setup</div>
              </div>
            </div>
          </div>

          <div class="step-item mb-1 mb-sm-3 mb-md-3 mb-lg-5 mb-xl-6">
            <div class="step d-flex align-center">
              <div class="icon-circle icon-xs icon-sm-sm icon-md-md icon-lg-lg icon-xl-xl" :class="{ 'active': activeStep >= 1 }">
                <img
                  class="icon-image icon-image-xs icon-image-sm-sm icon-image-md-md icon-image-lg-lg icon-image-xl-xl"
                  src="@/assets/logos/signupSetupScreen/leftStepper/teammember.svg"
                  alt="Step 2 Icon"
                />
              </div>
              <div class="text ml-2 ml-sm-3 ml-md-4">
                <div class="step-title text-caption">Step 2</div>
                <div class="step-subtitle text-caption text-sm-body-2 text-md-body-1 text-lg-body-1 font-weight-medium">Add Team Members</div>
              </div>
            </div>
          </div>

          <div class="step-item mb-1 mb-sm-3 mb-md-3 mb-lg-5 mb-xl-6">
            <div class="step d-flex align-center">
              <div class="icon-circle icon-xs icon-sm-sm icon-md-md icon-lg-lg icon-xl-xl" :class="{ 'active': activeStep >= 2 }">
                <img
                  class="icon-image icon-image-xs icon-image-sm-sm icon-image-md-md icon-image-lg-lg icon-image-xl-xl"
                  src="@/assets/logos/signupSetupScreen/leftStepper/pricing.svg"
                  alt="Step 3 Icon"
                />
              </div>
              <div class="text ml-2 ml-sm-3 ml-md-4">
                <div class="step-title text-caption">Step 3</div>
                <div class="step-subtitle text-caption text-sm-body-2 text-md-body-1 text-lg-body-1 font-weight-medium">Pricing</div>
              </div>
            </div>
          </div>

          <div class="step-item mb-1 mb-sm-3 mb-md-3 mb-lg-5 mb-xl-6">
            <div class="step d-flex align-center">
              <div class="icon-circle icon-xs icon-sm-sm icon-md-md icon-lg-lg icon-xl-xl" :class="{ 'active': activeStep >= 3 }">
                <img
                  class="icon-image icon-image-xs icon-image-sm-sm icon-image-md-md icon-image-lg-lg icon-image-xl-xl"
                  src="@/assets/logos/signupSetupScreen/leftStepper/dashboard.svg"
                  alt="Step 4 Icon"
                />
              </div>
              <div class="text ml-2 ml-sm-3 ml-md-4">
                <div class="step-title text-caption">Step 4</div>
                <div class="step-subtitle text-caption text-sm-body-2 text-md-body-1 text-lg-body-1 font-weight-medium">Dashboard Tour</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Stepper View -->
  <div v-else class="mobile-stepper-wrapper">
    <v-stepper 
      :model-value="activeStep + 1" 
      alt-labels
      flat
      class="mobile-stepper"
    >
      <v-stepper-header class="mobile-stepper-header">
        <template v-for="(step, index) in steps" :key="index">
          <v-stepper-item
            :value="index + 1"
            :complete="activeStep > index"
            :color="activeStep >= index ? 'primary' : 'grey'"
            class="mobile-stepper-item"
          >
            <template v-slot:icon>
              <div class="mobile-icon-circle" :class="{ 'active': activeStep >= index }">
                <img
                  :src="step.icon"
                  :alt="`${step.title} Icon`"
                  class="mobile-icon-image"
                />
              </div>
            </template>
            <template v-slot:title>
              <span class="mobile-step-title">{{ step.title }}</span>
            </template>
          </v-stepper-item>

          <v-divider 
            v-if="index < steps.length - 1" 
            :thickness="2"
            :class="activeStep > index ? 'divider-complete' : 'divider-incomplete'"
          ></v-divider>
        </template>
      </v-stepper-header>
    </v-stepper>
  </div>
</template>

<script setup>

import clinicsetupIcon from '@/assets/logos/signupSetupScreen/leftStepper/clinicsetup.svg'
import teammemberIcon from '@/assets/logos/signupSetupScreen/leftStepper/teammember.svg'
import pricingIcon from '@/assets/logos/signupSetupScreen/leftStepper/pricing.svg'
import dashboardIcon from '@/assets/logos/signupSetupScreen/leftStepper/dashboard.svg'
// Accept props from parent
const props = defineProps({
  activeStep: {
    type: Number,
    default: 0
  },
  isMobileView: {
    type: Boolean,
    default: false
  }
});

// Steps configuration for mobile stepper
const steps = [
  { title: 'Clinic Setup', icon: clinicsetupIcon },
  { title: 'Add Team Members', icon: teammemberIcon },
  { title: 'Pricing', icon: pricingIcon },
  { title: 'Dashboard Tour', icon: dashboardIcon }
];
</script>

<style scoped>
.banner-wrapper {
  background-image: url("/assets/images/signupBanner.svg");
  background-size: cover;
  background-position: center;
  color: #FFFFFF;
  width: 100%;
  
  /* Responsive height - full viewport on larger screens, auto on small */
  height: calc(100vh - 16px);
  min-height: 500px;
  margin: 8px 0 8px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Ensure padding is always visible by using box-sizing */
  box-sizing: border-box;
}



.content-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-box {
  border: 1px solid #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 100%;
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  overflow: visible;
}

.banner-heading {
  font-family: "Garnett";
  font-weight: 600;
  line-height: 1.2;
  color: #FFFFFF;
}

.step-item {
  width: 100%;
}

.icon-circle {
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  transition: background-color 0.3s ease;
}

/* Active step styling */
.icon-circle.active {
  background-color: #FFFFFF !important;
}

/* Responsive icon circle sizes */
.icon-xs {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

@media (min-width: 600px) {
  .icon-sm-sm {
    width: 50px;
    height: 50px;
    min-width: 50px;
  }
}

@media (min-width: 960px) {
  .icon-md-md {
    width: 55px;
    height: 55px;
    min-width: 55px;
  }
}

@media (min-width: 1280px) {
  .icon-lg-lg {
    width: 70px;
    height: 70px;
    min-width: 70px;
  }
}

@media (min-width: 1920px) {
  .icon-xl-xl {
    width: 80px;
    height: 80px;
    min-width: 80px;
  }
}

/* Responsive icon image sizes */
.icon-image {
  object-fit: contain;
  filter: brightness(0) invert(1);
  transition: filter 0.3s ease;
}

/* Remove filter for active step icons so they show in with selected fiter color */
.icon-circle.active .icon-image {
  filter: brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(5747%) hue-rotate(218deg) brightness(97%) contrast(104%) !important;
}

.icon-image-xs {
  width: 14px;
  height: 14px;
}

@media (min-width: 600px) {
  .icon-image-sm-sm {
    width: 20px;
    height: 20px;
  }
}

@media (min-width: 960px) {
  .icon-image-md-md {
    width: 22px;
    height: 22px;
  }
}

@media (min-width: 1280px) {
  .icon-image-lg-lg {
    width: 28px;
    height: 28px;
  }
}

@media (min-width: 1920px) {
  .icon-image-xl-xl {
    width: 30px;
    height: 30px;
  }
}

.text {
  color: white;
  flex: 1;
}

.text .step-title {
  opacity: 0.7;
  margin-bottom: 4px;
}

/* ============================================
   MOBILE STEPPER STYLES
   ============================================ */

.mobile-stepper-wrapper {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 12px 12px 12px;
}

/* On very small screens, reduce padding */
@media (max-width: 599px) {
  .mobile-stepper-wrapper {
    padding: 12px 8px 8px 8px;
  }
}

.mobile-stepper {
  background: transparent !important;
  box-shadow: none !important;
}

.mobile-stepper-header {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  gap: 4px;
}

.mobile-stepper-item {
  padding: 0 4px;
  flex: 1;
  min-width: 0;
}

/* Remove default Vuetify icon styling */
.mobile-stepper-header :deep(.v-stepper-item__avatar) {
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
}

/* Custom icon wrapper */
.mobile-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: all 0.3s ease;
}

/* Larger icons on tablets */
@media (min-width: 600px) and (max-width: 959px) {
  .mobile-icon-circle {
    width: 48px;
    height: 48px;
  }
}

/* Active step icon */
.mobile-icon-circle.active {
  background-color: #FFFFFF !important;
  transform: scale(1.05);
}

/* Icon image inside wrapper */
.mobile-icon-image {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1) !important; /* white like desktop inactive */
  transition: filter 0.3s ease;
}

/* Larger icons on tablets */
@media (min-width: 600px) and (max-width: 959px) {
  .mobile-icon-image {
    width: 22px;
    height: 22px;
  }
}

/* Active step icon - show in original color */
.mobile-icon-circle.active .mobile-icon-image {
  filter: brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(5747%) hue-rotate(218deg) brightness(97%) contrast(104%) !important;
}

/* Step title styling */
.mobile-stepper-header :deep(.v-stepper-item__title) {
  font-size: 11px !important;
  font-weight: 500 !important;
  color: rgba(255, 255, 255, 0.8) !important;
  margin-top: 6px !important;
  text-align: center;
  line-height: 1.2;
  white-space: normal;
  word-wrap: break-word;
}

/* Larger text on tablets */
@media (min-width: 600px) and (max-width: 959px) {
  .mobile-stepper-header :deep(.v-stepper-item__title) {
    font-size: 13px !important;
  }
}

/* Active step title - brighter */
.mobile-stepper-header :deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: #FFFFFF !important;
  font-weight: 500 !important;
}

/* Completed step title */
.mobile-stepper-header :deep(.v-stepper-item--complete .v-stepper-item__title) {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Divider styling */
.mobile-stepper-header :deep(.v-divider) {
  margin: 0 4px;
  align-self: center;
  flex: 0 1 auto;
  max-width: 40px;
  min-width: 20px;
  margin-top: -24px;
}

/* Divider colors */
.divider-complete {
  border-color: rgba(255, 255, 255, 0.6) !important;
  opacity: 1 !important;
}

.divider-incomplete {
  border-color: rgba(255, 255, 255, 0.3) !important;
  opacity: 1 !important;
}

/* Hide step subtitle on mobile to save space */
.mobile-step-title {
  display: inline-block;
  max-width: 100%;
}

/* Very small screens - ultra compact */
@media (max-width: 360px) {
  .mobile-icon-circle {
    width: 36px;
    height: 36px;
  }
  
  .mobile-icon-image {
    width: 16px;
    height: 16px;
  }
  
  .mobile-stepper-header :deep(.v-stepper-item__title) {
    font-size: 10px !important;
  }
}
</style>
