import crmService from "../services/crmService";

export const useCrmStore = defineStore("crmStore", {
  state: () => ({
    isLoading: false,
    _pending: 0,
    metaCampaigns: [],
    metaAdAccounts: [],
    metaAdSets: [],
    metaAds: [],
    metaInsights: [],
  }),
  getters: {
    metaStats(state) {
      const totals = {
        campaigns: state.metaCampaigns.length,
        spend: 0,
        impressions: 0,
        reach: 0,
        leads: 0,
        clicks: 0,
        roas: 0,
      };

      state.metaInsights.forEach((insight) => {
        if (insight.entityType === "campaign") {
          totals.spend += Number(insight.spend || 0);
          totals.impressions += Number(insight.impressions || 0);
          totals.reach += Number(insight.reach || 0);
          totals.leads += Number(insight.leads || 0);
          totals.clicks += Number(insight.clicks || 0);
        }
      });

      const campaignsWithRoas = state.metaInsights.filter(
        (insight) => insight.entityType === "campaign" && Number(insight.purchase_roas) > 0
      );
      if (campaignsWithRoas.length) {
        const sumRoas = campaignsWithRoas.reduce(
          (acc, insight) => acc + Number(insight.purchase_roas || 0),
          0
        );
        totals.roas = (sumRoas / campaignsWithRoas.length) * 100;
      }

      return totals;
    },
  },
  actions: {
    _isCurrentAnalyticsOrg(orgId) {
      if (!orgId) return true;
      const { user } = useUser();
      return Number(user.value?.currentLoggedInOrgId || 0) === Number(orgId);
    },
    resetMetaAnalyticsState() {
      this.metaCampaigns = [];
      this.metaAdAccounts = [];
      this.metaAdSets = [];
      this.metaAds = [];
      this.metaInsights = [];
    },
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
    async fetchMetaStructure(orgId = null) {
      const res = await this._wrap(() => crmService.fetchMetaStructure());
      if (res?.code === 0) await this.getMetaStructure(orgId);
      return res;
    },
    async getMetaStructure(orgId = null) {
      const res = await this._wrap(() => crmService.getMetaStructure());
      if (res?.code === 0 && res.data && this._isCurrentAnalyticsOrg(orgId)) {
        this.metaCampaigns = res.data.campaigns || [];
        this.metaAdAccounts = res.data.adAccounts || [];
        this.metaAdSets = res.data.adSets || [];
        this.metaAds = res.data.ads || [];
      }
      return res;
    },
    async fetchMetaInsights(params = {}, orgId = null) {
      const res = await this._wrap(() => crmService.fetchMetaInsights(params));
      if (res?.code === 0) await this.getMetaInsights(orgId);
      return res;
    },
    async getMetaInsights(orgId = null) {
      const res = await this._wrap(() => crmService.getMetaInsights());
      if (res?.code === 0 && this._isCurrentAnalyticsOrg(orgId)) {
        this.metaInsights = res.data || [];
      }
      return res;
    },
    subscribePages() { return this._wrap(() => crmService.subscribePages()); },
    disconnectMeta() { return this._wrap(() => crmService.disconnectMeta()); },
    metaHealth() { return this._wrap(() => crmService.metaHealth()); },
    metaPermissions() { return this._wrap(() => crmService.metaPermissions()); },
    listMetaBusinesses() { return this._wrap(() => crmService.listMetaBusinesses()); },
    connectMetaPages(payload) { return this._wrap(() => crmService.connectMetaPages(payload)); },
    completeWhatsAppEmbedded(payload) { return this._wrap(() => crmService.completeWhatsAppEmbedded(payload)); },
    getWhatsAppConfig() { return this._wrap(() => crmService.getWhatsAppConfig()); },
    saveWhatsAppConfig(payload) { return this._wrap(() => crmService.saveWhatsAppConfig(payload)); },
    getWhatsAppTemplates() { return this._wrap(() => crmService.getWhatsAppTemplates()); },
    startWhapiConnect(payload = {}) { return this._wrap(() => crmService.startWhapiConnect(payload)); },
    getWhapiQr() { return this._wrap(() => crmService.getWhapiQr()); },
    getWhapiStatus() { return this._wrap(() => crmService.getWhapiStatus()); },
    getWhapiChannels() { return this._wrap(() => crmService.getWhapiChannels()); },
    disconnectWhapi(payload = {}) { return this._wrap(() => crmService.disconnectWhapi(payload)); },
    deleteWhapiChannel() { return this._wrap(() => crmService.deleteWhapiChannel()); },
    extendWhapiChannel(payload) { return this._wrap(() => crmService.extendWhapiChannel(payload)); },

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
    getLeadWhatsAppLogs(leadId, limit = 100) { return this._wrap(() => crmService.getLeadWhatsAppLogs(leadId, limit)); },

    // Treatment (used in details dialog)
    getLeadTreatment(leadId) { return this._wrap(() => crmService.getLeadTreatment(leadId)); },
    saveLeadTreatment(leadId, data) { return this._wrap(() => crmService.saveLeadTreatment(leadId, data)); },
    deleteLeadTreatment(leadId) { return this._wrap(() => crmService.deleteLeadTreatment(leadId)); },

    // Automation
    listAutomation(leadId) { return this._wrap(() => crmService.listAutomation(leadId)); },
    saveAutomation(payload) { return this._wrap(() => crmService.saveAutomation(payload)); },
    saveAutomationBatch(payload) { return this._wrap(() => crmService.saveAutomationBatch(payload)); },
    resetAutomationOverride(payload) { return this._wrap(() => crmService.resetAutomationOverride(payload)); },
    deleteAutomation(payload) { return this._wrap(() => crmService.deleteAutomation(payload)); },
    bulkUploadAutomations(payload) { return this._wrap(() => crmService.bulkUploadAutomations(payload)); },
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
    uploadLeadAttachment(formData) { return this._wrap(() => crmService.uploadLeadAttachment(formData)); },
    getLeadPriceAttachmentRecent(payload) { return this._wrap(() => crmService.getLeadPriceAttachmentRecent(payload)); },
  },
});
