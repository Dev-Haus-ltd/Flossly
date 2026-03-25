/**
 * Chart Renderer Composable
 * Handles Chart.js initialization, updates, and cleanup
 */

import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

/**
 * Composable to manage Chart.js chart rendering
 * @param {Ref} canvasRef - Reference to canvas element
 * @returns {Object} - Chart management functions
 */
export function useChartRenderer(canvasRef) {
  let chartInstance = null

  /**
   * Initialize or update Chart.js chart
   * @param {Object} chartData - Normalized chart data from adapters
   * @param {string} chartType - Type of chart (line, bar, pie, etc)
   * @param {Object} chartConfig - Additional configuration options
   */
  const renderChart = async (chartData = {}, chartType = 'line', chartConfig = {}) => {
    // Wait for DOM to be ready
    await nextTick()

    if (!canvasRef.value) {
      console.warn('Canvas ref not available for chart rendering')
      return
    }

    // Lazy load Chart.js
    const { Chart } = await import('chart.js/auto')

    // Destroy existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }

    // Default configuration
    const defaultConfig = {
      height: 320,
      showLegend: true,
      legendPosition: 'bottom',
      animated: true,
      responsive: true,
      maintainAspectRatio: false,
      ...chartConfig
    }

    // Base chart options
    const baseOptions = {
      responsive: defaultConfig.responsive,
      maintainAspectRatio: defaultConfig.maintainAspectRatio,
      animation: defaultConfig.animated ? {
        duration: 750,
        easing: 'easeInOutQuart'
      } : false,
      plugins: {
        legend: {
          display: defaultConfig.showLegend,
          position: defaultConfig.legendPosition,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            },
            color: '#374151'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          borderColor: '#e5e7eb',
          borderWidth: 1,
          displayColors: true,
          callbacks: {
            afterTitle: () => {
              // Add extra spacing after title
            }
          }
        }
      }
    }

    // Chart type specific options
    let typeSpecificOptions = {}

    switch (chartType.toLowerCase()) {
      case 'line':
        typeSpecificOptions = {
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxTicksLimit: 6,
                color: '#9CA3AF',
                font: { size: 11 }
              }
            },
            y: {
              grid: { color: '#E5E7EB' },
              beginAtZero: true,
              ticks: {
                color: '#9CA3AF',
                font: { size: 11 }
              }
            }
          }
        }
        break

      case 'bar':
        typeSpecificOptions = {
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxTicksLimit: 8,
                color: '#9CA3AF',
                font: { size: 11 }
              }
            },
            y: {
              grid: { color: '#E5E7EB' },
              beginAtZero: true,
              ticks: {
                color: '#9CA3AF',
                font: { size: 11 }
              }
            }
          }
        }
        break

      case 'doughnut':
      case 'pie':
        typeSpecificOptions = {
          plugins: {
            ...baseOptions.plugins,
            tooltip: {
              ...baseOptions.plugins.tooltip,
              mode: 'nearest',
              intersect: false
            }
          }
        }
        break

      case 'radar':
        typeSpecificOptions = {
          scales: {
            r: {
              grid: { color: '#E5E7EB' },
              ticks: {
                color: '#9CA3AF',
                font: { size: 10 }
              }
            }
          }
        }
        break

      default:
        typeSpecificOptions = baseOptions
    }

    // Merge options
    const finalOptions = {
      ...baseOptions,
      ...typeSpecificOptions
    }

    // Create chart
    try {
      chartInstance = new Chart(canvasRef.value, {
        type: chartType,
        data: {
          labels: chartData.labels || [],
          datasets: chartData.datasets || []
        },
        options: finalOptions
      })
    } catch (error) {
      console.error('Error creating chart:', error)
    }
  }

  /**
   * Update chart data without re-creating it
   * @param {Object} newChartData - Updated chart data
   */
  const updateChartData = (newChartData = {}) => {
    if (!chartInstance) return

    chartInstance.data.labels = newChartData.labels || []
    chartInstance.data.datasets = newChartData.datasets || []
    chartInstance.update('none') // Update without animation
  }

  /**
   * Cleanup chart instance
   */
  const destroyChart = () => {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  }

  /**
   * Get current chart instance
   */
  const getChartInstance = () => chartInstance

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    destroyChart()
  })

  return {
    renderChart,
    updateChartData,
    destroyChart,
    getChartInstance
  }
}

/**
 * Composable to manage chart loading and error states
 */
export function useChartState() {
  const isLoading = ref(false)
  const error = ref(null)
  const chartData = ref({
    labels: [],
    datasets: [],
    summary: []
  })

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const setChartData = (data) => {
    chartData.value = data
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    isLoading,
    error,
    chartData,
    setLoading,
    setError,
    setChartData,
    clearError
  }
}