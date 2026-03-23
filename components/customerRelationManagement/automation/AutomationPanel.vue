<template>
  <div>
    <template v-if="!activeAutomation || displayMode === 'modal'">
      <AutomationCards
        :cards="automationCards"
        :add-folder-icon="addFolderIcon"
        :show-card-toggle="props.showCardToggle"
        :allow-group-edit="props.allowGroupEdit"
        :active-key="activeAutomation?.key || ''"
        @select="selectAutomation"
        @toggle="toggleAutomationGroup"
        @edit="(card) => emit('edit-group', card)"
        @delete="(card) => emit('delete-group', card)"
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
        :disable-toggle="props.disableToggle"
        :show-preview-action="props.showPreviewAction"
        :default-automation-key-set="defaultAutomationKeySet"
        @back="clearAutomationSelection"
        @update:search="(val) => (search = val)"
        @update:filterEnabled="(val) => (filterEnabled = val)"
        @update:filterDisabled="(val) => (filterDisabled = val)"
        @clearFilters="clearFilters"
        @openTrigger="openTriggerEditor"
        @openPreview="openPreview"
        @openEdit="openEdit"
        @deleteRow="confirmDeleteAutomation"
        @toggleEnabled="onToggleEnabled"
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
            :disable-toggle="props.disableToggle"
            :show-preview-action="props.showPreviewAction"
            :default-automation-key-set="defaultAutomationKeySet"
            @update:search="(val) => (search = val)"
            @update:filterEnabled="(val) => (filterEnabled = val)"
            @update:filterDisabled="(val) => (filterDisabled = val)"
            @clearFilters="clearFilters"
            @openTrigger="openTriggerEditor"
            @openPreview="openPreview"
            @openEdit="openEdit"
            @deleteRow="confirmDeleteAutomation"
            @toggleEnabled="onToggleEnabled"
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

    <AutomationDeleteDialog
      v-model="showDeleteAutomation"
      :target-name="deleteAutomationTarget?.name || 'this automation'"
      :loading="deletingAutomation"
      @confirm="deleteAutomationNow"
    />

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
              v-if="triggerForm.triggerType !== 'black_friday' && triggerForm.triggerType !== 'month_day' && triggerForm.triggerType !== 'weekday_of_month' && triggerForm.triggerType !== 'birthday_month_start' && triggerForm.triggerType !== 'practice_anniversary' && triggerForm.triggerType !== 'send_now'"
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

            <v-col cols="12" md="6" v-if="triggerForm.triggerType === 'black_friday' || triggerForm.triggerType === 'month_day' || triggerForm.triggerType === 'weekday_of_month' || triggerForm.triggerType === 'birthday_month_start' || triggerForm.triggerType === 'practice_anniversary'">
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
import AutomationDeleteDialog from '@/components/customerRelationManagement/automation/AutomationDeleteDialog.vue'
import { getTemplateParamExamples, buildTemplatePreviewLines } from '@/lib/whatsappTemplatePreview'
import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults'
import addFolderIcon from '@/assets/icons/crm/add-folder.svg'
import { getCurrentUserName } from '@/lib/helpers/storage'
import { isDefaultAutomationGroup, resolveAutomationGroupAuthor } from '@/lib/crm/automation'
import { buildRecipientContext } from '@/lib/crm/previewContext'
import { applyCrmPlaceholders } from '@/lib/crm/placeholders'
import { htmlToPlainText } from '@/lib/format/text'

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
})
const crmStore = useCrmStore()
const orgStore = useOrgStore()
const emit = defineEmits(['update:rows','save','edit-group','delete-group'])

// Table state
const rows = reactive([])
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const saving = ref(false)
const activeAutomation = ref(null)
const showGroupDialog = ref(false)
const infoAlertText = "Most content is tailored to your practice profile. Please review and update details before enabling, as you're responsible for the final message."
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
  { label: 'Send Now', value: 'send_now' },
  { label: 'After enquiry', value: 'inquiry_days' },
  { label: 'Birthday offset', value: 'birthday_offset' },
  { label: 'Birthday month start', value: 'birthday_month_start' },
  { label: 'Black Friday', value: 'black_friday' },
  { label: 'Fixed date (annual)', value: 'month_day' },
  { label: 'Nth weekday (annual)', value: 'weekday_of_month' },
  { label: 'Practice anniversary', value: 'practice_anniversary' },
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
    return props.groups
  }
  if (groupRows.value.length) return groupRows.value
  return crmAutomationGroups
})

const isDefaultGroup = (group) =>
  isDefaultAutomationGroup(group, defaultGroupKeySet, defaultAutomationKeySet)

const visibleGroups = computed(() => {
  const withoutLegacy = resolvedGroups.value.filter((group) => String(group?.source || '').toLowerCase() !== 'legacy')
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

const loadRows = async () => {
  try {
    const res = await crmStore.listAutomation(resolvedLeadId.value || undefined)
    const apiItems = Array.isArray(res?.data) ? res.data : []
    const filteredItems = props.includeDefaults
      ? apiItems
      : apiItems.filter(item => !defaultAutomationKeySet.has(item.key))
    rows.splice(0, rows.length, ...(filteredItems.length ? filteredItems : (props.includeDefaults ? crmAutomationDefaults : [])))
  } catch {}
}

const loadGroups = async () => {
  if (!props.useGroupsApi || (Array.isArray(props.groups) && props.groups.length)) return
  try {
    const res = await crmStore.listAutomationGroups()
    if (res?.code === 0 && Array.isArray(res.data)) {
      groupRows.value = res.data
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
const showDeleteAutomation = ref(false)
const deletingAutomation = ref(false)
const deleteAutomationTarget = ref(null)
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
let ej = null
let EditorCtor = null
let Header = null
let List = null
const editorEl = ref(null)

const previewItem = ref(null)

const previewRecipient = computed(() => {
  return buildRecipientContext({
    lead: props.lead || {},
    many: false,
    fallbackName: '[Patient Name]',
    fallbackEmail: '[Email]',
    fallbackYourName: '[Your Name]',
  })
})
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

const confirmDeleteAutomation = (row) => {
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
      return
    }
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
    lead: props.lead || null,
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
    lead: props.lead || null,
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

/* Modal Styles */
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

