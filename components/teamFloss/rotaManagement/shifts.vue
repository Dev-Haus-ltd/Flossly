<template>
  <div class="pa-5 bg-white">
    <div class="mt-5">
      <!-- Title -->
      <h3 class="rota-title mb-2">{{ rota.name }}</h3>

      <!-- Top Bar -->
      <div class="d-flex justify-space-between align-center">
        <!-- Left Side -->
        <div class="d-flex align-center ga-3">
          <!-- Search -->
        

          <!-- Filter Menu -->
          <v-menu
            v-model="filterMenu"
            offset-y
            :close-on-content-click="false"
            :elevation="0"
          >
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                readonly
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                append-inner-icon="mdi-filter-outline"
                placeholder="Filter"
                hide-details
                style="width: 200px"
              />
            </template>

            <v-card min-width="280">
              <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-subtitle-1 font-weight-600">Filter by</span>
                <v-btn
                  color="primary"
                  class="text-sm"
                  @click="clearFilters"
                  variant="outlined"
                >
                  Clear Filters
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <label class="filter-label">Select Rota View</label>
                <v-select
                  v-model="selectedView"
                  :items="rotaViews"
                  variant="solo"
                  flat
                  density="compact"
                  class="input-bordered mt-2"
                />
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
        <div class="d-flex align-center ga-3">
          <v-btn
          v-if="isManager"
            color="secondary"
            class="text-none rounded-lg"
            prepend-icon="mdi-open-in-new"
            flat
            @click="changeRotaStatus"
          >
            {{ props?.rota?.isPublished ? "Unpublished Rota" : "Publish Rota" }}
          </v-btn>
        </div>
      </div>
    </div>
    <TeamFlossRotaManagementShiftView
      :users="users"
      :shifts="shifts"
      :rota="rota"
      :selectedView="selectedView"
      @onAddShift="addNewShift"
      @updateShifts="updateShifts"
      @onAddUser="emit('onAddUser')"
      @handleShiftEdit="handleShiftEdit"
      @onOpenRoomManagement="emit('onOpenRoomManagement')"
    />
    <TeamFlossRotaManagementShiftDialog
      v-model="showShiftDialog"
      @onUpdate="handleShiftSubmit"
      :rota="rota"
      :shifts="shifts"
      :users="users"
      :shiftData="shiftData"
      @updateShifts="updateShifts"
      :currentShift="currentShift ?? currentShift"
    />
  </div>
</template>

<script setup>

const props = defineProps({
  shifts: Array,
  rota: Object,
  users: Array,
});
const { isManager } = useUser();
const emit = defineEmits(["onChangeStatus", "onUpdate", "onAddUser", "onOpenRoomManagement"]);
const searchCal = ref("");
const shiftData = ref({});
const filterMenu = ref(false);
const currentShift = ref({});
const rotaViews = [
  { title: "Surgery View", value: 0 },
  { title: "Dentist View", value: 5 },
  { title: "Nurse View", value: 6 },
];
const handleShiftEdit = (shift) => {
  currentShift.value = shift;
};
const addNewShift = (data) => {
  if (data.surgery) {
    // Surgery view
    shiftData.value = {
      day: data.day.date,
      surgery: data.surgery,
    };
  } else {
    // User view
    shiftData.value = {
      day: data.day.date,
      user: data.user.isTempUser ? data.user : data.user.user,
    };
  }

  showShiftDialog.value = true;
};
const selectedView = ref(null);

const clearFilters = () => {
  selectedView.value = null;
  nextTick(() => {
    emit("onFilterUsers", "clear");
  });
};

watch(selectedView, (newVal) => {
  emit("onFilterUsers", newVal);
});
const showShiftDialog = ref(false);

const changeRotaStatus = () => {
  emit("onChangeStatus", {
    type: `${props?.rota?.isPublished ? "unPublish" : "publish"}`,
    id: props.rota.id,
  });
};
const updateShifts = (rota) => {
  showShiftDialog.value = false;
  emit("onUpdate", rota);
};
</script>

<style scoped>
.rota-title {
  
  font-weight: 600;
  font-style: SemiBold;
  font-size: 14px;
  margin-bottom: 4px;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
