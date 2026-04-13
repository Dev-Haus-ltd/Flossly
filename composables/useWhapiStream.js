/**
 * useWhapiStream — module-level composable for WhatsApp connection state.
 *
 * All refs/reactive state are declared at module scope so they survive Vue
 * component mount/unmount cycles.  Any component (overview.vue, home.vue, …)
 * that calls useWhapiStream() shares the same reactive objects.
 *
 * SSE connection, QR polling, and activation-progress timers are also
 * module-level so they keep running when the user navigates away.
 */

import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

// ── Module-level reactive state ──────────────────────────────────────────────
const whapiActivating = ref(false)
const whapiActivationProgress = ref(0)
const isNewChannel = ref(false)
const whapiQr = ref('')
const whapiQrWarning = ref('')
const whapiDialog = ref(false)
const whapiStatus = reactive({
  connected: false,
  channelId: '',
  phoneNumber: '',
  displayName: '',
  status: '',
})
const isWhatsAppConnected = ref(false)
const whapiStatusLoading = ref(true)
const whapiLoading = ref(false)

// ── Module-level derived state ───────────────────────────────────────────────
const whapiDisplayLabel = computed(() => {
  if (whapiStatus.displayName && whapiStatus.phoneNumber)
    return `${whapiStatus.displayName} (${whapiStatus.phoneNumber})`
  return whapiStatus.displayName || whapiStatus.phoneNumber || ''
})

const whapiStatusLabel = computed(() => {
  if (!whapiStatus.status && !whapiStatus.connected) return 'Not Connected'
  const raw = String(whapiStatus.status || '').trim().toLowerCase()
  if (raw.includes('stopped')) return 'Stopped'
  if (raw.includes('overdue')) return 'Overdue'
  if (raw.includes('loggedout') || raw.includes('disconnected')) return 'Logged Out'
  if (raw === 'qr' || raw.includes('awaiting')) return 'Awaiting Scan'
  if (raw.includes('pending') || raw.includes('created')) return 'Pending'
  if (raw.includes('activating')) return 'Activating'
  if (raw.includes('auth')) return 'Authorized'
  if (raw.includes('active') || raw.includes('live') || raw.includes('trial')) return 'Active'
  return whapiStatus.connected ? 'Connected' : 'Not Connected'
})

const whapiStatusColor = computed(() => {
  const label = String(whapiStatusLabel.value || '').toLowerCase()
  if (label === 'not connected') return 'grey-lighten-1'
  if (label === 'connected' || label.includes('active') || label.includes('authorized')) return 'success'
  if (label.includes('pending') || label.includes('activating') || label.includes('awaiting')) return 'warning'
  if (label.includes('stopped') || label.includes('overdue') || label.includes('logged')) return 'error'
  return 'grey-lighten-1'
})

const whapiSpinnerTitle = computed(() => {
  if (isNewChannel.value) return 'Setting up your new WhatsApp connection…'
  return String(whapiStatus.status || '').toLowerCase() === 'activating'
    ? 'Setting up connection…'
    : 'Connecting to WhatsApp…'
})

const whapiSpinnerSubtitle = computed(() => {
  if (isNewChannel.value)
    return 'New connections take 1–2 minutes to activate. Keep this window open — the QR code will appear automatically.'
  return 'QR code will appear here shortly — usually within 30 seconds'
})

// ── Module-level timers & SSE handle ────────────────────────────────────────
let whapiEventSource = null
let qrPollTimer = null
let qrRefreshTimer = null
let statusFallbackTimer = null
let activationStatusTimer = null
let sseActive = false
let sseRetryDelay = 2000
let qrPollAttempts = 0
let activationProgressTimer = null
const MAX_QR_POLL = 36 // ~3 min at 5 s intervals

// ── Registered "on-connected" callbacks (e.g. reload channel list in overview) ──
const connectedCallbacks = new Set()

// ── Internal helpers (all module-level so watchers can reference them) ───────
const _stopQrPoll = () => { if (qrPollTimer) { clearInterval(qrPollTimer); qrPollTimer = null } }
const _stopQrAutoRefresh = () => { if (qrRefreshTimer) { clearInterval(qrRefreshTimer); qrRefreshTimer = null } }
const _stopStatusFallback = () => { if (statusFallbackTimer) { clearInterval(statusFallbackTimer); statusFallbackTimer = null } }
const _stopActivationStatusPoll = () => { if (activationStatusTimer) { clearInterval(activationStatusTimer); activationStatusTimer = null } }
const _stopAllQrTimers = () => { _stopQrPoll(); _stopQrAutoRefresh(); _stopStatusFallback(); _stopActivationStatusPoll() }

const _stopActivationProgress = () => {
  if (activationProgressTimer) { clearInterval(activationProgressTimer); activationProgressTimer = null }
}

const _resetActivationState = () => {
  isNewChannel.value = false
  whapiActivating.value = false
  _stopActivationProgress()
  _stopActivationStatusPoll()
}

// Lazily resolved so stores are available by the time any call happens.
const _crmStore = () => useCrmStore()
const _mainStore = () => useMainStore()

const _refreshWhapiQr = async () => {
  if (whapiLoading.value) return
  whapiLoading.value = true
  try {
    const res = await _crmStore().getWhapiQr()
    if (res?.code === 0 && res.data) {
      whapiQr.value = res.data.qr || ''
      whapiQrWarning.value = res.data.warning || ''
      return
    }
    const msg = res?.error || res?.message || 'Unable to refresh QR'
    _mainStore()?.setSnackbar?.({ title: msg, type: 'error' })
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Unable to refresh QR'
    _mainStore()?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whapiLoading.value = false
  }
}

const _startQrAutoRefresh = () => {
  _stopQrAutoRefresh()
  qrRefreshTimer = setInterval(async () => {
    if (!whapiDialog.value || !whapiQr.value) { _stopQrAutoRefresh(); return }
    if (!whapiLoading.value) await _refreshWhapiQr()
  }, 28000)
}

const _loadWhapiStatus = async () => {
  try {
    const res = await _crmStore().getWhapiStatus()
    if (res?.code === 0 && res.data) {
      whapiStatus.connected = !!res.data.connected
      whapiStatus.channelId = res.data.channelId || ''
      whapiStatus.phoneNumber = res.data.phoneNumber || ''
      whapiStatus.displayName = res.data.displayName || ''
      whapiStatus.status = res.data.status || ''
      isWhatsAppConnected.value = whapiStatus.connected
    } else {
      Object.assign(whapiStatus, { connected: false, channelId: '', phoneNumber: '', displayName: '', status: '' })
      isWhatsAppConnected.value = false
    }
  } catch {
    Object.assign(whapiStatus, { connected: false, channelId: '', phoneNumber: '', displayName: '', status: '' })
    isWhatsAppConnected.value = false
  } finally {
    whapiStatusLoading.value = false
  }
}

const _startStatusFallback = () => {
  _stopStatusFallback()
  statusFallbackTimer = setInterval(async () => {
    if (!whapiDialog.value) { _stopStatusFallback(); return }
    await _loadWhapiStatus()
    if (whapiStatus.connected) {
      whapiQr.value = ''
      whapiDialog.value = false
      _resetActivationState()
      _stopAllQrTimers()
      connectedCallbacks.forEach(fn => fn())
      _mainStore()?.setSnackbar?.({ title: 'WhatsApp connected successfully!', type: 'success' })
    }
  }, 10000)
}

// ── Activation-phase status poller ───────────────────────────────────────────
// Runs while the banner is showing (whapiActivating = true, whapiDialog = false).
// Polls /api/whapi/status every 10 s via the Partner API to detect when the
// channel transitions from "Activating"/"Pending" to "qr"/"auth"/"active".
// When ready, triggers a QR fetch so the dialog opens automatically.
const _startActivationStatusPoll = () => {
  _stopActivationStatusPoll()
  activationStatusTimer = setInterval(async () => {
    if (!whapiActivating.value) { _stopActivationStatusPoll(); return }
    if (whapiQr.value) { _stopActivationStatusPoll(); return }
    await _loadWhapiStatus()
    if (whapiStatus.connected) {
      _onWhapiConnected()
      _stopActivationStatusPoll()
      return
    }
    const raw = String(whapiStatus.status || '').toLowerCase()
    if (raw === 'qr' || raw.includes('awaiting') || raw.includes('auth') ||
        (raw.includes('active') && !raw.includes('inactive'))) {
      if (!whapiLoading.value) await _refreshWhapiQr()
    }
  }, 10000)
}

const _onWhapiConnected = () => {
  whapiQr.value = ''
  whapiDialog.value = false
  _resetActivationState()
  _stopAllQrTimers()
  connectedCallbacks.forEach(fn => fn())
  _mainStore()?.setSnackbar?.({ title: 'WhatsApp connected successfully!', type: 'success' })
}

// ── One-time watcher setup (lazy, runs inside Vue reactive context) ───────────
let watchersSetup = false
const _setupWatchers = () => {
  if (watchersSetup) return
  watchersSetup = true

  watch(whapiDialog, (open) => {
    if (!open) {
      _stopAllQrTimers()
      whapiQr.value = ''
      whapiQrWarning.value = ''
      if (!whapiActivating.value) isNewChannel.value = false
    }
  })

  watch(whapiActivating, (active) => {
    if (active) {
      _startActivationStatusPoll()
    } else {
      _stopActivationStatusPoll()
    }
  })

  watch(whapiQr, (qr) => {
    if (qr) {
      if (isNewChannel.value && whapiActivating.value) {
        // QR arrived while banner was showing — transition to scan dialog
        _resetActivationState()
        whapiActivationProgress.value = 100
        whapiDialog.value = true
        _mainStore()?.setSnackbar?.({ title: 'QR code ready — open WhatsApp and scan now!', type: 'success' })
      }
      _startQrAutoRefresh()
      _startStatusFallback()
    } else {
      _stopQrAutoRefresh()
      _stopStatusFallback()
    }
  })
}

// ── SSE connection ────────────────────────────────────────────────────────────
const _startWhapiStatusStream = () => {
  if (typeof window === 'undefined' || !('EventSource' in window)) return
  if (whapiEventSource) return
  sseActive = true
  whapiEventSource = new EventSource('/api/whapi/stream')

  whapiEventSource.addEventListener('status', (evt) => {
    sseRetryDelay = 2000
    try {
      const payload = JSON.parse(evt.data || '{}')
      whapiStatus.status = payload.status || whapiStatus.status
      whapiStatus.connected = !!payload.connected
      if (payload.phoneNumber) whapiStatus.phoneNumber = payload.phoneNumber
      if (payload.displayName) whapiStatus.displayName = payload.displayName
      if (payload.channelId) whapiStatus.channelId = payload.channelId
      isWhatsAppConnected.value = !!payload.connected

      if (payload.connected && (whapiDialog.value || whapiActivating.value)) {
        _onWhapiConnected()
      } else if (isNewChannel.value && whapiActivating.value && !whapiQr.value) {
        const raw = String(payload.status || '').toLowerCase()
        if (raw === 'qr' || raw.includes('awaiting') || raw.includes('active') || raw.includes('auth')) {
          _refreshWhapiQr()
        }
      }
    } catch {}
  })

  whapiEventSource.onerror = () => {
    whapiEventSource?.close()
    whapiEventSource = null
    if (!sseActive) return
    setTimeout(() => {
      sseRetryDelay = Math.min(sseRetryDelay * 2, 30000)
      if (sseActive) _startWhapiStatusStream()
    }, sseRetryDelay)
  }
}

const _stopWhapiStatusStream = () => {
  sseActive = false
  sseRetryDelay = 2000
  if (whapiEventSource) { whapiEventSource.close(); whapiEventSource = null }
}

// ── QR poll (used when dialog opens without a QR yet) ───────────────────────
const _startQrPoll = () => {
  qrPollAttempts = 0
  if (qrPollTimer) return
  qrPollTimer = setInterval(async () => {
    // Stop if nothing is waiting for a QR
    if (!whapiDialog.value && !whapiActivating.value) { _stopQrPoll(); return }
    if (whapiQr.value) { _stopQrPoll(); return }
    if (qrPollAttempts >= MAX_QR_POLL) {
      _stopQrPoll()
      whapiQrWarning.value = isNewChannel.value
        ? 'This is taking longer than expected. Try clicking "Refresh QR" — if it still does not appear, close and reconnect, or contact support.'
        : 'QR code is taking longer than expected. Try clicking "Refresh QR", or close and try again.'
      return
    }
    qrPollAttempts++
    if (!whapiLoading.value) await _refreshWhapiQr()
  }, 5000)
}

// ── Activation progress bar ──────────────────────────────────────────────────
const _startActivationProgress = () => {
  whapiActivationProgress.value = 0
  if (activationProgressTimer) clearInterval(activationProgressTimer)
  const totalMs = 90000
  const stepMs = 500
  const stepSize = 95 / (totalMs / stepMs)
  activationProgressTimer = setInterval(() => {
    if (whapiActivationProgress.value < 95) {
      whapiActivationProgress.value = Math.min(95, whapiActivationProgress.value + stepSize)
    }
  }, stepMs)
}

// ── Public composable ─────────────────────────────────────────────────────────
export const useWhapiStream = () => {
  // Set up watchers once — must run inside a Vue reactive context.
  if (process.client) _setupWatchers()

  /**
   * Register a callback that fires whenever WhatsApp successfully connects.
   * Automatically deregistered when the calling component unmounts.
   * Returns an unregister function for manual cleanup.
   */
  const onWhapiConnected = (fn) => {
    connectedCallbacks.add(fn)
    onUnmounted(() => connectedCallbacks.delete(fn))
    return () => connectedCallbacks.delete(fn)
  }

  const dismissActivation = () => {
    _resetActivationState()
    _stopAllQrTimers()
    whapiQr.value = ''
    whapiQrWarning.value = ''
  }

  return {
    // ── State (shared, module-level) ──────────────────────────────────────
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
    // ── Derived (computed, module-level) ──────────────────────────────────
    whapiDisplayLabel,
    whapiStatusLabel,
    whapiStatusColor,
    whapiSpinnerTitle,
    whapiSpinnerSubtitle,
    // ── Methods ───────────────────────────────────────────────────────────
    startWhapiStatusStream: _startWhapiStatusStream,
    stopWhapiStatusStream: _stopWhapiStatusStream,
    loadWhapiStatus: _loadWhapiStatus,
    refreshWhapiQr: _refreshWhapiQr,
    startQrPoll: _startQrPoll,
    stopQrPoll: _stopQrPoll,
    stopAllQrTimers: _stopAllQrTimers,
    resetActivationState: _resetActivationState,
    startActivationProgress: _startActivationProgress,
    stopActivationProgress: _stopActivationProgress,
    dismissActivation,
    onWhapiConnected,
  }
}
