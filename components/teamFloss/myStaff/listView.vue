<template>
  <v-expansion-panels v-model="openedPanels" :elevation="0" flat multiple>
    <v-expansion-panel
      v-for="org in teams"
      :key="org.id"
      rounded="lg"
      class="border-sm pb-1"
    >
      <!-- Panel title -->
      <v-expansion-panel-title>
        <div class="d-flex align-center">
          <CommonAvatar :user="org.organisation" class="mr-2" />
          {{ org.organisation.name }}
          <v-chip class="ml-2 rounded-lg" size="x-small" color="#213536">
            {{ org.orgUsers.length }}
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-data-table
          :headers="selectedHeaders"
          class="full-width-table"
          :items="org.orgUsers"
          item-value="id"
          show-select
          hover
        >
          <!-- Editable / resizable headers -->
          <template
            v-slot:headers="{
              columns,
              getSortIcon,
              toggleSort,
              allSelected,
              someSelected,
            }"
          >
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
                    <v-icon
                      v-if="column.sortable"
                      size="12"
                      class="ml-2"
                      @click="toggleSort(column)"
                    >
                      {{ getSortIcon(column) }}
                    </v-icon>
                    <span
                      class="resize-handle"
                      @mousedown="startResize($event, column)"
                    ></span>
                  </div>
                  <div v-else>
                    <v-checkbox
                      :model-value="allSelected"
                      :indeterminate="someSelected && !allSelected"
                      @update:model-value="toggleAll(org)"
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
            v-for="col in selectedHeaders"
            :key="col.key"
            v-slot:[`item.${col.key}`]="{ item }"
          >
            <template v-if="col.key === 'name'">
              <div class="pa-1 d-flex justify-space-between align-center">
                <v-text-field
                  v-model="item.fullName"
                  :variant="isFocused(item.id, 'name') ? 'outlined' : 'plain'"
                  @focus="setFocus(item.id, 'name', true)"
                  @blur="updateValueRow(item, 'name')"
                  density="compact"
                  hide-details
                  class="small-input"
                />

                <img
                  src="@/assets/dashboard/expandIcon.svg"
                  alt=""
                  class="ml-2"
                  @click="$emit('onUserSelect', {org, item})"
                  style="cursor: pointer"
                />
              </div>
            </template>

            <template v-else-if="col.key === 'role'">
              <!-- <p class="ml-2 mb-0" @click="()=>{console.log(item)}">{{ item.role.title.slice(0, 20) }}</p> -->
              <DataTableColumnsRoles
                :selected="item"
                :column="col"
                @update="updateValueRow(item, 'role')"
              />
            </template>

            <template v-else-if="col.key === 'dateOfJoining'">
              <p class="ml-2">{{ formattedDate(item.createdAt) }}</p>
            </template>

            <template v-else-if="col.key === 'profileCompletion'">
              <p class="ml-2">{{ item.profileCompletion }}%</p>
            </template>

            <template v-else-if="col.key === 'status'">
              <div class="text-center">
                <v-chip label color="primary">{{
                  item.status ? item.status : "Active"
                }}</v-chip>
              </div>
            </template>

            <template v-else-if="col.key === 'loginHistory'">
              <div class="text-center">
                <p
                  style="
                    font-size: 12px;
                    color: blue;
                    text-decoration: underline;
                    cursor: pointer;
                  "
                >
                  View History
                </p>
              </div>
            </template>
            <template v-else-if="col.key === 'recruitmentDocs'">
              <p class="ml-2">{{ item.recruitmentDocs }}%</p>
            </template>

            <template v-else-if="col.key === 'actions'">
              <v-icon
                size="20"
                color="primary"
                class="cursor-pointer ml-2"
                @click="$emit('add', item)"
              >
                mdi-plus
              </v-icon>
            </template>
          </template>
        </v-data-table>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { parsedDate } from "~/lib/dateFormatter";

const props = defineProps({
  teams: { type: Array, required: true },
  selectedHeaders: { type: Array, required: true },
  search: { type: String, default: "" },
});

const focusedField = ref({});

const openedPanels = ref([0]);
const emit = defineEmits(["add", "details"]);

const formattedDate = (dateStr) => {
  return parsedDate(dateStr);
};
const isFocused = (id, key) => {
  return focusedField.value[`${id}-${key}`] === true;
};
const setFocus = (id, key, state) => {
  focusedField.value[`${id}-${key}`] = state;
};
const updateValueRow = (row, key) => {
  console.log(row);
  setFocus(row.id, key, false);
  // taskStore
  //   .updateUserTask(row)
  //   .then((res) => {
  //     if (res.code !== 0) {
  //       mainStore.setSnackbar({
  //         title: "Error while updating the task",
  //         type: "error",
  //       });
  //     } else {
  //       if (key === 'status') {
  //         emit("onUpdate")
  //       }
  //     }
  //   })
  //   .catch((err) => {
  //     mainStore.setSnackbar({
  //       title: "Error while updating the task",
  //       type: "error",
  //     });
  //   });
};
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}
:deep() .v-table .v-table__wrapper > table > thead > tr > th {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep() .v-table .v-table__wrapper > table > thead > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep() .v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child),
.v-table .v-table__wrapper > table > tbody > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

.cursor-pointer {
  cursor: pointer;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
}
::v-deep(.small-input input) {
  font-size: 14px !important;
  font-family: "Poppins";
}
</style>
