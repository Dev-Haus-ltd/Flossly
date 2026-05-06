<template>
  <div>
    <CustomerRelationManagementFormsFormBuilderDialog
      v-if="builderOpen"
      :form="selectedForm"
      @go-back="closeBuilder"
      @saved="onFormSaved"
    />

    <template v-else>
      <div
        class="d-flex align-center mb-4 mt-4 px-5"
        style="flex-wrap: nowrap; justify-content: space-between; overflow-x: auto"
      >
        <div class="d-inline-flex align-center" style="gap: 8px; flex-wrap: nowrap">
          <div style="width: 180px">
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
                style="width: 110px"
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

      <div class="px-5">
        <v-expansion-panels v-model="openedPanels" flat multiple class="table-panels">
          <v-expansion-panel rounded="lg" class="border-sm pb-1">
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center">
                  <v-chip color="primary" label>
                    <v-icon class="mr-2">mdi-form-select</v-icon>
                    Active Forms
                  </v-chip>
                  <v-chip class="ml-2" color="primary" label>
                    {{ activeTotal }}
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-0">
              <v-card elevation="0" rounded="lg" border>
                <v-data-table-server
                  v-model="selectedForms"
                  :headers="activeHeaders"
                  :items="activeForms"
                  :items-length="activeTotal"
                  :loading="loadingActive"
                  item-value="id"
                  show-select
                  return-object
                  density="compact"
                  class="resizable-table"
                  hover
                  :page="activePage"
                  :items-per-page="itemsPerPage"
                  :items-per-page-options="[10, 25, 50]"
                  @update:page="onActivePageChange"
                  @update:items-per-page="onItemsPerPageChange"
                >
                  <template v-slot:[`header.data-table-select`]>
                    <div class="select-cell">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allActiveSelected"
                        :indeterminate.prop="someActiveSelected"
                        @change="toggleAllActive"
                      />
                    </div>
                  </template>

                  <template v-slot:[`item.data-table-select`]="{ internalItem, isSelected, toggleSelect }">
                    <div class="select-cell">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="isSelected(internalItem)"
                        @change="() => toggleSelect(internalItem)"
                      />
                    </div>
                  </template>

                  <template #item.name="{ item }">
                    <div class="d-flex align-center" style="gap: 8px; min-width: 0;">
                      <div
                        class="form-color-dot flex-shrink-0"
                        :style="{ background: item.color || '#0061FB' }"
                      />
                      <v-text-field
                        v-model="item.name"
                        :variant="isFocused(item.id, 'name') ? 'outlined' : 'plain'"
                        density="compact"
                        hide-details
                        class="form-name-input"
                        @focus="onNameFocus(item)"
                        @blur="onNameBlur(item)"
                        @keyup.enter="(e) => e.target.blur()"
                        @keyup.escape="onNameEscape(item)"
                        @click.stop
                      />
                    </div>
                  </template>

                  <template #item.active="{ item }">
                    <DataTableColumnsFormStatus
                      :selected="item"
                      @toggle="(val) => toggleActive(item, val)"
                    />
                  </template>

                  <template #item.createdAt="{ item }">
                    <div class="pa-1">
                      <span style="font-size: 13px; color: #6b7280">{{ formatDate(item.createdAt) }}</span>
                    </div>
                  </template>

                  <template #item.actions="{ item }">
                    <div class="d-flex align-center justify-end action-cell">
                      <v-btn icon size="small" variant="text" @click.stop="openPreview(item)">
                        <img :src="viewIcon" alt="View" class="row-action-icon" />
                        <v-tooltip activator="parent" location="top">View</v-tooltip>
                      </v-btn>
                      <v-btn icon size="small" variant="text" @click.stop="openShare(item)">
                        <v-icon size="18">mdi-share-variant</v-icon>
                        <v-tooltip activator="parent" location="top">Share / Embed</v-tooltip>
                      </v-btn>
                      <v-btn icon size="small" variant="text" @click.stop="openBuilder(item)">
                        <v-icon size="18">mdi-pencil-outline</v-icon>
                        <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                      </v-btn>
                      <v-btn icon size="small" variant="text" @click.stop="archiveOne(item)">
                        <img :src="archiveIcon" alt="Archive" class="row-action-icon" />
                        <v-tooltip activator="parent" location="top">Archive</v-tooltip>
                      </v-btn>
                    </div>
                  </template>

                  <template #no-data>
                    <div class="text-center py-10">
                      <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-form-select</v-icon>
                      <p class="text-subtitle-2 mb-1">
                        {{ searchInput || activeFilter !== null ? 'No forms match your search' : 'No active forms yet' }}
                      </p>
                    </div>
                  </template>
                </v-data-table-server>
              </v-card>

              <v-card
                v-if="selectedForms.length"
                class="action-bar py-4 d-flex justify-center align-center rounded-lg mt-3"
                style="padding: 0px 20px; gap: 24px;"
                :elevation="5"
                flat
              >
                <div class="selected-count d-flex align-center">
                  <span class="selected-text">{{ selectedForms.length }}</span>
                  <p class="ml-3 mt-1">Items Selected</p>
                </div>

                <div class="actions-container d-flex align-center" style="gap: 8px;">
                  <div class="action-item d-flex flex-column align-center" @click="confirmBulkArchive = true">
                    <img :src="archiveIcon" alt="Archive" class="action-icon" />
                    <span class="action-label">Archive</span>
                  </div>
                  <v-divider vertical class="mx-2" style="height: 40px;" />
                  <div class="action-item d-flex flex-column align-center" @click="selectedForms = []">
                    <v-icon size="20" color="#6d6d6d">mdi-close</v-icon>
                    <span class="action-label">Close</span>
                  </div>
                </div>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel rounded="lg" class="border-sm pb-1">
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center">
                  <v-chip color="#9E9E9E" label>
                    <v-icon class="mr-2">mdi-archive-outline</v-icon>
                    Archived Forms
                  </v-chip>
                  <v-chip class="ml-2" color="#9E9E9E" label>
                    {{ archivedTotal }}
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-0">
              <v-alert
                v-if="!loadingArchived && !archivedForms.length"
                type="info"
                variant="tonal"
                class="mb-2"
              >
                No archived forms yet.
              </v-alert>

              <v-card v-else elevation="0" rounded="lg" border>
                <v-data-table-server
                  v-model="selectedArchivedForms"
                  :headers="archivedHeaders"
                  :items="archivedForms"
                  :items-length="archivedTotal"
                  :loading="loadingArchived"
                  item-value="id"
                  show-select
                  return-object
                  density="compact"
                  class="resizable-table"
                  hover
                  :page="archivedPage"
                  :items-per-page="itemsPerPage"
                  :items-per-page-options="[10, 25, 50]"
                  @update:page="onArchivedPageChange"
                  @update:items-per-page="onItemsPerPageChange"
                >
                  <template v-slot:[`header.data-table-select`]>
                    <div class="select-cell">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="allArchivedSelected"
                        :indeterminate.prop="someArchivedSelected"
                        @change="toggleAllArchived"
                      />
                    </div>
                  </template>

                  <template v-slot:[`item.data-table-select`]="{ internalItem, isSelected, toggleSelect }">
                    <div class="select-cell">
                      <input
                        type="checkbox"
                        class="cust-checkbox ma-0"
                        :checked="isSelected(internalItem)"
                        @change="() => toggleSelect(internalItem)"
                      />
                    </div>
                  </template>

                  <template #item.name="{ item }">
                    <div class="d-flex align-center" style="gap: 8px;">
                      <div class="form-color-dot flex-shrink-0" :style="{ background: item.color || '#0061FB' }" />
                      <span class="font-weight-medium" style="font-size: 14px">{{ item.name }}</span>
                    </div>
                  </template>

                  <template #item.active>
                    <v-chip size="x-small" color="grey" variant="tonal">Archived</v-chip>
                  </template>

                  <template #item.createdAt="{ item }">
                    <div class="pa-1">
                      <span style="font-size: 13px; color: #6b7280">{{ formatDate(item.createdAt) }}</span>
                    </div>
                  </template>

                  <template #item.actions="{ item }">
                    <div class="d-flex align-center justify-end action-cell">
                      <v-btn icon size="small" variant="text" @click.stop="openPreview(item)">
                        <img :src="viewIcon" alt="View" class="row-action-icon" />
                        <v-tooltip activator="parent" location="top">View</v-tooltip>
                      </v-btn>
                      <v-btn icon size="small" variant="text" @click.stop="restoreOne(item)">
                        <v-icon size="18">mdi-restore</v-icon>
                        <v-tooltip activator="parent" location="top">Restore</v-tooltip>
                      </v-btn>
                      <v-btn icon size="small" variant="text" color="error" @click.stop="deleteOne(item)">
                        <img :src="deleteIcon" alt="Delete" class="row-action-icon" />
                        <v-tooltip activator="parent" location="top">Delete Permanently</v-tooltip>
                      </v-btn>
                    </div>
                  </template>
                </v-data-table-server>
              </v-card>

              <v-card
                v-if="selectedArchivedForms.length"
                class="action-bar py-4 d-flex justify-center align-center rounded-lg mt-3"
                style="padding: 0px 20px; gap: 24px;"
                :elevation="5"
                flat
              >
                <div class="selected-count d-flex align-center">
                  <span class="selected-text">{{ selectedArchivedForms.length }}</span>
                  <p class="ml-3 mt-1">Archived Selected</p>
                </div>

                <div class="actions-container d-flex align-center" style="gap: 8px;">
                  <div class="action-item d-flex flex-column align-center" @click="confirmBulkRestore = true">
                    <v-icon size="22" color="#6d6d6d">mdi-restore</v-icon>
                    <span class="action-label">Restore</span>
                  </div>
                  <div class="action-item d-flex flex-column align-center" @click="confirmBulkDelete = true">
                    <img :src="deleteIcon" alt="Delete" class="action-icon" />
                    <span class="action-label">Delete</span>
                  </div>
                  <v-divider vertical class="mx-2" style="height: 40px;" />
                  <div class="action-item d-flex flex-column align-center" @click="selectedArchivedForms = []">
                    <v-icon size="20" color="#6d6d6d">mdi-close</v-icon>
                    <span class="action-label">Close</span>
                  </div>
                </div>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <v-dialog v-model="shareOpen" max-width="560">
        <CustomerRelationManagementFormsFormSharePanel
          v-if="shareForm"
          :form="shareForm"
          @close="shareOpen = false"
          @regenerated="onFormSaved"
        />
      </v-dialog>

      <v-dialog v-model="previewOpen" max-width="560">
        <CustomerRelationManagementFormsFormPreviewPanel
          v-if="previewForm"
          :form-name="previewForm?.name || ''"
          :fields="previewForm?.fields || []"
          :color="previewForm?.color || '#0061FB'"
        />
      </v-dialog>

      <CommonConfirmDialog
        v-model="confirmBulkArchive"
        title="Archive forms?"
        :message="`Archive ${selectedForms.length} form(s)? They will move to the Archived table.`"
        :loading="archiving"
        @confirm="doArchive"
        @cancel="confirmBulkArchive = false"
      />

      <CommonConfirmDialog
        v-model="confirmBulkRestore"
        title="Restore forms?"
        :message="`Restore ${selectedArchivedForms.length} form(s) back to the active list?`"
        :loading="restoring"
        @confirm="doRestore"
        @cancel="confirmBulkRestore = false"
      />

      <CommonConfirmDialog
        v-model="confirmBulkDelete"
        title="Delete archived forms?"
        :message="`Delete ${selectedArchivedForms.length} archived form(s) permanently? This cannot be undone.`"
        confirm-text="Delete"
        confirm-color="error"
        icon="mdi-delete-outline"
        :loading="deleting"
        @confirm="doDelete"
        @cancel="confirmBulkDelete = false"
      />
    </template>
  </div>
</template>

<script setup>
import archiveIcon from '@/assets/crm/archive.svg'
import deleteIcon from '@/assets/crm/delete.svg'
import viewIcon from '@/assets/icons/view.svg'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const emit = defineEmits(['builder-open', 'builder-close'])

const crmStore = useCrmStore()
const mainStore = useMainStore()

const openedPanels = ref([0])

const activeForms = ref([])
const archivedForms = ref([])
const activeTotal = ref(0)
const archivedTotal = ref(0)
const loadingActive = ref(false)
const loadingArchived = ref(false)

const activePage = ref(1)
const archivedPage = ref(1)
const itemsPerPage = ref(10)

const selectedForms = ref([])
const selectedArchivedForms = ref([])

const searchInput = ref('')
const activeFilter = ref(null)
const filterMenu = ref(false)
let searchDebounce = null

const statusFilterOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const activeHeaders = [
  { title: 'Form Name', key: 'name', sortable: false, width: 280 },
  { title: 'Status', key: 'active', sortable: false, width: 120 },
  { title: 'Created', key: 'createdAt', sortable: false, width: 140 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 170 },
]

const archivedHeaders = [
  { title: 'Form Name', key: 'name', sortable: false, width: 280 },
  { title: 'Status', key: 'active', sortable: false, width: 120 },
  { title: 'Created', key: 'createdAt', sortable: false, width: 140 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 150 },
]

const builderOpen = ref(false)
const selectedForm = ref(null)
const shareOpen = ref(false)
const shareForm = ref(null)
const previewOpen = ref(false)
const previewForm = ref(null)

const confirmBulkArchive = ref(false)
const confirmBulkRestore = ref(false)
const confirmBulkDelete = ref(false)
const archiving = ref(false)
const restoring = ref(false)
const deleting = ref(false)

// Inline name editing
const focusedCells = ref({})
const nameOriginals = {}

const isFocused = (id, key) => !!focusedCells.value[`${id}:${key}`]

const onNameFocus = (item) => {
  focusedCells.value[`${item.id}:name`] = true
  nameOriginals[item.id] = item.name
}

const onNameBlur = async (item) => {
  focusedCells.value[`${item.id}:name`] = false
  const trimmed = (item.name || '').trim()
  if (!trimmed || trimmed === nameOriginals[item.id]) {
    if (!trimmed) item.name = nameOriginals[item.id]
    return
  }
  try {
    const res = await crmStore.updateForm({ id: item.id, name: trimmed })
    if (res?.code === 0) {
      item.name = trimmed
    } else {
      item.name = nameOriginals[item.id]
      mainStore.setSnackbar({ title: res?.message || 'Failed to rename form', type: 'error' })
    }
  } catch (e) {
    item.name = nameOriginals[item.id]
    mainStore.setSnackbar({ title: e?.message || 'Failed to rename form', type: 'error' })
  }
}

const onNameEscape = (item) => {
  item.name = nameOriginals[item.id] ?? item.name
  focusedCells.value[`${item.id}:name`] = false
}

const formatDate = (d) => {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getCommonParams = () => {
  const params = { limit: itemsPerPage.value }
  if (searchInput.value) params.search = searchInput.value
  if (activeFilter.value !== null) params.active = activeFilter.value
  return params
}

const loadActiveForms = async () => {
  loadingActive.value = true
  try {
    const params = {
      ...getCommonParams(),
      page: activePage.value,
      archived: false,
    }
    const res = await crmStore.listForms(params)
    if (res?.code === 0) {
      activeForms.value = res.data?.forms || []
      activeTotal.value = res.data?.total || 0
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to load active forms', type: 'error' })
  } finally {
    loadingActive.value = false
  }
}

const loadArchivedForms = async () => {
  loadingArchived.value = true
  try {
    const params = {
      ...getCommonParams(),
      page: archivedPage.value,
      archived: true,
    }
    const res = await crmStore.listForms(params)
    if (res?.code === 0) {
      archivedForms.value = res.data?.forms || []
      archivedTotal.value = res.data?.total || 0
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to load archived forms', type: 'error' })
  } finally {
    loadingArchived.value = false
  }
}

const loadForms = async () => {
  await Promise.all([loadActiveForms(), loadArchivedForms()])
}

watch(searchInput, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    activePage.value = 1
    archivedPage.value = 1
    loadForms()
  }, 400)
})

watch(activeFilter, () => {
  activePage.value = 1
  archivedPage.value = 1
  loadForms()
})

const onActivePageChange = (val) => {
  activePage.value = val
  loadActiveForms()
}

const onArchivedPageChange = (val) => {
  archivedPage.value = val
  loadArchivedForms()
}

const onItemsPerPageChange = (val) => {
  itemsPerPage.value = val
  activePage.value = 1
  archivedPage.value = 1
  loadForms()
}

const onClearSearch = () => {
  searchInput.value = ''
  activePage.value = 1
  archivedPage.value = 1
  loadForms()
}

const clearFilter = () => {
  activeFilter.value = null
  filterMenu.value = false
}

const openBuilder = (form) => {
  selectedForm.value = form || null
  builderOpen.value = true
  emit('builder-open', form?.name || 'New Form')
}

const closeBuilder = () => {
  builderOpen.value = false
  selectedForm.value = null
  emit('builder-close')
  loadForms()
}

const openShare = (form) => {
  shareForm.value = form
  shareOpen.value = true
}

const openPreview = (form) => {
  previewForm.value = form || null
  previewOpen.value = true
}

const allActiveSelected = computed(() => (
  !!activeForms.value.length
  && activeForms.value.every((row) => selectedForms.value.some((sel) => sel?.id === row?.id))
))

const someActiveSelected = computed(() => (
  selectedForms.value.length > 0 && !allActiveSelected.value
))

const allArchivedSelected = computed(() => (
  !!archivedForms.value.length
  && archivedForms.value.every((row) => selectedArchivedForms.value.some((sel) => sel?.id === row?.id))
))

const someArchivedSelected = computed(() => (
  selectedArchivedForms.value.length > 0 && !allArchivedSelected.value
))

const toggleAllActive = () => {
  selectedForms.value = allActiveSelected.value ? [] : [...activeForms.value]
}

const toggleAllArchived = () => {
  selectedArchivedForms.value = allArchivedSelected.value ? [] : [...archivedForms.value]
}

const onFormSaved = () => {
  activePage.value = 1
  archivedPage.value = 1
  loadForms()
}

const toggleActive = async (form, newVal) => {
  try {
    const res = await crmStore.updateForm({ id: form.id, active: newVal })
    if (res?.code === 0) {
      form.active = newVal
      mainStore.setSnackbar({ title: newVal ? 'Form activated' : 'Form deactivated', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to update status', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to update status', type: 'error' })
  }
}

const archiveOne = (form) => {
  selectedForms.value = [form]
  confirmBulkArchive.value = true
}

const restoreOne = (form) => {
  selectedArchivedForms.value = [form]
  confirmBulkRestore.value = true
}

const deleteOne = (form) => {
  selectedArchivedForms.value = [form]
  confirmBulkDelete.value = true
}

const doArchive = async () => {
  if (!selectedForms.value.length) return
  archiving.value = true
  try {
    const ids = selectedForms.value.map((row) => Number(row?.id)).filter(Boolean)
    const res = await crmStore.archiveForms({ ids })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Form(s) archived', type: 'success' })
      confirmBulkArchive.value = false
      selectedForms.value = []
      activePage.value = 1
      archivedPage.value = 1
      await loadForms()
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to archive forms', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to archive forms', type: 'error' })
  } finally {
    archiving.value = false
  }
}

const doRestore = async () => {
  if (!selectedArchivedForms.value.length) return
  restoring.value = true
  try {
    const ids = selectedArchivedForms.value.map((row) => Number(row?.id)).filter(Boolean)
    const res = await crmStore.restoreForms({ ids })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Form(s) restored', type: 'success' })
      confirmBulkRestore.value = false
      selectedArchivedForms.value = []
      activePage.value = 1
      archivedPage.value = 1
      await loadForms()
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to restore forms', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to restore forms', type: 'error' })
  } finally {
    restoring.value = false
  }
}

const doDelete = async () => {
  if (!selectedArchivedForms.value.length) return
  deleting.value = true
  try {
    const ids = selectedArchivedForms.value.map((row) => Number(row?.id)).filter(Boolean)
    const res = await crmStore.deleteForm({ ids })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Archived form(s) deleted', type: 'success' })
      confirmBulkDelete.value = false
      selectedArchivedForms.value = []
      activePage.value = 1
      archivedPage.value = 1
      await loadForms()
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to delete forms', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to delete forms', type: 'error' })
  } finally {
    deleting.value = false
  }
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

.row-action-icon {
  width: 16px;
  height: 16px;
}

.action-cell {
  gap: 0px;
  padding-right: 2px;
}

.select-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #0061fb;
}

.selected-text {
  font-size: 20px;
  font-weight: 700;
  color: #4f4f4f;
}

.action-bar {
  border: 1px solid #ececec;
  width: fit-content;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.action-item {
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 8px;
}

.action-item:hover {
  background-color: #f5f5f5;
}

.action-label {
  font-size: 12px;
  color: #6d6d6d;
  margin-top: 2px;
}

.action-icon {
  width: 20px;
  height: 20px;
}

.form-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.form-name-input :deep(.v-field__input) {
  font-size: 14px;
  font-weight: 500;
  padding-top: 0;
  padding-bottom: 0;
  min-height: unset;
}
.form-name-input :deep(.v-field) {
  min-height: unset;
}
</style>
