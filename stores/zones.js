import diaryService from "~/services/diaryService";

export const useZonesStore = defineStore("zones", {
  state: () => ({
    zones: [],
    isLoading: false,
    error: null,
    selectedZone: null,
  }),

  getters: {
    getAllZones: (state) => state.zones,
    getZoneById: (state) => (id) => state.zones.find(z => z.id === id),
    getZonesByDentist: (state) => (dentistId) => state.zones.filter(z => z.dentistId === dentistId),
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchZones({ dentistId } = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await diaryService.listZones({ dentistId });
        if (res?.code === 0) {
          this.zones = res.data || [];
        } else {
          this.error = res?.message || "Failed to fetch zones";
          this.zones = [];
        }
      } catch (err) {
        this.error = err?.message || "Error fetching zones";
        this.zones = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createZone(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await diaryService.createZone(payload);
        if (res?.code === 0) {
          this.zones.push(res.data);
          return res.data;
        } else {
          this.error = res?.message || "Failed to create zone";
          throw new Error(this.error);
        }
      } catch (err) {
        this.error = err?.message || "Error creating zone";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateZone(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await diaryService.updateZone(payload);
        if (res?.code === 0) {
          const index = this.zones.findIndex(z => z.id === res.data.id);
          if (index > -1) {
            this.zones[index] = res.data;
          }
          return res.data;
        } else {
          this.error = res?.message || "Failed to update zone";
          throw new Error(this.error);
        }
      } catch (err) {
        this.error = err?.message || "Error updating zone";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteZone(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await diaryService.deleteZone(id);
        if (res?.code === 0) {
          this.zones = this.zones.filter(z => z.id !== id);
          return true;
        } else {
          this.error = res?.message || "Failed to delete zone";
          throw new Error(this.error);
        }
      } catch (err) {
        this.error = err?.message || "Error deleting zone";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    setSelectedZone(zone) {
      this.selectedZone = zone;
    },

    clearSelectedZone() {
      this.selectedZone = null;
    },

    clearError() {
      this.error = null;
    },
  },
});
