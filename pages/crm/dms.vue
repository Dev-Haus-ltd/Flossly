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
              <div>No conversations yet.</div>
              <div class="mt-2">
                Connect Facebook or Instagram in CRM settings to start receiving DMs.
              </div>
            </div>
            <v-list v-else class="dms-list-items" density="compact">
              <v-list-item
                v-for="conv in filteredConversations"
                :key="conv.id"
                :active="conv.id === activeConversationId"
                class="dms-list-item"
                @click="selectConversation(conv.id)"
              >
                <template #prepend>
                  <v-badge
                    v-if="conv.unreadCount"
                    :content="conv.unreadCount"
                    color="error"
                    offset-x="6"
                    offset-y="6"
                  >
                    <v-avatar size="36">
                      <img v-if="conv.avatarUrl" :src="conv.avatarUrl" alt="Avatar" />
                      <span v-else>{{ conv.avatarText }}</span>
                    </v-avatar>
                  </v-badge>
                  <v-avatar v-else size="36">
                    <img v-if="conv.avatarUrl" :src="conv.avatarUrl" alt="Avatar" />
                    <span v-else>{{ conv.avatarText }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 d-flex align-center justify-space-between">
                  <span class="conversation-title">{{ conv.title }}</span>
                  <span class="conversation-time">{{ formatConversationTime(conv.updatedAt) }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ conv.preview || "No messages yet" }}
                </v-list-item-subtitle>
                <template #append>
                  <v-icon size="18" class="text-medium-emphasis">
                    {{ conv.platform === "instagram" ? "mdi-instagram" : "mdi-facebook-messenger" }}
                  </v-icon>
                </template>
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
              <v-icon v-if="activeConversation" size="16" class="mr-1">
                {{ activePlatformIcon }}
              </v-icon>
              {{ activeConversation ? activePlatformLabel : "No conversation selected" }}
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
          <div v-if="pendingFiles.length" class="dms-attachments-preview">
            <div
              v-for="(file, idx) in pendingFiles"
              :key="`${file.name}-${idx}`"
              class="dms-attachment-chip"
            >
              <v-icon size="16" class="mr-1">mdi-paperclip</v-icon>
              <span class="dms-attachment-name">{{ file.name }}</span>
              <v-btn icon variant="text" size="x-small" @click="removePendingFile(idx)">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
          <CommonChatInputBar
            v-model="draftMessage"
            :can-send="canSend"
            :disabled="!activeConversationId"
            :loading="sending"
            :allow-attachments="true"
            @files-selected="onFilesSelected"
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
import { groupChatItems } from "@/lib/chatThread";
import { mapDmMessageToChatItem } from "@/lib/chatMappers";
import { getInitials } from "@/lib/chatShared";
import { useCrmStore } from "@/stores/crm";
import { useMainStore } from "@/stores/index";
import { useAuthStore } from "@/stores/auth";
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
const pendingFiles = ref([]);
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
let metaEventSource = null;
let syncingHistory = false;
let lastHistorySyncAt = 0;
const PROFILE_REFRESH_COOLDOWN_MS = 60000;
const profileRefreshInFlight = new Set();
const profileRefreshAttemptedAt = new Map();

const crmStore = useCrmStore();
const mainStore = useMainStore();
const authStore = useAuthStore();
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

const activePlatformLabel = computed(() => {
  const platform = activeConversation.value?.platform || "";
  if (platform === "messenger") return "Messenger";
  if (platform === "instagram") return "Instagram";
  return "DM";
});

const activePlatformIcon = computed(() => {
  const platform = activeConversation.value?.platform || "";
  if (platform === "messenger") return "mdi-facebook-messenger";
  if (platform === "instagram") return "mdi-instagram";
  return "mdi-message-text-outline";
});

const formatConversationTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const messageItems = computed(() => {
  const me = authStore?.getLoggedUser || authStore?.loggedUser || {};
  const myName = me?.fullName || me?.name || "Flossly";
  const myAvatar =
    me?.photo ||
    me?.profilePicture ||
    me?.profileImage ||
    me?.avatar ||
    me?.logo ||
    "";
  return messages.value.map((row) => {
    const inboundAvatar = activeConversation.value?.avatarUrl || "";
    return mapDmMessageToChatItem(row, {
      inboundAvatarUrl: inboundAvatar,
      inboundAvatarText: getInitials(activeConversation.value?.title || "Client") || "C",
      outboundAvatarUrl: myAvatar,
      outboundAvatarText: getInitials(myName) || "F",
    });
  });
});

const groupedMessages = computed(() => groupChatItems(messageItems.value));

const canSend = computed(() => {
  const hasText = String(draftMessage.value || "").trim().length > 0;
  const hasFiles = pendingFiles.value.length > 0;
  return !!activeConversationId.value && (hasText || hasFiles) && !sending.value;
});

const selectConversation = (id) => {
  activeConversationId.value = id;
  draftMessage.value = "";
  loadMessages(true);
  const conv = conversations.value.find((c) => c.id === id);
  if (conv) queueProfileRefresh(conv);
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
      const conv = conversations.value.find((c) => c.id === activeConversationId.value);
      if (conv) conv.unreadCount = 0;
    }
  } finally {
    loadingMessages.value = false;
  }
};

const upsertMessages = (rows = []) => {
  const incoming = Array.isArray(rows) ? rows : [];
  if (!incoming.length) return;
  const byId = new Map(messages.value.map((m) => [String(m.id), m]));
  incoming.forEach((row) => {
    if (!row?.id) return;
    byId.set(String(row.id), row);
  });
  messages.value = Array.from(byId.values()).sort(
    (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
  );
};

const sendMessage = async () => {
  if (!canSend.value) return;
  const text = String(draftMessage.value || "").trim();
  try {
    sending.value = true;
    let attachments = [];
    if (pendingFiles.value.length) {
      for (const file of pendingFiles.value) {
        const form = new FormData();
        form.append("file", file);
        const resUpload = await crmStore.uploadDmAttachment(form);
        if (resUpload?.code !== 0) {
          const msg = resUpload?.error || resUpload?.message || "Failed to upload attachment";
          mainStore?.setSnackbar?.({ title: msg, type: "error" });
          sending.value = false;
          return;
        }
        if (resUpload?.data) attachments.push(resUpload.data);
      }
    }

    const res = await crmStore.sendDmMessage({
      conversationId: activeConversationId.value,
      message: text,
      attachments,
    });
    if (res?.code === 0) {
      const justSentId = Number(res?.data?.id || 0);
      draftMessage.value = "";
      pendingFiles.value = [];
      if (res?.data) upsertMessages([res.data]);
      scrollThreadToBottom();
      const latest = await crmStore.listDmMessages({
        conversationId: activeConversationId.value,
        limit: 12,
      });
      if (latest?.code === 0) {
        const latestRows = Array.isArray(latest?.data?.data) ? latest.data.data : [];
        upsertMessages(latestRows);
        if (justSentId) {
          const latestMsg = latestRows.find((m) => Number(m?.id) === justSentId);
          if (latestMsg?.status === "failed") {
            const detail =
              latestMsg?.metadata?.error || "Message failed to send. Please reconnect Meta and try again.";
            mainStore?.setSnackbar?.({ title: detail, type: "error" });
          }
        }
        scrollThreadToBottom();
      }

      const conv = conversations.value.find((c) => c.id === activeConversationId.value);
      if (conv) {
        conv.preview = text || "Attachment";
      }
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

const onFilesSelected = (files) => {
  pendingFiles.value = [...pendingFiles.value, ...files];
};

const removePendingFile = (idx) => {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== idx);
};

const buildConversationDisplayName = (row) => {
  const raw =
    row?.participantName ||
    row?.metadata?.participantName ||
    row?.threadId ||
    "Unknown";
  const name = String(raw || "").trim();
  if (!/^[0-9]+$/.test(name)) return name;
  if (String(row?.platform || "").toLowerCase() === "instagram") return "Instagram User";
  if (String(row?.platform || "").toLowerCase() === "messenger") return "Messenger User";
  return "User";
};

const buildConversationRow = (row) => {
  const name = buildConversationDisplayName(row);
  const avatarUrl = row?.participantAvatar || row?.metadata?.participantAvatar || "";
  const assignedUserId = row?.metadata?.assignedUserId || null;
  const currentUserId = authStore?.getLoggedUser?.id || authStore?.getLoggedUser?.userId || authStore?.loggedUser?.id;
  const initials = getInitials(name);
  return {
    id: row?.id,
    title: name,
    preview: row?.metadata?.lastMessagePreview || "",
    avatarUrl,
    avatarText: initials || "U",
    platform: row?.platform,
    unreadCount: row?.unreadCount || 0,
    assignedToMe: assignedUserId && currentUserId ? String(assignedUserId) === String(currentUserId) : false,
    updatedAt: row?.lastMessageAt || row?.updatedAt || row?.createdAt || null,
  };
};

const shouldRefreshProfile = (conv, { force = false } = {}) => {
  if (!conv?.id) return false;
  if (profileRefreshInFlight.has(conv.id)) return false;
  const title = String(conv.title || "").trim();
  const isGenericTitle = /(instagram|messenger)\s+user/i.test(title);
  const isNumericTitle = /^[0-9]+$/.test(title);
  const missingAvatar = !conv.avatarUrl;
  if (!force && !missingAvatar && !isGenericTitle && !isNumericTitle) return false;
  const lastAttempt = Number(profileRefreshAttemptedAt.get(conv.id) || 0);
  if (!force && Date.now() - lastAttempt < PROFILE_REFRESH_COOLDOWN_MS) return false;
  return true;
};

const queueProfileRefresh = (conv, { force = false } = {}) => {
  if (!shouldRefreshProfile(conv, { force })) return;
  const convoId = conv.id;
  profileRefreshInFlight.add(convoId);
  profileRefreshAttemptedAt.set(convoId, Date.now());
  crmStore
    .refreshDmProfile({ conversationId: convoId })
    .then((resProfile) => {
      if (resProfile?.code === 0 && resProfile?.data?.updated) {
        const target = conversations.value.find((c) => c.id === convoId);
        if (target) {
          target.title = resProfile.data.participantName || target.title;
          target.avatarUrl = resProfile.data.participantAvatar || target.avatarUrl;
          target.avatarText = getInitials(target.title || target.avatarText);
        }
      }
    })
    .catch(() => {})
    .finally(() => {
      profileRefreshInFlight.delete(convoId);
    });
};

const loadConversations = async (reset = false) => {
  if (loadingConversations.value) return;
  if (reset && activeTab.value === "instagram") {
    const now = Date.now();
    if (!syncingHistory && now - lastHistorySyncAt > 20000) {
      syncingHistory = true;
      try {
        const syncRes = await crmStore.fetchDmHistoryNow({
          platform: "instagram",
          days: 30,
          maxThreads: 120,
          maxMessagesPerThread: 120,
          debug: "true",
          trace: "true",
        });
        const syncDebug = syncRes?.data || {};
        const syncErrors = Array.isArray(syncDebug?.errors) ? syncDebug.errors : [];
        const capabilityError = syncErrors.find((e) =>
          /application does not have the capability/i.test(String(e?.message || ""))
        );
        if (capabilityError) {
          mainStore?.setSnackbar?.({
            title:
              "Instagram DM access is blocked by Meta app capability (instagram_manage_messages). Enable advanced access/app review for this app.",
            type: "error",
          });
        }
        if (typeof window !== "undefined") {
          const debugData = syncDebug;
          const accountSummaries = Array.isArray(debugData?.accountSummaries) ? debugData.accountSummaries : [];
          console.info("[DM Sync Debug]", {
            platform: activeTab.value,
            accounts: debugData?.accounts || 0,
            conversationsScanned: debugData?.conversationsScanned || 0,
            conversationsUpserted: debugData?.conversationsUpserted || 0,
            messagesImported: debugData?.messagesImported || 0,
            errors: Array.isArray(debugData?.errors) ? debugData.errors : [],
            accountSummaries,
          });
        }
        lastHistorySyncAt = Date.now();
      } catch (syncErr) {
        if (typeof window !== "undefined") {
          console.warn("[DM Sync Debug] fetch failed", syncErr?.data || syncErr?.message || syncErr);
        }
      }
      syncingHistory = false;
    }
  }
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
      assignedToMe: showAssignedOnly.value ? "true" : "",
      unreadOnly: showUnreadOnly.value ? "true" : "",
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
      if (!conversations.value.length) {
        activeConversationId.value = null;
        messages.value = [];
      } else if (!activeConversationId.value) {
        selectConversation(conversations.value[0].id);
      } else if (!conversations.value.some((c) => c.id === activeConversationId.value)) {
        selectConversation(conversations.value[0].id);
      }

      // Background refresh for missing avatars/names
      mapped.forEach((conv) => {
        queueProfileRefresh(conv);
      });
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

watch([showAssignedOnly, showUnreadOnly], () => {
  loadConversations(true);
});

onMounted(() => {
  loadConversations(true);
  const convoId = route.query.conversationId;
  if (convoId) {
    activeConversationId.value = Number(convoId);
    loadMessages(true);
  }

  if (typeof window !== "undefined" && "EventSource" in window) {
    metaEventSource = new EventSource("/api/meta/stream");
    metaEventSource.addEventListener("dm", async (evt) => {
      try {
        const payload = JSON.parse(evt?.data || "{}");
        const convId = Number(payload?.conversationId || 0);
        if (!convId) return;
        if (activeConversationId.value === convId) {
          await loadMessages(true);
        } else {
          await loadConversations(true);
          mainStore?.setSnackbar?.({ title: "New DM received", type: "info" });
        }
      } catch {}
    });
    metaEventSource.onerror = () => {
      if (metaEventSource) {
        metaEventSource.close();
        metaEventSource = null;
      }
    };
  }
});

onBeforeUnmount(() => {
  if (metaEventSource) {
    metaEventSource.close();
    metaEventSource = null;
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
  min-height: 560px;
  margin-top: 16px;
  height: calc(100dvh - 185px);
  max-height: calc(100dvh - 185px);
  overflow: hidden;
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
  min-height: 0;
  background: #f8fafc;
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
  min-height: 0;
  background: #eef2f7;
  overflow-y: auto;
}

.dms-list-item {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding: 10px 6px;
}

.dms-list-items :deep(.v-list-item--active) {
  background: #e7f0ff;
  border-left: 3px solid #1d4ed8;
}

.conversation-title {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.conversation-time {
  font-size: 11px;
  color: #64748b;
  margin-left: 8px;
  white-space: nowrap;
}

.dms-attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 0 16px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.dms-attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  color: #0f172a;
}

.dms-attachment-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .dms-body {
    grid-template-columns: 1fr;
    min-height: calc(100dvh - 185px);
    height: auto;
    max-height: none;
    overflow: visible;
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

.dms-thread-body :deep(.chat-bubble-row--inbound .chat-bubble) {
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.1);
  border-radius: 18px 18px 18px 6px;
}

.dms-thread-body :deep(.chat-bubble-row--outbound .chat-bubble) {
  background: #1877f2;
  border-color: #1877f2;
  border-radius: 18px 18px 6px 18px;
}

.dms-thread-body :deep(.chat-bubble-row--outbound .chat-bubble-text) {
  color: #ffffff;
}

.dms-thread-body :deep(.chat-bubble-row--outbound .chat-bubble-meta) {
  color: rgba(255, 255, 255, 0.75);
}

.dms-thread-body :deep(.chat-avatar) {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
</style>
