<!-- components/patients/forms/ConsentFormDetail.vue (Updated) -->
<template>
  <v-dialog
    v-model="isOpen"
    max-width="700px"
    @update:model-value="handleDialogClose"
    transition="dialog-transition"
  >
    <v-card class="detail-dialog" rounded="xl" elevation="4">
      <!-- Modern Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="form-icon-badge">
            <v-icon size="28" color="primary">mdi-file-document</v-icon>
          </div>
          <div class="form-title-section">
            <h2 class="form-name">{{ form?.name || "Consent Form" }}</h2>
            <div class="form-meta">
              <v-chip
                v-if="form?.category"
                size="x-small"
                color="primary"
                variant="tonal"
                class="category-chip"
              >
                {{ form.category }}
              </v-chip>
              <v-chip
                size="x-small"
                :color="form?.isActive ? 'success' : 'warning'"
                variant="tonal"
              >
                {{ form?.isActive ? "Active" : "Inactive" }}
              </v-chip>
            </div>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="handleDialogClose"
          class="close-btn"
        />
      </div>

      <v-divider class="dialog-divider" />

      <!-- Content Body -->
      <v-card-text class="dialog-body">
        <!-- Description Card -->
        <div v-if="form?.description" class="description-card">
          <div class="card-header">
            <v-icon size="18" color="primary">mdi-text-box-outline</v-icon>
            <span>Description</span>
          </div>
          <p class="description-text">{{ form.description }}</p>
        </div>

        <!-- Signature Placement - Visual Editor (NO COORDINATES SHOWN) -->
        <div class="info-card signature-placement-card">
          <div class="card-header">
            <v-icon size="18" color="primary">mdi-cursor-default-click</v-icon>
            <span>Signature Placement</span>
            <v-chip
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-auto"
            >
              Visual
            </v-chip>
          </div>
          <div class="signature-placement-preview">
            <SignaturePlacementEditor
              v-model="signatureCoordinates"
              :html-content="form?.htmlContent || ''"
              mode="preview"
              :show-signature-placeholder="true"
              :preview-height="400"
            />
          </div>
        </div>

        <!-- Stats Grid -->
        <div v-if="form" class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <v-icon size="20" color="#10b981">mdi-calendar-check</v-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Created</span>
              <span class="stat-value">{{ formatDate(form.createdAt) }}</span>
            </div>
          </div>
          <div v-if="form.creator" class="stat-card">
            <div class="stat-icon">
              <v-icon size="20" color="#3b82f6">mdi-account-circle</v-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Created By</span>
              <span class="stat-value">{{
                form.creator.fullName || form.creator.email
              }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider class="dialog-divider" />

      <!-- Action Buttons -->
      <v-card-actions class="dialog-actions">
        <!-- <v-btn
          variant="text"
          color="grey-darken-1"
          prepend-icon="mdi-eye-outline"
          @click="handleViewFull"
          class="action-btn view-btn"
        >
          Full View
        </v-btn> -->
        <v-btn
          variant="flat"
          color="primary"
          prepend-icon="mdi-send"
          @click="handleSendForm"
          :loading="isSending"
          class="action-btn send-btn"
        >
          Send to Patient
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Full View Modal - INSIDE APP LAYOUT (Not fullscreen takeover) -->
  <v-dialog
    v-model="showFullView"
    max-width="1200px"
    width="90vw"
    transition="dialog-transition"
    :scrim="true"
  >
    <v-card class="fullview-modal" rounded="0">
      <!-- Modal Header with Navigation -->
      <div class="fullview-modal-header">
        <div class="modal-header-content">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="showFullView = false"
            class="back-btn"
          />
          <div class="modal-title">
            <h3>{{ form?.name || "Consent Form" }}</h3>
            <p>Preview with signature placement</p>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="showFullView = false"
          class="close-modal-btn"
        />
      </div>

      <v-divider />

      <!-- Modal Body -->
      <v-card-text class="fullview-modal-body">
        <div class="fullview-content-wrapper">
          <!-- Signature Placement Preview -->
          <div class="fullview-signature-section">
            <SignaturePlacementEditor
              v-model="signatureCoordinates"
              :html-content="form?.htmlContent || ''"
              mode="preview"
              :show-signature-placeholder="true"
              :preview-height="600"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useConsentStore } from "@/stores/consent";
import SignaturePlacementEditor from "@/components/consent/SignaturePlacementEditor.vue";

const props = defineProps({
  form: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  patientId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "send", "close"]);

const consentStore = useConsentStore();

// State
const isOpen = ref(false);
const isLoading = ref(false);
const isSending = ref(false);
const showFullView = ref(false);
const signatureCoordinates = ref(
  props.form?.signatureCoordinates || {
    x: 100,
    y: 200,
    width: 200,
    height: 80,
    page: 1,
  },
);

// Watchers
watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal;
  },
);

watch(
  () => isOpen.value,
  (newVal) => {
    emit("update:modelValue", newVal);
  },
);

watch(
  () => props.form,
  (newForm) => {
    if (newForm?.signatureCoordinates) {
      signatureCoordinates.value = newForm.signatureCoordinates;
    }
  },
  { deep: true },
);

// Methods
const handleDialogClose = () => {
  isOpen.value = false;
  emit("close");
};

const handleViewFull = () => {
  showFullView.value = true;
};

const handleSendForm = () => {
  isOpen.value = false;
  emit("close");

  setTimeout(() => {
    emit("send", props.form);
  }, 100);
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const sanitizeHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "");
};
</script>

<style scoped lang="scss">
.detail-dialog {
  overflow: hidden;
}

// Dialog Header (same as before)
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .form-icon-badge {
      width: 52px;
      height: 52px;
      background: linear-gradient(
        135deg,
        rgba(0, 97, 251, 0.1) 0%,
        rgba(0, 97, 251, 0.05) 100%
      );
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-title-section {
      .form-name {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 8px 0;
        letter-spacing: -0.3px;
      }

      .form-meta {
        display: flex;
        gap: 8px;
      }
    }
  }

  .close-btn {
    opacity: 0.6;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

.dialog-divider {
  opacity: 0.5;
}

.dialog-body {
  padding: 24px 28px !important;
  max-height: 60vh;
  overflow-y: auto;

  .description-card {
    background: #f8fafc;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 13px;
      color: #1e293b;
      margin-bottom: 12px;
    }

    .description-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }
  }

  .signature-placement-card {
    background: #ffffff;
    border-radius: 14px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    overflow: hidden;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      font-size: 13px;
      color: #1e293b;
    }

    .signature-placement-preview {
      padding: 16px;
    }
  }

  .preview-card {
    background: #ffffff;
    border-radius: 14px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    overflow: hidden;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      font-size: 13px;
      color: #1e293b;

      .preview-badge {
        margin-left: auto;
      }
    }

    .preview-container {
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;
      background: #ffffff;

      .form-content-preview {
        font-size: 14px;
        line-height: 1.6;
        color: #374151;

        :deep(*) {
          max-width: 100%;
        }
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .stat-icon {
        width: 36px;
        height: 36px;
        background: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-info {
        flex: 1;

        .stat-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
      }
    }
  }
}

.dialog-actions {
  padding: 20px 28px !important;
  gap: 12px;
  background: #fafbfc;

  .action-btn {
    flex: 1;
    text-transform: none;
    font-weight: 500;
    border-radius: 12px;
    padding: 8px 0;

    &.view-btn {
      border: 1px solid #e2e8f0;

      &:hover {
        background: #f1f5f9;
      }
    }
  }
}

// Full View Modal (Inside App Layout)
.fullview-modal {
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px !important;
  overflow: hidden;

  .fullview-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: linear-gradient(135deg, #0061fb 0%, #0051d4 100%);

    .modal-header-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .back-btn {
        color: white;
        background: rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      .modal-title {
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px 0;
        }

        p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }
      }
    }

    .close-modal-btn {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .fullview-modal-body {
    flex: 1;
    padding: 24px !important;
    overflow-y: auto;
    background: #f9fafb;
    max-height: calc(90vh - 80px);

    .fullview-content-wrapper {
      max-width: 1000px;
      margin: 0 auto;

      .fullview-signature-section {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .dialog-header {
    padding: 20px !important;
  }

  .dialog-body {
    padding: 20px !important;
  }

  .dialog-actions {
    padding: 16px 20px !important;
    flex-direction: column;

    .action-btn {
      width: 100%;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
