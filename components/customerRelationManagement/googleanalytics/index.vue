<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center"><p class="mr-1">Analytics</p></div>
    
    <!-- No Site Selected State -->
    <div v-if="!isConnected && !loadingConnection" class="connect-centered">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-google</v-icon>
      <p class="text-h6 mb-2">Connect Google First</p>
      <p class="text-caption text-medium-emphasis mb-4">Go to CRM Dashboard to connect your Google Search Console account</p>
      <v-btn color="primary" variant="flat" rounded="lg" @click="navigateToDashboard">
        <v-icon size="18" class="mr-2">mdi-arrow-right</v-icon>Go to Dashboard
      </v-btn>
    </div>

    <!-- Connected - Showing Analytics -->
    <template v-else>
      <!-- Stats Row (only when site selected) -->
      <div v-if="hasSiteSelected" class="mt-5 px-5">
        <v-row class="stat-row" align="stretch">
          <v-col style="flex: 1 1 0;">
            <CommonStatCard 
              icon="https://cdn.lordicon.com/asyunleq.json" 
              label="Clicks" 
              :value="String(totalStats.clicks)" 
              value-color="primary" 
              hide-chip 
            />
          </v-col>
          <v-col style="flex: 1 1 0;">
            <CommonStatCard 
              icon="https://cdn.lordicon.com/kphwxuxr.json" 
              label="Impressions" 
              :value="String(totalStats.impressions)" 
              value-color="success" 
              hide-chip 
            />
          </v-col>
          <v-col style="flex: 1 1 0;">
            <CommonStatCard 
              icon="https://cdn.lordicon.com/qlpudrww.json" 
              label="CTR" 
              :value="totalStats.ctr" 
              value-color="info" 
              hide-chip 
            />
          </v-col>
          <v-col style="flex: 1 1 0;">
            <CommonStatCard 
              icon="https://cdn.lordicon.com/excswhey.json" 
              label="Position" 
              :value="totalStats.position" 
              value-color="info" 
              hide-chip 
            />
          </v-col>
        </v-row>
      </div>

      <!-- Search + Control Buttons -->
      <div class="mt-5 px-5">
        <div class="d-flex align-center mb-2" style="justify-content: space-between;">
          <div v-if="hasSiteSelected" style="width: 150px">
            <v-text-field 
              v-model="searchQuery" 
              placeholder="Search" 
              append-inner-icon="mdi-magnify" 
              variant="solo" 
              density="compact" 
              hide-details 
              bg-color="#FAFAFA" 
              flat 
              @keyup.enter="onSearch" 
            />
          </div>
          <div v-else></div>

          <div class="d-inline-flex ml-auto" style="gap: 12px;">
            <v-btn 
              v-if="hasSiteSelected" 
              color="primary" 
              variant="flat" 
              rounded="lg" 
              disabled
            >
              <v-icon size="18" class="mr-2">mdi-plus-circle-outline</v-icon>
              Add New Links
            </v-btn>
            
            <!-- this button refresh is just for testing purposes. will be removed later 
            <v-btn
              v-if="hasSiteSelected"
              color="primary"
              variant="flat"
              rounded="lg"
              :loading="resyncing"
              @click="onResync"
            >
              <v-icon size="18" class="mr-2">mdi-refresh</v-icon>
              Refresh
            </v-btn> -->
          </div>
        </div>
      </div>

      <!-- Site Selection -->
      <div v-if="isConnected && !hasSiteSelected" class="px-5 mt-4">
        <SiteSelection 
          :sites="crmStore.googleSites"  
          :error="sitesError" 
          :saving="selectingSite" 
          @select="onSiteSelect" 
        />
      </div>

      <!-- Analytics View -->
      <div v-if="hasSiteSelected" class="px-5 mt-4">
        <AnalyticsView 
          :pages="crmStore.googleSitePages" 
          :pagination="crmStore.googleSitePagesPagination"  
          :error="crmStore.googleSitePagesError" 
          @page-change="onPageChange" 
        />
      </div>
    </template>
  </v-sheet>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import SiteSelection from './siteSelection.vue'
import AnalyticsView from './analyticsView.vue'

const route = useRoute()
const router = useRouter()
const crmStore = useCrmStore()
const mainStore = useMainStore()

// ========== STATE ==========
const loadingConnection = ref(true)
const isConnected = ref(false)
const loadingSites = ref(false)
const sitesError = ref('')
const selectingSite = ref(false)
const resyncing = ref(false)
const searchQuery = ref('')

// ========== COMPUTED ==========
const hasSiteSelected = computed(() => !!crmStore.selectedGoogleSite)

const totalStats = computed(() => {
  const pages = crmStore.googleSitePages || []
  let clicks = 0
  let impressions = 0
  let ctrSum = 0
  let posSum = 0
  let count = 0

  pages.forEach((p) => {
    clicks += Number(p.analytics?.totalClicks ?? 0)
    impressions += Number(p.analytics?.totalImpressions ?? 0)

    const ctr = Number(p.analytics?.avgCtr ?? 0)
    const pos = Number(p.analytics?.avgPosition ?? 0)
    if (ctr) {
      ctrSum += ctr
      count++
    }
    if (pos) {
      posSum += pos
    }
  })

  return {
    clicks,
    impressions,
    ctr: count ? ((ctrSum / count) * 100).toFixed(2) + '%' : '—',
    position: count ? (posSum / count).toFixed(1) : '—',
  }
})

// ========== METHODS ==========

/**
 * Check if Google is connected by getting connection status from store
 */
const checkConnection = async () => {
  loadingConnection.value = true

  try {
    const res = await crmStore.googleConnectionStatus()

    if (res?.code === 0 && res?.data?.connected) {
      isConnected.value = true

      if (res.data.selectedSite) {
        crmStore.selectedGoogleSite = res.data.selectedSite
        await loadPages()
      } else {
        await loadSites()
      }
    } else {
      isConnected.value = false
      crmStore.selectedGoogleSite = null
    }
  } catch (e) {
    console.error('Analytics - Connection check failed:', e)
    isConnected.value = false
    crmStore.selectedGoogleSite = null
    const msg = e?.data?.message || e?.message || 'Failed to check Google connection'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    loadingConnection.value = false
  }
}

/**
 * Load available Google Search Console sites
 */
const loadSites = async () => {
  loadingSites.value = true
  sitesError.value = ''

  try {
    const res = await crmStore.fetchGoogleSites()
    if (res?.code !== 0) {
      const msg = res?.error || 'Failed to load sites'
      sitesError.value = msg
      mainStore?.setSnackbar?.({ title: msg, type: 'error' })
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to load sites'
    sitesError.value = msg
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    loadingSites.value = false
  }
}

/**
 * Load pages/analytics data for selected site
 */
const loadPages = async (page = 1) => {
  if (!crmStore.selectedGoogleSite?.id) return
  await crmStore.getGoogleSitePages(crmStore.selectedGoogleSite.id, page, 50)
}

/**
 * Select a Google site and load its analytics
 */
const onSiteSelect = async (siteUrl) => {
  if (selectingSite.value) return
  selectingSite.value = true

  try {
    const filters = buildDefaultFilters()

    const res = await crmStore.selectGoogleSite(
      siteUrl,
      null,
      filters.startDate,
      filters.endDate,
      filters.country,
      filters.device
    )

    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: 'Site connected successfully', type: 'success' })
      await loadPages()
    } else {
      const msg = res?.message || res?.error || 'Failed to select site'
      sitesError.value = msg
      mainStore?.setSnackbar?.({ title: msg, type: 'error' })
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to select site'
    sitesError.value = msg
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    selectingSite.value = false
  }
}

/**
 * Resync analytics data for currently selected site
 */
const onResync = async () => {
  if (!crmStore.selectedGoogleSite?.id || resyncing.value) return

  resyncing.value = true

  try {
    const filters = buildDefaultFilters()

    const res = await crmStore.fetchGoogleSitePages(
      crmStore.selectedGoogleSite.id,
      filters.startDate,
      filters.endDate,
      filters.country,
      filters.device
    )

    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: 'Analytics refreshed', type: 'success' })
      await loadPages(1)
    } else {
      const msg = res?.message || res?.error || 'Failed to refresh analytics'
      mainStore?.setSnackbar?.({ title: msg, type: 'error' })
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to refresh analytics'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    resyncing.value = false
  }
}

/**
 * Search pages by query
 */
const onSearch = async () => {
  if (!crmStore.selectedGoogleSite?.id) return

  try {
    if (searchQuery.value.trim()) {
      const res = await crmStore.searchGoogleSitePages(
        crmStore.selectedGoogleSite.id,
        searchQuery.value.trim(),
        1,
        50
      )
      if (res?.code !== 0) {
        const msg = res?.message || res?.error || 'Search failed'
        mainStore?.setSnackbar?.({ title: msg, type: 'error' })
      }
    } else {
      await loadPages(1)
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Search failed'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  }
}

/**
 * Handle page changes in pagination
 */
const onPageChange = (page) => {
  loadPages(page)
}

/**
 * Navigate user to CRM Dashboard to connect Google
 */
const navigateToDashboard = () => {
  router.push('/crm')
}

/**
 * Build default date filters for analytics queries
 * Default: Last 30 days (excluding last 2 days for data accuracy)
 */
const buildDefaultFilters = () => {
  const today = new Date()

  const end = new Date()
  end.setDate(today.getDate() - 2)

  const start = new Date(end)
  start.setDate(end.getDate() - 29)

  const format = (d) => d.toISOString().split('T')[0]

  return {
    startDate: format(start),
    endDate: format(end),
    country: 'GBR',
    device: '',
  }
}

// ========== LIFECYCLE ==========
onMounted(async () => {
  await checkConnection()
})
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}

:deep(.v-breadcrumbs) {
  font-weight: 400;
  font-size: 14px;
}

.stats-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    gap: 8px;
  }
}

.loading-blank {
  min-height: 400px;
}

.business-page-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
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