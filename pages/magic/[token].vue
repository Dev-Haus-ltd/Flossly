<template>
  <v-container class="full-height d-flex" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <template v-if="loading">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="mt-4 text-body-1">Logging you in...</p>
        </template>

        <template v-else-if="error">
          <v-icon color="error" size="48">mdi-alert-circle-outline</v-icon>
          <h2 class="mt-4">This link has expired or is invalid.</h2>
          <p class="text-body-2 mt-2">Magic links are valid for 30 minutes. Request a new one from the login page.</p>
          <v-btn class="mt-6" variant="flat" color="primary" @click="navigateToLogin">
            Back to Login
          </v-btn>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  const token = route.params.token
  if (!token) {
    error.value = true
    loading.value = false
    return
  }

  try {
    const res = await authStore.verifyMagicLink(token)
    if (res?.code === 0) {
      const setupComplete = res.data?.setupComplete ?? true
      const setupStepsCompleted = res.data?.setupStepsCompleted ?? 5
      if (!setupComplete || setupStepsCompleted < 5) {
        router.push('/onboarding')
      } else {
        router.push('/')
      }
    } else {
      error.value = true
      loading.value = false
    }
  } catch {
    error.value = true
    loading.value = false
  }
})

const navigateToLogin = () => router.push('/login')
</script>

<style scoped>
.full-height {
  height: 100vh;
}
</style>
