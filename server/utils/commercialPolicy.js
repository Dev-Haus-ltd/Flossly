import { resolveTier, TIERS } from '../config/entitlements.js'
import {
  TRIAL_DAYS,
  LITE_META_LIMITS,
  TRIAL_AI_AUTOMATION_LIMIT,
} from '@shared/defaults/commercialPolicy.js'

const normalizeDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export { TRIAL_DAYS, LITE_META_LIMITS, TRIAL_AI_AUTOMATION_LIMIT }

export const getResolvedTier = (org) => resolveTier(org?.licenseType)

export const isFreeTrialUpgradeOrg = (org) => {
  const tier = getResolvedTier(org)
  if (![TIERS.CRM, TIERS.PRO].includes(tier)) return false
  if (org?.licenseBillingCycle) return false
  const renewalDate = normalizeDate(org?.licenseRenewalDate)
  return !!renewalDate && renewalDate.getTime() > Date.now()
}

export const getMetaAssetLimits = (org) => {
  const tier = getResolvedTier(org)
  return tier === TIERS.LITE ? LITE_META_LIMITS : null
}

export const canUsePaidWhatsApp = (org) => {
  const tier = getResolvedTier(org)
  if (![TIERS.CRM, TIERS.PRO].includes(tier)) return false
  return !isFreeTrialUpgradeOrg(org)
}

export const getTrialAiAutomationUsage = (org) => {
  const usage = Number(org?.automationPlaceholders?.usage?.trialAiAutomationGenerations || 0)
  return Number.isFinite(usage) && usage > 0 ? usage : 0
}

export const getTrialAiAutomationRemaining = (org) => {
  if (!isFreeTrialUpgradeOrg(org)) return null
  return Math.max(0, TRIAL_AI_AUTOMATION_LIMIT - getTrialAiAutomationUsage(org))
}

export const setTrialAiAutomationUsage = (org, count) => {
  const current = org?.automationPlaceholders || {}
  const usage = current?.usage || {}
  org.automationPlaceholders = {
    ...current,
    usage: {
      ...usage,
      trialAiAutomationGenerations: Math.max(0, Number(count) || 0),
    },
  }
  return org.automationPlaceholders
}
