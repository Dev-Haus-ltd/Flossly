import { success, error } from '../utils/response';
import { 
  User, UserOrganisation, Organisation, Role, LoginHistory, UserSubscription, UserPreference,
  UserDocument, CrmLead, UserTask, DiaryAppointment, UserNotification, Task, TaskCategory
} from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../utils/db';
import { sendInvitationEmail } from '../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../utils/stripe';


/**
 * Search users with advanced filters
 * Returns users with their roles, organizations, and last login info
 */
export const searchUsers = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const {
    search,
    roleId,
    status,
    organisationId,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = query;

  try {
    const whereClause = {};

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (roleId) {
      whereClause.roleId = roleId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType']
        },
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          ...(organisationId && { where: { organisationId } }),
          include: [
            {
              model: Organisation,
              as: 'organisation',
              attributes: ['id', 'name', 'status']
            }
          ]
        },
        {
          model: LoginHistory,
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false,
          attributes: ['id', 'createdAt', 'browserAgent']
        }
      ],
      attributes: {
        exclude: ['password']
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    return success({
      users: users.rows,
      total: users.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Search users error:', err);
    return error(500, err.message);
  }
};

/**
 * Get detailed user information by ID
 * Includes all organizations, roles, and login history
 */
export const getUserById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { userId } = query;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: Organisation,
              as: 'organisation'
            }
          ]
        },
        {
          model: LoginHistory,
          limit: 20,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'createdAt', 'browserAgent']
        }
      ],
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return error(404, "User not found");
    }

    return success(user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    return error(500, err.message);
  }
};

/**
 * Get all roles in the system
 */
export const getAllRoles = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const roles = await Role.findAll({
      order: [['id', 'ASC']]
    });

    return success(roles);
  } catch (err) {
    console.error('Get all roles error:', err);
    return error(500, err.message);
  }
};

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, status } = body;

  if (!userId || !status) {
    return error(400, "userId and status are required");
  }

  if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
    return error(400, "Invalid status. Must be Active, Inactive, or Suspended");
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return error(404, "User not found");
    }

    user.status = status;
    await user.save();

    return success({
      message: `User status updated to ${status}`,
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Update user status error:', err);
    return error(500, err.message);
  }
};

/**
 * Get login history for a specific user
 */
export const getUserLoginHistory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { userId, limit = 50, offset = 0 } = query;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    const loginHistory = await LoginHistory.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      loginHistory: loginHistory.rows,
      total: loginHistory.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get user login history error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin-assisted reset password
 * Allows admins to reset a user's password without OTP verification
 */
export const resetUserPassword = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, newPassword } = body;

  if (!userId || !newPassword) {
    return error(400, "userId and newPassword are required");
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return error(400, "Password must be at least 8 characters long");
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return error(404, "User not found");
    }

    // Hash the new password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Get admin user details for logging
    const adminUser = await User.findByPk(admin.userId);

    return success({
      message: `Password reset successfully for ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      resetBy: adminUser ? adminUser.fullName : 'Admin'
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations with trials expiring in X days
 * Monitors organizations with trial periods ending soon (uses UserPreferences)
 */
export const getOrgsTrialsExpiringInXDays = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { days = 7, limit = 50, offset = 0 } = query;

  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Get all trial licenses from UserPreferences
    const trialPreferences = await UserPreference.findAll({
      where: {
        licenseType: 'Trial',
        licenseRenewalDate: {
          [Op.lte]: endDate,
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Fetch organisations separately
    const orgIds = [...new Set(trialPreferences.map(p => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    const expiringTrials = trialPreferences.map(pref => {
      const daysRemaining = Math.ceil((new Date(pref.licenseRenewalDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        organisationId: pref.organisationId,
        organisationName: orgMap[pref.organisationId] || 'Unknown',
        userId: pref.userId,
        userName: pref.user?.fullName,
        userEmail: pref.user?.email,
        licenseType: pref.licenseType,
        licenseBillingCycle: pref.licenseBillingCycle,
        licenseRenewalDate: pref.licenseRenewalDate,
        daysRemaining: daysRemaining
      };
    });

    // Sort by days remaining (ascending)
    expiringTrials.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Apply pagination
    const paginatedResults = expiringTrials.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      trials: paginatedResults,
      total: expiringTrials.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      daysFilter: parseInt(days)
    });
  } catch (err) {
    console.error('Get trials expiring error:', err);
    return error(500, err.message);
  }
};

/**
 * Get past-due organisations
 * Organizations with overdue payments (uses UserSubscriptions.stripeSubscriptionStatus)
 */
export const getPastDueOrgs = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  try {
    // Query subscriptions with past_due status from local DB
    const subscriptions = await UserSubscription.findAll({
      where: {
        stripeSubscriptionStatus: {
          [Op.in]: ['past_due', 'unpaid']
        }
      },
      include: [
        {
          model: Organisation,
          as: 'organisation',
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    const pastDueOrgs = subscriptions.map(sub => ({
      organisationId: sub.organisationId,
      organisationName: sub.organisation?.name,
      userId: sub.userId,
      userName: sub.user?.fullName,
      userEmail: sub.user?.email,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      status: sub.stripeSubscriptionStatus,
      packagePriceId: sub.packagePriceId
    }));

    // Apply pagination
    const paginatedResults = pastDueOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: pastDueOrgs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get past due orgs error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations above seat limit
 * Organizations exceeding their subscription user limit
 */
export const getOrgsAboveSeatLimit = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  try {
    const organisations = await Organisation.findAll({
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'status']
            }
          ]
        }
      ]
    });

    const orgsAboveLimit = [];

    for (const org of organisations) {
      // Count active users in organization
      const activeUserCount = org.userOrganisations?.filter(
        uo => uo.user?.status === 'Active'
      ).length || 0;

      // Get subscription for this org
      const subscription = await UserSubscription.findOne({
        where: { organisationId: org.id }
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
            expand: ['items.data.price']
          });

          // Get quantity (seat limit) from subscription
          const seatLimit = stripeSub.items?.data?.[0]?.quantity || 0;

          if (activeUserCount > seatLimit) {
            orgsAboveLimit.push({
              organisationId: org.id,
              organisationName: org.name,
              seatLimit: seatLimit,
              activeUsers: activeUserCount,
              overage: activeUserCount - seatLimit,
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              status: stripeSub.status
            });
          }
        } catch (err) {
          console.error(`Error fetching subscription for org ${org.id}:`, err.message);
        }
      }
    }

    // Sort by overage (descending)
    orgsAboveLimit.sort((a, b) => b.overage - a.overage);

    // Apply pagination
    const paginatedResults = orgsAboveLimit.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: orgsAboveLimit.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get clinics above seat limit error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations by plan type
 * Group organizations by their subscription plan (uses UserPreferences.licenseType)
 */
export const getOrgsByPlanType = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { planType, limit = 50, offset = 0 } = query;

  try {
    // Get all user preferences with license info
    const preferences = await UserPreference.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Fetch organisations separately
    const orgIds = [...new Set(preferences.map(p => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    const orgsByPlan = {};
    const filteredOrgs = [];

    for (const pref of preferences) {
      const planName = pref.licenseType || 'Unknown'; // Trial, Drift, Glide, Soar, System
      
      const orgInfo = {
        organisationId: pref.organisationId,
        organisationName: orgMap[pref.organisationId] || 'Unknown',
        userId: pref.userId,
        userName: pref.user?.fullName,
        userEmail: pref.user?.email,
        licenseType: pref.licenseType,
        licenseBillingCycle: pref.licenseBillingCycle,
        licenseRenewalDate: pref.licenseRenewalDate
      };

      // Group by plan
      if (!orgsByPlan[planName]) {
        orgsByPlan[planName] = [];
      }
      orgsByPlan[planName].push(orgInfo);

      // Filter if planType specified
      if (planType) {
        if (planName.toLowerCase().includes(planType.toLowerCase())) {
          filteredOrgs.push(orgInfo);
        }
      }
    }

    // If filtering by plan type
    if (planType) {
      const paginatedResults = filteredOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      return success({
        organisations: paginatedResults,
        total: filteredOrgs.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        planTypeFilter: planType
      });
    }

    // Return summary by plan type
    const summary = Object.keys(orgsByPlan).map(plan => ({
      planName: plan,
      count: orgsByPlan[plan].length,
      organisations: orgsByPlan[plan]
    }));

    return success({
      summary: summary,
      totalPlans: summary.length,
      totalOrganisations: preferences.length
    });
  } catch (err) {
    console.error('Get orgs by plan type error:', err);
    return error(500, err.message);
  }
};

/**
 * Get usage metrics across the entire system
 * Tracks users, storage, docs, leads, tasks, diary, notifications
 */
export const getUsageMetrics = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, startDate, endDate } = query;

  try {
    const whereClause = {};
    const dateFilter = {};

    // Filter by organisation if specified
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }

    // Date range filter for created records
    if (startDate || endDate) {
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
    }

    // Build user query with organisation filter
    let userQuery = {};
    if (organisationId) {
      // Get user IDs for this organisation
      const userOrgs = await UserOrganisation.findAll({
        where: { organisationId: parseInt(organisationId) },
        attributes: ['userId']
      });
      const userIds = userOrgs.map(uo => uo.userId);
      userQuery = { id: { [Op.in]: userIds } };
    }

    // Run all queries in parallel for performance
    const [
      // User metrics
      totalUsers,
      activeUsers,
      invitedUsers,
      disabledUsers,
      expiredUsers,
      
      // Documents
      totalDocuments,
      
      // CRM Leads
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      
      // Tasks
      totalTasks,
      overdueTasks,
      
      // Diary/Appointments
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      
      // Notifications
      totalNotifications,
      unreadNotifications
    ] = await Promise.all([
      // Users (with org filter if specified)
      User.count({ where: userQuery }),
      User.count({ where: { ...userQuery, status: 'Active' } }),
      User.count({ where: { ...userQuery, status: 'Invited' } }),
      User.count({ where: { ...userQuery, status: 'Disabled' } }),
      User.count({ where: { ...userQuery, status: 'Expired' } }),
      
      // Documents
      UserDocument.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      
      // Leads
      CrmLead.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'New', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Contacted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Converted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      
      // Tasks
      UserTask.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserTask.count({ 
        where: { 
          ...whereClause, 
          dueDate: { [Op.lt]: new Date() }
        } 
      }),
      
      // Appointments
      DiaryAppointment.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      DiaryAppointment.count({ 
        where: { 
          ...whereClause, 
          startTime: { [Op.gte]: new Date() }
        } 
      }),
      DiaryAppointment.count({ 
        where: { 
          ...whereClause, 
          status: 'Completed'
        } 
      }),
      
      // Notifications
      UserNotification.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserNotification.count({ where: { ...whereClause, isRead: false } })
    ]);

    // Get organisation name if filtering
    let organisationName = null;
    if (organisationId) {
      const org = await Organisation.findByPk(organisationId, { attributes: ['name'] });
      organisationName = org?.name || 'Unknown';
    }

    return success({
      filters: {
        organisationId: organisationId || 'All',
        organisationName: organisationName || 'All Organisations',
        startDate: startDate || null,
        endDate: endDate || null
      },
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          invited: invitedUsers,
          disabled: disabledUsers,
          expired: expiredUsers
        },
        documents: {
          total: totalDocuments
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          converted: convertedLeads,
          conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) + '%' : '0%'
        },
        tasks: {
          total: totalTasks,
          overdue: overdueTasks
        },
        diary: {
          totalAppointments: totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments,
          completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) + '%' : '0%'
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications,
          readRate: totalNotifications > 0 ? (((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(2) + '%' : '0%'
        }
      },
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('Get usage metrics error:', err);
    return error(500, err.message);
  }
};

/**
 * Export tasks for a specific organisation
 * Returns CSV file for download
 */
export const exportOrgTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, format = 'csv' } = query;

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    // Get organisation details
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Get all tasks for this organisation with related data
    const tasks = await UserTask.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Organisation ID': task.organisationId,
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        organisationId: organisation.id,
        organisationName: organisation.name,
        totalTasks: tasks.length,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_org_${organisationId}_${organisation.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export org tasks error:', err);
    return error(500, err.message);
  }
};

/**
 * Export all tasks from all organisations (Super Admin only)
 * Returns CSV file for download
 */
export const exportAllTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { format = 'csv' } = query;

  try {
    // Get all tasks with organisation and user data
    const tasks = await UserTask.findAll({
      include: [
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Organisation ID': task.organisationId,
      'Organisation Name': task.organisation?.name || '',
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // Get organisation summary
    const orgSummary = {};
    tasks.forEach(task => {
      const orgName = task.organisation?.name || 'Unknown';
      orgSummary[orgName] = (orgSummary[orgName] || 0) + 1;
    });

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        totalTasks: tasks.length,
        totalOrganisations: Object.keys(orgSummary).length,
        organisationSummary: orgSummary,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_all_organisations_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export all tasks error:', err);
    return error(500, err.message);
  }
};

/**
 * Get task pool (Super Admin)
 * View all system template tasks that can be assigned to users
 * Only shows system tasks (not org-specific tasks)
 */
export const getTaskPool = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { categoryId, roleId, limit = 100, offset = 0 } = query;

  try {
    // Build where clause - always filter for system tasks only
    const whereClause = {
      isSystemTask: true  // Only show system tasks
    };
    
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }
    
    if (roleId) {
      whereClause.roleId = parseInt(roleId);
    }

    // Get all tasks
    const tasks = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TaskCategory,
          as: 'category',
          attributes: ['id', 'name', 'description', 'color', 'organisationId'],
          required: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['isSystemTask', 'DESC'], ['title', 'ASC']],
      distinct: true
    });

    // Get category summary
    const categorySummary = {};
    tasks.rows.forEach(task => {
      const catName = task.category?.name || 'Uncategorized';
      categorySummary[catName] = (categorySummary[catName] || 0) + 1;
    });

    return success({
      totalTasks: tasks.count,
      categorySummary: categorySummary,
      limit: parseInt(limit),
      offset: parseInt(offset),
      tasks: tasks.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : null,
        roleId: task.roleId,
        role: task.role ? {
          id: task.role.id,
          title: task.role.title,
          roleType: task.role.roleType
        } : null,
        defaultFrequency: task.defaultFrequency,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });
  } catch (err) {
    console.error('Get all task pools error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin-assisted resend invite
 * Resends invitation email to users with status "Invited"
 */
export const resendInvite = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, organisationId } = body;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    // Get user details
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: Organisation,
              as: 'organisation'
            }
          ]
        }
      ]
    });

    if (!user) {
      return error(404, "User not found");
    }

    // Check if user status is "Invited"
    if (user.status !== 'Invited') {
      return error(400, `User status is "${user.status}". Only users with status "Invited" can receive resend invitations.`);
    }

    // Find the organization to get details for email
    let targetOrganisation = null;
    
    if (organisationId) {
      // Specific organization requested
      const userOrg = user.userOrganisations.find(
        uo => uo.organisationId === parseInt(organisationId)
      );
      
      if (!userOrg) {
        return error(404, "User is not associated with the specified organization");
      }
      
      targetOrganisation = userOrg.organisation;
    } else {
      // Use first organization if not specified
      if (!user.userOrganisations || user.userOrganisations.length === 0) {
        return error(400, "User is not associated with any organization");
      }
      
      targetOrganisation = user.userOrganisations[0].organisation;
    }

    // Generate new invite token if not exists
    if (!user.inviteToken) {
      user.inviteToken = uuidv4();
      await user.save();
    }

    // Get admin user details for "invited by" field
    const adminUser = await User.findByPk(admin.userId);
    const managerName = adminUser ? adminUser.fullName : 'Admin';

    // Send invitation email
    await sendInvitationEmail({
      email: user.email,
      orgTitle: targetOrganisation.name,
      link: user.inviteToken,
      manager: managerName
    });

    return success({
      message: `Invitation email resent successfully to ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      },
      organisation: {
        id: targetOrganisation.id,
        name: targetOrganisation.name
      },
      sentBy: managerName
    });
  } catch (err) {
    console.error('Resend invite error:', err);
    return error(500, err.message);
  }
};

