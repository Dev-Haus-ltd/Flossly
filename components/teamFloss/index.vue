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
            :image="stat.image"
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
        />
      </div>
    </div>
    <!-- user Details -->
    <div v-else>
      <TeamFlossUserDetails :user="selectedItem" />
    </div>
  </div>
</template>

<script setup>
import Total from "@/assets/icons/teamfloss/total.svg";
import NewJoiner from "@/assets/icons/teamfloss/new.svg";
import Birthday from "@/assets/icons/teamfloss/birthday.svg";
import Pending from "@/assets/icons/teamfloss/pending.svg";

const bus = useBus();
const showUserDetails = ref(false);
const selectedItem = ref(null);
const userStore = useUserStore();
const teams = ref([]);

const getDetails = (item) => {
  selectedItem.value = item;
  showUserDetails.value = true;
};

onMounted(() => {
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
      image: Total,
      label: "Total Staff",
      value: totalMembers,
    },
    {
      image: NewJoiner,
      label: "New Joiner",
      value: newcomers,
    },
    {
      image: Birthday,
      label: "Staff Birthday",
      value: birthdays,
    },
    {
      image: Pending,
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
