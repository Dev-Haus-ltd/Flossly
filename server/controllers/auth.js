import {
  User,
  Organisation,
  UserOrganisation,
  Verification,
  UserPreference,
  Role,
  Task,
  OrganisationStatus,
  OrganisationPriority,
  UserTask,
  LoginHistory,
  EmailVerification,
  UserAccount,
  UserPoint,
  UserContract,
} from "../models";
import { generateOTP, generateVerificationLink } from "../utils/misc";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DB from "../utils/db";
import {
  sendInvitationEmail,
  sendOnBoardingMail,
  sendOrgnisationAddedToRegisteredUsers,
} from "../utils/emailNotifications";
import requestIp from "request-ip";
const config = useRuntimeConfig();
export const login = async (event) => {
  let browserAgent = getHeader(event, "User-Agent");
  const ip = requestIp.getClientIp(event.node.req);
  browserAgent = browserAgent + ",ipAddress:" + ip;
  const body = await readBody(event);
  const { email, password } = JSON.parse(body);
  if (!email || !password) return error(400, "Missing credentials");
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return error(401, "Invalid credentials");
  }
  if (!user.isEmailVerified) {
    return error(401, "Email not verified");
  }
  const orgs = await UserOrganisation.findAll({ where: { userId: user.id } });
  const userPreference = await UserPreference.findOne({
    where: { userId: user.id },
  });
  if (userPreference && userPreference.licenseRenewalDate) {
    const renewalDate = new Date(userPreference.licenseRenewalDate);
    if (renewalDate < new Date()) {
      return error(401, "License Expired");
    }
  }
  const orgIds = orgs.map((o) => o.organisationId).sort();
  const orgId = orgIds[0]; // default to first
  const token = jwt.sign(
    { userId: user.id, orgId, roleId: user.roleId },
    config.JWT_SECRET
  );
  await UserPreference.update(
    { lastLoginDate: new Date(), lastLoginOrganisationId: orgId },
    { where: { userId: user.id } }
  );
  await LoginHistory.create({ userId: user.id, browserAgent });
  setCookie(event, "accessToken", token, { maxAge: 31536000 });
  return success(token);
};

export const signupRequest = async (event) => {
  const body = JSON.parse(await readBody(event));
  const { fullName, email, password, organisationName, roleId } = body;
  if (!fullName || !email || !password || !organisationName) {
    return error(400, "Missing required fields");
  }
  const transaction = await DB.transaction();
  try {
    // find or create organisation
    let org = await Organisation.findOne({ where: { name: organisationName } });
    if (!org) {
      org = await Organisation.create(
        { name: organisationName },
        { transaction }
      );
    } else {
      return error(402, "orgAlreadyExist");
    }

    // check duplicate user
    let user = await User.findOne({ where: { email } });
    if (user) error(409, "email already exist");

    // hash password
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create(
      { fullName, email, password: hashed, profileCompletion: 0, roleId },
      { transaction }
    );
    const today = new Date().getDate();
    const renewalDate = new Date(new Date().setDate(today + 15));
    await UserPreference.create(
      {
        licenseType: "Trial",
        userId: user.id,
        licenseRenewalDate: renewalDate,
      },
      { transaction }
    );

    // associate user-org
    await UserOrganisation.create(
      { userId: user.id, organisationId: org.id },
      { transaction }
    );
    const link = generateVerificationLink();
    await EmailVerification.create(
      { email, link, userId: user.id },
      { transaction }
    );
    await sendEmailVerificationEmail({ email, fullName, link });
    await transaction.commit();
    return success("Email sent");
  } catch (err) {
    await transaction.rollback();
    return error(500, err);
  }
};

export const profile = async (event) => {
  const loggedUser = event.context.user;
  try {
    const user = await User.findByPk(loggedUser.userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserPreference,
          as: "preferences",
        },
        {
          model: Role,
          as: "role",
        },
        {
          model: UserOrganisation,
          as: "userOrganisations",
          include: [
            {
              model: Organisation,
              as: "organisation",
            },
          ],
        },
        {
          model: UserPoint,
          as: "userPoints",
        },
      ],
    });
    const userObj = user.toJSON();
    userObj.currentLoggedInOrgId = loggedUser.orgId;
    if (userObj.preferences && userObj.preferences.taskTableColumns) {
      userObj.preferences.taskTableColumns = JSON.parse(
        userObj.preferences.taskTableColumns
      );
    }
    setCookie(event, "loggedUserId", userObj.id, { maxAge: 31536000 });
    setCookie(event, "profileCompletion", userObj.profileCompletion, {
      maxAge: 31536000,
    });
    setCookie(event, "role", userObj.roleId, {
      maxAge: 31536000,
    });
    return success(userObj);
  } catch (err) {
    return error(500, err);
  }
};

export const updateProfile = async (event) => {
  const body = await readBody(event);
  const { id, phone, address, dob, gender, nextOfKin, nextOfKinContact } =
    JSON.parse(body);
  try {
    const user = await User.findByPk(id);
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.dob = dob || user.dob;
    user.gender = gender || user.gender;
    user.nextOfKin = nextOfKin || user.nextOfKin;
    user.nextOfKinContact = nextOfKinContact || user.nextOfKinContact;
    await user.save();
    return success("saved");
  } catch (err) {
    return error(500, err.message);
  }
};

export const bankDetails = async (event) => {
  const { userId } = event.context.user;
  try {
    const bankDetails = await UserAccount.findOne({
      where: { userId },
    });
    return success(bankDetails);
  } catch (err) {
    return error(500, err.message);
  }
};

export const contractDetails = async (event) => {
  const { userId, orgId } = event.context.user;
  try {
    const contract = await UserContract.findOne({
      where: { userId, organisationId: orgId },
    });
    return success(contract);
  } catch (err) {
    return error(500, err.message);
  }
};
export const updateBankDetails = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { bankName, sortCode, accountNumber, accountTitle } = JSON.parse(body);
  try {
    const bankDetails = await UserAccount.findOne({
      where: { userId: loggedUser.userId },
    });
    if (!bankDetails) {
      await UserAccount.create({
        bankName,
        sortCode,
        accountNumber,
        accountTitle,
        userId: loggedUser.userId,
      });
    } else {
      bankDetails.bankName = bankName || bankDetails.bankName;
      bankDetails.sortCode = sortCode || bankDetails.sortCode;
      bankDetails.accountNumber = accountNumber || bankDetails.accountNumber;
      bankDetails.accountTitle = accountTitle || bankDetails.accountTitle;
      await bankDetails.save();
    }
    return success(bankDetails);
  } catch (err) {
    return error(500, err.message);
  }
};

export const forgetPasswordRequest = async (event) => {
  const body = await readBody(event);
  const { email } = JSON.parse(body);
  try {
    if (!email) return error(403, "Email required");
    const user = await User.findOne({ where: { email } });
    if (!user) error(403, "User not found");
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await Verification.upsert({ email, otp, expiresAt });
    await sendOtpForPasswordReset({ email, otp, name: user.fullName });
    return success("OTP sent");
  } catch (err) {
    return error(500, err);
  }
};

export const resetPassword = async (event) => {
  const body = await readBody(event);
  const { email, otp, newPassword } = JSON.parse(body);
  try {
    if (!email || !otp || !newPassword)
      return error(402, "Missing required fields");
    const record = await Verification.findOne({
      where: { email, otp: otp + "" },
    });
    if (!record || record.expiresAt < new Date()) {
      return error(400, "Invalid/Expired OTP");
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed }, { where: { email } });
    await record.destroy();
    return success("Password updated");
  } catch (err) {
    return error(500, err);
  }
};

export const updatePassword = async (event) => {
  const { userId } = event.context.user;
  const body = await readBody(event);
  const { oldPassword, newPassword } = JSON.parse(body);
  try {
    if (!oldPassword || !newPassword)
      return error(402, "Missing required fields");
    const user = await User.findOne({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return error(401, "Invalid credentials");
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed }, { where: { id: userId } });
    return success("Password updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const switchOrgnanisation = async (event) => {
  const { orgId } = await readBody(event);
  const user = event.context.user;
  try {
    const record = await UserOrganisation.findOne({
      where: { userId: user.userId, organisationId: orgId },
    });
    if (!record) return error(403, "Not part of selected organisation");
    const newToken = jwt.sign(
      { userId: user.userId, roleId: user.roleId, orgId },
      config.JWT_SECRET
    );
    return success(newToken);
  } catch (err) {
    return error(500, err);
  }
};
export const verifyEmail = async (event) => {
  const body = JSON.parse(await readBody(event));
  const { link } = body;
  const verification = await EmailVerification.findOne({ where: { link } });
  if (verification) {
    const user = await User.findOne({
      where: { id: verification.userId, email: verification.email },
    });
    if (user) {
      user.isEmailVerified = true;
      await user.save();
      await EmailVerification.destroy({ where: { link } });
      const tasks = await Task.findAll({ limit: 100 });
      const userOrg = await UserOrganisation.findAll({
        where: { userId: user.id },
      });
      if (userOrg && userOrg.length) {
        const priorities = await OrganisationPriority.findAll({
          where: { organisationId: userOrg[0].organisationId },
        });
        const statuses = await OrganisationStatus.findAll({
          where: { organisationId: userOrg[0].organisationId },
        });
        const userTasks = tasks.map((task) => ({
          userId: user.id,
          taskId: task.id,
          organisationId: userOrg[0].organisationId,
          statusId: statuses.find((x) => x.key === "upcoming").id,
          priorityId: priorities.find((x) => x.key === "medium").id,
          title: task.title,
          documentLink: "",
          frequency: task.defaultFrequency,
          comments: "",
        }));
        await UserTask.bulkCreate(userTasks);
      }
      return success("Email Verified");
    } else {
      return error(404, "User not found");
    }
  } else {
    return error(404, "Email link Invalid/Expired");
  }
};

export const inviteMembers = async (event) => {
  const loggedUser = event.context.user;
  const currentOrg = loggedUser.orgId;
  const body = await readBody(event);
  const { users, origin } = JSON.parse(body);
  const transaction = await DB.transaction();
  try {
    if (!Array.isArray(users) || !users.length) {
      return error(400, "Invitee list is required");
    }
    const existingUsers = await User.findAll({
      where: { email: users.map((i) => i.email) },
      attributes: ["id", "email"],
    });
    const currentOrganisation = await Organisation.findByPk(currentOrg);
    const currentUser = await User.findByPk(loggedUser.userId);
    if (existingUsers.length) {
      const existingUsersOrgs = await UserOrganisation.findAll({
        where: { userId: existingUsers.map((u) => u.id) },
      });

      const newOrgUsers = existingUsersOrgs.filter(
        (x) => x.organisationId !== currentOrg
      );
      if (newOrgUsers.length) {
        const newUserIds = newOrgUsers.map((u) => u.userId);
        const newUsersEmails = existingUsers
          .filter((x) => newUserIds.includes(x))
          .map((e) => e.email);
        const newUserOrgAssociation = newOrgUsers.forEach((el) => {
          el.organisationId = currentOrg;
        });
        await UserOrganisation.bulkCreate(newUserOrgAssociation, {
          transaction,
        });
        await sendOrgnisationAddedToRegisteredUsers({
          users: newUsersEmails,
          orgTitle: currentOrganisation.title,
          manager: currentUser.fullName,
        });
      } else {
        const existingUsersEmails = existingUsers.map((u) => u.email);
        const newUsers = users.filter(
          (x) => !existingUsersEmails.includes(x.email)
        );
        if (newUsers.length) {
          await inviteNewUsers(
            users,
            existingUsers,
            transaction,
            currentOrg,
            currentOrganisation,
            currentUser
          );
        } else {
          return success("All user already part of organisation");
        }
      }
    } else {
      await inviteNewUsers(
        users,
        existingUsers,
        transaction,
        currentOrg,
        currentOrganisation,
        currentUser
      );
    }
    if (origin === "onboarding") {
      const user = await User.findByPk(loggedUser.userId);
      user.profileCompletion = 75;
      await user.save({ transaction });
    }
    await transaction.commit();
    return success("Invites sent!");
  } catch (err) {
    await transaction.rollback();
    return error(500, err);
  }
};

const inviteNewUsers = async (
  users,
  existingUsers,
  transaction,
  currentOrg,
  currentOrganisation,
  currentUser
) => {
  const existingEmails = existingUsers.map((u) => u.email);
  const newUsersData = users
    .filter((i) => !existingEmails.includes(i.email))
    .map((i) => ({
      email: i.email,
      roleId: i.roleId,
      fullName: i.email.split("@")[0],
      profileCompletion: 1,
      isEmailVerified: false,
      status: "Invited",
    }));

  // Bulk create new users
  const newUsers = await User.bulkCreate(newUsersData, {
    transaction,
  });
  const orgAssociations = newUsers.map((u) => {
    return { userId: u.id, organisationId: currentOrg };
  });
  await UserOrganisation.bulkCreate(orgAssociations, { transaction });
  newUsersData.forEach(async (el) => {
    await sendInvitationEmail({
      email: el.email,
      orgTitle: currentOrganisation.name,
      link: el.inviteToken,
      manager: currentUser.fullName,
    });
  });
};

export const acceptInvitation = async (event) => {
  const body = await readBody(event);
  const { inviteToken, password, fullName } = JSON.parse(body);
  try {
    if (!inviteToken || !password || !fullName) {
      return error(400, "Missing required fields");
    }
    const user = await User.findOne({ where: { inviteToken } });
    if (!user) {
      return error(404, "User not found");
    }
    const userOrg = await UserOrganisation.findOne({
      where: { userId: user.id },
    });
    if (!userOrg) {
      return error(400, "User not linked to any organisation");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.fullName = fullName;
    user.profileCompletion = 1;
    user.isEmailVerified = true;
    user.status = "Active";
    await user.save();
    await assignDefaultTasksToUser(user, userOrg.organisationId);
    await sendOnBoardingMail(user);
    const token = jwt.sign(
      { userId: user.id, orgId: userOrg.organisationId, roleId: user.roleId },
      config.JWT_SECRET
    );
    await UserPreference.create({
      userId: user.id,
      lastLoginDate: new Date(),
      lastLoginOrganisationId: userOrg.organisationId,
    });
    setCookie(event, "accessToken", token, { maxAge: 31536000 });
    return success("User updated");
  } catch (err) {
    return error(500, err.message);
  }
};

const assignDefaultTasksToUser = async (user, organisationId) => {
  const roleId = user.roleId;
  const userId = user.id;
  try {
    const tasks = await Task.findAll({
      where: { roleId },
      limit: 5,
    });
    if (!tasks.length) return;
    const [defaultStatus, defaultPriority] = await Promise.all([
      OrganisationStatus.findOne({
        where: { organisationId, status: "Active" },
        order: [["id", "ASC"]],
      }),
      OrganisationPriority.findOne({
        where: { organisationId, status: "Active" },
        order: [["id", "ASC"]],
      }),
    ]);

    if (!defaultStatus || !defaultPriority) {
      throw new Error("Missing default priority or status");
    }

    // 3. Create UserTask entries
    const userTasks = tasks.map((task) => ({
      userId,
      taskId: task.id,
      organisationId,
      title: task.title,
      documentLink: "", // you can default this or map from task if it exists
      statusId: defaultStatus.id,
      priorityId: defaultPriority.id,
      frequency: task.defaultFrequency,
      comments: "",
    }));

    await UserTask.bulkCreate(userTasks);
  } catch (err) {
    return err;
  }
};

export const userLoginHistory = async (event) => {
  const body = await readBody(event);
  const { userId } = JSON.parse(body);
  if (!userId) throw createError({ message: "UserId is required" });
  try {
    const loginHistory = await LoginHistory.findAll({ where: { userId } });
    return success(loginHistory);
  } catch (err) {
    return error(500, err.message);
  }
};
