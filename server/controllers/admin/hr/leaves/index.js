import { success, error } from '../../../../utils/response';
import { User, UserLeaveHistory } from '../../../../models';
import { getRouterParam, getQuery, readBody } from 'h3';

export const listLeaveRequests = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const organisationId = getRouterParam(event, 'orgId');
  const { status, userId, limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const whereClause = {
      organisationId: parseInt(organisationId, 10),
    };

    if (status && ['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    const leaves = await UserLeaveHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'photo'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return success({
      organisationId: parseInt(organisationId, 10),
      leaves: leaves.rows,
      total: leaves.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('List leave requests error:', err);
    return error(500, err.message || 'Failed to list leave requests');
  }
};

export const approveLeave = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const leaveId = getRouterParam(event, 'id');
    await readBody(event);

    if (!leaveId) {
      return error(400, 'id is required');
    }

    const leave = await UserLeaveHistory.findOne({
      where: {
        id: parseInt(leaveId, 10),
        status: 'Pending',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    if (!leave) {
      return error(404, 'Pending leave request not found');
    }

    await leave.update({
      status: 'Approved',
      approvedBy: admin.userId,
    });

    return success({
      message: 'Leave approved successfully',
      leave,
    });
  } catch (err) {
    console.error('Approve leave error:', err);
    return error(500, err.message || 'Failed to approve leave');
  }
};

export const rejectLeave = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const leaveId = getRouterParam(event, 'id');
    await readBody(event);

    if (!leaveId) {
      return error(400, 'id is required');
    }

    const leave = await UserLeaveHistory.findOne({
      where: {
        id: parseInt(leaveId, 10),
        status: 'Pending',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    if (!leave) {
      return error(404, 'Pending leave request not found');
    }

    await leave.update({
      status: 'Rejected',
      approvedBy: admin.userId,
    });

    return success({
      message: 'Leave rejected successfully',
      leave,
    });
  } catch (err) {
    console.error('Reject leave error:', err);
    return error(500, err.message || 'Failed to reject leave');
  }
};
