<!-- components/offline/index.vue -->
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
            <div class="icon-ellipse">
              <img 
                :src="isOnline ? onlineIconPath : offlineIconPath"
                :alt="isOnline ? 'Online' : 'Offline'"
                class="icon-image"
              />
            </div>

            <!-- Heading -->
            <h1 class="text-h5 font-weight-bold mb-4">Whoops</h1>

            <!-- Status Text -->
            <p class="text-style mb-6 px-2">
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
  const ok = await ping()
  isOnline.value = ok
  if (ok) {
    clearInterval(interval)
    // Add small delay before redirecting for better UX
    setTimeout(() => {
      restore()
    }, 500)
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
  line-height: 140%; /* matches Figma */
  letter-spacing: 0%; /* matches Figma */
  text-align: center; /* matches Figma */
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