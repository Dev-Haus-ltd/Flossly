import { Op } from "sequelize";
import { readBody, getQuery, setResponseStatus, getMethod } from "h3";
import { success, error } from "../utils/response";
import { parseJsonBody } from "../utils/body";
import { CrmDmConversation, CrmDmMessage, CrmDmAccount } from "../models";
import { decrypt } from "../utils/crypto";

const ensureDmTables = async () => {
  try { await CrmDmConversation.sync(); } catch {}
  try { await CrmDmMessage.sync(); } catch {}
  try { await CrmDmAccount.sync(); } catch {}
};

const META_VERSION = "v24.0";

const sendMetaMessage = async ({ accessToken, recipientId, message }) => {
  const url = `https://graph.facebook.com/${META_VERSION}/me/messages`;
  return await $fetch(url, {
    method: "POST",
    body: {
      recipient: { id: recipientId },
      message: { text: message },
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const processQueuedMessages = async ({ organisationId, limit = 20 }) => {
  await ensureDmTables();
  const queued = await CrmDmMessage.findAll({
    where: {
      organisationId,
      direction: "outbound",
      status: "queued",
    },
    include: [
      { model: CrmDmConversation, as: "conversation" },
    ],
    order: [["createdAt", "ASC"]],
    limit: Number.isFinite(limit) ? limit : 20,
  });

  const results = [];
  for (const msg of queued) {
    const conversation = msg.conversation;
    if (!conversation) {
      msg.status = "failed";
      msg.metadata = { ...(msg.metadata || {}), error: "Conversation missing" };
      await msg.save();
      results.push({ id: msg.id, status: "failed" });
      continue;
    }

    const account = await CrmDmAccount.findOne({
      where: {
        organisationId,
        platform: conversation.platform,
        accountId: String(conversation.accountId),
        status: "Active",
      },
    });

    if (!account?.accessTokenEnc) {
      msg.status = "failed";
      msg.metadata = { ...(msg.metadata || {}), error: "Account token missing" };
      await msg.save();
      results.push({ id: msg.id, status: "failed" });
      continue;
    }

    try {
      const accessToken = decrypt(account.accessTokenEnc);
      const recipientId = String(conversation.threadId);
      const resp = await sendMetaMessage({
        accessToken,
        recipientId,
        message: msg.message,
      });

      msg.status = "sent";
      msg.platformMessageId = resp?.message_id || resp?.messageId || msg.platformMessageId || null;
      msg.metadata = { ...(msg.metadata || {}), sendResponse: resp };
      await msg.save();

      conversation.lastMessageAt = new Date();
      await conversation.save();
      results.push({ id: msg.id, status: "sent" });
    } catch (sendErr) {
      msg.status = "failed";
      msg.metadata = { ...(msg.metadata || {}), error: sendErr?.message || "Send failed" };
      await msg.save();
      results.push({ id: msg.id, status: "failed" });
    }
  }

  return { processed: results.length, results };
};

export const listDmConversations = async (event) => {
  try {
    await ensureDmTables();
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const query = getQuery(event) || {};
    let body = {};
    if (getMethod(event) === "POST") {
      const raw = await readBody(event);
      body = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    }

    const platform = body.platform ?? query.platform ?? null;
    const search = body.search ?? query.search ?? null;
    const limit = Number(body.limit ?? query.limit ?? 20);
    const offset = Number(body.offset ?? query.offset ?? 0);

    const where = { organisationId: orgId };
    if (platform && platform !== "all") {
      where.platform = String(platform).toLowerCase();
    }
    if (search) {
      const term = String(search).trim();
      if (term) {
        where[Op.or] = [
          { participantName: { [Op.iLike]: `%${term}%` } },
          { threadId: { [Op.iLike]: `%${term}%` } },
        ];
      }
    }

    const rows = await CrmDmConversation.findAndCountAll({
      where,
      order: [["lastMessageAt", "DESC"], ["updatedAt", "DESC"]],
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return success({
      total: rows.count,
      data: rows.rows,
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
    });
  } catch (err) {
    return error(500, err.message || "Failed to load conversations");
  }
};

export const listDmMessages = async (event) => {
  try {
    await ensureDmTables();
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const query = getQuery(event) || {};
    let body = {};
    if (getMethod(event) === "POST") {
      const raw = await readBody(event);
      body = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    }

    const conversationId = body.conversationId ?? query.conversationId;
    if (!conversationId) return error(400, "conversationId is required");

    const limit = Number(body.limit ?? query.limit ?? 30);
    const before = body.before ?? query.before ?? null;

    const where = {
      organisationId: orgId,
      conversationId: Number(conversationId),
    };
    if (before) {
      where.createdAt = { [Op.lt]: new Date(before) };
    }

    const rows = await CrmDmMessage.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number.isFinite(limit) ? limit : 30,
    });

    const sorted = rows.slice().reverse();
    const nextCursor = rows.length ? rows[rows.length - 1].createdAt : null;

    return success({
      data: sorted,
      nextCursor,
      limit: Number.isFinite(limit) ? limit : 30,
    });
  } catch (err) {
    return error(500, err.message || "Failed to load messages");
  }
};

export const sendDmMessage = async (event) => {
  try {
    await ensureDmTables();
    const { orgId, userId } = event.context.user || {};
    if (!orgId || !userId) return error(401, "Unauthenticated");

    const raw = await readBody(event);
    const payload = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    const { conversationId, message } = payload;
    if (!conversationId || !String(message || "").trim()) {
      return error(400, "conversationId and message are required");
    }

    const conversation = await CrmDmConversation.findOne({
      where: { id: Number(conversationId), organisationId: orgId },
    });
    if (!conversation) return error(404, "Conversation not found");

    const newMessage = await CrmDmMessage.create({
      organisationId: orgId,
      conversationId: conversation.id,
      platform: conversation.platform,
      direction: "outbound",
      senderName: "Flossly",
      message: String(message || "").trim(),
      status: "queued",
    });

    conversation.lastMessageAt = new Date();
    conversation.metadata = {
      ...(conversation.metadata || {}),
      lastMessagePreview: String(message || "").trim().slice(0, 120),
    };
    await conversation.save();

    // TODO: Send message to Meta Messenger/Instagram here.
    // For now we enqueue in DB only.
    setResponseStatus(event, 201);
    return success(newMessage);
  } catch (err) {
    return error(500, err.message || "Failed to send message");
  }
};

export const markDmRead = async (event) => {
  try {
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");
    const raw = await readBody(event);
    const payload = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    const { conversationId } = payload;
    if (!conversationId) return error(400, "conversationId is required");

    const convo = await CrmDmConversation.findOne({
      where: { id: Number(conversationId), organisationId: orgId },
    });
    if (!convo) return error(404, "Conversation not found");
    convo.unreadCount = 0;
    await convo.save();
    return success({ updated: true });
  } catch (err) {
    return error(500, err.message || "Failed to mark as read");
  }
};

export const processDmQueue = async (event) => {
  try {
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const raw = await readBody(event);
    const payload = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    const limit = Number(payload.limit ?? 20);

    const results = await processQueuedMessages({
      organisationId: orgId,
      limit,
    });
    return success(results);
  } catch (err) {
    return error(500, err.message || "Failed to process queue");
  }
};
