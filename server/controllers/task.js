import { Op, fn, col } from "sequelize";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
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
  UserPointsHistory,
  UserPoint,
} from "../models";
export const listMyTasks = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const {
    statusId,
    priorityId,
    categoryId,
    frequency,
    search,
    limit = 20,
    offset = 0,
  } = JSON.parse(body);
  try {
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
  const body = await readBody(event);
  const { name, description, parentId, color } = JSON.parse(body);
  if (!name) return error(400, "Name required");
  try {
    const cat = await TaskCategory.findOne({
      where: {
        name: {
          [Op.iLike]: name, // case-insensitive match
        },
      },
    });
    if (cat)
      throw createError({ message: `Category ${name} is already added` });
    await TaskCategory.create({ name, description, parentId, color });
    return success("Saved");
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
  const organisationId = loggedUser.orgId;
  const { userId, tasks } = JSON.parse(body);

  if (!userId || !Array.isArray(tasks)) {
    return error(
      402,
      "Missing required fields: userId, organisationId, or tasks"
    );
  }
  try {
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
    const userTasks = newTasks
      .map((t) => {
        return {
          userId,
          organisationId,
          taskId: t.id,
          statusId: orgStatuses.find((x) => x.key === "upcoming").id,
          priorityId: orgPriorities.find((x) => x.key === "low").id,
          title: t.title,
          documentLink: "",
          frequency: t.defaultFrequency,
          dueDate: getDueDate(t.defaultFrequency),
          comments: "",
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
    case "Annualy":
      return addDays(new Date(), 365);
    case "Every 24 Months":
      return addDays(new Date(), 730);
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
    } = JSON.parse(body);

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
      if (frequency !== undefined) userTask.frequency = frequency;
      if (priorityId !== undefined) userTask.priorityId = priorityId;
      if (statusId !== undefined) userTask.statusId = statusId;
      if (title) userTask.title = title;
      if (comments) userTask.comments = comments;
      if (documentLink) userTask.documentLink = documentLink;
      await userTask.save();
      if (
        statusId &&
        orgStatuses.find((x) => x.id === statusId)?.key === "completed"
      ) {
        const user = await User.findOne({ where: { id: loggedUser.userId } });
        await taskCompletedNotification({
          fullName: user.fullName,
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
    // add reward points if status === completed and prioirty === high / critical
    return success("UserTask updated");
  } catch (err) {
    return error(500, err.message);
  }
};
export const viewTeamTasksTaskWise = async (event) => {
  try {
    const loggedUser = event.context.user;
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

      if (!taskMap.has(task.taskDetails.id)) {
        taskMap.set(task.taskDetails.id, {
          ...task.get(),
          assignedUser: [assignedUser.get()],
        });
      } else {
        taskMap.get(task.taskDetails.id).assignedUser.push(assignedUser.get());
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
    await userTask.destroy();
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
    const user = await User.findOne({ where: { id: loggedUser.userId }})
    await taskCompletedNotification({
      fullName: user.fullName,
      email: user.email,
      task: 'Multiple',
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

export const unAssignBulkTask = async (event) => {
  try {
    const loggedUser = event.context.user;
    const organisationId = loggedUser.orgId;
    const body = await readBody(event);
    const { userTasksIds } = JSON.parse(body);
    await UserTask.destroy({
      where: {
        id: userTasksIds,
        organisationId,
      },
    });
    return success("UserTask successfully deleted (unassigned).");
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
    priorityId,
    checklist,
    dueDate,
  } = JSON.parse(body);
  if (!title || !categoryId) {
    throw createError({ message: "Required fields missing" });
  }
  const transaction = await DB.transaction();
  try {
    const newTask = {
      title,
      description,
      roleId,
      categoryId,
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
    if (userId) {
      const orgStatuses = await OrganisationStatus.findAll({
        where: { organisationId: loggedUser.orgId },
      });

      const newUuserTask = {
        userId,
        organisationId: loggedUser.orgId,
        dueDate,
        taskId: task.id,
        title,
        documentLink: "",
        frequency: defaultFrequency || null,
        priorityId,
        statusId: orgStatuses.find((x) => x.key === "progress").id,
        asignedBy: loggedUser.userId,
      };
      const userTask = await UserTask.create(newUuserTask, { transaction });
      const user = await User.findByPk(userId);
      if (user?.email) {
        await sendTaskAssignmentEmail({
          email: user.email,
          name: user.fullName,
          taskTitle: title,
        });
      }
      if (checklist?.length) {
        const checklistData = checklist.map((item) => ({
          userTaskId: userTask.id,
          question: item.question,
          category: item.category,
          showRadio: item.showRadio, // defaulting these
          showDate: item.showDate,
          showTime: item.showTime,
          fieldOneTitle: item.fieldOneTitle,
          fieldTwoTitle: item.fieldTwoTitle,
          radioValue: "N/A",
        }));
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

  for (const [index, t] of tasks.entries()) {
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
      results.push({
        index,
        title,
        status: "failed",
        message: "Required fields missing",
      });
      continue;
    }

    const transaction = await DB.transaction();
    try {
      // --- 1️⃣ Create Task ---
      const newTask = {
        title,
        description,
        roleId,
        categoryId,
        defaultFrequency: defaultFrequency || null,
      };
      const task = await Task.create(newTask, { transaction });

      // --- 2️⃣ Create Task Checklist (if any) ---
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

      // --- 3️⃣ Assign Task to User (if provided) ---
      if (userId) {
        const orgStatuses = await OrganisationStatus.findAll({
          where: { organisationId: loggedUser.orgId },
        });

        const newUserTask = {
          userId,
          organisationId: loggedUser.orgId,
          dueDate,
          taskId: task.id,
          title,
          documentLink: "",
          frequency: defaultFrequency || null,
          priorityId,
          statusId: orgStatuses.find((x) => x.key === "progress").id,
          asignedBy: loggedUser.userId,
        };

        const userTask = await UserTask.create(newUserTask, { transaction });
        const user = await User.findByPk(userId);

        // --- 4️⃣ Send notification email ---
        if (user?.email) {
          await sendTaskAssignmentEmail({
            email: user.email,
            name: user.fullName,
            taskTitle: title,
          });
        }

        // --- 5️⃣ Create UserTask Checklist (if any) ---
        if (checklist?.length) {
          const checklistData = checklist.map((item) => ({
            userTaskId: userTask.id,
            question: item.question,
            category: item.category,
            showRadio: item.showRadio,
            showDate: item.showDate,
            showTime: item.showTime,
            fieldOneTitle: item.fieldOneTitle,
            fieldTwoTitle: item.fieldTwoTitle,
            radioValue: "N/A",
          }));
          await UserTaskChecklist.bulkCreate(checklistData, { transaction });
        }
      }

      await transaction.commit();
      results.push({ index, title, status: "success" });
    } catch (err) {
      console.error(`❌ Error creating task at index ${index}:`, err);
      await transaction.rollback();
      results.push({
        index,
        title,
        status: "failed",
        message: err.message,
      });
    }
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
  const organisationId = Number(loggedUser.orgId);
  try {
    if (!organisationId) {
      return createError({ message: "organisationId is required" });
    }
    const orgStatuses = await OrganisationStatus.findAll({
      where: { organisationId },
    });
    const orgUsers = await UserOrganisation.findAll({
      where: { organisationId: organisationId },
      attributes: ["id"],
      include: {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "photo", "email", "roleId"],
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["id", "title", "color"],
          },
        ],
      },
    });
    const users = orgUsers.map((el) => el.user);
    const results = await Promise.all(
      users.map(async (user) => {
        const [pending, completed, upcoming] = await Promise.all([
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
              statusId: orgStatuses.find((x) => x.key === "upcoming").id,
            },
          }),
        ]);
        return {
          user,
          taskStats: {
            pending,
            completed,
            upcoming,
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
  const organisationId = event.context.user.orgId;
  const body = await readBody(event);
  const { categoryId, frequency, priority, user } = JSON.parse(body);
  const categories = await TaskCategory.findAll({
    where: {
      [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
      isDeleted: false,
    },
    attributes: ["id"],
  });

  const categoryIds = categories.map((c) => c.id);
  if (!categoryIds.length) {
    return success([]);
  }

  const where = { organisationId };
  if (frequency) where["frequency"] = frequency;
  if (priority) where["priorityId"] = priority;
  if (user) where["userId"] = user;

  try {
    const userTasks = await UserTask.findAll({
      where,
      include: [
        {
          model: Task,
          attributes: [
            "id",
            "title",
            "description",
            "categoryId",
            "roleId",
            "defaultFrequency",
          ],
          as: "taskDetails",
          where: { categoryId: { [Op.in]: categoryIds } },
          required: true,
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
          model: User,
          attributes: ["id", "fullName", "email", "photo"],
          as: "assignedUser",
        },
        {
          model: OrganisationStatus,
          attributes: ["id", "key", "name", "color"],
          as: "status",
        },
      ],
    });

    const response = [];
    for (const ut of userTasks) {
      const status = ut.status?.key || "unknown";
      if (!response[status]) {
        response[status] = [];
      }
      response[status].push(ut);
    }
    const data = Object.entries(response).map(([status, tasks]) => ({
      status,
      tasks,
    }));

    data.forEach((el) => {
      const grouped = {};

      el.tasks.forEach((taskEntry) => {
        const taskId = taskEntry.taskId;
        if (!grouped[taskId]) {
          grouped[taskId] = {
            taskId,
            title: taskEntry.title,
            description: taskEntry.taskDetails?.description,
            frequency: taskEntry.frequency,
            categoryId: taskEntry.taskDetails?.categoryId,
            category: taskEntry.taskDetails.category,
            priorityId: taskEntry.priorityId,
            status: taskEntry.status,
            statusId: taskEntry.statusId,
            priority: taskEntry.priority,
            comments: taskEntry.comments,
            dueDate: taskEntry.dueDate,
            createdAt: taskEntry.createdAt,
            updatedAt: taskEntry.updatedAt,
            taskDetails: taskEntry.taskDetails,
            attachments: taskEntry.attachments,
            assignedUsers: [],
          };
        }

        grouped[taskId].assignedUsers.push({
          id: taskEntry.assignedUser?.id,
          fullName: taskEntry.assignedUser?.fullName,
          email: taskEntry.assignedUser?.email,
          photo: taskEntry.assignedUser?.photo,
          status: taskEntry.status,
          userTaskId: taskEntry.id,
        });
      });
      el.tasks = Object.values(grouped);
    });

    return success(data);
  } catch (err) {
    return error(500, err.message);
  }
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
  try {
    const categories = await TaskCategory.findAll({
      where: { isDeleted: false },
    });
    return success(categories);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getCategoriesforPool = async (event) => {
  try {
    const categories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: {
        include: [[fn("COUNT", col("tasks.id")), "taskCount"]],
      },
      include: [
        {
          model: Task,
          attributes: [],
          as: "tasks",
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
    return success(Object.values(parentCounts));
  } catch (err) {
    console.error(err);
    return error("Something went wrong while counting tasks.");
  }
};

export const teamTasksCountByCategory = async (event) => {
  try {
    const loggedUser = event.context.user;
    const allCategories = await TaskCategory.findAll({
      where: { isDeleted: false },
      attributes: ["id", "name", "color", "parentId"],
      raw: true,
    });

    const categoryMap = new Map();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));
    const teamTasks = await UserTask.findAll({
      where: { organisationId: loggedUser.orgId },
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

      // Start from current category
      let currentCat = categoryMap.get(cat.id);
      if (!currentCat) continue; // skip deleted or missing

      // Climb up to top-level parent
      while (currentCat.parentId) {
        const parent = categoryMap.get(currentCat.parentId);
        if (!parent) {
          currentCat = null; // parent missing/deleted
          break;
        }
        currentCat = parent;
      }

      if (!currentCat) continue;

      // Add or increment count for top-level category
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
    return success(Object.values(parentCounts));
  } catch (err) {
    return error(500, err.message);
  }
};

export const getUserTasksStatusWise = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { categoryId } = JSON.parse(body);
  try {
    const categories = await TaskCategory.findAll({
      where: {
        [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
        isDeleted: false,
      },
      attributes: ["id"],
    });

    const categoryIds = categories.map((c) => c.id);
    if (!categoryIds.length) {
      return success([]);
    }
    const userTasks = await UserTask.findAll({
      where: { userId: loggedUser.userId, organisationId: loggedUser.orgId },
      include: [
        {
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
        },
        {
          model: OrganisationPriority,
          as: "priority",
        },
        {
          model: OrganisationStatus,
          as: "status",
        },
      ],
    });
    const response = [];
    for (const ut of userTasks) {
      const status = ut.status?.key || "unknown";
      if (!response[status]) {
        response[status] = [];
      }
      response[status].push(ut);
    }
    const data = Object.entries(response).map(([status, tasks]) => ({
      status,
      tasks,
    }));
    return success(data);
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
      where: { categoryId },
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
