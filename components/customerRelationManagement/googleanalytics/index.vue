<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center"><p class="mr-1">Analytics</p></div>
    <!-- State 1: No Connection -->
    <div v-if="!isConnected && !loadingConnection" class="connect-centered">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-google</v-icon>
      <p class="text-h6 mb-2">Connect Your Google Account</p>
      <p class="text-caption text-medium-emphasis mb-4">Link your Google Search Console to view analytics</p>
      <v-btn color="primary" variant="flat" rounded="lg" :loading="connectingGoogle" @click="onConnectGoogle">
        <v-icon size="18" class="mr-2">mdi-link-variant</v-icon>Connect Google
      </v-btn>
    </div>
    <!-- Loading State -->
    <div v-else-if="loadingConnection" class="connect-centered">
      <v-progress-circular indeterminate size="32" /><p class="mt-3 text-medium-emphasis">Checking connection...</p>
    </div>
    <!-- Connected States -->
    <template v-else>
      <!-- Stats Row (only when site selected) -->
      <div v-if="hasSiteSelected" class="mt-5 px-5">
        <v-row class="stat-row" align="stretch">
          <v-col style="flex: 1 1 0;"><CommonStatCard icon="https://cdn.lordicon.com/asyunleq.json" label="Clicks" :value="String(totalStats.clicks)" value-color="primary" hide-chip /></v-col>
          <v-col style="flex: 1 1 0;"><CommonStatCard icon="https://cdn.lordicon.com/kphwxuxr.json" label="Impressions" :value="String(totalStats.impressions)" value-color="success" hide-chip /></v-col>
          <v-col style="flex: 1 1 0;"><CommonStatCard icon="https://cdn.lordicon.com/qlpudrww.json" label="CTR" :value="totalStats.ctr" value-color="info" hide-chip /></v-col>
          <v-col style="flex: 1 1 0;"><CommonStatCard icon="https://cdn.lordicon.com/excswhey.json" label="Position" :value="totalStats.position" value-color="info" hide-chip /></v-col>
        </v-row>
      </div>
      <!-- Search + Buttons -->
      <div class="mt-5 px-5">
        <div class="d-flex align-center mb-2" style="justify-content: space-between;">
          <div v-if="hasSiteSelected" style="width: 150px">
            <v-text-field v-model="searchQuery" placeholder="Search" append-inner-icon="mdi-magnify" variant="solo" density="compact" hide-details bg-color="#FAFAFA" flat @keyup.enter="onSearch" />
          </div>
          <div v-else></div>
          <div class="d-inline-flex ml-auto" style="gap: 12px;">
            <!-- NOT CONNECTED -->
            <v-btn
              v-if="!isConnected"
              color="primary"
              variant="flat"
              rounded="lg"
              :loading="connectingGoogle"
              @click="onConnectGoogle"
            >
              <v-icon size="18" class="mr-2">mdi-link-variant</v-icon>
              Connect Google
            </v-btn>

            <!-- CONNECTED -->
            <v-menu v-else offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="success"
                  variant="flat"
                  rounded="lg"
                >
                  <v-icon size="18" class="mr-2">mdi-check-circle</v-icon>
                  Connected
                  <v-icon size="18" class="ml-2">mdi-chevron-down</v-icon>
                </v-btn>
              </template>

              <v-list>
                <v-list-item @click="onDisconnectGoogle">
                  <v-list-item-title class="text-error">
                    <v-icon size="16" class="mr-2">mdi-logout</v-icon>
                    Disconnect
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn v-if="isConnected" variant="text" @click="showHealthDialog = true">
              <v-icon size="18" class="mr-2">mdi-heart-pulse</v-icon>Google Health
            </v-btn>
            <v-btn v-if="hasSiteSelected" color="primary" variant="flat" rounded="lg" disabled>
              <v-icon size="18" class="mr-2">mdi-plus-circle-outline</v-icon>Add New Links
            </v-btn>
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
            </v-btn>
          </div>
        </div>
      </div>
      <!-- Site Selection -->
      <div v-if="isConnected && !hasSiteSelected" class="px-5 mt-4">
        <SiteSelection :sites="crmStore.googleSites" :loading="loadingSites" :error="sitesError" :saving="selectingSite" @select="onSiteSelect" />
      </div>
      <!-- Analytics View -->
      <div v-if="hasSiteSelected" class="px-5 mt-4">
        <AnalyticsView :pages="crmStore.googleSitePages" :pagination="crmStore.googleSitePagesPagination" :loading="crmStore.googleSitePagesLoading" :error="crmStore.googleSitePagesError" @page-change="onPageChange" />
      </div>
    </template>
    <!-- Dialogs -->
    <GoogleHealthDialog v-model="showHealthDialog" :loading="loadingHealth" :data="healthData" />
    <v-dialog v-model="showErrorDialog" max-width="520">
      <v-card class="pa-4">
        <v-card-title class="text-subtitle-1 pa-0 mb-2">Google connection failed</v-card-title>
        <v-card-text class="pa-0">{{ errorMessage }}</v-card-text>
        <v-card-actions class="pa-0 mt-4"><v-spacer /><v-btn color="primary" variant="flat" @click="showErrorDialog = false">OK</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { useCrmStore } from '~/stores/crm';
import SiteSelection from './siteSelection.vue';
import AnalyticsView from './analyticsView.vue';
import GoogleHealthDialog from './googleHealthDialog.vue';
const route = useRoute();
const crmStore = useCrmStore();
const loadingConnection = ref(true);
const isConnected = ref(false);
const connectingGoogle = ref(false);
const disconnecting = ref(false);
const loadingSites = ref(false);
const sitesError = ref('');
const selectingSite = ref(false);
const resyncing = ref(false)
const showHealthDialog = ref(false);
const loadingHealth = ref(false);
const healthData = ref(null);
const showErrorDialog = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');
const hasSiteSelected = computed(() => !!crmStore.selectedGoogleSite);
const totalStats = computed(() => {
  const pages = crmStore.googleSitePages || [];
  let clicks = 0, impressions = 0, ctrSum = 0, posSum = 0, count = 0;
  pages.forEach(p => {
    clicks += Number(p.analytics?.totalClicks ?? 0);
    impressions += Number(p.analytics?.totalImpressions ?? 0);

    const ctr = Number(p.analytics?.avgCtr ?? 0);
    const pos = Number(p.analytics?.avgPosition ?? 0);
    if (ctr) { ctrSum += ctr; count++; }
    if (pos) { posSum += pos; }
  });
  return { clicks, impressions, ctr: count ? ((ctrSum / count) * 100).toFixed(2) + '%' : '—', position: count ? (posSum / count).toFixed(1) : '—' };
});

const transformHealthData = (data) => {
  if (!data || !data.connected) {
    return { connected: false };
  }

  const account = data.accounts?.[0];
  if (!account) {
    return { connected: false };
  }

  const now = new Date();
  const expires = account.expiresAt ? new Date(account.expiresAt) : null;

  return {
    connected: true,

    // Required by dialog
    email: account.email,
    tokenValid: expires ? expires > now : false,
    connectedAt: account.connectedAt,
    expiresAt: account.expiresAt,
    scopes: account.scopes || [],

    // Optional
    selectedSite: data.selectedSite || null
  };
};

const checkConnection = async () => {
  loadingConnection.value = true;
  try {
    const res = await crmStore.googleConnectionStatus();
    console.log('connection status response:', res);
    if (res?.code === 0 && res?.data?.connected) {
      isConnected.value = true; healthData.value = transformHealthData(res.data);
      if (res.data.selectedSite) { crmStore.selectedGoogleSite = res.data.selectedSite; await loadPages(); }
      else { await loadSites(); }
    } else { isConnected.value = false; }
  } catch { isConnected.value = false; }
  finally { loadingConnection.value = false; }
};
const loadSites = async () => {
  loadingSites.value = true; sitesError.value = '';
  try { const res = await crmStore.fetchGoogleSites(); if (res?.code !== 0) sitesError.value = res?.error || 'Failed to load sites'; }
  catch (e) { sitesError.value = e?.message || 'Failed to load sites'; }
  finally { loadingSites.value = false; }
};
const loadPages = async (page = 1) => { if (!crmStore.selectedGoogleSite?.id) return; await crmStore.getGoogleSitePages(crmStore.selectedGoogleSite.id, page, 50); };
const onConnectGoogle = async () => {
  connectingGoogle.value = true;
  try {
    const res = await crmStore.startGoogleAuth();
    if (res?.code === 0 && res?.data?.url) { window.location.href = res.data.url; }
    else { errorMessage.value = res?.error || 'Failed to start Google auth'; showErrorDialog.value = true; }
  } catch (e) { errorMessage.value = e?.message || 'Failed to start Google auth'; showErrorDialog.value = true; }
  finally { connectingGoogle.value = false; }
};
const onDisconnectGoogle = async () => {
  disconnecting.value = true;

  try {
    const tokenId = crmStore.googleConnection?.tokenId || null;

    const res = await crmStore.disconnectGoogle(tokenId);

    if (res?.code === 0) {
      isConnected.value = false;
      healthData.value = null;
    }
  } catch (e) {
    console.error('Disconnect failed:', e);
  } finally {
    disconnecting.value = false;
  }
};

const buildDefaultFilters = () => {
  const today = new Date()

  // End date = 2 days before today
  const end = new Date()
  end.setDate(today.getDate() - 2)

  // Start date = 30 days before end
  const start = new Date(end)
  start.setDate(end.getDate() - 29) // inclusive 30 days

  const format = (d) => d.toISOString().split('T')[0]

  return {
    startDate: format(start),
    endDate: format(end),
    country: 'GBR',   // UK
    device: ''       // all devices
  }
}

const onResync = async () => {
  if (!crmStore.selectedGoogleSite?.id) return

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
      await loadPages(1) // reload table after sync
    }

  } catch (e) {
    console.error('Manual resync failed:', e)
  } finally {
    resyncing.value = false
  }
}

const onSiteSelect = async (siteUrl) => {
  selectingSite.value = true

  try {
    const filters = buildDefaultFilters()

    const res = await crmStore.selectGoogleSite(
      siteUrl,
      crmStore.googleConnection?.tokenId || null,
      filters.startDate,
      filters.endDate,
      filters.country,
      filters.device
    )

    if (res?.code === 0) {
      await loadPages()
    } else {
      sitesError.value = res?.error || 'Failed to select site'
    }

  } catch (e) {
    sitesError.value = e?.message || 'Failed to select site'
  } finally {
    selectingSite.value = false
  }
}

const onPageChange = (page) => { loadPages(page); };
const onSearch = async () => {
  if (!crmStore.selectedGoogleSite?.id) return;
  if (searchQuery.value.trim()) { await crmStore.searchGoogleSitePages(crmStore.selectedGoogleSite.id, searchQuery.value.trim(), 1, 50); }
  else { await loadPages(1); }
};
const handleOAuthCallback = () => {
  const connected = route.query.google === 'connected';
  const error = route.query.error;
  if (connected) { checkConnection(); } else if (error) { errorMessage.value = decodeURIComponent(error); showErrorDialog.value = true; }
};
watch(showHealthDialog, async (val) => {
  if (val && !healthData.value) {
    loadingHealth.value = true;
    try { const res = await crmStore.googleConnectionStatus(); if (res?.code === 0) healthData.value = transformHealthData(res.data); } finally { loadingHealth.value = false; }
  }
});
onMounted(() => { handleOAuthCallback(); checkConnection(); });
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

/* Stats Container - Fill available space */
.stats-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 0; /* Allows flex items to shrink below their content size */
}

/* Responsive behavior */
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

/* Loading State - Blank */
.loading-blank {
  min-height: 400px;
  /* Just empty space while loading */
}

.business-page-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}

/* Connect centered state */
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
