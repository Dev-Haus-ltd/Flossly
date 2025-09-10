import {
  acceptInvitation,
  bankDetails,
  contractDetails,
  forgetPasswordRequest,
  inviteMembers,
  login,
  profile,
  resetPassword,
  signupRequest,
  userLoginHistory,
  verifyEmail,
  updateProfile,
  updatePassword,
  updateBankDetails,
  getUserHrDocuments,
  addUserHrDoc,
  removeUserDoc
} from "../../controllers/auth";
import bcrypt from "bcrypt";
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "login":
      return await login(event);
    case "signUpRequest":
      return await signupRequest(event);
    case "verifyEmail":
      return await verifyEmail(event);
    case "createHash":
      return await createHash(event);
    case "profile":
      return await profile(event);
      case "updateProfile":
      return await updateProfile(event);
    case "requestResetPassword":
      return await forgetPasswordRequest(event);
    case "resetPassword":
      return await resetPassword(event);
    case "updatePassword":
      return await updatePassword(event)
    case "inviteMembers":
      return await inviteMembers(event);
    case "acceptInvitation":
      return await acceptInvitation(event);
    case "loginHistory":
      return await userLoginHistory(event);
    case "bankDetails":
      return await bankDetails(event);
    case "updateBankDetails":
      return await updateBankDetails(event);
    case "contractDetails":
      return await contractDetails(event);
    case "hrDocs":
      return await getUserHrDocuments(event)
    case "addHrDoc":
      return await addUserHrDoc(event)
    case "removeHrDoc":
      return await removeUserDoc(event)
    default:
      return { code: 0, error: "Not found" };
  }
});

const createHash = async (event) => {
  const body = await readBody(event);
  console.log(body);
  // const { password }  = JSON.parse(body)
  const hashPassword = await bcrypt.hash(body.password, 10);

  return hashPassword;
};
