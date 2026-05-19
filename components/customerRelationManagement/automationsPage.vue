<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>

    <div class="mt-5 px-5">
      <div class="automation-header">
        <CommonFeatureCard
          v-if="showInfoBanner"
          mode="info"
          heading="My Automations"
          subheading="Create and manage your own automation"
          :image-src="automationFeatureCardIcon"
          class="automation-info-banner mt-4"
          @close="showInfoBanner = false"
        />
        <div class="automation-actions d-flex flex-wrap align-center">
          <!-- Search + Filter — left side -->
          <div class="d-inline-flex align-center toolbar-wrapper">
            <div style="width: 180px">
              <v-text-field
                v-model="categorySearch"
                placeholder="Search"
                clearable
                @click:clear="categorySearch = ''"
                variant="solo"
                :elevation="0"
                density="compact"
                hide-details
                bg-color="#F3F4F6"
                flat
                class="cat-search"
              >
                <template #append-inner>
                  <img :src="searchicon" alt="search" width="14" height="14" />
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
                  class="cat-filter-btn ml-3"
                >
                  <span>Filter</span>
                  <img :src="filtericon" alt="filter" class="ml-2" width="14" height="14" />
                  <v-badge
                    v-if="activeFilterCount"
                    :content="activeFilterCount"
                    color="primary"
                    floating
                    offset-x="4"
                    offset-y="4"
                  />
                </v-btn>
              </template>

              <v-card style="min-width: 260px; border-radius: 12px; padding: 16px">
                <v-list class="pa-0">
                  <div class="pa-0 d-flex align-center justify-space-between">
                    <div style="font-weight: 500; font-size: 14px">Filters by</div>
                    <v-btn
                      variant="text"
                      density="comfortable"
                      color="primary"
                      style="text-transform: none; font-weight: 500; font-size: 13px"
                      @click="clearCategoryFilters"
                    >
                      Clear filters
                    </v-btn>
                  </div>
                  <v-divider style="background-color: #dbdbdb" class="my-3" />

                  <v-label class="my-1" style="font-size: 14px">Type</v-label>
                  <v-select
                    v-model="categoryFilter.type"
                    :items="[
                      { title: 'All', value: 'all' },
                      { title: 'Email only', value: 'email' },
                      { title: 'Has WhatsApp', value: 'whatsapp' },
                    ]"
                    item-title="title"
                    item-value="value"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    class="filter-input-bordered"
                  />

                </v-list>
              </v-card>
            </v-menu>
          </div>

          <!-- Spacer -->
          <div class="flex-grow-1" />

          <!-- Action buttons — right side -->
          <div class="d-inline-flex align-center" style="gap: 10px">
            <v-btn
              color="secondary"
              variant="flat"
              rounded="lg"
              class="add-task-btn automation-btn automation-btn--group"
              @click="openGroupCreate"
            >
              <template #prepend>
                <v-icon size="18">mdi-folder-plus-outline</v-icon>
              </template>
              Create Automation Category
            </v-btn>

            <v-btn
              color="secondary"
              variant="flat"
              rounded="lg"
              class="add-task-btn automation-btn automation-btn--group"
              @click="showBulkUploadDialog = true"
            >
              <template #prepend>
                <v-icon size="18">mdi-upload</v-icon>
              </template>
              Bulk Upload
            </v-btn>

            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              class="add-task-btn automation-btn automation-btn--primary"
              @click="showAutomationDrawer = true"
            >
              <template #prepend>
                <v-icon size="18">mdi-plus-circle-outline</v-icon>
              </template>
              Add Automation
            </v-btn>
          </div>
        </div>

        <!-- AI Automation Generator Input -->
        <div class="ai-generator-section mt-4">
          <v-text-field
            v-model="aiIdea"
            variant="solo"
            placeholder="Tell AI your idea (e.g., 'Create follow-up emails for new dental patients')"
            hide-details
            density="comfortable"
            bg-color="#F3F4F6"
            flat
            :elevation="0"
            class="ai-input-field"
            @keyup.enter="handleAIGenerate"
          >
            <template #append-inner>
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                class="ai-generate-btn"
                :loading="generatingAI"
                :disabled="!aiIdea.trim()"
                @click="handleAIGenerate"
              >
                <v-icon size="18" class="mr-1">mdi-auto-fix</v-icon>
                Generate with AI
              </v-btn>
            </template>
          </v-text-field>
        </div>
      </div>

      <v-card class="automation-library-card" elevation="0">
        <div class="library-header">Automation Library</div>
        <div class="library-body">
          <CustomerRelationManagementAutomation
            ref="automationRef"
            display-mode="modal"
            :groups="automationGroups"
            :use-groups-api="false"
            :include-defaults="false"
            :whatsapp-enabled="whatsappEnabled"
            :whatsapp-requires-templates="whatsappRequiresTemplates"
            :show-card-toggle="false"
            :allow-group-edit="true"
            :show-preview-action="true"
            :disable-toggle="true"
            :show-trigger-column="true"
            :show-status-column="false"
            :category-search="categorySearch"
            :category-filter="categoryFilter"
            @edit-group="openGroupEdit"
            @delete-group="confirmGroupDelete"
          />
        </div>
      </v-card>
    </div>

    <ClientOnly>
      <CustomerRelationManagementAddAutomationGroup
        v-model="showGroupDrawer"
        :group="editingGroup"
        @success="handleGroupSaved"
      />
      <CustomerRelationManagementAddAutomation
        v-model="showAutomationDrawer"
        :groups="automationGroups"
        @success="handleAutomationSaved"
      />
      <CustomerRelationManagementBulkAutomationUploadDialog
        v-model="showBulkUploadDialog"
        @onUpdate="refreshAll"
      />
      <CustomerRelationManagementAiAutomationGenerator
        ref="aiGeneratorRef"
        v-model="showAIPreview"
        @success="handleAIAutomationsCreated"
      />
    </ClientOnly>

    <v-dialog v-model="showGroupDelete" max-width="480">
      <v-card class="pa-4 rounded-lg">
        <div class="d-flex align-center justify-space-between mb-2">
          <h5 class="modal-title">Delete Automation Category</h5>
          <v-btn icon variant="text" @click="showGroupDelete = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <p class="text-body-2 mb-4">
          Are you sure you want to delete
          <strong>{{ groupToDelete?.title || 'this category' }}</strong>?
          This will remove all mappings in this group.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="showGroupDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deletingGroup" @click="deleteGroup">
            Delete
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import CustomerRelationManagementAutomation from '@/components/customerRelationManagement/automation.vue'
import CustomerRelationManagementAddAutomationGroup from '@/components/customerRelationManagement/addAutomationGroup.vue'
import CustomerRelationManagementAddAutomation from '@/components/customerRelationManagement/addAutomation.vue'
import CustomerRelationManagementBulkAutomationUploadDialog from '@/components/customerRelationManagement/bulkAutomationUploadDialog.vue'
import CustomerRelationManagementAiAutomationGenerator from '@/components/customerRelationManagement/aiAutomationGenerator.vue'
import CommonFeatureCard from '@/components/Common/featureCard.vue'
import automationFeatureCardIcon from '@/assets/icons/crm/automation-feature-card.svg'
import filtericon from '@/assets/icons/listView/filter-icon.svg'
import searchicon from '@/assets/icons/listView/serach-icon.svg'

const crmStore = useCrmStore()
const mainStore = useMainStore()
const router = useRouter()
const { user } = useUser()

const automationGroups = ref([])
const automationRef = ref(null)
const showGroupDrawer = ref(false)
const showAutomationDrawer = ref(false)
const showBulkUploadDialog = ref(false)
const showInfoBanner = ref(true)
const editingGroup = ref(null)
const showGroupDelete = ref(false)
const deletingGroup = ref(false)
const groupToDelete = ref(null)
const whatsappEnabled = ref(false)
const whatsappRequiresTemplates = ref(false)
const aiIdea = ref('')
const showAIPreview = ref(false)
const generatingAI = ref(false)
const aiGeneratorRef = ref(null)
const categorySearch = ref('')
const categoryFilter = ref({ type: 'all' })
const filterMenu = ref(false)

const activeFilterCount = computed(() => categoryFilter.value.type !== 'all' ? 1 : 0)

const clearCategoryFilters = () => {
  categoryFilter.value = { type: 'all' }
}

const isPrivileged = computed(() => [1, 8].includes(Number(user.value?.roleId)))

const loadGroups = async () => {
  const res = await crmStore.listAutomationGroups()
  if (res?.code === 0 && Array.isArray(res.data)) {
    automationGroups.value = res.data
  }
}

const loadWhatsAppAvailability = async () => {
  try {
    const res = await crmStore.getWhapiStatus()
    const statusRaw = String(res?.data?.status || '').toLowerCase()
    const stopped = statusRaw === 'stopped' || statusRaw === 'blocked'
    whatsappEnabled.value = Boolean(res?.data?.connected) && !stopped
  } catch {
    whatsappEnabled.value = false
  }
}

const refreshAll = async () => {
  await loadWhatsAppAvailability()
  await loadGroups()
  if (automationRef.value?.refresh) {
    await automationRef.value.refresh()
  }
}

const refreshGroupsAndRows = async () => {
  await loadGroups()
  if (automationRef.value?.refresh) {
    await automationRef.value.refresh({ skipGroups: true })
  }
}

const handleGroupSaved = async () => {
  editingGroup.value = null
  await refreshGroupsAndRows()
}

const handleAutomationSaved = async () => {
  await refreshGroupsAndRows()
}

const openGroupCreate = () => {
  editingGroup.value = null
  showGroupDrawer.value = true
}

const openGroupEdit = (group) => {
  editingGroup.value = group || null
  showGroupDrawer.value = true
}

const confirmGroupDelete = (group) => {
  groupToDelete.value = group || null
  showGroupDelete.value = true
}

const deleteGroup = async () => {
  if (!groupToDelete.value) return
  try {
    deletingGroup.value = true
    const res = await crmStore.deleteAutomationGroup({
      id: groupToDelete.value.id,
      key: groupToDelete.value.key,
    })
    if (res?.code === 0) {
      showGroupDelete.value = false
      groupToDelete.value = null
      await refreshGroupsAndRows()
      mainStore.setSnackbar({
        title: 'Automation category deleted',
        type: 'success',
      })
      return
    }
    mainStore.setSnackbar({
      title: res?.message || 'Failed to delete group',
      type: 'error',
    })
  } catch (e) {
    mainStore.setSnackbar({
      title: e.message || 'Failed to delete group',
      type: 'error',
    })
  } finally {
    deletingGroup.value = false
  }
}

const handleAIGenerate = async () => {
  if (!aiIdea.value.trim()) return
  generatingAI.value = true
  try {
    await aiGeneratorRef.value?.generateAutomations(aiIdea.value.trim())
  } finally {
    generatingAI.value = false
  }
}

const handleAIAutomationsCreated = async () => {
  aiIdea.value = ''
  await refreshAll()
}

const onAutomationsUpdated = async () => {
  await refreshAll()
}

onMounted(async () => {
  if (!isPrivileged.value) {
    mainStore.setSnackbar({
      title: 'Only practice owners and managers can access CRM automations',
      type: 'error',
    })
    router.push('/crm')
    return
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('crm-automations-updated', onAutomationsUpdated)
  }
  await refreshAll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('crm-automations-updated', onAutomationsUpdated)
  }
})
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}

.page-title {
  font-weight: 600;
  font-size: 20px;
  color: rgb(var(--v-theme-on-surface));
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.automation-info-banner {
  width: 100%;
}

.automation-actions {
  margin-top: 16px;
  gap: 10px;
}

.toolbar-wrapper {
  height: 46px;
}

.cat-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
}

.cat-search :deep(.v-field) {
  border-radius: 8px !important;
}

.cat-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}

.cat-filter-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  min-width: 100px;
}

.filter-input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

.automation-btn {
  height: 46px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
  color: #ffffff !important;
}

.automation-btn :deep(.v-icon) {
  color: #ffffff;
}

.automation-btn--group {
  background: #7d77ff !important;
}

.automation-btn--primary {
  background: #0061ff !important;
}

.automation-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.automation-library-card {
  margin-top: 24px;
  border: 1px solid #e3e3e3;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
}

.library-header {
  padding: 16px 20px;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #efefef;
  background: #fafafa;
}

.library-body {
  padding: 16px;
}

.ai-generator-section {
  width: 100%;
}

.ai-input-field {
  border-radius: 12px;
}

.ai-input-field :deep(.v-field) {
  border-radius: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.ai-generate-btn {
  padding: 0 24px !important;
  height: 40px !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 97, 255, 0.2);
  transition: all 0.3s ease;
}

.ai-generate-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 97, 255, 0.3);
  transform: translateY(-1px);
}

.ai-generate-btn:active {
  transform: translateY(0);
}

.ai-generate-btn.v-btn--disabled {
  opacity: 0.5;
  box-shadow: none;
}
</style>
