<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Google Ads Analytics</p>
    </div>

    <!-- No Google Account Connected State -->
    <div v-if="!isConnected && !loading" class="connect-centered">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-google-ads</v-icon>
      <p class="text-h6 mb-2">Connect Google Ads First</p>
      <p class="text-caption text-medium-emphasis mb-4">Go to CRM Dashboard to connect your Google account with Ads permissions</p>
      <v-btn color="primary" variant="flat" rounded="lg" @click="navigateToDashboard">
        <v-icon size="18" class="mr-2">mdi-arrow-right</v-icon>Go to Dashboard
      </v-btn>
    </div>

    <!-- Connected - Main Flow -->
    <template v-else>
      <div v-if="loading && !hasAccountSelected" class="d-flex align-center justify-center flex-column" style="min-height: 400px;">
        <v-progress-circular indeterminate color="primary" class="mb-4" />
        <p class="text-caption text-medium-emphasis">Fetching account details...</p>
      </div>

      <template v-else>
        <!-- Account Selection State -->
        <div v-if="!hasAccountSelected" class="px-5 mt-4">
          <SelectAdsAccount 
            :customers="crmStore.googleAdsCustomers"
            :loading="loadingCustomers"
            :error="adsError"
            :selecting="selectingAccount"
            @select="onAccountSelect"
          />
        </div>

        <!-- Performance Dashboard State -->
        <div v-else class="px-5 mt-4">
          <AdsPerformance 
            :account="crmStore.selectedGoogleAdsAccount"
            :performance="crmStore.googleAdsPerformance"
            :loading="crmStore.googleAdsLoading"
            :error="crmStore.googleAdsError"
            @refresh="loadPerformance"
            @change-account="onResetAccount"
          />
        </div>
      </template>
    </template>
  </v-sheet>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import SelectAdsAccount from './selectAdsAccount.vue'
import AdsPerformance from './adsPerformance.vue'

const router = useRouter()
const crmStore = useCrmStore()
const mainStore = useMainStore()

const loading = ref(true)
const isConnected = ref(false)
const loadingCustomers = ref(false)
const selectingAccount = ref(false)
const adsError = ref('')

const hasAccountSelected = computed(() => !!crmStore.selectedGoogleAdsAccount)

const checkConnection = async () => {
  loading.value = true
  try {
    const res = await crmStore.googleConnectionStatus()
    if (res?.code === 0 && res?.data?.connected && res?.data?.hasGoogleAds) {
      isConnected.value = true
      if (!res.data.selectedAdsAccount) {
        await loadCustomers()
      } else {
        await loadPerformance()
      }
    } else {
      isConnected.value = false
    }
  } catch (e) {
    console.error('Ads - Connection check failed:', e)
    isConnected.value = false
    mainStore?.setSnackbar?.({ title: 'Failed to verify Google connection', type: 'error' })
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  loadingCustomers.value = true
  adsError.value = ''
  try {
    const res = await crmStore.fetchGoogleAdsCustomers()
    if (res?.code !== 0) {
      adsError.value = res?.error || 'Failed to fetch Ads accounts'
    }
  } catch (e) {
    adsError.value = 'Error loading Ads accounts'
  } finally {
    loadingCustomers.value = false
  }
}

const loadPerformance = async () => {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)

    const format = (d) => d.toISOString().split('T')[0]
    
    await crmStore.getGoogleAdsPerformance({
      startDate: format(start),
      endDate: format(end)
    })
  } catch (e) {
    console.error('Failed to load performance:', e)
  }
}

const onAccountSelect = async (customerId) => {
  if (selectingAccount.value) return
  selectingAccount.value = true
  try {
    const res = await crmStore.selectGoogleAdsAccount(customerId)
    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: 'Account selected successfully', type: 'success' })
      await loadPerformance()
    } else {
      mainStore?.setSnackbar?.({ title: res?.error || 'Failed to select account', type: 'error' })
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: 'Error selecting account', type: 'error' })
  } finally {
    selectingAccount.value = false
  }
}

const onResetAccount = () => {
  // Clear selected account
  crmStore.selectedGoogleAdsAccount = null
  loadCustomers()
}

const navigateToDashboard = () => {
  router.push('/crm')
}

onMounted(() => {
  checkConnection()
})
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 14px;
    font-weight: 600;
    color: #171952;
  }
}

.connect-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 48px 24px;
}
</style>
