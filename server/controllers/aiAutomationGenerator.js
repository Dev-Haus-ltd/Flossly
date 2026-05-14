import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'
import { Organisation } from '../models'
import { generateAutomations } from '../utils/aiWrapper'
import { createError } from 'h3'
import {
  getTrialAiAutomationRemaining,
  getTrialAiAutomationUsage,
  setTrialAiAutomationUsage,
  TRIAL_AI_AUTOMATION_LIMIT,
} from '../utils/commercialPolicy.js'

export const generateAutomationsWithAI = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { idea, followUp, existingAutomations } = payload || {}

    if (!orgId) return error(401, 'Unauthenticated')
    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return error(400, 'Idea is required')
    }

    const org = await Organisation.findByPk(Number(orgId), {
      attributes: ['id', 'name', 'type', 'practiceAnniversaryDate', 'licenseType', 'licenseBillingCycle', 'licenseRenewalDate', 'automationPlaceholders']
    })

    if (!org) return error(404, 'Organisation not found')

    const trialRemaining = getTrialAiAutomationRemaining(org)
    if (trialRemaining !== null && trialRemaining <= 0) {
      throw createError({
        statusCode: 403,
        data: {
          code: 'LIMIT_REACHED',
          feature: 'automation',
          resource: 'ai_automation_generations',
          current: getTrialAiAutomationUsage(org),
          max: TRIAL_AI_AUTOMATION_LIMIT,
          message: `Your free trial includes ${TRIAL_AI_AUTOMATION_LIMIT} AI automation generations. Upgrade to continue using AI automation generation.`,
        },
      })
    }

    const automations = await generateAutomations({
      organisationName: org.name,
      organisationType: org.type || 'Dental',
      userIdea: idea.trim(),
      followUp: followUp?.trim() || null,
      existingAutomations: existingAutomations || null,
    })

    if (trialRemaining !== null) {
      setTrialAiAutomationUsage(org, getTrialAiAutomationUsage(org) + 1)
      await org.save()
    }

    return success({
      automations,
      trialAiGenerationsRemaining:
        trialRemaining !== null ? Math.max(0, trialRemaining - 1) : null,
      message: followUp
        ? `Refined ${automations.length} automations based on your feedback`
        : `Generated ${automations.length} automations based on your idea`,
    })
  } catch (e) {
    console.error('AI automation generation error:', e)
    return error(500, e.message || 'Failed to generate automations')
  }
}
