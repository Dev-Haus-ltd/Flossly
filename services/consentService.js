// services/consentService.js
import { Post, Get, PostFormData } from "./apiWrapper";

export default {
  // Template Management
  listTemplates() {
    return new Promise((resolve, reject) => {
      Get("/consent/templatesList")
        .then(resolve)
        .catch(reject);
    });
  },

  getTemplate(id) {
    return new Promise((resolve, reject) => {
      Get(`/consent/templateGet?id=${encodeURIComponent(id)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  createTemplate(payload) {
    return new Promise((resolve, reject) => {
      Post("/consent/templateCreate", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  updateTemplate(payload) {
    return new Promise((resolve, reject) => {
      Post("/consent/templateUpdate", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  deleteTemplate(id) {
    return new Promise((resolve, reject) => {
      Post("/consent/templateDelete", { id })
        .then(resolve)
        .catch(reject);
    });
  },

  // Document Management
  listDocuments(patientId) {
    const q = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
    return new Promise((resolve, reject) => {
      Get(`/consent/documentsList${q}`)
        .then(resolve)
        .catch(reject);
    });
  },

  getDocument(id) {
    return new Promise((resolve, reject) => {
      Get(`/consent/documentGet?id=${encodeURIComponent(id)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  sendDocument(payload) {
    return new Promise((resolve, reject) => {
      Post("/consent/documentSend", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  getDocumentForSigning(token) {
    return new Promise((resolve, reject) => {
      Get(`/consent/documentGetForSigning?token=${encodeURIComponent(token)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  submitSignedDocument(payload) {
    return new Promise((resolve, reject) => {
      Post("/consent/documentSubmitSigned", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  getSignedDocument(id) {
    return new Promise((resolve, reject) => {
      Get(`/consent/documentGetSigned?id=${encodeURIComponent(id)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  voidDocument(payload) {
    return new Promise((resolve, reject) => {
      Post("/consent/documentVoid", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  // Audit Trail
  getAuditTrail(documentId) {
    return new Promise((resolve, reject) => {
      Get(`/consent/auditTrail?documentId=${encodeURIComponent(documentId)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  // Form Data Upload (for file uploads)
  submitSignedConsent(formData) {
    return new Promise((resolve, reject) => {
      PostFormData("/consent/documentSubmitSigned", formData)
        .then(resolve)
        .catch(reject);
    });
  },
};