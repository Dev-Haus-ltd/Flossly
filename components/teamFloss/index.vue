<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Team Floss</p>
      <p
        v-if="showUserDetails"
        @click="showUserDetails = false"
        style="color: blue !important; cursor: pointer"
      >
        {{ " / " + selectedItem.fullName }}
      </p>
    </div>
    <div v-if="!showUserDetails">
      <!-- stats -->
      <div class="mt-5 px-5">
        <v-row>
          <CommonStatCard
            v-for="(stat, i) in teamStats"
            :key="i"
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            hide-chip
          />
        </v-row>
      </div>
      <!-- my staff -->
      <div class="mt-5 px-5">
        <TeamFlossMyStaff 
          v-if="teams.length"
          :teams="teams"
          @getDetails="getDetails"
          @onUpdate="getTeams()"
          :rolesList="rolesList"
        />
      </div>
    </div>
    <!-- user Details -->
    <div v-else>
      <TeamFlossUserDetails :user="selectedItem" :rolesList="rolesList" />
    </div>
  </div>
</template>

<script setup>


const bus = useBus();
const showUserDetails = ref(false);
const selectedItem = ref(null);
const userStore = useUserStore();
const teams = ref([]);
const mainStore = useMainStore();
const rolesList = ref([]);
const getDetails = (item) => {
  selectedItem.value = item;
  console.log(selectedItem.value)
  showUserDetails.value = true;
};
const getRoles = () => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data;
      }
    }) 
    .catch((err) => {
      return err;
    });
};
onMounted(() => {
  getRoles();
  getTeams();
});

const getTeams = () => {
  userStore
    .getUserOrgWise()
    .then((res) => {
      if (res.code === 0) {
        teams.value = res.data;
      } else {
        // snack
      }
    })
    .catch((err) => {
      //snack
    });
};
bus.on("updateTeams", getTeams);

const teamStats = computed(() => {
  let totalMembers = 0;
  let birthdays = 0;
  let approvals = 0;
  let newcomers = 0;

  teams.value.forEach((team) => {
    const users = team.orgUsers || [];
    totalMembers += users.length;
    birthdays += users.filter((user) => {
      if (!user.dob) return false;
      const today = new Date();
      const dob = new Date(user.dob);
      return (
        dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()
      );
    }).length;
    approvals += users.filter((user) => user.status === "Invited").length;
    newcomers += users.filter((user) => {
      if (!user.createdAt) return false;
      const joinedDate = new Date(user.createdAt);
      const today = new Date();
      const diffDays = (today - joinedDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length;
  });

  return [
    {
      icon: "https://cdn.lordicon.com/umvndfds.json",
      label: "Total Staff",
      value: totalMembers,
    },
    {
      icon: "https://cdn.lordicon.com/rprwxqaf.json",
      label: "New Joiner",
      value: newcomers,
    },
    {
      icon: "https://cdn.lordicon.com/bwmsmpql.json",
      label: "Staff Birthday",
      value: birthdays,
    },
    {
      icon: "https://cdn.lordicon.com/hrwiqpqi.json",
      label: "Pending Approvals",
      value: approvals,
    },
  ];
});
</script>

<style scoped lang="scss">
.parent {
  background-color: white;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}
:deep(.v-breadcrumbs) {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
}
</style>
