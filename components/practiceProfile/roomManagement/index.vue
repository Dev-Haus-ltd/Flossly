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
          font-family: Poppins;
          font-weight: 600;
          font-size: 14px;
          color: #1e1e1e;
          margin: 0;
        "
      >
        Room Management
      </h3>

      <!-- Search -->
      <div class="d-flex align-center">
        <v-btn color="primary" class="mr-3" @click="showDialog = true">
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
          style="width: 220px"
        />
      </div>
    </div>

    <!-- Table -->
    <v-table class="room-table" density="comfortable">
      <thead>
        <tr>
          <th>Name</th>

          <th>Details</th>
          <th>Description</th>
          <th>Color</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(room, index) in filteredRooms" :key="index">
          <!-- Editable Name -->
          <td>
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

          <!-- Editable Description -->
          <td>
            <div class="px-3">
              <p
                class="editable-des"
                contenteditable="true"
                @keydown.enter.prevent="
                  updateField($event, index, 'description')
                "
              >
                {{ room.description }}
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
                {{ room.details }}
              </p>
            </div>
          </td>
          <td class="cursor-pointer p-0">
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
    <PracticeProfileRoomManagementAddRoomDialog
      v-model="showDialog"
      @onUpdate="handleAddRoom"
    />
  </div>
</template>

<script setup>
const colorMenuIndex = ref(null);
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
watch(
  () => props.practiceDetails.surgeries,
  (newVal) => {
    if (!newVal) {
      roomList.value = [];
      return;
    }

    // ✅ clone + sort alphabetically by name
    roomList.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true }
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
  console.log(e);
  const room = roomList.value[index];
  if (!room) return;

  let value;

  if (typeof e === "string") {
    // v-color-picker gives us a hex string like "#FF0000"
    value = e;
  } else {
    // contenteditable gives us an event
    value = e.target.innerText.trim();
  }

  const updatedRoom = { ...room, [field]: value };

  // ✅ update local copy immediately
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
      // emit("updateDetails"); // refresh parent
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
// Delete row
const deleteRow = (index) => {
  roomList.value.splice(index, 1);
};
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.room-table th,
.room-table td {
  font-family: Poppins;
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
  width: 25%; /* 4 equal columns */
}

.room-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

/* Remove outer borders */
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

/* Editable style */
.editable {
  font-family: "Poppins";
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
.editable-des {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  min-height: 20px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 2px 4px;
  width: 90%;
  margin: 0;
  text-align: left;
}
.editable-des:focus {
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
  font-family: "Poppins", sans-serif;
}
</style>
