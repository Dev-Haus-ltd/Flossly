```html
<template>
  <div class="consent-form-page">
    <v-container
      fluid
      class="pa-4 pa-md-6"
      style="max-width: 1000px; margin: 0 auto"
    >
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <div class="loading-animation">
            <div class="loading-spinner">
              <v-progress-circular indeterminate size="56" color="primary" />
            </div>
            <div class="loading-icon">
              <v-icon size="28" color="primary">mdi-file-document</v-icon>
            </div>
          </div>
          <h3 class="loading-title">Loading Consent Form</h3>
          <p class="loading-text">
            Please wait while we prepare your document...
          </p>
        </div>
      </div>

      <!-- Error State -->
      <v-card
        v-else-if="error"
        class="state-card error-card"
        rounded="xl"
        elevation="0"
      >
        <div class="state-content">
          <div class="state-icon error-icon">
            <v-icon size="64" color="#ef4444">mdi-alert-circle</v-icon>
          </div>
          <h2 class="state-title">Form Not Available</h2>
          <p class="state-message">{{ error }}</p>
          <v-btn
            color="primary"
            variant="flat"
            @click="retryLoad"
            class="state-btn"
          >
            Try Again
          </v-btn>
        </div>
      </v-card>

      <!-- Already Signed State -->
      <v-card
        v-else-if="alreadySigned"
        class="state-card success-card"
        rounded="xl"
        elevation="0"
      >
        <div class="state-content">
          <div class="state-icon signed-icon">
            <v-icon size="64" color="#10b981">mdi-check-circle</v-icon>
          </div>
          <h2 class="state-title">Already Signed</h2>
          <p class="state-message">
            This consent form has already been signed and submitted.
          </p>
          <div class="signed-details">
            <v-icon size="16" color="#64748b">mdi-calendar-check</v-icon>
            <span>Signed on: {{ formatDateTime(signedAt) }}</span>
          </div>
        </div>
      </v-card>

      <!-- Expired State -->
      <v-card
        v-else-if="expired"
        class="state-card warning-card"
        rounded="xl"
        elevation="0"
      >
        <div class="state-content">
          <div class="state-icon expired-icon">
            <v-icon size="64" color="#f59e0b">mdi-clock-alert</v-icon>
          </div>
          <h2 class="state-title">Link Expired</h2>
          <p class="state-message">
            This consent form link has expired. Please contact the practice for
            a new link.
          </p>
        </div>
      </v-card>

      <!-- Main Form -->
      <v-card
        v-else
        ref="formCardRef"
        class="form-card"
        rounded="xl"
        elevation="0"
      >
        <div class="form-header">
          <div class="form-header-content">
            <div class="header-icon">
              <v-icon size="28" color="white">mdi-file-sign</v-icon>
            </div>
            <div class="header-text">
              <h1 class="form-title">{{ formTitle }}</h1>
              <p class="form-subtitle">Please review and sign below</p>
            </div>
          </div>
        </div>

        <div class="form-body">
          <!-- HTML Content -->
          <div class="html-content-wrapper">
            <div class="html-content-label">
              <v-icon size="16" color="#0061fb">mdi-text-box</v-icon>
              <span>Form Details</span>
            </div>
            <div class="form-html-content" v-html="sanitizedHtmlContent" />
          </div>

          <v-divider class="content-divider" />

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="section-header">
              <div class="section-header-left">
                <v-icon size="20" color="#0061fb">mdi-draw</v-icon>
                <h3 class="section-title">Patient Signature</h3>
                <span class="required-badge">Required</span>
              </div>
            </div>

            <!-- Signature Mode Switch -->
            <div class="signature-mode-switch">
              <v-btn-toggle
                v-model="signatureMode"
                mandatory
                divided
                class="signature-toggle"
              >
                <v-btn value="draw" prepend-icon="mdi-draw-pen">
                  Draw Signature
                </v-btn>

                <v-btn value="type" prepend-icon="mdi-keyboard-outline">
                  Type Signature
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Draw Signature Mode -->
            <div v-if="signatureMode === 'draw'" class="signature-pad-wrapper">
              <div class="signature-canvas-container">
                <canvas
                  ref="signatureCanvas"
                  class="signature-canvas"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart="startDrawingTouch"
                  @touchmove="drawTouch"
                  @touchend="stopDrawing"
                  @touchcancel="stopDrawing"
                ></canvas>

                <div class="canvas-overlay" v-if="!hasSignature">
                  <div class="overlay-content">
                    <v-icon size="32" color="#cbd5e1">mdi-draw</v-icon>
                    <span>Draw your signature here</span>
                  </div>
                </div>
              </div>

              <div class="signature-actions">
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  @click="clearSignature"
                  class="clear-signature-btn"
                >
                  Clear Signature
                </v-btn>

                <span class="signature-hint">
                  <v-icon size="12">mdi-cursor-default-click</v-icon>
                  Use mouse or touch to draw
                </span>
              </div>
            </div>

            <!-- Type Signature Mode -->
            <div v-else class="typed-signature-wrapper">
              <div class="typed-input-grid">
                <v-text-field
                  v-model="typedSignature"
                  label="Type Your Signature"
                  placeholder="Enter your full name"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />

                <v-select
                  v-model="selectedSignatureFont"
                  :items="signatureFonts"
                  label="Choose Signature Style"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #title>
                        <span :style="{ fontFamily: item.raw }">
                          {{ item.raw }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>

                  <template #selection="{ item }">
                    <span :style="{ fontFamily: item.raw }">
                      {{ item.raw }}
                    </span>
                  </template>
                </v-select>
              </div>

              <div class="typed-signature-preview-container">
                <div class="preview-label">Live Signature Preview</div>

                <div class="typed-signature-preview">
                  <div
                    class="typed-signature-text"
                    :style="{ fontFamily: selectedSignatureFont }"
                  >
                    {{ typedSignature || "Your Signature Preview" }}
                  </div>
                </div>
              </div>

              <div class="signature-actions">
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  @click="clearTypedSignature"
                >
                  Clear Signature
                </v-btn>

                
              </div>
            </div>
          </div>

          <!-- Patient Name Field -->
          <div class="patient-name-section">
            <label class="form-label">
              Full Name <span class="required-star">*</span>
            </label>
            <v-text-field
              v-model="patientName"
              placeholder="Enter your full legal name"
              variant="outlined"
              density="comfortable"
              :rules="[(v) => !!v || 'Full name is required']"
              class="name-input"
              :error="submitted && !patientName"
            >
              <template #prepend-inner>
                <v-icon size="18" color="#94a3b8">mdi-account</v-icon>
              </template>
            </v-text-field>
          </div>
          <!-- Agreement Checkbox -->
          <div class="agreement-section">
            <v-checkbox
              v-model="agreedToTerms"
              color="primary"
              hide-details
              class="agreement-checkbox"
            >
              <template #label>
                <span class="agreement-text">
                  I confirm that the information provided is accurate and I
                  understand the contents of this consent form.
                </span>
              </template>
            </v-checkbox>
          </div>

          <!-- Expiry Warning -->
          <v-alert
            v-if="expiresSoon"
            type="warning"
            variant="tonal"
            class="expiry-alert"
          >
            <div class="alert-content">
              <v-icon size="20">mdi-clock-alert</v-icon>
              <div>
                <strong>
                  Link expires in {{ daysUntilExpiry }} day{{
                    daysUntilExpiry > 1 ? "s" : ""
                  }}.
                </strong>
                <span>Please complete and sign this form soon.</span>
              </div>
            </div>
          </v-alert>

          <!-- Submit Button -->
          <div class="submit-section">
            <v-btn
              block
              size="large"
              color="primary"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="submitForm"
              class="submit-btn"
            >
              <template #prepend>
                <v-icon size="20">mdi-check-circle</v-icon>
              </template>
              Sign & Submit
            </v-btn>
          </div>

          <!-- Success Dialog -->
          <v-dialog
            v-model="showSuccess"
            max-width="480px"
            persistent
            transition="dialog-transition"
          >
            <v-card class="success-dialog" rounded="xl">
              <div class="success-dialog-content">
                <div class="success-animation">
                  <div class="success-circle">
                    <v-icon size="48" color="#10b981">mdi-check</v-icon>
                  </div>
                </div>

                <h2 class="success-title">Thank You!</h2>
                <p class="success-message">
                  Your consent form has been signed and submitted successfully.
                </p>

                <div class="success-footer">
                  <v-progress-linear
                    :model-value="countdownProgress"
                    color="success"
                    height="3"
                    class="countdown-bar"
                  />
                  <p class="redirect-text">
                    Redirecting in <strong>{{ countdown }}</strong> second{{
                      countdown > 1 ? "s" : ""
                    }}...
                  </p>
                </div>
              </div>
            </v-card>
          </v-dialog>
        </div>
      </v-card>
    </v-container>
  </div>
</template>
```

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useConsentStore } from "@/stores/consent";
import { useMainStore } from "@/stores/index";

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const consentStore = useConsentStore();
const mainStore = useMainStore();

// State
const token = computed(() => route.params.token);
const loading = ref(true);
const error = ref(null);
const submitting = ref(false);
const showSuccess = ref(false);
const alreadySigned = ref(false);
const expired = ref(false);
const submitted = ref(false);

// Form data
const documentData = ref(null);
const templateData = ref(null);
const patientName = ref("");
const agreedToTerms = ref(false);

// Signature
const signatureCanvas = ref(null);
let ctx = null;
let drawing = false;
let canvasInitialized = false;
const signatureData = ref(null);
const hasSignature = computed(() => {
  if (signatureMode.value === "draw") {
    return !!signatureData.value;
  }

  return !!typedSignature.value?.trim();
});
const signatureMode = ref("draw"); // draw | type
const typedSignature = ref("");
const selectedSignatureFont = ref("Dancing Script");

const signatureFonts = [
  "Dancing Script",
  "Pacifico",
  "Great Vibes",
  "Satisfy",
  "Caveat",
  "Kaushan Script",
];
// Countdown
const countdown = ref(3);
const countdownProgress = ref(100);

// Computed
const formTitle = computed(() => {
  return (
    documentData.value?.customTitle ||
    templateData.value?.name ||
    "Consent Form"
  );
});
const clearTypedSignature = () => {
  typedSignature.value = "";
};
const sanitizedHtmlContent = computed(() => {
  if (!templateData.value?.htmlContent) return "";
  return templateData.value.htmlContent.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
});

const canSubmit = computed(() => {
  return (
    hasSignature.value &&
    patientName.value?.trim() &&
    agreedToTerms.value &&
    !submitting.value
  );
});

const expiresSoon = computed(() => {
  if (!documentData.value?.tokenExpiresAt) return false;
  const days = daysUntilExpiry.value;
  return days > 0 && days <= 3;
});

const daysUntilExpiry = computed(() => {
  if (!documentData.value?.tokenExpiresAt) return 0;
  const now = new Date();
  const expiry = new Date(documentData.value.tokenExpiresAt);
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

const signedAt = computed(() => documentData.value?.signedAt);

// Canvas Methods
const initCanvas = () => {
  const canvas = signatureCanvas.value;
  if (!canvas) return false;

  try {
    canvas.width = 600;
    canvas.height = 200;

    ctx = canvas.getContext("2d");
    if (!ctx) return false;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvasInitialized = true;
    return true;
  } catch (err) {
    console.error("Error initializing canvas:", err);
    return false;
  }
};

const getCanvasCoords = (e) => {
  const canvas = signatureCanvas.value;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  let x = (clientX - rect.left) * scaleX;
  let y = (clientY - rect.top) * scaleY;

  x = Math.max(0, Math.min(x, canvas.width));
  y = Math.max(0, Math.min(y, canvas.height));

  return { x, y };
};

const startDrawing = (e) => {
  if (!canvasInitialized) return;
  e.preventDefault();
  drawing = true;
  const { x, y } = getCanvasCoords(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e) => {
  if (!drawing || !canvasInitialized) return;
  e.preventDefault();
  const { x, y } = getCanvasCoords(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = () => {
  if (drawing) {
    drawing = false;
    captureSignature();
  }
};

const startDrawingTouch = (e) => {
  e.preventDefault();
  startDrawing(e);
};

const drawTouch = (e) => {
  e.preventDefault();
  draw(e);
};

const captureSignature = () => {
  const canvas = signatureCanvas.value;
  if (!canvas || !ctx) return;

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let hasContent = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      signatureData.value = canvas.toDataURL("image/png");
    } else {
      signatureData.value = null;
    }
  } catch (err) {
    console.error("Error capturing signature:", err);
  }
};

const clearSignature = () => {
  if (!ctx || !signatureCanvas.value || !canvasInitialized) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height);
  ctx.fillStyle = "#000000";
  signatureData.value = null;
};

// Load Document
const loadDocument = async () => {
  loading.value = true;
  error.value = null;
  alreadySigned.value = false;
  expired.value = false;

  try {
    const doc = await consentStore.getDocumentForSigning(token.value);

    if (!doc) {
      error.value = "Invalid or missing document";
      return;
    }

    if (doc.status === "signed") {
      alreadySigned.value = true;
      return;
    }

    if (doc.tokenExpiresAt && new Date(doc.tokenExpiresAt) < new Date()) {
      expired.value = true;
      return;
    }

    documentData.value = doc;
    templateData.value = doc;

    if (doc.patient?.firstName || doc.patient?.lastName) {
      patientName.value =
        `${doc.patient.firstName || ""} ${doc.patient.lastName || ""}`.trim();
    } else if (doc.patientSignatureName) {
      patientName.value = doc.patientSignatureName;
    }

    await nextTick();

    setTimeout(() => {
      initCanvas();
    }, 200);
  } catch (err) {
    console.error("Error loading document:", err);
    error.value =
      err.message || "Failed to load consent form. The link may be invalid.";
  } finally {
    loading.value = false;
  }
};
const generateTypedSignatureImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 200;

  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#111827";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `64px ${selectedSignatureFont.value}`;

  context.fillText(typedSignature.value, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL("image/png");
};
// Submit Form
const submitForm = async () => {
  if (!canSubmit.value) return;

  submitted.value = true;
  submitting.value = true;

  try {
    const finalSignature =
      signatureMode.value === "draw"
        ? signatureData.value
        : generateTypedSignatureImage();

    const result = await consentStore.submitSignedDocument(
      token.value,
      finalSignature,
    );
    if (result) {
      showSuccess.value = true;
      startCountdown();
    }
  } catch (err) {
    console.error("Error submitting:", err);
    mainStore.setSnackbar({
      message: err.message || "Failed to submit signature. Please try again.",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const startCountdown = () => {
  countdown.value = 5;
  countdownProgress.value = 100;

  const interval = setInterval(() => {
    countdown.value--;
    countdownProgress.value = (countdown.value / 5) * 100;

    if (countdown.value <= 0) {
      clearInterval(interval);
      router.push("/");
    }
  }, 1000);
};

const retryLoad = () => {
  loadDocument();
};

const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Lifecycle
onMounted(() => {
  loadDocument();
});
</script>

<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Kaushan+Script&family=Pacifico&family=Satisfy&display=swap");
.consent-form-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8edf3 100%);
  padding: 24px;
}

// Loading State
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;

  .loading-card {
    background: white;
    border-radius: 28px;
    padding: 48px 40px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);

    .loading-animation {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;

      .loading-spinner {
        position: absolute;
        top: 0;
        left: 0;
      }

      .loading-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

    .loading-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px;
    }

    .loading-text {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
  }
}

// State Cards
.state-card {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 28px !important;
  padding: 48px 40px;

  .state-content {
    text-align: center;

    .state-icon {
      margin-bottom: 24px;
    }

    .state-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px;
    }

    .state-message {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px;
      line-height: 1.6;
    }

    .state-btn {
      border-radius: 12px;
      text-transform: none;
      font-weight: 600;
    }

    .signed-details {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f1f5f9;
      border-radius: 20px;
      font-size: 12px;
      color: #64748b;
    }
  }
}

// Form Card
.form-card {
  background: white;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);

  .form-header {
    background: linear-gradient(135deg, #0061fb 0%, #0051d4 100%);
    padding: 32px 40px;

    .form-header-content {
      display: flex;
      align-items: center;
      gap: 20px;

      .header-icon {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-text {
        .form-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }

        .form-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }
      }
    }
  }

  .form-body {
    padding: 32px 40px;

    .html-content-wrapper {
      margin-bottom: 32px;

      .html-content-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e2e8f0;
      }

      .form-html-content {
        line-height: 1.7;
        color: #374151;
        font-size: 15px;

        :deep(h1),
        :deep(h2),
        :deep(h3) {
          margin-top: 1.5em;
          margin-bottom: 0.8em;
          font-weight: 600;
          color: #111827;
        }

        :deep(p) {
          margin-bottom: 1.2em;
        }

        :deep(ul),
        :deep(ol) {
          margin-left: 1.5em;
          margin-bottom: 1.2em;
        }
      }
    }

    .content-divider {
      margin: 24px 0;
    }

    // Signature Section
    .signature-section {
      background: #f8fafc;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      .signature-mode-switch {
        margin-bottom: 20px;

        .signature-toggle {
          width: 100%;

          :deep(.v-btn) {
            flex: 1;
            text-transform: none;
            font-weight: 600;
            min-height: 46px;
          }
        }
      }

      .typed-signature-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .typed-input-grid {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 16px;
        }

        .typed-signature-preview-container {
          .preview-label {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 10px;
          }

          .typed-signature-preview {
            min-height: 160px;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            background: linear-gradient(to bottom, #ffffff, #f8fafc);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            overflow: hidden;
            position: relative;

            &::after {
              content: "";
              position: absolute;
              left: 24px;
              right: 24px;
              bottom: 42px;
              border-bottom: 1px dashed #cbd5e1;
            }

            .typed-signature-text {
              position: relative;
              z-index: 2;
              font-size: 26px;
              color: #111827;
              line-height: 1.2;
              text-align: center;
              word-break: break-word;
            }
          }
        }
      }
      .section-header {
        margin-bottom: 20px;

        .section-header-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .required-badge {
            font-size: 10px;
            font-weight: 500;
            padding: 2px 8px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 20px;
            color: #ef4444;
          }
        }
      }

      .signature-pad-wrapper {
        .signature-canvas-container {
          position: relative;
          margin-bottom: 16px;

          .signature-canvas {
            width: 100%;
            height: auto;
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            background: white;
            cursor: crosshair;
            touch-action: none;
            transition: border-color 0.2s;

            &:hover {
              border-color: #0061fb;
            }
          }

          .canvas-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 12px;

            .overlay-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              color: #94a3b8;

              span {
                font-size: 12px;
              }
            }
          }
        }

        .signature-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .clear-signature-btn {
            text-transform: none;
            font-weight: 500;
          }

          .signature-hint {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #94a3b8;
          }
        }
      }
    }

    // Patient Name Section
    .patient-name-section {
      margin-bottom: 20px;

      .form-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;

        .required-star {
          color: #ef4444;
          margin-left: 2px;
        }
      }

      .name-input {
        :deep(.v-field) {
          border-radius: 12px;
        }
      }
    }

    // Agreement Section
    .agreement-section {
      margin-bottom: 20px;

      .agreement-checkbox {
        :deep(.v-label) {
          font-size: 13px;
          line-height: 1.5;
          color: #374151;
        }
      }
    }

    // Expiry Alert
    .expiry-alert {
      margin-bottom: 24px;
      border-radius: 12px;

      .alert-content {
        display: flex;
        align-items: center;
        gap: 12px;

        > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      }
    }

    // Submit Section
    .submit-section {
      .submit-btn {
        border-radius: 14px;
        text-transform: none;
        font-weight: 600;
        font-size: 16px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0, 97, 251, 0.2);
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 97, 251, 0.3);
        }
      }
    }
  }
}

// Success Dialog
.success-dialog {
  overflow: hidden;
  background: white;

  .success-dialog-content {
    text-align: center;
    padding: 40px 32px;

    .success-animation {
      margin-bottom: 24px;

      .success-circle {
        width: 80px;
        height: 80px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        animation: pulse 0.5s ease-out;
      }
    }

    .success-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px;
    }

    .success-message {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 32px;
    }

    .success-footer {
      .countdown-bar {
        border-radius: 3px;
        margin-bottom: 12px;
      }

      .redirect-text {
        font-size: 13px;
        color: #94a3b8;
        margin: 0;

        strong {
          color: #0061fb;
        }
      }
    }
  }
}

// Dialog Transition
.dialog-transition-enter-active,
.dialog-transition-leave-active {
  transition: all 0.3s ease;
}

.dialog-transition-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.dialog-transition-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

// Animations
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// Responsive
@media (max-width: 768px) {
  .consent-form-page {
    padding: 16px;
  }

  .form-card {
    .form-header {
      padding: 24px 20px;

      .form-header-content {
        .header-icon {
          width: 44px;
          height: 44px;
        }

        .header-text .form-title {
          font-size: 20px;
        }
      }
    }

    .form-body {
      padding: 24px 20px;
    }
  }

  .signature-section .signature-pad-wrapper .signature-actions {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .expiry-alert .alert-content {
    flex-direction: column;
    text-align: center;
  }
  .typed-signature-wrapper {
    .typed-input-grid {
      grid-template-columns: 1fr;
    }

    .typed-signature-preview {
      .typed-signature-text {
        font-size: 42px !important;
      }
    }
  }
}
</style>
