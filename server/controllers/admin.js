import { success, error } from '../utils/response';
import { 
  User, UserOrganisation, Organisation, Role, LoginHistory, UserSubscription, UserPreference,
  UserDocument, CrmLead, UserTask, DiaryAppointment, UserNotification, Task, TaskCategory,
  CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, FcmToken, UserPoint, UserPointsHistory, RewardPoint
} from '../models';
import { Op } from 'sequelize';
import sequelize from '../utils/db';
import { sendInvitationEmail } from '../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../utils/stripe';
import { getS3Object } from '../utils/s3';
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification';


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
 * Get global default CRM automation library
 * View all system automation templates available to all practices
 */
export const getGlobalAutomationLibrary = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { type, enabled, limit = 100, offset = 0 } = query;

  try {
    // Build where clause - get templates that are system defaults (source = 'system')
    const whereClause = {};
    
    if (type) {
      whereClause.type = type; // Email, SMS, WhatsApp
    }
    
    if (enabled !== undefined) {
      whereClause.enabled = enabled === 'true';
    }

    // Get automation groups with source = 'system'
    const groups = await CrmAutomationGroup.findAll({
      where: { source: 'system' },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']]
    });

    // For each group, get the actual templates by templateKey
    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map(t => t.templateKey) || [];
      
      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          ...whereClause
        }
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map(template => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger
        }))
      };
    }));

    // Get statistics
    const totalTemplates = await CrmAutomationTemplate.count();
    const enabledTemplates = await CrmAutomationTemplate.count({ where: { enabled: true } });

    return success({
      totalGroups: groupsWithTemplates.length,
      totalTemplates: totalTemplates,
      enabledTemplates: enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates
    });
  } catch (err) {
    console.error('Get global automation library error:', err);
    return error(500, err.message);
  }
};

/**
 * Get practice-specific CRM automation library
 * View automation templates for a specific organisation
 */
export const getPracticeAutomationLibrary = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, type, enabled, limit = 100, offset = 0 } = query;

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

    // Build where clause for templates
    const templateWhere = {};
    
    if (type) {
      templateWhere.type = type;
    }
    
    if (enabled !== undefined) {
      templateWhere.enabled = enabled === 'true';
    }

    // Get automation groups for this organisation
    const groups = await CrmAutomationGroup.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']]
    });

    // For each group, get the actual templates by templateKey
    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map(t => t.templateKey) || [];
      
      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          organisationId: parseInt(organisationId),
          ...templateWhere
        }
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map(template => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger
        }))
      };
    }));

    // Get statistics for this org
    const totalTemplates = await CrmAutomationTemplate.count({ 
      where: { organisationId: parseInt(organisationId) } 
    });
    const enabledTemplates = await CrmAutomationTemplate.count({ 
      where: { organisationId: parseInt(organisationId), enabled: true } 
    });

    return success({
      organisationId: organisation.id,
      organisationName: organisation.name,
      totalGroups: groupsWithTemplates.length,
      totalTemplates: totalTemplates,
      enabledTemplates: enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates
    });
  } catch (err) {
    console.error('Get practice automation library error:', err);
    return error(500, err.message);
  }
};

/**
 * Activate or deactivate a CRM automation template
 * Controls whether an automation template is active
 */
export const toggleAutomationTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { templateId, enabled } = body;

  if (!templateId) {
    return error(400, "templateId is required");
  }

  if (enabled === undefined) {
    return error(400, "enabled is required (true or false)");
  }

  try {
    const template = await CrmAutomationTemplate.findByPk(templateId);

    if (!template) {
      return error(404, "Automation template not found");
    }

    // Update enabled status
    template.enabled = enabled;
    await template.save();

    return success({
      message: `Automation template ${enabled ? 'activated' : 'deactivated'} successfully`,
      template: {
        id: template.id,
        key: template.key,
        name: template.name,
        type: template.type,
        enabled: template.enabled,
        updatedBy: admin.userId,
        updatedAt: template.updatedAt
      }
    });
  } catch (err) {
    console.error('Toggle automation template error:', err);
    return error(500, err.message);
  }
};

/**
 * Get storage usage per practice
 * Track Flossly Docs storage usage for each organisation
 */
export const getStorageUsagePerPractice = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, includeDetails = 'false' } = query;

  try {
    let whereClause = {};
    
    // Filter by specific organisation if provided
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }

    // Get all documents
    const documents = await UserDocument.findAll({
      where: whereClause,
      attributes: ['id', 'link', 'name', 'organisationId', 'createdAt']
    });

    // Get unique organisation IDs and fetch organisation details
    const orgIds = [...new Set(documents.map(doc => doc.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    // Group documents by organisation
    const orgGroups = {};
    documents.forEach(doc => {
      const orgId = doc.organisationId;
      if (!orgGroups[orgId]) {
        orgGroups[orgId] = {
          organisationId: orgId,
          organisationName: orgMap[orgId] || 'Unknown',
          documents: []
        };
      }
      orgGroups[orgId].documents.push(doc);
    });

    // Calculate storage for each organisation
    const storageByOrg = await Promise.all(
      Object.values(orgGroups).map(async (orgGroup) => {
        let totalSize = 0;
        let successCount = 0;
        let errorCount = 0;
        const documentDetails = [];

        // Get size of each document from S3
        for (const doc of orgGroup.documents) {
          if (!doc.link) {
            errorCount++;
            continue;
          }

          try {
            const s3Object = await getS3Object(doc.link);
            const fileSize = s3Object.contentLength || 0;
            totalSize += fileSize;
            successCount++;

            if (includeDetails === 'true') {
              documentDetails.push({
                id: doc.id,
                name: doc.name,
                link: doc.link,
                sizeBytes: fileSize,
                sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
                createdAt: doc.createdAt
              });
            }
          } catch (err) {
            console.error(`Error getting size for document ${doc.id}:`, err.message);
            errorCount++;
          }
        }

        return {
          organisationId: orgGroup.organisationId,
          organisationName: orgGroup.organisationName,
          totalDocuments: orgGroup.documents.length,
          successfullyScanned: successCount,
          errors: errorCount,
          totalSizeBytes: totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
          ...(includeDetails === 'true' && { documents: documentDetails })
        };
      })
    );

    // Sort by storage size descending
    storageByOrg.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    // Calculate totals
    const totalStats = storageByOrg.reduce((acc, org) => ({
      totalDocuments: acc.totalDocuments + org.totalDocuments,
      totalSizeBytes: acc.totalSizeBytes + org.totalSizeBytes,
      totalOrganisations: acc.totalOrganisations + 1
    }), { totalDocuments: 0, totalSizeBytes: 0, totalOrganisations: 0 });

    return success({
      summary: {
        totalOrganisations: totalStats.totalOrganisations,
        totalDocuments: totalStats.totalDocuments,
        totalStorageBytes: totalStats.totalSizeBytes,
        totalStorageMB: (totalStats.totalSizeBytes / (1024 * 1024)).toFixed(2),
        totalStorageGB: (totalStats.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4)
      },
      organisations: storageByOrg
    });
  } catch (err) {
    console.error('Get storage usage error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin broadcast notification
 * Send notification to all users or filtered users via FCM and in-app
 */
export const broadcastNotification = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { title, message, organisationId, roleId, priority = 'medium', data = {} } = body;

  if (!title || !message) {
    return error(400, "title and message are required");
  }

  try {
    // Build user filter - include Active users and users with NULL status
    const userWhere = { 
      [Op.or]: [
        { status: 'Active' },
        { status: null }
      ]
    };
    
    if (organisationId) {
      // Get users in specific organisation
      const userOrgs = await UserOrganisation.findAll({
        where: { organisationId: parseInt(organisationId) },
        attributes: ['userId']
      });
      userWhere.id = { [Op.in]: userOrgs.map(uo => uo.userId) };
    }
    
    if (roleId) {
      userWhere.roleId = parseInt(roleId);
    }

    // Get target users
    const targetUsers = await User.findAll({
      where: userWhere,
      attributes: ['id', 'fullName', 'email']
    });

    if (targetUsers.length === 0) {
      return error(400, "No users found matching the criteria");
    }

    const userIds = targetUsers.map(u => u.id);

    // Send FCM notifications (this will create notification records for each user)
    let sentCount = 0;
    let failedCount = 0;
    const fcmResults = [];

    if (userIds.length > 0) {
      try {
        const results = await sendNotificationToMultipleUsers({
          userIds,
          organisationId: organisationId || null,
          title,
          body: message,
          type: 'admin_broadcast',
          referenceType: null,
          referenceId: null,
          data: {
            ...data,
            broadcastBy: admin.userId,
            broadcastAt: new Date().toISOString()
          },
          priority
        });

        // Count successes and failures from results
        results.forEach(result => {
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
        });

        fcmResults.push(...results);

        // Mark notifications as sent (only for users who received the notification successfully)
        const successfulNotificationIds = results
          .filter(r => r.success && r.notificationId)
          .map(r => r.notificationId);
        
        if (successfulNotificationIds.length > 0) {
          await UserNotification.update(
            { isSent: true, sentAt: new Date() },
            { where: { id: { [Op.in]: successfulNotificationIds } } }
          );
        }
      } catch (err) {
        console.error('FCM broadcast error:', err);
        failedCount = userIds.length;
      }
    }

    return success({
      message: 'Broadcast notification sent successfully',
      stats: {
        totalUsers: targetUsers.length,
        notificationsCreated: sentCount + failedCount,
        fcmSent: sentCount,
        fcmFailed: failedCount,
        usersWithoutFcmTokens: targetUsers.length - sentCount - failedCount
      },
      broadcast: {
        title,
        message,
        priority,
        organisationId: organisationId || 'All',
        roleId: roleId || 'All',
        broadcastBy: admin.userId,
        broadcastAt: new Date()
      }
    });
  } catch (err) {
    console.error('Broadcast notification error:', err);
    return error(500, err.message);
  }
};

/**
 * Get notification delivery statistics
 * Track notification delivery success/failure rates
 */
export const getNotificationDeliveryStats = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, startDate, endDate, type } = query;

  try {
    // Build where clause
    const whereClause = {};
    
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    // Get statistics
    const [
      totalNotifications,
      sentNotifications,
      failedNotifications,
      readNotifications,
      unreadNotifications
    ] = await Promise.all([
      UserNotification.count({ where: whereClause }),
      UserNotification.count({ where: { ...whereClause, isSent: true } }),
      UserNotification.count({ where: { ...whereClause, isSent: false, errorMessage: { [Op.ne]: null } } }),
      UserNotification.count({ where: { ...whereClause, isRead: true } }),
      UserNotification.count({ where: { ...whereClause, isRead: false } })
    ]);

    // Get stats by type
    const notificationsByType = await UserNotification.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isSent" = true THEN 1 ELSE 0 END')), 'sent'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isRead" = true THEN 1 ELSE 0 END')), 'read']
      ],
      group: ['type'],
      raw: true
    });

    // Get stats by priority
    const notificationsByPriority = await UserNotification.findAll({
      where: whereClause,
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isRead" = true THEN 1 ELSE 0 END')), 'read']
      ],
      group: ['priority'],
      raw: true
    });

    // Calculate rates
    const deliveryRate = totalNotifications > 0 ? ((sentNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';
    const readRate = totalNotifications > 0 ? ((readNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';
    const failureRate = totalNotifications > 0 ? ((failedNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';

    return success({
      summary: {
        totalNotifications,
        sent: sentNotifications,
        failed: failedNotifications,
        read: readNotifications,
        unread: unreadNotifications,
        deliveryRate,
        readRate,
        failureRate
      },
      byType: notificationsByType.map(item => ({
        type: item.type,
        total: parseInt(item.count),
        sent: parseInt(item.sent || 0),
        read: parseInt(item.read || 0),
        readRate: item.count > 0 ? ((parseInt(item.read || 0) / parseInt(item.count)) * 100).toFixed(2) + '%' : '0%'
      })),
      byPriority: notificationsByPriority.map(item => ({
        priority: item.priority,
        total: parseInt(item.count),
        read: parseInt(item.read || 0),
        readRate: item.count > 0 ? ((parseInt(item.read || 0) / parseInt(item.count)) * 100).toFixed(2) + '%' : '0%'
      })),
      filters: {
        organisationId: organisationId || 'All',
        type: type || 'All',
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (err) {
    console.error('Get notification delivery stats error:', err);
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


/**
 * Deduct points from a user (Admin only - for correction/fraud)
 * POST /api/admin/deduct-points
 */
export const deductPoints = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { userId, points, reason } = body;

    // Validate input
    if (!userId || !points || !reason) {
      return error(400, "userId, points, and reason are required");
    }

    if (typeof points !== 'number' || points <= 0) {
      return error(400, "Points must be a positive number");
    }

    if (reason.trim().length < 10) {
      return error(400, "Reason must be at least 10 characters long");
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return error(404, "User not found");
    }

    // For non-super admins (roleId 17 is super admin), verify user belongs to same organization
    // Note: Regular admins have roleId 8, super admin has roleId 17
    if (admin.roleId !== 17) {
      const userOrg = await UserOrganisation.findOne({
        where: { userId }
      });

      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });

      if (!userOrg || !adminOrg || userOrg.organisationId !== adminOrg.organisationId) {
        return error(403, "You can only deduct points from users in your organization");
      }
    }

    // Get user's current points
    let userPoints = await UserPoint.findOne({ where: { userId } });
    
    if (!userPoints) {
      return error(404, "User has no points record");
    }

    if (userPoints.balance < points) {
      return error(400, `Insufficient balance. User has ${userPoints.balance} points, cannot deduct ${points} points`);
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Deduct points from balance
      userPoints.balance -= points;
      await userPoints.save({ transaction });

      // Create negative points history entry
      await UserPointsHistory.create({
        userId,
        rewardPointId: null,
        points: -points, // Negative value to indicate deduction
        description: `[ADMIN DEDUCTION] ${reason} | Deducted by: ${admin.fullName || admin.email} (ID: ${admin.userId})`
      }, { transaction });

      await transaction.commit();

      return success({
        message: "Points deducted successfully",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        },
        pointsDeducted: points,
        newBalance: userPoints.balance,
        reason,
        deductedBy: {
          id: admin.userId,
          name: admin.fullName || admin.email
        },
        timestamp: new Date()
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Deduct points error:', err);
    return error(500, err.message || "Failed to deduct points");
  }
};

/**
 * Award points to a user (Admin only - for bonuses/rewards)
 * POST /api/admin/awardPoints
 */
export const awardPoints = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { userId, points, reason, rewardPointId } = body;

    // Validate input
    if (!userId || !points || !reason) {
      return error(400, "userId, points, and reason are required");
    }

    if (typeof points !== 'number' || points <= 0) {
      return error(400, "Points must be a positive number");
    }

    if (reason.trim().length < 10) {
      return error(400, "Reason must be at least 10 characters long");
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return error(404, "User not found");
    }

    // For non-super admins (roleId 17 is super admin), verify user belongs to same organization
    // Note: Regular admins have roleId 8, super admin has roleId 17
    if (admin.roleId !== 17) {
      const userOrg = await UserOrganisation.findOne({
        where: { userId }
      });

      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });

      if (!userOrg || !adminOrg || userOrg.organisationId !== adminOrg.organisationId) {
        return error(403, "You can only award points to users in your organization");
      }
    }

    // Verify rewardPointId if provided
    if (rewardPointId) {
      const rewardPoint = await RewardPoint.findByPk(rewardPointId);
      if (!rewardPoint) {
        return error(404, "Reward point definition not found");
      }
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get or create user's points record
      let userPoints = await UserPoint.findOne({ where: { userId } });
      
      if (!userPoints) {
        // First time earning points
        userPoints = await UserPoint.create({
          userId,
          balance: points,
          totalPointsRewarded: points,
          redeemed: 0
        }, { transaction });
      } else {
        // Add to existing balance
        userPoints.balance += points;
        userPoints.totalPointsRewarded += points;
        await userPoints.save({ transaction });
      }

      // Create positive points history entry
      await UserPointsHistory.create({
        userId,
        rewardPointId: rewardPointId || null,
        points: points, // Positive value
        description: `[ADMIN AWARD] ${reason} | Awarded by: ${admin.fullName || admin.email} (ID: ${admin.userId})`
      }, { transaction });

      await transaction.commit();

      return success({
        message: "Points awarded successfully",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        },
        pointsAwarded: points,
        newBalance: userPoints.balance,
        totalRewarded: userPoints.totalPointsRewarded,
        reason,
        awardedBy: {
          id: admin.userId,
          name: admin.fullName || admin.email
        },
        timestamp: new Date()
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Award points error:', err);
    return error(500, err.message || "Failed to award points");
  }
};

/**
 * Get points issued by admin users (reporting)
 * GET /api/admin/pointsIssuedByAdmin
 */
export const getPointsIssuedByAdmin = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, startDate, endDate, adminUserId, action } = query;

    // Build where clause for filtering
    const whereClause = {};
    
    // Filter by organisation (super admin can see all, regular admin only their org)
    if (admin.roleId !== 17) {
      // Regular admin - get their organisation
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      whereClause['$User.UserOrganisations.organisationId$'] = adminOrg.organisationId;
    } else if (organisationId) {
      // Super admin can filter by specific organisation
      whereClause['$User.UserOrganisations.organisationId$'] = parseInt(organisationId);
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Filter by specific admin user
    if (adminUserId) {
      whereClause.description = {
        [Op.like]: `%ID: ${adminUserId}%`
      };
    }

    // Filter by action type (AWARD or DEDUCTION)
    if (action) {
      if (action === 'award') {
        whereClause.description = {
          [Op.like]: '%[ADMIN AWARD]%'
        };
      } else if (action === 'deduct') {
        whereClause.description = {
          [Op.like]: '%[ADMIN DEDUCTION]%'
        };
      }
    }

    // Get all admin-issued points history
    const pointsHistory = await UserPointsHistory.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
          include: [
            {
              model: UserOrganisation,
              as: 'userOrganisations',
              attributes: ['organisationId'],
              include: [
                {
                  model: Organisation,
                  as: 'organisation',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Parse and aggregate data
    const adminStats = {};
    const orgStats = {};
    let totalAwarded = 0;
    let totalDeducted = 0;
    const transactions = [];

    pointsHistory.forEach(record => {
      const description = record.description || '';
      
      // Only process admin-issued points
      if (!description.includes('[ADMIN AWARD]') && !description.includes('[ADMIN DEDUCTION]')) {
        return;
      }

      const isAward = description.includes('[ADMIN AWARD]');
      const points = Math.abs(record.points);
      
      // Extract admin info from description
      const adminMatch = description.match(/by: (.+?) \(ID: (\d+)\)/);
      const adminName = adminMatch ? adminMatch[1] : 'Unknown';
      const adminId = adminMatch ? parseInt(adminMatch[2]) : null;

      // Track by admin user
      if (adminId) {
        if (!adminStats[adminId]) {
          adminStats[adminId] = {
            adminId,
            adminName,
            totalAwarded: 0,
            totalDeducted: 0,
            transactionCount: 0
          };
        }
        
        if (isAward) {
          adminStats[adminId].totalAwarded += points;
          totalAwarded += points;
        } else {
          adminStats[adminId].totalDeducted += points;
          totalDeducted += points;
        }
        adminStats[adminId].transactionCount++;
      }

      // Track by organisation
      const userOrg = record.user?.userOrganisations?.[0];
      if (userOrg && userOrg.organisation) {
        const orgId = userOrg.organisation.id;
        const orgName = userOrg.organisation.name;
        
        if (!orgStats[orgId]) {
          orgStats[orgId] = {
            organisationId: orgId,
            organisationName: orgName,
            totalAwarded: 0,
            totalDeducted: 0,
            transactionCount: 0
          };
        }
        
        if (isAward) {
          orgStats[orgId].totalAwarded += points;
        } else {
          orgStats[orgId].totalDeducted += points;
        }
        orgStats[orgId].transactionCount++;
      }

      // Add to transactions list
      transactions.push({
        id: record.id,
        userId: record.userId,
        userName: record.user?.fullName || 'Unknown',
        userEmail: record.user?.email,
        organisationId: userOrg?.organisation?.id,
        organisationName: userOrg?.organisation?.name,
        points: record.points,
        action: isAward ? 'award' : 'deduct',
        description: record.description,
        adminName,
        adminId,
        createdAt: record.createdAt
      });
    });

    return success({
      summary: {
        totalAwarded,
        totalDeducted,
        netChange: totalAwarded - totalDeducted,
        transactionCount: transactions.length
      },
      byAdmin: Object.values(adminStats).sort((a, b) => 
        (b.totalAwarded + b.totalDeducted) - (a.totalAwarded + a.totalDeducted)
      ),
      byOrganisation: Object.values(orgStats).sort((a, b) => 
        (b.totalAwarded + b.totalDeducted) - (a.totalAwarded + a.totalDeducted)
      ),
      transactions
    });

  } catch (err) {
    console.error('Get points issued by admin error:', err);
    return error(500, err.message || "Failed to get points issued by admin");
  }
};

/**
 * Get points totals by practice (reporting)
 * GET /api/admin/pointsTotalsByPractice
 */
export const getPointsTotalsByPractice = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, sortBy = 'totalPoints' } = query;

    // Build organisation filter
    let orgFilter = {};
    if (admin.roleId !== 17) {
      // Regular admin - only their organisation
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      orgFilter = { id: adminOrg.organisationId };
    } else if (organisationId) {
      // Super admin filtering by specific org
      orgFilter = { id: parseInt(organisationId) };
    }

    // Get all organisations with user point data
    const organisations = await Organisation.findAll({
      where: orgFilter,
      attributes: ['id', 'name'],
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          attributes: ['userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email'],
              include: [
                {
                  model: UserPoint,
                  as: 'userPoints',
                  attributes: ['balance', 'totalPointsRewarded', 'redeemed']
                }
              ]
            }
          ]
        }
      ]
    });

    const practiceStats = organisations.map(org => {
      const users = org.userOrganisations || [];
      
      let totalBalance = 0;
      let totalRewarded = 0;
      let totalRedeemed = 0;
      let usersWithPoints = 0;

      users.forEach(userOrg => {
        const user = userOrg.user;
        if (user && user.userPoints) {
          totalBalance += user.userPoints.balance || 0;
          totalRewarded += user.userPoints.totalPointsRewarded || 0;
          totalRedeemed += user.userPoints.redeemed || 0;
          usersWithPoints++;
        }
      });

      return {
        organisationId: org.id,
        organisationName: org.name,
        totalUsers: users.length,
        usersWithPoints,
        totalBalance,
        totalPointsRewarded: totalRewarded,
        totalPointsRedeemed: totalRedeemed,
        averageBalancePerUser: usersWithPoints > 0 ? Math.round(totalBalance / usersWithPoints) : 0,
        averageRewardedPerUser: usersWithPoints > 0 ? Math.round(totalRewarded / usersWithPoints) : 0
      };
    });

    // Sort results
    const sortField = {
      'totalPoints': 'totalPointsRewarded',
      'balance': 'totalBalance',
      'redeemed': 'totalPointsRedeemed',
      'users': 'usersWithPoints'
    }[sortBy] || 'totalPointsRewarded';

    practiceStats.sort((a, b) => b[sortField] - a[sortField]);

    // Calculate grand totals
    const grandTotals = practiceStats.reduce((acc, org) => ({
      totalOrganisations: acc.totalOrganisations + 1,
      totalUsers: acc.totalUsers + org.totalUsers,
      totalUsersWithPoints: acc.totalUsersWithPoints + org.usersWithPoints,
      totalBalance: acc.totalBalance + org.totalBalance,
      totalPointsRewarded: acc.totalPointsRewarded + org.totalPointsRewarded,
      totalPointsRedeemed: acc.totalPointsRedeemed + org.totalPointsRedeemed
    }), {
      totalOrganisations: 0,
      totalUsers: 0,
      totalUsersWithPoints: 0,
      totalBalance: 0,
      totalPointsRewarded: 0,
      totalPointsRedeemed: 0
    });

    return success({
      grandTotals,
      practices: practiceStats
    });

  } catch (err) {
    console.error('Get points totals by practice error:', err);
    return error(500, err.message || "Failed to get points totals by practice");
  }
};

/**
 * Search organisations by name (paginated)
 * GET /api/admin/searchOrganisations
 */
export const searchOrganisations = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { search = '', page = 1, limit = 20 } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    // For non-super admins, only show their organisation
    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      whereClause.id = adminOrg.organisationId;
    }

    // Add name search if provided
    if (search.trim()) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Get organisations with pagination
    const { count, rows: organisations } = await Organisation.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'contact', 'address', 'postalCode', 'type', 'status', 'createdAt'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    return success({
      organisations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Search organisations error:', err);
    return error(500, err.message || "Failed to search organisations");
  }
};

/**
 * Get organisation by ID
 * GET /api/admin/getOrganisationById?id=5
 */
export const getOrganisationById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Organisation ID is required");
    }

    // For non-super admins, verify they can access this organisation
    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      
      if (!adminOrg || adminOrg.organisationId !== parseInt(id)) {
        return error(403, "You can only access your own organisation");
      }
    }

    // Get organisation with user count
    const organisation = await Organisation.findByPk(parseInt(id), {
      attributes: ['id', 'name', 'contact', 'address', 'postalCode', 'description', 'type', 'status', 'surgeryCount', 'teamCount', 'managerId', 'createdAt', 'updatedAt'],
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          attributes: ['userId', 'createdAt'],
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

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Format response
    const users = organisation.userOrganisations?.map(uo => ({
      userId: uo.user?.id,
      fullName: uo.user?.fullName,
      email: uo.user?.email,
      status: uo.user?.status,
      joinedAt: uo.createdAt
    })) || [];

    return success({
      organisation: {
        id: organisation.id,
        name: organisation.name,
        contact: organisation.contact,
        address: organisation.address,
        postalCode: organisation.postalCode,
        description: organisation.description,
        type: organisation.type,
        status: organisation.status,
        surgeryCount: organisation.surgeryCount,
        teamCount: organisation.teamCount,
        managerId: organisation.managerId,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        userCount: users.length,
        users
      }
    });

  } catch (err) {
    console.error('Get organisation by ID error:', err);
    return error(500, err.message || "Failed to get organisation");
  }
};

/**
 * Search roles by name (paginated)
 * GET /api/admin/searchRoles
 */
export const searchRoles = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { search = '', page = 1, limit = 20 } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    // Add title search if provided
    if (search.trim()) {
      whereClause.title = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Get roles with pagination
    const { count, rows: roles } = await Role.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'title', 'roleType', 'description', 'icon', 'color', 'createdAt'],
      order: [['title', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Get user count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.count({
          where: { roleId: role.id }
        });
        
        return {
          id: role.id,
          title: role.title,
          roleType: role.roleType,
          description: role.description,
          icon: role.icon,
          color: role.color,
          userCount,
          createdAt: role.createdAt
        };
      })
    );

    return success({
      roles: rolesWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Search roles error:', err);
    return error(500, err.message || "Failed to search roles");
  }
};
