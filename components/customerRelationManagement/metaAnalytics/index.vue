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
      <div class="d-flex align-center mb-2" style="flex-wrap: nowrap; gap: 8px;">
        <div style="width: 150px">
          <v-text-field
            v-model="search"
            placeholder="Search"
            append-inner-icon="mdi-magnify"
            clearable
            variant="solo"
            :elevation="0"
            density="compact"
            hide-details
            bg-color="#FAFAFA"
            flat
            class="custom-search"
          />
        </div>
        <v-btn
          variant="text"
          prepend-icon="mdi-filter-variant"
          class="filter-btn"
        >
          Filters
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
          />
        </v-col>
      </v-row>

      <v-sheet v-else class="pa-10 text-center" color="transparent">
        <p class="text-grey">No Meta campaigns found. Make sure your account is connected and synced.</p>
        <v-btn color="primary" class="mt-3" @click="resync">
          Sync Now
        </v-btn>
      </v-sheet>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useCrmStore } from '@/stores/crm';
import instagramIcon from '@/assets/crm/instagram.svg';
import facebookIcon from '@/assets/crm/facebook.svg';
import reference1 from '@/assets/crm/placeholder/reference-1.png';

const crmStore = useCrmStore();
const search = ref('');

onMounted(async () => {
  if (!crmStore.metaCampaigns.length) {
    await crmStore.getMetaStructure();
  }
  if (!crmStore.metaInsights.length) {
    await crmStore.getMetaInsights();
  }
});

const resync = () => {
  crmStore.fetchMetaStructure();
  crmStore.fetchMetaInsights({ days: 30 });
};

const stats = computed(() => crmStore.metaStats);

const analyticsStats = computed(() => [
  {
    icon: 'https://cdn.lordicon.com/nocovwne.json',
    label: 'Number of Campaigns',
    value: String(stats.value.campaigns).padStart(2, '0'),
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'Total Spend',
    value: `£${(stats.value.spend / 100).toFixed(2)}`,
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'ROAS',
    value: `${stats.value.roas.toFixed(1)}%`,
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
]);

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
    const totalReach = campaignInsights.reduce((acc, insight) => acc + Number(insight.reach || 0), 0);

    return {
      platform: ad?.platform || 'Facebook',
      platformIcon: ad?.platform === 'Instagram' ? instagramIcon : facebookIcon,
      title: campaign.name || 'Untitled Campaign',
      date: new Date(campaign.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      description: ad?.body || 'No ad text description available.',
      previewImage: ad?.imageUrl || reference1,
      hasVideo: false,
      cost: `£${(totalSpend / 100).toFixed(2)}`,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      reach: totalReach,
    };
  })
);

const filteredCampaigns = computed(() => {
  if (!search.value) return campaigns.value;
  const normalizedSearch = search.value.toLowerCase();
  return campaigns.value.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(normalizedSearch) ||
      campaign.description.toLowerCase().includes(normalizedSearch)
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

.custom-search {
  :deep(.v-field__input) {
    font-size: 14px;
  }
}

.filter-btn {
  text-transform: none;
  font-size: 14px;
  color: #666666;
  letter-spacing: 0;
}

.campaign-grid {
  margin: -10px;
}

.campaign-col {
  padding: 10px !important;
}
</style>
