<template>
  <div class="lead-panels">
    <v-expansion-panels
      v-model="openedPanels"
      :elevation="0"
      flat
      multiple
      class="table-panels"
    >
      <v-expansion-panel v-if="!clientsMode" rounded="lg" class="border-sm pb-1">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-chip color="primary" label>
                <v-icon class="mr-2">mdi-account-multiple</v-icon>
                My Leads
              </v-chip>
              <v-chip class="ml-2" color="primary" label>
                {{ props.activeTotal || activeLeads.length }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pt-0">
          <v-data-table-server
            v-model="selectedLeads"
            :headers="selectedHeaders"
            :items="activeLeads"
            item-value="id"
            show-select
            hover
            class="resizable-table"
            density="compact"
            :loading="props.loading"
            :items-length="props.activeTotal || activeLeads.length"
            :page="props.activePage"
            :items-per-page="props.itemsPerPage"
            :items-per-page-options="[10, 25, 50, 100]"
            :item-selectable="() => true"
            @update:model-value="onSelect"
            @update:page="(val) => emit('update:activePage', val)"
            @update:items-per-page="(val) => emit('update:itemsPerPage', val)"
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

            <!-- Draggable / resizable headers -->
            <template v-slot:headers="{ columns, allSelected, someSelected }">
              <draggable
                tag="tr"
                :model-value="columns"
                item-key="key"
                direction="horizontal"
                :disabled="isResizing"
                handle=".th-content"
                @update:model-value="updateHeaderOrder"
              >
                <template #item="{ element: column, index: i }">
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
                    <div v-if="i !== 0" class="d-flex align-center th-content" style="cursor: grab;">
                      <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                      <v-icon
                        v-if="column.key !== 'name'"
                        size="14"
                        color="black"
                        style="cursor: pointer; flex-shrink: 0;"
                        @click.stop="removeHeaderFromSelected(column)"
                      >mdi-minus</v-icon>
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
              </draggable>
            </template>

            <!-- Dynamic cell templates -->
            <template
              v-for="col in selectedHeaders"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <!-- Name column with expand icon and inline edit -->
              <template v-if="col.key === 'name'">
                <div class="lead-name-cell-container">
                  <div class="d-flex justify-space-between align-center lead-name-cell">
                    <div class="lead-name-field-wrapper">
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
                        class="ml-2 mb-0 editable-field break-email" 
                        @click="startEdit(item, 'name')"
                        :title="resolveLeadName(item)"
                      >
                        {{ resolveLeadName(item) || 'Click to edit' }}
                      </p>
                    </div>
                    <img
                      src="@/assets/dashboard/expandIcon.svg"
                      alt="Expand"
                      class="ml-2 mr-2 cursor-pointer"
                      @click="openLeadDialog(item)"
                    />
                  </div>
                  <div class="lead-name-border"></div>
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
                    class="ml-2 mb-0 editable-field break-email" 
                    @click="startEdit(item, 'email')"
                    :title="resolveLeadEmail(item)"
                  >
                    {{ resolveLeadEmail(item) || 'Click to edit' }}
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
                    {{ resolveLeadPhone(item) || 'Click to edit' }}
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
                <DataTableColumnsAlerts :selected="item" :alert-options="props.alertOptions" @update="updateValueRow(item, 'alert')" @options-saved="(opts) => emit('alert-options-saved', opts)" />
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
              <template v-else-if="col.key === 'automation'">
                <DataTableColumnsAutomationGroups
                  :lead="item"
                  :groups="resolvedAutomationGroups"
                  :get-display="getLeadAutomationGroupDisplay"
                  :is-group-enabled="isLeadGroupEnabled"
                  :toggle-group="toggleLeadGroup"
                  :on-open-menu="onAutomationMenuOpen"
                  :saving="!!automationSaving[item.id]"
                  :groups-loading="crmStore.automationGroupsLoading"
                  :whatsapp-enabled="props.whatsappConnected"
                />
              </template>
              <template v-else-if="col.key === 'leadSource'">
                <DataTableColumnsLeadSource
                  :leadSources="leadSources"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'leadSource')"
                  @options-updated="(e) => emit('options-refreshed', e)"
                />
              </template>
              <template v-else-if="col.key === 'treatment'">
                <DataTableColumnsLeadTreatment
                  :treatmentSources="treatmentSources"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'treatment')"
                  @options-updated="(e) => emit('options-refreshed', e)"
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
                  <p class="mb-0 ml-2">{{ formatDateTime(item[col.key]) }}</p>
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
          </v-data-table-server>
          <CommonSelectionActionBar
            v-if="selectedLeads.length"
            :count="selectedLeads.length"
            :actions="crmTrayActions"
            :mobile-primary-keys="crmMobilePrimaryKeys"
            fixed
            @action="onActionClick"
            @close="closeTray"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Converted Leads Panel -->
      <v-expansion-panel rounded="lg" :class="clientsMode ? '' : 'border-sm pb-1'">
        <v-expansion-panel-title v-if="!clientsMode">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-chip color="primary" label>
                <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                Converted Leads
              </v-chip>
              <v-chip class="ml-2" color="primary" label>
                {{ props.convertedTotal || convertedLeadsData.length }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="pt-0">
          <v-alert
            v-if="!convertedLeadsData.length"
            type="info"
            variant="tonal"
            class="mb-2"
          >
            No converted leads yet.
          </v-alert>
          <v-data-table-server
            v-else
            v-model="selectedConvertedLeads"
            :headers="selectedHeaders"
            :items="convertedLeadsData"
            item-value="id"
            hover
            class="resizable-table"
            density="compact"
            show-select
            :loading="props.loading"
            :items-length="props.convertedTotal || convertedLeadsData.length"
            :page="props.convertedPage"
            :items-per-page="props.itemsPerPage"
            :items-per-page-options="[10, 25, 50, 100]"
            :item-selectable="() => true"
            @update:model-value="onConvertedSelectionChange"
            @update:page="(val) => emit('update:convertedPage', val)"
            @update:items-per-page="(val) => emit('update:itemsPerPage', val)"
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
            <template v-slot:headers="{ columns, allSelected, someSelected }">
              <draggable
                tag="tr"
                :model-value="columns"
                item-key="key"
                direction="horizontal"
                :disabled="isResizing"
                handle=".th-content"
                @update:model-value="updateHeaderOrder"
              >
                <template #item="{ element: column, index: i }">
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
                    <div v-if="i !== 0" class="d-flex align-center th-content" style="cursor: grab;">
                      <input
                        v-if="column.isCustom && editingHeaderKey === column.key"
                        :value="column.title"
                        @input="(e) => { column.title = e.target.value }"
                        @blur="saveHeaderRename(column)"
                        @keyup.enter="(e) => e.target.blur()"
                        @keyup.esc="cancelHeaderRename(column)"
                        @click.stop
                        class="inline-edit-input px-1 w-100"
                        style="font-size:14px"
                        autofocus
                      />
                      <p
                        v-else
                        class="px-1 w-100 mb-0"
                        :style="column.isCustom ? 'cursor:text' : ''"
                        @click.stop="column.isCustom ? startHeaderRename(column) : null"
                      >{{ column.title }}</p>
                      <v-icon
                        v-if="column.isCustom"
                        size="13"
                        color="error"
                        style="cursor:pointer; flex-shrink:0;"
                        @click.stop="emit('request-delete-column', column)"
                      >mdi-close</v-icon>
                      <v-icon
                        v-if="column.key !== 'name'"
                        size="14"
                        color="black"
                        style="cursor: pointer; flex-shrink: 0;"
                        @click.stop="removeHeaderFromSelected(column)"
                      >mdi-minus</v-icon>
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
                        @change="toggleAllConverted"
                      />
                    </div>
                  </th>
                </template>
              </draggable>
            </template>
            <template
              v-for="col in selectedHeaders"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <template v-if="col.key === 'name'">
                <div class="lead-name-cell-container">
                  <div class="d-flex justify-space-between align-center lead-name-cell">
                    <div class="lead-name-field-wrapper">
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
                        class="ml-2 mb-0 editable-field break-email"
                        @click="startEdit(item, 'name')"
                        :title="resolveLeadName(item)"
                      >
                        {{ resolveLeadName(item) || 'Click to edit' }}
                      </p>
                    </div>
                    <img
                      src="@/assets/dashboard/expandIcon.svg"
                      alt="Expand"
                      class="ml-2 mr-2 cursor-pointer"
                      @click="openLeadDialog(item)"
                    />
                  </div>
                  <div class="lead-name-border"></div>
                </div>
              </template>

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
                    class="ml-2 mb-0 editable-field break-email"
                    @click="startEdit(item, 'email')"
                    :title="resolveLeadEmail(item)"
                  >
                    {{ resolveLeadEmail(item) || 'Click to edit' }}
                  </p>
                </div>
              </template>

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
                    {{ resolveLeadPhone(item) || 'Click to edit' }}
                  </p>
                </div>
              </template>

              <template v-else-if="col.key === 'comments'">
                <div class="comment-cell-wrapper pa-1" @click="startEdit(item, 'comments')">
                  <div class="comment-scrollable">
                    {{ item.comments || 'Click to add comment' }}
                  </div>
                  <v-icon size="14" class="comment-edit-icon">mdi-pencil</v-icon>
                </div>
                <v-dialog
                  v-model="commentMenus[item.id]"
                  max-width="500"
                  :retain-focus="false"
                >
                  <v-card class="pa-4">
                    <v-card-title class="text-subtitle-1 pa-0 mb-3 d-flex justify-space-between align-center">
                      <span>Edit Comment</span>
                      <v-btn icon variant="text" size="small" @click="cancelEdit">
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
                      <v-btn variant="text" @click="cancelEdit">Cancel</v-btn>
                      <v-btn color="primary" variant="flat" @click="saveEdit(item, 'comments')">Save</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </template>

              <template v-else-if="col.key === 'alert'">
                <DataTableColumnsAlerts :selected="item" :alert-options="props.alertOptions" @update="updateValueRow(item, 'alert')" @options-saved="(opts) => emit('alert-options-saved', opts)" />
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
              <template v-else-if="col.key === 'automation'">
                <DataTableColumnsAutomationGroups
                  :lead="item"
                  :groups="resolvedAutomationGroups"
                  :get-display="getLeadAutomationGroupDisplay"
                  :is-group-enabled="isLeadGroupEnabled"
                  :toggle-group="toggleLeadGroup"
                  :on-open-menu="onAutomationMenuOpen"
                  :saving="!!automationSaving[item.id]"
                  :groups-loading="crmStore.automationGroupsLoading"
                  :whatsapp-enabled="props.whatsappConnected"
                />
              </template>
              <template v-else-if="col.key === 'leadSource'">
                <DataTableColumnsLeadSource
                  :leadSources="leadSources"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'leadSource')"
                  @options-updated="(e) => emit('options-refreshed', e)"
                />
              </template>
              <template v-else-if="col.key === 'treatment'">
                <DataTableColumnsLeadTreatment
                  :treatmentSources="treatmentSources"
                  :selected="item"
                  :column="col"
                  @update="updateValueRow(item, 'treatment')"
                  @options-updated="(e) => emit('options-refreshed', e)"
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
              <template v-else-if="col.key === 'inquiryDate'">
                <div class="pa-1">
                  <p class="mb-0 ml-2">{{ formatDateTime(item[col.key]) }}</p>
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
              <template v-else-if="col.isCustom">
                <div class="pa-1">
                  <input
                    v-if="editingCell.id === item.id && editingCell.field === col.key"
                    :value="getCustomValue(item, col.columnDefinitionId)"
                    @input="(e) => setCustomValue(item, col.columnDefinitionId, e.target.value)"
                    @blur="saveCustomField(item, col)"
                    @keyup.enter="saveCustomField(item, col)"
                    @keyup.esc="cancelEdit"
                    class="inline-edit-input"
                    autofocus
                  />
                  <p
                    v-else
                    class="ml-2 mb-0 editable-field"
                    @click="startEdit(item, col.key)"
                  >{{ getCustomValue(item, col.columnDefinitionId) || 'Click to edit' }}</p>
                </div>
              </template>
              <template v-else>
                <p class="ml-2 mb-0">{{ item[col.key] }}</p>
              </template>
            </template>
          </v-data-table-server>
          <CommonSelectionActionBar
            v-if="selectedConvertedLeads.length"
            :count="selectedConvertedLeads.length"
            :actions="crmTrayActions"
            :mobile-primary-keys="crmMobilePrimaryKeys"
            fixed
            @action="onConvertedActionClick"
            @close="selectedConvertedLeads = []"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Archived Leads Panel -->
      <v-expansion-panel
        v-if="!clientsMode"
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
                {{ props.archivedTotal || archivedLeads.length }}
              </v-chip>
            </div>
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
          <v-data-table-server
            v-else
            v-model="selectedArchivedLeads"
            :headers="selectedHeaders"
            :items="archivedLeads"
            item-value="id"
            hover
            class="resizable-table"
            density="compact"
            show-select
            :loading="props.loading"
            :items-length="props.archivedTotal || archivedLeads.length"
            :page="props.archivedPage"
            :items-per-page="props.itemsPerPage"
            :items-per-page-options="[10, 25, 50, 100]"
            :item-selectable="() => true"
            @update:model-value="onArchivedSelectionChange"
            @update:page="(val) => emit('update:archivedPage', val)"
            @update:items-per-page="(val) => emit('update:itemsPerPage', val)"
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
                        @change="toggleAllArchived"
                      />
                    </div>
                  </th>
                </template>
              </tr>
            </template>
            <template
              v-for="col in selectedHeaders"
              :key="col.key"
              v-slot:[`item.${col.key}`]="{ item }"
            >
              <template v-if="col.key === 'name'">
                <div class="pa-1 d-flex justify-space-between align-center">
                  <p class="ml-2 mb-0 font-weight-medium">{{ resolveLeadName(item) }}</p>
                </div>
              </template>
              <template v-else-if="col.key === 'inquiryDate'">
                <p class="ml-2 mb-0">{{ formatDateTime(item[col.key]) }}</p>
              </template>
              <template v-else-if="col.key === 'followUpDate'">
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
              <template v-else-if="col.key === 'automation'">
                <DataTableColumnsAutomationGroups
                  :lead="item"
                  :groups="resolvedAutomationGroups"
                  :get-display="getLeadAutomationGroupDisplay"
                  :is-group-enabled="isLeadGroupEnabled"
                  :toggle-group="toggleLeadGroup"
                  :on-open-menu="onAutomationMenuOpen"
                  :saving="!!automationSaving[item.id]"
                  :groups-loading="crmStore.automationGroupsLoading"
                  :whatsapp-enabled="props.whatsappConnected"
                  readonly
                />
              </template>
              <template v-else-if="col.key === 'email'">
                <p class="ml-2 mb-0">{{ resolveLeadEmail(item) }}</p>
              </template>
              <template v-else-if="col.key === 'telephone'">
                <p class="ml-2 mb-0">{{ resolveLeadPhone(item) }}</p>
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
          </v-data-table-server>
          <CommonSelectionActionBar
            v-if="selectedArchivedLeads.length"
            :count="selectedArchivedLeads.length"
            count-label-desktop="Archived Selected"
            :actions="archivedTrayActions"
            :mobile-primary-keys="archivedMobilePrimaryKeys"
            fixed
            @action="onArchivedActionClick"
            @close="closeTray"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <CustomerRelationManagementLeadDetailsDialog
      v-if="showLeadDetailDialog"
      v-model="showLeadDetailDialog"
      :selected-lead="selectedLead"
      :initial-tab="dialogInitialTab"
      @close="handleLeadDialogClose"
    />

    <v-dialog v-model="showCompose" max-width="860px">
      <v-card class="rounded-lg compose-dialog-card">
        <!-- Header -->
        <div class="d-flex justify-space-between align-center px-5 py-3" style="background:#fafafa;border-bottom:1px solid #f0f0f0">
          <div class="d-flex align-center" style="gap:10px">
            <v-icon color="primary" size="20">mdi-email-fast-outline</v-icon>
            <div>
              <div class="font-weight-semibold" style="font-size:14px;line-height:1.2">Compose Email</div>
              <div class="text-caption text-medium-emphasis">{{ compose.recipients.length }} recipient(s)</div>
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="showCompose = false"><v-icon size="18">mdi-close</v-icon></v-btn>
        </div>

        <div class="compose-dialog-body">
          <!-- Recipients -->
          <div class="px-5 pt-3 pb-2 d-flex align-center flex-wrap" style="gap:6px;border-bottom:1px solid #f5f5f5">
            <span class="text-caption text-grey-darken-1 mr-1" style="min-width:20px">To:</span>
            <v-chip v-for="(e,i) in compose.recipients" :key="i" size="x-small" color="primary" variant="tonal">{{ e }}</v-chip>
          </div>

          <!-- Subject -->
          <div class="px-5 pt-3 pb-3" style="border-bottom:1px solid #f5f5f5">
            <label class="fld-lbl d-inline-block mb-1">Subject</label>
            <v-text-field
              v-model="compose.subject"
              placeholder="Subject"
              density="compact"
              variant="solo"
              class="input-bordered mb-0"
              bg-color="white"
              hide-details
              flat
            />
          </div>

          <!-- Body -->
          <div class="px-5 pt-3 pb-4">
            <CrmEmailTemplateEditor v-model="compose.html" v-model:attachments="compose.attachments" :allow-attachments="true" />
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 pb-4 d-flex justify-end compose-dialog-footer" style="border-top:1px solid #f0f0f0;padding-top:12px">
          <v-btn :loading="composeLoading" flat color="primary" style="border-radius:8px;min-width:90px" @click="sendCompose">
            <v-icon size="16" class="mr-1">mdi-send-outline</v-icon>Send
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSendPriceCompose" max-width="720px">
      <v-card class="send-price-card">
        <div class="d-flex justify-space-between align-center px-6 py-4">
          <div>
            <h5 class="mb-1 modal-title">Share Price with Client</h5>
            <div class="text-caption text-medium-emphasis">{{ sendPrice.recipients.length }} recipient(s)</div>
          </div>
          <v-btn icon @click="showSendPriceCompose = false" flat><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <div class="send-price-body">
          <div class="px-6 pt-4">
            <div class="send-price-upload-card">
              <div v-if="sendPriceAttachment?.link" class="uploaded-file-row mb-3">
                <div class="uploaded-file-meta">
                  <v-icon size="18" color="primary" class="mr-2">mdi-file-pdf-box</v-icon>
                  <div>
                    <div class="uploaded-file-name">{{ sendPriceAttachment?.name || 'price-list.pdf' }}</div>
                    <div class="text-caption text-medium-emphasis">
                      PDF attached{{ sendPriceAttachment?.uploadedAt ? ` • ${formatDate(sendPriceAttachment.uploadedAt)}` : '' }}
                    </div>
                  </div>
                </div>
                <v-btn size="small" variant="text" color="error" @click="clearSendPriceAttachment">Remove</v-btn>
              </div>

              <CommonFileUpload :is-single="true" @onFiles="onSendPriceFiles" />
              <div class="text-caption text-medium-emphasis mt-2">
                Upload your pricing PDF. Uploading another PDF replaces the current one.
              </div>
              <v-progress-linear
                v-if="sendPriceUploadLoading"
                indeterminate
                color="primary"
                class="mt-2"
                rounded
              />
            </div>
          </div>

          <div class="px-6 pt-3">
            <v-text-field
              v-model="sendPrice.priceLink"
              label="Paste Price Link"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-link-variant"
              hide-details
            />
          </div>

          <div class="px-6 pt-4 pb-2">
            <v-text-field
              v-model="sendPrice.subject"
              label="Subject"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>

          <div class="px-6 pt-2 pb-4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-2">Message (Optional)</div>
            <div ref="sendPriceHolder" class="editor send-price-editor"></div>
          </div>
        </div>

        <div class="send-price-footer px-6 py-4 d-flex justify-end" style="gap: 10px">
          <v-btn variant="outlined" @click="showSendPriceCompose = false">Discard</v-btn>
          <v-btn color="primary" flat :loading="sendPriceLoading" @click="sendPriceCompose">Send</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showWhatsAppCompose" max-width="720px">
      <v-card class="rounded-lg">
        <div class="d-flex justify-space-between align-center px-4 py-3">
          <div>
            <h5 class="mb-1 modal-title">Send WhatsApp</h5>
            <div class="text-caption text-medium-emphasis">From connected number</div>
          </div>
          <v-btn icon @click="showWhatsAppCompose = false" flat><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <!-- Not-connected state -->
        <div v-if="!props.whatsappConnected" class="px-4 pt-4 pb-4">
          <CommonWhatsAppNotConnectedAlert />
        </div>

        <div v-else class="px-4 pt-4 pb-2">
          <v-textarea
            v-model="whatsappMessage"
            ref="whatsappTextarea"
            label="Message"
            density="compact"
            variant="outlined"
            auto-grow
            rows="4"
            hide-details
            placeholder="Write your WhatsApp message..."
          />
          <div class="d-flex align-center flex-wrap mt-3" style="gap: 8px">
            <span class="text-caption text-medium-emphasis">Insert placeholder:</span>
            <v-chip
              v-for="token in whatsappTokens"
              :key="token"
              size="x-small"
              variant="tonal"
              color="primary"
              class="cursor-pointer"
              @click="insertWhatsAppToken(token)"
            >
              {{ token }}
            </v-chip>
          </div>
          <div v-if="!hasWhatsAppRecipients" class="text-caption text-medium-emphasis mt-2">
            No WhatsApp numbers found for the selected lead(s).
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Placeholders are replaced per lead at send time.
          </div>
        </div>

        <div v-if="props.whatsappConnected" class="px-4 pb-4 d-flex justify-end">
          <v-btn :loading="whatsappSending" :disabled="!hasWhatsAppRecipients" flat color="primary" @click="sendWhatsAppMessage">
            Send
          </v-btn>
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
      :message="getPermanentDeleteMessage(selectedLeads.length)"
      @confirm="doDelete"
      @cancel="confirmDelete = false"
    />
    <CommonConfirmDialog
      v-model="confirmRestore"
      title="Restore leads?"
      :loading="restoring"
      :message="`Restore ${selectedArchivedLeads.length} lead(s) back to the main list? They will be marked as New.`"
      @confirm="doRestore"
      @cancel="confirmRestore = false"
    />
    <CommonConfirmDialog
      v-model="confirmArchivedDelete"
      title="Delete archived leads?"
      :loading="deletingArchived"
      :message="getPermanentDeleteMessage(selectedArchivedLeads.length)"
      @confirm="doDeleteArchived"
      @cancel="confirmArchivedDelete = false"
    />
    <TeamFlossSideBarAddNewstaff
      v-model="addStaffDrawer"
      :rolesList="rolesList"
      @success="onStaffAdded"
      @close="addStaffDrawer = false"
    />

    <!-- Bulk Automations Dialog -->
    <v-dialog v-model="showBulkAutomationsDialog" max-width="1100px" scrollable>
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh;">
        <div style="border-bottom: 1px solid rgba(0,0,0,0.12);">
          <div class="pa-4 pb-0 d-flex justify-space-between align-center">
            <div>
              <h3 style="font-size: 18px; font-weight: 600;">Automations</h3>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">
                Managing automations for {{ selectedLeads.length }} selected lead{{ selectedLeads.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <v-btn flat icon size="32" @click="showBulkAutomationsDialog = false">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="px-4 pt-4 pb-3">
            <v-tabs v-model="bulkAutomationsTab" hide-slider density="comfortable" :show-arrows="false" class="bulk-automation-tabs">
              <v-tab value="automation" class="tab-text">
                <img src="@/assets/icons/crm/settings.svg" width="22" height="22" alt="" class="mr-2" />
                <span>Flossly Automation</span>
              </v-tab>
              <v-tab value="my-automations" class="tab-text">
                <img src="@/assets/icons/crm/settings.svg" width="22" height="22" alt="" class="mr-2" />
                <span>My Automations</span>
              </v-tab>
            </v-tabs>
          </div>
        </div>

        <div class="flex-grow-1 pa-4" style="overflow-y: auto;">
          <v-tabs-window v-model="bulkAutomationsTab">
            <v-tabs-window-item value="automation">
              <CustomerRelationManagementAutomation
                :lead-id="null"
                :lead="null"
                :include-defaults="true"
                :whatsapp-enabled="props.whatsappConnected"
                :selected-lead-ids="selectedLeadIds"
                :selected-leads="selectedLeads"
                :disable-toggle="false"
                :show-sent-status-column="false"
                :show-resend-action="false"
                @bulk-toggle-done="showBulkAutomationsDialog = false"
              />
            </v-tabs-window-item>
            <v-tabs-window-item value="my-automations">
              <CustomerRelationManagementAutomation
                :lead-id="null"
                :lead="null"
                :include-defaults="false"
                :whatsapp-enabled="props.whatsappConnected"
                :selected-lead-ids="selectedLeadIds"
                :selected-leads="selectedLeads"
                :disable-toggle="false"
                :show-sent-status-column="false"
                :show-resend-action="false"
                @bulk-toggle-done="showBulkAutomationsDialog = false"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-card>
    </v-dialog>

    <!-- Consent form picker -->
    <v-dialog v-model="showConsentFormSelect" max-width="540">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-subtitle-1 pa-0 mb-3 d-flex justify-space-between align-center">
          <span>Select Consent Form</span>
          <v-btn icon variant="text" size="small" @click="showConsentFormSelect = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="consentFormsLoading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-alert v-else-if="!consentForms.length" type="info" variant="tonal" class="mb-2">
            No consent forms found. Create one in the Forms section first.
          </v-alert>
          <v-list v-else density="compact" class="pa-0">
            <v-list-item
              v-for="form in consentForms"
              :key="form.id"
              :title="form.name || form.title"
              :subtitle="form.category || 'General'"
              rounded="lg"
              class="mb-2"
              style="border: 1px solid #e2e8f0;"
              @click="selectConsentForm(form)"
            >
              <template #prepend>
                <v-icon color="primary" class="mr-2">mdi-file-document-outline</v-icon>
              </template>
              <template #append>
                <v-icon size="16" color="grey">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-0 mt-3">
          <v-spacer />
          <v-btn variant="text" @click="showConsentFormSelect = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Consent form sender -->
    <PatientsFormsConsentFormSender
      v-if="showConsentFormSender && selectedConsentForm && consentSenderPatient"
      v-model="showConsentFormSender"
      :form="selectedConsentForm"
      :patient="consentSenderPatient"
      :patient-email="resolveLeadEmail(consentFormSenderLead)"
      :patient-phone="resolveLeadPhone(consentFormSenderLead)"
      @success="onConsentFormSent"
      @close="closeConsentFormSender"
    />
  </div>
</template>

<script setup>
import draggable from "vuedraggable"
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'
import { buildRecipientContext } from '@/lib/crm/previewContext'
import { applyCrmPlaceholders } from '@/lib/crm/placeholders'
import { formatDateDDMMYYYY, formatDateTime } from "@/lib/dateFormatter";
import { formatAssignedUsers, formatTreatmentValue } from "@/lib/misc";
import { getLeadDisplayName, getLeadEmail, getLeadPhone } from "@/lib/normalizers/lead";
import { LICENSE_TYPES } from '@/stores/index'
import { useDiaryStore } from '@/stores/diary'
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults'
const defaultAutomationMap = new Map(crmAutomationDefaults.map((d) => [d.key, d]))
import DataTableColumnsAutomationGroups from '@/components/dataTableColumns/automationGroups.vue'
import callIcon from '@/assets/crm/call.svg'
import sendMailIcon from '@/assets/crm/sendMail.svg'
import bookIcon from '@/assets/crm/book.svg'
import sendPriceIcon from '@/assets/crm/sendPrice.svg'
import sendFormIcon from '@/assets/crm/sendForm.svg'
import shareLocationIcon from '@/assets/crm/shareLocation.svg'
import whatsappIcon from '@/assets/crm/whatsapp-logo.svg'
import convertIcon from '@/assets/crm/convert.svg'
import archiveIcon from '@/assets/crm/archive.svg'
import deleteIcon from '@/assets/tasks/delete.svg'
import exportIcon from '@/assets/crm/export.svg'
const crmStore = useCrmStore();
const diaryStore = useDiaryStore();
const authStore = useAuthStore();
const { user, setUser } = useUser();
const route = useRoute();
const router = useRouter();
const emit = defineEmits([
  'select',
  'openLead',
  'book',
  'refresh',
  'update:activePage',
  'update:archivedPage',
  'update:convertedPage',
  'update:itemsPerPage',
  'alert-options-saved',
  'options-refreshed',
  'request-delete-column',
]);
const props = defineProps({
  leads: { type: Array, default: () => [] },
  activeLeads: { type: Array, default: null },
  archivedLeads: { type: Array, default: null },
  convertedLeads: { type: Array, default: () => [] },
  activeTotal: { type: Number, default: 0 },
  archivedTotal: { type: Number, default: 0 },
  convertedTotal: { type: Number, default: 0 },
  activePage: { type: Number, default: 1 },
  archivedPage: { type: Number, default: 1 },
  convertedPage: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 25 },
  loading: { type: Boolean, default: false },
  headers: { type: Array, required: true },
  search: { type: String, default: '' },
  leadSources: { type: Array, required: true },
  treatmentSources: { type: Array, required: true },
  users: { type: Array, required: true },
  alertOptions: { type: Array, default: () => [] },
  whatsappConnected: { type: Boolean, default: false },
  clientsMode: { type: Boolean, default: false },
  customColumnDefinitions: { type: Array, default: () => [] },
});
const openedPanels = ref([0]);

// Column visibility + order management
const selectedHeaders = ref([])

const filteredAvailableHeaders = computed(() => {
  const selectedKeys = new Set(selectedHeaders.value.map((h) => h.key))
  return (props.headers || []).filter((h) => !selectedKeys.has(h.key))
})

const saveColumnPreferences = () => {
  try {
    const key = props.clientsMode ? 'clientsTableColumns' : 'crmLeadTableColumns'
    localStorage.setItem(key, JSON.stringify(selectedHeaders.value))
  } catch {}
}

const addHeaderInSelected = (column) => {
  if (!selectedHeaders.value.find((h) => h.key === column.key)) {
    selectedHeaders.value.push(column)
    saveColumnPreferences()
  }
}

const removeHeaderFromSelected = (column) => {
  if (column.key === 'name') return
  selectedHeaders.value = selectedHeaders.value.filter((h) => h.key !== column.key)
  saveColumnPreferences()
}

const updateHeaderOrder = (newOrder) => {
  const selectable = newOrder.findIndex((x) => !x.title)
  if (selectable !== -1) newOrder.splice(selectable, 1)
  selectedHeaders.value = newOrder
  saveColumnPreferences()
}

const getColColor = (name) => {
  if (!name) return '#999999'
  const colors = ['#FF6B6B','#FF8E72','#FFD93D','#6BCB77','#4D96FF','#8358E8','#FF6EC7','#00B8A9','#F15BB5','#FF7F11','#FF9F1C','#2EC4B6','#6A4C93','#8338EC','#3A86FF','#FF006E','#FB5607','#FFBE0B','#06D6A0','#118AB2','#073B4C','#EF476F','#06AED5','#4CC9F0','#8AC926','#FF595E']
  const index = name.trim().toUpperCase().charCodeAt(0) - 65
  return index >= 0 && index < 26 ? colors[index] : '#999999'
}

onMounted(() => {
  try {
    const stored = localStorage.getItem(props.clientsMode ? 'clientsTableColumns' : 'crmLeadTableColumns')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length) {
        const validKeys = new Set((props.headers || []).map((h) => h.key))
        const filtered = parsed.filter((h) => validKeys.has(h.key))
        if (filtered.length) {
          const storedKeys = new Set(filtered.map((h) => h.key))
          const newCols = (props.headers || []).filter((h) => !storedKeys.has(h.key))
          selectedHeaders.value = [...filtered, ...newCols]
          return
        }
      }
    }
  } catch {}
  selectedHeaders.value = [...(props.headers || [])]
})

watch(() => props.headers, (v) => {
  if (!v?.length || selectedHeaders.value.length) return
  selectedHeaders.value = [...v]
})

const selectedLeads = ref([]);
const isAllSelected = ref(false);
const selectedArchivedLeads = ref([]);
const isAllArchived = ref(false);
const selectedConvertedLeads = ref([]);
const isAllConverted = ref(false);
const showLeadDetailDialog = ref(false);
const selectedLead = ref({});
const dialogInitialTab = ref(null);
const commentMenus = reactive({});
const leadRouteRequestId = ref(0);

const leadStatusOptions = [
  { name: 'New', color: '#36a863' },
  { name: 'Contacted', color: '#f6a609' },
  { name: 'Converted', color: '#0061fb' },
  { name: 'Lost', color: '#e15b64' },
  { name: 'Archived', color: '#9E9E9E' },
  { name: 'Uploaded', color: '#8B5CF6' },
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
const activeLeadSource = computed(() =>
  Array.isArray(props.activeLeads) ? props.activeLeads : (props.leads || [])
);
const archivedLeadSource = computed(() =>
  Array.isArray(props.archivedLeads) ? props.archivedLeads : (props.leads || [])
);
const activeLeads = computed(() =>
  activeLeadSource.value.filter((l) => !isArchivedLead(l))
);
const archivedLeads = computed(() =>
  archivedLeadSource.value.filter((l) => isArchivedLead(l))
);
const convertedLeadsData = computed(() =>
  Array.isArray(props.convertedLeads) ? props.convertedLeads : []
);
const allVisibleLeads = computed(() => [
  ...(activeLeads.value || []),
  ...(archivedLeads.value || []),
  ...(convertedLeadsData.value || []),
]);
const canDelete = computed(() => [1, 8].includes(user.value?.roleId));

const normalizeLeadForDialog = (lead = {}) => ({
  ...lead,
  alert: lead.alert || "",
  name: getLeadDisplayName(lead) || lead.name || "",
  email: getLeadEmail(lead) || lead.email || "",
  telephone: getLeadPhone(lead) || lead.telephone || "",
  inquiryDate: lead.inquiryDate || "",
  rawData: lead.rawData || null,
  dob: lead.dob || null,
  occupation: lead.occupation || "",
  location: lead.location || "",
  leadSource: lead.leadSource?.name
    ? lead.leadSource
    : { id: 99, name: lead.leadSource || "Meta Leadgen" },
  metaPage: lead.metaPage || lead.pageName || lead.pageId || "",
  leadStatus: lead.leadStatus || "New",
  treatment: lead.treatment?.name ? lead.treatment : { id: null, name: lead.treatment || "" },
  assigned: lead.assigned || [],
  followUpDate: lead.followUpDate || "",
  comments: lead.comments || "",
  id: lead.id,
  softDeleted: !!lead.softDeleted,
});

const findVisibleLeadById = (leadId) => {
  const numericLeadId = Number(leadId || 0);
  if (!numericLeadId) return null;
  return allVisibleLeads.value.find((lead) => Number(lead?.id) === numericLeadId) || null;
};

const fetchLeadById = async (leadId) => {
  const numericLeadId = Number(leadId || 0);
  if (!numericLeadId) return null;

  const res = await crmStore.listLeads({ id: numericLeadId, includeArchived: true });
  const rows = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res?.data?.rows)
      ? res.data.rows
      : [];

  return rows[0] || null;
};

const syncLeadDialogWithRoute = async (rawLeadId = route.query.leadId) => {
  const numericLeadId = Number(rawLeadId || 0);
  if (!numericLeadId) return;

  if (showLeadDetailDialog.value && Number(selectedLead.value?.id) === numericLeadId) {
    return;
  }

  // Handle org switch for push-driven opens
  const orgIdFromQuery = route.query.orgId;
  if (orgIdFromQuery) {
    const targetOrgId = Number(orgIdFromQuery);
    const currentOrgId = user.value?.currentLoggedInOrgId;

    if (targetOrgId && currentOrgId && targetOrgId !== currentOrgId) {
      try {
        const res = await authStore.switchOrgnanisation({ orgId: targetOrgId });
        if (res.code === 0) {
          const profileRes = await authStore.profile();
          if (profileRes.code === 0 && profileRes.data) {
            setUser(profileRes.data);
            // Refresh the leads list in the background for the new org
            // (non-blocking — dialog opening proceeds concurrently)
            emit('refresh');
          }
        } else {
          console.error('Org switch failed for lead notification');
          return;
        }
      } catch (error) {
        console.error('Failed to switch org for lead notification:', error);
        return;
      }
    }
  }

  dialogInitialTab.value = route.query.tab || null;

  const visibleLead = findVisibleLeadById(numericLeadId);
  if (visibleLead) {
    selectedLead.value = normalizeLeadForDialog(visibleLead);
    showLeadDetailDialog.value = true;
    return;
  }

  const requestId = ++leadRouteRequestId.value;

  try {
    const fetchedLead = await fetchLeadById(numericLeadId);
    if (requestId !== leadRouteRequestId.value) return;
    if (!fetchedLead) {
      if (mainStore?.setSnackbar) {
        mainStore.setSnackbar({ title: 'This lead no longer exists or has been deleted.', type: 'warning' });
      }
      return;
    }
    selectedLead.value = normalizeLeadForDialog(fetchedLead);
    showLeadDetailDialog.value = true;
  } catch (error) {
    console.error('Failed to open lead from route query', error);
  }
};

// Inline editing state
const editingCell = reactive({
  id: null,
  field: null,
  value: null,
  originalValue: null
});

const ALL_ACTIONS = [
  // { key: "call", label: "Call", icon: callIcon },
  { key: "mail", label: "Send Mail", icon: sendMailIcon },
  { key: "whatsapp", label: "WhatsApp", icon: whatsappIcon },
  { key: "book", label: "Book", icon: bookIcon },
  { key: "sendPrice", label: "Send Price", icon: sendPriceIcon },
  { key: "sendForm", label: "Send Form", icon: sendFormIcon },
  { key: "shareLocation", label: "Share Location", icon: shareLocationIcon },
  { key: "automations", label: "Automations", mdiIcon: "mdi-lightning-bolt-outline" },
  { key: "convert", label: "Convert", icon: convertIcon },
  { key: "archive", label: "Archive", icon: archiveIcon },
  { key: "delete", label: "Delete", icon: deleteIcon },
  { key: "export", label: "Export", icon: exportIcon },
];
const actions = computed(() =>
  canDelete.value ? ALL_ACTIONS : ALL_ACTIONS.filter(a => a.key !== 'delete')
);
const crmMobilePrimaryKeys = ['mail', 'whatsapp'];
const crmTrayActions = computed(() =>
  actions.value.map((action) => ({
    ...action,
    disabled: isActionLocked(action.key),
    mobileLabel:
      action.key === 'mail'
        ? 'Mail'
        : action.key === 'whatsapp'
          ? 'Chat'
          : action.label,
  }))
);
const archivedMobilePrimaryKeys = ['restore'];
const archivedTrayActions = computed(() => [
  {
    key: 'restore',
    label: 'Restore',
    mobileLabel: 'Restore',
    mdiIcon: 'mdi-restore',
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: deleteIcon,
    hidden: !canDelete.value,
  },
]);
const showBulkAutomationsDialog = ref(false);
const bulkAutomationsTab = ref('automation');
const selectedLeadIds = computed(() =>
  selectedLeads.value.map(l => Number(l?.id)).filter(Boolean)
);

watch(showBulkAutomationsDialog, async (open) => {
  if (!open && selectedLeads.value.length) {
    await Promise.all(
      selectedLeads.value
        .map((lead) => Number(lead?.id || 0))
        .filter(Boolean)
        .map((id) => crmStore.fetchLeadAutomations(id, { force: true, silent: true }))
    );
  }
});
const confirmDelete = ref(false);
const deleting = ref(false);
const confirmArchive = ref(false);
const archiving = ref(false);
const confirmRestore = ref(false);
const restoring = ref(false);
const confirmArchivedDelete = ref(false);
const deletingArchived = ref(false);
const converting = ref(false);
const getPermanentDeleteMessage = (count) =>
  `Delete ${count} lead(s) permanently? This cannot be undone.`;
const addStaffDrawer = ref(false);
const consentStore = useConsentStore();
const consentForms = ref([]);
const consentFormsLoading = ref(false);
const showConsentFormSelect = ref(false);
const selectedConsentForm = ref(null);
const showConsentFormSender = ref(false);
const consentFormSenderLead = ref(null);
const consentResolvedPatient = ref(null);

const consentSenderPatient = computed(() => {
  return consentResolvedPatient.value;
});

const cacheLeadPatient = (lead, patient) => {
  const patientId = Number(patient?.id || 0);
  if (!lead || !patientId) return;
  lead.patientId = patientId;
};

const openConsentFormSelect = async () => {
  if (!selectedLeads.value.length) return;
  if (selectedLeads.value.length > 1) {
    mainStore?.setSnackbar?.({ title: 'Select only one lead to send a form', type: 'error' });
    return;
  }
  showConsentFormSelect.value = true;
  if (consentForms.value.length) return;
  consentFormsLoading.value = true;
  try {
    await consentStore.fetchTemplates();
    consentForms.value = consentStore.templates || [];
  } catch (e) {
    consentForms.value = [];
  } finally {
    consentFormsLoading.value = false;
  }
};

const splitLeadName = (lead) => {
  const rawName = String(resolveLeadName(lead) || lead?.name || '').trim();
  if (!rawName) return { firstName: 'CRM', lastName: 'Lead' };
  const [firstName, ...rest] = rawName.split(/\s+/);
  return {
    firstName: firstName || 'CRM',
    lastName: rest.join(' ') || '-',
  };
};

const findExistingConsentPatient = async (lead) => {
  const searchTerms = [resolveLeadEmail(lead), resolveLeadPhone(lead), resolveLeadName(lead)]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  for (const term of searchTerms) {
    try {
      const res = await diaryStore.listPatients(term);
      if (res?.code !== 0 || !Array.isArray(res?.data)) continue;
      const match = res.data.find((patient) => {
        const fullName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim().toLowerCase();
        const leadName = String(resolveLeadName(lead) || lead?.name || '').trim().toLowerCase();
        const sameEmail = String(patient?.email || '').trim().toLowerCase() &&
          String(patient?.email || '').trim().toLowerCase() === String(resolveLeadEmail(lead) || '').trim().toLowerCase();
        const samePhone = String(patient?.mobile || '').trim() &&
          String(patient?.mobile || '').trim() === String(resolveLeadPhone(lead) || '').trim();
        const sameName = leadName && fullName === leadName;
        return sameEmail || samePhone || sameName;
      });
      if (match) return match;
    } catch {}
  }
  return null;
};

const ensureConsentPatient = async (lead) => {
  const existingId = Number(lead?.patientId || 0);
  if (existingId) {
    const existing = await diaryStore.getPatient(existingId);
    if (existing?.code === 0 && existing?.data?.id) return existing.data;
  }

  const matched = await findExistingConsentPatient(lead);
  if (matched?.id) {
    cacheLeadPatient(lead, matched);
    return matched;
  }

  const { firstName, lastName } = splitLeadName(lead);
  const created = await diaryStore.createPatient({
    firstName,
    lastName,
    email: resolveLeadEmail(lead) || null,
    mobile: resolveLeadPhone(lead) || null,
    acquisitionSource: lead?.leadSource?.name || lead?.leadSource || 'CRM Lead',
    occupation: lead?.occupation || null,
  });
  if (created?.code === 0 && created?.data?.id) {
    cacheLeadPatient(lead, created.data);
    return created.data;
  }
  throw new Error(created?.message || 'Unable to prepare patient for form sending');
};

const mapConsentPatient = (patient, fallbackLead = null) => {
  const fullName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  const { firstName, lastName } = fullName
    ? { firstName: patient?.firstName || '', lastName: patient?.lastName || '' }
    : splitLeadName(fallbackLead || {});
  return {
    id: Number(patient?.id || 0) || null,
    firstName,
    lastName,
    name: fullName || resolveLeadName(fallbackLead) || 'Lead',
    email: patient?.email || resolveLeadEmail(fallbackLead) || undefined,
    phone: patient?.mobile || patient?.phone || resolveLeadPhone(fallbackLead) || undefined,
  };
};

const selectConsentForm = async (form) => {
  selectedConsentForm.value = form;
  showConsentFormSelect.value = false;
  const lead = selectedLeads.value[0];
  consentFormSenderLead.value = lead || null;
  consentResolvedPatient.value = null;
  if (!lead) return;
  try {
    const patient = await ensureConsentPatient(lead);
    consentResolvedPatient.value = mapConsentPatient(patient, lead);
    showConsentFormSender.value = true;
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Unable to prepare patient for form sending', type: 'error' });
    selectedConsentForm.value = null;
    consentFormSenderLead.value = null;
  }
};

const onConsentFormSent = () => {
  showConsentFormSender.value = false;
  selectedConsentForm.value = null;
  consentFormSenderLead.value = null;
  consentResolvedPatient.value = null;
};

const closeConsentFormSender = () => {
  showConsentFormSender.value = false;
  selectedConsentForm.value = null;
  consentFormSenderLead.value = null;
  consentResolvedPatient.value = null;
};

const showWhatsAppCompose = ref(false);
const whatsappSending = ref(false);
const whatsappMessage = ref('');
const whatsappTextarea = ref(null);
const whatsappTokens = [
  '[Name]',
  '[Email]',
  '[Telephone]',
  '[Your Name]',
];
const rolesList = ref([]);
const automationSaving = reactive({});

const resolveLeadName = (lead) => getLeadDisplayName(lead);
const resolveLeadEmail = (lead) => getLeadEmail(lead);
const resolveLeadPhone = (lead) => getLeadPhone(lead);

const getStoredOrg = () => {
  if (typeof window === 'undefined') return null
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (storedUser?.userOrganisations?.length && storedUser?.currentLoggedInOrgId) {
      const activeOrgs = storedUser.userOrganisations.filter((org) => org.status === 'Active')
      const orgWrapper =
        activeOrgs.find((org) => org.organisationId === storedUser.currentLoggedInOrgId) ||
        activeOrgs.find((org) => org.organisation?.id === storedUser.currentLoggedInOrgId)
      if (orgWrapper?.organisation) return orgWrapper.organisation
      if (orgWrapper?.name) return orgWrapper
    }
  } catch {}
  return null
}

const resolveOrgDetails = () => {
  return (
    getStoredOrg() ||
    mainStore?.getOrgDetails ||
    mainStore?.organisation ||
    mainStore?.organization ||
    mainStore?.org ||
    mainStore?.orgDetails ||
    {}
  )
}

const resolvePracticeName = () => {
  const org = resolveOrgDetails()
  return org?.name || '[Practice Name]'
}

const normalizeLicenseType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  const exact = Object.values(LICENSE_TYPES).find(
    (license) => String(license).toLowerCase() === raw
  );
  return exact || LICENSE_TYPES.TRIAL;
};

const currentOrgLicense = computed(() => {
  const licenseType = String(authStore.loggedUser?.licenseType || user.value?.licenseType || '').trim();
  if (licenseType) return licenseType;
  const orgId = Number(user.value?.currentLoggedInOrgId || 0);
  const prefs = Array.isArray(user.value?.preferences) ? user.value.preferences : [];
  const match = prefs.find((row) => Number(row?.organisationId || 0) === orgId);
  return String(match?.licenseType || 'Trial').trim();
});


const resolvedTier = computed(() => {
  const raw = String(currentOrgLicense.value || '').trim();
  const map = { System: 'Pro', Trial: 'Lite', Drift: 'Lite', Glide: 'CRM', Soar: 'Pro' };
  return map[raw] ?? (raw || 'Lite');
});
const canBookAppointments = computed(() => ['Pro', 'Soar', 'System'].includes(resolvedTier.value));

const renderTemplateWithContext = (input, ctx, lead) => {
  const withMustache = String(input || '')
    .replaceAll('{{name}}', ctx.name || '')
    .replaceAll('{{firstName}}', ctx.firstName || '')
    .replaceAll('{{email}}', ctx.email || '')
    .replaceAll('{{yourName}}', ctx.yourName || '')
    .replaceAll('{{info}}', ctx.info || '')

  return applyCrmPlaceholders(withMustache, {
    recipient: {
      name: ctx.name || 'User',
      firstName: ctx.firstName || 'User',
      email: ctx.email || '',
      yourName: ctx.yourName || 'Team',
    },
    lead: lead || null,
    org: resolveOrgDetails(),
    practiceName: resolvePracticeName(),
  }).replaceAll('[Patient Info]', ctx.info || '')
}

const whatsappRecipients = computed(() => {
  const nums = (selectedLeads.value || [])
    .map((lead) => resolveLeadPhone(lead))
    .filter(Boolean);
  return [...new Set(nums)];
});

const hasWhatsAppRecipients = computed(() => whatsappRecipients.value.length > 0);

const loadAutomationGroups = ({ force = false } = {}) => crmStore.fetchAutomationGroups({ force });

const resolvedAutomationGroups = computed(() =>
  crmStore.automationGroupRows.length ? crmStore.automationGroupRows : crmAutomationGroups
);

const loadLeadAutomations = (leadId, { force = false } = {}) => crmStore.fetchLeadAutomations(leadId, { force });

const AUTOMATION_PREFETCH_CONCURRENCY = 6;
let automationPrefetchToken = 0;

const runWithConcurrency = async (items, limit, worker) => {
  const queue = Array.isArray(items) ? items : [];
  const concurrency = Math.max(1, Math.min(limit, queue.length || 1));
  let cursor = 0;

  const runners = Array.from({ length: concurrency }, async () => {
    while (cursor < queue.length) {
      const currentIndex = cursor;
      cursor += 1;
      await worker(queue[currentIndex], currentIndex);
    }
  });

  await Promise.all(runners);
};

const onAutomationMenuOpen = async (lead) => {
  if (!lead?.id) return;
  await Promise.all([
    crmStore.fetchAutomationGroups({ force: true, silent: true }),
    crmStore.fetchLeadAutomations(lead.id, { force: true, silent: true }),
  ]);
};

const _onAutomationGroupsUpdated = () =>
  crmStore.fetchAutomationGroups({ force: true, silent: true });
const _onAutomationsUpdated = (event) => prefetchVisibleLeadAutomations({
  force: true,
  groupsChanged: event?.detail?.groupsChanged === true,
  leadIds: Array.isArray(event?.detail?.leadIds) ? event.detail.leadIds : [],
});

onMounted(() => {
  if (typeof window === 'undefined') return;
  crmStore.fetchAutomationGroups({ silent: true });
  window.addEventListener('crm-automation-groups-updated', _onAutomationGroupsUpdated);
  window.addEventListener('crm-automations-updated', _onAutomationsUpdated);
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('crm-automation-groups-updated', _onAutomationGroupsUpdated);
  window.removeEventListener('crm-automations-updated', _onAutomationsUpdated);
});

const prefetchVisibleLeadAutomations = async ({ force = false, groupsChanged = false, leadIds = [], sourceLeads = null } = {}) => {
  const requestToken = ++automationPrefetchToken;
  const visibleIds = [...new Set((sourceLeads || activeLeads.value).map((lead) => Number(lead?.id || 0)).filter(Boolean))];
  if (!visibleIds.length) return;
  const normalizedLeadIds = [...new Set((Array.isArray(leadIds) ? leadIds : [])
    .map((id) => Number(id || 0))
    .filter(Boolean))];
  const ids = groupsChanged || !normalizedLeadIds.length
    ? visibleIds
    : visibleIds.filter((id) => normalizedLeadIds.includes(id));
  if (!ids.length) return;
  await crmStore.fetchAutomationGroups({
    force: force || groupsChanged,
    silent: true,
  });

  await runWithConcurrency(ids, AUTOMATION_PREFETCH_CONCURRENCY, async (leadId) => {
    if (requestToken !== automationPrefetchToken) return;
    await crmStore.fetchLeadAutomations(leadId, { force, silent: true });
  });
};

watch(
  () => activeLeads.value.map((lead) => Number(lead?.id || 0)).filter(Boolean).join(','),
  () => {
    prefetchVisibleLeadAutomations();
  },
  { immediate: true }
);

// Prefetch automations for converted leads when the converted panel is opened
watch(openedPanels, (panels) => {
  if (panels.includes(1) && convertedLeadsData.value.length) {
    prefetchVisibleLeadAutomations({ sourceLeads: convertedLeadsData.value });
  }
});

// Also handles the case where converted leads finish loading while the panel is already open
watch(
  () => convertedLeadsData.value.map((lead) => Number(lead?.id || 0)).filter(Boolean).join(','),
  () => {
    if (openedPanels.value.includes(1)) {
      prefetchVisibleLeadAutomations({ sourceLeads: convertedLeadsData.value });
    }
  }
);

const getLeadGroupRows = (lead, group) => {
  const rows = crmStore.automationRowsCache[Number(lead?.id)] || [];
  const keys = group?.templateKeys || [];
  if (keys.length) {
    const keySet = new Set(keys);
    return rows.filter((row) => keySet.has(row?.key));
  }
  return rows.filter((row) => row?.groupKey === group?.key);
};

const isLeadGroupEnabled = (lead, group) =>
  getLeadGroupRows(lead, group).some((row) => row?.enabled);

const getLeadAutomationGroups = (lead) =>
  resolvedAutomationGroups.value.filter((group) => isLeadGroupEnabled(lead, group));

const getLeadAutomationGroupNames = (lead) =>
  getLeadAutomationGroups(lead).map((group) => group?.title || group?.key || 'Automation Group');

/** Stable “random” color per group (same key → same color across rows and renders). */
const AUTOMATION_GROUP_DISPLAY_COLORS = [
  '#00D07E',
  '#6D6CFF',
  '#FE65CB',
  '#007EED',
  '#ECB313',
  '#923CF6',
  '#FF2531',
  '#A22984',
  '#D114CF',
];

const automationGroupDisplayColor = (group) => {
  const k = String(group?.key ?? group?.title ?? '');
  let h = 0;
  for (let i = 0; i < k.length; i += 1) {
    h = (h * 31 + k.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % AUTOMATION_GROUP_DISPLAY_COLORS.length;
  return AUTOMATION_GROUP_DISPLAY_COLORS[idx];
};

const getLeadAutomationGroupDisplay = (lead) => {
  const groups = getLeadAutomationGroups(lead).map((group) => ({
    ...group,
    avatarColor: automationGroupDisplayColor(group),
  }));
  return {
    visible: groups.slice(0, 3),
    overflow: groups.slice(3),
  };
};

const truncateAutomationName = (name, max = 20) => {
  const safe = String(name || '').trim();
  if (!safe) return '';
  if (safe.length <= max) return safe;
  return `${safe.slice(0, Math.max(0, max - 3))}...`;
};


const buildAutomationPayload = (row, leadId, groupKey) => {
  const def = defaultAutomationMap.get(row?.key) || {};
  const payload = {
    key: row?.key,
    type: row?.type || def.type || 'Email',
    name: row?.name || def.name || row?.key,
    subject: row?.subject || def.subject || def.name || '',
    sending: row?.sending || def.sending || '',
    enabled: !!row?.enabled,
    template:
      row?.template && String(row.template).trim()
        ? row.template
        : def.template || '',
    whatsappTemplateName:
      row?.whatsappTemplateName || def.whatsappTemplateName || undefined,
    whatsappTemplateLanguage:
      row?.whatsappTemplateLanguage || def.whatsappTemplateLanguage || undefined,
  };
  const resolvedGroupKey = row?.groupKey || groupKey;
  if (resolvedGroupKey) payload.groupKey = resolvedGroupKey;
  if (leadId) payload.leadId = leadId;
  return payload;
};

const toggleLeadGroup = async (lead, group, enabled) => {
  const leadId = lead?.id;
  if (!leadId || !group) return;
  await crmStore.fetchLeadAutomations(leadId);

  const currentRows = crmStore.automationRowsCache[Number(leadId)] || [];
  const keys = group?.templateKeys || [];
  let groupRows = [];

  if (keys.length) {
    const rowMap = new Map(currentRows.map((row) => [row?.key, row]));
    const extraRows = [];
    groupRows = keys
      .map((key) => {
        if (rowMap.has(key)) return rowMap.get(key);
        const def = defaultAutomationMap.get(key);
        if (!def) {
          const stub = { key, enabled: false, type: 'Email' };
          extraRows.push(stub);
          rowMap.set(key, stub);
          return stub;
        }
        const nextRow = { ...def };
        extraRows.push(nextRow);
        rowMap.set(key, nextRow);
        return nextRow;
      })
      .filter(Boolean);
    if (extraRows.length) {
      crmStore.setLeadAutomationsOptimistic(leadId, [...currentRows, ...extraRows]);
    }
  } else {
    groupRows = currentRows.filter((row) => row?.groupKey === group.key);
  }

  if (!groupRows.length) return;

  const changeMap = new Map();
  const updates = [];
  groupRows.forEach((row) => {
    const nextEnabled = !!enabled;
    if (!!row?.enabled !== nextEnabled) {
      changeMap.set(row.key, nextEnabled);
      updates.push(buildAutomationPayload({ ...row, enabled: nextEnabled }, leadId, group.key));
    }
  });

  if (!updates.length) return;

  // Optimistic update via store so the column reflects the change immediately
  crmStore.setLeadAutomationsOptimistic(
    leadId,
    (crmStore.automationRowsCache[Number(leadId)] || []).map((row) =>
      changeMap.has(row?.key) ? { ...row, enabled: changeMap.get(row.key) } : row
    )
  );

  automationSaving[leadId] = true;
  try {
    await crmStore.saveAutomationBatch({ items: updates });
    await crmStore.fetchLeadAutomations(leadId, { force: true, silent: true });
  } catch (e) {
    // Roll back optimistic update
    crmStore.setLeadAutomationsOptimistic(
      leadId,
      (crmStore.automationRowsCache[Number(leadId)] || []).map((row) =>
        changeMap.has(row?.key) ? { ...row, enabled: !changeMap.get(row.key) } : row
      )
    );
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({
        title: 'Failed to update automation group',
        type: 'error',
      });
    }
  } finally {
    automationSaving[leadId] = false;
  }
};

const disableAutomationGroup = (lead, group) => toggleLeadGroup(lead, group, false);

const getEditableFieldValue = (item, field) => {
  if (field === 'name') return resolveLeadName(item);
  if (field === 'email') return resolveLeadEmail(item);
  if (field === 'telephone') return resolveLeadPhone(item);
  return item?.[field] || '';
};

// Inline editing functions
const startEdit = (item, field) => {
  editingCell.id = item.id;
  editingCell.field = field;
  const initial = getEditableFieldValue(item, field);
  editingCell.value = initial;
  editingCell.originalValue = initial;
  
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

const isActionLocked = (key) => ['book', 'sendForm'].includes(key) && !canBookAppointments.value;

const onActionClick = (key) => {
  if (!selectedLeads.value.length) return;
  if (key === 'book') {
    if (!canBookAppointments.value) {
      window.dispatchEvent(new CustomEvent('upgrade-required', { detail: { feature: 'patientBooking' } }));
      return;
    }
    emit('book', [...selectedLeads.value])
  }
  else if (key === 'automations') {
    bulkAutomationsTab.value = 'automation'
    showBulkAutomationsDialog.value = true
  }
  else if (key === 'delete') confirmDelete.value = true;
  else if (key === 'archive') confirmArchive.value = true;
  else if (key === 'convert') convertSelected();
  else if (key === 'export') exportSelectedLeads();
  else if (key === 'whatsapp') openWhatsAppCompose();
  else if (key === 'sendPrice') openSendPriceCompose();
  else if (key === 'sendForm') {
    if (!canBookAppointments.value) {
      window.dispatchEvent(new CustomEvent('upgrade-required', { detail: { feature: 'patientBooking' } }));
      return;
    }
    openConsentFormSelect()
  }
  else if (['mail','shareLocation'].includes(key)) openCompose(key)
};

const onConvertedActionClick = (key) => {
  if (!selectedConvertedLeads.value.length) return;
  selectedLeads.value = [...selectedConvertedLeads.value];
  onActionClick(key);
};

const onArchivedActionClick = (key) => {
  if (key === 'restore') confirmRestore.value = true;
  else if (key === 'delete' && canDelete.value) confirmArchivedDelete.value = true;
};

const formatDate = (d) => {
  return formatDateDDMMYYYY(d);
};

const resolveLeadValue = (lead, key) => {
  if (key === 'name') return resolveLeadName(lead);
  if (key === 'email') return resolveLeadEmail(lead);
  if (key === 'telephone') return resolveLeadPhone(lead);
  if (key === 'leadSource') return lead?.leadSource?.name || lead?.leadSource || '';
  if (key === 'treatment') return formatTreatmentValue(lead?.treatment);
  if (key === 'assigned') return formatAssignedUsers(lead?.assigned || []);
  if (key === 'inquiryDate') return formatDateTime(lead?.[key]);
  if (key === 'followUpDate') return formatDate(lead?.[key]);
  if (key === 'metaPage') return lead?.metaPage || lead?.pageName || '';
  if (key === 'pageName') return lead?.pageName || lead?.metaPage || '';
  if (key === 'pageId') return lead?.pageId || '';
  if (key === 'formId') return lead?.formId || '';
  if (key === 'leadId') return lead?.leadId || '';
  if (key === 'automation') return getLeadAutomationGroupNames(lead).join(', ');
  if (key === 'comments') return lead?.comments || '';
  if (key === 'alert') return lead?.alert || '';
  const value = lead?.[key];
  if (value && typeof value === 'object') return value?.name || JSON.stringify(value);
  return value ?? '';
};

const buildCsvValue = (value, key = '') => {
  let text = value == null ? '' : String(value);
  text = text.replace(/[\r\n]+/g, ' ').trim();
  const lowerKey = String(key || '').toLowerCase();
  const forceTextKeys = [
    'telephone',
    'phone',
    'mobile',
    'whatsapp',
    'whatsappnumber',
    'phonenumber',
    'secondaryphone',
  ];
  const looksNumeric = /^\+?\d{7,}$/.test(text);
  if ((forceTextKeys.some((k) => lowerKey.includes(k)) || looksNumeric) && text) {
    text = `\t${text}`;
  }
  if (/[\",\\n]/.test(text)) return `\"${text.replace(/\"/g, '\"\"')}\"`;
  return text;
};

const exportSelectedLeads = () => {
  if (typeof window === 'undefined') return;
  const columns = (selectedHeaders.value.length ? selectedHeaders.value : props.headers || [])
    .filter((h) => h?.key && h.key !== 'data-table-select' && h.key !== 'actions')
    .map((h) => ({ key: h.key, title: h.title || h.key }));
  if (!columns.length) return;

  const rows = selectedLeads.value.map((lead) =>
    columns.map((col) => buildCsvValue(resolveLeadValue(lead, col.key), col.key)).join(',')
  );
  const header = columns.map((col) => buildCsvValue(col.title, col.key)).join(',');
  const csv = '\uFEFF' + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-export-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const allCurrentlySelected =
    archivedLeads.value.length > 0 &&
    archivedLeads.value.every((lead) =>
      selectedArchivedLeads.value.some((selected) => selected.id === lead.id)
    );

  if (allCurrentlySelected) {
    isAllArchived.value = false;
    selectedArchivedLeads.value = [];
  } else {
    selectedArchivedLeads.value = [...archivedLeads.value];
    isAllArchived.value = true;
  }
};
const onArchivedSelectionChange = () => {
  isAllArchived.value =
    !!archivedLeads.value.length &&
    archivedLeads.value.every((lead) =>
      selectedArchivedLeads.value.some((selected) => selected.id === lead.id)
    );
};
const toggleAllConverted = () => {
  const allCurrentlySelected =
    convertedLeadsData.value.length > 0 &&
    convertedLeadsData.value.every((lead) =>
      selectedConvertedLeads.value.some((selected) => selected.id === lead.id)
    );
  if (allCurrentlySelected) {
    isAllConverted.value = false;
    selectedConvertedLeads.value = [];
  } else {
    selectedConvertedLeads.value = [...convertedLeadsData.value];
    isAllConverted.value = true;
  }
};
const onConvertedSelectionChange = () => {
  isAllConverted.value =
    !!convertedLeadsData.value.length &&
    convertedLeadsData.value.every((lead) =>
      selectedConvertedLeads.value.some((selected) => selected.id === lead.id)
    );
};
const closeTray = () => {
  isAllSelected.value = false;
  selectedLeads.value = [];
  isAllArchived.value = false;
  selectedArchivedLeads.value = [];
  isAllConverted.value = false;
  selectedConvertedLeads.value = [];
  confirmArchive.value = false;
  confirmRestore.value = false;
  confirmArchivedDelete.value = false;
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
    else if (key === 'leadStatus') {
      payload.leadStatus = row?.leadStatus || null
      payload.softDeleted = String(row?.leadStatus || '').toLowerCase() === 'archived'
    }
    else if (key === 'alert') payload.alert = row?.alert || null
    else return
    const res = await crmStore.updateLead(payload)
    if (res?.code === 0 && key === 'leadStatus') {
      row.softDeleted = !!payload.softDeleted
      emit('refresh')
    }
  } catch (e) {}
};

const editingHeaderKey = ref(null)
const headerOriginalTitle = ref('')

const startHeaderRename = (column) => {
  editingHeaderKey.value = column.key
  headerOriginalTitle.value = column.title
}

const cancelHeaderRename = (column) => {
  column.title = headerOriginalTitle.value
  editingHeaderKey.value = null
}

const saveHeaderRename = async (column) => {
  const newTitle = column.title?.trim()
  editingHeaderKey.value = null
  if (!newTitle || newTitle === headerOriginalTitle.value) {
    column.title = headerOriginalTitle.value
    return
  }
  try {
    const res = await crmStore.updateCrmCustomColumn({ columnId: column.columnDefinitionId, displayName: newTitle })
    if (res?.code !== 0) {
      column.title = headerOriginalTitle.value
      mainStore.setSnackbar({ title: res?.message || 'Failed to rename column', type: 'error' })
    } else {
      saveColumnPreferences()
    }
  } catch {
    column.title = headerOriginalTitle.value
  }
}

const getCustomValue = (item, columnDefinitionId) => {
  const cf = (item.customFields || []).find(f => f.columnDefinitionId === columnDefinitionId)
  return cf?.value || ''
}

const setCustomValue = (item, columnDefinitionId, value) => {
  if (!item.customFields) item.customFields = []
  const cf = item.customFields.find(f => f.columnDefinitionId === columnDefinitionId)
  if (cf) cf.value = value
  else item.customFields.push({ columnDefinitionId, value })
}

const saveCustomField = async (item, col) => {
  const value = getCustomValue(item, col.columnDefinitionId)
  cancelEdit()
  try {
    await crmStore.updateLead({ id: item.id, customFields: [{ columnDefinitionId: col.columnDefinitionId, value }] })
  } catch (e) {}
}

const openLeadDialog = (lead) => {
  selectedLead.value = lead;
  showLeadDetailDialog.value = true;
};

const handleLeadDialogClose = () => {
  showLeadDetailDialog.value = false;
  dialogInitialTab.value = null;

  // Only re-fetch if the user actually toggled something inside the dialog
  const leadId = selectedLead.value?.id;
  if (leadId) crmStore.invalidateLeadAutomationsIfDirty(leadId);

  if (route.query.leadId || route.query.orgId) {
    const newQuery = { ...route.query };
    delete newQuery.leadId;
    delete newQuery.orgId;
    delete newQuery.tab;
    router.replace({ query: newQuery });
  }
};

watch(
  () => route.query.leadId,
  (leadId) => {
    if (leadId) {
      syncLeadDialogWithRoute(leadId);
    }
  },
  { immediate: true }
);

// Compose mail dialog
const showCompose = ref(false)
const composeLoading = ref(false)
let EditorCtor = null
let Header = null
let List = null
const compose = reactive({ key: 'mail', subject: '', recipients: [], html: '', attachments: [] })
const showSendPriceCompose = ref(false)
const sendPriceLoading = ref(false)
const sendPriceUploadLoading = ref(false)
const sendPriceHolder = ref(null)
let sendPriceEditor = null
const sendPrice = reactive({
  subject: '',
  recipients: [],
  html: '',
  priceLink: '',
})
const sendPriceAttachment = ref(null)

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

const ensureEditorModules = async () => {
  if (typeof window === 'undefined') return false
  if (EditorCtor && Header && List) return true
  const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
  ])
  EditorCtor = E
  Header = H
  List = L
  return true
}

const getSelectedEmails = () => {
  const emails = (selectedLeads.value || [])
    .map((lead) => resolveLeadEmail(lead))
    .filter(Boolean)
  return [...new Set(emails)]
}

async function openCompose(actionKey) {
  compose.key = actionKey
  compose.recipients = getSelectedEmails()
  const def = defaultTemplates[actionKey] || defaultTemplates.mail
  const many = (selectedLeads.value || []).length !== 1
  const lead = many ? null : (selectedLeads.value || [])[0]
  const ctx = buildRecipientContext({
    lead,
    user,
    many,
    fallbackName: 'User',
    fallbackEmail: '',
    fallbackYourName: 'Team',
  })
  compose.subject = renderTemplateWithContext(def.subject, ctx, lead)
  compose.html = renderTemplateWithContext(def.html, ctx, lead)
  compose.attachments = []
  showCompose.value = true
}

const openSendPriceCompose = async () => {
  sendPrice.recipients = getSelectedEmails()
  const def = defaultTemplates.sendPrice
  const many = (selectedLeads.value || []).length !== 1
  const lead = many ? null : (selectedLeads.value || [])[0]
  const ctx = buildRecipientContext({
    lead,
    user,
    many,
    fallbackName: 'User',
    fallbackEmail: '',
    fallbackYourName: 'Team',
  })
  sendPrice.subject = renderTemplateWithContext(def.subject, ctx, lead)
  sendPrice.html = renderTemplateWithContext(def.html, ctx, lead)
  sendPrice.priceLink = ''
  sendPriceAttachment.value = null

  const leadIds = (selectedLeads.value || []).map((row) => Number(row?.id)).filter(Boolean)
  if (leadIds.length) {
    try {
      const recent = await crmStore.getLeadPriceAttachmentRecent({ leadIds })
      if (recent?.code === 0 && recent?.data) {
        sendPriceAttachment.value = recent.data.attachment || null
        sendPrice.priceLink = String(recent.data.priceLink || '')
        if (recent.data.subject) sendPrice.subject = String(recent.data.subject)
      }
    } catch {}
  }

  showSendPriceCompose.value = true
  await nextTick()
  if (!(await ensureEditorModules())) return
  if (sendPriceEditor) {
    sendPriceEditor.destroy()
    sendPriceEditor = null
  }
  sendPriceEditor = new EditorCtor({
    holder: sendPriceHolder.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(sendPrice.html || ''),
    async onChange(api) {
      const saved = await api.saver.save()
      sendPrice.html = blocksToHtml(saved)
    },
  })
}

watch(() => showSendPriceCompose.value, (v) => {
  if (!v && sendPriceEditor) {
    sendPriceEditor.destroy()
    sendPriceEditor = null
  }
})

const clearSendPriceAttachment = () => {
  sendPriceAttachment.value = null
}

const onSendPriceFiles = async (files) => {
  const file = Array.isArray(files) ? files[files.length - 1] : null
  if (!file) return
  const isPdf = String(file?.type || '').toLowerCase().includes('pdf') || String(file?.name || '').toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    mainStore?.setSnackbar?.({ title: 'Only PDF files are allowed', type: 'error' })
    return
  }
  try {
    sendPriceUploadLoading.value = true
    const formData = new FormData()
    formData.append('file', file)
    const res = await crmStore.uploadLeadAttachment(formData)
    if (res?.code === 0 && res?.data?.link) {
      sendPriceAttachment.value = res.data
      mainStore?.setSnackbar?.({ title: 'Price list uploaded', type: 'success' })
      return
    }
    mainStore?.setSnackbar?.({ title: res?.message || 'Failed to upload file', type: 'error' })
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to upload file', type: 'error' })
  } finally {
    sendPriceUploadLoading.value = false
  }
}

const openWhatsAppCompose = () => {
  if (!selectedLeads.value.length) return;
  whatsappMessage.value = '';
  showWhatsAppCompose.value = true;
};

const insertWhatsAppToken = async (token) => {
  const current = String(whatsappMessage.value || '');
  const el = whatsappTextarea.value?.$el?.querySelector?.('textarea');
  if (!el) {
    whatsappMessage.value = `${current}${token}`;
    return;
  }
  const start = Number.isFinite(el.selectionStart) ? el.selectionStart : current.length;
  const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : current.length;
  const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
  whatsappMessage.value = next;
  await nextTick();
  const caret = start + token.length;
  el.focus();
  if (typeof el.setSelectionRange === 'function') {
    el.setSelectionRange(caret, caret);
  }
};

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
    const ctx = buildRecipientContext({
      lead,
      user,
      many,
      fallbackName: 'User',
      fallbackEmail: '',
      fallbackYourName: 'Team',
    })
    const resolvedSubject = renderTemplateWithContext(compose.subject, ctx, lead)
    const resolvedHtml = renderTemplateWithContext(compose.html, ctx, lead)
    const res = await crmStore.sendLeadMail({
      leadIds,
      subject: resolvedSubject,
      html: resolvedHtml,
      key: `manual_${compose.key}`,
      attachments: Array.isArray(compose.attachments) ? compose.attachments : [],
    })
    if (res && res.code === 0) {
      if (mainStore && mainStore.setSnackbar) mainStore.setSnackbar({ title: `Mail sent to ${res.data?.sent || compose.recipients.length} recipient(s)`, type: 'success' })
      showCompose.value = false
    }
  } finally { composeLoading.value = false }
}

async function sendPriceCompose() {
  try {
    sendPriceLoading.value = true
    const leadIds = selectedLeads.value.map((lead) => lead.id).filter(Boolean)
    if (!leadIds.length) return
    const many = (selectedLeads.value || []).length !== 1
    const lead = many ? null : (selectedLeads.value || [])[0]
    const ctx = buildRecipientContext({
      lead,
      user,
      many,
      fallbackName: 'User',
      fallbackEmail: '',
      fallbackYourName: 'Team',
    })
    const resolvedSubject = renderTemplateWithContext(sendPrice.subject || 'Price List', ctx, lead)
    const resolvedBody = sendPrice.html ? renderTemplateWithContext(sendPrice.html, ctx, lead) : ''
    const link = String(sendPrice.priceLink || '').trim()
    const linkHtml = link
      ? `<p><strong>Price Link:</strong> <a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>`
      : ''
    const resolvedHtml = [resolvedBody, linkHtml].filter(Boolean).join('')
    const attachments = sendPriceAttachment.value?.link ? [sendPriceAttachment.value] : []

    const res = await crmStore.sendLeadMail({
      leadIds,
      subject: resolvedSubject,
      html: resolvedHtml,
      key: 'manual_sendPrice',
      attachments,
      metadata: {
        priceLink: link,
      },
    })
    if (res?.code === 0) {
      const sent = Number(res?.data?.sent || 0)
      mainStore?.setSnackbar?.({
        title: sent ? `Mail sent to ${sent} recipient(s)` : 'No emails were sent',
        type: sent ? 'success' : 'warning',
      })
      showSendPriceCompose.value = false
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to send price email'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    sendPriceLoading.value = false
  }
}

async function sendWhatsAppMessage() {
  if (!selectedLeads.value.length) return;
  const message = String(whatsappMessage.value || '').trim();
  if (!message) return;
  if (!hasWhatsAppRecipients.value) {
    mainStore?.setSnackbar?.({ title: 'No WhatsApp numbers found for the selected lead(s)', type: 'error' });
    return;
  }
  try {
    whatsappSending.value = true;
    const leadIds = selectedLeads.value.map((lead) => lead.id);
    const res = await crmStore.sendLeadWhatsApp({ leadIds, message });
    if (res?.code === 0) {
      const sent = res?.data?.sent ?? 0;
      const failed = res?.data?.failed ?? 0;
      const skipped = res?.data?.skipped ?? 0;
      if (mainStore?.setSnackbar) {
        const detail = [sent ? `${sent} sent` : null, failed ? `${failed} failed` : null, skipped ? `${skipped} skipped` : null]
          .filter(Boolean)
          .join(' - ');
        mainStore.setSnackbar({
          title: detail || 'WhatsApp sent',
          type: failed ? 'warning' : 'success',
        });
      }
      showWhatsAppCompose.value = false;
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to send WhatsApp message';
    mainStore?.setSnackbar?.({ title: msg, type: 'error' });
  } finally {
    whatsappSending.value = false;
  }
}
const getLeadUsers = (lead) => {
  // Filter to show only active users (not invited, disabled, or expired)
  return props.users.filter((x) => x.orgStatus === "Active" && !x.isAccountDeactivated);
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

const deleteLeadRows = async (rows, options = {}) => {
  const {
    loadingRef,
    closeConfirm,
    successTitle = 'Lead(s) deleted permanently',
    errorTitle = 'Unable to delete leads',
  } = options;
  if (!rows.length) {
    closeConfirm?.();
    return;
  }
  try {
    if (loadingRef) loadingRef.value = true;
    const ids = rows.map((lead) => lead.id).filter(Boolean);
    const res = await crmStore.deleteLeads(ids);
    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: successTitle, type: 'success' });
      emit('refresh');
    }
  } catch (e) {
    console.error(errorTitle, e);
    mainStore?.setSnackbar?.({ title: errorTitle, type: 'error' });
  } finally {
    if (loadingRef) loadingRef.value = false;
    closeConfirm?.();
    closeTray();
  }
};

const doDelete = async () => {
  await deleteLeadRows(selectedLeads.value, {
    loadingRef: deleting,
    closeConfirm: () => { confirmDelete.value = false; },
  });
};

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
    emit('refresh');
  } catch (e) {
    console.error('Failed to archive leads', e);
    if (mainStore?.setSnackbar) mainStore.setSnackbar({ title: 'Unable to archive leads', type: 'error' });
  } finally {
    archiving.value = false;
    confirmArchive.value = false;
    closeTray();
  }
};

const doRestore = async () => {
  if (!selectedArchivedLeads.value.length) {
    confirmRestore.value = false;
    return;
  }
  try {
    restoring.value = true;
    for (const lead of selectedArchivedLeads.value) {
      const res = await crmStore.updateLead({
        id: lead.id,
        leadStatus: 'New',
        softDeleted: false,
      });
      if (res?.code === 0) {
        lead.leadStatus = 'New';
        lead.softDeleted = false;
      }
    }
    mainStore?.setSnackbar?.({ title: 'Lead(s) restored', type: 'success' });
    emit('refresh');
  } catch (e) {
    console.error('Failed to restore leads', e);
    mainStore?.setSnackbar?.({ title: 'Unable to restore leads', type: 'error' });
  } finally {
    restoring.value = false;
    confirmRestore.value = false;
    closeTray();
  }
};

const doDeleteArchived = async () => {
  await deleteLeadRows(selectedArchivedLeads.value, {
    loadingRef: deletingArchived,
    closeConfirm: () => { confirmArchivedDelete.value = false; },
    successTitle: 'Archived lead(s) deleted permanently',
    errorTitle: 'Unable to delete archived leads',
  });
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

defineExpose({
  selectedHeaders,
  filteredAvailableHeaders,
  addHeaderInSelected,
  removeHeaderFromSelected,
  getColColor,
})
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

/* Inline editing styles */
.editable-field {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  min-height: 24px;
}

.break-email {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}
.comment-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
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
  font-size: 14px;
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
  width: 6px;
}

.comment-scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 999px;
}

.comment-scrollable::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 999px;
  border: 1px solid #f1f1f1;
}

.comment-scrollable::-webkit-scrollbar-thumb:hover {
  background: #c4c4c4;
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
.compose-dialog-card {
  display: flex;
  flex-direction: column;
  max-height: min(88vh, 820px);
  overflow: hidden;
}

.compose-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
}

.compose-dialog-footer {
  flex-shrink: 0;
  background: #fff;
}

.send-price-card {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
}
.send-price-body {
  max-height: min(62vh, 560px);
  overflow-y: auto;
  background: #fcfcfd;
}
.send-price-footer {
  border-top: 1px solid #eceef2;
  background: #ffffff;
  position: sticky;
  bottom: 0;
  z-index: 2;
}
.send-price-upload-card {
  border: 1px solid #dbdbdb;
  border-radius: 14px;
  padding: 14px;
  background: #ffffff;
}
.uploaded-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fafafa;
}
.uploaded-file-meta {
  display: flex;
  align-items: center;
  min-width: 0;
}
.uploaded-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
.send-price-editor {
  min-height: 140px;
}
.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

.action-item:hover { background-color: #f5f5f5; }

.lead-name-cell-container {
  position: relative;
  height: 100%;
}

.lead-name-cell {
  padding: 4px;
  height: 100%;
}

.lead-name-field-wrapper {
  flex: 1;
  padding-right: 8px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.lead-name-border {
  position: absolute;
  right: 50px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
  pointer-events: none;
}

.automation-cell {
  display: flex;
  align-items: center;
}

.plan-upgrade-dialog {
  background: #ffffff;
}

.plan-upgrade-dialog__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #ffffff;
}

.plan-upgrade-dialog__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.78;
}

.plan-upgrade-dialog__title {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.plan-upgrade-dialog__subtitle {
  margin-top: 8px;
  max-width: 360px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.plan-upgrade-dialog__chip {
  color: #0f172a !important;
  font-weight: 600;
}

.plan-upgrade-dialog__body {
  padding: 22px 24px 10px !important;
}

.plan-upgrade-dialog__copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
}

.plan-upgrade-dialog__feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.plan-upgrade-dialog__feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 13px;
  line-height: 1.45;
  color: #0f172a;
}

.plan-upgrade-dialog__actions {
  padding: 0 24px 20px !important;
}

.bulk-automation-tabs :deep(.v-tab) {
  border-radius: 28px;
  border: 1px solid #DBDBDB !important;
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
  font-weight: 400;
  margin-right: 10px;
  min-height: 38px;
  padding: 6px 14px;
}

.bulk-automation-tabs :deep(.v-tab.v-tab--selected) {
  background-color: #0061FB1A !important;
  border-color: #0061FB !important;
}

.bulk-automation-tabs :deep(.v-slide-group__prev),
.bulk-automation-tabs :deep(.v-slide-group__next) {
  display: none !important;
}

.crm-col-box {
  min-width: calc(33.33% - 8px);
  color: white;
  border-radius: 6px;
  text-align: center;
  font-weight: 400;
  font-size: 13px;
  cursor: pointer;
  min-height: 36px;
}
</style>


