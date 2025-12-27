<template>
  <div class="consent-form">
    <div class="questions-container">
      <div
        v-for="(question, index) in questions"
        :key="index"
        class="question-item mb-6"
      >
        <label class="question-label mb-3">
          Question {{ index + 1 }}: {{ question.text }}
        </label>
        <div class="d-flex align-center" style="gap: 24px">
          <v-radio-group
            v-model="answers[`question${index + 1}`]"
            inline
            hide-details
            class="radio-group-custom"
          >
            <v-radio
              label="Yes"
              value="yes"
              :disabled="disabled"
              class="radio-custom"
            />
            <v-radio
              label="No"
              value="no"
              :disabled="disabled"
              class="radio-custom"
            />
          </v-radio-group>
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

// 10 questions
const questions = ref([
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
  { text: 'What is the main reason for your visit today?' },
])

const answers = ref({})

// Load form data if editing
watch(() => props.formData, (data) => {
  if (data) {
    // TODO: Load answers from formData
    answers.value = data.answers || {}
  }
}, { immediate: true })

const onSubmit = () => {
  emit('submit', {
    type: 'consent',
    answers: answers.value,
    questions: questions.value,
  })
}

const onReset = () => {
  answers.value = {}
  emit('reset')
}

const reset = () => {
  answers.value = {}
}

defineExpose({ reset })
</script>

<style scoped>
.consent-form {
  width: 100%;
}
.questions-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
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

