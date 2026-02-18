<template>
  <div>
    <template v-if="!activeAutomation || displayMode === 'modal'">
      <div class="automation-card-grid">
        <div
          v-for="card in automationCards"
          :key="card.key"
          class="automation-card-cell"
        >
          <AutomationCard
            :title="card.title"
            :description="card.description"
            :count="card.itemCount"
            :enabled="card.enabled"
            :author="card.author"
            :show-toggle="props.showCardToggle"
            :selected="activeAutomation?.key === card.key"
            @select="selectAutomation(card)"
            @toggle="(val) => toggleAutomationGroup(card, val)"
          />
        </div>
      </div>
      <div v-if="!automationCards.length" class="automation-empty">
        <div class="automation-empty__icon">
          <img :src="addFolderIcon" alt="Add automation group" />
        </div>
        <div class="automation-empty__title">Add your Automation group</div>
        <div class="automation-empty__subtitle">No Automation</div>
      </div>
    </template>

    <template v-if="activeAutomation && displayMode === 'inline'">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-center gap-2">
          <v-btn icon variant="text" @click="clearAutomationSelection">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div>
            <div class="field-label mb-1">{{ activeAutomation.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ activeAutomation.description }}</div>
          </div>
        </div>
      </div>
      <v-alert
        type="info"
        variant="tonal"
        class="mb-3"
        density="compact"
      >
        Please review and tailor automation content (placeholders, pricing, dates, and policies) before enabling. You are responsible for the final message details.
      </v-alert>
      <!-- Header Toolbar -->
      <div class="d-flex flex-wrap justify-space-between align-center mb-3 automation-toolbar">
        <div class="d-flex align-center gap-2">
          <v-text-field
            v-model="search"
            placeholder="Search automations..."
            append-inner-icon="mdi-magnify"
            variant="solo"
            :elevation="0"
            density="compact"
            hide-details
            bg-color="#FFFFFF"
            flat
            class="custom-search"
            style="width: 280px"
          />

          <v-menu :close-on-content-click="false">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="flat"
                density="compact"
                class="filter-btn"
              >
                <v-icon class="mr-2" size="18">mdi-filter-variant</v-icon>
                Filter
                <v-badge
                  v-if="activeFilters > 0"
                  :content="activeFilters"
                  color="primary"
                  inline
                  class="ml-2"
                />
              </v-btn>
            </template>
            <v-card class="pa-4" min-width="280">
              <p class="text-subtitle-2 font-weight-bold mb-3">Filter by Status</p>
              <v-checkbox
                v-model="filterEnabled"
                label="Enabled only"
                density="compact"
                hide-details
                class="mb-2"
              />
              <v-checkbox
                v-model="filterDisabled"
                label="Disabled only"
                density="compact"
                hide-details
              />
              <v-divider class="my-3" />
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click="clearFilters"
              >
                Clear filters
              </v-btn>
            </v-card>
          </v-menu>
        </div>
      </div>

      <!-- Main Card -->
      <v-card class="with-border rounded-lg elevation-0">
        <v-divider />

        <v-data-table
          :items="filteredRows"
          :headers="tableHeaders"
          :search="search"
          item-value="key"
          class="automation-data-table full-width-table"
          density="comfortable"
          hover
          :items-per-page="15"
        >
          <!-- Type Column -->
          <template #item.type="{ item }">
            <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
              <v-icon size="14" class="mr-1">
                {{ String(item.type || 'Email').toLowerCase() === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-email-outline' }}
              </v-icon>
              {{ item.type }}
            </v-chip>
          </template>

        <!-- Name Column -->
        <template #item.name="{ item }">
          <div class="name-text">
            {{ item.name || item.key }}
          </div>
        </template>

          <!-- Sending/Trigger Column -->
          <template #item.sending="{ item }">
            <div class="d-flex align-center justify-space-between trigger-cell">
              <div class="d-flex align-center">
                <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
                <span class="text-body-2 text-medium-emphasis">{{ item.sending }}</span>
              </div>
              <v-btn
                icon
                variant="text"
                size="x-small"
                class="action-icon-btn"
                aria-label="Edit trigger"
                @click="openTriggerEditor(item)"
              >
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
            </div>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex align-center justify-center gap-2">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  class="action-icon-btn"
                  aria-label="Preview email"
                  @click="openPreview(item)"
                >
                  <v-icon size="18">mdi-eye-outline</v-icon>
                </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                class="action-icon-btn"
                aria-label="Edit email"
                @click="openEdit(item)"
              >
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </v-btn>
            </div>
          </template>

          <!-- Status/Toggle Column -->
          <template #item.enabled="{ item }">
            <div class="d-flex align-center justify-center">
              <v-switch
                v-model="item.enabled"
                inset
                hide-details
                color="success"
                density="compact"
                :class="{ 'switch-active': item.enabled }"
                @update:model-value="onToggleEnabled(item, $event)"
              />
            </div>
          </template>

          <!-- Empty State -->
          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-email-off-outline</v-icon>
              <p class="text-h6 mt-4 mb-2">No automations found</p>
              <p class="text-body-2 text-medium-emphasis">
                Try adjusting your search or filters
              </p>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <v-dialog
      v-if="displayMode === 'modal' && activeAutomation"
      v-model="showGroupDialog"
      max-width="1200px"
      scrollable
    >
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header preview-modal-header">
          <div class="d-flex align-center gap-2">
            <v-btn icon variant="text" @click="clearAutomationSelection">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
              <div class="field-label mb-1">{{ activeAutomation?.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ activeAutomation?.description }}</div>
            </div>
          </div>
          <v-btn icon variant="text" @click="clearAutomationSelection">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="pa-4" v-if="activeAutomation">
          <div class="d-flex flex-wrap justify-space-between align-center mb-3 automation-toolbar">
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="search"
                placeholder="Search automations..."
                append-inner-icon="mdi-magnify"
                variant="solo"
                :elevation="0"
                density="compact"
                hide-details
                bg-color="#FFFFFF"
                flat
                class="custom-search"
                style="width: 280px"
              />

              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="flat"
                    density="compact"
                    class="filter-btn"
                  >
                    <v-icon class="mr-2" size="18">mdi-filter-variant</v-icon>
                    Filter
                    <v-badge
                      v-if="activeFilters > 0"
                      :content="activeFilters"
                      color="primary"
                      inline
                      class="ml-2"
                    />
                  </v-btn>
                </template>
                <v-card class="pa-4" min-width="280">
                  <p class="text-subtitle-2 font-weight-bold mb-3">Filter by Status</p>
                  <v-checkbox
                    v-model="filterEnabled"
                    label="Enabled only"
                    density="compact"
                    hide-details
                    class="mb-2"
                  />
                  <v-checkbox
                    v-model="filterDisabled"
                    label="Disabled only"
                    density="compact"
                    hide-details
                  />
                  <v-divider class="my-3" />
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    @click="clearFilters"
                  >
                    Clear filters
                  </v-btn>
                </v-card>
              </v-menu>
            </div>
          </div>
          <v-alert
            type="info"
            variant="tonal"
            class="mb-3"
            density="compact"
          >
            Please review and tailor automation content (placeholders, pricing, dates, and policies) before enabling. You are responsible for the final message details.
          </v-alert>

          <v-card class="with-border rounded-lg elevation-0">
            <v-divider />

            <v-data-table
              :items="filteredRows"
              :headers="tableHeaders"
              :search="search"
              item-value="key"
              class="automation-data-table full-width-table"
              density="comfortable"
              hover
              :items-per-page="15"
            >
              <template #item.type="{ item }">
                <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
                  <v-icon size="14" class="mr-1">
                    {{ String(item.type || 'Email').toLowerCase() === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-email-outline' }}
                  </v-icon>
                  {{ item.type }}
                </v-chip>
              </template>

              <template #item.name="{ item }">
                <div class="name-text">
                  {{ item.name || item.key }}
                </div>
              </template>

              <template #item.sending="{ item }">
                <div class="d-flex align-center justify-space-between trigger-cell">
                  <div class="d-flex align-center">
                    <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
                    <span class="text-body-2 text-medium-emphasis">{{ item.sending }}</span>
                  </div>
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    class="action-icon-btn"
                    aria-label="Edit trigger"
                    @click="openTriggerEditor(item)"
                  >
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                </div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex align-center justify-center gap-2">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    class="action-icon-btn"
                    aria-label="Preview email"
                    @click="openPreview(item)"
                  >
                    <v-icon size="18">mdi-eye-outline</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    class="action-icon-btn"
                    aria-label="Edit email"
                    @click="openEdit(item)"
                  >
                    <v-icon size="18">mdi-pencil-outline</v-icon>
                  </v-btn>
                </div>
              </template>

              <template #item.enabled="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-switch
                    v-model="item.enabled"
                    inset
                    hide-details
                    color="success"
                    density="compact"
                    :class="{ 'switch-active': item.enabled }"
                    @update:model-value="onToggleEnabled(item, $event)"
                  />
                </div>
              </template>

              <template #no-data>
                <div class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-1">mdi-email-off-outline</v-icon>
                  <p class="text-h6 mt-4 mb-2">No automations found</p>
                  <p class="text-body-2 text-medium-emphasis">
                    Try adjusting your search or filters
                  </p>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </v-card>
    </v-dialog>

    <!-- Email Preview Modal -->
    <v-dialog v-model="showPreview" max-width="980px" :retain-focus="false">
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header preview-modal-header">
          <div class="text-subtitle-2 font-weight-bold">
            {{ previewIsWhatsApp ? 'WhatsApp Preview' : 'Email Preview' }}
          </div>
          <v-btn icon variant="text" @click="showPreview = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="modal-body preview-modal-body">
          <div v-if="previewIsWhatsApp" class="whatsapp-preview">
            <div class="whatsapp-preview__bubble">{{ previewWhatsAppText }}</div>
          </div>
          <div v-else class="email-preview-frame">
            <iframe
              title="Email preview"
              :srcdoc="emailPreviewHtml"
              class="email-preview-iframe"
            ></iframe>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTriggerDialog" max-width="720px">
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">Edit Trigger</h5>
            <div class="text-caption text-medium-emphasis">
              {{ triggerPreviewText }}
            </div>
          </div>
          <v-btn icon variant="text" @click="closeTriggerDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="modal-body">
          <v-row>
            <v-col cols="12" md="6">
              <label class="mb-1 fld-lbl">Trigger Type</label>
              <v-select
                v-model="triggerForm.triggerType"
                :items="triggerTypes"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              v-if="triggerForm.triggerType !== 'black_friday' && triggerForm.triggerType !== 'month_day' && triggerForm.triggerType !== 'weekday_of_month'"
            >
              <label class="mb-1 fld-lbl">Days Offset</label>
              <v-text-field
                v-model="triggerForm.triggerDays"
                type="number"
                min="0"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'black_friday' || triggerForm.triggerType === 'month_day' || triggerForm.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Offset Days (before/after)</label>
              <v-text-field
                v-model="triggerForm.triggerOffsetDays"
                type="number"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'month_day' || triggerForm.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Month (1-12)</label>
              <v-text-field
                v-model="triggerForm.triggerMonth"
                type="number"
                min="1"
                max="12"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'month_day'">
              <label class="mb-1 fld-lbl">Day of Month</label>
              <v-text-field
                v-model="triggerForm.triggerDay"
                type="number"
                min="1"
                max="31"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Weekday</label>
              <v-select
                v-model="triggerForm.triggerWeekday"
                :items="weekdayOptions"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Week in Month</label>
              <v-select
                v-model="triggerForm.triggerWeekIndex"
                :items="weekIndexOptions"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>
          </v-row>
        </div>

        <v-divider />

        <div class="modal-footer">
          <v-btn variant="text" @click="closeTriggerDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="triggerSaving" @click="saveTrigger">
            Save Trigger
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Edit Modal -->
    <v-dialog v-model="show" max-width="1100px" scrollable>
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">{{ active?.name }}</h5>
            <div class="d-flex align-center gap-2 mt-2">
              <v-chip size="x-small" variant="tonal" color="primary">
                <v-icon size="12" class="mr-1">
                  {{ String(active?.type || 'Email').toLowerCase() === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-email-outline' }}
                </v-icon>
                {{ active?.type }}
              </v-chip>
              <v-chip size="x-small" variant="tonal" color="grey">
                <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                {{ active?.sending }}
              </v-chip>
            </div>
          </div>
          <v-btn icon variant="text" @click="show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="modal-body">
          <!-- Recipient Preview -->
          <div class="recipient-section">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                <v-icon size="18" class="mr-2">mdi-account-outline</v-icon>
                Preview Recipient
              </div>
              <v-chip size="small" variant="outlined" class="font-mono">
                {{ sampleRecipient.name }} &lt;{{ sampleRecipient.email }}&gt;
              </v-chip>
            </div>
          </div>

          <!-- Editor Section -->
          <div class="editor-section">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                <v-icon size="18" class="mr-2">mdi-email-edit-outline</v-icon>
                {{ String(active?.type || 'Email').toLowerCase() === 'whatsapp' ? 'WhatsApp Message' : 'Email Content' }}
              </div>
              <v-chip size="x-small" variant="tonal" color="info">
                Use [First Name] for personalization
              </v-chip>
            </div>
            <div class="mb-4" v-if="String(active?.type || 'Email').toLowerCase() !== 'whatsapp'">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
                <v-icon size="18" class="mr-2">mdi-email-outline</v-icon>
                Email Subject
              </div>
              <v-text-field
                v-model="active.subject"
                variant="solo"
                density="compact"
                hide-details
                bg-color="#FFFFFF"
                flat
                placeholder="Subject line for this email"
              />
            </div>
            <div class="mb-4" v-else>
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
                <v-icon size="18" class="mr-2">mdi-whatsapp</v-icon>
                WhatsApp Template
              </div>
              <template v-if="props.whatsappRequiresTemplates">
                <v-combobox
                  v-model="active.whatsappTemplateName"
                  :items="whatsappTemplateNameOptions"
                  variant="solo"
                  density="compact"
                  hide-details
                  bg-color="#FFFFFF"
                  flat
                  placeholder="Approved template name (e.g. hello_world)"
                  class="mb-2"
                  clearable
                />
                <v-combobox
                  v-model="active.whatsappTemplateLanguage"
                  :items="whatsappTemplateLanguageOptions"
                  variant="solo"
                  density="compact"
                  hide-details
                  bg-color="#FFFFFF"
                  flat
                  placeholder="Language code (e.g. en_US)"
                  clearable
                />
                <div class="text-caption text-medium-emphasis mt-2">
                  Templates must be approved in Meta. The message body below is for preview and variable mapping only.
                </div>
                <div v-if="whatsappTemplatePreviewLines" class="mt-3">
                  <div class="text-subtitle-2 text-grey-darken-2 mb-2">
                    Template Preview
                  </div>
                  <div class="whatsapp-preview">
                    <div class="whatsapp-preview__bubble">
                      <div v-for="(line, i) in whatsappTemplatePreviewLines" :key="`wa-tpl-prev-${i}`">
                        {{ line }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="text-caption text-medium-emphasis mt-2">
                Templates are not required for Whapi. The message body below will be sent as free text.
              </div>
            </div>
            <div ref="editorEl" class="editor"></div>
          </div>
        </div>

        <v-divider />

        <div class="modal-footer">
          <v-btn variant="text" @click="show = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveContent"
            :loading="saving"
          >
            <v-icon size="18" class="mr-2">mdi-content-save</v-icon>
            Save Changes
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'
import { formatCrmTriggerPreview } from '@/lib/misc'
import emailLogo from '@/assets/emails/email-logo.png'
import AutomationCard from '@/components/patients/automationCard.vue'
import { getTemplateParamExamples, buildTemplatePreviewLines } from '@/lib/whatsappTemplatePreview'
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults'
import addFolderIcon from '@/assets/icons/crm/add-folder.svg'
import { getCurrentUserName } from '@/lib/helpers/storage'
import { isDefaultAutomationGroup, resolveAutomationGroupAuthor } from '@/lib/crm/automation'

const props = defineProps({
  leadId: { type: [Number, String], default: null },
  lead: { type: Object, default: null },
  displayMode: { type: String, default: 'inline' },
  groups: { type: Array, default: null },
  useGroupsApi: { type: Boolean, default: true },
  includeDefaults: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: true },
  whatsappRequiresTemplates: { type: Boolean, default: true },
  showCardToggle: { type: Boolean, default: true },
})
const crmStore = useCrmStore()
const orgStore = useOrgStore()
const emit = defineEmits(['update:rows','save'])

// Table state
const rows = reactive([])
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const saving = ref(false)
const activeAutomation = ref(null)
const showGroupDialog = ref(false)
const groupRows = ref([])
const defaultAutomationKeySet = new Set(crmAutomationDefaults.map(item => item.key))
const defaultGroupKeySet = new Set(crmAutomationGroups.map(group => group.key))

const whatsappTemplates = ref([])
const whatsappTemplatesLoading = ref(false)

const tableHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Automation Name', key: 'name', sortable: false },
  { title: 'Trigger', key: 'sending', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
  { title: 'Status', key: 'enabled', sortable: false, align: 'center' },
]

const triggerTypes = [
  { label: 'After enquiry', value: 'inquiry_days' },
  { label: 'Birthday offset', value: 'birthday_offset' },
  { label: 'Black Friday', value: 'black_friday' },
  { label: 'Fixed date (annual)', value: 'month_day' },
  { label: 'Nth weekday (annual)', value: 'weekday_of_month' },
]

const weekdayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const weekIndexOptions = [
  { label: '1st', value: 1 },
  { label: '2nd', value: 2 },
  { label: '3rd', value: 3 },
  { label: '4th', value: 4 },
  { label: '5th', value: 5 },
]

const activeFilters = computed(() => {
  let count = 0
  if (filterEnabled.value) count++
  if (filterDisabled.value) count++
  return count
})

const filteredRows = computed(() => {
  if (!activeAutomation.value) return []
  const keys = activeAutomation.value.templateKeys || []
  let result = []
  if (keys.length) {
    const keySet = new Set(keys)
    result = rows.filter(r => keySet.has(r.key))
  } else {
    result = rows.filter(r => r.groupKey === activeAutomation.value.key)
  }
  if (filterEnabled.value && !filterDisabled.value) result = result.filter(r => r.enabled === true)
  if (filterDisabled.value && !filterEnabled.value) result = result.filter(r => r.enabled === false)
  return result
})

const clearFilters = () => {
  filterEnabled.value = false
  filterDisabled.value = false
}

const resolvedGroups = computed(() => {
  if (Array.isArray(props.groups) && props.groups.length) {
    return props.whatsappEnabled
      ? props.groups
      : props.groups.filter((group) => !isWhatsAppGroup(group))
  }
  if (groupRows.value.length) return groupRows.value
  return crmAutomationGroups
})

const isDefaultGroup = (group) =>
  isDefaultAutomationGroup(group, defaultGroupKeySet, defaultAutomationKeySet)

const visibleGroups = computed(() => {
  if (props.includeDefaults) return resolvedGroups.value
  return resolvedGroups.value.filter(group => !isDefaultGroup(group))
})

const resolveGroupAuthor = (group) =>
  resolveAutomationGroupAuthor(group, {
    isDefaultGroup,
    fallbackName: getCurrentUserName(),
  })

const automationCards = computed(() => {
  return visibleGroups.value.map((group) => {
    const keys = group.templateKeys || []
    const groupRows = keys.length
      ? rows.filter(r => keys.includes(r.key))
      : rows.filter(r => r.groupKey === group.key)
    return {
      ...group,
      itemCount: groupRows.length,
      enabled: groupRows.some(r => r.enabled),
      author: resolveGroupAuthor(group),
    }
  })
})

const selectAutomation = (card) => {
  activeAutomation.value = card
  search.value = ''
  clearFilters()
  if (props.displayMode === 'modal') {
    showGroupDialog.value = true
  }
}

const clearAutomationSelection = () => {
  activeAutomation.value = null
  search.value = ''
  clearFilters()
  showGroupDialog.value = false
}

const showTriggerDialog = ref(false)
const triggerSaving = ref(false)
const triggerEditingRow = ref(null)
const triggerForm = reactive({
  triggerType: 'inquiry_days',
  triggerDays: 0,
  triggerOffsetDays: 0,
  triggerMonth: 1,
  triggerDay: 1,
  triggerWeekday: 1,
  triggerWeekIndex: 1,
})

const sanitizeNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const buildTriggerFromForm = () => {
  const triggerType = triggerForm.triggerType
  if (triggerType === 'black_friday') {
    return { type: 'black_friday', offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0) }
  }
  if (triggerType === 'month_day') {
    return {
      type: 'month_day',
      month: sanitizeNumber(triggerForm.triggerMonth, 1),
      day: sanitizeNumber(triggerForm.triggerDay, 1),
      offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0),
    }
  }
  if (triggerType === 'weekday_of_month') {
    return {
      type: 'weekday_of_month',
      month: sanitizeNumber(triggerForm.triggerMonth, 1),
      weekday: sanitizeNumber(triggerForm.triggerWeekday, 1),
      weekIndex: sanitizeNumber(triggerForm.triggerWeekIndex, 1),
      offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0),
    }
  }
  return { type: triggerType, days: sanitizeNumber(triggerForm.triggerDays, 0) }
}

const triggerPreviewText = computed(() =>
  formatCrmTriggerPreview(buildTriggerFromForm())
)

const hydrateTriggerForm = (trigger = {}) => {
  const type = String(trigger?.type || 'inquiry_days')
  triggerForm.triggerType = type
  triggerForm.triggerDays = sanitizeNumber(trigger?.days, 0)
  triggerForm.triggerOffsetDays = sanitizeNumber(trigger?.offsetDays, 0)
  triggerForm.triggerMonth = sanitizeNumber(trigger?.month, 1)
  triggerForm.triggerDay = sanitizeNumber(trigger?.day, 1)
  triggerForm.triggerWeekday = sanitizeNumber(trigger?.weekday, 1)
  triggerForm.triggerWeekIndex = sanitizeNumber(trigger?.weekIndex, 1)
}

const openTriggerEditor = (row) => {
  triggerEditingRow.value = row
  hydrateTriggerForm(row?.trigger || {})
  showTriggerDialog.value = true
}

const closeTriggerDialog = () => {
  showTriggerDialog.value = false
  triggerEditingRow.value = null
}

const resolvedLeadId = computed(() => {
  const id = props.leadId
  return id ? Number(id) : null
})

const buildPayload = (row) => {
  const payload = {
    key: row.key,
    type: row.type,
    name: row.name,
    subject: row.subject,
    sending: row.sending,
    enabled: !!row.enabled,
    template: row.template,
    whatsappTemplateName: row.whatsappTemplateName,
    whatsappTemplateLanguage: row.whatsappTemplateLanguage,
  }
  if (row.trigger) payload.trigger = row.trigger
  if (row.groupKey || activeAutomation.value?.key) {
    payload.groupKey = row.groupKey || activeAutomation.value?.key
  }
  if (resolvedLeadId.value) payload.leadId = resolvedLeadId.value
  return payload
}

const toggleAutomationGroup = async (card, val) => {
  const keys = card?.templateKeys || []
  const groupRows = keys.length
    ? rows.filter(r => keys.includes(r.key))
    : rows.filter(r => r.groupKey === card?.key)
  const updates = []
  groupRows.forEach((row) => {
    const nextEnabled = !!val
    if (!!row.enabled !== nextEnabled) {
      row.enabled = nextEnabled
      updates.push(buildPayload(row))
    }
  })
  if (!updates.length) return
  try {
    await crmStore.saveAutomationBatch({ items: updates })
  } catch (e) {}
}

const isWhatsAppItem = (item) => {
  const type = String(item?.type || '').toLowerCase()
  const key = String(item?.key || '').toLowerCase()
  return type === 'whatsapp' || key.includes('whatsapp')
}

const isWhatsAppGroup = (group) => {
  const key = String(group?.key || '').toLowerCase()
  const title = String(group?.title || '').toLowerCase()
  return key.includes('whatsapp') || title.includes('whatsapp')
}

const loadRows = async () => {
  try {
    const res = await crmStore.listAutomation(resolvedLeadId.value || undefined)
    const apiItems = Array.isArray(res?.data) ? res.data : []
    const fallbackItems = props.includeDefaults
      ? crmAutomationDefaults.map((item) => ({ ...item }))
      : []
    const items = apiItems.length ? apiItems : fallbackItems
    const filteredItems = props.includeDefaults
      ? items
      : items.filter(item => !defaultAutomationKeySet.has(item.key))
    const nextItems = props.whatsappEnabled
      ? filteredItems
      : filteredItems.filter((item) => !isWhatsAppItem(item))
    rows.splice(0, rows.length, ...nextItems)
  } catch {}
}

const loadGroups = async () => {
  if (!props.useGroupsApi || (Array.isArray(props.groups) && props.groups.length)) return
  try {
    const res = await crmStore.listAutomationGroups()
    if (res?.code === 0 && Array.isArray(res.data)) {
      groupRows.value = props.whatsappEnabled
        ? res.data
        : res.data.filter((group) => !isWhatsAppGroup(group))
    }
  } finally {
  }
}

const refresh = async () => {
  await Promise.all([loadGroups(), loadRows()])
}

defineExpose({ refresh })

onMounted(async () => {
  await loadWhatsAppTemplates()
  await refresh()
})

watch(resolvedLeadId, () => {
  clearAutomationSelection()
  refresh()
})


// Preview dialog state
const show = ref(false)
const showPreview = ref(false)
const active = ref(null)
const whatsappTemplateNameOptions = computed(() => {
  const set = new Set()
  ;(whatsappTemplates.value || []).forEach((t) => {
    if (t?.name) set.add(String(t.name))
  })
  return Array.from(set)
})

const whatsappTemplateLanguageOptions = computed(() => {
  const name = String(active.value?.whatsappTemplateName || '').trim()
  if (!name) return []
  const langs = (whatsappTemplates.value || [])
    .filter((t) => String(t?.name || '') === name)
    .map((t) => t?.language || t?.language?.code || t?.language_code)
    .filter(Boolean)
  return Array.from(new Set(langs))
})

const resolveSelectedTemplate = () => {
  const name = String(active.value?.whatsappTemplateName || '').trim()
  if (!name) return null
  const lang = String(active.value?.whatsappTemplateLanguage || '').trim()
  const list = whatsappTemplates.value || []
  if (lang) {
    const matched = list.find((t) => String(t?.name || '') === name && String(t?.language || t?.language?.code || t?.language_code || '') === lang)
    if (matched) return matched
  }
  return list.find((t) => String(t?.name || '') === name) || null
}

const whatsappTemplatePreviewLines = computed(() => {
  if (!props.whatsappRequiresTemplates) return null
  const template = resolveSelectedTemplate()
  if (!template) return null
  const params = getTemplateParamExamples(template).map((v, i) => String(v || `{{${i + 1}}}`))
  return buildTemplatePreviewLines(template, params)
})

const loadWhatsAppTemplates = async () => {
  if (!props.whatsappRequiresTemplates) {
    whatsappTemplates.value = []
    return
  }
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

watch(
  () => [active.value?.whatsappTemplateName, whatsappTemplateLanguageOptions.value.length],
  () => {
    if (!active.value) return
    if (!active.value.whatsappTemplateLanguage && whatsappTemplateLanguageOptions.value.length) {
      active.value.whatsappTemplateLanguage = whatsappTemplateLanguageOptions.value[0]
    }
  }
)
const previewItem = ref(null)
let ej = null
let EditorCtor = null
let Header = null
let List = null
const editorEl = ref(null)

const resolveLeadName = (lead = {}) => {
  const direct = String(lead.name || '').trim()
  if (direct) return direct
  const first = String(lead.firstName || lead.first_name || '').trim()
  const last = String(lead.lastName || lead.last_name || '').trim()
  const combined = `${first} ${last}`.trim()
  if (combined) return combined
  const email = String(lead.email || '').trim()
  return email || ''
}

const previewRecipient = computed(() => {
  const lead = props.lead || {}
  const name = resolveLeadName(lead) || 'John Doe'
  const email = String(lead.email || '').trim() || 'john@example.com'
  return { name, email }
})
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>{subject}</title>
    <style>
      /* CLIENT RESET */
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      table {
        border-collapse: collapse !important;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
        background-color: #f8f9fb;
        font-family: Arial, Helvetica, sans-serif;
      }

      /* MAIN CARD */
      .email-container {
        max-width: 500px;
        background: #ffffff;
        margin-top: 10px;
        border-radius: 10px;
        border: 1px solid #e5e5e5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .main-container {
        max-width: 500px;
        margin: 40px auto;
        overflow: hidden;
      }
      .os {
        margin-top: 40px;
        display: inline;
      }

      .header {
        text-align: center;
        padding: 30px 20px 10px;
      }
      .logo {
        font-size: 22px;
        font-weight: 700;
        color: #111;
      }
      .title {
        font-size: 18px;
        font-weight: 600;
        max-width: 250px;
        margin: auto;
        margin-top: 15px;
        color: #000;
      }

      .subtitle {
        font-size: 13px;
        color: #777;
        margin-top: 4px;
        margin-bottom: 0;
      }

      .content {
        padding: 25px 25px 35px;
        background-color: #f3f8ff;
        border-top: 1px solid #e5eaf0;
      }
      .content p {
        margin: 0 0 15px;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        background-color: #2563eb;
        color: #fff !important;
        padding: 10px 28px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding: 20px 10px;
      }

      @media only screen and (max-width: 600px) {
        .email-container {
          width: 95% !important;
        }
        .content {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <center>
      <table
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
        width="100%"
      >
        <tr>
          <td>
            <div class="main-container">
              <div class="os">
                <img
                  src="https://dev.flossly.ai/emails/email-logo.png"
                  alt="Flossly Logo"
                  width="36"
                  height="36"
                  style="display: block"
                />
              </div>
              <div class="email-container">
                <!-- Header -->
                <div class="header">
                  <img
                    src="https://dev.flossly.ai/emails/logo.png"
                    alt="Flossly Logo"
                    width="36"
                    height="36"
                    style="display: block; margin: 0 auto 8px"
                  />
                  <h2 class="title">{subject}</h2>
                  <p class="subtitle">By flossly Team</p>
                </div>

                <!-- Content -->
                <div class="content">{content}</div>

                <!-- Footer -->
                <div class="footer">Ac 2026 Flossly</div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
`

const openEdit = async (row) => {
  active.value = row
  show.value = true
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
  if (ej) {
    if (typeof ej.destroy === 'function') ej.destroy()
    ej = null
  }
  if (!editorEl.value) {
    await nextTick()
  }
  if (!editorEl.value) return
  ej = new EditorCtor({
    holder: editorEl.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(row.template || ''),
    onChange: async (api) => {
      const saved = await api.saver.save()
      active.value.template = blocksToHtml(saved)
    }
  })
}

const openPreview = (row) => {
  previewItem.value = row
  showPreview.value = true
}

const getStoredOrg = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'))
      if (storedUser?.userOrganisations?.length && storedUser?.currentLoggedInOrgId) {
        const activeOrgs = storedUser.userOrganisations.filter(org => org.status === 'Active')
        const orgWrapper = activeOrgs.find(
          (org) => org.organisationId === storedUser.currentLoggedInOrgId
        ) || activeOrgs.find(
          (org) => org.organisation?.id === storedUser.currentLoggedInOrgId
        )
        if (orgWrapper?.organisation) return orgWrapper.organisation
        if (orgWrapper?.name) return orgWrapper
      }
    } catch {}
  }
  return null
}

const practiceName = computed(() => {
  const storedOrg = getStoredOrg()
  if (storedOrg?.name) return storedOrg.name
  const details =
    orgStore.getOrgDetails ||
    orgStore.organisation ||
    orgStore.organization ||
    orgStore.org ||
    orgStore.orgDetails ||
    {}
  return details?.name || orgStore.name || orgStore.orgName || '[Practice Name]'
})

const practiceInitials = computed(() => {
  const name = practiceName.value || '[Practice Name]'
  const parts = name.replace(/\s+/g, ' ').trim().split(' ')
  const letters = parts.slice(0, 2).map(part => part[0]).join('')
  return letters.toUpperCase() || 'P'
})

const practiceLogo = computed(() => {
  const storedOrg = getStoredOrg()
  if (storedOrg?.logo) return storedOrg.logo
  const details =
    orgStore.getOrgDetails ||
    orgStore.organisation ||
    orgStore.organization ||
    orgStore.org ||
    orgStore.orgDetails ||
    {}
  return details?.logo || orgStore.logo || null
})


const resolveDefault = (row) =>
  crmAutomationDefaults.find(d => d && d.key === row?.key) || {}

const applyPlaceholders = (text) => {
  if (!text) return ''
  const recipient = previewRecipient.value || { name: 'John Doe', email: 'john@example.com' }
  const practice = practiceName.value || '[Practice Name]'
  const firstName = recipient.name.split(' ')[0] || recipient.name
  const storedOrg = getStoredOrg() || {}
  const details =
    orgStore.getOrgDetails ||
    orgStore.organisation ||
    orgStore.organization ||
    orgStore.org ||
    orgStore.orgDetails ||
    {}
  const org = storedOrg || details || {}
  const phone =
    org.phone ||
    org.phoneNumber ||
    org.telephone ||
    org.contactPhone ||
    '[Phone Number]'
  const website =
    org.website ||
    org.site ||
    org.web ||
    '[Website]'
  const email =
    org.email ||
    org.contactEmail ||
    '[Email]'
  const address =
    org.address ||
    org.location ||
    '[Address]'
  const street =
    org.streetAddress ||
    org.addressLine1 ||
    '[Street Address]'
  const cityStateZip =
    org.cityStateZip ||
    org.city ||
    '[City, State ZIP Code]'
  const officeHours =
    org.officeHours ||
    org.hours ||
    '[Days and Times]'
  const coordinator =
    org.treatmentCoordinator ||
    org.coordinatorName ||
    org.ownerName ||
    '[Treatment Coordinator Name]'
  const yourName =
    org.ownerName ||
    org.contactName ||
    '[Your Name]'
  const location =
    org.city ||
    org.location ||
    '[Location]'
  return text
    .replace(/\[?\s*practice\s*name\s*\]?/gi, practice)
    .replace(/\[?\s*patient\s*name\s*\]?/gi, recipient.name)
    .replace(/\[?\s*name\s*\]?/gi, recipient.name)
    .replace(/\[?\s*first\s*name\s*\]?/gi, firstName)
    .replace(/\[?\s*phone\s*number\s*\]?/gi, phone)
    .replace(/\[?\s*website\s*\]?/gi, website)
    .replace(/\[?\s*email\s*\]?/gi, recipient.email || email)
    .replace(/\[?\s*address\s*\]?/gi, address)
    .replace(/\[?\s*street\s*address\s*\]?/gi, street)
    .replace(/\[?\s*city\s*,?\s*state\s*zip\s*code\s*\]?/gi, cityStateZip)
    .replace(/\[?\s*days\s*and\s*times\s*\]?/gi, officeHours)
    .replace(/\[?\s*treatment\s*coordinator\s*name\s*\]?/gi, coordinator)
    .replace(/\[?\s*your\s*name\s*\]?/gi, yourName)
    .replace(/\[?\s*location\s*\]?/gi, location)
}

const previewSubject = computed(() => {
  const row = previewItem.value
  if (!row) return ''
  const def = resolveDefault(row)
  const rawSubject = row.subject || def.subject || def.name
  return applyPlaceholders(rawSubject)
})

const previewHtml = computed(() => {
  const row = previewItem.value
  if (!row) return ''
  const def = resolveDefault(row)
  const rawTemplate = row.template && row.template.trim() ? row.template : def.template || ''
  return applyPlaceholders(rawTemplate)
})

const stripHtmlToText = (html = '') => {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<\/li>\s*/gi, '\n')
    .replace(/<li>\s*/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const previewIsWhatsApp = computed(() =>
  String(previewItem.value?.type || 'Email').toLowerCase() === 'whatsapp'
)

const previewWhatsAppText = computed(() => {
  if (!previewItem.value) return ''
  const text = previewHtml.value || ''
  return stripHtmlToText(text)
})

const emailPreviewHtml = computed(() => {
  if (!previewItem.value) return ''
  const subject = previewSubject.value || ''
  const content = previewHtml.value || ''
  const orgName = practiceName.value || 'Flossly'
  let html = EMAIL_TEMPLATE
    .replaceAll('{subject}', subject)
    .replace('{content}', content)
    .replace(/By flossly Team/gi, `By ${orgName}`)

  const osRegex = /<img[^>]*src="https:\/\/dev\.flossly\.ai\/emails\/email-logo\.png"[^>]*>/i
  const headerRegex = /<img[^>]*src="https:\/\/dev\.flossly\.ai\/emails\/logo\.png"[^>]*>/i
  const initialsCss = `.org-initials{width:36px;height:36px;border-radius:50%;background:#e8f0fe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;letter-spacing:0.5px}.org-initials--os{margin:0}.org-initials--header{margin:0 auto 8px}`

  const osLogoHtml = emailLogo
    ? `<img src="${emailLogo}" alt="Flossly" width="36" height="36" style="display:block" />`
    : `<div class="org-initials org-initials--os">${practiceInitials.value}</div>`

  html = html.replace(osRegex, osLogoHtml)

  if (practiceLogo.value) {
    html = html.replaceAll('https://dev.flossly.ai/emails/logo.png', practiceLogo.value)
  } else {
    const headerLogo = `<div class="org-initials org-initials--header">${practiceInitials.value}</div>`
    html = html.replace(headerRegex, headerLogo)
  }

  const needsInitials = !practiceLogo.value || !emailLogo
  if (needsInitials) {
    html = html.replace('</style>', `${initialsCss}</style>`)
  }

  return html
})

const saveContent = async () => {
  saving.value = true
  try {
    if (ej && active.value) {
      const saved = await ej.save()
      active.value.template = blocksToHtml(saved)
    }
    emit('update:rows', rows)
    const payload = buildPayload(active.value || {})
    await crmStore.saveAutomation(payload)
    emit('save', payload)
    show.value = false
  } finally {
    saving.value = false
  }
}

const onToggleEnabled = async (row, val) => {
  row.enabled = !!val
  const def = crmAutomationDefaults.find(d => d.key === row.key) || {}
  const payload = buildPayload({
    key: row.key,
    type: row.type || def.type || 'Email',
    name: row.name || def.name || row.key,
    subject: row.subject || def.subject || def.name,
    sending: row.sending || def.sending || '',
    enabled: row.enabled,
    template: (row.template && row.template.trim()) ? row.template : (def.template || ''),
  })
  try { await crmStore.saveAutomation(payload) } catch (e) {}
}

const saveTrigger = async () => {
  if (!triggerEditingRow.value) return
  try {
    triggerSaving.value = true
    const nextTrigger = buildTriggerFromForm()
    triggerEditingRow.value.trigger = nextTrigger
    triggerEditingRow.value.sending = formatCrmTriggerPreview(nextTrigger)
    const payload = buildPayload(triggerEditingRow.value)
    await crmStore.saveAutomation(payload)
    closeTriggerDialog()
  } finally {
    triggerSaving.value = false
  }
}

const onNameUpdate = async (item) => {
  // Optional: auto-save name changes
}

watch(show, (v) => {
  if (!v && ej) {
    if (typeof ej.destroy === 'function') ej.destroy()
    ej = null
  }
})
watch(showGroupDialog, (v) => {
  if (!v && props.displayMode === 'modal') clearAutomationSelection()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.automation-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 240px);
  gap: 16px;
  justify-content: flex-start;
}

.automation-card-cell {
  width: 240px;
  max-width: 240px;
}

.automation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 16px 72px;
}

.automation-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #eaf1ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.automation-empty__icon img {
  width: 32px;
  height: 32px;
}

.automation-empty__title {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.automation-empty__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}

.field-label {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.automation-toolbar {
  background: #f6f6f6;
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: 10px;
  padding: 10px 12px;
}

.with-border { 
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.table-header-section {
  padding: 20px 24px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.table-title { 
  font-weight: 600; 
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.custom-search {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: none;
}

.filter-btn,
.action-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: none;
}

/* Data Table Styles */
.automation-data-table {
  background: transparent;
}

.automation-data-table :deep(.v-table__wrapper) {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.full-width-table :deep(.v-table__wrapper) {
  width: 100%;
}

.full-width-table :deep(table) {
  width: 100% !important;
  table-layout: auto;
}

.full-width-table :deep(th:nth-child(1)) { width: 120px; }
.full-width-table :deep(th:nth-child(2)) { width: auto; min-width: 260px; }
.full-width-table :deep(th:nth-child(3)) { width: 260px; }
.full-width-table :deep(th:nth-child(4)) { width: 140px; }
.full-width-table :deep(th:nth-child(5)) { width: 120px; }

.automation-data-table :deep(thead) {
  background: #f6f6f6;
}

.automation-data-table :deep(thead th) {
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #4b5563 !important;
  padding: 12px 16px !important;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.4) !important;
}

.automation-data-table :deep(.v-data-table-header__content) {
  color: #4b5563;
  font-weight: 600;
}

.automation-data-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.automation-data-table :deep(tbody tr:hover) {
  background: #fafafa !important;
}

.automation-data-table :deep(tbody td) {
  padding: 12px 16px !important;
  font-size: 14px;
  vertical-align: middle !important;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2) !important;
}

.automation-data-table :deep(.v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: 1px solid rgba(var(--v-theme-outline), 0.25);
}

.automation-data-table :deep(.v-table__wrapper > table > tbody > tr > td:not(:last-child)) {
  border-right: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.automation-data-table :deep(tbody tr:nth-child(2n)) {
  background: #fcfcfc;
}

.name-text {
  font-weight: 500;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.switch-active :deep(.v-selection-control__input) {
  transform: scale(1.05);
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.action-icon-btn {
  color: #4b5563;
}

.action-icon-btn:hover {
  color: #111827;
}
.trigger-cell {
  gap: 8px;
}

/* Modal Styles */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.preview-modal-header {
  padding: 14px 18px;
}

.modal-title {
  font-weight: 600;
  font-size: 18px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.modal-body {
  padding: 28px;
  background: #fafafa;
  min-height: 450px;
  max-height: 70vh;
  overflow-y: auto;
}

.preview-modal-body {
  padding: 18px;
  max-height: none;
  overflow: hidden;
}

.recipient-section {
  background: white;
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
}

.editor-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.editor {
  min-height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 18px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.editor :deep(.ce-block__content) {
  max-width: 100%;
}

.editor :deep(.ce-paragraph) {
  line-height: 1.7;
  font-size: 14px;
}

.editor :deep(.ce-header) {
  font-weight: 600;
  margin: 10px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 28px;
  background: white;
}

.email-preview-frame {
  background: #f3f4f6;
  border-radius: 12px;
  padding: 12px;
}

.email-preview-iframe {
  width: 100%;
  height: 70vh;
  border: 0;
  border-radius: 10px;
  background: #f8f9fb;
}

.whatsapp-preview {
  background: #e5ddd5;
  border-radius: 12px;
  padding: 20px;
  min-height: 220px;
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
</style>

