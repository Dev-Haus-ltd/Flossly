import { defineStore, acceptHMRUpdate } from "pinia";
import { useMainStore } from "./index";

export const useConsentStore = defineStore("consent", {
  state: () => ({
    // Templates
    templates: [],
    selectedTemplate: null,
    templatesLoading: false,

    // Documents
    documents: [],
    selectedDocument: null,
    documentsLoading: false,
    currentPatientId: null,

    // Signing
    documentToSign: null,
    signatureData: null,
    signingInProgress: false,

    // Audit trail
    auditTrail: [],
    auditLoading: false,

    // UI State
    templateDialogOpen: false,
    documentDialogOpen: false,
    previewUrl: null,
  }),

  getters: {
    templatesByCategory: (state) => {
      const grouped = {};
      state.templates.forEach((template) => {
        const category = template.category || "General";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(template);
      });
      return grouped;
    },

    signedDocumentsCount: (state) => {
      return state.documents.filter((doc) => doc.status === "signed").length;
    },

    pendingDocumentsCount: (state) => {
      return state.documents.filter(
        (doc) => doc.status === "sent" || doc.status === "viewed",
      ).length;
    },

    templateInUse: (state) => (templateId) => {
      return state.documents.some((doc) => doc.templateId === templateId);
    },
  },

  actions: {
    async fetchTemplates() {
      this.templatesLoading = true;
      try {
        const response = await $fetch("/api/consent/templatesList", {
          method: "GET",
        });

        console.log("API Response:", response); // Add this for debugging

        // Check different response structures
        if (response && response.code === 0) {
          // If data is directly in response.data
          if (response.data && Array.isArray(response.data)) {
            this.templates = response.data;
            console.log("Templates set from response.data:", this.templates);
          }
          // If response itself is the array
          else if (Array.isArray(response)) {
            this.templates = response;
            console.log("Templates set from response array:", this.templates);
          }
          // If data is in response.data.data (nested)
          else if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
            this.templates = response.data.data;
            console.log(
              "Templates set from response.data.data:",
              this.templates,
            );
          } else {
            console.warn("Unexpected response structure:", response);
            this.templates = [];
          }
        } else if (
          response &&
          response.success === true &&
          Array.isArray(response.data)
        ) {
          // Alternative response format
          this.templates = response.data;
        } else {
          console.error(
            "API returned error code:",
            response?.code,
            response?.message,
          );
          this.templates = [];
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to fetch templates",
          color: "error",
        });
        this.templates = [];
      } finally {
        this.templatesLoading = false;
      }
    },

    async getTemplate(templateId) {
      try {
        const response = await $fetch(
          "/api/consent/templateGet",
          {
            method: "GET",
            query: { id: templateId },
          },
        );

        if (response && response.code === 0) {
          this.selectedTemplate = response.data;
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to fetch template');
        }
      } catch (error) {
        console.error("Error fetching template:", error);
        throw error;
      }
    },

    async createTemplate(templateData) {
      try {
        const response = await $fetch(
          "/api/consent/templateCreate",
          {
            method: "POST",
            body: templateData,
          },
        );

        if (response && response.code === 0) {
          this.templates.push(response.data);
          useMainStore().setSnackbar({
            message: "Template created successfully",
            color: "success",
          });
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to create template');
        }
      } catch (error) {
        console.error("Error creating template:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to create template",
          color: "error",
        });
        throw error;
      }
    },

    async updateTemplate(templateData) {
      try {
        const response = await $fetch(
          "/api/consent/templateUpdate",
          {
            method: "POST",
            body: templateData,
          },
        );

        if (response && response.code === 0) {
          const index = this.templates.findIndex(
            (t) => t.id === templateData.id,
          );
          if (index !== -1) {
            this.templates[index] = response.data;
          }
          useMainStore().setSnackbar({
            message: "Template updated successfully",
            color: "success",
          });
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to update template');
        }
      } catch (error) {
        console.error("Error updating template:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to update template",
          color: "error",
        });
        throw error;
      }
    },

    async deleteTemplate(templateId) {
      try {
        const response = await $fetch(
          "/api/consent/templateDelete",
          {
            method: "POST",
            body: { id: templateId },
          },
        );

        if (response && response.code === 0) {
          this.templates = this.templates.filter((t) => t.id !== templateId);
          useMainStore().setSnackbar({
            message: "Template deleted successfully",
            color: "success",
          });
          return true;
        } else {
          throw new Error(response?.message || 'Failed to delete template');
        }
      } catch (error) {
        console.error("Error deleting template:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to delete template",
          color: "error",
        });
        throw error;
      }
    },

    async fetchDocuments(patientId) {
      this.documentsLoading = true;
      this.currentPatientId = patientId;

      try {
        const response = await $fetch(
          "/api/consent/documentsList",
          {
            method: "GET",
            query: { patientId },
          },
        );

        if (response && response.code === 0) {
          this.documents = response.data || [];
        } else {
          console.error('Failed to fetch documents:', response?.message);
          this.documents = [];
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to fetch documents",
          color: "error",
        });
        this.documents = [];
      } finally {
        this.documentsLoading = false;
      }
    },

    async sendDocument(documentData) {
      try {
        const response = await $fetch(
          "/api/consent/documentSend",
          {
            method: "POST",
            body: documentData,
          },
        );

        if (response && response.code === 0) {
          await this.fetchDocuments(documentData.patientId);
          useMainStore().setSnackbar({
            message: "Consent form sent successfully",
            color: "success",
          });
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to send document');
        }
      } catch (error) {
        console.error("Error sending document:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to send document",
          color: "error",
        });
        throw error;
      }
    },

    async getDocumentForSigning(token) {
      try {
        const response = await $fetch(
          "/api/consent/documentGetForSigning",
          {
            method: "GET",
            query: { token },
          },
        );

        if (response && response.code === 0) {
          this.documentToSign = response.data;
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to fetch document for signing');
        }
      } catch (error) {
        console.error("Error fetching document for signing:", error);
        throw error;
      }
    },

    // Fixed: Submit signed document with token in body
    async submitSignedDocument(token, signatureData) {
  this.signingInProgress = true;
  try {
    const response = await $fetch("/api/consent/documentSubmitSigned", {
      method: "POST",
      body: {
        token: token,
        signature: signatureData,  // Make sure key is 'signature'
        patientName: signatureData.patientName || this.documentToSign?.patientSignatureName || "",
      },
    });

    if (response && response.code === 0) {
      this.documentToSign = null;
      this.signatureData = null;
      useMainStore().setSnackbar({
        message: "Document signed successfully",
        color: "success",
      });
      return response.data;
    } else {
      throw new Error(response?.message || 'Failed to sign document');
    }
  } catch (error) {
    console.error("Error submitting signed document:", error);
    throw error;
  } finally {
    this.signingInProgress = false;
  }
},

    async getSignedDocument(documentId) {
      try {
        const response = await $fetch(
          "/api/consent/documentGetSigned",
          {
            method: "GET",
            query: { id: documentId },
          },
        );

        if (response && response.code === 0) {
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to fetch signed document');
        }
      } catch (error) {
        console.error("Error fetching signed document:", error);
        throw error;
      }
    },

    async fetchAuditTrail(documentId) {
      this.auditLoading = true;

      try {
        const response = await $fetch("/api/consent/auditTrail", {
          method: "GET",
          query: { documentId },
        });

        if (response && response.code === 0) {
          this.auditTrail = response.data || [];
        } else {
          console.error('Failed to fetch audit trail:', response?.message);
          this.auditTrail = [];
        }
      } catch (error) {
        console.error("Error fetching audit trail:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to fetch audit trail",
          color: "error",
        });
        this.auditTrail = [];
      } finally {
        this.auditLoading = false;
      }
    },

    async voidDocument(documentId, reason) {
      try {
        const response = await $fetch(
          "/api/consent/documentVoid",
          {
            method: "POST",
            body: { id: documentId, reason },
          },
        );

        if (response && response.code === 0) {
          const index = this.documents.findIndex((d) => d.id === documentId);
          if (index !== -1) {
            this.documents[index].status = "voided";
          }
          useMainStore().setSnackbar({
            message: "Document voided successfully",
            color: "success",
          });
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to void document');
        }
      } catch (error) {
        console.error("Error voiding document:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to void document",
          color: "error",
        });
        throw error;
      }
    },

    // For FormData submission (with file upload)
    async submitSignedConsent(formData) {
      this.signingInProgress = true;
      try {
        const response = await $fetch(
          "/api/consent/documentSubmitSigned",
          {
            method: "POST",
            body: formData,
          },
        );

        if (response && response.code === 0) {
          this.documentToSign = null;
          this.signatureData = null;
          useMainStore().setSnackbar({
            message: "Consent form signed successfully",
            color: "success",
          });
          return response.data;
        } else {
          throw new Error(response?.message || 'Failed to submit signed consent');
        }
      } catch (error) {
        console.error("Error submitting signed consent:", error);
        useMainStore().setSnackbar({
          message: error.message || "Failed to submit signed consent form",
          color: "error",
        });
        throw error;
      }
    },

    // WARNING: This endpoint doesn't exist - either implement or remove
    async updateDocumentStatus(token, status) {
      console.warn("updateDocumentStatus endpoint not implemented yet");
      // Uncomment only after adding the endpoint
      try {
        await $fetch("/api/consent/documentUpdateStatus", {
          method: "POST",
          body: { token, status },
        });
      } catch (error) {
        console.error("Error updating document status:", error);
      }
    },

    setSignatureData(data) {
      this.signatureData = data;
    },

    clearState() {
      this.templates = [];
      this.documents = [];
      this.selectedTemplate = null;
      this.selectedDocument = null;
      this.documentToSign = null;
      this.signatureData = null;
      this.auditTrail = [];
      this.previewUrl = null;
    },
  },
});

// HMR support - fixed import
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConsentStore, import.meta.hot));
}
