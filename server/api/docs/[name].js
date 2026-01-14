import {
  addDocument,
  createFolder,
  deleteDocument,
  deleteFolder,
  listFolders,
  recentDocuments,
  listDocuments,
  updateFolder,
  viewDocument,
  updateDocument,
  createSystemFolder,
  listSystemFolders,
  addSystemDocument,
  viewSystemDocument,
  listSystemDocuments,
} from "~/server/controllers/docs";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "createfolder":
      return await createFolder(event);
    case "createSystemfolder":
      return await createSystemFolder(event);
    case "listFolders":
      return await listFolders(event);
    case "listSystemFolders":
      return await listSystemFolders(event);
    case "deleteFolder":
      return await deleteFolder(event);
    case "updateFolder":
      return await updateFolder(event);
    case "add":
      return await addDocument(event);
    case "addSystemDoc":
      return await addSystemDocument(event);
    case "view":
      return await viewDocument(event);
    case "viewSystemDoc":
      return await viewSystemDocument(event);
    case "delete":
      return await deleteDocument(event);
    case "recent":
      return await recentDocuments(event);
    case "list":
      return await listDocuments(event);
    case "listSystemDocuments":
      return await listSystemDocuments(event);
    case "update":
      return await updateDocument(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
