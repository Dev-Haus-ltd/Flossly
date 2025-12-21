<template>
  <div class="header-container" :class="!rail ? 'pl-2' : ''">
    <!-- Left: Avatar + Title -->
    <div class="left-content">
      <CommonAvatar v-if="currentOrg?.name" :user="currentOrg" />
      <div v-else class="avatar-placeholder">
        <v-icon size="16" color="grey">mdi-domain</v-icon>
      </div>
      <span class="ml-2 title-text" v-if="!rail">
        {{ currentOrg?.name || 'Loading Practice...' }}
      </span>
    </div>

    <!-- Right: Org Switch Menu -->
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom right"
      offset-y
    >
      <template #activator="{ props }">
        <v-btn v-bind="props" icon flat color="#f3f4f6">
          <div class="d-flex flex-column align-center justify-center">
            <v-icon size="16">mdi-chevron-up</v-icon>
            <v-icon size="16">mdi-chevron-down</v-icon>
          </div>
        </v-btn>
      </template>

      <v-list style="width: 235px">
        <v-list-item
          v-for="orgWrapper in validOrganizations"
          :key="getOrgData(orgWrapper)?.id || orgWrapper.id"
          @click="handleOrgClick(getOrgData(orgWrapper))"
        >
          <div class="d-flex align-center">
            <CommonAvatar :user="getOrgData(orgWrapper)" />
            <span class="ml-2 title-text">{{
              getOrgData(orgWrapper)?.name
            }}</span>
          </div>
        </v-list-item>
        <v-list-item v-if="!validOrganizations.length" disabled>
          <div class="d-flex align-center">
            <span class="ml-2 title-text text-grey">No practices available</span>
          </div>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
const { currentOrg, rail } = defineProps({
  currentOrg: Object,
  rail: Boolean,
});
const authStore = useAuthStore();
const mainStore = useMainStore();
const user = ref({});
const menu = ref(false);

const getOrgData = (orgWrapper) => {
  if (orgWrapper?.organisation?.id && orgWrapper?.organisation?.name) {
    return orgWrapper.organisation;
  }
  
  if (orgWrapper?.id && orgWrapper?.name) {
    return orgWrapper;
  }
  
  return null;
};

const validOrganizations = computed(() => {
  if (!user.value?.userOrganisations?.length) {
    return [];
  }
  
  const valid = user.value.userOrganisations.filter(org => {
    const orgData = getOrgData(org);
    const isActive = org.isActive !== undefined ? org.isActive : true;
    const isGloballyDeactivated = user.value.status === "Disabled" || user.value.status === "Expired";
    const isOrgDeactivated = !isActive && user.value.status === "Active";
    const isNotDeactivated = !isGloballyDeactivated && !isOrgDeactivated;
    const isValid = orgData !== null && isActive && isNotDeactivated;
    return isValid;
  });
  
  return valid;
});

const initializeUser = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
};

onMounted(() => {
  initializeUser();
});

watch(() => localStorage.getItem("user"), (newUserData) => {
  if (newUserData) {
    user.value = JSON.parse(newUserData);
  }
});

watch(() => user.value, (newUser) => {
}, { deep: true });
const handleOrgClick = async (org) => {
  if (!org || !org.id) {
    mainStore.setSnackbar({
      type: "error",
      title: "Invalid organization data",
    });
    return;
  }

  const currentOrgId = user.value?.currentLoggedInOrgId;
  if (currentOrgId && Number(org.id) === Number(currentOrgId)) {
    mainStore.setSnackbar({
      type: "info",
      title: "Already in the same organization",
    });
    menu.value = false;
    return;
  }

  try {
    const res = await authStore.switchOrgnanisation({ orgId: org.id });

    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title: "Organisation switched successfully",
      });
      menu.value = false;
      getProfile();
    } else {
      mainStore.setSnackbar({
        type: "error",
        title:
          res.message || res?.data?.message || "Failed to switch organisation",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "An error occurred while switching organisation",
    });
  }
};

const getProfile = () => {
  authStore.profile().then((res) => {
    if (res.code === 0) {
      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      window.location.reload();
    }
  });
};
</script>

<style scoped>
.avatar-letter {
  color: #ffffff;
  font-size: 24px;
}
.custom-avatar {
  border-radius: 6px !important;
}
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  border-bottom: 1px solid #dbdbdb;
}
.left-content {
  display: flex;
  align-items: center;
}
.title-text {
  font-weight: 500;
  font-style: Medium;
  font-size: 12px;
}
.avatar-placeholder {
  width: 32px;
  height: 32px;
  background-color: #e0e0e0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
