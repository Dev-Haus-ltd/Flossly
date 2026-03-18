<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM Meta Analytics</p>
    </div>

    <div class="mt-5 px-5">
      <v-row align="stretch">
        <v-col v-for="(stat, i) in analyticsStats" :key="i" style="flex: 1 1 0; min-width: 0;">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"
            hide-chip
          />
        </v-col>
      </v-row>
    </div>

    <div class="mt-5 px-5">
      <v-sheet
        v-if="showDisconnectedBanner"
        class="mb-4 pa-4 disconnected-banner"
        color="#fff7ed"
        rounded="lg"
      >
        <p class="banner-title">No active Meta pages are connected.</p>
        <p class="banner-copy">
          Showing previously synced analytics for this organisation. Reconnect a Meta page and run sync to refresh the data.
        </p>
      </v-sheet>

      <div class="d-flex align-center mb-2" style="flex-wrap: nowrap; justify-content: space-between; overflow-x: auto;">
        <!-- Left: Search + Filters -->
        <div class="d-inline-flex align-center toolbar-wrapper" style="flex-wrap: nowrap;">
          <div style="width: 120px">
            <v-text-field
              v-model="search"
              placeholder="Search"
              clearable
              variant="solo"
              :elevation="0"
              density="compact"
              hide-details
              bg-color="#F3F4F6"
              flat
              class="custom-search"
            >
              <template #append-inner>
                <img :src="searchicon" alt="search icon" width="14" height="14" />
              </template>
            </v-text-field>
          </div>
          <CustomerRelationManagementMetaAnalyticsFilterMenu
            :loading="isFiltering"
            @update:filters="activeFilters = $event"
          />
        </div>

        <!-- Right: Sync Now -->
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isSyncing"
          :disabled="isSyncing"
          class="sync-btn"
          @click="resync"
        >
          <template #prepend>
            <v-icon size="18">mdi-sync</v-icon>
          </template>
          Sync Now
        </v-btn>
      </div>

      <v-row v-if="filteredCampaigns.length" class="campaign-grid">
        <v-col
          v-for="(campaign, index) in filteredCampaigns"
          :key="index"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="campaign-col"
        >
          <CustomerRelationManagementAnalyticsCard
            :platform="campaign.platform"
            :platform-icon="campaign.platformIcon"
            :title="campaign.title"
            :date="campaign.date"
            :description="campaign.description"
            :preview-image="campaign.previewImage"
            :has-video="campaign.hasVideo"
            :cost="campaign.cost"
            :impressions="campaign.impressions"
            :link-clicks="campaign.linkClicks"
            :reach="campaign.reach"
            :leads="campaign.leads"
            :cpl="campaign.cpl"
            :campaign-id="campaign.campaignId"
          />
        </v-col>
      </v-row>

      <v-sheet v-else class="pa-10 text-center" color="transparent">
        <p class="empty-state-title">{{ emptyStateTitle }}</p>
        <p class="text-grey empty-state-copy">{{ emptyStateCopy }}</p>
      </v-sheet>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useCrmStore } from '@/stores/crm';
import { useMainStore } from '@/stores';
import { useUser } from '@/composables/useUser';
import instagramIcon from '@/assets/crm/instagram.svg';
import facebookIcon from '@/assets/crm/facebook.svg';
import reference1 from '@/assets/crm/placeholder/reference-1.png';
import searchicon from '@/assets/icons/listView/serach-icon.svg';

const crmStore = useCrmStore();
const mainStore = useMainStore();
const { user } = useUser();
const search = ref('');
const isSyncing = ref(false);
const isFiltering = ref(false);
const activeFilters = ref({ platform: null, dateFrom: null, dateTo: null });
const currentOrgId = computed(() => Number(user.value?.currentLoggedInOrgId || 0) || null);
const metaConnection = ref({ count: 0, pages: [] });

let analyticsLoadPromise = null;
let analyticsLoadOrgId = null;

const buildFilterParams = () => {
  const f = activeFilters.value;
  const params = {};
  if (f.platform) params.platform = f.platform;
  if (f.dateFrom) params.dateFrom = new Date(f.dateFrom).toISOString().split('T')[0];
  if (f.dateTo) params.dateTo = new Date(f.dateTo).toISOString().split('T')[0];
  return params;
};

const hydrateMetaAnalytics = async ({ syncIfInsightsMissing = false, force = false } = {}) => {
  const orgId = currentOrgId.value;
  if (!orgId) return;

  if (!force && analyticsLoadPromise && analyticsLoadOrgId === orgId) {
    return analyticsLoadPromise;
  }

  analyticsLoadOrgId = orgId;
  analyticsLoadPromise = (async () => {
    try {
      const [connectionRes, structureRes, insightsRes] = await Promise.all([
        crmStore.connectionStatus(),
        crmStore.getMetaStructure(orgId, buildFilterParams()),
        crmStore.getMetaInsights(orgId),
        crmStore.getCampaignLeadCounts(orgId), // updates store; result intentionally unused here
      ]);

      if (currentOrgId.value === orgId && connectionRes?.code === 0 && connectionRes?.data) {
        metaConnection.value = connectionRes.data;
      }

      if (structureRes?.code !== 0) {
        mainStore.setSnackbar({
          type: 'error',
          color: 'error',
          title: 'Failed to load Meta analytics',
          subtitle: structureRes?.error || 'Could not fetch campaign data. Please try again.',
        });
        return;
      }

      const campaignCount = structureRes?.data?.campaigns?.length || 0;
      const insightCount = insightsRes?.data?.length || 0;

      if (
        syncIfInsightsMissing &&
        campaignCount > 0 &&
        insightCount === 0 &&
        currentOrgId.value === orgId
      ) {
        await crmStore.fetchMetaInsights({ days: 30 }, orgId);
      }
    } catch (err) {
      mainStore.setSnackbar({
        type: 'error',
        color: 'error',
        title: 'Failed to load Meta analytics',
        subtitle: err?.message || 'An unexpected error occurred. Please refresh the page.',
      });
    }
  })().finally(() => {
    if (analyticsLoadOrgId === orgId) {
      analyticsLoadPromise = null;
      analyticsLoadOrgId = null;
    }
  });

  return analyticsLoadPromise;
};

watch(
  currentOrgId,
  async (nextOrgId, prevOrgId) => {
    if (!nextOrgId) {
      crmStore.resetMetaAnalyticsState();
      return;
    }

    if (nextOrgId !== prevOrgId) {
      crmStore.resetMetaAnalyticsState();
    }

    await hydrateMetaAnalytics({ syncIfInsightsMissing: true });
  },
  { immediate: true }
);

// Re-fetch structure from backend whenever platform/date filters change
watch(
  activeFilters,
  async () => {
    const orgId = currentOrgId.value;
    if (!orgId) return;
    isFiltering.value = true;
    try {
      const res = await crmStore.getMetaStructure(orgId, buildFilterParams());
      if (res?.code !== 0) {
        mainStore.setSnackbar({
          type: 'error',
          color: 'error',
          title: 'Filter failed',
          subtitle: res?.error || 'Could not apply the selected filters. Please try again.',
        });
      }
    } catch (err) {
      mainStore.setSnackbar({
        type: 'error',
        color: 'error',
        title: 'Filter failed',
        subtitle: err?.message || 'An unexpected error occurred while filtering.',
      });
    } finally {
      isFiltering.value = false;
    }
  },
  { deep: true }
);

const resync = async () => {
  const orgId = currentOrgId.value;
  if (!orgId) return;
  if (isSyncing.value) return;
  if (analyticsLoadPromise && analyticsLoadOrgId === orgId) return analyticsLoadPromise;

  isSyncing.value = true;
  try {
    analyticsLoadOrgId = orgId;
    analyticsLoadPromise = (async () => {
      const prevCampaignCount = crmStore.metaCampaigns.length;
      const prevInsightCount = crmStore.metaInsights.length;

      const [structureRes, insightsRes] = await Promise.all([
        crmStore.fetchMetaStructure(orgId),
        crmStore.fetchMetaInsights({ days: 30 }, orgId),
      ]);
      await crmStore.getCampaignLeadCounts(orgId);

      const campaignCount = crmStore.metaCampaigns.length;
      const insightCount = crmStore.metaInsights.length;

      if (structureRes?.code !== 0 || insightsRes?.code !== 0) {
        throw new Error(
          insightsRes?.error ||
          structureRes?.error ||
          'Meta analytics sync failed'
        );
      }

      if (!campaignCount && !insightCount) {
        mainStore.setSnackbar({
          type: 'info',
          color: 'warning',
          title: 'Meta sync completed with no analytics data',
          subtitle: 'No campaigns or insights were returned for the last 30 days.',
        });
        return;
      }

      if (campaignCount > 0 && insightCount === 0) {
        mainStore.setSnackbar({
          type: 'info',
          color: 'warning',
          title: 'Meta campaigns synced, but no insights were returned',
          subtitle: 'Check the selected date range, account activity, or Meta attribution data.',
        });
        return;
      }

      const newCampaigns = campaignCount - prevCampaignCount;

      mainStore.setSnackbar({
        type: 'success',
        color: 'success',
        title: newCampaigns > 0 ? 'Meta analytics synced — new campaigns found' : 'Meta analytics synced',
        subtitle: newCampaigns > 0
          ? `+${newCampaigns} new campaign${newCampaigns === 1 ? '' : 's'} (${campaignCount} total). Insights updated for the last 30 days.`
          : `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} — insights updated for the last 30 days.`,
      });
    })();
    await analyticsLoadPromise;
  } catch (error) {
    mainStore.setSnackbar({
      type: 'error',
      color: 'error',
      title: 'Meta sync failed',
      subtitle: error?.message || 'Unable to refresh Meta analytics right now.',
    });
  } finally {
    if (analyticsLoadOrgId === orgId) {
      analyticsLoadPromise = null;
      analyticsLoadOrgId = null;
    }
    isSyncing.value = false;
  }
};

const stats = computed(() => crmStore.metaStats);

// Derive currency symbol from the first synced ad account.
// Falls back to £ since all current orgs are UK-based.
const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$' };
const currencySymbol = computed(() => {
  const currency = crmStore.metaAdAccounts?.[0]?.currency?.toUpperCase();
  return CURRENCY_SYMBOLS[currency] || '£';
});
const hasActiveMetaPages = computed(() => Number(metaConnection.value?.count || 0) > 0);
const hasHistoricalAnalytics = computed(() => crmStore.metaCampaigns.length > 0);
const showDisconnectedBanner = computed(() => !hasActiveMetaPages.value && hasHistoricalAnalytics.value);
const emptyStateTitle = computed(() =>
  hasActiveMetaPages.value
    ? 'No Meta analytics available yet'
    : 'No Meta pages connected'
);
const emptyStateCopy = computed(() =>
  hasActiveMetaPages.value
    ? 'Connect is already active, but no campaigns have been synced yet. Use Sync Now to fetch the latest analytics.'
    : 'Connect a Meta page for this organisation first. Once connected, run Sync Now to start importing campaign analytics.'
);

const analyticsStats = computed(() => {
  const sym = currencySymbol.value;
  return [
    {
      icon: 'https://cdn.lordicon.com/nocovwne.json',
      label: 'Number of Campaigns',
      value: String(stats.value.campaigns).padStart(2, '0'),
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Spend',
      value: `${sym}${(stats.value.spend / 100).toFixed(2)}`,
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Number of Leads',
      value: String(stats.value.leads).padStart(2, '0'),
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Impressions',
      value: stats.value.impressions.toLocaleString(),
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Reach',
      value: stats.value.reach.toLocaleString(),
    },
  ];
});

const campaigns = computed(() =>
  crmStore.metaCampaigns.map((campaign) => {
    const campaignInsights = crmStore.metaInsights.filter(
      (insight) => insight.entityType === 'campaign' && insight.entityId === campaign.campaignId
    );
    const campaignAdSetIds = crmStore.metaAdSets
      .filter((adSet) => adSet.campaignId === campaign.campaignId)
      .map((adSet) => adSet.adSetId);
    const ad = crmStore.metaAds.find((item) => campaignAdSetIds.includes(item.adSetId));

    const totalSpend = campaignInsights.reduce((acc, insight) => acc + Number(insight.spend || 0), 0);
    const totalImpressions = campaignInsights.reduce((acc, insight) => acc + Number(insight.impressions || 0), 0);
    const totalClicks = campaignInsights.reduce((acc, insight) => acc + Number(insight.clicks || 0), 0);
    // Reach is deduplicated — summing daily rows inflates it. Use the most recent day's value.
    const latestInsight = campaignInsights.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const totalReach = Number(latestInsight?.reach || 0);
    // Use CRM lead count for this campaign — single source of truth
    const crmLeads = Number(crmStore.metaCampaignLeadCounts[campaign.campaignId] || 0);
    const spendMajor = totalSpend / 100;
    const cpl = crmLeads > 0 ? spendMajor / crmLeads : 0;
    const sym = currencySymbol.value;

    return {
      campaignId: campaign.campaignId,
      platform: ad?.platform || 'Facebook',
      platformIcon: ad?.platform === 'Instagram' ? instagramIcon : facebookIcon,
      title: campaign.name || 'Untitled Campaign',
      date: new Date(campaign.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      rawDate: campaign.createdAt,
      description: ad?.body || 'No ad text description available.',
      previewImage: ad?.imageUrl || reference1,
      hasVideo: false,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      reach: totalReach,
      leads: crmLeads,
      cpl: cpl > 0 ? `${sym}${cpl.toFixed(2)}` : '—',
    };
  })
);

// Platform and date filters are applied server-side via getMetaStructure.
// Only text search runs client-side for real-time UX.
const filteredCampaigns = computed(() => {
  if (!search.value) return campaigns.value;
  const q = search.value.toLowerCase();
  return campaigns.value.filter(
    (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  );
});
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;

  p {
    font-size: 12px;
  }
}

.toolbar-wrapper {
  height: 46px;
  display: inline-flex;
  align-items: center;
}

.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  align-items: center;

  :deep(input::placeholder) {
    color: #737373;
    opacity: 1;
  }
}

.sync-btn {
  text-transform: none;
  font-size: 14px;
}

.disconnected-banner {
  border: 1px solid #fdba74;
}

.banner-title,
.empty-state-title {
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.banner-copy,
.empty-state-copy {
  margin: 0;
}

.campaign-grid {
  margin: -10px;
}

.campaign-col {
  padding: 10px !important;
}
</style>
