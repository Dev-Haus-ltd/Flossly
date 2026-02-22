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
        <div class="automation-actions d-flex flex-wrap gap-4">
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
            :show-preview-action="false"
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
import CommonFeatureCard from '@/components/Common/featureCard.vue'
import automationFeatureCardIcon from '@/assets/icons/crm/automation-feature-card.svg'

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
const whatsappProvider = ref('meta')
const whatsappRequiresTemplates = ref(true)

const isPrivileged = computed(() => [1, 8].includes(Number(user.value?.roleId)))

const isWhatsAppGroup = (group) => {
  const key = String(group?.key || '').toLowerCase()
  const title = String(group?.title || '').toLowerCase()
  return key.includes('whatsapp') || title.includes('whatsapp')
}

const loadGroups = async () => {
  const res = await crmStore.listAutomationGroups()
  if (res?.code === 0 && Array.isArray(res.data)) {
    automationGroups.value = whatsappEnabled.value
      ? res.data
      : res.data.filter((group) => !isWhatsAppGroup(group))
  }
}

const loadWhatsAppAvailability = async () => {
  try {
    const res = await crmStore.getWhatsAppConfig()
    if (res?.code === 0 && res.data) {
      const provider = String(res.data.provider || '').toLowerCase()
      const hasToken = Boolean(res.data.hasToken)
      if (provider === 'whapi') {
        const statusRes = await crmStore.getWhapiStatus()
        const statusRaw = String(statusRes?.data?.status || '').toLowerCase()
        const stopped = statusRaw === 'stopped' || statusRaw === 'blocked'
        whatsappEnabled.value = Boolean(statusRes?.data?.connected) && !stopped
        whatsappProvider.value = 'whapi'
        whatsappRequiresTemplates.value = false
        return
      }
      if (provider === 'meta') {
        whatsappEnabled.value = hasToken
        whatsappProvider.value = 'meta'
        whatsappRequiresTemplates.value = true
        return
      }
    }
  } catch {}
  whatsappEnabled.value = false
  whatsappProvider.value = 'meta'
  whatsappRequiresTemplates.value = true
}

const refreshAll = async () => {
  await loadWhatsAppAvailability()
  await loadGroups()
  if (automationRef.value?.refresh) {
    await automationRef.value.refresh()
  }
}

const handleGroupSaved = async () => {
  editingGroup.value = null
  await refreshAll()
}

const handleAutomationSaved = async () => {
  await refreshAll()
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
      await refreshAll()
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

onMounted(async () => {
  if (!isPrivileged.value) {
    mainStore.setSnackbar({
      title: 'Only practice owners and managers can access CRM automations',
      type: 'error',
    })
    router.push('/crm')
    return
  }
  await refreshAll()
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
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
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
</style>
