import patientChartingService from '~/services/patientChartingService'
import diaryService from '~/services/diaryService'
import { createDefaultTooth, UPPER_ARCH, LOWER_ARCH, DECIDUOUS_UPPER_ARCH, DECIDUOUS_LOWER_ARCH, CONDITIONS, TOOTH_STATUSES } from '~/components/patients/charting/toothData.js'
import {
  DEFAULT_APPOINTMENT_ID,
  DEFAULT_PLAN_ID,
  DEFAULT_PLAN_NAME,
  resolveTreatmentMapping,
  applyBaseToothStatus,
  makeDefaultAppointment,
  makeDefaultPlan,
  getPlanColor,
} from '~/shared/defaults/charting/chartingDefaults.js'

// Module-level timer map — not reactive, just for debouncing
const _saveTimers = {}
const STATUS_ANNOTATION_CODE = '__STATUS_ANNOTATION__'
const DIAGNOSIS_ANNOTATION_CODE = '__DIAGNOSIS_ANNOTATION__'
const DIAGNOSIS_LABELS = {
  drifted_mesially: 'Drifted Mesially',
  drifted_distally: 'Drifted Distally',
  rotated_mesially: 'Rotated Mesially',
  rotated_distally: 'Rotated Distally',
  over_erupted: 'Over Erupted',
  impacted: 'Impacted',
  mobile: 'Mobile',
}

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
    lastSavedAt: null,
    // New UI state
    teethType: 'permanent',
    chartScope: 'both',         // 'base' | 'plan' | 'both'
    toothStatuses: {},          // map of fdi → status string
    appointments: [makeDefaultAppointment()],
    plans: [makeDefaultPlan()],
    activePlanId: DEFAULT_PLAN_ID,
    favoriteCodeIds: [],
    chartImages: [],
    historyEntries: [],
    appointmentLinks: {},
    activeCodeId: null,         // currently selected code from right panel
    treatmentCatalog: [],
    practitioners: [],
    periData: {},
    softTissueData: {},
    riskData: {},
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
    async loadTreatmentCatalog() {
      try {
        const res = await patientChartingService.listTreatments()
        if (res?.code !== 0) return
        this.treatmentCatalog = (res.data || []).map((t) => ({
          id: t.id,
          code: t.code || String(t.id),
          name: t.name || 'Treatment',
          category: t.category || 'Other',
          active: t.active !== false,
          color: t.color || '#0061FB',
          amount: Number(t.price ?? t.amount ?? 0),
          price: Number(t.price ?? t.amount ?? 0),
          defaultDuration: Number(t.defaultDuration ?? t.duration ?? 0),
          ...resolveTreatmentMapping(t),
        }))
        this._hydrateTreatmentItemsFromCatalog()
      } catch (error) {
        this._logError('loadTreatmentCatalog', error)
      }
    },
    _hydrateTreatmentItemsFromCatalog() {
      if (!Array.isArray(this.treatmentPlan) || !this.treatmentPlan.length || !Array.isArray(this.treatmentCatalog) || !this.treatmentCatalog.length) return
      const byId = new Map(this.treatmentCatalog.map((item) => [Number(item.id), item]))
      const byCode = new Map(
        this.treatmentCatalog
          .filter((item) => item.code)
          .map((item) => [String(item.code).trim().toUpperCase(), item])
      )
      this.treatmentPlan = this.treatmentPlan.map((item) => {
        if ([STATUS_ANNOTATION_CODE, DIAGNOSIS_ANNOTATION_CODE].includes(String(item.treatmentCode || ''))) return item
        const catalogItem = byId.get(Number(item.treatmentId || 0))
          || byCode.get(String(item.treatmentCode || '').trim().toUpperCase())
        if (!catalogItem) return item
        return {
          ...item,
          treatmentId: item.treatmentId || catalogItem.id,
          treatmentCode: item.treatmentCode || catalogItem.code || null,
          treatmentName: item.treatmentName || catalogItem.name || null,
          treatmentCategory: item.treatmentCategory || catalogItem.category || null,
          conditionLabel: item.conditionLabel || item.treatmentName || catalogItem.name || item.condition || null,
          duration: Number(item.duration ?? catalogItem.defaultDuration ?? 0),
          cost: Number(item.cost ?? catalogItem.price ?? 0),
        }
      })
    },
    _rebuildToothStatusesFromItems() {
      const nextStatuses = {}
      ;(this.treatmentPlan || []).forEach((item) => {
        if (String(item.status || '').toLowerCase() !== 'existing') return
        const fdi = Number(item.fdi || 0)
        if (!fdi) return
        if (!this.chart[fdi]) this.chart[fdi] = createDefaultTooth(fdi)
        const prev = nextStatuses[fdi] && typeof nextStatuses[fdi] === 'object' ? nextStatuses[fdi] : {}
        if (String(item.treatmentCode || '') === STATUS_ANNOTATION_CODE) {
          nextStatuses[fdi] = { ...prev, status: item.condition || '' }
          applyBaseToothStatus(this.chart[fdi], item.condition || null)
        }
        if (String(item.treatmentCode || '') === DIAGNOSIS_ANNOTATION_CODE) {
          nextStatuses[fdi] = { ...prev, diagnosis: item.condition || '' }
          this.chart[fdi].diagnosis = item.condition || null
        }
      })
      this.toothStatuses = nextStatuses
    },
    async loadPractitioners(date = '') {
      try {
        const res = await diaryService.listDentists(date)
        if (res?.code !== 0) return
        this.practitioners = (res.data || []).map((d) => ({
          id: Number(d.id),
          name: d.name || 'Practitioner',
        }))
      } catch (error) {
        this._logError('loadPractitioners', error)
      }
    },
    _getActiveTreatment() {
      if (!this.activeCodeId) return null
      return this.treatmentCatalog.find((t) => String(t.id) === String(this.activeCodeId)) || null
    },
    async _persistChartMeta() {
      if (!this.patientId) return
      const meta = {
        images: this.chartImages.slice(0, 100),
        history: this.historyEntries.slice(0, 200),
        links: this.appointmentLinks,
        favoriteCodeIds: this.favoriteCodeIds,
        softTissue: this.softTissueData,
        riskAssessment: this.riskData,
      }
      await patientChartingService.saveChartMeta({ patientId: this.patientId, meta }).catch((error) => this._logError('saveChartMeta', error))
    },
    _defaultAppointments() {
      return [makeDefaultAppointment()]
    },
    _getChartToothIds() {
      if (this.teethType === 'deciduous') {
        return [...DECIDUOUS_UPPER_ARCH, ...DECIDUOUS_LOWER_ARCH]
      }
      if (this.teethType === 'mixed') {
        return Array.from(new Set([
          ...UPPER_ARCH,
          ...LOWER_ARCH,
          ...DECIDUOUS_UPPER_ARCH,
          ...DECIDUOUS_LOWER_ARCH,
        ]))
      }
      return [...UPPER_ARCH, ...LOWER_ARCH]
    },
    _upsertPlanRemote(plan, extraPayload = {}, errorContext = 'upsertTreatmentPlan') {
      if (!this.patientId || !plan?.id) return
      patientChartingService.updateTreatmentPlan({
        patientId: this.patientId,
        planKey: plan.id,
        ...extraPayload,
      }).catch((error) => this._logError(errorContext, error))
    },
    _createPlanRemote(plan, priority = 1, errorContext = 'createTreatmentPlan') {
      if (!this.patientId || !plan?.id) return
      patientChartingService.createTreatmentPlan({
        patientId: this.patientId,
        planKey: plan.id,
        name: plan.name,
        color: plan.color,
        appointments: plan.appointments || this._defaultAppointments(),
        priority,
      }).catch((error) => this._logError(errorContext, error))
    },
    _syncItemPlanName(planId, planName) {
      this.treatmentPlan.forEach((item) => {
        if ((item.planId || DEFAULT_PLAN_ID) !== planId) return
        item.planName = planName
        if (item.id) {
          patientChartingService.updateTreatmentPlanItem({ id: item.id, planName }).catch((error) => this._logError('syncItemPlanName', error))
        }
      })
    },
    _nextPlanColor(index = 0) {
      return getPlanColor(index)
    },
    _normalizePlans() {
      if (!Array.isArray(this.plans) || !this.plans.length) {
        this.plans = [makeDefaultPlan()]
        return
      }
      this.plans = this.plans.map((plan, idx) => ({
        id: plan.id || `plan-${Date.now()}-${idx}`,
        name: String(plan.name || '').trim() || `Treatment Plan ${idx + 1}`,
        color: plan.color || this._nextPlanColor(idx),
        appointments: Array.isArray(plan.appointments) && plan.appointments.length ? plan.appointments : this._defaultAppointments(),
      }))
      const autoPattern = /^Treatment Plan\s+\d+$/i
      const autoNamed = this.plans.every((p) => autoPattern.test(String(p.name || '').trim()))
      if (autoNamed) {
        this.plans = this.plans.map((p, idx) => ({ ...p, name: `Treatment Plan ${idx + 1}` }))
      }
    },
    _logHistory(action, details = '') {
      this.historyEntries.unshift({
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        details,
        at: new Date().toISOString(),
      })
      this.historyEntries = this.historyEntries.slice(0, 200)
      this._persistChartMeta()
    },
    _syncActivePlanAppointments() {
      const plan = this.plans.find((p) => p.id === this.activePlanId) || this.plans[0]
      if (!plan) return
      if (!Array.isArray(plan.appointments) || !plan.appointments.length) {
        plan.appointments = this._defaultAppointments()
      }
      this.activePlanId = plan.id
      this.appointments = plan.appointments.map((a) => ({ ...a }))
    },
    _saveActivePlanAppointments() {
      const idx = this.plans.findIndex((p) => p.id === this.activePlanId)
      if (idx === -1) return
      this.plans[idx].appointments = this.appointments.map((a) => ({ ...a }))
      const plan = this.plans[idx]
      this._upsertPlanRemote(plan, { appointments: plan.appointments }, 'updateTreatmentPlanAppointments')
    },
    // ── Initialise chart for a patient ──────────────────────────────────
    async loadChart(patientId) {
      this.toothStatuses = {}
      this.appointments = this._defaultAppointments()
      this.plans = [makeDefaultPlan()]
      this.activePlanId = DEFAULT_PLAN_ID
      this.activeCodeId = null
      this.patientId = patientId
      this._syncActivePlanAppointments()
      this.isLoading = true
      // Build blank chart using correct dentition
      const blankChart = {}
      this._getChartToothIds().forEach((fdi) => {
        blankChart[fdi] = createDefaultTooth(fdi)
      })
      this.chart = blankChart

      try {
        const res = await patientChartingService.getChart(patientId)
        if (res?.code === 0 && res.data?.chart) {
          // Merge API data over defaults so any new teeth still get defaults
          const apiChart = res.data.chart
          const { periodontal: _peri, ...toothData } = apiChart
          if (_peri) this.periData = _peri
          Object.keys(toothData).forEach(fdi => {
            const numFdi = Number(fdi)
            if (isNaN(numFdi)) return
            this.chart[numFdi] = { ...createDefaultTooth(numFdi), ...toothData[fdi] }
          })
        }
        const meta = res?.data?.meta || {}
        this.chartImages = Array.isArray(meta.images) ? meta.images : []
        this.historyEntries = Array.isArray(meta.history) ? meta.history : []
        this.appointmentLinks = meta.links && typeof meta.links === 'object' ? meta.links : {}
        this.favoriteCodeIds = Array.isArray(meta.favoriteCodeIds) ? meta.favoriteCodeIds : []
        this.softTissueData = (meta.softTissue && typeof meta.softTissue === 'object') ? meta.softTissue : {}
        this.riskData = (meta.riskAssessment && typeof meta.riskAssessment === 'object') ? meta.riskAssessment : {}
      } catch (error) {
        this._logError('loadChart', error)
        // Chart will show blank — that's fine for a new patient
      } finally {
        this.isLoading = false
      }

      // Load plan structures/items and treatment code catalog
      await Promise.all([
        this.loadTreatmentPlan(patientId),
        this.loadTreatmentCatalog(),
        this.loadPractitioners(),
      ])
    },

    async loadTreatmentPlan(patientId) {
      try {
        const [plansRes, itemsRes] = await Promise.all([
          patientChartingService.listTreatmentPlans(patientId),
          patientChartingService.listTreatmentPlanItems(patientId),
        ])
        const planRows = plansRes?.code === 0 ? (plansRes.data || []) : []
        const itemRows = itemsRes?.code === 0 ? (itemsRes.data || []) : []
        if (planRows.length) {
          this.plans = planRows.map((plan, idx) => ({
            id: plan.planKey || `plan-${Date.now()}-${idx}`,
            name: String(plan.name || '').trim() || `Treatment Plan ${idx + 1}`,
            color: plan.color || this._nextPlanColor(idx),
            appointments: Array.isArray(plan.appointments) && plan.appointments.length ? plan.appointments : this._defaultAppointments(),
          }))
        }
        const rows = itemRows.map((item) => ({
          ...item,
          planId: item.planId || DEFAULT_PLAN_ID,
          planName: item.planName || DEFAULT_PLAN_NAME,
          appointmentGroupId: item.appointmentGroupId || (
            ['planned', 'scheduled', 'completed'].includes(String(item.status || '').toLowerCase())
              ? DEFAULT_APPOINTMENT_ID
              : null
          ),
        }))
        this.treatmentPlan = rows
        this._hydrateTreatmentItemsFromCatalog()
        this._rebuildToothStatusesFromItems()
        const existingPlanIds = new Set(this.plans.map((p) => p.id))
        rows.forEach((item) => {
          if (!existingPlanIds.has(item.planId)) {
            this.plans.push({
              id: item.planId,
              name: item.planName || `Treatment Plan ${this.plans.length + 1}`,
              color: this._nextPlanColor(this.plans.length),
              appointments: this._defaultAppointments(),
            })
            existingPlanIds.add(item.planId)
          }
        })
        this._normalizePlans()
        this.plans = this.plans.map((plan) => {
          const groupIds = new Set(
            rows
              .filter((i) => (i.planId || DEFAULT_PLAN_ID) === plan.id)
              .map((i) => i.appointmentGroupId)
              .filter(Boolean)
          )
          const existingAppts = Array.isArray(plan.appointments) ? plan.appointments : this._defaultAppointments()
          const merged = [...existingAppts]
          groupIds.forEach((gid) => {
            if (!merged.some((a) => a.id === gid)) merged.push({ id: gid, name: `Appointment ${merged.length + 1}`, status: 'pending' })
          })
          return { ...plan, appointments: merged.length ? merged : this._defaultAppointments() }
        })
        if (!this.plans.some((p) => p.id === this.activePlanId)) this.activePlanId = this.plans[0]?.id || DEFAULT_PLAN_ID
        this._syncActivePlanAppointments()
      } catch (error) {
        this._logError('loadTreatmentPlan', error)
        this.treatmentPlan = []
      }
    },

    // ── Apply condition to a surface or full tooth ───────────────────────
    applyCondition(fdi, surface) {
      const selectedTreatment = this._getActiveTreatment()
      const mappedCondition = selectedTreatment?.conditionKey || null
      const condition = this.activeCondition || mappedCondition
      const condMeta = condition ? CONDITIONS[condition] : null
      const hasConditionFlow = !!(condition && condMeta)

      if (!hasConditionFlow && !selectedTreatment) return

      if (!this.chart[fdi]) {
        this.chart[fdi] = createDefaultTooth(fdi)
      }
      const tooth = this.chart[fdi]
      const status = this.mode === 'treatment' ? 'planned'
                   : this.mode === 'completed' ? 'completed'
                   : 'existing'

      if (hasConditionFlow && condition === 'missing') {
        // Toggle missing
        tooth.missing = !tooth.missing
        if (tooth.missing) {
          tooth.toothCondition = null
          tooth.surfaces = Object.fromEntries(
            Object.keys(tooth.surfaces).map(s => [s, { condition: null, status: 'existing' }])
          )
        }
        this._scheduleSave(fdi)
        this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status, selectedTreatment)
        return
      }

      if (hasConditionFlow && condition === 'bridge') {
        this._handleBridgeClick(fdi)
        return
      }

      if (hasConditionFlow && condMeta.fullTooth && !condMeta.surface) {
        // Full-tooth condition — apply regardless of which surface was clicked
        const wasApplied = tooth.toothCondition === condition
        tooth.toothCondition = wasApplied ? null : condition
        tooth.toothConditionStatus = wasApplied ? 'existing' : status
        if (condition === 'implant') tooth.implant = !wasApplied
        if (!wasApplied) {
          this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status, selectedTreatment)
        } else {
          this._removeTreatmentItem(fdi, null, condition, status, selectedTreatment)
        }
      } else if (hasConditionFlow && condMeta.surface && surface) {
        // Surface condition
        const surf = tooth.surfaces[surface]
        if (!surf) return
        const wasApplied = surf.condition === condition
        surf.condition = wasApplied ? null : condition
        surf.status    = wasApplied ? 'existing' : status
        if (!wasApplied) {
          this._maybeAddTreatmentItem(fdi, surface, condition, condMeta, status, selectedTreatment)
        } else {
          this._removeTreatmentItem(fdi, surface, condition, status, selectedTreatment)
        }
      } else if (hasConditionFlow && condMeta.fullTooth) {
        // Can also act as full-tooth if surface supports it
        const wasApplied = tooth.toothCondition === condition
        tooth.toothCondition = wasApplied ? null : condition
        tooth.toothConditionStatus = wasApplied ? 'existing' : status
        if (!wasApplied) this._maybeAddTreatmentItem(fdi, null, condition, condMeta, status, selectedTreatment)
        else this._removeTreatmentItem(fdi, null, condition, status, selectedTreatment)
      } else if (selectedTreatment) {
        // Some treatment codes do not map cleanly to a chart condition.
        // Persist a treatment plan item directly so the click still has a useful effect.
        this._maybeAddTreatmentItem(
          fdi,
          surface || null,
          null,
          null,
          status,
          selectedTreatment
        )
      }

      if (hasConditionFlow) this._scheduleSave(fdi)
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
    _maybeAddTreatmentItem(fdi, surface, condition, condMeta, status, treatment = null) {
      const isBaseChartItem = status === 'existing'
      const treatmentId = treatment?.id || null
      const treatmentCode = treatment?.code || null
      const treatmentName = treatment?.name || null
      // Fix #7 — name-based dedup was too broad (same treatment name on different teeth
      // would be falsely deduplicated). Now match by treatmentId first, then code, then condition.
      const exists = this.treatmentPlan.find(
        (i) => {
          if (i.fdi !== fdi || i.surface !== surface) return false
          const itemIsBase = !i.appointmentGroupId
          if (itemIsBase !== isBaseChartItem) return false
          if (treatmentId) return Number(i.treatmentId || 0) === Number(treatmentId)
          if (treatmentCode) return String(i.treatmentCode || '') === String(treatmentCode)
          return i.condition === condition
        }
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
        conditionLabel: treatmentName || condMeta?.label || null,
        treatmentId,
        treatmentCode,
        treatmentName,
        treatmentCategory: treatment?.category || null,
        cost: Number(treatment?.price ?? 0),
        priority,
        status,
        notes: '',
        appointmentGroupId: isBaseChartItem ? null : (this.appointments[0]?.id || DEFAULT_APPOINTMENT_ID),
        appointmentId: null,
        clinicianName: '',
        practitionerId: null,
        practitionerName: '',
        duration: Number(treatment?.defaultDuration || 0),
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
      const label = item.treatmentName || item.conditionLabel || item.condition || 'Treatment'
      this._logHistory('Treatment item added', `${label} on tooth ${fdi}${surface ? `-${surface}` : ''}`)
    },

    _removeTreatmentItem(fdi, surface, condition, status = 'planned', treatment = null) {
      const isBaseChartItem = status === 'existing'
      const treatmentId = treatment?.id || null
      const treatmentCode = treatment?.code || null
      const idx = this.treatmentPlan.findIndex(
        (i) => {
          if (i.fdi !== fdi || i.surface !== surface) return false
          const itemIsBase = !i.appointmentGroupId
          if (itemIsBase !== isBaseChartItem) return false
          if (treatmentId) return Number(i.treatmentId || 0) === Number(treatmentId)
          if (treatmentCode) return String(i.treatmentCode || '') === String(treatmentCode)
          return i.condition === condition
        }
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
        this.lastSavedAt = Date.now()
      } catch (error) {
        this._logError('_saveTooth', error)
        // Silent — user can use manual save
      }
    },

    async saveFullChart() {
      if (!this.patientId) return
      this.isSaving = true
      try {
        await patientChartingService.saveChart({
          patientId: this.patientId,
          chart: { ...this.chart, periodontal: this.periData || {} },
        })
        this.isDirty = false
        this.lastSavedAt = Date.now()
      } finally {
        this.isSaving = false
      }
    },
    _schedulePerioSave() {
      clearTimeout(_saveTimers.periodontal)
      _saveTimers.periodontal = setTimeout(() => {
        this._savePerioData()
      }, 700)
    },
    async _savePerioData() {
      if (!this.patientId) return
      try {
        await patientChartingService.saveChart({
          patientId: this.patientId,
          chart: { ...this.chart, periodontal: this.periData || {} },
        })
      } catch (error) {
        this._logError('_savePerioData', error)
      }
    },

    // ── New UI state mutations ───────────────────────────────────────────
    setTeethType(type) {
      if (!['permanent', 'deciduous', 'mixed'].includes(type)) return
      this.teethType = type
    },
    setChartScope(scope) {
      if (!['base', 'plan', 'both'].includes(scope)) return
      this.chartScope = scope
    },
    _statusLabel(status) {
      if (!status) return ''
      return TOOTH_STATUSES.find((s) => s.value === status)?.label || String(status).replace(/_/g, ' ')
    },
    _diagnosisLabel(diagnosis) {
      if (!diagnosis) return ''
      return DIAGNOSIS_LABELS[diagnosis] || String(diagnosis).replace(/_/g, ' ')
    },
    _syncBaseAnnotationItem(fdi, markerCode, condition, conditionLabel) {
      const idx = this.treatmentPlan.findIndex((i) =>
        Number(i.fdi) === Number(fdi)
        && !i.surface
        && String(i.status || '') === 'existing'
        && String(i.treatmentCode || '') === markerCode
      )

      if (!condition) {
        if (idx === -1) return
        const item = this.treatmentPlan[idx]
        this.treatmentPlan.splice(idx, 1)
        if (item?.id) {
          patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deleteAnnotationItem', error))
        }
        return
      }

      if (idx !== -1) {
        const item = this.treatmentPlan[idx]
        item.condition = condition
        item.conditionLabel = conditionLabel
        if (item.id) {
          patientChartingService.updateTreatmentPlanItem({
            id: item.id,
            condition,
            conditionLabel,
            status: 'existing',
          }).catch((error) => this._logError('updateAnnotationItem', error))
        }
        return
      }

      const item = {
        _tempId: `${Date.now()}-${fdi}-${markerCode}`,
        planId: this.activePlanId || DEFAULT_PLAN_ID,
        planName: this.plans.find((p) => p.id === (this.activePlanId || DEFAULT_PLAN_ID))?.name || DEFAULT_PLAN_NAME,
        fdi: Number(fdi),
        surface: null,
        condition,
        conditionLabel,
        treatmentId: null,
        treatmentCode: markerCode,
        treatmentName: null,
        treatmentCategory: null,
        cost: 0,
        priority: this.treatmentPlan.length + 1,
        status: 'existing',
        notes: '',
        appointmentGroupId: null,
        appointmentId: null,
        clinicianName: '',
        practitionerId: null,
        practitionerName: '',
        duration: 0,
        createdAt: new Date().toISOString(),
      }
      this.treatmentPlan.push(item)
      if (this.patientId) {
        patientChartingService.createTreatmentPlanItem({ patientId: this.patientId, ...item })
          .then((res) => {
            if (res?.code === 0 && res.data?.id) item.id = res.data.id
          })
          .catch((error) => this._logError('createAnnotationItem', error))
      }
    },
    setToothStatus(fdi, status, rowId = 'base') {
      const key = `${rowId}:${fdi}`
      const prev = this.toothStatuses[key]
      const prevObj = (prev && typeof prev === 'object') ? prev : {}
      const legacyPrev = this.toothStatuses[fdi]
      const legacyObj = (legacyPrev && typeof legacyPrev === 'object') ? legacyPrev : {}
      this.toothStatuses = {
        ...this.toothStatuses,
        [key]: { ...prevObj, status },
        [fdi]: { ...legacyObj, status },
      }
      if (String(rowId).includes('base')) {
        if (!this.chart[fdi]) this.chart[fdi] = createDefaultTooth(fdi)
        applyBaseToothStatus(this.chart[fdi], status)
        const normalized = status && status !== 'present' ? status : null
        this._syncBaseAnnotationItem(fdi, STATUS_ANNOTATION_CODE, normalized, this._statusLabel(normalized))
        this._scheduleSave(fdi)
      }
    },
    setToothDiagnosis(fdi, diagnosis, rowId = 'base') {
      const key = `${rowId}:${fdi}`
      const prev = this.toothStatuses[key]
      const prevObj = (prev && typeof prev === 'object') ? prev : {}
      const legacyPrev = this.toothStatuses[fdi]
      const legacyObj = (legacyPrev && typeof legacyPrev === 'object') ? legacyPrev : {}
      this.toothStatuses = {
        ...this.toothStatuses,
        [key]: { ...prevObj, diagnosis },
        [fdi]: { ...legacyObj, diagnosis },
      }
      if (String(rowId).includes('base')) {
        if (!this.chart[fdi]) this.chart[fdi] = createDefaultTooth(fdi)
        this.chart[fdi].diagnosis = diagnosis || null
        const normalized = diagnosis || null
        this._syncBaseAnnotationItem(fdi, DIAGNOSIS_ANNOTATION_CODE, normalized, this._diagnosisLabel(normalized))
        this._scheduleSave(fdi)
      }
    },
    setPerioData(data = {}) {
      this.periData = (data && typeof data === 'object') ? data : {}
      this._schedulePerioSave()
    },
    setSoftTissueData(data = {}) {
      this.softTissueData = (data && typeof data === 'object') ? data : {}
      this._persistChartMeta()
    },
    setRiskData(data = {}) {
      this.riskData = (data && typeof data === 'object') ? data : {}
      this._persistChartMeta()
    },
    async markItemComplete(itemOrId, practitionerId = null, practitionerName = '') {
      const item = typeof itemOrId === 'object' ? itemOrId
        : this.treatmentPlan.find(i => i.id === itemOrId || i._tempId === itemOrId)
      if (!item) return

      const resolvedPractitionerId = practitionerId || item.practitionerId || null
      const resolvedPractitionerName = practitionerName
        || item.practitionerName
        || item.clinicianName
        || this.practitioners.find((p) => Number(p.id) === Number(resolvedPractitionerId))?.name
        || ''

      const patch = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedByPractitionerId: resolvedPractitionerId || null,
        completedByPractitionerName: resolvedPractitionerName || null,
      }
      if (resolvedPractitionerId && !item.practitionerId) patch.practitionerId = resolvedPractitionerId
      if (resolvedPractitionerName && !item.practitionerName) {
        patch.practitionerName = resolvedPractitionerName
        patch.clinicianName = resolvedPractitionerName
      }

      await this.updateTreatmentItem(item, patch)

      const groupId = item.appointmentGroupId || DEFAULT_APPOINTMENT_ID
      const inGroup = this.treatmentItems.filter((i) => (i.appointmentGroupId || DEFAULT_APPOINTMENT_ID) === groupId)
      if (inGroup.length && inGroup.every((i) => String(i.status || '').toLowerCase() === 'completed')) {
        this.updateAppointment(groupId, { status: 'completed' })
      }
    },
    addAppointment() {
      const n = this.appointments.length + 1
      this.appointments.push({ id: `appt-${Date.now()}`, name: `Appointment ${n}`, status: 'pending' })
      this._saveActivePlanAppointments()
      this._logHistory('Appointment group added', `Plan ${this.activePlanId}`)
    },
    deleteAppointment(id) {
      const removedItems = this.treatmentPlan.filter(i => i.appointmentGroupId === id)
      this.appointments = this.appointments.filter(a => a.id !== id)
      this.treatmentPlan = this.treatmentPlan.filter(i => i.appointmentGroupId !== id)
      removedItems.filter((i) => i.id).forEach((item) => {
        patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deleteAppointmentItems', error))
      })
      if (!this.appointments.length) this.appointments = this._defaultAppointments()
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
        appointments: this._defaultAppointments(),
      })
      this.activePlanId = nextId
      this._syncActivePlanAppointments()
      const createdPlan = this.plans.find((p) => p.id === nextId)
      this._createPlanRemote(createdPlan, this.plans.length, 'createTreatmentPlan')
      this._logHistory('Treatment plan added', name)
      return nextId
    },
    selectTreatmentPlan(planId) {
      if (!this.plans.some((p) => p.id === planId)) return
      this.activePlanId = planId
      this._syncActivePlanAppointments()
    },
    renameTreatmentPlan(planId, name) {
      const plan = this.plans.find((p) => p.id === planId)
      if (!plan || !name) return
      plan.name = String(name).trim()
      this._syncItemPlanName(planId, plan.name)
      this._upsertPlanRemote(plan, { name: plan.name }, 'renameTreatmentPlan')
      this._logHistory('Treatment plan renamed', plan.name)
    },
    updateTreatmentPlanColor(planId, color) {
      const plan = this.plans.find((p) => p.id === planId)
      if (!plan || !color) return
      plan.color = color
      this._upsertPlanRemote(plan, { color }, 'updateTreatmentPlanColor')
      this._logHistory('Treatment plan color changed', `${plan.name} -> ${color}`)
    },
    deleteTreatmentPlan(planId) {
      const deletingLastPlan = this.plans.length <= 1
      const fallback = this.plans.find((p) => p.id !== planId)?.id || DEFAULT_PLAN_ID
      const removedItems = this.treatmentPlan.filter((item) => (item.planId || DEFAULT_PLAN_ID) === planId)
      this.treatmentPlan = this.treatmentPlan.filter((item) => (item.planId || DEFAULT_PLAN_ID) !== planId)
      removedItems.filter((i) => i.id).forEach((item) => {
        patientChartingService.deleteTreatmentPlanItem(item.id).catch((error) => this._logError('deletePlanItem', error))
      })
      this.plans = this.plans.filter((p) => p.id !== planId)

      if (!this.plans.length || deletingLastPlan) {
        const replacementId = `plan-${Date.now()}`
        const replacementPlan = {
          id: replacementId,
          name: 'Treatment Plan 1',
          color: this._nextPlanColor(0),
          appointments: this._defaultAppointments(),
        }
        this.plans = [replacementPlan]
        this.activePlanId = replacementId
        this._syncActivePlanAppointments()
        this._createPlanRemote(replacementPlan, 1, 'recreateTreatmentPlanAfterDelete')
      } else {
        this.activePlanId = fallback
        this._syncActivePlanAppointments()
      }

      if (this.patientId) {
        patientChartingService.deleteTreatmentPlan({ patientId: this.patientId, planKey: planId })
          .catch((error) => this._logError('deleteTreatmentPlan', error))
      }
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
        appointments: (source.appointments || this._defaultAppointments()).map((a) => ({ ...a, id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
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
      const duplicatedPlan = this.plans.find((p) => p.id === newId)
      this._createPlanRemote(duplicatedPlan, this.plans.length, 'duplicateCreatePlan')
      this._logHistory('Treatment plan duplicated', newName)
      return newId
    },
    toggleFavoriteCode(codeId) {
      if (this.favoriteCodeIds.includes(codeId)) this.favoriteCodeIds = this.favoriteCodeIds.filter((id) => id !== codeId)
      else this.favoriteCodeIds = [...this.favoriteCodeIds, codeId]
      this._persistChartMeta()
    },
    setAppointmentLink(groupId, link) {
      this.appointmentLinks = { ...this.appointmentLinks, [groupId]: link || '' }
      this._logHistory('Appointment link updated', groupId)
    },
    setIntervalDays(days) {
      const interval = Math.max(0, Number(days || 0))
      this.appointments = this.appointments.map((a, idx) => ({ ...a, intervalDays: idx === 0 ? 0 : interval }))
      this._saveActivePlanAppointments()
      this._logHistory('Interval updated', `${interval} day(s)`)
    },
    async addChartImage(file, meta = {}) {
      if (!file || !this.patientId) return
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientId', String(this.patientId))
      try {
        const res = await patientChartingService.uploadChartImage(formData)
        if (res?.code === 0 && res.data?.url) {
          const image = {
            id: `img-${Date.now()}`,
            name: res.data.name || file.name || 'image',
            url: res.data.url,
            type: meta.type || '',
            grade: meta.grade || '',
            developedBy: meta.developedBy || null,
            developedByName: meta.developedByName || '',
            justification: meta.justification || '',
            takenBy: meta.takenBy || null,
            takenByName: meta.takenByName || '',
            dateTaken: meta.dateTaken || new Date().toISOString().slice(0, 10),
            description: meta.description || '',
            uploadedAt: new Date().toISOString(),
          }
          this.chartImages.unshift(image)
          this.chartImages = this.chartImages.slice(0, 100)
          this._persistChartMeta()
          this._logHistory('Image added', file.name || 'image')
      }
      return res
      } catch (e) {
        this._logError('addChartImage', e)
        return e
      }
    },
    removeChartImage(id) {
      this.chartImages = this.chartImages.filter((img) => img.id !== id)
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
          appt.date = date
          appt.startTime = startTime
          appt.endTime = endTime
          appt.dentistId = dentistId || null
          appt.dentistName = this.practitioners.find((p) => Number(p.id) === Number(dentistId))?.name || appt.dentistName || ''
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
      this.chartScope = 'both'
      this.toothStatuses = {}
      this.appointments = this._defaultAppointments()
      this.plans = [makeDefaultPlan()]
      this.activePlanId = DEFAULT_PLAN_ID
      this.favoriteCodeIds = []
      this.chartImages = []
      this.historyEntries = []
      this.appointmentLinks = {}
      this.activeCodeId = null
      this.treatmentCatalog = []
      this.practitioners = []
      this.periData = {}
      this.softTissueData = {}
      this.riskData = {}
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePatientChartingStore, import.meta.hot))
}
