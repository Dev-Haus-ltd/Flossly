import { Op } from "sequelize";
import { readBody, getQuery, setResponseStatus, getMethod, readMultipartFormData } from "h3";
import { success, error } from "../utils/response";
import { parseJsonBody } from "../utils/body";
import { CrmDmConversation, CrmDmMessage, CrmDmAccount, MetaPage } from "../models";
import { decrypt } from "../utils/crypto";
import { uploadBufferFile } from "../utils/storage";
import { deriveAttachmentPreview, resolveDmParticipantProfile } from "../utils/dmAttachments.js";

const ensureDmTables = async () => {};

const META_VERSION = "v24.0";
const STANDARD_MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;
const RAW_DM_ID_REGEX = /^\d{10,}$/;

const isRawDmIdentifier = (value) => RAW_DM_ID_REGEX.test(String(value || "").trim());

const fallbackDmParticipantName = (platform) => {
  const normalized = String(platform || "").toLowerCase();
  if (normalized === "instagram") return "Instagram User";
  if (normalized === "messenger") return "Messenger User";
  return "Unknown";
};

const isPlaceholderDmParticipantName = (value, platform = null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  if (isRawDmIdentifier(normalized)) return true;
  if (normalized === "unknown") return true;

  const platformFallback = String(fallbackDmParticipantName(platform) || "").trim().toLowerCase();
  if (platformFallback && normalized === platformFallback) return true;
  return false;
};

const resolveDmParticipantName = ({ platform, preferredName, currentName, threadId }) => {
  const candidates = [preferredName, currentName]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const firstHuman = candidates.find((name) => !isPlaceholderDmParticipantName(name, platform));
  if (firstHuman) return firstHuman;

  const thread = String(threadId || "").trim();
  if (thread && !isRawDmIdentifier(thread)) return thread;
  return fallbackDmParticipantName(platform);
};

const toAbsoluteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const config = useRuntimeConfig();
  const base = config.public?.BASE_URL || config.BASE_URL || process.env.BASE_URL || "";
  if (!base) return raw;
  return `${String(base).replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
};

const resolveMetaAttachmentType = (mimeType) => {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized.startsWith("video/")) return "video";
  return "file";
};

const resolveMetaSendContext = async ({ organisationId, conversation, account }) => {
  const platform = String(conversation?.platform || account?.platform || "").toLowerCase();
  const accountMetadata = account?.metadata || {};
  const conversationMetadata = conversation?.metadata || {};

  let senderId = String(conversation?.accountId || account?.accountId || "me");
  let accessToken = account?.accessTokenEnc ? decrypt(account.accessTokenEnc) : null;
  let pageId = "";

  if (platform === "instagram") {
    pageId = String(
      accountMetadata?.pageId ||
      conversationMetadata?.pageId ||
      ""
    ).trim();
  } else if (platform === "messenger") {
    pageId = String(
      conversation?.accountId ||
      accountMetadata?.pageId ||
      account?.accountId ||
      ""
    ).trim();
  }

  if (!pageId && platform !== "instagram") {
    pageId = String(account?.accountId || "").trim();
  }

  if (!pageId) {
    try {
      const activePages = await MetaPage.findAll({
        where: {
          organisationId,
          status: "Active",
        },
        order: [["updatedAt", "DESC"]],
        limit: 2,
      });
      if (activePages.length === 1) {
        pageId = String(activePages[0]?.pageId || "").trim();
      }
    } catch {}
  }

  if (pageId) {
    try {
      const metaPage = await MetaPage.findOne({
        where: {
          organisationId,
          pageId,
          status: "Active",
        },
      });
      if (metaPage?.accessTokenEnc) {
        accessToken = decrypt(metaPage.accessTokenEnc) || accessToken;
      }
      if (metaPage?.pageId) {
        senderId = String(metaPage.pageId);
      }
    } catch {}
  }

  return {
    accessToken,
    senderId,
    pageId: pageId || null,
  };
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
      const { accessToken, senderId } = await resolveMetaSendContext({
        organisationId,
        conversation,
        account,
      });
      if (!accessToken) {
        throw new Error("Account token missing");
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
      if (text) {
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

    const now = new Date();
    await CrmDmConversation.update(
      { autoReplyEnabled: true, autoReplyDisabledUntil: null },
      {
        where: {
          organisationId: orgId,
          autoReplyDisabledUntil: { [Op.lt]: now },
        },
      }
    );

    const rows = await CrmDmConversation.findAndCountAll({
      where,
      order: [["lastMessageAt", "DESC"], ["updatedAt", "DESC"]],
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    const data = rows.rows.map((row) => {
      row.setDataValue("leadId", Number(row?.metadata?.leadId || 0) || null);
      row.setDataValue("leadSource", row?.metadata?.leadSource || null);
      return row;
    });

    return success({
      total: rows.count,
      data,
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
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: Number.isFinite(limit) ? limit : 30,
    });

    const sorted = rows.slice().sort((a, b) => {
      const aTs = new Date(a.createdAt).getTime();
      const bTs = new Date(b.createdAt).getTime();
      if (aTs !== bTs) return aTs - bTs;

      // Keep inbound before outbound when timestamps are identical.
      const aInbound = String(a.direction || "").toLowerCase() === "inbound";
      const bInbound = String(b.direction || "").toLowerCase() === "inbound";
      if (aInbound !== bInbound) return aInbound ? -1 : 1;

      return Number(a.id || 0) - Number(b.id || 0);
    });
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

    const outboundText = String(message || "").trim() || null;
    const outboundAttachments = hasAttachments ? attachments : null;
    const outboundPreview = deriveAttachmentPreview(outboundAttachments || [], outboundText) || "";
    const storedOutboundMessage = outboundText || (outboundAttachments?.length ? "[Attachment]" : null);

    const newMessage = await CrmDmMessage.create({
      organisationId: orgId,
      conversationId: conversation.id,
      platform: conversation.platform,
      direction: "outbound",
      senderName: "Flossly",
      message: storedOutboundMessage,
      attachments: outboundAttachments,
      status: "queued",
    });

    conversation.lastMessageAt = new Date();
    conversation.metadata = {
      ...(conversation.metadata || {}),
      lastMessagePreview: outboundPreview.slice(0, 120),
    };
    conversation.autoReplyEnabled = false;
    conversation.autoReplyDisabledUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
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

export const deleteDmConversation = async (event) => {
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

    await CrmDmMessage.destroy({
      where: {
        organisationId: orgId,
        conversationId: conversation.id,
      },
    });
    await conversation.destroy();

    return success({
      deleted: true,
      conversationId: Number(conversationId),
    });
  } catch (err) {
    return error(500, err.message || "Failed to delete conversation");
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
    const profile = await resolveDmParticipantProfile({
      platform: conversation.platform,
      senderId: conversation.threadId,
      accessToken,
    });
    if (!profile) return success({ updated: false });

    const nextName = resolveDmParticipantName({
      platform: conversation.platform,
      preferredName: profile?.name,
      currentName: conversation.participantName,
      threadId: conversation.threadId,
    });
    conversation.participantName = nextName;
    conversation.participantAvatar = profile.avatar || conversation.participantAvatar;
    conversation.metadata = {
      ...(conversation.metadata || {}),
      participantName: nextName,
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

export const refreshAllDmProfiles = async (event) => {
  try {
    await ensureDmTables();
    const { orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    // Fetch recent conversations — filter in JS to catch raw numeric IDs too
    const recentConvs = await CrmDmConversation.findAll({
      where: { organisationId: orgId },
      order: [["lastMessageAt", "DESC"]],
      limit: 150,
    });

    const toRefresh = recentConvs.filter((c) => {
      return !c.participantAvatar || isPlaceholderDmParticipantName(c.participantName, c.platform);
    });

    let updated = 0;
    for (const conversation of toRefresh) {
      // Small delay to avoid hammering the Meta API
      await new Promise((r) => setTimeout(r, 60));

      let account = await CrmDmAccount.findOne({
        where: {
          organisationId: orgId,
          platform: conversation.platform,
          accountId: String(conversation.accountId),
          status: "Active",
        },
      });
      if (!account?.accessTokenEnc) {
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
      if (!account?.accessTokenEnc) continue;

      const accessToken = decrypt(account.accessTokenEnc);
      const profile = await resolveDmParticipantProfile({
        platform: conversation.platform,
        senderId: conversation.threadId,
        accessToken,
      });
      if (!profile) continue;

      const nextName = resolveDmParticipantName({
        platform: conversation.platform,
        preferredName: profile?.name,
        currentName: conversation.participantName,
        threadId: conversation.threadId,
      });
      const nameChanged = nextName !== conversation.participantName;
      const avatarChanged = profile.avatar && profile.avatar !== conversation.participantAvatar;
      if (nameChanged || avatarChanged) {
        conversation.participantName = nextName;
        conversation.participantAvatar = profile.avatar || conversation.participantAvatar;
        conversation.metadata = {
          ...(conversation.metadata || {}),
          participantName: nextName,
          participantAvatar: conversation.participantAvatar,
          profileFetchedAt: new Date().toISOString(),
        };
        await conversation.save();
        updated++;
      }
    }

    return success({ updated, checked: toRefresh.length });
  } catch (err) {
    return error(500, err.message || "Failed to refresh profiles");
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

    const attachmentType = resolveMetaAttachmentType(mimeType);
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
