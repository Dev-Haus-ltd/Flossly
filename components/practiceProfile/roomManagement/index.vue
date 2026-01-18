<!-- Room Management Component (Main Table) -->
<template>
  <div class="room-library">
    <!-- Header -->
    <div class="header-section">
      <h3 class="header-title">Room Management</h3>

      <!-- Search & Actions -->
      <div class="header-actions">
        <v-btn 
          color="primary" 
          class="mr-3 d-none d-sm-flex"
          @click="showDialog = true"
        >
          Add Room
        </v-btn>
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search rooms"
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
      <v-table class="room-table" density="comfortable">
        <thead>
          <tr>
            <th class="col-name">Name</th>
            <th class="col-details">Details</th>
            <th class="col-description">Description</th>
            <th class="col-color">Color</th>
            <th class="col-action text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(room, index) in filteredRooms" :key="index">
            <!-- Editable Name -->
            <td class="col-name">
              <div class="px-3">
                <p
                  class="editable"
                  contenteditable="true"
                  @keydown.enter.prevent="updateField($event, index, 'name')"
                >
                  {{ room.name }}
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
                  {{ room.details }}
                </p>
              </div>
            </td>

            <!-- Editable Description -->
            <td class="col-description">
              <div class="px-3">
                <p
                  class="editable-des"
                  contenteditable="true"
                  @keydown.enter.prevent="updateField($event, index, 'description')"
                >
                  {{ room.description }}
                </p>
              </div>
            </td>

            <!-- Color Picker -->
            <td class="col-color cursor-pointer p-0">
              <v-text-field
                density="compact"
                variant="solo"
                hide-details
                class="w-100"
                flat
              >
                <template #prepend-inner>
                  <CommonColorPickerInput
                    :item="room"
                    @update="
                      (payload) => updateField(payload.color, index, 'color')
                    "
                    noBorder
                  />
                </template>
              </v-text-field>
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

    <!-- Add Room Dialog -->
    <PracticeProfileRoomManagementAddRoomDialog
      v-model="showDialog"
      @onUpdate="handleAddRoom"
    />
    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      icon="mdi-information-outline"
      title="Delete room?"
      message="Are you sure you want to delete this room? This action cannot be undone."
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
const roomList = ref([]);
const showDialog = ref(false);
const search = ref("");
const showDeleteConfirm = ref(false);
const deleteIndex = ref(null);

// Watch for prop changes and update local copy
watch(
  () => props.practiceDetails.surgeries,
  (newVal) => {
    if (!newVal) {
      roomList.value = [];
      return;
    }

    // Clone and sort alphabetically by name
    roomList.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true, deep: true }
);

// Computed: filtered list
const filteredRooms = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return roomList.value;
  return roomList.value.filter(
    (room) =>
      (room.name || "").toLowerCase().includes(q) ||
      (room.description || "").toLowerCase().includes(q) ||
      (room.details || "").toLowerCase().includes(q)
  );
});

// Update editable field
const updateField = (e, index, field) => {
  const room = roomList.value[index];
  if (!room) return;

  let value;

  if (typeof e === "string") {
    // Color picker gives us a hex string
    value = e;
  } else {
    // Contenteditable gives us an event
    value = e.target.innerText.trim();
  }

  const updatedRoom = { ...room, [field]: value };

  // Update local copy immediately
  roomList.value[index] = updatedRoom;

  // Call API
  handleAttributeUpdate(updatedRoom);
};

const handleAttributeUpdate = async (updated) => {
  try {
    const res = await orgStore.updateAttributes({
      data: updated,
      type: "surgery",
    });

    if (res.code === 0) {
      // Update parent after successful API call
      emit("updateDetails");
      mainStore.setSnackbar({
        title: res.message || `Room updated successfully`,
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || `Failed to update room`,
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || `An unexpected error occurred while updating room`,
      type: "error",
    });
  }
};

const handleAddRoom = async (newRoom) => {
  try {
    const res = await orgStore.addRoom(newRoom);

    if (res.code === 0) {
      // Update parent after successful API call
      emit("updateDetails");
      mainStore.setSnackbar({
        title: "Room added successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to add room",
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
  const room = roomList.value[index];
  if (!room?.id) return;

  try {
    const res = await orgStore.deleteAttribute({
      type: "surgery",
      id: room.id,
    });

    if (res.code === 0) {
      roomList.value.splice(index, 1);
      emit("updateDetails");
      mainStore.setSnackbar({
        title: "Room deleted successfully",
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
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};
</script>

<style scoped>
.room-library {
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
  min-width: 700px;
}

.room-table th,
.room-table td {
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
}

.room-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.room-table th:first-child,
.room-table td:first-child {
  border-left: none;
}

.room-table th:last-child,
.room-table td:last-child {
  border-right: none;
}

.room-table thead tr:first-child th {
  border-top: none;
}

.room-table tbody tr:last-child td {
  border-bottom: none;
}

/* Column Widths */
.col-name {
  width: 18%;
  min-width: 100px;
}

.col-details {
  width: 22%;
  min-width: 120px;
}

.col-description {
  width: 28%;
  min-width: 140px;
}

.col-color {
  width: 14%;
  min-width: 100px;
}

.col-action {
  width: 18%;
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

.editable-des {
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
  word-wrap: break-word;
  white-space: normal;
}

.editable-des:focus {
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