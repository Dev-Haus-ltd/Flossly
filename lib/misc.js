
export const getRandomHexColor = () => {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
  }

export const downloadFile = (file) => {
  const config = useRuntimeConfig()
  const fullUrl =  `${config.public.BASE_URL}${file.link}`;

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
