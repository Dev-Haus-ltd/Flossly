import EventEmitter from "events";

// Shared event emitter + connected SSE clients
const taskEmitter = new EventEmitter();
const clients = new Set();

export const addTaskClient = (res) => {
  clients.add(res);

  // Keep-alive ping every 25s
  const ping = setInterval(() => {
    try {
      res.write(`event: ping\ndata: "keepalive"\n\n`);
    } catch {
      // Ignore write errors; cleanup will remove
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(ping);
    clients.delete(res);
  };

  return cleanup;
};

export const broadcastTaskEvent = (eventName, payload = {}) => {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  // Send to SSE clients
  clients.forEach((res) => {
    try {
      res.write(data);
    } catch (err) {
      clients.delete(res);
    }
  });
  // Also emit locally so in-process listeners can react
  taskEmitter.emit(eventName, payload);
};

export const onTaskEvent = (eventName, handler) => {
  taskEmitter.on(eventName, handler);
  return () => taskEmitter.off(eventName, handler);
};
