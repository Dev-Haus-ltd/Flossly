export const usePostHog = () => {
  const nuxtApp = useNuxtApp()
  const posthog = nuxtApp.$posthog

  const track = (event, props = {}) => {
    if (!posthog) return
    try {
      posthog.capture(event, props)
    } catch {}
  }

  const identify = (userId, props = {}) => {
    if (!posthog) return
    try {
      posthog.identify(String(userId), props)
    } catch {}
  }

  return { track, identify }
}
