import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'
import { Organisation } from '../models'
import { generateAutomations } from '../utils/aiWrapper'

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
      attributes: ['id', 'name', 'type', 'practiceAnniversaryDate']
    })

    if (!org) return error(404, 'Organisation not found')

    const automations = await generateAutomations({
      organisationName: org.name,
      organisationType: org.type || 'Dental',
      userIdea: idea.trim(),
      followUp: followUp?.trim() || null,
      existingAutomations: existingAutomations || null,
    })

    return success({
      automations,
      message: followUp
        ? `Refined ${automations.length} automations based on your feedback`
        : `Generated ${automations.length} automations based on your idea`,
    })
  } catch (e) {
    console.error('AI automation generation error:', e)
    return error(500, e.message || 'Failed to generate automations')
  }
}