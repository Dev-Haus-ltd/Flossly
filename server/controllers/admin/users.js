import { success, error } from '../../utils/response';
import {
  User, UserOrganisation, Organisation, Role, LoginHistory, UserPreference
} from '../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import { sendInvitationEmail } from '../../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';

function organisationIdFromPath(event) {
  const orgParam = getRouterParam(event, 'orgId') ?? getRouterParam(event, 'organisationId');
  const organisationId = Number(orgParam);
  if (!Number.isFinite(organisationId) || organisationId < 1) {
    return error(400, 'Organisation id is required in the URL path');
  }
  return organisationId;
}

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

  const userId = getRouterParam(event, 'id');

  if (!userId) {
    return error(400, "user id is required");
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

export const updateUserStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const organisationId = organisationIdFromPath(event);

  const body = await readBody(event);
  const { status } = body;

  const userId = getRouterParam(event, 'id');

  if (!userId || !status) {
    return error(400, "status is required (org and user ids come from the URL path)");
  }

  // Valid status values matching the UserOrganisation model enum
  if (!['Active', 'Disabled', 'Invited', 'Expired'].includes(status)) {
    return error(400, "Invalid status. Must be Active, Disabled, Invited, or Expired");
  }

  try {
    const { UserOrganisation } = await import('../../models/index.js');
    
    // Find the UserOrganisation record
    const userOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!userOrg) {
      return error(404, "User not found in the specified organisation");
    }

    userOrg.status = status;
    await userOrg.save();

    return success({
      message: `User status updated to ${status} for organisation ${userOrg.organisation.name}`,
      userOrganisation: {
        userId: userOrg.userId,
        organisationId: userOrg.organisationId,
        status: userOrg.status,
        user: userOrg.user,
        organisation: userOrg.organisation
      }
    });
  } catch (err) {
    console.error('Update user organisation status error:', err);
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

  const idParam = getRouterParam(event, 'id');
  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  if (!idParam) {
    return error(400, "User id is required");
  }

  const userId = parseInt(idParam, 10);
  if (Number.isNaN(userId)) {
    return error(400, "User id must be a valid number");
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
  const { newPassword } = body;

  const userId = getRouterParam(event, 'id');

  if (!userId || !newPassword) {
    return error(400, "newPassword is required");
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

export const updateUserInfo = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const userId = getRouterParam(event, 'id');
  const { updates } = body;

  if (!userId) {
    return error(400, 'User id is required in the URL path');
  }

  if (!updates || typeof updates !== 'object') {
    return error(400, 'updates object is required');
  }

  // Define allowed fields that can be updated
  const allowedFields = [
    'fullName', 'email', 'dob', 'phone', 'photo', 'address', 
    'status', 'gender', 'nextOfKin', 'nextOfKinContact', 
    'requiredCpdHours', 'roleId'
  ];

  // Filter updates to only allowed fields
  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return error(400, `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`);
  }

  // Validate status if provided
  if (filteredUpdates.status) {
    const validStatuses = ['Active', 'Disabled', 'Invited', 'Expired'];
    if (!validStatuses.includes(filteredUpdates.status)) {
      return error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Validate gender if provided
  if (filteredUpdates.gender) {
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(filteredUpdates.gender)) {
      return error(400, `Invalid gender. Must be one of: ${validGenders.join(', ')}`);
    }
  }

  // Validate roleId if provided
  if (filteredUpdates.roleId) {
    const role = await Role.findByPk(filteredUpdates.roleId);
    if (!role) {
      return error(400, 'Invalid roleId - role does not exist');
    }
  }

  try {
    // Find the user
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title']
        }
      ]
    });

    if (!user) {
      return error(404, "User not found");
    }

    const previousData = { ...user.dataValues };

    // Update the user
    await user.update(filteredUpdates);

    // Reload to get updated role if changed
    await user.reload({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title']
        }
      ]
    });

    return success({
      message: `User updated successfully`,
      update: {
        userId: user.id,
        updatedFields: Object.keys(filteredUpdates),
        previous: previousData,
        current: user.dataValues
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    return error(500, err.message);
  }
};


export const updateUserLicense = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const organisationId = organisationIdFromPath(event);

  const body = await readBody(event) || {};
  const userId = getRouterParam(event, 'id');
  const { licenseType, renewalDate } = body;

  if (!licenseType || !renewalDate) {
    return error(400, 'licenseType and renewalDate are required');
  }

  // Validate license type
  const validLicenseTypes = ['System', 'Trial', 'Drift', 'Glide', 'Soar'];
  if (!validLicenseTypes.includes(licenseType)) {
    return error(400, `Invalid licenseType. Must be one of: ${validLicenseTypes.join(', ')}`);
  }

  // Validate renewal date
  const renewalDateObj = new Date(renewalDate);
  if (isNaN(renewalDateObj.getTime())) {
    return error(400, "Invalid renewalDate format. Use ISO 8601 format (e.g., 2026-12-31)");
  }

  try {
    // Find the user preference record
    const userPref = await UserPreference.findOne({
      where: {
        userId,
        organisationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!userPref) {
      return error(404, "User preference not found for the specified user and organisation");
    }

    const previousLicenseType = userPref.licenseType;
    const previousRenewalDate = userPref.licenseRenewalDate;

    // Update license type and renewal date
    userPref.licenseType = licenseType;
    userPref.licenseRenewalDate = renewalDateObj;
    await userPref.save();

    return success({
      message: `License updated successfully for ${userPref.user?.fullName || 'user'}`,
      update: {
        userId: userPref.userId,
        organisationId: userPref.organisationId,
        user: userPref.user,
        organisation: userPref.organisation,
        previous: {
          licenseType: previousLicenseType,
          renewalDate: previousRenewalDate
        },
        current: {
          licenseType: userPref.licenseType,
          renewalDate: userPref.licenseRenewalDate
        }
      }
    });
  } catch (err) {
    console.error('Update user license error:', err);
    return error(500, err.message);
  }
};


export const resendInvite = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const organisationId = organisationIdFromPath(event);

  const userId = getRouterParam(event, 'id');

  if (!userId) {
    return error(400, 'User id is required in the URL path');
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

    const userOrg = user.userOrganisations?.find(
      (uo) => Number(uo.organisationId) === Number(organisationId),
    );

    if (!userOrg) {
      return error(404, "User is not associated with the specified organisation");
    }

    const targetOrganisation = userOrg.organisation;

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
