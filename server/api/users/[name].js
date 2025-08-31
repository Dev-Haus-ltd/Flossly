import {
  allusersLeavesHistory,
  applyLeave,
  leaveHistory,
  updateAllowedLeaves,
  updateBankDetails,
  updateContractDetails,
  updateUserPreferences,
  userAcrossOrgs,
  userDetails,
  usersList,
} from "~/server/controllers/users";
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "list":
      return await usersList(event);
    case "listOrgWise":
      return await userAcrossOrgs(event);
    case "updatePreferences":
      return await updateUserPreferences(event);
    case "getDetails":
      return await userDetails(event);
    case "updateContract":
      return await updateContractDetails(event);
    case "updateAccount":
      return await updateBankDetails(event);
    case "leaveHistory":
      return await leaveHistory(event);
    case "applyLeave":
      return await applyLeave(event);
    case "updateLeaveEntitlement":
      return await updateAllowedLeaves(event);
    case "teamLeaves":
      return await allusersLeavesHistory(event)
    default:
      return { code: 0, error: "Not found" };
  }
});
