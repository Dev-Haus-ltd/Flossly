import { parsedDate } from "@/lib/dateFormatter";

export const buildDayKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return "unknown";
  return date.toISOString().slice(0, 10);
};

export const buildDayLabel = (value, now = new Date()) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return "Unknown";
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startDate - startToday) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

export const formatChatTimestamp = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return parsedDate(value) || "N/A";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const groupChatItems = (items = []) => {
  const groups = [];
  const map = new Map();
  const list = Array.isArray(items) ? items : [];
  list.forEach((item) => {
    if (!item) return;
    const key = item.dayKey || buildDayKey(item.createdAt);
    const label = item.dayLabel || buildDayLabel(item.createdAt);
    if (!map.has(key)) {
      const group = { key, label, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  });
  return groups;
};
