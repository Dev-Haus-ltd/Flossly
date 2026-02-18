export default defineNitroPlugin(() => {
  // Socket.IO is attached lazily in server/middleware/socketio.js
  // because Nitro 'listen' hook does not fire in the current dev runtime.
  console.log('[socket.io] nitro plugin init (middleware attach mode)');
});
