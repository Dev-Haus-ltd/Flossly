<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom"
    max-width="400"
    transition="scale-transition"
  >
    <!-- Activator -->
    <template #activator="{ props }">
      <v-badge
        v-if="unreadCount > 0"
        :content="unreadCount > 99 ? '99+' : unreadCount"
        color="error"
        overlap
        class="notification-badge-custom"
      >
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="40"
          class="mx-3 notification-bell-btn"
          @click="maybeRequestPermission"
        >
          <img :src="notificationIcon" alt="notifications" width="24" height="24" class="notification-svg-icon" />
        </v-btn>
      </v-badge>
      <v-btn
        v-else
        v-bind="props"
        icon
        variant="text"
        size="40"
        class="mx-3 notification-bell-btn"
        @click="maybeRequestPermission"
      >
        <img :src="notificationIcon" alt="notifications" width="24" height="24" class="notification-svg-icon" />
      </v-btn>
    </template>

    <!-- Menu Content -->
    <v-card min-width="450" max-width="500" class="notification-menu-card">
      <!-- Header -->
      <div class="notification-header px-6 py-4">
        <h3 class="text-h6 font-weight-bold">Notifications</h3>
        <v-btn
          v-if="unreadCount > 0"
          size="small"
          class="mark-read-btn text-none"
          @click="markAllAsRead"
        >
          Mark all read
        </v-btn>
      </div>
      <v-divider />

      <!-- Notifications List -->
      <div v-if="notifications.length > 0" class="notifications-list" style="max-height: 500px; overflow-y: auto">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'notification-unread': !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <div class="d-flex align-start">
            <div class="notification-icon-wrapper flex-shrink-0">
              <img
                :src="getNotificationIconSvg(notification.type)"
                alt="icon"
                class="notification-icon"
              />
            </div>
            <div class="notification-content ml-4 flex-grow-1">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-body">{{ notification.body }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <v-card-text v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-bell-outline</v-icon>
        <div class="text-body-1 mt-3">No notifications</div>
        <div class="text-caption text-grey">You're all caught up!</div>
      </v-card-text>

      <v-divider v-if="notifications.length > 0" />

      <!-- Footer -->
      <v-card-actions v-if="notifications.length > 0" class="justify-center">
        <v-btn variant="text" color="primary" @click="viewAllNotifications">
          View All
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
import { useFCM } from '~/composables/useFCM';
import notificationIcon from '@/assets/icons/notification/Notification.svg';
import taskIcon from '@/assets/icons/notification/task.svg';
import leadIcon from '@/assets/icons/notification/lead.svg';
import messageIcon from '@/assets/icons/notification/message.svg';

const menu = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const router = useRouter();

// Initialize FCM
const { isSupported, isPermissionGranted, requestPermission } = useFCM();

const maybeRequestPermission = async () => {
  // Only prompt on explicit user gesture (this click)
  if (process.client && isSupported.value && !isPermissionGranted.value) {
    await requestPermission();
  }
};

// Fetch notifications
const fetchNotifications = async () => {
  try {
    const response = await $fetch('/api/notifications/get-notifications', {
      method: 'GET',
      params: { limit: 10, offset: 0 }
    });

    const payload = response?.data || response;

    if (payload?.success || response?.success) {
      notifications.value = payload.notifications || [];
      unreadCount.value = payload.unreadCount || 0;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

// Get unread count
const fetchUnreadCount = async () => {
  try {
    const response = await $fetch('/api/notifications/get-unread-count');
    const payload = response?.data || response;
    if (payload?.success || response?.success) {
      unreadCount.value = payload.unreadCount || 0;
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    await $fetch('/api/notifications/mark-read', {
      method: 'POST',
      body: { notificationId }
    });
    await fetchNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Mark all as read
const markAllAsRead = async () => {
  try {
    await $fetch('/api/notifications/mark-all-read', {
      method: 'POST'
    });
    await fetchNotifications();
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};

// Handle notification click
const handleNotificationClick = async (notification) => {
  // Mark as read
  if (!notification.isRead) {
    await markAsRead(notification.id);
  }

  // Navigate based on notification type
  const urlMap = {
    task_assigned: `/tasks/${notification.data?.taskId || 'mytasks'}`,
    task_completed: `/tasks/${notification.data?.taskId || 'mytasks'}`,
    lead_created: `/crm?leadId=${notification.data?.leadId || ''}`,
    whatsapp_message: `/crm?leadId=${notification.data?.leadId || ''}&tab=communication`,
    meta_dm: '/crm/analytics',
  };

  const url = notification.data?.url || urlMap[notification.type] || '/';
  menu.value = false;
  await navigateTo(url);
};

// View all notifications
const viewAllNotifications = () => {
  menu.value = false;
  // Navigate to notifications page
  navigateTo('/notifications');
};

// Get notification icon SVG based on type
const getNotificationIconSvg = (type) => {
  if (type.startsWith('task_')) {
    return taskIcon;
  } else if (type.startsWith('lead_')) {
    return leadIcon;
  } else if (type.includes('message') || type.includes('comment') || type === 'whatsapp_message' || type === 'meta_dm') {
    return messageIcon;
  }
  return taskIcon;
};

// Format time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Listen for FCM messages
onMounted(() => {
  fetchNotifications();
  
  // Listen for new notifications from FCM
  if (process.client) {
    window.addEventListener('fcm-notification', (event) => {
      fetchUnreadCount();
      // Don't fetch notifications unless menu is open - let the badge update via unreadCount
      if (menu.value) {
        fetchNotifications();
      }
    });
  }
});

// Refresh when menu is opened
watch(menu, (newVal) => {
  if (newVal) {
    fetchNotifications();
  }
});
</script>

<style scoped>
.notification-badge-custom :deep(.v-badge__badge) {
  top: 0px !important;
  left: 30px !important;
}

.notification-bell-btn {
  background-color: transparent !important;
}

.notification-bell-btn:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.notification-svg-icon {
  filter: brightness(0) saturate(100%) invert(100%);
}

.notification-menu-card {
  border-radius: 12px;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.mark-read-btn {
  background-color: hsla(251, 64%, 35%, 1) !important;
  color: white !important;
  padding: 6px 16px;
}

.notifications-list {
  background: white;
}

.notification-item {
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #F0F0F0;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #F9FAFB;
}

.notification-unread {
  background-color: #F0F7FF;
}

.notification-icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.notification-content {
  max-width: 350px;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #1A1A1A;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-body {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #9CA3AF;
}

.text-wrap {
  white-space: normal;
  word-wrap: break-word;
}
</style>
  