<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <span class="ml-2 text-subtitle-1">{{ patientName }}</span>
    </div>
    <div class="pa-4">
      <v-tabs
        v-model="activeTab"
        bg-color="transparent"
        color="primary"
        class="custom-tabs"
      >
        <v-tab value="details">Details</v-tab>
        <v-tab value="journey">Patient Journey</v-tab>
        <v-tab value="forms">Forms</v-tab>
        <v-tab value="charting">Charting</v-tab>
        <v-tab value="appointments">Appointments</v-tab>
        <v-tab value="accounts">Accounts</v-tab>
        <v-tab value="communication">Communication Hub</v-tab>
        <v-tab value="tasks">Tasks</v-tab>
      </v-tabs>

      <PatientsIndex v-if="activeTab === 'details'" :patient="patient" />
      <PatientJourney
        v-else-if="activeTab === 'journey'"
        :patient="patient"
        @save="handleJourneySave"
      />
      <PatientForms v-else-if="activeTab === 'forms'" :patient="patient" />
      <div v-else-if="activeTab === 'charting'" class="mt-4">
        <PatientsCharting
          :patient-id="patient?.id"
          :patient-name="patientName"
          :patient="patient"
        />
      </div>
      <PatientAccounts
        v-else-if="activeTab === 'accounts'"
        :patient="patient"
        :patient-name="patientName"
      />
      <PatientCommunicationHub
        v-else-if="activeTab === 'communication'"
        :patient="patient"
        :patient-name="patientName"
      />
      <PatientTasks
        v-else-if="activeTab === 'tasks'"
        :patient="patient"
        :patient-name="patientName"
      />
      <PatientAppointments
        v-else-if="activeTab === 'appointments'"
        :patient="patient"
        :patient-name="patientName"
      />
      <div v-else class="mt-4 text-body-2 text-medium-emphasis">
        This section is coming soon.
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PatientForms from "@/components/patients/PatientForms.vue";
import PatientJourney from "@/components/patients/patientJourney.vue";
import PatientsCharting from "@/components/patients/charting/index.vue";
import PatientAppointments from "@/components/patients/appointments/index.vue";
import PatientAccounts from "@/components/patients/accounts/index.vue";
import PatientCommunicationHub from "@/components/patients/communicationHub/index.vue";
import PatientTasks from "@/components/patients/tasks/index.vue";
import PatientsIndex from "@/components/patients/index.vue";
import { useDiaryStore } from "@/stores/diary";

const route = useRoute();
const store = useDiaryStore();

const patient = ref(null);
const activeTab = ref("details");

const patientName = computed(() => {
  if (!patient.value) return "";
  return [patient.value.firstName, patient.value.lastName]
    .filter(Boolean)
    .join(" ");
});

const loadPatient = async (id) => {
  if (!id) return;
  const res = await store.getPatient(id);
  if (res?.code === 0) patient.value = res.data;
};

const syncTabFromRoute = () => {
  if (route.query.tab === "journey") {
    activeTab.value = "journey";
    return;
  }
  if (route.query.tab === "forms") {
    activeTab.value = "forms";
    return;
  }
  if (route.query.tab === "charting") {
    activeTab.value = "charting";
    return;
  }
  if (route.query.tab === "appointments") {
    activeTab.value = "appointments";
    return;
  }
  if (route.query.tab === "accounts") {
    activeTab.value = "accounts";
    return;
  }
  if (route.query.tab === "communication") {
    activeTab.value = "communication";
    return;
  }
  if (route.query.tab === "tasks") {
    activeTab.value = "tasks";
    return;
  }
  activeTab.value = "details";
};

const handleJourneySave = async (payload) => {
  console.log("Patient journey payload", payload);
};

onMounted(async () => {
  await loadPatient(route.params.id);
  syncTabFromRoute();
});

watch(
  () => route.params.id,
  (id) => {
    loadPatient(id);
  },
);

watch(
  () => route.query.tab,
  () => {
    syncTabFromRoute();
  },
);
</script>

<style scoped lang="scss">
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
