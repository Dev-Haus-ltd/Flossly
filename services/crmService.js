import { Get, Post, PostFormData } from "./apiWrapper";

export default {
  startMetaAuth() {
    return new Promise((resolve, reject) => {
      Get("/meta/authStart")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  connectionStatus() {
    return new Promise((resolve, reject) => {
      Get("/meta/connection")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  fetchLeads() {
    return new Promise((resolve, reject) => {
      Get("/meta/leads")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  fetchLeadsNow(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      q.append(k, v);
    });
    const qs = q.toString();
    return new Promise((resolve, reject) => {
      Get(`/meta/fetchLeads${qs ? `?${qs}` : ""}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  fetchMetaStructure() {
    return new Promise((resolve, reject) => {
      Get("/meta/syncStructure")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // Fetch daily Meta analytics (insights)
  fetchMetaInsights() {
    return new Promise((resolve, reject) => {
      Get("/meta/syncInsights")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  subscribePages() {
    return new Promise((resolve, reject) => {
      Get("/meta/subscribe")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  disconnectMeta() {
    return new Promise((resolve, reject) => {
      Get("/meta/disconnect")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  metaHealth() {
    return new Promise((resolve, reject) => {
      Get("/meta/health")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  metaPermissions() {
    return new Promise((resolve, reject) => {
      Get("/meta/permissions")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  listMetaBusinesses() {
    return new Promise((resolve, reject) => {
      Get("/meta/businesses")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  connectMetaPages(payload) {
    return new Promise((resolve, reject) => {
      Post("/meta/connectPages", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  completeWhatsAppEmbedded(payload) {
    return new Promise((resolve, reject) => {
      Post("/meta/whatsappEmbedded", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhatsAppConfig() {
    return new Promise((resolve, reject) => {
      Get("/meta/whatsappConfig")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveWhatsAppConfig(payload) {
    return new Promise((resolve, reject) => {
      Post("/meta/whatsappConfig", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  startWhapiConnect(payload = {}) {
    return new Promise((resolve, reject) => {
      Post("/whapi/connect", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhapiChannels() {
    return new Promise((resolve, reject) => {
      Get("/whapi/channels")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhapiQr() {
    return new Promise((resolve, reject) => {
      Get("/whapi/qr")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhapiStatus() {
    return new Promise((resolve, reject) => {
      Get("/whapi/status")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  disconnectWhapi(payload = {}) {
    return new Promise((resolve, reject) => {
      Post("/whapi/disconnect", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteWhapiChannel() {
    return new Promise((resolve, reject) => {
      Post("/whapi/delete", {})
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  extendWhapiChannel(payload = {}) {
    return new Promise((resolve, reject) => {
      Post("/whapi/extend", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhatsAppTemplates() {
    return new Promise((resolve, reject) => {
      Get("/meta/whatsappTemplates")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // Leads (app-managed)
  listLeads(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      // Normalize Date to YYYY-MM-DD for server parsing
      if (k === 'inquiryDate') {
        try {
          const d = new Date(v);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            params.append(k, `${yyyy}-${mm}-${dd}`);
            return;
          }
        } catch {}
      }
      params.append(k, v);
    });
    const q = params.toString();
    return new Promise((resolve, reject) => {
      Get(`/lead/list${q ? `?${q}` : ''}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  createLead(payload) {
    return new Promise((resolve, reject) => {
      Post("/lead/create", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  updateLead(payload) {
    return new Promise((resolve, reject) => {
      Post("/lead/update", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteLeads(ids) {
    return new Promise((resolve, reject) => {
      Post("/lead/delete", { ids })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  bulkUploadLeads(payload) {
    return new Promise((resolve, reject) => {
      Post("/lead/bulkUpload", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getLeadTreatment(leadId) {
    return new Promise((resolve, reject) => {
      Post("/lead/treatmentGet", { leadId })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveLeadTreatment(leadId, data) {
    return new Promise((resolve, reject) => {
      Post("/lead/treatmentSave", { leadId, data })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteLeadTreatment(leadId) {
    return new Promise((resolve, reject) => {
      Post("/lead/treatmentDelete", { leadId })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getLeadNotes(leadId) {
    return new Promise((resolve, reject) => {
      Post("/lead/notesList", { leadId })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  addLeadNote(payload) {
    return new Promise((resolve, reject) => {
      Post("/lead/notesAdd", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteLeadNote(id) {
    return new Promise((resolve, reject) => {
      Post("/lead/notesDelete", { id })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getLeadWhatsAppLogs(leadId, limit = 100) {
    return new Promise((resolve, reject) => {
      Post("/lead/whatsappLogs", { leadId, limit })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // CRM options
  listOptions(category) {
    return new Promise((resolve, reject) => {
      Get(`/lead/optionsList?category=${encodeURIComponent(category)}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  addOption(category, name, color = null) {
    return new Promise((resolve, reject) => {
      Post("/lead/optionsAdd", { category, name, color })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteOption(id) {
    return new Promise((resolve, reject) => {
      Post("/lead/optionsDelete", { id })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // Communication preferences
  getLeadCommunication(leadId) {
    return new Promise((resolve, reject) => {
      Get(`/lead/commGet?leadId=${encodeURIComponent(leadId)}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveLeadCommunication(payload) {
    return new Promise((resolve, reject) => {
      Post("/lead/commSave", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // Automation
  listAutomation(leadId) {
    const q = leadId ? `?leadId=${encodeURIComponent(leadId)}` : '';
    return new Promise((resolve, reject) => {
      Get(`/lead/automationList${q}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveAutomation(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationSave', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveAutomationBatch(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationSaveBatch', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  resetAutomationOverride(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationReset', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteAutomation(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationDelete', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  bulkUploadAutomations(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationBulkUpload', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  listAutomationGroups() {
    return new Promise((resolve, reject) => {
      Get('/lead/automationGroups')
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveAutomationGroup(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationGroupSave', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteAutomationGroup(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/automationGroupDelete', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  // Mail
  sendLeadMail(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/mailSend', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  sendLeadWhatsApp(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/whatsappSend', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getWhatsAppUsage() {
    return new Promise((resolve, reject) => {
      Get('/lead/whatsappUsage')
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  uploadLeadAttachment(formData) {
    return new Promise((resolve, reject) => {
      PostFormData('/lead/uploadAttachment', formData)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getLeadPriceAttachmentRecent(payload) {
    return new Promise((resolve, reject) => {
      Post('/lead/priceAttachmentRecent', payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
};
