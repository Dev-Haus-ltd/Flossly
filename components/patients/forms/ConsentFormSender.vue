<template>
  <v-dialog
    v-model="isOpen"
    max-width="560px"
    @update:model-value="handleDialogClose"
    transition="dialog-transition"
  >
    <v-card class="sender-dialog" rounded="xl" elevation="4">
      <!-- Modern Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <v-icon size="24" color="primary">mdi-send</v-icon>
          </div>
          <div>
            <h2 class="header-title">Send Consent Form</h2>
            <p class="header-subtitle">
              Send form to patient for digital signature
            </p>
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

      <div class="info-card form-info">
        <div class="card-header">
          <v-icon size="18" color="primary">mdi-file-document</v-icon>
          <span>Form Details</span>
        </div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">Form Name</span>
            <span class="info-value">{{
              selectedForm?.name || selectedForm?.title || "No form selected"
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Category</span>
            <span class="info-value">{{
              selectedForm?.category || "General"
            }}</span>
          </div>
        </div>
      </div>

      <!-- Patient Selection Card -->
      <div class="info-card patient-card">
        <div class="card-header">
          <v-icon size="18" color="primary">mdi-account</v-icon>
          <span>Recipient</span>
          <span class="required-badge">Required</span>
        </div>


        <!-- Selected Patient Info -->
        <div v-if="selectedPatient" class="selected-patient">
          <div class="patient-avatar">
            <v-icon size="24" color="white">mdi-account</v-icon>
          </div>
          <div class="patient-details">
            <div class="patient-name">{{ selectedPatient.firstName }} {{ selectedPatient.lastName  }}</div>
            <!-- <div class="patient-contact">
              <span v-if="selectedPatient.email">
                <v-icon size="12">mdi-email</v-icon>
                {{ selectedPatient.email }}
              </span>
              <span v-if="selectedPatient.phone" class="ml-3">
                <v-icon size="12">mdi-phone</v-icon>
                {{ selectedPatient.phone }}
              </span>
            </div> -->
          </div>
        </div>
      </div>

      <!-- Send Via Options -->
      <div v-if="selectedPatient" class="info-card delivery-card">
        <div class="card-header">
          <v-icon size="18" color="primary">mdi-truck-fast</v-icon>
          <span>Delivery Method</span>
        </div>

        <div class="delivery-options">
          <div
            class="delivery-option"
            :class="{ active: sendVia === 'email' }"
            @click="sendVia = 'email'"
          >
            <div class="option-icon">
              <v-icon
                size="24"
                :color="sendVia === 'email' ? '#0061fb' : '#94a3b8'"
                >mdi-email</v-icon
              >
            </div>
            <div class="option-info">
              <span class="option-title">Email</span>
              <span class="option-desc">Send to patient's email address</span>
            </div>
            <v-radio
              :model-value="sendVia === 'email'"
              color="primary"
              class="option-radio"
            />
          </div>

          <div
            class="delivery-option"
            :class="{
              active: sendVia === 'whatsapp',
              disabled: !isWhatsAppAvailable,
            }"
            @click="isWhatsAppAvailable && (sendVia = 'whatsapp')"
          >
            <div class="option-icon">
              <v-icon
                size="24"
                :color="
                  sendVia === 'whatsapp' && isWhatsAppAvailable
                    ? '#0061fb'
                    : '#94a3b8'
                "
                >mdi-whatsapp</v-icon
              >
            </div>
            <div class="option-info">
              <span class="option-title">
                WhatsApp
                <span v-if="!isWhatsAppAvailable" class="not-configured-badge"
                  >Not configured</span
                >
              </span>
              <span class="option-desc">{{
                isWhatsAppAvailable
                  ? "Send to patient's WhatsApp number"
                  : "WhatsApp integration not configured"
              }}</span>
            </div>
            <v-radio
              :model-value="sendVia === 'whatsapp'"
              :disabled="!isWhatsAppAvailable"
              color="primary"
              class="option-radio"
            />
          </div>

          <div
            class="delivery-option"
            :class="{
              active: sendVia === 'both',
              disabled: !isWhatsAppAvailable,
            }"
            @click="isWhatsAppAvailable && (sendVia = 'both')"
          >
            <div class="option-icon">
              <v-icon
                size="24"
                :color="
                  sendVia === 'both' && isWhatsAppAvailable
                    ? '#0061fb'
                    : '#94a3b8'
                "
                >mdi-email-plus</v-icon
              >
            </div>
            <div class="option-info">
              <span class="option-title">
                Email & WhatsApp
                <span v-if="!isWhatsAppAvailable" class="not-configured-badge"
                  >Not configured</span
                >
              </span>
              <span class="option-desc">{{
                isWhatsAppAvailable
                  ? "Send via both channels"
                  : "WhatsApp integration not configured"
              }}</span>
            </div>
            <v-radio
              :model-value="sendVia === 'both'"
              :disabled="!isWhatsAppAvailable"
              color="primary"
              class="option-radio"
            />
          </div>
        </div>

        <div class="delivery-hint">
          <v-icon size="14" color="#64748b">mdi-information</v-icon>
          <span>A secure link will be sent for digital signature</span>
        </div>
      </div>

      <!-- Optional Message -->
      <div v-if="selectedPatient" class="info-card message-card">
        <div class="card-header">
          <v-icon size="18" color="primary">mdi-message-text</v-icon>
          <span>Optional Message</span>
          <span class="optional-badge">Optional</span>
        </div>

        <v-textarea
          v-model="optionalMessage"
          placeholder="Add a personal message to the patient..."
          rows="3"
          variant="outlined"
          density="comfortable"
          counter
          maxlength="500"
          class="message-input"
        >
          <template #counter>
            <span class="char-counter">{{ optionalMessage.length }}/500</span>
          </template>
        </v-textarea>
      </div>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="error-alert"
        @update:model-value="error = null"
      >
        <div class="alert-content">
          <v-icon size="18">mdi-alert-circle</v-icon>
          <span>{{ error }}</span>
        </div>
      </v-alert>
  </v-card-text>

      <v-divider class="dialog-divider" />

      <!-- Action Buttons -->
      <v-card-actions class="dialog-actions">
        <v-btn
          variant="text"
          color="grey-darken-1"
          @click="handleDialogClose"
          class="action-btn cancel-btn"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!hasRequiredData || isSending"
          :loading="isSending"
          @click="handleSendForm"
          class="action-btn send-btn"
        >
          <template #prepend>
          </template>
          Send Form
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useConsentStore } from "@/stores/consent";
import { useMainStore } from "@/stores/index";
import { useWhapiStream } from "@/composables/useWhapiStream";

const props = defineProps({
  form: { type: Object, default: null },
  modelValue: Boolean,
  patient: { type: Object },
  patientId: { type: [String, Number], default: null }, 
});
const emit = defineEmits(["update:modelValue", "success", "close"]);
// console.log('pateint',props?.patient)
const consentStore = useConsentStore();
const mainStore = useMainStore();
const { isWhatsAppConnected, loadWhapiStatus } = useWhapiStream();

// State
const isOpen = ref(false);
const isSending = ref(false);
const error = ref(null);

const sendVia = ref("email");
const optionalMessage = ref("");
// console.log('selected form in sender:', selectedPatient);
// Computed
const selectedForm = computed(() => props.form);
const selectedPatient = computed(() => props.patient);

const finalPatientId = computed(() => {
  return props.patient?.id || props.patientId || null;
});


const hasRequiredData = computed(() => {
  return !!selectedForm.value && !!finalPatientId.value;
});
const isWhatsAppAvailable = computed(() => isWhatsAppConnected.value);

// Watchers
watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal;
    error.value = null;
  },
);

watch(
  () => isOpen.value,
  (newVal) => {
    emit("update:modelValue", newVal);
  },
);

// Methods
const handleDialogClose = () => {
  isOpen.value = false;
  resetForm();
  emit("close");
};

const resetForm = () => {
  optionalMessage.value = "";
  error.value = null;
};

const handleSendForm = async () => {
  isSending.value = true;
  error.value = null;

  try {
    const payload = {
      templateId: selectedForm.value.id,
      patientId: finalPatientId.value,
      patientEmail: selectedPatient.value?.email || undefined,
      patientPhone: selectedPatient.value?.phone || undefined,
      notes: optionalMessage.value || undefined,
      expiryDays: 30,
      sendVia: sendVia.value || "email",
    };

    const response = await consentStore.sendDocument(payload);

    if (response?.partiallyDelivered) {
      mainStore.setSnackbar({
        message: `"${selectedForm.value.name}" partially sent. Delivered via ${response.deliveredVia?.join(", ")}.`,
        color: "warning",
      });
    } else {
      mainStore.setSnackbar({
        message: `"${selectedForm.value.name}" sent to ${selectedPatient.value?.name || "patient"} successfully!`,
        color: "success",
      });
    }
    emit("success", {
      form: selectedForm.value,
      patientId: finalPatientId.value,
      patient: selectedPatient.value,
    });

    setTimeout(() => {
      handleDialogClose();
    }, 500);
  } catch (err) {
    console.error("Error sending form:", err);
    error.value =
      err?.data?.message ||
      err?.message ||
      "Failed to send form. Please try again.";
    mainStore.setSnackbar({
      message: error.value,
      color: "error",
    });
  } finally {
    isSending.value = false;
  }
};

// Initialize
onMounted(async () => {
  // Load WhatsApp status to determine if WhatsApp is available
  await loadWhapiStatus();
});
</script>

<style scoped lang="scss">
.sender-dialog {
  overflow: hidden;
}

// Dialog Header
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

    .header-icon {
      width: 44px;
      height: 44px;
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
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }

    .header-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
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

// Dialog Body
.dialog-body {
  padding: 24px 28px !important;
  max-height: 65vh;
  overflow-y: auto;

  // Info Cards
  .info-card {
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

      .required-badge {
        margin-left: auto;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 8px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 20px;
        color: #ef4444;
      }

      .optional-badge {
        margin-left: auto;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 8px;
        background: rgba(0, 97, 251, 0.1);
        border-radius: 20px;
        color: #0061fb;
      }
    }

    .info-content {
      padding: 16px;

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        &:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }

        .info-label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }

        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
      }
    }
  }

  // Patient Selection
  .loading-patient {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    color: #64748b;
    font-size: 13px;
  }

  .patient-search {
    padding: 16px;

    .patient-autocomplete {
      :deep(.v-field) {
        border-radius: 12px;
      }
    }
  }

  .selected-patient {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: linear-gradient(
      135deg,
      rgba(0, 97, 251, 0.05) 0%,
      rgba(0, 97, 251, 0.02) 100%
    );
    border-top: 1px solid #e2e8f0;

    .patient-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0061fb 0%, #0051d4 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .patient-details {
      flex: 1;

      .patient-name {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .patient-contact {
        font-size: 11px;
        color: #64748b;
        display: flex;
        gap: 12px;
      }
    }
  }

  // Delivery Options
  .delivery-options {
    padding: 12px;

    .delivery-option {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #e2e8f0;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      &.active {
        background: rgba(0, 97, 251, 0.05);
        border-color: #0061fb;
      }

      .option-icon {
        width: 40px;
        height: 40px;
        background: #f1f5f9;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .option-info {
        flex: 1;

        .option-title {
          display: block;
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .option-desc {
          font-size: 11px;
          color: #64748b;
        }
      }

      .option-radio {
        margin-left: auto;
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: auto; /* Keep pointer-events for showing cursor */
        background: #f8fafc;

        .option-icon {
          opacity: 0.6;
        }

        .option-info {
          opacity: 0.7;
        }

        &:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
      }
    }
  }

  .not-configured-badge {
    margin-left: 6px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 12px;
    color: #ef4444;
    display: inline-block;
  }

  .delivery-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #64748b;
  }

  // Message Input
  .message-card {
    .message-input {
      padding: 16px;

      :deep(.v-field) {
        border-radius: 12px;
      }

      :deep(.v-field__counter) {
        .char-counter {
          font-size: 11px;
          color: #94a3b8;
        }
      }
    }
  }

  // Error Alert
  .error-alert {
    border-radius: 12px;
    margin-top: 8px;

    .alert-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}

// Dialog Actions
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

    &.cancel-btn {
      border: 1px solid #e2e8f0;

      &:hover {
        background: #f1f5f9;
      }
    }

    }

}

// Scrollbar
.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

// Dialog Transition
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

  .delivery-option {
    .option-icon {
      width: 36px;
      height: 36px;
    }

    .option-title {
      font-size: 12px;
    }

    .option-desc {
      font-size: 10px;
    }
  }
}
</style>
