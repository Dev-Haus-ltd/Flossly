<template>
  <div class="chat-thread">
    <div v-if="loading" class="text-caption text-medium-emphasis">
      {{ loadingMessage }}
    </div>
    <div v-else-if="!hasItems" class="text-caption text-medium-emphasis">
      {{ emptyMessage }}
    </div>
    <div v-else class="chat-thread-list">
      <template v-for="group in groups" :key="group.key">
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
          :attachments="row.attachments"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import CommonChatBubble from "@/components/Common/chatBubble.vue";

const props = defineProps({
  groups: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: "No messages yet." },
  loadingMessage: { type: String, default: "Loading messages..." },
});

const hasItems = computed(() => Array.isArray(props.groups) && props.groups.some((g) => g?.items?.length));
</script>

<style scoped>
.chat-thread {
  min-height: 120px;
}

.chat-thread-list {
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
</style>
