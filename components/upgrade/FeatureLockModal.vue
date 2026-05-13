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
    title: 'Patient booking is on Flossy Pro',
    subtitle: 'Manage patients, appointments, and finance in one place — available on the Pro plan.',
  },
  taskPool: {
    title: 'Team task pool is on Flossy CRM',
    subtitle: 'Give your whole team shared task visibility and better collaboration.',
  },
  taskBulkUpload: {
    title: 'Bulk task upload is on Flossy CRM',
    subtitle: 'Import task packs and scale workflows faster with CRM.',
  },
  leadBulkUpload: {
    title: 'Bulk lead upload is on Flossy CRM',
    subtitle: 'Import larger lead lists and manage growth from one place with CRM.',
  },
  googleAds: {
    title: 'Google Ads analytics is on Flossy Pro',
    subtitle: 'Track campaign performance and ROI across Google Ads directly inside Flossly.',
  },
}

const content = computed(
  () => CONTENT_MAP[props.feature] ?? { title: 'This feature is on Flossy CRM', subtitle: 'Upgrade to unlock the full Flossy experience.' }
)

// Features that require Pro — CRM trial won't unlock these
const PRO_ONLY_FEATURES = new Set(['patientBooking', 'googleAds'])

const resolvedTier = computed(() => String(authStore.loggedUser?.licenseType || 'Lite').trim())
const isProOnlyFeature = computed(() => PRO_ONLY_FEATURES.has(props.feature))

const canStartTrial = computed(() => {
  if (isProOnlyFeature.value) return false
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
