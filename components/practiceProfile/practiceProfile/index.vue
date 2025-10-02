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
          <!-- Top Section: Avatar + Name + Practice -->
          <div class="d-flex align-center mb-6">
            <CommonAvatar
              :user="{ fullName: organisation.fullName, photo: organisation.logo }"
              size="80"
            />
            <div class="ml-4">
              <p class="user-name">{{ organisation.fullName }}</p>
              <p class="practice-name">{{ organisation.practice }}</p>
            </div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <!-- Practice Manager -->
            <div class="mb-1" style="width: 40%">
              <label class="info-label">Practice Manager</label>
              <v-select
                v-model="organisation.managerId"
                :items="practiceManagers"
                item-title="fullName"
                single-line
                title="Select"
                density="compact"
                outlined
                variant="plain"
                item-value="id"
              ></v-select>
            </div>

            <!-- Substitute Lead Name -->
            <div class="mb-4">
              <label class="info-label">Substitute Lead Name</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'substituteLead')"
              >
                {{ organisation.substituteLead || "Add Substitute Lead Name" }}
              </p>
            </div>

            <!-- Address -->
            <div class="mb-4">
              <label class="info-label">Address</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'address')"
              >
                {{ organisation.address || "Add Address" }}
              </p>
            </div>

            <!-- contact -->
            <div class="mb-4">
              <label class="info-label">Telephone</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'contact')"
              >
                {{ organisation.contact || "Add contact" }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Second Column -->
      <v-col cols="12" md="6" class="d-flex">
        <v-card
          elevation="0"
          class="pa-7 flex-grow-1"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <div class="info-section">
            <!-- teamCount -->
            <div class="mb-4">
              <label class="info-label">Staff</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'teamCount')"
              >
                {{ organisation.teamCount || "Add number" }}
              </p>
            </div>

            <!-- Number of surgeryCount -->
            <div class="mb-4">
              <label class="info-label">Number of surgeries</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'surgeryCount')"
              >
                {{ organisation.surgeryCount || "Add Number of surgeries" }}
              </p>
            </div>

            <!-- NHS / Private / Mixed -->
            <div class="mb-4">
              <label class="info-label">NHS / Private / Mixed</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'type')"
              >
                {{ organisation.type || "Select Service Type" }}
              </p>
            </div>

            <!-- Last CQC Inspection date -->
            <div class="mb-4" style="width: 60%">
              <label class="info-label">Last CQC Inspection Date</label>
              <v-menu
                v-model="menus.cqcInspectionDate"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <p class="editable" v-bind="props">
                    {{ formatDate(organisation.cqcInspectionDate) || "Select Date" }}
                  </p>
                </template>
                <v-date-picker
                  v-model="organisation.cqcInspectionDate"
                  @update:model-value="onDateUpdate"
                />
              </v-menu>
            </div>

            <!-- PIN Code Verification -->
            <div class="mb-4">
              <label class="info-label">PIN Code Verification</label>
              <div
                class="btn-group pa-1 rounded-lg"
                style="border: 1px solid #dbdbdb; width: fit-content"
              >
                <v-btn
                  class="toggle-btn"
                  :class="{ active: organisation.pinCodeVerification === 'yes' }"
                  @click="setPinVerification('yes')"
                  flat
                  :elevation="0"
                >
                  Yes
                </v-btn>
                <v-btn
                  class="toggle-btn"
                  :class="{ active: organisation.pinCodeVerification === 'no' }"
                  @click="setPinVerification('no')"
                  flat
                  :elevation="0"
                >
                  No
                </v-btn>
              </div>
            </div>

            <!-- Non-working Days -->
            <div>
              <label class="info-label"
                >Please tick your practice non-working days</label
              >
              <div class="d-flex flex-wrap mt-2">
                <v-checkbox
                  v-for="day in days"
                  :key="day"
                  :label="day"
                  :value="day"
                  v-model="organisation.nonWorkingDays"
                  color="black"
                  hide-details
                  class="day-checkbox mr-4 mb-2"
                />
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-end pr-5 pt-3">
      <v-btn color="primary" width="200" flat @click="updateOrgDetails">Update Details</v-btn>
    </div>
  </div>
</template>

<script setup>
import { parsedDate } from '~/lib/dateFormatter';

const props = defineProps({
  practiceDetails: {
    type: Object,
    required: true,
  },
});
const mainStore= useMainStore();
const localOrg = ref({ ...props.practiceDetails });
const organisation = reactive({
  logo: localOrg.value.logo,
  fullName: localOrg.value.name,
  id: localOrg.value.id,
  managerId: localOrg.value.managerId,
  substituteLead: "",
  address: localOrg.value.address,
  contact: localOrg.value.contact,
  teamCount: localOrg.value.teamCount,
  surgeryCount: localOrg.value.surgeryCount,
  type: localOrg.value.type,
  cqcInspectionDate: localOrg.value.cqcInspectionDate,
  pinCodeVerification: "yes",
  nonWorkingDays: [],
});
const userStore = useUserStore();
const orgStore = useOrgStore()
const practiceManagers = ref([]);

function getPracticeManagers() {
  userStore.getUserList({ roleId: 8 }).then((res) => {
    if (res.code === 0) {
      practiceManagers.value = res.data;
    }
  });
}

onMounted(() => {
  getPracticeManagers();
});

const formatDate = (date) => {
  return parsedDate(date)
}
const menus = reactive({ cqcInspectionDate: false });
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const logValue = (e, key) => {
  organisation[key] = e.target.innerText.trim();
};
const onDateUpdate = (val) => {
  menus.cqcInspectionDate = false;
  organisation.cqcInspectionDate = val
};

const setPinVerification = (val) => {
  organisation.pinCodeVerification = val; 
};

const updateOrgDetails = () => {
  const fd = new FormData()
  Object.keys(organisation).forEach((el) => {
    if (el === 'fullName') {
      fd.append('name', organisation[el])
    } else {
      fd.append(el, organisation[el])
    }
    
  })
  orgStore.updateOrganisation(fd).then((res) => {
    if (res.code === 0) {
      mainStore.setSnackbar({
          title: res?.data?.message || "Organisation updated successfully",
          type: "success",
        })
    } else {
      mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update organisation",
          type: "error",
        })
    }
  }).catch((err) => {
    mainStore.setSnackbar({
        title: err.message || "Something went wrong",
        type: "error",
      })
  })
}

</script>

<style scoped>
.user-name {
  
  font-weight: 400;
  font-size: 24px;
  margin: 0;
}

.practice-name {
  
  font-weight: 400;
  font-size: 13px;
  color: #737373;
  margin: 0;
}

.info-label {
  display: block;
  
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.editable {
  
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

/* PIN toggle */
.toggle-btn {
  text-transform: none;
  background: #f5f5f5;
  color: #1e1e1e;
  
  font-weight: 500;
  font-size: 13px;
  border-radius: 6px;
}
.toggle-btn.active {
  background: #213536 !important;
  color: #ffffff !important;
}

/* Checkbox style */
.day-checkbox .v-input--selection-controls__input {
  border: 1px solid #dfdfdf !important;
}
</style>
