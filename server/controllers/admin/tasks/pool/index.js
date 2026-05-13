import { success, error } from '../../../../utils/response';
import { Task, TaskCategory, Role } from '../../../../models';
import { getRouterParam, getQuery } from 'h3';

export const getTaskPool = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { categoryId, roleId, limit = 100, offset = 0 } = query;

  try {
    // Build where clause - always filter for system tasks only
    const whereClause = {
      isSystemTask: true  // Only show system tasks
    };
    
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }
    
    if (roleId) {
      whereClause.roleId = parseInt(roleId);
    }

    // Get all tasks
    const tasks = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TaskCategory,
          as: 'category',
          attributes: ['id', 'name', 'description', 'color', 'organisationId'],
          required: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['isSystemTask', 'DESC'], ['title', 'ASC']],
      distinct: true
    });

    // Get category summary
    const categorySummary = {};
    tasks.rows.forEach(task => {
      const catName = task.category?.name || 'Uncategorized';
      categorySummary[catName] = (categorySummary[catName] || 0) + 1;
    });

    return success({
      totalTasks: tasks.count,
      categorySummary: categorySummary,
      limit: parseInt(limit),
      offset: parseInt(offset),
      tasks: tasks.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : null,
        roleId: task.roleId,
        role: task.role ? {
          id: task.role.id,
          title: task.role.title,
          roleType: task.role.roleType
        } : null,
        defaultFrequency: task.defaultFrequency,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });
  } catch (err) {
    console.error('Get all task pools error:', err);
    return error(500, err.message);
  }
};


export const getTaskById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const id = getRouterParam(event, 'taskId');

  if (!id) {
    return error(400, "Task ID is required");
  }

  try {
    const task = await Task.findOne({
      where: { id: parseInt(id, 10) },
      include: [
        {
          model: TaskCategory,
          as: 'category',
          attributes: ['id', 'name', 'description', 'color', 'organisationId'],
          required: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType'],
          required: false
        }
      ]
    });

    if (!task) {
      return error(404, "Task not found");
    }

    return success({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : null,
        roleId: task.roleId,
        role: task.role ? {
          id: task.role.id,
          title: task.role.title,
          roleType: task.role.roleType
        } : null,
        defaultFrequency: task.defaultFrequency,
        isSystemTask: task.isSystemTask,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (err) {
    console.error('Get task by ID error:', err);
    return error(500, err.message);
  }
};

/**
 * Get global default CRM automation library
 * View all system automation templates available to all practices
 */

export const adminBulkUploadTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const formidable = (await import('formidable')).default;
    const fs = await import('fs');
    const { parse } = await import('csv-parse');

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

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.filepath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    if (!records || records.length === 0) {
      return error(400, "CSV file is empty or invalid");
    }

    // Validate and prepare tasks for insertion
    const tasksToInsert = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // +2 because row 1 is header and index starts at 0

      // Validate required fields
      if (!record.title || !record.title.trim()) {
        errors.push(`Row ${rowNum}: Title is required`);
        continue;
      }

      // Validate categoryId is required
      if (!record.categoryId || !record.categoryId.trim()) {
        errors.push(`Row ${rowNum}: categoryId is required`);
        continue;
      }

      const categoryId = Number(record.categoryId);
      if (isNaN(categoryId)) {
        errors.push(`Row ${rowNum}: Invalid categoryId - must be a number`);
        continue;
      }

      // Prepare task object
      const taskData = {
        title: record.title.trim(),
        description: record.description ? record.description.trim() : null,
        categoryId: categoryId,
        roleId: record.roleId ? Number(record.roleId) : null,
        defaultFrequency: record.defaultFrequency || null,
        isSystemTask: true, // Admin uploaded tasks are system tasks (visible in task pool)
      };

      // Validate roleId if provided
      if (record.roleId && isNaN(Number(record.roleId))) {
        errors.push(`Row ${rowNum}: Invalid roleId`);
        continue;
      }

      tasksToInsert.push(taskData);
    }

    // If there are validation errors, return them
    if (errors.length > 0 && tasksToInsert.length === 0) {
      return error(400, `Validation errors: ${errors.join(', ')}`);
    }

    // Insert tasks into database
    let createdTasks = [];
    if (tasksToInsert.length > 0) {
      createdTasks = await Task.bulkCreate(tasksToInsert);
    }

    return success({
      message: `Successfully uploaded ${createdTasks.length} tasks`,
      created: createdTasks.length,
      errors: errors.length > 0 ? errors : undefined,
      tasks: createdTasks.map(t => ({
        id: t.id,
        title: t.title,
        categoryId: t.categoryId,
        roleId: t.roleId,
        defaultFrequency: t.defaultFrequency
      }))
    });

  } catch (err) {
    console.error('Admin bulk upload tasks error:', err);
    return error(500, err.message || "Failed to upload tasks");
  }
};

/**
 * Bulk upload task pool presets that are linked to a specific organisation.
 */
export const adminBulkUploadTasksForOrg = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  const orgIdRaw = getRouterParam(event, "orgId");
  const organisationId = parseInt(orgIdRaw, 10);
  if (!orgIdRaw || Number.isNaN(organisationId)) {
    return error(400, "Invalid organisation id");
  }

  try {
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ["id", "name"],
    });
    if (!organisation) {
      return error(404, "Organisation not found");
    }

    const orgCategories = await TaskCategory.findAll({
      where: { isDeleted: false, organisationId },
      attributes: ["id", "name"],
    });
    const orgCategoryIds = new Set(orgCategories.map((c) => c.id));
    const orgCategoryByName = new Map(
      orgCategories.map((c) => [c.name.toLowerCase(), c])
    );

    const formidable = (await import("formidable")).default;
    const fs = await import("fs");
    const { parse } = await import("csv-parse");

    const form = formidable({ multiples: false });
    const [_, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return error(400, "No CSV file provided");
    }

    const records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.filepath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    if (!records || records.length === 0) {
      return error(400, "CSV file is empty or invalid");
    }

    const tasksToInsert = [];
    const errors = [];
    const createdCategoryNames = new Set();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2;

      if (!record.title || !record.title.trim()) {
        errors.push(`Row ${rowNum}: Title is required`);
        continue;
      }

      let categoryId = null;
      const rawCategoryId = record.categoryId
        ? String(record.categoryId).trim()
        : "";
      const rawCategoryName = record.categoryName
        ? String(record.categoryName).trim()
        : "";

      if (rawCategoryId) {
        const parsed = Number(rawCategoryId);
        if (Number.isNaN(parsed)) {
          errors.push(`Row ${rowNum}: Invalid categoryId - must be a number`);
          continue;
        }
        if (!orgCategoryIds.has(parsed)) {
          errors.push(
            `Row ${rowNum}: categoryId ${parsed} is not owned by organisation ${organisationId}. ` +
              `Only categories belonging to this org can be used to scope a preset to it.`
          );
          continue;
        }
        categoryId = parsed;
      } else if (rawCategoryName) {
        const key = rawCategoryName.toLowerCase();
        let category = orgCategoryByName.get(key);
        if (!category) {
          category = await TaskCategory.create({
            name: rawCategoryName,
            description: null,
            color: null,
            parentId: null,
            organisationId,
            isDeleted: false,
          });
          orgCategoryByName.set(key, category);
          orgCategoryIds.add(category.id);
          createdCategoryNames.add(rawCategoryName);
        }
        categoryId = category.id;
      } else {
        errors.push(
          `Row ${rowNum}: categoryId or categoryName is required to link the task to this organisation`
        );
        continue;
      }

      if (record.roleId && Number.isNaN(Number(record.roleId))) {
        errors.push(`Row ${rowNum}: Invalid roleId`);
        continue;
      }

      tasksToInsert.push({
        title: record.title.trim(),
        description: record.description ? record.description.trim() : null,
        categoryId,
        roleId: record.roleId ? Number(record.roleId) : null,
        defaultFrequency: record.defaultFrequency || null,
        isSystemTask: false,
      });
    }

    if (errors.length > 0 && tasksToInsert.length === 0) {
      return error(400, `Validation errors: ${errors.join(", ")}`);
    }

    let createdTasks = [];
    if (tasksToInsert.length > 0) {
      createdTasks = await Task.bulkCreate(tasksToInsert);
    }

    return success({
      message: `Successfully uploaded ${createdTasks.length} task presets for organisation ${organisationId}`,
      organisationId,
      organisationName: organisation.name,
      created: createdTasks.length,
      createdCategories: Array.from(createdCategoryNames),
      errors: errors.length > 0 ? errors : undefined,
      tasks: createdTasks.map((t) => ({
        id: t.id,
        title: t.title,
        categoryId: t.categoryId,
        roleId: t.roleId,
        defaultFrequency: t.defaultFrequency,
        isSystemTask: t.isSystemTask,
      })),
    });
  } catch (err) {
    console.error("Admin bulk upload org tasks error:", err);
    return error(500, err.message || "Failed to upload organisation tasks");
  }
};

/**
 * Download CSV template for admin bulk task upload
 * This template does NOT include user column
 */

export const downloadAdminTaskTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    // CSV template with categoryId column
    const csvContent = `title,description,categoryId,roleId,defaultFrequency
Morning Rounds,Complete morning patient rounds,1,1,Daily
Equipment Check,Check all medical equipment,1,1,Weekly
Inventory Review,Review inventory levels,1,1,Monthly
Staff Meeting,Weekly staff meeting,1,1,Weekly
Safety Inspection,Perform safety inspection,1,1,Monthly`;

    // Set headers for CSV download
    event.node.res.setHeader('Content-Type', 'text/csv');
    event.node.res.setHeader('Content-Disposition', 'attachment; filename="admin-task-template.csv"');
    
    return csvContent;

  } catch (err) {
    console.error('Download admin task template error:', err);
    return error(500, err.message || "Failed to download template");
  }
};
