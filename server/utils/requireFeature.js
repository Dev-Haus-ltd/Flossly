import { createError } from 'h3'
import { getEntitlements } from '../config/entitlements.js'
import { Organisation } from '../models/index.js'

/**
 * Throws 403 if the org's plan does not include the requested feature flag.
 * Feature flags: 'whatsapp', 'automation', 'taskPool', 'patientBooking', 'googleAds'
 * Reads licenseType live from DB so plan changes take effect immediately without re-login.
 */
export const requireFeature = async (event, feature) => {
  const { orgId } = event.context.user ?? {}
  const org = await Organisation.findByPk(orgId, { attributes: ['licenseType'] })
  const licenseType = org?.licenseType ?? 'Lite'
  const ent = getEntitlements(licenseType)
  if (!ent[feature]) {
    throw createError({
      statusCode: 403,
      data: {
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        message: 'This feature is not available on your current plan. Upgrade to access it.',
      },
    })
  }
}
