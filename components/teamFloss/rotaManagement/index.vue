<template>
  <!-- <TeamFlossRotaManagement/> -->
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1" @click="home()" :style="breadcrumbStyle">
        Rota management
      </p>
      <p v-if="selectedRota">
        {{ " / " + selectedRota.name }}
      </p>
      <p v-if="activeComponent === 2">
        {{ " / " + "Add rota" }}
      </p>
    </div>
    <div class="pa-5 bg-white" v-if="activeComponent === 1">
      <v-row>
        <v-col v-for="(item, idx) in data" :key="idx" cols="12" md="3">
          <CommonStatCard :icon="item.icon" :label="item.title" :value="item.count" :uid="idx" hide-chip />
        </v-col>
      </v-row>
      <TeamFlossRotaManagementRotaListing v-if="activeComponent === 1" @changeComponent="changecomponent"
        @onChangeStatus="changeRotaStatus" @getAllShifts="getAllShifts" :rotaList="rotas" />
    </div>
    <TeamFlossRotaManagementAddRota v-if="activeComponent === 2" @onAddRota="onAddRotaHandle" />

    <TeamFlossRotaManagementShifts v-if="activeComponent === 3" :shifts="shifts" :users="rotaUsers" :rota="selectedRota"
      @onChangeStatus="changeRotaStatus" @onUpdate="getAllShifts" @onFilterUsers="filterUsers"
      @onAddUser="getRotaUsers" />
  </div>
</template>
<script setup>
definePageMeta({
  layout: "home",
});
const rotaStore = useRotaStore();
const mainStore = useMainStore();
const rotas = ref([]);
const shifts = ref([]);
const rotaUsers = ref([]);
const allRotaUsers = ref([]);
const allShifts = ref([]);
const activeComponent = ref(1);
const selectedRota = ref(null);
const { isManager } = useUser();
const user = ref({})
onMounted(() => {
  if (localStorage.getItem('user')) {
    user.value = JSON.parse(localStorage.getItem('user'))
  }
  getRotas();

});
const totalCount = computed(() => rotas.value.length);
const publishedCount = computed(
  () => rotas.value.filter((r) => r.isPublished).length
);
const unPublishedCount = computed(
  () => rotas.value.filter((r) => !r.isPublished).length
);
const data = [
  {
    icon: "https://cdn.lordicon.com/uoljexdg.json",
    title: "Total Rotas",
    count: totalCount,
    color: "#1E1E1E",
  },
  {
    icon: "https://cdn.lordicon.com/tctltdwj.json",
    title: "Published Rotas",
    count: publishedCount,
    color: "#8C3BC5",
  },
  {
    icon: "https://cdn.lordicon.com/lsrvqnws.json",
    title: "Unpublished Rotas",
    count: unPublishedCount,
    color: "#0165B9",
  },
];

watch(activeComponent, (newVal) => {
  console.log(newVal);
});
const getRotas = async () => {
  let res;

  if (user.value.roleId === 1 || user.value.roleId === 8) {
    res = await rotaStore.getRotas();
  } else {
    res = await rotaStore.getUserRotas();
  }

  if (res.code === 0) {
    rotas.value = res.data;
    console.log(rotas.value);
  }
};

const changeRotaStatus = async (data) => {
  let res = null;
  try {
    if (data.type === "publish") {
      res = await rotaStore.publishRota({ id: data.id });
    } else {
      res = await rotaStore.unPublishRota({ id: data.id });
    }
    if (res.code === 0) {
      getRotas();
      mainStore.setSnackbar({
        type: "success",
        title:
          res?.message ||
          `Rota ${data.type === "publish" ? "published" : "unpublished"
          } successfully`,
      });
      activeComponent.value = 1;
    } else {
      mainStore.setSnackbar({
        type: "error",
        title:
          res?.message ||
          `Failed to ${data.type === "publish" ? "publish" : "unpublish"} rota`,
      });
    }
  } catch (error) {
    mainStore.setSnackbar({
      type: "error",
      title: "Something went wrong",
    });
  }
};

const getAllShifts = async (item) => {
  try {
    const res = await rotaStore.getAllShifts({ rotaId: item.id });
    if (res.code === 0) {
      shifts.value = res.data;
      allShifts.value = res.data;
      selectedRota.value = item;
      getRotaUsers();
    }
  } catch (error) {
    mainStore.setSnackbar({
      type: "error",
      title: "Something went wrong while fetching shifts",
    });
  }
};

const getRotaUsers = async () => {
  rotaStore.getRotaUsers({ rotaId: selectedRota.value.id }).then((res) => {
    if (res.code === 0) {
      rotaUsers.value = res.data;
      allRotaUsers.value = res.data;
      activeComponent.value = 3;
    }
  });
};
const filterUsers = (payload) => {
  if (payload === "clear") {
    rotaUsers.value = [...allRotaUsers.value];
    shifts.value = [...allShifts.value];
  } else if (payload === 0) {
    rotaUsers.value = [...allRotaUsers.value];
    shifts.value = allShifts.value.filter((sh) => sh.surgeryId);
  } else {
    // Filter users by role
    rotaUsers.value = allRotaUsers.value.filter(
      (ru) => ru.user.roleId === payload
    );
    // Collect userIds of those users
    const userIds = rotaUsers.value.map((ru) => ru.userId);
    // Filter shifts belonging to those userIds
    shifts.value = allShifts.value.filter((shf) =>
      userIds.includes(shf.userId)
    );
  }
};

const changecomponent = (id) => {
  activeComponent.value = id;
};
const onAddRotaHandle = () => {
  getRotas();
  activeComponent.value = 1;
};
const breadcrumbStyle = computed(() => {
  return (selectedRota.value || activeComponent.value === 2)
    ? 'color: blue; cursor: pointer;'
    : '';
});
const home = () => {
  activeComponent.value = 1;
  selectedRota.value = null;
};
</script>
<style scoped>
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  background-color: white;
}

.cust-border p {
  font-size: 12px;
  color: #c3c3c3;
}
</style>
