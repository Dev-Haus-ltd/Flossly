<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p
        class="mr-1"
        :style="drill.level > 0 ? 'color: #0061FB; cursor: pointer;' : ''"
        @click="drillBack(0)"
      >CRM Meta Analytics</p>
      <template v-if="drill.level > 0">
        <span class="header-sep"> / </span>
        <p
          :style="drill.level > 1 ? 'color: #0061FB; cursor: pointer;' : ''"
          @click="drill.level > 1 ? drillBack(1) : null"
        >{{ drill.campaign?.title }}</p>
      </template>
      <template v-if="drill.level > 1">
        <span class="header-sep"> / </span>
        <p>{{ drill.adSet?.title }}</p>
      </template>
    </div>

    <div class="mt-5 px-5">
      <v-row align="stretch">
        <v-col v-for="(stat, i) in currentStats" :key="i" style="flex: 1 1 0; min-width: 0;">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"
            :select="stat.select"
            :select-items="stat.selectItems || []"
            hide-chip
            @update:select="(v) => onCardSelect(i, v)"
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
      <p v-if="insightsCoverageLabel" class="insights-coverage mb-3">
        {{ insightsCoverageLabel }}
      </p>

      <v-row v-if="displayCards.length" class="campaign-grid" align="stretch">
        <v-col
          v-for="(card, index) in displayCards"
          :key="card.id || index"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="campaign-col d-flex"
        >
          <CustomerRelationManagementAnalyticsCard
            :platform="card.platform"
            :platform-icon="card.platformIcon"
            :title="card.title"
            :date="card.date"
            :description="card.description"
            :preview-image="card.previewImage"
            :has-video="card.hasVideo"
            :video-id="card.videoId"
            :status="card.status"
            :cost="card.cost"
            :impressions="card.impressions"
            :link-clicks="card.linkClicks"
            :reach="card.reach"
            :leads="card.leads"
            :cpl="card.cpl"
            :campaign-id="card.campaignId ?? null"
            :ad-set-id="card.adSetId ?? null"
            :ad-id="card.adId ?? null"
            :drill-label="card.drillLabel"
            @drill="onDrill(card)"
          />
        </v-col>
      </v-row>

      <v-sheet v-else class="pa-10 text-center" color="transparent">
        <p class="empty-state-title">{{ drillEmptyTitle }}</p>
        <p class="text-grey empty-state-copy">{{ drillEmptyCopy }}</p>
      </v-sheet>
    </div>

    <!-- Spend date range picker dialog -->
    <v-dialog v-model="showSpendDateRange" max-width="360" persistent>
      <v-card rounded="xl" class="pa-4">
        <p class="font-weight-bold mb-3" style="font-size:15px">Total Spend — Date Range</p>
        <v-text-field
          v-model="spendDateFrom"
          label="From"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />
        <v-text-field
          v-model="spendDateTo"
          label="To"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-4"
        />
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="showSpendDateRange = false; spendPeriod = 'This month'">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!spendDateFrom || !spendDateTo" @click="confirmSpendDateRange">Apply</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Leads date range picker dialog -->
    <v-dialog v-model="showLeadsDateRange" max-width="360" persistent>
      <v-card rounded="xl" class="pa-4">
        <p class="font-weight-bold mb-3" style="font-size:15px">Number of Leads — Date Range</p>
        <v-text-field
          v-model="leadsDateFrom"
          label="From"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />
        <v-text-field
          v-model="leadsDateTo"
          label="To"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-4"
        />
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="showLeadsDateRange = false; leadsPeriod = 'This month'">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!leadsDateFrom || !leadsDateTo" @click="confirmLeadsDateRange">Apply</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Impressions date range picker dialog -->
    <v-dialog v-model="showImpressionsDateRange" max-width="360" persistent>
      <v-card rounded="xl" class="pa-4">
        <p class="font-weight-bold mb-3" style="font-size:15px">Total Impressions — Date Range</p>
        <v-text-field
          v-model="impressionsDateFrom"
          label="From"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />
        <v-text-field
          v-model="impressionsDateTo"
          label="To"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-4"
        />
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="showImpressionsDateRange = false; impressionsPeriod = 'This month'">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!impressionsDateFrom || !impressionsDateTo" @click="confirmImpressionsDateRange">Apply</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Reach date range picker dialog -->
    <v-dialog v-model="showReachDateRange" max-width="360" persistent>
      <v-card rounded="xl" class="pa-4">
        <p class="font-weight-bold mb-3" style="font-size:15px">Total Reach — Date Range</p>
        <v-text-field
          v-model="reachDateFrom"
          label="From"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />
        <v-text-field
          v-model="reachDateTo"
          label="To"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-4"
        />
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="showReachDateRange = false; reachPeriod = 'This month'">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!reachDateFrom || !reachDateTo" @click="confirmReachDateRange">Apply</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useCrmStore } from '@/stores/crm';
import { useMainStore } from '@/stores';
import { useUser } from '@/composables/useUser';
import crmService from '@/services/crmService';
import instagramIcon from '@/assets/crm/instagram.svg';
import facebookIcon from '@/assets/crm/facebook.svg';
import reference1 from '@/assets/crm/placeholder/reference-1.png';
import searchicon from '@/assets/icons/listView/serach-icon.svg';

const crmStore = useCrmStore();
const mainStore = useMainStore();
const { user } = useUser();
const search = ref('');
const isSyncing = ref(false);
const activeFilters = ref({ platform: null, dateFrom: null, dateTo: null });
const currentOrgId = computed(() => Number(user.value?.currentLoggedInOrgId || 0) || null);
const metaConnection = ref({ count: 0, pages: [] });
const INSIGHTS_SYNC_DAYS = 30;

// Stat card per-card filter state
const campaignStatusFilter = ref('All')
const spendPeriod = ref('This month')
const spendDateFrom = ref(null)
const spendDateTo = ref(null)
const showSpendDateRange = ref(false)
const leadsPeriod = ref('This month')
const leadsDateFrom = ref(null)
const leadsDateTo = ref(null)
const showLeadsDateRange = ref(false)
const statSpend = ref(0)
const statLeads = ref(0)
const statSpendLoading = ref(false)
const statLeadsLoading = ref(false)
const impressionsPeriod = ref('This month')
const impressionsDateFrom = ref(null)
const impressionsDateTo = ref(null)
const showImpressionsDateRange = ref(false)
const reachPeriod = ref('This month')
const reachDateFrom = ref(null)
const reachDateTo = ref(null)
const showReachDateRange = ref(false)

const toYmd = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value, endOfDay = false) => {
  if (!value) return null;
  if (value instanceof Date) {
    const d = new Date(value);
    d.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return d;
  }
  if (typeof value === 'string') {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`
      : value;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      d.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    }
    return d;
  }
  return null;
};

const getPeriodDates = (period, from = null, to = null) => {
  const now = new Date();
  if (period === 'This week') {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    return { dateFrom: toYmd(monday), dateTo: toYmd(now) };
  }
  if (period === 'This month') {
    return {
      dateFrom: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo: toYmd(now),
    };
  }
  if (from && to) {
    return {
      dateFrom: toYmd(from),
      dateTo: toYmd(to),
    };
  }
  return {};
};

const formatDateRangeLabel = (from, to) => {
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(from)} - ${fmt(to)}`;
};

const loadStatSpend = async () => {
  const params = getPeriodDates(spendPeriod.value, spendDateFrom.value, spendDateTo.value);
  if (!params.dateFrom) return;
  statSpendLoading.value = true;
  try {
    const res = await crmService.getMetaInsights(params);
    if (res?.code === 0) {
      const campaignInsights = (res.data || []).filter(i => i.entityType === 'campaign');
      statSpend.value = campaignInsights.reduce((sum, i) => sum + Number(i.spend || 0), 0);
    }
  } finally {
    statSpendLoading.value = false;
  }
};

const loadStatLeads = async () => {
  const params = getPeriodDates(leadsPeriod.value, leadsDateFrom.value, leadsDateTo.value);
  if (!params.dateFrom) return;
  statLeadsLoading.value = true;
  try {
    const res = await crmService.getAllLeadCounts(params);
    if (res?.code === 0) {
      statLeads.value = Object.values(res.data?.byCampaign || {}).reduce((sum, n) => sum + Number(n), 0);
    }
  } finally {
    statLeadsLoading.value = false;
  }
};

const impressionsPeriodInsights = computed(() => {
  const { dateFrom, dateTo } = getPeriodDates(impressionsPeriod.value, impressionsDateFrom.value, impressionsDateTo.value);
  const fromDate = dateFrom ? parseLocalDate(dateFrom, false) : null;
  const toDate = dateTo ? parseLocalDate(dateTo, true) : null;
  return crmStore.metaInsights.filter((i) => {
    if (i.entityType !== 'campaign') return false;
    const rowDate = parseLocalDate(i.date, false);
    if (!rowDate) return false;
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });
});
const statImpressions = computed(() =>
  impressionsPeriodInsights.value.reduce((sum, i) => sum + Number(i.impressions || 0), 0)
);

const reachPeriodInsights = computed(() => {
  const { dateFrom, dateTo } = getPeriodDates(reachPeriod.value, reachDateFrom.value, reachDateTo.value);
  const fromDate = dateFrom ? parseLocalDate(dateFrom, false) : null;
  const toDate = dateTo ? parseLocalDate(dateTo, true) : null;
  return crmStore.metaInsights.filter((i) => {
    if (i.entityType !== 'campaign') return false;
    const rowDate = parseLocalDate(i.date, false);
    if (!rowDate) return false;
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });
});
const statReach = computed(() => sumLatestReachByEntity(reachPeriodInsights.value));

const confirmImpressionsDateRange = () => {
  showImpressionsDateRange.value = false
  impressionsPeriod.value = formatDateRangeLabel(impressionsDateFrom.value, impressionsDateTo.value)
}
const confirmReachDateRange = () => {
  showReachDateRange.value = false
  reachPeriod.value = formatDateRangeLabel(reachDateFrom.value, reachDateTo.value)
}

const onCardSelect = (index, value) => {
  if (index === 0) {
    campaignStatusFilter.value = value
    return
  }
  if (index === 1) {
    if (value === 'Date range') { showSpendDateRange.value = true; return }
    spendPeriod.value = value
    spendDateFrom.value = null
    spendDateTo.value = null
    loadStatSpend()
    return
  }
  if (index === 2) {
    if (value === 'Date range') { showLeadsDateRange.value = true; return }
    leadsPeriod.value = value
    leadsDateFrom.value = null
    leadsDateTo.value = null
    loadStatLeads()
    return
  }
  if (index === 3) {
    if (value === 'Date range') { showImpressionsDateRange.value = true; return }
    impressionsPeriod.value = value
    impressionsDateFrom.value = null
    impressionsDateTo.value = null
    return
  }
  if (index === 4) {
    if (value === 'Date range') { showReachDateRange.value = true; return }
    reachPeriod.value = value
    reachDateFrom.value = null
    reachDateTo.value = null
  }
}

const confirmSpendDateRange = () => {
  showSpendDateRange.value = false
  spendPeriod.value = formatDateRangeLabel(spendDateFrom.value, spendDateTo.value)
  loadStatSpend()
}

const confirmLeadsDateRange = () => {
  showLeadsDateRange.value = false
  leadsPeriod.value = formatDateRangeLabel(leadsDateFrom.value, leadsDateTo.value)
  loadStatLeads()
}

// Drill-down state: level 0 = campaigns, 1 = ad sets, 2 = ads
const drill = reactive({ level: 0, campaign: null, adSet: null });

const drillBack = (toLevel) => {
  drill.level = toLevel;
  if (toLevel < 2) drill.adSet = null;
  if (toLevel < 1) drill.campaign = null;
};

const onDrill = (card) => {
  if (drill.level === 0) {
    drill.campaign = card;
    drill.level = 1;
  } else if (drill.level === 1) {
    drill.adSet = card;
    drill.level = 2;
  }
};

let analyticsLoadPromise = null;
let analyticsLoadOrgId = null;

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
        crmStore.getMetaStructure(orgId),
        crmStore.getMetaInsights(orgId),
        crmStore.getAllLeadCounts(orgId), // updates store; result intentionally unused here
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
        await crmStore.fetchMetaInsights({ days: INSIGHTS_SYNC_DAYS }, orgId);
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
    loadStatSpend();
    loadStatLeads();
  },
  { immediate: true }
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
        crmStore.fetchMetaInsights({ days: INSIGHTS_SYNC_DAYS }, orgId),
      ]);
      await crmStore.getAllLeadCounts(orgId);

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
          subtitle: `No campaigns or insights were returned for the last ${INSIGHTS_SYNC_DAYS} days.`,
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
        title: newCampaigns > 0 ? 'Meta analytics synced - new campaigns found' : 'Meta analytics synced',
        subtitle: newCampaigns > 0
          ? `+${newCampaigns} new campaign${newCampaigns === 1 ? '' : 's'} (${campaignCount} total). Insights updated for the last ${INSIGHTS_SYNC_DAYS} days.`
          : `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} - insights updated for the last ${INSIGHTS_SYNC_DAYS} days.`,
      });
    })();
    await analyticsLoadPromise;
    loadStatSpend();
    loadStatLeads();
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

// When the global date filter changes, refresh per-campaign lead counts so campaign card
// CPL stays consistent with the spend shown (both should reflect the same date window).
watch(
  () => ({ dateFrom: activeFilters.value?.dateFrom, dateTo: activeFilters.value?.dateTo }),
  (filters) => {
    const orgId = currentOrgId.value;
    if (!orgId) return;
    const params = {};
    if (filters.dateFrom) params.dateFrom = toYmd(filters.dateFrom);
    if (filters.dateTo) params.dateTo = toYmd(filters.dateTo);
    crmStore.getAllLeadCounts(orgId, params);
  },
  { deep: true }
);

const selectedPlatform = computed(() => activeFilters.value?.platform || null);
const hasDateFilter = computed(() => Boolean(activeFilters.value?.dateFrom || activeFilters.value?.dateTo));
const filterDateFrom = computed(() => {
  return parseLocalDate(activeFilters.value?.dateFrom, false);
});
const filterDateTo = computed(() => {
  return parseLocalDate(activeFilters.value?.dateTo, true);
});
const insightsInRange = computed(() =>
  crmStore.metaInsights.filter((insight) => {
    const rowDate = parseLocalDate(insight.date, false);
    if (!rowDate) return false;
    if (Number.isNaN(rowDate.getTime())) return false;
    if (filterDateFrom.value && rowDate < filterDateFrom.value) return false;
    if (filterDateTo.value && rowDate > filterDateTo.value) return false;
    return true;
  })
);

const formatShortDate = (value) => {
  const d = parseLocalDate(value, false);
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

const syncedInsightsBounds = computed(() => {
  if (!crmStore.metaInsights.length) return null;
  let min = null;
  let max = null;
  for (const row of crmStore.metaInsights) {
    const d = parseLocalDate(row?.date, false);
    if (!d) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  if (!min || !max) return null;
  return { min, max };
});

const insightsCoverageLabel = computed(() => {
  const bounds = syncedInsightsBounds.value;
  if (!bounds) return '';
  const syncedRange = `${formatShortDate(bounds.min)} - ${formatShortDate(bounds.max)}`;
  if (hasDateFilter.value) {
    const from = activeFilters.value?.dateFrom ? formatShortDate(activeFilters.value.dateFrom) : 'Start';
    const to = activeFilters.value?.dateTo ? formatShortDate(activeFilters.value.dateTo) : 'Today';
    return `Filtered view: ${from} - ${to}. Synced coverage: ${syncedRange}.`;
  }
  return `Synced coverage: ${syncedRange}. Sync Now refreshes a rolling ${INSIGHTS_SYNC_DAYS}-day window.`;
});

const latestReachForSingleEntity = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  let latestRow = null;
  for (const row of rows) {
    const rowDate = parseLocalDate(row?.date, false);
    if (!rowDate) continue;
    if (!latestRow || rowDate > latestRow.date) {
      latestRow = { date: rowDate, reach: Number(row?.reach || 0) };
    }
  }
  return latestRow?.reach || 0;
};

const sumLatestReachByEntity = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const latestByEntity = new Map();
  for (const row of rows) {
    const entityId = String(row?.entityId || '');
    if (!entityId) continue;
    const rowDate = parseLocalDate(row?.date, false);
    if (!rowDate) continue;
    const reach = Number(row?.reach || 0);
    const found = latestByEntity.get(entityId);
    if (!found || rowDate > found.date) {
      latestByEntity.set(entityId, { date: rowDate, reach });
    }
  }
  let total = 0;
  for (const entry of latestByEntity.values()) total += Number(entry.reach || 0);
  return total;
};

const STATUS_SORT_ORDER = { ACTIVE: 0, PAUSED: 1 };
const sortCardsByStatus = (cards) =>
  cards.filter(Boolean).slice().sort((a, b) => {
    const aRank = STATUS_SORT_ORDER[String(a.status || '').toUpperCase()] ?? 2;
    const bRank = STATUS_SORT_ORDER[String(b.status || '').toUpperCase()] ?? 2;
    if (aRank !== bRank) return aRank - bRank;
    return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
  });

const filteredCampaignCount = computed(() => {
  if (campaignStatusFilter.value === 'All') return crmStore.metaCampaigns.length
  return crmStore.metaCampaigns.filter(
    (c) => c.status?.toUpperCase() === campaignStatusFilter.value.toUpperCase()
  ).length
})

const analyticsStats = computed(() => {
  const sym = currencySymbol.value;
  return [
    {
      icon: 'https://cdn.lordicon.com/nocovwne.json',
      label: 'Number of Campaigns',
      value: String(filteredCampaignCount.value).padStart(2, '0'),
      select: campaignStatusFilter.value,
      selectItems: ['All', 'Active', 'Paused'],
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Spend',
      value: statSpendLoading.value ? '...' : `${sym}${(statSpend.value / 100).toFixed(2)}`,
      select: spendPeriod.value,
      selectItems: spendDateFrom.value
        ? ['This week', 'This month', spendPeriod.value, 'Date range']
        : ['This week', 'This month', 'Date range'],
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Number of Leads',
      value: statLeadsLoading.value ? '...' : String(statLeads.value).padStart(2, '0'),
      select: leadsPeriod.value,
      selectItems: leadsDateFrom.value
        ? ['This week', 'This month', leadsPeriod.value, 'Date range']
        : ['This week', 'This month', 'Date range'],
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Impressions',
      value: statImpressions.value.toLocaleString(),
      select: impressionsPeriod.value,
      selectItems: impressionsDateFrom.value
        ? ['This week', 'This month', impressionsPeriod.value, 'Date range']
        : ['This week', 'This month', 'Date range'],
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Reach',
      value: statReach.value.toLocaleString(),
      select: reachPeriod.value,
      selectItems: reachDateFrom.value
        ? ['This week', 'This month', reachPeriod.value, 'Date range']
        : ['This week', 'This month', 'Date range'],
    },
  ];
});

// Stat cards for adset drill level (inside a campaign)
const drillCampaignStats = computed(() => {
  if (!drill.campaign) return null;
  const sym = currencySymbol.value;
  const adSetIds = crmStore.metaAdSets
    .filter((as) => as.campaignId === drill.campaign.campaignId)
    .map((as) => as.adSetId);
  const insights = insightsInRange.value.filter(
    (i) => i.entityType === 'adset' && adSetIds.includes(i.entityId)
  );
  const totalSpend = insights.reduce((sum, i) => sum + Number(i.spend || 0), 0);
  const totalImpressions = insights.reduce((sum, i) => sum + Number(i.impressions || 0), 0);
  const totalReach = sumLatestReachByEntity(insights);
  const totalLeads = adSetIds.reduce((sum, id) => sum + Number(crmStore.metaAdSetLeadCounts[id] || 0), 0);
  return [
    { icon: 'https://cdn.lordicon.com/nocovwne.json', label: 'Ad Sets', value: String(adSetIds.length).padStart(2, '0') },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Spend', value: `${sym}${(totalSpend / 100).toFixed(2)}` },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Number of Leads', value: String(totalLeads).padStart(2, '0') },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Impressions', value: totalImpressions.toLocaleString() },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Reach', value: totalReach.toLocaleString() },
  ];
});

// Stat cards for ads drill level (inside an adset)
const drillAdSetStats = computed(() => {
  if (!drill.adSet) return null;
  const sym = currencySymbol.value;
  const ads = crmStore.metaAds.filter((a) => a.adSetId === drill.adSet.adSetId);
  const adIds = ads.map((a) => a.adId);
  const insights = insightsInRange.value.filter(
    (i) => i.entityType === 'ad' && adIds.includes(i.entityId)
  );
  const totalSpend = insights.reduce((sum, i) => sum + Number(i.spend || 0), 0);
  const totalImpressions = insights.reduce((sum, i) => sum + Number(i.impressions || 0), 0);
  const totalReach = sumLatestReachByEntity(insights);
  const totalLeads = adIds.reduce((sum, id) => sum + Number(crmStore.metaAdLeadCounts[id] || 0), 0);
  return [
    { icon: 'https://cdn.lordicon.com/nocovwne.json', label: 'Ads', value: String(ads.length).padStart(2, '0') },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Spend', value: `${sym}${(totalSpend / 100).toFixed(2)}` },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Number of Leads', value: String(totalLeads).padStart(2, '0') },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Impressions', value: totalImpressions.toLocaleString() },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Reach', value: totalReach.toLocaleString() },
  ];
});

const currentStats = computed(() => {
  if (drill.level === 2) return drillAdSetStats.value || analyticsStats.value;
  if (drill.level === 1) return drillCampaignStats.value || analyticsStats.value;
  return analyticsStats.value;
});

const campaigns = computed(() =>
  sortCardsByStatus(crmStore.metaCampaigns.map((campaign) => {
    const campaignInsights = insightsInRange.value.filter(
      (insight) => insight.entityType === 'campaign' && insight.entityId === campaign.campaignId
    );
    if (hasDateFilter.value && campaignInsights.length === 0) return null;
    const campaignAdSetIds = crmStore.metaAdSets
      .filter((adSet) => adSet.campaignId === campaign.campaignId)
      .map((adSet) => adSet.adSetId);
    const ad = crmStore.metaAds.find((item) => campaignAdSetIds.includes(item.adSetId));
    const platform = ad?.platform || 'Facebook';
    if (selectedPlatform.value && platform !== selectedPlatform.value) return null;

    const totalSpend = campaignInsights.reduce((acc, insight) => acc + Number(insight.spend || 0), 0);
    const totalImpressions = campaignInsights.reduce((acc, insight) => acc + Number(insight.impressions || 0), 0);
    const totalClicks = campaignInsights.reduce((acc, insight) => acc + Number(insight.clicks || 0), 0);
    // Reach is deduplicated — summing daily rows inflates it. Use the most recent day's value.
    const totalReach = latestReachForSingleEntity(campaignInsights);
    // Use CRM lead count for this campaign — single source of truth
    const crmLeads = Number(crmStore.metaCampaignLeadCounts[campaign.campaignId] || 0);
    const spendMajor = totalSpend / 100;
    const cpl = crmLeads > 0 ? spendMajor / crmLeads : 0;
    const sym = currencySymbol.value;

    return {
      campaignId: campaign.campaignId,
      platform,
      platformIcon: platform === 'Instagram' ? instagramIcon : facebookIcon,
      title: campaign.name || 'Untitled Campaign',
      date: new Date(campaign.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      rawDate: campaign.createdAt,
      description: ad?.body || 'No ad text description available.',
      previewImage: ad?.imageUrl || reference1,
      hasVideo: !!ad?.videoId,
      videoId: ad?.videoId || null,
      status: campaign.status || null,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      reach: totalReach,
      leads: crmLeads,
      cpl: cpl > 0 ? `${sym}${cpl.toFixed(2)}` : '—',
    };
  }))
);

const adSetCards = computed(() => {
  if (!drill.campaign) return [];
  const sym = currencySymbol.value;
  const campaignAdSets = crmStore.metaAdSets.filter(
    (as) => as.campaignId === drill.campaign.campaignId
  );
  return sortCardsByStatus(campaignAdSets.map((adSet) => {
    const insights = insightsInRange.value.filter(
      (i) => i.entityType === 'adset' && i.entityId === adSet.adSetId
    );
    if (hasDateFilter.value && insights.length === 0) return null;
    const totalSpend = insights.reduce((acc, i) => acc + Number(i.spend || 0), 0);
    const totalImpressions = insights.reduce((acc, i) => acc + Number(i.impressions || 0), 0);
    const totalClicks = insights.reduce((acc, i) => acc + Number(i.clicks || 0), 0);
    const totalReach = latestReachForSingleEntity(insights);
    const spendMajor = totalSpend / 100;
    const firstAd = crmStore.metaAds.find((a) => a.adSetId === adSet.adSetId);
    const adSetPlatform = firstAd?.platform || drill.campaign.platform;
    if (selectedPlatform.value && adSetPlatform !== selectedPlatform.value) return null;
    const adSetLeads = Number(crmStore.metaAdSetLeadCounts[adSet.adSetId] || 0);
    const adSetCpl = adSetLeads > 0 ? spendMajor / adSetLeads : 0;
    return {
      id: adSet.adSetId,
      adSetId: adSet.adSetId,
      campaignId: null,
      platform: adSetPlatform,
      platformIcon: adSetPlatform === 'Instagram' ? instagramIcon : facebookIcon,
      title: adSet.name || 'Untitled Ad Set',
      date: new Date(adSet.createdAt || drill.campaign.rawDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
      description: `Ad set within "${drill.campaign.title}"`,
      previewImage: firstAd?.imageUrl || reference1,
      hasVideo: !!firstAd?.videoId,
      videoId: firstAd?.videoId || null,
      status: adSet.status || null,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      reach: totalReach,
      leads: adSetLeads,
      cpl: adSetCpl > 0 ? `${sym}${adSetCpl.toFixed(2)}` : '—',
      drillLabel: 'View Ads',
    };
  }));
});

const adCards = computed(() => {
  if (!drill.adSet) return [];
  const sym = currencySymbol.value;
  const adSetAds = crmStore.metaAds.filter((a) => a.adSetId === drill.adSet.adSetId);
  return sortCardsByStatus(adSetAds.map((ad) => {
    const insights = insightsInRange.value.filter(
      (i) => i.entityType === 'ad' && i.entityId === ad.adId
    );
    if (hasDateFilter.value && insights.length === 0) return null;
    const adPlatform = ad.platform || drill.campaign?.platform;
    if (selectedPlatform.value && adPlatform !== selectedPlatform.value) return null;
    const totalSpend = insights.reduce((acc, i) => acc + Number(i.spend || 0), 0);
    const totalImpressions = insights.reduce((acc, i) => acc + Number(i.impressions || 0), 0);
    const totalClicks = insights.reduce((acc, i) => acc + Number(i.clicks || 0), 0);
    const totalReach = latestReachForSingleEntity(insights);
    const spendMajor = totalSpend / 100;
    const adLeads = Number(crmStore.metaAdLeadCounts[ad.adId] || 0);
    const adCpl = adLeads > 0 ? spendMajor / adLeads : 0;
    return {
      id: ad.adId,
      adId: ad.adId,
      campaignId: null,
      platform: adPlatform,
      platformIcon: adPlatform === 'Instagram' ? instagramIcon : facebookIcon,
      title: ad.name || 'Untitled Ad',
      date: drill.adSet?.date || '',
      description: ad.body || `Ad in "${drill.adSet?.title}"`,
      previewImage: ad.imageUrl || reference1,
      hasVideo: !!ad.videoId,
      videoId: ad.videoId || null,
      status: ad.status || null,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      reach: totalReach,
      leads: adLeads,
      cpl: adCpl > 0 ? `${sym}${adCpl.toFixed(2)}` : '—',
      drillLabel: null,
    };
  }));
});

const displayCards = computed(() => {
  if (drill.level === 2) return adCards.value;
  if (drill.level === 1) return adSetCards.value;
  return filteredCampaigns.value;
});

// Add drillLabel to campaign cards
const campaignsWithDrill = computed(() =>
  campaigns.value.map((c) => ({ ...c, drillLabel: 'View Ad Sets' }))
);

// Replace filtered campaigns with drill-aware version
const filteredCampaigns = computed(() => {
  let base = campaignsWithDrill.value;
  if (campaignStatusFilter.value !== 'All') {
    base = base.filter((c) => c.status?.toUpperCase() === campaignStatusFilter.value.toUpperCase());
  }
  if (!search.value) return base;
  const q = search.value.toLowerCase();
  return base.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
});

const drillEmptyTitle = computed(() => {
  if (drill.level === 2) return 'No ads in this ad set';
  if (drill.level === 1) return 'No ad sets in this campaign';
  return emptyStateTitle.value;
});
const drillEmptyCopy = computed(() => {
  if (drill.level >= 1) return 'Run a Sync Now to refresh the latest structure from Meta.';
  return emptyStateCopy.value;
});
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;

  p {
    font-size: 12px;
    color: #c3c3c3;
    margin: 0;
  }
}

.header-sep {
  font-size: 12px;
  color: #c3c3c3;
  margin: 0 4px;
}

.insights-coverage {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
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
