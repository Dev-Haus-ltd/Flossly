<template>
  <div v-if="isLite && warningMessage && !isDismissed" class="mb-3">
    <v-alert
      type="warning"
      variant="tonal"
      closable
      class="usage-warning-banner"
      @click:close="dismiss"
    >
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <span v-html="warningMessage" />
        <v-btn
          variant="flat"
          color="warning"
          size="small"
          rounded="lg"
          @click="emit('start-trial')"
        >
          Try CRM free for 14 days
        </v-btn>
      </div>
    </v-alert>
  </div>
</template>

<script setup>
const emit = defineEmits(['start-trial'])

const { usage, isLite, isAtWarning, isDismissed, dismiss } = useUsageSummary()

const warningMessage = computed(() => {
  if (isAtWarning('leads')) {
    const u = usage.value?.leads
    return `You've captured <strong>${u?.current ?? 0}</strong> leads — your campaigns are working. You'll hit the free limit at <strong>${u?.max ?? 100}</strong>. Upgrade to CRM to keep going.`
  }
  if (isAtWarning('storageMB')) {
    const u = usage.value?.storageMB
    const usedGB = u ? (u.current / 1024).toFixed(1) : '0'
    const maxGB = u ? (u.max / 1024).toFixed(0) : '1'
    return `Documents are stacking up — you're at <strong>${usedGB} GB</strong> of your <strong>${maxGB} GB</strong> free storage. Upgrade for unlimited storage.`
  }
  if (isAtWarning('members')) {
    const u = usage.value?.members
    return `Your team is growing — you have <strong>${u?.current ?? 0}</strong> of <strong>${u?.max ?? 3}</strong> free seats used. Upgrade to add more team members.`
  }
  return null
})
</script>
