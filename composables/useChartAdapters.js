/**
 * Chart Data Adapters
 * Transforms raw data from various sources (Google Analytics, Meta Ads, etc.)
 * into a standardized normalized format for CrmCharts component
 */

/**
 * Normalize raw data to standardized chart format
 * @param {Array} rawData - Raw data array from API/DB
 * @param {Object} config - Configuration object
 * @returns {Object} - Normalized chart data
 */
export const normalizeChartData = (rawData = [], config = {}) => {
  const {
    dateField = 'date',
    metricFields = [],
    metricLabels = [],
    chartType = 'line',
    chartTitle = 'Chart',
    chartSubtitle = '',
    summaryStatFields = [],
    colors = [],
    dateFormat = 'short' // 'short' = "Mar 01", 'full' = "March 01, 2024"
  } = config

  if (!rawData || rawData.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  // Extract labels (dates)
  const labels = rawData.map(row => formatDate(row[dateField], dateFormat))

  // Build datasets
  const defaultColors = [
    '#3B82F6', // Blue
    '#F97316', // Orange
    '#10B981', // Green
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F59E0B'  // Amber
  ]

  const datasets = metricFields.map((field, index) => {
    const data = rawData.map(row => {
      const value = row[field]
      return typeof value === 'string' ? parseFloat(value) : value || 0
    })

    const color = colors[index] || defaultColors[index] || defaultColors[0]
    const label = metricLabels[index] || field

    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color + '1F', // Add transparency
      borderWidth: 2,
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }
  })

  // Calculate summary statistics
  const summary = calculateSummaryStats(rawData, summaryStatFields)

  return {
    chartData: {
      labels,
      datasets
    },
    summary,
    chartType,
    chartTitle,
    chartSubtitle
  }
}

/**
 * Transform Google Analytics raw data
 * @param {Object} rawData - Google Analytics API response
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformGoogleAnalyticsData = (rawData = {}, options = {}) => {
  const {
    metricLabels = ['Sessions', 'Conversions'],
    summaryLabels = ['Total Sessions', 'Total Conversions', 'Conversion Rate'],
    chartType = 'line',
    colors = ['#3B82F6', '#F97316']
  } = options

  // Handle Google Analytics response format
  const rows = rawData?.rows || []

  if (rows.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: [
        { label: summaryLabels[0], value: '0' },
        { label: summaryLabels[1], value: '0' }
      ]
    }
  }

  // Transform GA rows to normalized format
  const transformed = rows.map(row => {
    const date = row.dimensions?.[0] || ''
    const values = row.metrics?.[0]?.values || []

    return {
      date,
      metric1: parseInt(values[0]) || 0,
      metric2: parseInt(values[1]) || 0
    }
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['metric1', 'metric2'],
    metricLabels,
    chartType,
    chartTitle: 'Google Analytics',
    summaryStatFields: ['metric1', 'metric2'],
    colors
  })

  // Add custom summary stats
  const totalMetric1 = transformed.reduce((sum, row) => sum + row.metric1, 0)
  const totalMetric2 = transformed.reduce((sum, row) => sum + row.metric2, 0)
  const conversionRate = totalMetric1 > 0 ? ((totalMetric2 / totalMetric1) * 100).toFixed(2) : '0'

  normalized.summary = [
    { label: summaryLabels[0], value: totalMetric1.toLocaleString() },
    { label: summaryLabels[1], value: totalMetric2.toLocaleString() },
    { label: summaryLabels[2], value: conversionRate + '%' }
  ]

  return normalized
}


/**
 * Transform Google Ads raw data
 * @param {Object} rawData - Google Ads API response or DB data
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformGoogleAdsData = (rawData = {}, options = {}) => {
  const {
    metricLabels = ['Impressions', 'Clicks', 'Conversions'],
    summaryLabels = ['Total Impressions', 'Total Clicks', 'Click Rate', 'Total Conversions'],
    chartType = 'line',
    colors = ['#3B82F6', '#F97316', '#10B981']
  } = options

  const data = rawData?.data || rawData?.campaigns || []

  if (data.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  const transformed = data.map(row => {
    const date = row.date || row.date_start || ''
    const impressions = parseInt(row.impressions) || 0
    const clicks = parseInt(row.clicks) || 0
    const conversions = parseInt(row.conversions) || 0

    return {
      date,
      metric1: impressions,
      metric2: clicks,
      metric3: conversions
    }
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['metric1', 'metric2', 'metric3'],
    metricLabels,
    chartType,
    chartTitle: 'Google Ads Analytics',
    colors
  })

  // Custom summary
  const totalImpressions = transformed.reduce((sum, row) => sum + row.metric1, 0)
  const totalClicks = transformed.reduce((sum, row) => sum + row.metric2, 0)
  const clickRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const totalConversions = transformed.reduce((sum, row) => sum + row.metric3, 0)

  normalized.summary = [
    { label: summaryLabels[0], value: totalImpressions.toLocaleString() },
    { label: summaryLabels[1], value: totalClicks.toLocaleString() },
    { label: summaryLabels[2], value: clickRate + '%' },
    { label: summaryLabels[3], value: totalConversions.toLocaleString() }
  ]

  return normalized
}

/**
 * Transform Google Search Console raw data
 * @param {Object} rawData - GSC API response or DB data
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformGoogleSearchConsoleData = (rawData = {}, options = {}) => {
  const {
    metricLabels = ['Clicks', 'Impressions'],
    summaryLabels = ['Total Clicks', 'Total Impressions', 'CTR', 'Avg Position'],
    chartType = 'line',
    colors = ['#3B82F6', '#F97316']
  } = options

  const data = rawData?.data || rawData?.rows || []

  if (data.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  const transformed = data.map(row => {
    const date = row.date || row.dateStart || ''
    const clicks = parseInt(row.clicks) || 0
    const impressions = parseInt(row.impressions) || 0
    const position = parseFloat(row.position) || 0

    return {
      date,
      metric1: clicks,
      metric2: impressions,
      position
    }
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['metric1', 'metric2'],
    metricLabels,
    chartType,
    chartTitle: 'Google Search Console',
    colors
  })

  // Custom summary
  const totalClicks = transformed.reduce((sum, row) => sum + row.metric1, 0)
  const totalImpressions = transformed.reduce((sum, row) => sum + row.metric2, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const avgPosition = transformed.length > 0
    ? (transformed.reduce((sum, row) => sum + row.position, 0) / transformed.length).toFixed(2)
    : '0'

  normalized.summary = [
    { label: summaryLabels[0], value: totalClicks.toLocaleString() },
    { label: summaryLabels[1], value: totalImpressions.toLocaleString() },
    { label: summaryLabels[2], value: ctr + '%' },
    { label: summaryLabels[3], value: avgPosition }
  ]

  return normalized
}

/**
 * Transform Google Business Profile raw data
 * @param {Object} rawData - Google Business Profile API response or DB data
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformGoogleBusinessData = (rawData = {}, options = {}) => {
  const {
    metricLabels = ['Views', 'Actions', 'Directions Requests'],
    summaryLabels = ['Total Views', 'Total Actions', 'Total Directions', 'Engagement Rate'],
    chartType = 'bar',
    colors = ['#3B82F6', '#10B981', '#F59E0B']
  } = options

  const data = rawData?.data || rawData?.insights || []

  if (data.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  const transformed = data.map(row => {
    const date = row.date || row.dateStart || ''
    const views = parseInt(row.views) || 0
    const actions = parseInt(row.actions) || 0
    const directions = parseInt(row.directionsRequests) || 0

    return {
      date,
      metric1: views,
      metric2: actions,
      metric3: directions
    }
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['metric1', 'metric2', 'metric3'],
    metricLabels,
    chartType,
    chartTitle: 'Google Business Profile',
    colors
  })

  // Custom summary
  const totalViews = transformed.reduce((sum, row) => sum + row.metric1, 0)
  const totalActions = transformed.reduce((sum, row) => sum + row.metric2, 0)
  const totalDirections = transformed.reduce((sum, row) => sum + row.metric3, 0)
  const engagementRate = totalViews > 0 ? ((totalActions / totalViews) * 100).toFixed(2) : '0'

  normalized.summary = [
    { label: summaryLabels[0], value: totalViews.toLocaleString() },
    { label: summaryLabels[1], value: totalActions.toLocaleString() },
    { label: summaryLabels[2], value: totalDirections.toLocaleString() },
    { label: summaryLabels[3], value: engagementRate + '%' }
  ]

  return normalized
}

/**
 * Transform WhatsApp Analytics raw data
 * @param {Object} rawData - WhatsApp API response or DB data
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformWhatsAppAnalyticsData = (rawData = {}, options = {}) => {
  const {
    metricLabels = ['Messages Sent', 'Messages Received', 'Conversions'],
    summaryLabels = ['Total Sent', 'Total Received', 'Conversion Rate', 'Avg Response Time'],
    chartType = 'line',
    colors = ['#10B981', '#3B82F6', '#F97316']
  } = options

  const data = rawData?.data || rawData?.messages || []

  if (data.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  const transformed = data.map(row => {
    const date = row.date || row.dateStart || ''
    const sent = parseInt(row.messagesSent) || 0
    const received = parseInt(row.messagesReceived) || 0
    const conversions = parseInt(row.conversions) || 0

    return {
      date,
      metric1: sent,
      metric2: received,
      metric3: conversions
    }
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['metric1', 'metric2', 'metric3'],
    metricLabels,
    chartType,
    chartTitle: 'WhatsApp Analytics',
    colors
  })

  // Custom summary
  const totalSent = transformed.reduce((sum, row) => sum + row.metric1, 0)
  const totalReceived = transformed.reduce((sum, row) => sum + row.metric2, 0)
  const totalConversions = transformed.reduce((sum, row) => sum + row.metric3, 0)
  const conversionRate = totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(2) : '0'

  normalized.summary = [
    { label: summaryLabels[0], value: totalSent.toLocaleString() },
    { label: summaryLabels[1], value: totalReceived.toLocaleString() },
    { label: summaryLabels[2], value: conversionRate + '%' },
    { label: summaryLabels[3], value: '~2 min' } // This would come from data if available
  ]

  return normalized
}

/**
 * Transform Meta Insights raw data
 * @param {Array} rawInsights - Array of Meta insight objects from DB
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
const META_CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$' }

export const transformMetaInsightsData = (rawInsights = [], options = {}) => {
  const {
    metricLabels = ['Spend', 'Leads', 'CPL', 'CTR', 'Impressions', 'Clicks'],
    summaryLabels = ['Total Spend', 'Total Leads', 'Avg CPL', 'Avg CTR', 'Total Impressions', 'Total Clicks'],
    chartType = 'bar',
    colors = ['#3B82F6', '#F97316', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'],
    currency = 'GBP',
  } = options
  const sym = META_CURRENCY_SYMBOLS[currency?.toUpperCase()] || '£'

  if (!rawInsights || rawInsights.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  // Filter for campaign-level insights to avoid double counting
  const campaignInsights = rawInsights.filter(i => i.entityType === 'campaign')

  // Group by date
  const insightsByDate = {}

  campaignInsights.forEach(insight => {
    const dateKey = insight.date // date is already dateonly (YYYY-MM-DD)
    if (!insightsByDate[dateKey]) {
      insightsByDate[dateKey] = {
        date: dateKey,
        spend: 0,
        leads: 0,
        impressions: 0,
        clicks: 0
      }
    }

    insightsByDate[dateKey].spend += Number(insight.spend || 0)
    insightsByDate[dateKey].leads += Number(insight.leads || 0)
    insightsByDate[dateKey].impressions += Number(insight.impressions || 0)
    insightsByDate[dateKey].clicks += Number(insight.clicks || 0)
  })

  // Convert to array and sort by date
  const transformed = Object.values(insightsByDate).sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calculate CPL and CTR for each date
  transformed.forEach(day => {
    // spend is in minor units (cents), convert to major units for display
    day.spendAmount = day.spend / 100
    day.cpl = day.leads > 0 ? day.spendAmount / day.leads : 0
    day.ctr = day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['spendAmount', 'leads', 'cpl', 'ctr', 'impressions', 'clicks'],
    metricLabels,
    chartType,
    chartTitle: 'Meta Analytics',
    colors
  })

  // Calculate totals for summary
  const totalSpend = campaignInsights.reduce((sum, i) => sum + Number(i.spend || 0), 0) / 100
  const totalLeads = campaignInsights.reduce((sum, i) => sum + Number(i.leads || 0), 0)
  const totalImpressions = campaignInsights.reduce((sum, i) => sum + Number(i.impressions || 0), 0)
  const totalClicks = campaignInsights.reduce((sum, i) => sum + Number(i.clicks || 0), 0)

  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  normalized.summary = [
    { label: summaryLabels[0], value: sym + totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { label: summaryLabels[1], value: totalLeads.toLocaleString() },
    { label: summaryLabels[2], value: avgCpl > 0 ? sym + avgCpl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
    { label: summaryLabels[3], value: avgCtr.toFixed(2) + '%' },
    { label: summaryLabels[4], value: totalImpressions.toLocaleString() },
    { label: summaryLabels[5], value: totalClicks.toLocaleString() }
  ]

  return normalized
}

/**
 * Transform Leads Conversion raw data
 * @param {Array} rawLeads - Array of lead objects from DB
 * @param {Object} options - Configuration options
 * @returns {Object} - Normalized chart data
 */
export const transformLeadsConversionData = (rawLeads = [], options = {}) => {
  const {
    metricLabels = ['Total Leads', 'Converted Leads'],
    summaryLabels = ['Total Leads', 'New Leads', 'Converted', 'Contacted', 'Lost'],
    chartType = 'line',
    colors = ['#3B82F6', '#F97316']
  } = options

  if (!rawLeads || rawLeads.length === 0) {
    return {
      chartData: {
        labels: [],
        datasets: []
      },
      summary: []
    }
  }

  // Group leads by date
  const leadsByDate = {}

  rawLeads.forEach(lead => {
    const date = new Date(lead.inquiryDate || lead.createdAt || 0)
    if (Number.isNaN(date.valueOf())) return

    const dateKey = formatDateToKey(date)
    if (!leadsByDate[dateKey]) {
      leadsByDate[dateKey] = {
        date: dateKey,
        total: 0,
        converted: 0,
        new: 0,
        contacted: 0,
        lost: 0
      }
    }

    leadsByDate[dateKey].total += 1

    const status = (lead.leadStatus || '').toLowerCase()
    if (status === 'converted') leadsByDate[dateKey].converted += 1
    if (status === 'new') leadsByDate[dateKey].new += 1
    if (status === 'contacted') leadsByDate[dateKey].contacted += 1
    if (status === 'lost') leadsByDate[dateKey].lost += 1
  })

  // Sort by date and convert to array
  const transformed = Object.values(leadsByDate).sort((a, b) => {
    return new Date(a.date) - new Date(b.date)
  })

  const normalized = normalizeChartData(transformed, {
    dateField: 'date',
    metricFields: ['total', 'converted'],
    metricLabels,
    chartType,
    chartTitle: 'Leads Conversion',
    summaryStatFields: ['total', 'converted', 'new', 'contacted', 'lost'],
    colors
  })

  // Calculate summary stats
  const totalLeads = rawLeads.length
  const convertedLeads = rawLeads.filter(l => (l.leadStatus || '').toLowerCase() === 'converted').length
  const newLeads = rawLeads.filter(l => (l.leadStatus || '').toLowerCase() === 'new').length
  const contactedLeads = rawLeads.filter(l => (l.leadStatus || '').toLowerCase() === 'contacted').length
  const lostLeads = rawLeads.filter(l => (l.leadStatus || '').toLowerCase() === 'lost').length

  normalized.summary = [
    { label: summaryLabels[0], value: totalLeads.toLocaleString() },
    { label: summaryLabels[1], value: newLeads.toLocaleString() },
    { label: summaryLabels[2], value: convertedLeads.toLocaleString() },
    { label: summaryLabels[3], value: contactedLeads.toLocaleString() },
    { label: summaryLabels[4], value: lostLeads.toLocaleString() }
  ]

  return normalized
}

/**
 * Helper function to format date
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short' or 'full')
 * @returns {string} - Formatted date
 */
function formatDate(date, format = 'short') {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (Number.isNaN(dateObj.valueOf())) return date

  const day = dateObj.getDate()
  const month = dateObj.toLocaleString('en-US', { month: 'short' })

  if (format === 'short') {
    return `${month} ${day}`
  }

  const year = dateObj.getFullYear()
  return `${month} ${day}, ${year}`
}

/**
 * Helper to format date to key (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
function formatDateToKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate summary statistics from raw data
 * @param {Array} rawData
 * @param {Array} fields
 * @returns {Array}
 */
function calculateSummaryStats(rawData, fields) {
  const stats = []

  fields.forEach(field => {
    const total = rawData.reduce((sum, row) => {
      const value = row[field]
      return sum + (typeof value === 'string' ? parseFloat(value) : value || 0)
    }, 0)

    stats.push({
      label: field.charAt(0).toUpperCase() + field.slice(1),
      value: total.toLocaleString()
    })
  })

  return stats
}