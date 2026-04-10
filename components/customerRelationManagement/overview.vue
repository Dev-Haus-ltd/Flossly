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
                color="primary"
                variant="outlined"
                rounded="lg"
                class="action-btn"
                @click="integrateMeta"
              >
                Reconnect
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
                v-if="!isMetaConnected"
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
              <template v-if="!whapiStatusLoading && isWhatsAppConnected">
                <v-btn
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
                  color="error"
                  variant="outlined"
                  rounded="lg"
                  class="action-btn"
                  :loading="whapiDisconnecting"
                  @click="disconnectWhapi"
                >
                  Disconnect
                </v-btn>
              </template>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                rounded="lg"
                class="action-btn action-btn--primary"
                :loading="whapiLoading || whapiStatusLoading"
                :disabled="whapiStatusLoading || !canManageWhapi"
                @click="openWhapiConnectDialog"
              >
                Connect
              </v-btn>
              <span
                v-if="!whapiStatusLoading && !canManageWhapi"
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

      <v-alert
        v-if="isMetaConnected && metaHealthIssues.length"
        type="warning"
        variant="tonal"
        class="mt-0"
      >
        <div class="font-weight-medium mb-1">Meta connection has issues — new leads may not be arriving</div>
        <ul style="padding-left: 18px; margin: 4px 0 8px;">
          <li v-for="(issue, i) in metaHealthIssues" :key="i" style="font-size: 13px;">{{ issue }}</li>
        </ul>
        <v-btn size="small" variant="outlined" @click="openMetaHealth">View Details & Fix</v-btn>
      </v-alert>

      <div class="conversion-grid mt-8">
        <CrmCharts
          :chartType="leadsChartType"
          :chartTitle="leadsChartConfig.chartTitle"
          :chartSubtitle="leadsChartConfig.chartSubtitle"
          :chartData="leadsChartConfig.chartData"
          :summaryStats="leadsChartConfig.summaryStats"
          :chartHeight="'320px'"
          :showLegend="true"
          :legendPosition="'bottom'"
          :isLoading="leadsChartLoading"
          :showFallback="!leadsChartLoading && leadRows.length === 0"
          :error="leadsChartError"
        />

        <CrmCharts
          :chartType="'bar'"
          :chartTitle="metaChartConfig.chartTitle"
          :chartSubtitle="metaChartConfig.chartSubtitle"
          :chartData="metaChartConfig.chartData"
          :summaryStats="metaChartConfig.summaryStats"
          :chartHeight="'320px'"
          :showLegend="true"
          :legendPosition="'bottom'"
          :isLoading="metaChartLoading"
          :showFallback="!metaChartLoading && (!isMetaConnected || metaChartConfig.chartData.datasets.length === 0)"
          :error="metaChartError"
        />

        <!-- GOOGLE ANALYTICS CHART — hidden until Google integration is live on prod
        <CrmCharts
          :chartType="'line'"
          :chartTitle="gscChartConfig.chartTitle"
          :chartSubtitle="gscChartConfig.chartSubtitle"
          :chartData="gscChartConfig.chartData"
          :summaryStats="gscChartConfig.summaryStats"
          :chartHeight="'320px'"
          :showLegend="true"
          :legendPosition="'bottom'"
          :isLoading="gscChartLoading"
          :showFallback="!gscChartLoading && (!isGoogleConnected || gscChartConfig.chartData.datasets.length === 0)"
          :error="gscChartError"
        />
        -->
      </div>
    </div>

    <CustomerRelationManagementMetaHealthDialog
      v-model="metaHealthDialog"
      :loading="metaHealthLoading"
      :data="metaHealthData"
    />

    <ConfirmDialog
      v-model="metaDisconnectDialog"
      title="Disconnect Meta?"
      confirm-text="Disconnect"
      icon="mdi-link-off"
      :loading="metaDisconnecting"
      message="Disconnecting Meta will stop new leads, page subscriptions, and future analytics syncs for this organisation. Existing historical analytics will remain visible until new data is synced again after reconnecting."
      @cancel="metaDisconnectDialog = false"
      @confirm="disconnectMeta"
    />

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
            Select a WhatsApp number to connect. If your number is listed, pick it to reconnect without any extra cost.
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
            Changing the number will affect all organisations using this shared WhatsApp number.
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
            Changing the number will disconnect the shared WhatsApp number and require a new QR scan.
            This affects all organisations listed above because they share the same WhatsApp number.
            If you want a separate number for this organisation, disconnect first and then connect a new one.
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

    <ConfirmDialog
      v-model="whapiSingleLogoutConfirm"
      title="Disconnect WhatsApp?"
      confirm-text="Disconnect"
      icon="mdi-whatsapp"
      :loading="whapiDisconnecting"
      message="This will log out the connected WhatsApp number from this organisation. You will need to reconnect and scan a new QR code to use WhatsApp messaging again."
      @cancel="whapiSingleLogoutConfirm = false"
      @confirm="confirmWhapiSingleLogout"
    />

    <v-dialog v-model="whapiLogoutConfirm" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex align-center justify-space-between">
          <span>Disconnect WhatsApp</span>
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
            Disconnecting here will remove this number from the current organisation only.
            Other organisations will remain connected because they share the same WhatsApp number.
          </p>
        </v-card-text>
        <v-card-actions class="pa-0 mt-4">
          <v-btn variant="text" @click="whapiLogoutConfirm = false">Cancel</v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" @click="confirmWhapiLogout">
            Disconnect
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <CommonConfirmDialog
      v-model="confirmDisconnectMeta"
      title="Disconnect Meta?"
      message="This will remove the Meta integration. New leads from Facebook forms will stop arriving until you reconnect."
      confirm-text="Disconnect"
      @confirm="doDisconnectMeta"
      @cancel="confirmDisconnectMeta = false"
    />

  </v-sheet>
</template>

<script setup>
import { format, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import { useAuthStore } from '@/stores/auth'
import { useWhapiStream } from '@/composables/useWhapiStream'
import CustomerRelationManagementMetaHealthDialog from '@/components/customerRelationManagement/metaHealthDialog.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import IntegrationCard from '@/components/customerRelationManagement/IntegrationCard.vue'
import CrmCharts from '@/components/customerRelationManagement/CrmCharts.vue'
import { transformLeadsConversionData, transformMetaInsightsData, transformGoogleSearchConsoleData } from '@/composables/useChartAdapters'
import metaLogo from '@/assets/crm/meta-logo.svg'
import whatsappLogo from '@/assets/crm/whatsapp-logo.svg'
import googleLogo from '@/assets/crm/google-logo.svg'
import chatbotLogo from '@/assets/crm/chatbot-logo.svg'

const crmStore = useCrmStore()
const mainStore = useMainStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// ── Shared WhatsApp stream state (persists across navigation) ────────────────
const {
  whapiActivating,
  whapiActivationProgress,
  isNewChannel,
  whapiQr,
  whapiQrWarning,
  whapiDialog,
  whapiStatus,
  isWhatsAppConnected,
  whapiStatusLoading,
  whapiLoading,
  whapiDisplayLabel,
  whapiStatusLabel,
  whapiStatusColor,
  whapiSpinnerTitle,
  whapiSpinnerSubtitle,
  loadWhapiStatus,
  refreshWhapiQr,
  startQrPoll,
  stopQrPoll,
  stopAllQrTimers,
  resetActivationState,
  startActivationProgress,
  stopActivationProgress,
  dismissActivation,
  onWhapiConnected,
} = useWhapiStream()

const user = ref(null)
const isMetaConnected = ref(false)
const whapiConnectDialog = ref(false)
const whapiDisconnecting = ref(false)
const whapiChannelsLoading = ref(false)
const whapiChannels = ref([])
const whapiSelectedChannel = ref('new')
const whapiShareConfirm = ref(false)
const whapiShareOrgNames = ref([])
const whapiLogoutConfirm = ref(false)
const whapiShareMode = ref('change')
const whapiSingleLogoutConfirm = ref(false)

const leadRows = ref([])
const leadsChartType = ref('line')
const leadsChartLoading = ref(false)
const leadsChartError = ref(null)
const leadsChartConfig = reactive({
  chartTitle: 'Leads Conversion',
  chartSubtitle: 'Last 30 days',
  chartData: {
    labels: [],
    datasets: []
  },
  summaryStats: []
})

const metaChartLoading = ref(false)
const metaChartError = ref(null)
const metaChartConfig = reactive({
  chartTitle: 'Meta Analytics',
  chartSubtitle: 'Last 30 days',
  chartData: {
    labels: [],
    datasets: []
  },
  summaryStats: []
})

const gscChartLoading = ref(false)
const gscChartError = ref(null)
const gscChartConfig = reactive({
  chartTitle: 'Google Search Console',
  chartSubtitle: 'Last 30 days',
  chartData: {
    labels: [],
    datasets: []
  },
  summaryStats: []
})

const metaHealthDialog = ref(false)
const metaHealthLoading = ref(false)
const metaHealthData = ref(null)


const userEmail = computed(() => user.value?.email || '')
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
    subtitlePrimary: whapiStatusLoading.value ? '-' : (whapiDisplayLabel.value || userEmail.value || '-'),
    subtitleSecondary: currentOrgName.value || '-',
    statusLabel: whapiStatusLoading.value ? 'Loading…' : whapiStatusLabel.value,
    statusColor: whapiStatusLoading.value ? 'grey-lighten-2' : whapiStatusColor.value,
    icon: whatsappLogo,
    iconClass: 'whatsapp',
  },
  // GOOGLE ANALYTICS CARD — hidden until Google integration is live on prod
  // {
  //   key: 'google',
  //   title: 'Google',
  //   subtitlePrimary: googleStatus.email || userEmail.value || '-',
  //   subtitleSecondary: currentOrgName.value || '-',
  //   statusLabel: googleStatusLabel.value,
  //   statusColor: googleStatusColor.value,
  //   icon: googleLogo,
  //   iconClass: 'google',
  // },
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
  const newOption = { title: 'Connect new number (creates a new connection)', value: 'new' }
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
  // Put "new" at the bottom so existing numbers are easier to pick
  return items.concat([newOption])
})

const whapiChannelMap = computed(() => {
  const map = new Map()
  ;(whapiChannels.value || []).forEach((ch) => {
    map.set(ch.channelId, ch)
  })
  return map
})

// Reload channel list whenever WhatsApp connects (e.g. after QR scan).
// onWhapiConnected auto-deregisters this callback when overview unmounts.
onWhapiConnected(() => loadWhapiChannels(false))

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
    metaHealthData.value = null
    mainStore?.setSnackbar?.({ title: 'Meta connected successfully', type: 'success' })
  } else if (igConnected) {
    metaHealthData.value = null
    const label = igAccount ? `Instagram connected: ${igAccount}` : 'Instagram connected successfully'
    mainStore?.setSnackbar?.({ title: label, type: 'success' })
  }
  if (metaConnected || metaError || igConnected) clearMetaQuery()
}

const metaHealthIssues = computed(() => {
  const data = metaHealthData.value
  if (!data || data.error) return []
  const issues = []
  if (!data.verifyTokenSet) issues.push('Verify token is not configured')
  if (data.permissionsError) issues.push(`Permissions issue: ${data.permissionsError}`)
  const pages = (Array.isArray(data.pages) ? data.pages : [])
    .filter((p) => String(p?.status || '').toLowerCase() === 'active')
  const noToken = pages.filter((p) => !p.tokenPresent).length
  const noSub = pages.filter((p) => !p.subscribed).length
  if (noToken) issues.push(`${noToken} active page(s) are missing an access token`)
  if (noSub) issues.push(`${noSub} active page(s) are not subscribed to webhooks — new leads from these pages will not arrive`)
  return issues
})

const openMetaHealth = async () => {
  metaHealthDialog.value = true
  // Use cached data if already fetched and valid (no error)
  if (metaHealthData.value && !metaHealthData.value.error) return
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
      metaHealthData.value = null
      await checkMetaConnection()
      mainStore?.setSnackbar?.({ title: 'Meta disconnected', type: 'success' })
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || 'Failed to disconnect Meta', type: 'error' })
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to disconnect Meta', type: 'error' })
  } finally {
    metaDisconnecting.value = false
  }
}

const fetchMetaHealthSilent = async () => {
  if (!isMetaConnected.value) return
  try {
    const res = await crmStore.metaHealth()
    if (res?.code === 0) {
      metaHealthData.value = res.data || null
    }
  } catch {}
}

const connectWhapi = async (channelId = null, forceNew = false) => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const payload = channelId ? { channelId } : (forceNew ? { forceNew: true } : {})
    const res = await crmStore.startWhapiConnect(payload)
    if (res?.code === 0 && res.data) {
      // Extend failed — channel is blocked and couldn't be reactivated
      if (res.data.canActivate && !res.data.activationPending) {
        const msg = res.data.warning || 'Unable to reactivate WhatsApp. Please contact support.'
        mainStore?.setSnackbar?.({ title: msg, type: 'error' })
        return
      }
      whapiQr.value = res.data.qr || ''
      whapiQrWarning.value = ''
      isNewChannel.value = !!res.data.activationPending
      loadWhapiStatus()
      loadWhapiChannels(false)
      if (isNewChannel.value) {
        // Channel activating — show floating banner, open QR dialog automatically when ready
        whapiActivating.value = true
        startActivationProgress()
        mainStore?.setSnackbar?.({ title: 'WhatsApp is being set up — QR code will appear in about 1–2 minutes', type: 'info' })
      } else {
        whapiDialog.value = true
      }
      if (!whapiQr.value) startQrPoll()
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

const loadWhapiChannels = async (showLoading = true) => {
  if (showLoading) whapiChannelsLoading.value = true
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
    if (showLoading) whapiChannelsLoading.value = false
  }
}

const openWhapiConnectDialog = async () => {
  whapiSelectedChannel.value = 'new'
  whapiConnectDialog.value = true
  await loadWhapiChannels(true)
  // Auto-select the only existing number so users don't accidentally create a new one
  if (whapiChannels.value?.length === 1) {
    whapiSelectedChannel.value = whapiChannels.value[0].channelId
  }
}

const confirmWhapiConnect = async () => {
  const value = whapiSelectedChannel.value
  whapiConnectDialog.value = false
  if (value && value !== 'new') {
    await connectWhapi(value)
  } else {
    // forceNew: true tells the server to create a brand new channel even if one exists
    await connectWhapi(null, true)
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
      if (!whapiQr.value) startQrPoll()
      return
    }
    const msg = res?.error || res?.message || 'Failed to disconnect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to disconnect WhatsApp'
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
  whapiSingleLogoutConfirm.value = true
}

const _executeWhapiDisconnect = async (payload = {}) => {
  if (whapiDisconnecting.value) return
  whapiDisconnecting.value = true
  try {
    const res = await crmStore.disconnectWhapi(payload)
    if (res?.code === 0) {
      whapiQr.value = ''
      await loadWhapiStatus()
      mainStore?.setSnackbar?.({ title: 'WhatsApp disconnected', type: 'success' })
      return
    }
    const msg = res?.error || res?.message || 'Failed to disconnect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to disconnect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whapiDisconnecting.value = false
  }
}

const confirmWhapiSingleLogout = async () => {
  whapiSingleLogoutConfirm.value = false
  await _executeWhapiDisconnect()
}

const confirmWhapiLogout = async () => {
  whapiLogoutConfirm.value = false
  await _executeWhapiDisconnect()
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


const updateLeadsChartData = async () => {
  try {
    leadsChartError.value = null

    if (!activeLeads.value || activeLeads.value.length === 0) {
      console.warn('⚠️ No active leads to display')
      leadsChartConfig.chartData = {
        labels: [],
        datasets: []
      }
      leadsChartConfig.summaryStats = []
      leadsChartConfig.chartSubtitle = 'No data available'
      return
    }

    // Use the adapter to transform raw leads data
    const normalizedData = transformLeadsConversionData(
      activeLeads.value,
      {
        metricLabels: ['Total Leads', 'Converted Leads'],
        summaryLabels: ['Total Leads (this month)', 'New Leads', 'Converted', 'Contacted', 'Lost'],
        chartType: 'line',
        colors: ['#3B82F6', '#F97316']
      }
    )

    // Important: Update the entire chartData object at once to trigger reactivity
    leadsChartConfig.chartData = {
      labels: normalizedData.chartData?.labels || [],
      datasets: normalizedData.chartData?.datasets || []
    }
    
    leadsChartConfig.summaryStats = normalizedData.summary || []
    leadsChartConfig.chartSubtitle = `${activeLeads.value.length} leads • Last 30 days`


  } catch (error) {
    console.error('❌ Error updating leads chart:', error)
    leadsChartError.value = 'Failed to render chart: ' + error.message
  }
}

const loadLeads = async () => {
  leadsChartLoading.value = true
  leadsChartError.value = null

  try {
    const res = await crmStore.listLeads({ includeArchived: true })
    
    if (res?.code === 0) {
      leadRows.value = res.data || []
    } else {
      leadRows.value = []
      leadsChartError.value = res?.message || 'Failed to load leads'
    }
  } catch (e) {
    leadRows.value = []
    leadsChartError.value = e?.message || 'Error loading leads'
    console.error('❌ Error loading leads:', e)
  } finally {
    leadsChartLoading.value = false
  }
}

const loadMetaAnalytics = async () => {
  if (!isMetaConnected.value) return
  metaChartLoading.value = true
  metaChartError.value = null
  try {
    const res = await crmStore.getMetaInsights()
    if (res?.code === 0) {
      const currency = crmStore.metaAdAccounts?.[0]?.currency || 'GBP'
      const normalized = transformMetaInsightsData(res.data || [], { currency })
      metaChartConfig.chartData = normalized.chartData
      metaChartConfig.summaryStats = normalized.summary
    } else {
      metaChartError.value = res?.message || 'Failed to load Meta analytics'
    }
  } catch (e) {
    metaChartError.value = e?.message || 'Failed to load Meta analytics'
  } finally {
    metaChartLoading.value = false
  }
}

const loadGscAnalytics = async () => {
  if (!isGoogleConnected.value) return
  gscChartLoading.value = true
  gscChartError.value = null
  try {
    const res = await crmStore.getGoogleSearchConsoleAnalytics()
    if (res?.code === 0) {
      const normalized = transformGoogleSearchConsoleData(res)
      gscChartConfig.chartData = normalized.chartData
      gscChartConfig.summaryStats = normalized.summary
    } else {
      gscChartError.value = res?.message || 'Failed to load GSC analytics'
    }
  } catch (e) {
    gscChartError.value = e?.message || 'Failed to load GSC analytics'
  } finally {
    gscChartLoading.value = false
  }
}

onMounted(async () => {
  loadUser()
  handleMetaQuery()
  await Promise.all([checkMetaConnection(), loadWhapiStatus(), loadLeads()])
  loadWhapiChannels(false)
})

watch(
  () => activeLeads.value,
  async () => {
    await nextTick()
    updateLeadsChartData()
  },
  { deep: true }
)

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
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  align-items: start;
}

@media (min-width: 1400px) {
  .conversion-grid {
    grid-template-columns: repeat(3, 1fr);
  }
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

.whapi-scan-instructions {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  width: 100%;
  max-width: 300px;
}

.whapi-steps {
  padding-left: 16px;
  margin: 0;
  line-height: 1.8;
}

.whapi-activation-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  z-index: 1000;
  border: 1px solid #c8e6c9;
}
</style>
