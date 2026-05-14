import {
  Organisation,
  Role,
  User,
  UserAccount,
  UserContract,
  UserLeaveEntitlement,
  UserLeaveHistory,
  UserOrganisation,
  UserPreference,
  DiaryAppointment,
  DiaryNote,
  DiaryPatientForm,
  MetaPage,
  MetaUserToken,
  MetaWhatsAppConfig,
  WhapiChannelConfig,
  ChatbotConfig,
} from "../models";
import { Op } from "sequelize";
import DB from "../utils/db";
import { uploadBufferFile } from "../utils/storage";
import { parseJsonBody } from "../utils/body";
import {
  leaveRequestApprovedNotification as emailLeaveRequestApprovedNotification,
  leaveRequestDeniedNotification as emailLeaveRequestDeniedNotification,
} from "../utils/emailNotifications.js";
import { sendLeaveApprovedNotification, sendLeaveDeniedNotification } from "../utils/fcmNotification.js";
export const usersList = async (event) => {
  const loggedUser = event.context.user;
  let currentOrg = loggedUser.orgId;
  const bodyRaw = await readBody(event);
  let body = bodyRaw;
  if (typeof bodyRaw === "string") {
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      body = {};
    }
  }
  const { roleId, orgId } = body || {};
  if (orgId) {
    currentOrg = orgId;
  }
  const where = {};
  if (roleId) {
    where.roleId = roleId;
  }
  try {
    const userOrganisations = await UserOrganisation.findAll({
      where: { 
        organisationId: currentOrg,
        status: "Active" // Only fetch users with Active status in the organization
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
          include: [
            {
              model: Role,
              as: "role",
            },
            {
              model: UserPreference,
              as: "preferences",
              attributes: {
                include: [
                  "licenseType",
                  "licenseRenewalDate",
                ],
              },
            },
          ],
        },
      ],
    });
  
    const users = userOrganisations
      .map((uo) => {
        const user = uo.user.toJSON();
        
        // Filter out dummy dentist users (created for diary functionality)
        if (user.email && user.email.includes('dummy-dentist') && user.email.includes('@flossly.local')) {
          return null;
        }
        
        user.orgStatus = uo.status || "Active";
        user.isActive = user.orgStatus === "Active";
        const isGloballyDeactivated = user.status === "Disabled" || user.status === "Expired";
        const isOrgDeactivated = user.orgStatus === "Disabled";
        user.isAccountDeactivated = isGloballyDeactivated || isOrgDeactivated;
        return user;
      })
      .filter(Boolean); // Remove any null entries
    return success(users);
  } catch (err) {
    return error(500, err);
  }
};

export const userAcrossOrgs = async (event) => {
  const loggedUser = event.context.user;
  try {
    const userOrganisations = await UserOrganisation.findAll({
      where: { 
        userId: loggedUser.userId,
        status: "Active", 
      },
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "address", "createdAt"],
          include: [
            {
              model: UserOrganisation,
              as: "userOrganisations",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: [
                    "id",
                    "fullName",
                    "email",
                    "gender",
                    "nextOfKin",
                    "nextOfKinContact",
                    "phone",
                    "address",
                    "dob",
                    "photo",
                    "createdAt",
                    "profileCompletion",
                    "status",
                  ],
                  include: [
                    {
                      model: Role,
                      as: "role",
                      attributes: ["id", "title", "color"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const formattedData = userOrganisations.map((orgItem) => {
      try {
        if (!orgItem.organisation) {
          return null;
        }

        const orgItemPlain = orgItem.toJSON ? orgItem.toJSON() : orgItem;
        const orgData = orgItemPlain.organisation;
        
        if (!orgData) {
          return null;
        }

        const { userOrganisations: orgUserOrgs, ...orgInfo } = orgData;

      return {
        organisation: orgInfo,
        orgUsers: (orgUserOrgs || []).map((uo) => {
          if (!uo || !uo.user) {
            return null;
          }
          const userPlain = uo.user.toJSON ? uo.user.toJSON() : uo.user;
          const user = JSON.parse(JSON.stringify(userPlain));
          
          // Filter out dummy dentist users (created for diary functionality)
          if (user.email && user.email.includes('dummy-dentist') && user.email.includes('@flossly.local')) {
            return null;
          }
          
          user.orgStatus = uo.status || "Active";
          user.isActive = user.orgStatus === "Active";
          return user;
        }).filter(Boolean), // Remove any null entries
      };
      } catch (err) {
        return null;
      }
    }).filter(Boolean); // Remove any null entries
    
    return success(formattedData);
  } catch (err) {
    return error(500, err.message || err);
  }
};
export const updateUserPreferences = async (event) => {
  const body = await readBody(event);

  const { userId, taskTableColumns } = parseJsonBody(body);
  if (!userId) {
    throw createError({ message: "userId required" });
  }
  if (!Array.isArray(taskTableColumns)) {
    throw createError({ message: "taskTableColumns must be an array" });
  }
  const isValid = taskTableColumns.every((col) => {
    return (
      typeof col === "object" &&
      typeof col.key === "string" &&
      typeof col.title === "string"
    );
  });
  if (!isValid) {
    throw createError({ message: "column should have key and title" });
  }
  try {
    const { orgId } = event.context.user;
    const userPreference = await UserPreference.findOne({ where: { userId, organisationId: orgId, }, });
    if (!userPreference) {
      throw createError({ message: "userPreference not found" });
    } else {
      userPreference.taskTableColumns = taskTableColumns;
      await userPreference.save();
    }
    return success("Preferences updated successfully");
  } catch (err) {
    return error(500, err.message);
  }
};

export const userDetails = async (event) => {
  const body = await readBody(event);
  const { id, organisationId } = parseJsonBody(body);
  const user = await User.findByPk(id);
  if (!user) throw createError({ message: "User not found" });
  try {
    const user = await User.findOne({
      where: { id },
      include: [
        {
          model: UserContract,
          as: "contract", // optional alias if defined
          where: { organisationId },
          required: false,
        },
        {
          model: UserAccount,
          as: "account",
        },
        {
          model: UserLeaveEntitlement,
          as: "leaveEntitlement",
          where: { organisationId },
          required: false,
        },
      ],
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }
    return success(user);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateContractDetails = async (event) => {
  const transaction = await DB.transaction();
  const body = await readBody(event);
  const { details, userId, organisationId } = parseJsonBody(body);
  try {
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid userId provided",
      });
    }
    let contract = await UserContract.findOne({
      where: { userId, organisationId },
    });

    if (contract) {
      await contract.update(details, { transaction });
    } else {
      contract = await UserContract.create(
        {
          userId,
          organisationId,
          ...details,
        },
        { transaction }
      );
    }
    await transaction.commit();
    return success("contract updated");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const leaveHistory = async (event) => {
  const body = await readBody(event);
  const { userId, organisationId } = parseJsonBody(body);
  try {
    let entitlement = await UserLeaveEntitlement.findOne({
      where: { userId, organisationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "photo"],
        },
      ],
    });

    // If no entitlement exists yet (e.g. user has never requested leave), create default entitlement
    if (!entitlement) {
      entitlement = await UserLeaveEntitlement.create({
        userId,
        organisationId,
        allowedAnnualLeaves: 14,
        allowedCasualLeaves: 10,
        allowedCompationateLeaves: 5,
        allowedSickLeaves: 5,
        allowedOtherLeaves: 5,
      });
    }
    const leaveHistory = await UserLeaveHistory.findAll({
      where: { userId, organisationId },
      include: [
        {
          model: User,
          as: "approver",
          attributes: ["id", "fullName", "email", "photo"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    return success({
      entitlement,
      leaveHistory,
    });
  } catch (err) {
    return error(500, err.message);
  }
};
export const updateBankDetails = async (event) => {
  const body = await readBody(event);
  const { userId, account } = parseJsonBody(body);
  try {
    const bankDetails = await UserAccount.findOne({
      where: { userId },
    });
    if (!bankDetails) {
      await UserAccount.create({ ...account, userId });
    } else {
      await bankDetails.update(account);
    }
    return success(bankDetails);
  } catch (err) {
    return error(500, err.message);
  }
};
export const applyLeave = async (event) => {
  const actor = event.context.user;
  const transaction = await DB.transaction();
  try {
    const form = await readMultipartFormData(event);

    if (!form) return error("Invalid form data");

    // Extract fields from form data
    const fields = {};
    let documentFile = null;

    form.forEach((item) => {
      if (item.type) {
        // file
        documentFile = item;
      } else {
        // text field
        fields[item.name] = item.data.toString();
      }
    });

    const {
      userId,
      organisationId,
      leaveType,
      startDate,
      endDate,
      reason,
      isPaid,
      totalHours,
    } = fields;

    if (!userId || !leaveType || !startDate || !endDate) {
      return error("Missing required fields");
    }

    // Save file if uploaded
    let documentPath = null;
    if (documentFile) {
      const fileName = `${Date.now()}-${documentFile.filename}`;
      documentPath = await uploadBufferFile({
        data: documentFile.data,
        filename: fileName,
        contentType: documentFile.type || documentFile.mimetype,
        baseDir: "leave-documents",
      });
    }

    let entitlement = await UserLeaveEntitlement.findOne({
      where: { userId, organisationId },
    });

    if (!entitlement) {
      entitlement = await UserLeaveEntitlement.create({
        userId,
        organisationId,
        allowedAnnualLeaves: 14,
        allowedCasualLeaves: 10,
        allowedCompationateLeaves: 5,
        allowedSickLeaves: 5,
        allowedOtherLeaves: 5,
      }, { transaction });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Prevent overlapping/duplicate leaves for same user/org
    const existingOverlap = await UserLeaveHistory.findOne({
      where: {
        userId,
        organisationId,
        status: { [Op.in]: ["Pending", "Approved"] },
        [Op.and]: [
          { startDate: { [Op.lte]: end } },
          { endDate: { [Op.gte]: start } },
        ],
      },
    });
    if (existingOverlap) {
      throw createError({
        statusCode: 400,
        statusMessage: "You already have a leave that overlaps with the selected dates.",
      });
    }

    const diffDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let allowed = 0;
    let taken = 0;

    switch (leaveType) {
      case "Annual":
        allowed = entitlement.allowedAnnualLeaves || 0;
        taken = entitlement.takenAnnualLeaves || 0;
        entitlement.takenAnnualLeaves += diffDays;
        break;
      case "Casual":
        allowed = entitlement.allowedCasualLeaves || 0;
        taken = entitlement.takenCasualLeaves || 0;
        entitlement.takenCasualLeaves += diffDays;
        break;
      case "Compationate":
        allowed = entitlement.allowedCompationateLeaves || 0;
        taken = entitlement.takenCompationateLeaves || 0;
        entitlement.takenCompationateLeaves += diffDays;
        break;
      case "Sick":
        allowed = entitlement.allowedSickLeaves || 0;
        taken = entitlement.takenSickLeaves || 0;
        entitlement.takenSickLeaves += diffDays;
        break;
      default:
        allowed = entitlement.allowedOtherLeaves || 0;
        taken = entitlement.takenOtherLeaves || 0;
        entitlement.takenOtherLeaves += diffDays;
        break;
    }

    if (taken + diffDays > allowed) {
      throw createError({ message: `Not enough ${leaveType} leave balance` });
    }

    await entitlement.save({ transaction });

    // Normalize totalHours to numeric hours
    let normalizedHours = 0;
    if (typeof totalHours === "number") {
      normalizedHours = totalHours;
    } else if (typeof totalHours === "string") {
      const m = totalHours.match(/(\d+(?:\.\d+)?)/);
      if (m) {
        normalizedHours = parseFloat(m[1]);
      } else if (totalHours.toLowerCase().includes("full")) {
        normalizedHours = 8;
      } else if (totalHours.toLowerCase().includes("half")) {
        normalizedHours = 4;
      }
    }

    const leave = await UserLeaveHistory.create(
      {
        userId,
        organisationId,
        leaveType,
        startDate,
        endDate,
        reason,
        totalHours: normalizedHours || null,
        isPaid: isPaid === "true", // because form data sends strings
        document: documentPath,
        status: userId == actor.userId ? "Pending" : "Approved",
      },
      { transaction }
    );

    await transaction.commit();
    return success(leave);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const updateLeaveStatus = async (event) => {
  const body = await readBody(event);
  try {
    const { id, status } = parseJsonBody(body);
    const leave = await UserLeaveHistory.findOne({ where: { id } });
    if (!leave) throw createError({ message: "No Leave found" });
    leave.status = status;
    await leave.save();
    const user = await User.findOne({ where: { id: leave.userId } });
    const data = {
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      fullName: user.fullName,
      email: user.email,
    };
    const startDateFormatted = leave.startDate
      ? new Date(leave.startDate).toLocaleDateString("en-GB")
      : null;
    const endDateFormatted = leave.endDate
      ? new Date(leave.endDate).toLocaleDateString("en-GB")
      : null;

    if (status === "Approved") {
      // Email notification (existing)
      await emailLeaveRequestApprovedNotification(data);

      // Push notification (new - in addition to email)
      try {
        await sendLeaveApprovedNotification({
          userId: user.id,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
        });
      } catch (pushErr) {
        console.warn('Leave approved push notification failed', {
          userId: user.id,
          error: pushErr?.message || pushErr,
        });
      }
    } else {
      // Email notification (existing)
      await emailLeaveRequestDeniedNotification(data);

      // Push notification (new - in addition to email)
      try {
        await sendLeaveDeniedNotification({
          userId: user.id,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          reason: body.reason || null,
        });
      } catch (pushErr) {
        console.warn('Leave denied push notification failed', {
          userId: user.id,
          error: pushErr?.message || pushErr,
        });
      }
    }
    return success("Updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const deleteLeave = async (event) => {
  const body = await readBody(event);
  try {
    const { id } = parseJsonBody(body);
    if (!id) return { code: 1, data: "Leave ID is required" };
    const leave = await UserLeaveHistory.findByPk(id);
    if (!leave) return { code: 1, data: "No Leave found" };
    await leave.destroy();
    return { code: 0, data: "Leave deleted successfully" };
  } catch (err) {
    return { code: 1, data: err.message || err };
  }
};

export const allusersLeavesHistory = async (event) => {
  const { orgId } = event.context.user;
  try {
    const leaves = await UserLeaveHistory.findAll({
      where: { organisationId: orgId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "photo"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "fullName", "email", "photo"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    const formatted = leaves.map((leave) => ({
      title: leave.leaveType,
      start: leave.startDate,
      id: leave.id,
      end: leave.endDate,
      status: leave.status,
      reason: leave.reason,
      totalHours: leave.totalHours,
      user: leave.user
        ? {
            id: leave.user.id,
            fullName: leave.user.fullName,
            email: leave.user.email,
            photo: leave.user.photo,
          }
        : null,
      approver: leave.approver
        ? {
            id: leave.approver.id,
            name: leave.approver.name,
            email: leave.approver.email,
          }
        : null,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    }));

    return success(formatted);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateAllowedLeaves = async (event) => {
  const body = await readBody(event);
  const {
    userId,
    organisationId,
    allowedAnnualLeaves,
    allowedCasualLeaves,
    allowedCompationateLeaves,
    allowedSickLeaves,
    allowedOtherLeaves,
  } = parseJsonBody(body);
  try {
    let leaveEntitlement = await UserLeaveEntitlement.findOne({
      where: { userId, organisationId },
    });
    if (!leaveEntitlement) {
      leaveEntitlement = await UserLeaveEntitlement.create({
        userId,
        organisationId,
        allowedAnnualLeaves,
        allowedCasualLeaves,
        allowedCompationateLeaves,
        allowedSickLeaves,
        allowedOtherLeaves,
      });
    } else {
      leaveEntitlement.allowedAnnualLeaves =
        parseInt(allowedAnnualLeaves, 10) ||
        leaveEntitlement.allowedAnnualLeaves;
      leaveEntitlement.allowedCasualLeaves =
        parseInt(allowedCasualLeaves, 10) ||
        leaveEntitlement.allowedCasualLeaves;
      leaveEntitlement.allowedCompationateLeaves =
        parseInt(allowedCompationateLeaves, 10) ||
        leaveEntitlement.allowedCompationateLeaves;
      leaveEntitlement.allowedSickLeaves =
        parseInt(allowedSickLeaves, 10) || leaveEntitlement.allowedSickLeaves;
      leaveEntitlement.allowedOtherLeaves =
        parseInt(allowedOtherLeaves, 10) || leaveEntitlement.allowedOtherLeaves;
      await leaveEntitlement.save();
    }
    return success("Updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const deactivateUser = async (event) => {
  const body = await readBody(event);
  const { userId, organisationId } = parseJsonBody(body);
  const transaction = await DB.transaction();
  
  try {
    if (!userId || !organisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "userId and organisationId are required",
      });
    }

    // Find the user organization relationship
    const userOrg = await UserOrganisation.findOne({
      where: { userId, organisationId },
      transaction,
    });

    if (!userOrg) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found in this organization",
      });
    }

    userOrg.status = "Disabled";
    await userOrg.save({ transaction });

    await transaction.commit();
    return success("User deactivated successfully");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const activateUser = async (event) => {
  const body = await readBody(event);
  const { userId, organisationId } = parseJsonBody(body);
  const transaction = await DB.transaction();
  
  try {
    if (!userId || !organisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "userId and organisationId are required",
      });
    }

    // Find the user organization relationship
    const userOrg = await UserOrganisation.findOne({
      where: { userId, organisationId },
      transaction,
    });

    if (!userOrg) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found in this organization",
      });
    }

    userOrg.status = "Active";
    await userOrg.save({ transaction });
    
    const user = await User.findByPk(userId, { transaction });
    if (user && (user.status === "Disabled" || user.status === "Expired")) {
      user.status = "Active";
      await user.save({ transaction });
    }

    await transaction.commit();
    return success("User activated successfully");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const deleteUser = async (event) => {
  const body = await readBody(event);
  const { userId, organisationId } = parseJsonBody(body);
  const transaction = await DB.transaction();
  
  try {
    if (!userId || !organisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "userId and organisationId are required",
      });
    }

    const activeOrgCount = await UserOrganisation.count({
      where: { 
        userId, 
        status: "Active" 
      },
      transaction,
    });

    if (activeOrgCount > 1) {
      await UserOrganisation.destroy({
        where: { userId, organisationId },
        transaction,
      });
      await transaction.commit();
      return success("User removed from organization successfully");
    } else {
      const userExists = await User.count({ where: { id: userId }, transaction });
      if (!userExists) {
        throw createError({ statusCode: 404, statusMessage: "User not found" });
      }

      // Null-out nullable FKs that reference this user
      await Organisation.update(
        { managerId: null },
        { where: { managerId: userId }, transaction }
      );

      // Explicitly delete records with NOT NULL FKs pointing to Users
      // (DB constraints lack CASCADE; use model methods so schema is applied automatically)
      await DiaryAppointment.destroy({ where: { dentistId: userId }, transaction });
      await DiaryNote.destroy({ where: { dentistId: userId }, transaction });
      await DiaryPatientForm.destroy({ where: { createdBy: userId }, transaction });
      await MetaPage.destroy({ where: { userId }, transaction });
      await MetaUserToken.destroy({ where: { userId }, transaction });
      await MetaWhatsAppConfig.destroy({ where: { userId }, transaction });
      await WhapiChannelConfig.destroy({ where: { userId }, transaction });
      await ChatbotConfig.destroy({ where: { userId }, transaction });

      await User.destroy({ where: { id: userId }, transaction });
      await transaction.commit();
      return success("User deleted successfully");
    }
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};
