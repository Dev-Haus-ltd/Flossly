<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-start align-center py-3">
      Patient's Details
    </v-card-title>
    <v-divider />
    <v-card-text class="px-5 py-0" style="max-height: 100%; overflow: auto">
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
              <v-card class="pa-6" elevation="0" style="border:1px solid #e5e7eb; border-radius:12px;">
                <template v-if="section==='basic'">
                  <EditRow label="Title" field="title" />
                  <EditRow label="First Name" field="firstName" />
                  <EditRow label="Last Name" field="lastName" />
                  <div class="mb-4">
                    <label class="info-label">Date of Birth</label>
                    <v-menu v-model="dobMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template #activator="{ props }">
                        <v-text-field v-model="dobFormatted" v-bind="props" variant="solo" density="compact" class="input-bordered" bg-color="white" flat readonly />
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
                  <EditRow label="Postcode" field="postcode" />
                  <EditRow label="Mobile phone" field="mobile" />
                  <EditRow label="Email" field="email" />
                </template>
                <template v-else>
                  <EditRow label="Payment Plan" field="paymentPlan" />
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
                  <EditRow label="Marketing Consent" field="marketingConsent" />
                  <EditRow label="Recall method" field="recallMethod" />
                  <EditRow label="Dentist recall interval" field="recallInterval" />
                </template>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="pa-6" elevation="0" style="border:1px solid #e5e7eb; border-radius:12px;">
                <template v-if="section==='basic'">
                  <InfoRow label="NI number" :value="editable.niNumber || '-'" />
                  <InfoRow label="NHS number" :value="editable.nhsNumber || '-'" />
                  <InfoRow label="Insurance number" :value="editable.insuranceNumber || '-'" />
                  <InfoRow label="Legacy ID" :value="editable.legacyId || '-'" />
                  <InfoRow label="Imaging link ID" :value="editable.imagingId || '-'" />
                  <InfoRow label="Ethnicity" :value="editable.ethnicity || '-'" />
                </template>
                <template v-else-if="section==='address'">
                  <InfoRow label="Mobile phone" :value="editable.mobile || '-'" />
                  <InfoRow label="Preferred phone" :value="editable.preferredPhone || 'Mobile'" />
                  <InfoRow label="Email" :value="editable.email || '-'" />
                  <InfoRow label="Doctors or Specialist" :value="editable.doctor || '-'" />
                  <InfoRow label="Occupation" :value="editable.occupation || '-'" />
                  <InfoRow label="Family" :value="editable.family || 'No family member'" />
                </template>
                <template v-else>
                  <InfoRow label="Hygienist recall Interval" :value="editable.hygienistRecallInterval || '-'" />
                  <InfoRow label="Next hygienist recall" :value="editable.nextHygienistRecall ? formatDateDDMMYYYY(editable.nextHygienistRecall) : '-'" />
                  <InfoRow label="Recall method" :value="editable.recallMethod || '-'" />
                  <InfoRow label="Acquisition source" :value="editable.acquisitionSource || '-'" />
                </template>
              </v-card>
            </v-col>
          </v-row>

          <!-- Update button aligned to the right after both cards -->
          <div class="mt-4 d-flex justify-end">
            <v-btn color="primary" variant="flat" @click="saveSection">Update Details</v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { defineComponent, h } from 'vue'
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

const editable = reactive({})
watch(() => props.patient, (v) => { Object.assign(editable, v || {}) }, { immediate: true })

const dobMenu = ref(false)
const dobFormatted = computed(() => editable.dob ? formatDateDDMMYYYY(editable.dob) : '')

const EditRow = defineComponent({
  name: 'EditRow',
  props: { label: String, field: String },
  setup(p){
    return () => h('div', { class: 'mb-4' }, [
      h('label', { class: 'info-label' }, p.label),
      h('p', {
        class: 'editable',
        contentEditable: 'true',
        onBlur: (e) => { editable[p.field] = e.target.innerText.trim() },
      }, String(editable[p.field] ?? '-')),
    ])
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
  const payload = { id: editable.id }
  if (section.value === 'basic') {
    Object.assign(payload, { title: editable.title, sex: editable.sex, firstName: editable.firstName, lastName: editable.lastName, dob: editable.dob })
  } else if (section.value === 'address') {
    Object.assign(payload, { address1: editable.address1, postcode: editable.postcode, mobile: editable.mobile, email: editable.email })
  } else if (section.value === 'preferences') {
    Object.assign(payload, { paymentPlan: editable.paymentPlan, receiveEmail: !!editable.receiveEmail, receiveSms: !!editable.receiveSms, marketingConsent: editable.marketingConsent, recallMethod: editable.recallMethod, recallInterval: editable.recallInterval })
  }
  const res = await diaryStore.updatePatient(payload)
  if (res?.code === 0) mainStore.setSnackbar({ title: 'Patient updated', type: 'success' })
  else mainStore.setSnackbar({ title: res?.message || 'Update failed', type: 'error' })
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
.info-label{ display:block; font-weight:600; font-size:13px; color:#1e1e1e; margin-bottom:4px }
.editable{ font-weight:400; font-size:14px; color:#101010; outline:none; cursor:text; min-height:20px; border:1px solid transparent; border-radius:6px; }
.editable:focus{ border:1px solid #dfdfdf; padding:4px 6px }
.info-value{ color:#111827; font-weight:500 }
.input-bordered :deep(.v-field){ border:1px solid #dfdfdf !important; border-radius:8px !important; background:#fff !important; min-height:40px; font-size:14px }
</style>
