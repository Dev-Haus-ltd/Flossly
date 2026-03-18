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
    googleSitePagesLoading: false,
    googleSitePagesError: null,
    // Google Ads state
    googleAdsCustomers: [],
    selectedGoogleAdsAccount: null,
    googleAdsPerformance: null,
    googleAdsLoading: false,
    googleAdsError: null,
    // Meta state
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

      // Only aggregate campaign-level rows to avoid triple-counting
      // (the DB stores insights at campaign, adset, and ad level — same money counted three times)
      let roas_numer = 0;
      let roas_denom = 0;

      state.metaInsights.forEach((insight) => {
        if (insight.entityType !== "campaign") return;
        totals.spend += Number(insight.spend || 0);
        totals.impressions += Number(insight.impressions || 0);
        totals.reach += Number(insight.reach || 0);
        totals.leads += Number(insight.leads || 0);
        totals.clicks += Number(insight.clicks || 0);

        // Spend-weighted ROAS: weight each day's ROAS by that day's spend so
        // high-spend days count more than low-spend days (simple average is misleading)
        const roas = Number(insight.purchase_roas || 0);
        if (roas > 0) {
          const spendVal = Number(insight.spend || 0);
          roas_numer += spendVal * roas;
          roas_denom += spendVal;
        }
      });

      if (roas_denom > 0) {
        // Raw multiplier — e.g. 2.5 means £2.50 returned per £1 spent
        totals.roas = roas_numer / roas_denom;
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
    startInstagramAuth() { return this._wrap(() => crmService.startInstagramAuth()); },
    listDmConversations(params = {}) { return this._wrap(() => crmService.listDmConversations(params)); },
    listDmMessages(params = {}) { return this._wrap(() => crmService.listDmMessages(params)); },
    sendDmMessage(payload) { return this._wrap(() => crmService.sendDmMessage(payload)); },
    markDmRead(payload) { return this._wrap(() => crmService.markDmRead(payload)); },
    processDmQueue(payload = {}) { return this._wrap(() => crmService.processDmQueue(payload)); },
    uploadDmAttachment(formData, onProgress) { return this._wrap(() => crmService.uploadDmAttachment(formData, onProgress)); },
    refreshDmProfile(payload) { return this._wrap(() => crmService.refreshDmProfile(payload)); },
    connectionStatus() { return this._wrap(() => crmService.connectionStatus()); },
    fetchLeadsNow(params = {}) { return this._wrap(() => crmService.fetchLeadsNow(params)); },
    fetchDmHistoryNow(params = {}) { return this._wrap(() => crmService.fetchDmHistoryNow(params)); },
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
    getLeadWhatsAppLogs(leadIdOrParams, limit = 100) { return this._wrap(() => crmService.getLeadWhatsAppLogs(leadIdOrParams, limit)); },
    uploadLeadWhatsAppAttachment(formData, onProgress) { return this._wrap(() => crmService.uploadLeadWhatsAppAttachment(formData, onProgress)); },
    uploadLeadAttachment(formData, onProgress) { return this._wrap(() => crmService.uploadLeadAttachment(formData, onProgress)); },
    getLeadPriceAttachmentRecent(payload) { return this._wrap(() => crmService.getLeadPriceAttachmentRecent(payload)); },

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
        if (result.data.selectedAdsAccount) {
          this.selectedGoogleAdsAccount = result.data.selectedAdsAccount;
        }
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

    async getGoogleSearchConsoleAnalytics(siteId, days = 30) {
      return await this._wrap(() => crmService.getGoogleSearchConsoleAnalytics(siteId, days));
    },

    // Clear Google site pages state
    clearGoogleSitePages() {
      this.googleSitePages = [];
      this.googleSitePagesPagination = null;
      this.googleSitePagesError = null;
    },

    async fetchGoogleAdsCustomers() {
      const res = await this._wrap(() => crmService.fetchGoogleAdsCustomers());
      if (res?.code === 0 && res?.data?.customers) {
        this.googleAdsCustomers = res.data.customers;
      }
      return res;
    },
    async selectGoogleAdsAccount(accountId) {
      const res = await this._wrap(() => crmService.selectGoogleAdsAccount(accountId));
      if (res?.code === 0 && res?.data?.account) {
        this.selectedGoogleAdsAccount = res.data.account;
      }
      return res;
    },
    async getGoogleAdsPerformance(payload) {
      this.googleAdsLoading = true;
      this.googleAdsError = null;
      try {
        const res = await this._wrap(() => crmService.getGoogleAdsPerformance(payload));
        if (res?.code === 0 && res?.data) {
          this.googleAdsPerformance = res.data;
        } else {
          this.googleAdsError = res?.error || 'Failed to fetch performance';
        }
        return res;
      } catch (e) {
        this.googleAdsError = e?.message || 'Failed to fetch performance';
        throw e;
      } finally {
        this.googleAdsLoading = false;
      }
    },
  },
});
