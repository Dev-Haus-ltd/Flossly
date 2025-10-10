<template>
  <div class="header-container" :class="!rail ? 'pl-2' : ''">
    <!-- Left: Avatar + Title -->
    <div class="left-content">
      <CommonAvatar v-if="currentOrg?.name" :user="currentOrg" />
      <span class="ml-2 title-text" v-if="!rail">{{ currentOrg?.name }}</span>
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
          v-for="orgWrapper in user?.userOrganisations || []"
          :key="orgWrapper.organisation.id"
          @click="handleOrgClick(orgWrapper.organisation)"
        >
          <div class="d-flex align-center">
            <CommonAvatar :user="orgWrapper.organisation" />
            <span class="ml-2 title-text">{{
              orgWrapper.organisation.name
            }}</span>
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
onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
});
const handleOrgClick = async (org) => {
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
</style>
