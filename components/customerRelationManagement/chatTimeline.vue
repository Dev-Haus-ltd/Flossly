<template>
  <v-card class="chat-timeline-card mt-5" variant="outlined">
    <div v-if="!connected" class="ma-4">
      <CommonWhatsAppNotConnectedAlert />
    </div>
    <template v-else>
      <v-card-title class="d-flex align-center justify-end">
        <v-btn size="small" variant="text" :loading="loading" @click="loadLogs">
          Refresh
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="chat-timeline-body">
        <div ref="scrollEl" class="chat-timeline-scroll">
          <ChatThread
            :groups="groupedChatItems"
            :loading="loading"
            :empty-message="emptyMessage"
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
          <!-- Image preview -->
          <template v-if="isImageFile(file)">
            <div class="chat-pending-image">
              <img :src="getObjectUrl(file)" :alt="file.name" />
              <button class="chat-pending-remove" @click="removePendingFile(idx)">
                <v-icon size="12" color="white">mdi-close</v-icon>
              </button>
            </div>
          </template>
          <!-- Non-image file card -->
          <template v-else>
            <div class="chat-pending-doc">
              <v-icon size="20" :color="fileIconColor(file)" class="chat-pending-doc-icon">
                {{ fileIcon(file) }}
              </v-icon>
              <div class="chat-pending-doc-info">
                <span class="chat-pending-doc-name">{{ file.name }}</span>
                <span class="chat-pending-doc-size">{{ formatBytes(file.size) }}</span>
              </div>
              <button class="chat-pending-doc-remove" @click="removePendingFile(idx)">
                <v-icon size="14">mdi-close</v-icon>
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

let whapiPollTimer = null;

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

const loadLogs = async () => {
  if (!props.leadId) { logs.value = []; return; }
  try {
    loading.value = true;
    const res = await crmStore.getLeadWhatsAppLogs(props.leadId, 100);
    if (res?.code === 0) {
      logs.value = Array.isArray(res.data) ? res.data : [];
      return;
    }
    logs.value = [];
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
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
  objectUrls.value = objectUrls.value.filter((e) => e.file !== removed);
  if (removed) {
    const entry = objectUrls.value.find((e) => e.file === removed);
    if (entry) URL.revokeObjectURL(entry.url);
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

const stopWhapiPoll = () => {
  if (whapiPollTimer) { clearInterval(whapiPollTimer); whapiPollTimer = null; }
};

const startWhapiPoll = () => {
  stopWhapiPoll();
  if (!props.connected || !props.leadId) return;
  whapiPollTimer = setInterval(() => { if (!loading.value) loadLogs(); }, 15000);
};

watch(
  () => [props.leadId, props.leadName, props.leadAvatar, props.orgName, props.orgLogo, props.connected],
  () => {
    resolveContext();
    stopWhapiPoll();
    if (!props.connected) { logs.value = []; return; }
    loadLogs();
    startWhapiPoll();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopWhapiPoll();
  revokeObjectUrls();
});
</script>

<style scoped>
.chat-timeline-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chat-timeline-body {
  background: #f7f8fb;
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
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.chat-pending-file {
  flex: 0 0 auto;
}

/* Image thumbnail */
.chat-pending-image {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #f1f5f9;
}

.chat-pending-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chat-pending-remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.chat-pending-remove:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Non-image file card */
.chat-pending-doc {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  max-width: 220px;
}

.chat-pending-doc-icon {
  flex: 0 0 auto;
}

.chat-pending-doc-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.chat-pending-doc-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-pending-doc-size {
  font-size: 11px;
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

.chat-pending-doc-remove:hover {
  color: #ef4444;
}
</style>
