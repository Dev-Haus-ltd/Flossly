<template>
  <v-card class="chat-timeline-card mt-5" variant="outlined">
    <div v-if="!connected" class="ma-4">
      <CommonWhatsAppNotConnectedAlert />
    </div>
    <template v-else>
      <div class="d-flex align-center justify-space-between px-4 py-2">
        <div class="d-flex align-center">
          <span class="text-body-2 font-weight-medium">{{ props.leadName || 'Conversation' }}</span>
        </div>
        <template v-if="props.whatsappAutoReplyEnabled">
          <div class="d-flex align-center">
            <v-icon size="12" :color="localLeadAutoReplyEnabled ? 'success' : 'grey'" class="mr-1">{{ localLeadAutoReplyEnabled ? 'mdi-robot' : 'mdi-robot-off-outline' }}</v-icon>
            <span class="text-caption text-medium-emphasis mr-1">Auto-reply</span>
            <v-switch
              v-model="localLeadAutoReplyEnabled"
              color="success"
              density="compact"
              hide-details
              inset
              style="transform: scale(0.7);"
              @update:model-value="toggleLeadAutoReply"
            />
          </div>
        </template>
      </div>
      <v-divider />
      <v-card-text class="chat-timeline-body">
        <div ref="scrollEl" class="chat-timeline-scroll">
          <ChatThread
            :groups="groupedChatItems"
            :loading="loading"
            :empty-message="emptyMessage"
            @message-deleted="onMessageDeleted"
            @message-edited="onMessageEdited"
            @message-reacted="onMessageReacted"
          />
        </div>
      </v-card-text>
      <v-divider />
      <div v-if="pendingFiles.length" class="chat-pending-files">
        <div
          v-for="(file, idx) in pendingFiles"
          :key="`${file.name}-${idx}`"
          class="chat-pending-file"
        >
          <template v-if="isImageFile(file)">
            <div class="chat-pending-image">
              <img :src="getObjectUrl(file)" :alt="file.name" />
              <button class="chat-pending-remove" @click="removePendingFile(idx)">
                <v-icon size="10" color="white">mdi-close</v-icon>
              </button>
            </div>
          </template>
          <template v-else>
            <div class="chat-pending-doc">
              <v-icon size="18" :color="fileIconColor(file)">{{ fileIcon(file) }}</v-icon>
              <div class="chat-pending-doc-info">
                <span class="chat-pending-doc-name">{{ file.name }}</span>
                <span class="chat-pending-doc-size">{{ formatBytes(file.size) }}</span>
              </div>
              <button class="chat-pending-doc-remove" @click="removePendingFile(idx)">
                <v-icon size="13">mdi-close</v-icon>
              </button>
            </div>
          </template>
        </div>
      </div>
      <ChatInputBar
        v-model="draftMessage"
        :can-send="canSend"
        :loading="sending"
        :allow-attachments="true"
        @files-selected="onFilesSelected"
        @send="sendMessage"
      />
    </template>
  </v-card>
</template>

<script setup>
import { groupChatItems } from "@/lib/chatThread";
import { mapWhatsAppLogToChatItem } from "@/lib/chatMappers";
import ChatThread from "@/components/Chat/Thread.vue";
import ChatInputBar from "@/components/Chat/InputBar.vue";
import CommonWhatsAppNotConnectedAlert from "@/components/Common/WhatsAppNotConnectedAlert.vue";
import { useMainStore } from "@/stores/index";
import { useCrmStore } from "@/stores/crm";

const props = defineProps({
  leadId: { type: [Number, String], default: null },
  leadName: { type: String, default: "" },
  leadAvatar: { type: String, default: "" },
  orgName: { type: String, default: "" },
  orgLogo: { type: String, default: "" },
  emptyMessage: { type: String, default: "No WhatsApp messages logged yet." },
  inboundSenderLabel: { type: String, default: "Lead" },
  outboundSenderLabel: { type: String, default: "Flossly" },
  connected: { type: Boolean, default: true },
  whatsappAutoReplyEnabled: { type: Boolean, default: false },
  leadAutoReplyEnabled: { type: Boolean, default: true },
});

const crmStore = useCrmStore();
const mainStore = useMainStore();

const loading = ref(false);
const logs = ref([]);
const draftMessage = ref("");
const sending = ref(false);
const pendingFiles = ref([]);
const resolvedOrg = ref({ name: "", logo: "" });
const resolvedLead = ref({ name: "", avatar: "" });
const scrollEl = ref(null);
const localLeadAutoReplyEnabled = ref(true);

let whapiEventSource = null;
let sseActive = false;
let sseRetryDelay = 2000;

const canSend = computed(() => {
  const hasText = String(draftMessage.value || "").trim().length > 0;
  const hasFiles = pendingFiles.value.length > 0;
  return !!props.leadId && (hasText || hasFiles) && !sending.value;
});

const chatItems = computed(() => {
  if (!Array.isArray(logs.value)) return [];
  return [...logs.value]
    .reverse()
    .map((row) => mapWhatsAppLogToChatItem(row, {
      inboundLabel: props.inboundSenderLabel,
      outboundLabel: props.outboundSenderLabel,
      inboundAvatarUrl: resolvedLead.value.avatar,
      outboundAvatarUrl: resolvedOrg.value.logo,
    }))
    .filter(Boolean);
});

const groupedChatItems = computed(() => groupChatItems(chatItems.value));

// Auto-scroll to bottom whenever new messages arrive
watch(groupedChatItems, async () => {
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
});

// ── Message action handlers (optimistic local updates) ──
const onMessageDeleted = ({ providerMessageId }) => {
  logs.value = logs.value.filter((r) => r.providerMessageId !== providerMessageId);
};

const onMessageEdited = ({ providerMessageId, newProviderMessageId, newText }) => {
  const row = logs.value.find((r) => r.providerMessageId === providerMessageId);
  if (!row) return;
  row.content = newText;
  if (newProviderMessageId) row.providerMessageId = newProviderMessageId;
};

const onMessageReacted = ({ providerMessageId, emoji }) => {
  const row = logs.value.find((r) => r.providerMessageId === providerMessageId);
  if (row) row.reaction = emoji;
};

const loadLogs = async (silent = false) => {
  if (!props.leadId) { logs.value = []; return; }
  try {
    if (!silent) loading.value = true;
    const res = await crmStore.getLeadWhatsAppLogs(props.leadId, 100);
    if (res?.code === 0) {
      logs.value = Array.isArray(res.data) ? res.data : [];
      return;
    }
    logs.value = [];
  } catch {
    logs.value = [];
  } finally {
    if (!silent) loading.value = false;
  }
};

const sendMessage = async () => {
  if (!canSend.value) return;
  const message = String(draftMessage.value || "").trim();
  try {
    sending.value = true;
    let attachments = [];
    for (const file of pendingFiles.value) {
      const form = new FormData();
      form.append("file", file);
      const resUpload = await crmStore.uploadLeadWhatsAppMedia(form);
      if (resUpload?.code !== 0) {
        mainStore?.setSnackbar?.({ title: resUpload?.error || "Failed to upload attachment", type: "error" });
        return;
      }
      if (resUpload?.data) attachments.push(resUpload.data);
    }
    const res = await crmStore.sendLeadWhatsApp({ leadIds: [Number(props.leadId)], message, attachments });
    if (res?.code === 0) {
      draftMessage.value = "";
      pendingFiles.value = [];
      await loadLogs();
      return;
    }
    mainStore?.setSnackbar?.({ title: res?.error || res?.message || "Failed to send message", type: "error" });
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.data?.message || e?.message || "Failed to send message", type: "error" });
  } finally {
    sending.value = false;
  }
};

const objectUrls = ref([]);

const getObjectUrl = (file) => {
  const existing = objectUrls.value.find((e) => e.file === file);
  if (existing) return existing.url;
  const url = URL.createObjectURL(file);
  objectUrls.value.push({ file, url });
  return url;
};

const revokeObjectUrls = () => {
  objectUrls.value.forEach((e) => URL.revokeObjectURL(e.url));
  objectUrls.value = [];
};

const isImageFile = (file) => file?.type?.startsWith("image/");

const fileIcon = (file) => {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("video/")) return "mdi-file-video-outline";
  if (type.startsWith("audio/")) return "mdi-file-music-outline";
  if (type.includes("pdf")) return "mdi-file-pdf-box";
  if (type.includes("word") || type.includes("document")) return "mdi-file-word-outline";
  if (type.includes("sheet") || type.includes("excel")) return "mdi-file-excel-outline";
  return "mdi-file-outline";
};

const fileIconColor = (file) => {
  const type = String(file?.type || "").toLowerCase();
  if (type.includes("pdf")) return "#e53935";
  if (type.includes("word") || type.includes("document")) return "#1565c0";
  if (type.includes("sheet") || type.includes("excel")) return "#2e7d32";
  return "#546e7a";
};

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const onFilesSelected = (files) => {
  pendingFiles.value = [...pendingFiles.value, ...files];
};

const removePendingFile = (idx) => {
  const removed = pendingFiles.value[idx];
  if (removed) {
    const entry = objectUrls.value.find((e) => e.file === removed);
    if (entry) URL.revokeObjectURL(entry.url);
    objectUrls.value = objectUrls.value.filter((e) => e.file !== removed);
  }
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== idx);
};

const resolveContext = () => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  if (stored) {
    try {
      const user = JSON.parse(stored);
      const orgId = user?.currentLoggedInOrgId;
      const match = (user?.userOrganisations || []).find((r) => r.organisationId === orgId);
      resolvedOrg.value = {
        name: props.orgName || match?.organisation?.name || "",
        logo: props.orgLogo || match?.organisation?.logo || "",
      };
    } catch {
      resolvedOrg.value = { name: props.orgName || "", logo: props.orgLogo || "" };
    }
  } else {
    resolvedOrg.value = { name: props.orgName || "", logo: props.orgLogo || "" };
  }
  resolvedLead.value = { name: props.leadName || "", avatar: props.leadAvatar || "" };
};

const stopWhapiStream = () => {
  sseActive = false;
  sseRetryDelay = 2000;
  if (whapiEventSource) { whapiEventSource.close(); whapiEventSource = null; }
};

const startWhapiStream = () => {
  stopWhapiStream();
  if (!props.connected || !props.leadId) return;
  if (typeof window === "undefined" || !("EventSource" in window)) return;
  sseActive = true;

  const connect = () => {
    if (!sseActive) return;
    whapiEventSource = new EventSource("/api/whapi/stream");

    whapiEventSource.addEventListener("message", (evt) => {
      sseRetryDelay = 2000;
      try {
        const payload = JSON.parse(evt.data || "{}");
        if (String(payload.leadId) === String(props.leadId) && !loading.value) {
          loadLogs(true);
        }
      } catch {}
    });

    whapiEventSource.onerror = () => {
      whapiEventSource?.close();
      whapiEventSource = null;
      if (!sseActive) return;
      setTimeout(() => {
        sseRetryDelay = Math.min(sseRetryDelay * 2, 30000);
        connect();
      }, sseRetryDelay);
    };
  };

  connect();
};

watch(
  () => [props.leadId, props.leadName, props.leadAvatar, props.orgName, props.orgLogo, props.connected],
  () => {
    resolveContext();
    stopWhapiStream();
    if (!props.connected) { logs.value = []; return; }
    loadLogs();
    startWhapiStream();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopWhapiStream();
  revokeObjectUrls();
});

const toggleLeadAutoReply = async (newValue) => {
  if (!props.leadId) return;
  try {
    await crmStore.updateLeadAutoReply({ leadId: props.leadId, autoReplyEnabled: newValue });
  } catch {}
};

watch(() => props.leadAutoReplyEnabled, (val) => {
  localLeadAutoReplyEnabled.value = val;
}, { immediate: true });

onMounted(() => {
  localLeadAutoReplyEnabled.value = props.leadAutoReplyEnabled;
});
</script>

<style scoped>
.chat-timeline-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chat-timeline-body {
  background: #efeae2;
  padding: 0 !important;
}

.chat-timeline-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding: 12px 16px;
}

.chat-pending-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f2f5;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.chat-pending-file { flex: 0 0 auto; }

.chat-pending-image {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #e2e8f0;
}

.chat-pending-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chat-pending-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.chat-pending-remove:hover { background: rgba(0, 0, 0, 0.85); }

.chat-pending-doc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 6px 8px;
  max-width: 200px;
}

.chat-pending-doc-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.chat-pending-doc-name {
  font-size: 11px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-pending-doc-size {
  font-size: 10px;
  color: #94a3b8;
}

.chat-pending-doc-remove {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #94a3b8;
}

.chat-pending-doc-remove:hover { color: #ef4444; }
</style>
