import { Get, Post } from "../services/apiWrapper";

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
    startMetaAuth() { return this._wrap(() => Get("/meta/authStart")); },
    connectionStatus() { return this._wrap(() => Get("/meta/connection")); },
    fetchLeadsNow() { return this._wrap(() => Get("/meta/fetchLeads")); },
    subscribePages() { return this._wrap(() => Get("/meta/subscribe")); },
    getAdAccounts() { return this._wrap(() => Get("/meta/adaccounts")); },
    getCampaigns(accountId) {
      return this._wrap(() => Get(`/meta/campaigns?account_id=${encodeURIComponent(accountId)}`));
    },
    getAds({ accountId, campaignId }) {
      const q = campaignId
        ? `campaign_id=${encodeURIComponent(campaignId)}`
        : `account_id=${encodeURIComponent(accountId)}`
      return this._wrap(() => Get(`/meta/ads?${q}`));
    },

    // Leads
    listLeads() { return this._wrap(() => Get("/lead/list")); },
    createLead(payload) { return this._wrap(() => Post("/lead/create", payload)); },
    updateLead(payload) { return this._wrap(() => Post("/lead/update", payload)); },
    deleteLeads(ids) { return this._wrap(() => Post("/lead/delete", { ids })); },

    // Options
    listOptions(category) { return this._wrap(() => Get(`/lead/optionsList?category=${encodeURIComponent(category)}`)); },
    addOption(category, name, color = null) { return this._wrap(() => Post("/lead/optionsAdd", { category, name, color })); },
    deleteOption(id) { return this._wrap(() => Post("/lead/optionsDelete", { id })); },

    // Communication preferences
    getLeadCommunication(leadId) { return this._wrap(() => Get(`/lead/commGet?leadId=${encodeURIComponent(leadId)}`)); },
    saveLeadCommunication(payload) { return this._wrap(() => Post("/lead/commSave", payload)); },

    // Notes
    getLeadNotes(leadId) { return this._wrap(() => Post("/lead/notesList", { leadId })); },
    addLeadNote(payload) { return this._wrap(() => Post("/lead/notesAdd", payload)); },
    deleteLeadNote(id) { return this._wrap(() => Post("/lead/notesDelete", { id })); },

    // Treatment (used in details dialog)
    getLeadTreatment(leadId) { return this._wrap(() => Post("/lead/treatmentGet", { leadId })); },
    saveLeadTreatment(leadId, data) { return this._wrap(() => Post("/lead/treatmentSave", { leadId, data })); },
    deleteLeadTreatment(leadId) { return this._wrap(() => Post("/lead/treatmentDelete", { leadId })); },

    // Automation
    listAutomation() { return this._wrap(() => Get('/lead/automationList')); },
    saveAutomation(payload) { return this._wrap(() => Post('/lead/automationSave', payload)); },

    // Mail
    sendLeadMail(payload) { return this._wrap(() => Post('/lead/mailSend', payload)); },
  },
});
