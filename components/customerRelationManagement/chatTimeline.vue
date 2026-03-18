<template>
  <v-card class="chat-timeline-card mt-5" variant="outlined">
    <v-alert
      v-if="!connected"
      type="warning"
      variant="tonal"
      icon="mdi-whatsapp"
      class="ma-4 rounded-lg"
    >
      <div class="font-weight-medium mb-1">WhatsApp not connected</div>
      <div class="text-body-2">
        No WhatsApp number is connected for this organisation. Go to
        <strong>CRM → Integration Details</strong> and connect a WhatsApp number
        before you can send or receive messages here.
      </div>
    </v-alert>
    <template v-else>
      <v-card-title class="d-flex align-center justify-space-between">
        <v-btn
          size="small"
          variant="text"
          :disabled="!messageHasMore || loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? "Loading..." : messageHasMore ? "Load older" : "No more" }}
        </v-btn>
        <v-btn size="small" variant="text" :loading="loading" @click="loadLogs">
          Refresh
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="chat-timeline-body">
        <CommonChatThread
          :groups="groupedChatItems"
          :loading="loading"
          :empty-message="emptyMessage"
        />
      </v-card-text>
      <v-divider />
      <div v-if="pendingFiles.length" class="chat-timeline-attachments">
        <div
          v-for="(file, idx) in pendingFiles"
          :key="`${file.name}-${idx}`"
          class="chat-timeline-attachment-chip"
        >
          <v-icon size="16" class="mr-1">mdi-paperclip</v-icon>
          <span class="chat-timeline-attachment-name">{{ file.name }}</span>
          <v-btn icon variant="text" size="x-small" @click="removePendingFile(idx)">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      <CommonChatInputBar
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
import CommonChatThread from "@/components/Common/ChatThread.vue";
import CommonChatInputBar from "@/components/Common/ChatInputBar.vue";
import { useMainStore } from "@/stores/index";

const props = defineProps({
  leadId: {
    type: [Number, String],
    default: null,
  },
  leadName: {
    type: String,
    default: "",
  },
  leadAvatar: {
    type: String,
    default: "",
  },
  orgName: {
    type: String,
    default: "",
  },
  orgLogo: {
    type: String,
    default: "",
  },
  emptyMessage: {
    type: String,
    default: "No WhatsApp messages logged yet.",
  },
  inboundSenderLabel: {
    type: String,
    default: "Lead",
  },
  outboundSenderLabel: {
    type: String,
    default: "Flossly",
  },
  connected: {
    type: Boolean,
    default: true,
  },
});

const crmStore = useCrmStore();
const mainStore = useMainStore();
const loading = ref(false);
const logs = ref([]);
const draftMessage = ref("");
const sending = ref(false);
const pendingFiles = ref([]);
const messageCursor = ref(null);
const messageHasMore = ref(true);
const loadingMore = ref(false);

let whapiEventSource = null;
let whapiPollTimer = null;

const startWhapiStream = () => {
  if (!props.connected || !props.leadId) return;
  if (whapiEventSource) return;
  if (typeof window === "undefined" || !("EventSource" in window)) {
    startWhapiPoll();
    return;
  }
  whapiEventSource = new EventSource("/api/whapi/stream");
  whapiEventSource.addEventListener("message", (evt) => {
    try {
      const payload = JSON.parse(evt.data || "{}");
      if (Number(payload.leadId) === Number(props.leadId) && !loading.value) {
        loadLogs();
      }
    } catch {}
  });
  whapiEventSource.onerror = () => {
    stopWhapiStream();
    startWhapiPoll();
  };
};

const stopWhapiStream = () => {
  if (whapiEventSource) {
    whapiEventSource.close();
    whapiEventSource = null;
  }
};

const startWhapiPoll = () => {
  if (whapiPollTimer || !props.connected || !props.leadId) return;
  whapiPollTimer = setInterval(() => {
    if (!loading.value) loadLogs();
  }, 15000);
};

const stopWhapiPoll = () => {
  if (whapiPollTimer) {
    clearInterval(whapiPollTimer);
    whapiPollTimer = null;
  }
};

onBeforeUnmount(() => {
  stopWhapiStream();
  stopWhapiPoll();
});


const resolvedOrg = ref({ name: "", logo: "" });
const resolvedLead = ref({ name: "", avatar: "" });

const canSend = computed(() => {
  const hasText = String(draftMessage.value || "").trim().length > 0;
  const hasFiles = pendingFiles.value.length > 0;
  return !!props.leadId && (hasText || hasFiles) && !sending.value;
});

const chatItems = computed(() => {
  if (!Array.isArray(logs.value)) return [];
  return [...logs.value]
    .reverse()
    .map((row) => {
      return mapWhatsAppLogToChatItem(row, {
        inboundLabel: props.inboundSenderLabel,
        outboundLabel: props.outboundSenderLabel,
        inboundAvatarUrl: resolvedLead.value.avatar,
        outboundAvatarUrl: resolvedOrg.value.logo,
      });
    })
    .filter(Boolean);
});

const groupedChatItems = computed(() => groupChatItems(chatItems.value));

const loadLogs = async () => {
  if (!props.leadId) {
    logs.value = [];
    return;
  }
  try {
    loading.value = true;
    const res = await crmStore.getLeadWhatsAppLogs({ leadId: props.leadId, limit: 100 });
    if (res?.code === 0 && Array.isArray(res.data?.data)) {
      logs.value = res.data.data;
      messageCursor.value = res.data?.nextCursor || null;
      messageHasMore.value = !!res.data?.nextCursor;
      return;
    }
    logs.value = [];
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (!props.leadId || !messageHasMore.value || loadingMore.value) return;
  try {
    loadingMore.value = true;
    const res = await crmStore.getLeadWhatsAppLogs({
      leadId: props.leadId,
      limit: 100,
      before: messageCursor.value || undefined,
    });
    if (res?.code === 0 && Array.isArray(res.data?.data)) {
      const older = res.data.data;
      logs.value = [...logs.value, ...older];
      messageCursor.value = res.data?.nextCursor || null;
      if (!older.length || !res.data?.nextCursor) messageHasMore.value = false;
    } else {
      messageHasMore.value = false;
    }
  } finally {
    loadingMore.value = false;
  }
};

const sendMessage = async () => {
  if (!canSend.value) return;
  const message = String(draftMessage.value || "").trim();
  try {
    sending.value = true;
    let attachments = [];
    if (pendingFiles.value.length) {
      for (const file of pendingFiles.value) {
        const form = new FormData();
        form.append("file", file);
        const resUpload = await crmStore.uploadLeadWhatsAppAttachment(form);
        if (resUpload?.code !== 0) {
          const msg = resUpload?.error || resUpload?.message || "Failed to upload attachment";
          mainStore?.setSnackbar?.({ title: msg, type: "error" });
          sending.value = false;
          return;
        }
        if (resUpload?.data) attachments.push(resUpload.data);
      }
    }
    const res = await crmStore.sendLeadWhatsApp({
      leadIds: [Number(props.leadId)],
      message,
      attachments,
    });
    if (res?.code === 0) {
      draftMessage.value = "";
      pendingFiles.value = [];
      await loadLogs();
      return;
    }
    const msg = res?.error || res?.message || "Failed to send WhatsApp message";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  } catch (e) {
    const msg = e?.data?.message || e?.message || "Failed to send WhatsApp message";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  } finally {
    sending.value = false;
  }
};

const onFilesSelected = (files) => {
  pendingFiles.value = [...pendingFiles.value, ...files];
};

const removePendingFile = (idx) => {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== idx);
};

const resolveContext = () => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  if (stored) {
    try {
      const user = JSON.parse(stored);
      const orgId = user?.currentLoggedInOrgId;
      const list = user?.userOrganisations || [];
      const match = list.find((row) => row.organisationId === orgId);
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
  resolvedLead.value = {
    name: props.leadName || "",
    avatar: props.leadAvatar || "",
  };
};

watch(
  () => [props.leadId, props.leadName, props.leadAvatar, props.orgName, props.orgLogo],
  () => {
    resolveContext();
    messageCursor.value = null;
    messageHasMore.value = true;
    stopWhapiStream();
    stopWhapiPoll();
    loadLogs();
    startWhapiStream();
  },
  { immediate: true }
);
</script>

<style scoped>
.chat-timeline-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chat-timeline-body {
  background: #f7f8fb;
}

.chat-timeline-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 0 16px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.chat-timeline-attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  color: #0f172a;
}

.chat-timeline-attachment-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
