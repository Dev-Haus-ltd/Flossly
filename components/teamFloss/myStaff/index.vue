<template>
  <div>
  <!-- Filter Row -->
  <h3 class="head mb-4">My Staff</h3>
  <div class="d-flex align-center justify-space-between mb-4">
    <div class="d-flex align-center">
      <!-- Button Toggle -->
      <v-btn-toggle v-model="selectedFilter" mandatory class="custom-toggle">
        <v-btn
          v-for="(btn, index) in filterButtons"
          :key="index"
          :value="btn.value"
          class="toggle-btn"
        >
          <v-icon size="16" class="mr-1">mdi-format-align-right</v-icon>
          {{ btn.label }}
        </v-btn>
      </v-btn-toggle>

      <!-- Search -->
      <div style="width: 150px" class="ml-4">
        <v-text-field
          v-model="search"
          placeholder="Search"
          append-inner-icon="mdi-magnify"
          variant="solo"
          density="compact"
          hide-details
          flat
          class="custom-search"
        />
      </div>
      <TeamFlossMyStaffFilterMenu :roles="rolesList" @update:filters="onFiltersUpdated" /> 
    </div>
    <v-btn
      color="primary"
      variant="flat"
      rounded="lg"
      @click="addStaffDrawer = true"
      class="add-task-btn"
    >
      <template #prepend>
        <v-icon size="18">mdi-plus-circle-outline</v-icon>
      </template>
      Add Staff
    </v-btn>
  </div>

  <!-- Table -->
  <TeamFlossMyStaffListView 
    v-if="props.teams.length"
    :teams="filteredTeams"
    :selectedHeaders="selectedHeaders"
    :availableHeaders="availableHeaders"
    :search="search"
    :roleList="rolesList"
    @add="handleAdd"
    @onUserSelect="getUserDetails"
    @onUpdate="updateTeams"
    @onUpdateHeaders="onUpdateHeaders"
    @deactivateUser="handleDeactivateUser"
    @activateUser="handleActivateUser"
    @deleteUser="handleDeleteUser"
  />

  <TeamFlossSideBarAddNewstaff
    v-model="addStaffDrawer"
    :rolesList="rolesList"
    @close="addStaffDrawer = false"
    @success="updateTeams"
  />

  <!-- Deactivate User Confirmation Dialog -->
  <CommonActionConfirmDialog
    v-model="deactivateDialog"
    title="Deactivate User"
    :message="`Are you sure you want to deactivate ${selectedUser?.fullName}? They will no longer be able to access this organization.`"
    confirm-button-text="Deactivate"
    confirm-button-color="warning"
    icon="mdi-account-off"
    icon-color="orange"
    :user-info="selectedUser"
    warning-text="This user will be deactivated from this organization but their data will be preserved. This action can be reversed."
    :loading="actionLoading"
    @confirm="confirmDeactivateUser"
  />

  <!-- Activate User Confirmation Dialog -->
  <CommonActionConfirmDialog
    v-model="activateDialog"
    title="Activate User"
    :message="`Are you sure you want to activate ${selectedUser?.fullName}? They will regain access to this organization.`"
    confirm-button-text="Activate"
    confirm-button-color="success"
    icon="mdi-account-check"
    icon-color="green"
    :user-info="selectedUser"
    warning-text="This user will be reactivated and will regain full access to this organization."
    :loading="actionLoading"
    @confirm="confirmActivateUser"
  />

  <!-- Delete User Confirmation Dialog -->
  <CommonActionConfirmDialog
    v-model="deleteDialog"
    title="Delete User"
    :message="`Are you sure you want to delete ${selectedUser?.fullName}? This action cannot be undone.`"
    confirm-button-text="Delete"
    confirm-button-color="error"
    icon="mdi-delete"
    icon-color="red"
    :user-info="selectedUser"
    warning-text="This will permanently delete the user and all their associated data if they don't belong to other organizations. This action cannot be undone."
    :loading="actionLoading"
    @confirm="confirmDeleteUser"
  />
</div>
</template>

<script setup>
import userService from "@/services/userService";
import { useMainStore } from "@/stores/index";

const emit = defineEmits(["getDetails", "onUpdate"]);
const props = defineProps({
  teams: Array,
  rolesList: Array
});

const mainStore = useMainStore();
const $userService = userService;
const authStore = useAuthStore();
const userStore = useUserStore();
const { user: currentUser, setUser } = useUser();
const addStaffDrawer = ref(false);

const search = ref("");
const selectedFilter = ref("all");
const filterMenuFilters = ref({
  role: null,
  doj: null,
  profileCompletion: null,
  recruitmentDocs: null,
  cpd: null,
});

const filterButtons = [
  { label: "Total Staff", value: "all" },
  { label: "New Joiner", value: "new" },
  { label: "Staff Birthday", value: "birthday" },
  { label: "Pending Approvals", value: "approvals" },
];

const filteredTeams = computed(() => {
  const filter = selectedFilter.value;
  const searchTerm = search.value.trim().toLowerCase();
  const filters = filterMenuFilters.value;

  return props.teams.map((team) => {
    let filteredUsers = team.orgUsers;
    
    // Apply filter buttons
    if (filter === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredUsers = filteredUsers.filter((user) => {
        return new Date(user.createdAt) >= thirtyDaysAgo;
      });
    }

    if (filter === "birthday") {
      const today = new Date();
      const thisMonth = today.getMonth();
      filteredUsers = filteredUsers.filter((user) => {
        const userBday = new Date(user.dob);
        return userBday.getMonth() === thisMonth;
      });
    }

    if (filter === "approvals") {
      filteredUsers = filteredUsers.filter((user) => (user.orgStatus === "Invited") || (user.status === "Invited"));
    }

    // Apply filter menu filters
    if (filters.role !== null && filters.role !== undefined) {
      filteredUsers = filteredUsers.filter((user) => {
        // Handle both roleId (direct) and role.id (nested object)
        const userRoleId = user.roleId || user.role?.id;
        return Number(userRoleId) === Number(filters.role);
      });
    }

    if (filters.doj) {
      const filterDate = new Date(filters.doj);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filteredUsers = filteredUsers.filter((user) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        userDate.setHours(0, 0, 0, 0);
        return userDate >= filterDate && userDate < nextDay;
      });
    }

    if (filters.profileCompletion !== null && filters.profileCompletion !== undefined) {
      filteredUsers = filteredUsers.filter((user) => {
        return user.profileCompletion >= filters.profileCompletion;
      });
    }

    if (filters.recruitmentDocs !== null && filters.recruitmentDocs !== undefined) {
      filteredUsers = filteredUsers.filter((user) => {
        return user.recruitmentDocs >= filters.recruitmentDocs;
      });
    }

    if (filters.cpd !== null && filters.cpd !== undefined) {
      filteredUsers = filteredUsers.filter((user) => {
        return user.cpdHours >= filters.cpd;
      });
    }

    // Apply search
    if (searchTerm) {
      filteredUsers = filteredUsers.filter((user) => {
        return (
          user.fullName?.toLowerCase().includes(searchTerm) ||
          user.role?.title?.toLowerCase().includes(searchTerm)
        );
      });
    }

    return {
      ...team,
      orgUsers: filteredUsers,
    };
  });
});

const updateTeams = () => {
  emit("onUpdate");
  addStaffDrawer.value = false;
};
// Default headers
const defaultHeaders = [
  { title: "Name", key: "fullName", width: 200, sortable: true },
  { title: "Role", key: "role.title", width: 200, sortable: true },
  {
    title: "Date of Joining",
    key: "createdAt",
    width: 150,
    sortable: true,
  },
  {
    title: "Profile Completion %",
    key: "profileCompletion",
    width: 180,
    sortable: true,
  },
  {
    title: "Recruitment Docs %",
    key: "recruitmentDocs",
    width: 170,
    sortable: true,
  },
  {
    title: "Status",
    key: "status",
    width: 210,
    sortable: true,
  },
  {
    title: "Login History",
    key: "loginHistory",
    width: 210,
    sortable: true,
  },
  { title: "Action", key: "userActions", width: 120, sortable: false },
  { title: "Resend", key: "resend", width: 100, sortable: false },
  { title: "+", key: "action", width: 100, sortable: false },
];

// Load saved headers from localStorage or use defaults
const loadSavedHeaders = () => {
  try {
    const saved = localStorage.getItem('myStaffTableColumns');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.find(h => h.key === 'resend')) {
        parsed.push({ title: "Resend", key: "resend", width: 100, sortable: false });
      }
      
      if (!parsed.find(h => h.key === 'userActions')) {
        const actionIndex = parsed.findIndex(h => h.key === 'action');
        if (actionIndex !== -1) {
          parsed.splice(actionIndex, 0, { title: "Action", key: "userActions", width: 120, sortable: false });
        } else {
          parsed.push({ title: "Action", key: "userActions", width: 120, sortable: false });
        }
      }
      
      if (!parsed.find(h => h.key === 'action')) {
        parsed.push({ title: "+", key: "action", width: 100, sortable: false });
      }
      return parsed;
    }
  } catch (e) {
  }
  return defaultHeaders;
};

const selectedHeaders = ref(defaultHeaders);

// Load saved headers on mount (client-side only)
onMounted(() => {
  selectedHeaders.value = loadSavedHeaders();
});

// All possible headers (both default and optional)
const allPossibleHeaders = [
  { title: "Name", key: "fullName", width: 200, sortable: true },
  { title: "Role", key: "role.title", width: 200, sortable: true },
  { title: "Date of Joining", key: "createdAt", width: 150, sortable: true },
  { title: "Profile Completion %", key: "profileCompletion", width: 180, sortable: true },
  { title: "Recruitment Docs %", key: "recruitmentDocs", width: 170, sortable: true },
  { title: "Status", key: "status", width: 210, sortable: true },
  { title: "Login History", key: "loginHistory", width: 210, sortable: true },
  { title: "Email", key: "email", width: 200, sortable: true },
  { title: "Phone", key: "phone", width: 150, sortable: true },
  { title: "Date of Birth", key: "dob", width: 150, sortable: true },
  { title: "CPD Hours", key: "cpdHours", width: 150, sortable: true },
];

// Available columns that can be added (computed dynamically)
const availableHeaders = computed(() => {
  const selectedKeys = selectedHeaders.value.map(h => h.key);
  // Return all headers except the ones currently selected, resend, action, and userActions columns
  return allPossibleHeaders.filter(h => 
    !selectedKeys.includes(h.key) && 
    h.key !== 'resend' && 
    h.key !== 'action' &&
    h.key !== 'userActions'
  );
});

const onUpdateHeaders = (updatedHeaders) => {
  if (!updatedHeaders.find(h => h.key === 'resend')) {
    updatedHeaders.push({ title: "Resend", key: "resend", width: 100, sortable: false });
  }
  
  if (!updatedHeaders.find(h => h.key === 'userActions')) {
    const actionIndex = updatedHeaders.findIndex(h => h.key === 'action');
    if (actionIndex !== -1) {
      updatedHeaders.splice(actionIndex, 0, { title: "Action", key: "userActions", width: 120, sortable: false });
    } else {
      updatedHeaders.push({ title: "Action", key: "userActions", width: 120, sortable: false });
    }
  }
  
  if (!updatedHeaders.find(h => h.key === 'action')) {
    updatedHeaders.push({ title: "+", key: "action", width: 100, sortable: false });
  }
  selectedHeaders.value = updatedHeaders;
  // Save to localStorage
  if (process.client) {
    try {
      localStorage.setItem('myStaffTableColumns', JSON.stringify(updatedHeaders));
    } catch (e) {
    }
  }
};
const handleAdd = (item) => {
};

// Dialog states for confirmations
const deactivateDialog = ref(false);
const activateDialog = ref(false);
const deleteDialog = ref(false);
const selectedUser = ref(null);
const actionLoading = ref(false);

const selectedOrgId = ref(null);

const handleDeactivateUser = (payload) => {
  const { org, user } = payload || {};
  selectedUser.value = user;
  selectedOrgId.value = org?.organisation?.id || null;
  deactivateDialog.value = true;
};

const handleActivateUser = (payload) => {
  const { org, user } = payload || {};
  selectedUser.value = user;
  selectedOrgId.value = org?.organisation?.id || null;
  activateDialog.value = true;
};

const handleDeleteUser = (payload) => {
  const { org, user } = payload || {};
  selectedUser.value = user;
  selectedOrgId.value = org?.organisation?.id || null;
  deleteDialog.value = true;
};

const confirmDeactivateUser = async () => {
  if (!selectedUser.value || !props.teams.length) return;
  
  const organisationId = selectedOrgId.value || props.teams[0]?.organisation?.id;
  if (!organisationId) {
    mainStore.setSnackbar({
      title: "Organisation not found",
      type: "error",
    });
    return;
  }
  
  actionLoading.value = true;
  try {
    const response = await $userService.deactivateUser({
      userId: selectedUser.value.id,
      organisationId: organisationId
    });
    
    if (response.code === 0) {
      mainStore.setSnackbar({
        title: "User deactivated successfully",
        type: "success",
      });
      
      const isCurrentUser = currentUser.value && currentUser.value.id === selectedUser.value.id;
      
      if (isCurrentUser) {
       
        try {
          const profileResponse = await authStore.profile();
          if (profileResponse.code === 0) {
            setUser(profileResponse.data);
           
            await userStore.getUserList({ roleId: null, force: true });
          }
        } catch (profileError) {
          console.error('Failed to refresh user profile:', profileError);
        }
      } else {
        await userStore.getUserList({ roleId: null, force: true });
      }
      
      emit("onUpdate");
      deactivateDialog.value = false;
    } else {
      throw new Error(response.message || "Failed to deactivate user");
    }
  } catch (error) {
    mainStore.setSnackbar({
      title: error.message || "Error deactivating user",
      type: "error",
    });
  } finally {
    actionLoading.value = false;
  }
};

const confirmActivateUser = async () => {
  if (!selectedUser.value || !props.teams.length) return;
  
  const organisationId = selectedOrgId.value || props.teams[0]?.organisation?.id;
  if (!organisationId) {
    mainStore.setSnackbar({
      title: "Organisation not found",
      type: "error",
    });
    return;
  }
  
  actionLoading.value = true;
  try {
    const response = await $userService.activateUser({
      userId: selectedUser.value.id,
      organisationId: organisationId
    });
    
    if (response.code === 0) {
      mainStore.setSnackbar({
        title: "User activated successfully",
        type: "success",
      });
      
      const isCurrentUser = currentUser.value && currentUser.value.id === selectedUser.value.id;
      
      if (isCurrentUser) {
        try {
          const profileResponse = await authStore.profile();
          if (profileResponse.code === 0) {
            setUser(profileResponse.data);
            await userStore.getUserList({ roleId: null, force: true });
          }
        } catch (profileError) {
          console.error('Failed to refresh user profile:', profileError);
        }
      } else {
        await userStore.getUserList({ roleId: null, force: true });
      }
      
      emit("onUpdate");
      activateDialog.value = false;
    } else {
      throw new Error(response.message || "Failed to activate user");
    }
  } catch (error) {
    mainStore.setSnackbar({
      title: error.message || "Error activating user",
      type: "error",
    });
  } finally {
    actionLoading.value = false;
  }
};

const confirmDeleteUser = async () => {
  if (!selectedUser.value || !props.teams.length) return;
  
  const organisationId = selectedOrgId.value || props.teams[0]?.organisation?.id;
  if (!organisationId) {
    mainStore.setSnackbar({
      title: "Organisation not found",
      type: "error",
    });
    return;
  }
  
  actionLoading.value = true;
  try {
    const response = await $userService.deleteUser({
      userId: selectedUser.value.id,
      organisationId: organisationId
    });
    
    if (response.code === 0) {
      mainStore.setSnackbar({
        title: response.data || "User deleted successfully",
        type: "success",
      });
      
      emit("onUpdate");
      deleteDialog.value = false;
    } else {
      throw new Error(response.message || "Failed to delete user");
    }
  } catch (error) {
    mainStore.setSnackbar({
      title: error.message || "Error deleting user",
      type: "error",
    });
  } finally {
    actionLoading.value = false;
  }
};

const getUserDetails = (data) => {
  data.item.organisationId = data.org.organisation.id;
  emit("getDetails", data.item);
};

const onFiltersUpdated = (filters) => {
  filterMenuFilters.value = filters || {
    role: null,
    doj: null,
    profileCompletion: null,
    recruitmentDocs: null,
    cpd: null,
  };
};
</script>

<style scoped>
.custom-toggle {
  /* background-color: transparent; */
  height: 40px;
}

.toggle-btn {
  text-transform: none;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.v-btn--active.toggle-btn {
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px); /* small lift effect */
}
.head {
  
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 18px;
  color: #1e1e1e;
}
</style>
