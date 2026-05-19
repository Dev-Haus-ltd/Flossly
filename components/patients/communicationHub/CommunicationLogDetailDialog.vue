<template>
  <v-dialog
    :model-value="dialogModel"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    scrollable
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          <v-icon size="20" :color="getIconColor(selectedLog?.type)" class="mr-2">
            {{ getTypeIcon(selectedLog?.type) }}
          </v-icon>
          {{ selectedLog?.type }} Communication Details
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closeDialog"
          class="mr-2"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <div v-if="selectedLog">
          <!-- PDF Preview for Consent Forms -->
          <div
            v-if="consentDocument?.pdfUrl && isConsentForm"
            class="mb-4"
          >
            <v-card elevation="0" rounded="lg" class="overflow-hidden">
              <div class="pdf-header pa-4" style="background: #f9fafb; border-bottom: 1px solid #e5e7eb">
                <div class="text-subtitle-2 font-weight-medium" style="color: #374151">
                  Consent Form Preview
                </div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="openPdfInNewTab"
                  color="primary"
                >
                  <v-icon start size="16">mdi-open-in-new</v-icon>
                  Open Full PDF
                </v-btn>
              </div>
              <div class="pdf-container" style="height: 500px; background: #f8f9fa; position: relative">
                <iframe
                  :src="consentDocument.pdfUrl"
                  class="pdf-iframe"
                  style="width: 100%; height: 100%; border: none"
                  @load="onPdfLoad"
                  @error="onPdfError"
                ></iframe>
                <div v-if="pdfLoading" class="pdf-loading">
                  <v-progress-circular indeterminate size="32" color="primary"></v-progress-circular>
                  <span class="mt-2">Loading PDF...</span>
                </div>
                <div v-if="pdfError" class="pdf-error">
                  <v-icon size="32" color="error">mdi-alert-circle</v-icon>
                  <span class="mt-2">Failed to load PDF</span>
                </div>
              </div>
            </v-card>
          </div>

          <!-- Status Summary Chip -->
          <div class="summary-row mb-4">
            <div
              class="summary-dot"
              :style="{ background: getStatusColor(selectedLog.status) }"
            ></div>
            <div>
              <div class="text-body-2 font-weight-medium">
                <span
                  class="status-badge-inline"
                  :class="`status-badge-inline--${selectedLog.status.toLowerCase()}`"
                >
                  {{ selectedLog.status }}
                </span>
              </div>
              <div class="text-caption text-grey mt-1">
                {{ formatDateTimeVerbose(selectedLog.createdAt) }}
              </div>
            </div>
          </div>

          <!-- Details Card -->
          <v-card elevation="0" rounded="lg" class="pa-4 mb-4" color="white">
            <div class="text-subtitle-2 font-weight-medium mb-3" style="color: #374151">
              Details
            </div>
            <v-row dense>
              <v-col cols="12" md="6">
                <label class="fld-lbl">Type</label>
                <div class="detail-value-text mt-1">{{ selectedLog.type }}</div>
              </v-col>

              <v-col cols="12" md="6" v-if="selectedLog.subject">
                <label class="fld-lbl">Subject</label>
                <div class="detail-value-text mt-1">{{ selectedLog.subject }}</div>
              </v-col>

              <v-col cols="12" md="6" v-if="selectedLog.practitioner">
                <label class="fld-lbl">Sent By</label>
                <div class="detail-value-text mt-1">
                  {{ selectedLog.practitioner.firstName }} {{ selectedLog.practitioner.lastName }}
                </div>
              </v-col>

              <v-col cols="12" md="6" v-if="isConsentForm && consentDocument">
                <label class="fld-lbl">Form Name</label>
                <div class="detail-value-text mt-1">
                  {{ consentDocument.template?.name || "Unknown" }}
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Timeline Card -->
          <v-card elevation="0" rounded="lg" class="pa-4 mb-4" color="white">
            <div class="text-subtitle-2 font-weight-medium mb-3" style="color: #374151">
              Timeline
            </div>
            <v-row dense>
              <v-col cols="12" md="4">
                <label class="fld-lbl">Created</label>
                <div class="detail-value-text mt-1">
                  <v-icon size="14" color="#6b7280" class="mr-1">mdi-calendar-clock</v-icon>
                  {{ formatDateTimeVerbose(selectedLog.createdAt) }}
                </div>
              </v-col>

              <v-col cols="12" md="4" v-if="selectedLog.sentAt">
                <label class="fld-lbl">Sent</label>
                <div class="detail-value-text mt-1">
                  <v-icon size="14" color="#10b981" class="mr-1">mdi-send</v-icon>
                  {{ formatDateTimeVerbose(selectedLog.sentAt) }}
                </div>
              </v-col>

              <v-col cols="12" md="4" v-if="selectedLog.deliveredAt">
                <label class="fld-lbl">Delivered</label>
                <div class="detail-value-text mt-1">
                  <v-icon size="14" color="#10b981" class="mr-1">mdi-check-circle</v-icon>
                  {{ formatDateTimeVerbose(selectedLog.deliveredAt) }}
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Error Section -->
          <v-card
            v-if="selectedLog.errorMessage"
            elevation="0"
            rounded="lg"
            class="pa-4 mb-4"
            style="background: #fef2f2; border: 1px solid #fecaca"
          >
            <div class="d-flex align-center gap-2">
              <v-icon size="18" color="#dc2626">mdi-alert-circle</v-icon>
              <span style="color: #991b1b; font-size: 14px; flex: 1">
                {{ selectedLog.errorMessage }}
              </span>
            </div>
          </v-card>

          <!-- Message Content -->
          <v-card
            v-if="selectedLog.content && !isConsentForm"
            elevation="0"
            rounded="lg"
            class="pa-4"
            color="white"
          >
            <label class="fld-lbl mb-2">Message Content</label>
            <div 
              class="content-box pa-3" 
              style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px"
            >
              <div class="message-text" v-html="sanitizedContent"></div>
            </div>
          </v-card>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Footer actions -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="border-radius: 10px"
          @click="closeDialog"
        >
          Close
        </v-btn>
        <v-btn
          v-if="selectedLog?.status === 'Failed'"
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          @click="$emit('retry', selectedLog)"
          :disabled="retrying"
          :loading="retrying"
        >
          <v-icon start size="18">mdi-refresh</v-icon>
          {{ retrying ? "Retrying..." : "Retry Communication" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { normalizeConsentHtmlForDigitalFlow } from "~/utils/consentHtml";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  selectedLog: {
    type: Object,
    default: null,
  },
  consentDocument: {
    type: Object,
    default: null,
  },
  retrying: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "retry"]);

const pdfLoading = ref(false);
const pdfError = ref(false);

// Computed properties
const isConsentForm = computed(() => {
  const log = props.selectedLog;
  return (
    log?.metadata?.category === "consent-form" || log?.type === "Consent Form"
  );
});

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Sanitized content for HTML rendering
const sanitizedContent = computed(() => {
  if (!props.selectedLog?.content) return "";
  return normalizeConsentHtmlForDigitalFlow(props.selectedLog.content);
});

// Helper functions
const getIconColor = (type) => {
  const colors = {
    Email: "#4b5563",
    WhatsApp: "#25d366",
    Automation: "#f5a623",
    "Consent Form": "#0061fb",
  };
  return colors[type] || "#6d4aff";
};

const getTypeIcon = (type) => {
  const icons = {
    Email: "mdi-email-outline",
    WhatsApp: "mdi-whatsapp",
    Automation: "mdi-robot-outline",
    "Consent Form": "mdi-file-document-outline",
  };
  return icons[type] || "mdi-email-outline";
};

const getStatusColor = (status) => {
  const colors = {
    Delivered: "#10b981",
    Sent: "#10b981",
    Failed: "#ef4444",
    Pending: "#f59e0b",
  };
  return colors[status] || "#6d4aff";
};

const formatDateTimeVerbose = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const closeDialog = () => {
  emit("update:modelValue", false);
};

const openPdfInNewTab = () => {
  if (props.consentDocument?.pdfUrl) {
    window.open(props.consentDocument.pdfUrl, "_blank");
  }
};

const onPdfLoad = () => {
  pdfLoading.value = false;
  pdfError.value = false;
};

const onPdfError = () => {
  pdfLoading.value = false;
  pdfError.value = true;
};

// Watch for dialog opening to reset PDF state
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && isConsentForm.value) {
      pdfLoading.value = true;
      pdfError.value = false;
    }
  },
);
</script>

<style scoped>
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  display: block;
}

.detail-value-text {
  font-size: 14px;
  color: #111827;
  font-weight: 400;
  word-break: break-word;
  display: flex;
  align-items: center;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
}

.summary-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, #c7b8ff, #a78bfa);
}

.status-badge-inline {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: inline-block;
}

.status-badge-inline--delivered,
.status-badge-inline--sent {
  background: #d1fae5;
  color: #065f46;
}

.status-badge-inline--failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge-inline--pending {
  background: #fef3c7;
  color: #92400e;
}

.content-box {
  transition: all 0.2s ease;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
}

.pdf-container {
  position: relative;
}

.pdf-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
}

.pdf-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
}

.pdf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.v-field) {
  border-radius: 8px !important;
}

.mb-1 {
  margin-bottom: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-1 {
  margin-top: 4px;
}

.mt-2 {
  margin-top: 8px;
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

.d-flex {
  display: flex;
}

.align-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.text-caption {
  font-size: 12px;
}

.text-grey {
  color: #6b7280;
}

.text-subtitle-2 {
  font-size: 13px;
  font-weight: 500;
}

.font-weight-medium {
  font-weight: 500;
}

@media (max-width: 768px) {
  .pdf-container {
    height: 400px !important;
  }
  
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pdf-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>