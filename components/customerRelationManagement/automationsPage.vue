<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>

    <div class="mt-5 px-5">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <div class="page-title">Automation</div>
          <div class="page-subtitle">Manage your CRM automation groups and templates.</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="secondary"
            variant="flat"
            rounded="lg"
            class="add-task-btn"
            @click="showGroupDrawer = true"
          >
            <template #prepend>
              <v-icon size="18">mdi-folder-plus-outline</v-icon>
            </template>
            Add Automation Group
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="add-task-btn"
            @click="showAutomationDrawer = true"
          >
            <template #prepend>
              <v-icon size="18">mdi-plus-circle-outline</v-icon>
            </template>
            Add Automation
          </v-btn>
        </div>
      </div>

      <div class="mt-5">
        <CustomerRelationManagementAutomation
          ref="automationRef"
          display-mode="modal"
          :groups="automationGroups"
          :use-groups-api="false"
        />
      </div>
    </div>

    <ClientOnly>
      <CustomerRelationManagementAddAutomationGroup
        v-model="showGroupDrawer"
        @success="handleGroupSaved"
      />
      <CustomerRelationManagementAddAutomation
        v-model="showAutomationDrawer"
        :groups="automationGroups"
        @success="handleAutomationSaved"
      />
    </ClientOnly>
  </v-sheet>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import CustomerRelationManagementAutomation from '@/components/customerRelationManagement/automation.vue'
import CustomerRelationManagementAddAutomationGroup from '@/components/customerRelationManagement/addAutomationGroup.vue'
import CustomerRelationManagementAddAutomation from '@/components/customerRelationManagement/addAutomation.vue'

const crmStore = useCrmStore()
const mainStore = useMainStore()
const router = useRouter()
const { user } = useUser()

const automationGroups = ref([])
const automationRef = ref(null)
const showGroupDrawer = ref(false)
const showAutomationDrawer = ref(false)

const isPrivileged = computed(() => [1, 8].includes(Number(user.value?.roleId)))

const loadGroups = async () => {
  const res = await crmStore.listAutomationGroups()
  if (res?.code === 0 && Array.isArray(res.data)) {
    automationGroups.value = res.data
  }
}

const refreshAll = async () => {
  await loadGroups()
  if (automationRef.value?.refresh) {
    await automationRef.value.refresh()
  }
}

const handleGroupSaved = async () => {
  await refreshAll()
}

const handleAutomationSaved = async () => {
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
</style>
