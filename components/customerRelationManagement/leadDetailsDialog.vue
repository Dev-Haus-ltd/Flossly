<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1300px" persistent>
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header -->
        <div
          class="pa-4 d-flex justify-space-between align-center"
          style="background-color: white"
        >
          <h3 class="title m-0">{{ selectedLead?.name + "'s profile" }}</h3>
          <v-btn flat icon size="32" @click="$emit('close')">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Scrollable content -->
        <div class="flex-grow-1 px-4 py-2" style="overflow-y: auto">
          <v-tabs v-model="tab" class="custom-tabs px-4" slider-color="primary">
            <v-tab value="lead-info" class="tab-text">
              <img
                src="@/assets/icons/crm/info.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Lead Information
            </v-tab>

            <v-tab value="treatment" class="tab-text">
              <img
                src="@/assets/icons/crm/treatment.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Treatment Interest
            </v-tab>

            <v-tab value="communication" class="tab-text">
              <img
                src="@/assets/icons/crm/communication.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Communication Tracking / Log
            </v-tab>

            <v-tab value="automation" class="tab-text">
              <img
                src="@/assets/icons/crm/settings.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Flossly Automation
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="lead-info">
              <div class="pa-6">
                <h4 class="cust-lbl mb-4">Lead Information</h4>

                <v-row>
                  <!-- Name -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Name</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ selectedLead.name }}</span>
                  </v-col>

                  <!-- Email -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/frequency.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Email</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ selectedLead.email }}</span>
                  </v-col>

                  <!-- Telephone -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/priority.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Telephone</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ selectedLead.telephone }}</span>
                  </v-col>

                  <!-- Inquiry Date -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Inquiry Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      formatDate(selectedLead.inquiryDate)
                    }}</span>
                  </v-col>

                  <!-- Lead Source -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/status.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Lead Source</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.leadSource?.name || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Lead Status -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Lead Status</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-chip
                      color="primary"
                      variant="flat"
                      size="small"
                      class="text-white rounded-xl"
                      label
                    >
                      <template #prepend>
                        <span class="status-dot"></span>
                      </template>
                      {{ selectedLead.leadStatus }}
                    </v-chip>
                  </v-col>

                  <!-- Preferred Contact Method -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Preferred Contact</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.preferredContact || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Assigned -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Assigned</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <CommonAvatar :user="{ fullName: selectedLead.assigned }" />
                  </v-col>

                  <!-- Follow Up Date -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Follow Up Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      formatDate(selectedLead.followUpDate)
                    }}</span>
                  </v-col>

                  <!-- Date of Birth -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Date of Birth</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.dateOfBirth
                        ? formatDate(selectedLead.dateOfBirth)
                        : "N/A"
                    }}</span>
                  </v-col>

                  <!-- Occupation -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/category.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Occupation</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.occupation || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Location/Postcode -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Location/Postcode</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.location || "N/A"
                    }}</span>
                  </v-col>
                  <v-col cols="12">
                    <div>
                      <label class="cust-lbl">Comments</label>
                      <v-textarea
                        v-model="selectedLead.comments"
                        variant="solo"
                        placeholder="Type here"
                        density="compact"
                        :rules="requiredRule"
                        bg-color="white"
                        elevation="0"
                        class="mt-3 input-bordered"
                        flat
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="treatment">
              <div class="pa-6">
                <CustomerRelationManagementTreatmentIntrest
                  :selectedTreatment="selectedTreatment"
                  @save="onTreatmentSave"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="communication">
              <div class="pa-6">
                <CustomerRelationManagementCommunicationLog
                  :initialNotes="[]"
                  :initialPreferences="{
        preferredContactMethod: 'Phone',
        preferredAppointmentDay: 'Monday',
        bestTimesToContact: ['Morning']
      }"
                  @save="onCommunicationSave"
                  @update:preferences="onPreferencesUpdated"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="automation">
              <div class="pa-6">
                <CustomerRelationManagementAutomation
      :selectedType="selectedAutomationType"
      @update:type="onAutomationTypeChange"
    />
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";

const props = defineProps({
  modelValue: Boolean,
  selectedLead: Object,
});
const selectedAutomationType = ref(null);
const tab = ref("lead-info");
const formatDate = (date) => {
  return parsedDate(date);
};
const selectedTreatment = ref({
  primaryTreatment: 1,
  secondaryTreatments: [2, 3],
  concerns: 1,
  treatmentAreas: 2,
  previousExperience: "Had braces as a teenager",
  budget: "2000-3000 USD",
  specialOccasion: "Wedding in 6 months",
});

const onTreatmentSave = (updatedTreatment) => {
  console.log("Updated Treatment:", updatedTreatment);

  // Example: merge into selectedLead
};
const onPreferencesUpdated = (newPreferences) => {
  console.log("Updated communication preferences:", newPreferences);

};
const onCommunicationSave = (updatedNotes) => {
  console.log("Updated Communication Logs:", updatedNotes);
};
const onAutomationTypeChange = (newType) => {
  console.log("Automation type selected:", newType);
};
</script>

<style scoped>
.title {
  font-family: "Poppins";
  font-weight: 600;
  font-size: 16px;
}
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.custom-tabs .v-tab {
  color: inherit !important;
}
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.cust-lbl {
  font-family: "Poppins";
  font-weight: bold;
  font-size: 14px;
}
.value-text {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor; /* takes chip text color */
  margin-right: 6px;
  color: white;
}
.key-text {
  font-family: Poppins;
  font-weight: 400;
  font-style: Regular;
  font-size: 14px;
  color: #737373;
}
.cust-lbl {
  font-family: Poppins;
  font-weight: 700;
  font-style: Bold;
  font-size: 14px;
  color: #000000;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
</style>
