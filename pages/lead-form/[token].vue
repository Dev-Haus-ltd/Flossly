<template>
  <div class="lead-form-page">
    <div class="lead-form-shell">
      <div v-if="loading" class="state-card">
        <v-progress-circular indeterminate color="primary" size="48" />
        <h2>Loading form</h2>
        <p>Please wait while we prepare your lead form.</p>
      </div>

      <div v-else-if="loadError" class="state-card state-card--error">
        <v-icon size="52" color="#ef4444">mdi-alert-circle-outline</v-icon>
        <h2>Form not available</h2>
        <p>{{ loadError }}</p>
      </div>

      <div v-else class="lead-form-card">
        <div class="lead-form-card__header" :style="{ background: formMeta.color || '#0061FB' }">
          <div class="lead-form-card__brand">
            <img
              v-if="formMeta.logo"
              :src="formMeta.logo"
              alt="Practice logo"
              class="lead-form-card__logo"
            />
            <div>
              <h1>{{ formMeta.formName || "Enquiry Form" }}</h1>
              <p>{{ formMeta.practiceName || "Flossly" }}</p>
            </div>
          </div>
        </div>

        <div class="lead-form-card__body">
          <div v-if="submittedSuccessfully" class="state-card state-card--success">
            <v-icon size="52" color="#10b981">mdi-check-circle-outline</v-icon>
            <h2>Enquiry sent</h2>
            <p>Thank you. Your enquiry has been submitted successfully.</p>
          </div>

          <form v-else class="lead-form-fields" @submit.prevent="submitForm">
            <div
              v-for="field in normalizedFields"
              :key="field.key"
              class="lead-form-field"
            >
              <label class="lead-form-label">
                {{ field.label }}
                <span v-if="field.required" class="lead-form-label__required">*</span>
              </label>

              <template v-if="field.type === 'tel'">
                <div
                  class="mb-1 crm-phone-input"
                  :class="{ 'crm-phone-input--error': !!getFieldErrors(field).length }"
                >
                  <v-phone-input
                    v-model="formData[field.key]"
                    density="comfortable"
                    variant="solo"
                    flat
                    default-country="gb"
                    :prefer-countries="['gb']"
                    :country-props="phoneCountryProps"
                    :phone-props="phoneProps"
                    @update:phone-object="onPhoneObjectUpdate(field.key, $event)"
                  />
                </div>
                <div
                  v-if="getFieldErrors(field).length"
                  class="phone-error-msg"
                >
                  {{ getFieldErrors(field)[0] }}
                </div>
              </template>

              <v-text-field
                v-else-if="['text', 'email'].includes(field.type)"
                v-model="formData[field.key]"
                :type="field.type"
                :placeholder="field.placeholder || ''"
                variant="outlined"
                density="comfortable"
                class="lead-form-control"
                hide-details
                :error-messages="getFieldErrors(field)"
              />

              <v-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                :items="getSelectItems(field)"
                item-title="label"
                item-value="value"
                :placeholder="field.placeholder || 'Select...'"
                variant="outlined"
                density="comfortable"
                class="lead-form-control"
                hide-details
                :error-messages="getFieldErrors(field)"
              />

              <v-textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.key]"
                :placeholder="field.placeholder || ''"
                variant="outlined"
                density="comfortable"
                rows="4"
                auto-grow
                class="lead-form-control"
                hide-details
                :error-messages="getFieldErrors(field)"
              />
            </div>

            <div v-if="submitError" class="lead-form-submit-error">
              {{ submitError }}
            </div>

            <div class="lead-form-consent">
              By submitting you consent to being contacted about your enquiry.
            </div>

            <v-btn
              type="submit"
              block
              size="large"
              :loading="submitting"
              :disabled="!canSubmit"
              :style="{ background: formMeta.color || '#0061FB', color: '#fff' }"
              class="lead-form-submit"
            >
              Send Enquiry
            </v-btn>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false });

const route = useRoute();

const token = computed(() => String(route.params.token || "").trim());
const loading = ref(true);
const submitting = ref(false);
const submitted = ref(false);
const submittedSuccessfully = ref(false);
const loadError = ref("");
const submitError = ref("");
const formMeta = ref({});
const formData = ref({});
const phoneObjects = ref({});

const normalizedFields = computed(() => Array.isArray(formMeta.value?.fields) ? formMeta.value.fields : []);
const emailRegex = /^(?:[a-zA-Z0-9_'^&+\-]+(?:\.[a-zA-Z0-9_'^&+\-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const normalizeText = (value) => String(value || "").trim();
const phoneCountryProps = {
  label: "",
  hideDetails: true,
  flat: true,
  variant: "solo",
  bgColor: "white",
};
const phoneProps = {
  label: "",
  hideDetails: true,
  flat: true,
  variant: "solo",
  bgColor: "white",
};

const getSelectItems = (field) =>
  (field.options || []).map((option) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return {
      label: option?.name || option?.label || String(option?.id || ""),
      value: option?.name || option?.value || String(option?.id || ""),
    };
  });

const getTrimmedValue = (field) => normalizeText(formData.value?.[field.key]);

const onPhoneObjectUpdate = (fieldKey, value) => {
  phoneObjects.value = {
    ...phoneObjects.value,
    [fieldKey]: value,
  };
};

const getFieldErrors = (field) => {
  const errors = [];
  const value = getTrimmedValue(field);

  if (submitted.value && field.required && !value) {
    errors.push(`${field.label} is required`);
  }

  if (value && field.type === "email" && !emailRegex.test(value)) {
    errors.push("Enter a valid email");
  }

  if (field.type === "tel" && value && !phoneObjects.value?.[field.key]?.valid) {
    errors.push("Enter a valid telephone number");
  }

  return errors;
};

const canSubmit = computed(() =>
  normalizedFields.value.every((field) => {
    const value = getTrimmedValue(field);
    if (field.required && !value) return false;
    if (value && field.type === "email" && !emailRegex.test(value)) return false;
    if (field.type === "tel" && value && !phoneObjects.value?.[field.key]?.valid) return false;
    return true;
  })
);

const primeFormData = () => {
  const next = {};
  normalizedFields.value.forEach((field) => {
    next[field.key] = "";
  });
  formData.value = next;
  phoneObjects.value = {};
};

const loadForm = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const res = await $fetch("/api/form/meta", {
      query: { token: token.value },
    });
    if (res?.code !== 0 || !res?.data) {
      throw new Error(res?.message || "Form not found");
    }
    formMeta.value = res.data;
    primeFormData();
  } catch (err) {
    loadError.value = err?.message || "This form link is invalid or no longer active.";
  } finally {
    loading.value = false;
  }
};

const submitForm = async () => {
  submitted.value = true;
  submitError.value = "";
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const res = await $fetch("/api/form/submit", {
      method: "POST",
      body: {
        token: token.value,
        data: formData.value,
      },
    });
    if (res?.code !== 0) {
      throw new Error(res?.message || "Failed to submit form");
    }
    submittedSuccessfully.value = true;
  } catch (err) {
    submitError.value = err?.message || "Failed to submit form";
  } finally {
    submitting.value = false;
  }
};

onMounted(loadForm);
</script>

<style scoped lang="scss">
.lead-form-page {
  min-height: 100vh;
  padding: 24px;
  background: #ffffff;
}

.lead-form-shell {
  max-width: 760px;
  margin: 0 auto;
}

.state-card,
.lead-form-card {
  border-radius: 28px;
  background: transparent;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 32px;
  text-align: center;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    margin: 0;
    max-width: 420px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
  }
}

.state-card--error {
  border: 1px solid rgba(239, 68, 68, 0.16);
}

.state-card--success {
  box-shadow: none;
  border: 1px solid rgba(16, 185, 129, 0.16);
}

.lead-form-card__header {
  padding: 28px 32px;
  border-radius: 28px 28px 0 0;
}

.lead-form-card__brand {
  display: flex;
  align-items: center;
  gap: 16px;

  h1 {
    margin: 0 0 4px;
    color: #fff;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    font-size: 14px;
  }
}

.lead-form-card__eyebrow {
  margin-bottom: 6px !important;
  color: rgba(255, 255, 255, 0.72) !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px !important;
  font-weight: 700;
}

.lead-form-card__logo {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  padding: 6px;
}

.lead-form-card__body {
  padding: 32px;
}

.lead-form-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.lead-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lead-form-label {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.lead-form-label__required {
  color: #ef4444;
}

.lead-form-control :deep(.v-field) {
  border-radius: 8px !important;
  background-color: #ffffff !important;
}

.lead-form-consent {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.lead-form-submit-error {
  padding: 12px 14px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.95);
  color: #b91c1c;
  font-size: 14px;
  line-height: 1.5;
}

.crm-phone-input :deep(.v-phone-input) {
  display: flex;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.crm-phone-input :deep(.v-phone-input__country__input .v-field),
.crm-phone-input :deep(.v-phone-input__phone__input .v-field) {
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  min-height: 40px;
  font-size: 14px;
}

.crm-phone-input :deep(.v-phone-input__country__input.v-input) {
  min-width: 88px;
  max-width: 88px;
  flex: 0 0 88px;
  cursor: pointer;
}

.crm-phone-input :deep(.v-phone-input__phone__input.v-input) {
  flex: 1 1 auto;
  min-width: 0;
}

.crm-phone-input :deep(.v-phone-input__country__input .v-field) {
  border-right: 1px solid rgba(0, 0, 0, 0.38) !important;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.crm-phone-input :deep(.v-phone-input__country__input:hover .v-field) {
  background-color: #f0f4ff !important;
}

.crm-phone-input :deep(.v-phone-input__phone__input .v-field__input) {
  padding-left: 10px;
}

.crm-phone-input--error :deep(.v-phone-input) {
  border-color: rgb(var(--v-theme-error)) !important;
}

.phone-error-msg {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  padding: 4px 16px 0;
}

.lead-form-submit {
  margin-top: 8px;
  min-height: 50px;
  border-radius: 14px;
  text-transform: none;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

@media (max-width: 768px) {
  .lead-form-page {
    padding: 16px;
  }

  .lead-form-card__header,
  .lead-form-card__body {
    padding: 22px 18px;
  }

  .lead-form-card__brand {
    align-items: flex-start;

    h1 {
      font-size: 24px;
    }
  }
}
</style>
