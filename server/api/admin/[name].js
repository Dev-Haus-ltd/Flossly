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
  getTaskPool
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
    
    // Export Data
    case 'exportOrgTasks':
      return await exportOrgTasks(event);
    
    case 'exportAllTasks':
      return await exportAllTasks(event);
    
    // Task Pool
    case 'getTaskPool':
      return await getTaskPool(event);

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
