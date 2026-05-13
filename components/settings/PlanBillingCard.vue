<template>
  <div class="pa-6">
    <p class="text-subtitle-1 font-weight-semibold mb-6">Plan &amp; Billing</p>

    <!-- Current plan -->
    <v-card rounded="lg" border elevation="0" class="mb-4">
      <v-card-text class="pa-5">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div>
            <div class="d-flex align-center gap-2 mb-1">
              <span class="text-h6 font-weight-bold">{{ planLabel }}</span>
              <v-chip size="x-small" :color="planColor" variant="flat" class="text-capitalize">
                {{ resolvedTier }}
              </v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ planDescription }}</p>
          </div>
          <v-btn
            v-if="resolvedTier === 'Lite' || isTrialAccess"
            color="#0061FB"
            variant="flat"
            rounded="lg"
            size="small"
            @click="emit('upgrade')"
          >
            Upgrade plan
          </v-btn>
          <v-btn
            v-else-if="hasStripeSubscription"
            variant="outlined"
            rounded="lg"
            size="small"
            @click="openPortal"
            :loading="portalLoading"
          >
            Manage billing
          </v-btn>
        </div>

        <!-- Renewal info -->
        <v-divider class="my-4" />
        <div class="d-flex align-center gap-6 flex-wrap">
          <div v-if="renewalDate">
            <p class="text-caption text-medium-emphasis mb-0">{{ resolvedTier === 'Lite' ? 'Free forever' : 'Renews on' }}</p>
            <p class="text-body-2 font-weight-medium mb-0">{{ resolvedTier === 'Lite' ? '—' : renewalDate }}</p>
          </div>
          <div>
            <p class="text-caption text-medium-emphasis mb-0">Billing cycle</p>
            <p class="text-body-2 font-weight-medium mb-0">{{ billingCycle }}</p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Usage summary -->
    <p class="text-subtitle-2 font-weight-semibold mb-3">Usage</p>
    <v-card rounded="lg" border elevation="0">
      <v-card-text class="pa-5">
        <div class="d-flex flex-column gap-4">
          <div v-for="item in usageItems" :key="item.label">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2">{{ item.label }}</span>
              <span class="text-body-2 font-weight-medium">
                {{ item.max === null ? 'Unlimited' : `${item.current} / ${item.max}` }}
              </span>
            </div>
            <v-progress-linear
              v-if="item.max !== null"
              :model-value="item.pct"
              :color="item.pct >= 100 ? 'error' : item.pct >= 80 ? 'warning' : '#0061FB'"
              bg-color="#e3eeff"
              rounded
              height="6"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Post } from '~/services/apiWrapper'

const emit = defineEmits(['upgrade'])
const authStore = useAuthStore()
const mainStore = useMainStore()

const LEGACY_MAP = { System: 'Pro', Trial: 'Lite', Drift: 'Lite', Glide: 'CRM', Soar: 'Pro' }
const licenseType = computed(() => authStore.loggedUser?.licenseType ?? 'Lite')
const resolvedTier = computed(() => LEGACY_MAP[licenseType.value] ?? licenseType.value)
const isTrialAccess = computed(() =>
  ['CRM', 'Pro'].includes(resolvedTier.value) &&
  !authStore.loggedUser?.licenseBillingCycle &&
  !!authStore.loggedUser?.licenseRenewalDate
)

const planLabel = computed(() => {
  if (isTrialAccess.value) return `${resolvedTier.value} Trial`
  const map = { Lite: 'Free Plan', CRM: 'CRM Plan', Pro: 'Pro Plan' }
  return map[resolvedTier.value] ?? resolvedTier.value
})
const planColor = computed(() => {
  const map = { Lite: 'default', CRM: 'primary', Pro: 'deep-purple' }
  return map[resolvedTier.value] ?? 'default'
})
const planDescription = computed(() => {
  if (isTrialAccess.value) {
    return '14-day trial access with up to 5 AI automation generations. Live WhatsApp connection requires a paid subscription.'
  }
  const map = {
    Lite: 'Up to 100 leads, 1 GB storage, 3 team members, 1 Meta page, 1 Instagram account, and 1 ad account.',
    CRM: 'Unlimited leads & storage, full CRM, WhatsApp & automations.',
    Pro: 'Everything in CRM plus Google Ads integration.',
  }
  return map[resolvedTier.value] ?? ''
})

const renewalDate = computed(() => {
  if (!authStore.loggedUser?.licenseRenewalDate) return null
  return new Date(authStore.loggedUser.licenseRenewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
})
const billingCycle = computed(() => {
  if (resolvedTier.value === 'Lite') return 'Free'
  if (isTrialAccess.value) return 'Trial'
  return authStore.loggedUser?.licenseBillingCycle ?? 'Monthly'
})

const { usage, isLite, fetchUsage } = useUsageSummary()
const usageItems = computed(() => {
  if (!isLite.value) {
    return [
      { label: 'Leads', current: null, max: null, pct: 0 },
      { label: 'Storage', current: null, max: null, pct: 0 },
      { label: 'Team members', current: null, max: null, pct: 0 },
      { label: 'Lead forms', current: null, max: null, pct: 0 },
    ]
  }

  return [
    {
      label: 'Leads',
      current: usage.value?.leads?.current ?? 0,
      max: usage.value?.leads?.max ?? null,
      pct: usage.value?.leads?.max ? (usage.value.leads.current / usage.value.leads.max) * 100 : 0,
    },
    {
      label: 'Storage',
      current: usage.value?.storageMB ? `${(usage.value.storageMB.current / 1024).toFixed(1)} GB` : '0 GB',
      max: usage.value?.storageMB?.max ? `${(usage.value.storageMB.max / 1024).toFixed(0)} GB` : null,
      pct: usage.value?.storageMB?.max ? (usage.value.storageMB.current / usage.value.storageMB.max) * 100 : 0,
    },
    {
      label: 'Team members',
      current: usage.value?.members?.current ?? 0,
      max: usage.value?.members?.max ?? null,
      pct: usage.value?.members?.max ? (usage.value.members.current / usage.value.members.max) * 100 : 0,
    },
    {
      label: 'Lead forms',
      current: usage.value?.forms?.current ?? 0,
      max: usage.value?.forms?.max ?? null,
      pct: usage.value?.forms?.max ? (usage.value.forms.current / usage.value.forms.max) * 100 : 0,
    },
  ]
})

onMounted(() => {
  fetchUsage()
})

watch(isLite, () => {
  fetchUsage()
})

const hasStripeSubscription = computed(() => resolvedTier.value !== 'Lite' && !isTrialAccess.value)
const portalLoading = ref(false)
const openPortal = async () => {
  portalLoading.value = true
  try {
    const res = await Post('/stripe/portal', { returnUrl: window.location.href })
    if (res?.data?.url) window.location.href = res.data.url
  } catch {
    mainStore.setSnackbar({ message: 'Could not open billing portal', color: 'error' })
  } finally {
    portalLoading.value = false
  }
}
</script>
