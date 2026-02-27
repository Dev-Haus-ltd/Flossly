export const getInitials = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parts = raw.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return letters.join("");
};

export const resolveDmStatusIcon = (raw) => {
  const status = String(raw || "").toLowerCase();
  if (status === "sent") return "mdi-check";
  if (status === "failed") return "mdi-alert-circle-outline";
  if (status === "queued") return "mdi-clock-outline";
  return "";
};

export const resolveWhatsAppStatusIcon = (raw) => {
  const status = String(raw || "").trim().toLowerCase();
  if (!status) return "";
  if (status.includes("read")) return "mdi-check-all";
  if (status.includes("delivered")) return "mdi-check-all";
  if (status.includes("sent")) return "mdi-check";
  return "";
};
