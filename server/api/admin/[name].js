import {
  searchUsers,
  getUserById,
  getAllRoles,
  updateUserStatus,
  getUserLoginHistory,
  resendInvite,
  resetUserPassword,
  getOrgsTrialsExpiringInXDays,
  getPastDueOrgs,
  getOrgsAboveSeatLimit,
  getOrgsByPlanType,
  getUsageMetrics,
  exportOrgTasks,
  exportAllTasks,
  getTaskPool,
  getGlobalAutomationLibrary,
  getPracticeAutomationLibrary,
  toggleAutomationTemplate,
  getStorageUsagePerPractice,
  broadcastNotification,
  getNotificationDeliveryStats,
  deductPoints,
  awardPoints,
  getPointsIssuedByAdmin,
  getPointsTotalsByPractice,
  searchOrganisations,
  getOrganisationById,
  searchRoles
} from '../../controllers/admin';

export default defineEventHandler(async (event) => {
  const { name } = event.context.params;

  switch (name) {
    // User Management
    case 'searchUsers':
      return await searchUsers(event);
    
    case 'getUserById':
      return await getUserById(event);
    
    case 'updateUserStatus':
      return await updateUserStatus(event);
    
    case 'searchOrganisations':
      return await searchOrganisations(event);
    
    case 'getOrganisationById':
      return await getOrganisationById(event);
    
    case 'searchRoles':
      return await searchRoles(event);
    
    case 'getUserLoginHistory':
      return await getUserLoginHistory(event);
    
    case 'resendInvite':
      return await resendInvite(event);
    
    case 'resetUserPassword':
      return await resetUserPassword(event);

    // Organisation Monitoring
    case 'getOrgsTrialsExpiringInXDays':
      return await getOrgsTrialsExpiringInXDays(event);
    
    case 'getPastDueOrgs':
      return await getPastDueOrgs(event);
    
    case 'getOrgsAboveSeatLimit':
      return await getOrgsAboveSeatLimit(event);
    
    case 'getOrgsByPlanType':
      return await getOrgsByPlanType(event);

    // System Data
    case 'getAllRoles':
      return await getAllRoles(event);
    
    case 'getUsageMetrics':
      return await getUsageMetrics(event);
    
    case 'getStorageUsagePerPractice':
      return await getStorageUsagePerPractice(event);
    
    // Notifications
    case 'broadcastNotification':
      return await broadcastNotification(event);
    
    case 'getNotificationDeliveryStats':
      return await getNotificationDeliveryStats(event);
    
    // Export Data
    case 'exportOrgTasks':
      return await exportOrgTasks(event);
    
    case 'exportAllTasks':
      return await exportAllTasks(event);
    
    // Task Pool
    case 'getTaskPool':
      return await getTaskPool(event);
    
    // CRM Automation Library
    case 'getGlobalAutomationLibrary':
      return await getGlobalAutomationLibrary(event);
    
    case 'getPracticeAutomationLibrary':
      return await getPracticeAutomationLibrary(event);
    
    case 'toggleAutomationTemplate':
      return await toggleAutomationTemplate(event);
    
    // Points Management
    case 'deductPoints':
      return await deductPoints(event);
    
    case 'awardPoints':
      return await awardPoints(event);
    
    case 'pointsIssuedByAdmin':
      return await getPointsIssuedByAdmin(event);
    
    case 'pointsTotalsByPractice':
      return await getPointsTotalsByPractice(event);

    // 404 for unknown endpoints
    default:
      return {
        statusCode: 404,
        body: {
          status: 'error',
          message: `Admin endpoint '${name}' not found`
        }
      };
  }
});
