export const useNetworkStatus = () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const isSlowConnection = ref(false)

  const getConnection = () =>
    (typeof navigator !== 'undefined' &&
      (navigator.connection || navigator.mozConnection || navigator.webkitConnection)) || null

  const checkSpeed = () => {
    const conn = getConnection()
    if (!conn) return
    isSlowConnection.value = ['slow-2g', '2g'].includes(conn.effectiveType)
  }

  const handleOnline = () => {
    isOnline.value = true
    checkSpeed()
  }
  const handleOffline = () => {
    isOnline.value = false
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    isOnline.value = navigator.onLine
    checkSpeed()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const conn = getConnection()
    if (conn) conn.addEventListener('change', checkSpeed)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    const conn = getConnection()
    if (conn) conn.removeEventListener('change', checkSpeed)
  })

  return { isOnline, isSlowConnection }
}
