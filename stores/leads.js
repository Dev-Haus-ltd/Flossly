import crmService from "../services/crmService";

export const useLeadStore = defineStore("leadStore", {
  state: () => ({
    leads: [],
    leadSources: [],
    treatmentSources: [],
    isLoading: false,
  }),

  actions: {
    async fetchOptions() {
      try {
        this.isLoading = true;
        const [src, tr] = await Promise.all([
          crmService.listOptions("lead_source"),
          crmService.listOptions("treatment"),
        ]);
        if (src?.code === 0) this.leadSources = (src.data || []).map(o => ({ id: o.id, name: o.name }));
        if (tr?.code === 0) this.treatmentSources = (tr.data || []).map(o => ({ id: o.id, name: o.name }));
      } finally { this.isLoading = false; }
    },

    async fetchLeads() {
      try {
        this.isLoading = true;
        const res = await crmService.listLeads();
        if (res && res.code === 0) {
          this.leads = (res.data || []).map((l) => ({
            alert: l.alert || "",
            name: l.name || "",
            email: l.email || "",
            telephone: l.telephone || "",
            inquiryDate: l.inquiryDate || "",
            leadSource: l.leadSource?.name ? l.leadSource : { id: 99, name: l.leadSource || "Meta Leadgen" },
            leadStatus: l.leadStatus || "New",
            treatment: l.treatment || { id: null, name: "" },
            assigned: l.assigned || [],
            followUpDate: l.followUpDate || "",
            comments: l.comments || "",
            id: l.id,
          }));
        }
        return res;
      } finally { this.isLoading = false; }
    },

    async createLead(payload) {
      try {
        this.isLoading = true;
        const res = await crmService.createLead(payload);
        if (res?.code === 0 && res.data) {
          const l = res.data;
          this.leads.unshift({
            id: l.id,
            alert: l.alert || "",
            name: l.name,
            email: l.email,
            telephone: l.telephone,
            inquiryDate: l.inquiryDate,
            leadSource: l.leadSource || { id: 99, name: l.leadSource || "Meta Leadgen" },
            leadStatus: l.leadStatus || "New",
            treatment: l.treatment || { id: null, name: "" },
            assigned: l.assigned || [],
            followUpDate: l.followUpDate || "",
            comments: l.comments || "",
          });
        }
        return res;
      } finally { this.isLoading = false; }
    },

    async updateLead(payload) {
      try {
        this.isLoading = true;
        const res = await crmService.updateLead(payload);
        if (res?.code === 0 && res.data) {
          const idx = this.leads.findIndex(l => l.id === res.data.id);
          if (idx !== -1) this.leads[idx] = { ...this.leads[idx], ...payload };
        }
        return res;
      } finally { this.isLoading = false; }
    },

    async deleteLeads(ids) {
      this.isLoading = true;
      try {
        const res = await crmService.deleteLeads(ids);
        if (res?.code === 0) this.leads = this.leads.filter(l => !ids.includes(l.id));
        return res;
      } finally { this.isLoading = false; }
    },

    async assignUser(lead, user) {
      const assigned = [...(lead.assigned || [])];
      if (!assigned.some(u => u?.id === user.id)) assigned.push({ id: user.id, fullName: user.fullName, email: user.email });
      const res = await this.updateLead({ id: lead.id, assigned });
      return res;
    },

    async unassignUser(lead, userId) {
      const assigned = (lead.assigned || []).filter(u => u?.id !== userId);
      const res = await this.updateLead({ id: lead.id, assigned });
      return res;
    },

    async saveCommunication(payload) {
      return crmService.saveLeadCommunication(payload);
    },
  },
});
