<template>
  <v-sheet color="background">
    <!-- Page Header -->
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>

    <!-- Stats Cards Row -->
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

    <!-- Search and Filters -->
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

      <!-- Campaign Cards Grid -->
      <v-row class="campaign-grid">
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
    </div>
  </v-sheet>
</template>

<script setup>
import { ref, computed } from 'vue';

definePageMeta({
  layout: 'home',
});

// Search filter
const search = ref('');

// Analytics Stats Data
const analyticsStats = ref([
  {
    icon: 'https://cdn.lordicon.com/nocovwne.json',
    label: 'Number of Campaigns',
    value: '08',
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'Total Spend',
    value: '£500.00',
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'ROAS',
    value: '£500.00',
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'Total Impressions',
    value: '£500.00',
  },
  {
    icon: 'https://cdn.lordicon.com/tzynxkwl.json',
    label: 'Total Reach',
    value: '£500.00',
  },
]);

// Import platform icons and images
import instagramIcon from '@/assets/crm/instagram.svg'
import facebookIcon from '@/assets/crm/facebook.svg'
import reference1 from '@/assets/crm/placeholder/reference-1.png'
import reference2 from '@/assets/crm/placeholder/reference-2.png'
import reference3 from '@/assets/crm/placeholder/reference-3.png'
import reference4 from '@/assets/crm/placeholder/reference-4.png'

// Campaign Cards Data (Placeholder)
const campaigns = ref([
  {
    platform: 'Instagram',
    platformIcon: instagramIcon,
    title: 'Flossly OS for Dental Clinic',
    date: 'Friday 12/12/2025 12:19am GMT',
    description: 'Still juggling 5 different systems to run one dental practice? FlosslyOS brings tasks, team......',
    previewImage: reference1,
    hasVideo: true,
    cost: '£30',
    impressions: 10,
    linkClicks: 40,
    reach: 300,
  },
  {
    platform: 'Facebook',
    platformIcon: facebookIcon,
    title: 'Flossly OS for Dental Clinic',
    date: 'Friday 12/12/2025 12:19am GMT',
    description: 'FlosslyOS ready to transform your clinics nationwide, Have you booked your Demo?',
    previewImage: reference2,
    hasVideo: true,
    cost: '£40',
    impressions: 20,
    linkClicks: 50,
    reach: 350,
  },
  {
    platform: 'Instagram',
    platformIcon: instagramIcon,
    title: 'Flossly OS for Dental Clinic',
    date: 'Thursday 12/12/2025 12:19am GMT',
    description: "Dental team don't fail because they're bad --- they fail because systems are messy",
    previewImage: reference3,
    hasVideo: true,
    cost: '£60',
    impressions: 15,
    linkClicks: 45,
    reach: 75,
  },
  {
    platform: 'Facebook',
    platformIcon: facebookIcon,
    title: 'Flossly OS for Dental Clinic',
    date: 'Saturday 12/12/2025 12:19am GMT',
    description: 'FlosslyOS diary - the smarter dental PMS',
    previewImage: reference4,
    hasVideo: true,
    cost: '£40',
    impressions: 30,
    linkClicks: 9,
    reach: 400,
  },
]);

// Filtered campaigns based on search
const filteredCampaigns = computed(() => {
  if (!search.value) return campaigns.value;
  
  const searchLower = search.value.toLowerCase();
  return campaigns.value.filter((campaign) => {
    return (
      campaign.title.toLowerCase().includes(searchLower) ||
      campaign.description.toLowerCase().includes(searchLower) ||
      campaign.platform.toLowerCase().includes(searchLower)
    );
  });
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
