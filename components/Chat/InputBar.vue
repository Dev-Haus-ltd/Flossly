<template>
  <div class="chat-input-bar">
    <div v-if="showEmoji" class="chat-input-left">
      <v-menu v-model="emojiMenu" offset-y>
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon variant="text" size="small">
            <v-icon size="18">mdi-emoticon-outline</v-icon>
          </v-btn>
        </template>
        <ClientOnly>
          <div class="emoji-menu">
            <emoji-picker class="emoji-picker" @emoji-click="onEmojiClick" />
          </div>
        </ClientOnly>
      </v-menu>
    </div>
    <div v-if="allowAttachments" class="chat-input-left">
      <v-btn icon variant="text" size="small" @click="triggerFileInput">
        <v-icon size="18">mdi-paperclip</v-icon>
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        class="hidden-input"
        multiple
        @change="onFilesChange"
      />
    </div>
    <v-text-field
      v-model="draft"
      :placeholder="placeholder"
      variant="solo"
      density="compact"
      hide-details
      flat
      :disabled="disabled"
      :bg-color="bgColor"
      class="chat-input-field"
      @keydown.enter.prevent="emitSend"
    />
    <v-btn
      icon
      :color="sendColor"
      variant="flat"
      class="chat-send-btn"
      :loading="loading"
      :disabled="disabled || !canSend"
      @click="emitSend"
    >
      <v-icon size="20">{{ sendIcon }}</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
if (process.client) {
  import("emoji-picker-element");
}

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Type here..." },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  canSend: { type: Boolean, default: true },
  showEmoji: { type: Boolean, default: true },
  allowAttachments: { type: Boolean, default: false },
  sendIcon: { type: String, default: "mdi-send" },
  sendColor: { type: String, default: "primary" },
  bgColor: { type: String, default: "#FFFFFF" },
});

const emit = defineEmits(["update:modelValue", "send", "files-selected"]);

const emojiMenu = ref(false);
const fileInput = ref(null);

const draft = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const emitSend = () => {
  emit("send");
};

const onEmojiClick = (event) => {
  const symbol = event?.detail?.unicode || event?.detail?.emoji?.unicode || "";
  if (!symbol) return;
  draft.value = `${draft.value || ""}${symbol}`;
  emojiMenu.value = false;
};

const triggerFileInput = () => fileInput.value?.click();

const onFilesChange = (event) => {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;
  emit("files-selected", files);
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<style scoped>
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

.hidden-input {
  display: none;
}
</style>
