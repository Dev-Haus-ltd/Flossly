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

  const getFCMToken = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    if (tokenFetchInProgress) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!tokenFetchInProgress) {
          return fcmToken.value;
        }
      }
      tokenFetchInProgress = false;
    }

    if (fcmToken.value && retryCount === 0) {
      return fcmToken.value;
    }

    tokenFetchInProgress = true;

    try {
      if (!messaging) {
        const initialized = await initializeFirebase();
        if (!initialized) {
          throw new Error('Failed to initialize Firebase');
        }
      }

      if (!isPermissionGranted.value) {
        return null;
      }

      let registration;
      try {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service worker timeout')), 10000)
          )
        ]);
      } catch (swError) {
        console.error('Service worker not ready:', swError);
        throw new Error('Service worker initialization failed');
      }

      const currentToken = await getToken(messaging, {
        vapidKey: config.public.firebaseVapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        fcmToken.value = currentToken;
        
        // Always store token in localStorage as backup for network failures
        if (process.client) {
          localStorage.setItem('fcm_token', currentToken);
          console.log('📱 [FCM] Token stored in localStorage:', currentToken.substring(0, 50) + '...');
        }
        
        const saveResult = await saveFCMTokenToBackend(currentToken, 3);
        
        if (!saveResult.success) {
          if (process.client) {
            localStorage.setItem('fcm_token_save_pending', currentToken);
            console.warn('📱 [FCM] Token save failed, stored in localStorage for retry');
            // Schedule retry
            scheduleTokenRetry();
          }
        } else {
          if (process.client) {
            localStorage.removeItem('fcm_token_save_pending');
            console.log('📱 [FCM] Token saved to backend successfully');
          }
        }
        
        return currentToken;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);

      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return getFCMToken(retryCount + 1);
      }

      return null;
    } finally {
      tokenFetchInProgress = false;
    }
  };

  const saveFCMTokenToBackend = async (token, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString()
        };

        const browser = getBrowserInfo();

        const response = await $fetch('/api/notifications/save-token', {
          method: 'POST',
          body: {
            token,
            deviceType: 'web',
            browser,
            deviceInfo
          },
          timeout: 30000 // Increased timeout to 30 seconds
        });
        
        return { success: true, response };
      } catch (error) {
        console.error(`Error saving FCM token (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        // If authentication failed, don't retry - just save to localStorage for later
        if (error.statusCode === 401 || error.statusCode === 403) {
          console.log('📝 Authentication pending, will retry token save after login');
          return { success: false, error: 'Authentication pending', authFailed: true };
        }
        
        if (attempt < maxRetries - 1) {
          const delay = 2000 * Math.pow(2, attempt); // Increased delay
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          return { success: false, error: error.message };
        }
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
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

  const refreshFCMToken = async () => {
    if (!messaging || !isPermissionGranted.value) {
      return;
    }

    try {
      if (!fcmToken.value) {
        await getFCMToken();
        return;
      }

      const saveResult = await saveFCMTokenToBackend(fcmToken.value, 2);
      
      if (!saveResult.success) {
        fcmToken.value = null;
        tokenFetchInProgress = false;
        await getFCMToken();
      }
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
    }
  };

  const deleteFCMToken = async () => {
    try {
      if (fcmToken.value) {
        await $fetch('/api/notifications/delete-token', {
          method: 'POST',
          body: { token: fcmToken.value }
        });

        if (messaging) {
          await deleteToken(messaging);
        }
        
        if (process.client) {
          localStorage.removeItem('fcm_token_save_pending');
        }
        
        fcmToken.value = null;
        tokenFetchInProgress = false;
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      fcmToken.value = null;
      tokenFetchInProgress = false;
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
      console.log('🌐 Connection restored');
      
      // First, try to save any pending token
      if (process.client) {
        const pendingToken = localStorage.getItem('fcm_token_save_pending');
        if (pendingToken) {
          console.log('🔄 Retrying pending FCM token save after network restore...');
          const saveResult = await saveFCMTokenToBackend(pendingToken, 3);
          if (saveResult.success) {
            console.log('✅ Pending FCM token saved successfully!');
            localStorage.removeItem('fcm_token_save_pending');
          }
        }
      }
      
      // Then refresh the token
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

  const setupVisibilityMonitoring = () => {
    visibilityChangeHandler = async () => {
      if (!document.hidden && isPermissionGranted.value) {
        if (messaging && !unsubscribeMessage) {
          setupMessageListener();
        }
        
        try {
          const currentToken = await getToken(messaging, {
            vapidKey: config.public.firebaseVapidKey
          });

          if (currentToken && currentToken !== fcmToken.value) {
            console.log('🔄 Token changed while tab was hidden, updating...');
            fcmToken.value = currentToken;
            await saveFCMTokenToBackend(currentToken, 3);
          }
        } catch (error) {
          console.error('Error checking token on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);
  };

  const setupTokenRefresh = () => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    tokenRefreshInterval = setInterval(async () => {
      if (!messaging || !isPermissionGranted.value) return;

      try {
        const currentToken = await getToken(messaging, {
          vapidKey: config.public.firebaseVapidKey
        });

        if (currentToken && currentToken !== fcmToken.value) {
          console.log('🔄 Token rotation detected during periodic check');
          fcmToken.value = currentToken;
          await saveFCMTokenToBackend(currentToken, 3);
        }
      } catch (error) {
        console.error('Error during periodic token check:', error);
      }
    }, 5 * 60 * 1000);
  };

  // Watch for authentication changes and retry token save
  const retryPendingTokenSave = async () => {
    if (process.client) {
      const pendingToken = localStorage.getItem('fcm_token_save_pending');
      if (pendingToken) {
        console.log('🔄 Retrying pending FCM token save after authentication...');
        const saveResult = await saveFCMTokenToBackend(pendingToken, 3);
        if (saveResult.success) {
          console.log('✅ Pending FCM token saved successfully!');
          localStorage.removeItem('fcm_token_save_pending');
        }
      }
    }
  };

  onMounted(async () => {
    if (process.client) {
      checkSupport();
      if (isSupported.value) {
        await initializeFirebase();
        
        if (isPermissionGranted.value) {
          if ('serviceWorker' in navigator) {
            try {
              await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 5000))
              ]);
            } catch (err) {
              console.error('Service worker initialization delayed:', err);
            }
          }
          
          // Try to save pending token first
          const pendingToken = localStorage.getItem('fcm_token_save_pending');
          if (pendingToken) {
            const saveResult = await saveFCMTokenToBackend(pendingToken, 3);
            if (saveResult.success) {
              localStorage.removeItem('fcm_token_save_pending');
            }
          }
          
          await getFCMToken();
          setupTokenRefresh();
        }
        
        setupMessageListener();
        setupServiceWorkerListener();
        setupConnectionMonitoring();
        setupVisibilityMonitoring();
        
        // Listen for authentication success events
        window.addEventListener('user-authenticated', retryPendingTokenSave);
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
    if (process.client) {
      window.removeEventListener('user-authenticated', retryPendingTokenSave);
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
