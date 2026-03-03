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
          :class="{ 'integration-card-disabled': card.key === 'whatsapp' && !canManageWhapi }"
        >
          <template #actions>
            <template v-if="card.key === 'meta'">
              <v-btn
                v-if="isMetaConnected"
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
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn action-btn--primary"
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
                :disabled="!canManageWhapi"
                @click="startWhapiChangeNumber"
              >
                Change Number
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
                class="action-btn action-btn--primary"
                :loading="whapiLoading"
                :disabled="!canManageWhapi"
                @click="openWhapiConnectDialog"
              >
                Connect
              </v-btn>
              <span
                v-if="!canManageWhapi"
                class="text-caption text-medium-emphasis mt-1"
              >
                WhatsApp is available on paid plans only.
              </span>
            </template>
            <!-- GOOGLE 
            <template v-else-if="card.key === 'google'">
              <v-btn
                color="primary"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                :disabled="!isGoogleConnected"
                @click="openGoogleHealth"
              >
                Google Health
              </v-btn>
              <v-btn
                v-if="isGoogleConnected"
                color="grey-darken-1"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="disconnectGoogle"
                :loading="googleDisconnecting"
              >
                Disconnect
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn action-btn--primary"
                :loading="googleConnecting"
                @click="connectGoogle"
              >
                Connect
              </v-btn>
            </template> 
            -->
            <!-- GOOGLE placed temperory above implementation is functional -->
            <template v-else-if="card.key === 'google'">
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn action-btn--primary"
                disabled
              >
                Coming Soon
              </v-btn>
            </template>
            <template v-else>
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn action-btn--primary"
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
    <!-- GOOGLE HEALTH DIALOG -->
    <CustomerRelationManagementGoogleAnalyticsGoogleHealthDialog
      v-model="googleHealthDialog"
      :loading="googleHealthLoading"
      :data="googleHealthData"
    />

    <v-dialog v-model="whapiDialog" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <span>WhatsApp Connection</span>
            <v-chip
              class="ml-2"
              :color="whapiStatusColor"
              size="small"
              label
            >
              {{ whapiStatusLabel }}
            </v-chip>
          </div>
          <v-btn icon variant="text" size="small" @click="whapiDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-alert
            v-if="!isWhatsAppConnected"
            type="warning"
            variant="tonal"
            class="mb-3"
          >
            This channel is not active. Messaging will fail until the WhatsApp channel is active.
          </v-alert>
          <v-alert
            v-else-if="whapiQrWarning"
            type="warning"
            variant="tonal"
            class="mb-3"
          >
            {{ whapiQrWarning }}
          </v-alert>
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
          <v-spacer />
          <v-btn
            :loading="whapiLoading"
            variant="flat"
            color="primary"
            @click="refreshWhapiQr"
          >
            {{ whapiQrCtaLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="whapiConnectDialog" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex align-center justify-space-between">
          <span>Connect WhatsApp</span>
          <v-btn icon variant="text" size="small" @click="whapiConnectDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <p class="text-caption text-medium-emphasis mb-3">
            Choose an existing WhatsApp number or create a new one for this organisation.
          </p>
          <v-select
            v-model="whapiSelectedChannel"
            :items="whapiChannelOptions"
            item-title="title"
            item-value="value"
            label="Select WhatsApp number"
            variant="solo"
            density="compact"
            :loading="whapiChannelsLoading"
            hide-details
            class="mb-3"
          />
        </v-card-text>
        <v-card-actions class="pa-0 mt-4">
          <v-btn variant="text" @click="whapiConnectDialog = false">Cancel</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :loading="whapiLoading"
            @click="confirmWhapiConnect"
          >
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="whapiShareConfirm" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex align-center justify-space-between">
          <span>Change WhatsApp Number</span>
          <v-btn icon variant="text" size="small" @click="whapiShareConfirm = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-alert type="error" variant="tonal" class="mb-3">
            Changing the number will affect all organisations using this shared WhatsApp channel.
          </v-alert>
          <p class="text-body-2 mb-2">
            This WhatsApp number is currently shared with:
          </p>
          <div v-if="whapiShareOrgNames.length" class="mb-3">
            <v-chip
              v-for="org in whapiShareOrgNames"
              :key="org"
              size="small"
              class="mr-2 mb-2"
              color="grey-lighten-2"
              variant="flat"
            >
              {{ org }}
            </v-chip>
          </div>
          <p class="text-caption text-medium-emphasis">
            Changing the number will log out the shared WhatsApp channel and require a new QR scan.
            This affects all organisations listed above because they share the same channel.
            If you want a separate number for this organisation, connect a new number instead.
          </p>
        </v-card-text>
        <v-card-actions class="pa-0 mt-4">
          <v-btn variant="text" @click="whapiShareConfirm = false">Cancel</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="confirmWhapiShare">
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="whapiLogoutConfirm" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex align-center justify-space-between">
          <span>Logout WhatsApp</span>
          <v-btn icon variant="text" size="small" @click="whapiLogoutConfirm = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <p class="text-body-2 mb-2">
            This WhatsApp number is currently shared with:
          </p>
          <div v-if="whapiShareOrgNames.length" class="mb-3">
            <v-chip
              v-for="org in whapiShareOrgNames"
              :key="org"
              size="small"
              class="mr-2 mb-2"
              color="grey-lighten-2"
              variant="flat"
            >
              {{ org }}
            </v-chip>
          </div>
          <p class="text-caption text-medium-emphasis">
            Logging out here will remove this number from the current organisation only.
            Other organisations will remain connected because they share the same channel.
          </p>
        </v-card-text>
        <v-card-actions class="pa-0 mt-4">
          <v-btn variant="text" @click="whapiLogoutConfirm = false">Cancel</v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" @click="confirmWhapiLogout">
            Logout
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
import CustomerRelationManagementGoogleAnalyticsGoogleHealthDialog from '@/components/customerRelationManagement/googleanalytics/googleHealthDialog.vue'
import IntegrationCard from '@/components/customerRelationManagement/IntegrationCard.vue'
import metaLogo from '@/assets/crm/meta-logo.svg'
import whatsappLogo from '@/assets/crm/whatsapp-logo.svg'
import googleLogo from '@/assets/crm/google-logo.svg'
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
const whapiConnectDialog = ref(false)
const whapiQr = ref('')
const whapiQrWarning = ref('')
const whapiLoading = ref(false)
const whapiDisconnecting = ref(false)
const whapiChannelsLoading = ref(false)
const whapiChannels = ref([])
const whapiSelectedChannel = ref('new')
const whapiShareConfirm = ref(false)
const whapiShareOrgNames = ref([])
const whapiLogoutConfirm = ref(false)
const whapiShareMode = ref('change')
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

const isGoogleConnected = ref(false)
const googleConnecting = ref(false)
const googleDisconnecting = ref(false)
const googleHealthDialog = ref(false)
const googleHealthLoading = ref(false)
const googleHealthData = ref(null)
const googleErrorDialog = ref(false)
const googleErrorMessage = ref('')
const googleStatus = reactive({
  connected: false,
  email: '',
  tokenId: '',
  tokenValid: false,
  connectedAt: '',
  expiresAt: '',
  scopes: [],
})


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
const currentOrgLicense = computed(() => {
  const orgId = user.value?.currentLoggedInOrgId
  const prefs = user.value?.preferences || []
  const match = prefs.find((row) => row.organisationId === orgId)
  return match?.licenseType || 'Trial'
})
const canManageWhapi = computed(() => {
  const type = String(currentOrgLicense.value || '').toLowerCase()
  return ['drift', 'glide', 'soar', 'system'].includes(type)
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
    statusLabel: whapiStatusLabel.value,
    statusColor: whapiStatusColor.value,
    icon: whatsappLogo,
    iconClass: 'whatsapp',
  },
  {
    key: 'google',
    title: 'Google',
    subtitlePrimary: googleStatus.email || userEmail.value || '-',
    subtitleSecondary: currentOrgName.value || '-',
    statusLabel: googleStatusLabel.value,
    statusColor: googleStatusColor.value,
    icon: googleLogo,
    iconClass: 'google',
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

const whapiStatusLabel = computed(() => {
  if (!whapiStatus.status && !whapiStatus.connected) return 'Not Connected'
  const raw = String(whapiStatus.status || '').trim().toLowerCase()
  if (raw.includes('stopped')) return 'Stopped'
  if (raw.includes('overdue')) return 'Overdue'
  if (raw.includes('loggedout') || raw.includes('disconnected')) return 'Logged Out'
  if (raw.includes('pending') || raw.includes('created')) return 'Pending'
  if (raw.includes('activating')) return 'Activating'
  if (raw.includes('auth')) return 'Authorized'
  if (raw.includes('active') || raw.includes('live') || raw.includes('trial')) return 'Active'
  return whapiStatus.connected ? 'Connected' : 'Not Connected'
})

const whapiStatusColor = computed(() => {
  const label = String(whapiStatusLabel.value || '').toLowerCase()
  if (label.includes('active') || label.includes('connected') || label.includes('authorized')) return 'success'
  if (label.includes('pending') || label.includes('activating')) return 'warning'
  if (label.includes('stopped') || label.includes('overdue') || label.includes('logged')) return 'error'
  return 'grey-lighten-1'
})

const whapiQrCtaLabel = computed(() => {
  if (whapiLoading.value) return 'Generating QR...'
  if (!whapiQr.value) return 'Refresh QR (wait ~1 min)'
  return 'Refresh QR'
})

const googleStatusLabel = computed(() => {
  if (!isGoogleConnected.value) return 'Not Connected'
  if (!googleStatus.tokenValid) return 'Token Expired'
  return 'Connected'
})

const googleStatusColor = computed(() => {
  const label = String(googleStatusLabel.value || '').toLowerCase()
  if (label.includes('connected')) return 'success'
  if (label.includes('expired')) return 'error'
  return 'grey-lighten-1'
})

const whapiChannelOptions = computed(() => {
  const base = [{ title: 'Connect new number', value: 'new' }]
  const items = (whapiChannels.value || []).map((ch) => {
    const label = ch.displayName || ch.phoneNumber || ch.channelId
    const orgLabel = (ch.orgNames || []).slice(0, 2).join(', ')
    const suffix =
      orgLabel
        ? ` • ${orgLabel}${ch.orgCount > 2 ? ` +${ch.orgCount - 2}` : ''}`
        : ch.orgCount > 1
          ? ` • ${ch.orgCount} orgs`
          : ch.orgCount === 1
            ? ' • 1 org'
            : ''
    return {
      title: `${label}${suffix}`,
      value: ch.channelId,
    }
  })
  return base.concat(items)
})

const whapiChannelMap = computed(() => {
  const map = new Map()
  ;(whapiChannels.value || []).forEach((ch) => {
    map.set(ch.channelId, ch)
  })
  return map
})

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
  delete nextQuery.account
  delete nextQuery.error
  delete nextQuery.warning
  router.replace({ query: nextQuery })
}

const handleMetaQuery = () => {
  const metaConnected = route.query.meta === 'connected'
  const igConnected = route.query.meta === 'ig_connected'
  const metaError = route.query.error
  const pagesCount = Number(route.query.pages || 0)
  const igAccount = route.query.account

  if (metaError) {
    const msg = mapMetaErrorMessage(metaError) || 'Meta connection failed. Please try again.'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } else if (metaConnected && pagesCount === 0) {
    const msg = 'Meta could not be connected. You need full access to the page you are trying to connect.'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } else if (metaConnected) {
    mainStore?.setSnackbar?.({ title: 'Meta connected successfully', type: 'success' })
  } else if (igConnected) {
    const label = igAccount ? `Instagram connected: ${igAccount}` : 'Instagram connected successfully'
    mainStore?.setSnackbar?.({ title: label, type: 'success' })
  }
  if (metaConnected || metaError || igConnected) clearMetaQuery()
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
      isWhatsAppConnected.value = whapiStatus.connected
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

const connectWhapi = async (channelId = null) => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const payload = channelId ? { channelId } : {}
    const res = await crmStore.startWhapiConnect(payload)
    if (res?.code === 0 && res.data) {
      whapiQr.value = res.data.qr || ''
      whapiQrWarning.value = res.data.warning || (!whapiQr.value ? 'QR is being generated. Please wait about 1 minute, then refresh.' : '')
      whapiDialog.value = true
      await loadWhapiStatus()
      if (!whapiQr.value) {
        mainStore?.setSnackbar?.({
          title: whapiQrWarning.value,
          type: 'info',
        })
      }
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

const loadWhapiChannels = async () => {
  whapiChannelsLoading.value = true
  try {
    const res = await crmStore.getWhapiChannels()
    if (res?.code === 0) {
      whapiChannels.value = res.data?.channels || []
    } else {
      whapiChannels.value = []
    }
  } catch (e) {
    whapiChannels.value = []
  } finally {
    whapiChannelsLoading.value = false
  }
}

const openWhapiConnectDialog = async () => {
  whapiSelectedChannel.value = 'new'
  whapiConnectDialog.value = true
  await loadWhapiChannels()
}

const confirmWhapiConnect = async () => {
  const value = whapiSelectedChannel.value
  whapiConnectDialog.value = false
  if (value && value !== 'new') {
    await connectWhapi(value)
  } else {
    await connectWhapi()
  }
}

const refreshWhapiQr = async () => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const res = await crmStore.getWhapiQr()
    if (res?.code === 0 && res.data) {
      whapiQr.value = res.data.qr || ''
      whapiQrWarning.value = res.data.warning || ''
      await loadWhapiStatus()
      if (!whapiQr.value && whapiQrWarning.value) {
        mainStore?.setSnackbar?.({
          title: whapiQrWarning.value,
          type: 'info',
        })
      }
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
  if (!isWhatsAppConnected.value) return
  const channelId = whapiStatus.channelId
  const info = channelId ? whapiChannelMap.value.get(channelId) : null
  whapiShareOrgNames.value = info?.orgNames || []
  const sharedCount = Number(info?.orgCount || whapiShareOrgNames.value.length || 0)
  if (sharedCount > 1) {
    whapiShareConfirm.value = true
    return
  }
  whapiDialog.value = true
  await refreshWhapiQr()
}

const confirmWhapiShare = async () => {
  whapiShareConfirm.value = false
  if (whapiShareMode.value === 'change') {
    await forceWhapiLogoutAndShowQr()
    return
  }
  whapiDialog.value = true
  await refreshWhapiQr()
}

const forceWhapiLogoutAndShowQr = async () => {
  if (whapiDisconnecting.value) return
  whapiDisconnecting.value = true
  try {
    const res = await crmStore.disconnectWhapi({ force: true })
    if (res?.code === 0) {
      whapiQr.value = ''
      await loadWhapiStatus()
      whapiDialog.value = true
      await refreshWhapiQr()
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

const startWhapiChangeNumber = async () => {
  if (!isWhatsAppConnected.value) return
  const channelId = whapiStatus.channelId
  const info = channelId ? whapiChannelMap.value.get(channelId) : null
  whapiShareOrgNames.value = info?.orgNames || []
  const sharedCount = Number(info?.orgCount || whapiShareOrgNames.value.length || 0)
  if (sharedCount > 1) {
    whapiShareMode.value = 'change'
    whapiShareConfirm.value = true
    return
  }
  await forceWhapiLogoutAndShowQr()
}

const disconnectWhapi = async () => {
  const channelId = whapiStatus.channelId
  const info = channelId ? whapiChannelMap.value.get(channelId) : null
  const sharedCount = Number(info?.orgCount || (info?.orgNames || []).length || 0)
  if (sharedCount > 1) {
    whapiShareOrgNames.value = info?.orgNames || []
    whapiShareMode.value = 'logout'
    whapiLogoutConfirm.value = true
    return
  }
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

const confirmWhapiLogout = async () => {
  whapiLogoutConfirm.value = false
  await disconnectWhapi()
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

const transformGoogleHealthData = (data) => {
  if (!data || !data.connected || !data.account) {
    return { connected: false }
  }

  const account = data.account
  const now = new Date()
  const expires = account.expiresAt ? new Date(account.expiresAt) : null

  return {
    connected: true,
    tokenId: account.id,
    email: account.email,
    tokenValid: expires ? expires > now : false,
    connectedAt: account.connectedAt,
    expiresAt: account.expiresAt,
    scopes: account.scopes || [],
    hasSearchConsole: account.hasSearchConsole,
    hasBusinessProfile: account.hasBusinessProfile,
    hasGoogleAds: account.hasGoogleAds,
    scopeStatus: account.scopeStatus || [],
    selectedSite: data.selectedSite || null,
  }
}

const checkGoogleConnection = async () => {
  try {
    const res = await crmStore.googleConnectionStatus()
    if (res?.code === 0 && res?.data?.connected) {
      isGoogleConnected.value = true
      const transformed = transformGoogleHealthData(res.data)
      googleStatus.connected = transformed.connected
      googleStatus.email = transformed.email || ''
      googleStatus.tokenId = transformed.tokenId || ''
      googleStatus.tokenValid = transformed.tokenValid || false
      googleStatus.connectedAt = transformed.connectedAt || ''
      googleStatus.expiresAt = transformed.expiresAt || ''
      googleStatus.scopes = transformed.scopes || []
      googleHealthData.value = transformed
    } else {
      isGoogleConnected.value = false
      googleStatus.connected = false
      googleStatus.email = ''
      googleStatus.tokenId = ''
      googleStatus.tokenValid = false
      googleHealthData.value = null
    }
  } catch (e) {
    isGoogleConnected.value = false
    googleStatus.connected = false
    googleHealthData.value = null
  }
}

const connectGoogle = async () => {
  googleConnecting.value = true
  try {
    const res = await crmStore.startGoogleAuth()
    if (res?.code === 0 && res?.data?.url) {
      window.location.href = res.data.url
    } else {
      googleErrorMessage.value = res?.error || 'Failed to start Google auth'
      googleErrorDialog.value = true
    }
  } catch (e) {
    googleErrorMessage.value = e?.message || 'Failed to start Google auth'
    googleErrorDialog.value = true
  } finally {
    googleConnecting.value = false
  }
}

const disconnectGoogle = async () => {
  googleDisconnecting.value = true
  try {
    const tokenId = googleStatus.tokenId || null
    const res = await crmStore.disconnectGoogle(tokenId)
    if (res?.code === 0) {
      isGoogleConnected.value = false
      googleStatus.connected = false
      googleStatus.email = ''
      googleStatus.tokenId = ''
      googleStatus.tokenValid = false
      googleHealthData.value = null
      mainStore?.setSnackbar?.({ title: 'Google disconnected', type: 'success' })
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || 'Failed to disconnect Google', type: 'error' })
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to disconnect Google', type: 'error' })
  } finally {
    googleDisconnecting.value = false
  }
}

const openGoogleHealth = async () => {
  googleHealthDialog.value = true
  googleHealthLoading.value = true
  try {
    const res = await crmStore.googleConnectionStatus()
    if (res?.code === 0) {
      googleHealthData.value = transformGoogleHealthData(res.data)
    } else {
      googleHealthData.value = { error: res?.error || res?.message || 'Failed to load health status' }
    }
  } catch (e) {
    googleHealthData.value = { error: e?.data?.message || e?.message || 'Failed to load health status' }
  } finally {
    googleHealthLoading.value = false
  }
}

const handleGoogleCallback = () => {
  const googleConnected = route.query.google === 'connected'
  const googleError = route.query.error

  if (googleConnected) {
    checkGoogleConnection()
    mainStore?.setSnackbar?.({ title: 'Google connected successfully', type: 'success' })
  } else if (googleError) {
    googleErrorMessage.value = decodeURIComponent(googleError)
    googleErrorDialog.value = true
  }

  // Clear query params
  if (googleConnected || googleError) {
    const nextQuery = { ...route.query }
    delete nextQuery.google
    delete nextQuery.error
    router.replace({ query: nextQuery })
  }
}

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
  handleGoogleCallback()
  await Promise.all([checkMetaConnection(), loadWhapiStatus(), checkGoogleConnection(), loadLeads()])
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

.integration-card-disabled {
  opacity: 0.55;
  filter: grayscale(1);
}


.action-btn {
  min-width: 110px;
}

.action-btn--primary {
  color: #ffffff;
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
