import { Op, fn, col } from "sequelize";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { readBody, createError, getQuery } from "h3";
import { success, error } from "../utils/response";
import DB from "../utils/db";
import {
  DefaultPriority,
  DefaultStatus,
  OrganisationPriority,
  OrganisationStatus,
  Role,
  Task,
  TaskCategory,
  User,
  UserOrganisation,
  UserTask,
  UserTaskAttachment,
  TaskChecklist,
  UserTaskChecklist,
  UserTaskComment,
  UserPointsHistory,
  UserPoint,
  TaskCustomColumnDefinition,
  UserTaskCustomField,
} from "../models";
import {
  taskCompletedNotification,
  sendTaskUnassignmentEmail,
  sendTaskDueReminderEmail,
  sendTaskCommentNotificationEmail,
  sendTaskDetailsEmail,
} from "../utils/emailNotifications";

const PRIVILEGED_ROLE_IDS = [1, 8];
const isManagerOrOwner = (roleId) =>
  PRIVILEGED_ROLE_IDS.includes(Number(roleId));
const ensureManagerOrOwner = (loggedUser) => {
  if (!isManagerOrOwner(loggedUser?.roleId)) {
    throw createError({ statusCode: 403, message: "Not authorized" });
  }
};

const parseJsonBody = async (event) => {
  const body = await readBody(event);
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (err) {
      return {};
    }
  }
  return body;
};

const autoArchiveCompletedTasks = async (organisationId, days = 5) => {
  if (!organisationId) return;
  try {
    const completedStatus = await OrganisationStatus.findOne({
      where: { organisationId, key: "completed" },
    });
    if (!completedStatus) return;

    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await UserTask.update(
      { isArchieved: true },
      {
        where: {
          organisationId,
          statusId: completedStatus.id,
          isArchieved: false,
          updatedAt: { [Op.lt]: thresholdDate },
        },
      }
    );
  } catch (err) {
  }
};

export const listMyTasks = async (event) => {
  const loggedUser = event.context.user;
  const body = await parseJsonBody(event);
  const {
    statusId,
    priorityId,
    categoryId,
    frequency,
    search,
    limit = 20,
    offset = 0,
  } = body;
  try {
    await autoArchiveCompletedTasks(Number(loggedUser.orgId));

    const where = {
      userId: Number(loggedUser.userId),
      organisationId: Number(loggedUser.orgId),
    };
    if (statusId) where["statusId"] = Number(statusId);
    if (priorityId) where["priorityId"] = Number(priorityId);
    if (frequency) where["frequency"] = frequency;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { comments: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const include = [
      {
        model: Task,
        as: "taskDetails",
        attributes: ["id", "categoryId", "defaultFrequency"],
        ...(categoryId && {
          where: { categoryId: Number(categoryId) },
        }),
        include: [
          {
            model: TaskCategory,
            as: "category",
            where: { isDeleted: false },
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: OrganisationPriority,
        as: "priority",
        attributes: ["id", "key", "name", "color"],
      },
      {
        model: UserTaskAttachment,
        as: "attachments",
        attributes: ["id", "title", "link", "type"],
      },
      {
        model: OrganisationStatus,
        as: "status",
        attributes: ["id", "key", "name", "color"],
      },
    ];
    const tasks = await UserTask.findAndCountAll({
      where,
      include,
      limit: Number(limit),
      offset: Number(offset),
      order: [["createdAt", "DESC"]],
    });
    const data = tasks.rows.map((el) => {
      return { ...el, start: el.dueDate || el.createdAt };
    });
    return success({
      total: tasks.count,
      data,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const addTaskCategory = async (event) => {
  const loggedUser = event.context.user;
  ensureManagerOrOwner(loggedUser);
  const body = await readBody(event);
  const { id, name, description, parentId, color } = JSON.parse(body);
  if (!name) return error(400, "Name required");

  try {
    // Prevent duplicate names (case-insensitive) inside the same org, excluding self on update
    const existingName = await TaskCategory.findOne({
      where: {
        name: { [Op.iLike]: name },
        organisationId: loggedUser.orgId,
        ...(id ? { id: { [Op.ne]: id } } : {}),
      },
    });
    if (existingName) {
      throw createError({ message: `Category ${name} is already added` });
    }

    // Update when id is provided, otherwise create
    if (id) {
      const category = await TaskCategory.findOne({
        where: { id, organisationId: loggedUser.orgId },
      });
      if (!category) {
        throw createError({ message: "Category not found" });
      }

      category.name = name;
      category.description = description;
      category.parentId = parentId;
      category.color = color;
      await category.save();

      return success({ message: "Updated", category });
    }

    const newCategory = await TaskCategory.create({
      name,
      description,
      parentId,
      color,
      organisationId: loggedUser.orgId,
    });

    return success({ message: "Saved", category: newCategory });
  } catch (err) {
    return error(500, err.message);
  }
};

export const deleteTaskCategory = async (event) => {
  const loggedUser = event.context.user;
  ensureManagerOrOwner(loggedUser);
  const body = await readBody(event);
  const { id } = typeof body === "string" ? JSON.parse(body) : body;
  
  if (!id) return error(400, "Category ID required");

  try {
    // Find the category - must be a user-created category (not system category)
    const category = await TaskCategory.findOne({
      where: {
        id,
        organisationId: loggedUser.orgId,
        isDeleted: false,
      },
    });

    if (!category) {
      return error(404, "Category not found or cannot be deleted");
    }

    // Check if category has any non-system tasks
    const taskCount = await Task.count({
      where: {
        categoryId: id,
        [Op.or]: [
          { isSystemTask: false },
          { isSystemTask: { [Op.is]: null } },
        ],
      },
    });

    if (taskCount > 0) {
      return error(400, "Cannot delete category with existing tasks");
    }

    // Soft delete the category
    category.isDeleted = true;
    await category.save();

    return success({ message: "Category deleted successfully" });
  } catch (err) {
    return error(500, err.message);
  }
};

export const bulkUploadTasks = async (event) => {
  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    const file = files.file[0];
    if (!file) {
      return error(400, "No CSV file provided");
    }
    const records = await parseCSV(file.filepath);
    const tasksToInsert = records.map((record) => ({
      title: record.title,
      description: record.description,
      categoryId: record.categoryId ? Number(record.categoryId) : 2,
      roleId: Number(record.roleId),
      defaultFrequency: record.defaultFrequency || null,
    }));
    await Task.bulkCreate(tasksToInsert);
    return success("Tasks uploaded successfully");
  } catch (err) {
    return error(500, err.message);
  }
};

export const assignBulkTasks = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  ensureManagerOrOwner(loggedUser);
  const organisationId = loggedUser.orgId;
  const { userId, tasks } = JSON.parse(body);

  if (!userId || !Array.isArray(tasks)) {
    return error(
      402,
      "Missing required fields: userId, organisationId, or tasks"
    );
  }
  try {
    const assigneeLink = await UserOrganisation.findOne({
      where: { userId, organisationId },
    });
    if (!assigneeLink) {
      return error(403, "Cannot assign users outside your organisation");
    }

    const orgPriorities = await OrganisationPriority.findAll({
      where: { organisationId },
    });
    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });
    if (!orgPriorities.length || !orgStatuses.length) {
      throw createError({
        statusCode: 402,
        message: "Organisation does not have any priority or status",
      });
    }
    const taskIds = tasks.map((t) => t.id);

    const existingAssignments = await UserTask.findAll({
      where: {
        userId,
        taskId: {
          [Op.in]: taskIds,
        },
      },
      attributes: ["taskId"],
    });
    const alreadyAssignedTaskIds = new Set(
      existingAssignments.map((e) => e.taskId)
    );
    const newTasks = tasks.filter((t) => !alreadyAssignedTaskIds.has(t.id));

    if (newTasks.length === 0) {
      return success("All tasks already assigned to the user");
    }

    if (loggedUser.userId !== userId) {
      await UserTask.destroy({
        where: {
          userId: loggedUser.userId,
          taskId: {
            [Op.in]: taskIds,
          },
          organisationId,
        },
      });
    }

    const userTasks = newTasks
      .map((t) => {
        return {
          userId,
          organisationId,
          taskId: t.id,
          statusId: orgStatuses.find((x) => x.key === "todo").id,
          priorityId: orgPriorities.find((x) => x.key === "low").id,
          title: t.title,
          documentLink: "",
          frequency: t.defaultFrequency,
          dueDate: getDueDate(t.defaultFrequency),
          comments: "",
          assignedBy: loggedUser.userId,
        };
      })
      .filter(Boolean);
    const createdUserTasks = await UserTask.bulkCreate(userTasks, { returning: true });

    const newTaskIds = [...new Set(newTasks.map((t) => t.id))];
    const templates = await TaskChecklist.findAll({
      where: { taskId: { [Op.in]: newTaskIds } },
    });
    if (templates?.length) {
      const checklistToCreate = [];
      for (const ut of createdUserTasks) {
        const tpls = templates.filter((tpl) => tpl.taskId === ut.taskId);
        if (!tpls.length) continue;
        tpls.forEach((tpl) => {
          checklistToCreate.push({
            userTaskId: ut.id,
            question: tpl.question,
            category: tpl.category,
            showRadio: tpl.showRadio,
            showDate: tpl.showDate,
            showTime: tpl.showTime,
            fieldOneTitle: tpl.fieldOneTitle,
            fieldTwoTitle: tpl.fieldTwoTitle,
            radioValue: 'N/A',
          });
        });
      }
      if (checklistToCreate.length) {
        await UserTaskChecklist.bulkCreate(checklistToCreate);
      }
    }

    const user = await User.findOne({ where: { id: userId } });
    await sendTaskAssignmentEmail({
      email: user.email,
      name: user.fullName,
      taskTitle: createdUserTasks.length === 1 ? createdUserTasks[0].title : "Bulk Tasks",
    });
    return success(createdUserTasks);
  } catch (err) {
    return error(500, err.message);
  }
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const generateNextRecurringTask = async (completedTask, orgStatuses, orgPriorities) => {
  try {
    const currentDueDate = completedTask.dueDate || new Date();
    const nextDueDate = getDueDate(completedTask.frequency, currentDueDate);
    
    if (!nextDueDate) return;

    const upcomingStatus = orgStatuses.find(s => s.key === "upcoming") || 
                          orgStatuses.find(s => s.key === "todo") ||
                          orgStatuses[0];

    await UserTask.create({
      userId: completedTask.userId,
      taskId: completedTask.taskId,
      organisationId: completedTask.organisationId,
      statusId: upcomingStatus.id,
      title: completedTask.title,
      documentLink: completedTask.documentLink || "",
      priorityId: completedTask.priorityId,
      frequency: completedTask.frequency,
      dueDate: nextDueDate,
      comments: "",
      assignedBy: completedTask.assignedBy,
    });
  } catch (err) {
  }
};

const getDueDate = (frequency, fromDate = new Date()) => {
  if (!frequency || frequency === "One off") return null;
  
  const baseDate = new Date(fromDate);
  
  switch (frequency) {
    case "Daily":
      return addDays(baseDate, 1);
    case "Weekly":
      return addDays(baseDate, 7);
    case "Fortnightly":
      return addDays(baseDate, 14);
    case "Monthly":
      return addDays(baseDate, 30);
    case "6 Monthly":
      return addDays(baseDate, 180);
    case "Yearly":
      return addDays(baseDate, 365);
    default:
      return null;
  }
};


export const assignTaskAndPrioritiesToOrg = async (event) => {
  const loggedUser = event.context.user;
  try {
    const defaultPriorities = await DefaultPriority.findAll();
    const priorityData = defaultPriorities.map((p) => ({
      key: p.key,
      name: p.name,
      color: p.color,
      sortOrder: p.sortOrder,
      organisationId: loggedUser.orgId,
      status: "Active",
    }));
    await OrganisationPriority.bulkCreate(priorityData);
  
    const defaultStatuses = await DefaultStatus.findAll();
    const statusData = defaultStatuses.map((s) => ({
      key: s.key,
      name: s.name,
      color: s.color,
      description: s.description,
      organisationId: loggedUser.orgId,
      status: "Active",
    }));
    await OrganisationStatus.bulkCreate(statusData);
    return success("done");
  } catch (err) {
    return err;
  }
};

export const updateTask = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const parsedBody = JSON.parse(body);
    const {
      frequency,
      priorityId,
      statusId,
      id,
      title,
      taskId,
      dueDate,
      comments,
      assignedUsers,
      documentLink,
      isArchieved,
      description,
      taskDetails,
      customFields,
    } = parsedBody;

    if (id && taskId) {
      const userTask = await UserTask.findOne({
        where: {
          id,
          organisationId,
        },
      });
      if (!userTask) {
        throw createError({ message: "UserTask not found" });
      }
      const orgPriorities = await OrganisationPriority.findAll({
        where: { organisationId },
      });
      const orgStatuses = await OrganisationStatus.findAll({
        where: { organisationId },
      });
      if (statusId && !orgStatuses.find((x) => x.id === statusId)) {
        throw createError({ message: "StatusId not found for this org" });
      }
      if (priorityId && !orgPriorities.find((x) => x.id === priorityId)) {
        throw createError({ message: "PriorityId not found for this org" });
      }

      if (frequency !== undefined) userTask.frequency = frequency;
      if (priorityId !== undefined) userTask.priorityId = priorityId;
      if (statusId !== undefined) userTask.statusId = statusId;
      if (title !== undefined) userTask.title = title;
      if (comments !== undefined) userTask.comments = comments;
      if (documentLink !== undefined) userTask.documentLink = documentLink;
      if (dueDate !== undefined)
        userTask.dueDate = dueDate ? new Date(dueDate) : null;
      if (isArchieved !== undefined) userTask.isArchieved = isArchieved;
      await userTask.save();

      if (taskDetails && taskId) {
        const task = await Task.findByPk(taskId);
        if (task) {
          if (taskDetails.description !== undefined)
            task.description = taskDetails.description;
          if (taskDetails.roleId !== undefined)
            task.roleId = taskDetails.roleId;
          if (taskDetails.defaultFrequency !== undefined)
            task.defaultFrequency = taskDetails.defaultFrequency;
          await task.save();
        }
      }

      // Update custom fields if provided
      if (customFields && Array.isArray(customFields)) {
        for (const customField of customFields) {
          const { columnDefinitionId, value } = customField;

          if (columnDefinitionId !== undefined) {
            // Verify the column definition belongs to this organization
            const columnDef = await TaskCustomColumnDefinition.findOne({
              where: {
                id: columnDefinitionId,
                createdBy: loggedUser.userId,
                isActive: true,
              },
            });

            if (!columnDef) {
              continue; // Skip invalid column definitions
            }

            // Find or create the custom field record
            const [userTaskCustomField, created] = await UserTaskCustomField.findOrCreate({
              where: {
                userTaskId: id,
                columnDefinitionId,
              },
              defaults: {
                userTaskId: id,
                columnDefinitionId,
                value: value || "",
              },
            });

            // Update the value if it already existed
            if (!created) {
              userTaskCustomField.value = value || "";
              await userTaskCustomField.save();
            }
          }
        }
      }
      if (
        statusId &&
        orgStatuses.find((x) => x.id === statusId)?.key === "completed"
      ) {
        const user = await User.findOne({ where: { id: loggedUser.userId } });
        await taskCompletedNotification({
          fullName: user.fullName,
          email: user.email,
          task: userTask.title,
        });

        if (userTask.frequency && userTask.frequency !== "One off") {
          await generateNextRecurringTask(userTask, orgStatuses, orgPriorities);
        }

        if (
          priorityId &&
          orgPriorities.find((x) => x.id === priorityId)?.key === "critical"
        ) {
          await UserPointsHistory.create({
            userId: loggedUser.userId,
            rewardPointId: 4,
            points: 10,
            description: userTask.title,
          });
          const userPoints = await UserPoint.findOne({
            where: { userId: loggedUser.userId },
          });
          if (!userPoints) {
            await UserPoint.create({
              userId: loggedUser.userId,
              balance: 10,
              totalPointsRewarded: 10,
              redeemed: 0,
            });
          }
          if (userPoints) {
            userPoints.balance += 10;
            userPoints.totalPointsRewarded += 10;
            await userPoints.save();
          }
        }
      }
    } else if (!id && taskId) {
      if (assignedUsers && assignedUsers.length) {
        assignedUsers.forEach(async (el) => {
          await UserTask.update(
            { statusId, frequency, priorityId, dueDate, comments, title },
            { where: { id: el.userTaskId } }
          );
        });
      }
    } else {
      throw createError({ message: "Task not found" });
    }
    return success("UserTask updated");
  } catch (err) {
    return error(500, err.message);
  }
};
export const viewTeamTasksTaskWise = async (event) => {
  try {
    const loggedUser = event.context.user;
    ensureManagerOrOwner(loggedUser);
    const organisationId = loggedUser.orgId;
    const userTasks = await UserTask.findAll({
      where: { organisationId },
      include: [
        {
          model: Task,
          as: "taskDetails",
        },
        {
          model: UserTaskAttachment,
          as: "attachments",
          attributes: ["id", "title", "link", "type"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "fullName", "photo"],
        },
      ],
    });
    const taskMap = new Map();

    userTasks.forEach((userTask) => {
      const task = userTask;
      const assignedUser = userTask.assignedUser;
      const userId = assignedUser?.id;

  
      if (!assignedUser || !userId) {
        return;
      }

      if (!taskMap.has(task.taskDetails.id)) {
        taskMap.set(task.taskDetails.id, {
          ...task.get(),
          assignedUser: [assignedUser.get()],
        });
      } else {
        const existingTask = taskMap.get(task.taskDetails.id);
        const userExists = existingTask.assignedUser.some(
          (u) => u.id === userId
        );
        if (!userExists) {
          existingTask.assignedUser.push(assignedUser.get());
        }
      }
    });

    const tasks = Array.from(taskMap.values());

    return success(tasks);
  } catch (err) {
    return error(500, err.message);
  }
};

export const unAssignTask = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTaskId } = JSON.parse(body);
    const userTask = await UserTask.findOne({
      where: {
        id: userTaskId,
        organisationId,
      },
    });
    if (!userTask) {
      throw createError({ message: "UserTask not found" });
    }
    const isOwner = userTask.userId === loggedUser.userId;
    const isAssigner = userTask.assignedBy === loggedUser.userId;
    const isPrivileged = isManagerOrOwner(loggedUser.roleId);
    
    // Check if task was assigned by Practice Profile (Admin)
    let wasAssignedByPracticeProfile = false;
    if (userTask.assignedBy) {
      const assignerUser = await User.findByPk(userTask.assignedBy);
      if (assignerUser && isManagerOrOwner(assignerUser.roleId)) {
        wasAssignedByPracticeProfile = true;
      }
    }
    
    // Prevent normal users from deleting tasks assigned by Practice Profile
    if (wasAssignedByPracticeProfile && !isPrivileged) {
      throw createError({
        statusCode: 403,
        message: "You do not have permission to delete tasks assigned by Practice Profile",
      });
    }
    
    if (!isOwner && !isAssigner && !isPrivileged) {
      throw createError({
        statusCode: 403,
        message: "Not authorized to delete this task",
      });
    }
    const removedByUser = await User.findByPk(loggedUser.userId);
    const removedUser = await User.findByPk(userTask.userId);
    const taskTitle =
      userTask.title || (await Task.findByPk(userTask.taskId))?.title;

    await userTask.destroy();

    if (removedUser?.email) {
      await sendTaskUnassignmentEmail({
        email: removedUser.email,
        name: removedUser.fullName,
        taskTitle: taskTitle || "Task",
        removedBy: removedByUser?.fullName || "Team",
      });
    }

    return success("UserTask successfully deleted (unassigned).");
  } catch (err) {
    return error(500, err.message);
  }
};
export const completeBulkTasks = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTasksIds } = JSON.parse(body);
    
    const statuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });
    const priorities = await OrganisationPriority.findAll({
      where: { organisationId },
    });
    
    const tasksToComplete = await UserTask.findAll({
      where: {
        id: userTasksIds,
        organisationId,
      },
    });
    
    await UserTask.update(
      { statusId: statuses.find((x) => x.key === "completed").id },
      {
        where: {
          id: userTasksIds,
          organisationId,
        },
      }
    );
    
    for (const task of tasksToComplete) {
      if (task.frequency && task.frequency !== "One off") {
        await generateNextRecurringTask(task, statuses, priorities);
      }
    }
    
    const user = await User.findOne({ where: { id: loggedUser.userId } });
    await taskCompletedNotification({
      fullName: user.fullName,
      email: user.email,
      task: "Multiple",
    });
    return success("All tasks completed successfully.");
  } catch (err) {
    return error(500, err.message);
  }
};
export const archieveBulkTasks = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTasksIds } = JSON.parse(body);
    await UserTask.update(
      { isArchieved: true },
      {
        where: {
          id: userTasksIds,
          organisationId,
        },
      }
    );
    return success("All tasks compeleted successfully.");
  } catch (err) {
    return error(500, err.message);
  }
};

export const unarchiveBulkTasks = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTasksIds } = JSON.parse(body);
    await UserTask.update(
      { isArchieved: false },
      {
        where: {
          id: userTasksIds,
          organisationId,
        },
      }
    );
    return success("All tasks unarchived successfully.");
  } catch (err) {
    return error(500, err.message);
  }
};

export const unAssignBulkTask = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTasksIds } = JSON.parse(body);
    const tasks = await UserTask.findAll({
      where: {
        id: userTasksIds,
        organisationId,
      },
    });
    if (!tasks.length) {
      throw createError({ message: "No matching UserTasks found" });
    }
    const isPrivileged = isManagerOrOwner(loggedUser.roleId);
    
    // Check for tasks assigned by Practice Profile (Admin)
    const tasksAssignedByPracticeProfile = [];
    for (const task of tasks) {
      if (task.assignedBy) {
        const assignerUser = await User.findByPk(task.assignedBy);
        if (assignerUser && isManagerOrOwner(assignerUser.roleId)) {
          tasksAssignedByPracticeProfile.push(task);
        }
      }
    }
    
    // Prevent normal users from deleting tasks assigned by Practice Profile
    if (tasksAssignedByPracticeProfile.length > 0 && !isPrivileged) {
      throw createError({
        statusCode: 403,
        message: "You do not have permission to delete tasks assigned by Practice Profile",
      });
    }
    
    const unauthorized = tasks.filter(
      (ut) =>
        ut.userId !== loggedUser.userId &&
        ut.assignedBy !== loggedUser.userId &&
        !isPrivileged // privileged roles are authorized
    );
    if (unauthorized.length) {
      throw createError({
        statusCode: 403,
        message: "Not authorized to delete one or more selected tasks",
      });
    }
    const tasksWithUsers = await UserTask.findAll({
      where: { id: userTasksIds, organisationId },
      include: [
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    await UserTask.destroy({
      where: {
        id: userTasksIds,
        organisationId,
      },
    });

    const remover = await User.findByPk(loggedUser.userId);
    for (const task of tasksWithUsers) {
      if (task.assignedUser?.email) {
        await sendTaskUnassignmentEmail({
          email: task.assignedUser.email,
          name: task.assignedUser.fullName,
          taskTitle:
            task.title || (await Task.findByPk(task.taskId))?.title || "Task",
          removedBy: remover?.fullName || "Team",
        });
      }
    }

    return success("UserTask successfully deleted (unassigned).");
  } catch (err) {
    return error(500, err.message);
  }
};

export const addUserTaskComment = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTaskId, comment } = JSON.parse(body);
    if (!userTaskId || !comment) {
      throw createError({ message: "userTaskId and comment are required" });
    }
    const userTask = await UserTask.findOne({
      where: { id: userTaskId, organisationId },
      include: [
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "fullName", "email"],
        },
        {
          model: Task,
          as: "taskDetails",
          attributes: ["title"],
        },
      ],
    });
    if (!userTask) {
      throw createError({ message: "UserTask not found" });
    }
    const newComment = await UserTaskComment.create({
      userTaskId,
      userId: loggedUser.userId,
      organisationId,
      comment,
    });

    if (userTask.assignedUser?.email) {
      await sendTaskCommentNotificationEmail({
        email: userTask.assignedUser.email,
        name: userTask.assignedUser.fullName,
        taskTitle: userTask.taskDetails?.title || userTask.title || "Task",
        comment,
      });
    }

    return success(newComment);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listUserTaskComments = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTaskId } = JSON.parse(body);
    if (!userTaskId) {
      throw createError({ message: "userTaskId is required" });
    }
    const comments = await UserTaskComment.findAll({
      where: { userTaskId, organisationId },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "fullName", "photo", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return success(comments);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateUserTaskComment = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { commentId, comment } = JSON.parse(body);
    if (!commentId || !comment) {
      throw createError({ message: "commentId and comment are required" });
    }
    const existing = await UserTaskComment.findOne({
      where: { id: commentId, organisationId },
    });
    if (!existing) throw createError({ message: "Comment not found" });
    const isAuthor = existing.userId === loggedUser.userId;
    const isOrgAdmin = loggedUser.roleId === 1; // adjust admin role if needed
    if (!isAuthor && !isOrgAdmin) {
      throw createError({
        statusCode: 403,
        message: "Not authorized to edit this comment",
      });
    }
    existing.comment = comment;
    await existing.save();
    return success(existing);
  } catch (err) {
    return error(500, err.message);
  }
};

export const deleteUserTaskComment = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { commentId } = JSON.parse(body);
    
    if (!commentId) {
      throw createError({ message: "commentId is required" });
    }

    // Build authorization where clause: author OR org admin
    const isOrgAdmin = loggedUser.roleId === 1;
    const whereClause = {
      id: commentId,
      organisationId,
    };
    
    // If not admin, only allow deleting own comments
    if (!isOrgAdmin) {
      whereClause.userId = loggedUser.userId;
    }

    // Single efficient query: find and delete in one operation
    const deletedCount = await UserTaskComment.destroy({
      where: whereClause,
    });

    if (deletedCount === 0) {
      // Check if comment exists but user doesn't have permission
      const exists = await UserTaskComment.findOne({
        where: { id: commentId, organisationId },
        attributes: ["id"],
      });
      
      if (exists) {
        throw createError({
          statusCode: 403,
          message: "Not authorized to delete this comment",
        });
      }
      
      throw createError({ message: "Comment not found" });
    }

    return success("Comment deleted");
  } catch (err) {
    if (err.statusCode) {
      return error(err.statusCode, err.message);
    }
    return error(500, err.message);
  }
};

export const addAttachments = async (event) => {
  const loggedUser = event.context.user;
  try {
    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), "public/uploads"),
      keepExtensions: true,
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        return `${name}-${timestamp}-${ext}`;
      },
    });
    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ files, fields });
      });
    });
    const userTaskId = fields.userTaskId[0];
    const userTask = await UserTask.findByPk(userTaskId);
    if (!userTask) {
      throw createError({ message: "UserTask not found" });
    }
    const uploadedFiles = Array.isArray(files.files)
      ? files.files
      : [files.files];
    await Promise.all(
      uploadedFiles.map((file) => {
        const link = `/uploads/${path.basename(file.filepath)}`;
        return UserTaskAttachment.create({
          userTaskId,
          title: file.originalFilename,
          type: file.mimetype,
          link,
          size: file.size,
          uploadedBy: loggedUser.userId,
        });
      })
    );
    return success("Attachments added");
  } catch (err) {
    return error(500, err.message);
  }
};

export const deleteAttachment = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { id } = JSON.parse(body);
    
    if (!id) {
      throw createError({ message: "Attachment id required" });
    }

    // Find attachment with UserTask to get file path and verify organization access
    // Using include with required: true ensures we only get attachments from valid UserTasks
    const attachment = await UserTaskAttachment.findOne({
      where: { id },
      include: [
        {
          model: UserTask,
          as: "userTask",
          where: { organisationId },
          attributes: ["id", "organisationId"],
          required: true,
        },
      ],
      attributes: ["id", "link"], // Only fetch what we need
    });

    if (!attachment) {
      // Check if attachment exists but belongs to different organization
      const exists = await UserTaskAttachment.findOne({
        where: { id },
        attributes: ["id"],
      });
      
      if (exists) {
        throw createError({
          statusCode: 403,
          message: "Not authorized to delete this attachment",
        });
      }
      
      throw createError({ message: "Attachment not found" });
    }

    const filePath = path.join(process.cwd(), "public", attachment.link);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
      }
    }

    await attachment.destroy();
    return success("File removed from task");
  } catch (err) {
    return error(500, err.message);
  }
};

export const createNewTask = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const {
    title,
    description,
    roleId,
    categoryId,
    defaultFrequency,
    userId,
    userIds,
    checklist,
    dueDate,
    statusId,
    priorityId: incomingPriorityId,
  } = JSON.parse(body);
  if (!title || !title.trim() || !categoryId) {
    throw createError({ message: "Task title cannot be empty or only spaces" });
  }
  const requestedUserIds = Array.isArray(userIds)
    ? userIds.filter(Boolean)
    : [];
  if (userId) {
    requestedUserIds.push(userId);
  }
  const assignUserIds = [...new Set(requestedUserIds)];
  if (!assignUserIds.length) {
    assignUserIds.push(loggedUser.userId);
  }

  const assigneeLinks = await UserOrganisation.findAll({
    where: { organisationId: loggedUser.orgId, userId: assignUserIds },
  });
  const allowedIds = new Set(assigneeLinks.map((link) => link.userId));
  const invalidAssignees = assignUserIds.filter((id) => !allowedIds.has(id));
  if (invalidAssignees.length) {
    return error(403, "Cannot assign users outside your organisation");
  }

  const transaction = await DB.transaction();
  try {
    const newTask = {
      title: title.trim(),
      description,
      roleId,
      categoryId,
      isSystemTask: false,
      defaultFrequency: defaultFrequency || null,
    };
    const task = await Task.create(newTask, { transaction });
    if (checklist?.length) {
      const checklistData = checklist.map((item) => ({
        taskId: task.id,
        question: item.question,
        category: item.category,
        showRadio: item.showRadio,
        showDate: item.showDate,
        showTime: item.showTime,
        fieldOneTitle: item.fieldOneTitle,
        fieldTwoTitle: item.fieldTwoTitle,
        radioValue: "N/A",
      }));
      await TaskChecklist.bulkCreate(checklistData, { transaction });
    }
    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId: loggedUser.orgId },
    });

    let finalStatusId;
    if (statusId) {
      const providedStatus = orgStatuses.find((x) => x.id === statusId);
      if (providedStatus) {
        finalStatusId = statusId;
      } else {
        const upcomingStatus = orgStatuses.find((x) => x.key === "upcoming");
        finalStatusId = upcomingStatus?.id;
      }
    } else {
      const upcomingStatus = orgStatuses.find((x) => x.key === "upcoming");
      finalStatusId = upcomingStatus?.id;
    }

    if (!finalStatusId && orgStatuses.length > 0) {
      finalStatusId = orgStatuses[0].id;
    }
    let priorityId = incomingPriorityId;
    if (!priorityId) {
      const orgPriorities = await OrganisationPriority.findAll({
        where: { organisationId: loggedUser.orgId },
      });
      priorityId = orgPriorities.find((x) => x.key === "medium")?.id;
    }

    const userTasksData = assignUserIds.map((assigneeId) => ({
      userId: assigneeId,
      organisationId: loggedUser.orgId,
      dueDate: dueDate ? new Date(dueDate) : null,
      taskId: task.id,
      title,
      documentLink: "",
      frequency: defaultFrequency || null,
      priorityId,
      statusId: finalStatusId,
      assignedBy: loggedUser.userId,
    }));

    const userTasks = await UserTask.bulkCreate(userTasksData, {
      transaction,
      returning: true,
    });

    const assigneeIdsForEmail = assignUserIds.filter(
      (id) => id !== loggedUser.userId
    );
    if (assigneeIdsForEmail.length) {
      const assignees = await User.findAll({
        where: { id: assigneeIdsForEmail },
      });
      for (const assignee of assignees) {
        if (assignee?.email) {
          await sendTaskAssignmentEmail({
            email: assignee.email,
            name: assignee.fullName,
            taskTitle: title,
          });
        }
      }
    }

    if (checklist?.length) {
      const checklistData = [];
      userTasks.forEach((userTask) => {
        checklistData.push(
          ...checklist.map((item) => ({
            userTaskId: userTask.id,
            question: item.question,
            category: item.category,
            showRadio: item.showRadio,
            showDate: item.showDate,
            showTime: item.showTime,
            fieldOneTitle: item.fieldOneTitle,
            fieldTwoTitle: item.fieldTwoTitle,
            radioValue: "N/A",
          }))
        );
      });
      if (checklistData.length) {
        await UserTaskChecklist.bulkCreate(checklistData, { transaction });
      }
    }
    await transaction.commit();
    return success("Task Added");
  } catch (err) {
    await transaction.rollback();
    return error(500, err);
  }
};
export const uploadBulkTasks = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { tasks } = JSON.parse(body);

  if (!Array.isArray(tasks) || !tasks.length) {
    throw createError({ message: "No tasks provided" });
  }

  const results = [];

  const validTasks = [];
  const invalidTasks = [];

  tasks.forEach((t, index) => {
    const {
      title,
      description,
      roleId,
      categoryId,
      defaultFrequency,
      userId,
      priorityId,
      checklist,
      dueDate,
    } = t;

    if (!title || !categoryId) {
      invalidTasks.push({
        index,
        title,
        status: "failed",
        message: "Required fields missing",
      });
    } else {
      validTasks.push({
        index,
        data: t,
        title,
        description,
        roleId,
        categoryId,
        defaultFrequency: defaultFrequency || null,
        userId,
        priorityId,
        checklist,
        dueDate,
      });
    }
  });

  results.push(...invalidTasks);

  if (validTasks.length === 0) {
    return {
      code: 0,
      message: `0 tasks added successfully, ${invalidTasks.length} failed`,
      results,
    };
  }

  const transaction = await DB.transaction();
  try {
    const taskData = validTasks.map((t) => ({
      title: t.title,
      description: t.description,
      roleId: t.roleId,
      categoryId: t.categoryId,
      isSystemTask: true,
      defaultFrequency: t.defaultFrequency,
    }));

    const createdTasks = await Task.bulkCreate(taskData, {
      transaction,
      returning: true,
    });

    const allTaskChecklistData = [];
    validTasks.forEach((t, taskIndex) => {
      if (t.checklist?.length) {
        const taskId = createdTasks[taskIndex].id;
        const checklistData = t.checklist.map((item) => ({
          taskId,
          question: item.question,
          category: item.category,
          showRadio: item.showRadio,
          showDate: item.showDate,
          showTime: item.showTime,
          fieldOneTitle: item.fieldOneTitle,
          fieldTwoTitle: item.fieldTwoTitle,
          radioValue: "N/A",
        }));
        allTaskChecklistData.push(...checklistData);
      }
    });

    if (allTaskChecklistData.length > 0) {
      await TaskChecklist.bulkCreate(allTaskChecklistData, { transaction });
    }

    const tasksWithUsers = validTasks.filter((t) => t.userId);

    if (tasksWithUsers.length > 0) {
      const targetUserIds = [
        ...new Set(tasksWithUsers.map((t) => t.userId).filter(Boolean)),
      ];
      const userOrgLinks = await UserOrganisation.findAll({
        where: { organisationId: loggedUser.orgId, userId: targetUserIds },
      });
      const allowedIds = new Set(userOrgLinks.map((link) => link.userId));
      const invalidAssignees = targetUserIds.filter(
        (id) => !allowedIds.has(id)
      );
      if (invalidAssignees.length) {
        throw createError({
          statusCode: 403,
          message: "Cannot assign users outside your organisation",
        });
      }

      const orgStatuses = await OrganisationStatus.findAll({
        where: { organisationId: loggedUser.orgId },
      });
      const progressStatusId = orgStatuses.find(
        (x) => x.key === "progress"
      )?.id;

      const userTaskData = tasksWithUsers.map((t, userTaskIndex) => {
        const taskIndex = validTasks.findIndex((vt) => vt.index === t.index);
        return {
          userId: t.userId,
          organisationId: loggedUser.orgId,
          dueDate: t.dueDate,
          taskId: createdTasks[taskIndex].id,
          title: t.title,
          documentLink: "",
          frequency: t.defaultFrequency,
          priorityId: t.priorityId,
          statusId: progressStatusId,
          assignedBy: loggedUser.userId,
        };
      });

      const existingAssignments = await UserTask.findAll({
        where: { userId: userIds },
        attributes: ["userId", [fn("COUNT", col("id")), "count"]],
        group: ["userId"],
      });
      const existingCounts = new Map(
        existingAssignments.map((row) => [
          row.userId,
          Number(row.get("count") || 0),
        ])
      );

      const createdUserTasks = await UserTask.bulkCreate(userTaskData, {
        transaction,
        returning: true,
      });

      const allUserTaskChecklistData = [];
      tasksWithUsers.forEach((t, userTaskIndex) => {
        if (t.checklist?.length) {
          const userTaskId = createdUserTasks[userTaskIndex].id;
          const checklistData = t.checklist.map((item) => ({
            userTaskId,
            question: item.question,
            category: item.category,
            showRadio: item.showRadio,
            showDate: item.showDate,
            showTime: item.showTime,
            fieldOneTitle: item.fieldOneTitle,
            fieldTwoTitle: item.fieldTwoTitle,
            radioValue: "N/A",
          }));
          allUserTaskChecklistData.push(...checklistData);
        }
      });

      if (allUserTaskChecklistData.length > 0) {
        await UserTaskChecklist.bulkCreate(allUserTaskChecklistData, {
          transaction,
        });
      }

      const userIds = [...new Set(tasksWithUsers.map((t) => t.userId))];
      const users = await User.findAll({
        where: { id: userIds },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const tasksByUserId = tasksWithUsers.reduce((acc, task) => {
        if (!task.userId) return acc;
        if (!acc[task.userId]) acc[task.userId] = [];
        acc[task.userId].push(task);
        return acc;
      }, {});

      for (const [userId, assignedTasks] of Object.entries(tasksByUserId)) {
        const numericUserId = Number(userId);
        const user = userMap.get(numericUserId);
        if (!user?.email) continue;

        const hadExistingTasks = (existingCounts.get(numericUserId) || 0) > 0;
        if (!hadExistingTasks && assignedTasks.length > 1) {
          await sendTaskAssignmentEmail({
            email: user.email,
            name: user.fullName,
            taskTitle: `${assignedTasks.length} default tasks`,
          });
          continue;
        }

        for (const task of assignedTasks) {
          await sendTaskAssignmentEmail({
            email: user.email,
            name: user.fullName,
            taskTitle: task.title,
          });
        }
      }
    }

    await transaction.commit();

    validTasks.forEach((t) => {
      results.push({ index: t.index, title: t.title, status: "success" });
    });
  } catch (err) {
    await transaction.rollback();

    validTasks.forEach((t) => {
      results.push({
        index: t.index,
        title: t.title,
        status: "failed",
        message: err.message,
      });
    });
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const failCount = results.length - successCount;

  return {
    code: 0,
    message: `${successCount} tasks added successfully, ${failCount} failed`,
    results,
  };
};

export const teamTasksCounts = async (event) => {
  const loggedUser = event.context.user;
  ensureManagerOrOwner(loggedUser);
  const organisationId = Number(loggedUser.orgId);
  try {
    if (!organisationId) {
      return createError({ message: "organisationId is required" });
    }
    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });
    const orgUsers = await UserOrganisation.findAll({
      where: { 
        organisationId: organisationId,
        status: "Active", // Only show active organization members
      },
      attributes: ["id"],
      include: {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "photo", "email", "roleId"],
        where: { status: "Active" },
        required: true, // INNER JOIN - only include users that exist and are Active
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["id", "title", "color"],
          },
        ],
      },
    });
    const users = orgUsers.map((el) => el.user).filter(Boolean);

    const currentUserId = loggedUser.userId;
    const currentUserIncluded = users.some((u) => u.id === currentUserId);

    if (!currentUserIncluded && currentUserId) {
      const userOrg = await UserOrganisation.findOne({
        where: {
          userId: currentUserId,
          organisationId: organisationId,
          status: "Active",
        },
      });

      if (userOrg) {
        const currentUser = await User.findOne({
          where: { id: currentUserId },
          attributes: ["id", "fullName", "photo", "email", "roleId"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["id", "title", "color"],
            },
          ],
        });

        if (currentUser) {
          users.push(currentUser);
        }
      }
    }
    const results = await Promise.all(
      users.map(async (user) => {
        const [pending, completed, todo] = await Promise.all([
          UserTask.count({
            where: {
              userId: user.id,
              organisationId,
              statusId: orgStatuses.find((x) => x.key === "progress").id,
            },
          }),
          UserTask.count({
            where: {
              userId: user.id,
              organisationId,
              statusId: orgStatuses.find((x) => x.key === "completed").id,
            },
          }),
          UserTask.count({
            where: {
              userId: user.id,
              organisationId,
              statusId: orgStatuses.find((x) => x.key === "todo").id,
            },
          }),
        ]);
        return {
          user,
          taskStats: {
            pending,
            completed,
            todo,
          },
        };
      })
    );
    return success(results);
  } catch (err) {
    return error(500, err.message);
  }
};

export const createUserTaskChecklist = async (event) => {
  const body = await readBody(event);
  const checklist = JSON.parse(body);
  const requiredFields = ["userTaskId", "question"];
  for (const field of requiredFields) {
    if (!checklist[field]) {
      throw createError({ message: `${field} is required` });
    }
  }
  try {
    const newchecklist = await UserTaskChecklist.create(checklist);
    return success(newchecklist);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateUserTaskChecklist = async (event) => {
  const body = await readBody(event);
  const taskChecklist = JSON.parse(body);

  if (!taskChecklist.id) {
    throw createError({ message: "Checklist id required" });
  }

  if (Object.keys(taskChecklist).length === 0) {
    throw createError({
      message: "At least one field to update must be provided",
    });
  }

  try {
    const checklist = await UserTaskChecklist.findByPk(taskChecklist.id);
    if (!checklist) throw createError({ message: "Checklist nor found " });

    await checklist.update(taskChecklist);
    return success("Updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const deleteUserTaskChecklist = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  if (!id) {
    throw createError({ message: "Checklist id required" });
  }
  try {
    const checklist = await UserTaskChecklist.findByPk(id);
    if (!checklist) throw createError({ message: "Checklist not found" });
    await checklist.destroy();
    return success("Deleted");
  } catch (err) {
    return error(500, err.message);
  }
};

export const groupTeamTasksByTaskId = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  ensureManagerOrOwner(loggedUser);
  const body = await parseJsonBody(event);
  const {
    categoryId,
    frequency,
    priority,
    user,
    page = 1,
    pageSize = 10,
    excludeSelf = true,
    search,
  } = body;

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
  const offset = (currentPage - 1) * perPage;

  let categoryIds = [];
  if (categoryId) {
    const categories = await TaskCategory.findAll({
      where: {
        [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
        isDeleted: false,
      },
      attributes: ["id"],
    });
    categoryIds = categories.map((c) => c.id);
    if (!categoryIds.length) {
      return success({ page: currentPage, pageSize: perPage, total: 0, statuses: [] });
    }
  } else {
    const allCategories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: ["id"],
    });
    categoryIds = allCategories.map((c) => c.id);
    if (!categoryIds.length) {
      return success({ page: currentPage, pageSize: perPage, total: 0, statuses: [] });
    }
  }

  const orgStatuses = await OrganisationStatus.findAll({
    where: { organisationId },
    attributes: ["id", "key", "name", "color"],
    order: [["id", "ASC"]],
  });

  const statusGroups = [];
  const shouldExcludeSelf = !user && excludeSelf !== false;

  const buildAssignmentWhere = (archived = false, statusId = null) => {
    const where = { organisationId, isArchieved: archived };
    if (!archived && statusId) where.statusId = statusId;
    if (frequency) where["frequency"] = frequency;
    if (priority) where["priorityId"] = priority;
    if (user) where["userId"] = user;
    if (shouldExcludeSelf) {
      if (where.userId) {
        where[Op.and] = [{ userId: where.userId }, { userId: { [Op.ne]: loggedUser.userId } }];
        delete where.userId;
      } else {
        where.userId = { [Op.ne]: loggedUser.userId };
      }
    }
    return where;
  };

  const taskWhere = categoryIds.length
    ? { categoryId: { [Op.in]: categoryIds } }
    : {};
  if (search) {
    taskWhere[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const taskCategoryInclude = {
    model: TaskCategory,
    as: "category",
    where: { isDeleted: false },
    attributes: ["id", "name"],
  };

  const buildTasksResponse = (tasks) =>
    tasks.map((task) => {
      const assignments = task.userTasks || [];
      const firstAssignment = assignments[0];
      
      // Check if any assignment was made by Practice Profile (Admin)
      const hasPracticeProfileAssignment = assignments.some((assignment) => {
        const assignerRoleId = assignment.assigner?.roleId;
        return assignerRoleId ? isManagerOrOwner(assignerRoleId) : false;
      });

      return {
        taskId: task.id,
        id: firstAssignment?.id || task.id,
        title: firstAssignment?.title || task.title,
        description: task.description,
        frequency: firstAssignment?.frequency ?? task.defaultFrequency,
        categoryId: task.categoryId,
        category: task.category,
        priorityId: firstAssignment?.priorityId,
        statusId: firstAssignment?.statusId,
        priority: firstAssignment?.priority,
        status: firstAssignment?.status,
        comments: firstAssignment?.comments,
        dueDate: firstAssignment?.dueDate,
        createdAt: firstAssignment?.createdAt || task.createdAt,
        updatedAt: firstAssignment?.updatedAt || task.updatedAt,
        taskDetails: task,
        isArchieved: firstAssignment?.isArchieved || false,
        isAssignedByPracticeProfile: hasPracticeProfileAssignment,
        assignedUsers: assignments
          .map((assignment) => ({
            id: assignment.assignedUser?.id,
            fullName: assignment.assignedUser?.fullName,
            email: assignment.assignedUser?.email,
            photo: assignment.assignedUser?.photo,
            status: assignment.status,
            userTaskId: assignment.id,
            isAssignedByPracticeProfile: assignment.assigner?.roleId ? isManagerOrOwner(assignment.assigner.roleId) : false,
          }))
          .filter((u) => u.id),
      };
    });

  for (const status of orgStatuses) {
    const { rows, count } = await Task.findAndCountAll({
      where: taskWhere,
      include: [
        taskCategoryInclude,
        {
          model: UserTask,
          as: "userTasks",
          where: buildAssignmentWhere(false, status.id),
          required: true,
          attributes: [
            "id",
            "userId",
            "organisationId",
            "taskId",
            "priorityId",
            "statusId",
            "frequency",
            "dueDate",
            "title",
            "comments",
            "documentLink",
            "isArchieved",
            "createdAt",
            "updatedAt",
          ],
          include: [
            {
              model: OrganisationPriority,
              as: "priority",
              attributes: ["id", "key", "name", "color"],
            },
            {
              model: OrganisationStatus,
              as: "status",
              attributes: ["id", "key", "name", "color"],
            },
            { model: UserTaskAttachment, as: "attachments", required: false },
            {
              model: UserTaskCustomField,
              as: "customFields",
              required: false,
              include: [
                {
                  model: TaskCustomColumnDefinition,
                  as: "columnDefinition",
                  where: {
                    createdBy: loggedUser.userId,
                    isActive: true,
                  },
                  required: false,
                },
              ],
            },
            {
              model: User,
              as: "assignedUser",
              attributes: ["id", "fullName", "email", "photo"],
            },
            {
              model: User,
              as: "assigner",
              attributes: ["id", "roleId"],
              required: false,
            },
          ],
        },
      ],
      distinct: true,
      limit: perPage,
      offset,
      order: [["createdAt", "DESC"]],
    });

    statusGroups.push({
      status: status.key,
      total: count,
      page: currentPage,
      pageSize: perPage,
      tasks: buildTasksResponse(rows),
    });
  }

  const { rows: archivedRows, count: archivedCount } = await Task.findAndCountAll({
    where: taskWhere,
    include: [
      taskCategoryInclude,
      {
        model: UserTask,
        as: "userTasks",
        where: buildAssignmentWhere(true),
        required: true,
        attributes: [
          "id",
          "userId",
          "organisationId",
          "taskId",
          "priorityId",
          "statusId",
          "frequency",
          "dueDate",
          "title",
          "comments",
          "documentLink",
          "isArchieved",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: OrganisationPriority,
            as: "priority",
            attributes: ["id", "key", "name", "color"],
          },
          {
            model: OrganisationStatus,
            as: "status",
            attributes: ["id", "key", "name", "color"],
          },
          { model: UserTaskAttachment, as: "attachments", required: false },
          {
            model: User,
            as: "assignedUser",
            attributes: ["id", "fullName", "email", "photo"],
          },
        ],
      },
    ],
    distinct: true,
    limit: perPage,
    offset,
    order: [["updatedAt", "DESC"]],
  });

  statusGroups.push({
    status: "archived",
    total: archivedCount,
    page: currentPage,
    pageSize: perPage,
    tasks: buildTasksResponse(archivedRows),
  });

  const total = statusGroups.reduce((sum, s) => sum + Number(s.total || 0), 0);

  return success({
    page: currentPage,
    pageSize: perPage,
    total,
    statuses: statusGroups,
  });
};


export const getUserTaskDetails = async (event) => {
  const body = await readBody(event);
  const { userTaskId } = JSON.parse(body);

  if (!userTaskId) {
    throw createError({ message: "userTaskId is required" });
  }
  try {
    const task = await UserTask.findOne({
      where: { id: userTaskId },
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "photo"],
          as: "assignedUser",
          include: {
            model: Role,
            as: "role",
            attributes: ["id", "title"],
          },
        },
        {
          model: Task,
          as: "taskDetails",
          include: [
            {
              model: TaskCategory,
              as: "category",
              where: { isDeleted: false },
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: OrganisationStatus,
          as: "status",
          attributes: ["id", "name", "color", "key"],
        },
        {
          model: OrganisationPriority,
          as: "priority",
          attributes: ["id", "name", "color", "key", "sortOrder"],
        },
        {
          model: UserTaskChecklist,
          as: "userTaskChecklist",
        },
        {
          model: UserTaskAttachment,
          as: "attachments",
        },
        {
          model: UserTaskComment,
          as: "taskComments",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["id", "fullName", "photo", "email"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!task) throw createError({ message: "task not found" });
    else return success(task);
  } catch (err) {
    return error(500, err);
  }
};
export const addTaskChecklist = async (event) => {
  const body = await readBody(event);
  const {
    taskId,
    question,
    category,
    fieldOneTitle,
    fieldTwoTitle,
    showRadio = false,
    showTime = false,
    showDate = false,
    radioValue = "N/A",
  } = body;
  if (!taskId || !question) {
    throw createError({
      message: "taskId, organisationId, and question are required",
    });
  }
  const transaction = await DB.transaction();
  try {
    await TaskChecklist.create(
      {
        taskId,
        question,
        category,
        fieldOneTitle,
        fieldTwoTitle,
        showRadio,
        showTime,
        showDate,
        radioValue,
      },
      { transaction }
    );
    const userTasks = await UserTask.findAll({
      where: {
        taskId,
      },
    });
    const userChecklistPayload = userTasks.map((task) => ({
      userTaskId: task.id,
      question,
      category,
      fieldOneTitle,
      fieldTwoTitle,
      showRadio,
      showTime,
      showDate,
      radioValue,
    }));
    if (userChecklistPayload.length > 0) {
      await UserTaskChecklist.bulkCreate(userChecklistPayload, { transaction });
    }
    await transaction.commit();
    return success("created");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const updateTaskChecklist = async (event) => {
  const body = await readBody(event);
  const {
    taskChecklistId,
    taskId,
    organisationId,
    question,
    category,
    fieldOneTitle,
    fieldTwoTitle,
    showRadio = false,
    showTime = false,
    showDate = false,
    radioValue = "N/A",
  } = body;
  if (!taskChecklistId || !taskId || !organisationId || !question) {
    throw createError({
      message:
        "taskChecklistId, taskId, organisationId and question are required",
    });
  }
  const transaction = await DB.transaction();
  try {
    await TaskChecklist.update(
      {
        question,
        category,
        fieldOneTitle,
        fieldTwoTitle,
        showRadio,
        showTime,
        showDate,
        radioValue,
      },
      {
        where: { id: taskChecklistId },
        transaction,
      }
    );
    const userTasks = await UserTask.findAll({
      where: {
        taskId,
        organisationId,
      },
    });
    for (const task of userTasks) {
      await UserTaskChecklist.update(
        {
          question,
          category,
          fieldOneTitle,
          fieldTwoTitle,
          showRadio,
          showTime,
          showDate,
          radioValue,
        },
        {
          where: {
            userTaskId: task.id,
            question: question, // optional: match existing question
          },
          transaction,
        }
      );
    }
    await transaction.commit();
    return success("Checklist updated successfully and synced to user tasks");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const deleteTaskChecklist = async (event) => {
  const body = await readBody(event);

  const { taskChecklistId, taskId, organisationId } = body;

  if (!taskChecklistId || !taskId || !organisationId) {
    throw createError({
      message: "taskChecklistId, taskId and organisationId are required",
    });
  }
  const transaction = await DB.transaction();
  try {
    const checklist = await TaskChecklist.findByPk(taskChecklistId);

    if (!checklist) {
      throw createError({ message: "Task checklist not found" });
    }
    await TaskChecklist.destroy({
      where: { id: taskChecklistId },
      transaction,
    });

    const userTasks = await UserTask.findAll({
      where: {
        taskId,
        organisationId,
      },
    });
    for (const task of userTasks) {
      await UserTaskChecklist.destroy({
        where: {
          userTaskId: task.id,
        },
        transaction,
      });
    }

    await transaction.commit();
    return success(
      "Checklist deleted successfully from task and all user tasks"
    );
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const getCategories = async (event) => {
  const loggedUser = event.context.user
  try {
    const categories = await TaskCategory.findAll({
      where: {
        isDeleted: false,
        [Op.or]: [
          { organisationId: null },
          { organisationId: loggedUser.orgId },
        ],
      },
      attributes: {
        include: [[fn("COUNT", col("tasks.id")), "taskCount"]],
      },
      include: [
        {
          model: Task,
          as: "tasks",
          attributes: [],
          required: false, // important: allows categories with 0 tasks
          where: {
            [Op.or]: [
              { isSystemTask: false },
              { isSystemTask: { [Op.is]: null } },
            ],
          },
        },
      ],
      group: ["TaskCategories.id"],
      order: [["id", "ASC"]],
    });
    return success(categories);
  } catch (err) {
    return error(500, err.message);
  }
};


export const getCategoriesforPool = async (event) => {
  try {
    const categories = await TaskCategory.findAll({
      where: { 
        isDeleted: false,
        organisationId: { [Op.is]: null }
      },
      attributes: {
        include: [[fn("COUNT", col("tasks.id")), "taskCount"]],
      },
      include: [
        {
          model: Task,
          as: "tasks",
          attributes: [],
          required: false, // important: allows categories with 0 tasks
          where: {
            isSystemTask: true
          },
        },
      ],
      group: ["TaskCategories.id"],
      order: [["id", "ASC"]],
    });

    return success(categories);
  } catch (err) {
    return error(500, err.message);
  }
};



export const myTasksCountByCategory = async (event) => {
  try {
    const loggedUser = event.context.user;

    const defaultCategoryNames = [
      "Staff Management",
      "Marketing",
      "Finance",
      "HR",
    ];

    const allCategories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: ["id", "name", "color", "parentId"],
      raw: true,
    });

    const categoryMap = new Map();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));

    const userTasks = await UserTask.findAll({
      where: {
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
        isArchieved: false,
      },
      include: [
        {
          model: Task,
          as: "taskDetails",
          include: [
            {
              model: TaskCategory,
              as: "category",
              where: { isDeleted: false },
              attributes: ["id", "parentId"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    const parentCounts = {};

    for (const task of userTasks) {
      const cat = task.taskDetails?.category;
      if (!cat) continue;

      let currentCat = categoryMap.get(cat.id);
      if (!currentCat) continue;

      while (currentCat.parentId) {
        const parent = categoryMap.get(currentCat.parentId);
        if (!parent) {
          currentCat = null;
          break;
        }
        currentCat = parent;
      }

      if (!currentCat) continue;

      if (!parentCounts[currentCat.id]) {
        parentCounts[currentCat.id] = {
          categoryId: currentCat.id,
          categoryName: currentCat.name,
          color: currentCat.color,
          taskCount: 0,
        };
      }

      parentCounts[currentCat.id].taskCount += 1;
    }

    let result = Object.values(parentCounts);

    for (const defaultName of defaultCategoryNames) {
      const exists = result.some((c) => c.categoryName === defaultName);

      if (!exists) {
        const cat = allCategories.find((c) => c.name === defaultName);

        if (cat) {
          result.push({
            categoryId: cat.id,
            categoryName: cat.name,
            color: cat.color,
            taskCount: 0,
          });
        }
      }
    }

    return success(result);
  } catch (err) {
    return error("Something went wrong while counting tasks.");
  }
};

export const teamTasksCountByCategory = async (event) => {
  try {
    const loggedUser = event.context.user;
    ensureManagerOrOwner(loggedUser);

    const defaultCategoryNames = [
      "Staff Management",
      "Marketing",
      "Finance",
      "HR",
    ];

    const allCategories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: ["id", "name", "color", "parentId"],
      raw: true,
    });

    const categoryMap = new Map();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));

    const teamTasks = await UserTask.findAll({
      where: {
        organisationId: loggedUser.orgId,
        isArchieved: false,
      },
      include: [
        {
          model: Task,
          as: "taskDetails",
          include: [
            {
              model: TaskCategory,
              as: "category",
              where: { isDeleted: false },
              attributes: ["id", "parentId"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    const parentCounts = {};


    for (const task of teamTasks) {
      const cat = task.taskDetails?.category;
      if (!cat) continue;

      let currentCat = categoryMap.get(cat.id);
      if (!currentCat) continue;

      while (currentCat.parentId) {
        const parent = categoryMap.get(currentCat.parentId);
        if (!parent) {
          currentCat = null;
          break;
        }
        currentCat = parent;
      }

      if (!currentCat) continue;

      if (!parentCounts[currentCat.id]) {
        parentCounts[currentCat.id] = {
          categoryId: currentCat.id,
          categoryName: currentCat.name,
          color: currentCat.color,
          taskCount: 0,
        };
      }

      parentCounts[currentCat.id].taskCount += 1;
    }

    let result = Object.values(parentCounts);

    for (const defaultName of defaultCategoryNames) {
      const exists = result.some((c) => c.categoryName === defaultName);

      if (!exists) {
        const cat = allCategories.find((c) => c.name === defaultName);

        if (cat) {
          result.push({
            categoryId: cat.id,
            categoryName: cat.name,
            color: cat.color,
            taskCount: 0,
          });
        }
      }
    }

    return success(result);
  } catch (err) {
    return error(500, err.message);
  }
};


export const getUserTasksStatusWise = async (event) => {
  const loggedUser = event.context.user;
  const body = await parseJsonBody(event);
  const {
    categoryId,
    frequency,
    priority,
    search,
    status,
    dueDateFilter,
    page = 1,
    pageSize = 10,
  } = body;

  try {
    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    const offset = (currentPage - 1) * perPage;

    const categories = await TaskCategory.findAll({
      where: {
        [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
        isDeleted: false,
      },
      attributes: ["id"],
    });

    const categoryIds = categories.map((c) => c.id);
    if (!categoryIds.length) {
      return success({ page: currentPage, pageSize: perPage, total: 0, statuses: [] });
    }

    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId: loggedUser.orgId },
      attributes: ["id", "key", "name", "color"],
      order: [["id", "ASC"]],
    });
    const normalizedStatusFilter = Array.isArray(status)
      ? status.map((s) => String(s).toLowerCase())
      : status
      ? [String(status).toLowerCase()]
      : null;

    const filteredOrgStatuses = normalizedStatusFilter
      ? orgStatuses.filter((s) => normalizedStatusFilter.includes((s.key || "").toLowerCase()))
      : orgStatuses;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const dueDateWhere = {};
    if (dueDateFilter === "overdue") {
      dueDateWhere.dueDate = { [Op.lt]: startOfToday };
    } else if (dueDateFilter === "today") {
      dueDateWhere.dueDate = { [Op.between]: [startOfToday, endOfToday] };
    } else if (dueDateFilter === "week") {
      dueDateWhere.dueDate = { [Op.between]: [startOfToday, endOfWeek] };
    }

    const baseWhere = {
      userId: loggedUser.userId,
      organisationId: loggedUser.orgId,
    };
    if (frequency) baseWhere["frequency"] = frequency;
    if (priority) baseWhere["priorityId"] = priority;
    if (search) {
      baseWhere[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { comments: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const taskInclude = {
      model: Task,
      as: "taskDetails",
      where: { categoryId: { [Op.in]: categoryIds } },
      required: true,
      include: [
        {
          model: TaskCategory,
          as: "category",
          where: { isDeleted: false },
        },
      ],
    };

    const commonInclude = [
      taskInclude,
      {
        model: OrganisationPriority,
        as: "priority",
        attributes: ["id", "key", "name", "color"],
      },
      {
        model: OrganisationStatus,
        as: "status",
        attributes: ["id", "key", "name", "color"],
      },
      {
        model: UserTaskAttachment,
        as: "attachments",
        attributes: ["id", "title", "link", "type"],
      },
        {
          model: UserTaskCustomField,
          as: "customFields",
          required: false,
          include: [
            {
              model: TaskCustomColumnDefinition,
              as: "columnDefinition",
              where: {
                createdBy: loggedUser.userId,
                isActive: true,
              },
              required: false,
            },
          ],
        },
      {
        model: User,
        as: "assigner",
        attributes: ["id", "roleId"],
        required: false,
      },
    ];

    const statuses = [];

    for (const status of filteredOrgStatuses) {
      const where = { ...baseWhere, isArchieved: false, statusId: status.id, ...dueDateWhere };
      const { rows, count } = await UserTask.findAndCountAll({
        where,
        include: commonInclude,
        order: [["createdAt", "DESC"]],
        limit: perPage,
        offset,
        distinct: true,
      });

      // Add isAssignedByPracticeProfile flag to each task
      const tasksWithFlags = rows.map((task) => {
        const taskData = task.toJSON ? task.toJSON() : task;
        const assignerRoleId = taskData.assigner?.roleId;
        taskData.isAssignedByPracticeProfile = assignerRoleId ? isManagerOrOwner(assignerRoleId) : false;
        return taskData;
      });

      statuses.push({
        status: status.key,
        total: count,
        page: currentPage,
        pageSize: perPage,
        tasks: tasksWithFlags,
      });
    }

    const { rows: archivedRows, count: archivedCount } =
      await UserTask.findAndCountAll({
        where: { ...baseWhere, isArchieved: true, ...dueDateWhere },
        include: commonInclude,
        order: [["updatedAt", "DESC"]],
        limit: perPage,
        offset,
        distinct: true,
      });

    // Add isAssignedByPracticeProfile flag to archived tasks
    const archivedTasksWithFlags = archivedRows.map((task) => {
      const taskData = task.toJSON ? task.toJSON() : task;
      const assignerRoleId = taskData.assigner?.roleId;
      taskData.isAssignedByPracticeProfile = assignerRoleId ? isManagerOrOwner(assignerRoleId) : false;
      return taskData;
    });

    statuses.push({
      status: "archived",
      total: archivedCount,
      page: currentPage,
      pageSize: perPage,
      tasks: archivedTasksWithFlags,
    });

    const total = statuses.reduce((sum, s) => sum + Number(s.total || 0), 0);

    return success({
      page: currentPage,
      pageSize: perPage,
      total,
      statuses,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const getGeneralTasksByCategory = async (event) => {
  const body = await readBody(event);
  const { categoryId } = JSON.parse(body);
  if (!categoryId) {
    throw createError({ message: "CategoryId is required" });
  }
  try {
    const tasks = await Task.findAll({
      where: { categoryId, isSystemTask: true },
      include: {
        model: Role,
        as: "role",
        attributes: ["id", "title"],
      },
    });
    return success(tasks);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getTeamTaskStatsByStatusAndCategory = async (event) => {
  try {
    const loggedUser = event.context.user;
    ensureManagerOrOwner(loggedUser);
    const organisationId = Number(loggedUser.orgId);

    await autoArchiveCompletedTasks(organisationId);

    const query = getQuery(event) || {};
    let categoryId = query.categoryId ? Number(query.categoryId) : null;

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });

    const statusMap = {};
    orgStatuses.forEach((s) => {
      statusMap[s.key] = s.id;
    });

    let categoryIds = [];
    if (categoryId) {
      const categories = await TaskCategory.findAll({
        where: {
          [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
          isDeleted: false,
        },
        attributes: ["id"],
      });
      categoryIds = categories.map((c) => c.id);
      if (categoryIds.length === 0) {
        return success({
          completed: 0,
          overdue: 0,
          progress: 0,
          todo: 0,
          upcoming: 0,
        });
      }
    }

    const baseWhere = {
      organisationId,
      isArchieved: false,
    };

    const taskInclude =
      categoryIds.length > 0
        ? {
            model: Task,
            as: "taskDetails",
            where: { categoryId: { [Op.in]: categoryIds } },
            required: true,
            include: [
              {
                model: TaskCategory,
                as: "category",
                where: { isDeleted: false },
                required: true,
              },
            ],
          }
        : {
            model: Task,
            as: "taskDetails",
            required: true,
            include: [
              {
                model: TaskCategory,
                as: "category",
                where: { isDeleted: false },
                required: true,
              },
            ],
          };

    const [completed, progress, todo] = await Promise.all([
      statusMap.completed
        ? UserTask.count({
            where: {
              ...baseWhere,
              statusId: statusMap.completed,
            },
            include: [taskInclude],
            distinct: true,
          })
        : 0,
      statusMap.progress
        ? UserTask.count({
            where: {
              ...baseWhere,
              statusId: statusMap.progress,
            },
            include: [taskInclude],
            distinct: true,
          })
        : 0,
      (statusMap.todo || statusMap.upcoming)
        ? UserTask.count({
            where: {
              ...baseWhere,
              statusId: statusMap.todo || statusMap.upcoming,
            },
            include: [taskInclude],
            distinct: true,
          })
        : 0,
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueWhere = {
      ...baseWhere,
      dueDate: { [Op.lt]: today },
    };

    if (statusMap.completed) {
      overdueWhere.statusId = { [Op.ne]: statusMap.completed };
    }

    const overdue = await UserTask.count({
      where: overdueWhere,
      include: [taskInclude],
      distinct: true,
    });

    return success({
      completed: completed || 0,
      overdue: overdue || 0,
      progress: progress || 0,
      todo: todo || 0,
      upcoming: todo || 0, // Keep for backward compatibility
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const bulkAddChecklistsByTitle = async (event) => {
  const loggedUser = event.context.user;
  ensureManagerOrOwner(loggedUser);
  const body = await readBody(event);
  let rows = body?.rows;
  if (!rows) {
    try { const parsed = JSON.parse(typeof body === 'string' ? body : '{}'); rows = parsed.rows; } catch (_) {}
  }
  if (!Array.isArray(rows) || !rows.length) {
    return error(400, 'rows array is required');
  }
  const results = [];
  const transaction = await DB.transaction();
  try {
    for (const row of rows) {
      const taskTitle = (row?.taskTitle || '').trim();
      const items = Array.isArray(row?.items) ? row.items : [];
      if (!taskTitle || !items.length) {
        results.push({ taskTitle, status: 'failed', message: 'Missing taskTitle or items' });
        continue;
      }
      const task = await Task.findOne({ where: { title: { [Op.iLike]: taskTitle } } });
      if (!task) {
        results.push({ taskTitle, status: 'failed', message: 'Task not found' });
        continue;
      }
      for (const it of items) {
        const question = (it?.question || '').trim();
        if (!question) continue;
        const existing = await TaskChecklist.findOne({ where: { taskId: task.id, question } });
        if (!existing) {
          await TaskChecklist.create({
            taskId: task.id,
            question,
            category: it.category,
            showRadio: Boolean(it.showRadio),
            showDate: Boolean(it.showDate),
            showTime: Boolean(it.showTime),
            fieldOneTitle: it.fieldOneTitle || 'Comments',
            fieldTwoTitle: it.fieldTwoTitle || '',
            radioValue: 'N/A',
          }, { transaction });
        }
      }
      const userTasks = await UserTask.findAll({ where: { taskId: task.id } });
      if (userTasks?.length) {
        for (const ut of userTasks) {
          for (const it of items) {
            const question = (it?.question || '').trim();
            if (!question) continue;
            const existsUT = await UserTaskChecklist.findOne({ where: { userTaskId: ut.id, question } });
            if (!existsUT) {
              await UserTaskChecklist.create({
                userTaskId: ut.id,
                question,
                category: it.category,
                showRadio: Boolean(it.showRadio),
                showDate: Boolean(it.showDate),
                showTime: Boolean(it.showTime),
                fieldOneTitle: it.fieldOneTitle || 'Comments',
                fieldTwoTitle: it.fieldTwoTitle || '',
                radioValue: 'N/A',
              }, { transaction });
            }
          }
        }
      }
      results.push({ taskTitle, status: 'success', created: items.length });
    }
    await transaction.commit();
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.length - successCount;
    return success({ message: `${successCount} updated, ${failCount} failed`, results });
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message || 'Failed to add checklists');
  }
};

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// ============================================
// Custom Column Management Controllers
// ============================================

export const createCustomColumn = async (event) => {
  try {
    const loggedUser = event.context.user;
    const body = await readBody(event);
    const { displayName, dataType, validationRules, defaultValue, dropdownOptions } = JSON.parse(body);

    if (!displayName || !dataType) {
      throw createError({ statusCode: 400, message: "displayName and dataType are required" });
    }

    // Validate dataType
    const validDataTypes = ["text", "number", "date", "boolean", "dropdown"];
    if (!validDataTypes.includes(dataType)) {
      throw createError({ statusCode: 400, message: "Invalid dataType" });
    }

    // Get existing column count for auto-naming
    const existingCount = await TaskCustomColumnDefinition.count({
      where: { createdBy: loggedUser.userId, isActive: true },
    });

    // Generate column name
    const columnName = `additional_column_${existingCount + 1}`;

    // Get max sort order
    const maxSortOrder = await TaskCustomColumnDefinition.max("sortOrder", {
      where: { createdBy: loggedUser.userId, isActive: true },
    });
    const sortOrder = (maxSortOrder || 0) + 1;

    const newColumn = await TaskCustomColumnDefinition.create({
      columnName,
      displayName: displayName || `Additional Column ${existingCount + 1}`,
      dataType,
      sortOrder,
      isActive: true,
      validationRules: validationRules || null,
      defaultValue: defaultValue || null,
      dropdownOptions: dropdownOptions || null,
      createdBy: loggedUser.userId,
    });

    return success(newColumn);
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
};

export const listCustomColumns = async (event) => {
  try {
    const loggedUser = event.context.user;

    const columns = await TaskCustomColumnDefinition.findAll({
      where: { createdBy: loggedUser.userId, isActive: true },
      order: [["sortOrder", "ASC"]],
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    return success(columns);
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
};

export const updateCustomColumn = async (event) => {
  try {
    const loggedUser = event.context.user;
    const body = await readBody(event);
    const { columnId, displayName, dataType, validationRules, defaultValue, dropdownOptions, sortOrder } = JSON.parse(body);

    if (!columnId) {
      throw createError({ statusCode: 400, message: "columnId is required" });
    }

    const column = await TaskCustomColumnDefinition.findOne({
      where: { id: columnId, createdBy: loggedUser.userId, },
    });

    if (!column) {
      throw createError({ statusCode: 404, message: "Custom column not found" });
    }

    // Update fields
    if (displayName !== undefined) column.displayName = displayName;
    if (dataType !== undefined) {
      const validDataTypes = ["text", "number", "date", "boolean", "dropdown"];
      if (!validDataTypes.includes(dataType)) {
        throw createError({ statusCode: 400, message: "Invalid dataType" });
      }
      column.dataType = dataType;
    }
    if (validationRules !== undefined) column.validationRules = validationRules;
    if (defaultValue !== undefined) column.defaultValue = defaultValue;
    if (dropdownOptions !== undefined) column.dropdownOptions = dropdownOptions;
    if (sortOrder !== undefined) column.sortOrder = sortOrder;

    await column.save();

    return success(column);
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
};

export const deleteCustomColumn = async (event) => {
  try {
    const loggedUser = event.context.user;
    const body = await readBody(event);
    const { columnId } = JSON.parse(body);

    if (!columnId) {
      throw createError({ statusCode: 400, message: "columnId is required" });
    }

    const column = await TaskCustomColumnDefinition.findOne({
      where: { id: columnId, createdBy: loggedUser.userId, },
    });

    if (!column) {
      throw createError({ statusCode: 404, message: "Custom column not found" });
    }

    // Soft delete
    column.isActive = false;
    await column.save();

    return success("Custom column deleted successfully");
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
};

export const sendTaskDetailsByEmail = async (event) => {

  try {
    let body = await readBody(event);

    // ✅ Normalize body (string → object)
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { userTaskId, email } = body || {};

    if (!userTaskId || !email) {
      throw createError({
        statusCode: 400,
        message: "userTaskId and email are required",
      });
    }

    // 1️⃣ Assert existence
    const exists = await UserTask.findByPk(userTaskId);
    if (!exists) {
      throw createError({ statusCode: 404, message: "Task not found" });
    }

    // 2️⃣ Load aggregate safely
    const task = await UserTask.findByPk(userTaskId, {
      include: [
        { model: User, as: "assignedUser", attributes: ["fullName", "email"] },
        {
          model: Task,
          as: "taskDetails",
          required: false,
          include: [
            {
              model: TaskCategory,
              as: "category",
              required: false,
              where: { isDeleted: false },
              attributes: ["name"],
            },
          ],
        },
        { model: OrganisationStatus, as: "status", attributes: ["name"] },
        { model: OrganisationPriority, as: "priority", attributes: ["name"] },
        { model: UserTaskChecklist, as: "userTaskChecklist", separate: true },
        { model: UserTaskAttachment, as: "attachments", separate: true },
      ],
    });

    await sendTaskDetailsEmail({
      email,
      taskTitle: task.taskDetails?.title,
      description: task.taskDetails?.description,
      category: task.taskDetails?.category?.name,
      priority: task.priority?.name,
      status: task.status?.name,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : null,
      checklist: task.userTaskChecklist || [],
      attachments: task.attachments || [],
    });

    return success({ message: "Task details email sent successfully" });
  } catch (err) {
    return error(500, err.message || err);
  }
};


