import { success, error } from '../../utils/response';
import {
  User, UserOrganisation, Organisation, Role, LoginHistory, UserSubscription, UserPreference,
  UserDocument, UserDocumentFolder, CrmLead, UserTask, DiaryAppointment, UserNotification, Task, TaskCategory,
  CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, FcmToken, UserPoint, UserPointsHistory, RewardPoint,
  CrmOption, DictionaryScript, Rota, RotaShift, RotaUser, UserLeaveHistory,
  CrmAutomationDictionaryGroup, CrmAutomationDictionaryTemplate,
  ClinicalNoteTemplate, ClinicalNoteTemplateVersion,
} from '../../models';
import { seedCrmAutomationDictionary as runSeedCrmAutomationDictionary } from '../../utils/seedCrmAutomationDictionary';
import { seedConsentFormTemplates as runSeedConsentFormTemplates } from '../../utils/seedConsentFormTemplates';
import { Op, fn, col } from 'sequelize';
import { getRouterParam, getQuery, readBody, setResponseHeader } from 'h3';
import sequelize from '../../utils/db';
import { sendInvitationEmail } from '../../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../../utils/stripe';
import { getS3Object } from '../../utils/s3';
import { sendNotificationToMultipleUsers } from '../../utils/fcmNotification';
import { bulkUploadAutomations as crmBulkUploadAutomations, bulkUploadLeads as crmBulkUploadLeads } from '../crm';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import * as XLSX from 'xlsx';
import {
  createClinicalTemplateWithVersion,
  sanitizeClinicalNoteTemplatePayload,
  serializeClinicalTemplate,
  serializeClinicalTemplateVersion,
  updateClinicalTemplateWithVersion,
} from '../../utils/clinicalNoteTemplates';
import { parseJsonBody } from '../../utils/body';

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