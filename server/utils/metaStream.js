import EventEmitter from "events";

const metaEmitter = new EventEmitter();
const clients = new Set();

export const addMetaClient = (res, orgId) => {
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

export const broadcastMetaEvent = (eventName, payload = {}) => {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    if (payload?.orgId && client.orgId && payload.orgId !== client.orgId) return;
    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  });
  metaEmitter.emit(eventName, payload);
};

export const onMetaEvent = (eventName, handler) => {
  metaEmitter.on(eventName, handler);
  return () => metaEmitter.off(eventName, handler);
};
