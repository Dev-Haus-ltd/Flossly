import { createError } from 'h3'
import { Organisation } from '../models/index.js'
import { canUsePaidWhatsApp } from './commercialPolicy.js'

export const requirePaidWhatsApp = async (event) => {
  const { orgId } = event.context.user ?? {}
  const org = await Organisation.findByPk(orgId, {
    attributes: ['licenseType', 'licenseBillingCycle', 'licenseRenewalDate'],
  })
  if (canUsePaidWhatsApp(org)) return

  throw createError({
    statusCode: 403,
    data: {
      code: 'FEATURE_NOT_AVAILABLE',
      feature: 'whatsapp',
      message: 'WhatsApp connection is only available on a paid CRM or Pro subscription.',
    },
  })
}
