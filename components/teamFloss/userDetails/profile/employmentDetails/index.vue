<template>
  <div class="mt-5">
    <v-row>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsLocationCard
          :data="userDetails"
          @updateField="updateAddress"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsSalary
          :data="userDetails.contract || {}"
          @updateField="updateSalaryDetails"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsBankDetails
          :data="userDetails.account || {}"
          @updateField="updateBankDetails"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsLeaveEntitlement
          :data="userDetails.leaveEntitlement || {}"
          @updateField="updateLeaveDetails"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsEmploymentCard
          :data="userDetails"
          @updateField="updateGeneralDetails"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TeamFlossUserDetailsProfileEmploymentDetailsContractDetailsCard
          :data="userDetails.contract || {}"
          @updateField="onContractDetailsUpdate"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from "vue";
const { user } = defineProps({
  user: Object,
});
const userStore = useUserStore();
const authStore = useAuthStore();

const userDetails = ref({});

onMounted(() => {
  userStore
    .getUserDetails({ id: user.id, organisationId: user.organisationId })
    .then((res) => {
      if (res.code === 0) {
        userDetails.value = res.data;
      }
    });
});

const updateSalaryDetails = (data) => {
  userDetails.value.contract = data.updated;
  if (data.sync) {
    updateContractDetails();
  }
};

const updateBankDetails = (data) => {
  userDetails.value.account = data.updated;
  if (data.sync) {
    updateUserBankDetails();
  }
};

const updateGeneralDetails = (data) => {
  userDetails.value = data.updated;
  console.log(data);
};

const onContractDetailsUpdate = (data) => {
  userDetails.value.contract = data.updated;
  if (data.sync) {
    updateContractDetails();
  }
};

const updateAddress = (data) => {
  userDetails.value.address = data.updated.address;
  if (data.sync) {
    data.updated.userId = user.id;
    data.updated.organisationId = user.organisationId;
    authStore.updateProfile(data.updated).then((res) => {
      if (res.code === 0) {
        // set snack
      }
    });
  }
};

const updateLeaveDetails = (data) => {
  userDetails.value.leaveEntitlement = data.updated;
  if (data.sync) {
    data.updated.userId = user.id;
    data.updated.organisationId = user.organisationId;
    userStore.updateLeaveEntitlement(data.updated).then((res) => {
      if (res.code === 0) {
        // set snack
      }
    });
  }
};
const updateContractDetails = () => {
  userStore
    .updateContract({
      userId: user.id,
      organisationId: user.organisationId,
      details: userDetails.value.contract,
    })
    .then((res) => {
      if (res.code === 0) {
        // set snack
      }
    });
};

const updateUserBankDetails = () => {
  userStore
    .updateUserBank({
      userId: user.id,
      account: userDetails.value.account,
    })
    .then((res) => {
      if (res.code === 0) {
        // set snack
      }
    });
};
</script>
