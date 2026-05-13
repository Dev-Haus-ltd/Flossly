import { success, error } from '../../../../utils/response';
import { UserDocument, UserDocumentFolder } from '../../../../models';
import { Op, fn, col } from 'sequelize';
import { getRouterParam, getQuery } from 'h3';

export const listOrgDocumentFolders = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const query = getQuery(event);
    const organisationId = getRouterParam(event, 'orgId');
    const { limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const folders = await UserDocumentFolder.findAll({
      where: {
        organisationId: parseInt(organisationId),
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const folderIds = folders.map((f) => f.id);
    const documentCounts = folderIds.length > 0
      ? await UserDocument.findAll({
        where: { folderId: { [Op.in]: folderIds } },
        attributes: ['folderId', [fn('COUNT', col('id')), 'count']],
        group: ['folderId'],
      })
      : [];

    const countMap = {};
    documentCounts.forEach((dc) => {
      countMap[dc.folderId] = parseInt(dc.get('count')) || 0;
    });

    const foldersWithCounts = folders.map((f) => ({
      ...f.toJSON(),
      documentCount: countMap[f.id] || 0,
    }));

    const total = await UserDocumentFolder.count({
      where: {
        organisationId: parseInt(organisationId),
      },
    });

    return success({
      organisationId: parseInt(organisationId),
      folders: foldersWithCounts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List org document folders error:', err);
    return error(500, err.message || 'Failed to list document folders');
  }
};

export const getOrgDocumentFolderById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'folderId');

    if (!id) {
      return error(400, 'id is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const folder = await UserDocumentFolder.findOne({
      where: {
        id: parseInt(id, 10),
        organisationId: parseInt(organisationId, 10),
      },
      include: [
        {
          model: UserDocument,
          as: 'documents',
          required: false,
        },
        {
          model: UserDocumentFolder,
          as: 'parent',
          attributes: ['id', 'name', 'color', 'parentId'],
          required: false,
        },
        {
          model: UserDocumentFolder,
          as: 'subfolders',
          attributes: ['id', 'name', 'color', 'parentId'],
          required: false,
        },
      ],
    });

    if (!folder) {
      return error(404, 'Folder not found');
    }

    return success({ folder });
  } catch (err) {
    console.error('Get org document folder by ID error:', err);
    return error(500, err.message || 'Failed to get folder');
  }
};

export const listOrgDocuments = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const query = getQuery(event);
    const organisationId = getRouterParam(event, 'orgId');
    const { folderId, userId, search, limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const whereClause = {
      organisationId: parseInt(organisationId, 10),
    };

    if (folderId) {
      whereClause.folderId = parseInt(folderId);
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const documents = await UserDocument.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserDocumentFolder,
          as: 'folder',
          attributes: ['id', 'name', 'color'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return success({
      organisationId: parseInt(organisationId),
      documents: documents.rows,
      total: documents.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List org documents error:', err);
    return error(500, err.message || 'Failed to list documents');
  }
};

export const getOrgDocumentById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'docId');

    if (!id) {
      return error(400, 'id is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const document = await UserDocument.findOne({
      where: {
        id: parseInt(id, 10),
        organisationId: parseInt(organisationId, 10),
      },
      include: [
        {
          model: UserDocumentFolder,
          as: 'folder',
          attributes: ['id', 'name', 'color'],
          required: false,
        },
      ],
    });

    if (!document) {
      return error(404, 'Document not found');
    }

    return success({ document });
  } catch (err) {
    console.error('Get org document by ID error:', err);
    return error(500, err.message || 'Failed to get document');
  }
};
