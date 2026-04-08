<template>
  <div class="chat-thread">
    <div v-if="loading" class="chat-thread-state text-caption text-medium-emphasis">
      {{ loadingMessage }}
    </div>
    <div v-else-if="!hasItems" class="chat-thread-state text-caption text-medium-emphasis">
      {{ emptyMessage }}
    </div>
    <div v-else ref="listEl" class="chat-thread-list">
      <template v-for="group in groups" :key="group.key">
        <div class="chat-day-pill">{{ group.label }}</div>
        <ChatBubble
          v-for="row in group.items"
          :key="row.id"
          :is-outbound="row.isOutbound"
          :sender="row.sender"
          :message="row.message"
          :timestamp="row.timeLabel"
          :status-icon="row.statusIcon"
          :status-color="row.statusColor || ''"
          :avatar-url="row.avatarUrl"
          :avatar-text="row.avatarText"
          :automated="row.automated"
          :attachments="row.attachments"
          :provider-message-id="row.providerMessageId || null"
          :created-at="row.createdAt || null"
          :recipient-phone="row.recipientPhone || null"
          :reaction="row.reaction || null"
          @message-deleted="$emit('message-deleted', $event)"
          @message-edited="$emit('message-edited', $event)"
          @message-reacted="$emit('message-reacted', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import ChatBubble from "@/components/Chat/Bubble.vue";

const props = defineProps({
  groups: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: "No messages yet." },
  loadingMessage: { type: String, default: "Loading messages..." },
});

const listEl = ref(null);

const hasItems = computed(() =>
  Array.isArray(props.groups) && props.groups.some((g) => g?.items?.length)
);

const scrollToBottom = () => {
  const el = listEl.value;
  if (el) el.scrollTop = el.scrollHeight;
};

defineEmits(["message-deleted", "message-edited", "message-reacted"]);
defineExpose({ scrollToBottom });
</script>

<style scoped>
.chat-thread {
  min-height: 120px;
}

.chat-thread-state {
  padding: 16px;
}

.chat-thread-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 8px;
}

.chat-day-pill {
  align-self: center;
  background: #dceeff;
  color: #0047b8;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 999px;
  margin: 10px 0 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
</style>
