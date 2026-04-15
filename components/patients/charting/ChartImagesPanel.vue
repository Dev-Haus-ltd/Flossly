<template>
  <div class="cip-panel">
    <div class="cip-upload-card">
      <div class="cip-upload-form">
        <div class="cip-field">
          <span class="cip-label">Type</span>
          <v-select
            v-model="imgForm.type"
            :items="imageTypes"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
          />
        </div>
        <div class="cip-field">
          <span class="cip-label">Grade</span>
          <v-select
            v-model="imgForm.grade"
            :items="imageGrades"
            item-title="label"
            item-value="value"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
          />
        </div>
        <div class="cip-field">
          <span class="cip-label">Developed by</span>
          <v-select
            v-model="imgForm.developedBy"
            :items="practitioners"
            item-title="name"
            item-value="id"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
            clearable
          />
        </div>
        <div class="cip-field">
          <span class="cip-label">Taken by</span>
          <v-select
            v-model="imgForm.takenBy"
            :items="practitioners"
            item-title="name"
            item-value="id"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
            clearable
          />
        </div>
        <div class="cip-field">
          <span class="cip-label">Date taken</span>
          <v-text-field
            v-model="imgForm.dateTaken"
            type="date"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
          />
        </div>
        <div class="cip-field">
          <span class="cip-label">Justification</span>
          <v-select
            v-model="imgForm.justification"
            :items="imageJustifications"
            item-title="label"
            item-value="value"
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
          />
        </div>
        <div class="cip-field cip-field--full">
          <span class="cip-label">Description</span>
          <v-textarea
            v-model="imgForm.description"
            rows="2"
            auto-grow
            variant="solo"
            density="compact"
            class="cip-input"
            bg-color="white"
            flat
            hide-details
            placeholder="Optional description..."
          />
        </div>
      </div>

      <div class="cip-upload-drop">
        <DirectFileUpload :disabled="uploading" @upload="onFilesSelected" />
        <p v-if="pendingFileNames" class="cip-upload-state">{{ pendingFileNames }} selected</p>
        <p v-else class="cip-upload-hint">Choose files first, then click Upload.</p>
        <div class="cip-upload-actions">
          <v-btn variant="text" :disabled="!pendingFiles.length || uploading" @click="clearPendingFiles">Clear</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!pendingFiles.length || uploading" :loading="uploading" @click="uploadPendingFiles">
            Upload
          </v-btn>
        </div>
      </div>
    </div>

    <div v-if="!images.length" class="cip-empty">No images uploaded yet</div>
    <div v-else class="cip-images-grid">
      <div v-for="img in images" :key="img.id" class="cip-image-card">
        <a :href="img.url" target="_blank" rel="noopener">
          <img :src="img.url" :alt="img.name" class="cip-image" />
        </a>
        <div class="cip-image-meta">
          <div class="cip-image-badges">
            <span v-if="img.type" class="cip-badge">{{ img.type }}</span>
            <span v-if="img.grade" class="cip-badge cip-badge--grade">Grade {{ img.grade }}</span>
          </div>
          <div class="cip-image-info">
            <span v-if="img.dateTaken" class="cip-image-sub">{{ img.dateTaken }}</span>
            <span v-if="img.takenByName || img.developedByName" class="cip-image-sub">{{ img.takenByName || img.developedByName }}</span>
            <span v-if="img.justification" class="cip-image-sub">{{ img.justification }}</span>
            <span v-if="img.description" class="cip-image-desc">{{ img.description }}</span>
          </div>
          <div class="cip-image-actions">
            <span class="cip-image-name">{{ img.name }}</span>
            <button class="cip-icon-btn cip-icon-btn--danger" @click="$emit('remove-image', img.id)">
              <v-icon size="14">mdi-trash-can-outline</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DirectFileUpload from '@/components/Common/directFileUpload.vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  practitioners: { type: Array, default: () => [] },
  uploading: { type: Boolean, default: false },
})

const emit = defineEmits(['add-image', 'remove-image'])

const pendingFiles = ref([])
const pendingFileNames = computed(() => pendingFiles.value.map((file) => file.name).join(', '))

const imgForm = reactive({
  type: 'Radiograph',
  grade: '',
  developedBy: null,
  justification: '',
  takenBy: null,
  dateTaken: new Date().toISOString().slice(0, 10),
  description: '',
})

const imageTypes = ['Radiograph', 'Photograph', 'Study model', 'Other']
const imageGrades = [
  { label: '-', value: '' },
  { label: 'Acceptable (A)', value: 'A' },
  { label: 'Not acceptable (N)', value: 'N' },
]
const imageJustifications = [
  { label: '-', value: '' },
  { label: 'Caries diagnosis', value: 'Caries diagnosis' },
  { label: 'Investigation', value: 'Investigation' },
  { label: 'Periodontal', value: 'Periodontal' },
  { label: 'Endodontic', value: 'Endodontic' },
  { label: 'Periapical Status', value: 'Periapical Status' },
  { label: 'Surgical/Implant', value: 'Surgical/Implant' },
  { label: 'Extraction', value: 'Extraction' },
  { label: 'Orthodontics', value: 'Orthodontics' },
]

function onFilesSelected(files) {
  const selected = Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean)
  if (!selected.length) return
  pendingFiles.value = selected
}

function clearPendingFiles() {
  pendingFiles.value = []
}

function uploadPendingFiles() {
  if (!pendingFiles.value.length || props.uploading) return
  const practitionerList = props.practitioners || []
  const developedByPractitioner = practitionerList.find((p) => Number(p.id) === Number(imgForm.developedBy))
  const takenByPractitioner = practitionerList.find((p) => Number(p.id) === Number(imgForm.takenBy))
  pendingFiles.value.forEach((file) => {
    emit('add-image', {
      file,
      meta: {
        type: imgForm.type,
        grade: imgForm.grade,
        developedBy: imgForm.developedBy,
        developedByName: developedByPractitioner?.name || '',
        justification: imgForm.justification,
        takenBy: imgForm.takenBy,
        takenByName: takenByPractitioner?.name || '',
        dateTaken: imgForm.dateTaken,
        description: imgForm.description,
      },
    })
  })
}

watch(
  () => props.images.length,
  () => {
    pendingFiles.value = []
  }
)
</script>

<style scoped>
.cip-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cip-upload-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: #f8fbff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
}

.cip-upload-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.cip-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cip-field--full {
  grid-column: 1 / -1;
}

.cip-label {
  font-size: 11px;
  color: #6b7280;
}

.cip-input :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background: #fff !important;
  min-height: 40px;
  box-shadow: none !important;
}

.cip-input :deep(.v-field__input) {
  font-size: 13px;
  color: #334155;
}

.cip-upload-drop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cip-upload-state,
.cip-upload-hint {
  text-align: center;
  font-size: 12px;
}

.cip-upload-state {
  color: #0061fb;
}

.cip-upload-hint {
  color: #6b7280;
}

.cip-upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cip-empty {
  padding: 18px 4px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

.cip-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.cip-image-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.cip-image {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
}

.cip-image-meta {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cip-image-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cip-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
}

.cip-badge--grade {
  background: #fef9c3;
  color: #854d0e;
}

.cip-image-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cip-image-sub {
  font-size: 11px;
  color: #6b7280;
}

.cip-image-desc {
  font-size: 11px;
  color: #374151;
  font-style: italic;
}

.cip-image-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 4px;
}

.cip-image-name {
  flex: 1;
  font-size: 11px;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cip-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cip-icon-btn--danger {
  color: #dc2626;
}

.cip-icon-btn--danger:hover {
  background: #fee2e2;
}

@media (max-width: 900px) {
  .cip-upload-card,
  .cip-upload-form {
    grid-template-columns: 1fr;
  }
}
</style>
