<template>
  <v-dialog
    :model-value="dialogModel"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
    scrollable
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          {{ isEditMode ? "Edit Correspondence" : "New Correspondence" }}
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

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        density="compact"
        class="correspondence-tabs"
      >
        <v-tab value="email">
          <v-icon size="18" class="mr-2">mdi-email-outline</v-icon>
          Email
        </v-tab>
        <v-tab value="whatsapp">
          <v-icon size="18" class="mr-2">mdi-whatsapp</v-icon>
          WhatsApp
        </v-tab>
        <!-- <v-tab value="automation">
          <v-icon size="18" class="mr-2">mdi-robot-outline</v-icon>
          Automation
        </v-tab> -->
      </v-tabs>

      <v-divider />

      <!-- Body -->
      <v-form ref="formRef">
        <v-card-text
          class="pa-5"
          style="background: #f9fafb; max-height: 60vh; overflow-y: auto"
        >
          <!-- Email Tab -->
          <div v-if="activeTab === 'email'" class="tab-pane">
            <v-card
              elevation="0"
              rounded="xl"
              class="pa-4"
              color="white"
              style="border: 1px solid #e5e7eb"
            >
              <v-row dense>
                <v-col cols="6">
                  <label class="fld-lbl"
                    >To <span class="req-star">*</span></label
                  >
                  <v-text-field
                    v-model="form.email.to"
                    variant="outlined"
                    density="compact"
                    placeholder="Enter patient email"
                    class="mt-1"
                    :rules="[requiredRule]"
                    disabled
                  >
                    <template #append-inner>
                      <v-icon size="18" color="success"
                        >mdi-check-circle</v-icon
                      >
                    </template>
                  </v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="fld-lbl"
                    >Consent Form Template
                    </label
                  >
                  <v-select
                    v-model="form.email.templateId"
                    :items="consentTemplates"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    placeholder="Select a template to send..."
                    class="mt-1"
                    :loading="loadingTemplates"
                    
                  />
                </v-col>

                <v-col cols="12">
                  <label class="fld-lbl"
                    >Subject <span class="req-star">*</span></label
                  >
                  <v-text-field
                    v-model="form.email.subject"
                    variant="outlined"
                    density="compact"
                    placeholder="Enter email subject"
                    class="mt-1"
                    :rules="[requiredRule]"
                  />
                </v-col>

                <v-col cols="12">
                  <label class="fld-lbl">Message</label>
                  <v-textarea
                    v-model="form.email.message"
                    variant="outlined"
                    density="compact"
                    placeholder="Enter your message"
                    class="mt-1"
                    rows="6"
                    :rules="[requiredRule]"
                  />
                </v-col>

                <v-col cols="12">
                  <label class="fld-lbl">Attachments (Optional)</label>
                  <div class="file-upload mt-1">
                    <input
                      type="file"
                      ref="emailFileInput"
                      multiple
                      accept=".pdf,.doc,.docx"
                      style="display: none"
                      @change="onEmailFileSelect"
                    />
                    <v-btn
                      variant="outlined"
                      size="small"
                      color="#6d4aff"
                      @click="emailFileInput?.click()"
                    >
                      <v-icon start size="16">mdi-paperclip</v-icon>
                      Attach Files
                    </v-btn>
                    <div
                      v-if="form.email.attachments.length"
                      class="attached-files mt-3"
                    >
                      <div
                        v-for="(file, idx) in form.email.attachments"
                        :key="idx"
                        class="attached-file"
                      >
                        <v-icon size="16" color="#6d4aff"
                          >mdi-file-pdf-box</v-icon
                        >
                        <span>{{ file.name }}</span>
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          @click="removeEmailAttachment(idx)"
                        >
                          <v-icon size="14">mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <!-- WhatsApp Tab -->
          <div v-if="activeTab === 'whatsapp'" class="tab-pane">
            <!-- WhatsApp Not Connected Alert -->
            <v-alert
              v-if="!whatsappConnected"
              type="warning"
              variant="tonal"
              class="mb-4"
              rounded="lg"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium mb-1">
                    WhatsApp Not Connected
                  </div>
                  <div class="text-caption">
                    Your WhatsApp Business account is not connected. Please
                    configure it in CRM.
                  </div>
                </div>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="#f59e0b"
                  href="/crm"
                >
                  Go to CRM
                </v-btn>
              </div>
            </v-alert>

            <v-card
              elevation="0"
              rounded="xl"
              class="pa-4"
              color="white"
              style="border: 1px solid #e5e7eb"
            >
              <v-row dense>
                <v-col cols="6">
                  <label class="fld-lbl"
                    >To <span class="req-star">*</span></label
                  >
                  <v-text-field
                    v-model="form.whatsapp.to"
                    variant="outlined"
                    density="compact"
                    placeholder="Patient phone number"
                    class="mt-1"
                    disabled
                  >
                    <template #append-inner>
                      <v-icon size="18" color="success"
                        >mdi-check-circle</v-icon
                      >
                    </template>
                  </v-text-field>
                </v-col>

                <v-col cols="6">
                  <label class="fld-lbl"
                    >Consent Form Template
                    <span class="req-star">*</span></label
                  >
                  <v-select
                    v-model="form.whatsapp.templateId"
                    :items="consentTemplates"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    placeholder="Select a template to send..."
                    class="mt-1"
                    :loading="loadingTemplates"
                    :rules="[requiredRule]"
                  />
                </v-col>

                <v-col cols="12">
                  <label class="fld-lbl"
                    >Message <span class="req-star">*</span></label
                  >
                  <v-textarea
                    v-model="form.whatsapp.message"
                    variant="outlined"
                    density="compact"
                    placeholder="Enter your message"
                    class="mt-1"
                    rows="5"
                    :rules="[requiredRule]"
                  />
                </v-col>

                <v-col cols="12">
                  <label class="fld-lbl">Attachments (Optional)</label>
                  <div class="file-upload mt-1">
                    <input
                      type="file"
                      ref="whatsappFileInput"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      style="display: none"
                      @change="onWhatsAppFileSelect"
                    />
                    <v-btn
                      variant="outlined"
                      size="small"
                      color="#6d4aff"
                      @click="whatsappFileInput?.click()"
                    >
                      <v-icon start size="16">mdi-paperclip</v-icon>
                      Attach Files
                    </v-btn>
                    <div
                      v-if="form.whatsapp.attachments.length"
                      class="attached-files mt-3"
                    >
                      <div
                        v-for="(file, idx) in form.whatsapp.attachments"
                        :key="idx"
                        class="attached-file"
                      >
                        <v-icon size="16" color="#25d366">mdi-whatsapp</v-icon>
                        <span>{{ file.name }}</span>
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          @click="removeWhatsAppAttachment(idx)"
                        >
                          <v-icon size="14">mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <!-- Automation Tab -->
          <div v-if="activeTab === 'automation'" class="tab-pane">
            <v-card
              elevation="0"
              rounded="xl"
              class="pa-8 text-center"
              color="white"
              style="border: 1px solid #e5e7eb"
            >
              <v-icon size="64" color="#cbd5e1">mdi-robot-outline</v-icon>
              <div
                class="text-h6 font-weight-medium mt-4 mb-2"
                style="color: #374151"
              >
                Coming Soon
              </div>
              <div class="text-caption text-grey">
                Automation scheduling will be available soon.
              </div>
            </v-card>
          </div>
        </v-card-text>
      </v-form>
      <v-divider />

      <!-- Footer actions -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="discardAndClose"
        >
          {{ isEditMode ? "Cancel" : "Discard" }}
        </v-btn>
        <v-btn
          v-if="!isEditMode"
          variant="tonal"
          color="#6d4aff"
          style="flex: 1; border-radius: 10px"
          @click="saveCorrespondence"
          :loading="saving"
        >
          <v-icon start size="18">mdi-content-save</v-icon>
          Save
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :style="{ flex: isEditMode ? 1 : 1, borderRadius: '10px' }"
          @click="isEditMode ? updateCorrespondence() : sendCorrespondence()"
          :disabled="!canSend"
          :loading="sending || updating"
        >
          <v-icon start size="18">{{
            isEditMode ? "mdi-content-save" : "mdi-send"
          }}</v-icon>
          {{ isEditMode ? "Update" : "Send" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useMainStore } from "@/stores/index";
import consentService from "@/services/consentService";
import crmService from "@/services/crmService";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  patient: {
    type: Object,
    required: true,
  },
  patientName: {
    type: String,
    default: "",
  },
  correspondence: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "correspondence-sent",
  "correspondence-updated",
]);

const mainStore = useMainStore();

const activeTab = ref("email");
const saving = ref(false);
const sending = ref(false);
const updating = ref(false);
const loadingTemplates = ref(false);
const whatsappConnected = ref(true);

const emailFileInput = ref(null);
const whatsappFileInput = ref(null);

const consentTemplates = ref([]);
const formRef = ref(null);
const correspondenceId = ref(null);

const requiredRule = (value) => !!value || "This field is required";
const form = ref({
  email: {
    to: props.patient?.email || "",
    subject: "",
    message: "",
    templateId: null,
    attachments: [],
  },
  whatsapp: {
    to: props.patient?.mobile || "",
    message: "",
    templateId: null,
    attachments: [],
  },
});
const canSend = computed(() => {
  if (activeTab.value === "whatsapp") {
    return whatsappConnected.value;
  }

  return true;
});

const isEditMode = computed(
  () => !!props.correspondence && !!correspondenceId.value,
);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const closeDialog = () => {
  emit("update:modelValue", false);
};

const discardAndClose = () => {
  resetForm();
  closeDialog();
};

const resetForm = () => {
  form.value = {
    email: {
      to: props.patient?.email || "",
      subject: "",
      message: "",
      templateId: null,
      attachments: [],
    },
    whatsapp: {
      to: props.patient?.mobile || "",
      message: "",
      templateId: null,
      attachments: [],
    },
  };
  activeTab.value = "email";
};

const uploadFileToUrl = async (file, url) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data?.code !== 0) {
    throw new Error(data?.message || "File upload failed");
  }

  return data.data || data;
};

const uploadAttachments = async (files, endpoint) => {
  const uploaded = [];
  for (const file of files) {
    uploaded.push(await uploadFileToUrl(file, endpoint));
  }
  return uploaded;
};

const onEmailFileSelect = (event) => {
  const files = Array.from(event.target.files || []);
  form.value.email.attachments.push(...files);
};

const onWhatsAppFileSelect = (event) => {
  const files = Array.from(event.target.files || []);
  form.value.whatsapp.attachments.push(...files);
};

const removeEmailAttachment = (index) => {
  form.value.email.attachments.splice(index, 1);
};

const removeWhatsAppAttachment = (index) => {
  form.value.whatsapp.attachments.splice(index, 1);
};

const loadConsentTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const response = await consentService.listTemplates();
    if (response?.code === 0) {
      consentTemplates.value = response.data || [];
    }
  } catch (error) {
    console.error("Failed to load consent templates:", error);
  } finally {
    loadingTemplates.value = false;
  }
};

const checkWhatsAppConnection = async () => {
  try {
    const response = await crmService.getDmConnectionStatus();
    whatsappConnected.value = !!response?.data?.whatsapp?.connected;
  } catch (error) {
    console.error("Failed to check WhatsApp connection:", error);
    whatsappConnected.value = false;
  }
};

const saveCorrespondence = async () => {
  saving.value = true;
  try {
    mainStore.setSnackbar({
      title: "Correspondence saved (draft functionality coming soon)",
      type: "info",
    });
  } catch (error) {
    mainStore.setSnackbar({
      title: "Failed to save correspondence",
      type: "error",
    });
  } finally {
    saving.value = false;
  }
};

const sendCorrespondence = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    mainStore.setSnackbar({
      title: "Please fill all required fields",
      type: "error",
    });
    return;
  }

  sending.value = true;

  try {
    if (activeTab.value === "email") {
      await sendEmailCorrespondence();
    } else if (activeTab.value === "whatsapp") {
      await sendWhatsAppCorrespondence();
    }
  } catch (error) {
    console.error("Failed to send correspondence:", error);

    mainStore.setSnackbar({
      title: error?.message || "Failed to send correspondence",
      type: "error",
    });
  } finally {
    sending.value = false;
  }
};

const sendEmailCorrespondence = async () => {
  const { to, subject, message, templateId, attachments } = form.value.email;

  try {
    const attachmentPayload = attachments.length
      ? await uploadAttachments(attachments, "/api/lead/uploadAttachment")
      : [];

    if (templateId) {
      const response = await fetch("/api/consent/documentSend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: props.patient.id,
          templateId,
          patientEmail: to,
          sendVia: "email",
          title: subject || undefined,
          notes: message || undefined,
          attachments: attachmentPayload,
        }),
      });

      const data = await response.json();
      if (data?.code === 0) {
        mainStore.setSnackbar({
          title: "Consent form sent successfully",
          type: "success",
        });
        emit("correspondence-sent", { type: "Email", templateId });
        resetForm();
        closeDialog();
        return;
      }
      throw new Error(data?.message || "Failed to send consent form");
    }

    const response = await fetch("/api/diary/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: props.patient.id,
        to,
        subject,
        html: message,
        attachments: attachmentPayload,
      }),
    });

    const data = await response.json();
    if (data?.code === 0) {
      mainStore.setSnackbar({
        title: "Email sent successfully",
        type: "success",
      });
      emit("correspondence-sent", { type: "Email" });
      resetForm();
      closeDialog();
    } else {
      throw new Error(data?.message || "Failed to send email");
    }
  } catch (error) {
    throw error;
  }
};

const sendWhatsAppCorrespondence = async () => {
  const { to, message, templateId, attachments } = form.value.whatsapp;

  try {
    const attachmentPayload = attachments.length
      ? await uploadAttachments(
          attachments,
          "/api/lead/whatsappUploadAttachment",
        )
      : [];

    if (templateId) {
      const response = await fetch("/api/consent/documentSend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: props.patient.id,
          templateId,
          patientPhone: to,
          sendVia: "whatsapp",
          notes: message || undefined,
          attachments: attachmentPayload,
        }),
      });

      const data = await response.json();
      if (data?.code === 0) {
        mainStore.setSnackbar({
          title: "Consent form sent via WhatsApp",
          type: "success",
        });
        emit("correspondence-sent", { type: "WhatsApp", templateId });
        resetForm();
        closeDialog();
        return;
      }
      throw new Error(
        data?.message || "Failed to send consent form via WhatsApp",
      );
    }

    const response = await fetch("/api/whapi/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: props.patient.id,
        phone: to,
        message,
        attachments: attachmentPayload,
      }),
    });

    const data = await response.json();
    if (data?.code === 0) {
      mainStore.setSnackbar({
        title: "WhatsApp message sent successfully",
        type: "success",
      });
      emit("correspondence-sent", { type: "WhatsApp" });
      resetForm();
      closeDialog();
    } else {
      throw new Error(data?.message || "Failed to send WhatsApp message");
    }
  } catch (error) {
    throw error;
  }
};

const updateCorrespondence = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    mainStore.setSnackbar({
      title: "Please fill all required fields",
      type: "error",
    });
    return;
  }

  updating.value = true;

  try {
    const payload = {
      id: correspondenceId.value,
      action: "update",
    };

    if (activeTab.value === "email") {
      const { subject, message } = form.value.email;
      payload.subject = subject;
      payload.message = message;
    } else if (activeTab.value === "whatsapp") {
      const { message } = form.value.whatsapp;
      payload.message = message;
    }

    const response = await fetch("/api/diary/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data?.code === 0) {
      mainStore.setSnackbar({
        title: "Correspondence updated successfully",
        type: "success",
      });
      emit("correspondence-updated", data.data);
      resetForm();
      closeDialog();
    } else {
      throw new Error(data?.message || "Failed to update correspondence");
    }
  } catch (error) {
    console.error("Failed to update correspondence:", error);
    mainStore.setSnackbar({
      title: error?.message || "Failed to update correspondence",
      type: "error",
    });
  } finally {
    updating.value = false;
  }
};

onMounted(() => {
  loadConsentTemplates();
  checkWhatsAppConnection();
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.correspondence && props.correspondence.id) {
        // Edit mode
        correspondenceId.value = props.correspondence.id;
        const type = props.correspondence.type?.toLowerCase() || "email";

        if (type === "email" || type === "consent form") {
          activeTab.value = "email";
          form.value.email = {
            to: props.correspondence.recipient || props.patient?.email || "",
            subject: props.correspondence.subject || "",
            message: props.correspondence.content || "",
            templateId: props.correspondence.metadata?.templateId || null,
            attachments: [],
          };
        } else if (type === "whatsapp") {
          activeTab.value = "whatsapp";
          form.value.whatsapp = {
            to: props.correspondence.recipient || props.patient?.mobile || "",
            message: props.correspondence.content || "",
            templateId: props.correspondence.metadata?.templateId || null,
            attachments: [],
          };
        }
      } else {
        // New mode
        correspondenceId.value = null;
        resetForm();
        form.value.email.to = props.patient?.email || "";
        form.value.whatsapp.to = props.patient?.mobile || "";
      }
    }
  },
);
</script>

<style scoped>
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  display: block;
}

.req-star {
  color: #ef4444;
}

.tab-pane {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-upload {
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.file-upload:hover {
  border-color: #6d4aff;
  background: #f5f3ff;
}

.attached-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attached-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 13px;

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.correspondence-tabs {
  background: white;
}

:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: normal;
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

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
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

.justify-space-between {
  justify-content: space-between;
}

.text-caption {
  font-size: 12px;
  color: #6b7280;
}

.text-grey {
  color: #6b7280;
}
</style>
