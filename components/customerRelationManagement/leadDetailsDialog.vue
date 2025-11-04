<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1300px" persistent :z-index="11000">
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header -->
        <div
          class="pa-4 d-flex justify-space-between align-center"
          style="background-color: rgb(var(--v-theme-surface))"
        >
          <h3 class="title ml-4">{{ selectedLead?.name + "'s profile" }}</h3>
          <v-btn flat icon size="32" @click="onClose">
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
                      commPrefs?.preferredContactMethod || selectedLead.preferredContact || "N/A"
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
                    <CommonAvatar :user="{ fullName: selectedLead?.assigned[0]?.fullName }" />
                  </v-col>

              
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
                      selectedLead.dob
                        ? formatDate(selectedLead.dob)
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
                      <div class="d-flex justify-end mt-2">
                        <v-btn color="primary" variant="flat" :loading="savingComment" @click="saveComment">Save</v-btn>
                      </div>
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
                  :lead-id="selectedLead?.id"
                  :initialNotes="[]"
                  :initialPreferences="commPrefs"
                  @save="onCommunicationSave"
                  @update:preferences="onPreferencesUpdated"
                />
                <div class="d-flex justify-end mt-3">
                  <v-btn color="primary" variant="flat" :loading="savingPrefs" @click="savePreferences">Save Preferences</v-btn>
                </div>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="automation">
              <div class="pa-6">
                <CustomerRelationManagementAutomation />
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
const emit = defineEmits(['close','update:modelValue'])
const onClose = () => { emit('update:modelValue', false); emit('close') }
const tab = ref("lead-info");
const formatDate = (date) => {
  return parsedDate(date);
};
const selectedTreatment = ref({})
const commPrefs = ref({})
const crmStore = useCrmStore();
watch(
  () => props.selectedLead,
  async (lead) => {
    if (!lead?.id) return
    try {
      const res = await crmStore.getLeadTreatment(lead.id)
      if (res && res.code === 0) selectedTreatment.value = res.data || {}
    } catch (e) {}
    try {
      const comm = await crmStore.getLeadCommunication(lead.id)
      if (comm && comm.code === 0) commPrefs.value = comm.data || {}
    } catch (e) {}
  },
  { immediate: true }
)

const onTreatmentSave = async (updatedTreatment) => {
  try {
    const res = await crmStore.saveLeadTreatment(props.selectedLead.id, updatedTreatment)
    if (res && res.code === 0) {
      selectedTreatment.value = res.data
    }
  } catch (e) {}
};
const onPreferencesUpdated = (newPreferences) => {
  console.log("Updated communication preferences:", newPreferences);
  pendingPrefs.value = newPreferences
};
const onCommunicationSave = (updatedNotes) => {
  console.log("Updated Communication Logs:", updatedNotes);
};

const savingComment = ref(false)
const saveComment = async () => {
  try {
    savingComment.value = true
    await crmStore.updateLead({ id: props.selectedLead.id, comments: props.selectedLead.comments })
  } finally { savingComment.value = false }
}

const pendingPrefs = ref(null)
const savingPrefs = ref(false)
const savePreferences = async () => {
  try {
    savingPrefs.value = true
    const prefs = pendingPrefs.value || commPrefs.value || {}
    const res = await crmStore.saveLeadCommunication({ leadId: props.selectedLead.id, ...prefs })
    if (res && res.code === 0) commPrefs.value = res.data
  } finally { savingPrefs.value = false }
}
</script>

<style scoped>
.title {
  
  font-weight: 600;
  font-size: 16px;
}
.custom-tabs {
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.custom-tabs .v-tab {
  color: inherit !important;
}
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.cust-lbl {
  
  font-weight: bold;
  font-size: 14px;
}
.value-text {
  
  font-weight: 400;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
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
  
  font-weight: 400;
  font-style: Regular;
  font-size: 14px;
}
.cust-lbl {
  
  font-weight: 700;
  font-style: Bold;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}
.input-bordered :deep(.v-field) {
  border: 1px solid rgb(var(--v-theme-outline)) !important;
  border-radius: 8px !important;
  background-color: rgb(var(--v-theme-surface)) !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
