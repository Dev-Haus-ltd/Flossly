<template>
  <v-navigation-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" location="right" temporary :width="700">
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text"> Add New Patient </v-toolbar-title>
      <v-spacer />
      <v-btn icon variant="outlined" color="#8B8B8B" @click="$emit('update:modelValue', false)" class="mr-4" style="width:20px;height:20px;min-width:20px;border-radius:50%;padding:0;">
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div class="pa-4" style="background-color:#f5f5f5;height: calc(100% - 64px - 64px); overflow-y:auto;">
      <v-card class="pa-4" color="white" elevation="0">
        <v-form ref="formRef">
          <v-row dense>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Title <span class="req">*</span></label>
              <v-select v-model="form.title" :items="titles" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Biological Sex <span class="req">*</span></label>
              <v-select v-model="form.sex" :items="sexes" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details />
            </v-col>

            <v-col cols="12" sm="6">
              <label class="fld-lbl">Full Name <span class="req">*</span></label>
              <v-text-field v-model="form.firstName" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <label class="fld-lbl">Last Name <span class="req">*</span></label>
              <v-text-field v-model="form.lastName" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
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
              <v-label class="mb-1">Date of Birth *</v-label>
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
              <v-select v-model="form.dentist" :items="dentists" variant="solo" density="compact" class="input-bordered mb-0" bg-color="white" flat hide-details="auto" />
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

    <div class="px-4 pb-4">
      <v-btn block color="primary" class="ml-2" @click="onSave">Save Patient</v-btn>
    </div>
  </v-navigation-drawer>
  
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref()
const dobMenu = ref(false)
const requiredRule = [v => !!v || 'Required']
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
  dentist: 'Sarah Johnson',
  recallMethod: 'Email',
  recallInterval: '6 months',
})

const titles = ['Mr', 'Mrs', 'Ms', 'Dr']
const sexes = ['Male', 'Female', 'Other']
const marketingConsents = ['-', 'Yes', 'No']
const yn = ['Yes', 'No']
const paymentPlans = ['Private', 'NHS', 'Finance']
const dentists = ['Sarah Johnson', 'John Doe', 'Raj Singh']
const recallMethods = ['Email', 'SMS', 'Phone']
const recallIntervals = ['6 months', '12 months']

const dobFormatted = computed(() => form.dob ? new Date(form.dob).toLocaleDateString('en-GB') : '')

const onSave = async () => {
  const ok = await formRef.value?.validate?.()
  if (ok === false) return
  if (!form.firstName || !form.lastName || !form.dob) return
  emit('save', { ...form })
  emit('update:modelValue', false)
}
</script>

<style scoped>
:deep(.v-field) { border-radius: 10px; }
.fld-lbl { font-weight: 400; font-size: 14px; color: #737373; }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background-color: white !important; min-height: 40px; font-size: 14px; }
.req { color: #ff5252 }
</style>

