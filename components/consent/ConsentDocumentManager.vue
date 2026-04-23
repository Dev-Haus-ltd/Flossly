<template>
  <div class="consent-document-manager">
    <!-- Header Card -->
    <v-card class="document-header-card" elevation="0">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="28" color="primary"
              >mdi-file-document-multiple</v-icon
            >
          </div>
          <div>
            <h3 class="header-title">Consent Documents</h3>
            <p class="header-subtitle">
              Track and manage patient consent forms
            </p>
          </div>
        </div>
        <div class="header-stats" v-if="documents.length > 0">
          <div class="stat-badge">
            <span class="stat-count">{{ documents.length }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Main Content -->
    <div class="documents-content">
      <!-- Empty State -->
      <div v-if="documents.length === 0 && !loading" class="empty-state">
        <div class="empty-state-content">
          <div class="empty-icon-wrapper">
            <v-icon size="64" color="grey-lighten-2"
              >mdi-file-document-outline</v-icon
            >
          </div>
          <h4 class="empty-title">No Consent Documents</h4>
          <p class="empty-text">
            No consent forms have been sent to this patient yet.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <!-- <div v-if="loading" class="loading-wrapper">
        <v-skeleton-loader
          type="list-item-avatar-three-line"
          class="skeleton-item"
          v-for="i in 3"
          :key="i"
        />
      </div> -->

      <!-- Documents Grid -->
      <div v-else-if="documents.length > 0" class="documents-grid">
        <div
          v-for="doc in documents"
          :key="doc.id"
          class="document-card"
          :class="{ 'document-card--selected': selectedDocId === doc.id }"
          @click="selectDocument(doc)"
        >
          <!-- Status Badge -->
          <div class="card-status" :class="`status-${doc.status}`">
            <span class="status-dot"></span>
            <span class="status-text">{{ formatStatus(doc.status) }}</span>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <div class="document-icon">
              <v-icon size="32" :color="getIconColor(doc.status)"
                >mdi-file-sign</v-icon
              >
            </div>

            <div class="document-info">
              <h4 class="document-title">{{ doc.title }}</h4>
              <div class="document-meta">
                <div class="meta-item">
                  <v-icon size="14" class="meta-icon"
                    >mdi-file-document-outline</v-icon
                  >
                  <span>{{ doc.template?.name || "N/A" }}</span>
                </div>
                <div class="meta-item">
                  <v-icon size="14" class="meta-icon"
                    >mdi-calendar-clock</v-icon
                  >
                  <span>Sent: {{ formatDate(doc.sentAt) }}</span>
                </div>
                <div v-if="doc.status === 'signed'" class="meta-item">
                  <v-icon size="14" class="meta-icon">mdi-check-circle</v-icon>
                  <span>Signed: {{ formatDateTime(doc.signedAt) }}</span>
                </div>
                <div v-if="doc.expiresAt" class="meta-item">
                  <v-icon size="14" class="meta-icon"
                    >mdi-calendar-remove</v-icon
                  >
                  <span>Expires: {{ formatDate(doc.expiresAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="card-actions" @click.stop>
  <!-- View PDF -->
  <v-tooltip
    v-if="doc.status === 'signed'"
    text="View PDF"
    location="top"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
        class="action-btn"
        @click="viewDocument(doc)"
      >
        <v-icon size="18">mdi-eye</v-icon>
      </v-btn>
    </template>
  </v-tooltip>

  <!-- Download -->
  <v-tooltip
    v-if="doc.status === 'signed'"
    text="Download PDF"
    location="top"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
        class="action-btn download-btn"
        @click="downloadDocument(doc)"
      >
        <v-icon size="18">mdi-download</v-icon>
      </v-btn>
    </template>
  </v-tooltip>

  <!-- Audit -->
  <v-tooltip
    v-if="doc.status === 'signed'"
    text="View Audit Trail"
    location="top"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
        class="action-btn audit-btn"
        @click="viewAuditTrail(doc)"
      >
        <v-icon size="18">mdi-history</v-icon>
      </v-btn>
    </template>
  </v-tooltip>

  <!-- Resend -->
  <v-tooltip
    v-if="['sent', 'viewed'].includes(doc.status)"
    text="Resend Form"
    location="top"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
        class="action-btn resend-btn"
        @click="resendDocument(doc)"
      >
        <v-icon size="18">mdi-email-send</v-icon>
      </v-btn>
    </template>
  </v-tooltip>

  <!-- Void -->
  <!-- <v-tooltip
    v-if="doc.status !== 'voided'"
    text="Expire Document"
    location="top"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
        class="action-btn void-btn"
        @click="confirmVoid(doc)"
      >
        <v-icon size="18">mdi-delete-outline</v-icon>
      </v-btn>
    </template>
  </v-tooltip> -->
</div>
        </div>
      </div>
    </div>

    <!-- Send Dialog -->
    <v-dialog
      v-model="showSendDialog"
      max-width="680px"
      persistent
      transition="dialog-transition"
    >
      <ConsentFormSender
        v-model="showSendDialog"
        :form="selectedForm"
        :patient-id="patientId"
        @close="showSendDialog = false"
        @success="handleFormSent"
      />
    </v-dialog>

    <!-- Audit Trail Dialog -->
    <v-dialog
      v-model="auditDialogOpen"
      max-width="700px"
      transition="dialog-transition"
    >
      <v-card class="audit-dialog">
        <v-card-title class="audit-dialog-header">
          <div class="dialog-header-content">
            <div class="header-icon-wrapper">
              <v-icon size="24" color="primary">mdi-history</v-icon>
            </div>
            <div>
              <span class="dialog-title">Audit Trail</span>
              <p class="dialog-subtitle">
                Complete signature and activity history
              </p>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="auditDialogOpen = false"
            class="close-btn"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="audit-dialog-body">
          <v-skeleton-loader v-if="auditLoading" type="list-item@3" />

          <div v-else class="audit-timeline">
            <div
              v-for="(entry, index) in auditTrail"
              :key="entry.id"
              class="timeline-item"
            >
              <div class="timeline-marker" :class="`marker-${entry.action}`">
                <v-icon size="16" color="white">{{
                  getTimelineIcon(entry.action)
                }}</v-icon>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-action">{{
                    formatAction(entry.action)
                  }}</span>
                  <v-chip
                    size="x-small"
                    :color="getActionColor(entry.action)"
                    text-color="white"
                  >
                    {{ entry.action }}
                  </v-chip>
                </div>
                <div class="timeline-details">
                  <div class="detail-item">
                    <v-icon size="12">mdi-calendar-clock</v-icon>
                    <span>{{ formatDateTime(entry.createdAt) }}</span>
                  </div>
                  <div v-if="entry.ipAddress" class="detail-item">
                    <v-icon size="12">mdi-ip-network</v-icon>
                    <span>IP: {{ entry.ipAddress }}</span>
                  </div>
                  <div v-if="entry.userAgent" class="detail-item">
                    <v-icon size="12">mdi-monitor</v-icon>
                    <span>{{ entry.userAgent.split(" ")[0] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Void Confirmation Dialog -->
    <v-dialog
      v-model="voidDialogOpen"
      max-width="480px"
      persistent
      transition="dialog-transition"
    >
      <v-card class="void-dialog">
        <v-card-title class="void-dialog-header">
          <div class="void-icon-wrapper">
            <v-icon size="32" color="#ef4444">mdi-alert-circle</v-icon>
          </div>
          <h3>Expire Document?</h3>
        </v-card-title>

        <v-card-text class="void-dialog-body">
          <p>
            Are you sure you want to expire <strong>{{ docToVoid?.title }}</strong
            >?
          </p>
          <p class="void-warning">
            This action cannot be undone. The document will be marked as expired.
          </p>
          <v-textarea
            v-model="voidReason"
            label="Reason for expiring (optional)"
            placeholder="Please provide a reason for expiring this document..."
            rows="3"
            variant="outlined"
            class="void-reason-input"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="void-dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            @click="voidDialogOpen = false"
            class="cancel-void-btn"
          >
            Cancel
          </v-btn>
          <v-btn
            variant="flat"
            color="error"
            :loading="voidLoading"
            @click="voidDocument"
            class="confirm-void-btn"
          >
            Expire Document
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- PDF Viewer Dialog -->
    <v-dialog v-model="pdfViewerOpen" max-width="900px">
      <v-card rounded="xl" elevation="4" style="overflow: hidden;">
        <div class="d-flex justify-space-between align-center px-5 py-3" style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <div class="d-flex align-center" style="gap:10px;">
            <v-icon color="primary" size="20">mdi-file-document</v-icon>
            <span style="font-weight:600;font-size:14px;color:#1e293b;">{{ pdfViewerTitle }}</span>
          </div>
          <v-btn flat icon size="32" @click="pdfViewerOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
        <div v-if="pdfViewerLoading" class="d-flex justify-center align-center" style="height:600px;">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <iframe
          v-else-if="pdfViewerUrl"
          :src="pdfViewerUrl"
          style="width:100%;height:600px;border:none;"
          title="Signed Consent Form"
        />
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
      location="top end"
      variant="flat"
      class="success-snackbar"
    >
      <div class="snackbar-content">
        <v-icon size="20" class="snackbar-icon">mdi-check-circle</v-icon>
        <span>{{ successMessage }}</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useConsentStore } from "@/stores/consent";
import { useMainStore } from "@/stores/index";
import ConsentFormSender from "../patients/forms/ConsentFormSender.vue";
import deleteIcon from '@/assets/crm/delete.svg';
const props = defineProps({
  patient: {
    type: Object,
    required: true,
  },
});

const consentStore = useConsentStore();
const mainStore = useMainStore();

const documents = computed(() => consentStore.documents);
const loading = computed(() => consentStore.documentsLoading);
const auditTrail = computed(() => consentStore.auditTrail);
const auditLoading = computed(() => consentStore.auditLoading);

const showSendDialog = ref(false);
const auditDialogOpen = ref(false);
const voidDialogOpen = ref(false);
const selectedDocId = ref(null);
const pdfViewerOpen = ref(false);
const pdfViewerUrl = ref(null);
const pdfViewerTitle = ref('');
const pdfViewerLoading = ref(false);
const docToVoid = ref(null);
const voidReason = ref("");
const voidLoading = ref(false);
const showSuccess = ref(false);
const successMessage = ref("");
const selectedForm = ref(null);
const patientId = computed(() => props.patient?.id);

const getStatusColor = (status) => {
  const colors = {
    draft: "grey",
    sent: "orange",
    viewed: "blue",
    signed: "green",
    voided: "red",
  };
  return colors[status] || "grey";
};

const getIconColor = (status) => {
  const colors = {
    draft: "#9ca3af",
    sent: "#f59e0b",
    viewed: "#3b82f6",
    signed: "#10b981",
    voided: "#ef4444",
  };
  return colors[status] || "#9ca3af";
};

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAction = (action) => {
  const actions = {
    created: "Document Created",
    email_sent: "Email Sent",
    whatsapp_sent: "WhatsApp Sent",
    delivery_failed: "Delivery Failed",
    sent: "Form Sent",
    viewed: "Form Viewed",
    signed: "Document Signed",
    voided: "Document Expired",
    revoked: "Document Revoked",
    re_sent: "Form Re-sent",
  };

  return actions[action] || action;
};

const getActionColor = (action) => {
  const colors = {
    created: "grey",
    email_sent: "indigo",
    whatsapp_sent: "green",
    delivery_failed: "red",
    sent: "orange",
    viewed: "blue",
    signed: "green",
    voided: "red",
    revoked: "deep-orange",
    re_sent: "orange",
  };

  return colors[action] || "grey";
};

const getTimelineIcon = (action) => {
  const icons = {
    created: "mdi-file-plus",
    email_sent: "mdi-email",
    whatsapp_sent: "mdi-whatsapp",
    delivery_failed: "mdi-alert-circle",
    sent: "mdi-send",
    viewed: "mdi-eye",
    signed: "mdi-check-circle",
    voided: "mdi-delete",
    revoked: "mdi-cancel",
    re_sent: "mdi-email-sync",
  };

  return icons[action] || "mdi-information";
};

const selectDocument = (doc) => {
  selectedDocId.value = selectedDocId.value === doc.id ? null : doc.id;
};

const handleFormSent = async () => {
  showSendDialog.value = false;
  await consentStore.fetchDocuments(props.patient.id);
  successMessage.value = "Consent form sent successfully!";
  showSuccess.value = true;
};

const viewDocument = async (doc) => {
  pdfViewerLoading.value = true;
  pdfViewerUrl.value = null;
  pdfViewerTitle.value = doc.template?.name || 'Signed Consent Form';
  pdfViewerOpen.value = true;
  try {
    const signed = await consentStore.getSignedDocument(doc.id);
    if (signed?.pdfUrl) {
      pdfViewerUrl.value = signed.pdfUrl;
    } else {
      pdfViewerOpen.value = false;
      mainStore.setSnackbar({ message: "Signed PDF not available", color: "warning" });
    }
  } catch {
    pdfViewerOpen.value = false;
    mainStore.setSnackbar({ message: "Failed to load document", color: "error" });
  } finally {
    pdfViewerLoading.value = false;
  }
};

const downloadDocument = async (doc) => {
  try {
    const signed = await consentStore.getSignedDocument(doc.id);
    if (signed && signed.pdfUrl) {
      const a = document.createElement('a');
      a.href = signed.pdfUrl;
      a.download = `${doc.template?.name || 'consent-form'}.pdf`;
      a.click();
    }
  } catch (error) {
    mainStore.setSnackbar({
      message: "Failed to download document",
      color: "error",
    });
  }
};

const viewAuditTrail = async (doc) => {
  await consentStore.fetchAuditTrail(doc.id);
  auditDialogOpen.value = true;
};

const resendDocument = async (doc) => {
  try {
    await consentStore.sendDocument({
      patientId: props.patient.id,
      templateId: doc.templateId,
      title: doc.title,
    });
    successMessage.value = "Document re-sent successfully!";
    showSuccess.value = true;
    await consentStore.fetchDocuments(props.patient.id);
  } catch (error) {
    console.error("Error resending document:", error);
    mainStore.setSnackbar({
      message: "Failed to resend document",
      color: "error",
    });
  }
};

const confirmVoid = (doc) => {
  docToVoid.value = doc;
  voidReason.value = "";
  voidDialogOpen.value = true;
};

const voidDocument = async () => {
  if (!docToVoid.value) return;

  voidLoading.value = true;

  try {
    await consentStore.voidDocument(docToVoid.value.id, voidReason.value);
    voidDialogOpen.value = false;
    await consentStore.fetchDocuments(props.patient.id);
    successMessage.value = "Document voided successfully!";
    showSuccess.value = true;
  } catch (error) {
    console.error("Error voiding document:", error);
    mainStore.setSnackbar({
      message: "Failed to void document",
      color: "error",
    });
  } finally {
    voidLoading.value = false;
  }
};

onMounted(async () => {
  if (props.patient) {
    await consentStore.fetchDocuments(props.patient.id);
  }
});

watch(
  () => props.patient?.id,
  async (newId) => {
    if (newId) {
      await consentStore.fetchDocuments(newId);
    }
  },
);
</script>

<style scoped lang="scss">
.consent-document-manager {
  width: 100%;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Base button */
.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

/* Hover effect (consistent) */
.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

/* Individual hover colors */
.download-btn:hover {
  background: rgba(0, 97, 251, 0.08);
}

.audit-btn:hover {
  background: rgba(99, 102, 241, 0.08);
}

.resend-btn:hover {
  background: rgba(16, 185, 129, 0.08);
}

.void-btn:hover {
  background: rgba(239, 68, 68, 0.08);
}

/* Icon consistency (important if you mix img + mdi) */
.action-btn .v-icon,
.action-btn img.action-icon {
  width: 18px;
  height: 18px;
}
// Header Card
.document-header-card {
  background: white;
  border-radius: 20px !important;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;

  .header-content {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .header-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(
          135deg,
          rgba(0, 97, 251, 0.1) 0%,
          rgba(0, 97, 251, 0.05) 100%
        );
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .header-subtitle {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
      }
    }

    .header-stats {
      .stat-badge {
        background: rgba(0, 97, 251, 0.08);
        padding: 8px 16px;
        border-radius: 12px;
        text-align: center;

        .stat-count {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #0061fb;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }
      }
    }
  }
}

// Empty State
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .empty-state-content {
    text-align: center;

    .empty-icon-wrapper {
      width: 96px;
      height: 96px;
      background: rgba(0, 97, 251, 0.05);
      border-radius: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .empty-text {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
  }
}

// Loading State
.loading-wrapper {
  .skeleton-item {
    margin-bottom: 16px;
    border-radius: 16px;
  }
}

// Documents Grid
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.document-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    border-color: #d1d5db;
  }

  &--selected {
    border-color: #0061fb;
    background: #f8faff;
    box-shadow: 0 4px 16px rgba(0, 97, 251, 0.12);
  }

  .card-status {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    z-index: 1;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 6px;
      background: currentColor;
    }

    &.status-sent {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    &.status-viewed {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    &.status-signed {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    &.status-voided {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    &.status-draft {
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
    }
  }

  .card-content {
    padding: 20px;
    display: flex;
    gap: 16px;

    .document-icon {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      background: rgba(0, 97, 251, 0.08);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .document-info {
      flex: 1;
      min-width: 0;

      .document-title {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 12px 0;
        line-height: 1.4;
        padding-right: 80px;
      }

      .document-meta {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;

          .meta-icon {
            opacity: 0.7;
          }

          span {
            line-height: 1.4;
          }
        }
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 4px;
    padding: 12px 20px 20px;
    border-top: 1px solid #e5e7eb;
    background: #fafbfc;

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      &.download-btn:hover {
        background: rgba(16, 185, 129, 0.1);

        :deep(.v-icon) {
          color: #10b981 !important;
        }
      }

      &.audit-btn:hover {
        background: rgba(59, 130, 246, 0.1);

        :deep(.v-icon) {
          color: #3b82f6 !important;
        }
      }

      &.resend-btn:hover {
        background: rgba(245, 158, 11, 0.1);

        :deep(.v-icon) {
          color: #f59e0b !important;
        }
      }

      &.void-btn:hover {
        background: rgba(239, 68, 68, 0.1);

        :deep(.v-icon) {
          color: #ef4444 !important;
        }
      }
    }
  }
}

// Audit Dialog
.audit-dialog {
  border-radius: 24px !important;
  overflow: hidden;

  .audit-dialog-header {
    padding: 24px 28px !important;
    background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .dialog-header-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .header-icon-wrapper {
        width: 44px;
        height: 44px;
        background: rgba(0, 97, 251, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dialog-title {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.3px;
      }

      .dialog-subtitle {
        font-size: 13px;
        color: #6b7280;
        margin: 4px 0 0 0;
      }
    }

    .close-btn {
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }

  .audit-dialog-body {
    padding: 24px 28px !important;
    max-height: 60vh;
    overflow-y: auto;

    .audit-timeline {
      .timeline-item {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        position: relative;

        &:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 19px;
          top: 32px;
          bottom: -24px;
          width: 2px;
          background: linear-gradient(to bottom, #e5e7eb, transparent);
        }

        .timeline-marker {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;

          &.marker-sent {
            background: #f59e0b;
          }
          &.marker-viewed {
            background: #3b82f6;
          }
          &.marker-signed {
            background: #10b981;
          }
          &.marker-voided {
            background: #ef4444;
          }
          &.marker-re_sent {
            background: #f59e0b;
          }
          &.marker-created {
            background: #6b7280;
          }

          &.marker-email_sent {
            background: #6366f1;
          }

          &.marker-whatsapp_sent {
            background: #10b981;
          }

          &.marker-delivery_failed {
            background: #ef4444;
          }

          &.marker-sent {
            background: #f59e0b;
          }

          &.marker-viewed {
            background: #3b82f6;
          }

          &.marker-signed {
            background: #10b981;
          }

          &.marker-voided {
            background: #ef4444;
          }

          &.marker-revoked {
            background: #ea580c;
          }

          &.marker-re_sent {
            background: #f59e0b;
          }
        }

        .timeline-content {
          flex: 1;

          .timeline-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .timeline-action {
              font-weight: 600;
              color: #111827;
              font-size: 14px;
            }
          }

          .timeline-details {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;

            .detail-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #6b7280;
            }
          }
        }
      }
    }
  }
}

// Void Dialog
.void-dialog {
  border-radius: 24px !important;
  overflow: hidden;

  .void-dialog-header {
    text-align: center;
    padding: 32px 24px 24px !important;

    .void-icon-wrapper {
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
  }

  .void-dialog-body {
    padding: 0 24px 24px !important;
    text-align: center;

    p {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 12px 0;

      strong {
        color: #111827;
      }
    }

    .void-warning {
      background: rgba(239, 68, 68, 0.05);
      padding: 10px 12px;
      border-radius: 10px;
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .void-reason-input {
      text-align: left;

      :deep(.v-field) {
        border-radius: 12px;
      }
    }
  }

  .void-dialog-actions {
    padding: 20px 24px !important;
    gap: 12px;
    justify-content: center;

    .cancel-void-btn {
      text-transform: none;
      font-weight: 500;
      border-radius: 10px;
    }

    .confirm-void-btn {
      text-transform: none;
      font-weight: 600;
      border-radius: 10px;
      padding: 0 24px;
    }
  }
}

// Success Snackbar
.success-snackbar {
  :deep(.v-snackbar__content) {
    padding: 12px 20px;
  }

  .snackbar-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .snackbar-icon {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
  }
}

// Dialog Transitions
.dialog-transition-enter-active,
.dialog-transition-leave-active {
  transition: all 0.3s ease;
}

.dialog-transition-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.dialog-transition-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

// Scrollbar
.audit-dialog-body::-webkit-scrollbar {
  width: 6px;
}

.audit-dialog-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.audit-dialog-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.audit-dialog-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

// Responsive
@media (max-width: 768px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .document-card .card-content .document-info .document-title {
    padding-right: 0;
  }

  .document-header-card .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .audit-dialog .audit-dialog-header {
    padding: 20px !important;
  }

  .audit-dialog .audit-dialog-body {
    padding: 20px !important;
  }
}
</style>
