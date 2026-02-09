<template>
  <div
    class="chat-bubble-row"
    :class="isOutbound ? 'chat-bubble-row--outbound' : 'chat-bubble-row--inbound'"
  >
    <div class="chat-bubble-wrap">
      <div v-if="sender" class="chat-bubble-sender text-caption text-medium-emphasis">
        {{ sender }}
      </div>
      <div class="chat-bubble">
        <p class="mb-1 chat-bubble-text">{{ message }}</p>
        <div class="d-flex justify-space-between align-center chat-bubble-meta">
          <span>{{ timestamp || "N/A" }}</span>
          <span v-if="status">{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOutbound: { type: Boolean, default: false },
  sender: { type: String, default: "" },
  message: { type: String, default: "" },
  timestamp: { type: String, default: "" },
  status: { type: String, default: "" },
});
</script>

<style scoped>
.chat-bubble-row {
  display: flex;
}

.chat-bubble-row--inbound {
  justify-content: flex-start;
}

.chat-bubble-row--outbound {
  justify-content: flex-end;
}

.chat-bubble-wrap {
  max-width: 78%;
}

.chat-bubble-sender {
  margin: 0 8px 4px;
}

.chat-bubble {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  position: relative;
}

.chat-bubble-row--outbound .chat-bubble {
  background: #dfffe4;
  border-color: #b8e6c0;
}

.chat-bubble-row--inbound .chat-bubble::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 14px;
  border-right: 6px solid #fff;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-row--outbound .chat-bubble::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 14px;
  border-left: 6px solid #dfffe4;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.chat-bubble-meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  gap: 12px;
}
</style>
