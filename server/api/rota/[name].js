import {
  addRota,
  addRotaShift,
  addRotaUsers,
  completeShift,
  deleteRotaShift,
  deleteShiftAndTemplate,
  getAllShifts,
  getRotas,
  getRotaUsers,
  publishRota,
  removeRotaUser,
  startShift,
  unPublishRota,
  updateRota,
  updateShift,
  getUserRotas,
} from "~/server/controllers/rota";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "list":
      return await getRotas(event);
    case "add":
      return await addRota(event);
    case "users":
      return await getRotaUsers(event);
    case "update":
      return await updateRota(event);
    case "publish":
      return await publishRota(event);
    case "unpublish":
      return await unPublishRota(event);
    case "removeUser":
      return await removeRotaUser(event);
    case "addUser":
      return await addRotaUsers(event);
    case "addShift":
      return await addRotaShift(event);
    case "updateShift":
      return await updateShift(event);
    case "startShift":
      return await startShift(event);
    case "completeShift":
      return await completeShift(event);
    case "shifts":
      return await getAllShifts(event);
    case "deleteShift":
      return await deleteRotaShift(event);
    case "deleteShiftAndTemplate":
      return await deleteShiftAndTemplate(event);
    case "myRotas":
      return await getUserRotas(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
