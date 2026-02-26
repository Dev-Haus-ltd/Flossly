<template>
  <v-dialog v-model="model" max-width="980px" :retain-focus="false">
    <v-card class="rounded-lg elevation-8 preview-card">
      <div class="modal-header preview-modal-header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ title || 'Preview' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ isWhatsApp ? 'WhatsApp Preview' : 'Email Preview' }}
          </div>
        </div>
        <v-btn icon variant="text" @click="model = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <div class="modal-body preview-modal-body">
        <div v-if="isWhatsApp" class="whatsapp-preview">
          <div class="whatsapp-preview__bubble">{{ whatsappText }}</div>
        </div>
        <div v-else class="email-preview-frame">
          <div class="email-preview-meta">
            <div class="text-caption text-medium-emphasis">Subject</div>
            <div class="text-body-1 font-weight-medium">{{ subject }}</div>
          </div>
          <iframe
            title="Email preview"
            :srcdoc="emailHtml"
            class="email-preview-iframe"
          ></iframe>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  emailHtml: {
    type: String,
    default: '',
  },
  isWhatsApp: {
    type: Boolean,
    default: false,
  },
  whatsappText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.preview-modal-header {
  padding: 16px 20px;
  background: #ffffff;
}

.modal-body {
  padding: 28px;
  background: #fafafa;
  min-height: 450px;
  max-height: 70vh;
  overflow-y: auto;
}

.preview-modal-body {
  padding: 18px;
  background: #f8fafc;
  max-height: 75vh;
  overflow: auto;
}

.email-preview-frame {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  display: grid;
  gap: 12px;
}

.email-preview-meta {
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.16);
}

.email-preview-iframe {
  width: 100%;
  height: 70vh;
  border: 0;
  border-radius: 12px;
  background: #f8f9fb;
}

.whatsapp-preview {
  background: #e5ddd5;
  border-radius: 12px;
  padding: 20px;
  min-height: 220px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.whatsapp-preview__bubble {
  background: #dcf8c6;
  border-radius: 10px;
  padding: 12px 14px;
  max-width: 520px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
