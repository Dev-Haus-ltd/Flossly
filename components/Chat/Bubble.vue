<template>
  <div
    class="chat-bubble-row"
    :class="isOutbound ? 'chat-bubble-row--outbound' : 'chat-bubble-row--inbound'"
  >
    <div class="chat-bubble-wrap">
      <div class="chat-bubble-content">
        <!-- Inbound avatar -->
        <div
          v-if="!isOutbound"
          class="chat-avatar"
          :class="{ 'chat-avatar--image': showAvatarImage }"
        >
          <img v-if="showAvatarImage" :src="avatarUrl" alt="Lead" @error="onAvatarError" />
          <span v-else>{{ avatarText }}</span>
        </div>

        <div class="chat-bubble" :class="bubbleClass">
          <div v-if="automated" class="chat-bubble-badge">Automated</div>

          <!-- Image-first layout (WhatsApp style) -->
          <template v-if="leadImage">
            <a
              class="chat-bubble-image-wrap"
              :href="leadImage.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img :src="leadImage.url" :alt="leadImage.name || 'Image'" class="chat-bubble-image" />
              <!-- Timestamp overlaid on image when no text below -->
              <div v-if="!showMessage" class="chat-bubble-image-meta">
                <span>{{ timestamp || 'N/A' }}</span>
                <v-icon v-if="statusIcon" size="12" :color="statusColor || undefined">{{ statusIcon }}</v-icon>
              </div>
            </a>
            <!-- Caption below image -->
            <div v-if="showMessage" class="chat-bubble-caption">
              <span>{{ message }}</span>
              <div class="chat-bubble-meta">
                <span>{{ timestamp || 'N/A' }}</span>
                <v-icon v-if="statusIcon" size="12" :color="statusColor || undefined">{{ statusIcon }}</v-icon>
              </div>
            </div>
          </template>

          <!-- Text-only layout -->
          <template v-else>
            <div v-if="showMessage" class="chat-bubble-text-wrap">
              <p class="chat-bubble-text">{{ message }}</p>
            </div>
            <div v-if="showAttachmentPlaceholder" class="chat-attachment-placeholder">
              <v-icon size="14" class="mr-1">mdi-paperclip</v-icon>
              <span>Attachment</span>
            </div>

            <!-- Video attachments -->
            <div v-if="videoAttachments.length" class="chat-media-stack">
              <video
                v-for="(att, idx) in videoAttachments"
                :key="`video-${idx}`"
                class="chat-attachment-video"
                controls
              >
                <source :src="att.url" :type="att.mimeType || 'video/mp4'" />
              </video>
            </div>

            <!-- Audio attachments -->
            <div v-if="audioAttachments.length" class="chat-media-stack">
              <audio
                v-for="(att, idx) in audioAttachments"
                :key="`audio-${idx}`"
                class="chat-attachment-audio"
                controls
              >
                <source :src="att.url" :type="att.mimeType || 'audio/mpeg'" />
              </audio>
            </div>

            <!-- File attachments -->
            <div v-if="fileAttachments.length" class="chat-attachments-files">
              <a
                v-for="(att, idx) in fileAttachments"
                :key="`file-${idx}`"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chat-attachment-file"
              >
                <v-icon size="16">mdi-file-outline</v-icon>
                <span>{{ att.name || 'Attachment' }}</span>
                <v-icon size="14" class="ml-auto opacity-60">mdi-open-in-new</v-icon>
              </a>
            </div>

            <div class="chat-bubble-meta">
              <span>{{ timestamp || 'N/A' }}</span>
              <v-icon v-if="statusIcon" size="12" :color="statusColor || undefined">{{ statusIcon }}</v-icon>
            </div>
          </template>
        </div>

        <!-- Outbound avatar -->
        <div
          v-if="isOutbound"
          class="chat-avatar"
          :class="{ 'chat-avatar--image': showAvatarImage }"
        >
          <img v-if="showAvatarImage" :src="avatarUrl" alt="Practice" @error="onAvatarError" />
          <span v-else>{{ avatarText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOutbound: { type: Boolean, default: false },
  sender: { type: String, default: "" },
  message: { type: String, default: "" },
  timestamp: { type: String, default: "" },
  statusIcon: { type: String, default: "" },
  statusColor: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  avatarText: { type: String, default: "" },
  automated: { type: Boolean, default: false },
  attachments: { type: [Array, Object, String, null], default: null },
});

const showAvatarImage = ref(false);

const updateAvatarVisibility = () => { showAvatarImage.value = !!props.avatarUrl; };
const onAvatarError = () => { showAvatarImage.value = false; };

watch(() => props.avatarUrl, () => updateAvatarVisibility(), { immediate: true });

const normalizeAttachments = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
};

const extractAttachmentUrl = (att) => {
  if (!att) return null;
  if (typeof att === "string") return att;
  return att?.url || att?.payload?.url || att?.payload?.attachment_url || att?.payload?.link || null;
};

const extractAttachmentType = (att) => {
  if (!att) return "";
  return String(att?.type || att?.mime_type || att?.mimeType || "").toLowerCase();
};

const extractAttachmentName = (att, url) => {
  if (!att) return "";
  const name = att?.name || att?.filename || att?.file_name || "";
  if (name) return name;
  if (!url) return "";
  try {
    const part = url.split("/").pop() || "";
    return decodeURIComponent(part.split("?")[0] || "");
  } catch { return ""; }
};

const normalizedAttachments = computed(() => {
  return normalizeAttachments(props.attachments)
    .map((att) => {
      const url = extractAttachmentUrl(att);
      if (!url) return null;
      const type = extractAttachmentType(att);
      const name = extractAttachmentName(att, url);
      return { url, type, name, mimeType: att?.mimeType || att?.mime_type || null };
    })
    .filter(Boolean);
});

// The primary image (first image attachment) gets WhatsApp-style full-bleed treatment
const leadImage = computed(() => {
  return normalizedAttachments.value.find(
    (a) => a.type.includes("image") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(a.url)
  ) || null;
});

const videoAttachments = computed(() =>
  normalizedAttachments.value.filter((a) => a.type.includes("video") || /\.(mp4|mov|webm|avi|mkv)$/i.test(a.url))
);

const audioAttachments = computed(() =>
  normalizedAttachments.value.filter((a) => a.type.includes("audio") || /\.(mp3|wav|ogg|m4a)$/i.test(a.url))
);

const fileAttachments = computed(() =>
  normalizedAttachments.value.filter(
    (a) =>
      !leadImage.value || a !== leadImage.value &&
      !videoAttachments.value.includes(a) &&
      !audioAttachments.value.includes(a)
  ).filter(
    (a) => !a.type.includes("image") && !/\.(png|jpe?g|gif|webp|bmp)$/i.test(a.url)
  )
);

const showMessage = computed(() => {
  const text = String(props.message || "").trim();
  if (!text || text === "[Attachment]") return false;
  return true;
});

const showAttachmentPlaceholder = computed(() => {
  const text = String(props.message || "").trim();
  return text === "[Attachment]" && !normalizedAttachments.value.length;
});

const bubbleClass = computed(() => ({
  "chat-bubble--has-image": !!leadImage.value,
  "chat-bubble--outbound": props.isOutbound,
  "chat-bubble--inbound": !props.isOutbound,
}));
</script>

<style scoped>
.chat-bubble-row {
  display: flex;
  margin-bottom: 2px;
}

.chat-bubble-row--inbound { justify-content: flex-start; }
.chat-bubble-row--outbound { justify-content: flex-end; }

.chat-bubble-wrap { max-width: 72%; }

.chat-bubble-content {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* ── Bubble shell ── */
.chat-bubble {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  min-width: 80px;
}

.chat-bubble--inbound {
  background: #ffffff;
  border-bottom-left-radius: 4px;
}

.chat-bubble--outbound {
  background: #e7f8ee;
  border-bottom-right-radius: 4px;
}

/* Tails */
.chat-bubble--inbound::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: -7px;
  width: 0;
  height: 0;
  border-right: 8px solid #ffffff;
  border-top: 8px solid transparent;
}

.chat-bubble--outbound::after {
  content: "";
  position: absolute;
  bottom: 0;
  right: -7px;
  width: 0;
  height: 0;
  border-left: 8px solid #e7f8ee;
  border-top: 8px solid transparent;
}

/* ── Image layout (full-bleed) ── */
.chat-bubble--has-image {
  padding: 0;
}

.chat-bubble-image-wrap {
  display: block;
  position: relative;
  line-height: 0;
}

.chat-bubble-image {
  display: block;
  width: 100%;
  max-width: 320px;
  min-width: 180px;
  height: auto;
  max-height: 320px;
  object-fit: cover;
  border-radius: 16px;
}

.chat-bubble--inbound .chat-bubble-image {
  border-bottom-left-radius: 4px;
}
.chat-bubble--outbound .chat-bubble-image {
  border-bottom-right-radius: 4px;
}

/* Timestamp overlaid on image (no caption) */
.chat-bubble-image-meta {
  position: absolute;
  bottom: 6px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.38);
  border-radius: 8px;
  padding: 2px 6px;
  line-height: 1.4;
}

/* Caption below image */
.chat-bubble-caption {
  padding: 6px 10px 6px 10px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.45;
}

/* ── Text layout ── */
.chat-bubble-text-wrap {
  padding: 8px 10px 2px 10px;
}

.chat-bubble-text {
  margin: 0;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.88);
}

.chat-bubble-meta {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  padding: 2px 10px 6px 10px;
  line-height: 1;
}

/* ── Media ── */
.chat-media-stack {
  padding: 4px 8px;
  display: grid;
  gap: 6px;
}

.chat-attachment-video {
  width: 100%;
  max-width: 320px;
  border-radius: 10px;
  background: #000;
}

.chat-attachment-audio {
  width: 100%;
  max-width: 300px;
}

/* ── File attachments ── */
.chat-attachments-files {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
}

.chat-attachment-file {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1d4ed8;
  text-decoration: none;
  background: rgba(29, 78, 216, 0.06);
  border: 1px solid rgba(29, 78, 216, 0.14);
  padding: 8px 10px;
  border-radius: 10px;
}

.chat-attachment-file:hover { background: rgba(29, 78, 216, 0.1); }

/* ── Placeholder ── */
.chat-attachment-placeholder {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
  padding: 8px 10px 4px;
}

/* ── Automated badge ── */
.chat-bubble-badge {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.07);
  color: rgba(15, 23, 42, 0.6);
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  margin: 6px 8px 0;
}

/* ── Avatar ── */
.chat-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #1e293b;
  overflow: hidden;
  flex: 0 0 auto;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-avatar--image { background: transparent; }
</style>
