<template>
  <div class="survey-form">
    <v-form @submit.prevent="onSave">
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">Loading survey...</p>
      </div>
      <div v-else-if="error" class="text-center py-8">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </div>
      <div v-else-if="structure && structure.categories" class="form-content-wrapper">
        <!-- Introduction Heading -->
        <div class="introduction-heading">
          <h2 class="introduction-title">About your Smile: Introduction</h2>
        </div>
        
        <!-- Introduction Text -->
        <p class="introduction-text">
          We want to help you achieve the smile you've always wanted! Please take a few minutes to tell us about your smile concerns. This information will help us recommend the best treatment options for you.
        </p>
        
        <div
          v-for="category in structure.categories"
          :key="category.id"
          class="mb-6"
        >
          <h4 class="mb-2">{{ category.name }}</h4>
          <div
            v-for="question in category.questions"
            :key="question.id"
            class="mb-4 question-wrapper"
          >
            <div class="question-header">
              <p class="question-text">
                {{ getQuestionLabel(question.id) }}: {{ question.text }}
              </p>
            </div>

            <!-- Range questions -->
            <v-slider
              v-if="question.type === 'range'"
              v-model="answers[category.id][question.id]"
              :min="question.min || 1"
              :max="question.max || 10"
              step="1"
              show-ticks="always"
              tick-size="3"
              thumb-label
              :disabled="false"
              :class="{ 'range-slider-custom': question.id === 'question3' || question.id === 'question4' }"
            />

            <!-- Single choice -->
            <v-select
              v-else-if="question.type === 'single_choice'"
              v-model="answers[category.id][question.id]"
              :items="question.options || []"
              variant="outlined"
              density="compact"
              :disabled="false"
            />

            <!-- File upload (handled separately) -->
            <div v-else-if="question.type === 'file_upload'">
              <!-- Upload Guidelines (only for question 8) -->
              <div v-if="question.id === 'question8'" class="upload-guidelines mt-4">
                <p class="upload-info-text">
                  Uploading photos helps us provide more accurate treatment recommendations. Please upload 1-3 photos showing your natural smile, teeth together, and any areas of concern.
                </p>
                <h5 class="upload-guidelines-heading">Upload guidelines:</h5>
                <p class="upload-guideline-item">Photo 1: Smiling with teeth showing (front view)</p>
                <p class="upload-guideline-item">Photo 2: Close-up of teeth together (optional)</p>
                <p class="upload-guideline-item">Photo 3: Any specific area of concern (optional)</p>
              </div>
              
              <v-file-input
                v-model="files"
                label="Upload photos"
                multiple
                accept="image/*"
                variant="outlined"
                density="compact"
                :disabled="false"
                :class="{ 'mt-4': question.id === 'question8' }"
              />
              <v-btn
                class="mt-2"
                variant="flat"
                color="primary"
                @click="onUploadPhotos"
                :disabled="false"
              >
                Upload
              </v-btn>
              <div v-if="uploadedPhotos && uploadedPhotos.length" class="mt-3">
                <p class="mb-1 text-caption">Uploaded photos:</p>
                <v-chip
                  v-for="(p, idx) in uploadedPhotos"
                  :key="idx"
                  class="mr-2 mb-2"
                  size="small"
                  variant="outlined"
                >
                  {{ p.split('/').pop() }}
                </v-chip>
              </div>
            </div>

            <!-- Checkbox with subcategories -->
            <div
              v-else-if="question.type === 'checkbox' && question.subcategories"
            >
              <div
                v-for="sub in question.subcategories"
                :key="sub.id"
                class="mb-4"
              >
                <label class="subcategory-label mb-2 d-block">
                  {{ sub.name }}:
                </label>
                <!-- If subcategory has options, render checkboxes -->
                <div v-if="sub.options && sub.options.length > 0">
                  <v-checkbox
                    v-for="opt in sub.options"
                    :key="opt"
                    :label="opt"
                    :value="opt"
                    v-model="answers[category.id][question.id][sub.id]"
                    :disabled="false"
                    hide-details
                    density="compact"
                    class="mb-1"
                  />
                </div>
                <!-- If no options, render textarea for free text -->
                <v-textarea
                  v-else
                  v-model="answers[category.id][question.id][sub.id]"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  auto-grow
                  placeholder="Record patient answers"
                  :disabled="false"
                />
              </div>
            </div>

            <!-- Simple checkbox list -->
            <div
              v-else-if="
                question.type === 'checkbox' &&
                question.options &&
                !question.subcategories
              "
            >
              <v-checkbox
                v-for="opt in question.options"
                :key="opt"
                :label="opt"
                :value="opt"
                v-model="answers[category.id][question.id]"
                :disabled="false"
                hide-details
                density="compact"
              />
              
              <!-- Preferred Contact Time (for question 12) -->
              <div v-if="question.preferredContactTime" class="mt-4">
                <label class="subcategory-label mb-2 d-block">
                  {{ question.preferredContactTime.label }}
                </label>
                <v-checkbox
                  v-for="opt in question.preferredContactTime.options"
                  :key="opt"
                  :label="opt"
                  :value="opt"
                  v-model="answers[category.id][question.id + '_preferredTime']"
                  :disabled="false"
                  hide-details
                  density="compact"
                />
              </div>
            </div>

            <!-- Generic text / textarea -->
            <v-textarea
              v-else-if="
                question.type === 'textarea' || question.type === 'text'
              "
              v-model="answers[category.id][question.id]"
              :rows="question.type === 'textarea' ? 3 : 2"
              auto-grow
              variant="outlined"
              density="compact"
              :disabled="false"
              :class="{ 'additional-info-textarea': question.id === 'question11' }"
            />

            <!-- Fallback text input -->
            <v-text-field
              v-else
              v-model="answers[category.id][question.id]"
              variant="outlined"
              density="compact"
              :disabled="false"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Action Buttons - Outside form-content-wrapper -->
      <div v-if="structure && structure.categories && !loading && !error" class="form-actions-wrapper">
        <div class="form-actions d-flex justify-end mt-8" style="gap: 12px">
          <v-btn
            variant="outlined"
            color="primary"
            @click="onReset"
            :disabled="loading"
          >
            Reset
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="onSubmit"
            :disabled="loading"
          >
            Submit
          </v-btn>
        </div>
      </div>
    </v-form>
  </div>
</template>

<script setup>
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  patientId: { type: Number, default: null },
  editing: { type: Boolean, default: false },
})

const diaryStore = useDiaryStore()
const mainStore = useMainStore()

// Helper function to get question label (Question 1, Question 2, etc.)
const getQuestionLabel = (questionId) => {
  const match = questionId.match(/question(\d+)/)
  if (match) {
    return `Question ${match[1]}`
  }
  return 'Question'
}

const structure = ref(null)
const answers = reactive({})
const uploadedPhotos = ref([])
const files = ref([])
const loading = ref(false)
const error = ref(null)

const loadSurvey = async () => {
  if (!props.patientId) {
    error.value = 'Patient ID is required'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const res = await diaryStore.getPatientSurvey(props.patientId)
    if (res?.code === 0) {
      const data = res.data || {}
      structure.value = data.structure
      uploadedPhotos.value = data.uploadedPhotos || []
      const existing = data.answers || {}

      // Initialize answers structure
      if (structure.value?.categories) {
        for (const cat of structure.value.categories) {
          if (!answers[cat.id]) answers[cat.id] = {}
          for (const q of cat.questions) {
            if (q.type === 'checkbox' && q.subcategories) {
              answers[cat.id][q.id] = existing?.[cat.id]?.[q.id] || {}
              for (const sub of q.subcategories) {
                // If subcategory has options, initialize as array for checkboxes
                if (sub.options && sub.options.length > 0) {
                  const existingVal = existing?.[cat.id]?.[q.id]?.[sub.id]
                  answers[cat.id][q.id][sub.id] = Array.isArray(existingVal) ? existingVal : []
                } else {
                  // If no options, initialize as empty string for textarea
                  if (answers[cat.id][q.id][sub.id] === undefined) {
                    answers[cat.id][q.id][sub.id] = ''
                  }
                }
              }
            } else if (q.type === 'checkbox' && q.options && !q.subcategories) {
              // Multi-select checkboxes store an array of selected options
              const existingVal = existing?.[cat.id]?.[q.id]
              answers[cat.id][q.id] = Array.isArray(existingVal) ? existingVal : []
              // Initialize preferred contact time if it exists
              if (q.preferredContactTime) {
                const existingTimeVal = existing?.[cat.id]?.[q.id + '_preferredTime']
                answers[cat.id][q.id + '_preferredTime'] = Array.isArray(existingTimeVal) ? existingTimeVal : []
              }
            } else if (q.type === 'range') {
              answers[cat.id][q.id] = existing?.[cat.id]?.[q.id] ?? 5
            } else {
              answers[cat.id][q.id] = existing?.[cat.id]?.[q.id] ?? ''
            }
          }
        }
      } else {
        error.value = 'Survey structure not found'
      }
    } else {
      error.value = res?.message || 'Failed to load survey'
    }
  } catch (err) {
    console.error('Error loading survey:', err)
    error.value = err?.message || 'Failed to load survey'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSurvey()
})

watch(
  () => props.patientId,
  () => {
    loadSurvey()
  }
)

const onSave = async () => {
  if (!props.patientId) return
  try {
    const payload = {
      patientId: props.patientId,
      answers: JSON.parse(JSON.stringify(answers)),
      uploadedPhotos: uploadedPhotos.value,
      isCompleted: true,
    }
    const res = await diaryStore.savePatientSurvey(payload)
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Survey saved', type: 'success' })
      return true
    } else {
      mainStore.setSnackbar({
        title: res?.message || 'Failed to save survey',
        type: 'error',
      })
      return false
    }
  } catch (err) {
    const msg = err?.message || err?.data?.message || 'Failed to save survey'
    mainStore.setSnackbar({ title: msg, type: 'error' })
    return false
  }
}

const onReset = () => {
  // Reset form to initial state
  loadSurvey()
  mainStore.setSnackbar({ title: 'Form reset', type: 'info' })
}

const onSubmit = async () => {
  const result = await onSave()
  if (result) {
    mainStore.setSnackbar({ title: 'Survey submitted successfully', type: 'success' })
  }
}

const onShare = async () => {
  if (!props.patientId) return
  try {
    const res = await diaryStore.sharePatientSurvey({ patientId: props.patientId })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Survey shared successfully', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to share survey', type: 'error' })
    }
  } catch (err) {
    mainStore.setSnackbar({ title: 'Failed to share survey', type: 'error' })
  }
}

const onPrint = async () => {
  if (!props.patientId) return
  try {
    const res = await diaryStore.printPatientSurvey(props.patientId)
    if (res?.code === 0) {
      window.print()
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to prepare print', type: 'error' })
    }
  } catch (err) {
    mainStore.setSnackbar({ title: 'Failed to print survey', type: 'error' })
  }
}

const onDownload = async () => {
  if (!props.patientId) return
  try {
    const res = await diaryStore.downloadPatientSurvey(props.patientId)
    if (res?.code === 0) {
      // Create download link
      const dataStr = JSON.stringify(res.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `survey-patient-${props.patientId}.json`
      link.click()
      URL.revokeObjectURL(url)
      mainStore.setSnackbar({ title: 'Survey downloaded', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to download survey', type: 'error' })
    }
  } catch (err) {
    mainStore.setSnackbar({ title: 'Failed to download survey', type: 'error' })
  }
}

defineExpose({ save: onSave, share: onShare, print: onPrint, download: onDownload })

const onUploadPhotos = async () => {
  if (!props.patientId || !files.value || !files.value.length) return
  const formData = new FormData()
  formData.append('patientId', String(props.patientId))
  for (const f of files.value) {
    formData.append('photos', f)
  }
  const res = await diaryStore.uploadSurveyPhotos(formData)
  if (res?.code === 0) {
    uploadedPhotos.value = res.data?.uploadedPhotos || uploadedPhotos.value
    mainStore.setSnackbar({ title: 'Photos uploaded', type: 'success' })
  } else {
    mainStore.setSnackbar({
      title: res?.message || 'Failed to upload photos',
      type: 'error',
    })
  }
}
</script>

<style scoped>
.survey-form {
  max-width: 556px;
}
h4 {
  font-size: 18px;
  font-weight: 500;
  color: #1e1e1e;
}
.question-wrapper {
  width: 100%;
}
.question-header {
  background: #EFF5F5;
  width: 1235px;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 4px;
}
.question-text {
  font-size: 14px;
  font-weight: 400;
  color: #1e1e1e;
  margin: 0;
}
/* Checkbox label styling */
.question-wrapper :deep(.v-checkbox .v-label) {
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
}
.subcategory-label {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
}
.form-content-wrapper {
  border: 1px solid #DBDBDB;
  border-radius: 8px;
  padding: 24px;
  width: 1350px;
  margin-top: 10px;
  margin-bottom: 10px;
}
.form-actions-wrapper {
  width: 1350px;
  display: flex;
  justify-content: flex-end;
}
.introduction-heading {
  background: #8C3BC51A;
  padding: 16px;
  padding-top: 24px;
  margin-bottom: 24px;
  border-radius: 4px;
  width: 333px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.introduction-title {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 20px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #8C3BC5;
  margin: 0;
  margin-bottom: 12px;
}
.introduction-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  margin: 0;
  margin-bottom: 24px;
  width: 1152px;
}
.range-slider-custom {
  width: 270px;
}
.additional-info-textarea :deep(.v-field) {
  width: 1200px;
  min-height: 170px;
}
.additional-info-textarea :deep(.v-textarea) {
  width: 1200px;
  min-height: 170px;
}
.additional-info-textarea :deep(textarea) {
  min-height: 170px;
}
.upload-guidelines {
  width: 100%;
}
.upload-info-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  margin-bottom: 16px;
  width: 100%;
}
.upload-guidelines-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  margin-top: 16px;
  margin-bottom: 8px;
}
.upload-guideline-item {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  margin-bottom: 4px;
}
</style>

{
  "cells": [],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}