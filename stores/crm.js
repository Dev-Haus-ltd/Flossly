import crmService from "../services/crmService";

export const useCrmStore = defineStore("crmStore", {
  state: () => ({
    isLoading: false,
    _pending: 0,
  }),
  actions: {
    _start() { this._pending++; this.isLoading = true; },
    _end() { this._pending = Math.max(0, this._pending - 1); this.isLoading = this._pending > 0; },

    async _wrap(promiseFactory) {
      this._start();
      try { return await promiseFactory(); }
      finally { this._end(); }
    },

    // Meta connections
    startMetaAuth() { return this._wrap(() => crmService.startMetaAuth()); },
    connectionStatus() { return this._wrap(() => crmService.connectionStatus()); },
    fetchLeadsNow(params = {}) { return this._wrap(() => crmService.fetchLeadsNow(params)); },
    fetchMetaStructure() { return this._wrap(() => crmService.fetchMetaStructure()); },
    fetchMetaInsights() { return this._wrap(() => crmService.fetchMetaInsights()); },
    subscribePages() { return this._wrap(() => crmService.subscribePages()); },
    disconnectMeta() { return this._wrap(() => crmService.disconnectMeta()); },
    metaHealth() { return this._wrap(() => crmService.metaHealth()); },
    listMetaBusinesses() { return this._wrap(() => crmService.listMetaBusinesses()); },
    connectMetaPages(payload) { return this._wrap(() => crmService.connectMetaPages(payload)); },
    completeWhatsAppEmbedded(payload) { return this._wrap(() => crmService.completeWhatsAppEmbedded(payload)); },
    getWhatsAppConfig() { return this._wrap(() => crmService.getWhatsAppConfig()); },
    saveWhatsAppConfig(payload) { return this._wrap(() => crmService.saveWhatsAppConfig(payload)); },
    getWhatsAppTemplates() { return this._wrap(() => crmService.getWhatsAppTemplates()); },

    // Leads
    listLeads(filters = {}) { return this._wrap(() => crmService.listLeads(filters)); },
    createLead(payload) { return this._wrap(() => crmService.createLead(payload)); },
    updateLead(payload) { return this._wrap(() => crmService.updateLead(payload)); },
    deleteLeads(ids) { return this._wrap(() => crmService.deleteLeads(ids)); },
    bulkUploadLeads(payload) { return this._wrap(() => crmService.bulkUploadLeads(payload)); },

    // Options
    listOptions(category) { return this._wrap(() => crmService.listOptions(category)); },
    addOption(category, name, color = null) { return this._wrap(() => crmService.addOption(category, name, color)); },
    deleteOption(id) { return this._wrap(() => crmService.deleteOption(id)); },

    // Communication preferences
    getLeadCommunication(leadId) { return this._wrap(() => crmService.getLeadCommunication(leadId)); },
    saveLeadCommunication(payload) { return this._wrap(() => crmService.saveLeadCommunication(payload)); },

    // Notes
    getLeadNotes(leadId) { return this._wrap(() => crmService.getLeadNotes(leadId)); },
    addLeadNote(payload) { return this._wrap(() => crmService.addLeadNote(payload)); },
    deleteLeadNote(id) { return this._wrap(() => crmService.deleteLeadNote(id)); },

    // Treatment (used in details dialog)
    getLeadTreatment(leadId) { return this._wrap(() => crmService.getLeadTreatment(leadId)); },
    saveLeadTreatment(leadId, data) { return this._wrap(() => crmService.saveLeadTreatment(leadId, data)); },
    deleteLeadTreatment(leadId) { return this._wrap(() => crmService.deleteLeadTreatment(leadId)); },

    // Automation
    listAutomation(leadId) { return this._wrap(() => crmService.listAutomation(leadId)); },
    saveAutomation(payload) { return this._wrap(() => crmService.saveAutomation(payload)); },
    saveAutomationBatch(payload) { return this._wrap(() => crmService.saveAutomationBatch(payload)); },
    listAutomationGroups() { return this._wrap(() => crmService.listAutomationGroups()); },
    async saveAutomationGroup(payload) {
      const res = await this._wrap(() => crmService.saveAutomationGroup(payload));
      if (res?.code === 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm-automation-groups-updated'));
      }
      return res;
    },
    async deleteAutomationGroup(payload) {
      const res = await this._wrap(() => crmService.deleteAutomationGroup(payload));
      if (res?.code === 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm-automation-groups-updated'));
      }
      return res;
    },

    // Mail
    sendLeadMail(payload) { return this._wrap(() => crmService.sendLeadMail(payload)); },
    sendLeadWhatsApp(payload) { return this._wrap(() => crmService.sendLeadWhatsApp(payload)); },
    getWhatsAppUsage() { return this._wrap(() => crmService.getWhatsAppUsage()); },
  },
});
