import { buildDayKey, buildDayLabel, formatChatTimestamp } from "@/lib/chatThread";
import {
  resolveDmStatusIcon,
  resolveDmStatusColor,
  resolveWhatsAppStatusIcon,
  resolveWhatsAppStatusColor,
  getInitials,
} from "@/lib/chatShared";

// Media types — content field is empty but message IS the media (shown as attachment)
const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker", "gif", "voice", "album"]);

// Fallback labels for types where content is saved as empty in old rows
// (new rows have content populated by getMessageContent in the webhook)
const TYPE_FALLBACK = {
  action:               "Reacted to a message",
  reaction:             "Reacted to a message",
  revoked:              "🚫 This message was deleted",
  system:               "System message",
  e2e_notification:     "🔒 Messages are end-to-end encrypted",
  notification_template:"System notification",
  location:             "📍 Location",
  live_location:        "📍 Live Location",
  contact:              "👤 Contact",
  contact_list:         "👤 Contacts",
  poll:                 "📊 Poll",
  group_invite:         "👥 Group invite",
  product:              "🛍️ Product",
  catalog:              "📦 Catalog",
  order:                "🧾 Order",
  reply:                "↩️ Reply",
  carousel:             "🎠 Carousel",
  admin_invite:         "📢 Newsletter invite",
  link_preview:         "🔗 Link",
  hsm:                  "📋 Template message",
};

export const mapDmMessageToChatItem = (
  row,
  { inboundAvatarUrl = "", inboundAvatarText = "C", outboundAvatarUrl = "", outboundAvatarText = "F" } = {}
) => {
  const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
  return {
    id: row?.id,
    isOutbound,
    sender: row?.senderName || (isOutbound ? "Flossly" : "Client"),
    message: row?.message || "",
    timeLabel: formatChatTimestamp(row?.createdAt),
    statusIcon: isOutbound ? resolveDmStatusIcon(row?.status) : "",
    statusColor: isOutbound ? resolveDmStatusColor(row?.status) : "",
    automated: false,
    avatarUrl: isOutbound ? outboundAvatarUrl : inboundAvatarUrl,
    avatarText: isOutbound ? outboundAvatarText : inboundAvatarText,
    attachments: row?.attachments || null,
    dayKey: buildDayKey(row?.createdAt),
    dayLabel: buildDayLabel(row?.createdAt),
    createdAt: row?.createdAt,
  };
};

export const mapWhatsAppLogToChatItem = (
  row,
  {
    inboundLabel = "Lead",
    outboundLabel = "Flossly",
    inboundAvatarUrl = "",
    outboundAvatarUrl = "",
  } = {}
) => {
  const type = String(row?.type || "").trim().toLowerCase();
  const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
  const content = String(row?.content || "").trim();
  const templateName = String(row?.templateName || "").trim();

  const message =
    content ||
    (templateName ? `Template: ${templateName}` : "") ||
    (MEDIA_TYPES.has(type) ? "[Attachment]" : "") ||
    TYPE_FALLBACK[type] ||
    "";

  // Only skip rows that have absolutely no displayable content and no known type label
  if (!message) return null;

  const avatarUrl = isOutbound ? outboundAvatarUrl : inboundAvatarUrl;
  const avatarText = isOutbound ? getInitials(outboundLabel) : getInitials(inboundLabel);

  return {
    id: row?.id || `${row?.providerMessageId || "na"}-${row?.createdAt || Date.now()}`,
    providerMessageId: row?.providerMessageId || null,
    recipientPhone: row?.to || null,
    isOutbound,
    sender: isOutbound ? outboundLabel : inboundLabel,
    message,
    timeLabel: formatChatTimestamp(row?.createdAt),
    statusIcon: resolveWhatsAppStatusIcon(row?.status),
    statusColor: resolveWhatsAppStatusColor(row?.status),
    automated: type === "template" || !!row?.templateName,
    avatarUrl,
    avatarText,
    attachments: row?.attachments || null,
    dayKey: buildDayKey(row?.createdAt),
    dayLabel: buildDayLabel(row?.createdAt),
    createdAt: row?.createdAt,
  };
};
