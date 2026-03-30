<template>
  <AutomationPanel ref="panelRef" v-bind="$attrs" />
</template>

<script setup>
import AutomationPanel from '@/components/customerRelationManagement/automation/AutomationPanel.vue'

const panelRef = ref(null)

const refresh = async () => {
  if (panelRef.value?.refresh) {
    await panelRef.value.refresh()
  }
}

defineExpose({ refresh })
</script>
