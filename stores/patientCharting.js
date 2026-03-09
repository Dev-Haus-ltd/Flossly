import patientChartingService from '~/services/patientChartingService'
import { createDefaultTooth, UPPER_ARCH, LOWER_ARCH, CONDITIONS } from '~/components/patients/charting/toothData.js'

// Module-level timer map — not reactive, just for debouncing
const _saveTimers = {}
const DEFAULT_APPOINTMENT_ID = 'appt-1'
const DEFAULT_APPOINTMENT = { id: DEFAULT_APPOINTMENT_ID, name: 'Appointment 1', status: 'pending' }
const DEFAULT_PLAN_ID = 'plan-1'
const DEFAULT_PLAN_NAME = 'Treatment Plan 1'
const DEFAULT_PLAN_COLOR = '#0061FB'
const PLAN_COLORS = ['#0061FB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']

export const usePatientChartingStore = defineStore('patientChartingStore', {
  state: () => ({
    patientId: null,
    // Full mouth chart keyed by FDI number
    chart: {},
    // Treatment plan items
    treatmentPlan: [],
    // UI state
    mode: 'examination',        // 'examination' | 'treatment' | 'completed'
    activeCondition: null,      // condition key from CONDITIONS
    notation: 'FDI',            // 'FDI' | 'Palmer' | 'UNS'
    selectedToothFdi: null,
    bridgeSelectMode: false,    // waiting for second tooth click to complete bridge
    bridgeStartFdi: null,
    isLoading: false,
    isSaving: false,
    isDirty: false,
    // New UI state
    teethType: 'permanent',
    toothStatuses: {},          // map of fdi → status string
    appointments: [{ ...DEFAULT_APPOINTMENT }],
    plans: [{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: DEFAULT_PLAN_COLOR, appointments: [{ ...DEFAULT_APPOINTMENT }] }],
    activePlanId: DEFAULT_PLAN_ID,
    favoriteCodeIds: [],
    chartImages: [],
    historyEntries: [],
    appointmentLinks: {},
    activeCodeId: null,         // currently selected code from right panel
  }),

  getters: {
    getTooth: (state) => (fdi) => state.chart[fdi] || createDefaultTooth(fdi),
    treatmentItems: (state) => [...state.treatmentPlan]
      .filter((i) => (i.planId || DEFAULT_PLAN_ID) === (state.activePlanId || DEFAULT_PLAN_ID))
      .sort((a, b) => a.priority - b.priority),
    treatmentTotal() { return this.treatmentItems.reduce((sum, i) => sum + Number(i.cost || 0), 0) },
    plannedCount() { return this.treatmentItems.filter(i => i.status === 'planned').length },
    completedCount() { return this.treatmentItems.filter(i => i.status === 'completed').length },
  },

  actions: {
    _logError(context, error) {
      const details = error?.response?.data || error?.message || error
      console.error(`[patientChartingStore] ${context}`, details)
    },
    _uiStorageKey(patientId = this.patientId) {
      return patientId ? `patient-charting-ui:${patientId}` : null
    },
    _persistUiState() {
      if (typeof window === 'undefined') return
      const key = this._uiStorageKey()
      if (!key) return
      const payload = {
        plans: this.plans,
        activePlanId: this.activePlanId,
        favoriteCodeIds: this.favoriteCodeIds,
        chartImages: this.chartImages,
        historyEntries: this.historyEntries.slice(0, 200),
        appointmentLinks: this.appointmentLinks,
      }
      window.localStorage.setItem(key, JSON.stringify(payload))
    },
    _nextPlanColor(index = 0) {
      return PLAN_COLORS[index % PLAN_COLORS.length] || DEFAULT_PLAN_COLOR
    },
    _normalizePlans() {
      if (!Array.isArray(this.plans) || !this.plans.length) {
        this.plans = [{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: DEFAULT_PLAN_COLOR, appointments: [{ ...DEFAULT_APPOINTMENT }] }]
        return
      }
      this.plans = this.plans.map((plan, idx) => ({
        id: plan.id || `plan-${Date.now()}-${idx}`,
        name: String(plan.name || '').trim() || `Treatment Plan ${idx + 1}`,
        color: plan.color || this._nextPlanColor(idx),
        appointments: Array.isArray(plan.appointments) && plan.appointments.length ? plan.appointments : [{ ...DEFAULT_APPOINTMENT }],
      }))
      const autoPattern = /^Treatment Plan\s+\d+$/i
      const autoNamed = this.plans.every((p) => autoPattern.test(String(p.name || '').trim()))
      if (autoNamed) {
        this.plans = this.plans.map((p, idx) => ({ ...p, name: `Treatment Plan ${idx + 1}` }))
      }
    },
    _restoreUiState(patientId) {
      if (typeof window === 'undefined') return
      const key = this._uiStorageKey(patientId)
      if (!key) return
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
        if (!parsed || typeof parsed !== 'object') return
        this.plans = Array.isArray(parsed.plans) && parsed.plans.length
          ? parsed.plans
          : [{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: DEFAULT_PLAN_COLOR, appointments: [{ ...DEFAULT_APPOINTMENT }] }]
        this._normalizePlans()
        this.activePlanId = parsed.activePlanId || this.plans[0]?.id || DEFAULT_PLAN_ID
        this.favoriteCodeIds = Array.isArray(parsed.favoriteCodeIds) ? parsed.favoriteCodeIds : []
        this.chartImages = Array.isArray(parsed.chartImages) ? parsed.chartImages : []
        this.historyEntries = Array.isArray(parsed.historyEntries) ? parsed.historyEntries : []
        this.appointmentLinks = parsed.appointmentLinks && typeof parsed.appointmentLinks === 'object' ? parsed.appointmentLinks : {}
      } catch (_) {}
    },
    _logHistory(action, details = '') {
      this.historyEntries.unshift({
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        details,
        at: new Date().toISOString(),
      })
      this.historyEntries = this.historyEntries.slice(0, 200)
      this._persistUiState()
    },
    _syncActivePlanAppointments() {
      const plan = this.plans.find((p) => p.id === this.activePlanId) || this.plans[0]
      if (!plan) return
      if (!Array.isArray(plan.appointments) || !plan.appointments.length) {
        plan.appointments = [{ ...DEFAULT_APPOINTMENT }]
      }
      this.activePlanId = plan.id
      this.appointments = plan.appointments.map((a) => ({ ...a }))
    },
    _saveActivePlanAppointments() {
      const idx = this.plans.findIndex((p) => p.id === this.activePlanId)
      if (idx === -1) return
      this.plans[idx].appointments = this.appointments.map((a) => ({ ...a }))
      this._persistUiState()
    },
    // ── Initialise chart for a patient ──────────────────────────────────
    async loadChart(patientId) {
      this.toothStatuses = {}
      this.appointments = [{ ...DEFAULT_APPOINTMENT }]
      this.plans = [{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: DEFAULT_PLAN_COLOR, appointments: [{ ...DEFAULT_APPOINTMENT }] }]
      this.activePlanId = DEFAULT_PLAN_ID
      this.activeCodeId = null
      this.patientId = patientId
      this._restoreUiState(patientId)
      this._syncActivePlanAppointments()
      this.isLoading = true
      // Build blank chart with all 32 teeth
      const blankChart = {}
      ;[...UPPER_ARCH, ...LOWER_ARCH].forEach(fdi => {
        blankChart[fdi] = createDefaultTooth(fdi)
      })
      this.chart = blankChart

      try {
        const res = await patientChartingService.getChart(patientId)
        if (res?.code === 0 && res.data?.chart) {
          // Merge API data over defaults so any new teeth still get defaults
          const apiChart = res.data.chart
          Object.keys(apiChart).forEach(fdi => {
            const numFdi = Number(fdi)
            this.chart[numFdi] = { ...createDefaultTooth(numFdi), ...apiChart[fdi] }
          })
        }
      } catch (error) {
        this._logError('loadChart', error)
        // Chart will show blank — that's fine for a new patient
      } finally {
        this.isLoading = false
      }

      // Load treatment plan
      await this.loadTreatmentPlan(patientId)
    },

    async loadTreatmentPlan(patientId) {
      try {
        const res = await patientChartingService.listTreatmentPlans(patientId)
        if (res?.code === 0) {
          const rows = (res.data || []).map((item) => ({
            ...item,
            planId: item.planId || DEFAULT_PLAN_ID,
            planName: item.planName || DEFAULT_PLAN_NAME,
            appointmentGroupId: item.appointmentGroupId || DEFAULT_APPOINTMENT_ID,
          }))
          this.treatmentPlan = rows
          const existingPlanIds = new Set(this.plans.map((p) => p.id))
          rows.forEach((item) => {
            if (!existingPlanIds.has(item.planId)) {
              this.plans.push({
                id: item.planId,
                name: item.planName || `Treatment Plan ${this.plans.length + 1}`,
                color: this._nextPlanColor(this.plans.length),
                appointments: [{ ...DEFAULT_APPOINTMENT }],
              })
              existingPlanIds.add(item.planId)
            }
          })
          this._normalizePlans()
          this.plans = this.plans.map((plan) => {
            const groupIds = new Set(
              rows
                .filter((i) => (i.planId || DEFAULT_PLAN_ID) === plan.id)
                .map((i) => i.appointmentGroupId || DEFAULT_APPOINTMENT_ID)
            )
            const existingAppts = Array.isArray(plan.appointments) ? plan.appointments : [{ ...DEFAULT_APPOINTMENT }]
            const merged = [...existingAppts]
            groupIds.forEach((gid) => {
              if (!merged.some((a) => a.id === gid)) merged.push({ id: gid, name: `Appointment ${merged.length + 1}`, status: 'pending' })
            })
            return { ...plan, appointments: merged.length ? merged : [{ ...DEFAULT_APPOINTMENT }] }
          })
          if (!this.plans.some((p) => p.id === this.activePlanId)) this.activePlanId = this.plans[0]?.id || DEFAULT_PLAN_ID
          this._syncActivePlanAppointments()
          this._persistUiState()
        }
      } catch (error) {
        this._logError('loadTreatmentPlan', error)
        this.treatmentPlan = []
      }
    },

    // ── Apply condition to a surface or full tooth ───────────────────────
    applyCondition(fdi, surface) {
      if (!this.activeCondition) return
      const condition = this.activeCondition
      const condMeta = CONDITIONS[condition]
      if (!condMeta) return

      if (!this.chart[fdi]) {
        this.chart[fdi] = createDefaultTooth(fdi)
      }
      const tooth = this.chart[fdi]
      const status = this.mode === 'treatment' ? 'planned'
                   : this.mode === 'completed' ? 'completed'
                   : 'existing'

      if (condition === 'missing') {
        // Toggle missing
        tooth.missing = !tooth.missing
        if (tooth.missing) {
          tooth.toothCondition = null
          tooth.surfaces = Object.fromEntries(
            Object.keys(tooth.surfaces).map(s => [s, { condition: null, status: 'existing' }])
          )
        }
        this._scheduleSave(fdi)
        this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status)
        return
      }

      if (condition === 'bridge') {
        this._handleBridgeClick(fdi)
        return
      }

      if (condMeta.fullTooth && !condMeta.surface) {
        // Full-tooth condition — apply regardless of which surface was clicked
        const wasApplied = tooth.toothCondition === condition
        tooth.toothCondition = wasApplied ? null : condition
        tooth.toothConditionStatus = wasApplied ? 'existing' : status
        if (condition === 'implant') tooth.implant = !wasApplied
        if (!wasApplied) {
          this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status)
        } else {
          this._removeTreatmentItem(fdi, null, condition)
        }
      } else if (condMeta.surface && surface) {
        // Surface condition
        const surf = tooth.surfaces[surface]
        if (!surf) return
        const wasApplied = surf.condition === condition
        surf.condition = wasApplied ? null : condition
        surf.status    = wasApplied ? 'existing' : status
        if (!wasApplied) {
          this._maybeAddTreatmentItem(fdi, surface, condition, condMeta, status)
        } else {
          this._removeTreatmentItem(fdi, surface, condition)
        }
      } else if (condMeta.fullTooth) {
        // Can also act as full-tooth if surface supports it
        const wasApplied = tooth.toothCondition === condition
        tooth.toothCondition = wasApplied ? null : condition
        tooth.toothConditionStatus = wasApplied ? 'existing' : status
        if (!wasApplied) this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status)
        else this._removeTreatmentItem(fdi, null, condition)
      }

      this._scheduleSave(fdi)
    },

    _handleBridgeClick(fdi) {
      if (!this.bridgeSelectMode) {
        // First click: mark bridge start
        this.bridgeSelectMode = true
        this.bridgeStartFdi = fdi
        this.chart[fdi].bridgeStart = true
      } else {
        // Second click: complete bridge span
        const startFdi = this.bridgeStartFdi
        const endFdi = fdi
        this.bridgeSelectMode = false
        this.bridgeStartFdi = null

        const archUpper = UPPER_ARCH.includes(startFdi) && UPPER_ARCH.includes(endFdi)
        const archLower = LOWER_ARCH.includes(startFdi) && LOWER_ARCH.includes(endFdi)
        if (!archUpper && !archLower) {
          // Different arches — cancel
          if (this.chart[startFdi]) this.chart[startFdi].bridgeStart = false
          return
        }

        const arch = archUpper ? UPPER_ARCH : LOWER_ARCH
        const startIdx = arch.indexOf(startFdi)
        const endIdx = arch.indexOf(endFdi)
        const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
        const loFdi = arch[lo]
        const hiFdi = arch[hi]

        for (let i = lo; i <= hi; i++) {
          const tFdi = arch[i]
          if (!this.chart[tFdi]) this.chart[tFdi] = createDefaultTooth(tFdi)
          this.chart[tFdi].bridgePontic = i > lo && i < hi
          this.chart[tFdi].bridgeStart  = i === lo
          this.chart[tFdi].bridgeEnd    = i === hi
          this.chart[tFdi].toothCondition = 'bridge'
          this._scheduleSave(tFdi)
        }
      }
    },

    // ── Treatment Plan helpers ───────────────────────────────────────────
    _maybeAddTreatmentItem(fdi, surface, condition, condMeta, status) {
      if (status !== 'planned') return   // only treatment-mode items go to plan
      const exists = this.treatmentPlan.find(
        i => i.fdi === fdi && i.surface === surface && i.condition === condition
      )
      if (exists) return
      const priority = this.treatmentPlan.length + 1
      const item = {
        _tempId: `${Date.now()}-${fdi}-${surface}-${condition}`,
        planId: this.activePlanId || DEFAULT_PLAN_ID,
        planName: this.plans.find((p) => p.id === (this.activePlanId || DEFAULT_PLAN_ID))?.name || DEFAULT_PLAN_NAME,
        fdi,
        surface,
        condition,
        conditionLabel: condMeta.label,
        cost: 0,
        priority,
        status: 'planned',
        notes: '',
        appointmentGroupId: this.appointments[0]?.id || DEFAULT_APPOINTMENT_ID,
        appointmentId: null,
        clinicianName: '',
        duration: 0,
        createdAt: new Date().toISOString(),
      }
      this.treatmentPlan.push(item)
      // Persist if patientId known
      if (this.patientId) {
        patientChartingService.createTreatmentPlanItem({ patientId: this.patientId, ...item })
          .then(res => {
            if (res?.code === 0 && res.data?.id) {
              item.id = res.data.id
            }
          }).catch((error) => this._logError('createTreatmentPlanItem', error))
      }
      this._logHistory('Treatment item added', `${condMeta.label} on tooth ${fdi}${surface ? `-${surface}` : ''}`)
    },

    _removeTreatmentItem(fdi, surface, condition) {
      const idx = this.treatmentPlan.findIndex(
        i => i.fdi === fdi && i.surface === surface && i.condition === condition
      )
      if (idx === -1) return
      const item = this.treatmentPlan[idx]
      this.treatmentPlan.splice(idx, 1)
      if (item.id) {
        patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deleteTreatmentPlanItem', error))
      }
      this._logHistory('Treatment item removed', `${condition} on tooth ${fdi}${surface ? `-${surface}` : ''}`)
    },

    async updateTreatmentItem(itemOrId, patch) {
      const item = typeof itemOrId === 'object' ? itemOrId
        : this.treatmentPlan.find(i => i.id === itemOrId || i._tempId === itemOrId)
      if (!item) return
      Object.assign(item, patch)
      if (item.id) {
        await patientChartingService.updateTreatmentPlanItem({ id: item.id, ...patch }).catch((error) => this._logError('updateTreatmentPlanItem', error))
      }
      this._logHistory('Treatment item updated', item.conditionLabel || item.condition || `Tooth ${item.fdi}`)
    },

    async removeTreatmentItemById(id) {
      const idx = this.treatmentPlan.findIndex(i => i.id === id || i._tempId === id)
      if (idx !== -1) {
        const item = this.treatmentPlan[idx]
        this.treatmentPlan.splice(idx, 1)
        // Also clear from chart
        if (item.fdi && this.chart[item.fdi]) {
          if (item.surface && this.chart[item.fdi].surfaces[item.surface]) {
            this.chart[item.fdi].surfaces[item.surface] = { condition: null, status: 'existing' }
          } else {
            this.chart[item.fdi].toothCondition = null
          }
          this._scheduleSave(item.fdi)
        }
        if (item.id) {
          await patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deleteTreatmentPlanItemById', error))
        }
        this._logHistory('Treatment item removed', item.conditionLabel || item.condition || `${item.fdi}`)
      }
    },

    reorderTreatmentPlan(fromOrPayload, toMaybe = null) {
      const appointmentId = typeof fromOrPayload === 'object' ? fromOrPayload.appointmentId : null
      const fromIndex = typeof fromOrPayload === 'object' ? fromOrPayload.from : fromOrPayload
      const toIndex = typeof fromOrPayload === 'object' ? fromOrPayload.to : toMaybe
      if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') return

      const planId = this.activePlanId || DEFAULT_PLAN_ID
      const activeItems = [...this.treatmentPlan]
        .filter((i) => (i.planId || DEFAULT_PLAN_ID) === planId)
        .sort((a, b) => a.priority - b.priority)
      let nextActiveItems = activeItems

      if (appointmentId) {
        const scoped = activeItems.filter(i => (i.appointmentGroupId || DEFAULT_APPOINTMENT_ID) === appointmentId)
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= scoped.length || toIndex >= scoped.length) return
        const [moved] = scoped.splice(fromIndex, 1)
        scoped.splice(toIndex, 0, moved)

        let scopedCursor = 0
        nextActiveItems = activeItems.map((item) => {
          if ((item.appointmentGroupId || DEFAULT_APPOINTMENT_ID) !== appointmentId) return item
          const replacement = scoped[scopedCursor]
          scopedCursor += 1
          return replacement
        })
      } else {
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= activeItems.length || toIndex >= activeItems.length) return
        const [moved] = nextActiveItems.splice(fromIndex, 1)
        nextActiveItems.splice(toIndex, 0, moved)
      }

      nextActiveItems.forEach((item, i) => { item.priority = i + 1 })
      const updatedIds = new Set(nextActiveItems.map((i) => i.id || i._tempId))
      this.treatmentPlan = this.treatmentPlan.map((item) => {
        const key = item.id || item._tempId
        if (!updatedIds.has(key)) return item
        return nextActiveItems.find((x) => (x.id || x._tempId) === key) || item
      })
      if (this.patientId) {
        const scopedItems = appointmentId
          ? nextActiveItems.filter(i => (i.appointmentGroupId || DEFAULT_APPOINTMENT_ID) === appointmentId)
          : nextActiveItems
        const orderedIds = scopedItems.filter(i => i.id).map(i => i.id)
        if (!orderedIds.length) return
        patientChartingService.reorderTreatmentPlan({ patientId: this.patientId, orderedIds, appointmentGroupId: appointmentId }).catch((error) => this._logError('reorderTreatmentPlan', error))
      }
      this._logHistory('Treatment items reordered', appointmentId ? `Group ${appointmentId}` : 'Whole plan')
    },

    // ── Debounced save per tooth ─────────────────────────────────────────
    _scheduleSave(fdi) {
      this.isDirty = true
      clearTimeout(_saveTimers[fdi])
      _saveTimers[fdi] = setTimeout(() => {
        this._saveTooth(fdi)
      }, 600)
    },

    async _saveTooth(fdi) {
      if (!this.patientId) return
      try {
        await patientChartingService.saveTooth({ patientId: this.patientId, fdi, toothData: this.chart[fdi] })
        this.isDirty = false
      } catch (error) {
        this._logError('_saveTooth', error)
        // Silent — user can use manual save
      }
    },

    async saveFullChart() {
      if (!this.patientId) return
      this.isSaving = true
      try {
        await patientChartingService.saveChart({ patientId: this.patientId, chart: this.chart })
        this.isDirty = false
      } finally {
        this.isSaving = false
      }
    },

    // ── New UI state mutations ───────────────────────────────────────────
    setTeethType(type) {
      if (type !== 'permanent') return
      this.teethType = type
    },
    setToothStatus(fdi, status) {
      this.toothStatuses = { ...this.toothStatuses, [fdi]: status }
    },
    addAppointment() {
      const n = this.appointments.length + 1
      this.appointments.push({ id: `appt-${Date.now()}`, name: `Appointment ${n}`, status: 'pending' })
      this._saveActivePlanAppointments()
      this._logHistory('Appointment group added', `Plan ${this.activePlanId}`)
    },
    deleteAppointment(id) {
      this.appointments = this.appointments.filter(a => a.id !== id)
      this.treatmentPlan = this.treatmentPlan.filter(i => i.appointmentGroupId !== id)
      if (!this.appointments.length) this.appointments = [{ ...DEFAULT_APPOINTMENT }]
      this._saveActivePlanAppointments()
      this._logHistory('Appointment group deleted', id)
    },
    updateAppointment(id, patch) {
      const appt = this.appointments.find(a => a.id === id)
      if (appt) Object.assign(appt, patch)
      this._saveActivePlanAppointments()
    },
    addTreatmentPlan(payload = null) {
      this._normalizePlans()
      const nextId = `plan-${Date.now()}`
      const usedNumbers = new Set(
        this.plans
          .map((p) => /^Treatment Plan\s+(\d+)$/i.exec(String(p.name || '').trim()))
          .filter(Boolean)
          .map((m) => Number(m[1]))
      )
      let nextNumber = 1
      while (usedNumbers.has(nextNumber)) nextNumber += 1
      const requestedName = String(payload?.name || '').trim()
      const name = requestedName || `Treatment Plan ${nextNumber}`
      this.plans.push({
        id: nextId,
        name,
        color: payload?.color || this._nextPlanColor(this.plans.length),
        appointments: [{ ...DEFAULT_APPOINTMENT }],
      })
      this.activePlanId = nextId
      this._syncActivePlanAppointments()
      this._persistUiState()
      this._logHistory('Treatment plan added', name)
      return nextId
    },
    selectTreatmentPlan(planId) {
      if (!this.plans.some((p) => p.id === planId)) return
      this.activePlanId = planId
      this._syncActivePlanAppointments()
      this._persistUiState()
    },
    renameTreatmentPlan(planId, name) {
      const plan = this.plans.find((p) => p.id === planId)
      if (!plan || !name) return
      plan.name = String(name).trim()
      this.treatmentPlan.forEach((item) => {
        if ((item.planId || DEFAULT_PLAN_ID) === planId) {
          item.planName = plan.name
          if (item.id) {
            patientChartingService.updateTreatmentPlanItem({ id: item.id, planName: plan.name }).catch((error) => this._logError('renamePlanItem', error))
          }
        }
      })
      this._persistUiState()
      this._logHistory('Treatment plan renamed', plan.name)
    },
    updateTreatmentPlanColor(planId, color) {
      const plan = this.plans.find((p) => p.id === planId)
      if (!plan || !color) return
      plan.color = color
      this._persistUiState()
      this._logHistory('Treatment plan color changed', `${plan.name} -> ${color}`)
    },
    deleteTreatmentPlan(planId) {
      if (this.plans.length <= 1) return false
      const fallback = this.plans.find((p) => p.id !== planId)?.id || DEFAULT_PLAN_ID
      const removedItems = this.treatmentPlan.filter((item) => (item.planId || DEFAULT_PLAN_ID) === planId)
      this.treatmentPlan = this.treatmentPlan.filter((item) => (item.planId || DEFAULT_PLAN_ID) !== planId)
      removedItems.filter((i) => i.id).forEach((item) => {
        patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deletePlanItem', error))
      })
      this.plans = this.plans.filter((p) => p.id !== planId)
      this.activePlanId = fallback
      this._syncActivePlanAppointments()
      this._persistUiState()
      this._logHistory('Treatment plan deleted', planId)
      return true
    },
    duplicateTreatmentPlan(planId) {
      const source = this.plans.find((p) => p.id === planId)
      if (!source) return null
      const newId = `plan-${Date.now()}`
      const newName = `${source.name} Copy`
      this.plans.push({
        id: newId,
        name: newName,
        color: source.color || this._nextPlanColor(this.plans.length),
        appointments: (source.appointments || [{ ...DEFAULT_APPOINTMENT }]).map((a) => ({ ...a, id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      })
      const sourceItems = this.treatmentPlan.filter((item) => (item.planId || DEFAULT_PLAN_ID) === planId)
      sourceItems.forEach((item) => {
        const duplicated = { ...item, id: null, _tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, planId: newId, planName: newName, appointmentId: null }
        this.treatmentPlan.push(duplicated)
        if (this.patientId) {
          patientChartingService.createTreatmentPlanItem({ patientId: this.patientId, ...duplicated })
            .then((res) => { if (res?.code === 0 && res.data?.id) duplicated.id = res.data.id })
            .catch((error) => this._logError('duplicatePlanItem', error))
        }
      })
      this.activePlanId = newId
      this._syncActivePlanAppointments()
      this._persistUiState()
      this._logHistory('Treatment plan duplicated', newName)
      return newId
    },
    toggleFavoriteCode(codeId) {
      if (this.favoriteCodeIds.includes(codeId)) this.favoriteCodeIds = this.favoriteCodeIds.filter((id) => id !== codeId)
      else this.favoriteCodeIds = [...this.favoriteCodeIds, codeId]
      this._persistUiState()
    },
    setAppointmentLink(groupId, link) {
      this.appointmentLinks = { ...this.appointmentLinks, [groupId]: link || '' }
      this._persistUiState()
      this._logHistory('Appointment link updated', groupId)
    },
    setIntervalDays(days) {
      const interval = Math.max(0, Number(days || 0))
      this.appointments = this.appointments.map((a, idx) => ({ ...a, intervalDays: idx === 0 ? 0 : interval }))
      this._saveActivePlanAppointments()
      this._logHistory('Interval updated', `${interval} day(s)`)
    },
    async addChartImage(file) {
      if (!file) return
      const toDataUrl = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(f)
      })
      const url = await toDataUrl(file)
      this.chartImages.unshift({ id: `img-${Date.now()}`, name: file.name || 'image', url, uploadedAt: new Date().toISOString() })
      this.chartImages = this.chartImages.slice(0, 100)
      this._persistUiState()
      this._logHistory('Image added', file.name || 'image')
    },
    removeChartImage(id) {
      this.chartImages = this.chartImages.filter((img) => img.id !== id)
      this._persistUiState()
      this._logHistory('Image removed', id)
    },
    setActiveCode(codeId) {
      this.activeCodeId = this.activeCodeId === codeId ? null : codeId
    },

    // ── Appointment booking ──────────────────────────────────────────────
    async checkAppointmentConflict({ date, startTime, endTime, dentistId }) {
      try {
        const res = await patientChartingService.checkConflict({ date, startTime, endTime, dentistId, patientId: this.patientId })
        return res?.data || { hasConflict: false, conflicts: [] }
      } catch (error) {
        this._logError('checkAppointmentConflict', error)
        return { hasConflict: false, conflicts: [] }
      }
    },

    async bookInDiary({ appointmentId, date, startTime, endTime, dentistId, notes }) {
      const appt = this.appointments.find(a => a.id === appointmentId)
      if (!appt) return null
      const items = this.treatmentPlan.filter(i => (i.appointmentGroupId || DEFAULT_APPOINTMENT_ID) === appointmentId && (i.planId || DEFAULT_PLAN_ID) === (this.activePlanId || DEFAULT_PLAN_ID))
      if (!items.length) {
        return { code: 1, message: 'No treatment items assigned to this appointment.' }
      }
      const start = new Date(`${date}T${startTime?.length === 5 ? `${startTime}:00` : startTime}`)
      const end = new Date(`${date}T${endTime?.length === 5 ? `${endTime}:00` : endTime}`)
      if (isNaN(start) || isNaN(end) || end <= start) {
        return { code: 1, message: 'Invalid booking time range.' }
      }
      const persistedIds = items.filter(i => i.id).map(i => i.id)
      if (!persistedIds.length) {
        return { code: 1, message: 'Treatment items must be saved before booking.' }
      }
      try {
        const res = await patientChartingService.bookAppointmentInDiary({
          patientId: this.patientId,
          date,
          startTime,
          endTime,
          dentistId,
          notes,
          treatmentItemIds: persistedIds,
        })
        if (res?.code === 0) {
          appt.diaryAppointmentId = res.data?.id
          appt.status = 'scheduled'
          this._saveActivePlanAppointments()
          const linkedIds = new Set(res?.data?.linkedTreatmentItemIds || [])
          this.treatmentPlan.forEach((item) => {
            if (linkedIds.has(item.id) && item.status !== 'completed') {
              item.status = 'scheduled'
              item.appointmentId = res.data?.id || item.appointmentId
            }
          })
          this._logHistory('Appointment booked in diary', `${date} ${startTime}-${endTime}`)
        }
        return res
      } catch (error) {
        this._logError('bookInDiary', error)
        return null
      }
    },

    // ── UI state mutations ───────────────────────────────────────────────
    setMode(mode) {
      this.mode = mode
    },
    setCondition(condition) {
      // Toggle off if same
      if (this.activeCondition === condition) {
        this.activeCondition = null
        this.bridgeSelectMode = false
        this.bridgeStartFdi = null
      } else {
        this.activeCondition = condition
        if (condition !== 'bridge') {
          this.bridgeSelectMode = false
          this.bridgeStartFdi = null
        }
      }
    },
    setNotation(notation) {
      this.notation = notation
    },
    selectTooth(fdi) {
      this.selectedToothFdi = this.selectedToothFdi === fdi ? null : fdi
    },
    clearTooth(fdi) {
      if (!this.chart[fdi]) return
      this.chart[fdi] = createDefaultTooth(fdi)
      this._scheduleSave(fdi)
    },
    reset() {
      this.patientId = null
      this.chart = {}
      this.treatmentPlan = []
      this.mode = 'examination'
      this.activeCondition = null
      this.notation = 'FDI'
      this.selectedToothFdi = null
      this.bridgeSelectMode = false
      this.bridgeStartFdi = null
      this.isDirty = false
      this.teethType = 'permanent'
      this.toothStatuses = {}
      this.appointments = [{ ...DEFAULT_APPOINTMENT }]
      this.plans = [{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: DEFAULT_PLAN_COLOR, appointments: [{ ...DEFAULT_APPOINTMENT }] }]
      this.activePlanId = DEFAULT_PLAN_ID
      this.favoriteCodeIds = []
      this.chartImages = []
      this.historyEntries = []
      this.appointmentLinks = {}
      this.activeCodeId = null
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePatientChartingStore, import.meta.hot))
}

