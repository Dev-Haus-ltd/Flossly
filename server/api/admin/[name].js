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
  getTaskById,
  getGlobalAutomationLibrary,
  getPracticeAutomationLibrary,
  toggleAutomationTemplate,
  adminBulkUploadAutomations,
  adminBulkUploadLeads,
  downloadAdminAutomationTemplate,
  downloadAdminLeadTemplate,
  listScriptsPool,
  getScriptPoolItemById,
  createScriptPoolItem,
  updateScriptPoolItem,
  deleteScriptPoolItem,
  getOrganisationCrmFeatureFlags,
  updateOrganisationCrmFeatureFlags,
  listCrmTreatments,
  getCrmTreatmentById,
  createCrmTreatment,
  updateCrmTreatment,
  deleteCrmTreatment,
  listLeadSources,
  getLeadSourceById,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  listCrmAlerts,
  getCrmAlertByKey,
  createCrmAlert,
  updateCrmAlert,
  deleteCrmAlert,
  getStorageUsagePerPractice,
  broadcastNotification,
  getNotificationDeliveryStats,
  extendOrganisationTrial,
  updateUserLicense,
  updateOrganisationInfo,
  updateUserInfo,
  deductPoints,
  awardPoints,
  getPointsIssuedByAdmin,
  getPointsTotalsByPractice,
  searchOrganisations,
  getOrganisationById,
  searchRoles,
  adminBulkUploadTasks,
  downloadAdminTaskTemplate,
  getDefaultPriorities,
  getDefaultStatuses,
  createDefaultPriority,
  updateDefaultPriority,
  createDefaultStatus,
  updateDefaultStatus,
  getChecklists,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  bulkUploadChecklists,
  downloadChecklistTemplate,
  getTaskCategories,
  getTaskCategoryById,
  getTaskSubcategories,
  createTaskCategory,
  updateTaskCategory,
  deleteTaskCategory,
  listOrgsRotas,
  getRotaById,
  createRota,
  updateRota,
  deleteRota,
  publishRota,
  unpublishRota,
  listRotaShifts,
  getRotaShiftById,
  createRotaShift,
  updateRotaShift,
  deleteRotaShift,
  startRotaShift,
  completeRotaShift,
  listHrDocuments,
  getHrDocumentById,
  createHrDocument,
  updateHrDocument,
  deleteHrDocument,
  getUserHrDocumentStatus,
  listOrgUsersHrDocumentStatus,
  updateUserHrDocument,
  listOrgDocumentFolders,
  getOrgDocumentFolderById,
  listOrgDocuments,
  getOrgDocumentById,
  listLeaveRequests,
  approveLeave,
  rejectLeave
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
    
    // User Preferences / License Management
    case 'extendOrganisationTrial':
      return await extendOrganisationTrial(event);
    
    case 'updateUserLicense':
      return await updateUserLicense(event);
    
    case 'updateOrganisationInfo':
      return await updateOrganisationInfo(event);
    
    case 'updateUserInfo':
      return await updateUserInfo(event);
    
    // Export Data
    case 'exportOrgTasks':
      return await exportOrgTasks(event);
    
    case 'exportAllTasks':
      return await exportAllTasks(event);
    
    // Task Pool
    case 'getTaskPool':
      return await getTaskPool(event);
    
    case 'getTaskById':
      return await getTaskById(event);
    
    // CRM Automation Library
    case 'getGlobalAutomationLibrary':
      return await getGlobalAutomationLibrary(event);
    
    case 'getPracticeAutomationLibrary':
      return await getPracticeAutomationLibrary(event);
    
    case 'toggleAutomationTemplate':
      return await toggleAutomationTemplate(event);

    case 'bulkUploadAutomations':
      return await adminBulkUploadAutomations(event);

    case 'bulkUploadLeads':
      return await adminBulkUploadLeads(event);

    case 'downloadAutomationTemplate':
      return await downloadAdminAutomationTemplate(event);

    case 'downloadLeadTemplate':
      return await downloadAdminLeadTemplate(event);

    case 'listScriptsPool':
      return await listScriptsPool(event);

    case 'getScriptPoolItemById':
      return await getScriptPoolItemById(event);

    case 'createScriptPoolItem':
      return await createScriptPoolItem(event);

    case 'updateScriptPoolItem':
      return await updateScriptPoolItem(event);

    case 'deleteScriptPoolItem':
      return await deleteScriptPoolItem(event);

    case 'getOrganisationCrmFeatureFlags':
      return await getOrganisationCrmFeatureFlags(event);

    case 'updateOrganisationCrmFeatureFlags':
      return await updateOrganisationCrmFeatureFlags(event);

    case 'listCrmTreatments':
      return await listCrmTreatments(event);

    case 'getCrmTreatmentById':
      return await getCrmTreatmentById(event);

    case 'createCrmTreatment':
      return await createCrmTreatment(event);

    case 'updateCrmTreatment':
      return await updateCrmTreatment(event);

    case 'deleteCrmTreatment':
      return await deleteCrmTreatment(event);

    case 'listLeadSources':
      return await listLeadSources(event);

    case 'getLeadSourceById':
      return await getLeadSourceById(event);

    case 'createLeadSource':
      return await createLeadSource(event);

    case 'updateLeadSource':
      return await updateLeadSource(event);

    case 'deleteLeadSource':
      return await deleteLeadSource(event);

    case 'listCrmAlerts':
      return await listCrmAlerts(event);

    case 'getCrmAlertByKey':
      return await getCrmAlertByKey(event);

    case 'createCrmAlert':
      return await createCrmAlert(event);

    case 'updateCrmAlert':
      return await updateCrmAlert(event);

    case 'deleteCrmAlert':
      return await deleteCrmAlert(event);
    
    // Points Management
    case 'deductPoints':
      return await deductPoints(event);
    
    case 'awardPoints':
      return await awardPoints(event);
    
    case 'pointsIssuedByAdmin':
      return await getPointsIssuedByAdmin(event);
    
    case 'pointsTotalsByPractice':
      return await getPointsTotalsByPractice(event);

    // Admin Bulk Task Upload
    case 'bulkUploadTasks':
      return await adminBulkUploadTasks(event);
    
    case 'downloadTaskTemplate':
      return await downloadAdminTaskTemplate(event);

    // Default Priorities Management
    case 'getDefaultPriorities':
      return await getDefaultPriorities(event);
    
    case 'createDefaultPriority':
      return await createDefaultPriority(event);
    
    case 'updateDefaultPriority':
      return await updateDefaultPriority(event);

    // Default Statuses Management
    case 'getDefaultStatuses':
      return await getDefaultStatuses(event);
    
    case 'createDefaultStatus':
      return await createDefaultStatus(event);
    
    case 'updateDefaultStatus':
      return await updateDefaultStatus(event);

    // Task Checklist Management
    case 'getChecklists':
      return await getChecklists(event);
    
    case 'getChecklistById':
      return await getChecklistById(event);
    
    case 'createChecklist':
      return await createChecklist(event);
    
    case 'updateChecklist':
      return await updateChecklist(event);
    
    case 'deleteChecklist':
      return await deleteChecklist(event);
    
    case 'bulkUploadChecklists':
      return await bulkUploadChecklists(event);
    
    case 'downloadChecklistTemplate':
      return await downloadChecklistTemplate(event);

    // Task Category Management
    case 'getTaskCategories':
      return await getTaskCategories(event);
    
    case 'getTaskCategoryById':
      return await getTaskCategoryById(event);
    
    case 'getTaskSubcategories':
      return await getTaskSubcategories(event);
    
    case 'createTaskCategory':
      return await createTaskCategory(event);
    
    case 'updateTaskCategory':
      return await updateTaskCategory(event);
    
    case 'deleteTaskCategory':
      return await deleteTaskCategory(event);

    // Rota Management
    case 'listOrgsRotas':
      return await listOrgsRotas(event);
    
    case 'getRotaById':
      return await getRotaById(event);
    
    case 'createRota':
      return await createRota(event);
    
    case 'updateRota':
      return await updateRota(event);
    
    case 'deleteRota':
      return await deleteRota(event);
    
    case 'publishRota':
      return await publishRota(event);
    
    case 'unpublishRota':
      return await unpublishRota(event);

    // Rota Shift Management
    case 'listRotaShifts':
      return await listRotaShifts(event);
    
    case 'getRotaShiftById':
      return await getRotaShiftById(event);
    
    case 'createRotaShift':
      return await createRotaShift(event);
    
    case 'updateRotaShift':
      return await updateRotaShift(event);
    
    case 'deleteRotaShift':
      return await deleteRotaShift(event);
    
    case 'startRotaShift':
      return await startRotaShift(event);
    
    case 'completeRotaShift':
      return await completeRotaShift(event);

    // HR Document Management (Recruitment/Onboarding)
    case 'listHrDocuments':
      return await listHrDocuments(event);
    
    case 'getHrDocumentById':
      return await getHrDocumentById(event);
    
    case 'createHrDocument':
      return await createHrDocument(event);
    
    case 'updateHrDocument':
      return await updateHrDocument(event);
    
    case 'deleteHrDocument':
      return await deleteHrDocument(event);
    
    case 'getUserHrDocumentStatus':
      return await getUserHrDocumentStatus(event);
    
    case 'listOrgUsersHrDocumentStatus':
      return await listOrgUsersHrDocumentStatus(event);
    
    case 'updateUserHrDocument':
      return await updateUserHrDocument(event);

    // Document Management (Admin View)
    case 'listOrgDocumentFolders':
      return await listOrgDocumentFolders(event);
    
    case 'getOrgDocumentFolderById':
      return await getOrgDocumentFolderById(event);
    
    case 'listOrgDocuments':
      return await listOrgDocuments(event);
    
    case 'getOrgDocumentById':
      return await getOrgDocumentById(event);

    // Leave Management
    case 'listLeaveRequests':
      return await listLeaveRequests(event);
    
    case 'approveLeave':
      return await approveLeave(event);
    
    case 'rejectLeave':
      return await rejectLeave(event);

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
