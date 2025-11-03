<template>
  <v-card class="rounded-lg with-border">
    <h3 class="head py-6 px-4">My Leads</h3>
    <v-data-table
      v-model="selectedLeads"
      :headers="headers"
      :items="leads"
      item-value="id"
      show-select
      hover
      class="full-width-table"
      :item-selectable="() => true"
      @update:model-value="onSelect"
      return-object
    >
      <template
        v-slot:[`item.data-table-select`]="{
          internalItem,
          isSelected,
          toggleSelect,
        }"
      >
        <input
          type="checkbox"
          :checked="isSelected(internalItem)"
          @change="() => toggleSelect(internalItem)"
          class="cust-checkbox"
        />
      </template>

      <!-- Editable / resizable headers -->
      <template v-slot:headers="{ columns, allSelected, someSelected }">
        <tr>
          <template v-for="(column, i) in columns" :key="column.key">
            <th
              :style="{
                width: column.width + 'px',
                padding: '0px 7px',
                fontSize: '14px',
              }"
            >
              <div v-if="i !== 0" class="d-flex align-center th-content">
                <p class="px-1 w-100">{{ column.title }}</p>

                <span
                  class="resize-handle"
                  @mousedown="startResize($event, column)"
                ></span>
              </div>

              <div v-else>
                <div class="d-flex justify-center">
                  <input
                    type="checkbox"
                    class="cust-checkbox ma-0"
                    :checked="allSelected"
                    :indeterminate.prop="someSelected && !allSelected"
                    @change="toggleAll"
                  />
                </div>
              </div>
            </th>
          </template>
        </tr>
      </template>

      <!-- Dynamic cell templates -->
      <template
        v-for="col in headers"
        :key="col.key"
        v-slot:[`item.${col.key}`]="{ item }"
      >
        <!-- Name column with expand icon -->
        <template v-if="col.key === 'name'">
          <div class="pa-1 d-flex justify-space-between align-center">
            <p class="ml-2 mb-0">{{ item.name }}</p>
            <img
              src="@/assets/dashboard/expandIcon.svg"
              alt="Expand"
              class="ml-2 cursor-pointer"
              @click="openLeadDialog(item)"
            />
          </div>
        </template>
        <template v-else-if="col.key === 'alert'">
          <DataTableColumnsAlerts :selected="item" @update="updateValueRow(item, 'alert')" />
        </template>
        <template v-else-if="col.key === 'leadStatus'">
          <DataTableColumnsLeadStatus
            :selected="item"
            :column="col"
            @update="updateValueRow(item, 'leadStatus')"
          />
        </template>
        <template v-else-if="col.key === 'leadSource'">
          <DataTableColumnsLeadSource
            :leadSources="leadSources"
            :selected="item"
            :column="col"
            @update="updateValueRow(item, 'leadSource')"
          />
        </template>
        <template v-else-if="col.key === 'treatment'">
          <DataTableColumnsLeadTreatment
            :treatmentSources="treatmentSources"
            :selected="item"
            :column="col"
            @update="updateValueRow(item, 'treatment')"
          />
        </template>
        <template v-else-if="col.key === 'assigned'">
          <DataTableColumnsAssignedUsers
            :assigned-users="item.assigned || [user]"
            :all-users="getLeadUsers(item)"
            :current-user="user"
            @assign="assignLead(item, $event)"
            @unassign="unAssign(item, $event)"
          />
        </template>
        <!-- Default renderer for other columns -->
        <template v-else-if="col.key === 'inquiryDate' || col.key === 'followUpDate'">
          <p class="ml-2 mb-0">{{ formatDate(item[col.key]) }}</p>
        </template>
        <template v-else>
          <p class="ml-2 mb-0">{{ item[col.key] }}</p>
        </template>
      </template>
    </v-data-table>
    <v-card
      v-if="selectedLeads.length"
      class="action-bar py-3 px-6 d-flex justify-space-between align-center rounded-lg"
      :elevation="5"
      flat
    >
      <!-- Selected count -->
      <div class="selected-count d-flex align-center mr-8">
        <span class="selected-text">
          {{ selectedLeads.length }}
        </span>
        <p class="ml-3 mt-1">Items Selected</p>
      </div>

      <!-- Actions tray -->
      <div class="d-flex align-center" style="gap: 28px;">
        <div
          v-for="(action, i) in actions"
          :key="i"
          class="action-item d-flex flex-column align-center"
          @click="onActionClick(action.key)"
        >
          <v-icon :color="action.color" size="24">{{ action.icon }}</v-icon>
          <span class="action-label mt-1" :class="`text-${action.color}`">
            {{ action.label }}
          </span>
        </div>
      </div>

      <v-divider vertical  />

      <!-- Close -->
      <div class=" d-flex align-center" @click="closeTray">
        <v-icon color="on-surface-variant" size="20" class="mr-1">mdi-close</v-icon>
        <span class="action-label text-on-surface-variant">Close</span>
      </div>
    </v-card>

    <CustomerRelationManagementLeadDetailsDialog
      v-model="showLeadDetailDialog"
      :selected-lead="selectedLead"
      @close="showLeadDetailDialog = false"
    />
  </v-card>
    <CommonConfirmDialog
      v-model="confirmDelete"
      title="Delete leads?"
      :loading="deleting"
      :message="`Are you sure you want to delete ${selectedLeads.length} lead(s)?`"
      @confirm="doDelete"
      @cancel="confirmDelete = false"
    />
</template>

<script setup>
const crmStore = useCrmStore();
const { user } = useUser();
const emit = defineEmits(['select','openLead','delete']);
const props = defineProps({
  leads: { type: Array, required: true },
  headers: { type: Array, required: true },
  search: { type: String, default: '' },
  leadSources: { type: Array, required: true },
  treatmentSources: { type: Array, required: true },
  users: { type: Array, required: true },
});
const selectedLeads = ref([]);
const isAllSelected = ref(false);
const showLeadDetailDialog = ref(false);
const selectedLead = ref({});
const actions = [
  { key: "call", label: "Call", icon: "mdi-phone-outline", color: "info" },
  { key: "mail", label: "Send Mail", icon: "mdi-email-outline", color: "tertiary" },
  { key: "whatsapp", label: "WhatsApp", icon: "mdi-whatsapp", color: "success" },
  { key: "book", label: "Book", icon: "mdi-book-open-page-variant-outline", color: "primary" },
  { key: "sendPrice", label: "Send Price", icon: "mdi-currency-usd", color: "warning" },
  { key: "sendForm", label: "Send Form", icon: "mdi-form-select", color: "warning" },
  { key: "shareLocation", label: "Share Location", icon: "mdi-map-marker-outline", color: "error" },
  { key: "convert", label: "Convert", icon: "mdi-swap-horizontal", color: "on-surface" },
  { key: "archive", label: "Archive", icon: "mdi-archive-outline", color: "on-surface" },
  { key: "delete", label: "Delete", icon: "mdi-delete-outline", color: "on-surface" },
];
const confirmDelete = ref(false);
const deleting = ref(false);
const converting = ref(false);
const onActionClick = (key) => {
  if (!selectedLeads.value.length) return;
  if (key === 'delete') confirmDelete.value = true;
  else if (key === 'archive') doArchive();
  else if (key === 'convert') convertSelected();
};
const formatDate = (d) => {
  if (!d) return "";
  if (typeof d === 'string') {
    const m = d.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  const y = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};
const onSelect = (selection) => {
  console.log(selection);
};
const toggleAll = () => {
  if (isAllSelected.value) {
    isAllSelected.value = false;
    selectedLeads.value = [];
  } else {
    const selected = [];

    props.leads.forEach((l) => {
      selected.push(l);
    });
    selectedLeads.value = selected;
    isAllSelected.value = true;
  }

  console.log(selectedLeads.value);
};
const closeTray = () => {
  isAllSelected.value = false;
  selectedLeads.value = [];
};
const updateValueRow = async (row, key) => {
  try {
    const payload = { id: row.id }
    if (key === 'leadSource') payload.leadSource = row?.leadSource?.name || row.leadSource || null
    else if (key === 'treatment') payload.treatment = row?.treatment || null
    else if (key === 'leadStatus') payload.leadStatus = row?.leadStatus || null
    else if (key === 'alert') payload.alert = row?.alert || null
    else return
    await crmStore.updateLead(payload)
  } catch (e) {}
};

const openLeadDialog = (lead) => {
  selectedLead.value = lead;
  showLeadDetailDialog.value = true;
  console.log("Open lead dialog:", lead);
};
const getLeadUsers = (lead) => {
  // if (props.users.length) {
  //   return props.users.filter((x) => x.roleId !== task.taskDetails.roleId);
  // } else return [];
  return props.users;
};
const unAssign = async (lead, user) => {
  try {
    const newAssigned = (lead.assigned || []).filter(u => u?.id !== user.id);
    const res = await crmStore.updateLead({ id: lead.id, assigned: newAssigned });
    if (res?.code === 0) lead.assigned = newAssigned;
  } catch (e) { /* noop */ }
};

const assignLead = async (lead, user) => {
  try {
    const already = (lead.assigned || []).some(u => u?.id === user.id);
    if (already) return;
    const newAssigned = [...(lead.assigned || []), { id: user.id, fullName: user.fullName, email: user.email }];
    const res = await crmStore.updateLead({ id: lead.id, assigned: newAssigned });
    if (res?.code === 0) lead.assigned = newAssigned;
  } catch (e) { /* noop */ }
};

const doDelete = async () => {
  try {
    deleting.value = true
    const ids = selectedLeads.value.map(l => l.id)
    const res = await crmStore.deleteLeads(ids)
    if (res?.code === 0) emit('delete', ids)
  } finally {
    deleting.value = false
    confirmDelete.value = false
    closeTray()
  }
}

const convertSelected = async () => {
  try {
    converting.value = true
    const updates = selectedLeads.value.map(l => {
      l.leadStatus = 'Converted'
      return crmStore.updateLead({ id: l.id, leadStatus: 'Converted' })
    })
    await Promise.all(updates)
    closeTray()
  } finally {
    converting.value = false
  }
}
</script>

<style scoped>
.head {
  
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep() .v-data-table .v-table__wrapper tbody tr:hover {
  transition: background-color 0.2s ease;
}

/* Vertical lines between columns */
:deep(.v-table .v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}
:deep(.v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child)) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}
.full-width-table {
  border-top: 1px solid rgb(var(--v-theme-outline));
  border-radius: unset;
}

.cursor-pointer {
  cursor: pointer;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
}
.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  /* remove default styling in some browsers if you want a fully custom look */
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  margin-left: 14px;
  margin-top: 5px;
}
.cust-checkbox:checked {
  background: #0061FB;
  border-color: #0061FB;
}
.cust-checkbox:checked::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 10px;
  border: solid rgb(var(--v-theme-on-primary));
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}


.selected-text {
  
  font-weight: 600;
  font-size: 14px;
  padding: 5px 13px;
  border-radius: 50%;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.action-item {
  cursor: pointer;
}

.action-label {
  
  font-size: 13px;
}

.with-border { border: 1px solid rgb(var(--v-theme-outline)); }
</style>
