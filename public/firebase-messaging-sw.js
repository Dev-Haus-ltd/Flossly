// Firebase Cloud Messaging Service Worker
// Keep Firebase SW libraries in sync with installed firebase npm version

// Wrap importScripts in try-catch for extension compatibility
try {
  importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');
} catch (e) {
  console.error('Failed to load Firebase scripts:', e);
}

// Initialize Firebase in the service worker
// The config will be dynamically injected by the client
let messaging = null;
let isFirebaseInitialized = false;
let messageHandlerSet = false;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    const firebaseConfig = event.data.config;
    
    try {
      // Init Firebase only once
      if (!isFirebaseInitialized && typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
          console.log('✅ Firebase initialized in service worker');
        }
        isFirebaseInitialized = true;
      }
      
      // Set up messaging handler only once
      if (!messageHandlerSet && typeof firebase !== 'undefined' && isFirebaseInitialized) {
        messaging = firebase.messaging();
        
        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
          console.log('📨 Background message received:', payload);
          
          // Notify all clients (open tabs) about the new notification
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'FCM_NOTIFICATION',
                payload: payload
              });
            });
          });
          
          const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
          const notificationOptions = {
            body: payload.notification?.body || payload.data?.body || '',
            icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png',
            badge: '/pwa-64x64.png',
            data: payload.data || {},
            tag: payload.data?.type || 'general',
            requireInteraction: payload.data?.priority === 'high' || payload.data?.priority === 'urgent',
            renotify: true, // Renotify even if tag matches (for updates)
            vibrate: [200, 100, 200] // Vibration pattern
          };

          // Add action buttons based on notification type
          if (payload.data?.type === 'task_assigned') {
            notificationOptions.actions = [
              { action: 'view', title: 'View Task' },
              { action: 'dismiss', title: 'Dismiss' }
            ];
          } else if (payload.data?.type === 'lead_created') {
            notificationOptions.actions = [
              { action: 'view', title: 'View Lead' },
              { action: 'dismiss', title: 'Dismiss' }
            ];
          } else if (payload.data?.type === 'whatsapp_message' || payload.data?.type === 'meta_dm') {
            notificationOptions.actions = [
              { action: 'view', title: 'View Message' },
              { action: 'dismiss', title: 'Dismiss' }
            ];
          }

          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
        
        messageHandlerSet = true;
        console.log('✅ Message handler set up');
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase in service worker:', error);
    }
  }
  
  // Handle keep-alive ping
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    event.ports[0]?.postMessage({ status: 'alive' });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
  event.notification.close();

  const clickAction = event.action;
  const notificationData = event.notification.data;

  // Determine the URL to open based on notification type
  let urlToOpen = '/';
  
  if (clickAction === 'view' || !clickAction) {
    switch (notificationData.type) {
      case 'task_assigned':
      case 'task_completed':
      case 'task_completed_bulk':
      case 'task_comment':
      case 'task_unassigned':
      case 'task_unassigned_bulk':
      case 'task_due_reminder':
      case 'task_overdue_reminder':
        // Use the URL from notification data if available, otherwise fallback to taskId
        urlToOpen = notificationData.url || (notificationData.taskId 
          ? `/tasks/mytasks?taskId=${notificationData.taskId}` 
          : '/tasks/mytasks');
        break;
      case 'lead_created':
      case 'lead_assigned':
      case 'lead_unassigned':
        urlToOpen = notificationData.leadId 
          ? `/crm/leads?leadId=${notificationData.leadId}` 
          : '/crm/leads';
        break;
      case 'whatsapp_message':
        urlToOpen = notificationData.leadId 
          ? `/crm/leads?leadId=${notificationData.leadId}&tab=communication` 
          : '/crm/leads';
        break;
      case 'meta_dm':
        urlToOpen = '/crm/analytics';
        break;
      default:
        urlToOpen = notificationData.url || '/';
    }
  } else if (clickAction === 'dismiss') {
    return; // Just close the notification
  }

  const appendOrgId = (rawUrl) => {
    const orgId = notificationData.organisationId;
    if (!orgId || !rawUrl) return rawUrl;

    try {
      const parsed = new URL(rawUrl, self.location.origin);
      if (!parsed.searchParams.has('orgId')) {
        parsed.searchParams.set('orgId', orgId);
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (error) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}orgId=${encodeURIComponent(orgId)}`;
    }
  };

  urlToOpen = appendOrgId(urlToOpen);

  // Open the URL in a window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus().then(client => {
            // Navigate to the URL
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('✅ Service Worker claimed all clients');
    })
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Keep service worker alive with periodic tasks (helps with extension compatibility)
self.addEventListener('fetch', (event) => {
  // Pass through all fetch requests (don't cache)
  // This is just to keep the service worker active
  return;
});

// Handle errors gracefully
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});

