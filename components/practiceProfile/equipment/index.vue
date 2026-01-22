<!-- Equipment Directory Component (Main Table) -->
<template>
  <div class="equipment-library">
    <!-- Header -->
    <div class="header-section">
      <h3 class="header-title">Equipment Directory</h3>

      <!-- Search & Actions -->
      <div class="header-actions">
        <v-btn 
          color="primary" 
          class="mr-3 d-none d-sm-flex"
          @click="showDialog = true"
        >
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
        />
        <!-- Mobile Add Button -->
        <v-btn 
          icon="mdi-plus"
          color="primary" 
          class="d-sm-none ml-2"
          @click="showDialog = true"
        />
      </div>
    </div>

    <!-- Table Wrapper -->
    <div class="table-wrapper">
      <v-table class="equipment-table" density="comfortable">
        <thead>
          <tr>
            <th class="col-name">Name</th>
            <th class="col-serial">Serial Number</th>
            <th class="col-details">Details</th>
            <th class="col-action text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredEquipment" :key="index">
            <!-- Editable Name -->
            <td class="col-name">
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
            <td class="col-serial">
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
            <td class="col-details">
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
            <td class="col-action text-center">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/practiceProfile/contact/delete.svg"
                    alt="Delete"
                    width="18"
                    height="18"
                    style="cursor: pointer"
                    @click="openDeleteConfirm(index)"
                  />
                </template>
                <span>Delete</span>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Add Equipment Dialog -->
    <PracticeProfileEquipmentAddEquipmentsDialog
      v-model="showDialog"
      @onUpdate="handleAddEquipments"
    />
    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      icon="mdi-information-outline"
      title="Delete equipment?"
      message="Are you sure you want to delete this equipment? This action cannot be undone."
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

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
const showDeleteConfirm = ref(false);
const deleteIndex = ref(null);

// Computed: filtered list
const filteredEquipment = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return equipments.value;
  return equipments.value.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.serialNumber || "").toLowerCase().includes(q) ||
      (item.details || "").toLowerCase().includes(q)
  );
});

// Watch for prop changes and update local copy
watch(
  () => props.practiceDetails.equipments,
  (newVal) => {
    if (!newVal) {
      equipments.value = [];
      return;
    }

    // Clone and sort alphabetically by name
    equipments.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true, deep: true }
);

// Update editable field
const updateField = (e, index, field) => {
  const equipment = equipments.value[index];
  if (!equipment) return;

  const updatedEquipment = { ...equipment, [field]: e.target.innerText.trim() };

  // Update local copy immediately
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
      // Update parent after successful API call
      emit("updateDetails");
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

const openDeleteConfirm = (index) => {
  deleteIndex.value = index;
  showDeleteConfirm.value = true;
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteIndex.value = null;
};

const confirmDelete = async () => {
  if (deleteIndex.value === null) return;

  await deleteRow(deleteIndex.value);

  showDeleteConfirm.value = false;
  deleteIndex.value = null;
};


const deleteRow = async (index) => {
  const item = equipments.value[index];
  if (!item?.id) return;

  try {
    const res = await orgStore.deleteAttribute({
      type: "equipment",
      id: item.id,
    });

    if (res.code === 0) {
      equipments.value.splice(index, 1);
      emit("updateDetails");
      mainStore.setSnackbar({
        title: "Deleted",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Delete failed",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message,
      type: "error",
    });
  }
};

const handleAddEquipments = async (newEquipments) => {
  try {
    const res = await orgStore.addEquipment({ equipments: newEquipments });

    if (res.code === 0) {
      // Update parent after successful API call
      emit("updateDetails");
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
.equipment-library {
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  overflow: auto;
  margin: 1.25rem 0;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  border-bottom: 1px solid #dbdbdb;
  padding: 1rem;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e1e1e;
  margin: 0;
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.header-actions .v-text-field {
  flex: 1;
  max-width: 100%;
}

/* Desktop: Header in row */
@media (min-width: 960px) {
  .header-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .header-title {
    flex-shrink: 0;
    width: auto;
  }

  .header-actions {
    flex: 1;
    justify-content: flex-end;
    width: auto;
  }

  .header-actions .v-text-field {
    max-width: 220px;
  }
}

/* Table Wrapper */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: auto;
  border-collapse: collapse;
  min-width: 600px;
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
}

.equipment-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

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

/* Column Widths */
.col-name {
  width: 25%;
  min-width: 120px;
}

.col-serial {
  width: 25%;
  min-width: 140px;
}

.col-details {
  width: 35%;
  min-width: 150px;
}

.col-action {
  width: 15%;
  min-width: 80px;
}

/* Editable Field */
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
  margin: 0;
  text-align: left;
  transition: all 0.2s ease;
}

.editable:focus {
  border: 1px solid #dfdfdf;
  background-color: #fff;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>