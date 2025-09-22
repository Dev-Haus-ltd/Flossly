<template>
  <div class="rounded-lg" style="border: 1px solid #dbdbdb">
    <h3 class="head py-6 px-4">My Leads</h3>
    <v-data-table
      :headers="headers"
      :items="leads"
      item-value="id"
      show-select
      hover
      class="full-width-table"
      @update:model-value="onSelect"
    >
      <!-- Editable / resizable headers -->
      <template v-slot:headers="{ columns, allSelected, someSelected }">
        <tr>
          <template v-for="(column, i) in columns" :key="column.key">
            <th
              :style="{
                width: column.width + 'px',
                padding: '0px 7px',
                backgroundColor: '#F6F6F6',
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
                <v-checkbox
                  :model-value="allSelected"
                  :indeterminate="someSelected && !allSelected"
                  @update:model-value="toggleAll"
                  density="compact"
                  hide-details
                  variant="outlined"
                  class="custom-checkbox"
                />
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
        <!-- <template v-else-if="col.key === 'assigned'">
            <DataTableColumnsAssignedUsers
                  :assigned-users="item.assignedUsers || [user]"
                  :all-users="getTaskUsers(item)"
                  :current-user="user"
                  @assign="assignTask(item, $event)"
                  @unassign="unAssign(item, $event)"
                />
        </template> -->
        <!-- Default renderer for other columns -->
        <template v-else>
          <p class="ml-2 mb-0">{{ item[col.key] }}</p>
        </template>
      </template>
    </v-data-table>
    <CustomerRelationManagementLeadDetailsDialog
      v-model="showLeadDetailDialog"
      :selected-lead="selectedLead"
      @close="showLeadDetailDialog = false"
    
    />
  </div>
</template>

<script setup>


const props = defineProps({
  leads: { type: Array, required: true },
  headers: { type: Array, required: true },
  search: { type: String, default: "" },
  leadSources:{type:Array, required:true},
  treatmentSources:{type:Array, required:true},
});

const emit = defineEmits(["select", "openLead"]);

const showLeadDetailDialog = ref(false);
const selectedLead=ref({});

const onSelect = (selection) => {
  if (selection.length === props.leads.length) {
    emit("select", "all");
  } else {
    emit("select", selection);
  }
};
const updateValueRow = (row, key) => {
  console.log(row, key);
};

const openLeadDialog = (lead) => {
    selectedLead.value=lead
    showLeadDetailDialog.value=true
  console.log("Open lead dialog:", lead);

};
</script>

<style scoped>
.head {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep() .v-data-table .v-table__wrapper tbody tr:hover {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

/* Vertical lines between columns */
:deep(.v-table .v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: 1px solid #dbdbdb;
}
:deep(.v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child)) {
  border-right: 1px solid #dbdbdb;
}
.full-width-table {
  border-top: 1px solid #dbdbdb;
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
</style>
