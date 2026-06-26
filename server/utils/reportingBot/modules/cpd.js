export const cpdModule = {
  name: 'cpd',
  description: 'CPD training courses, staff course completions, scores, credit hours, compliance',
  schema: `
## CPD (Continuing Professional Development) Module

### Tables

**Courses** — available training courses
- id, title, category (Delegated/All/Dentist Courses/Nurse Courses/Receptionist Courses/Practice Management Courses), creditHours (DECIMAL), mode (In-Person/eLearning/Webinar/Workshop), isVerified, objectives, aim, description, link

**UserCourseHistories** (table name is "UserCourseHistories")
- id, userId, courseId, status (In Progress/Completed/Failed), completedDate (DATE), totalScore (INTEGER), obtainedScore (INTEGER), credits (INTEGER), createdAt

**Users** — for joining to get staff names
- id, fullName, email, roleId

**UserOrganisations** — to scope staff to org
- userId, organisationId, status

### Key Relationships
- UserCourseHistories.userId → Users.id
- UserCourseHistories.courseId → Courses.id
- Always JOIN UserOrganisations to scope staff to the org

### Example Queries

CPD completion summary for all staff in org:
\`\`\`sql
SELECT u."fullName",
  COUNT(*) FILTER (WHERE uch.status = 'Completed') AS completed,
  COUNT(*) FILTER (WHERE uch.status = 'In Progress') AS in_progress,
  COUNT(*) FILTER (WHERE uch.status = 'Failed') AS failed,
  SUM(uch.credits) FILTER (WHERE uch.status = 'Completed') AS total_credits
FROM "UserCourseHistories" uch
JOIN "Users" u ON u.id = uch."userId"
JOIN "UserOrganisations" uo ON uo."userId" = u.id
WHERE uo."organisationId" = <orgId> AND uo.status = 'Active'
GROUP BY u."fullName" ORDER BY u."fullName"
\`\`\`

Staff who haven't completed mandatory courses:
\`\`\`sql
SELECT u."fullName", c.title AS course
FROM "Users" u
JOIN "UserOrganisations" uo ON uo."userId" = u.id AND uo."organisationId" = <orgId> AND uo.status = 'Active'
CROSS JOIN "Courses" c
WHERE c.category = 'All'
  AND NOT EXISTS (
    SELECT 1 FROM "UserCourseHistories" uch
    WHERE uch."userId" = u.id AND uch."courseId" = c.id AND uch.status = 'Completed'
  )
ORDER BY u."fullName", c.title
\`\`\`

Courses completed this month:
\`\`\`sql
SELECT u."fullName", c.title, uch."completedDate", uch.credits,
  uch."obtainedScore", uch."totalScore"
FROM "UserCourseHistories" uch
JOIN "Users" u ON u.id = uch."userId"
JOIN "Courses" c ON c.id = uch."courseId"
JOIN "UserOrganisations" uo ON uo."userId" = u.id
WHERE uo."organisationId" = <orgId>
  AND uch.status = 'Completed'
  AND uch."completedDate" >= date_trunc('month', NOW())
ORDER BY uch."completedDate" DESC
\`\`\`
`
}
