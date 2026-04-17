<template>
  <div class="mt-5">
    <div class="masonry-layout">
      <!-- Left Column -->
      <div class="masonry-column">
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsLocationCard
            :data="userDetails"
            @updateField="updateAddress"
          />
        </div>
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsBankDetails
            :data="userDetails.account || {}"
            @updateField="updateBankDetails"
          />
        </div>
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsEmploymentCard
            v-if="userDetails.id"
            :data="userDetails.contract || {}"
            :userList="userList"
            :roleId="userDetails.roleId"
            @updateField="updateEmploymentData"
            @updateRole="updaterole"
            :rolesList="rolesList"
          />
        </div>
      </div>

      <!-- Right Column -->
      <div class="masonry-column">
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsSalary
            :data="userDetails.contract || {}"
            @updateField="updateSalaryDetails"
          />
        </div>
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsLeaveEntitlement
            :data="userDetails.leaveEntitlement || {}"
            @updateField="updateLeaveDetails"
          />
        </div>
        <div class="grid-item">
          <TeamFlossUserDetailsProfileEmploymentDetailsContractDetailsCard
            :data="userDetails.contract || {}"
            @updateField="onContractDetailsUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const { user, rolesList } = defineProps({
  user: Object,
  rolesList: Array,
});
const userStore = useUserStore();
const authStore = useAuthStore();

const userDetails = ref({});
const userList = ref([]);

onMounted(() => {
  userStore
    .getUserDetails({ id: user.id, organisationId: user.organisationId })
    .then((res) => {
      if (res.code === 0) {
        userDetails.value = res.data;
        userDetails.value.organisationId = user.organisationId;
        const allOrgUsers = userStore.orgUsers.find(
          (x) => x.organisation.id === user.organisationId
        )?.orgUsers || [];
        // Filter to show only active members in the "Reports to" dropdown
        userList.value = allOrgUsers.filter(u => u.isActive);
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

const updateEmploymentData = (data) => {
  userDetails.value.contract = data.updated;
  if (data.sync) {
    updateContractDetails();
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
const updaterole = (role) => {
  userDetails.value.roleId = role.roleId;
  authStore.updateProfile(userDetails.value).then((res) => {
    if (res.code === 0) {
      // set snack
    }
  });
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

<style scoped>
.masonry-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.grid-item {
  width: 100%;
}

@media (max-width: 960px) {
  .masonry-layout {
    flex-direction: column;
    gap: 16px;
  }
  .masonry-column {
    gap: 16px;
  }
}
</style>