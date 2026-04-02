import taskIcon from '@/assets/icons/notification/task.svg';
import leadIcon from '@/assets/icons/notification/lead.svg';
import messageIcon from '@/assets/icons/notification/message.svg';
import notificationIcon from '@/assets/icons/notification/notification (1).svg';

/**
 * Build a navigation URL for a notification, including orgId for cross-org
 * lead navigation and all other query params (leadId, userTaskId, tab).
 * Returns null for notification types that have no redirect (support, chatbot).
 */
export function buildNotificationUrl(notification) {
  if (notification.type?.startsWith('support_') || notification.type === 'chatbot_message') {
    return null;
  }

  const leadId = notification.data?.leadId || '';
  let url = notification.data?.url || null;

  if (!url) {
    const urlMap = {
      // Tasks
      task_assigned:         '/tasks/mytasks',
      task_assigned_bulk:    '/tasks/mytasks',
      task_completed:        '/tasks/mytasks',
      task_completed_bulk:   '/tasks/mytasks',
      task_comment:          '/tasks/mytasks',
      task_unassigned:       '/tasks/mytasks',
      task_unassigned_bulk:  '/tasks/mytasks',
      task_due_reminder:     '/tasks/mytasks',
      task_overdue_reminder: '/tasks/mytasks',
      // CRM / Leads
      lead_created:          `/crm/leads?leadId=${leadId}`,
      lead_assigned:         `/crm/leads?leadId=${leadId}`,
      lead_unassigned:       `/crm/leads?leadId=${leadId}`,
      lead_status_changed:   `/crm/leads?leadId=${leadId}`,
      crm_automation_sent:   `/crm/leads?leadId=${leadId}`,
      crm_automation_failed: `/crm/leads?leadId=${leadId}`,
      whatsapp_message:      `/crm/leads?leadId=${leadId}&tab=communication`,
      meta_dm:               notification.data?.conversationId
        ? `/crm/dms?conversationId=${encodeURIComponent(notification.data.conversationId)}`
        : '/crm/dms',
      // Rota / Leave
      rota_published: '/teams/rota',
      shift_reminder:  '/teams/rota',
      leave_approved:  '/teams/rota',
      leave_denied:    '/teams/rota',
      // Support / chatbot (no redirect)
      support_ticket_submitted: null,
      support_reply:            null,
      chatbot_message:          null,
      // System
      system_subscription_confirmed:  '/',
      system_account_created:         '/',
      system_password_reset_requested: '/forgetpassword',
      system_portal_ready:            '/dashboard',
    };
    url = urlMap[notification.type] ?? '/';
  }

  if (!url) return null;

  // Normalise legacy /crm? → /crm/leads?
  if ((notification.type?.startsWith('lead_') || notification.type === 'whatsapp_message') && typeof url === 'string') {
    url = url.replace(/^\/crm\?/, '/crm/leads?');
    if (url === '/crm') url = '/crm/leads';
  }

  // Append userTaskId for task deep-link
  if (notification.type?.startsWith('task_') && notification.data?.userTaskId) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}userTaskId=${notification.data.userTaskId}`;
  }

  // Append leadId if not already present
  if (notification.type?.startsWith('lead_') && notification.data?.leadId && !/[?&]leadId=/.test(url)) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}leadId=${notification.data.leadId}`;
  }

  // Append conversationId for DM deep-link if not already present
  if (notification.type === 'meta_dm' && notification.data?.conversationId && !/[?&]conversationId=/.test(url)) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}conversationId=${encodeURIComponent(notification.data.conversationId)}`;
  }

  // Append orgId for cross-org navigation (listView / dms page handles the switch)
  const isLeadNav =
    notification.type?.startsWith('lead_') ||
    notification.type?.startsWith('crm_') ||
    notification.type === 'whatsapp_message' ||
    notification.type === 'meta_dm';
  if (isLeadNav && notification.organisationId && url.startsWith('/crm')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}orgId=${notification.organisationId}`;
  }

  return url;
}

/** Map notification type to an icon asset. */
export function getNotificationIcon(type) {
  if (type?.startsWith('task_')) return taskIcon;
  if (type?.startsWith('lead_') || type?.startsWith('crm_')) return leadIcon;
  if (
    type?.includes('message') || type?.includes('comment') ||
    type === 'whatsapp_message' || type === 'meta_dm' || type === 'chatbot_message' ||
    type?.startsWith('support_')
  ) return messageIcon;
  return notificationIcon; // system, rota, leave, fallback
}

/** Human-readable label for the notification type column. */
export function getNotificationTypeLabel(type) {
  const map = {
    task_assigned:    'Task',
    task_completed:   'Task',
    task_comment:     'Message',
    task_unassigned:  'Task',
    lead_created:     'Lead',
    lead_assigned:    'Lead',
    lead_unassigned:  'Lead',
    whatsapp_message: 'Message',
    meta_dm:          'Message',
    test:             'Task',
  };
  return map[type] || 'Notification';
}

/** Relative time string for a notification timestamp. */
export function formatNotificationTime(dateString) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return date.toLocaleDateString();
}
