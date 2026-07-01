import { Get, Post } from './apiWrapper';

const BASE = '/reportingBot';

export default {
  getConversations: () => Get(`${BASE}/getConversations`),
  createConversation: (body) => Post(`${BASE}/createConversation`, body),
  getConversationById: (id) => Get(`${BASE}/getConversationById?id=${id}`),
  createMessage: (body) => Post(`${BASE}/createMessage`, body),
};
