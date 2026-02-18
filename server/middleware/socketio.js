import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatbotConversation } from '../models/index.js';
import { isSupportAgent } from '../utils/supportAgents.js';

const parseCookies = (cookieHeader = '') => {
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(v.join('=') || '');
  });
  return out;
};

const setupIo = (httpServer) => {
  const config = useRuntimeConfig();

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: true, credentials: true },
    transports: ['websocket'],
    allowUpgrades: false,
  });

  console.log('[socket.io] attached via middleware');

  io.use((socket, next) => {
    try {
      const tokenFromAuth = socket.handshake.auth?.token;
      const cookies = parseCookies(socket.request.headers.cookie);
      const token = tokenFromAuth || cookies.accessToken;

      if (!token) {
        socket.data.user = null;
        return next();
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.data.user = decoded;
      return next();
    } catch (e) {
      socket.data.user = null;
      return next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    socket.on('conversation:join', async (conversationId) => {
      try {
        if (!conversationId) return;
        if (!user) return;

        const supportAgent = await isSupportAgent(user);
        const convo = await ChatbotConversation.findByPk(conversationId, {
          attributes: ['id', 'organisationId', 'userId'],
        });
        if (!convo) return;

        if (!supportAgent) {
          if (convo.organisationId !== user.orgId) return;
          if (convo.userId !== user.userId) return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (e) {
        // ignore
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });
  });

  globalThis.__flossly_io__ = io;
};

export default defineEventHandler((event) => {
  // Attach once, lazily, using the underlying Node server
  if (!globalThis.__flossly_io__) {
    const httpServer = event?.node?.req?.socket?.server;
    if (httpServer) setupIo(httpServer);
  }
});
