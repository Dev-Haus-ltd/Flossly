import { buildDayKey, buildDayLabel, formatChatTimestamp } from "@/lib/chatThread";
import { resolveDmStatusIcon, resolveWhatsAppStatusIcon, getInitials } from "@/lib/chatShared";

export const mapDmMessageToChatItem = (row, { inboundAvatarUrl = "" } = {}) => {
  const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
  return {
    id: row?.id,
    isOutbound,
    sender: row?.senderName || (isOutbound ? "Flossly" : "Client"),
    message: row?.message,
    timeLabel: formatChatTimestamp(row?.createdAt),
    statusIcon: isOutbound ? resolveDmStatusIcon(row?.status) : "",
    automated: false,
    avatarUrl: isOutbound ? "" : inboundAvatarUrl,
    avatarText: isOutbound ? "F" : "C",
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
  const type = String(row?.type || "").trim();
  const message =
    content ||
    (templateName ? `Template: ${templateName}` : "") ||
    (type ? `${type} message` : "");
  if (!message) return null;
  const avatarUrl = isOutbound ? outboundAvatarUrl : inboundAvatarUrl;
  const avatarText = isOutbound
    ? getInitials(outboundLabel)
    : getInitials(inboundLabel);

  return {
    id: row?.id || `${row?.providerMessageId || "na"}-${row?.createdAt || Date.now()}`,
    isOutbound,
    sender: isOutbound ? outboundLabel : inboundLabel,
    message,
    timeLabel: formatChatTimestamp(row?.createdAt),
    statusIcon: resolveWhatsAppStatusIcon(row?.status),
    automated: String(row?.type || "").toLowerCase() === "template" || !!row?.templateName,
    avatarUrl,
    avatarText,
    attachments: row?.attachments || null,
    dayKey: buildDayKey(row?.createdAt),
    dayLabel: buildDayLabel(row?.createdAt),
    createdAt: row?.createdAt,
  };
};
