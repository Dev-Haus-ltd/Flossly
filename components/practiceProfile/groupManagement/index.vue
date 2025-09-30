<template>
  <div
    style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: auto"
    class="my-5"
  >
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
        Group Management
      </h3>

      <div class="d-flex align-center">
        <v-btn
          v-if="orgUsers.length"
          color="primary"
          class="mr-3"
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
          style="width: 240px"
        />
      </div>
    </div>

    <!-- Table -->
    <v-table class="group-table" density="comfortable">
      <thead>
        <tr>
          <th>Group Name</th>
          <th>Users</th>
          <th>Description</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, idx) in filteredRows" :key="idx">
          <!-- Group Name via reusable select -->
          <td>
            <p
              class="editable"
              contenteditable="true"
              @keydown.enter.prevent="updateField($event, idx, 'name')"
            >
              {{ row.name }}
            </p>
          </td>

          <!-- Users -->
          <td>
            <div class="d-flex align-center gap-2" style="padding: 8px 0">
              <CommonAvatar
                v-for="(u, uIdx) in row.groupUsers"
                :key="uIdx"
                :user="u.user"
              />
            </div>
          </td>

          <!-- Description (editable) -->
          <td>
            <p
              class="editable"
              contenteditable="true"
              @keydown.enter.prevent="updateField($event, idx, 'description')"
            >
              {{ row.description }}
            </p>
          </td>

          <!-- Action -->
          <td>
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

    <PracticeProfileGroupManagementAddGroupDialog
      v-model="showDialog"
      @onUpdate="handleAddGroup"
      :users="orgUsers"
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
  { immediate: true }
);

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return groups.value;
  return groups.value.filter((r) => {
    const names = r.users.map((u) => u.fullName).join(" ");
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
      // emit("updateDetails"); // refresh parent
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
const deleteRow = (index) => {
  groups.value.splice(index, 1);
};
const handleAddGroup = async () => {
  emit("updateDetails");
};
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.group-table th,
.group-table td {
  
  font-weight: 400;
  font-size: 13px;
  padding: 0px 16px !important; /* your spec */
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
}

.group-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

/* Remove outer borders to match your pattern */
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

/* Editable description */
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
  width: 90%;
  margin: 0;
  text-align: left;
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
