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
      <div class="stats-container">
        <div
          v-for="(stat, i) in currentStats"
          :key="i"
          class="stat-card"
        >
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"
            hide-chip
            :select="stat.select ?? null"
            :select-items="stat.selectItems ?? []"
            :info-text="stat.infoText ?? ''"
            @update:select="(v) => { if (stat.selectItems?.length) statPeriod = v }"
          />
        </div>
      </div>
    </div>

    <!-- Campaign bar chart + summary metrics -->
    <div v-if="chartCampaigns.length" class="mt-5 px-5">
      <v-card elevation="0" border rounded="lg" class="pa-5 chart-card">
        <div class="chart-header mb-3 d-flex align-center justify-space-between">
          <p class="chart-title">Campaign Spend Overview</p>
          <span class="chart-period-label">{{ periodLabel }}</span>
        </div>
        <div style="height: 200px; position: relative;">
          <canvas ref="chartCanvas"></canvas>
        </div>
        <v-divider class="my-4" />
        <div class="summary-metrics">
          <div v-for="(m, i) in summaryMetrics" :key="i" class="summary-item">
            <p class="summary-label">{{ m.label }}</p>
            <p class="summary-value">{{ m.value }}</p>
          </div>
        </div>
      </v-card>
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

      <v-row v-if="displayCards.length" class="campaign-grid" align="stretch" dense>
        <v-col
          v-for="(card, index) in displayCards"
          :key="card.id || index"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          xl="3"
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
            :rank-label="card.rankLabel ?? null"
            @drill="onDrill(card)"
          />
        </v-col>
      </v-row>

      <v-sheet v-else class="pa-10 text-center" color="transparent">
        <p class="empty-state-title">{{ drillEmptyTitle }}</p>
        <p class="text-grey empty-state-copy">{{ drillEmptyCopy }}</p>
      </v-sheet>
    </div>

    <!-- Custom date range picker dialog -->
    <v-dialog v-model="showCustomRangeDialog" max-width="400" persistent>
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-subtitle-1 font-weight-semibold px-4 pt-4 pb-2">
          Custom date range
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          <p class="text-caption text-grey mb-4">
            All stat cards and campaign data will update to the selected window.
          </p>
          <v-row dense>
            <v-col cols="6">
              <p class="date-label mb-1">From</p>
              <v-menu v-model="fromMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="customDateFromTemp ? formatShortDate(customDateFromTemp) : ''"
                    placeholder="Select date"
                    readonly
                    variant="solo"
                    density="compact"
                    hide-details
                    flat
                    bg-color="#F3F4F6"
                    class="date-field"
                  >
                    <template #append-inner>
                      <v-icon size="16" class="cursor-pointer">mdi-calendar</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="customDateFromTemp"
                  color="primary"
                  :max="customDateToTemp ? toYmd(customDateToTemp) : undefined"
                  @update:model-value="fromMenu = false"
                />
              </v-menu>
            </v-col>
            <v-col cols="6">
              <p class="date-label mb-1">To</p>
              <v-menu v-model="toMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="customDateToTemp ? formatShortDate(customDateToTemp) : ''"
                    placeholder="Select date"
                    readonly
                    variant="solo"
                    density="compact"
                    hide-details
                    flat
                    bg-color="#F3F4F6"
                    class="date-field"
                  >
                    <template #append-inner>
                      <v-icon size="16" class="cursor-pointer">mdi-calendar</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="customDateToTemp"
                  color="primary"
                  :min="customDateFromTemp ? toYmd(customDateFromTemp) : undefined"
                  @update:model-value="toMenu = false"
                />
              </v-menu>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-spacer />
          <v-btn variant="text" size="small" @click="cancelCustomRange">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            rounded="lg"
            :disabled="!customRangeValid"
            @click="applyCustomRange"
          >Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-sheet>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useCrmStore } from '@/stores/crm';
import { useMainStore } from '@/stores';
import { useUser } from '@/composables/useUser';
import instagramIcon from '@/assets/crm/instagram.svg';
import facebookIcon from '@/assets/crm/facebook.svg';
import searchicon from '@/assets/icons/listView/serach-icon.svg';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const crmStore = useCrmStore();
const mainStore = useMainStore();
const { user } = useUser();
const search = ref('');
const isSyncing = ref(false);
const activeFilters = ref({ platform: null, status: null });
const currentOrgId = computed(() => Number(user.value?.currentLoggedInOrgId || 0) || null);
const metaConnection = ref({ count: 0, pages: [] });
const INSIGHTS_SYNC_DAYS = 30;
const AUTO_SYNC_COOLDOWN_MS = 15 * 60 * 1000;
const AUTO_SYNC_STALE_MS = 4 * 60 * 60 * 1000;


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



// All stat card metrics derive from insightsInRange (same date window as campaign cards).
// The global FilterMenu date range is the single control for the entire page.
const campaignInsightsInRange = computed(() =>
  insightsInRange.value.filter((i) => i.entityType === 'campaign')
);

const statSpend = computed(() =>
  campaignInsightsInRange.value.reduce((sum, i) => sum + Number(i.spend || 0), 0)
);
const statImpressions = computed(() =>
  campaignInsightsInRange.value.reduce((sum, i) => sum + Number(i.impressions || 0), 0)
);
// Meta platform leads (actions[lead]) — matches what Meta Ads Manager reports
const statMetaLeads = computed(() =>
  campaignInsightsInRange.value.reduce((sum, i) => sum + Number(i.leads || 0), 0)
);
const statReach = computed(() => sumLifetimeReachByEntity(campaignInsightsInRange.value));


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

const getAutoSyncStorageKey = (orgId) => `crm-meta-analytics:auto-sync:${orgId}`;

const readLastAutoSyncAt = (orgId) => {
  if (!orgId || typeof window === 'undefined') return 0;
  const raw = window.sessionStorage.getItem(getAutoSyncStorageKey(orgId));
  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const writeLastAutoSyncAt = (orgId) => {
  if (!orgId || typeof window === 'undefined') return;
  window.sessionStorage.setItem(getAutoSyncStorageKey(orgId), String(Date.now()));
};

const parseTimestamp = (value) => {
  if (!value) return 0;
  const dt = value instanceof Date ? value : new Date(value);
  const ts = dt.getTime();
  return Number.isFinite(ts) ? ts : 0;
};

const getLatestRowsTimestamp = (rows = [], keys = ['updatedAt', 'createdAt']) =>
  rows.reduce((latest, row) => {
    for (const key of keys) {
      const nextTs = parseTimestamp(row?.[key]);
      if (nextTs > latest) return nextTs;
    }
    return latest;
  }, 0);

const shouldAutoSyncAnalytics = ({ orgId, activePageCount = 0, campaignCount = 0, insightCount = 0 }) => {
  if (!orgId || activePageCount <= 0 || isSyncing.value) return false;

  const lastAutoSyncAt = readLastAutoSyncAt(orgId);
  if (lastAutoSyncAt && Date.now() - lastAutoSyncAt < AUTO_SYNC_COOLDOWN_MS) {
    return false;
  }

  if (campaignCount === 0) return true;
  if (insightCount === 0) return true;

  const latestStructureAt = getLatestRowsTimestamp([
    ...crmStore.metaCampaigns,
    ...crmStore.metaAdSets,
    ...crmStore.metaAds,
  ]);
  const latestInsightsAt = getLatestRowsTimestamp(crmStore.metaInsights, ['updatedAt', 'date', 'createdAt']);

  if (!latestStructureAt || Date.now() - latestStructureAt >= AUTO_SYNC_STALE_MS) {
    return true;
  }
  if (!latestInsightsAt || Date.now() - latestInsightsAt >= AUTO_SYNC_STALE_MS) {
    return true;
  }

  return false;
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

      if (
        currentOrgId.value === orgId &&
        shouldAutoSyncAnalytics({
          orgId,
          activePageCount: Number(connectionRes?.data?.count || 0),
          campaignCount,
          insightCount,
        })
      ) {
        writeLastAutoSyncAt(orgId);
        await resync({ silentSuccess: true, silentEmptyState: true });
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

async function resync({ silentSuccess = false, silentEmptyState = false } = {}) {
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
        if (!silentEmptyState) {
          mainStore.setSnackbar({
            type: 'info',
            color: 'warning',
            title: 'Meta sync completed with no analytics data',
            subtitle: `No campaigns or insights were returned for the last ${INSIGHTS_SYNC_DAYS} days.`,
          });
        }
        return;
      }

      if (campaignCount > 0 && insightCount === 0) {
        if (!silentEmptyState) {
          mainStore.setSnackbar({
            type: 'info',
            color: 'warning',
            title: 'Meta campaigns synced, but no insights were returned',
            subtitle: 'Check the selected date range, account activity, or Meta attribution data.',
          });
        }
        return;
      }

      const newCampaigns = campaignCount - prevCampaignCount;

      if (!silentSuccess) {
        mainStore.setSnackbar({
          type: 'success',
          color: 'success',
          title: newCampaigns > 0 ? 'Meta analytics synced - new campaigns found' : 'Meta analytics synced',
          subtitle: newCampaigns > 0
            ? `+${newCampaigns} new campaign${newCampaigns === 1 ? '' : 's'} (${campaignCount} total). Insights updated for the last ${INSIGHTS_SYNC_DAYS} days.`
            : `${campaignCount} campaign${campaignCount === 1 ? '' : 's'} - insights updated for the last ${INSIGHTS_SYNC_DAYS} days.`,
        });
      }
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
}

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


const selectedPlatform = computed(() => activeFilters.value?.platform || null);
const selectedStatus = computed(() => activeFilters.value?.status || null);

// Shared period selector for all campaign-level stat cards
const statPeriod = ref('30d');
const PERIOD_ITEMS = [
  { title: 'This week', value: 'week' },
  { title: 'This month', value: 'month' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'Last 90 days', value: '90d' },
  { title: 'Custom range', value: 'custom' },
];

// Custom date range state
const showCustomRangeDialog = ref(false);
const customDateFrom = ref(null);  // Date | null — committed value
const customDateTo = ref(null);    // Date | null — committed value
const customDateFromTemp = ref(null); // Date | null — in-dialog draft
const customDateToTemp = ref(null);
const fromMenu = ref(false);
const toMenu = ref(false);
const prevStatPeriod = ref('30d');

watch(statPeriod, (val, prev) => {
  if (val === 'custom') {
    prevStatPeriod.value = prev;
    customDateFromTemp.value = customDateFrom.value;
    customDateToTemp.value = customDateTo.value;
    showCustomRangeDialog.value = true;
  }
});

const applyCustomRange = () => {
  customDateFrom.value = customDateFromTemp.value;
  customDateTo.value = customDateToTemp.value;
  showCustomRangeDialog.value = false;
};

const cancelCustomRange = () => {
  statPeriod.value = prevStatPeriod.value;
  showCustomRangeDialog.value = false;
};

const customRangeValid = computed(() =>
  customDateFromTemp.value instanceof Date &&
  customDateToTemp.value instanceof Date &&
  customDateFromTemp.value <= customDateToTemp.value
);

const statPeriodDates = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (statPeriod.value === 'custom') {
    return { from: customDateFrom.value ?? null, to: customDateTo.value ?? null };
  }
  if (statPeriod.value === 'week') {
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return { from: monday, to: today };
  }
  if (statPeriod.value === 'month') {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
  }
  if (statPeriod.value === '90d') {
    const from = new Date(today);
    from.setDate(today.getDate() - 89);
    return { from, to: today };
  }
  // default: 30d
  const from = new Date(today);
  from.setDate(today.getDate() - 29);
  return { from, to: today };
});

const insightsInRange = computed(() => {
  const { from, to } = statPeriodDates.value;
  const endOfTo = to ? new Date(to.getTime()) : null;
  if (endOfTo) endOfTo.setHours(23, 59, 59, 999);
  return crmStore.metaInsights.filter((insight) => {
    const rowDate = parseLocalDate(insight.date, false);
    if (!rowDate) return false;
    if (Number.isNaN(rowDate.getTime())) return false;
    if (from && rowDate < from) return false;
    if (endOfTo && rowDate > endOfTo) return false;
    return true;
  });
});

const periodLabel = computed(() => {
  if (statPeriod.value === 'custom') {
    if (customDateFrom.value && customDateTo.value) {
      return `${formatShortDate(customDateFrom.value)} – ${formatShortDate(customDateTo.value)}`;
    }
    return 'custom range';
  }
  const labels = { week: 'this week', month: 'this month', '30d': 'last 30 days', '90d': 'last 90 days' };
  return labels[statPeriod.value] || 'last 30 days';
});

const drillInfoText = computed(() => {
  const parts = [`Date range: ${periodLabel.value}`];
  if (selectedStatus.value) parts.push(`Status: ${selectedStatus.value}`);
  if (selectedPlatform.value) parts.push(`Platform: ${selectedPlatform.value}`);
  if (drill.level >= 1 && drill.campaign?.title) parts.push(`Campaign: "${drill.campaign.title}"`);
  return parts.join(' · ');
});

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
  return `Synced coverage: ${syncedRange}. Sync Now refreshes a rolling ${INSIGHTS_SYNC_DAYS}-day window.`;
});

// Prefer lifetimeReach (deduplicated over the sync window) over daily reach.
// lifetimeReach is stamped on all rows for an entity after each sync.
const lifetimeReachForSingleEntity = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  for (const row of rows) {
    if (row?.lifetimeReach != null) return Number(row.lifetimeReach);
  }
  // fallback: most recent daily reach (less accurate but better than 0)
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

const sumLifetimeReachByEntity = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  // Group rows by entityId, pick lifetimeReach if available or latest daily reach
  const reachByEntity = new Map();
  for (const row of rows) {
    const entityId = String(row?.entityId || '');
    if (!entityId) continue;
    if (!reachByEntity.has(entityId)) {
      reachByEntity.set(entityId, { lifetimeReach: null, latestDate: null, latestReach: 0 });
    }
    const entry = reachByEntity.get(entityId);
    if (row?.lifetimeReach != null && entry.lifetimeReach === null) {
      entry.lifetimeReach = Number(row.lifetimeReach);
    }
    const rowDate = parseLocalDate(row?.date, false);
    if (rowDate && (!entry.latestDate || rowDate > entry.latestDate)) {
      entry.latestDate = rowDate;
      entry.latestReach = Number(row?.reach || 0);
    }
  }
  let total = 0;
  for (const entry of reachByEntity.values()) {
    total += entry.lifetimeReach !== null ? entry.lifetimeReach : entry.latestReach;
  }
  return total;
};

const STATUS_SORT_ORDER = { ACTIVE: 0, PAUSED: 1 };
const TOP_RANK_LABELS = ['1st Best Performer', '2nd Best Performer', '3rd Best Performer'];

const getPerformanceMetrics = (card) => {
  const leads = Number(card?.leads || 0);
  const spend = Number(card?.spendMajor || 0);
  const linkClicks = Number(card?.linkClicks || 0);
  const reach = Number(card?.reach || 0);
  const impressions = Number(card?.impressions || 0);
  return {
    leads,
    spend,
    linkClicks,
    reach,
    impressions,
    efficiency: leads > 0 ? leads / Math.max(spend, 1) : 0,
  };
};

const sortCardsByPerformance = (cards) =>
  cards.filter(Boolean).slice().sort((a, b) => {
    const aRank = STATUS_SORT_ORDER[String(a.status || '').toUpperCase()] ?? 2;
    const bRank = STATUS_SORT_ORDER[String(b.status || '').toUpperCase()] ?? 2;
    if (aRank !== bRank) return aRank - bRank;

    const aMetrics = getPerformanceMetrics(a);
    const bMetrics = getPerformanceMetrics(b);
    if (bMetrics.leads !== aMetrics.leads) return bMetrics.leads - aMetrics.leads;
    if (bMetrics.efficiency !== aMetrics.efficiency) return bMetrics.efficiency - aMetrics.efficiency;
    if (bMetrics.linkClicks !== aMetrics.linkClicks) return bMetrics.linkClicks - aMetrics.linkClicks;
    if (bMetrics.reach !== aMetrics.reach) return bMetrics.reach - aMetrics.reach;
    if (bMetrics.impressions !== aMetrics.impressions) return bMetrics.impressions - aMetrics.impressions;
    return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
  });

const addPerformanceRanks = (cards) =>
  cards.map((card, index) => ({
    ...card,
    rankLabel: TOP_RANK_LABELS[index] || null,
  }));

const filteredCampaignCount = computed(() => {
  if (!selectedStatus.value) return crmStore.metaCampaigns.length;
  return crmStore.metaCampaigns.filter(
    (c) => c.status?.toUpperCase() === selectedStatus.value.toUpperCase()
  ).length;
})

const analyticsStats = computed(() => {
  const sym = currencySymbol.value;
  return [
    {
      icon: 'https://cdn.lordicon.com/nocovwne.json',
      label: 'Number of Campaigns',
      value: String(filteredCampaignCount.value).padStart(2, '0'),
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Spend',
      value: `${sym}${(statSpend.value / 100).toFixed(2)}`,
      select: statPeriod.value,
      selectItems: PERIOD_ITEMS,
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Number of Leads',
      value: String(statMetaLeads.value).padStart(2, '0'),
      select: statPeriod.value,
      selectItems: PERIOD_ITEMS,
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Impressions',
      value: statImpressions.value.toLocaleString(),
      select: statPeriod.value,
      selectItems: PERIOD_ITEMS,
    },
    {
      icon: 'https://cdn.lordicon.com/tzynxkwl.json',
      label: 'Total Reach',
      value: statReach.value.toLocaleString(),
      select: statPeriod.value,
      selectItems: PERIOD_ITEMS,
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
  const totalReach = sumLifetimeReachByEntity(insights);
  const totalLeads = insights.reduce((sum, i) => sum + Number(i.leads || 0), 0);
  const info = drillInfoText.value;
  return [
    { icon: 'https://cdn.lordicon.com/nocovwne.json', label: 'Ad Sets', value: String(adSetIds.length).padStart(2, '0'), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Spend', value: `${sym}${(totalSpend / 100).toFixed(2)}`, infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Number of Leads', value: String(totalLeads).padStart(2, '0'), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Impressions', value: totalImpressions.toLocaleString(), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Reach', value: totalReach.toLocaleString(), infoText: info },
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
  const totalReach = sumLifetimeReachByEntity(insights);
  const totalLeads = insights.reduce((sum, i) => sum + Number(i.leads || 0), 0);
  const info = drillInfoText.value;
  return [
    { icon: 'https://cdn.lordicon.com/nocovwne.json', label: 'Ads', value: String(ads.length).padStart(2, '0'), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Spend', value: `${sym}${(totalSpend / 100).toFixed(2)}`, infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Number of Leads', value: String(totalLeads).padStart(2, '0'), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Impressions', value: totalImpressions.toLocaleString(), infoText: info },
    { icon: 'https://cdn.lordicon.com/tzynxkwl.json', label: 'Total Reach', value: totalReach.toLocaleString(), infoText: info },
  ];
});

const currentStats = computed(() => {
  if (drill.level === 2) return drillAdSetStats.value || analyticsStats.value;
  if (drill.level === 1) return drillCampaignStats.value || analyticsStats.value;
  return analyticsStats.value;
});

const pickPreviewAd = (ads = []) =>
  ads.find((ad) => String(ad?.imageUrl || '').trim()) ||
  ads.find((ad) => ad?.videoId) ||
  ads[0] ||
  null;

const campaigns = computed(() =>
  addPerformanceRanks(sortCardsByPerformance(crmStore.metaCampaigns.map((campaign) => {
    const campaignInsights = insightsInRange.value.filter(
      (insight) => insight.entityType === 'campaign' && insight.entityId === campaign.campaignId
    );
    if (selectedStatus.value && campaign.status?.toUpperCase() !== selectedStatus.value.toUpperCase()) return null;
    const campaignAdSetIds = crmStore.metaAdSets
      .filter((adSet) => adSet.campaignId === campaign.campaignId)
      .map((adSet) => adSet.adSetId);
    const ad = pickPreviewAd(crmStore.metaAds.filter((item) => campaignAdSetIds.includes(item.adSetId)));
    const platform = ad?.platform || 'Facebook';
    if (selectedPlatform.value && platform !== selectedPlatform.value) return null;

    const totalSpend = campaignInsights.reduce((acc, insight) => acc + Number(insight.spend || 0), 0);
    const totalImpressions = campaignInsights.reduce((acc, insight) => acc + Number(insight.impressions || 0), 0);
    const totalLinkClicks = campaignInsights.reduce((acc, insight) => acc + Number(insight.linkClicks || 0), 0);
    // Prefer lifetimeReach (deduplicated over sync window) — matches Meta Ads Manager
    const totalReach = lifetimeReachForSingleEntity(campaignInsights);
    // Use Meta platform lead count from insights — matches what Ads Manager reports
    const metaLeads = campaignInsights.reduce((acc, insight) => acc + Number(insight.leads || 0), 0);
    const spendMajor = totalSpend / 100;
    const cpl = metaLeads > 0 ? spendMajor / metaLeads : 0;
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
      previewImage: ad?.imageUrl || '',
      hasVideo: !!ad?.videoId,
      videoId: ad?.videoId || null,
      status: campaign.status || null,
      spendMajor,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalLinkClicks,
      reach: totalReach,
      leads: metaLeads,
      cpl: cpl > 0 ? `${sym}${cpl.toFixed(2)}` : '—',
    };
  })))
);

const adSetCards = computed(() => {
  if (!drill.campaign) return [];
  const sym = currencySymbol.value;
  const campaignAdSets = crmStore.metaAdSets.filter(
    (as) => as.campaignId === drill.campaign.campaignId
  );
  return addPerformanceRanks(sortCardsByPerformance(campaignAdSets.map((adSet) => {
    const insights = insightsInRange.value.filter(
      (i) => i.entityType === 'adset' && i.entityId === adSet.adSetId
    );
    if (selectedStatus.value && adSet.status?.toUpperCase() !== selectedStatus.value.toUpperCase()) return null;
    const totalSpend = insights.reduce((acc, i) => acc + Number(i.spend || 0), 0);
    const totalImpressions = insights.reduce((acc, i) => acc + Number(i.impressions || 0), 0);
    const totalLinkClicks = insights.reduce((acc, i) => acc + Number(i.linkClicks || 0), 0);
    const totalReach = lifetimeReachForSingleEntity(insights);
    const spendMajor = totalSpend / 100;
    const firstAd = pickPreviewAd(crmStore.metaAds.filter((a) => a.adSetId === adSet.adSetId));
    const adSetPlatform = firstAd?.platform || drill.campaign.platform;
    if (selectedPlatform.value && adSetPlatform !== selectedPlatform.value) return null;
    const adSetLeads = insights.reduce((acc, i) => acc + Number(i.leads || 0), 0);
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
      previewImage: firstAd?.imageUrl || '',
      hasVideo: !!firstAd?.videoId,
      videoId: firstAd?.videoId || null,
      status: adSet.status || null,
      spendMajor,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalLinkClicks,
      reach: totalReach,
      leads: adSetLeads,
      cpl: adSetCpl > 0 ? `${sym}${adSetCpl.toFixed(2)}` : '—',
      drillLabel: 'View Ads',
    };
  })));
});

const adCards = computed(() => {
  if (!drill.adSet) return [];
  const sym = currencySymbol.value;
  const adSetAds = crmStore.metaAds.filter((a) => a.adSetId === drill.adSet.adSetId);
  return addPerformanceRanks(sortCardsByPerformance(adSetAds.map((ad) => {
    const insights = insightsInRange.value.filter(
      (i) => i.entityType === 'ad' && i.entityId === ad.adId
    );
    if (selectedStatus.value && ad.status?.toUpperCase() !== selectedStatus.value.toUpperCase()) return null;
    const adPlatform = ad.platform || drill.campaign?.platform;
    if (selectedPlatform.value && adPlatform !== selectedPlatform.value) return null;
    const totalSpend = insights.reduce((acc, i) => acc + Number(i.spend || 0), 0);
    const totalImpressions = insights.reduce((acc, i) => acc + Number(i.impressions || 0), 0);
    const totalLinkClicks = insights.reduce((acc, i) => acc + Number(i.linkClicks || 0), 0);
    const totalReach = lifetimeReachForSingleEntity(insights);
    const spendMajor = totalSpend / 100;
    const adLeads = insights.reduce((acc, i) => acc + Number(i.leads || 0), 0);
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
      previewImage: ad.imageUrl || '',
      hasVideo: !!ad.videoId,
      videoId: ad.videoId || null,
      status: ad.status || null,
      spendMajor,
      cost: `${sym}${spendMajor.toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalLinkClicks,
      reach: totalReach,
      leads: adLeads,
      cpl: adCpl > 0 ? `${sym}${adCpl.toFixed(2)}` : '—',
      drillLabel: null,
    };
  })));
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
  if (!search.value) return addPerformanceRanks(campaignsWithDrill.value);
  const q = search.value.toLowerCase();
  return addPerformanceRanks(
    campaignsWithDrill.value.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  );
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

// ─── Chart ────────────────────────────────────────────────────────────────────
// Only show campaign-level bars at drill level 0; max 10 campaigns for readability
const chartCampaigns = computed(() =>
  drill.level === 0 ? campaigns.value.filter(Boolean).slice(0, 10) : []
);

const statLinkClicks = computed(() =>
  campaignInsightsInRange.value.reduce((sum, i) => sum + Number(i.linkClicks || 0), 0)
);
const statCpl = computed(() => {
  const spend = statSpend.value / 100;
  if (!statMetaLeads.value || !spend) return '—';
  return `${currencySymbol.value}${(spend / statMetaLeads.value).toFixed(2)}`;
});
const statCtr = computed(() => {
  if (!statImpressions.value) return '0%';
  return `${((statLinkClicks.value / statImpressions.value) * 100).toFixed(1)}%`;
});
const summaryMetrics = computed(() => {
  const sym = currencySymbol.value;
  return [
    { label: 'Total Ad Spend', value: `${sym}${(statSpend.value / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Leads Generated', value: String(statMetaLeads.value) },
    { label: 'Cost Per Lead', value: statCpl.value },
    { label: 'CTR', value: statCtr.value },
    { label: 'Impressions', value: statImpressions.value.toLocaleString() },
  ];
});

const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const cards = chartCampaigns.value;
  if (!cards.length) return;
  const sym = currencySymbol.value;
  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: cards.map((c) => c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title),
      datasets: [{
        data: cards.map((c) => +(Number(c.spendMajor || 0).toFixed(2))),
        backgroundColor: '#171952',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${sym}${Number(ctx.parsed.y).toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 30, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 11 },
            callback: (v) => `${sym}${v}`,
          },
        },
      },
    },
  });
};

watch(chartCampaigns, () => { nextTick(renderChart); }, { deep: true });
watch(insightsInRange, () => { nextTick(renderChart); });
onMounted(() => { nextTick(renderChart); });
onBeforeUnmount(() => { if (chartInstance) { chartInstance.destroy(); chartInstance = null; } });
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

.stats-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 0;
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
  min-width: 0;
}

.date-label {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.date-field {
  font-size: 13px;
  border-radius: 8px;
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

/* Chart card */
.chart-card {
  background: #fff;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
.chart-period-label {
  font-size: 12px;
  color: #6b7280;
}
.chart-header {
  gap: 8px;
}

/* Summary metrics row */
.summary-metrics {
  display: flex;
  gap: 0;
}
.summary-item {
  flex: 1;
  border-right: 1px solid #f3f4f6;
  padding: 4px 16px 4px 0;
  &:last-child { border-right: none; }
  &:first-child { padding-left: 0; }
}
.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 2px;
}
.summary-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

@media (max-width: 600px) {
  .summary-metrics {
    flex-wrap: wrap;
    gap: 12px;
  }
  .summary-item {
    flex: 1 1 45%;
    border-right: none;
  }
}
</style>
