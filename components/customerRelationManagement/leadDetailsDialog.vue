<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1300px" persistent :z-index="11000">
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header: title row + tabs + divider -->
        <div class="lead-dialog-header flex-shrink-0">
          <div class="pa-4 pb-0 d-flex justify-space-between align-center">
            <h3 class="title ml-4" style="font-size: 20px;">{{ leadTitle }}</h3>
            <v-btn flat icon size="32" @click="onClose">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>

          <div class="lead-dialog-header-tabs px-4">
            <v-tabs
              v-model="tab"
              class="custom-tabs"
              hide-slider
              density="comfortable"
              show-arrows
            >
            <v-tab value="lead-info" class="tab-text">
              <img
                src="@/assets/icons/crm/info.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">Lead Information</span>
            </v-tab>

            <v-tab value="treatment" class="tab-text">
              <img
                src="@/assets/icons/crm/treatment.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">Treatment Interest</span>
            </v-tab>

            <v-tab value="communication" class="tab-text">
              <img
                src="@/assets/icons/crm/communication.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">Communication Tracking / Log</span>
            </v-tab>

            <v-tab value="whatsapp" class="tab-text">
              <img
                src="@/assets/icons/crm/WhatsAppTimeline.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">WhatsApp Timeline</span>
            </v-tab>

            <v-tab value="automation" class="tab-text">
              <img
                src="@/assets/icons/crm/settings.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">Flossly Automation</span>
            </v-tab>

            <v-tab value="my-automations" class="tab-text">
              <img
                src="@/assets/icons/crm/settings.svg"
                width="26"
                height="26"
                alt=""
              />
              <span class="tab-label">My Automations</span>
            </v-tab>

            <v-tab value="automation-log" class="tab-text">
              <v-icon class="tab-leading-icon" size="26">mdi-history</v-icon>
              <span class="tab-label">Automation History</span>
            </v-tab>
            </v-tabs>
          </div>
        </div>

        <!-- Scrollable body -->
        <div class="flex-grow-1 px-4 py-2" style="overflow-y: auto">
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
                      formatDateTime(selectedLead.inquiryDate)
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

                  <!-- Chatbot chat history -->
                  <v-col v-if="chatHistory.length" cols="12">
                    <label class="cust-lbl">Chatbot Conversation History</label>
                    <div class="chatbot-note mt-3 pa-3 rounded-lg">
                      <div class="d-flex align-center mb-2 gap-2">
                        <v-icon size="16" color="#0061FB">mdi-robot-outline</v-icon>
                        <span class="chatbot-note-date text-caption text-medium-emphasis">Chatbot Session</span>
                      </div>
                      <div
                        v-for="(msg, i) in chatHistory"
                        :key="i"
                        class="chatbot-message-line"
                        :class="msg.role === 'user' ? 'user-line' : 'bot-line'"
                      >
                        <strong>{{ msg.role === 'user' ? 'User' : 'Bot' }}:</strong> {{ msg.message }}
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="treatment">
              <div class="pa-6">
                <CustomerRelationManagementTreatmentIntrest
                  v-if="tab === 'treatment'"
                  :selectedTreatment="selectedTreatment"
                  @save="onTreatmentSave"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="communication">
              <div class="pa-6">
                <CustomerRelationManagementCommunicationLog
                  v-if="tab === 'communication'"
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
                  v-if="tab === 'whatsapp'"
                  :lead-id="selectedLead?.id"
                  :lead-name="displayLeadName"
                  :lead-avatar="selectedLead?.photo"
                  :connected="whatsappEnabled"
                  :whatsapp-auto-reply-enabled="whatsappAutoReplyEnabled"
                  :lead-auto-reply-enabled="selectedLead?.autoReplyEnabled !== false"
                />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="automation">
              <div class="pa-6">
                <CustomerRelationManagementAutomation
                  v-if="tab === 'automation'"
                  :key="`automation-${selectedLead?.id || 'none'}`"
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
                  v-if="tab === 'my-automations'"
                  :key="`my-automations-${selectedLead?.id || 'none'}`"
                  :lead-id="selectedLead?.id"
                  :lead="selectedLead"
                  :include-defaults="false"
                  :whatsapp-enabled="whatsappEnabled"
                  :whatsapp-requires-templates="whatsappRequiresTemplates"
                  :disable-toggle="false"
                  :show-sent-status-column="true"
                  :show-resend-action="true"
                  @go-to-automations="goToAutomations"
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
                  <template #item.action="{ item }">
                    <v-btn
                      v-if="item.key"
                      icon
                      variant="text"
                      size="small"
                      :loading="previewLoadingKey === `${item.key}::${item.sentAt}`"
                      @click="openAutomationPreview(item)"
                    >
                      <img src="@/assets/icons/view.svg" width="20" height="20" alt="Preview" />
                    </v-btn>
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

    <CustomerRelationManagementAutomationPreviewDialog
      v-model="previewDialog"
      :title="previewData?.name"
      :subject="previewData?.subject || ''"
      :email-html="previewData?.html || ''"
      :attachments="previewData?.attachments || []"
      :is-whats-app="previewData?.type === 'WhatsApp'"
      :whatsapp-text="previewData?.message || ''"
    />
  </div>
</template>

<script setup>
import { formatDateOnly, formatDateTime } from "@/lib/dateFormatter";
import { getLeadDisplayName } from "@/lib/normalizers/lead";
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'
import CustomerRelationManagementChatTimeline from "@/components/customerRelationManagement/chatTimeline.vue";

const props = defineProps({
  modelValue: Boolean,
  selectedLead: Object,
  initialTab: { type: String, default: null },
});
const emit = defineEmits(['close','update:modelValue'])
const router = useRouter()
const onClose = () => { emit('update:modelValue', false); emit('close') }
const goToAutomations = () => { onClose(); router.push('/crm/automations') }
const tab = ref(props.initialTab || "lead-info");
const crmStore = useCrmStore()
const mainStore = useMainStore()
const whatsappEnabled = ref(true) // optimistic: show chat immediately, corrected by status check
const whatsappRequiresTemplates = ref(false)
const whatsappAutoReplyEnabled = ref(false)
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

const loadAutoReplySettings = async () => {
  try {
    const res = await crmStore.getAutoReplySettings()
    if (res?.code === 0) {
      whatsappAutoReplyEnabled.value = !!res.data?.whatsappAutoReplyEnabled
    }
  } catch {}
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
const treatmentLoadedLeadId = ref(null)
const communicationLoadedLeadId = ref(null)
const automationLogHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Automation', key: 'name', sortable: false },
  { title: 'Message Sent', key: 'sentAt', width: '200px', sortable: false },
  { title: 'Status', key: 'logStatus', width: '110px', sortable: false },
  { title: 'Action', key: 'action', width: '70px', sortable: false },
]

const previewDialog = ref(false)
const previewData = ref(null)
const previewLoadingKey = ref('')

const openAutomationPreview = async (item) => {
  const leadId = props.selectedLead?.id
  if (!leadId || !item?.key) return
  const loadKey = `${item.key}::${item.sentAt}`
  previewLoadingKey.value = loadKey
  try {
    const res = await crmStore.getLeadAutomationPreview(leadId, item.key)
    if (res?.code === 0) {
      previewData.value = res.data
      previewDialog.value = true
    }
  } finally {
    previewLoadingKey.value = ''
  }
}

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

const loadLeadTreatment = async (leadId, { force = false } = {}) => {
  if (!leadId) return
  if (!force && treatmentLoadedLeadId.value === Number(leadId)) return
  try {
    const res = await crmStore.getLeadTreatment(leadId)
    if (res && res.code === 0) {
      selectedTreatment.value = res.data || {}
      treatmentLoadedLeadId.value = Number(leadId)
    }
  } catch {}
}

const loadLeadCommunicationPrefs = async (leadId, { force = false } = {}) => {
  if (!leadId) return
  if (!force && communicationLoadedLeadId.value === Number(leadId)) return
  try {
    const comm = await crmStore.getLeadCommunication(leadId)
    if (comm && comm.code === 0) {
      commPrefs.value = comm.data || {}
      communicationLoadedLeadId.value = Number(leadId)
    }
  } catch {}
}

const refreshLeadAutomationState = async ({ forceRows = false } = {}) => {
  const leadId = Number(props.selectedLead?.id || 0)
  if (!leadId) return
  if (forceRows) {
    await crmStore.fetchLeadAutomations(leadId, { force: true })
  }
  if (tab.value === 'automation-log') {
    await loadAutomationLog(leadId)
  }
}

const onAutomationsUpdated = async (event) => {
  const leadId = Number(props.selectedLead?.id || 0)
  if (!leadId) return
  const updatedLeadIds = Array.isArray(event?.detail?.leadIds)
    ? event.detail.leadIds.map((id) => Number(id || 0)).filter(Boolean)
    : []
  const groupsChanged = event?.detail?.groupsChanged === true
  if (!groupsChanged && updatedLeadIds.length && !updatedLeadIds.includes(leadId)) return
  await refreshLeadAutomationState({ forceRows: true })
}

onMounted(async () => {
  loadWhatsAppAvailability()
  loadAutoReplySettings()
  if (typeof window !== 'undefined') {
    window.addEventListener('crm-automations-updated', onAutomationsUpdated)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('crm-automations-updated', onAutomationsUpdated)
  }
})

watch(
  () => props.selectedLead?.id,
  async (lead) => {
    if (!lead) return
    automationLogRows.value = []
    selectedTreatment.value = {}
    commPrefs.value = {}
    pendingPrefs.value = null
    treatmentLoadedLeadId.value = null
    communicationLoadedLeadId.value = null
    await refreshLeadAutomationState({ forceRows: true })
    if (tab.value === 'treatment') await loadLeadTreatment(lead)
    if (tab.value === 'communication') await loadLeadCommunicationPrefs(lead)
  },
  { immediate: true }
)

watch(tab, async (val) => {
  const leadId = Number(props.selectedLead?.id || 0)
  if (!leadId) return
  if (val === 'treatment') {
    await loadLeadTreatment(leadId)
  }
  if (val === 'communication') {
    await loadLeadCommunicationPrefs(leadId)
  }
  if (val === 'automation-log') {
    automationLogPage.value = 1
    loadAutomationLog(leadId)
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

const chatHistory = computed(() => {
  const h = props.selectedLead?.rawData?.chatHistory
  return Array.isArray(h) ? h : []
})

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

.lead-dialog-header {
  background-color: rgb(var(--v-theme-surface));
  /* Visible on light surfaces; theme outline can match surface and disappear */
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.lead-dialog-header-tabs {
  padding-top: 21px;
  padding-bottom: 21px;
}

.custom-tabs {
  --lead-tab-accent: #ff7c00;
  --lead-tab-text: #1e1e1e;
  --lead-tab-text-on-accent: #ffffff;
  font-family: 'Inter', sans-serif;
  max-width: 100%;
  background: transparent !important;
}

.custom-tabs :deep(.v-slide-group__prev),
.custom-tabs :deep(.v-slide-group__next) {
  min-width: 28px;
  color: #0061FB;
  opacity: 0.8;
}

.custom-tabs :deep(.v-slide-group__prev:hover),
.custom-tabs :deep(.v-slide-group__next:hover) {
  opacity: 1;
}

.custom-tabs :deep(.v-slide-group__content) {
  gap: 10px;
  align-items: stretch;
}

.custom-tabs :deep(.v-slide-group__container) {
  contain: none;
}

.custom-tabs :deep(.v-tab) {
  flex: 0 1 auto;
  min-width: 0;
  min-height: 42px;
  height: auto;
  border-radius: 28px;
  padding: 8px clamp(8px, 2vw, 16px);
  margin: 0;
  text-transform: none;
  letter-spacing: 0;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 130%;
  border: 1px solid #DBDBDB !important;
  box-shadow: none !important;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.custom-tabs :deep(.v-tab:not(.v-tab--selected)) {
  background-color: transparent !important;
}

.custom-tabs :deep(.v-tab .v-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 26px;
}

/* Remove Vuetify hover/focus overlay on selected pill (avoids double “box” on orange) */
.custom-tabs :deep(.v-tab.v-tab--selected .v-btn__overlay) {
  opacity: 0 !important;
}

.custom-tabs :deep(.v-tab.v-tab--selected:focus-visible) {
  outline: none;
}

.custom-tabs :deep(.v-tab.v-tab--selected) {
  background-color: #0061FB1A !important;
  color: var(--lead-tab-text-on-accent) !important;
  border: 1px solid #0061FB !important;
}

.custom-tabs :deep(.tab-label) {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0;
  color: var(--lead-tab-text);
  white-space: normal;
  text-align: center;
}

.custom-tabs :deep(.v-tab.v-tab--selected .tab-label) {
  color: #1E1E1E !important;
}

.custom-tabs :deep(.tab-leading-icon) {
  flex-shrink: 0;
  color: rgba(30, 30, 30, 0.55) !important;
}

.custom-tabs :deep(.v-tab.v-tab--selected .tab-leading-icon) {
  color: var(--lead-tab-text-on-accent) !important;
}

@media (max-width: 959px) {
  .custom-tabs :deep(.v-slide-group__content) {
    flex-wrap: wrap;
  }
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

.chatbot-note {
  background: #f0f6ff;
  border: 1px solid #c7deff;
}

.chatbot-note-date {
  font-size: 11px;
}

.chatbot-message-line {
  font-size: 13px;
  padding: 2px 0;
  white-space: pre-wrap;
}

.bot-line {
  color: #0061FB;
}

.user-line {
  color: #1e1e1e;
}
</style>
