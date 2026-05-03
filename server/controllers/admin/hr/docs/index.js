import { success, error } from '../../../../utils/response';
import { getQuery, getRouterParam, readBody } from 'h3';

export const listHrDocuments = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { HrDocument } = await import('../../../../models/hrDocuments');
    const query = getQuery(event);
    const { type, limit = 100, offset = 0 } = query;

    const whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    const documents = await HrDocument.findAndCountAll({
      where: whereClause,
      order: [['type', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return success({
      documents: documents.rows,
      total: documents.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List HR documents error:', err);
    return error(500, err.message || 'Failed to list HR documents');
  }
};

export const getHrDocumentById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { HrDocument } = await import('../../../../models/hrDocuments');
    const id = getRouterParam(event, 'docId');

    if (!id) {
      return error(400, 'id is required');
    }

    const document = await HrDocument.findByPk(parseInt(id, 10));

    if (!document) {
      return error(404, 'HR document not found');
    }

    return success({ document });
  } catch (err) {
    console.error('Get HR document by ID error:', err);
    return error(500, err.message || 'Failed to get HR document');
  }
};

export const createHrDocument = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { HrDocument } = await import('../../../../models/hrDocuments');
    const body = await readBody(event);
    const { name, type } = body;

    if (!name || !name.trim()) {
      return error(400, 'name is required');
    }

    if (!type) {
      return error(400, 'type is required (Recruitment, Training, or Flossly)');
    }

    if (!['Recruitment', 'Training', 'Flossly'].includes(type)) {
      return error(400, 'type must be one of: Recruitment, Training, Flossly');
    }

    const document = await HrDocument.create({
      name: name.trim(),
      type,
    });

    return success({
      message: 'HR document created successfully',
      document,
    });
  } catch (err) {
    console.error('Create HR document error:', err);
    return error(500, err.message || 'Failed to create HR document');
  }
};

export const updateHrDocument = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { HrDocument } = await import('../../../../models/hrDocuments');
    const body = await readBody(event);
    const idParam = getRouterParam(event, 'docId');
    const { name, type } = body;

    if (!idParam) {
      return error(400, 'Document id is required in the URL path');
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return error(400, 'Document id must be a valid number');
    }

    const document = await HrDocument.findByPk(id);

    if (!document) {
      return error(404, 'HR document not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) {
      if (!['Recruitment', 'Training', 'Flossly'].includes(type)) {
        return error(400, 'type must be one of: Recruitment, Training, Flossly');
      }
      updateData.type = type;
    }

    await document.update(updateData);

    return success({
      message: 'HR document updated successfully',
      document,
    });
  } catch (err) {
    console.error('Update HR document error:', err);
    return error(500, err.message || 'Failed to update HR document');
  }
};

export const deleteHrDocument = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { HrDocument } = await import('../../../../models/hrDocuments');
    const idParam = getRouterParam(event, 'docId');

    if (!idParam) {
      return error(400, 'Document id is required in the URL path');
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return error(400, 'Document id must be a valid number');
    }

    const document = await HrDocument.findByPk(id);

    if (!document) {
      return error(404, 'HR document not found');
    }

    await document.destroy();

    return success({
      message: 'HR document deleted successfully',
      deletedId: id,
    });
  } catch (err) {
    console.error('Delete HR document error:', err);
    return error(500, err.message || 'Failed to delete HR document');
  }
};
