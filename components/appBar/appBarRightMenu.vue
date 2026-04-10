<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom"
    transition="scale-transition"
  >
    <template v-slot:activator="{ props }">
      <div
        v-if="user"
        class="d-flex align-center cursor-pointer"
        v-bind="props"
      >
        <CommonAvatar :user="user" :size="40" />
      </div>
    </template>

    <v-card v-if="user" min-width="300" class="py-4 text-center rounded-lg">
      <!-- User Info -->
      <div class="d-flex flex-column align-center mb-4">
        <CommonAvatar :user="user" :size="48" class="mb-2" />

        <div class="user-name mb-1">
          {{ user.fullName }}
        </div>

        <v-chip
          class="mb-1"
          color="#FEA200"
          style="background-color: #fea2001a"
          size="small"
        >
          {{ user.role?.title }}
        </v-chip>

        <div
          class="d-flex align-center text-grey-darken-1"
          style="font-size: 14px"
        >
          <v-icon size="20" color="#737373" class="me-1"
            >mdi-email-outline</v-icon
          >
          <span>{{ user.email }}</span>
        </div>
      </div>

      <v-divider class="mb-2" />

      <!-- Menu Options -->
      <v-list density="compact">
        <v-list-item @click="goToPracticeProfile" v-if="user.roleId===1 || user.roleId===8">
          <v-list-item-title class="menu-option"
            >Practice Profile</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="goToMyProfile">
          <v-list-item-title class="menu-option">My Profile</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="canInstall" @click="handleInstall">
          <template #prepend>
            <v-icon size="18" color="#0061FB" class="me-2">mdi-download-outline</v-icon>
          </template>
          <v-list-item-title class="menu-option">Install App</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="mt-2" />

      <!-- Logout -->
      <v-list-item @click="handleLogout" class="my-3"> Logout </v-list-item>
    </v-card>
  </v-menu>
  <v-dialog v-model="showProfileDialog" width="1774" height="968">
    <MyProfile @close="showProfileDialog = false" :user="user" />
  </v-dialog>
  <v-dialog v-model="showPracticeProfileDialog" width="1774" height="968">
    <PracticeProfile @close="showPracticeProfileDialog = false" />
  </v-dialog>
</template>

<script setup>
const { user } = defineProps({
  user: Object,
});
const showProfileDialog = ref(false);
const showPracticeProfileDialog = ref(false);
const menu = ref(false);
const router = useRouter();

const { canInstall, install } = usePWAInstall();

const goToPracticeProfile = () => {
  showPracticeProfileDialog.value = true;
  menu.value = false;
};

const goToMyProfile = () => {
  showProfileDialog.value = true;
  menu.value = false;
};

const handleInstall = async () => {
  menu.value = false;
  await install();
};

const handleLogout = () => {
  router.push("/logout");
};
</script>

<style scoped>
.user-name {
  
  font-weight: 500;
  font-size: 16px;
  font-style: Medium;
  color: #1e1e1e;
}

.menu-option {
  
  font-weight: 400;
  font-size: 16px;
  color: #1e1e1e;
}
</style>
