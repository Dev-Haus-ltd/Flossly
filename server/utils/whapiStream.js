import EventEmitter from "events";

const whapiEmitter = new EventEmitter();
const clients = new Set();

export const addWhapiClient = (res, orgId) => {
  const client = { res, orgId };
  clients.add(client);

  const ping = setInterval(() => {
    try {
      res.write(`event: ping\ndata: "keepalive"\n\n`);
    } catch {
      // ignore
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(ping);
    clients.delete(client);
  };

  return cleanup;
};

export const broadcastWhapiEvent = (eventName, payload = {}) => {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    if (payload?.orgId && client.orgId && payload.orgId !== client.orgId) return;
    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  });
  whapiEmitter.emit(eventName, payload);
};

export const onWhapiEvent = (eventName, handler) => {
  whapiEmitter.on(eventName, handler);
  return () => whapiEmitter.off(eventName, handler);
};
