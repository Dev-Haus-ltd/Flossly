import { generateAutomationsWithAI } from '../../controllers/aiAutomationGenerator.js'
import { requireFeature } from '../../utils/requireFeature'

export default defineEventHandler(async (event) => {
  await requireFeature(event, 'automation')
  return await generateAutomationsWithAI(event)
})
