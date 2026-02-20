<template>
  <v-sheet color="background" class="crm-overview">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Flossly CRM</p>
    </div>

    <div class="crm-body px-5 py-6">
      <div class="section-header">
        <h3>Integration Details</h3>
        <p>Connect your favorite tools to automate tasks, streamline workflows, and boost productivity</p>
      </div>

      <div class="integration-grid">
        <IntegrationCard
          v-for="card in integrationCards"
          :key="card.key"
          :title="card.title"
          :subtitle-primary="card.subtitlePrimary"
          :subtitle-secondary="card.subtitleSecondary"
          :status-label="card.statusLabel"
          :status-color="card.statusColor"
          :icon="card.icon"
          :icon-class="card.iconClass"
        >
          <template #actions>
            <template v-if="card.key === 'meta'">
              <v-btn
                color="primary"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="openMetaHealth"
              >
                Meta Health
              </v-btn>
              <v-btn
                v-if="isMetaConnected"
                color="grey-darken-1"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="disconnectMeta"
              >
                Disconnect
              </v-btn>
              <v-btn
                v-else
                color="grey-darken-1"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="integrateMeta"
              >
                Connect
              </v-btn>
            </template>
            <template v-else-if="card.key === 'whatsapp'">
              <v-btn
                v-if="isWhatsAppConnected"
                color="grey-darken-1"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="openWhapiDialog"
              >
                Show QR / Change Number
              </v-btn>
              <v-btn
                v-if="isWhatsAppConnected"
                color="error"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                :loading="whapiDisconnecting"
                @click="disconnectWhapi"
              >
                Logout
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn"
                :loading="whapiLoading"
                @click="connectWhapi"
              >
                Connect
              </v-btn>
            </template>
            <template v-else>
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn"
                @click="onConnectChatbot"
              >
                Connect
              </v-btn>
            </template>
          </template>
        </IntegrationCard>
      </div>

      <div class="conversion-grid mt-8">
        <v-card class="conversion-card" elevation="0" rounded="lg">
          <h4 class="card-head">Leads Conversion</h4>
          <div class="card-body">
            <div class="chart-shell">
              <canvas ref="leadChartRef" />
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="dot total"></span>
                <span>Total Lead</span>
              </div>
              <div class="legend-item">
                <span class="dot converted"></span>
                <span>Converted Leads</span>
              </div>
            </div>
            <div class="lead-stats">
              <div class="stat-row">
                <span>Total Leads (this month)</span>
                <span>{{ monthlySummary.total }}</span>
              </div>
              <div class="stat-row">
                <span>New Leads</span>
                <span>{{ monthlySummary.new }}</span>
              </div>
              <div class="stat-row">
                <span>Converted</span>
                <span>{{ monthlySummary.converted }}</span>
              </div>
              <div class="stat-row">
                <span>Contacted</span>
                <span>{{ monthlySummary.contacted }}</span>
              </div>
              <div class="stat-row">
                <span>Lost</span>
                <span>{{ monthlySummary.lost }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <CustomerRelationManagementMetaHealthDialog
      v-model="metaHealthDialog"
      :loading="metaHealthLoading"
      :data="metaHealthData"
    />

    <v-dialog v-model="whapiDialog" max-width="520">
      <v-card class="pa-4">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex justify-space-between align-center">
          <span>WhatsApp Connection</span>
          <v-chip
            :color="isWhatsAppConnected ? 'success' : 'grey-lighten-1'"
            size="small"
            label
          >
            {{ isWhatsAppConnected ? 'Connected' : 'Not Connected' }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="whapiQr" class="d-flex flex-column align-center gap-2">
            <img :src="whapiQr" alt="WhatsApp QR" style="max-width: 260px;" />
            <div class="text-caption text-medium-emphasis">
              Scan this QR code using WhatsApp on the phone you want to connect or switch to.
            </div>
          </div>
          <v-alert
            v-else-if="whapiDisplayLabel"
            type="info"
            variant="tonal"
            class="mb-2"
          >
            Connected phone: {{ whapiDisplayLabel }}
          </v-alert>
          <v-alert v-else type="info" variant="tonal" class="mb-2">
            QR code not ready yet. Please refresh in a moment.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-0 mt-4">
          <v-btn variant="text" @click="whapiDialog = false">Close</v-btn>
          <v-spacer />
          <v-btn
            :loading="whapiLoading"
            variant="flat"
            color="primary"
            @click="refreshWhapiQr"
          >
            Refresh QR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-sheet>
</template>

<script setup>
import { format, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import { useAuthStore } from '@/stores/auth'
import CustomerRelationManagementMetaHealthDialog from '@/components/customerRelationManagement/metaHealthDialog.vue'
import IntegrationCard from '@/components/customerRelationManagement/IntegrationCard.vue'
import metaLogo from '@/assets/crm/meta-logo.svg'
import whatsappLogo from '@/assets/crm/whatsapp-logo.svg'
import chatbotLogo from '@/assets/crm/chatbot-logo.svg'

const crmStore = useCrmStore()
const mainStore = useMainStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const user = ref(null)
const isMetaConnected = ref(false)
const isWhatsAppConnected = ref(false)
const whapiDialog = ref(false)
const whapiQr = ref('')
const whapiLoading = ref(false)
const whapiDisconnecting = ref(false)
const whapiStatus = reactive({
  connected: false,
  channelId: '',
  phoneNumber: '',
  displayName: '',
  status: '',
})

const leadRows = ref([])
const leadChartRef = ref(null)
let leadChartInstance = null

const metaHealthDialog = ref(false)
const metaHealthLoading = ref(false)
const metaHealthData = ref(null)


const userEmail = computed(() => user.value?.email || '')
const whapiDisplayLabel = computed(() => {
  if (whapiStatus.displayName && whapiStatus.phoneNumber) {
    return `${whapiStatus.displayName} (${whapiStatus.phoneNumber})`
  }
  return whapiStatus.displayName || whapiStatus.phoneNumber || ''
})
const currentOrgName = computed(() => {
  const orgId = user.value?.currentLoggedInOrgId
  const list = user.value?.userOrganisations || []
  const match = list.find((row) => row.organisationId === orgId)
  return match?.organisation?.name || ''
})

const integrationCards = computed(() => ([
  {
    key: 'meta',
    title: 'Meta',
    subtitlePrimary: userEmail.value || '-',
    subtitleSecondary: currentOrgName.value || '-',
    statusLabel: isMetaConnected.value ? 'Connected' : 'Not Connected',
    statusColor: isMetaConnected.value ? 'success' : 'grey-lighten-1',
    icon: metaLogo,
    iconClass: 'meta',
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp',
    subtitlePrimary: whapiDisplayLabel.value || userEmail.value || '-',
    subtitleSecondary: currentOrgName.value || '-',
    statusLabel: isWhatsAppConnected.value ? 'Connected' : 'Not Connected',
    statusColor: isWhatsAppConnected.value ? 'success' : 'grey-lighten-1',
    icon: whatsappLogo,
    iconClass: 'whatsapp',
  },
  {
    key: 'chatbot',
    title: 'Chatbot',
    subtitlePrimary: userEmail.value || '-',
    subtitleSecondary: currentOrgName.value || '-',
    statusLabel: 'Not Connected',
    statusColor: 'grey-lighten-1',
    icon: chatbotLogo,
    iconClass: 'chatbot',
  },
]))

const normalizeMetaMessage = (message) => {
  if (!message) return ''
  const raw = Array.isArray(message) ? message[0] : message
  try {
    return decodeURIComponent(String(raw))
  } catch (e) {
    return String(raw)
  }
}

const mapMetaErrorMessage = (rawMessage) => {
  const msg = normalizeMetaMessage(rawMessage).trim()
  if (!msg) return ''
  const lower = msg.toLowerCase()
  if (lower.includes('access_denied')) {
    return 'Meta login was cancelled or permission was denied.'
  }
  if (lower.includes('invalid scope') || lower.includes('invalid_scope')) {
    return 'Requested Meta permissions are invalid or not approved for this app.'
  }
  if (lower.includes('invalid state') || lower.includes('csrf')) {
    return 'Login session expired or invalid. Please try connecting again.'
  }
  if (lower.includes('missing authorization code')) {
    return 'Meta did not return an authorization code. Please try again.'
  }
  if (lower.includes('meta app not configured')) {
    return 'Meta app is not configured. Please contact your administrator.'
  }
  if (lower === 'validation error') {
    return 'Meta connection failed due to a validation error. If the page is already connected to another organisation, disconnect it there first.'
  }
  return msg
}

const clearMetaQuery = () => {
  const nextQuery = { ...route.query }
  delete nextQuery.meta
  delete nextQuery.pages
  delete nextQuery.user
  delete nextQuery.error
  delete nextQuery.warning
  router.replace({ query: nextQuery })
}

const handleMetaQuery = () => {
  const metaConnected = route.query.meta === 'connected'
  const metaError = route.query.error
  const pagesCount = Number(route.query.pages || 0)

  if (metaError) {
    const msg = mapMetaErrorMessage(metaError) || 'Meta connection failed. Please try again.'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } else if (metaConnected && pagesCount === 0) {
    const msg = 'Meta could not be connected. You need full access to the page you are trying to connect.'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } else if (metaConnected) {
    mainStore?.setSnackbar?.({ title: 'Meta connected successfully', type: 'success' })
  }
  if (metaConnected || metaError) clearMetaQuery()
}

const openMetaHealth = async () => {
  metaHealthDialog.value = true
  metaHealthLoading.value = true
  try {
    const res = await crmStore.metaHealth()
    if (res?.code === 0) {
      metaHealthData.value = res.data || null
    } else {
      metaHealthData.value = { error: res?.error || res?.message || 'Failed to load health status' }
    }
  } catch (e) {
    metaHealthData.value = { error: e?.data?.message || e?.message || 'Failed to load health status' }
  } finally {
    metaHealthLoading.value = false
  }
}

const loadUser = () => {
  if (localStorage.getItem('user')) {
    try {
      user.value = JSON.parse(localStorage.getItem('user'))
    } catch (e) {
      user.value = null
    }
  }
}

const checkMetaConnection = async () => {
  try {
    const res = await crmStore.connectionStatus()
    if (res?.code === 0) {
      const count = Number(res.data?.count || 0)
      isMetaConnected.value = count > 0
    } else {
      isMetaConnected.value = false
    }
  } catch (e) {
    isMetaConnected.value = false
  }
}

const integrateMeta = async () => {
  const res = await crmStore.startMetaAuth()
  if (res && res.code === 0 && res.data?.url) {
    window.location.href = res.data.url
    return
  }
  mainStore?.setSnackbar?.({ title: res?.message || 'Unable to start Meta connection', type: 'error' })
}

const disconnectMeta = async () => {
  try {
    const res = await crmStore.disconnectMeta()
    if (res?.code === 0) {
      await checkMetaConnection()
      mainStore?.setSnackbar?.({ title: 'Meta disconnected', type: 'success' })
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || 'Failed to disconnect Meta', type: 'error' })
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to disconnect Meta', type: 'error' })
  }
}

const loadWhapiStatus = async () => {
  try {
    const res = await crmStore.getWhapiStatus()
    if (res?.code === 0 && res.data) {
      whapiStatus.connected = !!res.data.connected
      whapiStatus.channelId = res.data.channelId || ''
      whapiStatus.phoneNumber = res.data.phoneNumber || ''
      whapiStatus.displayName = res.data.displayName || ''
      whapiStatus.status = res.data.status || ''
      isWhatsAppConnected.value = whapiStatus.connected || !!whapiDisplayLabel.value
    } else {
      whapiStatus.connected = false
      whapiStatus.channelId = ''
      whapiStatus.phoneNumber = ''
      whapiStatus.displayName = ''
      whapiStatus.status = ''
      isWhatsAppConnected.value = false
    }
  } catch (e) {
    whapiStatus.connected = false
    whapiStatus.channelId = ''
    whapiStatus.phoneNumber = ''
    whapiStatus.displayName = ''
    whapiStatus.status = ''
    isWhatsAppConnected.value = false
  }
}

const connectWhapi = async () => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const res = await crmStore.startWhapiConnect()
    if (res?.code === 0 && res.data) {
      whapiQr.value = res.data.qr || ''
      whapiDialog.value = true
      await loadWhapiStatus()
      return
    }
    const msg = res?.error || res?.message || 'Failed to connect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to connect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whapiLoading.value = false
  }
}

const refreshWhapiQr = async () => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const res = await crmStore.getWhapiQr()
    if (res?.code === 0 && res.data) {
      whapiQr.value = res.data.qr || ''
      await loadWhapiStatus()
      return
    }
    const msg = res?.error || res?.message || 'Unable to refresh QR'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Unable to refresh QR'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whapiLoading.value = false
  }
}

const openWhapiDialog = async () => {
  whapiDialog.value = true
  await refreshWhapiQr()
}

const disconnectWhapi = async () => {
  if (whapiDisconnecting.value) return
  whapiDisconnecting.value = true
  try {
    const res = await crmStore.disconnectWhapi()
    if (res?.code === 0) {
      whapiQr.value = ''
      await loadWhapiStatus()
      mainStore?.setSnackbar?.({ title: 'WhatsApp logged out', type: 'success' })
      return
    }
    const msg = res?.error || res?.message || 'Failed to logout WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to logout WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whapiDisconnecting.value = false
  }
}

const onConnectChatbot = async () => {
  try {
    const res = await authStore.createShortToken()
    if (res?.code === 0 && res.data) {
      const config = useRuntimeConfig()
      window.open(
        `${config.public.CHATBOT_URL}/botbuilder/auth?token=${res.data}`,
        '_blank'
      )
      return
    }
    mainStore?.setSnackbar?.({ title: res?.message || 'Unable to connect chatbot', type: 'error' })
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Unable to connect chatbot', type: 'error' })
  }
}

const activeLeads = computed(() => (leadRows.value || []).filter((lead) => !lead?.softDeleted))

const monthlySummary = computed(() => {
  const start = startOfMonth(new Date())
  const scoped = activeLeads.value.filter((lead) => {
    const date = new Date(lead?.inquiryDate || lead?.createdAt || 0)
    return !Number.isNaN(date.valueOf()) && date >= start
  })
  const byStatus = (status) =>
    scoped.filter((lead) => (lead.leadStatus || '').toLowerCase() === status).length
  return {
    total: scoped.length,
    new: byStatus('new'),
    converted: byStatus('converted'),
    contacted: byStatus('contacted'),
    lost: byStatus('lost'),
  }
})

const buildLeadSeries = (days = 30) => {
  const today = startOfDay(new Date())
  const labels = []
  const totalCounts = []
  const convertedCounts = []
  const indexByDate = new Map()

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = subDays(today, i)
    const key = format(d, 'yyyy-MM-dd')
    indexByDate.set(key, labels.length)
    labels.push(format(d, 'd MMM'))
    totalCounts.push(0)
    convertedCounts.push(0)
  }

  activeLeads.value.forEach((lead) => {
    const date = new Date(lead?.inquiryDate || lead?.createdAt || 0)
    if (Number.isNaN(date.valueOf())) return
    const key = format(startOfDay(date), 'yyyy-MM-dd')
    const idx = indexByDate.get(key)
    if (idx == null) return
    totalCounts[idx] += 1
    if ((lead.leadStatus || '').toLowerCase() === 'converted') {
      convertedCounts[idx] += 1
    }
  })

  return { labels, totalCounts, convertedCounts }
}

const renderLeadChart = async () => {
  if (!leadChartRef.value) return
  const { labels, totalCounts, convertedCounts } = buildLeadSeries(30)
  const { Chart } = await import('chart.js/auto')

  if (leadChartInstance) {
    leadChartInstance.destroy()
  }

  leadChartInstance = new Chart(leadChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Lead',
          data: totalCounts,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: 'Converted Leads',
          data: convertedCounts,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.12)',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxTicksLimit: 6,
            color: '#9CA3AF',
          },
        },
        y: {
          grid: { color: '#E5E7EB' },
          beginAtZero: true,
          suggestedMin: 0,
          ticks: { color: '#9CA3AF' },
        },
      },
    },
  })
}

const loadLeads = async () => {
  try {
    const res = await crmStore.listLeads({ includeArchived: true })
    if (res?.code === 0) {
      leadRows.value = res.data || []
    } else {
      leadRows.value = []
    }
  } catch (e) {
    leadRows.value = []
  } finally {
    await nextTick()
    renderLeadChart()
  }
}


onMounted(async () => {
  loadUser()
  handleMetaQuery()
  await Promise.all([checkMetaConnection(), loadWhapiStatus(), loadLeads()])
})

watch(activeLeads, async () => {
  await nextTick()
  renderLeadChart()
})

onBeforeUnmount(() => {
  if (leadChartInstance) {
    leadChartInstance.destroy()
    leadChartInstance = null
  }
})
</script>

<style scoped>
.crm-overview {
  background: #ffffff;
}

.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}

.crm-body {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.integration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}


.action-btn {
  min-width: 110px;
}

.conversion-grid {
  display: grid;
  grid-template-columns: 1fr;
}

.conversion-card {
  border: 1px solid #dbdbdb;
  background: #ffffff;
}

.card-head {
  font-weight: 600;
  font-size: 16px;
  padding: 24px;
  border-bottom: 1px solid #dbdbdb;
}

.card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-shell {
  height: 320px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px;
  background: #ffffff;
}

.chart-legend {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #374151;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot.total {
  background: #3b82f6;
}

.dot.converted {
  background: #f97316;
}

.lead-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #111827;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}


@media (max-width: 768px) {
  .chart-shell {
    height: 260px;
  }
}
</style>
