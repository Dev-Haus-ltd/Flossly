<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1300px" persistent :z-index="11000">
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header -->
        <div
          class="pa-4 d-flex justify-space-between align-center"
          style="background-color: rgb(var(--v-theme-surface))"
        >
          <h3 class="title ml-4">{{ leadTitle }}</h3>
          <v-btn flat icon size="32" @click="onClose">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Scrollable content -->
        <div class="flex-grow-1 px-4 py-2" style="overflow-y: auto">
          <v-tabs v-model="tab" class="custom-tabs px-4" slider-color="primary">
            <v-tab value="lead-info" class="tab-text">
              <img
                src="@/assets/icons/crm/info.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Lead Information
            </v-tab>

            <v-tab value="treatment" class="tab-text">
              <img
                src="@/assets/icons/crm/treatment.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Treatment Interest
            </v-tab>

            <v-tab value="communication" class="tab-text">
              <img
                src="@/assets/icons/crm/communication.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Communication Tracking / Log
            </v-tab>

            <v-tab value="whatsapp" class="tab-text">
              <v-icon size="18" class="mr-2">mdi-whatsapp</v-icon>
              WhatsApp Timeline
            </v-tab>

            <v-tab value="automation" class="tab-text">
              <img
                src="@/assets/icons/crm/settings.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              Flossly Automation
            </v-tab>

            <v-tab value="my-automations" class="tab-text">
              <img
                src="@/assets/icons/crm/settings.svg"
                width="18"
                height="18"
                class="mr-2"
              />
              My Automations
            </v-tab>

            <v-tab value="automation-log" class="tab-text">
              <v-icon size="18" class="mr-2">mdi-history</v-icon>
              Automation History
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="lead-info">
              <div class="pa-6">
                <h4 class="cust-lbl mb-4">Lead Information</h4>

                <v-row>
                  <!-- Name -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Name</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ displayLeadName }}</span>
                  </v-col>

                  <!-- Email -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/frequency.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Email</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ selectedLead.email }}</span>
                  </v-col>

                  <!-- Telephone -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/priority.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Telephone</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{ selectedLead.telephone }}</span>
                  </v-col>

                  <!-- Inquiry Date -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Inquiry Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      formatDate(selectedLead.inquiryDate)
                    }}</span>
                  </v-col>

                  <!-- Lead Source -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/status.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Lead Source</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.leadSource?.name || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Lead Status -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Lead Status</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-chip
                      color="primary"
                      variant="flat"
                      size="small"
                      class="text-white rounded-xl"
                      label
                    >
                      <template #prepend>
                        <span class="status-dot"></span>
                      </template>
                      {{ selectedLead.leadStatus }}
                    </v-chip>
                  </v-col>

                  <!-- Automation -->
                  <!-- <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/crm/settings.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Automation</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <div class="automation-pill-row">
                      <template v-if="automationItemNames.length">
                        <v-chip
                          v-for="name in automationItemDisplay.visible"
                          :key="name"
                          size="x-small"
                          color="primary"
                          variant="outlined"
                          class="automation-pill"
                          :title="name"
                        >
                          {{ truncateAutomationName(name) }}
                        </v-chip>
                        <v-tooltip
                          v-if="automationItemDisplay.overflow.length"
                          location="top"
                          content-class="automation-tooltip-content"
                        >
                          <template #activator="{ props: tooltipProps }">
                            <v-chip
                              v-bind="tooltipProps"
                              size="x-small"
                              color="primary"
                              variant="tonal"
                              class="automation-pill automation-pill--overflow"
                            >
                              +{{ automationItemDisplay.overflow.length }}
                            </v-chip>
                          </template>
                          <div class="automation-tooltip">
                            <div
                              v-for="name in automationItemDisplay.overflow"
                              :key="name"
                            >
                              {{ name }}
                            </div>
                          </div>
                        </v-tooltip>
                      </template>
                      <span v-else class="automation-placeholder">None</span>
                    </div>
                  </v-col> -->

                  <!-- Preferred Contact Method -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Preferred Contact</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      commPrefs?.preferredContactMethod || selectedLead.preferredContact || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Assigned -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Assigned</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <div v-if="assignedUsers.length" class="d-flex flex-wrap align-center assigned-avatars">
                      <v-tooltip
                        v-for="(user, index) in assignedUsers"
                        :key="user.id || index"
                        location="top"
                        :text="user.fullName || user.name"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <span v-bind="tooltipProps" class="assigned-avatar">
                            <CommonAvatar :user="user" size="28px" />
                          </span>
                        </template>
                      </v-tooltip>
                    </div>
                    <span v-else class="value-text">Unassigned</span>
                  </v-col>

              
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Follow Up Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      formatDate(selectedLead.followUpDate)
                    }}</span>
                  </v-col>

                  <!-- Date of Birth -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Date of Birth</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.dob
                        ? formatDate(selectedLead.dob)
                        : "N/A"
                    }}</span>
                  </v-col>

                  <!-- Occupation -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/category.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Occupation</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.occupation || "N/A"
                    }}</span>
                  </v-col>

                  <!-- Location/Postcode -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Location/Postcode</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5">
                    <span class="value-text">{{
                      selectedLead.location || "N/A"
                    }}</span>
                  </v-col>

                  <v-col
                    v-if="showMetaExtras"
                    cols="12"
                    class="mt-2"
                  >
                    <v-divider class="my-4" />
                    <h4 class="cust-lbl mb-3">Additional Form Answers</h4>
                    <v-row v-if="extraAnswers.length">
                      <template v-for="item in extraAnswers" :key="item.key">
                        <v-col cols="12" md="4">
                          <span class="key-text">{{ item.label }}</span>
                        </v-col>
                        <v-col cols="12" md="8">
                          <span class="value-text">{{ item.value }}</span>
                        </v-col>
                      </template>
                    </v-row>
                    <v-alert v-else type="info" variant="tonal">
                      No additional answers found.
                    </v-alert>
                  </v-col>

                  <v-col cols="12">
                    <div>
                      <label class="cust-lbl">Comments</label>
                      <v-textarea
                        v-model="selectedLead.comments"
                        variant="solo"
                        placeholder="Type here"
                        density="compact"
                        :rules="requiredRule"
                        bg-color="white"
                        elevation="0"
                        class="mt-3 input-bordered"
                        flat
                      />
                      <div class="d-flex justify-end mt-2">
                        <v-btn color="primary" variant="flat" :loading="savingComment" @click="saveComment">Save</v-btn>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="treatment">
              <div class="pa-6">
                <CustomerRelationManagementTreatmentIntrest
                  :selectedTreatment="selectedTreatment"
                  @save="onTreatmentSave"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="communication">
              <div class="pa-6">
                <CustomerRelationManagementCommunicationLog
                  :lead-id="selectedLead?.id"
                  :initialNotes="[]"
                  :initialPreferences="commPrefs"
                  @save="onCommunicationSave"
                  @update:preferences="onPreferencesUpdated"
                />
                <div class="d-flex justify-end mt-3">
                  <v-btn color="primary" variant="flat" :loading="savingPrefs" @click="savePreferences">Save Preferences</v-btn>
                </div>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="whatsapp">
              <div class="pa-6">
                <CustomerRelationManagementChatTimeline
                  :lead-id="selectedLead?.id"
                  :lead-name="displayLeadName"
                  :lead-avatar="selectedLead?.photo"
                  :connected="whatsappEnabled"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="automation">
              <div class="pa-6">
                <CustomerRelationManagementAutomation
                  :lead-id="selectedLead?.id"
                  :lead="selectedLead"
                  :include-defaults="true"
                  :whatsapp-enabled="whatsappEnabled"
                  :whatsapp-requires-templates="whatsappRequiresTemplates"
                  :disable-toggle="false"
                  :show-sent-status-column="true"
                  :show-resend-action="true"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="my-automations">
              <div class="pa-6">
                <CustomerRelationManagementAutomation
                  :lead-id="selectedLead?.id"
                  :lead="selectedLead"
                  :include-defaults="false"
                  :whatsapp-enabled="whatsappEnabled"
                  :whatsapp-requires-templates="whatsappRequiresTemplates"
                  :disable-toggle="false"
                  :show-sent-status-column="true"
                  :show-resend-action="true"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="automation-log">
              <div class="pa-6">
                <v-card class="rounded-lg overflow-hidden" style="border: 1px solid rgba(0,0,0,0.12);" :elevation="0">
                <v-data-table-server
                  :items="automationLogRows"
                  :headers="automationLogHeaders"
                  :loading="automationLogLoading"
                  :items-length="automationLogTotal"
                  :page="automationLogPage"
                  :items-per-page="automationLogItemsPerPage"
                  :items-per-page-options="[10, 25, 50]"
                  class="automation-log-table"
                  :elevation="0"
                  density="compact"
                  hover
                  item-value="key"
                  @update:page="onAutomationLogPageChange"
                  @update:items-per-page="onAutomationLogLimitChange"
                >
                  <template #headers="{ columns }">
                    <tr>
                      <th
                        v-for="col in columns"
                        :key="col.key"
                        :style="{
                          backgroundColor: '#F6F6F6',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#4b5563',
                          padding: '0px 10px',
                          height: '40px',
                          width: col.width || undefined,
                          minWidth: col.width || undefined,
                          whiteSpace: 'nowrap',
                        }"
                      >
                        {{ col.title }}
                      </th>
                    </tr>
                  </template>
                  <template #item.type="{ item }">
                    <div class="d-flex align-center" style="gap:6px;">
                      <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
                        <v-icon size="14" class="mr-1">
                          {{ item.type === 'WhatsApp' ? 'mdi-whatsapp' : 'mdi-email-outline' }}
                        </v-icon>
                        {{ item.type }}
                      </v-chip>
                      <v-chip v-if="item.source === 'manual'" size="x-small" variant="tonal" color="grey">Manual</v-chip>
                    </div>
                  </template>
                  <template #item.name="{ item }">
                    <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
                  </template>
                  <template #item.sentAt="{ item }">
                    <span class="text-body-2">
                      {{ formatDate(item.sentAt) }}
                      <span class="text-caption text-medium-emphasis ml-1">
                        {{ item.sentAt ? new Date(item.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '' }}
                      </span>
                    </span>
                  </template>
                  <template #item.logStatus>
                    <v-chip size="x-small" variant="tonal" color="success" class="font-weight-medium">
                      <v-icon size="11" class="mr-1">mdi-check-circle-outline</v-icon>
                      Sent
                    </v-chip>
                  </template>
                  <template #no-data>
                    <div class="text-center py-8">
                      <v-icon size="48" color="grey-lighten-1">mdi-email-check-outline</v-icon>
                      <p class="text-body-2 mt-3 text-medium-emphasis">No automations sent to this lead yet</p>
                    </div>
                  </template>
                </v-data-table-server>
                </v-card>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { formatDateOnly } from "@/lib/dateFormatter";
import { getLeadDisplayName } from "@/lib/normalizers/lead";
import { crmAutomationDefaults } from '@shared/defaults/crmAutomationDefaults'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import CustomerRelationManagementChatTimeline from "@/components/customerRelationManagement/chatTimeline.vue";

const props = defineProps({
  modelValue: Boolean,
  selectedLead: Object,
});
const emit = defineEmits(['close','update:modelValue'])
const onClose = () => { emit('update:modelValue', false); emit('close') }
const tab = ref("lead-info");
const crmStore = useCrmStore()
const mainStore = useMainStore()
const whatsappEnabled = ref(false)
const whatsappRequiresTemplates = ref(true)
const leadTitle = computed(() => {
  const lead = props.selectedLead || {};
  const name = String(displayLeadName.value || '').trim();
  if (name) return `${name}'s profile`;
  const email = String(lead.email || '').trim();
  if (email) return `${email}'s profile`;
  const phone = String(lead.telephone || '').trim();
  if (phone) return `${phone}'s profile`;
  return 'Lead profile';
});
const formatDate = (date) => {
  return formatDateOnly(date);
};
const selectedTreatment = ref({})
const commPrefs = ref({})
const humanizeFieldLabel = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
const displayLeadName = computed(() => {
  const name = getLeadDisplayName(props.selectedLead || {})
  return name || 'N/A'
})
const showMetaExtras = computed(() => {
  const source = props.selectedLead?.leadSource
  const name = typeof source === 'string' ? source : source?.name
  return (name || '').trim() === 'Meta Leadgen'
})
const extraAnswers = computed(() => {
  const raw = props.selectedLead?.rawData || {}
  const fieldData = Array.isArray(raw.field_data)
    ? raw.field_data
    : Array.isArray(raw.fieldData)
      ? raw.fieldData
      : []
  if (!fieldData.length) return []

  const skip = new Set([
    'full_name',
    'name',
    'email',
    'email_address',
    'phone_number',
    'phone',
  ])

  return fieldData
    .map((f, idx) => {
      const key = f?.name ?? `field_${idx}`
      const rawValues = Array.isArray(f?.values) ? f.values : [f?.values]
      const value = rawValues.filter((v) => v !== undefined && v !== null && v !== '').join(', ')
      return {
        key: String(key),
        label: humanizeFieldLabel(key),
        value: value || '--',
      }
    })
    .filter((item) => item.key && !skip.has(item.key))
})

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
        whatsappRequiresTemplates.value = false
        return
      }
      if (provider === 'meta') {
        whatsappEnabled.value = hasToken
        whatsappRequiresTemplates.value = true
        return
      }
    }
  } catch {}
  whatsappEnabled.value = false
  whatsappRequiresTemplates.value = true
}

onMounted(() => {
  loadWhatsAppAvailability()
})
const assignedUsers = computed(() => {
  const list = props.selectedLead?.assigned || [];
  return list
    .map((user) => {
      if (!user) return null;
      const fullName = user.fullName || user.name || user.email;
      return fullName ? { ...user, fullName } : null;
    })
    .filter(Boolean);
});

const automationLogRows = ref([])
const automationLogLoading = ref(false)
const automationLogTotal = ref(0)
const automationLogPage = ref(1)
const automationLogItemsPerPage = ref(25)
const automationLogHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Automation', key: 'name', sortable: false },
  { title: 'Message Sent', key: 'sentAt', width: '200px', sortable: false },
  { title: 'Status', key: 'logStatus', width: '110px', sortable: false },
]

const loadAutomationLog = async (leadId) => {
  if (!leadId) return
  automationLogLoading.value = true
  try {
    const res = await crmStore.getLeadAutomationLog(leadId, {
      page: automationLogPage.value,
      limit: automationLogItemsPerPage.value,
    })
    const payload = res?.data || {}
    automationLogRows.value = Array.isArray(payload.rows) ? payload.rows : []
    automationLogTotal.value = Number(payload.total || 0)
  } catch {
    automationLogRows.value = []
    automationLogTotal.value = 0
  } finally {
    automationLogLoading.value = false
  }
}

const onAutomationLogPageChange = (page) => {
  automationLogPage.value = page
  if (props.selectedLead?.id) loadAutomationLog(props.selectedLead.id)
}

const onAutomationLogLimitChange = (limit) => {
  automationLogItemsPerPage.value = limit
  automationLogPage.value = 1
  if (props.selectedLead?.id) loadAutomationLog(props.selectedLead.id)
}

const automationRows = ref([])
const automationLoading = ref(false)
const loadLeadAutomations = async (leadId) => {
  if (!leadId || automationLoading.value) return
  automationLoading.value = true
  try {
    const res = await crmStore.listAutomation(leadId)
    const apiItems = Array.isArray(res?.data) ? res.data : []
    automationRows.value = apiItems.length ? apiItems : crmAutomationDefaults
  } catch (e) {
    automationRows.value = crmAutomationDefaults
  } finally {
    automationLoading.value = false
  }
}

const automationItemNames = computed(() =>
  (automationRows.value || [])
    .filter((row) => row?.enabled)
    .map((row) => row?.name || row?.key || 'Automation')
)

const automationItemDisplay = computed(() => ({
  visible: automationItemNames.value.slice(0, 3),
  overflow: automationItemNames.value.slice(3),
}))

const truncateAutomationName = (name, max = 20) => {
  const safe = String(name || '').trim()
  if (!safe) return ''
  if (safe.length <= max) return safe
  return `${safe.slice(0, Math.max(0, max - 3))}...`
}

watch(
  () => props.selectedLead,
  async (lead) => {
    if (!lead?.id) return
    automationLogRows.value = []
    try {
      const res = await crmStore.getLeadTreatment(lead.id)
      if (res && res.code === 0) selectedTreatment.value = res.data || {}
    } catch (e) {}
    try {
      const comm = await crmStore.getLeadCommunication(lead.id)
      if (comm && comm.code === 0) commPrefs.value = comm.data || {}
    } catch (e) {}
    try {
      await loadLeadAutomations(lead.id)
    } catch (e) {}
  },
  { immediate: true }
)

watch(tab, (val) => {
  if (val === 'automation-log' && props.selectedLead?.id) {
    automationLogPage.value = 1
    loadAutomationLog(props.selectedLead.id)
  }
})

const onTreatmentSave = async (updatedTreatment) => {
  try {
    const res = await crmStore.saveLeadTreatment(props.selectedLead.id, updatedTreatment)
    if (res && res.code === 0) {
      selectedTreatment.value = res.data
      mainStore.setSnackbar({ title: 'Treatment interest saved', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to save treatment interest', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to save treatment interest', type: 'error' })
  }
};
const onPreferencesUpdated = (newPreferences) => {
  pendingPrefs.value = newPreferences
};
const onCommunicationSave = () => {};

const savingComment = ref(false)
const saveComment = async () => {
  try {
    savingComment.value = true
    const res = await crmStore.updateLead({ id: props.selectedLead.id, comments: props.selectedLead.comments })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Comment saved', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to save comment', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to save comment', type: 'error' })
  } finally { savingComment.value = false }
}

const pendingPrefs = ref(null)
const savingPrefs = ref(false)
const savePreferences = async () => {
  try {
    savingPrefs.value = true
    const prefs = pendingPrefs.value || commPrefs.value || {}
    const res = await crmStore.saveLeadCommunication({ leadId: props.selectedLead.id, ...prefs })
    if (res && res.code === 0) {
      commPrefs.value = res.data
      mainStore.setSnackbar({ title: 'Communication preferences saved', type: 'success' })
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to save preferences', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to save preferences', type: 'error' })
  } finally { savingPrefs.value = false }
}
</script>

<style scoped>
.title {
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 48px);
}
.custom-tabs {
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.custom-tabs .v-tab {
  color: inherit !important;
}
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.cust-lbl {
  
  font-weight: bold;
  font-size: 14px;
}
.value-text {
  
  font-weight: 400;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor; /* takes chip text color */
  margin-right: 6px;
  color: white;
}
.key-text {
  
  font-weight: 400;
  font-style: Regular;
  font-size: 14px;
}
.cust-lbl {
  
  font-weight: 700;
  font-style: Bold;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}
.input-bordered :deep(.v-field) {
  border: 1px solid rgb(var(--v-theme-outline)) !important;
  border-radius: 8px !important;
  background-color: rgb(var(--v-theme-surface)) !important;
  min-height: 40px;
  font-size: 14px;
  
}
.assigned-avatars {
  gap: 0;
}
.assigned-avatar {
  display: inline-flex;
  margin-left: -8px;
}
.assigned-avatar:first-child {
  margin-left: 0;
}

.automation-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 22px;
}

.automation-pill {
  max-width: 160px;
  background-color: #E4EEFF;
  border-color: #0061FB;
  color: #0061FB;
}

.automation-pill :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.automation-pill--overflow {
  font-weight: 600;
}

.automation-placeholder {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.automation-tooltip {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

:deep(.automation-tooltip-content) {
  background: #ffffff !important;
  color: rgba(0, 0, 0, 0.87) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.automation-log-table :deep(tbody tr) {
  height: 44px;
  transition: background-color 0.15s ease;
}

.automation-log-table :deep(tbody tr:hover) {
  background: #f5f5f5 !important;
}

.automation-log-table :deep(tbody td) {
  padding: 0 10px !important;
  font-size: 13px;
  vertical-align: middle !important;
}

.automation-log-table :deep(tbody tr:nth-child(2n)) {
  background: #fcfcfc;
}

.automation-log-table :deep(table) {
  border-collapse: collapse !important;
  width: 100%;
}

.automation-log-table :deep(th),
.automation-log-table :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.automation-log-table :deep(.v-table__wrapper) {
  border: none !important;
}
</style>
