<template>
  <div class="mt-5">
    <v-row v-if="user" class="d-flex align-stretch">
      <!-- First Column -->
      <v-col cols="12" md="6" class="d-flex">
        <v-card
          elevation="0"
          class="pa-7 flex-grow-1"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <!-- Top Section: Avatar + Name + Practice -->
          <div class="d-flex align-center mb-6">
            <CommonAvatar :user="{ fullName: user?.fullName }" size="80" />

            <div class="ml-4">
              <p class="user-name">{{ user.fullName }}</p>
              <p class="practice-name">{{ getPracticeName() }}</p>
            </div>
          </div>

          <!-- Info Section: Labels + Editable -->
          <div class="info-section">
            <!-- Email -->
            <div class="mb-4">
              <label class="info-label">Email</label>
              <p
                class="editable"
                @blur="logValue($event, 'email')"
              >
                {{ user.email }}
              </p>
            </div>

            <!-- Contact Number -->
            <div class="mb-4">
              <label class="info-label">Contact Number</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'phone')"
              >
                {{ user.phone }}
              </p>
            </div>

            <!-- Personal Address -->
            <div class="mb-4">
              <label class="info-label">Personal Address</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'address')"
              >
                {{ user.address }}
              </p>
            </div>

            <!-- Gender -->
            <div>
              <label class="info-label">Gender</label>
              <div class="d-flex mt-2">
                <v-radio-group
                  v-model="user.gender"
                  inline
                  @change="console.log('Gender:', user.gender)"
                  class="radio-group"
                >
                  <v-radio
                    label="Male"
                    value="Male"
                    color="black"
                    class="gender-radio"
                  />
                  <v-radio
                    label="Female"
                    value="Female"
                    color="black"
                    class="gender-radio ml-2"
                  />
                  <v-radio
                    label="Other"
                    value="Other"
                    color="black"
                    class="gender-radio ml-2"
                  />
                </v-radio-group>
              </div>
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
          <!-- Info Section -->
          <div class="info-section">
            <!-- Next of Kin -->
            <div class="mb-4">
              <label class="info-label">Next Of Kin</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'nextOfKin')"
              >
                {{ user.nextOfKin }}
              </p>
            </div>

            <!-- Next of Kin Contact -->
            <div class="mb-4">
              <label class="info-label">Next Of Kin Contact Number</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'nextOfKinContact')"
              >
                {{ user.nextOfKinContact }}
              </p>
            </div>

            <!-- Account Type -->
            <div class="mb-4">
              <label class="info-label">Account Type</label>
              <p class="editable" @blur="logValue($event, 'accountType')">
                {{ getAccountType() }}
              </p>
            </div>

            <!-- User Type -->
            <div class="mb-4">
              <label class="info-label">User Type</label>
              <p
                class="editable"
                @blur="logValue($event, 'userType')"
              >
                {{ getUserRole() }}
              </p>
            </div>

            <div style="width: 40%">
              <label class="info-label">Date of Birth</label>
              <v-menu
                v-model="dbMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <p class="editable" v-bind="props">
                    {{ user?.dob || "Select Date of Birth" }}
                  </p>
                </template>
                <v-date-picker
                  v-model="user.dob"
                  @update:model-value="dbMenu = false"
                />
              </v-menu>
            </div>

            <!-- Weekends (checkboxes) -->
            <!-- <div>
              <label class="info-label"
                >This Weekends (Please tick your non-working days):</label
              >
              <div class="d-flex flex-wrap mt-2">
                <v-checkbox
                  v-for="day in days"
                  :key="day"
                  :label="day"
                  :value="day"
                  v-model="user.weekends"
                  color="black"
                  hide-details
                  class="day-checkbox mr-4 mb-2"
                  @change="console.log('Weekends:', user.weekends)"
                />
              </div>
            </div> -->
          </div>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-end pa-2">
      <v-btn @click="updateProfile" color="primary" variant="flat">Update Details</v-btn>
    </div>
  </div>
</template>

<script setup>
const { user } = defineProps({
  user: Object,
});
console.log(user)
const mainStore= useMainStore();
const dbMenu = ref(false)
const authStore = useAuthStore()

// const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const logValue = (e, key) => {
  user[key] = e.target.innerText.trim();
  console.log(`${key}:`, user[key]);
};

const getAccountType = () => {
  return user?.preferences?.licenseType;
};

const getPracticeName = () => {
  return user?.userOrganisations?.find(
    (x) => x.organisationId === user.currentLoggedInOrgId
  ).organisation.name;
};

const getUserRole = () => {
  return user?.role.title;
};
const updateProfile = () => {
  authStore
    .updateProfile(user)
    .then((res) => {
      if (res.code === 0) {
        localStorage.setItem("user", JSON.stringify(user))
        mainStore.setSnackbar({
          title: res?.data?.message || "Profile updated successfully",
          type: "success",
        })
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update profile",
          type: "error",
        })
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err?.message || "Something went wrong",
        type: "error",
      })
    })
}

</script>

<style scoped>
.user-name {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 24px;
  margin: 0;
}

.practice-name {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 13px;
  color: #737373;
  margin: 0;
}

.info-label {
  display: block;
  font-family: "Poppins";
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e; /* second column labels */
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
  width: 50%;
}

.editable:focus {
  border: 1px solid #dfdfdf;
  padding: 4px 6px;
}

.gender-radio .v-input--selection-controls__input {
  background-color: #f7f7f7 !important;
  border: 1px solid #dfdfdf !important;
  border-radius: 50%;
}

/* Checkbox style */
.day-checkbox .v-input--selection-controls__input {
  border: 1px solid #dfdfdf !important;
}

.day-checkbox input:checked + .v-selection-control__ripple {
  background-color: black !important;
}

.day-checkbox input:checked + .v-selection-control__wrapper .v-icon {
  color: white !important;
}
</style>
