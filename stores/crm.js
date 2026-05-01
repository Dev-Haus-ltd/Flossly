import crmService from "../services/crmService";
import webFormService from "../services/webFormService";

export const useCrmStore = defineStore("crmStore", {
  state: () => ({
    isLoading: false,
    _pending: 0,
    metaCampaigns: [],
    metaAdAccounts: [],
    metaAdSets: [],
    metaAds: [],
    metaInsights: [],
    // CRM lead counts — single source of truth for lead attribution
    metaCampaignLeadCounts: {},
    metaAdSetLeadCounts: {},
    metaAdLeadCounts: {},
    // Automation cache — single source of truth shared by listView column and lead dialog
    automationGroupRows: [],
    automationGroupsLoading: false,
    automationCacheOrgId: null,
    automationRowsCache: {},   // { [leadId]: CrmAutomation[] } raw API rows, unfiltered
    automationLoadingIds: {},  // { [leadId]: true } tracks in-flight per-lead fetches
    automationDirtyLeadIds: {}, // { [leadId]: true } leads whose automations changed since dialog opened
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
        cpl: 0,
      };

      // Only aggregate campaign-level rows to avoid triple-counting
      // (the DB stores insights at campaign, adset, and ad level — same money counted three times)
      state.metaInsights.forEach((insight) => {
        if (insight.entityType !== "campaign") return;
        totals.spend += Number(insight.spend || 0);
        totals.impressions += Number(insight.impressions || 0);
        totals.reach += Number(insight.reach || 0);
        totals.clicks += Number(insight.clicks || 0);
      });

      // Leads from CrmLeads (single source of truth — matches what "View Leads" shows)
      totals.leads = Object.values(state.metaCampaignLeadCounts).reduce(
        (sum, n) => sum + Number(n || 0), 0
      );

      // CPL = total spend (in major units) / total CRM leads
      if (totals.leads > 0) {
        totals.cpl = totals.spend / 100 / totals.leads;
      }

      return totals;
    },
  },
  actions: {
    _getCurrentOrgId() {
      const { user } = useUser();
      return Number(user.value?.currentLoggedInOrgId || 0);
    },
    _resetAutomationState() {
      this.automationGroupRows = [];
      this.automationGroupsLoading = false;
      this.automationRowsCache = {};
      this.automationLoadingIds = {};
      this.automationDirtyLeadIds = {};
    },
    _ensureAutomationOrgScope() {
      const currentOrgId = this._getCurrentOrgId();
      if (!currentOrgId) return;
      if (Number(this.automationCacheOrgId || 0) === currentOrgId) return;
      this._resetAutomationState();
      this.automationCacheOrgId = currentOrgId;
    },
    _normalizeAutomationLeadIds(leadIds = []) {
      return [...new Set((Array.isArray(leadIds) ? leadIds : [leadIds])
        .map((id) => Number(id || 0))
        .filter(Boolean))];
    },
    _clearAutomationLeadCaches(leadIds = []) {
      const ids = this._normalizeAutomationLeadIds(leadIds);
      if (!ids.length) {
        this.automationRowsCache = {};
        this.automationLoadingIds = {};
        this.automationDirtyLeadIds = {};
        return;
      }
      ids.forEach((id) => {
        delete this.automationRowsCache[id];
        delete this.automationLoadingIds[id];
        delete this.automationDirtyLeadIds[id];
      });
    },
    _notifyAutomationUpdate({ groupsChanged = false, leadIds = [] } = {}) {
      this._ensureAutomationOrgScope();
      const normalizedLeadIds = this._normalizeAutomationLeadIds(leadIds);
      this._clearAutomationLeadCaches(groupsChanged ? [] : normalizedLeadIds);
      if (groupsChanged) {
        this.automationGroupRows = [];
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm-automations-updated', {
          detail: {
            groupsChanged,
            leadIds: normalizedLeadIds,
            refreshedAt: Date.now(),
          },
        }));
        if (groupsChanged) {
          window.dispatchEvent(new CustomEvent('crm-automation-groups-updated'));
        }
      }
    },
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
      this.metaCampaignLeadCounts = {};
      this.metaAdSetLeadCounts = {};
      this.metaAdLeadCounts = {};
    },
    async getCampaignLeadCounts(orgId = null) {
      const res = await this._wrap(() => crmService.getCampaignLeadCounts());
      if (res?.code === 0 && res.data && this._isCurrentAnalyticsOrg(orgId)) {
        this.metaCampaignLeadCounts = res.data || {};
      }
      return res;
    },
    async getAllLeadCounts(orgId = null, params = {}) {
      const res = await this._wrap(() => crmService.getAllLeadCounts(params));
      if (res?.code === 0 && res.data && this._isCurrentAnalyticsOrg(orgId)) {
        this.metaCampaignLeadCounts = res.data.byCampaign || {};
        this.metaAdSetLeadCounts = res.data.byAdSet || {};
        this.metaAdLeadCounts = res.data.byAd || {};
      }
      return res;
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
    getDmConnectionStatus() { return this._wrap(() => crmService.getDmConnectionStatus()); },
    // Fire-and-forget — don't wrap with _wrap so it doesn't block the loading state
    refreshDmProfile(payload) { return crmService.refreshDmProfile(payload); },
    refreshAllDmProfiles(payload = {}) { return this._wrap(() => crmService.refreshAllDmProfiles(payload)); },
    updateConversationAutoReply(conversationId, payload) { return this._wrap(() => crmService.updateConversationAutoReply(conversationId, payload)); },
    updateLeadAutoReply(payload) { return this._wrap(() => crmService.updateLeadAutoReply(payload)); },
    fetchDmHistory(params = {}) { return this._wrap(() => crmService.fetchDmHistory(params)); },
    connectionStatus() { return this._wrap(() => crmService.connectionStatus()); },
    fetchLeadsNow(params = {}) { return this._wrap(() => crmService.fetchLeadsNow(params)); },
    async fetchMetaStructure(orgId = null) {
      const res = await this._wrap(() => crmService.fetchMetaStructure());
      if (res?.code === 0) await this.getMetaStructure(orgId);
      return res;
    },
    async getMetaStructure(orgId = null, params = {}) {
      const res = await this._wrap(() => crmService.getMetaStructure(params));
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
    async getMetaInsights(orgId = null, params = {}) {
      const res = await this._wrap(() => crmService.getMetaInsights(params));
      if (res?.code === 0 && this._isCurrentAnalyticsOrg(orgId)) {
        this.metaInsights = res.data || [];
      }
      return res;
    },
    subscribePages() { return this._wrap(() => crmService.subscribePages()); },
    disconnectMeta() { return this._wrap(() => crmService.disconnectMeta()); },
    metaHealth() { return this._wrap(() => crmService.metaHealth()); },
    metaPermissions() { return this._wrap(() => crmService.metaPermissions()); },
    metaHealthSilent() { return crmService.metaHealth(); },
    metaPermissionsSilent() { return crmService.metaPermissions(); },
    listMetaBusinesses() { return this._wrap(() => crmService.listMetaBusinesses()); },
    connectMetaPages(payload) { return this._wrap(() => crmService.connectMetaPages(payload)); },
    startWhapiConnect(payload = {}) { return this._wrap(() => crmService.startWhapiConnect(payload)); },
    getWhapiQr() { return this._wrap(() => crmService.getWhapiQr()); },
    getWhapiQrSilent() { return crmService.getWhapiQr(); },
    getWhapiStatus() { return this._wrap(() => crmService.getWhapiStatus()); },
    getWhapiStatusSilent() { return crmService.getWhapiStatus(); },
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
    async saveAutomation(payload) {
      const res = await this._wrap(() => crmService.saveAutomation(payload));
      if (res?.code === 0) {
        this._notifyAutomationUpdate({
          groupsChanged: !payload?.leadId,
          leadIds: payload?.leadId ? [payload.leadId] : [],
        });
      }
      return res;
    },
    async saveAutomationBatch(payload) {
      const res = await this._wrap(() => crmService.saveAutomationBatch(payload));
      if (res?.code === 0) {
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const leadIds = items.map((item) => item?.leadId);
        const groupsChanged = items.some((item) => !item?.leadId);
        this._notifyAutomationUpdate({ groupsChanged, leadIds });
      }
      return res;
    },
    getAutomationSendNowStatus(params = {}) { return crmService.getAutomationSendNowStatus(params); },
    async resetAutomationOverride(payload) {
      const res = await this._wrap(() => crmService.resetAutomationOverride(payload));
      if (res?.code === 0) {
        this._notifyAutomationUpdate({
          leadIds: payload?.leadId ? [payload.leadId] : [],
        });
      }
      return res;
    },
    async deleteAutomation(payload) {
      const res = await this._wrap(() => crmService.deleteAutomation(payload));
      if (res?.code === 0) this._notifyAutomationUpdate({ groupsChanged: true });
      return res;
    },
    async bulkUploadAutomations(payload) {
      const res = await this._wrap(() => crmService.bulkUploadAutomations(payload));
      if (res?.code === 0) this._notifyAutomationUpdate({ groupsChanged: true });
      return res;
    },
    async generateAutomationsWithAI(payload) {
      const res = await this._wrap(() => crmService.generateAutomationsWithAI(payload));
      if (res?.code === 0) this._notifyAutomationUpdate({ groupsChanged: true });
      return res;
    },
    listAutomationGroups() { return this._wrap(() => crmService.listAutomationGroups()); },
    async saveAutomationGroup(payload) {
      const res = await this._wrap(() => crmService.saveAutomationGroup(payload));
      if (res?.code === 0) this._notifyAutomationUpdate({ groupsChanged: true });
      return res;
    },
    async deleteAutomationGroup(payload) {
      const res = await this._wrap(() => crmService.deleteAutomationGroup(payload));
      if (res?.code === 0) this._notifyAutomationUpdate({ groupsChanged: true });
      return res;
    },

    // Automation cache actions
    async fetchAutomationGroups({ force = false } = {}) {
      this._ensureAutomationOrgScope();
      if (!force && (this.automationGroupRows.length || this.automationGroupsLoading)) return;
      this.automationGroupsLoading = true;
      try {
        const res = await this.listAutomationGroups();
        if (res?.code === 0 && Array.isArray(res.data)) {
          this.automationGroupRows = res.data;
        }
      } finally {
        this.automationGroupsLoading = false;
      }
    },
    async fetchLeadAutomations(leadId, { force = false } = {}) {
      this._ensureAutomationOrgScope();
      const id = Number(leadId);
      if (!id) return;
      if (!force && this.automationRowsCache[id] !== undefined) return;
      if (this.automationLoadingIds[id]) return;
      this.automationLoadingIds[id] = true;
      try {
        const res = await this.listAutomation(id);
        const items = Array.isArray(res?.data) ? res.data : [];
        this.automationRowsCache[id] = items;
      } catch {
        this.automationRowsCache[id] = [];
      } finally {
        delete this.automationLoadingIds[id];
      }
    },
    syncLeadAutomations(leadId, rows = []) {
      this._ensureAutomationOrgScope();
      const id = Number(leadId);
      if (!id) return;
      this.automationRowsCache[id] = Array.isArray(rows) ? rows : [];
    },
    setLeadAutomationsOptimistic(leadId, rows) {
      this._ensureAutomationOrgScope();
      this.automationRowsCache[Number(leadId)] = rows;
    },
    markLeadAutomationsDirty(leadId) {
      this._ensureAutomationOrgScope();
      this.automationDirtyLeadIds[Number(leadId)] = true;
    },
    async invalidateLeadAutomationsIfDirty(leadId) {
      this._ensureAutomationOrgScope();
      const id = Number(leadId);
      if (!id || !this.automationDirtyLeadIds[id]) return;
      this._clearAutomationLeadCaches([id]);
      await this.fetchLeadAutomations(id, { force: true });
    },
    async invalidateLeadAutomations(leadId) {
      this._ensureAutomationOrgScope();
      const id = Number(leadId);
      if (!id) return;
      this._clearAutomationLeadCaches([id]);
      await this.fetchLeadAutomations(id, { force: true });
    },

    getLeadAutomationLog(leadId, params = {}) { return this._wrap(() => crmService.getLeadAutomationLog(leadId, params)); },

    // Mail
    sendLeadMail(payload) { return this._wrap(() => crmService.sendLeadMail(payload)); },
    sendLeadWhatsApp(payload) { return this._wrap(() => crmService.sendLeadWhatsApp(payload)); },
    getWhatsAppUsage() { return this._wrap(() => crmService.getWhatsAppUsage()); },
    uploadLeadAttachment(formData) { return this._wrap(() => crmService.uploadLeadAttachment(formData)); },
    uploadLeadWhatsAppMedia(formData) { return this._wrap(() => crmService.uploadLeadWhatsAppMedia(formData)); },
    editWhatsAppMessage(payload) { return this._wrap(() => crmService.editWhatsAppMessage(payload)); },
    deleteWhatsAppMessage(payload) { return this._wrap(() => crmService.deleteWhatsAppMessage(payload)); },
    reactWhatsAppMessage(payload) { return this._wrap(() => crmService.reactWhatsAppMessage(payload)); },
    getLeadPriceAttachmentRecent(payload) { return this._wrap(() => crmService.getLeadPriceAttachmentRecent(payload)); },

    // Web Forms
    listForms(params = {}) { return this._wrap(() => webFormService.listForms(params)); },
    createForm(payload) { return this._wrap(() => webFormService.createForm(payload)); },
    updateForm(payload) { return this._wrap(() => webFormService.updateForm(payload)); },
    archiveForms(payload) { return this._wrap(() => webFormService.archiveForms(payload)); },
    restoreForms(payload) { return this._wrap(() => webFormService.restoreForms(payload)); },
    deleteForm(payload) { return this._wrap(() => webFormService.deleteForm(payload)); },
    getAvailableFields() { return this._wrap(() => webFormService.getAvailableFields()); },
    getAutoReplySettings() { return this._wrap(() => crmService.getAutoReplySettings()); },
    updateAutoReplySettings(payload) { return this._wrap(() => crmService.updateAutoReplySettings(payload)); },
  },
});
