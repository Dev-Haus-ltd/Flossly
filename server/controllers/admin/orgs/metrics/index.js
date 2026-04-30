import { success, error } from '../../../../utils/response';
import {
  User,
  UserOrganisation,
  Organisation,
  UserDocument,
  CrmLead,
  UserTask,
  DiaryAppointment,
  UserNotification,
} from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery } from 'h3';

export const getUsageMetrics = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const organisationId = getRouterParam(event, 'orgId');
  const { startDate, endDate } = query;

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const whereClause = {};
    const dateFilter = {};

    whereClause.organisationId = parseInt(organisationId, 10);

    if (startDate || endDate) {
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
    }

    let userQuery = {};
    if (organisationId) {
      const userOrgs = await UserOrganisation.findAll({
        where: { organisationId: parseInt(organisationId) },
        attributes: ['userId'],
      });
      const userIds = userOrgs.map((uo) => uo.userId);
      userQuery = { id: { [Op.in]: userIds } };
    }

    const [
      totalUsers,
      activeUsers,
      invitedUsers,
      disabledUsers,
      expiredUsers,
      totalDocuments,
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      totalTasks,
      overdueTasks,
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      User.count({ where: userQuery }),
      User.count({ where: { ...userQuery, status: 'Active' } }),
      User.count({ where: { ...userQuery, status: 'Invited' } }),
      User.count({ where: { ...userQuery, status: 'Disabled' } }),
      User.count({ where: { ...userQuery, status: 'Expired' } }),
      UserDocument.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'New', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Contacted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Converted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserTask.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserTask.count({
        where: {
          ...whereClause,
          dueDate: { [Op.lt]: new Date() },
        },
      }),
      DiaryAppointment.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      DiaryAppointment.count({
        where: {
          ...whereClause,
          startTime: { [Op.gte]: new Date() },
        },
      }),
      DiaryAppointment.count({
        where: {
          ...whereClause,
          status: 'Completed',
        },
      }),
      UserNotification.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserNotification.count({ where: { ...whereClause, isRead: false } }),
    ]);

    let organisationName = null;
    if (organisationId) {
      const org = await Organisation.findByPk(organisationId, { attributes: ['name'] });
      organisationName = org?.name || 'Unknown';
    }

    return success({
      filters: {
        organisationId: parseInt(organisationId, 10),
        organisationName: organisationName || 'Unknown',
        startDate: startDate || null,
        endDate: endDate || null,
      },
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          invited: invitedUsers,
          disabled: disabledUsers,
          expired: expiredUsers,
        },
        documents: {
          total: totalDocuments,
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          converted: convertedLeads,
          conversionRate: totalLeads > 0 ? `${((convertedLeads / totalLeads) * 100).toFixed(2)}%` : '0%',
        },
        tasks: {
          total: totalTasks,
          overdue: overdueTasks,
        },
        diary: {
          totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments,
          completionRate: totalAppointments > 0 ? `${((completedAppointments / totalAppointments) * 100).toFixed(2)}%` : '0%',
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications,
          readRate: totalNotifications > 0 ? `${(((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(2)}%` : '0%',
        },
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    console.error('Get usage metrics error:', err);
    return error(500, err.message);
  }
};
