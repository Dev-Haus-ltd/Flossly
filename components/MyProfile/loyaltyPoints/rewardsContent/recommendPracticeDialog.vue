<template>
  <!-- <v-dialog v-model="isOpen" max-width="500px" class="rounded-lg">
    <v-card>
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Recommend a Practice
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="mt-4 d-flex flex-column">

        <div>
          <v-label class="mb-1 field-label">Practice Name</v-label>
          <v-text-field
            v-model="organisation.practiceName"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <div>
          <v-label class="mb-1 field-label">Manager Name</v-label>
          <v-text-field
            v-model="organisation.managerName"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <div class="mt-3">
          <v-label class="mb-1 field-label">Manager Email Address</v-label>
          <v-text-field
            v-model="organisation.managerEmail"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>


        <div class="mt-3">
          <v-label class="mb-1 field-label">Phone Number</v-label>
          <v-text-field
            v-model="organisation.contact"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <div class="mt-3">
          <v-label class="mb-1 field-label">Address</v-label>
          <v-text-field
            v-model="organisation.address"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>
      </v-card-text>


      <v-card-actions class="justify-end">
        <v-btn
          text
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="submit"
          style="font-weight: 500; text-transform: none"
          variant="flat"
          class="px-4"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog> -->
        <v-dialog
          v-model="showReferralDialog"
          max-width="568"
          persistent
        >
          <v-card rounded="xl" class="pa-0">
            
            <!-- Header -->
            <v-card-title class="px-0 cust-border">
               <div class="form-container d-flex align-center justify-space-between">
                <span class="text-h6 custom-text">
                  Refer a Business
                </span>

                <v-btn
                  icon
                  variant="text"
                  @click="showReferralDialog = false"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </v-card-title>

            <!-- Body -->
            <v-card-text class="px-0">
              <div class="form-container">
                <v-form @submit.prevent="submitReferral" class="d-flex flex-column align-center">

                  <!-- Full Name -->
                  <div class="mb-4 w-100">
                    <label class="form-label pb-2">Full name</label>
                    <v-text-field
                      v-model="referralForm.fullName"
                      variant="outlined"
                      density="compact"
                      height="44"
                      rounded="lg"
                      hide-details
                      required
                    />
                  </div>

                  <!-- Email -->
                  <div class="mb-4 w-100">
                    <label class="form-label pb-2">Email</label>
                    <v-text-field
                      v-model="referralForm.email"
                      type="email"
                      variant="outlined"
                      density="compact"
                      height="44"
                      rounded="lg"
                      hide-details
                      required
                    />
                  </div>

                  <!-- Phone Number -->
                  <div class="mb-4 w-100">
                    <label class="form-label pb-2">Phone Number</label>
                    <v-text-field
                      v-model="referralForm.phoneNumber"
                      variant="outlined"
                      density="compact"
                      height="44"
                      rounded="lg"
                      hide-details
                    />
                  </div>

                  <!-- Practice Name -->
                  <div class="mb-4 w-100">
                    <label class="form-label pb-2">Practice Name</label>
                    <v-text-field
                      v-model="referralForm.practiceName"
                      variant="outlined"
                      density="compact"
                      height="44"
                      rounded="lg"
                      hide-details
                      required
                    />
                  </div>

                  <!-- Submit -->
                  <v-btn
                    type="submit"
                    color="primary"
                    flat
                    height="44"
                    class="mt-4 w-100"
                    rounded="md"
                    block
                  >
                    Submit information
                  </v-btn>

                </v-form>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
const { user } = useUser();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue", "onSubmit"]);
const mainStore = useMainStore();
const orgStore = useOrgStore();
const showReferralDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
// const mainStore = useMainStore();
// const isOpen = ref(props.modelValue);
// const pointStore = usePointStore();
// const organisation = ref({
//   practiceName: "",
//   managerName: "",
//   managerEmail: "",
//   contact: "",
//   address: "",
// });

// watch(
//   () => props.modelValue,
//   (val) => (isOpen.value = val)
// );
// watch(isOpen, (val) => emit("update:modelValue", val));

// const close = () => {
//   isOpen.value = false;
//   organisation.value = {
//     practiceName: "",
//     managerName: "",
//     managerEmail: "",
//     contact: "",
//     address: "",
//   };
// };

// const submit = () => {
//   if (!organisation.value.practiceName || !organisation.value.managerEmail)
//     return;

//   pointStore
//     .referPractice(organisation.value)
//     .then((res) => {
    
//       if (res.code === 0) {
//         if (user.value.id) {
//         // Add 50 points
//         user.value.userPoints.balance =
//           (user.value.userPoints?.balance ?? 0) + 2000;

//         // Optionally also update `totalPointsRewarded`
//         user.value.userPoints.totalPointsRewarded =
//           (user.value.userPoints?.totalPointsRewarded ?? 0) + 2000;

//         // Save updated object back to localStorage
//         localStorage.setItem("user", JSON.stringify(user));
//       }
//         mainStore.setSnackbar({
//           title: res?.data?.message || "Practice referred successfully",
//           type: "success",
//         });

//         const data = { ...organisation.value };
//         emit("onSubmit", data);
//         close();
//       } else {
//         mainStore.setSnackbar({
//           title:
//             res?.data?.message || res?.message || "Failed to refer practice",
//           type: "error",
//         });
//       }
//     })
//     .catch((err) => {
//       mainStore.setSnackbar({
//         title: err?.message || "Something went wrong",
//         type: "error",
//       });
//     });
// };


const referralForm = ref({
  fullName: "",
  email: "",
  phoneNumber: "",
  practiceName: "",
});

const submitReferral = async () => {
  try {
    await orgStore.createOrganisationReferral({
      managerName: referralForm.value.fullName,
      orgEmail: referralForm.value.email,
      phoneNumber: referralForm.value.phoneNumber,
      orgName: referralForm.value.practiceName,
    });

    mainStore.setSnackbar({
      title: "Referral submitted successfully",
      type: "Success",
    });

    referralForm.value = {
      fullName: "",
      email: "",
      phoneNumber: "",
      practiceName: "",
    };

    showReferralDialog.value = false; // ✅ CLOSE MODAL

  } catch (err) {
    mainStore.setSnackbar({
      title: err?.message || "Failed to submit referral",
      type: "Error",
    });
  }
};
watch(showReferralDialog, (isOpen) => {
  if (!isOpen) {
    referralForm.value = {
      fullName: "",
      email: "",
      phoneNumber: "",
      practiceName: "",
    };
  }
});
</script>

<style scoped>
/* .input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
.field-label {
  
  font-size: 13px;
  font-weight: 500;
  color: #1e1e1e;
  display: block;
} */
.custom-text {
  color: #1E1E1E !important;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;          /* SemiBold */
  font-size: 18px;
  line-height: 1;            /* 100% */
  letter-spacing: 0;
}
.cust-border {
  border-bottom: 1px solid #DBDBDB;
  padding: 17px;
}
.form-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-weight: 400;          /* Regular */
  font-size: 16px;
  line-height: 1.3;          /* 130% */
  letter-spacing: 0;
  color: #1E1E1E;            /* neutral dark */
}
.v-field--variant-outlined .v-field__outline {
  --v-field-border-opacity: 1;
  border-color: #DFDFDF;
}
.form-container {
  max-width: 420px;
  width: 100%;
  margin: 0 auto; /* centers content */
}
</style>
