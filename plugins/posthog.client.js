import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const { public: { POSTHOG_KEY } } = useRuntimeConfig()
  if (!POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage',
  })
  return { provide: { posthog } }
})
