<template>
  <OnboardingPopup
    v-model="visible"
    :title="title"
    :subtitle="subtitle"
    icon="mdi-party-popper"
    primary-label="Got it!"
    secondary-label="Take a tour →"
    @primary="visible = false"
    @secondary="goToCrm"
    @close="visible = false"
  />
</template>

<script setup>
import { useAppTour } from '@/composables/useAppTour'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  trialEndDate: { type: String, default: '' },
  tier: { type: String, default: 'CRM' },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { startCrmUpgradeTour } = useAppTour()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const formattedDate = computed(() => {
  if (!props.trialEndDate) return ''
  try {
    return new Date(props.trialEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return props.trialEndDate
  }
})

const title = computed(() => `Your 14-day ${props.tier} trial has started!`)

const subtitle = computed(() =>
  `You now have full access to Flossy ${props.tier}${formattedDate.value ? ` until ${formattedDate.value}` : ''}. No card needed — you'll only be asked for payment if you decide to continue after your trial.<br><br>` +
  `<strong>Included in trial:</strong> Automation · Unlimited leads<br><strong>Paid CRM/Pro only:</strong> WhatsApp messaging<br><strong>Upgrade to Pro to unlock:</strong> Patient booking · Finance · Google Ads`
)

const goToCrm = async () => {
  visible.value = false
  await router.push('/crm')
  setTimeout(() => startCrmUpgradeTour(), 800)
}
</script>
