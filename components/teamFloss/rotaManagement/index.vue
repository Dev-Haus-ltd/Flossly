<template>
  <!-- <TeamFlossRotaManagement/> -->
  <div>
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Rota management</p>
      <p
        v-if="selectedRota"
        @click="activeComponent = 1; selectedRota = null;"
        style="color: blue !important; cursor: pointer"
      >
        {{ " / " + selectedRota.name }}
      </p>
    </div>
    <div class="pa-5 bg-white" v-if="activeComponent === 1">
      <v-row>
        <v-col v-for="(item, idx) in data" :key="idx" cols="12" md="3">
          <TeamFlossRotaManagementStatCard
            :title="item.title"
            :count="item.count"
            :color="item.color"
            :icon="item.icon"
          />
        </v-col>
      </v-row>
      <TeamFlossRotaManagementRotaListing
        v-if="activeComponent === 1"
        @changeComponent="changecomponent"
        @onChangeStatus="changeRotaStatus"
        @getAllShifts="getAllShifts"
        :rotaList="rotas"
      />
    </div>
    <TeamFlossRotaManagementAddRota v-if="activeComponent === 2" />

    <TeamFlossRotaManagementShifts
      v-if="activeComponent === 3"
      :shifts="shifts"
      :users="rotaUsers"
      :rota="selectedRota"
       @onChangeStatus="changeRotaStatus"
       @updateShifts="getAllShifts"
    />
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
const activeComponent = ref(1);
const selectedRota = ref(null);
onMounted(() => {
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
    icon: "https://cdn.lordicon.com/pnlvdria.json",
    title: "Total Rotas",
    count: totalCount,
    color: "#1E1E1E",
  },
  {
    icon: "https://cdn.lordicon.com/txshdzva.json",
    title: "Published Rotas",
    count: publishedCount,
    color: "#8C3BC5",
  },
  {
    icon: "https://cdn.lordicon.com/ltlvgdli.json",
    title: "Unpublished Rotas",
    count: unPublishedCount,
    color: "#0165B9",
  },
];

watch(activeComponent, (newVal) => {
  console.log(newVal);
});
const getRotas = async () => {
  const res = await rotaStore.getRotas();
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
          `Rota ${
            data.type === "publish" ? "published" : "unpublished"
          } successfully`,
      });
      activeComponent.value=1
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
      selectedRota.value = item;
      getRotaUsers()
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
      activeComponent.value = 3;
    }
  });
};

const changecomponent = (id) => {
  console.log(id);
  activeComponent.value = id;
};
</script>
<style scoped>
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 20px;
  background-color: white;
}
.cust-border p {
  font-size: 12px;
  color: #c3c3c3;
}
</style>
