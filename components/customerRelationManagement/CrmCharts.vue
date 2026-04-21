<template>
  <v-card class="crm-chart-card" elevation="0" rounded="lg">
    <!-- Header -->
    <div class="chart-header">
      <div class="header-content">
        <h4 class="chart-title">{{ chartTitle }}</h4>
        <p v-if="chartSubtitle" class="chart-subtitle">{{ chartSubtitle }}</p>
      </div>
    </div>

    <!-- Body -->
    <div class="chart-body">
      <!-- Loading State -->
      <div v-if="isLoading" class="chart-loading">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-caption text-medium-emphasis mt-3">Loading chart...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="chart-error">
        <v-alert type="error" variant="tonal" class="mb-0">
          <template #title>Unable to load chart</template>
          {{ error }}
        </v-alert>
      </div>

      <!-- Fallback State -->
      <div v-else-if="showFallback" class="chart-fallback">
        <div class="fallback-content">
          <img :src="fallbackIcon" alt="No Data" class="fallback-icon" />
          <div class="fallback-text">
            <p class="fallback-title">No Data!</p>
            <p class="fallback-subtitle">Connect to watch analytics</p>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div v-else class="chart-content">
        <div class="chart-shell" :style="{ height: chartHeight }">
          <canvas ref="chartRef" />
        </div>

        <!-- Legend (Bottom) -->
        <div v-if="showLegend && chartType !== 'pie' && chartType !== 'doughnut'" class="chart-legend">
          <div v-for="(dataset, index) in chartData.datasets" :key="index" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: dataset.borderColor }"></span>
            <span class="legend-label">{{ dataset.label }}</span>
          </div>
        </div>

        <!-- Summary Stats -->
        <div v-if="summaryStats && summaryStats.length > 0" class="chart-stats">
          <div v-for="(stat, index) in summaryStats" :key="index" class="stat-row">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useChartRenderer } from '@/composables/useChartRenderer'
import fallbackIcon from '@/assets/icons/crm/charts-backfil-icon.svg'

/**
 * Props for CrmCharts Component
 */
const props = defineProps({
  // Chart Display
  chartType: {
    type: String,
    default: 'line',
    validator: (value) => ['line', 'bar', 'pie', 'doughnut', 'radar'].includes(value)
  },
  chartTitle: {
    type: String,
    required: true
  },
  chartSubtitle: {
    type: String,
    default: ''
  },

  // Data
  chartData: {
    type: Object,
    default: () => ({
      labels: [],
      datasets: []
    }),
    required: true
  },

  // Summary Statistics
  summaryStats: {
    type: Array,
    default: () => []
  },

  // Configuration
  chartHeight: {
    type: String,
    default: '320px'
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  legendPosition: {
    type: String,
    default: 'bottom',
    validator: (value) => ['top', 'bottom', 'right', 'left'].includes(value)
  },
  animated: {
    type: Boolean,
    default: true
  },

  // States
  isLoading: {
    type: Boolean,
    default: false
  },
  showFallback: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },

  // Additional config
  cardElevation: {
    type: Number,
    default: 0
  },
  cardRounded: {
    type: String,
    default: 'lg'
  }
})

/**
 * Emits
 */
const emit = defineEmits(['data-point-clicked', 'chart-rendered', 'error-occurred'])

// Template Refs
const chartRef = ref(null)

// Use chart renderer composable
const { renderChart, updateChartData, destroyChart } = useChartRenderer(chartRef)

/**
 * Watch for chart data changes
 */
watch(
  () => props.chartData,
  async (newData) => {
    if (newData && newData.datasets && newData.datasets.length > 0) {
      await renderChart(
        newData,
        props.chartType,
        {
          height: parseInt(props.chartHeight),
          showLegend: props.showLegend,
          legendPosition: props.legendPosition,
          animated: props.animated
        }
      )
      emit('chart-rendered')
    }
  },
  { deep: true, immediate: true }
)

/**
 * Watch for chart type changes
 */
watch(
  () => props.chartType,
  async (newType) => {
    if (props.chartData && props.chartData.datasets && props.chartData.datasets.length > 0) {
      await renderChart(
        props.chartData,
        newType,
        {
          height: parseInt(props.chartHeight),
          showLegend: props.showLegend,
          legendPosition: props.legendPosition,
          animated: props.animated
        }
      )
    }
  }
)

/**
 * Lifecycle
 */
onMounted(async () => {
  await nextTick()
  if (props.chartData && props.chartData.datasets && props.chartData.datasets.length > 0) {
    await renderChart(
      props.chartData,
      props.chartType,
      {
        height: parseInt(props.chartHeight),
        showLegend: props.showLegend,
        legendPosition: props.legendPosition,
        animated: props.animated
      }
    )
    emit('chart-rendered')
  }
})
</script>

<style scoped>
.crm-chart-card {
  border: 1px solid #dbdbdb;
  background: #ffffff;
  overflow: hidden;
}

.chart-header {
  padding: 24px;
  border-bottom: 1px solid #dbdbdb;
  background: #fafafa;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-title {
  font-weight: 600;
  font-size: 24px;
  margin: 0;
  color: #266DF0;
}

.chart-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.chart-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: auto;
}

.chart-loading,
.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  gap: 12px;
}

.chart-error {
  align-items: stretch;
  justify-content: flex-start;
}

.chart-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  background: #ffffff;
}

.fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
}

.fallback-icon {
  width: 192px;
  height: auto;
  opacity: 0.8;
}

.fallback-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fallback-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.fallback-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  max-width: 200px;
  line-height: 1.4;
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-shell {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px;
  background: #ffffff;
  position: relative;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #374151;
  padding: 0 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.legend-item:hover {
  opacity: 0.7;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.legend-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chart-body {
    min-height: auto;
  }

  .chart-shell {
    height: 260px !important;
  }

  .chart-legend {
    gap: 12px;
  }

  .chart-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }

  .stat-row {
    padding: 6px;
  }

  .stat-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .chart-header {
    padding: 16px;
  }

  .chart-body {
    padding: 16px;
  }

  .chart-stats {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .chart-title {
    font-size: 14px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
  }

  .legend-label {
    font-size: 11px;
  }
}
</style>