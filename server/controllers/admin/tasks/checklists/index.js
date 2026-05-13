import { success, error } from '../../../../utils/response';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody, setResponseHeader } from 'h3';
import sequelize from '../../../../utils/db';

export const getChecklists = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../../../../models/index.js');
    const query = getQuery(event);
    const { taskId, search, limit = 100, offset = 0 } = query;

    const whereClause = {};
    
    if (taskId) {
      whereClause.taskId = parseInt(taskId);
    }

    if (search) {
      whereClause[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const checklists = await TaskChecklist.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['taskId', 'ASC'], ['id', 'ASC']]
    });

    return success({
      checklists: checklists.rows,
      total: checklists.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get checklists error:', err);
    return error(500, err.message || "Failed to get checklists");
  }
};

/**
 * Get checklist by ID
 * GET /api/admin/getChecklistById?id=123
 */

export const getChecklistById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../../../../models/index.js');
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Checklist ID is required");
    }

    const checklist = await TaskChecklist.findByPk(id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description', 'categoryId', 'roleId']
        }
      ]
    });

    if (!checklist) {
      return error(404, "Checklist not found");
    }

    return success({ checklist });

  } catch (err) {
    console.error('Get checklist by ID error:', err);
    return error(500, err.message || "Failed to get checklist");
  }
};

/**
 * Create a new checklist item
 * POST /api/admin/createChecklist
 */

export const createChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const {
      taskId,
      question,
      category,
      fieldOneTitle,
      fieldOneValue,
      fieldTwoTitle,
      fieldTwoValue,
      showRadio,
      showTime,
      showDate,
      radioValue,
      timeValue,
      dateValue
    } = body;

    // Validate required fields
    if (!taskId) {
      return error(400, "taskId is required");
    }

    if (!question) {
      return error(400, "question is required");
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return error(404, "Task not found");
    }

    // Create checklist item
    const checklist = await TaskChecklist.create({
      taskId: parseInt(taskId),
      question,
      category: category || null,
      fieldOneTitle: fieldOneTitle || null,
      fieldOneValue: fieldOneValue || null,
      fieldTwoTitle: fieldTwoTitle || null,
      fieldTwoValue: fieldTwoValue || null,
      showRadio: showRadio !== undefined ? showRadio : false,
      showTime: showTime !== undefined ? showTime : false,
      showDate: showDate !== undefined ? showDate : false,
      radioValue: radioValue || 'N/A',
      timeValue: timeValue || null,
      dateValue: dateValue || null
    });

    return success({
      message: "Checklist item created successfully",
      checklist
    });

  } catch (err) {
    console.error('Create checklist error:', err);
    return error(500, err.message || "Failed to create checklist");
  }
};

/**
 * Update a checklist item
 * PUT /api/admin/updateChecklist
 */

export const updateChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const idParam = getRouterParam(event, 'id');
    const {
      question,
      category,
      fieldOneTitle,
      fieldOneValue,
      fieldTwoTitle,
      fieldTwoValue,
      showRadio,
      showTime,
      showDate,
      radioValue,
      timeValue,
      dateValue
    } = body;

    if (!idParam) {
      return error(400, "Checklist ID is required in the URL path");
    }

    const checklistId = parseInt(idParam, 10);
    if (Number.isNaN(checklistId)) {
      return error(400, "Checklist ID must be a valid number");
    }

    // Find checklist item
    const checklist = await TaskChecklist.findByPk(checklistId);
    if (!checklist) {
      return error(404, "Checklist item not found");
    }

    // Update fields
    const updateData = {};
    if (question !== undefined) updateData.question = question;
    if (category !== undefined) updateData.category = category;
    if (fieldOneTitle !== undefined) updateData.fieldOneTitle = fieldOneTitle;
    if (fieldOneValue !== undefined) updateData.fieldOneValue = fieldOneValue;
    if (fieldTwoTitle !== undefined) updateData.fieldTwoTitle = fieldTwoTitle;
    if (fieldTwoValue !== undefined) updateData.fieldTwoValue = fieldTwoValue;
    if (showRadio !== undefined) updateData.showRadio = showRadio;
    if (showTime !== undefined) updateData.showTime = showTime;
    if (showDate !== undefined) updateData.showDate = showDate;
    if (radioValue !== undefined) updateData.radioValue = radioValue;
    if (timeValue !== undefined) updateData.timeValue = timeValue;
    if (dateValue !== undefined) updateData.dateValue = dateValue;

    await checklist.update(updateData);

    return success({
      message: "Checklist item updated successfully",
      checklist
    });

  } catch (err) {
    console.error('Update checklist error:', err);
    return error(500, err.message || "Failed to update checklist");
  }
};

/**
 * Delete a checklist item
 * DELETE /api/admin/deleteChecklist
 */

export const deleteChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist } = await import('../../../../models/index.js');
    const idParam = getRouterParam(event, 'id');

    if (!idParam) {
      return error(400, "Checklist ID is required in the URL path");
    }

    const checklistId = parseInt(idParam, 10);
    if (Number.isNaN(checklistId)) {
      return error(400, "Checklist ID must be a valid number");
    }

    // Find the specific checklist item by primary key
    const checklist = await TaskChecklist.findByPk(checklistId);
    
    if (!checklist) {
      return error(404, "Checklist item not found");
    }

    // Log the checklist details before deletion for debugging
    const checklistInfo = {
      id: checklist.id,
      taskId: checklist.taskId,
      question: checklist.question
    };
    
    console.log(`[Admin Delete Checklist] Deleting checklist ID ${checklistInfo.id} from task ID ${checklistInfo.taskId}`);

    // Delete using destroy with hooks disabled to prevent any cascade issues
    await TaskChecklist.destroy({
      where: { id: checklistId },
      hooks: false,
      individualHooks: false
    });

    console.log(`[Admin Delete Checklist] Successfully deleted checklist ID ${checklistInfo.id}`);

    return success({
      message: "Checklist item deleted successfully",
      deletedId: checklistId,
      deletedChecklistInfo: checklistInfo
    });

  } catch (err) {
    console.error('Delete checklist error:', err);
    return error(500, err.message || "Failed to delete checklist");
  }
};

/**
 * Bulk upload checklists from CSV
 * POST /api/admin/bulkUploadChecklists
 * CSV Format: taskTitle,itemTitle,showRadio,defaultComment
 */

export const bulkUploadChecklists = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../../../../models/index.js');
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

    const file = files.file?.[0];
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

    // Group records by task title
    const taskGroups = new Map();
    records.forEach((record, index) => {
      const taskTitle = (record.taskTitle || '').trim();
      const itemTitle = (record.itemTitle || '').trim();
      
      if (!taskTitle || !itemTitle) {
        return; // Skip invalid rows
      }

      const key = taskTitle.toLowerCase();
      if (!taskGroups.has(key)) {
        taskGroups.set(key, {
          taskTitle: taskTitle,
          items: []
        });
      }

      // Parse showRadio - default to TRUE if not specified
      const showRadio = record.showRadio?.toString().toUpperCase() !== 'FALSE';

      taskGroups.get(key).items.push({
        question: itemTitle,
        showRadio: showRadio,
        defaultComment: (record.defaultComment || '').trim()
      });
    });

    const results = [];
    const transaction = await sequelize.transaction();
    
    try {
      for (const [key, group] of taskGroups) {
        const taskTitle = group.taskTitle;
        const items = group.items;

        // Find task by title (case insensitive)
        let task = await Task.findOne({ 
          where: { 
            title: { [Op.iLike]: taskTitle },
            isSystemTask: true 
          } 
        });

        // If task doesn't exist, create it as a system task
        if (!task) {
          task = await Task.create({
            title: taskTitle,
            description: `Auto-created from admin checklist upload`,
            categoryId: 2, // Default category
            roleId: null,
            defaultFrequency: null,
            isSystemTask: true
          }, { transaction });
        }

        // Add checklist items to the task
        let createdCount = 0;
        for (const item of items) {
          const question = item.question.trim();
          if (!question) continue;

          // Check if checklist already exists
          const existing = await TaskChecklist.findOne({ 
            where: { 
              taskId: task.id, 
              question 
            } 
          });

          if (!existing) {
            await TaskChecklist.create({
              taskId: task.id,
              question,
              category: null,
              showRadio: item.showRadio,
              showDate: false,
              showTime: false,
              fieldOneTitle: 'Comments / Notes',
              fieldOneValue: item.defaultComment || '',
              fieldTwoTitle: null,
              fieldTwoValue: null,
              radioValue: 'N/A',
              timeValue: null,
              dateValue: null
            }, { transaction });
            createdCount++;
          }
        }

        results.push({ 
          taskTitle, 
          taskId: task.id,
          status: 'success', 
          created: createdCount,
          skipped: items.length - createdCount
        });
      }

      await transaction.commit();

      const successCount = results.filter(r => r.status === 'success').length;
      const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0);

      return success({ 
        message: `${successCount} task(s) processed, ${totalCreated} checklist(s) created from ${records.length} rows`,
        summary: {
          totalRows: records.length,
          tasksProcessed: successCount,
          checklistsCreated: totalCreated
        },
        results 
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Bulk upload checklists error:', err);
    return error(500, err.message || "Failed to bulk upload checklists");
  }
};

/**
 * Download checklist CSV template
 * GET /api/admin/downloadChecklistTemplate
 */

export const downloadChecklistTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const csv = `taskTitle,itemTitle,showRadio,defaultComment
Fire Safety Check,Check fire alarm,TRUE,
Fire Safety Check,Check extinguishers,TRUE,Last serviced this month
Surgery Prep,Sterilize tools,TRUE,
Surgery Prep,Prep chair,TRUE,
Opening Checks,Unlock premises,TRUE,Note time of arrival
Opening Checks,Turn on all lights,TRUE,
Opening Checks,Check waiting room,TRUE,Ensure clean and tidy`;

    // Set headers for CSV download
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="checklist-template.csv"');
    
    return csv;

  } catch (err) {
    console.error('Download checklist template error:', err);
    return error(500, err.message || "Failed to download template");
  }
};
