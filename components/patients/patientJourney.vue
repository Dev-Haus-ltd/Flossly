<template>
  <v-card class="mt-5 rounded-lg" :elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-title class="title d-flex justify-space-between align-center py-3">
      <span>Patient Journey</span>
      <div class="d-flex align-center" style="gap: 8px">
        <template v-if="section === 'smile'">
          <v-btn
            variant="flat"
            class="journey-action-btn share-btn"
            @click="onShare"
          >
            Share
          </v-btn>
          <v-btn
            variant="flat"
            class="journey-action-btn print-btn"
            @click="onPrint"
          >
            Print
          </v-btn>
          <v-btn
            variant="flat"
            class="journey-action-btn download-btn"
            @click="onDownload"
          >
            Download
          </v-btn>
        </template>
        <template v-else-if="section !== 'automations'">
          <v-btn
            variant="outlined"
            color="primary"
            class="journey-action-btn"
            @click="isEditing = true"
          >
            Edit
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="journey-action-btn"
            :disabled="!isEditing"
            @click="onSave"
          >
            Save
          </v-btn>
        </template>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="px-5 py-0">
      <div class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="items"
          :selected="section"
          @select="section = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="min-height: 55vh">
          <div v-if="section === 'comfort'">
            <UniquePatientComfortForm
              ref="comfortForm"
              :patient-id="patient?.id"
              :editing="isEditing"
            />
          </div>
          <div v-else-if="section === 'smile'">
            <SmileConcernSurveyForm
              ref="surveyForm"
              :patient-id="patient?.id"
              :editing="isEditing"
            />
          </div>

          <div v-else-if="section === 'automations'">
            <v-card class="content-card" :elevation="0">
              <template v-if="!activeAutomation">
                <v-row v-if="automationGroupsLoading" dense>
                  <v-col v-for="n in 4" :key="`automation-skeleton-${n}`" cols="12" sm="6" md="3">
                    <v-skeleton-loader type="card" height="160" />
                  </v-col>
                </v-row>
                <v-row v-else-if="automationGroups.length" dense>
                  <v-col v-for="card in automationGroups" :key="card.key" cols="12" sm="6" md="3">
                    <AutomationCard
                      :title="card.title"
                      :description="card.description"
                      :count="card.itemCount || card.templates?.length || 0"
                      :enabled="card.enabled"
                      :selected="activeAutomation?.key === card.key"
                      @select="selectAutomation(card)"
                      @toggle="(val) => { card.enabled = val; toggleAutomationGroup(card) }"
                    />
                  </v-col>
                </v-row>
                <div v-else class="text-center py-10">
                  <v-icon size="56" color="grey-lighten-1">mdi-email-off-outline</v-icon>
                  <div class="text-body-1 mt-2">No automations found</div>
                  <div class="text-caption text-medium-emphasis">Try again or check your connection.</div>
                </div>
              </template>
              <template v-else>
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

                  <div class="d-flex align-center gap-3">
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
                      style="width: 260px"
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
                      <v-card class="pa-4" min-width="260">
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

                <v-card class="with-border rounded-lg elevation-0">
                  <v-divider />
                  <v-data-table
                    :items="filteredAutomationRows"
                    :headers="automationHeaders"
                    item-value="key"
                    class="automation-data-table full-width-table"
                    density="comfortable"
                    hover
                    :items-per-page="15"
                    :loading="automationLoading"
                  >
                    <template #loading>
                      <div class="text-center py-10">
                        <v-progress-circular indeterminate color="primary" size="40" class="mb-3" />
                        <div class="text-body-2 text-medium-emphasis">Loading automations...</div>
                      </div>
                    </template>
                    <template #item.type="{ item }">
                      <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
                        <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
                        {{ item.type }}
                      </v-chip>
                    </template>
                    <template #item.name="{ item }">
                      <v-text-field
                        v-model="item.name"
                        variant="plain"
                        density="compact"
                        hide-details
                        class="name-field"
                        @blur="onNameUpdate(item)"
                      />
                    </template>
                    <template #item.sending="{ item }">
                      <div class="d-flex align-center">
                        <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
                        <span class="text-body-2 text-medium-emphasis">{{ item.sending }}</span>
                      </div>
                    </template>
                    <template #item.actions="{ item }">
                      <v-btn
                        variant="outlined"
                        size="small"
                        color="primary"
                        :disabled="item.sent"
                        :title="item.sent ? 'Already sent. Editing is disabled.' : 'Edit'"
                        @click="openEditor(item)"
                      >
                        <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
                        Edit
                      </v-btn>
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
              </template>
            </v-card>

            <v-dialog v-model="showEditor" max-width="1100px" scrollable>
              <v-card class="rounded-lg elevation-8">
                <div class="modal-header">
                  <div>
                    <h5 class="modal-title">{{ activeItem?.name }}</h5>
                    <div class="d-flex align-center gap-2 mt-2">
                      <v-chip size="x-small" variant="tonal" color="primary">
                        <v-icon size="12" class="mr-1">mdi-email-outline</v-icon>
                        {{ activeItem?.type }}
                      </v-chip>
                      <v-chip size="x-small" variant="tonal" color="grey">
                        <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                        {{ activeItem?.sending }}
                      </v-chip>
                    </div>
                  </div>
                  <v-btn icon variant="text" @click="showEditor = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>

                <v-divider />

                <div class="modal-body">
                  <v-overlay
                    :model-value="editorLoading"
                    class="align-center justify-center"
                    contained
                  >
                    <v-progress-circular indeterminate color="primary" size="44" />
                  </v-overlay>
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

                  <div class="editor-section">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                        <v-icon size="18" class="mr-2">mdi-email-edit-outline</v-icon>
                        Email Content
                      </div>
                      <v-chip size="x-small" variant="tonal" color="info">
                        Use [First Name] for personalization
                      </v-chip>
                    </div>
                    <div ref="editorEl" class="editor"></div>
                  </div>
                </div>

                <v-divider />
                <div class="modal-footer">
                  <v-btn variant="text" @click="showEditor = false">
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="flat"
                    @click="saveContent"
                    :loading="saving"
                    :disabled="editorLoading"
                  >
                    <v-icon size="18" class="mr-1">mdi-content-save</v-icon>
                    Save Changes
                  </v-btn>
                </div>
              </v-card>
            </v-dialog>
          </div>
          <div v-else>
            <v-alert type="info" variant="tonal" class="mt-4">
              Section coming soon.
            </v-alert>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import CommonSideBar from '@/components/Common/sideBar.vue'
import UniquePatientComfortForm from '@/components/patients/journey/UniquePatientComfortForm.vue'
import SmileConcernSurveyForm from '@/components/patients/journey/SmileConcernSurveyForm.vue'
import AutomationCard from '@/components/Common/AutomationCard.vue'
import patientJourneyService from '@/services/patientJourneyService'
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'

const props = defineProps({
  patient: { type: Object, default: null },
})

const section = ref('comfort')
const isEditing = ref(false)
const comfortForm = ref(null)
const surveyForm = ref(null)
const patientId = computed(() => (props.patient?.id ? Number(props.patient.id) : null))

const onSave = () => {
  // Delegate save to current section
  if (section.value === 'comfort' && comfortForm.value?.save) {
    comfortForm.value.save().then(() => {
      isEditing.value = false
    })
  } else if (section.value === 'smile' && surveyForm.value?.save) {
    surveyForm.value.save().then(() => {
      isEditing.value = false
    })
  }
}

const onShare = () => {
  if (section.value === 'smile' && surveyForm.value?.share) {
    surveyForm.value.share()
  }
}

const onPrint = () => {
  if (section.value === 'smile' && surveyForm.value?.print) {
    surveyForm.value.print()
  }
}

const onDownload = () => {
  if (section.value === 'smile' && surveyForm.value?.download) {
    surveyForm.value.download()
  }
}

const items = [
  { key: 'comfort', label: 'Unique Patient Comfort' },
  { key: 'smile', label: 'Smile Concern Survey' },
  { key: 'automations', label: 'Automations' },
]

const automationGroups = ref([])
const automationGroupsLoading = ref(false)
const activeAutomation = ref(null)
const automationRows = ref([])
const automationLoading = ref(false)
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const saving = ref(false)
const editorLoading = ref(false)
const showEditor = ref(false)
const activeItem = ref(null)
const editorEl = ref(null)
let ej = null

const automationHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Automation Name', key: 'name', sortable: false },
  { title: 'Trigger', key: 'sending', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
  { title: 'Status', key: 'enabled', sortable: false, align: 'center' },
]

const activeFilters = computed(() => {
  let count = 0
  if (filterEnabled.value) count++
  if (filterDisabled.value) count++
  return count
})

const fetchAutomationGroups = async () => {
  const id = patientId.value
  if (!id) {
    automationGroups.value = []
    return
  }
  automationGroupsLoading.value = true
  try {
    const res = await patientJourneyService.listAutomationGroups(id)
    const data = res?.data || []
    automationGroups.value = data
  } catch (e) {
    console.error('automation groups error', e)
  } finally {
    automationGroupsLoading.value = false
  }
}

const fetchAutomationRows = async (groupKey) => {
  const id = patientId.value
  if (!groupKey || !id) return
  automationLoading.value = true
  try {
    const res = await patientJourneyService.listAutomationTemplates(groupKey, id)
    automationRows.value = res?.data || []
  } catch (e) {
    automationRows.value = []
  } finally {
    automationLoading.value = false
  }
}

const selectAutomation = async (card) => {
  activeAutomation.value = card
  await fetchAutomationRows(card?.key)
}

const toggleAutomationGroup = async (card) => {
  const enabled = !!card.enabled
  const id = patientId.value
  if (!id) {
    card.enabled = !enabled
    return
  }
  try {
    await patientJourneyService.toggleAutomationGroup({ groupKey: card.key, enabled, patientId: id })
    automationRows.value = automationRows.value.map((r) => ({ ...r, enabled }))
  } catch (e) {
    card.enabled = !enabled
  }
}

const clearAutomationSelection = () => {
  activeAutomation.value = null
  automationRows.value = []
  search.value = ''
  filterEnabled.value = false
  filterDisabled.value = false
}

const filteredAutomationRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  let rows = automationRows.value
  if (filterEnabled.value && !filterDisabled.value) rows = rows.filter((r) => r.enabled === true)
  if (filterDisabled.value && !filterEnabled.value) rows = rows.filter((r) => r.enabled === false)
  if (!term) return rows
  return rows.filter((r) =>
    [r.name, r.type, r.sending].some((v) => (v || '').toString().toLowerCase().includes(term))
  )
})

const clearFilters = () => {
  filterEnabled.value = false
  filterDisabled.value = false
}

const onToggleEnabled = async (row, val) => {
  row.enabled = !!val
  const id = patientId.value
  if (!id) {
    row.enabled = !val
    return
  }
  const payload = {
    ...row,
    groupKey: activeAutomation.value?.key,
    template: row.template || '',
    patientId: id,
  }
  try {
    await patientJourneyService.saveAutomationTemplate(payload)
  } catch (e) {
    row.enabled = !val
  }
}

const onNameUpdate = async (item) => {
  // optional auto-save hook
}

const destroyEditor = () => {
  if (ej && typeof ej.destroy === 'function') {
    ej.destroy()
    ej = null
  }
}

const initEditor = async (html = '') => {
  destroyEditor()
  if (!editorEl.value) return
  const [EditorJS, Header, List] = await Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
  ])
  const data = htmlToBlocks(html || '')
  try {
    ej = new EditorJS.default({
      holder: editorEl.value,
      data,
      tools: {
        header: { class: Header.default, inlineToolbar: true, config: { levels: [2, 3, 4], defaultLevel: 3 } },
        list: { class: List.default, inlineToolbar: true },
      },
    })
  } catch (e) {
    console.error('EditorJS init failed', e)
    ej = null
  }
}

const openEditor = async (row) => {
  activeItem.value = { ...row }
  showEditor.value = true
  editorLoading.value = true
  await nextTick()
  await initEditor(row.template || '')
  editorLoading.value = false
}

const saveContent = async () => {
  if (!activeAutomation.value || !activeItem.value || !ej || !patientId.value) return
  saving.value = true
  try {
    const data = await ej.save()
    const html = blocksToHtml({ blocks: data.blocks || [] })
    const payload = {
      ...activeItem.value,
      groupKey: activeAutomation.value?.key,
      template: html,
      patientId: patientId.value,
    }
    await patientJourneyService.saveAutomationTemplate(payload)
    automationRows.value = automationRows.value.map((r) => (r.key === activeItem.value.key ? { ...r, ...payload } : r))
    showEditor.value = false
  } catch (e) {
    console.error('save automation template error', e)
  } finally {
    saving.value = false
  }
}

watch(section, (val, prev) => {
  if (val === 'automations' && !automationGroups.value.length && patientId.value) {
    fetchAutomationGroups()
  }
})

watch(showEditor, (v) => {
  if (!v) destroyEditor()
  if (!v) editorLoading.value = false
})

watch(
  () => props.patient?.id,
  (id, prev) => {
    if (id === prev) return
    clearAutomationSelection()
    automationGroups.value = []
    if (section.value === 'automations' && id) {
      fetchAutomationGroups()
    }
  }
)

const sampleRecipient = {
  name: 'Ava Patel',
  email: 'ava.patel@example.com',
}
</script>

<style scoped>
.title {
  font-weight: 600;
  font-size: 18px;
}
.sidebar {
  min-width: 200px;
  position: sticky;
  top: 72px;
}
.journey-action-btn {
  width: 90px;
  height: 46px;
  border-radius: 8px;
  color: white;
}
.share-btn {
  background: #7D77FF !important;
}
.print-btn {
  background: #0061FB !important;
}
.download-btn {
  background: #1E2B80 !important;
}
.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  min-height: 50vh;
}
.field-label {
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 6px;
}
.with-border {
  border: 1px solid #e5e7eb;
}
.automation-data-table :deep(thead th) {
  background: #f8f9fa;
  font-weight: 600 !important;
  font-size: 12px !important;
}
.automation-data-table :deep(tbody td) {
  font-size: 14px;
}
.full-width-table :deep(.v-table__wrapper) {
  width: 100%;
}
.full-width-table :deep(table) {
  width: 100% !important;
  table-layout: auto;
}
.automation-data-table :deep(tbody tr:hover) {
  background: #fafafa !important;
}
.automation-data-table :deep(th:nth-child(1)) {
  width: 120px;
}
.automation-data-table :deep(th:nth-child(2)) {
  width: auto;
  min-width: 260px;
}
.automation-data-table :deep(th:nth-child(3)) {
  width: 260px;
}
.automation-data-table :deep(th:nth-child(4)) {
  width: 140px;
}
.automation-data-table :deep(th:nth-child(5)) {
  width: 120px;
}
.custom-search {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.filter-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.name-field :deep(.v-field__input) {
  padding: 4px 0 !important;
  min-height: 32px;
}
.name-field :deep(input) {
  font-weight: 500;
  font-size: 14px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
}
.modal-title {
  font-weight: 600;
  font-size: 18px;
  margin: 0;
}
.modal-body {
  position: relative;
  padding: 20px;
  max-height: 70vh;
  overflow: auto;
  background: #fafafa;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
}
.recipient-section {
  background: white;
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 16px;
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
.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
