export const staffModule = {
  name: 'staff',
  description: 'Staff members, roles, rota/shifts, leave, HR documents, contracts, CPD training',
  schema: `
## Staff Module

### Tables

**Users** — all user accounts
- id, fullName, email, roleId, status (Active/Disabled/Invited/Expired), dob, gender, createdAt

**UserOrganisations** — links users to an org
- id, userId, organisationId, status (Active/Disabled/Invited/Expired), createdAt
- Active staff: JOIN UserOrganisations WHERE status = 'Active'

**Roles** — role definitions
- id, title, roleType (Clinical / Clinical Support / Operational & Admin / Business & Marketing / Back Office / External / Consultant / Ambassador)

**UserContracts** — employment contracts
- id, userId, organisationId, contractType, weeklyHours (DECIMAL), salaryPerHour (DECIMAL), contractStartDate (DATE), probEndDate, pensionEligible, paymentFrequency, paymentStartDate

**UserLeaveHistories** (table name is "UserLeaveHistories")
- id, userId, organisationId, leaveType (Annual/Sick/Casual/Maternity/Paternity/Adoption/Shared Parental/Public Holiday/Sabbatical/Study/Volunteer/Others), startDate (DATE), endDate (DATE), status (Pending/Approved/Rejected/Cancelled), totalHours (DECIMAL), isPaid, reason, approvedBy (userId), createdAt

**UserLeaveEntitlements** — annual allowances per user
- id, userId, organisationId, allowedAnnualLeaves, takenAnnualLeaves, allowedSickLeaves, takenSickLeaves, allowedCasualLeaves, takenCasualLeaves (etc.)

**Rota** — rota schedules
- id, organisationId, name, startDate (DATEONLY), endDate (DATEONLY), isPublished, isDeleted, createdAt

**RotaShifts** — individual shifts within a rota
- id, rotaId, userId, surgeryId, startDate (TIMESTAMP), endDate (TIMESTAMP), breakTime (INTEGER minutes), isLocumShift (BOOLEAN), locumUserId, isDeleted, isTemplate

**RotaUsers** — staff included in a rota
- id, rotaId, userId, isTempUser, tempUserName, tempUserRoleId

**UserHrDocuments** — HR document tracking
- id, userId, name, type (Recruitment/Training/Flossly), status (Completed/Pending), uploadedDate (DATE)

**UserAccounts** — bank details per user
- id, userId, bankName, sortCode, accountNumber

### Key Relationships
- RotaShifts.userId → Users.id
- UserLeaveHistories.userId → Users.id
- UserLeaveHistories.approvedBy → Users.id
- Users.roleId → Roles.id
- UserOrganisations links Users ↔ Organisations (always join this to scope to org)

### Example Queries

Active staff in org with their roles:
\`\`\`sql
SELECT u.id, u."fullName", u.email, r.title AS role, r."roleType"
FROM "Users" u
JOIN "UserOrganisations" uo ON uo."userId" = u.id
JOIN "Roles" r ON r.id = u."roleId"
WHERE uo."organisationId" = <orgId> AND uo.status = 'Active'
ORDER BY u."fullName"
\`\`\`

Pending leave requests:
\`\`\`sql
SELECT u."fullName", lh."leaveType", lh."startDate", lh."endDate", lh."totalHours", lh.reason
FROM "UserLeaveHistories" lh
JOIN "Users" u ON u.id = lh."userId"
WHERE lh."organisationId" = <orgId> AND lh.status = 'Pending'
ORDER BY lh."startDate"
\`\`\`

Leave taken this month per staff member:
\`\`\`sql
SELECT u."fullName", lh."leaveType", SUM(lh."totalHours") AS hours
FROM "UserLeaveHistories" lh
JOIN "Users" u ON u.id = lh."userId"
WHERE lh."organisationId" = <orgId>
  AND lh.status = 'Approved'
  AND lh."startDate" >= date_trunc('month', NOW())
GROUP BY u."fullName", lh."leaveType"
ORDER BY u."fullName"
\`\`\`

Shifts this week:
\`\`\`sql
SELECT u."fullName", rs."startDate", rs."endDate",
  (EXTRACT(EPOCH FROM (rs."endDate" - rs."startDate")) / 3600 - rs."breakTime"::float/60) AS worked_hours
FROM "RotaShifts" rs
JOIN "Users" u ON u.id = rs."userId"
JOIN "Rota" r ON r.id = rs."rotaId"
WHERE r."organisationId" = <orgId>
  AND rs."isDeleted" = false AND rs."isTemplate" = false
  AND rs."startDate" >= date_trunc('week', NOW())
  AND rs."startDate" < date_trunc('week', NOW()) + INTERVAL '7 days'
ORDER BY rs."startDate"
\`\`\`

Overdue HR documents (Pending):
\`\`\`sql
SELECT u."fullName", hd.name, hd.type, hd."uploadedDate"
FROM "UserHrDocuments" hd
JOIN "Users" u ON u.id = hd."userId"
JOIN "UserOrganisations" uo ON uo."userId" = u.id
WHERE uo."organisationId" = <orgId>
  AND uo.status = 'Active'
  AND hd.status = 'Pending'
ORDER BY u."fullName"
\`\`\`
`
}
