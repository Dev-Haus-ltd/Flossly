<template>
  <v-navigation-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" location="right" temporary :width="700">
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text">{{ drawerTitle }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon variant="outlined" color="#8B8B8B" @click="handleCancel" class="mr-4" style="width:20px;height:20px;min-width:20px;border-radius:50%;padding:0;">
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div class="pa-4" style="background-color:#f5f5f5;height: calc(100% - 64px - 64px); overflow-y:auto;">
      <v-card class="pa-4" color="white" elevation="0">
        <v-form ref="formRef">
          <v-row dense>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Title <span class="req">*</span></label>
              <v-select v-model="form.title" :items="titles" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details :rules="requiredRule" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Biological Sex <span class="req">*</span></label>
              <v-select v-model="form.sex" :items="sexes" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details :rules="requiredRule" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">First Name <span class="req">*</span></label>
              <v-text-field v-model="form.firstName" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" :rules="requiredRule" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Last Name <span class="req">*</span></label>
              <v-text-field v-model="form.lastName" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" :rules="requiredRule" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Address Line 1</label>
              <v-text-field v-model="form.address1" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Postcode</label>
              <v-text-field v-model="form.postcode" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Date of Birth <span class="req">*</span></label>
              <v-menu v-model="dobMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ props }">
                  <v-text-field v-model="dobFormatted" v-bind="props" variant="solo" density="compact" class="input-bordered" bg-color="white" flat readonly :rules="requiredRule" />
                </template>
                <v-date-picker v-model="form.dob" @update:modelValue="dobMenu = false" />
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Marketing Consent</label>
              <v-select v-model="form.marketingConsent" :items="marketingConsents" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Mobile Number</label>
              <v-text-field v-model="form.mobile" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Receive SMS</label>
              <v-select v-model="form.receiveSms" :items="yn" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Email</label>
              <v-text-field v-model="form.email" type="email" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Receive Email</label>
              <v-select v-model="form.receiveEmail" :items="yn" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Payment Plan</label>
              <v-select v-model="form.paymentPlan" :items="paymentPlans" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Dentist</label>
              <v-select v-model="form.dentistId" :items="dentists" item-title="name" item-value="id" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" clearable />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Recall Method</label>
              <v-select v-model="form.recallMethod" :items="recallMethods" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Dentist Recall Interval</label>
              <v-select v-model="form.recallInterval" :items="recallIntervals" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <div class="d-flex justify-space-between align-center px-4 py-2" style="background-color: white; padding: 12px 16px;">
      <v-btn
        color="white"
        class="text-primary"
        style="width: 48%; border-radius: 8px; border: 1px solid #DFDFDF !important; min-height: 40px;"
        @click="handleCancel"
        flat
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        class="text-white"
        style="width: 48%; border-radius: 8px; border: 1px solid #DFDFDF !important; min-height: 40px;"
        @click="onSave"
        :loading="isSaving"
        :disabled="isSaving"
        flat
      >
        Save
      </v-btn>
    </div>
  </v-navigation-drawer>
  
</template>

<script setup>
import { formatDateDDMMYYYY } from '@/lib/dateFormatter'
import { useDiaryStore } from '@/stores/diary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  patient: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const diaryStore = useDiaryStore()
const formRef = ref()
const dobMenu = ref(false)
const requiredRule = [v => !!v || 'Required']
const isSaving = ref(false)
const dentists = ref([])

const form = reactive({
  title: 'Mr',
  sex: 'Male',
  firstName: '',
  lastName: '',
  address1: '',
  postcode: '',
  dob: null,
  marketingConsent: '-',
  mobile: '',
  receiveSms: 'Yes',
  email: '',
  receiveEmail: 'Yes',
  paymentPlan: 'Private',
  dentistId: null,
  recallMethod: 'Email',
  recallInterval: '6 months',
})

const titles = ['Mr', 'Mrs', 'Ms', 'Dr']
const sexes = ['Male', 'Female', 'Other']
const marketingConsents = ['-', 'Yes', 'No']
const yn = ['Yes', 'No']
const paymentPlans = ['Private', 'NHS', 'Finance']
const recallMethods = ['Email', 'SMS', 'Phone']
const recallIntervals = ['6 months', '12 months']

const dobFormatted = computed(() => form.dob ? formatDateDDMMYYYY(form.dob) : '')
const drawerTitle = computed(() => (props.patient?.id ? 'Edit Patient' : 'Add New Patient'))

const loadDentists = async () => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const res = await diaryStore.listDentists(todayStr)
  if (res?.code === 0) {
    dentists.value = res.data || []
  }
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && dentists.value.length === 0) {
    await loadDentists()
  }
  if (isOpen) {
    if (props.patient) hydrateForm(props.patient)
    else resetForm()
  }
  if (!isOpen) {
    isSaving.value = false
  }
})

onMounted(async () => {
  await loadDentists()
})

const hydrateForm = (patient) => {
  if (!patient) return
  Object.assign(form, {
    title: patient.title || 'Mr',
    sex: patient.sex || 'Male',
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    address1: patient.address1 || '',
    postcode: patient.postcode || '',
    dob: patient.dob || null,
    marketingConsent: patient.marketingConsent || '-',
    mobile: patient.mobile || '',
    receiveSms: patient.receiveSms ? 'Yes' : 'No',
    email: patient.email || '',
    receiveEmail: patient.receiveEmail ? 'Yes' : 'No',
    paymentPlan: patient.paymentPlan || 'Private',
    dentistId: patient.defaultDentistId || patient.dentistId || null,
    recallMethod: patient.recallMethod || 'Email',
    recallInterval: patient.recallInterval || '6 months',
  })
}

const resetForm = () => {
  Object.assign(form, {
    title: 'Mr',
    sex: 'Male',
    firstName: '',
    lastName: '',
    address1: '',
    postcode: '',
    dob: null,
    marketingConsent: '-',
    mobile: '',
    receiveSms: 'Yes',
    email: '',
    receiveEmail: 'Yes',
    paymentPlan: 'Private',
    dentistId: null,
    recallMethod: 'Email',
    recallInterval: '6 months',
  })
  formRef.value?.resetValidation?.()
}

const handleCancel = () => {
  resetForm()
  emit('update:modelValue', false)
  emit('cancel')
}

const onSave = async () => {
  isSaving.value = true
  const ok = await formRef.value?.validate?.()
  if (ok === false) {
    isSaving.value = false
    return
  }
  if (!form.firstName || !form.lastName || !form.dob) {
    isSaving.value = false
    return
  }
  const payload = { ...form }
  payload.receiveSms = payload.receiveSms === true || payload.receiveSms === 'Yes'
  payload.receiveEmail = payload.receiveEmail === true || payload.receiveEmail === 'Yes'
  if (props.patient?.id) payload.id = props.patient.id
  emit('save', payload)
  emit('update:modelValue', false)
  resetForm()
}
</script>

<style scoped>
:deep(.v-field) { border-radius: 10px; }
.fld-lbl { font-weight: 400; font-size: 14px; color: #737373; }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background-color: white !important; min-height: 40px; font-size: 14px; }
.req { color: #ff5252 }
</style>

