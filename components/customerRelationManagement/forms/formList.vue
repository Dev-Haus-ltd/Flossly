<template>
  <div>
    <!-- Toolbar: Search + Filter + New Form -->
    <div
      class="d-flex align-center mb-4 mt-4 px-5"
      style="flex-wrap: nowrap; justify-content: space-between; overflow-x: auto"
    >
      <div class="d-inline-flex align-center" style="gap: 8px; flex-wrap: nowrap">
        <!-- Search -->
        <div style="width: 160px">
          <v-text-field
            v-model="searchInput"
            placeholder="Search forms"
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
              <v-icon size="14" color="grey">mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </div>

        <!-- Filter menu -->
        <v-menu
          v-model="filterMenu"
          :close-on-content-click="false"
          transition="fade-transition"
          offset-y
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="flat"
              density="compact"
              class="tbl-top-btn"
              style="width: 100px"
            >
              <span>Filter</span>
              <v-icon class="ml-1" size="14">mdi-filter-outline</v-icon>
              <v-badge v-if="activeFilter !== null" dot color="primary" floating />
            </v-btn>
          </template>

          <v-card style="min-width: 240px; border-radius: 12px; padding: 16px">
            <div class="d-flex align-center justify-space-between mb-2">
              <span style="font-weight: 500; font-size: 14px">Filter by</span>
              <v-btn
                variant="text"
                density="comfortable"
                color="primary"
                style="text-transform: none; font-size: 13px"
                @click="clearFilter"
              >
                Clear filter
              </v-btn>
            </div>
            <v-divider class="mb-3" />
            <v-label class="mb-1" style="font-size: 14px">Status</v-label>
            <v-select
              v-model="activeFilter"
              :items="statusFilterOptions"
              item-title="label"
              item-value="value"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="input-bordered"
              clearable
            />
          </v-card>
        </v-menu>
      </div>

      <!-- New Form button -->
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        class="add-task-btn"
        @click="openBuilder(null)"
      >
        <template #prepend><v-icon size="18">mdi-plus-circle-outline</v-icon></template>
        New Form
      </v-btn>
    </div>

    <!-- Table -->
    <div class="px-5">
      <v-card elevation="0" rounded="lg" border>
        <v-data-table-server
          :headers="selectedHeaders"
          :items="forms"
          :items-length="total"
          :loading="loading"
          :page="page"
          :items-per-page="itemsPerPage"
          :items-per-page-options="[10, 25, 50]"
          :cell-props="getCellProps"
          density="compact"
          class="resizable-table"
          hover
          @update:page="onPageChange"
          @update:items-per-page="onItemsPerPageChange"
        >
          <template #headers="{ columns, getSortIcon, toggleSort }">
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
                  :style="headerStyle(column)"
                  @mouseover="showHandles(column.key, i)"
                  @mouseleave="hideHandles(column.key, i)"
                >
                  <div class="d-flex align-center th-content">
                    <p style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {{ column.title }}
                    </p>
                    <div class="d-flex justify-end">
                      <v-icon
                        v-if="column.sortable"
                        size="12"
                        class="ml-2"
                        @click.stop="toggleSort(column)"
                      >
                        {{ getSortIcon(column) }}
                      </v-icon>
                    </div>
                    <span
                      class="resize-handle"
                      :id="`resize-handle-${column.key}-${i}`"
                      @pointerdown="startResize($event, column, i)"
                    />
                  </div>
                </th>
              </template>
            </draggable>
          </template>

          <!-- Name -->
          <template #item.name="{ item }">
            <div class="pa-1 d-flex align-center">
              <span
                class="font-weight-medium"
                style="font-size: 14px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                @click="openBuilder(item)"
              >
                {{ item.name }}
              </span>
            </div>
          </template>

          <!-- Status -->
          <template #item.active="{ item }">
            <DataTableColumnsFormStatus
              :selected="item"
              @toggle="(val) => toggleActive(item, val)"
            />
          </template>

          <!-- Field count -->
          <template #item.fields="{ item }">
            <div class="pa-1">
              <span style="font-size: 13px; color: #6b7280">
                {{ (item.fields || []).length }} field{{ (item.fields || []).length !== 1 ? 's' : '' }}
              </span>
            </div>
          </template>

          <!-- Created date -->
          <template #item.createdAt="{ item }">
            <div class="pa-1">
              <span style="font-size: 13px; color: #6b7280">{{ formatDate(item.createdAt) }}</span>
            </div>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex align-center justify-end" style="gap: 2px">
              <v-btn icon size="small" variant="text" @click.stop="openShare(item)">
                <v-icon size="18">mdi-share-variant</v-icon>
                <v-tooltip activator="parent" location="top">Share / Embed</v-tooltip>
              </v-btn>
              <v-btn icon size="small" variant="text" @click.stop="openBuilder(item)">
                <v-icon size="18">mdi-pencil-outline</v-icon>
                <v-tooltip activator="parent" location="top">Edit</v-tooltip>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="confirmDelete(item)"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">Delete</v-tooltip>
              </v-btn>
            </div>
          </template>

          <!-- Empty state -->
          <template #no-data>
            <div class="text-center py-10">
              <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-form-select</v-icon>
              <p class="text-subtitle-2 mb-1">
                {{ searchInput || activeFilter !== null ? 'No forms match your search' : 'No forms yet' }}
              </p>
              <p class="text-caption text-medium-emphasis mb-4">
                {{
                  searchInput || activeFilter !== null
                    ? 'Try adjusting your search or filter'
                    : 'Create your first lead capture form and embed it on your website.'
                }}
              </p>
              <v-btn
                v-if="!searchInput && activeFilter === null"
                color="primary"
                variant="flat"
                rounded="lg"
                @click="openBuilder(null)"
              >
                Create your first form
              </v-btn>
            </div>
          </template>
        </v-data-table-server>
      </v-card>
    </div>

    <!-- Builder dialog -->
    <CustomerRelationManagementFormsFormBuilderDialog
      v-if="builderOpen"
      v-model="builderOpen"
      :form="selectedForm"
      @saved="onFormSaved"
    />

    <!-- Share panel dialog -->
    <v-dialog v-model="shareOpen" max-width="560">
      <CustomerRelationManagementFormsFormSharePanel
        v-if="shareForm"
        :form="shareForm"
        @close="shareOpen = false"
        @regenerated="onFormSaved"
      />
    </v-dialog>

    <!-- Delete confirm -->
    <CommonConfirmDialog
      v-model="deleteDialog"
      title="Delete form?"
      :message="`'${deleteTarget?.name}' will be permanently deleted. Any embedded links on your website will stop working.`"
      confirm-text="Delete"
      confirm-color="error"
      icon="mdi-delete-outline"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteDialog = false"
    />
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const crmStore = useCrmStore()
const mainStore = useMainStore()

// Table state
const forms = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)

// Search + filter
const searchInput = ref('')
const activeFilter = ref(null)
const filterMenu = ref(false)
let searchDebounce = null

const statusFilterOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const defaultHeaders = [
  { title: 'Form Name', key: 'name', sortable: false, width: 280 },
  { title: 'Status', key: 'active', sortable: false, width: 120 },
  { title: 'Fields', key: 'fields', sortable: false, width: 120 },
  { title: 'Created', key: 'createdAt', sortable: false, width: 140 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 130 },
]

const selectedHeaders = ref(defaultHeaders.map((h) => ({ ...h })))
const isResizing = ref(false)
let startX = 0
let startWidth = 0
let currentCol = null

// Builder / share / delete state
const builderOpen = ref(false)
const selectedForm = ref(null)
const shareOpen = ref(false)
const shareForm = ref(null)
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const headerStyle = (column) => ({
  width: `${column.width || 140}px`,
  minWidth: `${column.width || 140}px`,
  padding: '0px 7px',
  backgroundColor: '#F6F6F6',
  fontSize: '14px',
  position: column.key === 'name' ? 'sticky' : 'relative',
  left: column.key === 'name' ? '0px' : undefined,
  zIndex: column.key === 'name' ? 3 : 1,
})

const getCellProps = ({ column }) => {
  if (column.key === 'name') {
    return {
      style: {
        position: 'sticky',
        left: '0px',
        background: 'white',
        zIndex: 1,
      },
    }
  }

  if (column.key === 'active') return { style: { padding: 0 } }
  return {}
}

const updateHeaderOrder = (newOrder) => {
  selectedHeaders.value = newOrder.map((header) => ({ ...header }))
}

const showHandles = (key, index) => {
  const handle = document.getElementById(`resize-handle-${key}-${index}`)
  if (handle) handle.style.display = 'block'
}

const hideHandles = (key, index) => {
  const handle = document.getElementById(`resize-handle-${key}-${index}`)
  if (handle) handle.style.display = 'none'
}

function startResize(e, col, index) {
  e.stopPropagation()
  e.preventDefault()

  isResizing.value = true
  currentCol = col
  startX = e.clientX
  startWidth = col.width || 140

  const handleEl = document.getElementById(`resize-handle-${col.key}-${index}`) || e.target

  try {
    if (handleEl?.setPointerCapture) handleEl.setPointerCapture(e.pointerId)
  } catch (_) {
    // noop
  }

  handleEl.addEventListener('pointermove', resizeColumn)
  handleEl.addEventListener('pointerup', stopResize)
}

function resizeColumn(e) {
  if (!isResizing.value || !currentCol) return
  const diff = e.clientX - startX
  currentCol.width = Math.max(120, startWidth + diff)
}

function stopResize(e) {
  isResizing.value = false

  const handleEl = e.currentTarget || e.target
  if (handleEl?.removeEventListener) {
    handleEl.removeEventListener('pointermove', resizeColumn)
    handleEl.removeEventListener('pointerup', stopResize)
  }

  try {
    if (e.pointerId && handleEl?.releasePointerCapture) {
      handleEl.releasePointerCapture(e.pointerId)
    }
  } catch (_) {
    // noop
  }

  currentCol = null
}

const toggleActive = async (form, newVal) => {
  try {
    const res = await crmStore.updateForm({ id: form.id, active: newVal })
    if (res?.code === 0) {
      form.active = newVal
      mainStore.setSnackbar({
        title: newVal ? 'Form activated' : 'Form deactivated',
        type: 'success',
      })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to update status', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to update status', type: 'error' })
  }
}

const formatDate = (d) => {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const loadForms = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: itemsPerPage.value,
    }
    if (searchInput.value) params.search = searchInput.value
    if (activeFilter.value !== null) params.active = activeFilter.value

    const res = await crmStore.listForms(params)
    if (res?.code === 0) {
      forms.value = res.data?.forms || []
      total.value = res.data?.total || 0
    }
  } catch (_) {
    mainStore.setSnackbar({ title: 'Failed to load forms', type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(searchInput, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    loadForms()
  }, 400)
})

watch(activeFilter, () => {
  page.value = 1
  loadForms()
})

const onPageChange = (val) => {
  page.value = val
  loadForms()
}

const onItemsPerPageChange = (val) => {
  itemsPerPage.value = val
  page.value = 1
  loadForms()
}

const onClearSearch = () => {
  searchInput.value = ''
  page.value = 1
  loadForms()
}

const clearFilter = () => {
  activeFilter.value = null
  filterMenu.value = false
}

const openBuilder = (form) => {
  selectedForm.value = form || null
  builderOpen.value = true
}

const openShare = (form) => {
  shareForm.value = form
  shareOpen.value = true
}

const onFormSaved = () => {
  page.value = 1
  loadForms()
}

const confirmDelete = (form) => {
  deleteTarget.value = form
  deleteDialog.value = true
}

const doDelete = async () => {
  deleting.value = true
  let deleted = false
  try {
    const res = await crmStore.deleteForm({ id: deleteTarget.value.id })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Form deleted', type: 'success' })
      deleteDialog.value = false
      deleteTarget.value = null
      deleted = true
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to delete form', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to delete form', type: 'error' })
  } finally {
    // Always clear loading BEFORE reloading so the spinner never gets stuck
    deleting.value = false
  }
  if (deleted) await loadForms()
}

onMounted(loadForms)
onBeforeUnmount(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<style scoped>
.v-data-table tbody tr {
  height: 30px !important;
}

th {
  position: relative;
  user-select: none;
}

.v-data-table td {
  height: 30px !important;
  vertical-align: middle !important;
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

.custom-search :deep(.v-field) {
  border-radius: 8px !important;
  min-height: 36px !important;
  font-size: 13px;
}

.tbl-top-btn {
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
  background-color: #f3f4f6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
}

.add-task-btn {
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
  text-transform: none;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

.resizable-table :deep(.v-table__wrapper table) {
  width: 100%;
  table-layout: fixed;
}

.resizable-table .th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: grab;
}

.resizable-table .th-content:active {
  cursor: grabbing;
}


.resize-handle {
  width: 10px;
  cursor: col-resize;
  height: 70%;
  display: none;
  position: absolute;
  right: -12px;
  z-index: 99999;
  top: 0;
  user-select: none;
}
</style>
