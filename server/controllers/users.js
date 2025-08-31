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
} from "../models";

import DB from "../utils/db";
import fs from "fs";
import path from "path";
export const usersList = async (event) => {
  const loggedUser = event.context.user;
  const currentOrg = loggedUser.orgId;
  const body = await readBody(event);
  const { roleId } = JSON.parse(body);
  const where = {};
  if (roleId) {
    where.roleId = roleId;
  }
  try {
    const userOrganisations = await UserOrganisation.findAll({
      where: { organisationId: currentOrg },
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
          where,
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
                  "lastLoginDate",
                  "lastLoginOrganisationId",
                  "licenseType",
                  "licenseRenewalDate",
                ],
              },
            },
          ],
        },
      ],
    });
    const users = userOrganisations.map((uo) => uo.user);
    return success(users);
  } catch (err) {
    return error(500, err);
  }
};

export const userAcrossOrgs = async (event) => {
  const loggedUser = event.context.user;
  try {
    const userOrganisations = await UserOrganisation.findAll({
      where: { userId: loggedUser.userId },
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
      const { userOrganisations, ...orgData } = orgItem.organisation.get({
        plain: true,
      });

      return {
        organisation: orgData,
        orgUsers: userOrganisations.map((uo) => ({
          ...uo.user, // user details
        })),
      };
    });
    return success(formattedData);
  } catch (err) {
    return error(500, err);
  }
};
export const updateUserPreferences = async (event) => {
  const body = await readBody(event);

  const { userId, taskTableColumns } = JSON.parse(body);
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
    const userPreference = await UserPreference.findOne({ where: { userId } });
    if (!userPreference) {
      throw createError({ message: "userPreference not found" });
    } else {
      userPreference.taskTableColumns = JSON.stringify(taskTableColumns);
      await userPreference.save();
    }
    return success("Preferences updated successfully");
  } catch (err) {
    console.log(err);
    return error(500, err.message);
  }
};

export const userDetails = async (event) => {
  const body = await readBody(event);
  const { id, organisationId } = JSON.parse(body);
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
  const { details, userId, organisationId } = JSON.parse(body);
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
  const { userId, organisationId } = JSON.parse(body);
  try {
    const entitlement = await UserLeaveEntitlement.findOne({
      where: { userId, organisationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "photo"],
        },
      ],
    });
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
  const { userId, account } = JSON.parse(body);
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
      totalHours
    } = fields;

    if (!userId || !leaveType || !startDate || !endDate) {
      return error("Missing required fields");
    }

    // Save file if uploaded
    let documentPath = null;
    if (documentFile) {
      const uploadDir = path.join(process.cwd(), "public", "leave-documents");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${documentFile.filename}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, documentFile.data);
      documentPath = `/leave-documents/${fileName}`;
    }

    const entitlement = await UserLeaveEntitlement.findOne({
      where: { userId, organisationId },
    });

    if (!entitlement)
      throw createError({
        message: "Leave Entitlement is not available for this user",
      });

    const start = new Date(startDate);
    const end = new Date(endDate);
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

    const leave = await UserLeaveHistory.create(
      {
        userId,
        organisationId,
        leaveType,
        startDate,
        endDate,
        reason,
        totalHours: totalHours === 'Full Day' ? 8 : 4,
        isPaid: isPaid === "true", // because form data sends strings
        document: documentPath,
        status: "Pending",
      },
      { transaction }
    );

    await transaction.commit();
    return success(leave);
  } catch (err) {
    console.log(err)
    await transaction.rollback();
    return error(500, err.message);
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
  } = JSON.parse(body);
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
