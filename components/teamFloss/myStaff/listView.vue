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
                    <!-- Special handling for actions column with + icon -->
                    <template v-if="column.key === 'action'">
                      <v-menu :close-on-content-click="false" location="bottom">
                        <template #activator="{ props }">
                          <p v-bind="props" class="px-1 w-100" style="cursor: pointer; text-align: center;">
                            {{ column.title }}
                          </p>
                        </template>
                        <v-card class="pa-2" max-width="500">
                          <p class="mb-2" style="font-weight: 500;">Selected Columns</p>
                          <div class="d-flex flex-wrap">
                            <div
                              v-for="(item, index) in props.selectedHeaders.filter(h => h.key !== 'action' && h.key !== 'resend')"
                              :key="index"
                              class="color-box ma-1 pa-2 d-flex align-center justify-space-between position-relative"
                              :style="{ backgroundColor: getRandomHexColor(item.title) }"
                            >
                              <span style="color: white; font-size: 12px;">{{ item.title }}</span>
                              <v-icon
                                color="white"
                                size="16"
                                class="ml-2"
                                style="cursor: pointer;"
                                @click="removeHeaderFromSelected(item)"
                              >mdi-close-circle</v-icon>
                            </div>
                          </div>

                          <p class="mb-2 mt-3" style="font-weight: 500;">Available Columns</p>
                          <div class="d-flex flex-wrap">
                            <div
                              v-for="(item, index) in props.availableHeaders"
                              :key="index"
                              class="color-box ma-1 pa-2 d-flex align-center justify-center"
                              :style="{ backgroundColor: getRandomHexColor(item.title) }"
                              style="cursor: pointer;"
                              @click="addHeaderInSelected(item)"
                            >
                              <span style="color: white; font-size: 12px;">{{ item.title }}</span>
                            </div>
                            <p v-if="props.availableHeaders.length === 0" class="text-grey text-caption pa-2">
                              No available columns to add
                            </p>
                          </div>
                        </v-card>
                      </v-menu>
                    </template>
                    <template v-else>
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
                    </template>
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
                <v-chip 
                  label 
                  :style="getStatusChipStyle(getDisplayStatus(item))"
                >
                  {{ getDisplayStatus(item) }}
                </v-chip>
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
                  @click="openLoginHistoryModal(item)"
                >
                  View History
                </p>
              </div>
            </template>
            <template v-else-if="col.key === 'recruitmentDocs'">
              <p class="ml-2">{{ item.recruitmentDocs }}%</p>
            </template>

            <!-- New columns: email, phone, dob, cpdHours -->
            <template v-else-if="col.key === 'email'">
              <p class="ml-2">{{ item.email || '-' }}</p>
            </template>

            <template v-else-if="col.key === 'phone'">
              <p class="ml-2">{{ item.phone || item.mobile || '-' }}</p>
            </template>

            <template v-else-if="col.key === 'dob'">
              <p class="ml-2">{{ item.dob ? formattedDate(item.dob) : '-' }}</p>
            </template>

            <template v-else-if="col.key === 'cpdHours'">
              <p class="ml-2">{{ item.cpdHours !== null && item.cpdHours !== undefined ? item.cpdHours : '-' }}</p>
            </template>

            <template v-else-if="col.key === 'accountStatus'">
              <div class="text-center">
                <template v-if="(item.status || '').toLowerCase() !== 'invited'">
                  <v-chip 
                    label 
                    :style="getAccountStatusChipStyle(item)"
                  >
                    {{ getAccountStatusText(item) }}
                  </v-chip>
                </template>
                <!-- For invited users, show nothing in Account Status -->
              </div>
            </template>

            <template v-else-if="col.key === 'resend'">
              <div class="d-flex justify-center align-center pa-2" style="min-width: 100px;">
                <v-btn
                  v-if="item.status === 'Invited'"
                  size="small"
                  variant="flat"
                  color="primary"
                  @click="resendInvitation(item, org)"
                  :loading="resendingInvitation === item.id"
                  title="Resend Invitation"
                  class="resend-btn"
                  style="min-width: auto;"
                >
                  <span style="font-size: 12px;">Resend</span>
                </v-btn>
                <span v-else style="color: #ccc; font-size: 12px;">-</span>
              </div>
            </template>

            <template v-else-if="col.key === 'action'">
              <div class="d-flex justify-center align-center pa-2" style="min-width: 100px;">
                <!-- This column is for the + menu in the header, no content needed in cells -->
                <span style="color: #ccc; font-size: 12px;">-</span>
              </div>
            </template>

            <template v-else-if="col.key === 'userActions'">
              <div class="d-flex justify-center align-center pa-2 gap-2" style="min-width: 120px;">
                <!-- Show Activate or Deactivate based on current status -->
                <template v-if="(item.status || '').toLowerCase() !== 'invited'">
                  <v-tooltip :text="isUserActive(item) ? 'Deactivate User' : 'Activate User'" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        size="small"
                        variant="text"
                        icon
                        @click="isUserActive(item) ? $emit('deactivateUser', { org, user: item }) : $emit('activateUser', { org, user: item })"
                        class="action-btn"
                      >
                        <img 
                          v-if="isUserActive(item)"
                          src="@/assets/icons/teamfloss/userDetails/unpublish.svg" 
                          alt="Deactivate" 
                          width="16"
                          height="16"
                        />
                        <img 
                          v-else
                          src="@/assets/icons/teamfloss/userDetails/publish.svg" 
                          alt="Activate" 
                          width="16"
                          height="16"
                        />
                      </v-btn>
                    </template>
                  </v-tooltip>
                </template>
                
                <v-tooltip text="Delete User" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      variant="text"
                      icon
                      @click="$emit('deleteUser', { org, user: item })"
                      class="action-btn delete-btn"
                    >
                      <img 
                        src="@/assets/icons/teamfloss/shifts/delete.svg" 
                        alt="Delete" 
                        width="16"
                        height="16"
                      />
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </template>
        </v-data-table>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <!-- Login History Modal -->
  <TeamFlossMyStaffLoginHistoryModal
    v-model="showLoginHistoryModal"
    :user="selectedUserForHistory"
    :user-name="selectedUserForHistory?.fullName || ''"
  />
</template>

<script setup>
import { parsedDate } from "~/lib/dateFormatter";

const props = defineProps({
  teams: { type: Array, required: true },
  selectedHeaders: { type: Array, required: true },
  search: { type: String, default: "" },
  roleList: { type: Array, default: []},
  availableHeaders: { type: Array, default: () => [] }
});
const selectedStaff=ref([]);
const isAllSelected=ref(false);

const focusedField = ref({});

const openedPanels = ref([0]);
const authStore = useAuthStore()
const mainStore = useMainStore()
const emit = defineEmits(["add", "details", "onUpdate", "onUpdateHeaders", "deactivateUser", "activateUser", "deleteUser"]);

// Resend invitation state
const resendingInvitation = ref(null);

// Login History Modal state
const showLoginHistoryModal = ref(false);
const selectedUserForHistory = ref(null);

const openLoginHistoryModal = (user) => {
  selectedUserForHistory.value = user;
  showLoginHistoryModal.value = true;
};

const resendInvitation = async (user, org) => {
  if (!user || !org || !org.organisation) {
    mainStore.setSnackbar({
      title: "Invalid user or organization",
      type: "error",
    });
    return;
  }

  resendingInvitation.value = user.id;
  
  try {
    const res = await authStore.resendOrganisationInvitation({
      userId: user.id,
      orgId: org.organisation.id,
    });

    if (res.code === 0) {
      mainStore.setSnackbar({
        title: res?.data?.message || "Invitation resent successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res?.data?.message || res?.message || "Failed to resend invitation",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err?.message || "Something went wrong",
      type: "error",
    });
  } finally {
    resendingInvitation.value = null;
  }
};

// Track sorting state
const sortBy = ref([]);
const sortDesc = ref([]);

const getDisplayStatus = (user) => {
  // If membership in this org is pending, treat as Invited regardless of global user.status
  if (user?.isActive === false) return 'Invited';
  const s = (user?.status || 'Active').toLowerCase();
  return s === 'invited' ? 'Invited' : 'Active';
};

const formattedDate = (dateStr) => {
  return parsedDate(dateStr);
};

// Get status chip styling based on status
const getStatusChipStyle = (status) => {
  const statusLower = (status || 'Active').toLowerCase();
  let color, bgColor;
  
  if (statusLower === 'active') {
    color = 'hsla(124, 57%, 46%, 1)';
    bgColor = 'hsla(124, 57%, 46%, 0.1)';
  } else if (statusLower === 'invited') {
    color = 'hsla(29, 100%, 50%, 1)';
    bgColor = 'hsla(29, 100%, 50%, 0.1)';
  } else if (statusLower === 'deactivated' || statusLower === 'disabled') {
    color = 'hsla(357, 100%, 57%, 1)';
    bgColor = 'hsla(357, 100%, 57%, 0.1)';
  } else if (statusLower === 'expired') {
    color = '#6b7280';
    bgColor = 'rgba(107, 114, 128, 0.1)';
  } else {
    // Default to Active colors
    color = 'hsla(124, 57%, 46%, 1)';
    bgColor = 'hsla(124, 57%, 46%, 0.1)';
  }
  
  return {
    color: color,
    backgroundColor: bgColor,
  };
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
        // Force refresh to avoid cached results
        emit("onUpdate", { force: true });
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

// Column management functions
const getRandomHexColor = (name) => {
  if (!name) return "#999999";
  const firstChar = name.trim().charAt(0).toUpperCase();
  const colors = [
    "#FF6B6B", "#FF8E72", "#FFD93D", "#6BCB77", "#4D96FF", "#8358E8",
    "#FF6EC7", "#00B8A9", "#F15BB5", "#FF7F11", "#FF9F1C", "#2EC4B6",
    "#6A4C93", "#8338EC", "#3A86FF", "#FF006E", "#FB5607", "#FFBE0B",
    "#06D6A0", "#118AB2", "#073B4C", "#EF476F", "#06AED5", "#4CC9F0",
    "#8AC926", "#FF595E"
  ];
  const index = firstChar.charCodeAt(0) - 65;
  return index >= 0 && index < 26 ? colors[index] : "#999999";
};

const addHeaderInSelected = (column) => {
  const currentHeaders = [...props.selectedHeaders];
  if (!currentHeaders.find((x) => x.key === column.key)) {
    // Insert before the resend and action columns
    const resendIndex = currentHeaders.findIndex(h => h.key === 'resend');
    const actionIndex = currentHeaders.findIndex(h => h.key === 'action');
    const insertIndex = resendIndex !== -1 ? resendIndex : (actionIndex !== -1 ? actionIndex : currentHeaders.length);
    currentHeaders.splice(insertIndex, 0, column);
    emit('onUpdateHeaders', currentHeaders);
  }
};

const removeHeaderFromSelected = (column) => {
  // Prevent removing the resend and action columns
  if (column.key === 'resend' || column.key === 'action') {
    return;
  }
  const currentHeaders = [...props.selectedHeaders];
  const index = currentHeaders.findIndex((h) => h.key === column.key);
  if (index !== -1) {
    currentHeaders.splice(index, 1);
    emit('onUpdateHeaders', currentHeaders);
  }
};

// Available headers are now computed in the parent component

// Helper functions for account status
const isUserActive = (user) => {
  // Account active is based on account-level deactivation flag (isAccountDeactivated)
  return user.isAccountDeactivated !== true;
};

// Only show Active or Deactivated in Account Status to avoid duplicating onboarding Status
const getAccountStatusText = (user) => {
  return isUserActive(user) ? "Active" : "Deactivated";
};

// Match styling to the Status chip visuals
const getAccountStatusChipStyle = (user) => {
  const statusLower = getAccountStatusText(user).toLowerCase();
  let color, bgColor;
  if (statusLower === 'active') {
    color = 'hsla(124, 57%, 46%, 1)';
    bgColor = 'hsla(124, 57%, 46%, 0.1)';
  } else {
    // deactivated
    color = 'hsla(357, 100%, 57%, 1)';
    bgColor = 'hsla(357, 100%, 57%, 0.1)';
  }
  return {
    color,
    backgroundColor: bgColor,
  };
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

.color-box {
  border-radius: 6px;
  min-width: 80px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.color-box:hover {
  opacity: 0.8;
}

.action-btn {
  min-width: 32px !important;
  height: 32px !important;
  padding: 4px !important;
  border-radius: 6px !important;
  transition: background-color 0.2s ease !important;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.action-btn.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1) !important;
}
</style>
