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

onBeforeUnmount(() => stopWhapiPoll());
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

.chat-timeline-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 0;
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
