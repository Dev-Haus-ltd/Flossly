import { answerReportingQuestion } from '../../utils/reportingBot.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    setResponseStatus(event, 401)
    return { success: false, message: 'Unauthorized' }
  }

  const body = await readBody(event)
  const { question } = body

  if (!question) {
    setResponseStatus(event, 400)
    return { success: false, message: 'question is required' }
  }

  try {
    const answer = await answerReportingQuestion({
      question,
      orgId: user.orgId,
      conversationHistory: []
    })
    return { success: true, answer }
  } catch (err) {
    console.error('[ReportingBot test]', err)
    setResponseStatus(event, 500)
    return { success: false, message: err.message }
  }
})
