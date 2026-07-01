import { ReportingBotConversation, ReportingBotMessage } from '~/server/models/index.js';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const name = getRouterParam(event, 'name');

  switch (name) {
    case 'getConversations': {
      const conversations = await ReportingBotConversation.findAll({
        where: { userId: user.userId, organisationId: user.orgId },
        order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
      });
      return { success: true, data: conversations };
    }

    case 'createConversation': {
      const body = await readBody(event);
      const { subject } = body;
      const conv = await ReportingBotConversation.create({
        userId: user.userId,
        organisationId: user.orgId,
        subject: subject?.slice(0, 255) || null,
        lastMessageAt: new Date(),
      });
      return { success: true, data: conv };
    }

    case 'getConversationById': {
      const { id } = getQuery(event);
      const conv = await ReportingBotConversation.findOne({
        where: { id, userId: user.userId, organisationId: user.orgId },
        include: [{ model: ReportingBotMessage, as: 'messages', order: [['createdAt', 'ASC']] }],
      });
      if (!conv) throw createError({ statusCode: 404, message: 'Not found' });
      return { success: true, data: conv };
    }

    case 'createMessage': {
      const body = await readBody(event);
      const { conversationId, message, senderType, metadata } = body;
      const conv = await ReportingBotConversation.findOne({
        where: { id: conversationId, userId: user.userId, organisationId: user.orgId },
      });
      if (!conv) throw createError({ statusCode: 403, message: 'Forbidden' });
      const msg = await ReportingBotMessage.create({ conversationId, message, senderType, ...(metadata ? { metadata } : {}) });
      await conv.update({ lastMessageAt: new Date() });
      return { success: true, data: msg };
    }

    default:
      throw createError({ statusCode: 404, message: 'Unknown endpoint' });
  }
});
