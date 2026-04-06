<template>
  <div
    class="chat-bubble-row"
    :class="isOutbound ? 'chat-bubble-row--outbound' : 'chat-bubble-row--inbound'"
  >
    <div class="chat-bubble-wrap">
      <div class="chat-bubble-content">
        <div
          v-if="!isOutbound"
          class="chat-avatar"
          :class="{ 'chat-avatar--image': showAvatarImage }"
        >
          <img v-if="showAvatarImage" :src="avatarUrl" alt="Lead" @error="onAvatarError" />
          <span v-else>{{ avatarText }}</span>
        </div>
        <div class="chat-bubble">
          <div v-if="automated" class="chat-bubble-badge">Automated</div>
          <p v-if="showMessage" class="mb-1 chat-bubble-text">{{ message }}</p>
          <div v-if="showAttachmentPlaceholder" class="chat-attachment-placeholder">
            <v-icon size="14" class="mr-1">mdi-paperclip</v-icon>
            <span>Attachment</span>
          </div>
          <div v-if="hasAttachments" class="chat-attachments">
            <div v-if="imageAttachments.length" class="chat-attachments-grid">
              <a
                v-for="(att, idx) in imageAttachments"
                :key="`img-${idx}`"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chat-attachment-image"
              >
                <img :src="att.url" :alt="att.name || 'Image'" />
              </a>
            </div>
            <div v-if="videoAttachments.length" class="chat-attachments-media">
              <video
                v-for="(att, idx) in videoAttachments"
                :key="`video-${idx}`"
                class="chat-attachment-video"
                controls
              >
                <source :src="att.url" :type="att.mimeType || 'video/mp4'" />
              </video>
            </div>
            <div v-if="audioAttachments.length" class="chat-attachments-media">
              <audio
                v-for="(att, idx) in audioAttachments"
                :key="`audio-${idx}`"
                class="chat-attachment-audio"
                controls
              >
                <source :src="att.url" :type="att.mimeType || 'audio/mpeg'" />
              </audio>
            </div>
            <div v-if="fileAttachments.length" class="chat-attachments-files">
              <a
                v-for="(att, idx) in fileAttachments"
                :key="`file-${idx}`"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chat-attachment-file"
              >
                <v-icon size="16" class="mr-1">mdi-paperclip</v-icon>
                <span>{{ att.name || 'Attachment' }}</span>
              </a>
            </div>
            <div v-if="storyAttachments.length" class="chat-attachments-stories">
              <a
                v-for="(att, idx) in storyAttachments"
                :key="`story-${idx}`"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chat-attachment-story"
              >
                <v-icon size="14" class="mr-1">mdi-instagram</v-icon>
                <span>Story reply</span>
                <v-icon size="12" class="ml-1 opacity-60">mdi-open-in-new</v-icon>
              </a>
            </div>
            <div v-if="shareAttachments.length" class="chat-attachments-shares">
              <a
                v-for="(att, idx) in shareAttachments"
                :key="`share-${idx}`"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chat-attachment-share"
              >
                <div class="share-header">
                  <v-icon size="14" class="mr-1">mdi-link-variant</v-icon>
                  <span class="share-title">{{ att.name || 'Shared post' }}</span>
                </div>
                <div v-if="att.description" class="share-description">{{ att.description }}</div>
                <span class="share-cta">View post</span>
              </a>
            </div>
          </div>
          <div class="chat-bubble-meta">
            <span>{{ timestamp || "N/A" }}</span>
            <v-icon
              v-if="statusIcon"
              size="14"
              class="chat-status-icon"
              :color="statusColor || undefined"
            >
              {{ statusIcon }}
            </v-icon>
          </div>
        </div>
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

const updateAvatarVisibility = () => {
  showAvatarImage.value = !!props.avatarUrl;
};

const onAvatarError = () => {
  showAvatarImage.value = false;
};

watch(
  () => props.avatarUrl,
  () => updateAvatarVisibility(),
  { immediate: true }
);

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
  } catch {
    return "";
  }
};

const normalizedAttachments = computed(() => {
  return normalizeAttachments(props.attachments)
    .map((att) => {
      const url = extractAttachmentUrl(att);
      if (!url) return null;
      const type = extractAttachmentType(att);
      const name = extractAttachmentName(att, url);
      return { url, type, name };
    })
    .filter(Boolean);
});

const hasRenderableAttachments = computed(() => normalizedAttachments.value.length > 0);

const showMessage = computed(() => {
  const text = String(props.message || "").trim();
  if (!text) return false;
  if (text === "[Attachment]") return false;
  return true;
});

const showAttachmentPlaceholder = computed(() => {
  const text = String(props.message || "").trim();
  return text === "[Attachment]" && !hasRenderableAttachments.value;
});

const imageAttachments = computed(() =>
  normalizedAttachments.value.filter((a) =>
    a.type.includes("image") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(a.url)
  )
);

const videoAttachments = computed(() =>
  normalizedAttachments.value.filter((a) =>
    a.type.includes("video") || /\.(mp4|mov|webm|avi|mkv)$/i.test(a.url)
  )
);

const audioAttachments = computed(() =>
  normalizedAttachments.value.filter((a) =>
    a.type.includes("audio") || /\.(mp3|wav|ogg|m4a)$/i.test(a.url)
  )
);

const storyAttachments = computed(() =>
  normalizedAttachments.value.filter((a) => a.type === "story")
);

const shareAttachments = computed(() =>
  normalizedAttachments.value.filter((a) => a.type === "share")
);

const fileAttachments = computed(() =>
  normalizedAttachments.value.filter(
    (a) =>
      !imageAttachments.value.includes(a) &&
      !videoAttachments.value.includes(a) &&
      !audioAttachments.value.includes(a) &&
      !storyAttachments.value.includes(a) &&
      !shareAttachments.value.includes(a)
  )
);

const hasAttachments = computed(() => hasRenderableAttachments.value);
</script>

<style scoped>
.chat-bubble-row {
  display: flex;
}

.chat-bubble-row--inbound {
  justify-content: flex-start;
}

.chat-bubble-row--outbound {
  justify-content: flex-end;
}

.chat-bubble-wrap {
  max-width: 78%;
}

.chat-bubble-content {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.chat-bubble {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  position: relative;
}

.chat-bubble-row--outbound .chat-bubble {
  background: #e6f0ff;
  border-color: #d6e4ff;
}

.chat-bubble-row--inbound .chat-bubble::before {
  content: "";
  position: absolute;
  left: 12px;
  top: -6px;
  border-right: 6px solid #fff;
  border-left: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-row--outbound .chat-bubble::after {
  content: "";
  position: absolute;
  right: 12px;
  top: -6px;
  border-left: 6px solid #e6f0ff;
  border-right: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.chat-bubble-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  justify-content: flex-end;
}

.chat-attachments {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.chat-attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.chat-attachment-image {
  display: block;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8fafc;
}

.chat-attachment-image img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  display: block;
}

.chat-attachments-files {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-attachments-media {
  display: grid;
  gap: 8px;
}

.chat-attachment-video {
  width: 100%;
  max-width: 320px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #000;
}

.chat-attachment-audio {
  width: 100%;
  max-width: 320px;
}

.chat-attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1d4ed8;
  text-decoration: none;
  background: rgba(29, 78, 216, 0.08);
  padding: 6px 10px;
  border-radius: 999px;
  width: fit-content;
}

.chat-status-icon {
  opacity: 0.8;
}

.chat-attachment-placeholder {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
}

.chat-attachments-stories {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.chat-attachment-story {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #c13584;
  text-decoration: none;
  background: rgba(193, 53, 132, 0.08);
  padding: 6px 10px;
  border-radius: 999px;
  width: fit-content;
  border: 1px solid rgba(193, 53, 132, 0.2);
}

.chat-attachment-story:hover {
  background: rgba(193, 53, 132, 0.14);
}

.chat-attachments-shares {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.chat-attachment-share {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

.chat-attachment-share:hover {
  background: #f1f5f9;
}

.share-header {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #374151;
}

.share-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.share-cta {
  font-size: 12px;
  color: #0061FB;
  font-weight: 500;
}

.chat-bubble-badge {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.75);
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  margin-bottom: 6px;
}

.chat-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  overflow: hidden;
  flex: 0 0 auto;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-avatar--image {
  background: transparent;
}
</style>
