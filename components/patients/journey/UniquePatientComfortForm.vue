<template>
  <div class="comfort-form">
    <v-form @submit.prevent="onSave">
      <v-row>
        <v-col cols="12" class="comfort-field pt-6">
          <label class="field-label">Beverage preferences</label>
          <v-select
            v-model="form.beveragePreference"
            :items="beverageOptions"
            label=""
            variant="outlined"
            density="compact"
            :disabled="!editing"
          />
        </v-col>
        <v-col cols="12" class="comfort-field pt-4">
          <label class="field-label">Blanket preferences during treatment</label>
          <v-select
            v-model="form.blanketPreference"
            :items="blanketOptions"
            label=""
            variant="outlined"
            density="compact"
            :disabled="!editing"
          />
        </v-col>

        <v-col cols="12" class="pt-4">
          <h4 class="mt-4 mb-2">Entertainment Options</h4>
          <v-radio-group
            v-model="entertainmentOption"
            inline
            :disabled="!editing"
          >
            <v-radio label="Television" value="Television" />
            <v-radio label="Movies" value="Movies" class="ml-4" />
            <v-radio label="Music Genres" value="Music Genres" class="ml-4" />
          </v-radio-group>
        </v-col>

        <v-col cols="12" class="comfort-field pt-4">
          <label class="field-label">Lighting and room temperature preferences</label>
          <v-select
            v-model="form.lightingPreference"
            :items="lightingOptions"
            label=""
            variant="outlined"
            density="compact"
            :disabled="!editing"
          />
        </v-col>

        <v-col cols="12" class="comfort-field pt-4">
          <label class="field-label">Room temperature preferences</label>
          <v-select
            v-model="form.roomTemperaturePreference"
            :items="temperatureOptions"
            label=""
            variant="outlined"
            density="compact"
            :disabled="!editing"
          />
        </v-col>

        <v-col cols="12" class="comfort-field pt-4">
          <label class="field-label">Aromatherapy preferences</label>
          <v-select
            v-model="form.aromatherapyPreference"
            :items="aromaOptions"
            label=""
            variant="outlined"
            density="compact"
            :disabled="!editing"
          />
        </v-col>

        <v-col cols="12" class="pt-4">
          <h4 class="mt-4 mb-2">Communication style preferences</h4>
          <v-radio-group
            v-model="form.communicationStyle"
            inline
            :disabled="!editing"
          >
            <v-radio label="Detailed" value="Detailed" />
            <v-radio class="ml-4" label="Minimal" value="Minimal" />
            <v-radio class="ml-4" label="Visual" value="Visual" />
          </v-radio-group>
        </v-col>

        <v-col cols="12" class="pt-4">
          <h4 class="mt-4 mb-2">Anxiety level tracking</h4>
          <v-slider
            v-model="form.anxietyLevel"
            :min="1"
            :max="10"
            step="1"
            show-ticks="always"
            tick-size="3"
            thumb-label
            :disabled="!editing"
          />
        </v-col>

        <v-col cols="12" class="pt-4 pb-4">
          <div
            v-for="(q, index) in form.customQuestions"
            :key="index"
            class="mb-4"
          >
            <v-text-field
              v-model="q.question"
              label="Question"
              variant="outlined"
              density="compact"
              class="mb-2"
              :disabled="!editing"
            />
            <v-text-field
              v-model="q.answer"
              label="Answer"
              variant="outlined"
              density="compact"
              :disabled="!editing"
            />
          </div>
          <v-btn
            v-if="form.customQuestions.length < 10"
            variant="flat"
            color="primary"
            @click="addCustomQuestion"
            :disabled="!editing"
          >
            Add More Questions
          </v-btn>
        </v-col>
      </v-row>
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

const form = reactive({
  beveragePreference: null,
  blanketPreference: null,
  lightingPreference: null,
  roomTemperaturePreference: null,
  aromatherapyPreference: null,
  communicationStyle: null,
  anxietyLevel: 5,
  customQuestions: [],
})

// Single selection for entertainment option
const entertainmentOption = ref(null)

const beverageOptions = ['Water', 'Tea', 'Coffee', 'Juice', 'No Preference']
const blanketOptions = ['No Blanket', 'Light Blanket', 'Warm Blanket']
const lightingOptions = ['Bright', 'Soft', 'Dim', 'No Preference']
const temperatureOptions = ['Cool', 'Neutral', 'Warm', 'No Preference']
const aromaOptions = ['Lavender', 'Citrus', 'Mint', 'Unscented', 'No Preference']

const loadComfort = async () => {
  if (!props.patientId) return
  const res = await diaryStore.getPatientComfort(props.patientId)
  if (res?.code === 0) {
    const data = res.data || {}
    form.beveragePreference = data.beveragePreference
    form.blanketPreference = data.blanketPreference
    form.lightingPreference = data.lightingPreference
    form.roomTemperaturePreference = data.roomTemperaturePreference
    form.aromatherapyPreference = data.aromatherapyPreference
    form.communicationStyle = data.communicationStyle
    form.anxietyLevel = data.anxietyLevel || 5
    form.customQuestions = Array.isArray(data.customQuestions)
      ? data.customQuestions
      : []
    const ent = data.entertainmentOptions || {}
    // Support both old and new structures
    if (ent.selected) {
      entertainmentOption.value = ent.selected
    } else if (ent.television) {
      entertainmentOption.value = 'Television'
    } else if (ent.movies) {
      entertainmentOption.value = 'Movies'
    } else if (ent.musicGenres && ent.musicGenres.length) {
      entertainmentOption.value = 'Music Genres'
    }
  }
}

onMounted(() => {
  loadComfort()
})

watch(
  () => props.patientId,
  () => {
    loadComfort()
  }
)

const addCustomQuestion = () => {
  if (form.customQuestions.length >= 10) return
  form.customQuestions.push({ question: '', answer: '' })
}

const onSave = async () => {
  if (!props.patientId) return
  const payload = {
    patientId: props.patientId,
    beveragePreference: form.beveragePreference,
    blanketPreference: form.blanketPreference,
    lightingPreference: form.lightingPreference,
    roomTemperaturePreference: form.roomTemperaturePreference,
    aromatherapyPreference: form.aromatherapyPreference,
    communicationStyle: form.communicationStyle,
    anxietyLevel: form.anxietyLevel,
    entertainmentOptions: {
      selected: entertainmentOption.value || null,
    },
    customQuestions: form.customQuestions,
  }

  try {
    const res = await diaryStore.savePatientComfort(payload)
    if (res?.code === 0) {
      mainStore.setSnackbar({
        title: 'Comfort preferences saved',
        type: 'success',
      })
    } else {
      mainStore.setSnackbar({
        title: res?.message || 'Failed to save comfort preferences',
        type: 'error',
      })
    }
  } catch (err) {
    const msg =
      err?.message ||
      err?.data?.message ||
      'Failed to save comfort preferences'
    mainStore.setSnackbar({
      title: msg,
      type: 'error',
    })
  }
}

defineExpose({ save: onSave })
</script>

<style scoped>
h3 {
  font-weight: 600;
  font-size: 18px;
}
.comfort-form {
  max-width: 556px;
}
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 400;
  color: #1e1e1e;
  margin-bottom: 4px;
}
.comfort-field :deep(.v-field) {
  min-height: 44px;
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