<template>
  <div>
    <sign-up-setup-screen />
  </div>
</template>

<script setup>
const orgStore = useOrgStore()
const router = useRouter()

onMounted(() => {
  // /onboarding is only for "Add New Practice" from the sidebar.
  // Normal signups go to /setup. Guard against direct navigation.
  if (!orgStore.getIsNewPractice) {
    router.replace('/')
  }
})
</script>
