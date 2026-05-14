<template>
  <div class="ads-performance">
    <!-- Header with Account Info & Refresh -->
    <div class="performance-header d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center">
        <div class="account-badge mr-3">
          <v-icon size="20" color="primary">mdi-google-ads</v-icon>
        </div>
        <div>
          <h2 class="text-h6 font-weight-bold mb-0">{{ account?.name || 'Google Ads Account' }}</h2>
          <p class="text-caption text-medium-emphasis mb-0">{{ formatCustomerId(account?.googleCustomerId) }} • {{ account?.currency || 'USD' }}</p>
        </div>
      </div>
      
      <div class="d-flex align-center" style="gap: 12px;">
        <v-btn 
          variant="outlined" 
          color="grey-darken-1" 
          rounded="lg" 
          size="small"
          class="text-none"
          @click="$emit('change-account')"
        >
          Change Account
        </v-btn>
        
        <v-btn 
          variant="flat" 
          color="primary" 
          rounded="lg" 
          size="small"
          class="text-none"
          :loading="loading"
          @click="$emit('refresh')"
        >
          <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
          Refresh Data
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-5">{{ error }}</v-alert>

    <!-- Stat Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <CommonStatCard 
          uid="ads-impressions"
          icon="https://cdn.lordicon.com/asyunleq.json" 
          label="Impressions" 
          :value="formatNumber(performance?.totals?.impressions)" 
          hide-chip 
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <CommonStatCard 
          uid="ads-clicks"
          icon="https://cdn.lordicon.com/kphwxuxr.json" 
          label="Clicks" 
          :value="formatNumber(performance?.totals?.clicks)" 
          hide-chip 
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <CommonStatCard 
          uid="ads-cost"
          icon="https://cdn.lordicon.com/qlpudrww.json" 
          label="Cost" 
          :value="formatCurrency(performance?.totals?.costMicros, account?.currency)" 
          hide-chip 
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <CommonStatCard 
          uid="ads-conversions"
          icon="https://cdn.lordicon.com/excswhey.json" 
          label="Conversions" 
          :value="formatNumber(performance?.totals?.conversions)" 
          hide-chip 
        />
      </v-col>
    </v-row>

    <!-- Main View Section (Campaigns/Insights) -->
    <v-card variant="outlined" class="rounded-xl overflow-hidden border-opacity-25" color="grey-lighten-2">
      <div class="px-5 py-4 d-flex align-center bg-grey-lighten-5 border-b">
        <v-icon size="18" class="mr-2 text-grey-darken-1">mdi-bullhorn-outline</v-icon>
        <span class="text-subtitle-2 font-weight-bold text-grey-darken-3">Daily Performance Insights</span>
        <v-spacer />
        <span class="text-caption text-medium-emphasis">Last 30 Days</span>
      </div>
      
      <div v-if="loading && !performance" class="d-flex align-center justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!performance?.insights?.length" class="empty-insights py-12 text-center">
        <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-chart-line-variant</v-icon>
        <p class="text-grey-darken-1">No performance data found for the selected period.</p>
      </div>

      <div v-else class="table-container">
        <table class="ads-table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-right">Impressions</th>
              <th class="text-right">Clicks</th>
              <th class="text-right">Cost</th>
              <th class="text-right">Conversions</th>
              <th class="text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in sortedInsights" :key="idx" class="table-row">
              <td>
                <span class="text-caption font-weight-medium">{{ formatDate(row.date) }}</span>
              </td>
              <td class="text-right font-variant-nums">{{ formatNumber(row.impressions) }}</td>
              <td class="text-right font-variant-nums">{{ formatNumber(row.clicks) }}</td>
              <td class="text-right font-variant-nums text-warning">{{ formatCurrency(row.costMicros, account?.currency) }}</td>
              <td class="text-right font-variant-nums text-info">{{ formatNumber(row.conversions) }}</td>
              <td class="text-right">
                <v-chip size="x-small" density="comfortable" color="success" variant="tonal" class="font-weight-bold">
                  {{ calculateCTR(row.clicks, row.impressions) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps({
  account: { type: Object, default: null },
  performance: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

defineEmits(['refresh', 'change-account']);

const sortedInsights = computed(() => {
  if (!props.performance?.insights) return [];
  return [...props.performance.insights].sort((a, b) => new Date(b.date) - new Date(a.date));
});

const formatCustomerId = (id) => {
  if (!id) return '';
  const s = String(id);
  if (s.length === 10) {
    return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
  }
  return s;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatNumber = (val) => {
  if (val == null) return '0';
  return Number(val).toLocaleString();
};

const formatCurrency = (micros, currencyCode = 'USD') => {
  if (micros == null) return '—';
  const val = Number(micros) / 1000000;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode || 'USD',
  }).format(val);
};

const calculateCTR = (clicks, impressions) => {
  if (!impressions || impressions === '0') return '0%';
  const ctr = (Number(clicks) / Number(impressions)) * 100;
  return ctr.toFixed(2) + '%';
};
</script>

<style scoped lang="scss">
.ads-performance {
  font-family: 'DM Sans', sans-serif;
}

.account-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(37, 99, 235, 0.1);
}

.table-container {
  overflow-x: auto;
  background: white;
}

.ads-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  td {
    padding: 12px 16px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .table-row {
    transition: background 0.15s ease;
    &:hover {
      background: #f8fafc;
    }
  }
}

.font-variant-nums {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.border-b {
  border-bottom: 1px solid #e2e8f0;
}
</style>
