import { success, error } from '../../../../utils/response';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import sequelize from '../../../../utils/db';

export const getTaskCategories = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../../../../models/index.js');
    const query = getQuery(event);
    const { includeSubcategories = 'true', includeTaskCount = 'true' } = query;

    // Build query for parent categories (system categories only)
    const whereClause = {
      isDeleted: false,
      organisationId: null,  // System categories only
      parentId: null         // Parent categories only
    };

    const includeOptions = [];

    // Include task count if requested
    if (includeTaskCount === 'true') {
      includeOptions.push({
        model: Task,
        as: "tasks",
        attributes: [],
        required: false,
        where: { isSystemTask: true }
      });
    }

    // Include subcategories if requested
    if (includeSubcategories === 'true') {
      includeOptions.push({
        model: TaskCategory,
        as: "subcategories",
        where: { isDeleted: false },
        required: false,
        attributes: ['id', 'name', 'description', 'color', 'parentId', 'organisationId', 'createdAt']
      });
    }

    const attributes = includeTaskCount === 'true' 
      ? {
          include: [[sequelize.fn("COUNT", sequelize.col("tasks.id")), "taskCount"]],
        }
      : undefined;

    const categories = await TaskCategory.findAll({
      where: whereClause,
      attributes,
      include: includeOptions,
      group: includeTaskCount === 'true' ? ["TaskCategories.id", "subcategories.id"] : undefined,
      order: [['id', 'ASC']]
    });

    return success({
      total: categories.length,
      categories
    });

  } catch (err) {
    console.error('Get task categories error:', err);
    return error(500, err.message || "Failed to get task categories");
  }
};

/**
 * Get task category by ID (with subcategories)
 * GET /api/admin/getTaskCategoryById?id=1
 */

export const getTaskCategoryById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../../../../models/index.js');
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Category ID is required");
    }

    const category = await TaskCategory.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
        organisationId: null  // System categories only
      },
      include: [
        {
          model: TaskCategory,
          as: "subcategories",
          where: { isDeleted: false },
          required: false,
          attributes: ['id', 'name', 'description', 'color', 'parentId', 'organisationId', 'createdAt']
        },
        {
          model: TaskCategory,
          as: "parent",
          attributes: ['id', 'name', 'description', 'color'],
          required: false
        }
      ]
    });

    if (!category) {
      return error(404, "Category not found");
    }

    return success({ category });

  } catch (err) {
    console.error('Get task category by ID error:', err);
    return error(500, err.message || "Failed to get task category");
  }
};

/**
 * Get all subcategories for a parent category
 * GET /api/admin/getTaskSubcategories?parentId=1
 */

export const getTaskSubcategories = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../../../../models/index.js');
    const query = getQuery(event);
    const { parentId } = query;

    if (!parentId) {
      return error(400, "parentId is required");
    }

    // Verify parent exists and is a system category
    const parent = await TaskCategory.findOne({
      where: {
        id: parseInt(parentId),
        isDeleted: false,
        organisationId: null,
        parentId: null  // Must be a parent category
      }
    });

    if (!parent) {
      return error(404, "Parent category not found");
    }

    const subcategories = await TaskCategory.findAll({
      where: {
        parentId: parseInt(parentId),
        isDeleted: false,
        organisationId: null  // System subcategories only
      },
      order: [['name', 'ASC']]
    });

    return success({
      parentCategory: {
        id: parent.id,
        name: parent.name
      },
      total: subcategories.length,
      subcategories
    });

  } catch (err) {
    console.error('Get task subcategories error:', err);
    return error(500, err.message || "Failed to get subcategories");
  }
};

/**
 * Create a new task category (parent or subcategory)
 * POST /api/admin/createTaskCategory
 */

export const createTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const { name, description, color, parentId } = body;

    if (!name || !name.trim()) {
      return error(400, "Category name is required");
    }

    // If parentId is provided, verify it exists and is a system parent category
    if (parentId) {
      const parent = await TaskCategory.findOne({
        where: {
          id: parseInt(parentId),
          isDeleted: false,
          organisationId: null,
          parentId: null  // Must be a parent category
        }
      });

      if (!parent) {
        return error(404, "Parent category not found or is not a system parent category");
      }
    }

    // Check for duplicate name at the same level
    const existingCategory = await TaskCategory.findOne({
      where: {
        name: name.trim(),
        isDeleted: false,
        organisationId: null,
        parentId: parentId ? parseInt(parentId) : null
      }
    });

    if (existingCategory) {
      return error(400, `Category "${name}" already exists at this level`);
    }

    // Create the category
    const category = await TaskCategory.create({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || null,
      parentId: parentId ? parseInt(parentId) : null,
      organisationId: null,  // System category
      isDeleted: false
    });

    return success({
      message: `${parentId ? 'Subcategory' : 'Category'} created successfully`,
      category
    });

  } catch (err) {
    console.error('Create task category error:', err);
    return error(500, err.message || "Failed to create category");
  }
};

/**
 * Update a task category
 * PUT /api/admin/updateTaskCategory
 */

export const updateTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const { id, name, description, color } = body;

    if (!id) {
      return error(400, "Category ID is required");
    }

    // Find the category
    const category = await TaskCategory.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
        organisationId: null  // System categories only
      }
    });

    if (!category) {
      return error(404, "Category not found");
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== category.name) {
      const existingCategory = await TaskCategory.findOne({
        where: {
          name: name.trim(),
          isDeleted: false,
          organisationId: null,
          parentId: category.parentId,
          id: { [Op.ne]: parseInt(id) }  // Exclude current category
        }
      });

      if (existingCategory) {
        return error(400, `Category "${name}" already exists at this level`);
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color || null;

    await category.update(updateData);

    return success({
      message: "Category updated successfully",
      category
    });

  } catch (err) {
    console.error('Update task category error:', err);
    return error(500, err.message || "Failed to update category");
  }
};

/**
 * Soft delete a task category
 * DELETE /api/admin/deleteTaskCategory
 */

export const deleteTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
      return error(400, "Category ID is required");
    }

    const categoryId = parseInt(id);

    // Find the category
    const category = await TaskCategory.findOne({
      where: {
        id: categoryId,
        isDeleted: false,
        organisationId: null  // System categories only
      }
    });

    if (!category) {
      return error(404, "Category not found");
    }

    // Check if category has tasks
    const taskCount = await Task.count({
      where: {
        categoryId: categoryId,
        isSystemTask: true
      }
    });

    if (taskCount > 0) {
      return error(400, `Cannot delete category. It has ${taskCount} task(s) assigned to it. Please reassign or delete the tasks first.`);
    }

    // Check if it's a parent category with subcategories
    const subcategoryCount = await TaskCategory.count({
      where: {
        parentId: categoryId,
        isDeleted: false,
        organisationId: null
      }
    });

    if (subcategoryCount > 0) {
      return error(400, `Cannot delete category. It has ${subcategoryCount} subcategory(ies). Please delete or reassign the subcategories first.`);
    }

    // Soft delete the category
    await category.update({ isDeleted: true });

    return success({
      message: "Category deleted successfully",
      deletedId: categoryId
    });

  } catch (err) {
    console.error('Delete task category error:', err);
    return error(500, err.message || "Failed to delete category");
  }
};
