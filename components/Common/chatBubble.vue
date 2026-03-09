<template>
  <div
    class="chat-bubble-row"
    :class="isOutbound ? 'chat-bubble-row--outbound' : 'chat-bubble-row--inbound'"
  >
    <div class="chat-bubble-wrap">
      
      <div class="chat-bubble-content">
        <div
          v-if="!isOutbound"
          class="chat-avatar"
          :class="{ 'chat-avatar--image': showAvatarImage }"
        >
          <img v-if="showAvatarImage" :src="avatarUrl" alt="Lead" @error="onAvatarError" />
          <span v-else>{{ avatarText }}</span>
        </div>
        <div class="chat-bubble">
          <div v-if="automated" class="chat-bubble-badge">Automated</div>
          <p class="mb-1 chat-bubble-text">{{ message }}</p>
          <div class="chat-bubble-meta">
            <span>{{ timestamp || "N/A" }}</span>
            <v-icon v-if="statusIcon" size="14" class="chat-status-icon">
              {{ statusIcon }}
            </v-icon>
          </div>
        </div>
        <div
          v-if="isOutbound"
          class="chat-avatar"
          :class="{ 'chat-avatar--image': showAvatarImage }"
        >
          <img v-if="showAvatarImage" :src="avatarUrl" alt="Practice" @error="onAvatarError" />
          <span v-else>{{ avatarText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOutbound: { type: Boolean, default: false },
  sender: { type: String, default: "" },
  message: { type: String, default: "" },
  timestamp: { type: String, default: "" },
  statusIcon: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  avatarText: { type: String, default: "" },
  automated: { type: Boolean, default: false },
});

const showAvatarImage = ref(false);

const updateAvatarVisibility = () => {
  showAvatarImage.value = !!props.avatarUrl;
};

const onAvatarError = () => {
  showAvatarImage.value = false;
};

watch(
  () => props.avatarUrl,
  () => updateAvatarVisibility(),
  { immediate: true }
);
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

.chat-bubble-content {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.chat-bubble {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  position: relative;
}

.chat-bubble-row--outbound .chat-bubble {
  background: #e6f0ff;
  border-color: #d6e4ff;
}

.chat-bubble-row--inbound .chat-bubble::before {
  content: "";
  position: absolute;
  left: 12px;
  top: -6px;
  border-right: 6px solid #fff;
  border-left: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-row--outbound .chat-bubble::after {
  content: "";
  position: absolute;
  right: 12px;
  top: -6px;
  border-left: 6px solid #e6f0ff;
  border-right: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.chat-bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.chat-bubble-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  justify-content: flex-end;
}

.chat-status-icon {
  color: rgba(0, 0, 0, 0.55);
}

.chat-bubble-badge {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.75);
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  margin-bottom: 6px;
}

.chat-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  overflow: hidden;
  flex: 0 0 auto;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-avatar--image {
  background: transparent;
}
</style>
