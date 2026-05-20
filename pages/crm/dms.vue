<template>
  <v-sheet color="background" class="dms-page">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">DMs</p>
    </div>
    <div class="dms-content">
      <div class="dms-top-bar">
        <v-tabs v-model="activeTab" class="dms-tabs" density="compact">
          <v-tab value="all">All Messages</v-tab>
          <v-tab value="messenger">Messenger</v-tab>
          <v-tab value="instagram">Instagram</v-tab>
        </v-tabs>
        <v-spacer />
        <div class="d-flex align-center mr-2">
        </div>
      </div>

      <div class="dms-body">
        <v-card class="dms-list-card" variant="outlined">
          <div class="dms-list-header">
            <div class="d-flex align-center justify-space-between">
              <div class="dms-list-title">Conversations</div>
              <v-btn
                variant="text"
                density="compact"
                size="small"
                :loading="syncingHistory"
                :disabled="syncingHistory"
                class="text-none text-caption"
                color="primary"
                @click="syncHistory"
              >
                <v-icon size="14" class="mr-1">mdi-refresh</v-icon>
                Sync history
              </v-btn>
            </div>
            <div class="d-inline-flex align-center py-1 dms-toolbar">
              <div style="width: 120px">
                <v-text-field
                  v-model="searchInput"
                  placeholder="Search"
                  clearable
                  @click:clear="searchInput = ''"
                  variant="solo"
                  :elevation="0"
                  density="compact"
                  hide-details
                  bg-color="#F3F4F6"
                  flat
                  class="custom-search"
                >
                  <template #append-inner>
                    <img
                      :src="searchicon"
                      alt="search icon"
                      width="14"
                      height="14"
                    />
                  </template>
                </v-text-field>
              </div>
              <v-menu
                v-model="filterMenu"
                :close-on-content-click="false"
                transition="fade-transition"
                offset-y
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    variant="flat"
                    density="compact"
                    class="tbl-top-btn"
                    style="width: 100px"
                  >
                    <span>Filter</span>
                    <img
                      :src="filtericon"
                      alt="filter icon"
                      class="ml-2"
                      width="14"
                      height="14"
                    />
                  </v-btn>
                </template>
                <v-card class="dms-filter-menu">
                  <div class="d-flex align-center justify-space-between">
                    <div class="dms-filter-title">Filters by</div>
                    <v-btn
                      variant="text"
                      density="comfortable"
                      color="primary"
                      class="dms-filter-clear"
                      @click="clearFilters"
                    >
                      Clear filters
                    </v-btn>
                  </div>

                  <v-divider class="my-3" />

                  <v-checkbox
                    v-model="showUnreadOnly"
                    label="Unread only"
                    density="compact"
                    hide-details
                    class="dms-filter-check"
                  />
                </v-card>
              </v-menu>
            </div>
          </div>
          <v-divider />
          <div ref="listBodyRef" class="dms-list-body" @scroll="onListScroll">
            <div v-if="!filteredConversations.length" class="pa-4">
              <div
                v-if="showConnectionHelp"
                class="dms-empty-state"
              >
                <div class="dms-empty-title">{{ connectionHelp.title }}</div>
                <div class="dms-empty-description">
                  {{ connectionHelp.description }}
                </div>
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  class="mt-3 text-none"
                  @click="openConnectionsSetup"
                >
                  Open CRM Connections
                </v-btn>
              </div>
              <div v-else class="text-caption text-medium-emphasis">
                No conversations yet.
              </div>
            </div>
            <v-list v-else class="dms-list-items" density="compact">
              <v-list-item
                v-for="conv in filteredConversations"
                :key="conv.id"
                :active="conv.id === activeConversationId"
                class="dm-item"
                :class="{ 'dm-item--active': conv.id === activeConversationId }"
                @click="selectConversation(conv.id)"
              >
                <template #prepend>
                  <div class="dm-avatar-wrap mr-2">
                    <v-avatar size="40">
                      <img v-if="conv.avatarUrl" :src="conv.avatarUrl" alt="Avatar" @error="(e) => e.target.style.display = 'none'" />
                      <span v-else>{{ conv.avatarText }}</span>
                    </v-avatar>
                    <span
                      class="dm-platform-dot"
                      :class="conv.platform === 'instagram' ? 'dm-platform-dot--ig' : 'dm-platform-dot--messenger'"
                    >
                      <v-icon size="9" color="white">{{ conv.platform === 'instagram' ? 'mdi-instagram' : 'mdi-facebook-messenger' }}</v-icon>
                    </span>
                  </div>
                </template>
                <v-list-item-title class="text-body-2 dm-item-title">
                  {{ conv.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis dm-item-subtitle">
                  {{ conv.preview || "No messages yet" }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    v-if="conv.unreadCount"
                    size="x-small"
                    color="primary"
                    class="dm-unread-chip"
                  >
                    {{ conv.unreadCount }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card>

        <v-card class="dms-thread-card" variant="outlined">
          <div class="dms-thread-header">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="dms-thread-title">
                  {{ activeConversation?.title || "Select a conversation" }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ activeConversation ? (activeConversation.platform === 'instagram' ? 'Instagram' : 'Messenger') : 'No conversation selected' }}
                </div>
              </div>
              <div class="d-flex align-center gap-2">
                <v-chip
                  v-if="withinMessageWindow && windowTimeRemaining"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="text-caption"
                >
                  <v-icon start size="12">mdi-clock-alert-outline</v-icon>
                  {{ windowTimeRemaining }}
                </v-chip>
                <v-chip
                  v-else-if="withinMessageWindow && activeConversationId"
                  size="x-small"
                  color="success"
                  variant="tonal"
                  class="text-caption"
                >
                  <v-icon start size="12">mdi-check-circle-outline</v-icon>
                  Window open
                </v-chip>
                <v-chip
                  v-else-if="activeConversationId && !withinMessageWindow"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  class="text-caption"
                >
                  <v-icon start size="12">mdi-clock-remove-outline</v-icon>
                  Window closed
                </v-chip>
                <template v-if="showConversationAutoReplyToggle">
                  <v-divider vertical class="mx-1" />
                  <v-tooltip location="bottom" text="Auto-reply for this conversation">
                    <template #activator="{ props: tooltipProps }">
                      <div v-bind="tooltipProps" class="d-flex align-center">
                        <v-icon size="12" :color="conversationAutoReplyEnabled ? 'success' : 'grey'" class="mr-1">{{ conversationAutoReplyEnabled ? 'mdi-robot' : 'mdi-robot-off-outline' }}</v-icon>
                        <span class="text-caption text-medium-emphasis mr-1">Auto-reply</span>
                        <v-switch
                          v-model="conversationAutoReplyEnabled"
                          color="success"
                          density="compact"
                          hide-details
                          inset
                          style="transform: scale(0.7);"
                          @update:model-value="toggleConversationAutoReply"
                        />
                      </div>
                    </template>
                  </v-tooltip>
                </template>
                <v-btn
                  v-if="activeConversationId"
                  icon
                  variant="text"
                  size="small"
                  class="dms-delete-btn"
                  @click="openDeleteConversationDialog"
                >
                  <img :src="deleteIcon" alt="Delete conversation" width="16" height="16" />
                </v-btn>
              </div>
            </div>
          </div>
          <v-divider />
          <div ref="threadBodyRef" class="dms-thread-body" @scroll="onThreadScroll">
            <ChatThread
              :groups="groupedMessages"
              :loading="loadingMessages"
              :empty-message="emptyMessage"
            />
          </div>
          <v-divider />
          <div v-if="activeConversationId && !withinMessageWindow" class="dms-window-banner">
            <v-icon size="16" class="mr-1">mdi-clock-alert-outline</v-icon>
            <span>
              24-hour messaging window has closed. Meta only allows replies within 24 hours of the customer's last message.
              <template v-if="lastInboundAgo"> Last received {{ lastInboundAgo }}.</template>
            </span>
          </div>
          <ChatInputBar
            v-model="draftMessage"
            :can-send="canSend"
            :disabled="!activeConversationId || !withinMessageWindow"
            :loading="sending"
            :placeholder="withinMessageWindow ? 'Type here...' : 'Cannot reply - 24-hour window closed'"
            @send="sendMessage"
          />
        </v-card>
      </div>
    </div>

    <v-dialog v-model="autoReplyConfigDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span>Auto-Reply Configuration</span>
          <v-btn icon variant="text" size="small" @click="autoReplyConfigDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-caption text-medium-emphasis mb-4">
            Provide context about your practice so the bot can respond intelligently to incoming leads. All fields are required to enable auto-reply.
          </p>
          <v-textarea
            v-model="autoReplyConfig.services"
            label="What services does your business provide?"
            placeholder="e.g., We provide dental checkups, cleanings, teeth whitening, and orthodontics..."
            rows="3"
            class="mb-4"
          />
          <v-textarea
            v-model="autoReplyConfig.cta"
            label="What is the main CTA you want from the auto-reply?"
            placeholder="e.g., We encourage new patients to book a consultation by calling us or filling out the form on our website..."
            rows="3"
            class="mb-4"
          />
          <v-textarea
            v-model="autoReplyConfig.outOfScopeMessage"
            label="Out-of-scope message"
            hint="Shown when the lead asks something the bot can't handle"
            persistent-hint
            rows="2"
            class="mb-4"
          />
          <v-textarea
            v-model="autoReplyConfig.ctaScript"
            label="CTA reply script (optional)"
            placeholder="e.g., 1. Ask for their name and best contact number. 2. Let them know a team member will call within 24 hours. 3. If they ask about pricing, explain it depends on their needs and suggest a free consultation..."
            hint="When a lead replies to your CTA, the bot will follow this script's flow — not word-for-word, but the overall direction"
            persistent-hint
            rows="4"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="autoReplyConfigDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="autoReplyConfigLoading" @click="saveAutoReplyConfig">Save Configuration</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-model="deleteConversationDialog"
      title="Delete conversation?"
      :message="deleteConversationMessage"
      confirm-text="Delete conversation"
      cancel-text="Keep conversation"
      confirm-color="error"
      icon="mdi-trash-can-outline"
      :loading="deletingConversation"
      @confirm="confirmDeleteConversation"
      @cancel="deleteConversationDialog = false"
    />
  </v-sheet>
</template>

<script setup>
import ChatThread from "@/components/Chat/Thread.vue";
import ChatInputBar from "@/components/Chat/InputBar.vue";
import ConfirmDialog from "@/components/Common/ConfirmDialog.vue";
import { groupChatItems, formatChatTimestamp, buildDayKey, buildDayLabel } from "@/lib/chatThread";
import { resolveDmStatusIcon, resolveDmStatusColor } from "@/lib/chatShared";
import { useCrmStore } from "@/stores/crm";
import { useMainStore } from "@/stores/index";
import { useRoute } from "vue-router";
import deleteIcon from "@/assets/crm/delete.svg";
import searchicon from "@/assets/icons/listView/serach-icon.svg";
import filtericon from "@/assets/icons/listView/filter-icon.svg";

definePageMeta({
  layout: "home",
});

const activeTab = ref("all");
const search = ref("");
const filterMenu = ref(false);
const showUnreadOnly = ref(false);
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
const dmConnectionStatus = ref({
  loaded: false,
  anyConnected: false,
  messengerConnected: false,
  instagramConnected: false,
});
const messageCache = ref(new Map());
const MESSAGE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const syncingHistory = ref(false);
const autoReplyEnabled = ref(false);
const whatsappAutoReplyEnabled = ref(false);
const autoReplyLoading = ref(false);
const autoReplyConfig = ref({ services: "", cta: "", outOfScopeMessage: "Thank you so much! Our team will contact you shortly.", ctaScript: "" });
const autoReplyConfigDialog = ref(false);
const autoReplyConfigLoading = ref(false);
const conversationAutoReplyEnabled = ref(true);
const deleteConversationDialog = ref(false);
const deletingConversation = ref(false);
let searchTimer = null;
let metaEventSource = null;

const crmStore = useCrmStore();
const mainStore = useMainStore();
const route = useRoute();

const emptyMessage = computed(() => {
  if (!activeConversationId.value) {
    return "Select a conversation to view messages.";
  }
  return "No messages yet.";
});

const showConnectionHelp = computed(() => {
  if (!dmConnectionStatus.value.loaded) return false;
  if (activeTab.value === "messenger") return !dmConnectionStatus.value.messengerConnected;
  if (activeTab.value === "instagram") return !dmConnectionStatus.value.instagramConnected;
  return !dmConnectionStatus.value.anyConnected;
});

const connectionHelp = computed(() => {
  if (activeTab.value === "messenger") {
    return {
      title: "Messenger is not connected",
      description:
        "To receive Facebook Messenger conversations here, connect Meta in CRM Connections. Messenger and Instagram are authorized together in the same Meta connection flow.",
    };
  }
  if (activeTab.value === "instagram") {
    return {
      title: "Instagram is not connected",
      description:
        "To receive Instagram Direct Messages here, connect Meta in CRM Connections. Instagram is authorized through the same Meta connection used for Messenger.",
    };
  }
  return {
    title: "No messaging channels connected",
    description:
      "Connect Meta in CRM Connections to authorize both Facebook Messenger and Instagram, fetch incoming messages, and reply from this inbox.",
  };
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
    return true;
  });
});

const activeConversation = computed(() => {
  return conversations.value.find((c) => c.id === activeConversationId.value) || null;
});

const deleteConversationMessage = computed(() => {
  const title = activeConversation.value?.title || "this conversation";
  return `This will permanently remove ${title} and all messages from your CRM inbox. This action cannot be undone.`;
});

const messageItems = computed(() => {
  const conv = activeConversation.value;
  return messages.value.map((row) => {
    const isOutbound = String(row?.direction || "").toLowerCase() === "outbound";
    return {
      id: row.id,
      isOutbound,
      sender: row.senderName || (isOutbound ? "Flossly" : "Client"),
      message: row.message,
      attachments: row.attachments || null,
      timeLabel: formatChatTimestamp(row.createdAt),
      statusIcon: isOutbound ? resolveDmStatusIcon(row?.status) : "",
      statusColor: isOutbound ? resolveDmStatusColor(row?.status) : "",
      automated: false,
      avatarUrl: isOutbound ? "" : (conv?.avatarUrl || ""),
      avatarText: isOutbound ? "F" : (conv?.avatarText || "C"),
      dayKey: buildDayKey(row.createdAt),
      dayLabel: buildDayLabel(row.createdAt),
      createdAt: row.createdAt,
    };
  });
});

const groupedMessages = computed(() => groupChatItems(messageItems.value));

// 24-hour messaging window (Meta Messenger/Instagram policy)
const lastInboundAt = computed(() => {
  const timestamps = messages.value
    .filter((m) => String(m.direction || "").toLowerCase() === "inbound")
    .map((m) => new Date(m.createdAt).getTime())
    .filter((t) => !isNaN(t));
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps));
});

const withinMessageWindow = computed(() => {
  if (!activeConversation.value) return false;
  const platform = activeConversation.value.platform;
  // Only Messenger and Instagram have the 24-hour window restriction
  if (platform !== "messenger" && platform !== "instagram") return true;
  if (!lastInboundAt.value) return false;
  return Date.now() - lastInboundAt.value.getTime() < 24 * 60 * 60 * 1000;
});

const lastInboundAgo = computed(() => {
  if (!lastInboundAt.value) return "";
  const ms = Date.now() - lastInboundAt.value.getTime();
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  const m = Math.floor(ms / 60000);
  return `${m}m ago`;
});

// Show a countdown badge when the messaging window has < 6 hours remaining
const windowTimeRemaining = computed(() => {
  if (!lastInboundAt.value || !withinMessageWindow.value) return null;
  const msLeft = 24 * 60 * 60 * 1000 - (Date.now() - lastInboundAt.value.getTime());
  if (msLeft <= 0) return null;
  const hLeft = Math.floor(msLeft / 3600000);
  const mLeft = Math.floor((msLeft % 3600000) / 60000);
  if (hLeft >= 6) return null; // plenty of time — don't show
  if (hLeft > 0) return `${hLeft}h ${mLeft}m left`;
  return `${mLeft}m left`;
});

const showConversationAutoReplyToggle = computed(() => {
  if (!autoReplyEnabled.value) return false;
  if (!activeConversationId.value) return false;
  const platform = activeConversation?.value?.platform;
  return platform === 'messenger' || platform === 'instagram';
});

const toggleConversationAutoReply = async (newValue) => {
  if (!activeConversationId.value) return;
  try {
    const res = await crmStore.updateConversationAutoReply(activeConversationId.value, { autoReplyEnabled: newValue });
    if (res?.code === 0) {
      const idx = conversations.value.findIndex(c => c.id === activeConversationId.value);
      if (idx !== -1) {
        conversations.value[idx].autoReplyEnabled = newValue;
      }
    } else {
      conversationAutoReplyEnabled.value = !newValue;
    }
  } catch {
    conversationAutoReplyEnabled.value = !newValue;
  }
};

const canSend = computed(() => {
  return (
    !!activeConversationId.value &&
    String(draftMessage.value || "").trim().length > 0 &&
    !sending.value &&
    withinMessageWindow.value
  );
});

const clearFilters = () => {
  showUnreadOnly.value = false;
};

const syncHistory = async () => {
  if (syncingHistory.value) return;
  syncingHistory.value = true;
  mainStore?.setSnackbar?.({ title: "Syncing DM history, this may take a minute…", type: "info" });
  try {
    const res = await crmStore.fetchDmHistory({ days: 30 });
    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: `Synced ${res.data?.conversationsUpserted ?? 0} conversations, ${res.data?.messagesImported ?? 0} messages`, type: "success" });
      // Refresh missing profiles in the background — don't await so it doesn't block the UI
      crmStore.refreshAllDmProfiles().then((profileRes) => {
        if (profileRes?.code === 0 && profileRes.data?.updated > 0) {
          loadConversations(true);
        }
      }).catch(() => {});
      await loadConversations(true);
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || "Sync failed", type: "error" });
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || "Sync failed", type: "error" });
  } finally {
    syncingHistory.value = false;
  }
};

const loadAutoReplySettings = async () => {
  try {
    const res = await crmStore.getAutoReplySettings();
    if (res?.code === 0) {
      autoReplyEnabled.value = !!res.data?.autoReplyEnabled;
      whatsappAutoReplyEnabled.value = !!res.data?.whatsappAutoReplyEnabled;
      autoReplyConfig.value = res.data?.autoReplyConfig || { services: "", cta: "", outOfScopeMessage: "Thank you so much! Our team will contact you shortly.", ctaScript: "" };
    }
  } catch {}
};

const hasValidAutoReplyConfig = computed(() => {
  const cfg = autoReplyConfig.value;
  if (!cfg) return false;
  if (!cfg.services?.trim()) return false;
  if (!cfg.cta?.trim()) return false;
  return true;
});

const toggleAutoReply = async (newValue) => {
  if (autoReplyLoading.value) return;
  if (newValue && !hasValidAutoReplyConfig.value) {
    mainStore?.setSnackbar?.({ title: "Please configure Q&A before enabling auto-reply", type: "warning" });
    autoReplyEnabled.value = false;
    openConfigDialog();
    return;
  }
  autoReplyLoading.value = true;
  try {
    const res = await crmStore.updateAutoReplySettings({ autoReplyEnabled: newValue });
    if (res?.code === 0) {
      autoReplyEnabled.value = !!res.data?.autoReplyEnabled;
      mainStore?.setSnackbar?.({ 
        title: newValue ? "Auto-reply enabled" : "Auto-reply disabled", 
        type: "success" 
      });
    } else {
      autoReplyEnabled.value = !newValue;
      mainStore?.setSnackbar?.({ title: res?.message || "Failed to update auto-reply settings", type: "error" });
    }
  } catch (e) {
    autoReplyEnabled.value = !newValue;
    mainStore?.setSnackbar?.({ title: e?.message || "Failed to update auto-reply settings", type: "error" });
  } finally {
    autoReplyLoading.value = false;
  }
};

const openConfigDialog = () => {
  autoReplyConfigDialog.value = true;
};

const saveAutoReplyConfig = async () => {
  autoReplyConfigLoading.value = true;
  try {
    const res = await crmStore.updateAutoReplySettings({
      autoReplyEnabled: autoReplyEnabled.value,
      whatsappAutoReplyEnabled: whatsappAutoReplyEnabled.value,
      autoReplyConfig: autoReplyConfig.value,
    });
    if (res?.code === 0) {
      autoReplyConfig.value = res.data?.autoReplyConfig || autoReplyConfig.value;
      mainStore?.setSnackbar?.({ title: "Auto-reply config saved", type: "success" });
      autoReplyConfigDialog.value = false;
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || "Failed to save config", type: "error" });
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || "Failed to save config", type: "error" });
  } finally {
    autoReplyConfigLoading.value = false;
  }
};

const readConversationCache = (conversationId) => {
  const cache = messageCache.value.get(Number(conversationId));
  if (!cache) return null;
  const isFresh = Date.now() - Number(cache.cachedAt || 0) < MESSAGE_CACHE_TTL_MS;
  if (!isFresh) return null;
  return cache;
};

const writeConversationCache = (conversationId) => {
  messageCache.value.set(Number(conversationId), {
    items: Array.isArray(messages.value) ? [...messages.value] : [],
    cursor: messageCursor.value || null,
    hasMore: !!messageHasMore.value,
    cachedAt: Date.now(),
  });
};

const removeConversationLocally = (conversationId) => {
  const numericId = Number(conversationId);
  conversations.value = conversations.value.filter((row) => Number(row?.id) !== numericId);
  messageCache.value.delete(numericId);

  if (activeConversationId.value !== numericId) return;

  const nextConversationId = conversations.value[0]?.id || null;
  if (nextConversationId) {
    selectConversation(nextConversationId, { forceRefresh: true });
    return;
  }
  clearActiveConversation();
};

const refreshPlaceholderConversations = async () => {
  const placeholderRows = conversations.value.filter((conv) =>
    isPlaceholderParticipantName(conv?.title, conv?.platform)
  );
  if (!placeholderRows.length) return;

  try {
    const res = await crmStore.refreshAllDmProfiles();
    if (res?.code === 0 && Number(res.data?.updated || 0) > 0) {
      await loadConversations(true);
    }
  } catch {}
};

const selectConversation = (id, options = {}) => {
  const forceRefresh = !!options.forceRefresh;
  if (!forceRefresh && activeConversationId.value === id) return;
  activeConversationId.value = id;
  draftMessage.value = "";
  const conv = conversations.value.find((c) => c.id === id);
  conversationAutoReplyEnabled.value = conv?.autoReplyEnabled !== false;
  loadMessages(true, { forceRefresh });

  // Silently refresh profile if name is a raw ID or avatar is missing
  const needsRefresh = conv && (!conv.avatarUrl || isPlaceholderParticipantName(conv.title, conv.platform));
  if (needsRefresh) {
    crmStore.refreshDmProfile({ conversationId: id }).then((res) => {
      if (res?.code === 0 && res.data?.updated) {
        const idx = conversations.value.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const resolvedTitle = resolveConversationTitle({
            platform: conversations.value[idx]?.platform,
            participantName: res.data.participantName,
            metadataName: conversations.value[idx]?.title,
            threadId: "",
          });
          conversations.value[idx] = {
            ...conversations.value[idx],
            title: resolvedTitle,
            avatarUrl: res.data.participantAvatar || conversations.value[idx].avatarUrl,
          };
        }
      }
    }).catch(() => {});
  }
};

const clearActiveConversation = () => {
  activeConversationId.value = null;
  messages.value = [];
  draftMessage.value = "";
  messageCursor.value = null;
  messageHasMore.value = true;
};

const openDeleteConversationDialog = () => {
  if (!activeConversationId.value) return;
  deleteConversationDialog.value = true;
};

const confirmDeleteConversation = async () => {
  if (!activeConversationId.value || deletingConversation.value) return;
  deletingConversation.value = true;
  try {
    const conversationId = activeConversationId.value;
    const res = await crmStore.deleteDmConversation({ conversationId });
    if (res?.code === 0) {
      deleteConversationDialog.value = false;
      removeConversationLocally(conversationId);
      mainStore?.setSnackbar?.({ title: "Conversation deleted", type: "success" });
      return;
    }
    mainStore?.setSnackbar?.({ title: res?.message || res?.error || "Failed to delete conversation", type: "error" });
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.data?.message || e?.message || "Failed to delete conversation", type: "error" });
  } finally {
    deletingConversation.value = false;
  }
};

const openConnectionsSetup = () => {
  navigateTo("/crm");
};

const loadDmConnectionStatus = async () => {
  try {
    const res = await crmStore.getDmConnectionStatus();
    if (res?.code === 0 && res.data) {
      dmConnectionStatus.value = {
        loaded: true,
        anyConnected: !!res.data.anyConnected,
        messengerConnected: !!res.data.messengerConnected,
        instagramConnected: !!res.data.instagramConnected,
      };
      return;
    }
  } catch {}
  dmConnectionStatus.value = {
    loaded: true,
    anyConnected: false,
    messengerConnected: false,
    instagramConnected: false,
  };
};

const scrollThreadToBottom = () => {
  nextTick(() => {
    const el = threadBodyRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
};

const loadMessages = async (reset = false, options = {}) => {
  const forceRefresh = !!options.forceRefresh;
  if (!activeConversationId.value) {
    messages.value = [];
    return;
  }
  if (reset && !forceRefresh) {
    const cache = readConversationCache(activeConversationId.value);
    if (cache) {
      messages.value = Array.isArray(cache.items) ? [...cache.items] : [];
      messageCursor.value = cache.cursor || null;
      messageHasMore.value = !!cache.hasMore;
      if (messages.value.length) scrollThreadToBottom();
      return;
    }
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
      writeConversationCache(activeConversationId.value);
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
      await loadMessages(true, { forceRefresh: true });
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

const isRawId = (str) => /^\d{10,}$/.test(String(str || "").trim());

const fallbackParticipantName = (platform) => {
  if (platform === "instagram") return "Instagram User";
  if (platform === "messenger") return "Messenger User";
  return "Unknown";
};

const isPlaceholderParticipantName = (name, platform) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  if (!normalizedName || normalizedName === "unknown" || isRawId(normalizedName)) return true;

  const fallback = String(fallbackParticipantName(platform) || "").trim().toLowerCase();
  return !!fallback && normalizedName === fallback;
};

const resolveConversationTitle = ({ platform, participantName, metadataName, threadId }) => {
  const candidates = [participantName, metadataName]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const firstHumanName = candidates.find((name) => !isPlaceholderParticipantName(name, platform));
  if (firstHumanName) return firstHumanName;

  const thread = String(threadId || "").trim();
  if (thread && !isRawId(thread)) return thread;
  return fallbackParticipantName(String(platform || "").toLowerCase());
};

const buildConversationRow = (row) => {
  const platform = String(row?.platform || "").toLowerCase();
  const name = resolveConversationTitle({
    platform,
    participantName: row?.participantName,
    metadataName: row?.metadata?.participantName,
    threadId: row?.threadId,
  });
  const avatarUrl = row?.participantAvatar || row?.metadata?.participantAvatar || "";
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
  const rawPreview = row?.metadata?.lastMessagePreview || "";
  const preview = rawPreview === "[Attachment]" ? "📎 Attachment" : rawPreview;
  return {
    id: row?.id,
    title: name,
    preview,
    avatarUrl,
    avatarText: initials || "U",
    platform: row?.platform,
    unreadCount: row?.unreadCount || 0,
    autoReplyEnabled: row?.autoReplyEnabled !== false,
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
  clearActiveConversation();
  loadConversations(true);
});

onMounted(async () => {
  const convoId = route.query.conversationId ? Number(route.query.conversationId) : null;
  const orgIdFromQuery = route.query.orgId ? Number(route.query.orgId) : null;

  // Cross-org: switch org before loading if the notification came from a different org
  if (orgIdFromQuery) {
    const { user, setUser } = useUser();
    const authStore = useAuthStore();
    const currentOrgId = user.value?.currentLoggedInOrgId;
    if (currentOrgId && orgIdFromQuery !== Number(currentOrgId)) {
      try {
        const res = await authStore.switchOrgnanisation({ orgId: orgIdFromQuery });
        if (res?.code === 0) {
          const profileRes = await authStore.profile();
          if (profileRes?.code === 0 && profileRes.data) setUser(profileRes.data);
        }
      } catch {}
    }
    // Remove orgId from URL after handling to keep the URL clean
    await navigateTo({ query: { ...(convoId ? { conversationId: convoId } : {}) } }, { replace: true });
  }

  await loadConversations(true);
  refreshPlaceholderConversations();
  await loadDmConnectionStatus();
  await loadAutoReplySettings();

  if (convoId) {
    selectConversation(convoId);
  }

  startMetaStream();
});

const startMetaStream = () => {
  if (metaEventSource) return;
  metaEventSource = new EventSource('/api/meta/stream');
  metaEventSource.addEventListener('dm', async (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.conversationId && data.conversationId === activeConversationId.value) {
        await loadMessages(true, { forceRefresh: true });
      }
      if (data.orgId) {
        await loadConversations(true);
      } else {
        await loadConversations(false);
      }
    } catch {}
  });
  metaEventSource.onerror = () => {
    stopMetaStream();
  };
};

const stopMetaStream = () => {
  if (metaEventSource) {
    metaEventSource.close();
    metaEventSource = null;
  }
};

onUnmounted(() => {
  stopMetaStream();
});
</script>

<style scoped>
/* Page fills the viewport — no outer page scroll */
.dms-page {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--v-layout-top, 0px) - var(--trial-banner-height, 0px));
  overflow: hidden;
}

.cust-border {
  flex-shrink: 0;
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
}

.cust-border p {
  font-size: 12px;
}

/* Fills remaining height below the title bar */
.dms-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 20px 0;
  border-color: #DBDBDB !important;
}

.dms-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dms-tabs {
  padding: 0 0 4px 0;
}

.dms-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  color: #6b7280;
  border-radius: 8px 8px 0 0;
  min-height: 36px;
  padding: 0 12px;
}

.dms-tabs :deep(.v-tab.v-tab--selected) {
  color: #111827;
  font-weight: 700;
  background: #f3f6ff;
}

.dms-tabs :deep(.v-tab__slider) {
  height: 3px;
  border-radius: 2px;
  background: #2f6df6;
}

/* Grid fills remaining space — only the inner bodies scroll */
.dms-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
  margin-top: 12px;
  min-height: 0;
}

/* ── Conversation list ─────────────────────────────── */
.dms-list-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 100%;
  min-height: 0;
  border-radius: 15px 0 0 15px;
  border: 1px solid #dbdbdb !important;
  border-right: 1px solid #dbdbdb !important;
}

.dms-list-header {
  flex-shrink: 0;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 10px;
}

.dms-list-title {
  font-weight: 600;
  font-size: 14px;
}

.dms-toolbar {
  flex-wrap: nowrap;
  gap: 0;
}

.dms-list-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.dms-list-items {
  padding: 0 !important;
}

.dm-item {
  border-bottom: 1px solid #edf0f3;
  cursor: pointer;
  transition: background-color 0.18s ease;
  min-height: 72px;
}

.dm-item :deep(.v-list-item__content) {
  gap: 4px;
}

.dm-item :deep(.v-list-item__prepend) {
  padding-inline-end: 8px;
}

.dm-item:hover {
  background-color: #f6f8fb;
}

.dm-item--active {
  background-color: #eef4ff;
}

.dm-item-title {
  font-weight: 600;
  color: #1f2937;
}

.dm-item-subtitle {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.dm-unread-chip {
  font-weight: 600;
  min-width: 24px;
  justify-content: center;
}

/* Avatar + platform indicator badge */
.dm-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.dm-platform-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #fff;
}

.dm-platform-dot--ig {
  background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
}

.dm-platform-dot--messenger {
  background: linear-gradient(135deg, #0084ff 0%, #a033ff 100%);
}

.dms-empty-state {
  border: 1px solid #dbe4ff;
  background: #f7faff;
  border-radius: 10px;
  padding: 12px;
}

.dms-empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.dms-empty-description {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: #4b5563;
}

/* ── Thread panel ──────────────────────────────────── */
.dms-thread-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 0 15px 15px 0;
  border: 1px solid #dbdbdb !important;
  border-left: 0 !important;
}

.dms-thread-header {
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dms-thread-title {
  font-weight: 600;
}

.dms-delete-btn {
  opacity: 0.72;
}

.dms-delete-btn:hover {
  opacity: 1;
  background: rgba(220, 38, 38, 0.08);
}

.dms-thread-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 16px 24px;
}

/* 24-hour window warning banner */
.dms-window-banner {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #fff8e1;
  border-top: 1px solid #ffe082;
  color: #7b5e00;
  font-size: 12px;
  line-height: 1.4;
}

/* ── Misc ──────────────────────────────────────────── */
.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
  align-items: center;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}

.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  font-weight: 500;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
  align-items: center;
}

.dms-filter-menu {
  min-width: 280px;
  border-radius: 12px;
  padding: 16px;
}

.dms-filter-title {
  font-size: 14px;
  font-weight: 500;
}

.dms-filter-clear {
  text-transform: none;
  font-size: 13px;
  font-weight: 500;
}

.dms-filter-check {
  margin-top: 4px;
}

@media (max-width: 960px) {
  .dms-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .dms-list-card {
    border-radius: 15px 15px 0 0;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 0;
    height: auto;
    max-height: 340px;
  }
  .dms-thread-card {
    border-radius: 0 0 15px 15px;
    border-left: 1px solid rgba(0, 0, 0, 0.12);
    height: auto;
    min-height: 400px;
  }
}
</style>
