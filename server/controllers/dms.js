import { Op } from "sequelize";
import { readBody, getQuery, setResponseStatus, getMethod, readMultipartFormData } from "h3";
import { success, error } from "../utils/response";
import { parseJsonBody } from "../utils/body";
import { CrmDmConversation, CrmDmMessage, CrmDmAccount, MetaPage } from "../models";
import { decrypt } from "../utils/crypto";
import { uploadBufferFile } from "../utils/storage";

const ensureDmTables = async () => {
  try { await CrmDmConversation.sync(); } catch {}
  try { await CrmDmMessage.sync(); } catch {}
  try { await CrmDmAccount.sync(); } catch {}
};

const META_VERSION = "v24.0";
const STANDARD_MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

const toAbsoluteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const config = useRuntimeConfig();
  const base = config.public?.BASE_URL || config.BASE_URL || process.env.BASE_URL || "";
  if (!base) return raw;
  return `${String(base).replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
};

const sendMetaMessage = async ({ accessToken, senderId, recipientId, message, messagingType = "RESPONSE", tag = null }) => {
  const targetNode = encodeURIComponent(String(senderId || "me"));
  const url = `https://graph.facebook.com/${META_VERSION}/${targetNode}/messages`;
  const body = {
    recipient: { id: recipientId },
    messaging_type: messagingType,
    message: { text: message },
  };
  if (tag) body.tag = tag;
  return await $fetch(url, {
    method: "POST",
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const sendMetaAttachment = async ({ accessToken, senderId, recipientId, attachment, messagingType = "RESPONSE", tag = null }) => {
  const targetNode = encodeURIComponent(String(senderId || "me"));
  const url = `https://graph.facebook.com/${META_VERSION}/${targetNode}/messages`;
  const body = {
    recipient: { id: recipientId },
    messaging_type: messagingType,
    message: {
      attachment: {
        type: attachment.type || "file",
        payload: {
          url: attachment.url,
          is_reusable: true,
        },
      },
    },
  };
  if (tag) body.tag = tag;
  return await $fetch(url, {
    method: "POST",
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const getLatestInboundMessageAt = async ({ organisationId, conversationId }) => {
  const lastInbound = await CrmDmMessage.findOne({
    where: {
      organisationId,
      conversationId,
      direction: "inbound",
    },
    order: [["createdAt", "DESC"]],
    attributes: ["createdAt"],
  });
  return lastInbound?.createdAt ? new Date(lastInbound.createdAt) : null;
};

const isWithinStandardMessagingWindow = (lastInboundAt) => {
  if (!lastInboundAt || Number.isNaN(lastInboundAt.getTime())) return false;
  return Date.now() - lastInboundAt.getTime() <= STANDARD_MESSAGING_WINDOW_MS;
};

const resolveProfile = async ({ platform, senderId, accessToken }) => {
  if (!senderId || !accessToken) return null;
  try {
    if (platform === "messenger") {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(senderId)}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(accessToken)}`;
      const resp = await $fetch(url, { method: "GET" });
      const name = [resp?.first_name, resp?.last_name].filter(Boolean).join(" ").trim();
      return {
        name: name || resp?.name || null,
        avatar: resp?.profile_pic || null,
      };
    }
    if (platform === "instagram") {
      const url = `https://graph.facebook.com/${META_VERSION}/${encodeURIComponent(senderId)}?fields=username,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`;
      const resp = await $fetch(url, { method: "GET" });
      return {
        name: resp?.username || null,
        avatar: resp?.profile_picture_url || null,
      };
    }
  } catch {}
  return null;
};

export const processQueuedMessages = async ({ organisationId, limit = 20, messageIds = null }) => {
  await ensureDmTables();
  const where = {
    organisationId,
    direction: "outbound",
    status: "queued",
  };
  if (Array.isArray(messageIds) && messageIds.length) {
    where.id = { [Op.in]: messageIds.map((id) => Number(id)).filter(Number.isFinite) };
  }
  const queued = await CrmDmMessage.findAll({
    where,
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
      let accessToken = decrypt(account.accessTokenEnc);
      let senderId = String(conversation.accountId || account.accountId || "me");
      // Instagram send requires Page Access Token + Page ID as sender node
      if (conversation.platform === 'instagram') {
        try {
          const metaPage = await MetaPage.findOne({
            where: { organisationId, status: 'Active' },
            order: [['updatedAt', 'DESC']],
          });
          if (metaPage?.accessTokenEnc) accessToken = decrypt(metaPage.accessTokenEnc);
          if (metaPage?.pageId) senderId = String(metaPage.pageId);
        } catch {}
      }
      const recipientId = String(conversation.threadId);
      const lastInboundAt = await getLatestInboundMessageAt({
        organisationId,
        conversationId: conversation.id,
      });

      if (!isWithinStandardMessagingWindow(lastInboundAt)) {
        msg.status = "failed";
        msg.metadata = {
          ...(msg.metadata || {}),
          error: "Outside standard 24-hour messaging window. Send is blocked unless a valid message tag flow is implemented.",
          code: "outside_messaging_window",
          lastInboundAt: lastInboundAt ? lastInboundAt.toISOString() : null,
        };
        await msg.save();
        results.push({
          id: msg.id,
          status: "failed",
          error: msg.metadata.error,
          code: "outside_messaging_window",
        });
        continue;
      }

      let resp = null;
      const text = String(msg.message || "").trim();
      const hasOnlyAttachment = text === "[Attachment]" && Array.isArray(msg.attachments) && msg.attachments.length;
      if (text && !hasOnlyAttachment) {
        resp = await sendMetaMessage({
          accessToken,
          senderId,
          recipientId,
          message: text,
          messagingType: "RESPONSE",
        });
      }

      const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
      if (attachments.length) {
        for (const att of attachments) {
          const url = toAbsoluteUrl(att?.url);
          if (!url) continue;
          await sendMetaAttachment({
            accessToken,
            senderId,
            recipientId,
            attachment: { ...att, url },
            messagingType: "RESPONSE",
          });
        }
      }

      msg.status = "sent";
      msg.platformMessageId = resp?.message_id || resp?.messageId || msg.platformMessageId || null;
      msg.metadata = { ...(msg.metadata || {}), sendResponse: resp };
      await msg.save();

      conversation.lastMessageAt = new Date();
      await conversation.save();
      results.push({ id: msg.id, status: "sent" });
    } catch (sendErr) {
      msg.status = "failed";
      msg.metadata = {
        ...(msg.metadata || {}),
        error: sendErr?.data?.error?.message || sendErr?.message || "Send failed",
      };
      await msg.save();
      results.push({
        id: msg.id,
        status: "failed",
        error: sendErr?.data?.error?.message || sendErr?.message || "Send failed",
      });
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
    const assignedToMeRaw = body.assignedToMe ?? query.assignedToMe ?? null;
    const unreadOnlyRaw = body.unreadOnly ?? query.unreadOnly ?? null;
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
    if (assignedToMeRaw !== null && assignedToMeRaw !== undefined && assignedToMeRaw !== "") {
      const assignedToMe = String(assignedToMeRaw).toLowerCase();
      if (assignedToMe === "true" || assignedToMe === "1" || assignedToMe === "yes") {
        const userId = event.context.user?.userId || event.context.user?.id;
        if (userId) {
          where.metadata = { [Op.contains]: { assignedUserId: Number(userId) } };
        }
      }
    }
    if (unreadOnlyRaw !== null && unreadOnlyRaw !== undefined && unreadOnlyRaw !== "") {
      const unreadOnly = String(unreadOnlyRaw).toLowerCase();
      if (unreadOnly === "true" || unreadOnly === "1" || unreadOnly === "yes") {
        where.unreadCount = { [Op.gt]: 0 };
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
    const { conversationId, message, attachments } = payload;
    const hasText = String(message || "").trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!conversationId || (!hasText && !hasAttachments)) {
      return error(400, "conversationId and message or attachments are required");
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
      message: String(message || "").trim() || "[Attachment]",
      attachments: hasAttachments ? attachments : null,
      status: "queued",
    });

    conversation.lastMessageAt = new Date();
    conversation.metadata = {
      ...(conversation.metadata || {}),
      lastMessagePreview: String(message || "").trim().slice(0, 120),
    };
    await conversation.save();

    // Attempt immediate delivery (falls back to queued if send fails).
    try {
      await processQueuedMessages({
        organisationId: orgId,
        limit: 1,
        messageIds: [newMessage.id],
      });
      const refreshed = await CrmDmMessage.findOne({ where: { id: newMessage.id } });
      if (refreshed) {
        setResponseStatus(event, 201);
        return success(refreshed);
      }
    } catch {}

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

export const refreshDmProfile = async (event) => {
  try {
    await ensureDmTables();
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const raw = await readBody(event);
    const payload = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    const { conversationId } = payload;
    if (!conversationId) return error(400, "conversationId is required");

    const conversation = await CrmDmConversation.findOne({
      where: { id: Number(conversationId), organisationId: orgId },
    });
    if (!conversation) return error(404, "Conversation not found");

    let account = await CrmDmAccount.findOne({
      where: {
        organisationId: orgId,
        platform: conversation.platform,
        accountId: String(conversation.accountId),
        status: "Active",
      },
    });
    if (!account?.accessTokenEnc) {
      // Fallback for older conversation/account mappings.
      account = await CrmDmAccount.findOne({
        where: {
          organisationId: orgId,
          platform: conversation.platform,
          status: "Active",
          accessTokenEnc: { [Op.ne]: null },
        },
        order: [["updatedAt", "DESC"]],
      });
    }
    if (!account?.accessTokenEnc) return success({ updated: false, reason: "account_token_missing" });

    const accessToken = decrypt(account.accessTokenEnc);
    const profile = await resolveProfile({
      platform: conversation.platform,
      senderId: conversation.threadId,
      accessToken,
    });
    if (!profile) return success({ updated: false });

    conversation.participantName = profile.name || conversation.participantName;
    conversation.participantAvatar = profile.avatar || conversation.participantAvatar;
    conversation.metadata = {
      ...(conversation.metadata || {}),
      participantName: conversation.participantName,
      participantAvatar: conversation.participantAvatar,
    };
    await conversation.save();

    return success({
      updated: true,
      id: conversation.id,
      participantName: conversation.participantName,
      participantAvatar: conversation.participantAvatar,
    });
  } catch (err) {
    return error(500, err.message || "Failed to refresh profile");
  }
};

export const getDmConnectionStatus = async (event) => {
  try {
    await ensureDmTables();
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const rows = await CrmDmAccount.findAll({
      where: { organisationId: orgId },
      order: [["updatedAt", "DESC"]],
    });

    const activeRows = rows.filter((row) => String(row.status || "").toLowerCase() === "active");
    const messengerConnected = activeRows.some((row) => String(row.platform || "").toLowerCase() === "messenger");
    const instagramConnected = activeRows.some((row) => String(row.platform || "").toLowerCase() === "instagram");

    return success({
      messengerConnected,
      instagramConnected,
      anyConnected: messengerConnected || instagramConnected,
      accounts: activeRows.map((row) => ({
        id: row.id,
        platform: row.platform,
        accountId: row.accountId,
        accountName: row.accountName,
        status: row.status,
      })),
    });
  } catch (err) {
    return error(500, err.message || "Failed to load DM connection status");
  }
};

export const uploadDmAttachment = async (event) => {
  try {
    const { orgId, userId } = event.context.user || {};
    if (!orgId || !userId) return error(401, "Unauthenticated");

    const formData = await readMultipartFormData(event);
    if (!formData || !formData.length) {
      return error(400, "No file uploaded");
    }

    const fileData = formData.find((item) => item.name === "file");
    if (!fileData) return error(400, "Missing file");

    const originalName = fileData.filename || "file";
    const fileExt = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const mimeType = fileData.type || "application/octet-stream";

    const s3Path = await uploadBufferFile({
      data: fileData.data,
      filename: uniqueFileName,
      contentType: mimeType,
      baseDir: "chat-attachments",
    });

    const attachmentType = mimeType.startsWith("image/") ? "image" : "file";
    return success({
      url: s3Path,
      name: originalName,
      mimeType,
      type: attachmentType,
      size: fileData.data?.length || null,
    });
  } catch (err) {
    return error(500, err.message || "Failed to upload attachment");
  }
};
