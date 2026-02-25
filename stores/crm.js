import crmService from "../services/crmService";

export const useCrmStore = defineStore("crmStore", {
  state: () => ({
    isLoading: false,
    _pending: 0,
    // Google Search Console state
    googleConnection: null,
    googleSites: [],
    selectedGoogleSite: null,
    googleSitePages: [],
    googleSitePagesPagination: null,
    googleSitePagesLoading: false,
    googleSitePagesError: null,
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

    // =====================================================
    // GOOGLE SEARCH CONSOLE
    // =====================================================

    // Start Google OAuth flow
    startGoogleAuth() { return this._wrap(() => crmService.startGoogleAuth()); },

    // Get Google connection status
    async googleConnectionStatus() {
      const result = await this._wrap(() => crmService.googleConnectionStatus());
      if (result?.code === 0 && result?.data) {
        this.googleConnection = result.data;
      }
      return result;
    },

    // Disconnect Google account
    async disconnectGoogle(tokenId = null) {
      const result = await this._wrap(() => crmService.disconnectGoogle(tokenId));
      if (result?.code === 0) {
        this.googleConnection = null;
        this.googleSites = [];
        this.selectedGoogleSite = null;
        this.googleSitePages = [];
        this.googleSitePagesPagination = null;
      }
      return result;
    },

    // Fetch available GSC sites
    async fetchGoogleSites() {
      const result = await this._wrap(() => crmService.fetchGoogleSites());
      if (result?.code === 0 && result?.data?.sites) {
        this.googleSites = result.data.sites;
        // Store tokenId and accountEmail from the response for later use
        if (result.data.tokenId) {
          this.googleConnection = {
            ...(this.googleConnection || {}),
            tokenId: result.data.tokenId,
            accountEmail: result.data.accountEmail
          };
        }
      }
      return result;
    },

    // Select/activate a GSC site for tracking
    async selectGoogleSite(
      siteUrl,
      tokenId = null,
      startDate,
      endDate,
      country,
      device
    ) {
      const result = await this._wrap(() =>
        crmService.selectGoogleSite(
          siteUrl,
          tokenId,
          startDate,
          endDate,
          country,
          device
        )
      )

      if (result?.code === 0 && result?.data?.site) {
        this.selectedGoogleSite = result.data.site
      }

      return result
    },

    // Trigger page fetching for a site (manual resync)
    fetchGoogleSitePages(
      siteId,
      startDate,
      endDate,
      country,
      device
    ) {
      return this._wrap(() =>
        crmService.fetchGoogleSitePages(
          siteId,
          startDate,
          endDate,
          country,
          device
        )
      );
    },

    // Fetch analytics for a specific page
    // fetchGooglePageAnalytics(payload) {
    //   return this._wrap(() => crmService.fetchGooglePageAnalytics(payload));
    // },

    // Get site pages with analytics (paginated)
    async getGoogleSitePages(siteId, page = 1, limit = 50) {
      this.googleSitePagesLoading = true;
      this.googleSitePagesError = null;
      try {
        const result = await this._wrap(() => crmService.getGoogleSitePages(siteId, page, limit));
        if (result?.code === 0 && result?.data) {
          this.googleSitePages = result.data.pages || [];
          this.googleSitePagesPagination = result.data.pagination || null;
          if (result.data.site) {
            this.selectedGoogleSite = result.data.site;
          }
        } else {
          this.googleSitePagesError = result?.error || 'Failed to fetch pages';
        }
        return result;
      } catch (e) {
        this.googleSitePagesError = e?.message || 'Failed to fetch pages';
        throw e;
      } finally {
        this.googleSitePagesLoading = false;
      }
    },

    // Search site pages with analytics (paginated)
    async searchGoogleSitePages(siteId, searchQuery, page = 1, limit = 50) {
      this.googleSitePagesLoading = true;
      this.googleSitePagesError = null;
      try {
        const result = await this._wrap(() => crmService.searchGoogleSitePages(siteId, searchQuery, page, limit));
        if (result?.code === 0 && result?.data) {
          this.googleSitePages = result.data.pages || [];
          this.googleSitePagesPagination = result.data.pagination || null;
        } else {
          this.googleSitePagesError = result?.error || 'Failed to search pages';
        }
        return result;
      } catch (e) {
        this.googleSitePagesError = e?.message || 'Failed to search pages';
        throw e;
      } finally {
        this.googleSitePagesLoading = false;
      }
    },

    // Clear Google site pages state
    clearGoogleSitePages() {
      this.googleSitePages = [];
      this.googleSitePagesPagination = null;
      this.googleSitePagesError = null;
    },
  },
});
