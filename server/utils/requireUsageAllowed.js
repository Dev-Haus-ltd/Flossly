import { createError } from 'h3'
import { getEntitlements } from '../config/entitlements'
import { CrmLead, UserDocument, UserOrganisation, Organisation, User } from '../models'

const RESOURCE_LABELS = {
  leads:     'lead',
  storageMB: 'storage',
  members:   'team member',
}

/**
 * Reads live usage from DB and throws 403 if the org is at or over its tier limit.
 * Returns current usage so callers can show warnings without a second query.
 *
 * @param {object} event - H3 event
 * @param {'leads'|'storageMB'|'members'} resource
 * @returns {{ current: number, max: number, warnAt: number }}
 */
export const requireUsageAllowed = async (event, resource) => {
  const { orgId } = event.context.user ?? {}
  const org = await Organisation.findByPk(orgId, { attributes: ['licenseType'] })
  const ent = getEntitlements(org?.licenseType ?? 'Lite')
  const max = ent.limits[resource]

  if (max === Infinity) return { current: 0, max, warnAt: Infinity }

  const current = await getCurrentUsage(Number(orgId), resource)

  if (current >= max) {
    throw createError({
      statusCode: 403,
      data: {
        code:     'LIMIT_REACHED',
        resource,
        current,
        max,
        label:    RESOURCE_LABELS[resource] ?? resource,
        message:  `You have reached your ${RESOURCE_LABELS[resource] ?? resource} limit. Upgrade to add more.`,
      },
    })
  }

  return { current, max, warnAt: Math.floor(max * ent.warnAt) }
}

/**
 * Webhook-safe lead cap check — looks up the org's license from the DB directly.
 * Use this in webhook handlers where event.context.user is not available.
 * Returns true if the org is allowed to receive more leads.
 */
export const isLeadAllowedForOrg = async (orgId) => {
  const org = await Organisation.findByPk(orgId, { attributes: ['licenseType'] })
  const ent = getEntitlements(org?.licenseType)
  const max = ent.limits.leads
  if (max === Infinity) return true
  const count = await CrmLead.count({ where: { organisationId: orgId, softDeleted: false } })
  return count < max
}

/**
 * Returns the current usage value for a given org + resource without throwing.
 * Useful for showing warning banners at 80%.
 */
export const getCurrentUsage = async (orgId, resource) => {
  switch (resource) {
    case 'leads':
      return CrmLead.count({ where: { organisationId: orgId, softDeleted: false } })

    case 'storageMB': {
      const bytes = await UserDocument.sum('fileSizeBytes', {
        where: { organisationId: orgId },
      })
      return Math.ceil((Number(bytes) || 0) / (1024 * 1024))
    }

    case 'members': {
      const rows = await UserOrganisation.findAll({
        where: { organisationId: orgId, status: ['Active', 'Invited'] },
        include: [{ model: User, as: 'user', attributes: ['email'], required: true }],
      })
      return rows.filter(uo => {
        const email = uo.user?.email || ''
        return !(email.includes('dummy-dentist') && email.includes('@flossly.local'))
      }).length
    }

    default:
      return 0
  }
}
