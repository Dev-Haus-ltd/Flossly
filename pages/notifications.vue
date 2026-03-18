<template>
  <v-container class="py-6 notifications-page">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 font-weight-bold mb-1">Notifications</h2>
      <div class="text-body-2 text-grey">Stay updated with platform changes and you account activity</div>
    </div>

    <!-- Search, Filters, and Mark all as read -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-inline-flex toolbar-wrapper">
        <!-- Search Field -->
        <div style="width: 200px">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search"
            clearable
            @click:clear="searchQuery = ''"
            variant="solo"
            :elevation="0"
            density="compact"
            hide-details
            bg-color="#F3F4F6"
            flat
            class="custom-search"
          >
            <template #append-inner>
              <img
                :src="searchicon"
                alt="search icon"
                width="14"
                height="14"
              />
            </template>
          </v-text-field>
        </div>

        <!-- Filter Button -->
        <AppBarNotificationFilterMenu
          :clear-trigger="clearFiltersTrigger"
          @update:filters="onFiltersUpdated"
        />
      </div>

      <!-- Mark all as read button -->
      <v-btn
        v-if="unreadCount > 0"
        class="text-none px-6 mark-read-btn"
        @click="markAllAsRead"
      >
        Mark all as read
      </v-btn>
    </div>

    <!-- Notifications Table -->
    <v-card class="notification-table-card" elevation="0">
      <v-table v-if="notifications.length" class="notifications-table">
        <thead>
          <tr>
            <th class="text-left" style="width: 50%;">Notification</th>
            <th class="text-left" style="width: 15%;">Type</th>
            <th class="text-left" style="width: 18%;">Time</th>
            <th class="text-left" style="width: 17%;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="n in filteredNotifications"
            :key="n.id"
            class="notification-row"
            @click="handleNotificationClick(n)"
          >
            <td>
              <div class="d-flex align-center">
                <div class="notification-icon-wrapper">
                  <img
                    :src="getNotificationIconSvg(n.type)"
                    alt="icon"
                    class="notification-icon"
                  />
                </div>
                <div class="notification-content ml-4">
                  <div class="notification-title">{{ n.title }}</div>
                  <div class="notification-body">{{ n.body }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="notification-type">{{ getNotificationTypeLabel(n.type) }}</div>
            </td>
            <td>
              <div class="notification-time">{{ formatTime(n.createdAt) }}</div>
            </td>
            <td>
              <div class="notification-status">
                <v-chip
                  size="small"
                  variant="flat"
                  :class="['status-chip', n.isRead ? 'read' : 'unread']"
                >
                  {{ n.isRead ? 'Read' : 'Unread' }}
                </v-chip>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-card-text v-else class="text-center py-14">
        <v-avatar size="72" color="primary" variant="tonal" class="mx-auto">
          <v-icon size="40">mdi-bell-outline</v-icon>
        </v-avatar>
        <div class="text-h6 mt-5">No notifications</div>
        <div class="text-caption text-grey">You're all caught up.</div>
      </v-card-text>

      <v-divider v-if="notifications.length" />

      <v-card-actions v-if="notifications.length" class="justify-center pa-4">
        <v-btn
          v-if="hasMore"
          variant="text"
          color="primary"
          :loading="loadingMore"
          :disabled="loadingMore"
          @click="loadMore"
          class="text-none see-more-btn"
        >
          See more
        </v-btn>
        <span v-else class="text-caption text-grey">No more notifications</span>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import taskIcon from '@/assets/icons/notification/task.svg';
import leadIcon from '@/assets/icons/notification/lead.svg';
import messageIcon from '@/assets/icons/notification/message.svg';
import notificationIcon from '@/assets/icons/notification/notification (1).svg';
import searchicon from '@/assets/icons/listView/serach-icon.svg';

definePageMeta({
  layout: 'home',
});

const { user } = useUser();
const notifications = ref([]);
const unreadCount = ref(0);
const limit = 30;
const offset = ref(0);
const hasMore = ref(true);
const loadingMore = ref(false);
const searchQuery = ref('');
const filters = ref({
  type: null,
  time: null,
  status: null,
});
const clearFiltersTrigger = ref(0);

const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.body.toLowerCase().includes(query)
    );
  }

  // Apply type filter
  if (filters.value.type) {
    filtered = filtered.filter(n => {
      if (filters.value.type === 'task') {
        return n.type.startsWith('task_');
      } else if (filters.value.type === 'lead') {
        return n.type.startsWith('lead_');
      } else if (filters.value.type === 'message') {
        return n.type.includes('message') || n.type.includes('comment') || 
               n.type === 'whatsapp_message' || n.type === 'meta_dm';
      }
      return true;
    });
  }

  // Apply time filter
  if (filters.value.time) {
    const now = new Date();
    filtered = filtered.filter(n => {
      const notifDate = new Date(n.createdAt);
      
      if (filters.value.time === 'today') {
        return notifDate.toDateString() === now.toDateString();
      } else if (filters.value.time === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return notifDate >= weekAgo;
      } else if (filters.value.time === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return notifDate >= monthAgo;
      } else if (filters.value.time === 'last7days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return notifDate >= sevenDaysAgo;
      } else if (filters.value.time === 'last30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return notifDate >= thirtyDaysAgo;
      }
      return true;
    });
  }

  // Apply status filter
  if (filters.value.status) {
    if (filters.value.status === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filters.value.status === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }
  }

  return filtered;
});

const onFiltersUpdated = (newFilters) => {
  filters.value = newFilters;
};

const fetchPage = async ({ reset = false } = {}) => {
  const currentOffset = reset ? 0 : offset.value;
  const currentOrgId = user.value?.currentLoggedInOrgId || null;
  
  const response = await $fetch('/api/notifications/get-notifications', {
    method: 'GET',
    params: { 
      limit, 
      offset: currentOffset,
      organisationId: currentOrgId
    },
  });

  const payload = response?.data || response;
  const pageItems = payload.notifications || [];

  if (reset) {
    notifications.value = pageItems;
    offset.value = pageItems.length;
  } else {
    notifications.value = [...notifications.value, ...pageItems];
    offset.value += pageItems.length;
  }

  unreadCount.value = payload.unreadCount || 0;
  // If we got fewer than limit, assume no more.
  hasMore.value = pageItems.length === limit;
};

const fetchUnreadCount = async () => {
  const currentOrgId = user.value?.currentLoggedInOrgId || null;
  
  const response = await $fetch('/api/notifications/get-unread-count', {
    method: 'GET',
    params: { organisationId: currentOrgId }
  });
  const payload = response?.data || response;
  unreadCount.value = payload.unreadCount || 0;
};

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    await fetchPage({ reset: false });
  } finally {
    loadingMore.value = false;
  }
};

const markAsRead = async (notificationId) => {
  await $fetch('/api/notifications/mark-read', {
    method: 'POST',
    body: { notificationId },
  });
};

const markAllAsRead = async () => {
  await $fetch('/api/notifications/mark-all-read', {
    method: 'POST',
  });
  await fetchPage({ reset: true });
};

const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    await markAsRead(notification.id);
    notification.isRead = true;
    await fetchUnreadCount();
  }

  // Support notifications don't redirect - just mark as read
  if (notification.type?.startsWith('support_') || notification.type === 'chatbot_message') {
    return;
  }

  // Build URL with query parameters for task notifications
  let url = notification.data?.url || '/';
  
  if (!notification.data?.url) {
    const urlMap = {
      // Tasks
      task_assigned: `/tasks/mytasks`,
      task_assigned_bulk: `/tasks/mytasks`,
      task_completed: `/tasks/mytasks`,
      task_completed_bulk: `/tasks/mytasks`,
      task_comment: `/tasks/mytasks`,
      task_unassigned: `/tasks/mytasks`,
      task_unassigned_bulk: `/tasks/mytasks`,
      task_due_reminder: `/tasks/mytasks`,
      task_overdue_reminder: `/tasks/mytasks`,
      
      // CRM / Leads
      lead_created: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      lead_assigned: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      lead_unassigned: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      lead_status_changed: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      crm_automation_sent: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      crm_automation_failed: `/crm/leads?leadId=${notification.data?.leadId || ''}`,
      whatsapp_message: `/crm/leads?leadId=${notification.data?.leadId || ''}&tab=communication`,
      meta_dm: '/crm/analytics',
      
      // Rota / Leave
      rota_published: '/teams/rota',
      shift_reminder: '/teams/rota',
      leave_approved: '/teams/rota',
      leave_denied: '/teams/rota',
      
      // Support/chat (no redirect, just show notification)
      support_ticket_submitted: null,
      support_reply: null,
      chatbot_message: null,
      
      // System
      system_subscription_confirmed: '/',
      system_account_created: '/',
      system_password_reset_requested: '/forgetpassword',
      system_portal_ready: '/dashboard',
    };
    url = urlMap[notification.type] || '/';
  }
  
  // Normalize legacy CRM routes for lead-related notifications
  if ((notification.type?.startsWith('lead_') || notification.type === 'whatsapp_message') && typeof url === 'string') {
    url = url.replace(/^\/crm\?/, '/crm/leads?');
    if (url === '/crm') url = '/crm/leads';
  }

  // For task notifications, add userTaskId as query parameter to open dialog
  if (notification.type?.startsWith('task_') && notification.data?.userTaskId) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}userTaskId=${notification.data.userTaskId}`;
  }
  
  // For lead notifications, add leadId as query parameter to open dialog
  if (
    notification.type?.startsWith('lead_') &&
    notification.data?.leadId &&
    !/[?&]leadId=/.test(url)
  ) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}leadId=${notification.data.leadId}`;
  }

  // For lead/whatsapp notifications, append orgId so listView can auto-switch org if needed
  const isLeadNav = notification.type?.startsWith('lead_') || notification.type?.startsWith('crm_') || notification.type === 'whatsapp_message';
  if (isLeadNav && notification.organisationId && typeof url === 'string' && url.startsWith('/crm')) {
    url = `${url}&orgId=${notification.organisationId}`;
  }

  await navigateTo(url);
};

const getNotificationIconSvg = (type) => {
  // Map notification types to the custom SVG icons from assets/icons/notification/
  if (type.startsWith('task_')) {
    return taskIcon;
  } else if (type.startsWith('lead_') || type.startsWith('crm_')) {
    return leadIcon;
  } else if (type.startsWith('system_')) {
    return notificationIcon;
  } else if (type.startsWith('rota_') || type.startsWith('shift_') || type.startsWith('leave_')) {
    return notificationIcon;
  } else if (type.includes('message') || type.includes('comment') || type === 'whatsapp_message' || type === 'meta_dm' || type === 'chatbot_message') {
    return messageIcon;
  }
  // Default to notification icon
  return notificationIcon;
};

const getNotificationTypeLabel = (type) => {
  const labelMap = {
    task_assigned: 'Task',
    task_completed: 'Task',
    task_comment: 'Message',
    task_unassigned: 'Task',
    lead_created: 'Lead',
    lead_assigned: 'Lead',
    lead_unassigned: 'Lead',
    whatsapp_message: 'Message',
    meta_dm: 'Message',
    test: 'Task',
  };
  return labelMap[type] || 'Task';
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days === 1) return '24 hours ago';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

onMounted(async () => {
  await fetchPage({ reset: true });

  if (process.client) {
    window.addEventListener('fcm-notification', async () => {
      // refresh counts; don't refetch full list unless user is already on this page
      await fetchUnreadCount();
      // Optional: prepend newest by resetting (simple + correct)
      await fetchPage({ reset: true });
    });
  }
});
</script>

<style scoped>
.notifications-page {
  max-width: 1400px;
  padding: 32px 40px !important;
}

.notification-table-card {
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.notifications-table {
  background: white;
}

.notifications-table thead th {
  background: #FAFAFA;
  font-weight: 600;
  font-size: 14px;
  color: #1A1A1A;
  padding: 12px 16px !important;
  border-bottom: 1px solid #E0E0E0;
  text-transform: none;
}

.notifications-table tbody tr {
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #F0F0F0;
  background: white;
}

.notifications-table tbody tr:last-child {
  border-bottom: none;
}

.notifications-table tbody tr:hover {
  background-color: #F9FAFB;
}

.notifications-table tbody td {
  padding: 12px 16px !important;
  vertical-align: middle;
}

:deep(.v-table .v-table__wrapper > table > thead > tr > th) {
  padding: 12px 16px !important;
}

:deep(.v-table .v-table__wrapper > table > tbody > tr > td) {
  padding: 12px 16px !important;
}

.notification-icon-wrapper {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.notification-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.notification-content {
  max-width: 600px;
}

.notification-title {
  font-weight: 600;
  font-size: 15px;
  color: #1A1A1A;
  margin-bottom: 6px;
  line-height: 1.4;
}

.notification-body {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.notification-type {
  font-size: 14px;
  color: #1A1A1A;
  font-weight: 500;
}

.notification-time {
  font-size: 14px;
  color: #6B7280;
  white-space: nowrap;
}

.notification-status {
  text-align: left;
}

.status-chip {
  font-weight: 500;
  font-size: 13px;
  border-radius: 20px;
  height: 28px;
  padding: 0 16px;
}

:deep(.status-chip.v-chip--size-small) {
  height: 28px;
}

:deep(.status-chip .v-chip__content) {
  font-weight: 500;
}

.status-chip.unread {
  background-color: #DBEAFE !important;
  color: #3B82F6 !important;
}

.status-chip.read {
  background-color: #FEE2D5 !important;
  color: #EA580C !important;
}

.text-wrap {
  white-space: normal;
  word-break: break-word;
}

.mark-read-btn {
  background-color: hsla(251, 64%, 35%, 1) !important;
  color: white !important;
}

.see-more-btn {
  font-weight: 500;
}

/* Toolbar styles from tasks */
.toolbar-wrapper {
  height: 46px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.custom-search,
.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none !important;
  color: #737373;
  align-items: center;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}

.tbl-top-btn {
  margin-left: 0 !important;
}
</style>
