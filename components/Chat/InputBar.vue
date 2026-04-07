<template>
  <div
    class="chat-input-bar"
    :class="{ 'chat-input-bar--dragging': isDragging }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="isDragging" class="chat-input-drop-overlay">
      <v-icon size="22" color="primary">mdi-cloud-upload-outline</v-icon>
      <span>Drop files to attach</span>
    </div>
    <template v-else>
      <!-- Left actions -->
      <div class="chat-input-actions">
        <v-btn
          v-if="showEmoji"
          icon
          variant="text"
          size="x-small"
          class="chat-input-icon-btn"
          @click="emojiMenu = !emojiMenu"
        >
          <v-icon size="20">mdi-emoticon-outline</v-icon>
        </v-btn>
        <v-menu v-if="showEmoji" v-model="emojiMenu" offset-y :close-on-content-click="false">
          <template #activator="{ props: _ }" />
          <ClientOnly>
            <div class="emoji-menu">
              <emoji-picker class="emoji-picker" @emoji-click="onEmojiClick" />
            </div>
          </ClientOnly>
        </v-menu>

        <v-btn
          v-if="allowAttachments"
          icon
          variant="text"
          size="x-small"
          class="chat-input-icon-btn"
          @click="triggerFileInput"
        >
          <v-icon size="20">mdi-paperclip</v-icon>
        </v-btn>
        <input
          v-if="allowAttachments"
          ref="fileInput"
          type="file"
          class="hidden-input"
          multiple
          @change="onFilesChange"
        />
      </div>

      <!-- Text field -->
      <div class="chat-input-field-wrap">
        <v-text-field
          v-model="draft"
          :placeholder="placeholder"
          variant="solo"
          density="compact"
          hide-details
          flat
          :disabled="disabled"
          bg-color="transparent"
          class="chat-input-field"
          @keydown.enter.prevent="emitSend"
        />
      </div>

      <!-- Send button -->
      <v-btn
        icon
        :color="canSend ? sendColor : undefined"
        variant="flat"
        size="small"
        class="chat-send-btn"
        :class="{ 'chat-send-btn--active': canSend }"
        :loading="loading"
        :disabled="disabled || !canSend"
        @click="emitSend"
      >
        <v-icon size="18">{{ sendIcon }}</v-icon>
      </v-btn>
    </template>
  </div>
</template>

<script setup>
if (process.client) {
  import("emoji-picker-element");
}

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Message..." },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  canSend: { type: Boolean, default: true },
  showEmoji: { type: Boolean, default: true },
  allowAttachments: { type: Boolean, default: false },
  sendIcon: { type: String, default: "mdi-send" },
  sendColor: { type: String, default: "primary" },
});

const emit = defineEmits(["update:modelValue", "send", "files-selected"]);

const emojiMenu = ref(false);
const fileInput = ref(null);
const isDragging = ref(false);
let dragCounter = 0;

const draft = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const emitSend = () => emit("send");

const onEmojiClick = (event) => {
  const symbol = event?.detail?.unicode || event?.detail?.emoji?.unicode || "";
  if (!symbol) return;
  draft.value = `${draft.value || ""}${symbol}`;
  emojiMenu.value = false;
};

const triggerFileInput = () => fileInput.value?.click();

const emitFiles = (files) => {
  if (!files.length) return;
  emit("files-selected", files);
};

const onFilesChange = (event) => {
  const files = Array.from(event?.target?.files || []);
  emitFiles(files);
  if (fileInput.value) fileInput.value.value = "";
};

const onDragOver = () => {
  if (!props.allowAttachments) return;
  dragCounter++;
  isDragging.value = true;
};

const onDragLeave = () => {
  if (!props.allowAttachments) return;
  dragCounter--;
  if (dragCounter <= 0) { dragCounter = 0; isDragging.value = false; }
};

const onDrop = (event) => {
  dragCounter = 0;
  isDragging.value = false;
  if (!props.allowAttachments) return;
  const files = Array.from(event?.dataTransfer?.files || []);
  emitFiles(files);
};
</script>

<style scoped>
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f0f2f5;
  position: relative;
  min-height: 52px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.chat-input-bar--dragging {
  background: #eef5ff;
  border-top: 2px dashed #0061fb;
}

.chat-input-drop-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
  color: #0061fb;
  pointer-events: none;
}

/* Left action icons */
.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}

.chat-input-icon-btn {
  color: #54656f !important;
  width: 36px !important;
  height: 36px !important;
}

.chat-input-icon-btn:hover {
  color: #0061fb !important;
  background: rgba(0, 97, 251, 0.06) !important;
}

/* Text field pill */
.chat-input-field-wrap {
  flex: 1;
  background: #ffffff;
  border-radius: 21px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.chat-input-field {
  flex: 1;
}

/* Remove Vuetify's inner box shadow / outline */
.chat-input-field :deep(.v-field) {
  box-shadow: none !important;
  border-radius: 21px !important;
}

.chat-input-field :deep(.v-field__input) {
  font-size: 14px;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  min-height: unset !important;
}

/* Send button */
.chat-send-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  flex: 0 0 auto;
  color: #54656f !important;
  background: transparent !important;
  transition: background 0.15s, color 0.15s;
}

.chat-send-btn--active {
  background: #0061fb !important;
  color: #ffffff !important;
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

.hidden-input { display: none; }
</style>
