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
            <!-- <CommonAvatar
              :user="{ fullName: organisation.fullName, photo: organisation.logo }"
              size="80"
            /> -->
            <div class="ml-4">
              <!-- <p class="user-name">{{ organisation.fullName }}</p>
              <p class="practice-name">{{ organisation.practice }}</p> -->
            </div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <!-- Practice Manager -->
            <!-- <div class="mb-1" style="width: 40%">
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
            </div> -->

            <!-- Substitute Lead Name -->
            <!-- <div class="mb-4">
              <label class="info-label">Substitute Lead Name</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'substituteLead')"
              >
                {{ organisation.substituteLead || "Add Substitute Lead Name" }}
              </p>
            </div> -->

            <!-- Address -->
            <!-- <div class="mb-4">
              <label class="info-label">Address</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'address')"
              >
                {{ organisation.address || "Add Address" }}
              </p>
            </div> -->

            <!-- contact -->
            <!-- <div class="mb-4">
              <label class="info-label">Telephone</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'contact')"
              >
                {{ organisation.contact || "Add contact" }}
              </p>
            </div> -->
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>

// const props = defineProps({
//   practiceDetails: {
//     type: Object,
//     required: true,
//   },
// });
// const localOrg = ref({ ...props.practiceDetails });
// const organisation = reactive({
//   logo: localOrg.value.logo,
//   fullName: localOrg.value.name,
//   id: localOrg.value.id,
//   managerId: localOrg.value.managerId,
//   substituteLead: "",
//   address: localOrg.value.address,
//   contact: localOrg.value.contact,
// });
// const userStore = useUserStore();
// const practiceManagers = ref([]);

// function getPracticeManagers() {
//   userStore.getUserList({ roleId: 8 }).then((res) => {
//     if (res.code === 0) {
//       practiceManagers.value = res.data;
//     }
//   });
// }

// onMounted(() => {
//   getPracticeManagers();
// });

// const logValue = (e, key) => {
//   organisation[key] = e.target.innerText.trim();
// };

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

/* PIN toggle */
.toggle-btn {
  text-transform: none;
  background: #f5f5f5;
  color: #1e1e1e;
  font-family: Poppins;
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
