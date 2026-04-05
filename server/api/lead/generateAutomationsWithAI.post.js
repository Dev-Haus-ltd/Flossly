import { generateAutomationsWithAI } from '../../controllers/aiAutomationGenerator.js'

export default defineEventHandler(async (event) => {
  return await generateAutomationsWithAI(event)
})
