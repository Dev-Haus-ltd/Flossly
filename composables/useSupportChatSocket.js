import { io } from 'socket.io-client';

let socket;
let listenersRegistered = false;

export const useSupportChatSocket = () => {
  const getSocket = () => {
    if (!process.client) return null;
    if (socket) return socket;

    const url = window.location.origin;

    socket = io(url, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket'],
      upgrade: false,
    });

    if (!listenersRegistered) {
      listenersRegistered = true;

      socket.on('connect', () => {
        console.log('[supportChat socket] connected', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('[supportChat socket] connect_error', err?.message || err);
      });
    }

    return socket;
  };

  return { getSocket };
};
