// plugins/last-route-tracker.js
export default defineNuxtPlugin(() => {
  if (!process.client) return

  const router = useRouter()

  // Track last visited route except /offline
  router.afterEach((to) => {
    if (to.path !== '/offline') {
      try {
        localStorage.setItem('lastRoute', to.fullPath)
      } catch (_) {}
    }
  })

  // Redirect to offline if connection is lost
  window.addEventListener('offline', () => {
    if (router.currentRoute.value.path !== '/offline') {
      router.push('/offline')
    }
  })
})
