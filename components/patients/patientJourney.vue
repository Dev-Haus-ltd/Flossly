<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-space-between align-center py-3">
      <span>Patient Journey</span>
      <div class="d-flex align-center" style="gap: 8px">
        <template v-if="section === 'smile'">
          <v-btn
            variant="flat"
            class="journey-action-btn share-btn"
            @click="onShare"
          >
            Share
          </v-btn>
          <v-btn
            variant="flat"
            class="journey-action-btn print-btn"
            @click="onPrint"
          >
            Print
          </v-btn>
          <v-btn
            variant="flat"
            class="journey-action-btn download-btn"
            @click="onDownload"
          >
            Download
          </v-btn>
        </template>
        <template v-else-if="section !== 'automations'">
          <v-btn
            variant="outlined"
            color="primary"
            class="journey-action-btn"
            @click="isEditing = true"
          >
            Edit
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="journey-action-btn"
            :disabled="!isEditing"
            @click="onSave"
          >
            Save
          </v-btn>
        </template>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="px-5 py-0">
      <div class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="items"
          :selected="section"
          @select="section = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="min-height: 55vh">
          <div v-if="section === 'comfort'">
            <UniquePatientComfortForm
              ref="comfortForm"
              :patient-id="patient?.id"
              :editing="isEditing"
            />
          </div>
          <div v-else-if="section === 'smile'">
            <SmileConcernSurveyForm
              ref="surveyForm"
              :patient-id="patient?.id"
              :editing="isEditing"
            />
          </div>

          <div v-else-if="section === 'automations'">
            <v-card class="content-card" :elevation="0">
              <div v-if="!patientId" class="text-center py-10">
                <v-icon size="48" color="grey-lighten-1">mdi-account-alert-outline</v-icon>
                <p class="text-body-1 mt-2 text-medium-emphasis">Select a patient to manage automations.</p>
              </div>
              <ClientOnly v-else>
                <CustomerRelationManagementAutomation
                  :key="patientId"
                  ref="journeyAutomationRef"
                  :patient-id="patientId"
                  :patient="patient"
                  display-mode="inline"
                  :use-groups-api="true"
                  :include-defaults="false"
                  :whatsapp-enabled="false"
                  :show-preview-action="true"
                  :show-resend-action="false"
                  :show-sent-status-column="true"
                  :show-trigger-column="true"
                  :read-only-trigger="true"
                  :show-card-toggle="true"
                  :disable-toggle="false"
                />
              </ClientOnly>
            </v-card>
          </div>
          <div v-else>
            <v-alert type="info" variant="tonal" class="mt-4">
              Section coming soon.
            </v-alert>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import CommonSideBar from '@/components/Common/sideBar.vue'
import UniquePatientComfortForm from '@/components/patients/journey/UniquePatientComfortForm.vue'
import SmileConcernSurveyForm from '@/components/patients/journey/SmileConcernSurveyForm.vue'
import CustomerRelationManagementAutomation from '@/components/customerRelationManagement/automation.vue'

const props = defineProps({
  patient: { type: Object, default: null },
})

const section = ref('comfort')
const isEditing = ref(false)
const comfortForm = ref(null)
const surveyForm = ref(null)
const patientId = computed(() => (props.patient?.id ? Number(props.patient.id) : null))

const journeyAutomationRef = ref(null)

const onSave = () => {
  // Delegate save to current section
  if (section.value === 'comfort' && comfortForm.value?.save) {
    comfortForm.value.save().then(() => {
      isEditing.value = false
    })
  } else if (section.value === 'smile' && surveyForm.value?.save) {
    surveyForm.value.save().then(() => {
      isEditing.value = false
    })
  }
}

const onShare = () => {
  if (section.value === 'smile' && surveyForm.value?.share) {
    surveyForm.value.share()
  }
}

const onPrint = () => {
  if (section.value === 'smile' && surveyForm.value?.print) {
    surveyForm.value.print()
  }
}

const onDownload = () => {
  if (section.value === 'smile' && surveyForm.value?.download) {
    surveyForm.value.download()
  }
}

const items = [
  { key: 'comfort', label: 'Unique Patient Comfort' },
  { key: 'smile', label: 'Smile Concern Survey' },
  { key: 'automations', label: 'Automations' },
]

watch(section, async (val) => {
  if (val === 'automations' && patientId.value) {
    await nextTick()
    journeyAutomationRef.value?.refresh?.()
  }
})
</script>

<style scoped>
.title {
  font-weight: 600;
  font-size: 18px;
}
.sidebar {
  min-width: 200px;
  position: sticky;
  top: 72px;
}
.journey-action-btn {
  width: 90px;
  height: 46px;
  border-radius: 8px;
  color: white;
}
.share-btn {
  background: #7D77FF !important;
}
.print-btn {
  background: #0061FB !important;
}
.download-btn {
  background: #1E2B80 !important;
}
.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  min-height: 50vh;
}
</style>
