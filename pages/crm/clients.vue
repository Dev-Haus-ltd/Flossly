<template>
  <v-sheet color="background">
    <!-- Breadcrumb header -->
    <div class="clients-header d-flex align-center px-4">
      <p class="text-caption text-medium-emphasis mr-1">CRM</p>
      <p class="text-caption text-medium-emphasis mr-1">/</p>
      <p class="text-caption font-weight-medium">Clients</p>
    </div>

    <div class="mt-5 px-5">
      <!-- Stat cards -->
      <v-row class="stat-row" align="stretch">
        <v-col style="max-width: 260px;">
          <CommonStatCard
            icon="https://cdn.lordicon.com/qlpudrww.json"
            label="Total Clients"
            :value="total"
            uid="clients-total"
            hide-chip
          />
        </v-col>
      </v-row>
    </div>

    <div class="mt-4 px-5">
      <!-- Toolbar -->
      <div class="d-flex align-center" style="justify-content: space-between; overflow-x: auto;">
        <!-- Left: Search + Filter + Manage Columns -->
        <div class="d-inline-flex align-center" style="flex-wrap: nowrap; gap: 8px; height: 46px;">
          <div style="width: 120px">
            <v-text-field
              v-model="searchInput"
              placeholder="Search"
              clearable
              @click:clear="onClearSearch"
              variant="solo"
              :elevation="0"
              density="compact"
              hide-details
              bg-color="#F3F4F6"
              flat
              class="custom-search"
            >
              <template #append-inner>
                <v-icon size="14" color="#737373">mdi-magnify</v-icon>
              </template>
            </v-text-field>
          </div>

          <CustomerRelationManagementFilterMenu
            :leadSources="leadSources"
            :treatmentSources="treatmentSources"
            :alertOptions="[]"
            @update:filters="onFiltersUpdate"
          />

          <!-- Manage Columns (mirrors index.vue pattern, delegates to listViewRef) -->
          <v-menu :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="flat"
                density="compact"
                class="tbl-top-btn"
                style="width: 180px"
              >
                <span>Manage Columns</span>
                <v-icon class="ml-2" size="18">mdi-table-column</v-icon>
              </v-btn>
            </template>
            <v-card class="pa-2" max-width="520" v-if="listViewRef">
              <p class="mb-2 text-subtitle-2">Selected Columns</p>
              <div class="d-flex flex-wrap">
                <div
                  v-for="(col, idx) in listViewRef.selectedHeaders"
                  :key="idx"
                  class="col-box ma-1 pa-2 d-flex align-center justify-space-between"
                  :style="{ backgroundColor: listViewRef.getColColor(col.title) }"
                >
                  <span>{{ col.title }}</span>
                  <v-icon
                    v-if="col.key !== 'name'"
                    color="white"
                    size="16"
                    class="ml-1"
                    style="cursor:pointer"
                    @click="listViewRef.removeHeaderFromSelected(col)"
                  >mdi-close-circle</v-icon>
                </div>
              </div>
              <div class="d-flex align-center justify-space-between mt-3 mb-2">
                <p class="text-subtitle-2 mb-0">Available Columns</p>
                <v-btn color="primary" variant="text" size="small" @click="openCreateColumnDialog">
                  <v-icon size="16" class="mr-1">mdi-plus</v-icon>
                  Add Custom Column
                </v-btn>
              </div>
              <div class="d-flex flex-wrap">
                <div
                  v-for="(col, idx) in listViewRef.filteredAvailableHeaders"
                  :key="idx"
                  class="col-box ma-1 pa-2 d-flex align-center justify-space-between"
                  :style="{ backgroundColor: listViewRef.getColColor(col.title) }"
                  @click="listViewRef.addHeaderInSelected(col)"
                >
                  <span>{{ col.title }}</span>
                  <v-icon
                    v-if="col.isCustom"
                    color="white"
                    size="14"
                    class="ml-1"
                    style="cursor:pointer"
                    @click.stop="openDeleteColumnConfirm(col)"
                  >mdi-close</v-icon>
                </div>
              </div>
            </v-card>
          </v-menu>
        </div>

        <!-- Right: Add New Lead -->
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          class="add-task-btn"
          @click="addLeadDrawer = true"
        >
          <template #prepend>
            <v-icon size="18">mdi-plus-circle-outline</v-icon>
          </template>
          Add New Lead
        </v-btn>
      </div>

      <!-- List view (clients mode — shows only Converted panel, flat) -->
      <CustomerRelationManagementListView
        v-if="hasFetched"
        ref="listViewRef"
        :converted-leads="clients"
        :converted-total="total"
        :converted-page="page"
        :items-per-page="itemsPerPage"
        :loading="isLoading"
        :headers="allHeaders"
        :clients-mode="true"
        :custom-column-definitions="columnDefinitions"
        :leadSources="leadSources"
        :treatmentSources="treatmentSources"
        :users="userList"
        :alert-options="[]"
        :whatsapp-connected="false"
        @update:convertedPage="onPageChange"
        @update:itemsPerPage="onItemsPerPageChange"
        @request-delete-column="openDeleteColumnConfirm"
      />

      <div v-else-if="isLoading" class="d-flex justify-center mt-10">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else class="d-flex justify-center mt-10">
        <p class="text-medium-emphasis">No clients found.</p>
      </div>
    </div>

    <!-- Add New Lead drawer -->
    <CustomerRelationManagementAddNewLead
      v-model="addLeadDrawer"
      :lead-sources="leadSources"
      :treatment-sources="treatmentSources"
      @close="addLeadDrawer = false"
      @success="fetchClients(activeFilters)"
    />

    <!-- Add Custom Column dialog -->
    <v-dialog v-model="createColumnDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Add Custom Column</span>
          <v-icon @click="createColumnDialog = false">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newColumn.displayName"
            label="Column Name"
            placeholder="Enter column name"
            variant="outlined"
            density="compact"
            :error-messages="columnNameError"
            @input="columnNameError = ''"
            class="mb-3"
          />
          <v-select
            v-model="newColumn.dataType"
            label="Data Type"
            :items="DATA_TYPE_OPTIONS"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-textarea
            v-if="newColumn.dataType === 'dropdown'"
            v-model="newColumn.dropdownOptionsText"
            label="Dropdown Options"
            placeholder="Enter options separated by commas"
            variant="outlined"
            density="compact"
            rows="3"
            :error-messages="dropdownOptionsError"
            @input="dropdownOptionsError = ''"
            hint="Comma-separated values"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="createColumnDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="isCreatingColumn" @click="createCustomColumn">
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Column confirm -->
    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete custom column?"
      message="Are you sure you want to delete this column? All data in it will be removed."
      confirm-text="Delete"
      @confirm="confirmDeleteColumn"
      @cancel="cancelDeleteColumn"
    />
  </v-sheet>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/stores/index'
import { useCrmStore } from '@/stores/crm'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'

definePageMeta({ layout: 'home' })

const mainStore = useMainStore()
const crmStore = useCrmStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const { users: storeUsers } = storeToRefs(userStore)
const userList = computed(() => storeUsers.value || [])

// ── Data ──────────────────────────────────────────────────────────────────────
const listViewRef = ref(null)
const clients = ref([])
const total = ref(0)
const page = ref(1)
const itemsPerPage = ref(25)
const isLoading = ref(true)
const hasFetched = ref(false)
const searchInput = ref('')
const search = ref('')
const activeFilters = ref({})
const addLeadDrawer = ref(false)
let searchTimeout = null

const leadSources = ref([])
const treatmentSources = ref([])

// ── Headers ───────────────────────────────────────────────────────────────────
const BASE_HEADERS = [
  { key: 'name',         title: 'Name',          width: 200, sortable: false },
  { key: 'email',        title: 'Email',          width: 220, sortable: false },
  { key: 'telephone',    title: 'Telephone',      width: 150, sortable: false },
  { key: 'inquiryDate',  title: 'Inquiry Date',   width: 160, sortable: false },
  { key: 'leadSource',   title: 'Lead Source',    width: 160, sortable: false },
  { key: 'leadStatus',   title: 'Lead Status',    width: 160, sortable: false },
  { key: 'treatment',    title: 'Treatment',      width: 160, sortable: false },
  { key: 'assigned',     title: 'Assigned',       width: 180, sortable: false },
  { key: 'followUpDate', title: 'Follow-up Date', width: 160, sortable: false },
  { key: 'comments',     title: 'Comments',       width: 200, sortable: false },
]

const columnDefinitions = ref([])

const customHeaders = computed(() =>
  columnDefinitions.value.map(col => ({
    key: `custom_${col.id}`,
    title: col.displayName,
    width: 160,
    sortable: false,
    isCustom: true,
    columnDefinitionId: col.id,
    dataType: col.dataType,
    dropdownOptions: col.dropdownOptions || [],
  }))
)

const allHeaders = computed(() => [...BASE_HEADERS, ...customHeaders.value])

// ── Fetch ─────────────────────────────────────────────────────────────────────
const fetchClients = async (filters = {}) => {
  isLoading.value = true
  try {
    const res = await crmStore.listLeads({
      ...filters,
      leadStatus: 'Converted',
      search: search.value || '',
      page: page.value,
      pageSize: itemsPerPage.value,
      sortBy: 'inquiryDate',
      sortDir: 'DESC',
    })
    if (res?.code === 0) {
      const rows = Array.isArray(res.data?.rows) ? res.data.rows : (res.data || [])
      clients.value = rows.map(r => ({ ...r, customFields: r.customFields || [] }))
      total.value = Number(res.data?.total ?? clients.value.length)
    }
  } finally {
    isLoading.value = false
    hasFetched.value = true
  }
}

const loadOptions = async () => {
  try {
    const [src, tr] = await Promise.all([
      crmStore.listOptions('lead_source'),
      crmStore.listOptions('treatment'),
    ])
    if (src?.code === 0) leadSources.value = src.data || []
    if (tr?.code === 0) treatmentSources.value = tr.data || []
  } catch {}
}

const loadCustomColumns = async () => {
  try {
    const res = await crmStore.listCrmCustomColumns()
    if (res?.code === 0) columnDefinitions.value = res.data || []
  } catch {}
}

// ── Pagination / Search / Filter ──────────────────────────────────────────────
const onPageChange = (val) => { if (page.value !== val) { page.value = val; fetchClients(activeFilters.value) } }
const onItemsPerPageChange = (val) => { if (itemsPerPage.value !== val) { itemsPerPage.value = val; page.value = 1; fetchClients(activeFilters.value) } }
const onFiltersUpdate = (filters) => { activeFilters.value = filters || {}; page.value = 1; fetchClients(activeFilters.value) }
const onClearSearch = () => { searchInput.value = '' }

watch(searchInput, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search.value = String(val || '').trim()
    page.value = 1
    fetchClients(activeFilters.value)
  }, 250)
})

// ── Custom Column CRUD ────────────────────────────────────────────────────────
const createColumnDialog = ref(false)
const isCreatingColumn = ref(false)
const columnNameError = ref('')
const dropdownOptionsError = ref('')
const newColumn = ref({ displayName: '', dataType: 'text', dropdownOptionsText: '' })
const showDeleteConfirm = ref(false)
const columnToDelete = ref(null)

const DATA_TYPE_OPTIONS = [
  { label: 'Text',     value: 'text' },
  { label: 'Number',   value: 'number' },
  { label: 'Date',     value: 'date' },
  { label: 'Boolean',  value: 'boolean' },
  { label: 'Dropdown', value: 'dropdown' },
]

const openCreateColumnDialog = () => {
  newColumn.value = { displayName: '', dataType: 'text', dropdownOptionsText: '' }
  columnNameError.value = ''
  dropdownOptionsError.value = ''
  createColumnDialog.value = true
}

const createCustomColumn = async () => {
  if (!newColumn.value.displayName?.trim()) { columnNameError.value = 'Column name is required'; return }
  if (newColumn.value.dataType === 'dropdown' && !newColumn.value.dropdownOptionsText?.trim()) { dropdownOptionsError.value = 'Dropdown options are required'; return }
  isCreatingColumn.value = true
  try {
    const dropdownOptions = newColumn.value.dataType === 'dropdown'
      ? newColumn.value.dropdownOptionsText.split(',').map(s => s.trim()).filter(Boolean)
      : null
    const res = await crmStore.createCrmCustomColumn({
      displayName: newColumn.value.displayName.trim(),
      dataType: newColumn.value.dataType,
      dropdownOptions,
    })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Custom column created', type: 'success' })
      createColumnDialog.value = false
      await loadCustomColumns()
      // Auto-add to selected headers
      await nextTick()
      const newHeader = customHeaders.value.find(h => h.columnDefinitionId === res.data?.id)
      if (newHeader) listViewRef.value?.addHeaderInSelected(newHeader)
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to create column', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to create column', type: 'error' })
  } finally {
    isCreatingColumn.value = false
  }
}

const openDeleteColumnConfirm = (col) => { columnToDelete.value = col; showDeleteConfirm.value = true }

const confirmDeleteColumn = async () => {
  if (!columnToDelete.value) return
  try {
    const res = await crmStore.deleteCrmCustomColumn({ columnId: columnToDelete.value.columnDefinitionId })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Custom column deleted', type: 'success' })
      listViewRef.value?.removeHeaderFromSelected(columnToDelete.value)
      await loadCustomColumns()
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to delete column', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to delete column', type: 'error' })
  } finally {
    showDeleteConfirm.value = false
    columnToDelete.value = null
  }
}

const cancelDeleteColumn = () => { showDeleteConfirm.value = false; columnToDelete.value = null }

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadOptions(), loadCustomColumns()])
  await fetchClients()
})
</script>

<style scoped lang="scss">
.clients-header {
  border-bottom: 1px solid #dbdbdb;
  height: 48px;
  p { font-size: 12px; }
}

.custom-search,
.tbl-top-btn,
.add-task-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  text-transform: none;
  box-shadow: none;
}

.tbl-top-btn {
  background-color: #F3F4F6 !important;
  color: #737373;
}

.col-box {
  min-width: calc(33.33% - 8px);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  min-height: 34px;
}
</style>
