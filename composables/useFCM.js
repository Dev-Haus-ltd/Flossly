import { ref, onMounted, onUnmounted } from 'vue';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

export const useFCM = () => {
  const isSupported = ref(false);
  const isPermissionGranted = ref(false);
  const fcmToken = ref(null);
  const notificationPermission = ref('default');
  const lastNotification = ref(null);
  const config = useRuntimeConfig();

  let messaging = null;
  let unsubscribeMessage = null;
  let tokenRefreshInterval = null;
  let visibilityChangeHandler = null;
  let onlineHandler = null;
  let offlineHandler = null;
  let isInitialized = false;
  let tokenFetchInProgress = false;

  // Initialize Firebase
  const initializeFirebase = async () => {
    if (isInitialized) {
      return true;
    }

    try {
      const firebaseConfig = {
        apiKey: config.public.firebaseApiKey,
        authDomain: config.public.firebaseAuthDomain,
        projectId: config.public.firebaseProjectId,
        storageBucket: config.public.firebaseStorageBucket,
        messagingSenderId: config.public.firebaseMessagingSenderId,
        appId: config.public.firebaseAppId,
      };

      const app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      
      // Register and initialize service worker with Firebase config
      if ('serviceWorker' in navigator) {
        try {
          // Check if service worker is already registered
          const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          
          let registration;
          if (existingRegistration) {
            registration = existingRegistration;
            console.log('♻️ Using existing service worker registration');
          } else {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/',
              updateViaCache: 'none' // Always fetch fresh service worker
            });
            console.log('✅ New service worker registered');
          }

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;

          // Send config to service worker
          if (registration.active) {
            registration.active.postMessage({
              type: 'INIT_FIREBASE',
              config: firebaseConfig
            });
          }

          // Set up periodic service worker updates
          setInterval(() => {
            registration.update().catch(err => {
              console.warn('Service worker update check failed:', err);
            });
          }, 60 * 60 * 1000); // Check every hour

        } catch (swError) {
          console.error('Service worker registration error:', swError);
          // Continue without service worker for browsers with extensions that block it
        }
      }

      isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return false;
    }
  };

  // Check if FCM is supported
  const checkSupport = () => {
    isSupported.value = 
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    
    if (isSupported.value) {
      notificationPermission.value = Notification.permission;
      isPermissionGranted.value = Notification.permission === 'granted';
    }
    
    return isSupported.value;
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported.value) {
      console.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      notificationPermission.value = permission;
      isPermissionGranted.value = permission === 'granted';
      
      if (permission === 'granted') {
        await getFCMToken();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Get FCM token with retry logic
  const getFCMToken = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    // Prevent multiple simultaneous calls
    if (tokenFetchInProgress) {
      console.log('⏳ Token fetch already in progress, waiting...');
      // Wait for the ongoing fetch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fcmToken.value;
    }

    if (fcmToken.value && retryCount === 0) {
      // Token already exists and this is not a refresh attempt
      return fcmToken.value;
    }

    tokenFetchInProgress = true;

    try {
      if (!messaging) {
        await initializeFirebase();
      }

      if (!isPermissionGranted.value) {
        console.warn('Notification permission not granted');
        tokenFetchInProgress = false;
        return null;
      }

      // Use the existing service worker registration
      const registration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, {
        vapidKey: config.public.firebaseVapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        const tokenChanged = fcmToken.value !== currentToken;
        fcmToken.value = currentToken;
        console.log(tokenChanged ? '🔄 FCM Token refreshed:' : '✅ FCM Token obtained:', currentToken);
        
        // Save token to backend with retry
        await saveFCMTokenToBackend(currentToken, 3);
        
        tokenFetchInProgress = false;
        return currentToken;
      } else {
        console.log('No registration token available.');
        tokenFetchInProgress = false;
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      tokenFetchInProgress = false;

      // Retry logic for transient errors
      if (retryCount < MAX_RETRIES) {
        console.log(`🔁 Retrying token fetch (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return getFCMToken(retryCount + 1);
      }

      return null;
    }
  };

  // Save FCM token to backend with retry
  const saveFCMTokenToBackend = async (token, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`
        };

        const browser = getBrowserInfo();

        const response = await $fetch('/api/notifications/save-token', {
          method: 'POST',
          body: {
            token,
            deviceType: 'web',
            browser,
            deviceInfo
          }
        });

        console.log('💾 Token saved to backend successfully');
        return response;
      } catch (error) {
        console.error(`Error saving FCM token (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          // Last attempt failed, but don't throw - token is still valid locally
          console.warn('⚠️ Failed to save token to backend after all retries, continuing with local token');
        }
      }
    }
  };

  // Get browser info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  };

  // Listen for foreground messages
  const setupMessageListener = () => {
    if (!messaging) {
      return;
    }
    unsubscribeMessage = onMessage(messaging, (payload) => {
      
      // Extract title and body from data payload (data-only messages)
      const title = payload.data?.title || payload.notification?.title || 'New Notification';
      const body = payload.data?.body || payload.notification?.body || '';
      
      lastNotification.value = {
        title,
        body,
        data: payload.data,
        timestamp: new Date()
      };

      // Show browser notification
      if (isPermissionGranted.value && document.hidden) {
        showNotification(payload);
      }

      // Emit event for UI updates
      if (process.client) {
        window.dispatchEvent(new CustomEvent('fcm-notification', {
          detail: lastNotification.value
        }));

        // Show in-app snackbar/toast for foreground messages
        try {
          const mainStore = useMainStore();
          mainStore.setSnackbar({
            type: 'notification',
            iconMdi: 'mdi-bell-outline',
            title: lastNotification.value.title || 'New notification',
            subtitle: lastNotification.value.body || '',
          });
        } catch (e) {
          // ignore toast errors
        }
      }
    });
  };

  // Show notification
  const showNotification = (payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: payload.data || {},
      tag: payload.data?.type || 'general',
      requireInteraction: payload.data?.priority === 'high' || payload.data?.priority === 'urgent',
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      new Notification(notificationTitle, notificationOptions);
    }
  };

  // Refresh FCM token
  const refreshFCMToken = async () => {
    console.log('🔄 Refreshing FCM token...');
    
    if (!messaging || !isPermissionGranted.value) {
      return;
    }

    try {
      // Delete old token from Firebase
      if (fcmToken.value) {
        await deleteToken(messaging);
        console.log('🗑️ Old token deleted from Firebase');
      }

      // Clear local token
      fcmToken.value = null;
      tokenFetchInProgress = false;

      // Get new token
      await getFCMToken();
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
    }
  };

  // Delete FCM token
  const deleteFCMToken = async () => {
    try {
      if (fcmToken.value) {
        // Delete from backend
        await $fetch('/api/notifications/delete-token', {
          method: 'POST',
          body: { token: fcmToken.value }
        });

        // Delete from Firebase
        if (messaging) {
          await deleteToken(messaging);
        }
        
        fcmToken.value = null;
        console.log('🗑️ FCM token deleted');
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  };

  // Listen for messages from service worker (background notifications)
  const setupServiceWorkerListener = () => {
    if (process.client && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FCM_NOTIFICATION') {
          console.log('Background notification received from service worker:', event.data.payload);
          
          const payload = event.data.payload;
          lastNotification.value = {
            title: payload.notification?.title || payload.data?.title || '',
            body: payload.notification?.body || payload.data?.body || '',
            data: payload.data || {}
          };

          // Dispatch event for notification menu
          window.dispatchEvent(new CustomEvent('fcm-notification', {
            detail: lastNotification.value
          }));

          // Show in-app toast
          try {
            const mainStore = useMainStore();
            mainStore.setSnackbar({
              type: 'notification',
              iconMdi: 'mdi-bell-outline',
              title: lastNotification.value.title || 'New notification',
              subtitle: lastNotification.value.body || '',
            });
          } catch (e) {
            // ignore toast errors
          }
        }
      });
    }
  };

  // Setup connection monitoring
  const setupConnectionMonitoring = () => {
    onlineHandler = async () => {
      console.log('🌐 Connection restored, refreshing FCM token...');
      if (isPermissionGranted.value && messaging) {
        await refreshFCMToken();
      }
    };

    offlineHandler = () => {
      console.log('📡 Connection lost');
    };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
  };

  // Setup visibility change monitoring
  const setupVisibilityMonitoring = () => {
    visibilityChangeHandler = async () => {
      if (!document.hidden && isPermissionGranted.value) {
        console.log('👁️ Tab became visible, checking FCM status...');
        
        // Reinitialize message listener when tab becomes visible
        if (messaging && !unsubscribeMessage) {
          setupMessageListener();
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);
  };

  // Setup periodic token refresh (every 24 hours)
  const setupTokenRefresh = () => {
    // Clear any existing interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    // Refresh token every 24 hours
    tokenRefreshInterval = setInterval(async () => {
      console.log('⏰ Periodic token refresh triggered');
      await refreshFCMToken();
    }, 24 * 60 * 60 * 1000);
  };

  // Initialize on mount
  onMounted(async () => {
    if (process.client) {
      checkSupport();
      if (isSupported.value) {
        await initializeFirebase();
        
        // Wait for service worker to be fully ready before getting token
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.ready;
          } catch (err) {
            console.warn('Service worker not ready:', err);
          }
        }
        
        if (isPermissionGranted.value) {
          // Small delay to ensure service worker is fully activated
          setTimeout(() => {
            getFCMToken();
            setupTokenRefresh();
          }, 500);
        }
        
        setupMessageListener();
        setupServiceWorkerListener();
        setupConnectionMonitoring();
        setupVisibilityMonitoring();
      }
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (unsubscribeMessage) {
      unsubscribeMessage();
    }
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
    }
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler);
    }
    if (offlineHandler) {
      window.removeEventListener('offline', offlineHandler);
    }
  });

  return {
    isSupported,
    isPermissionGranted,
    fcmToken,
    notificationPermission,
    lastNotification,
    requestPermission,
    getFCMToken,
    deleteFCMToken,
    refreshFCMToken,
    checkSupport
  };
};
