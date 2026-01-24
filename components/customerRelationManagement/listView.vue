<template>
  <div class="lead-panels">
    <v-expansion-panels
      v-model="openedPanels"
      :elevation="0"
      flat
      multiple
      class="table-panels"
    >
      <v-expansion-panel rounded="lg" class="border-sm pb-1">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-chip color="primary" label>
                <v-icon class="mr-2">mdi-account-multiple</v-icon>
                My Leads
              </v-chip>
              <v-chip class="ml-2" color="primary" label>
                {{ activeLeads.length }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pt-0">
          <v-data-table
            v-model="selectedLeads"
            :headers="headers"
            :items="activeLeads"
            item-value="id"
            show-select
            hover
            class="resizable-table"
            density="compact"
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
                      minWidth: column.width + 'px',
                      padding: '0px 7px',
                      fontSize: '14px',
                      backgroundColor: '#F6F6F6',
                      position: 'relative',
                    }"
                  >
                    <div v-if="i !== 0" class="d-flex align-center th-content">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>

                      <span
                        class="resize-handle"
                        @pointerdown="startResize($event, column, i)"
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
              <!-- Name column with expand icon and inline edit -->
              <template v-if="col.key === 'name'">
                <div class="pa-1 d-flex justify-space-between align-center">
                  <input
                    v-if="editingCell.id === item.id && editingCell.field === 'name'"
                    v-model="editingCell.value"
                    @blur="saveEdit(item, 'name')"
                    @keyup.enter="saveEdit(item, 'name')"
                    @keyup.esc="cancelEdit"
                    class="inline-edit-input"
                    ref="editInput"
                    autofocus
                  />
                  <p 
                    v-else 
                    class="ml-2 mb-0 editable-field" 
                    @click="startEdit(item, 'name')"
                  >
                    {{ item.name || 'Click to edit' }}
                  </p>
                  <img
                    src="@/assets/dashboard/expandIcon.svg"
                    alt="Expand"
                    class="ml-2 cursor-pointer"
                    @click="openLeadDialog(item)"
                  />
                </div>
              </template>

              <!-- Email column with inline edit -->
              <template v-else-if="col.key === 'email'">
                <div class="pa-1">
                  <input
                    v-if="editingCell.id === item.id && editingCell.field === 'email'"
                    v-model="editingCell.value"
                    @blur="saveEdit(item, 'email')"
                    @keyup.enter="saveEdit(item, 'email')"
                    @keyup.esc="cancelEdit"
                    type="email"
                    class="inline-edit-input"
                    ref="editInput"
                    autofocus
                  />
                  <p 
                    v-else 
                    class="ml-2 mb-0 editable-field" 
                    @click="startEdit(item, 'email')"
                  >
                    {{ item.email || 'Click to edit' }}
                  </p>
                </div>
              </template>

              <!-- Telephone column with inline edit -->
              <template v-else-if="col.key === 'telephone'">
                <div class="pa-1">
                  <input
                    v-if="editingCell.id === item.id && editingCell.field === 'telephone'"
                    v-model="editingCell.value"
                    @blur="saveEdit(item, 'telephone')"
                    @keyup.enter="saveEdit(item, 'telephone')"
                    @keyup.esc="cancelEdit"
                    type="tel"
                    class="inline-edit-input"
                    ref="editInput"
                    autofocus
                  />
                  <p 
                    v-else 
                    class="ml-2 mb-0 editable-field" 
                    @click="startEdit(item, 'telephone')"
                  >
                    {{ item.telephone || 'Click to edit' }}
                  </p>
                </div>
              </template>

              <!-- Comment column with scrollable cell -->
              <template v-else-if="col.key === 'comments'">
                <div class="comment-cell-wrapper pa-1" @click="startEdit(item, 'comments')">
                  <div class="comment-scrollable">
                    {{ item.comments || 'Click to add comment' }}
                  </div>
                  <v-icon size="14" class="comment-edit-icon">mdi-pencil</v-icon>
                </div>
                
                <!-- Edit Dialog -->
                <v-dialog
                  v-model="commentMenus[item.id]"
                  max-width="500"
                  :retain-focus="false"
                >
                  <v-card class="pa-4">
                    <v-card-title class="text-subtitle-1 pa-0 mb-3 d-flex justify-space-between align-center">
                      <span>Edit Comment</span>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="cancelEdit"
                      >
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-textarea
                      v-model="editingCell.value"
                      variant="outlined"
                      density="comfortable"
                      rows="5"
                      hide-details
                      autofocus
                      placeholder="Enter comment..."
                      @keyup.esc="cancelEdit"
                    />
                    <v-card-actions class="pa-0 mt-3">
                      <v-spacer />
                      <v-btn
                        variant="text"
                        @click="cancelEdit"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        color="primary"
                        variant="flat"
                        @click="saveEdit(item, 'comments')"
                      >
                        Save
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </template>

              <template v-else-if="col.key === 'alert'">
                <DataTableColumnsAlerts :selected="item" @update="updateValueRow(item, 'alert')" />
              </template>
              <template v-else-if="col.key === 'leadStatus'">
                <div 
                  :style="`background-color: ${getLeadStatusColor(item.leadStatus)}; height: 100%;`"
                  class="pa-1 d-flex align-center"
                >
                  <v-menu
                    v-model="item.statusMenu"
                    :close-on-content-click="false"
                    offset-y
                  >
                    <template #activator="{ props }">
                      <p v-bind="props" style="width: 100%; cursor: pointer; color: white;" class="mb-0">
                        {{ item.leadStatus || 'Select Status' }}
                      </p>
                    </template>

                    <v-card width="250" class="pa-4">
                      <v-list>
                        <v-list-item
                          v-for="(status, i) in leadStatusOptions"
                          :key="i"
                          :style="`background-color: ${status.color}; color:#fff; margin-bottom: 6px; min-height: 30px;`"
                          class="rounded-sm"
                          @click="() => {
                            item.leadStatus = status.name;
                            item.statusMenu = false;
                            updateValueRow(item, 'leadStatus');
                          }"
                        >
                          <v-list-item-title>{{ status.name }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-menu>
                </div>
              </template>
              <template v-else-if="col.key === 'leadSource'">
                <DataTableColumnsLeadSource
                  :leadSources="leadSources"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'leadSource')"
                />
              </template>
              <template v-else-if="col.key === 'metaPage'">
                <div class="pa-1 d-flex align-center">
                  <v-chip
                    v-if="item.metaPage"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    label
                  >
                    {{ item.metaPage }}
                  </v-chip>
                  <span v-else class="text-medium-emphasis">—</span>
                </div>
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
                <div class="pa-1">
                  <DataTableColumnsAssignedUsers
                    :user-task-id="item.id"
                    :assigned-users="item.assigned || [user]"
                    :all-users="getLeadUsers(item)"
                    :current-user="user"
                    @assign="assignLead(item, $event)"
                    @unassign="unAssign(item, $event)"
                    @add-staff="openAddStaff"
                  />
                </div>
              </template>
              <!-- Default renderer for other columns -->
              <template v-else-if="col.key === 'inquiryDate'">
                <div class="pa-1">
                  <p class="mb-0 text-center">{{ formatDate(item[col.key]) }}</p>
                </div>
              </template>
              <template v-else-if="col.key === 'followUpDate'">
                <div class="pa-1">
                  <DataTableColumnsDueDate
                    :model-value="item.followUpDate"
                    @update:modelValue="(val) => updateFollowUpDate(item, val)"
                  />
                </div>
              </template>
              <template v-else>
                <p class="ml-2 mb-0">{{ item[col.key] }}</p>
              </template>
            </template>
          </v-data-table>
          <v-card
            v-if="selectedLeads.length"
            class="action-bar py-4 d-flex justify-center align-center rounded-lg"
            style="padding: 0px 50px; gap: 40px;"
            :elevation="5"
            flat
          >
            <div class="selected-count d-flex align-center">
              <span class="selected-text">
                {{ selectedLeads.length }}
              </span>
              <p class="ml-3 mt-1">Items Selected</p>
            </div>

    <div class="actions-container d-flex align-center" style="gap: 8px;">
      <div
        v-for="(action, i) in actions"
        :key="i"
        class="action-item d-flex flex-column align-center"
        @click="onActionClick(action.key)"
      >
        <img :src="action.icon" :alt="action.label" class="action-icon" />
        <span class="action-label">{{ action.label }}</span>
      </div>

      <v-divider vertical class="mx-2" style="height: 40px;" />

      <div class="action-item d-flex flex-column align-center" @click="closeTray">
        <v-icon size="20" color="#6d6d6d">mdi-close</v-icon>
        <span class="action-label">Close</span>
      </div>
    </div>

          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel
        v-if="canViewArchive"
        rounded="lg"
        class="border-sm pb-1"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-chip color="#9E9E9E" label>
                <v-icon class="mr-2">mdi-archive-outline</v-icon>
                Archived Leads
              </v-chip>
              <v-chip class="ml-2" color="#9E9E9E" label>
                {{ archivedLeads.length }}
              </v-chip>
            </div>
            <span class="text-caption text-medium-emphasis">Visible to Owner & Manager</span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="pt-0">
          <v-alert
            v-if="!archivedLeads.length"
            type="info"
            variant="tonal"
            class="mb-2"
          >
            No archived records yet.
          </v-alert>
          <v-data-table
            v-else
            v-model="selectedArchivedLeads"
            :headers="headers"
            :items="archivedLeads"
            item-value="id"
            hover
            class="resizable-table"
            density="compact"
            show-select
            :item-selectable="() => false"
            @update:model-value="onArchivedSelectionChange"
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
                disabled
                @change="() => toggleSelect(internalItem)"
                class="cust-checkbox"
              />
            </template>
            <template v-slot:headers="{ columns, allSelected, someSelected }">
              <tr>
                <template v-for="(column, i) in columns" :key="column.key">
                  <th
                    :style="{
                      width: column.width + 'px',
                      minWidth: column.width + 'px',
                      padding: '0px 7px',
                      fontSize: '14px',
                      backgroundColor: '#F6F6F6',
                      position: 'relative',
                    }"
                  >
                    <div v-if="i !== 0" class="d-flex align-center th-content">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                      <span
                        class="resize-handle"
                        @pointerdown="startResize($event, column, i)"
                      ></span>
                    </div>
                    <div v-else class="d-flex justify-center">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allSelected"
                        :indeterminate.prop="someSelected && !allSelected"
                        disabled
                        @change="toggleAllArchived"
                      />
                    </div>
                  </th>
                </template>
              </tr>
            </template>
            <template
              v-for="col in headers"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <template v-if="col.key === 'name'">
                <div class="pa-1 d-flex justify-space-between align-center">
                  <p class="ml-2 mb-0 font-weight-medium">{{ item.name }}</p>
                </div>
              </template>
              <template v-else-if="col.key === 'inquiryDate' || col.key === 'followUpDate'">
                <p class="ml-2 mb-0">{{ formatDate(item[col.key]) }}</p>
              </template>
              <template v-else-if="col.key === 'comments'">
                <p class="ml-2 mb-0 comment-text">{{ item.comments }}</p>
              </template>
              <template v-else-if="col.key === 'leadStatus'">
                <v-chip label size="small" color="primary" variant="tonal" class="ml-2">
                  {{ item.leadStatus || 'Archived' }}
                </v-chip>
              </template>
              <template v-else-if="col.key === 'alert'">
                <DataTableColumnsAlerts :selected="item" />
              </template>
              <template v-else-if="col.key === 'metaPage'">
                <v-chip v-if="item.metaPage" label size="small" color="primary" variant="tonal" class="ml-2">
                  {{ item.metaPage }}
                </v-chip>
                <span v-else class="ml-2 text-medium-emphasis">—</span>
              </template>
              <template v-else-if="col.key === 'assigned'">
                <p class="ml-2 mb-0">{{ formatAssignedUsers(item.assigned) }}</p>
              </template>
              <template v-else-if="col.key === 'treatment'">
                <p class="ml-2 mb-0">{{ formatTreatmentValue(item.treatment) }}</p>
              </template>
              <template v-else>
                <p class="ml-2 mb-0">{{ item[col.key]?.name || item[col.key] }}</p>
              </template>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <CustomerRelationManagementLeadDetailsDialog
      v-if="showLeadDetailDialog"
      v-model="showLeadDetailDialog"
      :selected-lead="selectedLead"
      @close="showLeadDetailDialog = false"
    />

    <v-dialog v-model="showCompose" max-width="900px">
      <v-card class="rounded-lg">
        <div class="d-flex justify-space-between align-center px-4 py-3">
          <div>
            <h5 class="mb-1 modal-title">Compose mail</h5>
            <div class="text-caption text-medium-emphasis">{{ compose.recipients.length }} recipient(s)</div>
          </div>
          <v-btn icon @click="showCompose = false" flat><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <div class="px-4 pt-4">
          <div class="text-subtitle-2 text-grey-darken-1 mb-1">To</div>
          <div class="d-flex align-center flex-wrap" style="gap: 6px">
            <v-chip size="small" v-for="(e,i) in compose.recipients" :key="i" color="primary" variant="tonal">{{ e }}</v-chip>
          </div>
        </div>

        <div class="px-4 pt-4">
          <v-text-field v-model="compose.subject" single-line label="Subject" density="compact" variant="outlined" hide-details />
        </div>

        <div class="px-4 pt-2 pb-4">
          <div class="text-subtitle-2 text-grey-darken-1 mb-2">Content</div>
          <div ref="composeHolder" class="editor"></div>
        </div>

        <div class="px-4 pb-4 d-flex justify-end">
          <v-btn :loading="composeLoading" flat color="primary" @click="sendCompose">Send</v-btn>
        </div>
      </v-card>
    </v-dialog>
    <CommonConfirmDialog
      v-model="confirmArchive"
      title="Archive leads?"
      :loading="archiving"
      :message="`Archive ${selectedLeads.length} lead(s)? They will move to the Archived table.`"
      @confirm="doArchive"
      @cancel="confirmArchive = false"
    />
    <CommonConfirmDialog
      v-model="confirmDelete"
      title="Delete leads?"
      :loading="deleting"
      :message="`Are you sure you want to delete ${selectedLeads.length} lead(s)?`"
      @confirm="doDelete"
      @cancel="confirmDelete = false"
    />
    <TeamFlossSideBarAddNewstaff
      v-model="addStaffDrawer"
      :rolesList="rolesList"
      @success="onStaffAdded"
      @close="addStaffDrawer = false"
    />
  </div>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'
import { buildRecipientContext, renderWithContext } from '@/lib/templateTokens'
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
import { formatAssignedUsers, formatTreatmentValue } from "@/lib/misc";
import callIcon from '@/assets/crm/call.svg'
import sendMailIcon from '@/assets/crm/sendMail.svg'
import whatsappIcon from '@/assets/crm/whatsapp.svg'
import bookIcon from '@/assets/crm/book.svg'
import sendPriceIcon from '@/assets/crm/sendPrice.svg'
import sendFormIcon from '@/assets/crm/sendForm.svg'
import shareLocationIcon from '@/assets/crm/shareLocation.svg'
import convertIcon from '@/assets/crm/convert.svg'
import archiveIcon from '@/assets/crm/archive.svg'
import deleteIcon from '@/assets/crm/delete.svg'
const crmStore = useCrmStore();
const { user } = useUser();
const emit = defineEmits(['select','openLead','delete','book']);
const props = defineProps({
  leads: { type: Array, required: true },
  headers: { type: Array, required: true },
  search: { type: String, default: '' },
  leadSources: { type: Array, required: true },
  treatmentSources: { type: Array, required: true },
  users: { type: Array, required: true },
});
const openedPanels = ref([0]);
const selectedLeads = ref([]);
const isAllSelected = ref(false);
const selectedArchivedLeads = ref([]);
const isAllArchived = ref(false);
const showLeadDetailDialog = ref(false);
const selectedLead = ref({});
const commentMenus = reactive({});

const leadStatusOptions = [
  { name: 'New', color: '#36a863' },
  { name: 'Contacted', color: '#f6a609' },
  { name: 'Converted', color: '#0061fb' },
  { name: 'Lost', color: '#e15b64' },
  { name: 'Archived', color: '#9E9E9E' },
];

const getLeadStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  const match = leadStatusOptions.find(s => s.name.toLowerCase() === statusLower);
  return match ? match.color : '#0061fb';
};
const isArchivedLead = (lead) => {
  const status = (lead?.leadStatus || '').toLowerCase();
  return !!lead?.softDeleted || status === 'archived';
};
const activeLeads = computed(() =>
  (props.leads || []).filter((l) => !isArchivedLead(l))
);
const archivedLeads = computed(() =>
  (props.leads || []).filter((l) => isArchivedLead(l))
);
const canViewArchive = computed(() => [1, 8].includes(user.value?.roleId));

// Inline editing state
const editingCell = reactive({
  id: null,
  field: null,
  value: null,
  originalValue: null
});

const actions = [
  // { key: "call", label: "Call", icon: callIcon },
  { key: "mail", label: "Send Mail", icon: sendMailIcon },
  { key: "whatsapp", label: "WhatsApp", icon: whatsappIcon },
  { key: "book", label: "Book", icon: bookIcon },
  { key: "sendPrice", label: "Send Price", icon: sendPriceIcon },
  { key: "sendForm", label: "Send Form", icon: sendFormIcon },
  { key: "shareLocation", label: "Share Location", icon: shareLocationIcon },
  { key: "convert", label: "Convert", icon: convertIcon },
  { key: "archive", label: "Archive", icon: archiveIcon },
  { key: "delete", label: "Delete", icon: deleteIcon },
];
const confirmDelete = ref(false);
const deleting = ref(false);
const confirmArchive = ref(false);
const archiving = ref(false);
const converting = ref(false);
const addStaffDrawer = ref(false);
const rolesList = ref([]);

// Inline editing functions
const startEdit = (item, field) => {
  editingCell.id = item.id;
  editingCell.field = field;
  editingCell.value = item[field] || '';
  editingCell.originalValue = item[field] || '';
  
  if (field === 'comments') {
    commentMenus[item.id] = true;
  }
};

const cancelEdit = () => {
  const itemId = editingCell.id;
  const field = editingCell.field;
  
  editingCell.id = null;
  editingCell.field = null;
  editingCell.value = null;
  editingCell.originalValue = null;
  
  if (field === 'comments' && itemId) {
    commentMenus[itemId] = false;
  }
};

const saveEdit = async (item, field) => {
  // Check if value actually changed
  if (editingCell.value === editingCell.originalValue) {
    cancelEdit();
    if (field === 'comments') {
      commentMenus[item.id] = false;
    }
    return;
  }

  try {
    const payload = { 
      id: item.id,
      [field]: editingCell.value
    };
    
    const res = await crmStore.updateLead(payload);
    
    if (res?.code === 0) {
      // Update local item
      item[field] = editingCell.value;
      if (mainStore?.setSnackbar) {
        mainStore.setSnackbar({ title: 'Updated successfully', type: 'success' });
      }
    }
  } catch (e) {
    console.error('Failed to update:', e);
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({ title: 'Failed to update', type: 'error' });
    }
  } finally {
    cancelEdit();
    if (field === 'comments') {
      commentMenus[item.id] = false;
    }
  }
};

const onActionClick = (key) => {
  if (!selectedLeads.value.length) return;
  if (key === 'book') {
    emit('book', [...selectedLeads.value])
  }
  else if (key === 'delete') confirmDelete.value = true;
  else if (key === 'archive') confirmArchive.value = true;
  else if (key === 'convert') convertSelected();
  else if (['mail','sendPrice','sendForm','shareLocation'].includes(key)) openCompose(key)
};

const formatDate = (d) => {
  return formatDateDDMMYYYY(d);
};

const updateFollowUpDate = async (item, value) => {
  if (!value) return;
  try {
    const res = await crmStore.updateLead({ id: item.id, followUpDate: value });
    if (res?.code === 0) {
      item.followUpDate = value;
      if (mainStore?.setSnackbar) {
        mainStore.setSnackbar({ title: 'Follow-up date updated', type: 'success' });
      }
    }
  } catch (e) {
    console.error('Failed to update follow up date', e);
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({ title: 'Failed to update date', type: 'error' });
    }
  }
};
const onSelect = (selection) => {
  console.log(selection);
};
const toggleAll = () => {
  // Check if all active leads are currently selected
  const allCurrentlySelected = activeLeads.value.length > 0 && 
    activeLeads.value.every((lead) => 
      selectedLeads.value.some((sel) => sel.id === lead.id)
    );

  if (allCurrentlySelected) {
    // Deselect all
    isAllSelected.value = false;
    selectedLeads.value = [];
  } else {
    // Select all active leads
    selectedLeads.value = [...activeLeads.value];
    isAllSelected.value = true;
  }
};
const toggleAllArchived = () => {
  isAllArchived.value = false;
  selectedArchivedLeads.value = [];
};
const onArchivedSelectionChange = () => {
  if (selectedArchivedLeads.value.length) {
    selectedArchivedLeads.value = [];
  }
};
const closeTray = () => {
  isAllSelected.value = false;
  selectedLeads.value = [];
  isAllArchived.value = false;
  selectedArchivedLeads.value = [];
  confirmArchive.value = false;
};
const isResizing = ref(false);
let startX = 0;
let startWidth = 0;
let currentCol = null;

const startResize = (e, col, i) => {
  e.stopPropagation();
  e.preventDefault();
  
  isResizing.value = true;
  currentCol = col;
  startX = e.clientX;
  startWidth = col.width;
  
  document.addEventListener('pointermove', resizeColumn);
  document.addEventListener('pointerup', stopResize);
};

const resizeColumn = (e) => {
  if (!isResizing.value || !currentCol) return;
  const diff = e.clientX - startX;
  currentCol.width = Math.max(120, startWidth + diff);
};

const stopResize = (e) => {
  isResizing.value = false;
  document.removeEventListener('pointermove', resizeColumn);
  document.removeEventListener('pointerup', stopResize);
  currentCol = null;
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
};

// Compose mail dialog using Editor.js (client-only)
const showCompose = ref(false)
const composeLoading = ref(false)
const composeHolder = ref(null)
let composeEditor = null
let EditorCtor = null
let Header = null
let List = null
const compose = reactive({ key: 'mail', subject: '', recipients: [], html: '' })

const defaultTemplates = {
  sendPrice: {
    subject: 'Price List',
    html: `<p>Dear [Patient Name],</p>
<p>Thank you for contacting us. We appreciate your interest in our practice and are delighted that you're considering us for your dental care needs.</p>
<p>As requested, please find our practice price list attached to this email. We believe in transparent pricing and strive to make quality dental care accessible to all our patients.</p>
<p>If you have any questions about our services, pricing, or would like to schedule an appointment, please don't hesitate to reach out. Our friendly team is here to assist you and ensure you receive the best possible care.</p>
<p>We look forward to welcoming you to our practice and helping you achieve a healthy, beautiful smile.</p>
<p>Warm regards,<br/>[Your Name]</p>`
  },
  shareLocation: {
    subject: 'Our Clinic Location',
    html: `<p>Dear [Patient Name],</p>
<p>Thank you for your interest in visiting our dental clinic. We're conveniently located and easy to find.</p>
<p><strong>Our Address:</strong><br/>[Street Address]<br/>[City, State ZIP Code]</p>
<p><strong>Office Hours:</strong><br/>[Days and Times]</p>
<p>Parking is available [on-site/nearby/street parking details], and our clinic is easily accessible by [public transportation details if applicable].</p>
<p>If you need directions or have any questions about finding us, please feel free to call us at [Phone Number]. We're happy to help guide you to our location.</p>
<p>We look forward to seeing you soon!</p>
<p>Best regards,<br/>[Your Name]</p>`
  },
  sendForm: { subject: 'Form Request', html: `<p>Dear [Patient Name],</p><p>Please complete the attached form at your convenience. This helps us prepare for your visit.</p><p>Thank you,<br/>[Your Name]</p>` },
  book: { subject: 'Appointment Booking', html: `<p>Dear [Patient Name],</p><p>We'd love to arrange your appointment. Please reply with your preferred date/time, or book via our online portal.</p><p>Thank you,<br/>[Your Name]</p>` },
  mail: { subject: 'Message from our practice', html: `<p>Dear [Patient Name],</p><p>Write your message here.</p><p>Regards,<br/>[Your Name]</p>` },
}


async function openCompose(actionKey) {
  compose.key = actionKey
  const emails = (selectedLeads.value || []).map(l => l?.email).filter(Boolean)
  compose.recipients = [...new Set(emails)]
  const def = defaultTemplates[actionKey] || defaultTemplates.mail
  // Personalize subject/body for preview based on selection
  const many = (selectedLeads.value || []).length !== 1
  const lead = many ? null : (selectedLeads.value || [])[0]
  const ctx = buildRecipientContext({ lead, user, many })
  compose.subject = renderWithContext(def.subject, ctx)
  compose.html = renderWithContext(def.html, ctx)
  showCompose.value = true
  await nextTick()
  if (typeof window === 'undefined') return
  if (!EditorCtor || !Header || !List) {
    const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
    ])
    EditorCtor = E; Header = H; List = L
  }
  if (composeEditor) { composeEditor.destroy(); composeEditor = null }
  composeEditor = new EditorCtor({
    holder: composeHolder.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(compose.html),
    async onChange(api) {
      const saved = await api.saver.save()
      compose.html = blocksToHtml(saved)
    }
  })
}

watch(() => showCompose.value, (v) => { if (!v && composeEditor) { composeEditor.destroy(); composeEditor = null } })

const mainStore = useMainStore?.() || null
const openAddStaff = async () => {
  addStaffDrawer.value = true;
  if (rolesList.value.length || !mainStore?.getRoles) return;
  try {
    const res = await mainStore.getRoles();
    if (res?.code === 0 && res.data) rolesList.value = res.data;
  } catch (e) {}
};
const onStaffAdded = () => {
  addStaffDrawer.value = false;
};
async function sendCompose() {
  try {
    composeLoading.value = true
    const leadIds = selectedLeads.value.map(l => l.id)
    const many = (selectedLeads.value || []).length !== 1
    const lead = many ? null : (selectedLeads.value || [])[0]
    const ctx = buildRecipientContext({ lead, user, many })
    const resolvedSubject = renderWithContext(compose.subject, ctx)
    const resolvedHtml = renderWithContext(compose.html, ctx)
    const res = await crmStore.sendLeadMail({ leadIds, subject: resolvedSubject, html: resolvedHtml, key: `manual_${compose.key}` })
    if (res && res.code === 0) {
      if (mainStore && mainStore.setSnackbar) mainStore.setSnackbar({ title: `Mail sent to ${res.data?.sent || compose.recipients.length} recipient(s)`, type: 'success' })
      showCompose.value = false
    }
  } finally { composeLoading.value = false }
}
const getLeadUsers = (lead) => {
  // if (props.users.length) {
  //   return props.users.filter((x) => x.roleId !== task.taskDetails.roleId);
  // } else return [];
  return props.users.filter((x) => x.status === "Active");
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

const doArchive = async () => {
  if (!selectedLeads.value.length) {
    confirmArchive.value = false;
    return;
  }
  try {
    archiving.value = true;
    for (const lead of selectedLeads.value) {
      const res = await crmStore.updateLead({ id: lead.id, leadStatus: 'Archived', softDeleted: true });
      if (res?.code === 0) {
        lead.leadStatus = 'Archived';
        lead.softDeleted = true;
      }
    }
    if (mainStore?.setSnackbar) mainStore.setSnackbar({ title: 'Lead(s) archived', type: 'success' });
  } catch (e) {
    console.error('Failed to archive leads', e);
    if (mainStore?.setSnackbar) mainStore.setSnackbar({ title: 'Unable to archive leads', type: 'error' });
  } finally {
    archiving.value = false;
    confirmArchive.value = false;
    closeTray();
  }
};

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
.lead-panels {
  margin-top: 20px;
}

.border-sm {
  border: 1px solid rgb(var(--v-theme-outline));
  margin-bottom: 8px;
}

.table-panels :deep(.v-expansion-panel-title) {
  border-bottom: 1px solid #e5e7eb;
  min-height: 48px;
}

.table-panels :deep(.v-expansion-panel-text) {
  padding: 0 !important;
}

.table-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep() .v-data-table .v-table__wrapper tbody tr:hover {
  transition: background-color 0.2s ease;
}

/* Vertical lines between columns */
/* Table borders for clear cell separation */
:deep(.v-table .v-table__wrapper > table > thead > tr > th) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.v-table .v-table__wrapper > table > tbody > tr > td) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.v-table .v-table__wrapper > table > thead > tr > th:last-child),
:deep(.v-table .v-table__wrapper > table > tbody > tr > td:last-child) {
  border-right: none;
}
.resizable-table {
  border-top: none;
  border-radius: unset;
}

.resizable-table :deep(.v-table__wrapper) {
  margin-top: 0 !important;
}

.resizable-table :deep(.v-data-table tbody tr) {
  height: 48px !important;
}

.resizable-table :deep(.v-data-table td) {
  height: 48px !important;
  padding: 4px 8px !important;
  vertical-align: middle !important;
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
.action-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.actions-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
}

.action-item {
  flex: 0 0 auto;
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 12px;
  transition: background-color 0.15s ease, transform 0.1s ease;
  white-space: nowrap;
  text-align: center;
  min-width: 60px;
}

.action-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.action-label {
  font-size: 12px;
  margin-top: 4px;
  font-weight: 400;
  color: #6d6d6d;
  line-height: 1.2;
}

.action-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* Inline editing styles */
.editable-field {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  min-height: 24px;
}

.editable-field:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.inline-edit-input,
.inline-edit-textarea {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

.inline-edit-textarea {
  resize: vertical;
  min-height: 60px;
}

.inline-edit-input:focus,
.inline-edit-textarea:focus {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.2);
}

/* Scrollable comment cell */
.comment-cell-wrapper {
  position: relative;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s ease;
}

.comment-cell-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.comment-scrollable {
  flex: 1;
  overflow-y: auto;
  max-height: 40px;
  padding: 2px 4px;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

.comment-scrollable:empty::before {
  content: 'Click to add comment';
  color: rgba(0, 0, 0, 0.38);
  font-style: italic;
}

.comment-edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: rgba(0, 0, 0, 0.54);
  flex-shrink: 0;
}

.comment-cell-wrapper:hover .comment-edit-icon {
  opacity: 1;
}

/* Scrollbar styling for comment cell */
.comment-scrollable::-webkit-scrollbar {
  width: 4px;
}

.comment-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.comment-scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.comment-scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.with-border { border: 1px solid rgb(var(--v-theme-outline)); }

.modal-title { font-weight: 600; font-size: 16px; }
.editor {
  min-height: 220px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
.action-item:hover { background-color: #f5f5f5; }
</style>
