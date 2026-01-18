<!-- Contact Library Component (Main Table) -->
<template>
  <div class="contact-library">
    <!-- Header -->
    <div class="header-section">
      <h3 class="header-title">Contact Library</h3>

      <!-- Search & Actions -->
      <div class="header-actions">
        <v-btn 
          color="primary" 
          class="mr-3 d-none d-sm-flex"
          @click="showDialog = true"
        >
          Add Contacts
        </v-btn>
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search contacts"
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
      <v-table class="contact-table" density="comfortable">
        <thead>
          <tr>
            <th class="col-name">Name</th>
            <th class="col-contact">Contact</th>
            <th class="col-action text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(contact, index) in filteredContacts" :key="index">
            <!-- Name -->
            <td class="col-name">
              <div class="px-3">
                <p
                  class="editable"
                  contenteditable="true"
                  @keydown.enter.prevent="updateField($event, index, 'name')"
                >
                  {{ contact.name }}
                </p>
              </div>
            </td>

            <!-- Contact -->
            <td class="col-contact">
              <div class="px-3">
                <p
                  class="editable"
                  contenteditable="true"
                  @keydown.enter.prevent="updateField($event, index, 'contact')"
                >
                  {{ contact.contact }}
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

    <!-- Add Contacts Dialog -->
    <PracticeProfileContactAddContactsDialog
      v-model="showDialog"
      @onUpdate="handleAddContacts"
    />
  </div>
  <CommonConfirmDialog
    v-model="showDeleteConfirm"
    icon="mdi-information-outline"
    title="Delete contact?"
    message="Are you sure you want to delete this contact? This action cannot be undone."
    confirm-text="Delete"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
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

const search = ref("");
const showDialog = ref(false);
const contacts = ref([]);
const showDeleteConfirm = ref(false);
const deleteIndex = ref(null);

// Keep contacts in sync with props
watch(
  () => props.practiceDetails.contacts,
  (newVal) => {
    if (!newVal) {
      contacts.value = [];
      return;
    }

    // Clone and sort alphabetically by name
    contacts.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true, deep: true }
);

// Search filtering
const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return contacts.value;
  return contacts.value.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.contact || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
  );
});

// Update field inline
const updateField = (e, index, field) => {
  const contact = contacts.value[index];
  if (!contact) return;
  const updatedContact = { ...contact, [field]: e.target.innerText.trim() };
  contacts.value[index] = updatedContact;
  handleAttributeUpdate(updatedContact);
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
  const c = contacts.value[index];
  if (!c?.id) return;

  try {
    const res = await orgStore.deleteAttribute({ type: "contact", id: c.id });

    if (res.code === 0) {
      contacts.value.splice(index, 1);
      emit("updateDetails");
      mainStore.setSnackbar({ title: "Deleted", type: "success" });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Delete failed",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({ title: err.message, type: "error" });
  }
};



const handleAttributeUpdate = async (updated) => {
  try {
    const res = await orgStore.updateAttributes({
      data: updated,
      type: "contact",
    });

    if (res.code === 0) {
      // Update parent after successful API call
      emit("updateDetails");
      mainStore.setSnackbar({
        title: res.message || `Contact updated successfully`,
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || `Failed to update contact`,
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title:
        err.message || `An unexpected error occurred while updating contact`,
      type: "error",
    });
  }
};

// Add contacts
const handleAddContacts = async (newContacts) => {
  try {
    const res = await orgStore.addContacts({ contacts: newContacts });

    if (res.code === 0) {
      emit("updateDetails");
      mainStore.setSnackbar({
        title: "Contacts added successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to add contacts",
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
.contact-library {
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

/* Table */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: auto;
  border-collapse: collapse;
  min-width: 500px;
}

.contact-table th,
.contact-table td {
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
}

.contact-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.contact-table th:first-child,
.contact-table td:first-child {
  border-left: none;
}

.contact-table th:last-child,
.contact-table td:last-child {
  border-right: none;
}

.contact-table thead tr:first-child th {
  border-top: none;
}

.contact-table tbody tr:last-child td {
  border-bottom: none;
}

/* Column Widths */
.col-name {
  width: 40%;
  min-width: 150px;
}

.col-contact {
  width: 40%;
  min-width: 150px;
}

.col-action {
  width: 20%;
  min-width: 80px;
}

/* Mobile: Adjust widths */
@media (max-width: 600px) {
  .col-name {
    width: 40%;
    min-width: 150px;
  }

  .col-contact {
    width: 40%;
    min-width: 150px;
  }

  .col-action {
    width: 20%;
    min-width: 80px;
  }
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