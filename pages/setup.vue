<template>
  <v-container class="setup-page d-flex align-center justify-center" fluid>
    <SetupWizard />
  </v-container>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.loggedUser) {
    await authStore.profile()
  }
  const prefs = authStore.loggedUser?.preferences?.[0]
  if (prefs?.setupComplete) {
    router.replace('/')
  }
})
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  background: #f5f7fa;
}
</style>
