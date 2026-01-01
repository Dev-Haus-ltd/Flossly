<template>
  <div class="medical-history-form">
    <div class="questions-container">
      <!-- Patient Information Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Patient Information</h3>
        <div class="form-field mb-4">
          <label class="field-label">Full Name:</label>
          <v-text-field
            v-model="formData.patientInfo.fullName"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Date of Birth:</label>
          <v-text-field
            v-model="formData.patientInfo.dateOfBirth"
            variant="outlined"
            density="compact"
            type="date"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Gender:</label>
          <v-text-field
            v-model="formData.patientInfo.gender"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Address:</label>
          <v-textarea
            v-model="formData.patientInfo.address"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Phone Number:</label>
          <v-text-field
            v-model="formData.patientInfo.phoneNumber"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Email:</label>
          <v-text-field
            v-model="formData.patientInfo.email"
            variant="outlined"
            density="compact"
            type="email"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Emergency Contact (Name & Phone):</label>
          <v-text-field
            v-model="formData.patientInfo.emergencyContact"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Physician & Pharmacy Details Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Physician & Pharmacy Details</h3>
        <div class="form-field mb-4">
          <label class="field-label">Family Physician:</label>
          <v-text-field
            v-model="formData.physician.familyPhysician"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Phone Number:</label>
          <v-text-field
            v-model="formData.physician.phoneNumber"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Preferred Pharmacy:</label>
          <v-text-field
            v-model="formData.physician.preferredPharmacy"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Location:</label>
          <v-text-field
            v-model="formData.physician.location"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Medical History Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Medical History</h3>
        <p class="section-description mb-4">
          Do you have or have you ever had the following? (Check all that apply)
        </p>
        <div class="checkbox-group">
          <v-checkbox
            v-for="condition in medicalConditions"
            :key="condition"
            :label="condition"
            :value="condition"
            v-model="formData.medicalHistory.conditions"
            :disabled="disabled"
            hide-details
            density="compact"
            class="mb-1"
          />
        </div>
        <div class="form-field mt-4">
          <label class="field-label">Other serious illness (please specify):</label>
          <v-textarea
            v-model="formData.medicalHistory.otherIllness"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Medications Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Medications</h3>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you currently taking any medications?</label>
          <v-radio-group
            v-model="formData.medications.currentlyTaking"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div v-if="formData.medications.currentlyTaking === 'yes'" class="form-field mb-4">
          <label class="field-label">If yes, please list all medications:</label>
          <v-textarea
            v-model="formData.medications.medicationList"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            :disabled="disabled"
          />
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Do you take blood thinners?</label>
          <v-radio-group
            v-model="formData.medications.bloodThinners"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you taking or have you taken bisphosphonates (for osteoporosis or cancer)?</label>
          <v-radio-group
            v-model="formData.medications.bisphosphonates"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
      </div>

      <!-- Allergies Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Allergies</h3>
        <p class="section-description mb-4">Do you have allergies to:</p>
        <div class="form-field mb-4">
          <label class="field-label">Medications (please specify):</label>
          <v-textarea
            v-model="formData.allergies.medications"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            :disabled="disabled"
          />
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Latex:</label>
          <v-radio-group
            v-model="formData.allergies.latex"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Other (foods, materials):</label>
          <v-textarea
            v-model="formData.allergies.other"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Past Surgeries Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Past Surgeries or Hospitalizations</h3>
        <div class="form-field mb-4">
          <label class="field-label">Please list and give approximate dates:</label>
          <v-textarea
            v-model="formData.pastSurgeries.list"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Family History Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Family History</h3>
        <div class="form-field mb-4">
          <label class="field-label">Any family history of medical problems relevant to dental care (e.g., bleeding/clotting disorders):</label>
          <v-textarea
            v-model="formData.familyHistory.history"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Lifestyle Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Lifestyle</h3>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Do you smoke or use tobacco/nicotine products?</label>
          <v-radio-group
            v-model="formData.lifestyle.smoking"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div v-if="formData.lifestyle.smoking === 'yes'" class="form-field mb-4">
          <label class="field-label">If yes, how much/often?</label>
          <v-text-field
            v-model="formData.lifestyle.smokingDetails"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Do you consume alcohol?</label>
          <v-radio-group
            v-model="formData.lifestyle.alcohol"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div v-if="formData.lifestyle.alcohol === 'yes'" class="form-field mb-4">
          <label class="field-label">If yes, how much/often?</label>
          <v-text-field
            v-model="formData.lifestyle.alcoholDetails"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Recreational drug use?</label>
          <v-radio-group
            v-model="formData.lifestyle.recreationalDrugs"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you pregnant or suspect you may be?</label>
          <v-radio-group
            v-model="formData.lifestyle.pregnant"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you nursing?</label>
          <v-radio-group
            v-model="formData.lifestyle.nursing"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you taking birth control pills?</label>
          <v-radio-group
            v-model="formData.lifestyle.birthControl"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
      </div>

      <!-- Dental History Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Dental History</h3>
        <div class="form-field mb-4">
          <label class="field-label">Purpose of today's visit:</label>
          <v-textarea
            v-model="formData.dentalHistory.purpose"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            :disabled="disabled"
          />
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Are you in pain?</label>
          <v-radio-group
            v-model="formData.dentalHistory.inPain"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div class="question-item mb-4">
          <label class="question-label mb-3">Previous adverse reaction to dental treatment?</label>
          <v-radio-group
            v-model="formData.dentalHistory.adverseReaction"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio label="Yes" value="yes" :disabled="disabled" />
            <v-radio label="No" value="no" :disabled="disabled" />
          </v-radio-group>
        </div>
        <div v-if="formData.dentalHistory.adverseReaction === 'yes'" class="form-field mb-4">
          <label class="field-label">If yes, please describe:</label>
          <v-textarea
            v-model="formData.dentalHistory.adverseReactionDetails"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            :disabled="disabled"
          />
        </div>
      </div>

      <!-- Consent Section -->
      <div class="section mb-6">
        <h3 class="section-title mb-4">Consent</h3>
        <div class="form-field mb-4">
          <label class="field-label">I confirm that the information provided above is accurate and complete.</label>
          <div class="d-flex align-center mt-2" style="gap: 24px">
            <v-checkbox
              v-model="formData.consent.confirmed"
              label="I confirm"
              :disabled="disabled"
              hide-details
              density="compact"
            />
          </div>
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Signature:</label>
          <v-text-field
            v-model="formData.consent.signature"
            variant="outlined"
            density="compact"
            :disabled="disabled"
          />
        </div>
        <div class="form-field mb-4">
          <label class="field-label">Date:</label>
          <v-text-field
            v-model="formData.consent.date"
            variant="outlined"
            density="compact"
            type="date"
            :disabled="disabled"
          />
        </div>
      </div>
    </div>

    <div class="form-actions d-flex justify-end mt-8" style="gap: 12px">
      <v-btn
        variant="outlined"
        color="primary"
        @click="onReset"
      >
        Reset
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        @click="onSubmit"
      >
        Submit
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  formData: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'reset'])

// Medical conditions list
const medicalConditions = [
  'Heart disease',
  'High blood pressure',
  'Stroke',
  'Diabetes',
  'Asthma or lung conditions',
  'Thyroid problems',
  'Hepatitis, jaundice, or liver disease',
  'Kidney disease',
  'Tuberculosis (TB)',
  'Seizures/epilepsy',
  'Bleeding disorder',
  'Artificial joints/implants',
  'Cancer/radiation/chemotherapy',
  'Osteoporosis/bone disorders',
]

// Initialize form data structure
const formData = ref({
  patientInfo: {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
  },
  physician: {
    familyPhysician: '',
    phoneNumber: '',
    preferredPharmacy: '',
    location: '',
  },
  medicalHistory: {
    conditions: [],
    otherIllness: '',
  },
  medications: {
    currentlyTaking: '',
    medicationList: '',
    bloodThinners: '',
    bisphosphonates: '',
  },
  allergies: {
    medications: '',
    latex: '',
    other: '',
  },
  pastSurgeries: {
    list: '',
  },
  familyHistory: {
    history: '',
  },
  lifestyle: {
    smoking: '',
    smokingDetails: '',
    alcohol: '',
    alcoholDetails: '',
    recreationalDrugs: '',
    pregnant: '',
    nursing: '',
    birthControl: '',
  },
  dentalHistory: {
    purpose: '',
    inPain: '',
    adverseReaction: '',
    adverseReactionDetails: '',
  },
  consent: {
    confirmed: false,
    signature: '',
    date: '',
  },
})

// Load form data if editing
watch(() => props.formData, (data) => {
  if (data && data.answers) {
    // Deep merge the answers into formData structure
    if (typeof data.answers === 'object' && data.answers !== null) {
      // Recursively merge nested objects
      const mergeDeep = (target, source) => {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {}
            mergeDeep(target[key], source[key])
          } else {
            target[key] = source[key]
          }
        }
      }
      mergeDeep(formData.value, data.answers)
    }
  }
}, { immediate: true, deep: true })

const onSubmit = async () => {
  emit('submit', {
    type: 'medical_history',
    answers: formData.value,
  })
}

const onReset = () => {
  // Reset to initial state
  formData.value = {
    patientInfo: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phoneNumber: '',
      email: '',
      emergencyContact: '',
    },
    physician: {
      familyPhysician: '',
      phoneNumber: '',
      preferredPharmacy: '',
      location: '',
    },
    medicalHistory: {
      conditions: [],
      otherIllness: '',
    },
    medications: {
      currentlyTaking: '',
      medicationList: '',
      bloodThinners: '',
      bisphosphonates: '',
    },
    allergies: {
      medications: '',
      latex: '',
      other: '',
    },
    pastSurgeries: {
      list: '',
    },
    familyHistory: {
      history: '',
    },
    lifestyle: {
      smoking: '',
      smokingDetails: '',
      alcohol: '',
      alcoholDetails: '',
      recreationalDrugs: '',
      pregnant: '',
      nursing: '',
      birthControl: '',
    },
    dentalHistory: {
      purpose: '',
      inPain: '',
      adverseReaction: '',
      adverseReactionDetails: '',
    },
    consent: {
      confirmed: false,
      signature: '',
      date: '',
    },
  }
  emit('reset')
}

const reset = () => {
  onReset()
}

defineExpose({ reset })
</script>

<style scoped>
.medical-history-form {
  width: 100%;
}
.questions-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
}
.section {
  margin-bottom: 32px;
}
.section:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 24px;
}
.section-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 18px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  margin-bottom: 16px;
}
.section-description {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
}
.question-item {
  padding: 0;
}
.question-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  display: block;
}
.field-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0%;
  color: #1e1e1e;
  display: block;
  margin-bottom: 8px;
}
.form-field {
  margin-bottom: 16px;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.radio-group-custom :deep(.v-radio) {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0%;
}
.radio-group-custom :deep(.v-radio .v-label) {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0%;
}
</style>
