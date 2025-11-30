<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <span class="ml-2 text-subtitle-1">{{ patientName }}</span>
    </div>
    <div class="pa-6">
      <v-tabs v-model="activeTab" bg-color="transparent" color="primary" class="custom-tabs">
        <v-tab value="details">Details</v-tab>
      </v-tabs>
      <PatientsIndex :patient="patient" />
    </div>
  </v-sheet>
</template>

<script setup>
import PatientsIndex from '@/components/patients/index.vue'
import { useDiaryStore } from '@/stores/diary'
import { watch } from 'vue'

definePageMeta({ layout: 'home' })

const route = useRoute()
const store = useDiaryStore()
const patient = ref(null)
const activeTab = ref('details')
const patientName = computed(() => {
  if (!patient.value) return ''
  const p = patient.value
  return [p.firstName, p.lastName].filter(Boolean).join(' ')
})

const loadPatient = async (id) => {
  if (!id) return
  const res = await store.getPatient(id)
  if (res?.code === 0) patient.value = res.data
}

onMounted(async () => {
  loadPatient(route.params.id)
})

watch(() => route.params.id, (id) => {
  loadPatient(id)
})
</script>

<style scoped>
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  } 
}
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.custom-tabs .v-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
  color: #1e1e1e !important;
  min-height: 40px;
  min-width: max-content;
}

.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
  color: #1e1e1e !important;
}

.custom-tabs .v-tabs-slider {
  height: 4px;
}
</style>
