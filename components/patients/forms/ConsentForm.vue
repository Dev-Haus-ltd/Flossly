<template>
  <div class="consent-forms-container">
    <!-- Header with Create Button -->
    <div class="forms-header">
      <div class="header-left">
        <div class="header-badge">
          <v-icon size="24" color="primary">mdi-file-document-multiple</v-icon>
        </div>
        <div class="form-header-title">
          <h2>{{ sendOnly ? "Send Consent Form" : "Consent Forms" }}</h2>
          <p>
            {{
              sendOnly
                ? "Select a consent form to preview and send to the patient"
                : "Manage and send consent forms to patients"
            }}
          </p>
        </div>
      </div>
      <div v-if="!sendOnly" class="header-actions">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          prepend-icon="mdi-plus-circle"
          @click="openCreateDialog"
          class="create-btn"
        >
          Create Form
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-content">
        <div class="loading-spinner">
          <v-progress-circular indeterminate size="48" color="primary" />
        </div>
        <p class="loading-text">Loading consent forms...</p>
      </div>
    </div>

    <!-- Error State -->
    <v-alert
      v-if="error && !loading"
      type="error"
      variant="tonal"
      class="error-alert"
      closable
      @click:close="error = null"
    >
      <div class="alert-content">
        <span>{{ error }}</span>
        <v-btn
          size="small"
          variant="text"
          @click="loadConsentForms"
          class="retry-btn"
        >
          Retry
        </v-btn>
      </div>
    </v-alert>

    <!-- Empty State -->
    <div
      v-if="!loading && consentForms.length === 0 && !error"
      class="empty-state"
    >
      <div class="empty-state-content">
        <div class="empty-icon-wrapper">
          <v-icon size="80" color="grey-lighten-2"
            >mdi-file-document-outline</v-icon
          >
        </div>
        <h3 class="empty-state-title">No Consent Forms Available</h3>
        <p class="empty-state-text">
          Create a new consent form to get started.
        </p>
        <v-btn
          v-if="!sendOnly"
          color="primary"
          variant="flat"
          size="large"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
          class="empty-state-btn"
        >
          Create Your First Form
        </v-btn>
      </div>
    </div>

    <!-- Forms Grid -->
    <div v-else-if="!loading" class="forms-grid">
      <div
        v-for="form in consentForms"
        :key="form.id"
        class="form-card"
        :class="{ 'form-card--selected': selectedFormId === form.id }"
      >
        <div v-if="!sendOnly" class="form-actions" @click.stop>
          <v-tooltip text="Edit" location="top">
            <template #activator="{ props }">
              <span
                v-bind="props"
                style="display: inline-flex; cursor: pointer"
                @click="openEditDialog(form)"
              >
                <img :src="editIcon" alt="edit" width="18" height="18" />
              </span>
            </template>
          </v-tooltip>

          <!-- <v-tooltip text="Delete Form" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                size="small"
                variant="text"
                class="action-btn delete-btn"
                @click="openDeleteConfirm(form)"
              >
                <v-icon size="18">mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-tooltip> -->
        </div>
        <div class="card-content" @click="selectForm(form)">
          <div class="form-icon-wrapper">
            <div class="form-icon">
              <v-icon size="40" color="primary"
                >mdi-file-document-outline</v-icon
              >
            </div>
          </div>
          <div class="form-info">
            <h3 class="form-title">{{ form.name }}</h3>
            <div v-if="form.category" class="form-category">
              <v-icon size="12" class="category-icon">mdi-tag-outline</v-icon>
              <span>{{ form.category }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <ConsentFormDetail
      v-model="showDetailDialog"
      :form="selectedFormForDetail"
      :patient-id="patientId"
      :patient="props?.patient"
      @close="closeDetail"
      @send="openSendDialog"
    />

    <!-- Send Form Dialog -->
    <ConsentFormSender
       v-model="showSendDialog"
  :form="selectedFormForSend"
  :patient="props?.patient"
  @close="closeSendDialog"
  
  @success="handleFormSent"
    />

    <!-- Create/Edit Dialog - Unified Sleek Design -->
    <v-dialog
      :model-value="showCreateDialog || showEditDialog"
      @update:model-value="closeAllDialogs"
      max-width="680"
      scrollable
      :persistent="isCreating || isUpdating"
    >
      <v-card rounded="xl" elevation="4" style="overflow: hidden">
        <!-- Header -->
        <v-toolbar flat color="white" height="56">
          <v-toolbar-title class="title-text pl-2">
            {{ isEditMode ? "Edit Consent Form" : "Create New Consent Form" }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            icon
            variant="text"
            size="small"
            @click="closeAllDialogs"
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
          <!-- Summary chip -->
          <div class="summary-row mb-4">
            <div class="summary-dot"></div>
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ isEditMode ? "Edit Consent Form" : "New Consent Form" }}
              </div>
              <div class="text-caption text-grey">
                {{
                  isEditMode
                    ? "Update the form details below"
                    : "Fill in the details below to create a new form template"
                }}
              </div>
            </div>
          </div>

          <v-card elevation="0" rounded="lg" class="pa-4" color="white">
            <v-row dense>
              <!-- Form Name -->
              <v-col cols="12">
                <label class="fld-lbl">
                  Form Name <span class="req-star">*</span>
                </label>
                <v-text-field
                  v-model="formData.name"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  placeholder="e.g., Aligner Treatment Consent"
                  :error="!!errors.name"
                  :error-messages="errors.name ? [errors.name] : []"
                  hide-details="auto"
                  @input="clearError('name')"
                />
              </v-col>

              <!-- Category -->
              <v-col cols="12" sm="6">
                <label class="fld-lbl">Category</label>
                <v-text-field
                  v-model="formData.category"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  placeholder="e.g., Treatment Consent, Privacy"
                  :error="!!errors.category"
                  :error-messages="errors.category ? [errors.category] : []"
                  hide-details="auto"
                  @input="clearError('category')"
                />
              </v-col>

              <!-- Active Status -->
              <v-col cols="12" sm="6">
                <label class="fld-lbl">Status</label>
                <v-select
                  v-model="formData.isActive"
                  :items="statusOptions"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  item-title="title"
                  item-value="value"
                  :error="!!errors.isActive"
                  :error-messages="errors.isActive ? [errors.isActive] : []"
                  hide-details="auto"
                />
              </v-col>

              <!-- Description -->
              <v-col cols="12">
                <label class="fld-lbl">Description</label>
                <v-textarea
                  v-model="formData.description"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  placeholder="Brief description of this form..."
                  rows="2"
                  hide-details="auto"
                />
              </v-col>

              <!-- HTML Content -->
              <v-col cols="12">
                <label class="fld-lbl">
                  Form Content <span class="req-star">*</span>
                </label>
                <v-textarea
                  v-model="formData.htmlContent"
                  variant="outlined"
                  density="compact"
                  class="mt-1 code-textarea"
                  placeholder="Paste your form HTML here..."
                  rows="6"
                  :error="!!errors.htmlContent"
                  :error-messages="
                    errors.htmlContent ? [errors.htmlContent] : []
                  "
                  hide-details="auto"
                  @input="clearError('htmlContent')"
                />
              </v-col>

              <!-- Signature Coordinates Section -->
              <!-- NEW: Add SignaturePlacementEditor -->
              <v-col cols="12">
                <div class="signature-placement-editor-section">
                  <div class="section-header mb-3">
                    <v-icon size="18" color="primary"
                      >mdi-cursor-default-click</v-icon
                    >
                    <span class="section-title">Signature Placement</span>
                  </div>
                  <p class="section-hint mb-3">
                    Drag the signature box to where you want patients to sign.
                    The system will automatically save the position.
                  </p>

                  <SignaturePlacementEditor
                    v-model="formData.signatureCoordinates"
                    :html-content="formData.htmlContent"
                    mode="edit"
                    :editor-height="500"
                    @change="handleSignatureChange"
                  />
                </div>
              </v-col>

              <!-- Tips Section -->
              <!-- <v-col cols="12">
                <div class="tips-section">
                  <div class="tips-header">
                    <v-icon size="16" color="info">mdi-lightbulb</v-icon>
                    <span class="tips-title">Pro Tips</span>
                  </div>
                  <ul class="tips-list">
                    <li>
                      Form Name and HTML Content are <strong>required</strong>
                    </li>
                    <li>
                      Set signature coordinates where signatures should appear
                    </li>
                    <li>Use categories to organize your forms</li>
                    <li>
                      <strong>Finding coordinates:</strong> Open your PDF and
                      measure position in pixels from top-left
                    </li>
                  </ul>
                </div>
              </v-col> -->
            </v-row>
          </v-card>
        </v-card-text>

        <v-divider />

        <!-- Footer actions -->
        <v-card-actions class="pa-4" style="gap: 12px">
          <v-btn
            variant="outlined"
            color="#6b7280"
            style="flex: 1; border-radius: 10px"
            @click="closeAllDialogs"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            style="flex: 1; border-radius: 10px"
            @click="saveForm"
            :loading="isCreating || isUpdating"
            :disabled="isCreating || isUpdating"
          >
            {{ isEditMode ? "Save Changes" : "Create Form" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useConsentStore } from "@/stores/consent";
import { useMainStore } from "@/stores/index";
import ConsentFormDetail from "./ConsentFormDetail.vue";
import ConsentFormSender from "./ConsentFormSender.vue";
import SignaturePlacementEditor from "../../consent/SignaturePlacementEditor.vue";
import editIcon from "@/assets/icons/edit.svg";

const props = defineProps({
  patientId: {
    type: Number,
    default: null,
  },
  patient: {
    type: Object,
    // default: null,
  },
  sendOnly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
// console.log("props.patient in ConsentForm.vue", props.patient);
const emit = defineEmits(["form-selected", "form-sent", "error"]);

const consentStore = useConsentStore();
const mainStore = useMainStore();

// State
const consentForms = ref([]);
const selectedForm = ref(null);
const selectedFormForDetail = ref(null);
const selectedFormForSend = ref(null);
const selectedFormId = ref(null);
const loading = ref(false);
const error = ref(null);
const showDetailDialog = ref(false);
const showSendDialog = ref(false);

// Form Dialog State
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const formToEdit = ref(null);

// Form Data
const formData = ref({
  name: "",
  category: "",
  description: "",
  htmlContent: "",
  isActive: true,
  signatureCoordinates: {
    x: 100,
    y: 100,
    width: 150,
    height: 50,
    page: 1,
  },
});

// Errors
const errors = ref({
  name: "",
  category: "",
  htmlContent: "",
  isActive: "",
});

// Options
const statusOptions = [
  { title: "Active", value: true },
  { title: "Inactive", value: false },
];

// Computed
const isEditMode = computed(() => showEditDialog.value && !!formToEdit.value);
const sendOnly = computed(() => props.sendOnly);

// Methods
const loadConsentForms = async () => {
  loading.value = true;
  error.value = null;

  try {
    await consentStore.fetchTemplates();
    consentForms.value = consentStore.templates || [];

    if (consentForms.value.length === 0) {
      error.value =
        "No consent form templates found. Please contact your administrator.";
    }
  } catch (err) {
    console.error("Error loading consent forms:", err);
    error.value =
      err.message || "Failed to load consent forms. Please try again.";
    emit("error", error.value);
  } finally {
    loading.value = false;
  }
};

const selectForm = (form) => {
  if (props.disabled || loading.value) return;

  selectedFormId.value = form.id;
  selectedForm.value = form;
  selectedFormForDetail.value = form;
  emit("form-selected", form);

  showDetailDialog.value = true;
};

const openSendDialog = (form) => {
  selectedFormForSend.value = form;
  showDetailDialog.value = false;
  setTimeout(() => {
    showSendDialog.value = true;
  }, 100);
};

const closeDetail = () => {
  showDetailDialog.value = false;
  setTimeout(() => {
    if (!showSendDialog.value) {
      selectedFormForDetail.value = null;
      selectedFormId.value = null;
      selectedForm.value = null;
    }
  }, 300);
};

const closeSendDialog = () => {
  showSendDialog.value = false;
  setTimeout(() => {
    selectedFormForSend.value = null;
  }, 300);
};

const handleFormSent = async (data) => {
  mainStore.setSnackbar({
    title: "Form sent successfully to patient!",
    type: "success",
  });
  emit("form-sent", data);

  if (props.patientId) {
    await consentStore.fetchDocuments(props.patientId);
  }

  setTimeout(() => {
    closeSendDialog();
  }, 1500);
};

// Dialog Methods
const openCreateDialog = () => {
  resetForm();
  showCreateDialog.value = true;
  showEditDialog.value = false;
  formToEdit.value = null;
};

const openEditDialog = (form) => {
  formToEdit.value = form;
  formData.value = {
    id: form.id,
    name: form.name,
    category: form.category || "",
    description: form.description || "",
    htmlContent: form.htmlContent || "",
    isActive: form.isActive !== undefined ? form.isActive : true,
    signatureCoordinates: form.signatureCoordinates || {
      x: 100,
      y: 100,
      width: 150,
      height: 50,
      page: 1,
    },
  };
  resetErrors();
  showEditDialog.value = true;
  showCreateDialog.value = false;
};

const closeAllDialogs = () => {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  formToEdit.value = null;
  resetForm();
  resetErrors();
};

const resetForm = () => {
  formData.value = {
    name: "",
    category: "",
    description: "",
    htmlContent: "",
    isActive: true,
    signatureCoordinates: {
      x: 100,
      y: 100,
      width: 150,
      height: 50,
      page: 1,
    },
  };
};

const resetErrors = () => {
  errors.value = {
    name: "",
    category: "",
    htmlContent: "",
    isActive: "",
  };
};

const clearError = (field) => {
  errors.value[field] = "";
};

const validateForm = () => {
  let isValid = true;

  if (!formData.value.name || formData.value.name.trim() === "") {
    errors.value.name = "Form name is required";
    isValid = false;
  }

  if (!formData.value.htmlContent || formData.value.htmlContent.trim() === "") {
    errors.value.htmlContent = "Form content (HTML) is required";
    isValid = false;
  }

  const coords = formData.value.signatureCoordinates;
  if (!coords.x || coords.x < 0 || coords.x > 800) {
    mainStore.setSnackbar({
      title: "Signature X position must be between 0 and 800 pixels",
      type: "warning",
    });
    isValid = false;
  }
  if (!coords.y || coords.y < 0 || coords.y > 1000) {
    mainStore.setSnackbar({
      title: "Signature Y position must be between 0 and 1000 pixels",
      type: "warning",
    });
    isValid = false;
  }
  if (!coords.width || coords.width < 50 || coords.width > 300) {
    mainStore.setSnackbar({
      title: "Signature width must be between 50 and 300 pixels",
      type: "warning",
    });
    isValid = false;
  }
  if (!coords.height || coords.height < 30 || coords.height > 150) {
    mainStore.setSnackbar({
      message: "Signature height must be between 30 and 150 pixels",
      color: "warning",
    });
    isValid = false;
  }
  if (!coords.page || coords.page < 1) {
    mainStore.setSnackbar({
      message: "Page number must be 1 or higher",
      color: "warning",
    });
    isValid = false;
  }

  return isValid;
};

const saveForm = async () => {
  if (!validateForm()) {
    return;
  }

  if (isEditMode.value) {
    await updateForm();
  } else {
    await createForm();
  }
};

const createForm = async () => {
  isCreating.value = true;

  try {
    const templateData = {
      name: formData.value.name.trim(),
      category: formData.value.category.trim() || "General",
      description: formData.value.description.trim(),
      htmlContent: formData.value.htmlContent.trim(),
      isActive: formData.value.isActive,
      signatureCoordinates: {
        x: Number(formData.value.signatureCoordinates.x),
        y: Number(formData.value.signatureCoordinates.y),
        width: Number(formData.value.signatureCoordinates.width),
        height: Number(formData.value.signatureCoordinates.height),
        page: Number(formData.value.signatureCoordinates.page),
      },
    };

    await consentStore.createTemplate(templateData);
    await loadConsentForms();

    closeAllDialogs();
    mainStore.setSnackbar({
      message: "Consent form created successfully!",
      color: "success",
    });
  } catch (err) {
    console.error("Error creating form:", err);
    mainStore.setSnackbar({
      message: err.message || "Failed to create consent form",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
};

const updateForm = async () => {
  isUpdating.value = true;

  try {
    const templateData = {
      id: formData.value.id, // ✅ Make sure id is included
      name: formData.value.name.trim(),
      category: formData.value.category.trim() || "General",
      description: formData.value.description.trim(),
      htmlContent: formData.value.htmlContent.trim(),
      isActive: formData.value.isActive,
      signatureCoordinates: {
        x: Number(formData.value.signatureCoordinates.x),
        y: Number(formData.value.signatureCoordinates.y),
        width: Number(formData.value.signatureCoordinates.width),
        height: Number(formData.value.signatureCoordinates.height),
        page: Number(formData.value.signatureCoordinates.page),
      },
    };

    // ✅ Call with single object (not two arguments)
    await consentStore.updateTemplate(templateData);
    await loadConsentForms();

    closeAllDialogs();
    mainStore.setSnackbar({
      message: "Consent form updated successfully!",
      color: "success",
    });
  } catch (err) {
    console.error("Error updating form:", err);
    mainStore.setSnackbar({
      message: err.message || "Failed to update consent form",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadConsentForms();
});

watch(
  () => props.patientId,
  async (newPatientId) => {
    if (newPatientId) {
      await consentStore.fetchDocuments(newPatientId);
    }
  },
);

defineExpose({
  loadConsentForms,
  selectedForm,
});
</script>

<style scoped lang="scss">
.consent-forms-container {
  width: 100%;
  padding: 12px;
}

// Header Styles
.forms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px 32px;
  background: white;
  border-radius: 20px;
  border: 1px solid #e5e7eb;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .header-badge {
      width: 56px;
      height: 56px;
      background: linear-gradient(
        135deg,
        rgba(0, 97, 251, 0.1) 0%,
        rgba(0, 97, 251, 0.05) 100%
      );
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-header-title {
      h2 {
        margin: 0 0 6px 0;
        color: #111827;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }

      p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }
    }
  }

  .create-btn {
    border-radius: 10px;
    padding: 0 10px;
    font-weight: 500;
  }
}

// Forms Grid
.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.form-card {
  position: relative;
  background: white;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .card-content {
    padding: 24px 17px 17px;
    cursor: pointer;

    .form-icon-wrapper {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;

      .form-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(
          135deg,
          rgba(0, 97, 251, 0.1) 0%,
          rgba(0, 97, 251, 0.05) 100%
        );
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
    }

    .form-info {
      text-align: center;

      .form-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 8px 0;
        line-height: 1.4;
      }

      .form-category {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: rgba(0, 97, 251, 0.08);
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        color: #0061fb;
      }
    }
  }

  .form-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
    padding: 0;

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      &.edit-btn:hover {
        background: rgba(0, 97, 251, 0.1);
        :deep(.v-icon) {
          color: #0061fb !important;
        }
      }

      &.delete-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        :deep(.v-icon) {
          color: #ef4444 !important;
        }
      }
    }
  }

  &:hover {
    border-color: #d1d5db;
  }

  &--selected {
    border-color: #0061fb;
    background: #f8faff;
    box-shadow: 0 8px 20px rgba(0, 97, 251, 0.15);
  }
}

// Dialog Styles
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.req-star {
  color: #ef4444;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
}

.summary-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0061fb, #00c6fb);
  flex-shrink: 0;
}

.coordinates-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .coordinates-title {
    font-weight: 600;
    font-size: 13px;
    color: #374151;
  }

  .required-badge {
    font-size: 10px;
    padding: 2px 8px;
    background: rgba(0, 97, 251, 0.1);
    border-radius: 12px;
    color: #0061fb;
    font-weight: 500;
  }
}

.coordinates-hint {
  font-size: 12px;
  color: #6b7280;
}

.coord-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  display: block;
  margin-bottom: 6px;
}

.tips-section {
  background: rgba(0, 97, 251, 0.05);
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;

  .tips-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .tips-title {
      font-weight: 600;
      font-size: 12px;
      color: #0061fb;
    }
  }

  .tips-list {
    margin: 0;
    padding-left: 20px;
    font-size: 11px;
    color: #4b5563;
    line-height: 1.5;

    li {
      margin: 4px 0;
    }
  }
}

.code-textarea {
  :deep(textarea) {
    font-family: "Monaco", "Courier New", monospace;
    font-size: 12px;
  }
}

// Delete Dialog
.delete-dialog-header {
  text-align: center;
  padding: 32px 24px 24px !important;

  .delete-icon-wrapper {
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
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.section-hint {
  font-size: 12px;
  color: #6b7280;
}
.delete-dialog-body {
  text-align: center;
  padding: 0 24px 24px !important;

  p {
    color: #6b7280;
    font-size: 14px;
    margin: 0 0 12px 0;

    strong {
      color: #111827;
    }
  }

  .delete-warning {
    background: rgba(239, 68, 68, 0.05);
    padding: 10px 12px;
    border-radius: 10px;
    color: #ef4444;
    font-size: 12px;
    margin-bottom: 0;
  }
}

.delete-dialog-actions {
  padding: 20px 24px !important;
  gap: 12px;
}

// Loading & Empty States
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .loading-content {
    text-align: center;

    .loading-spinner {
      margin-bottom: 20px;
    }

    .loading-text {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;

  .empty-state-content {
    text-align: center;
    max-width: 400px;

    .empty-icon-wrapper {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 8px 0;
    }

    .empty-state-text {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 24px 0;
    }
  }
}

.error-alert {
  margin-bottom: 24px;
  border-radius: 16px;
}

.success-snackbar {
  :deep(.v-snackbar__content) {
    padding: 12px 20px;
  }

  .snackbar-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .consent-forms-container {
    padding: 16px;
  }

  .forms-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;

    .header-left {
      width: 100%;
    }

    .create-btn {
      width: 100%;
    }
  }

  .forms-grid {
    grid-template-columns: 1fr;
  }
}

:deep(.v-field) {
  border-radius: 8px !important;
}

:deep(.v-messages) {
  font-size: 11px;
  margin-top: 4px;
}
</style>
