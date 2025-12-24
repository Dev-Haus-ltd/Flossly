<template>
  <div>
    <template v-if="!activeAutomation">
      <v-row dense>
        <v-col
          v-for="card in automationCards"
          :key="card.key"
          cols="12"
          sm="6"
          md="3"
        >
          <AutomationCard
            :title="card.title"
            :description="card.description"
            :count="card.itemCount"
            :enabled="card.enabled"
            :selected="activeAutomation?.key === card.key"
            @select="selectAutomation(card)"
            @toggle="(val) => toggleAutomationGroup(card, val)"
          />
        </v-col>
      </v-row>
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
      </div>
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
              <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
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
            <div class="d-flex align-center">
              <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-body-2 text-medium-emphasis">{{ item.sending }}</span>
            </div>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <v-btn
              variant="outlined"
              size="small"
              color="primary"
              @click="openPreview(item)"
            >
              <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
              Edit
            </v-btn>
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

    <!-- Preview / Edit Modal -->
    <v-dialog v-model="show" max-width="1100px" scrollable>
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">{{ active?.name }}</h5>
            <div class="d-flex align-center gap-2 mt-2">
              <v-chip size="x-small" variant="tonal" color="primary">
                <v-icon size="12" class="mr-1">mdi-email-outline</v-icon>
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
import AutomationCard from '@/components/patients/automationCard.vue'
import { crmAutomationDefaults, crmAutomationGroups } from '@/lib/crmAutomationDefaults'

const props = defineProps({
  leadId: { type: [Number, String], default: null },
})
const crmStore = useCrmStore()
const emit = defineEmits(['update:rows','save'])

// Table state
const rows = reactive([])
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const saving = ref(false)
const activeAutomation = ref(null)

const tableHeaders = [
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

const filteredRows = computed(() => {
  if (!activeAutomation.value) return []
  const keys = new Set(activeAutomation.value.templateKeys || [])
  let result = rows.filter(r => keys.has(r.key))
  if (filterEnabled.value && !filterDisabled.value) result = result.filter(r => r.enabled === true)
  if (filterDisabled.value && !filterEnabled.value) result = result.filter(r => r.enabled === false)
  return result
})

const clearFilters = () => {
  filterEnabled.value = false
  filterDisabled.value = false
}

const automationCards = computed(() => {
  return crmAutomationGroups.map((group) => {
    const groupRows = rows.filter(r => group.templateKeys.includes(r.key))
    return {
      ...group,
      itemCount: groupRows.length,
      enabled: groupRows.some(r => r.enabled),
    }
  })
})

const selectAutomation = (card) => {
  activeAutomation.value = card
  search.value = ''
  clearFilters()
}

const clearAutomationSelection = () => {
  activeAutomation.value = null
  search.value = ''
  clearFilters()
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
    sending: row.sending,
    enabled: !!row.enabled,
    template: row.template,
  }
  if (resolvedLeadId.value) payload.leadId = resolvedLeadId.value
  return payload
}

const toggleAutomationGroup = async (card, val) => {
  const groupRows = rows.filter(r => (card.templateKeys || []).includes(r.key))
  for (const row of groupRows) {
    row.enabled = !!val
    try {
      await crmStore.saveAutomation(buildPayload(row))
    } catch (e) {}
  }
}

const loadRows = async () => {
  try {
    const res = await crmStore.listAutomation(resolvedLeadId.value || undefined)
    const items = (res?.data && res.data.length)
      ? res.data
      : crmAutomationDefaults.map((item) => ({ ...item }))
    rows.splice(0, rows.length, ...items)
  } catch {}
}

onMounted(loadRows)

watch(resolvedLeadId, () => {
  clearAutomationSelection()
  loadRows()
})

// Preview dialog state
const show = ref(false)
const active = ref(null)
let ej = null
let EditorCtor = null
let Header = null
let List = null
const editorEl = ref(null)

const sampleRecipient = reactive({ name: 'John Doe', email: 'john@example.com' })

const openPreview = async (row) => {
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
  if (ej) { ej.destroy(); ej = null }
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
    sending: row.sending || def.sending || '',
    enabled: row.enabled,
    template: (row.template && row.template.trim()) ? row.template : (def.template || ''),
  })
  try { await crmStore.saveAutomation(payload) } catch (e) {}
}

const onNameUpdate = async (item) => {
  // Optional: auto-save name changes
}

watch(show, (v) => { if (!v && ej) { ej.destroy(); ej = null } })
</script>

<style scoped>
.gap-2 {
  gap: 8px;
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
</style>

