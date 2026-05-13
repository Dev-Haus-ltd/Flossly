import { Get } from '~/services/apiWrapper'

const _usage = ref(null)
const _fetched = ref(false)
const _dismissed = ref(false)
const LEGACY_TO_RESOLVED = { System: 'Pro', Trial: 'Lite', Drift: 'Lite', Glide: 'CRM', Soar: 'Pro' }

export const resetUsageState = () => {
  _usage.value = null
  _fetched.value = false
  _dismissed.value = false
}

export const useUsageSummary = () => {
  const authStore = useAuthStore()

  const resolvedTier = computed(() => {
    const lt = authStore.loggedUser?.licenseType ?? 'Lite'
    return LEGACY_TO_RESOLVED[lt] ?? lt
  })

  const isLite = computed(() => resolvedTier.value === 'Lite')

  watch(resolvedTier, async (tier) => {
    if (tier !== 'Lite') {
      _usage.value = null
      _fetched.value = false
      _dismissed.value = false
      return
    }

    if (!_fetched.value) {
      await fetchUsage()
    }
  }, { immediate: true })

  async function fetchUsage() {
    if (!isLite.value) {
      _usage.value = null
      _fetched.value = false
      return
    }

    if (_fetched.value) return

    try {
      const res = await Get('/auth/usageSummary')
      if (res?.code === 0) {
        _usage.value = res.data
        _fetched.value = true
      }
    } catch {}
  }

  const usage = computed(() => _usage.value)

  const percentUsed = (resource) => {
    const u = _usage.value?.[resource]
    if (!u || !u.max) return 0
    return Math.round((u.current / u.max) * 100)
  }

  const isAtWarning = (resource) => {
    const u = _usage.value?.[resource]
    if (!u || !u.max || !u.warnAt) return false
    return u.current >= u.warnAt
  }

  const isAtLimit = (resource) => {
    const u = _usage.value?.[resource]
    if (!u || !u.max) return false
    return u.current >= u.max
  }

  const anyAtWarning = computed(() =>
    ['leads', 'storageMB', 'members', 'forms'].some(isAtWarning)
  )

  const dismiss = () => { _dismissed.value = true }
  const isDismissed = computed(() => _dismissed.value)

  return { usage, fetchUsage, isLite, percentUsed, isAtWarning, isAtLimit, anyAtWarning, dismiss, isDismissed }
}
