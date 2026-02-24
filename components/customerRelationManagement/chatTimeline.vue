<template>
  <v-card class="chat-timeline-card mt-5" variant="outlined">
  <v-card-title class="d-flex align-center justify-end">
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
    <CommonChatInputBar
      v-model="draftMessage"
      :can-send="canSend"
      :loading="sending"
      @send="sendMessage"
    />
  </v-card>
</template>

<script setup>
import { formatChatTimestamp, groupChatItems, buildDayKey, buildDayLabel } from "@/lib/chatThread";
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
});

const crmStore = useCrmStore();
const mainStore = useMainStore();
const loading = ref(false);
const logs = ref([]);
const draftMessage = ref("");
const sending = ref(false);


const resolvedOrg = ref({ name: "", logo: "" });
const resolvedLead = ref({ name: "", avatar: "" });

const canSend = computed(() => {
  return !!props.leadId && String(draftMessage.value || "").trim().length > 0 && !sending.value;
});

const getInitials = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parts = raw.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return letters.join("");
};

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
        timeLabel: formatChatTimestamp(row?.createdAt),
        statusIcon,
        automated,
        avatarUrl,
        avatarText,
        dayKey: buildDayKey(row?.createdAt),
        dayLabel: buildDayLabel(row?.createdAt),
        createdAt: row?.createdAt,
      };
    })
    .filter(Boolean);
});

const groupedChatItems = computed(() => groupChatItems(chatItems.value));

const resolveStatusIcon = (raw) => {
  if (!raw) return "";
  if (raw.includes("read")) return "mdi-check-all";
  if (raw.includes("delivered")) return "mdi-check-all";
  if (raw.includes("sent")) return "mdi-check";
  return "";
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

const sendMessage = async () => {
  if (!canSend.value) return;
  const message = String(draftMessage.value || "").trim();
  if (!message) return;
  try {
    sending.value = true;
    const res = await crmStore.sendLeadWhatsApp({
      leadIds: [Number(props.leadId)],
      message,
    });
    if (res?.code === 0) {
      draftMessage.value = "";
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
</style>
