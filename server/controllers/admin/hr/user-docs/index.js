import { success, error } from '../../../../utils/response';
import { User, UserOrganisation } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import { parseJsonBody } from '../../../../utils/body';

export const getUserHrDocumentStatus = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { UserHrDocument } = await import('../../../../models/auth/userHrDocuments');
    const userIdParam = getRouterParam(event, 'id');

    if (!userIdParam) {
      return error(400, 'User id is required');
    }

    const userId = parseInt(userIdParam, 10);
    if (Number.isNaN(userId)) {
      return error(400, 'User id must be a valid number');
    }

    const userDocs = await UserHrDocument.findAll({
      where: { userId },
      order: [['type', 'ASC'], ['name', 'ASC']],
    });

    const completedCount = userDocs.filter((d) => d.status === 'Completed').length;
    const pendingCount = userDocs.filter((d) => d.status === 'Pending').length;

    return success({
      userId,
      documents: userDocs,
      summary: {
        total: userDocs.length,
        completed: completedCount,
        pending: pendingCount,
        completionRate: userDocs.length > 0 ? `${((completedCount / userDocs.length) * 100).toFixed(1)}%` : '0%',
      },
    });
  } catch (err) {
    console.error('Get user HR document status error:', err);
    return error(500, err.message || 'Failed to get user HR document status');
  }
};

export const listOrgUsersHrDocumentStatus = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { UserHrDocument } = await import('../../../../models/auth/userHrDocuments');
    const query = getQuery(event);
    const organisationId = getRouterParam(event, 'orgId');
    const { type, limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const userIdsQuery = await UserOrganisation.findAll({
      where: { organisationId: parseInt(organisationId, 10) },
      attributes: ['userId'],
    });

    const userIds = userIdsQuery.map((uo) => uo.userId);

    if (userIds.length === 0) {
      return success({
        organisationId: parseInt(organisationId),
        type: type || 'all',
        users: [],
        totalUsers: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }

    const whereClause = {
      userId: { [Op.in]: userIds },
    };

    if (type) {
      whereClause.type = type;
    }

    const userDocs = await UserHrDocument.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
      order: [['userId', 'ASC'], ['type', 'ASC'], ['name', 'ASC']],
    });

    const userStats = {};
    userDocs.forEach((doc) => {
      const uid = doc.userId;
      if (!userStats[uid]) {
        userStats[uid] = {
          userId: uid,
          userName: doc.user?.fullName,
          userEmail: doc.user?.email,
          total: 0,
          completed: 0,
          pending: 0,
        };
      }
      userStats[uid].total++;
      if (doc.status === 'Completed') userStats[uid].completed++;
      else userStats[uid].pending++;
    });

    const resultUsers = Object.values(userStats).map((stat) => ({
      ...stat,
      completionRate: stat.total > 0 ? `${((stat.completed / stat.total) * 100).toFixed(1)}%` : '0%',
    }));

    const paginatedUsers = resultUsers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisationId: parseInt(organisationId),
      type: type || 'all',
      users: paginatedUsers,
      totalUsers: resultUsers.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List org users HR document status error:', err);
    return error(500, err.message || 'Failed to list users HR document status');
  }
};

export const updateUserHrDocument = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const { UserHrDocument } = await import('../../../../models/auth/userHrDocuments');
    const rawBody = await readBody(event);
    const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
    const idParam = getRouterParam(event, 'id');
    const { status, link } = body;

    if (!idParam) {
      return error(400, 'User HR document id is required');
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return error(400, 'User HR document id must be a valid number');
    }

    if (!status) {
      return error(400, 'status is required (Completed or Pending)');
    }

    if (!['Completed', 'Pending'].includes(status)) {
      return error(400, 'status must be either Completed or Pending');
    }

    const userDoc = await UserHrDocument.findByPk(id);

    if (!userDoc) {
      return error(404, 'User HR document not found');
    }

    const updateData = { status };
    if (link !== undefined) updateData.link = link;
    if (status === 'Completed') updateData.uploadedDate = new Date();

    await userDoc.update(updateData);

    return success({
      message: 'User HR document updated successfully',
      userHrDocument: userDoc,
    });
  } catch (err) {
    console.error('Update user HR document error:', err);
    return error(500, err.message || 'Failed to update user HR document');
  }
};
