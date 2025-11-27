import {
  addAttachments,
  addTaskCategory,
  addTaskChecklist,
  assignBulkTasks,
  bulkUploadTasks,
  createNewTask,
  uploadBulkTasks,
  createUserTaskChecklist,
  deleteTaskChecklist,
  deleteUserTaskChecklist,
  getUserTaskDetails,
  getGeneralTasksByCategory,
  listMyTasks,
  teamTasksCounts,
  unAssignTask,
  updateTask,
  updateTaskChecklist,
  updateUserTaskChecklist,
  getCategoriesforPool,
  viewTeamTasksTaskWise,
  getCategories,
  myTasksCountByCategory,
  getUserTasksStatusWise,
  groupTeamTasksByTaskId,
  teamTasksCountByCategory,
  streamTaskEvents,
  archieveBulkTasks,
  completeBulkTasks,
  unAssignBulkTask,
  getTeamTaskStatsByStatusAndCategory,
  addUserTaskComment,
  listUserTaskComments,
  updateUserTaskComment,
  deleteUserTaskComment,
  deleteAttachment,
} from "~/server/controllers/task";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "bulkUpload":
      return await bulkUploadTasks(event);
    case "myTasks":
      return await listMyTasks(event);
    case "addCategory":
      return await addTaskCategory(event);
    case "listCategories":
      return await getCategories(event);
    case "listCategoriesForPool":
      return await getCategoriesforPool(event);
    case "assign":
      return await assignBulkTasks(event);
    case "unassign":
      return await unAssignTask(event);
    case "teamTasks":
      return await viewTeamTasksTaskWise(event);
    case "updateUserTask":
      return await updateTask(event);
    case "addComment":
      return await addUserTaskComment(event);
    case "comments":
      return await listUserTaskComments(event);
    case "updateComment":
      return await updateUserTaskComment(event);
    case "deleteComment":
      return await deleteUserTaskComment(event);
    case "stream":
      return await streamTaskEvents(event);
    case "addAttachments":
      return await addAttachments(event);
    case "deleteAttachment":
      return await deleteAttachment(event);
    case "addNewTask":
      return await createNewTask(event); 
    case "addBulkTasks":
      return await uploadBulkTasks(event);
    case "teamTaskCounts":
      return await teamTasksCounts(event);
    case "createChecklist":
      return await createUserTaskChecklist(event);
    case "updateChecklist":
      return await updateUserTaskChecklist(event);
    case "deleteChecklist":
      return await deleteUserTaskChecklist(event);
    case "groupedByTask":
      return await groupTeamTasksByTaskId(event);
    case "getDetails":
      return await getUserTaskDetails(event);
    case "addMainChecklist":
      return await addTaskChecklist(event);
    case "updateMainChecklist":
      return await updateTaskChecklist(event);
    case "deleteMainChecklist":
      return await deleteTaskChecklist(event);
    case "myTasksCountByCategory":
      return await myTasksCountByCategory(event);
    case "teamTasksCountByCategory":
      return await teamTasksCountByCategory(event);
    case "filteredByStatus":
      return await getUserTasksStatusWise(event);
    case "generalTaskByCategory":
      return await getGeneralTasksByCategory(event);
    case "archieveBulk":
      return await archieveBulkTasks(event);
    case "completeBulk":
      return await completeBulkTasks(event);
    case "unassignBulk":
      return await unAssignBulkTask(event);
    case "statsByCategory":
      return await getTeamTaskStatsByStatusAndCategory(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
