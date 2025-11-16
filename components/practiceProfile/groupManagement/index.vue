<!-- Group Management Component (Main Table) -->
<template>
  <div class="group-library">
    <!-- Header -->
    <div class="header-section">
      <h3 class="header-title">Group Management</h3>

      <!-- Search & Actions -->
      <div class="header-actions">
        <v-btn
          v-if="orgUsers.length"
          color="primary"
          class="mr-3 d-none d-sm-flex"
          @click="showDialog = true"
        >
          Add Group
        </v-btn>
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search groups"
          hide-details
          variant="solo"
          class="input-bordered"
          flat
          append-inner-icon="mdi-magnify"
        />
        <!-- Mobile Add Button -->
        <v-btn
          v-if="orgUsers.length"
          icon="mdi-plus"
          color="primary"
          class="d-sm-none ml-2"
          @click="showDialog = true"
        />
      </div>
    </div>

    <!-- Table Wrapper -->
    <div class="table-wrapper">
      <v-table class="group-table" density="comfortable">
        <thead>
          <tr>
            <th class="col-name">Group Name</th>
            <th class="col-users">Users</th>
            <th class="col-description">Description</th>
            <th class="col-action text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, idx) in filteredRows" :key="idx">
            <!-- Group Name -->
            <td class="col-name">
              <p
                class="editable"
                contenteditable="true"
                @keydown.enter.prevent="updateField($event, idx, 'name')"
              >
                {{ row.name }}
              </p>
            </td>

            <!-- Users -->
            <td class="col-users">
              <div class="d-flex align-center gap-2 flex-wrap" style="padding: 8px 0">
                <CommonAvatar
                  v-for="(u, uIdx) in row.groupUsers"
                  :key="uIdx"
                  :user="u.user"
                />
              </div>
            </td>

            <!-- Description (editable) -->
            <td class="col-description">
              <p
                class="editable-des"
                contenteditable="true"
                @keydown.enter.prevent="updateField($event, idx, 'description')"
              >
                {{ row.description }}
              </p>
            </td>

            <!-- Action -->
            <td class="col-action text-center">
              <img
                src="@/assets/icons/practiceProfile/contact/delete.svg"
                alt="Delete"
                width="18"
                height="18"
                style="cursor: pointer"
                @click="deleteRow(idx)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Add Group Dialog -->
    <PracticeProfileGroupManagementAddGroupDialog
      v-model="showDialog"
      @onUpdate="handleAddGroup"
      :users="orgUsers"
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
const userStore = useUserStore();
const mainStore = useMainStore();
const showDialog = ref(false);
const groups = ref([]);
const search = ref("");
const orgUsers = ref([]);

const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) {
      orgUsers.value = res.data;
    }
  });
};

// Watch for prop changes and update local copy
watch(
  () => props.practiceDetails.groups,
  (newVal) => {
    if (!newVal) {
      groups.value = [];
      return;
    }
    groups.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
    getUsers();
  },
  { immediate: true, deep: true }
);

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return groups.value;
  return groups.value.filter((r) => {
    const names = r.groupUsers?.map((u) => u.user?.fullName).join(" ") || "";
    return (
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      names.toLowerCase().includes(q)
    );
  });
});

// Update editable field
const updateField = (e, index, field) => {
  const group = groups.value[index];
  if (!group) return;

  const updatedGroup = { ...group, [field]: e.target.innerText.trim() };
  groups.value[index] = updatedGroup;
  handleAttributeUpdate(updatedGroup);
};

const handleAttributeUpdate = async (updated) => {
  try {
    const res = await orgStore.updateAttributes({
      data: updated,
      type: "group",
    });

    if (res.code === 0) {
      // Update parent after successful API call
      emit("updateDetails");
      mainStore.setSnackbar({
        title: res.message || `Group updated successfully`,
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || `Failed to update Group`,
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || `An unexpected error occurred while updating Group`,
      type: "error",
    });
  }
};

// Delete row
const deleteRow = async (index) => {
  const group = groups.value[index];
  if (!group?.id) return;

  try {
    const res = await orgStore.deleteAttribute({
      type: "group",
      id: group.id,
    });

    if (res.code === 0) {
      groups.value.splice(index, 1);
      emit("updateDetails");
      mainStore.setSnackbar({
        title: "Group deleted successfully",
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

const handleAddGroup = async () => {
  // Emit to parent to refresh data
  emit("updateDetails");
};
</script>

<style scoped>
.group-library {
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
    max-width: 240px;
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

.group-table th,
.group-table td {
  font-weight: 400;
  font-size: 13px;
  padding: 10px 16px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
}

.group-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.group-table th:first-child,
.group-table td:first-child {
  border-left: none;
}

.group-table th:last-child,
.group-table td:last-child {
  border-right: none;
}

.group-table thead tr:first-child th {
  border-top: none;
}

.group-table tbody tr:last-child td {
  border-bottom: none;
}

/* Column Widths */
.col-name {
  width: 25%;
  min-width: 120px;
}

.col-users {
  width: 25%;
  min-width: 130px;
}

.col-description {
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