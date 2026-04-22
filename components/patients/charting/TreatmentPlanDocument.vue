<template>
  <div class="tpd-wrap">
    <div v-if="showActions" class="tpd-topbar no-print">
      <v-menu location="bottom start" offset="8">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" class="tpd-action-btn tpd-action-btn--share" rounded="lg" prepend-icon="mdi-send-outline">Share</v-btn>
        </template>
        <v-list density="compact" min-width="180">
          <v-list-item title="Email" prepend-icon="mdi-email-outline" @click="emit('share-email')" />
          <v-list-item v-if="whatsappEnabled" title="WhatsApp" prepend-icon="mdi-whatsapp" @click="emit('share-whatsapp')" />
        </v-list>
      </v-menu>
      <v-btn class="tpd-action-btn" rounded="lg" prepend-icon="mdi-printer-outline" @click="printDoc">Print</v-btn>
      <v-btn class="tpd-action-btn tpd-action-btn--download" rounded="lg" prepend-icon="mdi-download-outline" @click="emit('download')">Download</v-btn>
    </div>

    <div ref="docEl" class="tpd-doc">
      <section class="tpd-page tpd-page--cover">
        <div class="tpd-cover-photo">
          <img :src="coverImage" alt="Clinic cover" @error="onImgError" />
        </div>
        <div class="tpd-cover-title-wrap">
          <div class="tpd-cover-title">{{ resolvedContent.cover.title || practiceName || 'Dental Practice' }}</div>
          <div class="tpd-cover-subtitle">{{ resolvedContent.cover.subtitle || 'Personalised Treatment Plan' }}</div>
        </div>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>

      <section v-if="sections.clinicInfo || sections.dentistInfo" class="tpd-page">
        <div v-if="sections.clinicInfo" class="tpd-two-col">
          <div>
            <h2 class="tpd-h2">{{ resolvedContent.practice.title || 'About the Clinic' }}</h2>
            <p class="tpd-body">{{ clinicAbout }}</p>
          </div>
          <div class="tpd-media-wrap"><img :src="clinicImage" alt="Clinic" @error="onImgError" /></div>
        </div>

        <div v-if="sections.dentistInfo && dentistsToShow.length" class="tpd-dentists">
          <div v-for="(dentist, idx) in dentistsToShow" :key="`${dentist.id || dentist.name}-${idx}`" class="tpd-dentist-card">
            <div class="tpd-media-wrap"><img :src="dentist.imageUrl || coverImage" alt="Dentist" @error="onImgError" /></div>
            <div class="tpd-dentist-content">
              <h2 class="tpd-h2">About the Dentist</h2>
              <div class="tpd-dentist-name">{{ dentist.name }}</div>
              <p v-if="dentist.role" class="tpd-body tpd-body--tight">{{ dentist.role }}</p>
              <p class="tpd-body">{{ dentist.bio || 'Assigned clinician for this treatment plan.' }}</p>
            </div>
          </div>
        </div>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>

      <section v-if="sections.diagnosis" class="tpd-page">
        <h2 class="tpd-h2">Diagnoses</h2>
        <div class="tpd-chart-shot">
          <ToothChart
            :chart="diagnosisChart || {}"
            :notation="notation"
            :active-condition="null"
            :selected-tooth-fdi="null"
            :chart-scope="'base'"
            :bridge-select-mode="false"
            :bridge-start-fdi="null"
            :tooth-statuses="toothStatuses || {}"
            :treatment-items="[]"
            :teeth-type="teethType"
          />
        </div>
        <p class="tpd-body">
          After a detailed dental examination and digital X-ray analysis, the following conditions have been identified:
        </p>
        <ul v-if="baseItems.length" class="tpd-list">
          <li v-for="item in baseItems" :key="item.id || item._tempId">
            <strong>{{ toothLabel(item) }}</strong> {{ item.conditionLabel || item.condition || 'Finding' }}
          </li>
        </ul>
        <p v-else class="tpd-body">No diagnosis findings recorded yet.</p>
        <p class="tpd-body">Early treatment is recommended to prevent further complications and ensure long-term oral health.</p>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>

      <section v-if="sections.treatmentPlan" class="tpd-page">
        <h2 class="tpd-h2">Treatment Plan</h2>
        <div class="tpd-chart-shot">
          <ToothChart
            :chart="treatmentChart || {}"
            :notation="notation"
            :active-condition="null"
            :selected-tooth-fdi="null"
            :chart-scope="'plan'"
            :bridge-select-mode="false"
            :bridge-start-fdi="null"
            :tooth-statuses="toothStatuses || {}"
            :treatment-items="planItems"
            :teeth-type="teethType"
          />
        </div>
        <div v-for="appt in appointmentsWithItems" :key="appt.id" class="tpd-appt-block">
          <div class="tpd-appt-head">
            <span>{{ appt.name }}</span>
            <span>£{{ appt.subtotal }}</span>
          </div>
          <div v-for="item in appt.items" :key="item.id || item._tempId" class="tpd-appt-row">
            <span>{{ item.treatmentName || item.conditionLabel || item.condition || 'Treatment' }}</span>
            <span>£{{ formatCost(item.cost) }}</span>
          </div>
        </div>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>

      <section v-if="sections.paymentPlan || sections.consentForm" class="tpd-page">
        <div v-if="sections.paymentPlan">
          <h2 class="tpd-h2">Payment Plan</h2>
          <div class="tpd-pay-table">
            <div class="tpd-pay-head"><span>Treatment</span><span>Cost</span></div>
            <div v-for="item in planItems" :key="`pay-${item.id || item._tempId}`" class="tpd-pay-row">
              <span>{{ item.treatmentName || item.conditionLabel || item.condition || 'Treatment' }}</span>
              <span>£{{ formatCost(item.cost) }}</span>
            </div>
            <div class="tpd-pay-total"><span>Total Estimated Cost:</span><span>£{{ totalFormatted }}</span></div>
          </div>
          <p class="tpd-body">{{ resolvedContent.paymentPlan.intro || 'Flexible payment options are available. Patients may choose installment plans based on the treatment schedule.' }}</p>
        </div>

        <div v-if="sections.consentForm" class="tpd-consent">
          <h2 class="tpd-h2">Consent Form</h2>
          <p class="tpd-body">{{ resolvedContent.consentForm.intro || 'I confirm that I have been informed about my dental condition and the recommended treatment plan. The procedures, possible risks, benefits, and alternative treatment options have been explained to me.' }}</p>
          <div class="tpd-signatures">
            <div class="tpd-signature"><div class="line" /><div>Patient signature &amp; date</div></div>
            <div class="tpd-signature"><div class="line" /><div>Clinician signature &amp; date</div></div>
          </div>
        </div>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>

      <section v-if="sections.testimonial" class="tpd-page">
        <h2 class="tpd-h2">Testimonials</h2>
        <div class="tpd-testimonials">
          <div v-for="(quote, idx) in testimonials" :key="idx" class="tpd-testimonial">
            "{{ quote }}"
          </div>
        </div>
        <div class="tpd-footer-email">{{ footerEmail }}</div>
      </section>
    </div>
  </div>
</template>

<script setup>
import ToothChart from './ToothChart.vue'
import { getToothLabel } from './toothData.js'
import { mergeTreatmentPlanContent, normalizeTreatmentPlanContent } from '~/shared/defaults/charting/treatmentPlanContent.js'

const props = defineProps({
  activePlan: { type: Object, default: null },
  planRef: { type: String, default: 'TP-01' },
  items: { type: Array, default: () => [] },
  appointments: { type: Array, default: () => [] },
  notation: { type: String, default: 'FDI' },
  patientName: { type: String, default: '' },
  practiceName: { type: String, default: '' },
  practitionerName: { type: String, default: '' },
  practitioners: { type: Array, default: () => [] },
  showActions: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: false },
  sections: { type: Object, default: () => ({ clinicInfo: true, dentistInfo: true, diagnosis: true, treatmentPlan: true, paymentPlan: true, consentForm: false, testimonial: false }) },
  baseItems: { type: Array, default: () => [] },
  organisationEmail: { type: String, default: '' },
  content: { type: Object, default: () => ({}) },
  defaultContent: { type: Object, default: () => ({}) },
  diagnosisChart: { type: Object, default: () => ({}) },
  treatmentChart: { type: Object, default: () => ({}) },
  toothStatuses: { type: Object, default: () => ({}) },
  teethType: { type: String, default: 'permanent' },
})

const emit = defineEmits(['share-email', 'share-whatsapp', 'download'])
const docEl = ref(null)

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'%3ENo image available%3C/text%3E%3C/svg%3E"

function onImgError(e) {
  e.target.src = PLACEHOLDER_IMG
  e.target.style.objectFit = 'contain'
  e.target.style.padding = '20px'
}

function makeHtmlAbsolute(html) {
  const origin = window.location.origin
  return html.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, src, post) => {
    if (src.startsWith('data:') || /^https?:\/\//i.test(src)) return match
    return `${pre}${origin}${src.startsWith('/') ? '' : '/'}${src}${post}`
  })
}

const footerEmail = computed(() => props.organisationEmail || 'info@clinic.com')
const resolvedContent = computed(() => mergeTreatmentPlanContent(props.content || {}, props.defaultContent || {}))
const coverImage = computed(() => resolvedContent.value.cover.imageUrl || resolvedContent.value.practice.imageUrl || '/assets/images/loginBanner.svg')
const clinicImage = computed(() => resolvedContent.value.practice.imageUrl || coverImage.value)
const clinicAbout = computed(() => resolvedContent.value.practice.about || `${props.practiceName || 'Our clinic'} provides modern, patient-focused dental care.`)
const sections = computed(() => ({ clinicInfo: true, dentistInfo: true, diagnosis: true, treatmentPlan: true, paymentPlan: true, consentForm: false, testimonial: false, ...(props.sections || {}) }))
const planItems = computed(() => props.items.filter((i) => String(i.status || '') !== 'existing'))
const dentistsToShow = computed(() => {
  if (resolvedContent.value.dentists.length) return resolvedContent.value.dentists
  if (props.practitioners?.length) return props.practitioners.map((dentist) => normalizeTreatmentPlanContent({ dentists: [dentist] }).dentists[0]).filter(Boolean)
  return props.practitionerName ? [{ id: null, name: props.practitionerName, role: 'Dentist', bio: '', imageUrl: coverImage.value }] : []
})
const testimonials = computed(() => {
  const raw = resolvedContent.value.testimonials
  if (Array.isArray(raw) && raw.length) return raw.slice(0, 6)
  return ['Excellent service and very professional staff.', 'The treatment process was clear and comfortable.']
})

const appointmentsWithItems = computed(() =>
  props.appointments
    .map((appt) => {
      const items = planItems.value.filter((i) => (i.appointmentGroupId || 'appt-1') === appt.id)
      const subtotal = items.reduce((sum, i) => sum + Number(i.cost || 0), 0)
      return { ...appt, items, subtotal: subtotal.toFixed(2) }
    })
    .filter((a) => a.items.length)
)
const totalFormatted = computed(() => planItems.value.reduce((sum, i) => sum + Number(i.cost || 0), 0).toFixed(2))

function toothLabel(item) {
  const base = getToothLabel(item.fdi, props.notation)
  return item.surface ? `${base}-${item.surface.charAt(0).toUpperCase()}` : base
}

function formatCost(val) {
  return Number(val || 0).toFixed(2)
}

function printDoc() {
  const el = docEl.value
  if (!el) return
  const html = makeHtmlAbsolute(el.outerHTML)
  const styles = Array.from(document.styleSheets).reduce((acc, ss) => {
    try { return acc + Array.from(ss.cssRules).map((r) => r.cssText).join('\n') } catch { return acc }
  }, '')
  const win = window.open('', '_blank', 'width=1024,height=900')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Treatment Plan</title><style>${styles}</style></head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

function getDocumentHtml() {
  return docEl.value?.outerHTML || ''
}

defineExpose({ getDocumentHtml, printDoc })
</script>

<style scoped>
.tpd-wrap { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 0; }
.tpd-topbar { display: flex; justify-content: flex-end; gap: 8px; }
.tpd-action-btn { min-width: 108px; background: #0f63ff; color: #fff; box-shadow: none; text-transform: none; }
.tpd-action-btn--share { background: #7f73ff; }
.tpd-action-btn--download { background: #18296f; }

.tpd-doc { display: flex; flex-direction: column; gap: 20px; }
.tpd-page { background: #ececec; border: 1px solid #d8d8d8; min-height: 1122px; width: 794px; margin: 0 auto; padding: 28px 34px 56px; position: relative; break-after: page; }
.tpd-page--cover { padding: 0 0 56px; overflow: hidden; }
.tpd-footer-email { position: absolute; bottom: 22px; left: 0; right: 0; text-align: center; font-size: 11px; letter-spacing: 0.02em; color: #111; }

.tpd-cover-photo img { width: 100%; height: 760px; object-fit: cover; display: block; }
.tpd-cover-title-wrap { background: linear-gradient(90deg, #b7852b 0%, #7f5415 100%); color: #fff; margin: 0 88px; transform: translateY(-38px) skewX(-20deg); padding: 26px 34px; }
.tpd-cover-title-wrap > * { transform: skewX(20deg); }
.tpd-cover-title { font-size: 34px; font-weight: 700; line-height: 1.1; }
.tpd-cover-subtitle { font-size: 16px; margin-top: 8px; }

.tpd-h2 { font-size: 28px; font-weight: 700; margin: 0 0 18px; color: #1f1f23; line-height: 1.1; }
.tpd-body { font-size: 14px; line-height: 1.6; color: #23252c; margin: 0 0 18px; white-space: pre-line; }
.tpd-body--tight { margin-bottom: 8px; }

.tpd-two-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 22px; align-items: start; margin-bottom: 24px; }
.tpd-media-wrap { border-radius: 28px; overflow: hidden; background: #ddd; min-height: 240px; }
.tpd-media-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }

.tpd-dentists { display: flex; flex-direction: column; gap: 18px; }
.tpd-dentist-card { display: grid; grid-template-columns: 1fr 1.2fr; gap: 18px; align-items: stretch; border-top: 1px solid #d3d3d3; padding-top: 18px; }
.tpd-dentist-content { display: flex; flex-direction: column; }
.tpd-dentist-name { font-size: 22px; font-weight: 700; color: #fff; background: #8a651a; padding: 8px 16px; width: fit-content; margin-bottom: 14px; }

.tpd-chart-shot { background: #fff; border: 1px solid #d3d3d3; border-radius: 20px; padding: 10px; margin: 8px 0 18px; overflow: hidden; }
.tpd-chart-shot :deep(.tooth-chart) { pointer-events: none; transform: scale(0.86); transform-origin: top left; width: 115%; margin-bottom: -64px; }

.tpd-list { font-size: 14px; color: #23252c; padding-left: 22px; line-height: 1.6; margin: 0 0 16px; }
.tpd-list li { margin-bottom: 6px; }

.tpd-appt-block { margin-top: 16px; }
.tpd-appt-head { display: flex; justify-content: space-between; background: #d1d1d1; font-size: 16px; font-weight: 700; padding: 12px 18px; }
.tpd-appt-row { display: flex; justify-content: space-between; font-size: 14px; padding: 10px 18px; border-bottom: 1px solid #dedede; }

.tpd-pay-table { margin: 12px 0 16px; }
.tpd-pay-head, .tpd-pay-row, .tpd-pay-total { display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 10px 14px; font-size: 14px; }
.tpd-pay-head { font-weight: 700; }
.tpd-pay-total { background: #d1d1d1; font-weight: 700; margin-top: 8px; }

.tpd-consent { margin-top: 24px; }
.tpd-signatures { display: flex; gap: 40px; margin-top: 28px; }
.tpd-signature { flex: 1; font-size: 12px; color: #555; }
.tpd-signature .line { height: 1px; background: #333; margin-bottom: 6px; }

.tpd-testimonials { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.tpd-testimonial { background: #fff; border-radius: 18px; border: 1px solid #ddd; padding: 18px; font-size: 14px; line-height: 1.6; }

@media print {
  .no-print { display: none !important; }
  .tpd-doc { gap: 0; }
  .tpd-page { width: 210mm; min-height: 297mm; margin: 0; border: none; box-shadow: none; page-break-after: always; }
}
</style>
