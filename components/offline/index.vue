@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 25, 82, 0.4);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 15px rgba(23, 25, 82, 0);
  }
}

@keyframes pulseNoGlow {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}<!-- components/offline/index.vue -->
<template>
  <div 
    class="offline-container"
    :style="{ backgroundImage: `url('${bgImagePath}')` }"
  >
    <v-container class="h-screen d-flex align-center justify-center" fluid>
      <v-row justify="center" align="center" class="w-100">
        <v-col cols="12" sm="10" md="6" lg="4" class="d-flex justify-center">
          <v-card 
            class="pa-8 pa-sm-6 text-center w-100" 
            elevation="8" 
            rounded="lg"
          >
            <!-- Icon Container -->
            <div 
              class="icon-ellipse" 
              :class="[isRetrying || isChecking ? 'pulse-icon' : '', isOnline ? 'success-pulse' : '']"
              :key="`icon-${isRetrying}-${isChecking}-${isOnline}`"
            >
              <img 
                :src="isOnline ? onlineIconPath : offlineIconPath"
                :alt="isOnline ? 'Online' : 'Offline'"
                class="icon-image"
                :class="[isRetrying || isChecking ? 'icon-spin' : '', isOnline ? 'bounce-success' : '']"
                :key="`image-${isRetrying}-${isChecking}-${isOnline}`"
              />
            </div>

            <!-- Heading -->
            <h1 
              class="text-h5 font-weight-bold mb-4" 
              :class="[isRetrying || isChecking ? 'fade-text' : '', isOnline ? 'success-text' : '']"
              :key="`heading-${isRetrying}-${isChecking}-${isOnline}`"
            >
              {{ isOnline ? 'Connected!' : 'Whoops' }}
            </h1>

            <!-- Status Text -->
            <p 
              class="text-style mb-6 px-2" 
              :class="[isRetrying || isChecking ? 'fade-text' : '', isOnline ? 'success-text' : '']"
              :key="`status-${isRetrying}-${isChecking}-${isOnline}`"
            >
              {{ statusMessage }}
            </p>

            <!-- Retry Button (shown only when offline) -->
            <v-btn
              v-if="!isOnline"
              @click="manualRetry"
              color="primary"
              variant="flat"
              class="mb-2"
              rounded="lg" size="x-large"
              :loading="isRetrying"
            >
              Retry Connection
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Image paths - replace these with your actual paths
const bgImagePath = ref('/offline/offline-bg.svg')
const onlineIconPath = ref('/offline/online.svg')
const offlineIconPath = ref('/offline/offline.svg')

// State
const isOnline = ref(false)
const isRetrying = ref(false)
const isChecking = ref(true)
let interval = null

// Computed status message
const statusMessage = computed(() => {
  if (isOnline.value) {
    return 'Internet Connection found. redirecting back.'
  }
  return 'No internet Connection found. Check your connection or try again.'
})

const getLastRoute = () => {
  try {
    return localStorage.getItem('lastRoute') || '/'
  } catch {
    return '/'
  }
}

const ping = async () => {
  try {
    const res = await fetch('/', { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

const restore = async () => {
  const route = getLastRoute()
  try {
    await router.replace(route)
  } catch {
    window.location.href = route
  }
}

const check = async () => {
  isChecking.value = true
  const ok = await ping()
  isOnline.value = ok
  isChecking.value = false
  if (ok) {
    clearInterval(interval)
    // Add small delay before redirecting for better UX
    setTimeout(() => {
      restore()
    }, 1000)
  }
}

const manualRetry = async () => {
  isRetrying.value = true
  await check()
  isRetrying.value = false
}

onMounted(() => {
  // Initial check
  check()
  // Poll every 2500ms
  interval = setInterval(check, 2500)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
/* Keyframe animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.offline-container {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-ellipse {
  width: 153px;
  height: 153px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50px;
  border-radius: 50%;
  background-color: #171952;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  transition: all 0.3s ease;
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.text-style {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 20px;
  line-height: 140%;
  letter-spacing: 0%;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .icon-ellipse {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 400px) {
  .icon-ellipse {
    width: 80px;
    height: 80px;
  }
}

/* Full height utilities */
.h-screen {
  min-height: 100vh;
}

.w-100 {
  width: 100%;
}
</style>

<style>
/* Global styles - outside scoped to ensure animations work properly */

/* Keyframe animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 25, 82, 0.4);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 15px rgba(23, 25, 82, 0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Global animation classes */
.card-checking {
  animation: slideUp 0.6s ease-out !important;
}

.pulse-icon {
  animation: pulse 1.5s ease-in-out infinite !important;
}

.icon-spin {
  animation: spin 1.2s linear infinite !important;
}

.fade-text {
  animation: fadeInOut 1.2s ease-in-out infinite !important;
}

/* Success animations */
@keyframes successGlow {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 25, 82, 0.7);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 20px rgba(23, 25, 82, 0);
  }
}

@keyframes bounceSuccess {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(360deg);
  }
}

@keyframes slideInText {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-pulse {
  animation: successGlow 2s ease-out !important;
}

.bounce-success {
  animation: bounceSuccess 1.2s ease-out !important;
}

.success-text {
  animation: slideInText 1s ease-out !important;
}
</style>