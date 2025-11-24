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
          :items="getSortedUsers(org.orgUsers)"
          item-value="id"
          v-model="selectedStaff"
          :item-selectable="() => true"
           @update:modelValue="onSelectionChange"
            return-object
            show-select
          hover
        >
        <template
              v-slot:[`item.data-table-select`]="{
                internalItem,
                isSelected,
                toggleSelect,
              }"
            >
            <div class="text-center">

              <input
                type="checkbox"
                :checked="isSelected(internalItem)"
                @change="() => toggleSelect(internalItem)"
                class="cust-checkbox"
              />
            </div>
            </template>
          <!-- Editable / resizable headers -->
          <template
            v-slot:headers="{
              columns,
              getSortIcon,
              toggleSort: originalToggleSort,
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
                      color="black"
                      style="cursor: pointer"
                      class="ml-2"
                      @click.stop="handleSort(column, originalToggleSort)"
                    >
                      {{ getSortIcon(column) }}
                    </v-icon>
                    <span
                      class="resize-handle"
                      @mousedown="startResize($event, column)"
                    ></span> 
                  </div>
                  <div
                      v-if=" i === 0"
                      class="d-flex align-center justify-center"
                    >
                      <input
                        type="checkbox"
                        class="cust-checkbox"
                        style="margin-left: 2px;"
                        :checked="allSelected"
                        :indeterminate.prop="someSelected && !allSelected"
                        @change="toggleAll"
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
            <template v-if="col.key === 'fullName'">
              <div class="pa-1 d-flex justify-space-between align-center">
                <v-text-field
                  v-model="item.fullName"
                  :variant="isFocused(item.id, 'fullName') ? 'outlined' : 'plain'"
                  @focus="setFocus(item.id, 'fullName', true)"
                  @blur="updateValueRow(item, 'fullName')"
                  @keyup.enter="updateUser(item, 'fullName')"
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

            <template v-else-if="col.key === 'role.title'">
              <!-- <p class="ml-2 mb-0" @click="()=>{console.log(item)}">{{ item.role.title.slice(0, 20) }}</p> -->
              <DataTableColumnsRoles
                :selected="item"
                :column="col"
                :rolesList="roleList"
                @update="updateUser(item, 'role')"
              />
            </template>

            <template v-else-if="col.key === 'createdAt'">
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
  roleList: { type: Array, default: []}
});
const selectedStaff=ref([]);
const isAllSelected=ref(false);

const focusedField = ref({});

const openedPanels = ref([0]);
const authStore = useAuthStore()
const mainStore = useMainStore()
const emit = defineEmits(["add", "details", "onUpdate"]);

// Track sorting state
const sortBy = ref([]);
const sortDesc = ref([]);

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
  setFocus(row.id, key, false);
};
const updateUser = (user, key) => {
  setFocus(user.id, key, false);
  // Ensure we have the id field and only send necessary fields
  const updateData = {
    id: user.id,
    roleId: user.roleId,
  };
  authStore
    .updateProfile(updateData)
    .then((res) => {
      if (res.code === 0) {
        mainStore.setSnackbar({
          title: res?.data?.message || "Profile updated successfully",
          type: "success",
        });
        // Emit event to refresh the teams data
        emit("onUpdate");
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update profile",
          type: "error",
        })
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err?.message || "Something went wrong",
        type: "error",
      })
    })
}
const toggleAll = () => {
  if (isAllSelected.value) {
    isAllSelected.value = false;
    selectedStaff.value = [];
  } else {
    const selected = [];
    props.teams.forEach((el) => {
      el.orgUsers.forEach((u) => {
        selected.push(u);
      });
    });
    selectedStaff.value = selected;
    isAllSelected.value = true;
  }
   console.log(selectedStaff.value)
};
const onSelectionChange = (newSelected) => {
  console.log( selectedStaff.value);
};

// Handle sorting with custom logic
const handleSort = (column, originalToggleSort) => {
  // Call original toggle to update Vuetify's internal state
  originalToggleSort(column);
  
  // Update our custom sort state
  const index = sortBy.value.indexOf(column.key);
  if (index === -1) {
    // New sort column
    sortBy.value = [column.key];
    sortDesc.value = [false];
  } else {
    // Toggle existing sort
    if (sortDesc.value[index]) {
      // Remove sort
      sortBy.value.splice(index, 1);
      sortDesc.value.splice(index, 1);
    } else {
      // Toggle to descending
      sortDesc.value[index] = true;
    }
  }
};

// Custom sort function for nested properties
const getSortedUsers = (users) => {
  if (!sortBy.value || sortBy.value.length === 0) return users;
  
  const sorted = [...users].sort((a, b) => {
    for (let i = 0; i < sortBy.value.length; i++) {
      const key = sortBy.value[i];
      const desc = sortDesc.value[i];
      
      let aVal, bVal;
      
      // Handle nested properties like "role.title"
      if (key.includes('.')) {
        const keys = key.split('.');
        aVal = keys.reduce((obj, k) => obj?.[k], a);
        bVal = keys.reduce((obj, k) => obj?.[k], b);
      } else {
        aVal = a[key];
        bVal = b[key];
      }
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return desc ? -1 : 1;
      if (bVal == null) return desc ? 1 : -1;
      
      // Handle date sorting
      if (key === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      // Handle string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
    }
    return 0;
  });
  
  return sorted;
};

// Column resizing functionality
let currentCol = null;
let startX = 0;
let startWidth = 0;

const startResize = (e, column) => {
  e.preventDefault();
  e.stopPropagation();
  currentCol = column;
  startX = e.clientX;
  startWidth = column.width;
  
  document.addEventListener('pointermove', resizeColumn);
  document.addEventListener('pointerup', stopResize);
  e.target.setPointerCapture(e.pointerId);
};

const resizeColumn = (e) => {
  if (!currentCol) return;
  const diff = e.clientX - startX;
  const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
  currentCol.width = newWidth;
};

const stopResize = (e) => {
  currentCol = null;
  document.removeEventListener('pointermove', resizeColumn);
  document.removeEventListener('pointerup', stopResize);
  if (e.target.releasePointerCapture) {
    e.target.releasePointerCapture(e.pointerId);
  }
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
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
