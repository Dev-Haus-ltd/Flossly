<!-- pages/offline.vue -->
<template>
  <div class="offline-container">
    <v-container class="h-screen d-flex align-center justify-center" fluid>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="pa-8 text-center" elevation="10" rounded="lg">
            <h2 class="text-h6 font-weight-bold mb-2">No Connection</h2>

            <p class="text-body2 text-grey-darken-1 mb-6">
              Unable to reach the internet. Retrying…
            </p>

            <v-progress-circular indeterminate size="34" color="primary" />

            <p class="text-caption text-grey-darken-1 mt-4">
              {{ status }}
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const status = ref('Checking…')
let interval = null

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
  status.value = 'Checking…'
  const ok = await ping()
  if (ok) {
    clearInterval(interval)
    restore()
  } else {
    status.value = 'Still offline'
  }
}

onMounted(() => {
  interval = setInterval(check, 2500)
  check()
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
.offline-container {
  min-height: 100vh;
  background: #fafafa;
}
</style>
