import { createError } from 'h3'
import { getEntitlements } from '../config/entitlements'

/**
 * Throws 403 if the org's tier does not include the requested feature.
 * Call at the top of any gated server route handler.
 *
 * @param {object} event - H3 event
 * @param {string} feature - key from ENTITLEMENTS (e.g. 'whatsapp', 'automation')
 */
export const requireFeature = (event, feature) => {
  const { licenseType } = event.context.user ?? {}
  const ent = getEntitlements(licenseType)

  if (!ent[feature]) {
    throw createError({
      statusCode: 403,
      data: {
        code: 'UPGRADE_REQUIRED',
        feature,
        message: `This feature requires a paid plan.`,
      },
    })
  }
}
