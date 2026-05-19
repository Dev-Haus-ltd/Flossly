import { success, error } from '../../../../utils/response';
import { Organisation, Rota, RotaShift, RotaUser, User } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import { parseJsonBody } from '../../../../utils/body';

export const listOrgsRotas = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const organisationId = getRouterParam(event, 'orgId');
  const { limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const organisation = await Organisation.findByPk(parseInt(organisationId), {
      attributes: ['id', 'name'],
    });

    if (!organisation) {
      return error(404, 'Organisation not found');
    }

    const whereClause = {
      organisationId: parseInt(organisationId),
      isDeleted: false,
    };

    const rotas = await Rota.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return success({
      organisationId: organisation.id,
      organisationName: organisation.name,
      rotas: rotas.rows,
      total: rotas.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List org rotas error:', err);
    return error(500, err.message || 'Failed to list rotas');
  }
};

export const getRotaById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const id = getRouterParam(event, 'rotaId');

  if (!id) {
    return error(400, 'rotaId is required');
  }

  try {
    const rota = await Rota.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      include: [
        {
          model: RotaShift,
          as: 'shifts',
          where: { isDeleted: false },
          required: false,
          order: [['startDate', 'ASC']],
        },
        {
          model: RotaUser,
          as: 'users',
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'photo'],
            },
          ],
        },
      ],
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    return success({ rota });
  } catch (err) {
    console.error('Get rota by ID error:', err);
    return error(500, err.message || 'Failed to get rota');
  }
};

export const createRota = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    if (!organisationId) {
      return error(400, 'orgId is required');
    }
    const rawBody = await readBody(event);
    const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
    const { name, startDate, endDate, duration, notes } = body;

    if (!name || !name.trim()) {
      return error(400, 'name is required');
    }

    if (!startDate || !endDate) {
      return error(400, 'startDate and endDate are required');
    }

    if (new Date(endDate) < new Date(startDate)) {
      return error(400, 'End date cannot be before start date');
    }

    const organisation = await Organisation.findByPk(parseInt(organisationId), {
      attributes: ['id', 'name'],
    });

    if (!organisation) {
      return error(404, 'Organisation not found');
    }

    const conflictRota = await Rota.findOne({
      where: {
        organisationId: parseInt(organisationId),
        isDeleted: false,
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (conflictRota) {
      return error(409, 'A rota already exists for this organisation in the given date range');
    }

    const rota = await Rota.create({
      organisationId: parseInt(organisationId),
      name: name.trim(),
      startDate,
      endDate,
      duration: duration || null,
      notes: notes || null,
    });

    return success({
      message: 'Rota created successfully',
      rota,
    });
  } catch (err) {
    console.error('Create rota error:', err);
    return error(500, err.message || 'Failed to create rota');
  }
};

export const updateRota = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const rotaId = getRouterParam(event, 'rotaId');
    if (!rotaId) {
      return error(400, 'rotaId is required');
    }
    const rawBody = await readBody(event);
    const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
    const { name, startDate, endDate, duration, notes } = body;

    const rota = await Rota.findOne({
      where: {
        id: parseInt(rotaId, 10),
        isDeleted: false,
      },
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return error(400, 'End date cannot be before start date');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;

    await rota.update(updateData);

    return success({
      message: 'Rota updated successfully',
      rota,
    });
  } catch (err) {
    console.error('Update rota error:', err);
    return error(500, err.message || 'Failed to update rota');
  }
};

export const deleteRota = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const id = getRouterParam(event, 'rotaId');
    if (!id) {
      return error(400, 'rotaId is required');
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    await rota.update({ isDeleted: true });

    await RotaShift.update(
      { isDeleted: true },
      { where: { rotaId: parseInt(id, 10) } },
    );

    return success({
      message: 'Rota deleted successfully',
      deletedId: parseInt(id, 10),
    });
  } catch (err) {
    console.error('Delete rota error:', err);
    return error(500, err.message || 'Failed to delete rota');
  }
};

export const publishRota = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const id = getRouterParam(event, 'rotaId');
    if (!id) {
      return error(400, 'rotaId is required');
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    await rota.update({
      isPublished: true,
      publishedDate: new Date(),
    });

    return success({
      message: 'Rota published successfully',
      rota,
    });
  } catch (err) {
    console.error('Publish rota error:', err);
    return error(500, err.message || 'Failed to publish rota');
  }
};

export const unpublishRota = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const id = getRouterParam(event, 'rotaId');
    if (!id) {
      return error(400, 'rotaId is required');
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    await rota.update({
      isPublished: false,
    });

    return success({
      message: 'Rota unpublished successfully',
      rota,
    });
  } catch (err) {
    console.error('Unpublish rota error:', err);
    return error(500, err.message || 'Failed to unpublish rota');
  }
};
