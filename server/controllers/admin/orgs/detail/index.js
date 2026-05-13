import { success, error } from '../../../../utils/response';
import { User, UserOrganisation, Organisation, UserPreference } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import { parseJsonBody } from '../../../../utils/body';
import sequelize from '../../../../utils/db';
import { sendMagicLinkEmail } from '../../../../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const extendOrganisationTrial = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const rawBody = await readBody(event);
  const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
  const organisationId = parseInt(getRouterParam(event, 'orgId'), 10);
  const { extensionDays } = body;

  if (!organisationId || !extensionDays || extensionDays <= 0) {
    return error(400, 'valid extensionDays is required (organisation id comes from the URL path)');
  }

  try {
    const userPreferences = await UserPreference.findAll({
      where: {
        organisationId,
        licenseType: 'Trial',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName'],
        },
      ],
    });

    if (userPreferences.length === 0) {
      return error(404, 'No users with Trial license found in this organisation');
    }

    const updates = [];
    for (const pref of userPreferences) {
      const currentRenewalDate = new Date(pref.licenseRenewalDate);
      const newRenewalDate = new Date(currentRenewalDate.getTime() + (extensionDays * 24 * 60 * 60 * 1000));

      pref.licenseRenewalDate = newRenewalDate;
      await pref.save();

      updates.push({
        userId: pref.userId,
        email: pref.user?.email,
        fullName: pref.user?.fullName,
        previousRenewalDate: currentRenewalDate,
        newRenewalDate,
      });
    }

    return success({
      message: `Extended trial period by ${extensionDays} days for ${updates.length} user(s)`,
      organisationId,
      extensionDays,
      usersUpdated: updates.length,
      updates,
    });
  } catch (err) {
    console.error('Extend organisation trial error:', err);
    return error(500, err.message);
  }
};

export const updateOrganisationInfo = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const rawBody = await readBody(event);
  const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
  const organisationId = parseInt(getRouterParam(event, 'orgId'), 10);
  const { updates } = body;

  if (!organisationId || !updates || typeof updates !== 'object') {
    return error(400, 'updates object is required (organisation id comes from the URL path)');
  }

  const allowedFields = [
    'name', 'address', 'description', 'postalCode', 'surgeryCount',
    'teamCount', 'currentApp', 'contact', 'type', 'managerId',
    'logo', 'cqcInspectionDate', 'status', 'practiceAnniversaryDate',
    'automationPlaceholders',
  ];

  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return error(400, `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`);
  }

  if (filteredUpdates.type) {
    const validTypes = ['Dental', 'General Practice', 'Dermatology', 'Physiotherapy'];
    if (!validTypes.includes(filteredUpdates.type)) {
      return error(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  if (filteredUpdates.status) {
    const validStatuses = ['Invited', 'Active', 'InActive'];
    if (!validStatuses.includes(filteredUpdates.status)) {
      return error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  try {
    const organisation = await Organisation.findByPk(organisationId);

    if (!organisation) {
      return error(404, 'Organisation not found');
    }

    const previousData = { ...organisation.dataValues };

    await organisation.update(filteredUpdates);

    return success({
      message: 'Organisation updated successfully',
      update: {
        organisationId: organisation.id,
        updatedFields: Object.keys(filteredUpdates),
        previous: previousData,
        current: organisation.dataValues,
      },
    });
  } catch (err) {
    console.error('Update organisation error:', err);
    return error(500, err.message);
  }
};

export const searchOrganisations = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const query = getQuery(event);
    const { search = '', page = 1, limit = 20 } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};

    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId },
      });
      if (!adminOrg) {
        return error(404, 'Admin organisation not found');
      }
      whereClause.id = adminOrg.organisationId;
    }

    if (search.trim()) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    const { count, rows: organisations } = await Organisation.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'contact', 'address', 'postalCode', 'type', 'status', 'createdAt'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    return success({
      organisations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Search organisations error:', err);
    return error(500, err.message || 'Failed to search organisations');
  }
};

export const getOrganisationById = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const id = getRouterParam(event, 'orgId');

    if (!id) {
      return error(400, 'Organisation ID is required');
    }

    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId },
      });

      if (!adminOrg || adminOrg.organisationId !== parseInt(id)) {
        return error(403, 'You can only access your own organisation');
      }
    }

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
              attributes: ['id', 'fullName', 'email', 'status'],
            },
          ],
        },
      ],
    });

    if (!organisation) {
      return error(404, 'Organisation not found');
    }

    const users = organisation.userOrganisations?.map((uo) => ({
      userId: uo.user?.id,
      fullName: uo.user?.fullName,
      email: uo.user?.email,
      status: uo.user?.status,
      joinedAt: uo.createdAt,
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
        users,
      },
    });
  } catch (err) {
    console.error('Get organisation by ID error:', err);
    return error(500, err.message || 'Failed to get organisation');
  }
};

export const updateOrgLicense = async (event) => {
  const admin = event.context.admin;
  if (!admin) return error(403, 'Admin access required');

  const rawBody = await readBody(event);
  const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
  const { organisationId, licenseType, renewalDate } = body;

  if (!organisationId || !licenseType || !renewalDate) {
    return error(400, 'organisationId, licenseType, and renewalDate are required');
  }

  const validLicenseTypes = ['Lite', 'CRM', 'Pro', 'System', 'Trial', 'Drift', 'Glide', 'Soar'];
  if (!validLicenseTypes.includes(licenseType)) {
    return error(400, `Invalid licenseType. Must be one of: ${validLicenseTypes.join(', ')}`);
  }

  const renewalDateObj = new Date(renewalDate);
  if (isNaN(renewalDateObj.getTime())) {
    return error(400, 'Invalid renewalDate format. Use ISO 8601 format (e.g., 2026-12-31)');
  }

  try {
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name', 'managerId', 'licenseType', 'licenseBillingCycle', 'licenseRenewalDate'],
    });

    if (!organisation) return error(404, 'Organisation not found');

    const preferences = await UserPreference.findAll({ where: { organisationId } });
    for (const pref of preferences) {
      pref.licenseType = licenseType;
      pref.licenseRenewalDate = renewalDateObj;
      await pref.save();
    }

    return success({
      message: `License updated to ${licenseType} for organisation ${organisationId}`,
      organisationId,
      licenseType,
      renewalDate: renewalDateObj,
      usersUpdated: preferences.length,
    });
  } catch (err) {
    console.error('updateUserLicense error:', err);
    return error(500, err.message || 'Failed to update license');
  }
};

export const createLiteAccount = async (event) => {
  const admin = event.context.admin;
  if (!admin) return error(403, 'Admin access required');

  const rawBody = await readBody(event);
  const body = typeof rawBody === 'string' ? parseJsonBody(rawBody) : rawBody;
  const { email, fullName, orgName } = body;

  if (!email || !fullName || !orgName) {
    return error(400, 'email, fullName, and orgName are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = fullName.trim();
  const trimmedOrgName = orgName.trim();

  const existing = await User.findOne({ where: { email: { [Op.iLike]: normalizedEmail } } });
  if (existing) return error(409, 'A user with this email already exists');

  const existingOrg = await Organisation.findOne({ where: { name: trimmedOrgName } });
  if (existingOrg) return error(409, 'An organisation with this name already exists');

  const transaction = await sequelize.transaction();
  try {
    const org = await Organisation.create({ name: trimmedOrgName, hasUsedTrial: false }, { transaction });

    const user = await User.create(
      { fullName: trimmedName, email: normalizedEmail, password: uuidv4(), profileCompletion: 0, isEmailVerified: true },
      { transaction }
    );

    org.managerId = user.id;
    await org.save({ transaction });

    await UserPreference.create(
      { userId: user.id, organisationId: org.id, licenseType: 'Lite', licenseRenewalDate: new Date('2099-01-01') },
      { transaction }
    );

    await UserOrganisation.create(
      { userId: user.id, organisationId: org.id, status: 'Active' },
      { transaction }
    );

    await transaction.commit();

    const config = useRuntimeConfig();
    const token = jwt.sign(
      { userId: user.id, orgId: org.id, purpose: 'magic_login' },
      config.JWT_SECRET,
      { expiresIn: '30m' }
    );
    const link = `${config.public.BASE_URL}/magic/${token}`;

    try {
      await sendMagicLinkEmail({ email: normalizedEmail, fullName: trimmedName, link, orgId: org.id });
    } catch (emailErr) {
      console.error('Magic link email failed after Lite account creation', emailErr?.message);
    }

    return success({ message: 'Lite account created and magic link sent', userId: user.id, orgId: org.id });
  } catch (err) {
    await transaction.rollback();
    console.error('createLiteAccount error:', err);
    return error(500, err.message || 'Failed to create Lite account');
  }
};
