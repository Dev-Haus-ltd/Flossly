<template>
  <OnboardingPopup
    v-model="visible"
    :title="content.title"
    :subtitle="content.subtitle"
    icon="mdi-lock-outline"
    :primary-label="primaryLabel"
    secondary-label="Maybe later"
    @primary="handlePrimary"
    @secondary="visible = false"
    @close="visible = false"
  />
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  feature: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'start-trial', 'upgrade'])

const { track } = usePostHog()
const authStore = useAuthStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const CONTENT_MAP = {
  automation: {
    title: 'Automation is on Flossy CRM',
    subtitle: 'WhatsApp sequences, follow-ups, and instant responses — all run automatically on CRM.',
  },
  whatsapp: {
    title: 'WhatsApp messaging is on Flossy CRM',
    subtitle: 'Reach leads 3× faster and cut response time by 84% with WhatsApp messaging.',
  },
  patientBooking: {
    title: 'Patient booking is on Flossy CRM',
    subtitle: 'Book appointments directly from your lead pipeline with one click.',
  },
  taskPool: {
    title: 'Team task pool is on Flossy CRM',
    subtitle: 'Give your whole team shared task visibility and better collaboration.',
  },
}

const content = computed(
  () => CONTENT_MAP[props.feature] ?? { title: 'This feature is on Flossy CRM', subtitle: 'Upgrade to unlock the full Flossy experience.' }
)

const resolvedTier = computed(() => String(authStore.loggedUser?.licenseType || 'Lite').trim())
const canStartTrial = computed(() => {
  const billingCycle = authStore.loggedUser?.licenseBillingCycle || null
  const hasUsedTrial = Boolean(authStore.loggedUser?.hasUsedTrial)
  return resolvedTier.value === 'Lite' && !billingCycle && !hasUsedTrial
})

const primaryLabel = computed(() =>
  canStartTrial.value ? 'Try CRM free — no card needed' : 'Upgrade plan'
)

const handlePrimary = () => {
  visible.value = false
  track('upgrade_prompt_shown', { feature: props.feature, source: 'feature_lock_modal' })
  if (canStartTrial.value) {
    emit('start-trial')
    return
  }
  emit('upgrade')
}
</script>
