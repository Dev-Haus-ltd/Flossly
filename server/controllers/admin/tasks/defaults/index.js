import { success, error } from '../../../../utils/response';
import { getRouterParam, getQuery, readBody } from 'h3';

export const getDefaultPriorities = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority } = await import('../../../../models/index.js');
    
    const priorities = await DefaultPriority.findAll({
      order: [['sortOrder', 'ASC']]
    });

    return success({
      priorities,
      total: priorities.length
    });

  } catch (err) {
    console.error('Get default priorities error:', err);
    return error(500, err.message || "Failed to get default priorities");
  }
};

/**
 * Get all default statuses
 */

export const getDefaultStatuses = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus } = await import('../../../../models/index.js');
    
    const statuses = await DefaultStatus.findAll({
      order: [['id', 'ASC']]
    });

    return success({
      statuses,
      total: statuses.length
    });

  } catch (err) {
    console.error('Get default statuses error:', err);
    return error(500, err.message || "Failed to get default statuses");
  }
};

/**
 * Create a new default priority
 */

export const createDefaultPriority = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const { key, name, color, sortOrder } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!key || !name) {
      return error(400, "Key and name are required");
    }

    if (sortOrder === undefined) {
      return error(400, "Sort order is required");
    }

    // Check if key already exists
    const existingPriority = await DefaultPriority.findOne({ where: { key } });
    if (existingPriority) {
      return error(400, "A priority with this key already exists");
    }

    // Create the default priority
    const priority = await DefaultPriority.create({
      key,
      name,
      color: color || null,
      sortOrder
    });

    return success({
      message: "Default priority created successfully",
      priority
    });

  } catch (err) {
    console.error('Create default priority error:', err);
    return error(500, err.message || "Failed to create default priority");
  }
};

/**
 * Update a default priority and cascade to all organisations
 */

export const updateDefaultPriority = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority, OrganisationPriority } = await import('../../../../models/index.js');
    const idParam = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { name, color, sortOrder } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!idParam) {
      return error(400, "Priority ID is required");
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return error(400, "Priority ID must be a valid number");
    }

    // Find the default priority
    const defaultPriority = await DefaultPriority.findByPk(id);
    if (!defaultPriority) {
      return error(404, "Default priority not found");
    }

    // Store the key for matching organisation priorities
    const priorityKey = defaultPriority.key;

    // Update default priority
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    await defaultPriority.update(updateData);

    // Cascade update to all organisation priorities with the same key
    const orgUpdateData = {};
    if (name !== undefined) orgUpdateData.name = name;
    if (color !== undefined) orgUpdateData.color = color;
    if (sortOrder !== undefined) orgUpdateData.sortOrder = sortOrder;

    const [updatedCount] = await OrganisationPriority.update(
      orgUpdateData,
      {
        where: { key: priorityKey }
      }
    );

    return success({
      message: "Default priority updated successfully",
      priority: defaultPriority,
      organisationsUpdated: updatedCount
    });

  } catch (err) {
    console.error('Update default priority error:', err);
    return error(500, err.message || "Failed to update default priority");
  }
};

/**
 * Create a new default status
 */

export const createDefaultStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus } = await import('../../../../models/index.js');
    const body = await readBody(event);
    const { key, name, color, description } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!key || !name) {
      return error(400, "Key and name are required");
    }

    // Check if key already exists
    const existingStatus = await DefaultStatus.findOne({ where: { key } });
    if (existingStatus) {
      return error(400, "A status with this key already exists");
    }

    // Create the default status
    const status = await DefaultStatus.create({
      key,
      name,
      color: color || null,
      description: description || null
    });

    return success({
      message: "Default status created successfully",
      status
    });

  } catch (err) {
    console.error('Create default status error:', err);
    return error(500, err.message || "Failed to create default status");
  }
};

/**
 * Update a default status and cascade to all organisations
 */

export const updateDefaultStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus, OrganisationStatus } = await import('../../../../models/index.js');
    const idParam = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { name, color, description } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!idParam) {
      return error(400, "Status ID is required");
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return error(400, "Status ID must be a valid number");
    }

    // Find the default status
    const defaultStatus = await DefaultStatus.findByPk(id);
    if (!defaultStatus) {
      return error(404, "Default status not found");
    }

    // Store the key for matching organisation statuses
    const statusKey = defaultStatus.key;

    // Update default status
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    await defaultStatus.update(updateData);

    // Cascade update to all organisation statuses with the same key
    const orgUpdateData = {};
    if (name !== undefined) orgUpdateData.name = name;
    if (color !== undefined) orgUpdateData.color = color;
    if (description !== undefined) orgUpdateData.description = description;

    const [updatedCount] = await OrganisationStatus.update(
      orgUpdateData,
      {
        where: { key: statusKey }
      }
    );

    return success({
      message: "Default status updated successfully",
      status: defaultStatus,
      organisationsUpdated: updatedCount
    });

  } catch (err) {
    console.error('Update default status error:', err);
    return error(500, err.message || "Failed to update default status");
  }
};
