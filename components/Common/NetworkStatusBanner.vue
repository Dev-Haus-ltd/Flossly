<template>
  <Teleport to="body">
    <!-- Offline banner — persistent until connection returns -->
    <Transition name="net-slide">
      <div v-if="!isOnline" class="net-banner net-banner--offline" role="alert" aria-live="assertive">
        <v-icon size="16" class="net-banner__icon">mdi-wifi-off</v-icon>
        <span class="net-banner__text">You're offline — check your internet connection</span>
        <button class="net-banner__action" @click="reload">Reload</button>
      </div>
    </Transition>

    <!-- Slow connection banner — dismissible, shown once per session -->
    <Transition name="net-slide">
      <div v-if="isOnline && isSlowConnection && !slowDismissed" class="net-banner net-banner--slow" role="status">
        <v-icon size="16" class="net-banner__icon">mdi-signal-cellular-1</v-icon>
        <span class="net-banner__text">Slow connection detected — things may take a bit longer</span>
        <button class="net-banner__dismiss" aria-label="Dismiss" @click="slowDismissed = true">
          <v-icon size="14">mdi-close</v-icon>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const mainStore = useMainStore()
const { isOnline, isSlowConnection } = useNetworkStatus()
const slowDismissed = ref(false)

const reload = () => {
  if (typeof window !== 'undefined') window.location.reload()
}

// Reset slow-dismiss each time a fresh slow period starts
watch(isSlowConnection, (slow) => {
  if (slow) slowDismissed.value = false
})

// Toast on recovery — uses existing snackbar so it fits the app's design language
let wasOffline = false
watch(isOnline, (online) => {
  if (!online) {
    wasOffline = true
    return
  }
  if (wasOffline) {
    wasOffline = false
    mainStore.setSnackbar({ type: 'success', title: 'Connection restored' })
  }
})
</script>

<style scoped>
.net-banner {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  max-width: calc(100vw - 32px);
}

.net-banner--offline {
  background: #1a1a1a;
  color: #ffffff;
}

.net-banner--slow {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.net-banner__icon {
  flex-shrink: 0;
}

.net-banner--offline .net-banner__icon {
  color: #f87171;
}

.net-banner--slow .net-banner__icon {
  color: #d97706;
}

.net-banner__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.net-banner__action {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.net-banner__action:hover {
  background: rgba(255, 255, 255, 0.25);
}

.net-banner__dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: opacity 0.15s;
}
.net-banner__dismiss:hover {
  opacity: 1;
}

.net-slide-enter-active,
.net-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.net-slide-enter-from,
.net-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
