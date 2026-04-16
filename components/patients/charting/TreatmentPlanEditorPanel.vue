<template>
  <div class="tpe-wrap">
    <div class="tpe-header">
      <div>
        <div class="tpe-title">Treatment Plan Builder</div>
        <div class="tpe-hint">Edit content, upload a cover image, and refine the live preview.</div>
      </div>
      <div class="tpe-actions">
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-auto-fix"
          :loading="aiGenerating"
          @click="generateAiContent"
        >
          Generate AI Draft
        </v-btn>
        <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-refresh" @click="resetContentDraft">
          Reset
        </v-btn>
      </div>
    </div>

    <div v-if="aiWarnings.length" class="tpe-feedback tpe-feedback--warn">
      <div v-for="warning in aiWarnings" :key="warning">{{ warning }}</div>
    </div>

    <div v-if="aiSources.length" class="tpe-sources">
      <div class="tpe-sources__title">AI sources</div>
      <a
        v-for="source in aiSources"
        :key="`${source.label}-${source.url}`"
        class="tpe-sources__link"
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ source.label || source.url }}
      </a>
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title">Sections</div>
      <div class="tpe-sections">
        <button
          v-for="section in sectionOptions"
          :key="section.key"
          class="tpe-section-chip"
          :class="{ 'tpe-section-chip--active': isSectionEnabled(section.key) }"
          @click="toggleSection(section.key)"
        >
          <v-icon size="14">{{ isSectionEnabled(section.key) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
          <span>{{ section.label }}</span>
        </button>
      </div>
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title">Cover</div>
      <div class="tpe-cover-grid">
        <div class="tpe-cover-upload">
          <CommonFileUpload isSingle @onFiles="onCoverFiles" />
          <div class="tpe-upload-actions">
            <span class="tpe-upload-hint">
              {{ coverUploading ? 'Uploading cover image...' : 'Upload a cover image for page 1.' }}
            </span>
          </div>
        </div>
        <div class="tpe-cover-preview">
          <img v-if="resolvedCoverPreview" :src="resolvedCoverPreview" alt="Cover preview" class="tpe-cover-preview__img" />
          <div v-else class="tpe-cover-preview__empty">No cover image selected</div>
        </div>
      </div>
      <div class="tpe-form-grid tpe-form-grid--single mt-4">
        <div>
          <label class="fld-lbl">Title</label>
          <v-text-field v-model="contentDraft.cover.title" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div>
          <label class="fld-lbl">Subtitle</label>
          <v-text-field v-model="contentDraft.cover.subtitle" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div>
          <label class="fld-lbl">Cover image URL</label>
          <v-text-field v-model="contentDraft.cover.imageUrl" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
      </div>
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title">Practice</div>
      <div class="tpe-form-grid">
        <div class="tpe-field tpe-field--full">
          <label class="fld-lbl">Section title</label>
          <v-text-field v-model="contentDraft.practice.title" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field tpe-field--full">
          <label class="fld-lbl">About the clinic</label>
          <v-textarea v-model="contentDraft.practice.about" variant="solo" density="compact" rows="4" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field tpe-field--full">
          <label class="fld-lbl">Practice image URL</label>
          <v-text-field v-model="contentDraft.practice.imageUrl" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field">
          <label class="fld-lbl">Website</label>
          <v-text-field v-model="contentDraft.practice.website" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field">
          <label class="fld-lbl">Phone</label>
          <v-text-field v-model="contentDraft.practice.phone" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field">
          <label class="fld-lbl">Email</label>
          <v-text-field v-model="contentDraft.practice.email" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
        <div class="tpe-field tpe-field--full">
          <label class="fld-lbl">Address</label>
          <v-textarea v-model="contentDraft.practice.address" variant="solo" density="compact" rows="2" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
        </div>
      </div>
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title tpe-card__title--split">
        <span>Dentists</span>
        <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addDentistCard">Add dentist</v-btn>
      </div>
      <div v-if="!contentDraft.dentists.length" class="tpe-empty">No dentist cards yet.</div>
      <div v-for="(dentist, idx) in contentDraft.dentists" :key="`dentist-${idx}`" class="tpe-subcard">
        <div class="tpe-subcard__actions">
          <v-btn size="x-small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="removeDentistCard(idx)">Remove</v-btn>
        </div>
        <div class="tpe-form-grid">
          <div class="tpe-field">
            <label class="fld-lbl">Name</label>
            <v-text-field v-model="dentist.name" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
          </div>
          <div class="tpe-field">
            <label class="fld-lbl">Role</label>
            <v-text-field v-model="dentist.role" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
          </div>
          <div class="tpe-field tpe-field--full">
            <label class="fld-lbl">Bio</label>
            <v-textarea v-model="dentist.bio" variant="solo" density="compact" rows="3" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
          </div>
          <div class="tpe-field tpe-field--full">
            <label class="fld-lbl">Image URL</label>
            <v-text-field v-model="dentist.imageUrl" variant="solo" density="compact" class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
          </div>
        </div>
      </div>
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title">Payment Plan</div>
      <label class="fld-lbl">Intro text</label>
      <v-textarea v-model="contentDraft.paymentPlan.intro" variant="solo" density="compact" rows="3" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title">Consent Form</div>
      <label class="fld-lbl">Consent intro</label>
      <v-textarea v-model="contentDraft.consentForm.intro" variant="solo" density="compact" rows="3" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
    </div>

    <div class="tpe-card">
      <div class="tpe-card__title tpe-card__title--split">
        <span>Testimonials</span>
        <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addTestimonial">Add quote</v-btn>
      </div>
      <div v-if="!contentDraft.testimonials.length" class="tpe-empty">No testimonials yet.</div>
      <div v-for="(testimonial, idx) in contentDraft.testimonials" :key="`testimonial-${idx}`" class="tpe-subcard">
        <div class="tpe-subcard__actions">
          <v-btn size="x-small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="removeTestimonial(idx)">Remove</v-btn>
        </div>
        <label class="fld-lbl">{{ `Quote ${idx + 1}` }}</label>
        <v-textarea v-model="contentDraft.testimonials[idx]" variant="solo" density="compact" rows="3" auto-grow class="input-bordered mb-0 mt-1" bg-color="white" flat hide-details />
      </div>
    </div>
  </div>
</template>

<script setup>
import CommonFileUpload from '@/components/Common/fileUpload.vue'
import patientChartingService from '~/services/patientChartingService'
import { createEmptyTreatmentPlanContent, normalizeTreatmentPlanContent } from '~/shared/defaults/charting/treatmentPlanContent.js'

const props = defineProps({
  patientId: { type: [String, Number], default: null },
  patientName: { type: String, default: '' },
  activePlanId: { type: String, default: '' },
  activePlan: { type: Object, default: null },
  content: { type: Object, default: () => ({}) },
  defaultContent: { type: Object, default: () => ({}) },
  sections: { type: Object, required: true },
})

const emit = defineEmits(['update-plan-content', 'update:sections'])

const sectionOptions = [
  { key: 'clinicInfo', label: 'About the clinic' },
  { key: 'dentistInfo', label: 'About the dentist' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'treatmentPlan', label: 'Treatment plan' },
  { key: 'paymentPlan', label: 'Payment plan' },
  { key: 'consentForm', label: 'Consent form' },
  { key: 'testimonial', label: 'Testimonials' },
]

const contentDraft = reactive(createEmptyTreatmentPlanContent())
const aiGenerating = ref(false)
const coverUploading = ref(false)
const aiWarnings = ref([])
const aiSources = ref([])
const syncLocked = ref(false)
const lastEmittedContent = ref('')
const localCoverPreview = ref('')
let emitTimer = null

const resolvedCoverPreview = computed(() =>
  localCoverPreview.value || contentDraft.cover.imageUrl || contentDraft.practice.imageUrl || ''
)

function contentSignature(value) {
  return JSON.stringify(normalizeTreatmentPlanContent(value || {}))
}

function clearLocalCoverPreview() {
  if (!localCoverPreview.value) return
  URL.revokeObjectURL(localCoverPreview.value)
  localCoverPreview.value = ''
}

function syncFromProps() {
  syncLocked.value = true
  clearLocalCoverPreview()
  Object.assign(contentDraft, normalizeTreatmentPlanContent(props.content || {}))
  aiWarnings.value = []
  aiSources.value = []
  nextTick(() => {
    syncLocked.value = false
  })
}

function queueEmitContent() {
  if (syncLocked.value) return
  clearTimeout(emitTimer)
  emitTimer = setTimeout(() => {
    const normalized = normalizeTreatmentPlanContent(contentDraft)
    lastEmittedContent.value = contentSignature(normalized)
    emit('update-plan-content', normalized)
  }, 180)
}

function isSectionEnabled(key) {
  return !!props.sections?.[key]
}

function toggleSection(key) {
  emit('update:sections', { ...props.sections, [key]: !props.sections[key] })
}

function resetContentDraft() {
  syncLocked.value = true
  clearLocalCoverPreview()
  Object.assign(contentDraft, normalizeTreatmentPlanContent(props.defaultContent || {}))
  aiWarnings.value = []
  aiSources.value = []
  const normalized = normalizeTreatmentPlanContent(contentDraft)
  lastEmittedContent.value = contentSignature(normalized)
  emit('update-plan-content', normalized)
  nextTick(() => {
    syncLocked.value = false
  })
}

function addDentistCard() {
  contentDraft.dentists.push({
    id: null,
    name: '',
    role: 'Dentist',
    bio: '',
    imageUrl: '',
    sourceUrl: '',
    sourceLabel: '',
  })
}

function removeDentistCard(idx) {
  contentDraft.dentists.splice(idx, 1)
}

function addTestimonial() {
  contentDraft.testimonials.push('')
}

function removeTestimonial(idx) {
  contentDraft.testimonials.splice(idx, 1)
}

async function ensureActivePlanExistsRemotely() {
  if (!props.patientId || !props.activePlanId || !props.activePlan) return

  const payload = {
    patientId: props.patientId,
    planKey: props.activePlanId,
    name: props.activePlan.name || 'Treatment Plan',
    color: props.activePlan.color || '#0061FB',
    appointments: Array.isArray(props.activePlan.appointments) && props.activePlan.appointments.length
      ? props.activePlan.appointments
      : [{ id: 'appt-1', name: 'Appointment 1', status: 'pending' }],
    content: normalizeTreatmentPlanContent(props.content || {}),
  }

  const createRes = await patientChartingService.createTreatmentPlan(payload).catch((error) => error)
  const duplicateMessage = String(
    createRes?.response?.data?.message
      || createRes?.message
      || createRes?.data?.message
      || ''
  ).toLowerCase()

  if (createRes?.code === 0) return
  if (duplicateMessage.includes('already') || duplicateMessage.includes('exists') || duplicateMessage.includes('duplicate')) return
}

async function generateAiContent() {
  if (!props.patientId || !props.activePlanId) return
  aiGenerating.value = true
  try {
    await ensureActivePlanExistsRemotely()
    const res = await patientChartingService.generateTreatmentPlanContent({
      patientId: props.patientId,
      patientName: props.patientName || '',
      planKey: props.activePlanId,
    })
    if (res?.code !== 0) throw new Error(res?.message || 'Unable to generate plan content.')
    syncLocked.value = true
    Object.assign(contentDraft, normalizeTreatmentPlanContent(res?.data?.draft || {}))
    aiSources.value = Array.isArray(res?.data?.sources) ? res.data.sources : []
    aiWarnings.value = Array.isArray(res?.data?.warnings) ? res.data.warnings : []
    const normalized = normalizeTreatmentPlanContent(contentDraft)
    lastEmittedContent.value = contentSignature(normalized)
    emit('update-plan-content', normalized)
    nextTick(() => {
      syncLocked.value = false
    })
  } catch (error) {
    aiWarnings.value = [error?.message || 'Unable to generate plan content.']
  } finally {
    aiGenerating.value = false
  }
}

async function onCoverFiles(files) {
  const selectedFiles = Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean)
  const file = selectedFiles.at(-1)
  if (!file || !props.patientId) return

  clearLocalCoverPreview()
  localCoverPreview.value = URL.createObjectURL(file)
  coverUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('patientId', String(props.patientId))

    const res = await patientChartingService.uploadChartImage(formData)
    if (res?.code !== 0 || !res?.data?.url) {
      throw new Error(res?.message || 'Unable to upload cover image.')
    }

    clearLocalCoverPreview()
    contentDraft.cover.imageUrl = res.data.url
    queueEmitContent()
  } catch (error) {
    aiWarnings.value = [error?.message || 'Unable to upload cover image.']
  } finally {
    coverUploading.value = false
  }
}

watch(
  () => props.content,
  () => {
    if (syncLocked.value) return
    const incoming = contentSignature(props.content)
    if (incoming === contentSignature(contentDraft) || incoming === lastEmittedContent.value) return
    syncFromProps()
  },
  { deep: true, immediate: true }
)

watch(
  () => contentDraft,
  () => {
    queueEmitContent()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  clearTimeout(emitTimer)
  clearLocalCoverPreview()
})
</script>

<style scoped>
.tpe-wrap {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 4px;
}

.tpe-header,
.tpe-card,
.tpe-feedback,
.tpe-sources {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
}

.tpe-header {
  padding: 18px;
}

.tpe-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.tpe-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.tpe-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.tpe-feedback,
.tpe-sources,
.tpe-card {
  padding: 16px;
}

.tpe-feedback--warn {
  background: #fff7ed;
  border-color: #fdba74;
  color: #9a3412;
  font-size: 12px;
}

.tpe-sources {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tpe-sources__title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.tpe-sources__link {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
}

.tpe-sources__link:hover {
  text-decoration: underline;
}

.tpe-card__title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.tpe-card__title--split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tpe-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.tpe-form-grid--single {
  grid-template-columns: 1fr;
}

.tpe-field--full {
  grid-column: 1 / -1;
}

.tpe-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tpe-section-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  color: #475569;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
}

.tpe-section-chip--active {
  background: #eff6ff;
  border-color: #0061fb;
  color: #0061fb;
}

.tpe-cover-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.tpe-cover-upload,
.tpe-cover-preview {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #f8fafc;
}

.tpe-upload-actions {
  margin-top: 10px;
}

.tpe-upload-hint {
  font-size: 12px;
  color: #64748b;
}

.tpe-cover-preview {
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tpe-cover-preview__img {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: 10px;
}

.tpe-cover-preview__empty,
.tpe-empty {
  font-size: 12px;
  color: #94a3b8;
}

.tpe-subcard {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #f8fafc;
}

.tpe-subcard + .tpe-subcard {
  margin-top: 12px;
}

.tpe-subcard__actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  box-shadow: none !important;
}

@media (max-width: 1200px) {
  .tpe-wrap {
    width: 100%;
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 700px) {
  .tpe-form-grid {
    grid-template-columns: 1fr;
  }

  .tpe-field--full {
    grid-column: auto;
  }
}
</style>
