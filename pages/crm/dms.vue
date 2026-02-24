<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">DMs</p>
    </div>
    <div class="mt-5 px-5">
      <v-tabs v-model="activeTab" class="dms-tabs" density="compact">
        <v-tab value="all">All Messages</v-tab>
        <v-tab value="messenger">Messenger</v-tab>
        <v-tab value="instagram">Instagram</v-tab>
      </v-tabs>
      <v-divider class="dms-tabs-divider" />

      <div class="dms-body">
        <v-card class="dms-list-card" variant="outlined">
          <div class="dms-list-header">
            <div class="dms-list-title">Conversations</div>
            <div class="d-inline-flex align-center py-1" style="flex-wrap: nowrap; gap: 8px;">
              <div style="width: 160px">
                <v-text-field
                  v-model="searchInput"
                  placeholder="Search"
                  append-inner-icon="mdi-magnify"
                  clearable
                  variant="solo"
                  :elevation="0"
                  density="compact"
                  hide-details
                  bg-color="#FAFAFA"
                  flat
                  class="custom-search"
                />
              </div>
              <v-menu v-model="filterMenu" offset-y>
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" variant="outlined" class="filter-btn">
                    <v-icon size="18" class="mr-1">mdi-filter-variant</v-icon>
                    Filters
                  </v-btn>
                </template>
                <v-card class="pa-3" min-width="220">
                  <v-checkbox
                    v-model="showUnreadOnly"
                    label="Unread only"
                    density="compact"
                    hide-details
                  />
                  <v-checkbox
                    v-model="showAssignedOnly"
                    label="Assigned to me"
                    density="compact"
                    hide-details
                  />
                </v-card>
              </v-menu>
            </div>
          </div>
          <v-divider />
          <div ref="listBodyRef" class="dms-list-body" @scroll="onListScroll">
            <div v-if="!filteredConversations.length" class="text-caption text-medium-emphasis pa-4">
              No conversations yet.
            </div>
            <v-list v-else class="dms-list-items" density="compact">
              <v-list-item
                v-for="conv in filteredConversations"
                :key="conv.id"
                :active="conv.id === activeConversationId"
                @click="selectConversation(conv.id)"
              >
                <template #prepend>
                  <v-avatar size="36">
                    <img v-if="conv.avatarUrl" :src="conv.avatarUrl" alt="Avatar" />
                    <span v-else>{{ conv.avatarText }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ conv.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ conv.preview || "No messages yet" }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card>

        <v-card class="dms-thread-card" variant="outlined">
          <div class="dms-thread-header">
            <div class="dms-thread-title">
              {{ activeConversation?.title || "Select a conversation" }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ activeConversation?.subtitle || "No conversation selected" }}
            </div>
          </div>
          <v-divider />
          <div ref="threadBodyRef" class="dms-thread-body" @scroll="onThreadScroll">
            <CommonChatThread
              :groups="groupedMessages"
              :loading="loadingMessages"
              :empty-message="emptyMessage"
            />
          </div>
          <v-divider />
          <CommonChatInputBar
            v-model="draftMessage"
            :can-send="canSend"
            :disabled="!activeConversationId"
            :loading="sending"
            @send="sendMessage"
          />
        </v-card>
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import CommonChatThread from "@/components/Common/ChatThread.vue";
import CommonChatInputBar from "@/components/Common/ChatInputBar.vue";
import { groupChatItems, formatChatTimestamp, buildDayKey, buildDayLabel } from "@/lib/chatThread";
import { useCrmStore } from "@/stores/crm";
import { useMainStore } from "@/stores/index";
import { useRoute } from "vue-router";

definePageMeta({
  layout: "home",
});

const activeTab = ref("all");
const search = ref("");
const filterMenu = ref(false);
const showUnreadOnly = ref(false);
const showAssignedOnly = ref(false);
const conversations = ref([]);
const activeConversationId = ref(null);
const messages = ref([]);
const loadingMessages = ref(false);
const loadingConversations = ref(false);
const sending = ref(false);
const draftMessage = ref("");
const conversationOffset = ref(0);
const conversationLimit = ref(20);
const conversationHasMore = ref(true);
const messageCursor = ref(null);
const messageHasMore = ref(true);
const loadingMoreMessages = ref(false);
const listBodyRef = ref(null);
const threadBodyRef = ref(null);
const searchInput = ref("");
let searchTimer = null;

const crmStore = useCrmStore();
const mainStore = useMainStore();
const route = useRoute();

const emptyMessage = computed(() => {
  if (!activeConversationId.value) {
    return "Select a conversation to view messages.";
  }
  return "No messages yet.";
});

const filteredConversations = computed(() => {
  const q = String(search.value || "").trim().toLowerCase();
  const filtered = conversations.value.filter((c) => {
    if (activeTab.value !== "all" && c.platform !== activeTab.value) {
      return false;
    }
    if (!q) return true;
    return String(c.title || "").toLowerCase().includes(q);
  });
  return filtered.filter((c) => {
    if (showUnreadOnly.value && !c.unreadCount) return false;
    if (showAssignedOnly.value && !c.assignedToMe) return false;
    return true;
  });
});

const activeConversation = computed(() => {
  return conversations.value.find((c) => c.id === activeConversationId.value) || null;
});

const messageItems = computed(() => {
  return messages.value.map((row) => {
    const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
    return {
      id: row.id,
      isOutbound,
      sender: row.senderName || (isOutbound ? "Flossly" : "Client"),
      message: row.message,
      timeLabel: formatChatTimestamp(row.createdAt),
      statusIcon: row.status,
      automated: false,
      avatarUrl: "",
      avatarText: isOutbound ? "F" : "C",
      dayKey: buildDayKey(row.createdAt),
      dayLabel: buildDayLabel(row.createdAt),
      createdAt: row.createdAt,
    };
  });
});

const groupedMessages = computed(() => groupChatItems(messageItems.value));

const canSend = computed(() => {
  return !!activeConversationId.value && String(draftMessage.value || "").trim().length > 0 && !sending.value;
});

const selectConversation = (id) => {
  activeConversationId.value = id;
  draftMessage.value = "";
  loadMessages(true);
};

const scrollThreadToBottom = () => {
  nextTick(() => {
    const el = threadBodyRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
};

const loadMessages = async (reset = false) => {
  if (!activeConversationId.value) {
    messages.value = [];
    return;
  }
  if (reset) {
    messages.value = [];
    messageCursor.value = null;
    messageHasMore.value = true;
  }
  if (loadingMessages.value || loadingMoreMessages.value) return;
  const scrollEl = threadBodyRef.value;
  const prevHeight = scrollEl ? scrollEl.scrollHeight : 0;
  const prevTop = scrollEl ? scrollEl.scrollTop : 0;
  loadingMessages.value = true;
  try {
    const res = await crmStore.listDmMessages({
      conversationId: activeConversationId.value,
      limit: 30,
      before: messageCursor.value || undefined,
    });
    if (res?.code === 0) {
      const payload = res.data || {};
      const newMessages = Array.isArray(payload.data) ? payload.data : [];
      if (reset) {
        messages.value = newMessages;
        scrollThreadToBottom();
      } else {
        messages.value = [...newMessages, ...messages.value];
        nextTick(() => {
          if (!scrollEl) return;
          const nextHeight = scrollEl.scrollHeight;
          scrollEl.scrollTop = nextHeight - prevHeight + prevTop;
        });
      }
      messageCursor.value = payload.nextCursor || null;
      if (!newMessages.length) messageHasMore.value = false;
      if (newMessages.length < 30) messageHasMore.value = false;
      await crmStore.markDmRead({ conversationId: activeConversationId.value });
    }
  } finally {
    loadingMessages.value = false;
  }
};

const sendMessage = async () => {
  if (!canSend.value) return;
  const text = String(draftMessage.value || "").trim();
  if (!text) return;
  try {
    sending.value = true;
    const res = await crmStore.sendDmMessage({
      conversationId: activeConversationId.value,
      message: text,
    });
    if (res?.code === 0) {
      draftMessage.value = "";
      await loadMessages(true);
      await crmStore.processDmQueue({ limit: 20 });
      return;
    }
    const msg = res?.error || res?.message || "Failed to send message";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  } catch (e) {
    const msg = e?.data?.message || e?.message || "Failed to send message";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  } finally {
    sending.value = false;
  }
};

const buildConversationRow = (row) => {
  const name = row?.participantName || row?.metadata?.participantName || row?.threadId || "Unknown";
  const avatarUrl = row?.participantAvatar || "";
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
  return {
    id: row?.id,
    title: name,
    preview: row?.metadata?.lastMessagePreview || "",
    avatarUrl,
    avatarText: initials || "U",
    platform: row?.platform,
    unreadCount: row?.unreadCount || 0,
    assignedToMe: false,
  };
};

const loadConversations = async (reset = false) => {
  if (loadingConversations.value) return;
  if (reset) {
    conversations.value = [];
    conversationOffset.value = 0;
    conversationHasMore.value = true;
  }
  if (!conversationHasMore.value) return;
  loadingConversations.value = true;
  try {
    const res = await crmStore.listDmConversations({
      platform: activeTab.value,
      search: search.value,
      limit: conversationLimit.value,
      offset: conversationOffset.value,
    });
    if (res?.code === 0) {
      const rows = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const mapped = rows.map(buildConversationRow);
      conversations.value = reset ? mapped : [...conversations.value, ...mapped];
      conversationOffset.value += rows.length;
      if (!rows.length || rows.length < conversationLimit.value) {
        conversationHasMore.value = false;
      }
      if (!activeConversationId.value && conversations.value.length) {
        selectConversation(conversations.value[0].id);
      }
    }
  } finally {
    loadingConversations.value = false;
  }
};

const onListScroll = () => {
  const el = listBodyRef.value;
  if (!el || loadingConversations.value || !conversationHasMore.value) return;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
  if (nearBottom) loadConversations(false);
};

const onThreadScroll = () => {
  const el = threadBodyRef.value;
  if (!el || loadingMessages.value || loadingMoreMessages.value || !messageHasMore.value) return;
  if (el.scrollTop <= 20) {
    loadingMoreMessages.value = true;
    loadMessages(false).finally(() => {
      loadingMoreMessages.value = false;
    });
  }
};

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    search.value = String(val || "").trim();
    loadConversations(true);
  }, 250);
});

watch(activeTab, () => {
  loadConversations(true);
});

onMounted(() => {
  loadConversations(true);
  const convoId = route.query.conversationId;
  if (convoId) {
    activeConversationId.value = Number(convoId);
    loadMessages(true);
  }
});
</script>

<style scoped>
.dms-tabs {
  padding: 0 0 8px 0;
}

.dms-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
}

.dms-tabs :deep(.v-tab__slider) {
  height: 2px;
}

.dms-tabs-divider {
  margin-top: 4px;
}

.dms-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  min-height: 520px;
  margin-top: 16px;
  height: calc(100dvh - 210px);
}

.dms-list-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  min-height: 520px;
  height: 100%;
  border-radius: 15px 0 0 15px;
  border-right: 1px solid #dbdbdb !important;
}

.dms-list-header {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 10px;
}

.dms-list-title {
  font-weight: 600;
  font-size: 14px;
}

.dms-list-body {
  overflow-y: auto;
  flex: 1;
}

.dms-thread-card {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  height: 100%;
  border-radius: 0 15px 15px 0;
  border-left: 0 !important;
}

.dms-thread-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dms-thread-title {
  font-weight: 600;
}

.dms-thread-body {
  padding: 16px 24px;
  flex: 1;
  background: #f7f8fb;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .dms-body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .dms-list-card {
    border-radius: 15px 15px 0 0;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 0;
  }
  .dms-thread-card {
    border-radius: 0 0 15px 15px;
    border-left: 1px solid rgba(0, 0, 0, 0.12);
  }
}

.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
}

.cust-border p {
  font-size: 12px;
}

.custom-search {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: none;
}

.filter-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: none;
}
</style>
