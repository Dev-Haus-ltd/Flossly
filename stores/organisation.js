import organisationService from '../services/organisationService'

export const useOrgStore = defineStore('organisationStore', {
  state: () => ({ isLoading: false, _pending: 0 }),
  actions: {
    _start() { this._pending++; this.isLoading = true },
    _end() { this._pending = Math.max(0, this._pending - 1); this.isLoading = this._pending > 0 },
    async _wrap(fn) { this._start(); try { return await fn() } finally { this._end() } },

    // Dictionary: Treatments
    listTreatments() { return this._wrap(() => organisationService.listTreatments()) },
  },
})

