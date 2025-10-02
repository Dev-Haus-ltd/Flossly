<template>
  <div
    style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: auto"
    class="my-5"
  >
    <!-- Header -->
    <div
      style="border-bottom: 1px solid #dbdbdb"
      class="d-flex align-center justify-space-between px-4 py-2"
    >
      <h3
        style="
          
          font-weight: 600;
          font-size: 14px;
          color: #1e1e1e;
          margin: 0;
        "
      >
        Equipment Directory
      </h3>

      <!-- Search -->
      <div class="d-flex align-center">
        <v-btn color="primary" class="mr-3" @click="showDialog = true">
          Add Equipments
        </v-btn>
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search equipment"
          hide-details
          variant="solo"
          class="input-bordered"
          flat
          append-inner-icon="mdi-magnify"
          style="width: 220px"
        />
      </div>
    </div>

    <!-- Table -->
    <v-table class="equipment-table" density="comfortable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Serial Number</th>
          <th>Details</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in filteredEquipment" :key="index">
          <!-- Editable Name -->
          <td>
            <div class="px-3">
              <p
                class="editable"
                contenteditable="true"
                @keydown.enter.prevent="updateField($event, index, 'name')"
              >
                {{ item.name }}
              </p>
            </div>
          </td>

          <!-- Editable Serial -->
          <td>
            <div class="px-3">
              <p
                class="editable"
                contenteditable="true"
                @keydown.enter.prevent="updateField($event, index, 'serialNumber')"
              >
                {{ item.serialNumber }}
              </p>
            </div>
          </td>

          <!-- Editable Details -->
          <td>
            <div class="px-3">
              <p
                class="editable"
                contenteditable="true"
                @keydown.enter.prevent="updateField($event, index, 'details')"
              >
                {{ item.details }}
              </p>
            </div>
          </td>

          <!-- Action -->
          <td>
            <div class="px-4">
              <img
                src="@/assets/icons/practiceProfile/contact/delete.svg"
                alt="Delete"
                width="18"
                height="18"
                style="cursor: pointer"
                @click="deleteRow(index)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
    <PracticeProfileEquipmentAddEquipmentsDialog
      v-model="showDialog"
      @onUpdate="handleAddEquipments"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  practiceDetails: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["updateDetails"]);

const orgStore = useOrgStore();
const mainStore = useMainStore();
const showDialog = ref(false);
const equipments = ref([]);

const search = ref("");

// Computed: filtered list
const filteredEquipment = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return equipments.value;
  return equipments.value.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.serial || "").toLowerCase().includes(q) ||
      (item.details || "").toLowerCase().includes(q)
  );
});
watch(
  () => props.practiceDetails.equipments,
  (newVal) => {
    if (!newVal) {
      equipments.value = [];
      return;
    }

    // ✅ clone + sort alphabetically by name
    equipments.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true }
);
// Update editable field
const updateField = (e, index, field) => {
  const equipment = equipments.value[index];
  if (!equipment) return;

  const updatedEquipment = { ...equipment, [field]: e.target.innerText.trim() };

  // ✅ update local copy immediately
  equipments.value[index] = updatedEquipment;

  handleAttributeUpdate(updatedEquipment);
};
const handleAttributeUpdate = async (updated) => {
  try {
    const res = await orgStore.updateAttributes({
      data: updated,
      type: "equipment",
    });

    if (res.code === 0) {
      // emit("updateDetails"); // refresh parent
      mainStore.setSnackbar({
        title: res.message || `Equipment updated successfully`,
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || `Failed to update equipment`,
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title:
        err.message || `An unexpected error occurred while updating equipment`,
      type: "error",
    });
  }
};
// Delete row
const deleteRow = (index) => {
  equipments.value.splice(index, 1);
};

const handleAddEquipments = async (newEquipments) => {
  try {
    const res = await orgStore.addEquipment({ equipments: newEquipments });

    if (res.code === 0) {
      emit("updateDetails"); // parent refreshes
      mainStore.setSnackbar({
        title: "Equipments added successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to add Equipments",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.equipment-table th,
.equipment-table td {
  
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
  width: 25%; /* 4 equal columns */
}

.equipment-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

/* Remove outer borders */
.equipment-table th:first-child,
.equipment-table td:first-child {
  border-left: none;
}
.equipment-table th:last-child,
.equipment-table td:last-child {
  border-right: none;
}
.equipment-table thead tr:first-child th {
  border-top: none;
}
.equipment-table tbody tr:last-child td {
  border-bottom: none;
}

/* Editable style */
.editable {
  
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  min-height: 20px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 2px 4px;
  width: 50%;
  margin: 0;
  text-align: left;
}
.editable:focus {
  border: 1px solid #dfdfdf;
  background-color: #fff;
}

/* Search field styling */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
