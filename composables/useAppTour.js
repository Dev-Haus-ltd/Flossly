import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'flossly_app_tour_v1'

const STEPS = [
  {
    element: '#tour-practice-menu',
    popover: {
      title: 'Your Practice Workspace',
      description:
        'Switch between practices, invite your team, or add a new practice from here.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="dashBoard"]',
    popover: {
      title: 'Dashboard',
      description:
        'Your command centre — see setup progress, key metrics, and next best actions at a glance.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="crm"]',
    popover: {
      title: 'CRM & Leads',
      description:
        'Capture leads automatically from your Meta ad campaigns. On Lite you get up to 100 leads free.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="tasks-group"]',
    popover: {
      title: 'Task Management',
      description:
        'Create tasks for your team, set due dates, and track completion — fully included on Lite.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-plan-chip',
    popover: {
      title: "You're on Flossy Lite — free forever",
      description:
        "When you're ready to grow, upgrade to CRM (£199/mo) to unlock WhatsApp messaging, automations, and unlimited leads.",
      side: 'top',
      align: 'center',
    },
  },
]

export const useAppTour = () => {
  const hasSeen = () => {
    if (!process.client) return true
    return !!localStorage.getItem(TOUR_KEY)
  }

  const markSeen = () => {
    if (process.client) localStorage.setItem(TOUR_KEY, '1')
  }

  const resetTour = () => {
    if (process.client) localStorage.removeItem(TOUR_KEY)
  }

  const startTour = () => {
    // Filter to steps whose target element actually exists in the DOM
    const activeSteps = STEPS.filter((s) => {
      try {
        return !!document.querySelector(s.element)
      } catch {
        return false
      }
    })

    if (!activeSteps.length) return

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done',
      popoverClass: 'flossly-tour-popover',
      steps: activeSteps,
      onDestroyed: markSeen,
      onDestroyStarted: markSeen,
    })

    driverObj.drive()
  }

  const maybeStartTour = () => {
    if (hasSeen()) return
    // Don't conflict with the Day-0 welcome/video popup or any pending in-app messages.
    // If those are active this session, skip — the tour will show on the next login
    // once the onboarding welcome flow is complete.
    const authStore = useAuthStore()
    const onboarding = authStore.loggedUser?.onboarding
    if (
      onboarding?.showWelcomePopup ||
      onboarding?.showWelcomeVideoPopup ||
      (Array.isArray(onboarding?.inAppMessages) && onboarding.inAppMessages.length > 0)
    ) {
      return
    }
    // Wait for sidebar elements to finish rendering
    setTimeout(startTour, 700)
  }

  return { startTour, maybeStartTour, resetTour, hasSeen }
}
