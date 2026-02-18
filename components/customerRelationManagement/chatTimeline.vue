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
        <CommonChatBubble
          v-for="row in chatItems"
          :key="row.id"
          :is-outbound="row.isOutbound"
          :sender="row.sender"
          :message="row.message"
          :timestamp="row.timeLabel"
          :status="row.statusLabel"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";
import CommonChatBubble from "@/components/Common/chatBubble.vue";

const props = defineProps({
  leadId: {
    type: [Number, String],
    default: null,
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
});

const crmStore = useCrmStore();
const loading = ref(false);
const logs = ref([]);

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
      const statusRaw = String(row?.status || "").trim();
      const statusLabel = statusRaw ? `${statusRaw.charAt(0).toUpperCase()}${statusRaw.slice(1)}` : "";
      return {
        id: row?.id || `${row?.providerMessageId || "na"}-${row?.createdAt || Date.now()}`,
        isOutbound,
        sender: isOutbound ? props.outboundSenderLabel : props.inboundSenderLabel,
        message,
        timeLabel: formatTimestamp(row?.createdAt),
        statusLabel,
      };
    })
    .filter(Boolean);
});

const formatTimestamp = (value) => {
  const formatted = parsedDate(value);
  return formatted || "N/A";
};

const loadLogs = async () => {
  if (!props.leadId) {
    logs.value = [];
    return;
  }
  try {
    loading.value = true;
    const res = await crmStore.getLeadWhatsAppLogs(props.leadId, 100);
    if (res?.code === 0 && Array.isArray(res.data)) {
      logs.value = res.data;
      return;
    }
    logs.value = [];
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.leadId,
  () => {
    loadLogs();
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
</style>
