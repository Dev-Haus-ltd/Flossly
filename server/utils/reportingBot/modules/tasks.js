export const tasksModule = {
  name: 'tasks',
  description: 'Task management — user tasks, team tasks, categories, statuses, priorities, checklists, overdue tasks',
  schema: `
## Tasks Module

### Tables

**UserTasks** — the main task records
- id, organisationId, userId (owner), taskId (links to Tasks template, often null), title, statusId, priorityId, frequency, dueDate, isArchieved (note: typo in DB — "Archieved"), template (TEXT), documentLink, comments, assignedBy, createdAt, updatedAt
- NO direct categoryId column — category comes via taskId → Tasks.categoryId → TaskCategories
- Filter active tasks: WHERE "isArchieved" = false
- Overdue tasks: WHERE "dueDate" < NOW() AND "isArchieved" = false and status is not completed

**TaskCategories** — both system-wide and org-specific categories
- id, name, parentId (null = top-level parent, non-null = child/subcategory), organisationId (NULL = system/global category, non-null = org-specific)
- Categories are hierarchical: e.g. "Mandatory (Staff Management)" is a child of "Staff Management"
- **IMPORTANT**: When grouping tasks by category, always roll up to the TOP-LEVEL parent category (where parentId IS NULL). Never group by leaf/child categories alone — users expect to see "Staff Management", not "Mandatory (Staff Management)".
- System categories (organisationId IS NULL): Marketing, Finance, HR, Onboarding, Workflow, etc.
- To find category by name: WHERE LOWER(name) LIKE LOWER('%keyword%')
- Always search BOTH system (organisationId IS NULL) AND org categories (organisationId = <orgId>) when looking up category

**Tasks** — system task templates
- id, title, categoryId, roleId, defaultFrequency, isSystemTask

**DefaultStatuses** — system-wide task status definitions (shared across all orgs)
- id, key, name
- Values: 1=To Do, 2=In Progress, 3=Over due, 4=Completed

**OrganisationStatuses** — org-specific custom statuses
- id, organisationId, key, name, color

**DefaultPriorities** — system-wide priority levels
- id, key, name
- Values: 1=Low, 2=Medium, 3=High, 4=Critical

**OrganisationPriorities** — org-specific custom priorities
- id, organisationId, key, name, color

**UserTaskComments** — comments on tasks
- id, userTaskId, userId, organisationId, comment, createdAt

**UserTaskChecklists** — checklist items on tasks
- id, userTaskId, question, radioValue (Yes/No/N/A), showRadio, showTime, showDate

**UserTaskAttachments** — file attachments on tasks
- id, userTaskId, title, type, link, size, uploadedBy, createdAt

### Key Relationships
- UserTasks.statusId → DefaultStatuses.id OR OrganisationStatuses.id
- UserTasks.priorityId → DefaultPriorities.id OR OrganisationPriorities.id
- UserTasks.taskId → Tasks.categoryId → TaskCategories.id (NO direct categoryId on UserTasks)
- TaskCategories.parentId → TaskCategories.id (self-referential hierarchy)
- UserTasks.userId → Users.id (task owner)
- UserTasks.assignedBy → Users.id (assigner)

### Status Resolution
UserTasks.statusId can reference either DefaultStatuses or OrganisationStatuses. To get status name:
\`\`\`sql
LEFT JOIN "DefaultStatuses" ds ON ut."statusId" = ds.id
LEFT JOIN "OrganisationStatuses" os ON ut."statusId" = os.id AND os."organisationId" = <orgId>
COALESCE(os.name, ds.name) AS status_name
\`\`\`

### Priority Resolution
Same pattern as statuses — join both DefaultPriorities and OrganisationPriorities.

### Example Queries

Count tasks by status for a user:
\`\`\`sql
SELECT COALESCE(os.name, ds.name) AS status, COUNT(*) AS count
FROM "UserTasks" ut
LEFT JOIN "DefaultStatuses" ds ON ut."statusId" = ds.id
LEFT JOIN "OrganisationStatuses" os ON ut."statusId" = os.id AND os."organisationId" = <orgId>
WHERE ut."organisationId" = <orgId> AND ut."userId" = <userId> AND ut."isArchieved" = false
GROUP BY COALESCE(os.name, ds.name)
\`\`\`

Tasks by category — always roll up to top-level parent category:
\`\`\`sql
SELECT COALESCE(parent.name, tc.name) AS category, COUNT(*) AS count
FROM "UserTasks" ut
JOIN "Tasks" t ON t.id = ut."taskId"
JOIN "TaskCategories" tc ON tc.id = t."categoryId"
LEFT JOIN "TaskCategories" parent ON parent.id = tc."parentId"
WHERE ut."organisationId" = <orgId> AND ut."isArchieved" = false
GROUP BY COALESCE(parent.name, tc.name)
ORDER BY count DESC
\`\`\`

Find tasks in "staff management" or "HR" category:
\`\`\`sql
SELECT ut.id, ut.title, tc.name AS category
FROM "UserTasks" ut
JOIN "Tasks" t ON t.id = ut."taskId"
JOIN "TaskCategories" tc ON tc.id = t."categoryId"
WHERE ut."organisationId" = <orgId>
  AND ut."isArchieved" = false
  AND (tc."organisationId" = <orgId> OR tc."organisationId" IS NULL)
  AND LOWER(tc.name) LIKE ANY(ARRAY['%staff%', '%hr%', '%management%'])
\`\`\`
`
}
