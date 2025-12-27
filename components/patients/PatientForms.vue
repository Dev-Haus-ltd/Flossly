<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-space-between align-center py-3">
      <span>Forms</span>
      <v-btn
        v-if="!showFormView"
        color="primary"
        variant="flat"
        @click="openFormView"
      >
        Add new history form
      </v-btn>
      <v-btn
        v-else
        variant="outlined"
        color="primary"
        @click="closeFormView"
      >
        Back to List
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text class="px-5 py-4">
      <!-- Table View -->
      <div v-if="!showFormView" class="table-container">
        <v-data-table
          :headers="tableHeaders"
          :items="forms"
          :loading="loading"
          item-value="id"
          class="forms-table"
          density="comfortable"
        >
          <template #item.createdBy="{ item }">
            {{ item.createdBy || '-' }}
          </template>
          <template #item.patientComments="{ item }">
            {{ item.patientComments || '-' }}
          </template>
          <template #item.ourComments="{ item }">
            {{ item.ourComments || '-' }}
          </template>
          <template #item.additionalInfo="{ item }">
            {{ item.additionalInfo || '-' }}
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex align-center" style="gap: 8px">
              <v-btn
                variant="text"
                size="small"
                color="primary"
                @click="viewForm(item)"
              >
                View
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                color="primary"
                @click="editForm(item)"
              >
                Edit
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- Form View with Sidebar -->
      <div v-else class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="formItems"
          :selected="selectedForm"
          @select="selectedForm = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="min-height: 55vh">
          <div v-if="selectedForm === 'medical'">
            <MedicalHistoryForm
              ref="medicalFormRef"
              :form-data="editingForm"
              @submit="onFormSubmit"
              @reset="onFormReset"
            />
          </div>
          <div v-else-if="selectedForm === 'consent'">
            <ConsentForm
              ref="consentFormRef"
              :form-data="editingForm"
              @submit="onFormSubmit"
              @reset="onFormReset"
            />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import CommonSideBar from '@/components/Common/sideBar.vue'
import MedicalHistoryForm from '@/components/patients/forms/MedicalHistoryForm.vue'
import ConsentForm from '@/components/patients/forms/ConsentForm.vue'

const props = defineProps({
  patient: { type: Object, default: null },
})

const forms = ref([])
const loading = ref(false)
const showFormView = ref(false)
const selectedForm = ref('medical')
const editingForm = ref(null)
const medicalFormRef = ref(null)
const consentFormRef = ref(null)

const tableHeaders = [
  { title: 'Created by', key: 'createdBy', sortable: true },
  { title: 'Patients Comments', key: 'patientComments', sortable: false },
  { title: 'Our comments', key: 'ourComments', sortable: false },
  { title: 'Additional informations', key: 'additionalInfo', sortable: false },
  { title: 'Action', key: 'actions', sortable: false, align: 'center' },
]

const formItems = [
  { key: 'medical', label: 'Medical History Form' },
  { key: 'consent', label: 'Consent Form' },
]

const openFormView = () => {
  editingForm.value = null
  selectedForm.value = 'medical'
  showFormView.value = true
}

const closeFormView = () => {
  showFormView.value = false
  editingForm.value = null
  selectedForm.value = 'medical'
}

const viewForm = (form) => {
  editingForm.value = { ...form }
  // TODO: Set selected form based on form type
  selectedForm.value = 'medical' // or 'consent' based on form.type
  showFormView.value = true
}

const editForm = (form) => {
  editingForm.value = { ...form }
  // TODO: Set selected form based on form type
  selectedForm.value = 'medical' // or 'consent' based on form.type
  showFormView.value = true
}

const onFormSubmit = (formData) => {
  console.log('Form submitted:', formData)
  // TODO: Save form data via API
  closeFormView()
  // TODO: Refresh forms list
}

const onFormReset = () => {
  if (selectedForm.value === 'medical' && medicalFormRef.value) {
    medicalFormRef.value.reset()
  } else if (selectedForm.value === 'consent' && consentFormRef.value) {
    consentFormRef.value.reset()
  }
}

// TODO: Load forms on mount
onMounted(() => {
  // loadForms()
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
.table-container {
  width: 100%;
}
.forms-table {
  width: 100%;
}
</style>

