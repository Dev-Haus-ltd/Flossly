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
                {{ props.activeTotal || activeLeads.length }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pt-0">
          <v-data-table-server
            v-model="selectedLeads"
            :headers="headers"
            :items="activeLeads"
            item-value="id"
            show-select
            hover
            class="resizable-table"
            density="compact"
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
                        class="ml-2 mb-0 editable-field" 
                        @click="startEdit(item, 'name')"
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
              <template v-else-if="col.key === 'automation'">
                <DataTableColumnsAutomationGroups
                  :lead="item"
                  :groups="resolvedAutomationGroups"
                  :get-display="getLeadAutomationGroupDisplay"
                  :is-group-enabled="isLeadGroupEnabled"
                  :toggle-group="toggleLeadGroup"
                  :on-open-menu="onAutomationMenuOpen"
                  :saving="!!automationSaving[item.id]"
                  :groups-loading="automationGroupsLoading"
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
                  <p class="mb-0 ml-2">{{ formatDate(item[col.key]) }}</p>
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
                {{ props.archivedTotal || archivedLeads.length }}
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
          <v-data-table-server
            v-else
            v-model="selectedArchivedLeads"
            :headers="headers"
            :items="archivedLeads"
            item-value="id"
            hover
            class="resizable-table"
            density="compact"
            show-select
            :items-length="props.archivedTotal || archivedLeads.length"
            :page="props.archivedPage"
            :items-per-page="props.itemsPerPage"
            :items-per-page-options="[10, 25, 50, 100]"
            :item-selectable="() => false"
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
                  <p class="ml-2 mb-0 font-weight-medium">{{ resolveLeadName(item) }}</p>
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
              <template v-else-if="col.key === 'automation'">
                <DataTableColumnsAutomationGroups
                  :lead="item"
                  :groups="resolvedAutomationGroups"
                  :get-display="getLeadAutomationGroupDisplay"
                  :is-group-enabled="isLeadGroupEnabled"
                  :toggle-group="toggleLeadGroup"
                  :on-open-menu="onAutomationMenuOpen"
                  :saving="!!automationSaving[item.id]"
                  :groups-loading="automationGroupsLoading"
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
    <v-dialog v-model="showWhatsAppCompose" max-width="640px">
      <v-card class="rounded-lg">
        <div class="d-flex justify-space-between align-center px-4 py-3">
          <div>
            <h5 class="mb-1 modal-title">Compose WhatsApp</h5>
            <div class="text-caption text-medium-emphasis">
              {{ whatsappCompose.recipients.length }} recipient(s)
            </div>
          </div>
          <v-btn icon @click="showWhatsAppCompose = false" flat><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <div class="px-4 pt-4">
          <v-alert
            v-if="whatsappCompose.missing.length"
            type="warning"
            variant="tonal"
            class="mb-3"
          >
            {{ whatsappCompose.missing.length }} lead(s) have no valid phone number and will be skipped.
          </v-alert>
          <v-alert
            v-if="whatsappProvider.supportsTemplates"
            type="info"
            variant="tonal"
            class="mb-3"
          >
            WhatsApp outbound supports templates. Templates must be approved in Meta.
          </v-alert>
          <v-radio-group
            v-if="whatsappProvider.supportsTemplates"
            v-model="whatsappCompose.mode"
            class="mb-3"
            inline
          >
            <v-radio label="Free Text" value="free" :disabled="whatsappCompose.requiresTemplate" />
            <v-radio label="Template" value="template" />
          </v-radio-group>

          <div v-if="whatsappProvider.supportsTemplates && whatsappCompose.mode === 'template'">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-2 text-grey-darken-1">Template</div>
              <v-btn
                size="x-small"
                variant="text"
                :loading="whatsappTemplatesLoading"
                @click="loadWhatsAppTemplates"
              >
                Refresh
              </v-btn>
            </div>
            <v-combobox
              v-model="whatsappCompose.templateName"
              :items="whatsappTemplateNameOptions"
              label="Template name"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
              clearable
            />
            <v-combobox
              v-model="whatsappCompose.templateLanguage"
              :items="whatsappTemplateLanguageOptions"
              label="Template language (e.g. en_US)"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
            <div v-if="whatsappTemplateParamCount" class="mt-3">
              <div class="text-subtitle-2 text-grey-darken-1 mb-2">Template parameters</div>
              <v-text-field
                v-for="idx in whatsappTemplateParamCount"
                :key="`wa-param-${idx}`"
                v-model="whatsappCompose.templateParams[idx - 1]"
                :label="`Parameter {{${idx}}}`"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-2"
                :placeholder="whatsappTemplateParamExample(idx)"
              />
            </div>
            <div v-if="whatsappTemplatePreview" class="mt-4">
              <div class="text-subtitle-2 text-grey-darken-1 mb-2">Preview</div>
              <div class="whatsapp-preview">
                <div class="whatsapp-preview__bubble">
                  <div v-for="(line, i) in whatsappTemplatePreview" :key="`wa-prev-${i}`">
                    {{ line }}
                  </div>
                </div>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              Use parameter inputs to fill {{1}}, {{2}} etc for the selected template.
            </div>
          </div>

          <div v-else class="mt-2">
            <v-textarea
              v-model="whatsappCompose.message"
              label="Message"
              variant="outlined"
              density="compact"
              rows="4"
              auto-grow
              hide-details
            />
          </div>
        </div>

        <div class="px-4 pb-4 d-flex justify-space-between align-center">
          <div v-if="whatsappProvider.supportsTemplates && whatsappCompose.mode === 'template'" class="text-caption text-medium-emphasis">
            Fill parameters to match template placeholders ({{1}}, {{2}}).
          </div>
          <v-btn :loading="whatsappLoading" flat color="success" @click="sendWhatsAppCompose">
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
import { getTemplateParamCount, getTemplateParamExamples, buildTemplatePreviewLines } from '@/lib/whatsappTemplatePreview'
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
import { formatAssignedUsers, formatTreatmentValue } from "@/lib/misc";
import { getLeadDisplayName, getLeadEmail, getLeadPhone } from "@/lib/normalizers/lead";
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults'
import DataTableColumnsAutomationGroups from '@/components/dataTableColumns/automationGroups.vue'
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
import exportIcon from '@/assets/crm/export.svg'
const crmStore = useCrmStore();
const { user } = useUser();
const emit = defineEmits([
  'select',
  'openLead',
  'delete',
  'book',
  'update:activePage',
  'update:archivedPage',
  'update:itemsPerPage',
]);
const props = defineProps({
  leads: { type: Array, default: () => [] },
  activeLeads: { type: Array, default: null },
  archivedLeads: { type: Array, default: null },
  activeTotal: { type: Number, default: 0 },
  archivedTotal: { type: Number, default: 0 },
  activePage: { type: Number, default: 1 },
  archivedPage: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 25 },
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
  Array.isArray(props.activeLeads)
    ? props.activeLeads
    : (props.leads || []).filter((l) => !isArchivedLead(l))
);
const archivedLeads = computed(() =>
  Array.isArray(props.archivedLeads)
    ? props.archivedLeads
    : (props.leads || []).filter((l) => isArchivedLead(l))
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
  { key: "export", label: "Export", icon: exportIcon },
];
const confirmDelete = ref(false);
const deleting = ref(false);
const confirmArchive = ref(false);
const archiving = ref(false);
const converting = ref(false);
const addStaffDrawer = ref(false);
const rolesList = ref([]);
const automationRowsCache = reactive({});
const automationLoading = reactive({});
const automationSaving = reactive({});
const automationGroupRows = ref([]);
const automationGroupsLoading = ref(false);
const automationGroupsDirty = ref(false);
const defaultAutomationMap = new Map(
  (crmAutomationDefaults || [])
    .filter((item) => item && item.key)
    .map((item) => [item.key, { ...item }])
);

const resolveLeadName = (lead) => getLeadDisplayName(lead);
const resolveLeadEmail = (lead) => getLeadEmail(lead);
const resolveLeadPhone = (lead) => getLeadPhone(lead);

const mergeDefaultAutomations = (rows) => {
  const map = new Map((rows || []).map((row) => [row.key, { ...row }]));
  for (const [key, def] of defaultAutomationMap.entries()) {
    if (!map.has(key)) map.set(key, { ...def });
  }
  return Array.from(map.values());
};

const isWhatsAppItem = (item) => {
  const type = String(item?.type || '').toLowerCase();
  const key = String(item?.key || '').toLowerCase();
  return type === 'whatsapp' || key.includes('whatsapp');
};

const isWhatsAppGroup = (group) => {
  const key = String(group?.key || '').toLowerCase();
  const title = String(group?.title || '').toLowerCase();
  return key.includes('whatsapp') || title.includes('whatsapp');
};

const loadAutomationGroups = async ({ force = false } = {}) => {
  if (!force && (automationGroupRows.value.length || automationGroupsLoading.value)) return;
  automationGroupsLoading.value = true;
  try {
    const res = await crmStore.listAutomationGroups();
    if (res?.code === 0 && Array.isArray(res.data)) {
      automationGroupRows.value = res.data.filter((group) => !isWhatsAppGroup(group));
    }
  } finally {
    automationGroupsLoading.value = false;
  }
};

const resolvedAutomationGroups = computed(() => {
  const groups = automationGroupRows.value.length ? automationGroupRows.value : crmAutomationGroups;
  return groups.filter((group) => !isWhatsAppGroup(group));
});

const loadLeadAutomations = async (leadId) => {
  if (!leadId || automationRowsCache[leadId] || automationLoading[leadId]) return;
  automationLoading[leadId] = true;
  try {
    const res = await crmStore.listAutomation(leadId);
    const apiItems = Array.isArray(res?.data) ? res.data : [];
    const rows = apiItems.length
      ? mergeDefaultAutomations(apiItems)
      : mergeDefaultAutomations(crmAutomationDefaults);
    const nonWhatsAppRows = rows.filter((item) => !isWhatsAppItem(item));
    automationRowsCache[leadId] = nonWhatsAppRows;
  } catch (e) {
    automationRowsCache[leadId] = mergeDefaultAutomations(crmAutomationDefaults);
  } finally {
    automationLoading[leadId] = false;
  }
};

const onAutomationMenuOpen = async (lead) => {
  if (!lead?.id) return;
  const force = automationGroupsDirty.value || !automationGroupRows.value.length;
  await Promise.all([loadAutomationGroups({ force }), loadLeadAutomations(lead.id)]);
  automationGroupsDirty.value = false;
};

// Note: automation rows are loaded lazily per-lead when the menu opens.

const markAutomationGroupsDirty = () => {
  automationGroupsDirty.value = true;
};

onMounted(() => {
  if (typeof window === 'undefined') return;
  loadAutomationGroups();
  window.addEventListener('crm-automation-groups-updated', markAutomationGroupsDirty);
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('crm-automation-groups-updated', markAutomationGroupsDirty);
});

const getLeadGroupRows = (lead, group) => {
  const rows = automationRowsCache[lead?.id] || [];
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

const getLeadAutomationGroupDisplay = (lead) => {
  const groups = getLeadAutomationGroups(lead);
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
  await loadLeadAutomations(leadId);

  const rows = automationRowsCache[leadId] || [];
  const keys = group?.templateKeys || [];
  let groupRows = [];

  if (keys.length) {
    const rowMap = new Map(rows.map((row) => [row?.key, row]));
    groupRows = keys
      .map((key) => {
        if (rowMap.has(key)) return rowMap.get(key);
        const def = defaultAutomationMap.get(key);
        if (!def) return null;
        const nextRow = { ...def };
        rows.push(nextRow);
        rowMap.set(key, nextRow);
        return nextRow;
      })
      .filter(Boolean);
  } else {
    groupRows = rows.filter((row) => row?.groupKey === group.key);
  }

  if (!groupRows.length) return;

  const updates = [];
  const previous = new Map();
  groupRows.forEach((row) => {
    previous.set(row.key, !!row.enabled);
    const nextEnabled = !!enabled;
    if (!!row.enabled !== nextEnabled) {
      row.enabled = nextEnabled;
      updates.push(buildAutomationPayload(row, leadId, group.key));
    }
  });

  if (!updates.length) return;

  automationSaving[leadId] = true;
  try {
    await crmStore.saveAutomationBatch({ items: updates });
  } catch (e) {
    groupRows.forEach((row) => {
      if (previous.has(row.key)) row.enabled = previous.get(row.key);
    });
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

const onActionClick = (key) => {
  if (!selectedLeads.value.length) return;
  if (key === 'book') {
    emit('book', [...selectedLeads.value])
  }
  else if (key === 'delete') confirmDelete.value = true;
  else if (key === 'archive') confirmArchive.value = true;
  else if (key === 'convert') convertSelected();
  else if (key === 'whatsapp') openWhatsAppCompose()
  else if (key === 'export') exportSelectedLeads();
  else if (['mail','sendPrice','sendForm','shareLocation'].includes(key)) openCompose(key)
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
  if (key === 'inquiryDate' || key === 'followUpDate') return formatDate(lead?.[key]);
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

const buildCsvValue = (value) => {
  const text = value == null ? '' : String(value);
  if (/[\",\\n]/.test(text)) return `\"${text.replace(/\"/g, '\"\"')}\"`;
  return text;
};

const exportSelectedLeads = () => {
  if (typeof window === 'undefined') return;
  const columns = (props.headers || [])
    .filter((h) => h?.key && h.key !== 'data-table-select' && h.key !== 'actions')
    .map((h) => ({ key: h.key, title: h.title || h.key }));
  if (!columns.length) return;

  const rows = selectedLeads.value.map((lead) =>
    columns.map((col) => buildCsvValue(resolveLeadValue(lead, col.key))).join(',')
  );
  const header = columns.map((col) => buildCsvValue(col.title)).join(',');
  const csv = [header, ...rows].join('\\n');
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
const showWhatsAppCompose = ref(false)
const whatsappLoading = ref(false)
const whatsappProvider = reactive({
  provider: 'meta',
  supportsTemplates: true,
  requiresTemplateOutside24h: true,
})
const whatsappTemplates = ref([])
const whatsappTemplatesLoading = ref(false)
const whatsappCompose = reactive({
  recipients: [],
  missing: [],
  templateName: '',
  templateLanguage: 'en_US',
  templateParams: [],
  mode: 'template',
  requiresTemplate: false,
  message: '',
})

const loadWhatsAppProvider = async () => {
  try {
    const res = await crmStore.getWhatsAppConfig()
    const data = res?.data || null
    if (data?.provider) {
      whatsappProvider.provider = data.provider
      whatsappProvider.supportsTemplates = data.supportsTemplates !== false
      whatsappProvider.requiresTemplateOutside24h = data.requiresTemplateOutside24h !== false
    } else {
      whatsappProvider.provider = 'meta'
      whatsappProvider.supportsTemplates = true
      whatsappProvider.requiresTemplateOutside24h = true
    }
  } catch {
    whatsappProvider.provider = 'meta'
    whatsappProvider.supportsTemplates = true
    whatsappProvider.requiresTemplateOutside24h = true
  }
}

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

const defaultWhatsAppMessage = 'Hi [Patient Name], thanks for reaching out. How can we help you today?'

onMounted(() => {
  loadWhatsAppProvider()
})


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

const whatsappTemplateNameOptions = computed(() => {
  const set = new Set()
  ;(whatsappTemplates.value || []).forEach((t) => {
    if (t?.name) set.add(String(t.name))
  })
  return Array.from(set)
})

const whatsappTemplateLanguageOptions = computed(() => {
  const name = String(whatsappCompose.templateName || '').trim()
  if (!name) return []
  const langs = (whatsappTemplates.value || [])
    .filter((t) => String(t?.name || '') === name)
    .map((t) => t?.language || t?.language?.code || t?.language_code)
    .filter(Boolean)
  return Array.from(new Set(langs))
})

const resolveSelectedTemplate = () => {
  const name = String(whatsappCompose.templateName || '').trim()
  if (!name) return null
  const lang = String(whatsappCompose.templateLanguage || '').trim()
  const list = whatsappTemplates.value || []
  if (lang) {
    const matched = list.find((t) => String(t?.name || '') === name && String(t?.language || t?.language?.code || t?.language_code || '') === lang)
    if (matched) return matched
  }
  return list.find((t) => String(t?.name || '') === name) || null
}

const whatsappTemplateParamCount = computed(() => getTemplateParamCount(resolveSelectedTemplate()))
const whatsappTemplateParamExample = (idx) => {
  const template = resolveSelectedTemplate()
  if (!template) return ''
  const examples = getTemplateParamExamples(template)
  return String(examples[idx - 1] || '')
}
const whatsappTemplatePreview = computed(() => {
  const template = resolveSelectedTemplate()
  if (!template) return null
  const params = (whatsappCompose.templateParams || []).map((v, i) =>
    String(v || whatsappTemplateParamExample(i + 1) || `{{${i + 1}}}`)
  )
  return buildTemplatePreviewLines(template, params)
})
watch(
  () => [whatsappCompose.templateName, whatsappCompose.templateLanguage, whatsappTemplateParamCount.value],
  () => {
    const count = whatsappTemplateParamCount.value || 0
    const next = Array.from({ length: count }, (_, i) => whatsappCompose.templateParams[i] || '')
    whatsappCompose.templateParams = next
    if (!whatsappCompose.templateLanguage && whatsappTemplateLanguageOptions.value.length) {
      whatsappCompose.templateLanguage = whatsappTemplateLanguageOptions.value[0]
    }
  }
)

const buildWhatsAppRecipients = () => {
  const recipients = []
  const missing = []
  ;(selectedLeads.value || []).forEach((lead) => {
    const phone = String(lead?.telephone || '').trim()
    if (!phone) {
      missing.push(lead?.name || lead?.email || `Lead ${lead?.id}`)
      return
    }
    recipients.push(phone)
  })
  whatsappCompose.recipients = [...new Set(recipients)]
  whatsappCompose.missing = missing
  whatsappCompose.requiresTemplate = false
  if (!whatsappProvider.supportsTemplates) {
    whatsappCompose.mode = 'free'
  } else if (!whatsappCompose.mode) {
    whatsappCompose.mode = 'template'
  }
}

const loadWhatsAppTemplates = async () => {
  if (whatsappTemplatesLoading.value) return
  try {
    whatsappTemplatesLoading.value = true
    const res = await crmStore.getWhatsAppTemplates()
    if (res?.code === 0 && res.data?.templates) {
      whatsappTemplates.value = res.data.templates
    }
  } catch (e) {
    // ignore if WhatsApp is not configured
  } finally {
    whatsappTemplatesLoading.value = false
  }
}

const openWhatsAppCompose = async () => {
  buildWhatsAppRecipients()
  if (!whatsappCompose.recipients.length) {
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({ title: 'No valid phone numbers found', type: 'error' })
    }
    return
  }
  const many = (selectedLeads.value || []).length !== 1
  const lead = many ? null : (selectedLeads.value || [])[0]
  const ctx = buildRecipientContext({ lead, user, many })
  whatsappCompose.message = renderWithContext(defaultWhatsAppMessage, ctx)
  if (whatsappProvider.supportsTemplates) {
    await loadWhatsAppTemplates()
    if (!whatsappCompose.templateName && whatsappTemplateNameOptions.value.length) {
      whatsappCompose.templateName = whatsappTemplateNameOptions.value[0]
    }
    if (!whatsappCompose.templateLanguage && whatsappTemplateLanguageOptions.value.length) {
      whatsappCompose.templateLanguage = whatsappTemplateLanguageOptions.value[0]
    }
    if (!whatsappCompose.mode) whatsappCompose.mode = 'template'
  } else {
    whatsappCompose.mode = 'free'
  }
  showWhatsAppCompose.value = true
}

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
async function sendWhatsAppCompose() {
  const isTemplateMode = whatsappProvider.supportsTemplates && whatsappCompose.mode === 'template'
  if (isTemplateMode && !whatsappCompose.templateName?.trim()) {
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({ title: 'Template name is required', type: 'error' })
    }
    return
  }
  if (!isTemplateMode && !String(whatsappCompose.message || '').trim()) {
    if (mainStore?.setSnackbar) {
      mainStore.setSnackbar({ title: 'Message is required', type: 'error' })
    }
    return
  }
  try {
    whatsappLoading.value = true
    const leadIds = selectedLeads.value.map(l => l.id)
    const payload = { leadIds }
    if (isTemplateMode) {
      const params = (whatsappCompose.templateParams || []).map((val) => ({
        type: 'text',
        text: String(val || ''),
      }))
      const components = params.length ? [{ type: 'body', parameters: params }] : undefined
      payload.template = {
        name: whatsappCompose.templateName.trim(),
        language: { code: whatsappCompose.templateLanguage?.trim() || 'en_US' },
        ...(components ? { components } : {}),
      }
    } else {
      payload.message = String(whatsappCompose.message || '').trim()
    }
    const res = await crmStore.sendLeadWhatsApp(payload)
    if (res && res.code === 0) {
      const sent = res.data?.sent ?? 0
      const skipped = res.data?.skipped ?? 0
      const failed = res.data?.failed ?? 0
      if (mainStore && mainStore.setSnackbar) {
        mainStore.setSnackbar({
          title: `WhatsApp sent: ${sent}, skipped: ${skipped}, failed: ${failed}`,
          type: failed ? 'warning' : 'success',
        })
      }
      showWhatsAppCompose.value = false
    }
  } finally { whatsappLoading.value = false }
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

.whatsapp-preview {
  background: #e5ddd5;
  border-radius: 12px;
  padding: 16px;
  min-height: 160px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.whatsapp-preview__bubble {
  background: #dcf8c6;
  border-radius: 10px;
  padding: 12px 14px;
  max-width: 520px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
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

.break-email {
  word-break: break-all;        /* breaks very long strings */
  overflow-wrap: anywhere;      /* modern & safer wrapping */
  white-space: normal;
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

</style>

