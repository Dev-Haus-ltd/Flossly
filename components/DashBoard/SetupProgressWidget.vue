<template>
  <v-card v-if="show" rounded="lg" elevation="0" class="setup-widget mb-4 pa-4" border>
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <p class="text-subtitle-2 font-weight-semibold mb-0">Get started with Flossy</p>
        <p class="text-caption text-medium-emphasis">{{ stepsCompleted }} of {{ SETUP_TOTAL_STEPS }} steps complete</p>
      </div>
      <v-btn variant="flat" color="#0061FB" size="small" rounded="lg" @click="goToSetup">Continue setup</v-btn>
    </div>
    <v-progress-linear
      :model-value="progress"
      color="#0061FB"
      bg-color="#e3eeff"
      rounded
      height="6"
    />
  </v-card>
</template>

<script setup>
import { SETUP_TOTAL_STEPS } from '@shared/defaults/setup.js'

const router = useRouter()
const authStore = useAuthStore()

const prefs = computed(() => authStore.loggedUser?.preferences?.[0])
const stepsCompleted = computed(() => prefs.value?.setupStepsCompleted ?? 0)
const show = computed(() => !(prefs.value?.setupComplete))
const progress = computed(() => (stepsCompleted.value / SETUP_TOTAL_STEPS) * 100)

const goToSetup = () => {
  const nextStep = Math.min(stepsCompleted.value + 1, SETUP_TOTAL_STEPS)
  router.push(`/setup?step=${nextStep}`)
}
</script>
