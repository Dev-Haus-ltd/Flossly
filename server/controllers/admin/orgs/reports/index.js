import { success, error } from '../../../../utils/response';
import {
  User,
  UserOrganisation,
  Organisation,
  UserSubscription,
  UserPreference,
  UserDocument,
} from '../../../../models';
import { Op } from 'sequelize';
import { getQuery } from 'h3';
import stripe from '../../../../utils/stripe';
import { getS3Object } from '../../../../utils/s3';

export const getOrgsTrialsExpiringInXDays = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const { days = 7, limit = 50, offset = 0 } = query;

  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const trialPreferences = await UserPreference.findAll({
      where: {
        licenseType: 'Trial',
        licenseRenewalDate: {
          [Op.lte]: endDate,
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    const orgIds = [...new Set(trialPreferences.map((p) => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name'],
    });
    const orgMap = Object.fromEntries(organisations.map((o) => [o.id, o.name]));

    const expiringTrials = trialPreferences.map((pref) => {
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
        daysRemaining,
      };
    });

    expiringTrials.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const paginatedResults = expiringTrials.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      trials: paginatedResults,
      total: expiringTrials.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      daysFilter: parseInt(days),
    });
  } catch (err) {
    console.error('Get trials expiring error:', err);
    return error(500, err.message);
  }
};

export const getPastDueOrgs = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  try {
    const subscriptions = await UserSubscription.findAll({
      where: {
        stripeSubscriptionStatus: {
          [Op.in]: ['past_due', 'unpaid'],
        },
      },
      include: [
        {
          model: Organisation,
          as: 'organisation',
          required: true,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    const pastDueOrgs = subscriptions.map((sub) => ({
      organisationId: sub.organisationId,
      organisationName: sub.organisation?.name,
      userId: sub.userId,
      userName: sub.user?.fullName,
      userEmail: sub.user?.email,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      status: sub.stripeSubscriptionStatus,
      packagePriceId: sub.packagePriceId,
    }));

    const paginatedResults = pastDueOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: pastDueOrgs.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('Get past due orgs error:', err);
    return error(500, err.message);
  }
};

export const getOrgsAboveSeatLimit = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
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
              attributes: ['id', 'fullName', 'email', 'status'],
            },
          ],
        },
      ],
    });

    const orgsAboveLimit = [];

    for (const org of organisations) {
      const activeUserCount = org.userOrganisations?.filter(
        (uo) => uo.user?.status === 'Active',
      ).length || 0;

      const subscription = await UserSubscription.findOne({
        where: { organisationId: org.id },
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
            expand: ['items.data.price'],
          });

          const seatLimit = stripeSub.items?.data?.[0]?.quantity || 0;

          if (activeUserCount > seatLimit) {
            orgsAboveLimit.push({
              organisationId: org.id,
              organisationName: org.name,
              seatLimit,
              activeUsers: activeUserCount,
              overage: activeUserCount - seatLimit,
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              status: stripeSub.status,
            });
          }
        } catch (err) {
          console.error(`Error fetching subscription for org ${org.id}:`, err.message);
        }
      }
    }

    orgsAboveLimit.sort((a, b) => b.overage - a.overage);

    const paginatedResults = orgsAboveLimit.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: orgsAboveLimit.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('Get clinics above seat limit error:', err);
    return error(500, err.message);
  }
};

export const getOrgsByPlanType = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const { planType, limit = 50, offset = 0 } = query;

  try {
    const preferences = await UserPreference.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });

    const orgIds = [...new Set(preferences.map((p) => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name'],
    });
    const orgMap = Object.fromEntries(organisations.map((o) => [o.id, o.name]));

    const orgsByPlan = {};
    const filteredOrgs = [];

    for (const pref of preferences) {
      const planName = pref.licenseType || 'Unknown';

      const orgInfo = {
        organisationId: pref.organisationId,
        organisationName: orgMap[pref.organisationId] || 'Unknown',
        userId: pref.userId,
        userName: pref.user?.fullName,
        userEmail: pref.user?.email,
        licenseType: pref.licenseType,
        licenseBillingCycle: pref.licenseBillingCycle,
        licenseRenewalDate: pref.licenseRenewalDate,
      };

      if (!orgsByPlan[planName]) {
        orgsByPlan[planName] = [];
      }
      orgsByPlan[planName].push(orgInfo);

      if (planType) {
        if (planName.toLowerCase().includes(planType.toLowerCase())) {
          filteredOrgs.push(orgInfo);
        }
      }
    }

    if (planType) {
      const paginatedResults = filteredOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      return success({
        organisations: paginatedResults,
        total: filteredOrgs.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        planTypeFilter: planType,
      });
    }

    const summary = Object.keys(orgsByPlan).map((plan) => ({
      planName: plan,
      count: orgsByPlan[plan].length,
      organisations: orgsByPlan[plan],
    }));

    return success({
      summary,
      totalPlans: summary.length,
      totalOrganisations: preferences.length,
    });
  } catch (err) {
    console.error('Get orgs by plan type error:', err);
    return error(500, err.message);
  }
};

export const getStorageUsagePerPractice = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const { organisationId, includeDetails = 'false' } = query;

  try {
    let whereClause = {};

    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }

    const documents = await UserDocument.findAll({
      where: whereClause,
      attributes: ['id', 'link', 'name', 'organisationId', 'createdAt'],
    });

    const orgIds = [...new Set(documents.map((doc) => doc.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name'],
    });
    const orgMap = Object.fromEntries(organisations.map((o) => [o.id, o.name]));

    const orgGroups = {};
    documents.forEach((doc) => {
      const orgId = doc.organisationId;
      if (!orgGroups[orgId]) {
        orgGroups[orgId] = {
          organisationId: orgId,
          organisationName: orgMap[orgId] || 'Unknown',
          documents: [],
        };
      }
      orgGroups[orgId].documents.push(doc);
    });

    const storageByOrg = await Promise.all(
      Object.values(orgGroups).map(async (orgGroup) => {
        let totalSize = 0;
        let successCount = 0;
        let errorCount = 0;
        const documentDetails = [];

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
                createdAt: doc.createdAt,
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
          ...(includeDetails === 'true' && { documents: documentDetails }),
        };
      }),
    );

    storageByOrg.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    const totalStats = storageByOrg.reduce((acc, org) => ({
      totalDocuments: acc.totalDocuments + org.totalDocuments,
      totalSizeBytes: acc.totalSizeBytes + org.totalSizeBytes,
      totalOrganisations: acc.totalOrganisations + 1,
    }), { totalDocuments: 0, totalSizeBytes: 0, totalOrganisations: 0 });

    return success({
      summary: {
        totalOrganisations: totalStats.totalOrganisations,
        totalDocuments: totalStats.totalDocuments,
        totalStorageBytes: totalStats.totalSizeBytes,
        totalStorageMB: (totalStats.totalSizeBytes / (1024 * 1024)).toFixed(2),
        totalStorageGB: (totalStats.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4),
      },
      organisations: storageByOrg,
    });
  } catch (err) {
    console.error('Get storage usage error:', err);
    return error(500, err.message);
  }
};
