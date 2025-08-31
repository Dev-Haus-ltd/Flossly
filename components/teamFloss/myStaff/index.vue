<template>
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
          bg-color="#FAFAFA"
          flat
          class="custom-search"
        />
      </div>
      <TeamFlossMyStaffFilterMenu @update:filters="onFiltersUpdated" />
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
    @add="handleAdd"
    @onUserSelect="getUserDetails"
  />
  <TeamFlossSideBarAddNewstaff
    v-model="addStaffDrawer"
    @close="addStaffDrawer = false"
    @success="updateTeams"
  />
</template>

<script setup>
const emit = defineEmits(["getDetails", "onUpdate"]);
const props = defineProps({
  teams: Array,
});
const addStaffDrawer = ref(false);

const search = ref("");
const selectedFilter = ref("all");

const filterButtons = [
  { label: "Total Staff", value: "all" },
  { label: "New Joiner", value: "new" },
  { label: "Staff Birthday", value: "birthday" },
  { label: "Pending Approvals", value: "approvals" },
];

const filteredTeams = computed(() => {
  const filter = selectedFilter.value;
  const searchTerm = search.value.trim().toLowerCase();

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
const selectedHeaders = ref([
  { title: "Name", key: "name", width: 200, sortable: true },
  { title: "Role", key: "role", width: 200, sortable: true },
  {
    title: "Date of Joining",
    key: "dateOfJoining",
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
</script>

<style scoped>
.custom-toggle {
  /* background-color: transparent; */
  height: 40px;
}

.toggle-btn {
  background-color: #f3f6fa !important;
  text-transform: none;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease-in-out;
}

.v-btn--active.toggle-btn {
  background-color: #ffffff !important;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px); /* small lift effect */
}
.head {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 18px;
  color: #1e1e1e;
}
</style>
