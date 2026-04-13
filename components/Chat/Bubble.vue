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

        <!-- Hover group: bubble + action chevron -->
        <div class="chat-bubble-hover-group">
          <div class="chat-bubble" :class="bubbleClass">
            <div v-if="automated" class="chat-bubble-badge">Automated</div>

            <!-- Edit mode (inline text editor) -->
            <div v-if="editState.active" class="chat-bubble-edit-wrap">
              <textarea
                ref="editTextarea"
                v-model="editState.text"
                class="chat-bubble-edit-textarea"
                rows="3"
                @keydown.enter.exact.prevent="submitEdit"
                @keydown.escape="cancelEdit"
              />
              <div class="chat-bubble-edit-actions">
                <button class="cbe-btn cbe-btn--cancel" @click="cancelEdit">Cancel</button>
                <button class="cbe-btn cbe-btn--save" :disabled="editState.saving" @click="submitEdit">
                  {{ editState.saving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>

            <!-- Normal content -->
            <template v-else>
              <!-- Image-first layout (WhatsApp style) -->
              <template v-if="leadImage">
                <viewer
                  :options="{ toolbar: true, navbar: allImageAttachments.length > 1, title: false }"
                  class="chat-bubble-image-wrap"
                >
                  <!-- Lead image is shown in the bubble; extras are hidden but included for gallery nav -->
                  <img
                    v-for="att in allImageAttachments"
                    :key="att.url"
                    :src="att.url"
                    :alt="att.name || 'Image'"
                    :class="att === leadImage ? 'chat-bubble-image' : 'chat-viewer-hidden'"
                  />
                  <!-- Zoom hint overlay — pointer-events:none so clicks reach the img -->
                  <div class="chat-bubble-image-zoom" aria-hidden="true">
                    <v-icon size="18" color="white">mdi-magnify-plus-outline</v-icon>
                  </div>
                  <!-- Timestamp overlaid on image when no text below -->
                  <div v-if="!showMessage" class="chat-bubble-image-meta" style="pointer-events:none">
                    <span>{{ timestamp || 'N/A' }}</span>
                    <v-icon v-if="statusIcon" size="12" :color="statusColor || undefined">{{ statusIcon }}</v-icon>
                  </div>
                </viewer>
                <!-- Caption below image -->
                <div v-if="showMessage" class="chat-bubble-caption">
                  <span>{{ message }}</span>
                  <div class="chat-bubble-meta">
                    <span v-if="editedAt" class="chat-bubble-edited">edited</span>
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
                  <span v-if="editedAt" class="chat-bubble-edited">edited</span>
                  <span>{{ timestamp || 'N/A' }}</span>
                  <v-icon v-if="statusIcon" size="12" :color="statusColor || undefined">{{ statusIcon }}</v-icon>
                </div>
              </template>
            </template>
          </div>

          <!-- Action chevron — overlaid on bubble, WhatsApp-style -->
          <v-menu v-if="providerMessageId" v-model="menuOpen" location="bottom end" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <button
                v-bind="menuProps"
                class="chat-bubble-action-btn"
                :class="isOutbound ? 'chat-bubble-action-btn--outbound' : 'chat-bubble-action-btn--inbound'"
                @click.stop
              >
                <v-icon size="14">mdi-chevron-down</v-icon>
              </button>
            </template>

            <v-card class="chat-action-menu" elevation="4" rounded="lg" min-width="200">
              <!-- Quick emoji reactions + "more" button -->
              <div class="chat-action-emoji-row">
                <button
                  v-for="em in QUICK_EMOJIS"
                  :key="em"
                  class="chat-action-emoji-btn"
                  :class="{ 'chat-action-emoji-btn--active': em === effectiveReaction }"
                  @click="sendReaction(em)"
                >{{ em }}</button>
                <button class="chat-action-emoji-btn chat-action-emoji-more" @click="emojiPickerOpen = !emojiPickerOpen">
                  <v-icon size="18">mdi-plus</v-icon>
                </button>
              </div>

              <!-- Full emoji picker (web component) -->
              <div v-if="emojiPickerOpen" class="chat-action-emoji-picker-wrap">
                <ClientOnly>
                  <emoji-picker @emoji-click="onEmojiPickerSelect" />
                </ClientOnly>
              </div>

              <v-divider />
              <v-list density="compact" nav>
                <v-list-item
                  v-if="canEdit"
                  prepend-icon="mdi-pencil-outline"
                  title="Edit message"
                  @click="startEdit"
                />
                <v-list-item
                  v-if="canEdit"
                  prepend-icon="mdi-trash-can-outline"
                  title="Delete message"
                  base-color="error"
                  @click="openDeleteConfirm"
                />
              </v-list>
            </v-card>
          </v-menu>
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

      <!-- Reaction badge — click to remove -->
      <button
        v-if="effectiveReaction"
        class="chat-bubble-reaction"
        :class="isOutbound ? 'chat-bubble-reaction--outbound' : 'chat-bubble-reaction--inbound'"
        :title="`Remove ${effectiveReaction} reaction`"
        @click="sendReaction(effectiveReaction)"
      >
        {{ effectiveReaction }}
      </button>
    </div>
  </div>

  <!-- Delete confirm dialog -->
  <v-dialog v-model="deleteConfirm.open" max-width="360" persistent>
    <v-card rounded="xl">
      <v-card-title class="text-body-1 font-weight-bold pt-5 px-5">Delete message?</v-card-title>
      <v-card-text class="text-body-2 text-medium-emphasis px-5">
        This will revoke the message for everyone. This action cannot be undone.
      </v-card-text>
      <v-card-actions class="px-4 pb-4 gap-2">
        <v-spacer />
        <v-btn variant="text" @click="deleteConfirm.open = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" :loading="deleteConfirm.deleting" @click="confirmDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

<script setup>
import "emoji-picker-element";
import { useCrmStore } from "@/stores/crm";
import { useMainStore } from "@/stores/index";

const crmStore = useCrmStore();
const mainStore = useMainStore();

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
  providerMessageId: { type: String, default: null },
  createdAt: { type: [String, Number, null], default: null },
  recipientPhone: { type: String, default: null },
  reaction: { type: String, default: null },
});

const emit = defineEmits(["message-deleted", "message-edited", "message-reacted"]);

// ── Quick reaction emojis ──
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ── Local providerMessageId — updated after a successful edit (Whapi assigns new ID) ──
const localProviderMessageId = ref(props.providerMessageId);
watch(() => props.providerMessageId, (v) => { localProviderMessageId.value = v; });

// ── Optimistic reaction — shown immediately before SSE refresh ──
const localReaction = ref(null);
const effectiveReaction = computed(() => localReaction.value || props.reaction || null);

// ── Reactive clock for the 15-min edit window ──
const now = ref(Date.now());
let _nowTimer = null;
onMounted(() => { _nowTimer = setInterval(() => { now.value = Date.now(); }, 30_000); });
onUnmounted(() => { clearInterval(_nowTimer); });

// ── Edit within 15 min (900 000 ms) ──
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const canEdit = computed(() => {
  if (!props.isOutbound || !localProviderMessageId.value) return false;
  if (!props.createdAt) return false;
  const ts = typeof props.createdAt === "number"
    ? (props.createdAt < 1e12 ? props.createdAt * 1000 : props.createdAt)
    : new Date(props.createdAt).getTime();
  return now.value - ts < EDIT_WINDOW_MS;
});

// shows "(edited)" label — set to true after a successful edit
const editedAt = ref(false);

// ── Action menu ──
const menuOpen = ref(false);
const emojiPickerOpen = ref(false);

// close emoji picker when menu closes
watch(menuOpen, (v) => { if (!v) emojiPickerOpen.value = false; });

// ── Reaction ──
const sendReaction = async (emoji) => {
  menuOpen.value = false;
  emojiPickerOpen.value = false;
  // Tapping the active reaction again removes it
  const isToggleOff = emoji === effectiveReaction.value;
  const targetEmoji = isToggleOff ? "" : emoji;
  try {
    const res = await crmStore.reactWhatsAppMessage({
      providerMessageId: localProviderMessageId.value,
      emoji: targetEmoji,
    });
    if (res?.code !== 0) {
      mainStore.setSnackbar({ title: res?.error || "Failed to send reaction", type: "error" });
      return;
    }
    localReaction.value = isToggleOff ? null : emoji;
    emit("message-reacted", { providerMessageId: localProviderMessageId.value, emoji: targetEmoji || null });
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || "Failed to send reaction", type: "error" });
  }
};

// emoji-picker-element fires a CustomEvent with detail.unicode
const onEmojiPickerSelect = (event) => {
  const emoji = event.detail?.unicode;
  if (emoji) sendReaction(emoji);
};

// ── Edit ──
const editTextarea = ref(null);
const editState = reactive({ active: false, text: "", saving: false });

const startEdit = () => {
  menuOpen.value = false;
  editState.text = props.message;
  editState.active = true;
  nextTick(() => editTextarea.value?.focus());
};

const cancelEdit = () => { editState.active = false; };

const submitEdit = async () => {
  const newText = editState.text.trim();
  if (!newText || newText === props.message) { cancelEdit(); return; }
  editState.saving = true;
  try {
    const res = await crmStore.editWhatsAppMessage({
      providerMessageId: localProviderMessageId.value,
      newText,
      to: props.recipientPhone,
    });
    if (res?.code !== 0) {
      mainStore.setSnackbar({ title: res?.error || "Failed to edit message", type: "error" });
      editState.saving = false;
      return;
    }
    const newId = res?.data?.messageId || null;
    if (newId) localProviderMessageId.value = newId;
    editedAt.value = true;
    emit("message-edited", {
      providerMessageId: props.providerMessageId,
      newProviderMessageId: newId,
      newText,
    });
    editState.active = false;
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || "Failed to edit message", type: "error" });
  }
  editState.saving = false;
};

// ── Delete ──
const deleteConfirm = reactive({ open: false, deleting: false });

const openDeleteConfirm = () => {
  menuOpen.value = false;
  deleteConfirm.open = true;
};

const confirmDelete = async () => {
  deleteConfirm.deleting = true;
  try {
    const res = await crmStore.deleteWhatsAppMessage({ providerMessageId: localProviderMessageId.value });
    if (res?.code !== 0) {
      mainStore.setSnackbar({ title: res?.error || "Failed to delete message", type: "error" });
      deleteConfirm.deleting = false;
      return;
    }
    emit("message-deleted", { providerMessageId: props.providerMessageId });
    deleteConfirm.open = false;
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || "Failed to delete message", type: "error" });
  }
  deleteConfirm.deleting = false;
};

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

const isImageAtt = (a) => a.type.includes("image") || /\.(png|jpe?g|gif|webp|bmp|sticker|webp)$/i.test(a.url);

// All images in this bubble — used for lightbox navigation
const allImageAttachments = computed(() => normalizedAttachments.value.filter(isImageAtt));

// The primary image (first image attachment) gets WhatsApp-style full-bleed treatment
const leadImage = computed(() => allImageAttachments.value[0] || null);

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
  background: #dceeff;
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
  border-left: 8px solid #dceeff;
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
  height: auto;
  max-height: 360px;
  object-fit: cover;
  /* No border-radius or max-width — the parent bubble's overflow:hidden +
     border-radius clips corners, and width:100% ensures the image always
     fills the full bubble width so no background bleeds through on long captions */
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

/* ── Hover group: bubble + overlaid action btn ── */
.chat-bubble-hover-group {
  position: relative;
  display: inline-flex;
}

/* Action button — overlaid top-right corner of bubble, WhatsApp-style */
.chat-bubble-action-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  display: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 0.15s;
  backdrop-filter: blur(2px);
}

.chat-bubble-action-btn--inbound {
  right: auto;
  left: 4px;
}

.chat-bubble-action-btn:hover {
  background: rgba(0, 0, 0, 0.55);
}

.chat-bubble-hover-group:hover .chat-bubble-action-btn,
.chat-bubble-action-btn[aria-expanded="true"] {
  display: flex;
}

/* ── Action menu card ── */
.chat-action-menu { min-width: 180px; }

.chat-action-emoji-row {
  display: flex;
  justify-content: space-around;
  padding: 8px 6px 6px;
}

.chat-action-emoji-btn {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.chat-action-emoji-btn:hover { background: rgba(0,0,0,0.07); }
.chat-action-emoji-btn--active {
  background: rgba(0, 97, 251, 0.1);
  box-shadow: 0 0 0 2px #0061fb;
}

.chat-action-emoji-more {
  color: rgba(0,0,0,0.5);
}

.chat-action-emoji-picker-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

/* Constrain the web component size */
.chat-action-emoji-picker-wrap emoji-picker {
  --num-columns: 7;
  width: 300px;
  height: 300px;
}

/* ── Inline edit ── */
.chat-bubble-edit-wrap {
  padding: 8px 10px 6px;
}

.chat-bubble-edit-textarea {
  width: 100%;
  font-size: 14px;
  line-height: 1.45;
  resize: none;
  border: 1.5px solid #0061fb;
  border-radius: 8px;
  padding: 6px 8px;
  outline: none;
  font-family: inherit;
  background: #fff;
  color: rgba(0,0,0,0.88);
}

.chat-bubble-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
}

.cbe-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
}
.cbe-btn--cancel { background: rgba(0,0,0,0.07); color: #333; }
.cbe-btn--save { background: #0061fb; color: #fff; }
.cbe-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Edited label ── */
.chat-bubble-edited {
  font-size: 10px;
  color: rgba(0,0,0,0.38);
  margin-right: 2px;
  font-style: italic;
}

/* ── Reaction badge ── */
.chat-bubble-reaction {
  font-size: 16px;
  line-height: 1;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  padding: 2px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  margin-top: 4px;
  display: inline-block;
  cursor: pointer;
  transition: background 0.12s, box-shadow 0.12s;
}
.chat-bubble-reaction:hover {
  background: #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.chat-bubble-reaction--inbound { margin-left: 42px; }
.chat-bubble-reaction--outbound { margin-left: auto; margin-right: 42px; }

/* ── Image zoom hint ── */
.chat-bubble-image-wrap {
  cursor: zoom-in;
}

/* Extra gallery images — invisible in bubble but included for v-viewer gallery nav */
.chat-viewer-hidden {
  display: none;
}

.chat-bubble-image-zoom {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  opacity: 0;
  background: rgba(0, 0, 0, 0);
  transition: opacity 0.18s, background 0.18s;
  pointer-events: none; /* let clicks pass through to the img for v-viewer */
}

.chat-bubble-image-wrap:hover .chat-bubble-image-zoom {
  opacity: 1;
  background: rgba(0, 0, 0, 0.22);
}

</style>
