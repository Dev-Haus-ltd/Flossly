<template>
  <div class="tpd-wrap">
    <!-- Document card -->
    <div ref="docEl" class="tpd-doc">
      <!-- Header -->
      <div class="tpd-doc__header">
        <div class="tpd-doc__header-left">
          <div class="tpd-doc__practice">{{ practiceName || 'Dental Practice' }}</div>
          <div class="tpd-doc__title">Treatment Plan</div>
          <div class="tpd-doc__ref">{{ planRef }}</div>
        </div>
        <div class="tpd-doc__header-right">
          <div class="tpd-doc__meta-row"><span>Patient:</span> <strong>{{ patientName || '—' }}</strong></div>
          <div class="tpd-doc__meta-row"><span>Date:</span> <strong>{{ today }}</strong></div>
          <div class="tpd-doc__meta-row"><span>Plan:</span> <strong>{{ activePlan?.name || 'Treatment Plan' }}</strong></div>
          <div v-if="practitionerName" class="tpd-doc__meta-row"><span>Practitioner:</span> <strong>{{ practitionerName }}</strong></div>
        </div>
      </div>

      <!-- Items table -->
      <template v-if="appointments.length">
        <div v-for="appt in appointmentsWithItems" :key="appt.id" class="tpd-appt-section">
          <div class="tpd-appt-title">{{ appt.name }}</div>
          <table class="tpd-table">
            <thead>
              <tr>
                <th>Tooth</th>
                <th>Treatment</th>
                <th>Duration</th>
                <th class="tpd-th--right">Fee (£)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in appt.items" :key="item.id || item._tempId">
                <td>{{ toothLabel(item) }}</td>
                <td>{{ item.treatmentName || item.conditionLabel || item.condition || '—' }}</td>
                <td>{{ item.duration ? `${item.duration} min` : '—' }}</td>
                <td class="tpd-td--right">{{ formatCost(item.cost) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <div v-else class="tpd-empty">No treatment plan items added yet.</div>

      <!-- Footer totals -->
      <div class="tpd-footer">
        <div v-if="nhsBand" class="tpd-nhs-note">
          NHS Band {{ nhsBand }} charge may apply. Please confirm at reception.
        </div>
        <div class="tpd-total-row">
          <span class="tpd-total-label">Total estimated fee</span>
          <span class="tpd-total-value">£{{ totalFormatted }}</span>
        </div>
        <div class="tpd-total-note">* Fees are estimates and may vary based on clinical findings.</div>
      </div>

      <!-- Consent checkboxes -->
      <div class="tpd-consent">
        <div class="tpd-consent__title">Patient Agreement</div>
        <div v-for="item in consentItems" :key="item" class="tpd-consent-row">
          <span class="tpd-consent-box" :class="{ 'tpd-consent-box--checked': checkedConsent.has(item) }" @click="toggleConsent(item)">
            <v-icon v-if="checkedConsent.has(item)" size="12" color="white">mdi-check</v-icon>
          </span>
          <span class="tpd-consent-text">{{ item }}</span>
        </div>
      </div>

      <!-- Signature -->
      <div class="tpd-signatures">
        <div class="tpd-sig">
          <div class="tpd-sig__line" />
          <div class="tpd-sig__label">Patient signature &amp; date</div>
        </div>
        <div class="tpd-sig">
          <div class="tpd-sig__line" />
          <div class="tpd-sig__label">Clinician signature &amp; date</div>
        </div>
      </div>
    </div>

    <!-- Action bar (hidden in print) -->
    <div v-if="showActions" class="tpd-actions no-print">
      <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-printer-outline" @click="printDoc">Print</v-btn>
      <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-share-variant-outline" @click="emit('share')">Share</v-btn>
      <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-download-outline" @click="_openPrintWindow">Download PDF</v-btn>
    </div>
  </div>
</template>

<script setup>
import { getToothLabel } from './toothData.js'

const props = defineProps({
  activePlan: { type: Object, default: null },
  planRef: { type: String, default: 'TP-01' },
  items: { type: Array, default: () => [] },
  appointments: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  patientName: { type: String, default: '' },
  practiceName: { type: String, default: '' },
  practitionerName: { type: String, default: '' },
  showActions: { type: Boolean, default: false },
})

const emit = defineEmits(['share', 'download'])

const docEl = ref(null)

const today = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
})

const planItems = computed(() => props.items.filter(i => String(i.status || '') !== 'existing'))

const appointmentsWithItems = computed(() =>
  props.appointments
    .map(appt => ({
      ...appt,
      items: planItems.value.filter(i => (i.appointmentGroupId || 'appt-1') === appt.id),
    }))
    .filter(a => a.items.length)
)

const totalFormatted = computed(() =>
  planItems.value.reduce((sum, i) => sum + Number(i.cost || 0), 0).toFixed(2)
)

const NHS_BAND3_KEYS = ['crown', 'bridge', 'denture', 'veneer', 'implant', 'onlay', 'inlay']
const NHS_BAND2_KEYS = ['fill', 'extract', 'root canal', 'rct', 'composite', 'amalgam', 'deep scale', 'periodon', 'surgery']

const nhsBand = computed(() => {
  const items = planItems.value
  if (!items.length) return null
  const text = items.map(i => `${i.treatmentName || ''} ${i.treatmentCode || ''} ${i.condition || ''}`).join(' ').toLowerCase()
  if (NHS_BAND3_KEYS.some(k => text.includes(k))) return 3
  if (NHS_BAND2_KEYS.some(k => text.includes(k))) return 2
  return 1
})

const CONSENT_ITEMS = [
  'The proposed treatment has been explained to me including risks and alternatives.',
  'I understand the estimated fees and payment terms.',
  'I consent to the treatment plan outlined above.',
  'I have been given the opportunity to ask questions.',
]

const checkedConsent = ref(new Set())

function toggleConsent(item) {
  const s = new Set(checkedConsent.value)
  if (s.has(item)) s.delete(item)
  else s.add(item)
  checkedConsent.value = s
}

const consentItems = CONSENT_ITEMS

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation)
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function formatCost(val) {
  return Number(val || 0).toFixed(2)
}

function printDoc() {
  _openPrintWindow()
}

function _openPrintWindow() {
  const el = docEl.value
  if (!el) return
  const html = el.outerHTML
  const win = window.open('', '_blank', 'width=820,height=700')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Treatment Plan</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:24px;background:#fff;color:#222}
    table{width:100%;border-collapse:collapse;margin-bottom:12px}
    th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:13px}
    th{font-weight:600;background:#f9fafb;color:#374151}
    .tpd-td--right,.tpd-th--right{text-align:right}
    .tpd-doc__header{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb}
    .tpd-doc__practice{font-size:18px;font-weight:700;color:#0061FB;margin-bottom:4px}
    .tpd-doc__title{font-size:14px;font-weight:600;color:#374151}
    .tpd-doc__ref{font-size:12px;color:#6b7280}
    .tpd-doc__meta-row{font-size:13px;color:#374151;margin-bottom:3px}
    .tpd-appt-title{font-size:13px;font-weight:600;color:#374151;padding:10px 0 6px;border-bottom:1px solid #f0f0f0;margin-bottom:6px}
    .tpd-footer{margin-top:20px;padding-top:12px;border-top:2px solid #e5e7eb}
    .tpd-total-row{display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#111827;margin:8px 0}
    .tpd-total-note,.tpd-nhs-note{font-size:11px;color:#6b7280;margin-top:4px}
    .tpd-consent{margin-top:20px}.tpd-consent__title{font-size:13px;font-weight:600;margin-bottom:8px}
    .tpd-consent-row{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151;margin-bottom:6px}
    .tpd-consent-box{width:14px;height:14px;border:2px solid #9ca3af;border-radius:3px;flex-shrink:0;display:inline-block}
    .tpd-signatures{display:flex;gap:40px;margin-top:32px}
    .tpd-sig__line{height:1px;background:#374151;margin-bottom:6px}
    .tpd-sig__label{font-size:11px;color:#6b7280}
    .tpd-actions,.no-print{display:none!important}
  </style></head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}
</script>

<style scoped>
.tpd-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

/* ── Document card ──────────────────────────────────────────────── */
.tpd-doc {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 32px 36px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* ── Header ─────────────────────────────────────────────────────── */
.tpd-doc__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #0061FB;
  gap: 16px;
  flex-wrap: wrap;
}

.tpd-doc__practice {
  font-size: 15px;
  font-weight: 700;
  color: #0061FB;
  margin-bottom: 4px;
}

.tpd-doc__title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 2px;
}

.tpd-doc__ref {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.tpd-doc__meta-row {
  font-size: 13px;
  color: #555;
  text-align: right;
  line-height: 1.7;
}

.tpd-doc__meta-row span {
  color: #999;
  margin-right: 4px;
}

/* ── Appointment sections ────────────────────────────────────────── */
.tpd-appt-section {
  margin-bottom: 20px;
}

.tpd-appt-title {
  font-size: 12px;
  font-weight: 700;
  color: #0061FB;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

/* ── Table ──────────────────────────────────────────────────────── */
.tpd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tpd-table th {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 6px 10px;
  background: #f8f9fb;
  border-bottom: 1px solid #e8e8e8;
  text-align: left;
}

.tpd-th--right,
.tpd-td--right {
  text-align: right;
}

.tpd-table td {
  padding: 8px 10px;
  color: #333;
  border-bottom: 1px solid #f2f2f2;
}

/* ── Footer totals ──────────────────────────────────────────────── */
.tpd-footer {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #e8e8e8;
}

.tpd-nhs-note {
  font-size: 12px;
  color: #2563eb;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #eff6ff;
  border-radius: 6px;
}

.tpd-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.tpd-total-label {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.tpd-total-value {
  font-size: 18px;
  font-weight: 700;
  color: #0061FB;
}

.tpd-total-note {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

/* ── Consent ────────────────────────────────────────────────────── */
.tpd-consent {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.tpd-consent__title {
  font-size: 12px;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.tpd-consent-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.tpd-consent-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #ccc;
  border-radius: 3px;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: background 0.15s, border-color 0.15s;
}

.tpd-consent-box--checked {
  background: #0061FB;
  border-color: #0061FB;
}

.tpd-consent-text {
  font-size: 12px;
  color: #555;
  line-height: 1.5;
}

/* ── Signatures ─────────────────────────────────────────────────── */
.tpd-signatures {
  display: flex;
  gap: 40px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.tpd-sig {
  flex: 1;
}

.tpd-sig__line {
  height: 1px;
  background: #333;
  margin-bottom: 6px;
}

.tpd-sig__label {
  font-size: 11px;
  color: #888;
}

/* ── Action bar ─────────────────────────────────────────────────── */
.tpd-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.tpd-empty {
  text-align: center;
  padding: 32px;
  font-size: 13px;
  color: #bbb;
}

/* ── Print styles ───────────────────────────────────────────────── */
@media print {
  .no-print { display: none !important; }
  .tpd-doc {
    border: none;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
  }
  .tpd-consent-box {
    cursor: default;
  }
}
</style>
