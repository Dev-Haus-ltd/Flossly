<template>
  <div class="mt-5">
    <v-row class="d-flex align-stretch">
      <!-- First Column -->
      <v-col cols="12" md="6" class="d-flex">
        <v-card
          elevation="0"
          class="pa-7 flex-grow-1"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <div class="info-section">
            <!-- Safeguarding Lead -->
            <div class="mb-4">
              <label class="info-label">Safeguarding Lead</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'safeguardingLead')"
              >
                {{ importantPeople.safeguardingLead || "Add name" }}
              </p>
            </div>

            <!-- First Aider -->
            <div class="mb-4">
              <label class="info-label">First Aider</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'firstAider')"
              >
                {{ importantPeople.firstAider || "Add name" }}
              </p>
            </div>

            <!-- Fire Marshal -->
            <div class="mb-4">
              <label class="info-label">Fire Marshal</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'fireMarshal')"
              >
                {{ importantPeople.fireMarshal || "Add name" }}
              </p>
            </div>

            <!-- Cross Infection Lead -->
            <div class="mb-4">
              <label class="info-label">Cross Infection Lead</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'crossInfectionLead')"
              >
                {{ importantPeople.crossInfectionLead || "Add name" }}
              </p>
            </div>

            <!-- Complaints Handler -->
            <div class="mb-4">
              <label class="info-label">Complaints Handler</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'complaintsHandler')"
              >
                {{ importantPeople.complaintsHandler || "Add name" }}
              </p>
            </div>

            <!-- Data Protection Officer (DPO) -->
            <div class="mb-4">
              <label class="info-label">Data Protection Officer</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'dpo')"
              >
                {{ importantPeople.dpo || "Add name" }}
              </p>
            </div>

            <!-- Radiation Protection Advisor (RPA) -->
            <div class="mb-4">
              <label class="info-label">Radiation Protection Advisor</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'rpa')"
              >
                {{ importantPeople.rpa || "Add name" }}
              </p>
            </div>

            <!-- Update Button -->
            <div class="d-flex justify-end pr-5 pt-3">
              <v-btn
                color="primary"
                width="200"
                flat
                :loading="orgStore.isLoading"
                @click="updateImportantPeopleDetails"
              >
                Update Details
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>

const props = defineProps({
  practiceDetails: {
    type: Object,
    required: true,
  },
});

const mainStore = useMainStore();
const orgStore = useOrgStore();


const localImportantPeople = ref({ ...props.practiceDetails.importantPeople });
const importantPeople = reactive({
  id: localImportantPeople.value?.id,
  organisationId: props.practiceDetails.id,
  safeguardingLead: localImportantPeople.value?.safeguardingLead || "",
  firstAider: localImportantPeople.value?.firstAider || "",
  fireMarshal: localImportantPeople.value?.fireMarshal || "",
  crossInfectionLead: localImportantPeople.value?.crossInfectionLead || "",
  complaintsHandler: localImportantPeople.value?.complaintsHandler || "",
  dpo: localImportantPeople.value?.dpo || "",
  rpa: localImportantPeople.value?.rpa || "",
});

const logValue = (e, key) => {
  importantPeople[key] = e.target.innerText.trim();
};

const updateImportantPeopleDetails = () => {
  orgStore
    .updateImportantPeople({ ...importantPeople })
    .then((res) => {
      if (res.code === 0) {
        mainStore.setSnackbar({
          title: res?.data?.message || "Important People updated successfully",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update Important People",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message || "Something went wrong",
        type: "error",
      });
    });
};
</script>


<style scoped>
.info-label {
  display: block;
  font-family: "Poppins";
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.editable {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  min-height: 20px;
  border: 1px solid transparent;
  border-radius: 6px;
  width: 60%;
}

.editable:focus {
  border: 1px solid #dfdfdf;
  padding: 4px 6px;
}
</style>
