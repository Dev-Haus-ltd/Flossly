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
  UserHrDocument,
  UserPointsHistory,
} from "../models";
import { generateOTP, generateVerificationLink } from "../utils/misc";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DB from "../utils/db";
import { QueryTypes, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import {
  sendInvitationEmail,
  sendOnBoardingMail,
  sendOrgnisationAddedToRegisteredUsers,
  sendEmailVerificationEmail,
  portalReadyTrainingInvite,
  accountCreationNotification,
  sendOtpForPasswordReset,
} from "../utils/emailNotifications";
import requestIp from "request-ip";
import { HrDocument } from "../models/hrDocuments";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { createError, setCookie } from "h3";
import { success, error } from "../utils/response";
import {
  buildOnboardingContext,
  buildOnboardingInAppMessages,
  sendOnboardingEmail,
} from "../utils/onboardingCampaign";
import {
  CLIENT_ONBOARDING_KEYS,
  ensureOnboardingStartEvent,
  getDiffDaysFromStart,
  getOnboardingEventMap,
  getOnboardingKeys,
  getOnboardingMetrics,
  recordOnboardingEvent as recordOnboardingEventInternal,
} from "../utils/onboardingService";

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
  const orgs = await UserOrganisation.findAll({
    where: {
      userId: user.id,
      status: "Active", // Only load active organizations
    },
  });

  if (user.status === "Disabled" || user.status === "Expired") {
    return error(403, "Your account is deactivated");
  }

  if (orgs.length === 0) {
    return error(403, "You are not part of any active organizations");
  }

  const activeOrgs = orgs;

  const userPreference = await UserPreference.findOne({
    where: { 
      userId: user.id,
      organisationId: user.lastLoginOrganisationId || activeOrgs[0].organisationId,
     },
  });
    if (
      userPreference &&
      userPreference.licenseType !== "System" &&
      new Date(userPreference.licenseRenewalDate) < new Date()
    ) {
      return error(401, "License Expired");
    }

  let orgId;
  if (user.lastLoginOrganisationId) {
    const lastOrg = activeOrgs.find(
      (o) => o.organisationId === user.lastLoginOrganisationId
    );
    if (lastOrg) {
      orgId = lastOrg.organisationId;
    }
  }

  if (!orgId) {
    const orgIds = activeOrgs.map((o) => o.organisationId).sort();
    orgId = orgIds[0];
  }
  const token = jwt.sign(
    { userId: user.id, orgId, roleId: user.roleId, purpose: "login" },
    config.JWT_SECRET
  );
  user.lastLoginDate = new Date()
  user.lastLoginOrganisationId = orgId
  await user.save()
  await LoginHistory.create({ userId: user.id, browserAgent });
  setCookie(event, "accessToken", token, { maxAge: 31536000 });
  return success(token);
};

export const createShortLivedToken = async (event) => {
  const loggedUser = event.context.user;
  try {
    if (
      !loggedUser ||
      !loggedUser.userId ||
      !loggedUser.orgId ||
      !loggedUser.roleId
    ) {
      return error(401, "Unauthenticated");
    }
    const shortToken = jwt.sign(
      {
        userId: loggedUser.userId,
        orgId: loggedUser.orgId,
        roleId: loggedUser.roleId,
        purpose: "third_party_redirect",
      },
      config.JWT_SECRET,
      { expiresIn: "60s" }
    );
    return success(shortToken);
  } catch (err) {
    return error(500, err.message || err);
  }
};

export const exchangeShortLivedToken = async (event) => {
  const body = await readBody(event);
  const parsed =
    typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { shortToken } = parsed;
  try {
    if (!shortToken) return error(400, "shortToken required");
    const payload = jwt.verify(shortToken, config.JWT_SECRET);
    if (!payload || payload.purpose !== "third_party_redirect") {
      return error(400, "Invalid token purpose");
    }
    const token = jwt.sign(
      {
        userId: payload.userId,
        orgId: payload.orgId,
        roleId: payload.roleId,
        purpose: "login",
      },
      config.JWT_SECRET
    );
    // setCookie(event, "accessToken", token, { maxAge: 31536000 });
    return success(token);
  } catch (err) {
    return error(400, err.message || "Invalid/Expired token");
  }
};

export const resendVerificationEmail = async (event) => {
  const body = await readBody(event);
  const parsed =
    typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { email } = parsed;

  if (!email) return error(400, "Email required");

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return error(404, "User not found");
    }

    if (user.isEmailVerified) {
      return error(400, "Email already verified");
    }

    // Delete old verification links
    await EmailVerification.destroy({ where: { userId: user.id } });

    // Create new verification link
    const link = generateVerificationLink();
    await EmailVerification.create({ email, link, userId: user.id });
    await sendEmailVerificationEmail({ email, fullName: user.fullName, link });

    return success("Verification email sent");
  } catch (err) {
    return error(500, err.message || "Failed to send verification email");
  }
};

export const signupRequest = async (event) => {
  const body = await readBody(event);
  const parsed =
    typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { fullName, email, password, organisationName, roleId } = parsed;

  // Trim and validate fullName
  const trimmedFullName = fullName ? fullName.trim() : "";
  if (!trimmedFullName || !email || !password || !organisationName) {
    return error(400, "Missing required fields");
  }

  // Additional validation for fullName
  if (trimmedFullName.length === 0) {
    return error(400, "Full name cannot be empty or contain only spaces");
  }

  // Check if organization already exists
  let org = await Organisation.findOne({ where: { name: organisationName } });
  if (org) {
    return error(
      402,
      "Organization already exists. Please choose a different organization name or contact support if you believe this is an error."
    );
  }

  // Check if user already exists
  let user = await User.findOne({ where: { email } });
  if (user) {
    return error(
      409,
      "Email already exists. Please use a different email address or try logging in instead."
    );
  }

  const transaction = await DB.transaction();
  try {
    // create organisation
    org = await Organisation.create(
      { name: organisationName,
        hasUsedTrial: false,
       },
      { transaction }
    );

    // hash password
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create(
      {
        fullName: trimmedFullName,
        email,
        password: hashed,
        profileCompletion: 0,
        roleId,
        hasUsedTrial: true,
      },
      { transaction }
    );
    org.managerId = user.id;
    await org.save({ transaction });
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);
    await UserPreference.create(
      {
        userId: user.id,
        organisationId: org.id,
        licenseType: "Trial",
        licenseRenewalDate: trialEndDate,
      },
      { transaction }
    );
    await org.update(
      { hasUsedTrial: true },
      { transaction }
    );

    await createDummyDentistForOrganisation({
      organisationId: org.id,
      organisationName: org.name,
      createdBy: user.id,
      transaction,
    });

    // associate user-org
    await UserOrganisation.create(
      { userId: user.id, organisationId: org.id, status: "Active" },
      { transaction }
    );
    const link = generateVerificationLink();
    await EmailVerification.create(
      { email, link, userId: user.id },
      { transaction }
    );
    await sendEmailVerificationEmail({
      email,
      fullName: trimmedFullName,
      link,
    });
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
    if (!loggedUser || !loggedUser.userId || !loggedUser.orgId) {
      return error(401, "Unauthenticated");
    }

    const membership = await UserOrganisation.findOne({
      where: {
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      },
    });
    
    const isCurrentOrgActive = Boolean(membership && membership.status === "Active");

    const user = await User.findByPk(loggedUser.userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserPreference,
          as: "preferences",
          where: {
            organisationId: loggedUser.orgId
          }
        },
        {
          model: Role,
          as: "role",
        },
        {
          model: UserOrganisation,
          as: "userOrganisations",
          required: false,
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

    if (user.status === "Disabled" || user.status === "Expired") {
      return error(403, "Your account is deactivated");
    }

    const userObj = user.toJSON();
    userObj.currentLoggedInOrgId = loggedUser.orgId;
    userObj.isCurrentOrgActive = isCurrentOrgActive; 
    
    if (!isCurrentOrgActive && userObj.userOrganisations) {
      const activeOrg = userObj.userOrganisations.find(
        (uo) => uo.status === "Active"
      );
      if (activeOrg) {
        userObj.suggestedOrgId = activeOrg.organisationId || activeOrg.organisation?.id;
      }
    }
    
    if (userObj.preferences && userObj.preferences.length && userObj.preferences[0].taskTableColumns) {
      userObj.preferences[0].taskTableColumns = JSON.parse(
        userObj.preferences[0].taskTableColumns
      );
    }

    try {
      const { event: startEvent, created } = await ensureOnboardingStartEvent({
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      });
      const onboardingKeys = getOnboardingKeys();
      const eventMap = await getOnboardingEventMap({
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
        keys: onboardingKeys,
      });
      const showWelcomePopup = !eventMap.has("welcome_quiz_done");
      const showWelcomeVideoPopup =
        eventMap.has("welcome_quiz_done") && !eventMap.has("welcome_video_done");
      const startAt = startEvent?.createdAt || user?.createdAt;
      const diffDays = getDiffDaysFromStart(startAt);

      const organisation = await Organisation.findByPk(loggedUser.orgId);
      const preference = userObj.preferences?.[0];
      const metrics =
        diffDays === 7 || diffDays === 13
          ? await getOnboardingMetrics(loggedUser.orgId)
          : null;
      const ctx = buildOnboardingContext({
        user: userObj,
        organisation,
        userPreference: preference,
        metrics,
        config,
      });

      const inAppMessages = buildOnboardingInAppMessages({
        startAt,
        ctx,
        seenKeys: new Set(eventMap.keys()),
      });

      userObj.onboarding = {
        startAt,
        showWelcomePopup,
        showWelcomeVideoPopup,
        inAppMessages,
      };

      if (created && userObj?.email) {
        if (!eventMap.has("onboarding_email_day0")) {
          try {
            await sendOnboardingEmail({
              key: "onboarding_email_day0",
              to: userObj.email,
              ctx,
            });
            await recordOnboardingEventInternal({
              userId: loggedUser.userId,
              organisationId: loggedUser.orgId,
              key: "onboarding_email_day0",
              payload: { sentAt: new Date().toISOString() },
            });
          } catch (emailErr) {
          }
        }
      }
    } catch (onboardingErr) {
      userObj.onboarding = userObj.onboarding || {
        showWelcomePopup: false,
        showWelcomeVideoPopup: false,
        inAppMessages: [],
      };
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
    return error(500, err.message);
  }
};

export const recordOnboardingEvent = async (event) => {
  const loggedUser = event.context.user;
  if (!loggedUser || !loggedUser.userId || !loggedUser.orgId) {
    return error(401, "Unauthenticated");
  }
  const body = await readBody(event);
  const parsed = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { key, payload } = parsed;
  if (!key) return error(400, "key is required");
  if (!CLIENT_ONBOARDING_KEYS.has(key)) {
    return error(400, "Unsupported onboarding event");
  }

  try {
    const result = await recordOnboardingEventInternal({
      userId: loggedUser.userId,
      organisationId: loggedUser.orgId,
      key,
      payload,
      allowList: CLIENT_ONBOARDING_KEYS,
    });
    return success({ created: result.created });
  } catch (err) {
    return error(500, err.message || err);
  }
};

export const updateProfile = async (event) => {
  try {
    let fields = {};
    let fileItem = null;

    try {
      const form = await readMultipartFormData(event);
      if (form) {
        form.forEach((item) => {
          if (item.type) {
            if (!fileItem) fileItem = item; 
          } else {
            fields[item.name] = item.data.toString();
          }
        });
      }
    } catch (_) {}

    if (!Object.keys(fields).length && !fileItem) {
      const body = await readBody(event);
      fields = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
    }

    const {
      id,
      phone,
      address,
      dob,
      gender,
      nextOfKin,
      fullName,
      nextOfKinContact,
      roleId,
    } = fields;

    if (!id) {
      return error(400, 'Missing user id');
    }

    const user = await User.findByPk(id);
    if (!user) return error(404, 'User not found');

    if (fullName !== undefined) {
      const trimmedFullName = fullName ? fullName.trim() : '';
      if (trimmedFullName.length === 0) {
        return error(400, 'Full name cannot be empty or contain only spaces');
      }
      user.fullName = trimmedFullName;
    }

    user.phone = phone !== undefined ? phone : user.phone;
    user.address = address !== undefined ? address : user.address;
    user.dob = dob !== undefined ? dob : user.dob;
    user.gender = gender !== undefined ? gender : user.gender;
    user.nextOfKin = nextOfKin !== undefined ? nextOfKin : user.nextOfKin;
    user.nextOfKinContact = nextOfKinContact !== undefined ? nextOfKinContact : user.nextOfKinContact;
    if (roleId !== undefined) {
      user.roleId = roleId;
    }

    if (fileItem) {
      const uploadDir = path.resolve('public/uploads/avatars');
      await fsPromises.mkdir(uploadDir, { recursive: true });
      const originalName = fileItem.filename || 'avatar';
      const fileExt = path.extname(originalName) || '';
      const filename = `user-${id}-${Date.now()}${fileExt}`;
      const filepath = path.join(uploadDir, filename);
    
      await fsPromises.writeFile(filepath, fileItem.data);
      user.photo = `/uploads/avatars/${filename}`;
    }

    await user.save();
    return success({ message: 'saved', user: user.toJSON() });
  } catch (err) {
    return error(500, err.message || err);
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
  const parsed =
    typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { email } = parsed;

  if (!email) return error(403, "Email required");

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "User not found",
        data: {
          code: 1,
          success: false,
          message: "User not found",
        },
      });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await Verification.upsert({ email, otp, expiresAt });
    await sendOtpForPasswordReset({ email, otp, name: user.fullName });
    return success("OTP sent");
  } catch (err) {
    if (err.statusCode) {
      throw err; // Re-throw if it's already a proper error
    }
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
  const body = await readBody(event);
  const { orgId } = JSON.parse(body);
  const user = event.context.user;
  try {
    const record = await UserOrganisation.findOne({
      where: {
        userId: user.userId,
        organisationId: orgId,
        status: "Active", // Only allow switching to active organizations
      },
    });
    if (!record)
      return error(
        403,
        "Not part of selected organisation or invitation not accepted"
      );

    const userRecord = await User.findByPk(user.userId);
    if (
      userRecord &&
      (userRecord.status === "Disabled" || userRecord.status === "Expired")
    ) {
      return error(403, "Your account is deactivated");
    }
    const newToken = jwt.sign(
      { userId: user.userId, roleId: user.roleId, orgId, purpose: "login" },
      config.JWT_SECRET
    );

    setCookie(event, "accessToken", newToken, { maxAge: 31536000 });
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
      // If already verified (either user or verification record), return success
      if (verification.verified || user.isEmailVerified) {
        return success("Email already verified");
      }

      // Verify the email
      user.isEmailVerified = true;
      await user.save();

      // Mark verification as verified instead of deleting
      verification.verified = true;
      await verification.save();

      const tasks = await Task.findAll({
        limit: 100,
        where: {
          categoryId: [3, 4, 5, 10, 11, 12],
          isSystemTask: true,
        },
      });
      const userOrg = await UserOrganisation.findAll({
        where: {
          userId: user.id,
          status: "Active",
        },
      });
      if (userOrg && userOrg.length) {
        const priorities = await OrganisationPriority.findAll({
          where: { organisationId: userOrg[0].organisationId },
        });
        const statuses = await OrganisationStatus.findAll({
          where: { organisationId: userOrg[0].organisationId },
        });

        const defaultStatus =
          statuses.find((x) => x.key === "upcoming") || statuses[0];
        const defaultPriority =
          priorities.find((x) => x.key === "medium") || priorities[0];

        if (defaultStatus && defaultPriority) {
          const userTasks = tasks.map((task) => ({
            userId: user.id,
            taskId: task.id,
            organisationId: userOrg[0].organisationId,
            statusId: defaultStatus.id,
            priorityId: defaultPriority.id,
            title: task.title,
            documentLink: "",
            frequency: task.defaultFrequency,
            comments: "",
          }));
          await UserTask.bulkCreate(userTasks);
        }

        await assignDefaultHRDocsToUser(user.id);
        await portalReadyTrainingInvite(user);
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

    const currentUser = await User.findByPk(loggedUser.userId);
    const currentUserEmail = currentUser?.email?.toLowerCase();
    if (currentUserEmail) {
      const selfInviteAttempt = users.some(
        (user) => user.email?.toLowerCase() === currentUserEmail
      );
      if (selfInviteAttempt) {
        return error(400, "You cannot invite yourself");
      }
    }

    const existingUsers = await User.findAll({
      where: { email: users.map((i) => i.email) },
      attributes: ["id", "email"],
    });
    const currentOrganisation = await Organisation.findByPk(currentOrg);
    if (existingUsers.length) {
      // Check which existing users already have a UserOrganisation record for this org
      const existingUsersOrgsForCurrentOrg = await UserOrganisation.findAll({
        where: {
          userId: existingUsers.map((u) => u.id),
          organisationId: currentOrg,
        },
      });

      // Separate users into: already active, already invited (pending), and new to this org
      const alreadyActiveUserIds = existingUsersOrgsForCurrentOrg
        .filter((uo) => uo.status === "Active")
        .map((uo) => uo.userId);

      const alreadyInvitedUserIds = existingUsersOrgsForCurrentOrg
        .filter((uo) => uo.status !== "Active")
        .map((uo) => uo.userId);

      // Check for errors first - if any users are already active or already invited, return error
      if (alreadyActiveUserIds.length > 0 || alreadyInvitedUserIds.length > 0) {
        let errorMessage = "";
        if (
          alreadyActiveUserIds.length > 0 &&
          alreadyInvitedUserIds.length > 0
        ) {
          errorMessage =
            "User already active or invited. Use Resend button in the table";
        } else if (alreadyActiveUserIds.length > 0) {
          errorMessage = "User already active member";
        } else if (alreadyInvitedUserIds.length > 0) {
          errorMessage = "User already Invited. Use Resend button in the table";
        }

        return error(400, errorMessage);
      }

      // Filter out users who are already active members or already have pending invitations
      const usersToInvite = existingUsers.filter(
        (u) =>
          !alreadyActiveUserIds.includes(u.id) &&
          !alreadyInvitedUserIds.includes(u.id)
      );

      if (usersToInvite.length) {
        const newUserIds = usersToInvite.map((u) => u.id);
        const newUserOrgAssociation = newUserIds.map((userId) => {
          return {
            userId: userId,
            organisationId: currentOrg,
            status: "Invited",
          };
        });
        await UserOrganisation.bulkCreate(newUserOrgAssociation, {
          transaction,
        });

        // Generate invitation tokens for existing users
        const invitationData = [];
        for (const userId of newUserIds) {
          const user = usersToInvite.find((u) => u.id === userId);
          if (!user) continue;

          const invitationToken = jwt.sign(
            {
              userId: userId,
              orgId: currentOrg,
              purpose: "org_invitation",
              invitedBy: loggedUser.userId,
            },
            config.JWT_SECRET,
            { expiresIn: "7d" } // 7 days to respond
          );

          invitationData.push({
            email: user.email,
            token: invitationToken,
          });
        }

        await sendOrgnisationAddedToRegisteredUsers({
          users: invitationData,
          orgTitle: currentOrganisation.name,
          manager: currentUser.fullName,
        });

        // Don't return here - let transaction commit below
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
          return error(400, "All users already part of organisation");
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
      fullName: i.fullName || i.email.split("@")[0],
      profileCompletion: 1,
      isEmailVerified: false,
      status: "Invited",
    }));

  // Bulk create new users
  const newUsers = await User.bulkCreate(newUsersData, {
    transaction,
  });
  const orgAssociations = newUsers.map((u) => {
    return {
      userId: u.id,
      organisationId: currentOrg,
      status: "Invited",
    };
  });
  await UserOrganisation.bulkCreate(orgAssociations, { transaction });
  
  await Promise.all(
    newUsers.map(async (el) => {
      if (!el.inviteToken) {
        // Fallback: generate token if somehow missing
        el.inviteToken = uuidv4();
        await el.save({ transaction });
      }
      await sendInvitationEmail({
        email: el.email,
        orgTitle: currentOrganisation.name,
        link: el.inviteToken,
        manager: currentUser.fullName,
      });
    })
  );
};

export const acceptInvitation = async (event) => {
  const body = await readBody(event);
  const { inviteToken, password, fullName } = JSON.parse(body);
  try {
    // Trim and validate fullName
    const trimmedFullName = fullName ? fullName.trim() : "";
    if (!inviteToken || !password || !trimmedFullName) {
      return error(400, "Missing required fields");
    }

    // Additional validation for fullName
    if (trimmedFullName.length === 0) {
      return error(400, "Full name cannot be empty or contain only spaces");
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
    const userOrgDetails = await Organisation.findOne({
      where: { id: userOrg.organisationId },
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.fullName = trimmedFullName;
    user.profileCompletion = 1;
    user.isEmailVerified = true;
    user.status = "Active";
    await user.save();

    // Activate organization membership
    userOrg.status = "Active";
    await userOrg.save();

    // Removed dummy tasks assignment for invited members
    await assignDefaultTasksToUser(user, userOrg.organisationId);
    await assignDefaultHRDocsToUser(user.id);
    await accountCreationNotification(user);
    await portalReadyTrainingInvite(user);
    const token = jwt.sign(
      {
        userId: user.id,
        orgId: userOrg.organisationId,
        roleId: user.roleId,
        purpose: "login",
      },
      config.JWT_SECRET
    );
    const managerPreference = await UserPreference.findOne({
      where: {
        userId: userOrgDetails.managerId,
        organisationId: userOrg.organisationId,
      },
    });
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    let licenseType = "Trial";
    let licenseRenewalDate = trialEndDate;

    if (managerPreference) {
      licenseType = managerPreference.licenseType;
      licenseRenewalDate = managerPreference.licenseRenewalDate;
    }
    await UserPreference.create({
      userId: user.id,
      organisationId: userOrg.organisationId,
      licenseType,
      licenseRenewalDate,
    });
    setCookie(event, "accessToken", token, { maxAge: 31536000 });
    return success("User updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const verifyInvitationToken = async (event) => {
  const body = await readBody(event);
  const { token } = JSON.parse(body);

  try {
    if (!token) return error(400, "Token required");

    // Verify and decode the token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.purpose !== "org_invitation") {
      return error(400, "Invalid token purpose");
    }

    const { userId, orgId, invitedBy } = decoded;

    // Get organization details
    const organisation = await Organisation.findByPk(orgId);
    if (!organisation) {
      return error(404, "Organization not found");
    }

    // Get inviter details
    const inviter = await User.findByPk(invitedBy, {
      attributes: ["fullName"],
    });

    // Check invitation status
    const userOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId: orgId,
      },
    });

    if (!userOrg) {
      return error(404, "Invitation not found");
    }

    return success({
      orgId,
      orgName: organisation.name,
      inviterName: inviter?.fullName || "Unknown",
      status: userOrg.status === "Active" ? "accepted" : "pending",
      userId,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(400, "Invitation link has expired");
    }
    if (err.name === "JsonWebTokenError") {
      return error(400, "Invalid invitation token");
    }
    return error(500, err.message);
  }
};

export const acceptOrganisationInvitation = async (event) => {
  try {
    const body = await readBody(event);
    const parsed =
      typeof body === "string" ? JSON.parse(body || "{}") : body || {};
    const { token } = parsed;

    if (!token) return error(400, "Token required");

    // Verify and decode the token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.purpose !== "org_invitation") {
      return error(400, "Invalid token purpose");
    }

    const { userId, orgId } = decoded;

    // Check if user is logged in and matches token
    const loggedUser = event.context.user;
    if (loggedUser && loggedUser.userId !== userId) {
      return error(403, "Token does not match logged in user");
    }

    const userOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId: orgId,
        status: "Invited", // Only accept pending invitations
      },
    });

    if (!userOrg) {
      return error(404, "Invitation not found or already accepted");
    }

    // Activate the organization membership
    userOrg.status = "Active";
    await userOrg.save();

    // If user is not logged in, generate auth token and return user data for auto-login
    if (!loggedUser) {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return error(404, "User not found");
      }

      await assignDefaultTasksToUser(user, orgId);

      // Check if user's email is verified (required for login)
      if (!user.isEmailVerified) {
        return error(
          401,
          "Please verify your email before accepting the invitation"
        );
      }

      // Generate authentication token with the accepted organization
      const authToken = jwt.sign(
        {
          userId: user.id,
          orgId: orgId,
          roleId: user.roleId,
          purpose: "login",
        },
        config.JWT_SECRET
      );

      // Set authentication cookie
      setCookie(event, "accessToken", authToken, { maxAge: 31536000 });

      // Return token and user data for frontend to complete login
      return success({
        message: "Invitation accepted successfully",
        token: authToken,
        userId: user.id,
        orgId: orgId,
        autoLogin: true,
      });
    }

    // User is already logged in, just return success
    return success("Invitation accepted successfully");
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(400, "Invitation link has expired");
    }
    if (err.name === "JsonWebTokenError") {
      return error(400, "Invalid invitation token");
    }
    return error(500, err.message);
  }
};

export const declineOrganisationInvitation = async (event) => {
  try {
    const body = await readBody(event);
    const parsed =
      typeof body === "string" ? JSON.parse(body || "{}") : body || {};
    const { token } = parsed;

    if (!token) return error(400, "Token required");

    // Verify and decode the token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.purpose !== "org_invitation") {
      return error(400, "Invalid token purpose");
    }

    const { userId, orgId } = decoded;

    // Check if user is logged in and matches token (optional check - token is already verified)
    const loggedUser = event.context.user;
    if (loggedUser && loggedUser.userId !== userId) {
      return error(403, "Token does not match logged in user");
    }

    // Use raw SQL query to delete - bypasses Sequelize hooks that cause hanging
    // This permanently removes the UserOrganisation record, so the user will no longer
    // appear in the organization's user list for the person who invited them
    const result = await DB.query(
      `DELETE FROM "dev"."UserOrganisations" 
       WHERE "userId" = :userId 
       AND "organisationId" = :orgId 
       AND "status" = 'Invited'`,
      {
        replacements: { userId, orgId },
      }
    );

    // Check if any rows were deleted
    // result[1] contains the number of affected rows for DELETE queries
    const deletedCount = result?.[1] || 0;

    if (deletedCount === 0) {
      return error(404, "Invitation not found or already processed");
    }

    // Record deleted successfully - user will no longer appear in organization's user list
    return success("Invitation declined successfully");
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(400, "Invitation link has expired");
    }
    if (err.name === "JsonWebTokenError") {
      return error(400, "Invalid invitation token");
    }
    // Handle createError objects that might already have statusCode
    if (err.statusCode) {
      throw err; // Re-throw if it's already a proper error
    }
    const errorMessage =
      err.message || err.toString() || "Failed to decline invitation";
    return error(500, errorMessage);
  }
};

export const resendOrganisationInvitation = async (event) => {
  try {
    const body = await readBody(event);
    const parsed =
      typeof body === "string" ? JSON.parse(body || "{}") : body || {};
    const { userId, orgId } = parsed;

    if (!userId || !orgId) {
      return error(400, "User ID and Organization ID are required");
    }

    const loggedUser = event.context.user;
    if (!loggedUser) {
      return error(401, "Authentication required");
    }

    // Verify the user has permission to resend invitations for this organization
    const userOrg = await UserOrganisation.findOne({
      where: {
        userId: loggedUser.userId,
        organisationId: orgId,
        status: "Active", // Only active members can resend invitations
      },
    });

    if (!userOrg) {
      return error(
        403,
        "You don't have permission to resend invitations for this organization"
      );
    }

    // Check if the target user has a pending invitation
    const targetUserOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId: orgId,
        status: "Invited", // Only resend if invitation is pending
      },
    });

    if (!targetUserOrg) {
      return error(404, "No pending invitation found for this user");
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return error(404, "User not found");
    }

    // Check if pending invitation exists
    const existingUserOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId: orgId,
        status: "Invited",
      },
    });

    if (!existingUserOrg) {
      return error(404, "No pending invitation found for this user");
    }

    // Get organization and current user details
    const organisation = await Organisation.findByPk(orgId);
    if (!organisation) {
      return error(404, "Organization not found");
    }
    const currentUser = await User.findByPk(loggedUser.userId);

    // Check if user belongs to any other active organization
    const userOtherOrgs = await UserOrganisation.findAll({
      where: {
        userId: userId,
        status: "Active", // Check for active organizations
      },
    });

    const isFirstOrganization = userOtherOrgs.length === 0;

    // The UserOrganisation record already exists with status: Invited
    const transaction = await DB.transaction();

    try {
      if (isFirstOrganization && loggedUser.orgId === orgId) {
        // User doesn't belong to any organization - use new user invitation email
        // Generate new inviteToken for the user (UUID format to match model)
        const inviteToken = uuidv4();
        user.inviteToken = inviteToken;
        await user.save({ transaction });

        // Build invitation link for new users (sendInvitationEmail will prepend the base URL)
        const invitationLink = inviteToken;

        // Send new user invitation email
        await sendInvitationEmail({
          email: user.email,
          orgTitle: organisation.name,
          link: invitationLink,
          manager: currentUser.fullName,
        });
      } else {
        // User belongs to other organizations - use existing user invitation email
        // Generate invitation token for existing user
        const invitationToken = jwt.sign(
          {
            userId: userId,
            orgId: orgId,
            purpose: "org_invitation",
            invitedBy: loggedUser.userId,
          },
          config.JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Send invitation email using the existing user email template
        await sendOrgnisationAddedToRegisteredUsers({
          users: [
            {
              email: user.email,
              token: invitationToken,
            },
          ],
          orgTitle: organisation.name,
          manager: currentUser.fullName,
        });
      }

      await transaction.commit();
      return success("Invitation resent successfully");
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    const errorMessage =
      err.message || err.toString() || "Failed to resend invitation";
    return error(500, errorMessage);
  }
};

const getDentistRoleId = async (transaction) => {
  const roles = await Role.findAll({
    attributes: ["id", "title"],
    transaction,
  });
  const dentistRole = roles.find((role) =>
    (role.title || "").toLowerCase().includes("dentist")
  );
  return dentistRole ? dentistRole.id : 5;
};

const createDummyDentistForOrganisation = async ({
  organisationId,
  organisationName,
  createdBy,
  transaction,
}) => {
  const roleId = await getDentistRoleId(transaction);
  const email = `dummy-dentist+org-${organisationId}@flossly.local`;
  const existing = await User.findOne({ where: { email }, transaction });
  if (existing) return existing;

  const password = await bcrypt.hash(
    `dummy-${organisationId}-${Date.now()}`,
    10
  );

  const dentistUser = await User.create(
    {
      fullName: organisationName,
      email,
      password,
      profileCompletion: 0,
      roleId,
      status: "Active",
      isEmailVerified: true,
      createdBy,
    },
    { transaction }
  );

  await UserOrganisation.create(
    {
      userId: dentistUser.id,
      organisationId,
      status: "Active",
    },
    { transaction }
  );

  return dentistUser;
};

const assignDefaultTasksToUser = async (user, organisationId) => {
  const roleId = user.roleId;
  const userId = user.id;
  try {
    const tasks = await Task.findAll({
      where: { roleId, isSystemTask: true },
      limit: 50,
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

const assignDefaultHRDocsToUser = async (userId) => {
  const defaultDocs = await HrDocument.findAll();

  const userDocs = defaultDocs.map((doc) => ({
    userId,
    name: doc.name,
    type: doc.type,
    status: "Pending",
  }));

  await UserHrDocument.bulkCreate(userDocs);
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

export const getUserHrDocuments = async (event) => {
  const body = await readBody(event);
  const { userId } = JSON.parse(body);
  if (!userId) throw createError({ message: "userId required" });
  try {
    const docs = await UserHrDocument.findAll({ where: { userId } });
    return success(docs);
  } catch (err) {
    return error(500, err.message);
  }
};

export const addUserHrDoc = async (event) => {
  const form = await readMultipartFormData(event);
  if (!form) return error("Invalid form data");
  const fields = {};
  let documentFile = null;
  form.forEach((item) => {
    if (item.type) {
      documentFile = item;
    } else {
      fields[item.name] = item.data.toString();
    }
  });
  const { type, userId, name } = fields;
  try {
    let documentPath = null;
    if (documentFile) {
      const uploadDir = path.join(process.cwd(), "public", "hr-documents");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${Date.now()}-${documentFile.filename}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, documentFile.data);
      documentPath = `/hr-documents/${fileName}`;
    }
    const userDoc = await UserHrDocument.findOne({
      where: { userId, type, name },
    });
    if (!userDoc) throw createError({ message: "Document not found for user" });
    userDoc.link = documentPath;
    userDoc.uploadedDate = new Date();
    userDoc.status = "Completed";
    await userDoc.save();
    await UserPointsHistory.create({
      userId,
      rewardPointId: 7,
      points: 50,
      description: name,
    });
    const userPoints = await UserPoint.findOne({
      where: { userId },
    });
    if (!userPoints) {
      await UserPoint.create({
        userId,
        balance: 50,
        totalPointsRewarded: 50,
        redeemed: 0,
      });
    }
    if (userPoints) {
      userPoints.balance += 50;
      userPoints.totalPointsRewarded += 50;
      await userPoints.save();
    }
    // Notification
    return success("Added");
  } catch (err) {
    return error(500, err.message);
  }
};

export const removeUserDoc = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const userDoc = await UserHrDocument.findByPk(id);
    if (!userDoc) throw createError({ message: "Document not found for user" });
    const prevLink = path.join(process.cwd(), "public", userDoc.link);
    if (prevLink && fs.existsSync(prevLink)) {
      fs.unlinkSync(prevLink);
    }
    userDoc.link = "";
    userDoc.uploadedDate = null;
    userDoc.status = "Pending";
    await userDoc.save();
    return success("Deleted");
  } catch (err) {
    return error(500, err.message);
  }
};
