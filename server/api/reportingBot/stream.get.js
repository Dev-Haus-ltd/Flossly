import { createEventStream } from 'h3'
import { ReportingBotConversation, ReportingBotMessage, User } from '~/server/models/index.js'
import { answerReportingQuestion } from '~/server/utils/reportingBot.js'
import { sendNotificationToUser } from '~/server/utils/fcmNotification.js'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { conversationId } = getQuery(event)
  if (!conversationId) throw createError({ statusCode: 400, message: 'conversationId required' })

  const conversation = await ReportingBotConversation.findOne({
    where: { id: conversationId, userId: user.userId, organisationId: user.orgId },
    include: [{ model: User, as: 'rbUser', attributes: ['id', 'fullName', 'email'] }]
  })

  if (!conversation) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const priorMessages = await ReportingBotMessage.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    limit: 21,
  })

  // Last message is the user's question, rest is history
  const sorted = priorMessages
  const latestUser = [...sorted].reverse().find(m => m.senderType === 'user')
  if (!latestUser) throw createError({ statusCode: 400, message: 'No user message found' })

  const history = sorted
    .filter(m => m.id !== latestUser.id)
    .map(m => ({ role: m.senderType === 'user' ? 'user' : 'assistant', content: m.message }))

  const convUser = conversation.rbUser

  const eventStream = createEventStream(event)

  ;(async () => {
    let fullText = ''
    try {
      const attachedFiles = latestUser.metadata?.files || []

      fullText = await answerReportingQuestion({
        question: latestUser.message,
        orgId: user.orgId,
        userId: user.userId,
        userName: convUser?.fullName,
        userEmail: convUser?.email,
        conversationHistory: history,
        attachedFiles,
        onTool: async (label) => {
          await eventStream.push(JSON.stringify({ tool: label }))
        },
        onChunk: async (chunk) => {
          fullText += chunk
          await eventStream.push(JSON.stringify({ chunk }))
        },
      })

      const botMessage = await ReportingBotMessage.create({
        conversationId,
        senderType: 'ai',
        message: fullText,
      })

      await eventStream.push(JSON.stringify({ done: true, message: botMessage.toJSON() }))

      sendNotificationToUser({
        userId: user.userId,
        title: 'AI Reply',
        body: fullText.slice(0, 100) + (fullText.length > 100 ? '…' : ''),
        type: 'chatbot_message',
        referenceType: 'chatbot_conversation',
        referenceId: conversationId,
        data: { conversationId: String(conversationId), message: JSON.stringify(botMessage.toJSON()) },
        priority: 'high',
      }).catch(() => {})
    } catch (err) {
      process.stderr.write(`[ReportingBot stream] error: ${err.message}\n`)
      const errMsg = await ReportingBotMessage.create({
        conversationId, senderType: 'ai',
        message: 'Sorry, I encountered an error fetching your practice data. Please try again.',
      }).catch(() => null)
      await eventStream.push(JSON.stringify({ error: true, message: errMsg?.toJSON() }))
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
