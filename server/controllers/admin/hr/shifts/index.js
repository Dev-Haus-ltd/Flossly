import { success, error } from '../../../../utils/response';
import { Rota, RotaShift, RotaUser, User } from '../../../../models';
import { getRouterParam, getQuery, readBody } from 'h3';
import { parseJsonBody } from '../../../../utils/body';

export const listRotaShifts = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const rotaId = getRouterParam(event, 'rotaId');
  const organisationId = getRouterParam(event, 'orgId');
  const { limit = 500, offset = 0 } = query;

  if (!rotaId) {
    return error(400, 'rotaId is required');
  }

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const rota = await Rota.findOne({
      where: {
        id: parseInt(rotaId),
        organisationId: parseInt(organisationId),
        isDeleted: false,
      },
      attributes: ['id', 'name', 'organisationId'],
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    const shifts = await RotaShift.findAndCountAll({
      where: {
        rotaId: parseInt(rotaId),
        isDeleted: false,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: RotaUser,
          as: 'rotaUser',
          attributes: ['id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email'],
            },
          ],
        },
      ],
      order: [['startDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    return success({
      rotaId: rota.id,
      rotaName: rota.name,
      shifts: shifts.rows,
      total: shifts.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List rota shifts error:', err);
    return error(500, err.message || 'Failed to list rota shifts');
  }
};

export const getRotaShiftById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const organisationId = getRouterParam(event, 'orgId');
  const id = getRouterParam(event, 'shiftId');

  if (!id) {
    return error(400, 'shiftId is required');
  }

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
      },
      include: [
        {
          model: Rota,
          as: 'rota',
          where: { organisationId: parseInt(organisationId) },
          attributes: ['id', 'name', 'organisationId'],
          required: true,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: RotaUser,
          as: 'rotaUser',
          attributes: ['id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email'],
            },
          ],
        },
      ],
    });

    if (!shift) {
      return error(404, 'Shift not found');
    }

    return success({ shift });
  } catch (err) {
    console.error('Get rota shift by ID error:', err);
    return error(500, err.message || 'Failed to get shift');
  }
};

export const createRotaShift = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const rotaId = getRouterParam(event, 'rotaId');
    const organisationId = getRouterParam(event, 'orgId');
    const rawBody = await readBody(event);
    const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
    const {
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      isLocumShift,
      locumUserId,
      notes,
    } = body;

    if (!rotaId) {
      return error(400, 'rotaId is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    if (!label || !startDate || !endDate) {
      return error(400, 'label, startDate, and endDate are required');
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(rotaId),
        organisationId: parseInt(organisationId),
        isDeleted: false,
      },
    });

    if (!rota) {
      return error(404, 'Rota not found');
    }

    const hasUser = userId || locumUserId || dentistId || nurseId;
    const hasSurgery = surgeryId;

    if (!hasUser && !hasSurgery) {
      return error(400, 'Dentist, nurse, user, or surgery is required');
    }

    const shift = await RotaShift.create({
      rotaId: parseInt(rotaId),
      dentistId: dentistId || null,
      nurseId: nurseId || null,
      userId: userId || null,
      surgeryId: surgeryId || null,
      label: label.trim(),
      color: color || null,
      startDate,
      endDate,
      breakTime: breakTime || null,
      isLocumShift: isLocumShift || false,
      locumUserId: locumUserId || null,
      notes: notes || null,
    });

    return success({
      message: 'Shift created successfully',
      shift,
    });
  } catch (err) {
    console.error('Create rota shift error:', err);
    return error(500, err.message || 'Failed to create shift');
  }
};

export const updateRotaShift = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const rawBody = await readBody(event);
    const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'shiftId');
    const {
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      isLocumShift,
      locumUserId,
      notes,
    } = body;

    if (!id) {
      return error(400, 'shiftId is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId) },
        attributes: ['id', 'organisationId'],
        required: true,
      }],
    });

    if (!shift) {
      return error(404, 'Shift not found');
    }

    const updateData = {};
    if (label !== undefined) updateData.label = label.trim();
    if (color !== undefined) updateData.color = color;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (breakTime !== undefined) updateData.breakTime = breakTime;
    if (notes !== undefined) updateData.notes = notes;
    if (dentistId !== undefined) updateData.dentistId = dentistId;
    if (nurseId !== undefined) updateData.nurseId = nurseId;
    if (userId !== undefined) updateData.userId = userId;
    if (surgeryId !== undefined) updateData.surgeryId = surgeryId;
    if (isLocumShift !== undefined) updateData.isLocumShift = isLocumShift;
    if (locumUserId !== undefined) updateData.locumUserId = locumUserId;

    await shift.update(updateData);

    return success({
      message: 'Shift updated successfully',
      shift,
    });
  } catch (err) {
    console.error('Update rota shift error:', err);
    return error(500, err.message || 'Failed to update shift');
  }
};

export const deleteRotaShift = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'shiftId');

    if (!id) {
      return error(400, 'shiftId is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId, 10) },
        attributes: ['id', 'organisationId'],
        required: true,
      }],
    });

    if (!shift) {
      return error(404, 'Shift not found');
    }

    await shift.update({ isDeleted: true });

    return success({
      message: 'Shift deleted successfully',
      deletedId: parseInt(id, 10),
    });
  } catch (err) {
    console.error('Delete rota shift error:', err);
    return error(500, err.message || 'Failed to delete shift');
  }
};

export const startRotaShift = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'shiftId');

    if (!id) {
      return error(400, 'shiftId is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId, 10) },
        attributes: ['id', 'organisationId'],
        required: true,
      }],
    });

    if (!shift) {
      return error(404, 'Shift not found');
    }

    if (shift.startedAt) {
      return error(400, 'Shift has already started');
    }

    await shift.update({ startedAt: new Date() });

    return success({
      message: 'Shift started successfully',
      shift,
    });
  } catch (err) {
    console.error('Start rota shift error:', err);
    return error(500, err.message || 'Failed to start shift');
  }
};

export const completeRotaShift = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const organisationId = getRouterParam(event, 'orgId');
    const id = getRouterParam(event, 'shiftId');

    if (!id) {
      return error(400, 'shiftId is required');
    }

    if (!organisationId) {
      return error(400, 'orgId is required');
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId, 10) },
        attributes: ['id', 'organisationId'],
        required: true,
      }],
    });

    if (!shift) {
      return error(404, 'Shift not found');
    }

    if (!shift.startedAt) {
      return error(400, 'Shift has not started yet');
    }

    if (shift.completedAt) {
      return error(400, 'Shift has already been completed');
    }

    await shift.update({ completedAt: new Date() });

    return success({
      message: 'Shift completed successfully',
      shift,
    });
  } catch (err) {
    console.error('Complete rota shift error:', err);
    return error(500, err.message || 'Failed to complete shift');
  }
};
