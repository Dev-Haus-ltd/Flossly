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
          <template #item.formType="{ item }">
            <v-chip size="small" :color="item.formType === 'medical_history' ? 'primary' : 'secondary'">
              {{ item.formType === 'medical_history' ? 'Medical History' : 'Consent' }}
            </v-chip>
          </template>
          <template #item.createdBy="{ item }">
            {{ item.createdBy || '-' }}
          </template>
          <template #item.createdAt="{ item }">
            {{ item.createdAt || '-' }}
          </template>
          <template #item.patientComments="{ item }">
            <span v-if="item.patientComments" class="text-truncate" style="max-width: 200px" :title="item.patientComments">
              {{ item.patientComments }}
            </span>
            <span v-else>-</span>
          </template>
          <template #item.ourComments="{ item }">
            <span v-if="item.ourComments" class="text-truncate" style="max-width: 200px" :title="item.ourComments">
              {{ item.ourComments }}
            </span>
            <span v-else>-</span>
          </template>
          <template #item.additionalInfo="{ item }">
            <span v-if="item.additionalInfo" class="text-truncate" style="max-width: 200px" :title="item.additionalInfo">
              {{ item.additionalInfo }}
            </span>
            <span v-else>-</span>
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
              :disabled="isViewing"
              @submit="onFormSubmit"
              @reset="onFormReset"
            />
          </div>
          <div v-else-if="selectedForm === 'consent'">
            <ConsentForm
              ref="consentFormRef"
              :form-data="editingForm"
              :disabled="isViewing"
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
  { title: 'Form Type', key: 'formType', sortable: true },
  { title: 'Created by', key: 'createdBy', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
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
  isViewing.value = false
  showFormView.value = true
}

const closeFormView = () => {
  showFormView.value = false
  editingForm.value = null
  selectedForm.value = 'medical'
  isViewing.value = false
}

const isViewing = ref(false)

const viewForm = (form) => {
  editingForm.value = { ...form }
  selectedForm.value = form.formType === 'medical_history' ? 'medical' : 'consent'
  isViewing.value = true
  showFormView.value = true
}

const editForm = (form) => {
  editingForm.value = { ...form }
  selectedForm.value = form.formType === 'medical_history' ? 'medical' : 'consent'
  isViewing.value = false
  showFormView.value = true
}

const onFormSubmit = async (formData) => {
  try {
    const { useDiaryStore } = await import('@/stores/diary')
    const { useMainStore } = await import('@/stores/index')
    const diaryStore = useDiaryStore()
    const mainStore = useMainStore()

    const payload = {
      patientId: props.patient?.id,
      formType: formData.type || 'medical_history',
      answers: formData.answers || {},
      patientComments: formData.patientComments || '',
      ourComments: formData.ourComments || '',
      additionalInfo: formData.additionalInfo || '',
    }

    if (editingForm.value && editingForm.value.id) {
      // Update existing form
      payload.id = editingForm.value.id
      await diaryStore.updatePatientForm(payload)
      mainStore.setSnackbar({ title: 'Form updated successfully', type: 'success' })
    } else {
      // Create new form
      await diaryStore.savePatientForm(payload)
      mainStore.setSnackbar({ title: 'Form saved successfully', type: 'success' })
    }

    closeFormView()
    await loadForms()
  } catch (error) {
    console.error('Error saving form:', error)
    const { useMainStore } = await import('@/stores/index')
    const mainStore = useMainStore()
    mainStore.setSnackbar({ title: error.message || 'Failed to save form', type: 'error' })
  }
}

const onFormReset = () => {
  if (selectedForm.value === 'medical' && medicalFormRef.value) {
    medicalFormRef.value.reset()
  } else if (selectedForm.value === 'consent' && consentFormRef.value) {
    consentFormRef.value.reset()
  }
}

const loadForms = async () => {
  if (!props.patient?.id) return
  
  try {
    loading.value = true
    const { useDiaryStore } = await import('@/stores/diary')
    const diaryStore = useDiaryStore()
    const response = await diaryStore.listPatientForms(props.patient.id)
    if (response && response.data) {
      forms.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading forms:', error)
    const { useMainStore } = await import('@/stores/index')
    const mainStore = useMainStore()
    mainStore.setSnackbar({ title: 'Failed to load forms', type: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadForms()
})

watch(() => props.patient?.id, () => {
  if (props.patient?.id) {
    loadForms()
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
.table-container {
  width: 100%;
}
.forms-table {
  width: 100%;
}
</style>

