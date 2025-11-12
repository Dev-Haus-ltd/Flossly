<template>
  <v-navigation-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" location="right" temporary :width="520">
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text"> New Appointment </v-toolbar-title>
      <v-spacer />
      <v-btn icon variant="outlined" color="#8B8B8B" @click="$emit('update:modelValue', false)" class="mr-4" style="width:20px;height:20px;min-width:20px;border-radius:50%;padding:0;">
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div class="pa-4" style="background-color:#f5f5f5;height: calc(100% - 64px - 64px); overflow-y:auto;">
      <v-card class="pa-4" color="white" elevation="0">
        <div class="d-flex align-center mb-3">
          <div class="dot mr-3"></div>
          <div>
            <div class="text-body-2">{{ headerText }}</div>
            <div class="text-caption text-grey">{{ exam || 'Exam' }}</div>
          </div>
        </div>

        <v-form>
          <v-row dense>
            <v-col cols="12">
              <label class="fld-lbl">Patient</label>
              <v-autocomplete
                v-model="selectedPatientId"
                :items="patientOptions"
                item-title="name"
                item-value="id"
                clearable
                density="compact"
                variant="solo"
                class="input-bordered mb-0"
                bg-color="white"
                hide-details
                :placeholder="'Search'"
                flat
              >
                <template #append>
                  <v-btn icon size="28" variant="text" @click="$emit('add-patient')">
                    <v-icon size="18">mdi-account-plus</v-icon>
                  </v-btn>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="6">
              <label class="fld-lbl">Date</label>
              <v-menu v-model="dateMenu" :close-on-content-click="false" transition="scale-transition" offset-y>
                <template #activator="{ props }">
                  <v-text-field v-bind="props" v-model="date" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" hide-details flat readonly>
                    <template #append-inner>
                      <v-icon class="cursor-pointer" @click.stop="dateMenu = true">mdi-calendar</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker v-model="date" @update:model-value="dateMenu = false" color="primary" />
              </v-menu>
            </v-col>

            <v-col cols="6">
              <label class="fld-lbl">Time</label>
              <v-select v-model="time" :items="timeOptions" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" hide-details flat :placeholder="'Select time'" />
            </v-col>

            <v-col cols="12">
              <div class="d-flex" style="gap: 8px">
                <div style="flex:1">
                  <label class="fld-lbl">Exam</label>
                  <v-select v-model="exam" :items="exams" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
                </div>
                <div style="max-width: 160px; width:160px">
                  <label class="fld-lbl">Status</label>
                  <v-select v-model="status" :items="statuses" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
                </div>
                <div style="max-width: 120px; width:120px">
                  <label class="fld-lbl">Duration</label>
                  <v-select v-model="duration" :items="durations" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
                </div>
              </div>
            </v-col>

            <v-col cols="12">
              <label class="fld-lbl">Practitioner</label>
              <v-select v-model="practitioner" :items="practitionerOptions" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
            </v-col>

            <v-col cols="12">
              <label class="fld-lbl">Notes</label>
              <v-textarea v-model="notes" auto-grow variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <div class="px-4 pb-4">
      <v-btn block color="primary" @click="onSave">Save Appointment</v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialDate: { type: String, default: '' },
  initialTime: { type: String, default: '' },
  initialPractitioner: { type: String, default: '' },
  practitionerOptions: { type: Array, default: () => [] },
  patientOptions: { type: Array, default: () => [] },
  preselectedPatientId: { type: [Number, String], default: null },
  preselectedPatient: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue','save','add-patient'])

const selectedPatientId = ref(null)
const date = ref('')
const time = ref('')
const exam = ref('Exam')
const status = ref('Pending')
const duration = ref(15)
const practitioner = ref('')
const notes = ref('')
const dateMenu = ref(false)

import { useOrganisationStore } from '@/stores/organisation'
const organisationStore = useOrganisationStore()
const treatmentOptions = ref([])
const exams = computed(() => treatmentOptions.value.map(t => t.name))
const statuses = ['Pending','Confirmed','Arrived','Cancelled']
const durations = [15,30,45,60]

const headerText = computed(() => `${date.value || ''} ${time.value || ''}`.trim() + (duration.value ? ` for ${duration.value} minutes` : ''))

const WORK_START = 9
const WORK_END = 17
const SLOT_MINUTES = 15
const toHM = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
const timeOptions = computed(() => {
  const dur = Number(duration.value || 15)
  const options = []
  const latestStart = (WORK_END * 60) - dur
  for (let mins = WORK_START * 60; mins <= latestStart; mins += SLOT_MINUTES) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    options.push(toHM(h, m))
  }
  return options
})

watch(duration, () => {
  if (!time.value || !timeOptions.value.includes(time.value)) {
    time.value = timeOptions.value[0] || ''
  }
})

watch(() => props.modelValue, (open) => {
  if (open) {
    date.value = props.initialDate
    time.value = props.initialTime
    practitioner.value = props.initialPractitioner
    if (props.preselectedPatientId) selectedPatientId.value = props.preselectedPatientId
    if (!time.value || !timeOptions.value.includes(time.value)) {
      time.value = timeOptions.value[0] || ''
    }
    if (!treatmentOptions.value.length) {
      organisationStore.listTreatments().then((res) => {
        if (res?.code === 0) treatmentOptions.value = (res.data || []).map(r => ({ id: r.id, name: r.name, defaultDuration: r.defaultDuration || 15, amount: r.amount || 0 }))
      })
    }
  }
})

const onSave = () => {
  const selectedTreatment = treatmentOptions.value.find(t => t.name === exam.value)
  emit('save', {
    patientId: selectedPatientId.value || props.preselectedPatientId || null,
    patient: '',
    date: date.value,
    time: time.value,
    duration: duration.value,
    exam: exam.value,
    treatmentId: selectedTreatment?.id || null,
    treatmentName: selectedTreatment?.name || null,
    status: status.value,
    practitioner: practitioner.value,
    notes: notes.value,
  })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dot { width: 28px; height: 28px; border-radius: 50%; background: #c7b8ff; }
:deep(.v-field) { border-radius: 10px; }
.fld-lbl { font-weight: 400; font-size: 14px; color: #737373; }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background-color: white !important; min-height: 40px; font-size: 14px; }
</style>

