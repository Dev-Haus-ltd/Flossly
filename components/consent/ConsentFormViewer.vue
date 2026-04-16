<template>
  <div class="consent-form-container">
    <!-- Left Sidebar - Form List -->
    <div class="forms-sidebar">
      <div class="sidebar-title">{{ $t('forms') || 'Forms' }}</div>
      
      <div class="form-list">
        <div
          v-for="form in availableForms"
          :key="form.id"
          class="form-item"
          :class="{ active: selectedFormId === form.id }"
          @click="selectForm(form)"
        >
          <span class="form-icon">📋</span>
          <span class="form-name">{{ form.name }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="form-content-area">
      <div v-if="loadingForm" class="form-loader">
        <v-progress-circular indeterminate color="primary" />
        <p>{{ $t('loadingForm') || 'Loading form...' }}</p>
      </div>

      <div v-else-if="selectedForm" class="form-wrapper">
        <!-- Form Header -->
        <div class="form-header">
          <h2>{{ selectedForm.customTitle || selectedForm.name }}</h2>
          <div v-if="document?.status" class="status-badge" :class="`status-${document.status}`">
            {{ document.status }}
          </div>
        </div>

        <!-- Form Content -->
        <div class="form-content">
          <div class="form-html-content" v-html="sanitizeHtml(selectedForm.htmlContent)" />
        </div>

        <!-- Signature Area -->
        <div class="signature-section">
          <div class="signature-title">
            <h3>{{ $t('signature') || 'Signature' }}</h3>
            <span class="required-asterisk">*</span>
          </div>

          <!-- Signature Canvas -->
          <div class="signature-container">
            <canvas
              ref="signatureCanvas"
              class="signature-canvas"
              @mousedown="onCanvasMouseDown"
              @mousemove="onCanvasMouseMove"
              @mouseup="onCanvasMouseUp"
              @mouseleave="onCanvasMouseUp"
              @touchstart="onCanvasTouchStart"
              @touchmove="onCanvasTouchMove"
              @touchend="onCanvasTouchEnd"
            />
          </div>

          <!-- Signature Preview -->
          <div v-if="signaturePreview" class="signature-preview">
            <img :src="signaturePreview" alt="Signature Preview" />
          </div>

          <!-- Clear Signature Button -->
          <div class="canvas-actions">
            <v-btn
              v-if="signatureData"
              variant="outlined"
              size="small"
              @click="clearSignature"
            >
              {{ $t('clearSignature') || 'Clear Signature' }}
            </v-btn>
          </div>
        </div>

        <!-- Patient Name -->
        <div class="patient-info-section">
          <v-text-field
            v-model="patientName"
            :label="$t('patientName') || 'Patient Name'"
            variant="outlined"
            required
            dense
            class="mb-4"
          />

          <!-- Agreement Checkbox -->
          <div class="agreement-section">
            <v-checkbox
              v-model="agreedToTerms"
              class="agreement-checkbox"
            >
              <template #label>
                <span class="agreement-text">
                  {{ $t('iAgree') || 'I agree to the terms and conditions' }}
                </span>
              </template>
            </v-checkbox>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <v-btn
            variant="outlined"
            @click="resetForm"
          >
            {{ $t('reset') || 'Reset' }}
          </v-btn>

          <v-btn
            color="primary"
            variant="elevated"
            :loading="submitting"
            @click="submitForm"
            :disabled="!canSubmit"
          >
            {{ $t('submit') || 'Submit' }}
          </v-btn>
        </div>

        <!-- Expiry Warning -->
        <div v-if="isTokenExpiringSoon" class="expiry-warning">
          <v-alert type="warning" class="mb-4">
            <strong>{{ $t('warning') || 'Warning' }}:</strong>
            {{ $t('formExpiresIn') || 'This form will expire in' }}
            <strong>{{ daysUntilExpiry }}</strong>
            {{ daysUntilExpiry === 1 ? $t('day') || 'day' : $t('days') || 'days' }}
          </v-alert>
        </div>
      </div>

      <!-- No Form Selected -->
      <div v-else class="no-form-selected">
        <p>{{ $t('selectFormToBegin') || 'Select a form from the sidebar to begin' }}</p>
      </div>
    </div>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400px" persistent>
      <v-card>
        <v-card-title class="text-center text-h5 pt-6">
          ✓ {{ $t('formSubmitted') || 'Form Submitted Successfully!' }}
        </v-card-title>

        <v-card-text class="text-center py-4">
          <p class="mb-4">{{ $t('formSignedSuccessfully') || 'Your form has been signed and submitted.' }}</p>
          <p class="text-caption text-grey">{{ $t('redirectingIn') || 'Redirecting in' }} <strong>{{ redirectCountdown }}</strong>s</p>

          <v-progress-linear :value="(5 - redirectCountdown) * 20" class="mt-4" />
        </v-card-text>

        <v-card-actions class="justify-center pb-4">
          <v-btn color="primary" @click="handleSuccessClose">
            {{ $t('close') || 'Close' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-center text-h5 pt-6 text-error">
          ✗ {{ $t('error') || 'Error' }}
        </v-card-title>

        <v-card-text class="text-center py-4">
          <p>{{ errorMessage }}</p>
        </v-card-text>

        <v-card-actions class="justify-center pb-4">
          <v-btn color="error" @click="showErrorDialog = false">
            {{ $t('close') || 'Close' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useConsentStore } from '@/stores/consent'
import { useMainStore } from '@/stores'

const route = useRoute()
const consentStore = useConsentStore()
const mainStore = useMainStore()

// State
const token = ref(route.query.token || '')
const document = ref(null)
const selectedForm = ref(null)
const selectedFormId = ref(null)
const availableForms = ref([])

const signatureCanvas = ref(null)
const signatureData = ref(null)
const signaturePreview = ref(null)
const isDrawing = ref(false)

const patientName = ref('')
const agreedToTerms = ref(false)
const submitting = ref(false)

const loadingForm = ref(true)
const showSuccessDialog = ref(false)
const showErrorDialog = ref(false)
const errorMessage = ref('')

const redirectCountdown = ref(5)

// Computed
const canSubmit = computed(() => {
  return (
    signatureData.value &&
    patientName.value.trim() &&
    agreedToTerms.value &&
    !submitting.value
  )
})

const isTokenExpiringSoon = computed(() => {
  if (!document.value?.tokenExpiresAt) return false
  const now = new Date()
  const expiryDate = new Date(document.value.tokenExpiresAt)
  const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
  return daysUntil <= 3
})

const daysUntilExpiry = computed(() => {
  if (!document.value?.tokenExpiresAt) return 0
  const now = new Date()
  const expiryDate = new Date(document.value.tokenExpiresAt)
  return Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
})

// Methods
const initializeCanvas = () => {
  nextTick(() => {
    const canvas = signatureCanvas.value
    if (!canvas) return

    const rect = canvas.parentElement.getBoundingClientRect()
    canvas.width = rect.width - 20
    canvas.height = 250

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw border
    ctx.strokeStyle = '#cccccc'
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  })
}

const getCoordinates = (e) => {
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  let clientX, clientY

  if (e.touches) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

const onCanvasMouseDown = (e) => {
  isDrawing.value = true
  const { x, y } = getCoordinates(e)
  const ctx = signatureCanvas.value.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(x, y)
}

const onCanvasMouseMove = (e) => {
  if (!isDrawing.value) return

  const { x, y } = getCoordinates(e)
  const ctx = signatureCanvas.value.getContext('2d')
  ctx.lineTo(x, y)
  ctx.stroke()
}

const onCanvasMouseUp = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    captureSignature()
  }
}

const onCanvasTouchStart = (e) => {
  e.preventDefault()
  isDrawing.value = true
  const { x, y } = getCoordinates(e)
  const ctx = signatureCanvas.value.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(x, y)
}

const onCanvasTouchMove = (e) => {
  e.preventDefault()
  if (!isDrawing.value) return

  const { x, y } = getCoordinates(e)
  const ctx = signatureCanvas.value.getContext('2d')
  ctx.lineTo(x, y)
  ctx.stroke()
}

const onCanvasTouchEnd = (e) => {
  e.preventDefault()
  if (isDrawing.value) {
    isDrawing.value = false
    captureSignature()
  }
}

const captureSignature = () => {
  const canvas = signatureCanvas.value
  const imageData = canvas.toDataURL('image/png')
  signatureData.value = imageData
  signaturePreview.value = imageData
}

const clearSignature = () => {
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#cccccc'
  ctx.strokeRect(0, 0, canvas.width, canvas.height)
  signatureData.value = null
  signaturePreview.value = null
}

const resetForm = () => {
  clearSignature()
  patientName.value = ''
  agreedToTerms.value = false
}

const sanitizeHtml = (html) => {
  // Basic HTML sanitization - remove script tags and event handlers
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
}

const selectForm = (form) => {
  selectedFormId.value = form.id
  selectedForm.value = form
}

const loadDocument = async () => {
  try {
    loadingForm.value = true

    if (!token.value) {
      errorMessage.value = 'No access token provided'
      showErrorDialog.value = true
      return
    }

    // Get the consent document for signing using the token
    const docData = await consentStore.getDocumentForSigning(token.value)

    if (docData) {
      document.value = docData
      
      // Create form object with template data
      selectedForm.value = {
        id: docData.id,
        name: docData.customTitle || docData.name,
        customTitle: docData.customTitle || docData.name,
        htmlContent: docData.htmlContent,
        patientSignatureName: docData.patientSignatureName,
        tokenExpiresAt: docData.tokenExpiresAt,
        status: docData.status,
      }
      
      // Pre-populate patient name if available
      if (docData.patientSignatureName) {
        patientName.value = docData.patientSignatureName
      }
    }

    await nextTick()
    initializeCanvas()
  } catch (error) {
    console.error('Error loading document:', error)
    errorMessage.value = error.message || 'Failed to load consent form'
    showErrorDialog.value = true
  } finally {
    loadingForm.value = false
  }
}

const submitForm = async () => {
  if (!canSubmit.value) return

  try {
    submitting.value = true

    // Create form data
    const formData = new FormData()
    formData.append('token', token.value)
    formData.append('patientName', patientName.value.trim())
    formData.append('signatureDate', new Date().toISOString())

    // Convert canvas data URL to blob and append
    if (signatureData.value) {
      const response = await fetch(signatureData.value)
      const blob = await response.blob()
      formData.append('signature', blob, 'signature.png')
    }

    // Submit the signed consent
    const result = await consentStore.submitSignedConsent(formData)

    if (result) {
      showSuccessDialog.value = true
      startRedirectCountdown()
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    errorMessage.value = error.message || 'Failed to submit form. Please try again.'
    showErrorDialog.value = true
  } finally {
    submitting.value = false
  }
}

const startRedirectCountdown = () => {
  redirectCountdown.value = 5
  const interval = setInterval(() => {
    redirectCountdown.value--
    if (redirectCountdown.value <= 0) {
      clearInterval(interval)
      handleSuccessClose()
    }
  }, 1000)
}

const handleSuccessClose = () => {
  // Redirect to home or dashboard
  navigateTo('/')
}

// Lifecycle
onMounted(() => {
  loadDocument()
})
</script>

<style scoped lang="scss">
.consent-form-container {
  display: flex;
  height: 100vh;
  background-color: #f9fafb;

  .forms-sidebar {
    width: 260px;
    background-color: #ffffff;
    border-right: 1px solid #e5e7eb;
    padding: 24px 16px;
    overflow-y: auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

    .sidebar-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .form-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: #f9fafb;
        border: 1px solid transparent;
        color: #6b7280;

        &:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
          color: #111827;
        }

        &.active {
          background: rgba(0, 97, 251, 0.08);
          border-color: #0061fb;
          color: #0061fb;
          font-weight: 600;
        }

        .form-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .form-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .form-content-area {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;

    .form-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 20px;

      p {
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .form-wrapper {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;

        h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          &.status-draft {
            background-color: #f3f4f6;
            color: #6b7280;
          }

          &.status-sent {
            background-color: #fef3c7;
            color: #92400e;
          }

          &.status-viewed {
            background-color: #dbeafe;
            color: #1e40af;
          }

          &.status-signed {
            background-color: #dcfce7;
            color: #15803d;
          }

          &.status-voided {
            background-color: #fee2e2;
            color: #991b1b;
          }
        }
      }

      .form-content {
        margin-bottom: 40px;
        line-height: 1.6;

        .form-html-content {
          font-size: 15px;
          color: #374151;
          line-height: 1.7;

          :deep(p) {
            margin-bottom: 15px;
          }

          :deep(h1),
          :deep(h2),
          :deep(h3) {
            margin-top: 20px;
            margin-bottom: 12px;
            font-weight: 600;
            color: #111827;
          }

          :deep(ul),
          :deep(ol) {
            margin-left: 20px;
            margin-bottom: 15px;
          }
        }
      }

      .signature-section {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 24px;
        margin-bottom: 32px;
        background-color: #f9fafb;

        .signature-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: #111827;
          }

          .required-asterisk {
            color: #ef4444;
            font-weight: bold;
          }
        }

        .signature-container {
          margin-bottom: 16px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background-color: #ffffff;
          overflow: hidden;

          .signature-canvas {
            display: block;
            cursor: crosshair;
            width: 100%;
            max-width: 100%;
            min-height: 200px;
          }
        }

        .signature-preview {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: flex;
          justify-content: center;

          img {
            max-height: 120px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
          }
        }

        .canvas-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
      }

      .patient-info-section {
        margin-bottom: 32px;

        .agreement-section {
          margin-top: 16px;
          padding: 16px;
          background-color: rgba(0, 97, 251, 0.05);
          border-radius: 10px;
          border: 1px solid #d1d5db;
          border-left: 3px solid #0061fb;

          .agreement-checkbox {
            :deep(.v-checkbox__wrapper) {
              user-select: none;
            }
          }

          .agreement-text {
            font-size: 14px;
            color: #374151;
            font-weight: 500;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;

        :deep(.v-btn) {
          min-width: 120px;
        }
      }

      .expiry-warning {
        margin-top: 24px;

        :deep(.v-alert) {
          font-size: 14px;
          border-radius: 10px;
        }
      }
    }

    .no-form-selected {
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      p {
        font-size: 15px;
        color: #6b7280;
        margin: 0;
        font-weight: 500;
      }
    }
  }
}

@media (max-width: 1024px) {
  .consent-form-container {
    flex-direction: column;

    .forms-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
      padding: 12px;

      .form-list {
        flex-direction: row;
        gap: 10px;
        overflow-x: auto;

        .form-item {
          flex-shrink: 0;
        }
      }
    }

    .form-content-area {
      padding: 20px;
    }
  }
}

@media (max-width: 768px) {
  .consent-form-container {
    .form-content-area {
      padding: 12px;

      .form-wrapper {
        padding: 20px;
      }
    }
  }
}
</style>
