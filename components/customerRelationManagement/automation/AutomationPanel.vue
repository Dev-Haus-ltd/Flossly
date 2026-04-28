<template>
  <div>
    <template v-if="!activeAutomation || displayMode === 'modal'">
      <div
        v-if="isPatientJourney && patientJourneyGroupsLoading"
        class="patient-journey-automation-loading d-flex flex-column align-center justify-center py-12"
      >
        <v-progress-circular indeterminate color="primary" size="48" width="4" class="mb-4" />
        <div class="text-body-2 text-medium-emphasis">Loading automations...</div>
      </div>
      <AutomationCards
        v-else
        :cards="automationCards"
        :add-folder-icon="addFolderIcon"
        :show-card-toggle="props.showCardToggle"
        :allow-group-edit="props.allowGroupEdit"
        :active-key="activeAutomation?.key || ''"
        :whatsapp-enabled="props.whatsappEnabled"
        @select="selectAutomation"
        @toggle="toggleAutomationGroup"
        @edit="(card) => emit('edit-group', card)"
        @delete="(card) => emit('delete-group', card)"
        @go-to-automations="emit('go-to-automations')"
      />
    </template>

    <template v-if="activeAutomation && displayMode === 'inline'">
      <AutomationTable
        :title="activeAutomation.title"
        :description="activeAutomation.description"
        :show-header="true"
        :info-text="infoAlertText"
        :rows="filteredRows"
        :headers="tableHeaders"
        :search="search"
        :filter-enabled="filterEnabled"
        :filter-disabled="filterDisabled"
        :active-filters="activeFilters"
        :filter-sent="filterSent"
        :filter-type="filterType"
        :whatsapp-enabled="props.whatsappEnabled"
        :disable-toggle="props.disableToggle"
        :show-preview-action="props.showPreviewAction"
        :show-resend-action="props.showResendAction"
        :resending-key="resendingKey"
        :default-automation-key-set="defaultAutomationKeySet"
        :read-only-trigger="props.readOnlyTrigger"
        :show-delete="!isPatientJourney"
        :loading="patientTemplatesLoading"
        :disable-edit-for-sent="isPatientJourney"
        @back="clearAutomationSelection"
        @update:search="(val) => (search = val)"
        @update:filterEnabled="(val) => (filterEnabled = val)"
        @update:filterDisabled="(val) => (filterDisabled = val)"
        @update:filterSent="(val) => (filterSent = val)"
        @update:filterType="(val) => (filterType = val)"
        @clearFilters="clearFilters"
        @openTrigger="openTriggerEditor"
        @openPreview="openPreview"
        @openEdit="openEdit"
        @deleteRow="confirmDeleteAutomation"
        @toggleEnabled="onToggleEnabled"
        @resend="handleResend"
      />
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
          <AutomationTable
            :info-text="infoAlertText"
            :rows="filteredRows"
            :headers="tableHeaders"
            :search="search"
            :filter-enabled="filterEnabled"
            :filter-disabled="filterDisabled"
            :active-filters="activeFilters"
            :filter-sent="filterSent"
            :filter-type="filterType"
            :whatsapp-enabled="props.whatsappEnabled"
            :disable-toggle="props.disableToggle"
            :show-preview-action="props.showPreviewAction"
            :show-resend-action="props.showResendAction"
            :resending-key="resendingKey"
            :default-automation-key-set="defaultAutomationKeySet"
            :read-only-trigger="props.readOnlyTrigger"
            :show-delete="!isPatientJourney"
            :loading="patientTemplatesLoading"
            :disable-edit-for-sent="isPatientJourney"
            @update:search="(val) => (search = val)"
            @update:filterEnabled="(val) => (filterEnabled = val)"
            @update:filterDisabled="(val) => (filterDisabled = val)"
            @update:filterSent="(val) => (filterSent = val)"
            @update:filterType="(val) => (filterType = val)"
            @clearFilters="clearFilters"
            @openTrigger="openTriggerEditor"
            @openPreview="openPreview"
            @openEdit="openEdit"
            @deleteRow="confirmDeleteAutomation"
            @toggleEnabled="onToggleEnabled"
            @resend="handleResend"
          />
        </div>
      </v-card>
    </v-dialog>

    <AutomationPreviewDialog
      v-model="showPreview"
      :title="previewTitle"
      :subject="previewSubject"
      :email-html="emailPreviewHtml"
      :is-whats-app="previewIsWhatsApp"
      :whatsapp-text="previewWhatsAppText"
    />

    <ConfirmDialog
      v-model="showDeleteAutomation"
      title="Delete Automation"
      :message="`Are you sure you want to delete ${deleteAutomationTarget?.name || 'this automation'}? This cannot be undone.`"
      confirm-text="Delete"
      icon="mdi-delete-outline"
      :loading="deletingAutomation"
      @confirm="deleteAutomationNow"
      @cancel="showDeleteAutomation = false"
    />

    <v-dialog v-model="showTriggerDialog" max-width="600px" :persistent="triggerSaving">
      <v-card class="trigger-dialog rounded-xl overflow-hidden" elevation="16">

        <!-- Header -->
        <div class="trigger-dialog__header">
          <div class="d-flex align-center gap-3">
            <div class="trigger-dialog__header-icon">
              <v-icon size="20" color="white">mdi-lightning-bolt</v-icon>
            </div>
            <div>
              <div class="trigger-dialog__title">Set Trigger</div>
              <div class="trigger-dialog__subtitle" v-if="triggerEditingRow?.name">
                {{ triggerEditingRow.name }}
              </div>
            </div>
          </div>
          <v-btn icon variant="text" size="small" color="white" @click="closeTriggerDialog">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Live preview bar -->
        <div class="trigger-dialog__preview">
          <v-icon size="15" color="#0061FB" class="mr-2 flex-shrink-0">mdi-eye-outline</v-icon>
          <span class="trigger-dialog__preview-label">Preview:</span>
          <span class="trigger-dialog__preview-text ml-1">{{ triggerPreviewText }}</span>
        </div>

        <!-- Body -->
        <div class="trigger-dialog__body">

          <!-- Trigger type chip grid -->
          <div class="trigger-section-label mb-2">Trigger Type</div>
          <div class="trigger-type-grid">
            <button
              v-for="t in triggerTypes"
              :key="t.value"
              type="button"
              class="trigger-type-chip"
              :class="{ 'trigger-type-chip--active': triggerForm.triggerType === t.value }"
              @click="triggerForm.triggerType = t.value"
            >
              <v-icon size="15" class="mr-1">{{ t.icon }}</v-icon>
              {{ t.label }}
            </button>
          </div>

          <!-- Config section — only shown when a type is selected -->
          <template v-if="triggerForm.triggerType">
            <v-divider class="my-4" />
            <div class="trigger-section-label mb-3">Configuration</div>

            <v-row dense>

              <!-- inquiry_days: days number + date picker -->
              <template v-if="triggerForm.triggerType === 'inquiry_days'">
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Days after enquiry</div>
                  <v-text-field
                    v-model="triggerForm.triggerDays"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    prefix="+"
                    suffix="days"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Or pick a target date <span class="trig-field-hint">(calculates days from today)</span></div>
                  <v-text-field
                    :model-value="triggerInquiryDatePickerValue"
                    type="date"
                    :min="todayIso"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    @update:model-value="onInquiryDatePick"
                  />
                </v-col>
              </template>

              <!-- birthday_offset: days number -->
              <template v-else-if="triggerForm.triggerType === 'birthday_offset'">
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Days offset from birthday</div>
                  <v-text-field
                    v-model="triggerForm.triggerDays"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    :prefix="triggerForm.triggerDays >= 0 ? '+' : ''"
                    suffix="days"
                  />
                </v-col>
              </template>

              <!-- month_day: date picker + offset -->
              <template v-else-if="triggerForm.triggerType === 'month_day'">
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Annual date <span class="trig-field-hint">(year ignored)</span></div>
                  <v-text-field
                    :model-value="triggerDatePickerValue"
                    type="date"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    @update:model-value="onMonthDayDatePick"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <div class="trig-field-label">Month</div>
                  <v-text-field
                    v-model="triggerForm.triggerMonth"
                    type="number"
                    min="1"
                    max="12"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <div class="trig-field-label">Day</div>
                  <v-text-field
                    v-model="triggerForm.triggerDay"
                    type="number"
                    min="1"
                    max="31"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Offset days <span class="trig-field-hint">(negative = before)</span></div>
                  <v-text-field
                    v-model="triggerForm.triggerOffsetDays"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    :prefix="triggerForm.triggerOffsetDays > 0 ? '+' : ''"
                    suffix="days"
                  />
                </v-col>
              </template>

              <!-- weekday_of_month -->
              <template v-else-if="triggerForm.triggerType === 'weekday_of_month'">
                <v-col cols="12" sm="4">
                  <div class="trig-field-label">Month</div>
                  <v-text-field
                    v-model="triggerForm.triggerMonth"
                    type="number"
                    min="1"
                    max="12"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="trig-field-label">Weekday</div>
                  <v-select
                    v-model="triggerForm.triggerWeekday"
                    :items="weekdayOptions"
                    item-title="label"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="trig-field-label">Which week</div>
                  <v-select
                    v-model="triggerForm.triggerWeekIndex"
                    :items="weekIndexOptions"
                    item-title="label"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Offset days <span class="trig-field-hint">(negative = before)</span></div>
                  <v-text-field
                    v-model="triggerForm.triggerOffsetDays"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    :prefix="triggerForm.triggerOffsetDays > 0 ? '+' : ''"
                    suffix="days"
                  />
                </v-col>
              </template>

              <!-- black_friday / birthday_month_start / practice_anniversary: offset only -->
              <template v-else-if="['black_friday','birthday_month_start','practice_anniversary'].includes(triggerForm.triggerType)">
                <v-col cols="12" sm="6">
                  <div class="trig-field-label">Offset days <span class="trig-field-hint">(negative = before event)</span></div>
                  <v-text-field
                    v-model="triggerForm.triggerOffsetDays"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="trig-input"
                    :prefix="triggerForm.triggerOffsetDays > 0 ? '+' : ''"
                    suffix="days"
                  />
                </v-col>
              </template>

              <!-- send_now: info only -->
              <template v-else-if="triggerForm.triggerType === 'send_now'">
                <v-col cols="12">
                  <div class="trig-send-now-info">
                    <v-icon size="16" color="#0061FB" class="mr-2">mdi-send-circle-outline</v-icon>
                    This automation will be dispatched immediately to all eligible leads when you save.
                  </div>
                </v-col>
              </template>

            </v-row>
          </template>
        </div>

        <!-- Footer -->
        <div class="trigger-dialog__footer">
          <v-btn
            variant="text"
            class="trigger-dialog__cancel"
            @click="closeTriggerDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="trigger-dialog__save"
            :loading="triggerSaving"
            @click="saveTrigger"
          >
            <v-icon size="16" class="mr-1">mdi-check</v-icon>
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
          <!-- Editor Section -->
          <div class="editor-section">
            <div
              v-if="String(active?.type || 'Email').toLowerCase() !== 'whatsapp'"
              class="d-flex align-center justify-space-between mb-3"
            >
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                <v-icon size="18" class="mr-2">mdi-email-edit-outline</v-icon>
                Email Content
              </div>
              <v-chip size="x-small" variant="tonal" color="info">
                Use [First Name] for personalization
              </v-chip>
            </div>
            <div
              class="mb-4"
              v-if="String(active?.type || 'Email').toLowerCase() !== 'whatsapp' && !isPatientJourney"
            >
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
            <div ref="editorEl" class="editor"></div>
          </div>
        </div>

        <v-divider />

        <div class="modal-footer modal-footer--edit">
          <v-btn
            color="white"
            class="text-primary"
            style="border-radius: 8px; border: 1px solid #dfdfdf !important; min-height: 40px;"
            @click="show = false"
            flat
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            class="text-white"
            style="border-radius: 8px; border: 1px solid #dfdfdf !important; min-height: 40px;"
            @click="saveContent"
            :loading="saving"
            flat
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
import AutomationCards from '@/components/customerRelationManagement/automation/AutomationCards.vue'
import AutomationTable from '@/components/customerRelationManagement/automation/AutomationTable.vue'
import AutomationPreviewDialog from '@/components/customerRelationManagement/automation/AutomationPreviewDialog.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults'
import addFolderIcon from '@/assets/icons/crm/add-folder.svg'
import { getCurrentUserName } from '@/lib/helpers/storage'
import { isDefaultAutomationGroup, resolveAutomationGroupAuthor } from '@/lib/crm/automation'
import { buildRecipientContext } from '@/lib/crm/previewContext'
import { applyCrmPlaceholders } from '@/lib/crm/placeholders'
import { htmlToPlainText } from '@/lib/format/text'
import patientJourneyService from '@/services/patientJourneyService'

const props = defineProps({
  leadId: { type: [Number, String], default: null },
  lead: { type: Object, default: null },
  displayMode: { type: String, default: 'inline' },
  groups: { type: Array, default: null },
  useGroupsApi: { type: Boolean, default: true },
  includeDefaults: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: true },
  whatsappRequiresTemplates: { type: Boolean, default: false },
  showCardToggle: { type: Boolean, default: true },
  allowGroupEdit: { type: Boolean, default: false },
  showPreviewAction: { type: Boolean, default: true },
  disableToggle: { type: Boolean, default: false },
  showTriggerColumn: { type: Boolean, default: true },
  showStatusColumn: { type: Boolean, default: true },
  showLastSentColumn: { type: Boolean, default: false },
  showSentStatusColumn: { type: Boolean, default: false },
  showResendAction: { type: Boolean, default: false },
})
const crmStore = useCrmStore()
const mainStore = useMainStore()
const orgStore = useOrgStore()
const emit = defineEmits(['update:rows','save','edit-group','delete-group','go-to-automations'])

const resolvedPatientId = computed(() => {
  const raw = props.patientId ?? props.patient?.id
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
})

const isPatientJourney = computed(() => resolvedPatientId.value != null)

const patientTemplatesLoading = ref(false)
const patientJourneyGroupsLoading = ref(false)

watch(
  isPatientJourney,
  (journey) => {
    if (journey) patientJourneyGroupsLoading.value = true
  },
  { immediate: true }
)

const previewLeadLike = computed(() => {
  if (props.lead && Object.keys(props.lead).length) return props.lead
  const p = props.patient
  if (!p) return {}
  const name =
    [p.firstName, p.lastName].filter(Boolean).join(' ').trim() ||
    (typeof p.name === 'string' ? p.name.trim() : '') ||
    ''
  return {
    ...p,
    name: name || p.name || '',
    email: p.email || p.emailAddress || '',
  }
})

// Table state
const rows = reactive([])
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const filterSent = ref('all')
const filterType = ref('all')
const saving = ref(false)
const activeAutomation = ref(null)
const showGroupDialog = ref(false)
const infoAlertText = "Most content is tailored to your practice profile. Please review and update details before enabling, as you're responsible for the final message."
const groupRows = ref([])
const defaultAutomationKeySet = new Set(crmAutomationDefaults.map(item => item.key))
const defaultGroupKeySet = new Set(crmAutomationGroups.map(group => group.key))

const tableHeaders = computed(() => {
  const headers = [
    { title: 'Type', key: 'type', sortable: false },
    { title: 'Automation Name', key: 'name', sortable: false },
  ]
  if (props.showTriggerColumn) {
    headers.push({ title: 'Trigger', key: 'sending', sortable: false })
  }
  if (props.showLastSentColumn) {
    headers.push({ title: 'Last Sent', key: 'lastSentAt', sortable: false })
  }
  if (props.showSentStatusColumn) {
    headers.push({ title: 'Status', key: 'sentStatus', sortable: false, align: 'center', width: '110px' })
  }
  headers.push({ title: 'Actions', key: 'actions', sortable: false, align: 'center', width: '120px' })
  if (props.showStatusColumn) {
    headers.push({ title: 'Enable / Disable', key: 'enabled', sortable: false, align: 'center', width: '120px' })
  }
  return headers
})

const triggerTypes = [
  { label: 'Send Now', value: 'send_now', icon: 'mdi-send-circle-outline' },
  { label: 'After Enquiry', value: 'inquiry_days', icon: 'mdi-calendar-clock' },
  { label: 'Birthday', value: 'birthday_offset', icon: 'mdi-cake-variant-outline' },
  { label: 'Birthday Month', value: 'birthday_month_start', icon: 'mdi-cake-layered' },
  { label: 'Black Friday', value: 'black_friday', icon: 'mdi-tag-outline' },
  { label: 'Fixed Date', value: 'month_day', icon: 'mdi-calendar-star' },
  { label: 'Nth Weekday', value: 'weekday_of_month', icon: 'mdi-calendar-week' },
  { label: 'Anniversary', value: 'practice_anniversary', icon: 'mdi-office-building-outline' },
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
  if (filterSent.value !== 'all') count++
  if (filterType.value !== 'all') count++
  return count
})

const filteredRows = computed(() => {
  if (!activeAutomation.value) return []
  const keys = activeAutomation.value.templateKeys || []
  let result = []
  if (isPatientJourney.value) {
    result = rows
  } else if (keys.length) {
    const keySet = new Set(keys)
    result = rows.filter(r => keySet.has(r.key))
  } else {
    result = rows.filter(r => r.groupKey === activeAutomation.value.key)
  }
  if (filterEnabled.value && !filterDisabled.value) result = result.filter(r => r.enabled === true)
  if (filterDisabled.value && !filterEnabled.value) result = result.filter(r => r.enabled === false)
  if (filterSent.value === 'sent') result = result.filter(r => !!r.lastSentAt)
  if (filterSent.value === 'never') result = result.filter(r => !r.lastSentAt)
  return result
})

const clearFilters = () => {
  filterEnabled.value = false
  filterDisabled.value = false
  filterSent.value = 'all'
  filterType.value = 'all'
}

const resolvedGroups = computed(() => {
  if (Array.isArray(props.groups) && props.groups.length) {
    return props.groups
  }
  if (isPatientJourney.value) {
    if (groupRows.value.length) return groupRows.value
  } else if (crmStore.automationGroupRows.length) {
    return crmStore.automationGroupRows
  }
  return crmAutomationGroups
})

const isDefaultGroup = (group) =>
  isDefaultAutomationGroup(group, defaultGroupKeySet, defaultAutomationKeySet)

const visibleGroups = computed(() => {
  const withoutLegacy = resolvedGroups.value.filter((group) => String(group?.source || '').toLowerCase() !== 'legacy')
  if (isPatientJourney.value) {
    return withoutLegacy
  }
  if (props.includeDefaults) {
    return withoutLegacy.filter((group) => String(group?.source || '').toLowerCase() === 'system')
  }
  return withoutLegacy.filter((group) => String(group?.source || '').toLowerCase() === 'custom')
})

const resolveGroupAuthor = (group) =>
  resolveAutomationGroupAuthor(group, {
    isDefaultGroup,
    fallbackName: getCurrentUserName(),
  })

const bulkGroupState = computed(() => {
  if (!props.selectedLeadIds?.length) return null
  const total = props.selectedLeadIds.length
  const result = {}
  for (const group of visibleGroups.value) {
    const keys = group.templateKeys || []
    let enabledCount = 0
    for (const leadId of props.selectedLeadIds) {
      const leadRows = crmStore.automationRowsCache[Number(leadId)] || []
      const groupRows = keys.length
        ? leadRows.filter(r => new Set(keys).has(r.key))
        : leadRows.filter(r => r.groupKey === group.key)
      if (groupRows.some(r => r.enabled)) enabledCount++
    }
    result[group.key] = { enabledCount, totalCount: total }
  }
  return result
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
      isDefault: isDefaultGroup(group),
      hasWhatsApp: groupRows.some(r => String(r.type || 'Email').toLowerCase() === 'whatsapp'),
    }
  })
})

const loadPatientJourneyTemplates = async (groupKey) => {
  if (!resolvedPatientId.value || !groupKey) return
  patientTemplatesLoading.value = true
  try {
    const res = await patientJourneyService.listAutomationTemplates(groupKey, resolvedPatientId.value)
    const data = Array.isArray(res?.data) ? res.data : []
    rows.splice(0, rows.length, ...data)
  } catch {
    rows.splice(0, rows.length)
  } finally {
    patientTemplatesLoading.value = false
  }
}

const loadPatientJourneyGroupsOnly = async () => {
  if (!resolvedPatientId.value) return
  patientJourneyGroupsLoading.value = true
  try {
    const res = await patientJourneyService.listAutomationGroups(resolvedPatientId.value)
    if (res?.code === 0 && Array.isArray(res.data)) {
      groupRows.value = res.data
    } else {
      groupRows.value = []
    }
  } catch {
    groupRows.value = []
  } finally {
    patientJourneyGroupsLoading.value = false
  }
}

const selectAutomation = async (card) => {
  activeAutomation.value = card
  search.value = ''
  clearFilters()
  if (isPatientJourney.value) {
    await loadPatientJourneyTemplates(card?.key)
  }
  if (props.displayMode === 'modal') {
    showGroupDialog.value = true
  }
}

const clearAutomationSelection = () => {
  activeAutomation.value = null
  search.value = ''
  clearFilters()
  showGroupDialog.value = false
  if (isPatientJourney.value) {
    rows.splice(0, rows.length)
  }
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
  if (triggerType === 'send_now') {
    return { type: 'send_now' }
  }
  if (triggerType === 'black_friday') {
    return { type: 'black_friday', offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0) }
  }
  if (triggerType === 'birthday_month_start') {
    return { type: 'birthday_month_start', offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0) }
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
  if (triggerType === 'practice_anniversary') {
    return { type: 'practice_anniversary', offsetDays: sanitizeNumber(triggerForm.triggerOffsetDays, 0) }
  }
  return { type: triggerType, days: sanitizeNumber(triggerForm.triggerDays, 0) }
}

const triggerPreviewText = computed(() => {
  const nextTrigger = buildTriggerFromForm()
  if (nextTrigger?.type !== 'send_now') {
    return formatCrmTriggerPreview(nextTrigger)
  }
  const channel = String(triggerEditingRow.value?.type || 'Email').toLowerCase()
  if (channel === 'whatsapp') {
    return 'Message will be sent immediately when you click Save Trigger.'
  }
  return 'Email will be sent immediately when you click Save Trigger.'
})

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

// Date picker helpers for trigger editor
const todayIso = new Date().toISOString().split('T')[0]

const triggerDatePickerValue = computed(() => {
  const m = String(triggerForm.triggerMonth || '').padStart(2, '0')
  const d = String(triggerForm.triggerDay || '').padStart(2, '0')
  if (!triggerForm.triggerMonth || !triggerForm.triggerDay) return ''
  return `${new Date().getFullYear()}-${m}-${d}`
})

const triggerInquiryDatePickerValue = computed(() => {
  const days = Number(triggerForm.triggerDays || 0)
  if (days <= 0) return ''
  const target = new Date()
  target.setDate(target.getDate() + days)
  return target.toISOString().split('T')[0]
})

const onMonthDayDatePick = (val) => {
  if (!val) return
  const d = new Date(val)
  if (isNaN(d.getTime())) return
  triggerForm.triggerMonth = d.getMonth() + 1
  triggerForm.triggerDay = d.getDate()
}

const onInquiryDatePick = (val) => {
  if (!val) return
  const picked = new Date(val)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  picked.setHours(0, 0, 0, 0)
  if (isNaN(picked.getTime())) return
  const days = Math.max(0, Math.round((picked - today) / 86400000))
  triggerForm.triggerDays = days
}

const openTriggerEditor = (row) => {
  if (resolvedPatientId.value || props.readOnlyTrigger) return
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
  if (resolvedPatientId.value) {
    return {
      key: row.key,
      type: row.type || 'Email',
      name: row.name || row.key,
      sending: row.sending || '',
      enabled: !!row.enabled,
      template: row.template || '',
      roleName: row.roleName,
      groupKey: row.groupKey || activeAutomation.value?.key,
      patientId: resolvedPatientId.value,
    }
  }
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

const toggleAutomationGroupBulk = async (card, val) => {
  const keys = card?.templateKeys || []
  const allUpdates = []

  for (const leadId of props.selectedLeadIds) {
    const numId = Number(leadId)
    const leadRows = crmStore.automationRowsCache[numId] || []
    let groupRows

    if (keys.length) {
      const rowMap = new Map(leadRows.map(r => [r.key, r]))
      groupRows = keys.map(key => {
        if (rowMap.has(key)) return rowMap.get(key)
        const def = crmAutomationDefaults.find(d => d.key === key)
        return def ? { ...def } : null
      }).filter(Boolean)
    } else {
      groupRows = leadRows.filter(r => r.groupKey === card?.key)
    }

    const leadUpdates = []
    groupRows.forEach(row => {
      if (!!row.enabled !== !!val) {
        leadUpdates.push({
          key: row.key,
          type: row.type || 'Email',
          name: row.name || row.key,
          subject: row.subject || '',
          sending: row.sending || '',
          enabled: !!val,
          template: row.template || '',
          groupKey: row.groupKey || card?.key,
          leadId: numId,
        })
      }
    })

    if (leadUpdates.length) {
      allUpdates.push(...leadUpdates)
      const changeKeys = new Map(leadUpdates.map(u => [u.key, u.enabled]))
      crmStore.setLeadAutomationsOptimistic(
        numId,
        (crmStore.automationRowsCache[numId] || []).map(row =>
          changeKeys.has(row.key) ? { ...row, enabled: changeKeys.get(row.key) } : row
        )
      )
    }
  }

  if (!allUpdates.length) return

  try {
    await crmStore.saveAutomationBatch({ items: allUpdates })
  } catch (e) {
    await Promise.all(props.selectedLeadIds.map(id => crmStore.invalidateLeadAutomations(Number(id))))
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to update automations', type: 'error' })
  }
}

const toggleAutomationGroup = async (card, val) => {
  const keys = card?.templateKeys || []
  let groupRows
  if (keys.length) {
    const rowMap = new Map(rows.map((r) => [r.key, r]))
    const synthesized = []
    groupRows = keys.map((key) => {
      if (rowMap.has(key)) return rowMap.get(key)
      const def = crmAutomationDefaults.find((d) => d.key === key)
      if (!def) return null
      const newRow = { ...def }
      synthesized.push(newRow)
      return newRow
    }).filter(Boolean)
    if (synthesized.length) rows.push(...synthesized)
  } else {
    groupRows = rows.filter((r) => r.groupKey === card?.key)
  }

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
    if (resolvedLeadId.value) {
      await crmStore.invalidateLeadAutomations(resolvedLeadId.value)
      const syncedRows = crmStore.automationRowsCache[Number(resolvedLeadId.value)] || []
      const filteredRows = props.includeDefaults
        ? syncedRows
        : syncedRows.filter(item => !defaultAutomationKeySet.has(item.key))
      rows.splice(0, rows.length, ...(filteredRows.length ? filteredRows : (props.includeDefaults ? crmAutomationDefaults : [])))
    }
  } catch (e) {
    groupRows.forEach((row) => { row.enabled = !row.enabled })
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to update automations', type: 'error' })
  }
}

const loadRows = async () => {
  if (resolvedPatientId.value) {
    if (activeAutomation.value) {
      await loadPatientJourneyTemplates(activeAutomation.value.key)
    } else {
      rows.splice(0, rows.length)
    }
    return
  }
  try {
    let apiItems = []
    if (resolvedLeadId.value) {
      await crmStore.fetchLeadAutomations(resolvedLeadId.value, { force: true })
      apiItems = crmStore.automationRowsCache[Number(resolvedLeadId.value)] || []
    } else {
      const res = await crmStore.listAutomation()
      apiItems = Array.isArray(res?.data) ? res.data : []
    }
    if (resolvedLeadId.value) {
      crmStore.syncLeadAutomations(resolvedLeadId.value, apiItems)
    }
    const filteredItems = props.includeDefaults
      ? apiItems
      : apiItems.filter(item => !defaultAutomationKeySet.has(item.key))
    rows.splice(0, rows.length, ...(filteredItems.length ? filteredItems : (props.includeDefaults ? crmAutomationDefaults : [])))
  } catch {}
}

const loadGroups = async () => {
  if (resolvedPatientId.value) {
    await loadPatientJourneyGroupsOnly()
    return
  }
  if (!props.useGroupsApi || (Array.isArray(props.groups) && props.groups.length)) return
  await crmStore.fetchAutomationGroups()
}

const refresh = async ({ skipGroups = false } = {}) => {
  if (resolvedPatientId.value) {
    const tasks = [loadRows()]
    if (!skipGroups) tasks.push(loadGroups())
    await Promise.all(tasks)
    return
  }
  const tasks = [loadRows()]
  if (!skipGroups) tasks.push(loadGroups())
  await Promise.all(tasks)
}

defineExpose({ refresh })

onMounted(async () => {
  await refresh()
})

watch(resolvedLeadId, () => {
  if (resolvedPatientId.value) return
  clearAutomationSelection()
  refresh()
})

watch(resolvedPatientId, () => {
  clearAutomationSelection()
  refresh()
})

// Keep local rows in sync with the store cache so any external write
// (table column toggle, bulk dialog, invalidation) is reflected immediately
// without needing to close and reopen the panel.
watch(
  () => resolvedLeadId.value ? crmStore.automationRowsCache[resolvedLeadId.value] : null,
  (cacheRows) => {
    if (!resolvedLeadId.value || !Array.isArray(cacheRows)) return
    const filtered = props.includeDefaults
      ? cacheRows
      : cacheRows.filter(item => !defaultAutomationKeySet.has(item.key))
    rows.splice(0, rows.length, ...(filtered.length ? filtered : (props.includeDefaults ? crmAutomationDefaults : [])))
  }
)

// Preview dialog state
const show = ref(false)
const showPreview = ref(false)
const active = ref(null)
const showDeleteAutomation = ref(false)
const deletingAutomation = ref(false)
const deleteAutomationTarget = ref(null)
let ej = null
let EditorCtor = null
let Header = null
let List = null
const editorEl = ref(null)

const previewItem = ref(null)

const previewRecipient = computed(() => {
  return buildRecipientContext({
    lead: previewLeadLike.value,
    many: false,
    fallbackName: '[Patient Name]',
    fallbackEmail: '[Email]',
    fallbackYourName: '[Your Name]',
  })
})
const openEdit = async (row) => {
  if (resolvedPatientId.value && row?.sent) {
    mainStore?.setSnackbar?.({
      title: 'This automation was already sent and cannot be edited.',
      type: 'info',
    })
    return
  }
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

const confirmDeleteAutomation = (row) => {
  if (resolvedPatientId.value) return
  if (!row || defaultAutomationKeySet.has(row.key)) return
  deleteAutomationTarget.value = row
  showDeleteAutomation.value = true
}

const deleteAutomationNow = async () => {
  if (!deleteAutomationTarget.value) return
  try {
    deletingAutomation.value = true
    const res = await crmStore.deleteAutomation({ key: deleteAutomationTarget.value.key })
    if (res?.code === 0) {
      showDeleteAutomation.value = false
      deleteAutomationTarget.value = null
      await refresh()
      mainStore?.setSnackbar?.({ title: 'Automation deleted', type: 'success' })
      return
    }
    mainStore?.setSnackbar?.({ title: res?.message || 'Failed to delete automation', type: 'error' })
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to delete automation', type: 'error' })
  } finally {
    deletingAutomation.value = false
  }
}

const openPreview = (row) => {
  if (!row) return
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

const resolveOrgDetails = () => {
  const storedOrg = getStoredOrg()
  if (storedOrg) return storedOrg
  return (
    orgStore.getOrgDetails ||
    orgStore.organisation ||
    orgStore.organization ||
    orgStore.org ||
    orgStore.orgDetails ||
    {}
  )
}

const practiceName = computed(() => {
  const details = resolveOrgDetails()
  return details?.name || orgStore.name || orgStore.orgName || '[Practice Name]'
})

const practiceInitials = computed(() => {
  const name = practiceName.value || '[Practice Name]'
  const parts = name.replace(/\s+/g, ' ').trim().split(' ')
  const letters = parts.slice(0, 2).map(part => part[0]).join('')
  return letters.toUpperCase() || 'P'
})

const practiceLogo = computed(() => {
  const details = resolveOrgDetails()
  return details?.logo || orgStore.logo || null
})

const resolveDefault = (row) =>
  crmAutomationDefaults.find(d => d && d.key === row?.key) || {}

const previewTitle = computed(() => {
  if (!previewItem.value) return ''
  return previewItem.value?.name || previewItem.value?.key || 'Preview'
})

const previewSubject = computed(() => {
  const row = previewItem.value
  if (!row) return ''
  const def = resolveDefault(row)
  const rawSubject = row.subject || def.subject || def.name
  return applyCrmPlaceholders(rawSubject, {
    lead: previewLeadLike.value || null,
    recipient: previewRecipient.value,
    practiceName: practiceName.value,
    org: resolveOrgDetails(),
  })
})

const previewHtml = computed(() => {
  const row = previewItem.value
  if (!row) return ''
  const def = resolveDefault(row)
  const rawTemplate = row.template && row.template.trim() ? row.template : def.template || ''
  return applyCrmPlaceholders(rawTemplate, {
    lead: previewLeadLike.value || null,
    recipient: previewRecipient.value,
    practiceName: practiceName.value,
    org: resolveOrgDetails(),
  })
})

const previewIsWhatsApp = computed(() =>
  String(previewItem.value?.type || 'Email').toLowerCase() === 'whatsapp'
)

const previewWhatsAppText = computed(() => {
  if (!previewItem.value) return ''
  const text = previewHtml.value || ''
  return htmlToPlainText(text)
})

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>{subject}</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f8f9fb; font-family: Arial, Helvetica, sans-serif; }

      .email-container { max-width: 520px; background: #ffffff; margin-top: 8px; border-radius: 12px; border: 1px solid #e5e5e5; box-shadow: 0 6px 20px rgba(17, 24, 39, 0.08); overflow: hidden; }
      .main-container { max-width: 520px; margin: 28px auto 24px; overflow: hidden; }
      .os { margin-top: 16px; display: inline; }
      .header { text-align: center; padding: 28px 24px 12px; }
      .title { font-size: 18px; font-weight: 600; max-width: 320px; margin: 12px auto 4px; color: #0f172a; }
      .subtitle { font-size: 12px; color: #6b7280; margin: 0; }
      .content { padding: 24px 24px 32px; background-color: #f3f6ff; border-top: 1px solid #e5eaf0; }
      .content p { margin: 0 0 14px; font-size: 14px; color: #111827; line-height: 1.6; }
      .footer { text-align: center; font-size: 12px; color: #9ca3af; padding: 18px 12px; }

      @media only screen and (max-width: 600px) {
        .email-container { width: 95% !important; }
        .content { padding: 20px; }
      }
    </style>
  </head>
  <body>
    <center>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <div class="main-container">
              <div class="os">
                <img src="https://dev.flossly.ai/emails/email-logo.png" alt="Flossly Logo" width="36" height="36" style="display:block" />
              </div>
              <div class="email-container">
                <div class="header">
                  <img src="https://dev.flossly.ai/emails/logo.png" alt="Flossly Logo" width="36" height="36" style="display:block; margin: 0 auto 8px" />
                  <h2 class="title">{subject}</h2>
                  <p class="subtitle">By flossly Team</p>
                </div>
                <div class="content">{content}</div>
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
    if (resolvedPatientId.value) {
      const res = await patientJourneyService.saveAutomationTemplate(payload)
      if (res?.code !== 0) {
        mainStore?.setSnackbar?.({ title: res?.message || 'Failed to save automation', type: 'error' })
        return
      }
      emit('save', payload)
      show.value = false
      mainStore?.setSnackbar?.({ title: 'Automation saved successfully', type: 'success' })
      return
    }
    const res = await crmStore.saveAutomation(payload)
    if (res?.code !== 0) {
      mainStore?.setSnackbar?.({ title: res?.message || 'Failed to save automation', type: 'error' })
      return
    }
    emit('save', payload)
    show.value = false
    mainStore?.setSnackbar?.({ title: 'Automation saved successfully', type: 'success' })
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to save automation', type: 'error' })
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
    trigger: row.trigger || def.trigger || undefined,
  })
  try {
    if (resolvedPatientId.value) {
      const res = await patientJourneyService.saveAutomationTemplate(payload)
      if (res?.code !== 0) throw new Error(res?.message || 'Failed to update automation')
      return
    }
    await crmStore.saveAutomation(payload)
  } catch (e) {
    row.enabled = !row.enabled
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to update automation', type: 'error' })
  }
}

const sendImmediateLeadMail = async (row) => {
  if (!resolvedLeadId.value) return null
  if (String(row?.type || 'Email').toLowerCase() === 'whatsapp') return null
  const def = resolveDefault(row || {})
  const rawSubject = row?.subject || def.subject || def.name || row?.name || 'Automation'
  const rawTemplate = row?.template && String(row.template).trim()
    ? row.template
    : (def.template || '')
  const subject = applyCrmPlaceholders(rawSubject, {
    lead: previewLeadLike.value || null,
    recipient: previewRecipient.value,
    practiceName: practiceName.value,
    org: resolveOrgDetails(),
  })
  const html = applyCrmPlaceholders(rawTemplate, {
    lead: previewLeadLike.value || null,
    recipient: previewRecipient.value,
    practiceName: practiceName.value,
    org: resolveOrgDetails(),
  })
  return crmStore.sendLeadMail({
    leadIds: [resolvedLeadId.value],
    subject,
    html,
    key: `automation_${row?.key || 'send_now'}`,
  })
}

const resendingKey = ref(null)

const handleResend = async (row) => {
  if (resolvedPatientId.value) return
  if (resendingKey.value) return
  resendingKey.value = row.key
  try {
    const res = await sendImmediateLeadMail(row)
    if (res?.code === 0 || res?.sent > 0) {
      row.lastSentAt = new Date().toISOString()
      mainStore?.setSnackbar?.({ title: 'Automation resent successfully', type: 'success' })
    } else {
      mainStore?.setSnackbar?.({ title: res?.message || 'Failed to resend automation', type: 'error' })
    }
  } catch (e) {
    mainStore?.setSnackbar?.({ title: e?.message || 'Failed to resend automation', type: 'error' })
  } finally {
    resendingKey.value = null
  }
}

const saveTrigger = async () => {
  if (resolvedPatientId.value) return
  if (!triggerEditingRow.value) return
  try {
    const selectedRow = triggerEditingRow.value
    triggerSaving.value = true
    const nextTrigger = buildTriggerFromForm()
    const isSendNow = nextTrigger?.type === 'send_now'
    const isWhatsAppRow = String(selectedRow?.type || 'Email').toLowerCase() === 'whatsapp'
    if (isSendNow && isWhatsAppRow && !props.whatsappEnabled) {
      mainStore?.setSnackbar?.({ title: 'WhatsApp is not connected — this automation cannot be sent.', type: 'warning' })
      triggerSaving.value = false
      return
    }
    selectedRow.trigger = nextTrigger
    selectedRow.sending = formatCrmTriggerPreview(nextTrigger)
    if (isSendNow) {
      // "Send Now" should dispatch immediately, so ensure row is enabled.
      selectedRow.enabled = true
    }
    const payload = buildPayload(selectedRow)
    const isLeadSendNowEmail =
      isSendNow &&
      !!resolvedLeadId.value &&
      String(selectedRow?.type || 'Email').toLowerCase() !== 'whatsapp'
    if (isSendNow && !isLeadSendNowEmail) payload.awaitSendNow = true
    let res = await crmStore.saveAutomation(payload)
    if (res?.code !== 0) {
      mainStore?.setSnackbar?.({
        title: res?.error || res?.message || 'Failed to save trigger',
        type: 'error',
      })
      return
    }
    if (isSendNow && !isLeadSendNowEmail && res?.data?.sendNowConfirmationRequired) {
      const preview = res?.data?.sendNowPreview || {}
      const alreadySent = Number(preview?.alreadySent || 0)
      const sendable = Number(preview?.sendable || 0)
      const confirmResend = typeof window !== 'undefined'
        ? window.confirm(
            `This automation was already sent to ${alreadySent} lead(s). ` +
            `There are ${sendable} new eligible lead(s). ` +
            `Do you want to resend to previously-sent leads as well?`
          )
        : false
      if (!confirmResend) {
        mainStore?.setSnackbar?.({
          title: 'Send now cancelled',
          type: 'info',
        })
        return
      }
      res = await crmStore.saveAutomation({ ...payload, forceResend: true })
      if (res?.code !== 0) {
        mainStore?.setSnackbar?.({
          title: res?.error || res?.message || 'Failed to resend automation',
          type: 'error',
        })
        return
      }
    }
    closeTriggerDialog()
    if (!isSendNow) return
    if (isLeadSendNowEmail) {
      const sendRes = await sendImmediateLeadMail(selectedRow)
      if (sendRes?.code === 0) {
        const sent = Number(sendRes?.data?.sent || 0)
        mainStore?.setSnackbar?.({
          title: sent ? `Mail sent to ${sent} recipient(s)` : 'Mail sent successfully',
          type: 'success',
        })
        return
      }
      mainStore?.setSnackbar?.({
        title: sendRes?.error || sendRes?.message || 'Failed to send email',
        type: 'error',
      })
      return
    }
    const immediate = res?.data?.sendNowResult
    if (immediate) {
      const sent = Number(immediate?.sent || 0)
      const resent = Number(immediate?.resent || 0)
      const failed = Number(immediate?.failed || 0)
      const skipped = Number(immediate?.skippedAlreadySent || 0) + Number(immediate?.skippedMissingRecipient || 0)
      const chunks = []
      if (sent) chunks.push(`${sent} sent`)
      if (resent) chunks.push(`${resent} resent`)
      if (failed) chunks.push(`${failed} failed`)
      if (skipped) chunks.push(`${skipped} skipped`)
      mainStore?.setSnackbar?.({
        title: chunks.length ? chunks.join(' - ') : 'Send now completed',
        type: failed ? 'warning' : 'success',
      })
      return
    }
    const jobId = String(res?.data?.sendNowJob?.jobId || '').trim()
    if (!jobId) {
      mainStore?.setSnackbar?.({
        title: 'Send now is running. Please check again in a moment.',
        type: 'info',
      })
      return
    }
    mainStore?.setSnackbar?.({
      title: 'Send now started. Checking delivery status...',
      type: 'info',
    })
    const done = await pollSendNowStatus(jobId)
    if (done?.status === 'completed') {
      const sent = Number(done?.result?.sent || 0)
      const failed = Number(done?.result?.failed || 0)
      const skipped = Number(done?.result?.skippedAlreadySent || 0) + Number(done?.result?.skippedMissingRecipient || 0)
      const chunks = []
      if (sent) chunks.push(`${sent} sent`)
      if (failed) chunks.push(`${failed} failed`)
      if (skipped) chunks.push(`${skipped} skipped`)
      mainStore?.setSnackbar?.({
        title: chunks.length ? chunks.join(' - ') : 'Send now completed',
        type: failed ? 'warning' : 'success',
      })
      return
    }
    const errMsg = done?.error || 'Send now failed. Please try again.'
    mainStore?.setSnackbar?.({
      title: errMsg,
      type: 'error',
    })
  } catch (e) {
    mainStore?.setSnackbar?.({
      title: e?.data?.message || e?.message || 'Failed to save trigger',
      type: 'error',
    })
  } finally {
    triggerSaving.value = false
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pollSendNowStatus = async (jobId) => {
  const maxAttempts = 40
  const intervalMs = 1500
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await crmStore.getAutomationSendNowStatus({ jobId })
    if (res?.code === 0 && res?.data) {
      const status = String(res.data.status || '').toLowerCase()
      if (status === 'completed' || status === 'failed') return res.data
    } else if (res?.code === 404) {
      return { status: 'failed', error: 'Send now status expired. Please check email logs.' }
    }
    await sleep(intervalMs)
  }
  return { status: 'failed', error: 'Send now is taking longer than expected. Please check again shortly.' }
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

/* ═══════ Trigger Dialog ═══════ */
.trigger-dialog {
  overflow: hidden;
}

.trigger-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(135deg, #0061FB 0%, #1a73ff 100%);
}

.trigger-dialog__header-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trigger-dialog__title {
  font-weight: 700;
  font-size: 16px;
  color: #ffffff;
  line-height: 1.2;
}

.trigger-dialog__subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  margin-top: 2px;
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-dialog__preview {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: #EFF6FF;
  border-bottom: 1px solid #DBEAFE;
  min-height: 38px;
}

.trigger-dialog__preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #0061FB;
  white-space: nowrap;
  flex-shrink: 0;
}

.trigger-dialog__preview-text {
  font-size: 12px;
  color: #1e40af;
  font-style: italic;
}

.trigger-dialog__body {
  padding: 20px;
  background: #fafafa;
  max-height: 60vh;
  overflow-y: auto;
}

.trigger-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: #9ca3af;
}

/* Trigger type chip grid */
.trigger-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.trigger-type-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  line-height: 1.2;
}

.trigger-type-chip:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #0061FB;
}

.trigger-type-chip--active {
  border-color: #0061FB;
  background: #eff6ff;
  color: #0061FB;
  font-weight: 600;
  box-shadow: 0 0 0 3px rgba(0, 97, 251, 0.1);
}

/* Config fields */
.trig-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 5px;
}

.trig-field-hint {
  font-size: 11px;
  font-weight: 400;
  color: #9ca3af;
}

.trig-input :deep(.v-field) {
  border-radius: 8px !important;
  font-size: 13px;
}

.trig-send-now-info {
  display: flex;
  align-items: flex-start;
  padding: 12px 14px;
  background: #eff6ff;
  border: 1px solid #DBEAFE;
  border-radius: 10px;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.5;
}

/* Footer */
.trigger-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
}

.trigger-dialog__cancel {
  font-size: 13px;
  color: #6b7280;
  text-transform: none;
  letter-spacing: 0;
}

.trigger-dialog__save {
  min-height: 36px;
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  padding: 0 18px;
}

/* ═══════ Modal Styles (edit/preview) ═══════ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
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

.editor-section {
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: 0;
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

/* Editor.js toolbar alignment in wide containers */
.editor :deep(.ce-toolbar__content) {
  max-width: 100%;
}

.editor :deep(.ce-toolbar__actions) {
  right: 12px;
}

.editor :deep(.ce-toolbar__plus) {
  left: 12px;
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

.modal-footer--edit {
  justify-content: flex-end;
  padding: 12px 16px;
}

</style>

