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
        Contact Library
      </h3>

      <!-- Search -->
      <div class="d-flex align-center">
        <v-btn color="primary" class="mr-3" @click="showDialog = true">
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
          style="width: 220px"
        />
      </div>
    </div>

    <!-- Table -->
    <v-table class="contact-table" density="comfortable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(contact, index) in filteredContacts" :key="index">
          <!-- Editable Name -->
          <td>
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

          <!-- Editable Contact -->
          <td>
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
          <td>
            <div class="px-4 text-center">
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

    <!-- Add Contacts Dialog -->
    <PracticeProfileContactAddContactsDialog
      v-model="showDialog"
      @onUpdate="handleAddContacts"
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

const search = ref("");
const showDialog = ref(false);

// ✅ local reactive copy
const contacts = ref([]);

// keep contacts in sync with props
watch(
  () => props.practiceDetails.contacts,
  (newVal) => {
    if (!newVal) {
      contacts.value = [];
      return;
    }

    // ✅ clone + sort alphabetically by name
    contacts.value = [...newVal].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  },
  { immediate: true }
);

// ✅ search filtering
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

// Delete row -> notify parent
const deleteRow = (index) => {
  contacts.value.splice(index, 1);
  // You’d also want to call delete API here later
};

const handleAttributeUpdate = async (updated) => {
  try {
    const res = await orgStore.updateAttributes({
      data: updated,
      type: "contact",
    });

    if (res.code === 0) {
      // emit("updateDetails"); // refresh parent
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

// Add contacts -> only notify parent after API success
const handleAddContacts = async (newContacts) => {
  try {
    const res = await orgStore.addContacts({ contacts: newContacts });

    if (res.code === 0) {
      emit("updateDetails"); // parent refreshes
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
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
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
  width: 33.33%;
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

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
