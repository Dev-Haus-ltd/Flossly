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
       @onUpdate="getAllShifts"
    />
  </div>
</template>
<script setup>
definePageMeta({
  layout: "home",
});

import { useBus } from "~/composables/useBus";
import unpublish  from "~/assets/logos/unpublish.svg";
import publish  from "~/assets/logos/publish.svg";


const bus = useBus();
const rotaStore = useRotaStore();
const mainStore = useMainStore();

const rotas = ref([]);
const shifts = ref([]);
const rotaUsers = ref([]);
const activeComponent = ref(1);
const selectedRota = ref(null);
const popup = inject("popup")
const bulkBar = inject("bulkBar")

onMounted(() => {
  getRotas(); // Fetch the initial rota data if needed

  // Listen for bulk execution requests from the floating BulkActionBar
  bus.on("bulk:execute", async ({ context, ids, action1Label }) => {
    if (context === "rota") {
      const verb =
        (action1Label || "").trim().toLowerCase() === "publish"
          ? "publish"
          : "unpublish"

      await changeRotaStatus({ type: verb, ids })

      bus.emit("bulk:clear-selection", { context: "rota" })
      bulkBar.value?.clear?.()
    }
  });

  // Listen for bulk delete from the floating BulkActionBar
  bus.on("bulk:delete", async ({ context, ids }) => {
    if (context === "rota" && Array.isArray(ids) && ids.length) {
      const isBulk = ids.length > 1

      let subject = ''
      if (!isBulk && ids.length === 1) {
        const found = rotas.value.find(r => r.id === ids[0])
        subject = found?.name ? `“${found.name}”` : `#${ids[0]}`
      }

      const ok = await popup.ask({
        text: isBulk
          ? `Are you sure you want to delete ${ids.length} rota(s)?`
          : `Are you sure you want to delete rota ${subject}?`,
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      })
      if (!ok) return

      popup.setLoading(true)
      try {
        const res = await rotaStore.deleteRota({ ids })
        if (res.code === 0) {
          await getRotas()
          mainStore.setSnackbar({
            type: 'success',
            title: `${isBulk ? 'Rotas' : 'Rota'} deleted successfully`,
          })
        } else {
          mainStore.setSnackbar({
            type: 'error',
            title: `Failed to delete ${isBulk ? 'rotas' : 'rota'}`,
          })
        }
      } catch {
        mainStore.setSnackbar({ type: 'error', title: 'Something went wrong' })
      } finally {
        popup.setLoading(false)
        bus.emit('bulk:clear-selection', { context: 'rota' })
        bulkBar.value?.clear?.()
      }
    }
  })
});

onBeforeUnmount(() => {
  bus.all.clear && bus.all.clear();
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
  const ids = Array.isArray(data.ids)
    ? data.ids
    : data.id != null
      ? [data.id]
      : []

  const isBulk = ids.length > 1
  const verb = data.type === 'publish' ? 'publish' : 'unpublish'

  let subject = ''
  if (!isBulk && ids.length === 1) {
    const found = rotas.value.find(r => r.id === ids[0])
    subject = found?.name ? `“${found.name}”` : `#${ids[0]}`
  }

  const ok = await popup.ask({
    text: isBulk
      ? `Are you sure you want to ${verb} ${ids.length} rota(s)?`
      : `Are you sure you want to ${verb} rota ${subject}?`,
    confirmLabel: 'Yes',
    cancelLabel: 'No',
    logo: data.type === 'publish' ? publish : unpublish,
    logoAlt: 'Rota'
  })
  if (!ok) return

  popup.setLoading(true)
  try {
    const res = data.type === 'publish'
      ? await rotaStore.publishRota({ ids })
      : await rotaStore.unPublishRota({ ids })

    if (res.code === 0) {
      await getRotas()
      mainStore.setSnackbar({
        type: 'success',
        title: `${isBulk ? 'Rotas' : 'Rota'} ${verb}ed successfully`,
      })
      activeComponent.value = 1
    } else {
      mainStore.setSnackbar({
        type: 'error',
        title: `Failed to ${verb} ${isBulk ? 'rotas' : 'rota'}`,
      })
    }
  } catch {
    mainStore.setSnackbar({ type: 'error', title: 'Something went wrong' })
  } finally {
    popup.setLoading(false)
  }
}



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