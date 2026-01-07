<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="d-flex justify-space-between align-center px-5 py-4">
      
      <div>
      Patient's Details
      </div>
      <v-btn
        color="primary"
        variant="flat"
        class="mr-3"
        :disabled="!isDirty || savingDetails"
        :loading="savingDetails"
        @click="saveSection"
      >
        Update Details
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text class=" py-0" style="max-height: 100%; overflow: auto">
      <div class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="items"
          :selected="section"
          @select="section = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="margin-left: 220px;height: 55vh">
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="pa-6 panel-card" variant="text">
                <template v-if="section==='basic'">
                  <InfoRow label="ID" :value="editable.id || '-'" />
                  <EditRow label="First name" field="firstName" />
                  <EditRow label="Last name" field="lastName" />
                  <EditRow label="Preferred name" field="preferredName" />
                  <div class="mb-4">
                    <label class="info-label">Date of Birth</label>
                    <v-menu v-model="dobMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template #activator="{ props }">
                        <v-text-field
                          v-model="dobFormatted"
                          v-bind="props"
                          variant="plain"
                          density="compact"
                          class="input-plain"
                          hide-details
                          readonly
                        />
                      </template>
                      <v-date-picker v-model="editable.dob" @update:modelValue="dobMenu = false" />
                    </v-menu>
                  </div>
                  <div class="mb-4">
                    <label class="info-label">Gender</label>
                    <v-radio-group v-model="editable.sex" inline class="radio-group">
                      <v-radio label="Male" value="Male" />
                      <v-radio class="ml-4" label="Female" value="Female" />
                      <v-radio class="ml-4" label="Other" value="Other" />
                    </v-radio-group>
                  </div>
                </template>
                <template v-else-if="section==='address'">
                  <EditRow label="Address line 1" field="address1" />
                  <EditRow label="Address line 2" field="address2" />
                  <EditRow label="Address line 3" field="address3" />
                  <EditRow label="Town" field="town" />
                  <EditRow label="County" field="county" />
                  <EditRow label="Postcode" field="postcode" />
                  <EditRow label="Home phone" field="homePhone" />
                  <EditRow label="Work phone" field="workPhone" />
                </template>
                <template v-else>
                  <EditRow label="Payment Plan" field="paymentPlan" />
                  <EditRow label="Dentist" field="dentist" />
                  <EditRow label="Hygienist" field="hygienist" />
                  <div class="mb-4">
                    <label class="info-label">Receive Email</label>
                    <v-radio-group v-model="editable.receiveEmail" inline>
                      <v-radio label="Yes" :value="true" />
                      <v-radio class="ml-4" label="No" :value="false" />
                    </v-radio-group>
                  </div>
                  <div class="mb-4">
                    <label class="info-label">Receive SMS</label>
                    <v-radio-group v-model="editable.receiveSms" inline>
                      <v-radio label="Yes" :value="true" />
                      <v-radio class="ml-4" label="No" :value="false" />
                    </v-radio-group>
                  </div>
                  <div class="mb-4">
                    <label class="info-label">Marketing Consent</label>
                    <v-radio-group v-model="editable.marketingConsent" inline>
                      <v-radio label="Yes" value="Yes" />
                      <v-radio class="ml-4" label="No" value="No" />
                    </v-radio-group>
                  </div>
                  <EditRow label="Dentist recall interval" field="dentistRecallInterval" />
                  <div class="mb-4">
                    <label class="info-label">Next dentist recall</label>
                    <v-menu v-model="nextDentistRecallMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template #activator="{ props }">
                        <v-text-field
                          v-model="nextDentistRecallFormatted"
                          v-bind="props"
                          variant="plain"
                          density="compact"
                          class="input-plain"
                          hide-details
                          readonly
                        />
                      </template>
                      <v-date-picker v-model="editable.nextDentistRecall" @update:modelValue="nextDentistRecallMenu = false" />
                    </v-menu>
                  </div>
                </template>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="pa-6 panel-card" variant="text">
                <template v-if="section==='basic'">
                  <EditRow label="NI number" field="niNumber" />
                  <EditRow label="NHS number" field="nhsNumber" />
                  <EditRow label="Insurance number" field="insuranceNumber" />
                  <EditRow label="Legacy ID" field="legacyId" />
                  <EditRow label="Imaging link ID" field="imagingId" />
                  <EditRow label="Ethnicity" field="ethnicity" />
                </template>
                <template v-else-if="section==='address'">
                  <EditRow label="Mobile phone" field="mobile" />
                  <EditRow label="Preferred phone" field="preferredPhone" />
                  <EditRow label="Email" field="email" />
                  <EditRow label="Doctors or Specialist" field="doctor" />
                  <EditRow label="Occupation" field="occupation" />
                  <EditRow label="Family" field="family" />
                </template>
                <template v-else>
                  <EditRow label="Hygienist recall interval" field="hygienistRecallInterval" />
                  <div class="mb-4">
                    <label class="info-label">Next hygienist recall</label>
                    <v-menu v-model="nextHygRecallMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template #activator="{ props }">
                        <v-text-field
                          v-model="nextHygienistRecallFormatted"
                          v-bind="props"
                          variant="plain"
                          density="compact"
                          class="input-plain"
                          hide-details
                          readonly
                        />
                      </template>
                      <v-date-picker v-model="editable.nextHygienistRecall" @update:modelValue="nextHygRecallMenu = false" />
                    </v-menu>
                  </div>
                  <EditRow label="Recall method" field="recallMethod" />
                  <EditRow label="Acquisition source" field="acquisitionSource" />
                </template>
              </v-card>
            </v-col>
          </v-row>

          <!-- Update button moved to header -->
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { defineComponent, h, resolveComponent } from 'vue'
import CommonSideBar from '@/components/Common/sideBar.vue'
import profileIcon from '@/assets/icons/myProfile/profile.svg'
import workIcon from '@/assets/icons/myProfile/work.svg'
import notificationIcon from '@/assets/icons/myProfile/notification.svg'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
import { formatDateDDMMYYYY } from '@/lib/dateFormatter'

const props = defineProps({ patient: { type: Object, default: null } })
const section = ref('basic')
const items = [
  { key: 'basic', label: 'Basic Details', icon: profileIcon },
  { key: 'address', label: 'Address & Phone', icon: workIcon },
  { key: 'preferences', label: 'Preferences', icon: notificationIcon },
]

const diaryStore = useDiaryStore()
const mainStore = useMainStore()

const dobMenu = ref(false)
const dobFormatted = computed(() => editable.dob ? formatDateDDMMYYYY(editable.dob) : '')
const nextHygRecallMenu = ref(false)
const nextDentistRecallMenu = ref(false)
const nextHygienistRecallFormatted = computed(() => editable.nextHygienistRecall ? formatDateDDMMYYYY(editable.nextHygienistRecall) : '')
const nextDentistRecallFormatted = computed(() => editable.nextDentistRecall ? formatDateDDMMYYYY(editable.nextDentistRecall) : '')
const fullName = computed(() => [editable.firstName, editable.lastName].filter(Boolean).join(' '))
const normalizeEditable = (data) => {
  const keys = [
    'id','title','sex','firstName','middleName','lastName','preferredName','dob',
    'niNumber','nhsNumber','insuranceNumber','legacyId','imagingId','ethnicity',
    'address1','address2','address3','town','county','postcode','homePhone','workPhone',
    'mobile','preferredPhone','email','doctor','occupation','family',
    'paymentPlan','dentist','hygienist','receiveEmail','receiveSms','marketingConsent',
    'recallMethod','dentistRecallInterval','recallInterval','nextDentistRecall',
    'hygienistRecallInterval','nextHygienistRecall','acquisitionSource'
  ]
  const out = {}
  keys.forEach((k) => { out[k] = data?.[k] ?? null })
  return out
}
const editable = reactive({})
const originalSnapshot = ref('')
const savingDetails = ref(false)
watch(() => props.patient, (v) => {
  const incoming = v || {}
  Object.assign(editable, {
    dentistRecallInterval: incoming.recallInterval || incoming.dentistRecallInterval || null,
    ...incoming,
  })
  originalSnapshot.value = JSON.stringify(normalizeEditable(editable))
}, { immediate: true })

const titleOptions = ['Mr', 'Mrs', 'Ms', 'Dr']
const isDirty = computed(() => {
  const current = JSON.stringify(normalizeEditable(editable))
  return current !== originalSnapshot.value
})

const EditRow = defineComponent({
  name: 'EditRow',
  props: { label: String, field: String },
  setup(p){
    return () => {
      if (p.field === 'title') {
        const VSelect = resolveComponent('v-select')
        return h('div', { class: 'mb-4' }, [
          h('label', { class: 'info-label' }, p.label),
          h(VSelect, {
            modelValue: editable[p.field] || null,
            'onUpdate:modelValue': (val) => { editable[p.field] = val },
            items: titleOptions,
            variant: 'solo',
            density: 'compact',
            class: 'input-bordered mb-0',
            hideDetails: true,
            flat: true,
            bgColor: 'white',
            menuProps: { maxHeight: 240 },
          }),
        ])
      }
      return h('div', { class: 'mb-4' }, [
        h('label', { class: 'info-label' }, p.label),
        h('p', {
          class: 'editable',
          contentEditable: 'true',
          onBlur: (e) => { editable[p.field] = e.target.innerText.trim() },
        }, String(editable[p.field] ?? '-')),
      ])
    }
  }
})

const InfoRow = defineComponent({
  name: 'InfoRow',
  props: { label: String, value: [String, Number] },
  setup(p){ return () => h('div', { class: 'mb-3' }, [
    h('div', { class: 'info-label' }, p.label),
    h('div', { class: 'info-value' }, String(p.value ?? '-')),
  ]) }
})

const saveSection = async () => {
  if (!editable?.id) return
  savingDetails.value = true
  const payload = { id: editable.id }
  if (section.value === 'basic') {
    Object.assign(payload, {
      title: editable.title,
      sex: editable.sex,
      firstName: editable.firstName,
      middleName: editable.middleName,
      lastName: editable.lastName,
      preferredName: editable.preferredName,
      dob: editable.dob,
      niNumber: editable.niNumber,
      nhsNumber: editable.nhsNumber,
      insuranceNumber: editable.insuranceNumber,
      legacyId: editable.legacyId,
      imagingId: editable.imagingId,
      ethnicity: editable.ethnicity,
    })
  } else if (section.value === 'address') {
    Object.assign(payload, {
      address1: editable.address1,
      address2: editable.address2,
      address3: editable.address3,
      town: editable.town,
      county: editable.county,
      postcode: editable.postcode,
      homePhone: editable.homePhone,
      workPhone: editable.workPhone,
      mobile: editable.mobile,
      preferredPhone: editable.preferredPhone,
      email: editable.email,
      doctor: editable.doctor,
      occupation: editable.occupation,
      family: editable.family,
    })
  } else if (section.value === 'preferences') {
    Object.assign(payload, {
      paymentPlan: editable.paymentPlan,
      dentist: editable.dentist,
      hygienist: editable.hygienist,
      receiveEmail: !!editable.receiveEmail,
      receiveSms: !!editable.receiveSms,
      marketingConsent: editable.marketingConsent,
      recallMethod: editable.recallMethod,
      recallInterval: editable.dentistRecallInterval ?? editable.recallInterval,
      dentistRecallInterval: editable.dentistRecallInterval ?? editable.recallInterval,
      nextDentistRecall: editable.nextDentistRecall,
      hygienistRecallInterval: editable.hygienistRecallInterval,
      nextHygienistRecall: editable.nextHygienistRecall,
      acquisitionSource: editable.acquisitionSource,
    })
  }
  try {
    const res = await diaryStore.updatePatient(payload)
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Patient updated', type: 'success' })
      originalSnapshot.value = JSON.stringify(normalizeEditable(editable))
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Update failed', type: 'error' })
    }
  } finally {
    savingDetails.value = false
  }
}
</script>

<style scoped>
.title {
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 18px;
}
.sidebar {
  height: 55vh;
  min-width: 200px;

  position: fixed;
}
.panel-card{ border:1px solid #e5e7eb; border-radius:12px; background:#fff; }
.info-label{ display:block; font-weight:600; font-size:13px; color:#1e1e1e; margin-bottom:4px }
.editable{ font-weight:400; font-size:14px; color:#101010; outline:none; cursor:text; min-height:20px; border:1px solid transparent; border-radius:6px; }
.editable:focus{ border:1px solid #dfdfdf; padding:4px 6px }
.info-value{ color:#111827; font-weight:500 }
.input-plain :deep(.v-field){ border:none !important; border-radius:0 !important; background:transparent !important; min-height:32px; font-size:14px; padding:0 !important; }
.input-plain :deep(.v-field__outline){ display:none; }
.input-select :deep(.v-field__input){
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
