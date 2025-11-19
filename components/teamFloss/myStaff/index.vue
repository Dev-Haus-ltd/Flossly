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
    :search="search"
    :roleList="rolesList"
    @add="handleAdd"
    @onUserSelect="getUserDetails"
    @onUpdate="updateTeams"
  />

  <TeamFlossSideBarAddNewstaff
    v-model="addStaffDrawer"
    :rolesList="rolesList"
    @close="addStaffDrawer = false"
    @success="updateTeams"
  />
</div>
</template>

<script setup>
const emit = defineEmits(["getDetails", "onUpdate"]);
const props = defineProps({
  teams: Array,
  rolesList: Array
});
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
      filteredUsers = filteredUsers.filter((user) => user.status === "Invited");
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
console.log(filteredTeams.value)
const updateTeams = () => {
  emit("onUpdate");
  addStaffDrawer.value = false;
};
const selectedHeaders = ref([
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
  { title: "+", key: "actions", width: 60, sortable: false },
]);
const handleAdd = (item) => {
  console.log("Add clicked:", item);
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
