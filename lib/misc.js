
export const getRandomHexColor = () => {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
  }

export const downloadFile = (file) => {
  const config = useRuntimeConfig()
  const ver = file?.updatedAt ? new Date(file.updatedAt).getTime() : Date.now()
  const sep = (file.link || '').includes('?') ? '&' : '?'
  const fullUrl =  `${config.public.BASE_URL}${file.link}${sep}v=${ver}`;

  fetch(fullUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || file.link.split('/').pop(); // fallback to filename from URL
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error(error);
      // Use global snackbar instead of alert
      try {
        const mainStore = useMainStore && useMainStore()
        if (mainStore && mainStore.setSnackbar) {
          mainStore.setSnackbar({
            title: 'Error downloading file',
            type: 'error',
          })
        }
      } catch (e) {
        // no-op if store not available in this execution context
      }
    });
}

export const buildAbsoluteLink = (link, baseUrl) => {
  if (!link) return ""
  const trimmed = link.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = (baseUrl || "").trim()
  if (!base) return trimmed
  return `${base.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`
}


export const describeTextContent = (input = "") => {
  if (typeof input !== "string") {
    return { type: "empty", value: "" };
  }

  const value = input.trim();
  if (!value) {
    return { type: "empty", value: "" };
  }

  // Accepts explicit protocols or leading www. plus a domain
  const linkPattern =
    /^(?:[a-zA-Z][a-zA-Z\d+\-.]*:\/\/|www\.)[^\s]+$/i;
  // Accept bare domains like example.com
  const bareDomainPattern =
    /^[\w-]+(\.[\w-]+)+([:/?#][^\s]*)?$/i;

  const isLink = linkPattern.test(value) || bareDomainPattern.test(value);

  return {
    type: isLink ? "link" : "text",
    value,
  };
};

const parseJsonLikeValue = (value) => {
  if (typeof value !== "string") return { value, parsed: false };
  const trimmed = value.trim();
  if (!trimmed) return { value: "", parsed: false };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { value: JSON.parse(trimmed), parsed: true };
    } catch (e) {
      return { value: trimmed, parsed: false };
    }
  }
  return { value: trimmed, parsed: false };
};

export const formatAssignedUsers = (assigned) => {
  const { value } = parseJsonLikeValue(assigned);
  if (typeof value === "string") return value || "N/A";
  const list = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];
  if (!list.length) return "N/A";
  const names = list
    .map((a) => a?.fullName || a?.name || a?.email)
    .filter(Boolean);
  return names.length ? names.join(", ") : "N/A";
};

export const formatTreatmentValue = (treatment) => {
  const { value } = parseJsonLikeValue(treatment);
  if (typeof value === "string") return value || "N/A";
  if (Array.isArray(value)) {
    const names = value
      .map((t) => t?.name || t?.title)
      .filter(Boolean);
    return names.length ? names.join(", ") : "N/A";
  }
  if (value?.name) return value.name;
  if (value?.title) return value.title;
  return "N/A";
};

export const parseColorString = (color) => {
  if (!color || typeof color !== "string") return null;
  const trimmed = color.trim();

  // Hex (#RGB or #RRGGBB)
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    const hex = trimmed.slice(1);
    const normalized = hex.length === 3
      ? hex.split("").map((ch) => ch + ch).join("")
      : hex;
    const intVal = parseInt(normalized, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255,
    };
  }

  // rgb/rgba
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return null;
};

export const getContrastingTextColor = (
  bgColor,
  { light = "#1e1e1e", dark = "#ffffff" } = {}
) => {
  const rgb = parseColorString(bgColor);
  if (!rgb) return light;
  // perceived luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.65 ? light : dark;
};

export const formatYmd = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDayOffsetFromText = (text) => {
  const raw = String(text || "").toLowerCase();
  if (!raw) return null;
  if (raw.includes("immediately")) return 0;
  const match = raw.match(/(\d+)\s*day/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

const CRM_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CRM_WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const crmOrdinal = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value || "");
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const crmDayLabel = (days, suffix) => {
  const count = Math.abs(Number(days || 0));
  const plural = count === 1 ? "" : "s";
  return `${count} day${plural} ${suffix}`;
};

export const formatCrmTriggerPreview = (trigger = {}) => {
  const type = trigger?.type;
  if (type === "inquiry_days") {
    const days = Number(trigger?.days || 0);
    if (days === 0) return "Immediately when lead comes into CRM";
    return crmDayLabel(days, "after enquiry");
  }
  if (type === "birthday_offset") {
    const days = Number(trigger?.days || 0);
    if (days === 0) return "On birthday";
    return crmDayLabel(days, "after birthday");
  }
  if (type === "black_friday") {
    const offset = Number(trigger?.offsetDays || 0);
    const minHour = Number(trigger?.minHour || 0);
    if (offset === 0 && minHour >= 18) return "Black Friday evening";
    if (offset === 0 && minHour >= 12) return "Black Friday afternoon";
    if (offset === 0) return "Black Friday morning";
    if (offset < 0) return crmDayLabel(offset, "before Black Friday");
    return crmDayLabel(offset, "after Black Friday");
  }
  if (type === "month_day") {
    const month = Number(trigger?.month || 0);
    const day = Number(trigger?.day || 0);
    if (!month || !day) return "Annual date";
    const base = `${CRM_MONTH_NAMES[month - 1]} ${day}`;
    const offset = Number(trigger?.offsetDays || 0);
    if (offset === 0) return `Every year on ${base}`;
    if (offset < 0) return crmDayLabel(offset, `before ${base}`);
    return crmDayLabel(offset, `after ${base}`);
  }
  if (type === "weekday_of_month") {
    const month = Number(trigger?.month || 0);
    const weekday = Number.isFinite(Number(trigger?.weekday)) ? Number(trigger.weekday) : null;
    const weekIndex = Number(trigger?.weekIndex || 0);
    if (!month || weekday === null || !weekIndex) return "Annual weekday";
    const base = `${crmOrdinal(weekIndex)} ${CRM_WEEKDAY_NAMES[weekday]} of ${CRM_MONTH_NAMES[month - 1]}`;
    const offset = Number(trigger?.offsetDays || 0);
    if (offset === 0) return `Every year on the ${base}`;
    if (offset < 0) return crmDayLabel(offset, `before the ${base}`);
    return crmDayLabel(offset, `after the ${base}`);
  }
  return "Custom schedule";
};

export const addDaysSafe = (value, days) => {
  const base = value instanceof Date ? new Date(value) : new Date(value || Date.now());
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + Number(days || 0));
  return base;
};

export const DEFAULT_TASK_CATEGORY_NAMES = [
  "Staff Management",
  "Marketing",
  "Finance",
  "HR",
];

export const getCategoryTaskCount = (cat) => {
  const count = Number(
    cat?.taskCount ?? cat?.total ?? cat?.count ?? cat?.taskTotal ?? 0
  );
  return Number.isNaN(count) ? 0 : count;
};

export const isDefaultNamedCategory = (
  cat,
  defaultNames = DEFAULT_TASK_CATEGORY_NAMES
) => defaultNames.includes((cat?.categoryName || cat?.name || "").trim());

export const isMandatoryCategory = (cat) => !!(cat?.isDefault);

export const canHideCategory = (
  cat,
  defaultNames = DEFAULT_TASK_CATEGORY_NAMES
) => {
  if (!cat) return false;
  const name = (cat.categoryName || cat.name || "").trim().toLowerCase();
  const isAllowedDefault = defaultNames.some(
    (n) => n.toLowerCase() === name
  );
  if (!isAllowedDefault) return false;
  return getCategoryTaskCount(cat) === 0;
};

export const mergeCategoriesWithStats = (categories = [], stats = []) => {
  const map = new Map();

  (categories || []).forEach((cat) => {
    const id = cat.id ?? cat.categoryId;
    if (id === undefined || id === null) return;
    map.set(String(id), {
      categoryId: id,
      categoryName: cat.name || cat.categoryName,
      taskCount: 0,
      isMandatory: cat.isMandatory ?? cat.isDefault ?? false,
      color: cat.color,
      parentId: cat.parentId ?? null,
      description: cat.description ?? "",
    });
  });

  (stats || []).forEach((stat) => {
    const id = stat.categoryId ?? stat.id;
    if (id === undefined || id === null) return;
    const key = String(id);
    const existing = map.get(key) || {};
    map.set(key, {
      ...existing,
      ...stat,
      categoryId: id,
      categoryName: stat.categoryName || existing.categoryName,
      isMandatory: stat.isMandatory ?? existing.isMandatory ?? false,
    });
  });

  return Array.from(map.values());
};

export const applyCategoryOrder = (list = [], order = []) => {
  if (!order.length) return list;
  const map = new Map(list.map((cat) => [cat.categoryId, cat]));
  const ordered = order
    .map((id) => map.get(id))
    .filter(Boolean);
  const missing = list.filter((cat) => !order.includes(cat.categoryId));
  return [...ordered, ...missing];
};

export const syncCategoryOrder = (order = [], list = []) => {
  const ids = (list || []).map((cat) => cat.categoryId);
  if (!ids.length) return [];
  const filtered = order.filter((id) => ids.includes(id));
  const missing = ids.filter((id) => !filtered.includes(id));
  return [...filtered, ...missing];
};

export const autoUnhideCategoryIds = (hiddenIds = [], list = []) => {
  if (!hiddenIds.length) return hiddenIds;
  const nonEmptyIds = new Set(
    (list || [])
      .filter((cat) => getCategoryTaskCount(cat) > 0)
      .map((cat) => String(cat?.categoryId ?? cat?.id))
  );
  return hiddenIds.filter((id) => !nonEmptyIds.has(String(id)));
};

export const sortByCustomStatus = (arr = []) => {
  const order = ["upcoming", "todo", "progress", "cancelled", "completed"];
  const priority = Object.fromEntries(
    order.map((status, index) => [status, index])
  );

  return [...arr].sort((a, b) => {
    if (a.status?.toLowerCase() === "archived") return 1;
    if (b.status?.toLowerCase() === "archived") return -1;

    const aPriority = priority[a.status?.toLowerCase()] ?? Infinity;
    const bPriority = priority[b.status?.toLowerCase()] ?? Infinity;
    return aPriority - bPriority;
  });
};

export const getTaskCategoryIcon = (categoryName) => {
  switch (categoryName) {
    case "Marketing":
      return "https://cdn.lordicon.com/excswhey.json";
    case "Staff Management":
      return "https://cdn.lordicon.com/kphwxuxr.json";
    case "Finance":
      return "https://cdn.lordicon.com/tzynxkwl.json";
    case "Compliance":
      return "https://cdn.lordicon.com/yraqammt.json";
    default:
      return "https://cdn.lordicon.com/qlpudrww.json";
  }
};
