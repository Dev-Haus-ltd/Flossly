export const notificationsModule = {
  name: 'notifications',
  description: 'User notifications — unread alerts, recent notifications, notification types and counts',
  schema: `
## Notifications Module

### Tables

**UserNotifications** — in-app notifications per user
- id, userId, organisationId, title, body, type, referenceType, referenceId, data (JSON), priority (low/medium/high/urgent), isRead (BOOLEAN), readAt, isSent, sentAt, createdAt

### Example Queries

Unread notifications for current user:
\`\`\`sql
SELECT id, title, body, type, priority, "createdAt"
FROM "UserNotifications"
WHERE "organisationId" = <orgId>
  AND "userId" = <userId>
  AND "isRead" = false
ORDER BY "createdAt" DESC
LIMIT 50
\`\`\`

Count unread by type:
\`\`\`sql
SELECT type, priority, COUNT(*) AS count
FROM "UserNotifications"
WHERE "organisationId" = <orgId>
  AND "userId" = <userId>
  AND "isRead" = false
GROUP BY type, priority
ORDER BY count DESC
\`\`\`

Recent notifications (last 7 days):
\`\`\`sql
SELECT title, body, type, "isRead", "createdAt"
FROM "UserNotifications"
WHERE "organisationId" = <orgId>
  AND "userId" = <userId>
  AND "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC
LIMIT 30
\`\`\`
`
}
