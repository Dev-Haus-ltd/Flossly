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
} from "../models";
import {
  taskCompletedNotification,
  sendTaskUnassignmentEmail,
  sendTaskDueReminderEmail,
  sendTaskCommentNotificationEmail,
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
    // fail silently so listings still return
    console.error("autoArchiveCompletedTasks failed", err.message);
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
    console.log(err.message);
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

    // Check if tasks are already assigned to the target user
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

    // Remove existing assignments for the current user (Check Login Confirmation in today's meeting)

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
    await UserTask.bulkCreate(userTasks);
    const user = await User.findOne({ where: { id: userId } });
    await sendTaskAssignmentEmail({
      email: user.email,
      name: user.fullName,
      taskTitle: userTasks.length === 1 ? userTasks[0].title : "Bulk Tasks",
    });
    return success(userTasks);
    //TODO: Send new task assigned email
  } catch (err) {
    console.log(err);
    return error(500, err.message);
  }
};
const getDueDate = (frequency) => {
  if (!frequency) return null;
  switch (frequency) {
    case "Daily":
      return addDays(new Date(), 1);
    case "Weekly":
      return addDays(new Date(), 7);
    case "Fortnightly":
      return addDays(new Date(), 14);
    case "Monthly":
      return addDays(new Date(), 30);
    case "6 Monthly":
      return addDays(new Date(), 180); // 6 months = ~180 days
    case "Yearly":
      return addDays(new Date(), 365);
    default:
      return null;
  }
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
    // Seed default statuses
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
    } = parsedBody;

    // Validate existence
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

      // Update UserTask fields
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

      // Update Task details if provided
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

      // Skip if assignedUser is null
      if (!assignedUser || !userId) {
        return;
      }

      if (!taskMap.has(task.taskDetails.id)) {
        taskMap.set(task.taskDetails.id, {
          ...task.get(),
          assignedUser: [assignedUser.get()],
        });
      } else {
        // Check if user is already in the assignedUser array to avoid duplicates
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
    await UserTask.update(
      { statusId: statuses.find((x) => x.key === "completed").id },
      {
        where: {
          id: userTasksIds,
          organisationId,
        },
      }
    );
    const user = await User.findOne({ where: { id: loggedUser.userId } });
    await taskCompletedNotification({
      fullName: user.fullName,
      email: user.email,
      task: "Multiple",
    });
    // add reward points
    return success("All tasks compeleted successfully.");
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
    const unauthorized = tasks.filter(
      (ut) =>
        ut.userId !== loggedUser.userId &&
        ut.assignedBy !== loggedUser.userId &&
        !isManagerOrOwner(loggedUser.roleId) // privileged roles are authorized
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

    // Notify assignee via email
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
    if (!commentId) throw createError({ message: "commentId is required" });
    const existing = await UserTaskComment.findOne({
      where: { id: commentId, organisationId },
    });
    if (!existing) throw createError({ message: "Comment not found" });
    const isAuthor = existing.userId === loggedUser.userId;
    const isOrgAdmin = loggedUser.roleId === 1;
    if (!isAuthor && !isOrgAdmin) {
      throw createError({
        statusCode: 403,
        message: "Not authorized to delete this comment",
      });
    }
    await existing.destroy();
    return success("Comment deleted");
  } catch (err) {
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
    console.log(err);
    return error(500, err.message);
  }
};

export const deleteAttachment = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  if (!id) {
    throw createError({ message: "Attachment id required" });
  }
  try {
    const attachment = await UserTaskAttachment.findByPk(id);
    if (!attachment) {
      throw createError({ message: "Attachment not found" });
    }

    // Delete the physical file from the filesystem
    const filePath = path.join(process.cwd(), "public", attachment.link);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn("Failed to delete file from filesystem:", unlinkErr);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the database record
    await attachment.destroy();
    return success("File removed from task");
  } catch (err) {
    console.log(err);
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

  // Enforce same-organisation assignees
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
        showRadio: item.showRadio, // defaulting these
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

    // Determine statusId: use provided statusId, or default to "upcoming"
    let finalStatusId;
    if (statusId) {
      // Validate that the provided statusId exists for this organization
      const providedStatus = orgStatuses.find((x) => x.id === statusId);
      if (providedStatus) {
        finalStatusId = statusId;
      } else {
        // If invalid statusId provided, default to "upcoming"
        const upcomingStatus = orgStatuses.find((x) => x.key === "upcoming");
        finalStatusId = upcomingStatus?.id;
      }
    } else {
      // If no statusId provided, default to "upcoming"
      const upcomingStatus = orgStatuses.find((x) => x.key === "upcoming");
      finalStatusId = upcomingStatus?.id;
    }

    // Fallback: if "upcoming" status not found, use the first available status
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

    // Notify all explicit assignees (exclude auto-assigned creator)
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
            showRadio: item.showRadio, // defaulting these
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
    console.log(err);
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

  // Pre-validate tasks and separate valid from invalid
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

  // Add invalid tasks to results
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
    // --- 1️⃣ Bulk Create Tasks ---
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

    // --- 2️⃣ Bulk Create Task Checklists ---
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

    // --- 3️⃣ Handle User Assignments ---
    const tasksWithUsers = validTasks.filter((t) => t.userId);

    if (tasksWithUsers.length > 0) {
      // Enforce same-organisation assignees
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

      // Get organization statuses once
      const orgStatuses = await OrganisationStatus.findAll({
        where: { organisationId: loggedUser.orgId },
      });
      const progressStatusId = orgStatuses.find(
        (x) => x.key === "progress"
      )?.id;

      // Bulk create UserTasks
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

      const createdUserTasks = await UserTask.bulkCreate(userTaskData, {
        transaction,
        returning: true,
      });

      // --- 4️⃣ Bulk Create UserTask Checklists ---
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

      // --- 5️⃣ Send notification emails (individual operations) ---
      const userIds = [...new Set(tasksWithUsers.map((t) => t.userId))];
      const users = await User.findAll({
        where: { id: userIds },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const t of tasksWithUsers) {
        const user = userMap.get(t.userId);
        if (user?.email) {
          await sendTaskAssignmentEmail({
            email: user.email,
            name: user.fullName,
            taskTitle: t.title,
          });
        }
      }
    }

    await transaction.commit();

    // Add success results for all valid tasks
    validTasks.forEach((t) => {
      results.push({ index: t.index, title: t.title, status: "success" });
    });
  } catch (err) {
    console.error(`❌ Error in bulk task creation:`, err);
    await transaction.rollback();

    // Mark all valid tasks as failed
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
        isActive: true, // Only show active organization members
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

    // Ensure current user is always included, even if not in the filtered list
    const currentUserId = loggedUser.userId;
    const currentUserIncluded = users.some((u) => u.id === currentUserId);

    if (!currentUserIncluded && currentUserId) {
      // Check if current user has a UserOrganisation record for this org
      const userOrg = await UserOrganisation.findOne({
        where: {
          userId: currentUserId,
          organisationId: organisationId,
          isActive: true, // Only check active organization membership
        },
      });

      if (userOrg) {
        // Fetch current user separately if not included (might be inactive status)
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
    console.log(err)
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

  // If categoryId is provided, filter by category; otherwise get all categories
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
        assignedUsers: assignments
          .map((assignment) => ({
            id: assignment.assignedUser?.id,
            fullName: assignment.assignedUser?.fullName,
            email: assignment.assignedUser?.email,
            photo: assignment.assignedUser?.photo,
            status: assignment.status,
            userTaskId: assignment.id,
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
    console.log(err.message);
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

    // Count tasks by parent category
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

    // Ensure default categories exist in result with taskCount 0
    for (const defaultName of defaultCategoryNames) {
      const exists = result.some((c) => c.categoryName === defaultName);

      if (!exists) {
        const cat = allCategories.find((c) => c.name === defaultName);

        // Only add if it exists in DB
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

    // 🔹 Default top-level categories (always included)
    const DEFAULT_PARENT_CATEGORIES = [
      "Staff Management",
      "Marketing",
      "Finance",
      "HR",
    ];

    // Fetch categories
    const allCategories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: ["id", "name", "color", "parentId"],
      raw: true,
    });

    const categoryMap = new Map();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));

    // Map names to IDs for defaults
    const defaultCategoryIds = allCategories
      .filter((c) => DEFAULT_PARENT_CATEGORIES.includes(c.name))
      .map((c) => c.id);

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

    // Prepare initial object with defaults all set to 0
    for (const cat of allCategories) {
      if (DEFAULT_PARENT_CATEGORIES.includes(cat.name)) {
        parentCounts[cat.id] = {
          categoryId: cat.id,
          categoryName: cat.name,
          color: cat.color,
          taskCount: 0, // default 0
        };
      }
    }

    // Group tasks by taskId (avoid double counting)
    const taskMap = new Map();
    for (const userTask of teamTasks) {
      const taskId = userTask.taskId;
      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          category: userTask.taskDetails?.category,
          assignedUserIds: new Set(),
        });
      }
      taskMap.get(taskId).assignedUserIds.add(userTask.userId);
    }

    // Exclude tasks assigned to logged-in user
    const filteredTasks = Array.from(taskMap.values()).filter(
      (task) => !task.assignedUserIds.has(loggedUser.userId)
    );

    // Count tasks by top-level categories
    for (const task of filteredTasks) {
      const cat = task.category;
      if (!cat) continue;

      // Climb to top-level parent
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

      // Only count if this top-level category is in defaults
      if (!parentCounts[currentCat.id]) continue;

      parentCounts[currentCat.id].taskCount += 1;
    }

    // Return ALL default categories (even if 0)
    const result = Object.values(parentCounts);

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

      statuses.push({
        status: status.key,
        total: count,
        page: currentPage,
        pageSize: perPage,
        tasks: rows,
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

    statuses.push({
      status: "archived",
      total: archivedCount,
      page: currentPage,
      pageSize: perPage,
      tasks: archivedRows,
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

// Custom View Functions
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

    // Get organization statuses
    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });

    const statusMap = {};
    orgStatuses.forEach((s) => {
      statusMap[s.key] = s.id;
    });

    // Build category filter - get all category IDs including children
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
          upcoming: 0,
        });
      }
    }

    // Build base where clause
    const baseWhere = {
      organisationId,
      isArchieved: false,
    };

    // Build task include with category filter if needed
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

    // Get counts for each status
    const [completed, progress, upcoming] = await Promise.all([
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
      statusMap.upcoming
        ? UserTask.count({
            where: {
              ...baseWhere,
              statusId: statusMap.upcoming,
            },
            include: [taskInclude],
            distinct: true,
          })
        : 0,
    ]);

    // Calculate overdue tasks (tasks with dueDate < today and status not completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueWhere = {
      ...baseWhere,
      dueDate: { [Op.lt]: today },
    };

    // Only add statusId condition if completed status exists
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
      upcoming: upcoming || 0,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

// CSV parser helper
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
