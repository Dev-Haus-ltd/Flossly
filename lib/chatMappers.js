import { buildDayKey, buildDayLabel, formatChatTimestamp } from "@/lib/chatThread";
import {
  resolveDmStatusIcon,
  resolveDmStatusColor,
  resolveWhatsAppStatusIcon,
  resolveWhatsAppStatusColor,
  getInitials,
} from "@/lib/chatShared";

// Media types where content field is empty but the message IS the media
const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker", "gif", "voice"]);

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
  const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
  const content = String(row?.content || "").trim();
  const templateName = String(row?.templateName || "").trim();
  const type = String(row?.type || "").trim().toLowerCase();

  // For media messages with no text content, use "[Attachment]" so ChatBubble
  // hides the text but shows the attachment placeholder if no renderable media exists
  const message =
    content ||
    (templateName ? `Template: ${templateName}` : "") ||
    (MEDIA_TYPES.has(type) ? "[Attachment]" : (type ? `${type} message` : ""));

  if (!message) return null;

  const avatarUrl = isOutbound ? outboundAvatarUrl : inboundAvatarUrl;
  const avatarText = isOutbound ? getInitials(outboundLabel) : getInitials(inboundLabel);

  return {
    id: row?.id || `${row?.providerMessageId || "na"}-${row?.createdAt || Date.now()}`,
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
