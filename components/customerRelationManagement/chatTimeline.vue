<template>
  <v-card class="chat-timeline-card mt-5" variant="outlined">
  <v-card-title class="d-flex align-center justify-end">
    <v-btn size="small" variant="text" :loading="loading" @click="loadLogs">
      Refresh
    </v-btn>
  </v-card-title>
    <v-divider />
    <v-card-text class="chat-timeline-body">
      <div v-if="loading" class="text-caption text-medium-emphasis">
        Loading messages...
      </div>
      <div v-else-if="!chatItems.length" class="text-caption text-medium-emphasis">
        {{ emptyMessage }}
      </div>
      <div v-else class="chat-timeline-list">
        <template v-for="group in groupedChatItems" :key="group.key">
          <div class="chat-day-pill">{{ group.label }}</div>
          <CommonChatBubble
            v-for="row in group.items"
            :key="row.id"
            :is-outbound="row.isOutbound"
            :sender="row.sender"
            :message="row.message"
            :timestamp="row.timeLabel"
            :status-icon="row.statusIcon"
            :avatar-url="row.avatarUrl"
            :avatar-text="row.avatarText"
            :automated="row.automated"
          />
        </template>
      </div>
    </v-card-text>
    <v-divider />
    <div class="chat-input-bar">
      <div class="chat-input-left">
        <v-menu v-model="emojiMenu" offset-y>
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" icon variant="text" size="small">
              <v-icon size="18">mdi-emoticon-outline</v-icon>
            </v-btn>
          </template>
          <ClientOnly>
            <div class="emoji-menu">
              <emoji-picker
                class="emoji-picker"
                @emoji-click="onEmojiClick"
              />
            </div>
          </ClientOnly>
        </v-menu>
      </div>
      <v-text-field
        v-model="draftMessage"
        placeholder="Type here..."
        variant="solo"
        density="compact"
        hide-details
        flat
        bg-color="#FFFFFF"
        class="chat-input-field"
        @keydown.enter.prevent="sendMessage"
      />
      <v-btn
        icon
        color="primary"
        variant="flat"
        class="chat-send-btn"
        :loading="sending"
        :disabled="!canSend"
        @click="sendMessage"
      >
        <v-icon size="20">mdi-send</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";
import CommonChatBubble from "@/components/Common/chatBubble.vue";
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
const emojiMenu = ref(false);


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
      const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
      const content = String(row?.content || "").trim();
      const templateName = String(row?.templateName || "").trim();
      const type = String(row?.type || "").trim();
      const message =
        content ||
        (templateName ? `Template: ${templateName}` : "") ||
        (type ? `${type} message` : "");
      if (!message) return null;
      const statusRaw = String(row?.status || "").trim().toLowerCase();
      const statusIcon = resolveStatusIcon(statusRaw);
      const automated = String(row?.type || "").toLowerCase() === "template" || !!row?.templateName;
      const avatarUrl = isOutbound ? resolvedOrg.value.logo : resolvedLead.value.avatar;
      const avatarText = isOutbound
        ? getInitials(resolvedOrg.value.name || props.outboundSenderLabel)
        : getInitials(resolvedLead.value.name || props.inboundSenderLabel);
      return {
        id: row?.id || `${row?.providerMessageId || "na"}-${row?.createdAt || Date.now()}`,
        isOutbound,
        sender: isOutbound ? props.outboundSenderLabel : props.inboundSenderLabel,
        message,
        timeLabel: formatTimestamp(row?.createdAt),
        statusIcon,
        automated,
        avatarUrl,
        avatarText,
        dayKey: buildDayKey(row?.createdAt),
        dayLabel: buildDayLabel(row?.createdAt),
      };
    })
    .filter(Boolean);
});

const groupedChatItems = computed(() => {
  const groups = [];
  const map = new Map();
  chatItems.value.forEach((item) => {
    const key = item.dayKey || "unknown";
    if (!map.has(key)) {
      const group = { key, label: item.dayLabel || "Unknown", items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  });
  return groups;
});

const buildDayKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return "unknown";
  return date.toISOString().slice(0, 10);
};

const buildDayLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return "Unknown";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startDate - startToday) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const resolveStatusIcon = (raw) => {
  if (!raw) return "";
  if (raw.includes("read")) return "mdi-check-all";
  if (raw.includes("delivered")) return "mdi-check-all";
  if (raw.includes("sent")) return "mdi-check";
  return "";
};

const formatTimestamp = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return parsedDate(value) || "N/A";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

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

const onEmojiClick = (event) => {
  const symbol = event?.detail?.unicode || event?.detail?.emoji?.unicode || "";
  if (!symbol) return;
  draftMessage.value = `${draftMessage.value || ""}${symbol}`;
  emojiMenu.value = false;
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

.chat-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 8px;
}

.chat-day-pill {
  align-self: center;
  background: #eef2f7;
  color: #64748b;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  margin: 6px 0 2px;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
}

.chat-input-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-input-field {
  flex: 1;
}

.chat-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

.emoji-menu {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.emoji-picker {
  --emoji-picker-height: 320px;
  --emoji-picker-width: 300px;
  --emoji-size: 20px;
  --emoji-padding: 0.4rem;
  --num-columns: 8;
}
</style>
