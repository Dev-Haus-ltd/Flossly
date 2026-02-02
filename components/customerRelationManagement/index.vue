<template>
  <v-sheet 
  color="background"

  >
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>
    <div class="mt-5 px-5">
      <v-row class="stat-row" align="stretch">
        <v-col style="flex: 1 1 0;" v-for="(stat, i) in leadStats" :key="i">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :value-color="stat.valueColor"
            :uid="i"
            hide-chip
          />
        </v-col>
      </v-row>
    </div>
    <div class="mt-5 px-5">
      <div class="d-flex align-center mb-2" style="flex-wrap: nowrap; justify-content: space-between; overflow-x: auto;">
        <!-- Left: Search + Filters -->
        <div class="d-inline-flex align-center py-1" style="flex-wrap: nowrap; gap: 8px;">
          <div style="width: 150px">
            <v-text-field
              v-model="search"
              placeholder="Search"
              append-inner-icon="mdi-magnify"
              clearable
              variant="solo"
              :elevation="0"
              density="compact"
              hide-details
              bg-color="#FAFAFA"
              flat
              class="custom-search"
            />
          </div>
          <CustomerRelationManagementFilterMenu
            :leadSources="leadSources"
            :treatmentSources="treatmentSources"
            @update:filters="onLeadsFilterUpdate"
          />
        </div>

        <!-- Right: Connection Controls -->
        <div class="d-inline-flex ml-auto" style="flex-wrap: nowrap; gap: 12px;">
          <v-btn
            :color="isWhatsAppConnected ? 'success' : 'primary'"
            :variant="isWhatsAppConnected ? 'tonal' : 'flat'"
            rounded="lg"
            class="add-task-btn"
            @click="openWhatsAppDialog"
          >
            <template #prepend>
              <v-icon size="18">mdi-whatsapp</v-icon>
            </template>
            {{ isWhatsAppConnected ? 'WhatsApp Connected' : 'Connect WhatsApp' }}
          </v-btn>

          <v-menu
            v-if="isConnected"
            v-model="metaMenu"
            location="bottom end"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="success"
                variant="flat"
                rounded="lg"
                class="add-task-btn"
              >
                <template #prepend>
                  <v-icon size="18">mdi-link-variant</v-icon>
                </template>
                Reconnect Meta
                <v-icon size="16" class="ml-1">mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="onReconnectMeta">
                <v-list-item-title>Reconnect Meta</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDisconnect = true">
                <v-list-item-title>Disconnect Meta</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            v-else
            color="primary"
            variant="flat"
            rounded="lg"
            class="add-task-btn"
            @click="integrateMeta"
          >
            <template #prepend>
              <v-icon size="18">mdi-link-variant</v-icon>
            </template>
            Connect Meta
          </v-btn>

          <v-btn
            :color="isConnected ? 'success' : undefined"
            :variant="isConnected ? 'tonal' : 'text'"
            class="add-task-btn"
            @click="openMetaHealth"
          >
            <template #prepend>
              <v-icon size="18">mdi-heart-pulse</v-icon>
            </template>
            Meta Health
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="add-task-btn"
            @click="onConnectChatbot"
          >
            <template #prepend>
              <v-icon size="18">mdi-robot-outline</v-icon>
            </template>
            Connect to Chatbot
          </v-btn>

          <v-btn
            color="secondary"
            variant="flat"
            rounded="lg"
            class="add-task-btn mx-2"
            @click="bulkLeadUploadDialog = true"
          >
            <template #prepend>
              <v-icon size="18">mdi-upload</v-icon>
            </template>
            Upload bulk leads
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="add-task-btn"
            @click="handleAddLeadClick"
          >
            <template #prepend>
              <v-icon size="18">mdi-plus-circle-outline</v-icon>
            </template>
            Add New Lead
          </v-btn>

        </div>
      </div>

      <!-- List View (child) -->
      <CustomerRelationManagementListView
        v-if="!isLoading && leads.length"
        :leads="filteredLeads"
        :headers="headers"
        :search="search"
        :leadSources="leadSources"
        :treatmentSources="treatmentSources"
        :users="userList"
        @select="onSelect"
        @delete="onDeleteSelected"
        @book="onBookLeads"
      />

      <div v-else-if="!isLoading && !leads.length" class="d-flex justify-center mt-5">
        <p class="mt-7">No leads found.</p>
      </div>

   

    

      <!-- Sidebar drawer for add - Always available -->
      <ClientOnly>
        <!-- Add New Lead Panel - Right Side -->
        <CustomerRelationManagementAddNewLead
          v-model="addLeadDrawer"
          :lead-sources="leadSources"
          :treatment-sources="treatmentSources"
          :staff-list="userList"
          @close="addLeadDrawer = false"
          @success="handleSuccess"
        />
        <template v-if="!isLoading && leadSources.length > 0 && userList.length > 0">
          <!-- Add New Lead Panel - Right Side -->
          <CustomerRelationManagementAddNewLead
            v-model="addLeadDrawer"
            :lead-sources="leadSources"
            :treatment-sources="treatmentSources"
            :staff-list="userList"
            @close="addLeadDrawer = false"
            @success="handleSuccess"
          />
          <CustomerRelationManagementBulkLeadUploadDialog
            v-model="bulkLeadUploadDialog"
            :lead-sources="leadSources"
            :treatment-sources="treatmentSources"
            :users="userList"
            @close="bulkLeadUploadDialog = false"
            @onUpdate="handleBulkUploadComplete"
          />
          <AddAppointment
            v-model="showBookingDrawer"
            :initial-date="bookingInitialDate"
            :initial-time="bookingInitialTime"
            :initial-practitioner="bookingInitialPractitioner"
            :practitioner-options="bookingPractitionerOptions"
            :patient-options="bookingPatientOptions"
            :preselected-patient="bookingLeadName"
            :preselected-patient-id="bookingLeadPatientId"
            @save="onSaveBookedAppointment"
          />
        </template>
      </ClientOnly>
      <v-dialog v-model="metaErrorDialog" max-width="520">
        <v-card class="pa-4">
          <v-card-title class="text-subtitle-1 pa-0 mb-2">Meta connection failed</v-card-title>
          <v-card-text class="pa-0">
            {{ metaErrorMessage }}
          </v-card-text>
          <v-card-actions class="pa-0 mt-4">
            <v-spacer />
            <v-btn color="primary" variant="flat" @click="metaErrorDialog = false">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="confirmDisconnect" max-width="520">
        <v-card class="pa-4">
          <v-card-title class="text-subtitle-1 pa-0 mb-2">Disconnect Meta</v-card-title>
          <v-card-text class="pa-0">
            Disconnecting will stop new Meta leads from syncing to this CRM. You can reconnect anytime.
          </v-card-text>
          <v-card-actions class="pa-0 mt-4">
            <v-spacer />
            <v-btn variant="text" @click="confirmDisconnect = false">Cancel</v-btn>
            <v-btn color="error" variant="flat" :loading="disconnecting" @click="disconnectMeta">
              Disconnect
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <CustomerRelationManagementMetaHealthDialog
        v-model="metaHealthDialog"
        :loading="metaHealthLoading"
        :data="metaHealthData"
      />

      <v-dialog v-model="whatsAppDialog" max-width="640">
        <v-card class="pa-4">
          <v-card-title class="text-subtitle-1 pa-0 mb-2 d-flex justify-space-between align-center">
            <span>Connect WhatsApp</span>
            <v-chip v-if="isWhatsAppConnected" color="success" size="small" label>Connected</v-chip>
          </v-card-title>
          <v-card-text class="pa-0">
            <p class="text-caption mb-4">
              Connect your WhatsApp Business account via Meta embedded signup.
              This will link your WABA and phone number to this organisation.
            </p>
            <v-alert
              v-if="whatsAppStatus.phoneNumberId"
              type="info"
              variant="tonal"
              class="mb-3"
            >
              Connected phone: {{ whatsAppStatus.displayPhoneNumber || whatsAppStatus.phoneNumberId }}
              <span v-if="whatsAppStatus.verifiedName"> ({{ whatsAppStatus.verifiedName }})</span>
            </v-alert>
          </v-card-text>
          <v-card-actions class="pa-0 mt-4">
            <v-spacer />
            <v-btn variant="text" @click="whatsAppDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" :loading="whatsAppSaving" @click="connectWhatsAppEmbedded">
              Connect via Meta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-sheet>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import AddAppointment from '@/components/diary/addAppointment.vue'
import CustomerRelationManagementMetaHealthDialog from '@/components/customerRelationManagement/metaHealthDialog.vue'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
import { useCrmStore } from '@/stores/crm'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
const crmStore = useCrmStore();
const userStore = useUserStore();
const { users: storeUsers } = storeToRefs(userStore);
const userList = computed(() => storeUsers.value || []);
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const diaryStore = useDiaryStore();
const mainStore = useMainStore();
const addLeadDrawer = ref(false);
const bulkLeadUploadDialog = ref(false);
const metaMenu = ref(false);
const confirmDisconnect = ref(false);
const disconnecting = ref(false);
const metaErrorDialog = ref(false);
const metaErrorMessage = ref('');
const metaHealthDialog = ref(false);
const metaHealthLoading = ref(false);
const metaHealthData = ref(null);
const whatsAppDialog = ref(false);
const whatsAppSaving = ref(false);
const isWhatsAppConnected = ref(false);
const whatsAppStatus = reactive({
  phoneNumberId: '',
  wabaId: '',
  displayPhoneNumber: '',
  verifiedName: '',
});
const isLoading = ref(false);
const showBookingDrawer = ref(false);
const bookingLead = ref(null);
const bookingDateInput = ref(new Date().toISOString().slice(0,10));
const bookingTime = ref('');
const bookingDentists = ref([]);
const bookingInitialPractitioner = ref('');
const bookingPatientOptions = ref([]);
const pad = (n) => String(n).padStart(2, '0');
const nextSlotTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) now.setMinutes(minutes + (15 - remainder));
  now.setSeconds(0, 0);
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
bookingTime.value = nextSlotTime();
const bookingPractitionerOptions = computed(() =>
  bookingDentists.value
    .map((d) => d.name || d.fullName || '')
    .filter((name) => !!name)
);
const bookingInitialDate = computed(() => bookingDateInput.value);
const bookingInitialTime = computed(() => bookingTime.value);
const bookingLeadName = computed(() => bookingLead.value?.name || '');
const bookingLeadPatientId = computed(() => bookingLead.value?.patientId || null);
watch(bookingPractitionerOptions, (opts) => {
  if (!bookingInitialPractitioner.value && opts.length) {
    bookingInitialPractitioner.value = opts[0];
  }
});


const leadStats = computed(() => {
  const activeLeads = leads.value.filter((l) => !l.softDeleted);
  const total = activeLeads.length;
  const byStatus = (s) =>
    activeLeads.filter((l) => (l.leadStatus || "").toLowerCase() === s).length;
  return [
    {
      icon: "https://cdn.lordicon.com/asyunleq.json",
      label: "Total Lead",
      value: total,
      valueColor: 'on-surface'
    },
    {
      icon: "https://cdn.lordicon.com/kphwxuxr.json",
      label: "New",
      value: byStatus("new"),
      valueColor: 'success'
    },
    {
      icon: "https://cdn.lordicon.com/qlpudrww.json",
      label: "Converted",
      value: byStatus("converted"),
      valueColor: 'primary'
    },
    {
      icon: "https://cdn.lordicon.com/excswhey.json",
      label: "Contacted",
      value: byStatus("contacted"),
      valueColor: 'warning'
    },
    {
      icon: "https://cdn.lordicon.com/tzynxkwl.json",
      label: "Lost",
      value: byStatus("lost"),
      valueColor: 'error'
    },
  ];
});
const search = ref("");

const leads = ref([]);

const headers = [
  { key: "alert", title: "Alert", width: 70 },
  { key: "name", title: "Name", width: 200 },
  { key: "email", title: "Email", width: 220 },
  { key: "telephone", title: "Telephone", width: 150 },
  { key: "inquiryDate", title: "Inquiry Date", width: 160 },
  { key: "leadSource", title: "Lead Source", width: 160 },
  { key: "leadStatus", title: "Lead Status", width: 160 },
  { key: "treatment", title: "Treatment", width: 160 },
  { key: "assigned", title: "Assigned", width: 160 },
  { key: "followUpDate", title: "Follow-up Date", width: 160 },
  { key: "comments", title: "Comments", width: 200 },
];
const leadSources = ref([]);
const treatmentSources = ref([]);
const filteredLeads = computed(() => leads.value)

const activeFilters = ref({});
const onLeadsFilterUpdate = async (filters) => {
  activeFilters.value = filters || {};
  await fetchLeads(activeFilters.value)
};

const openWhatsAppDialog = () => {
  whatsAppDialog.value = true;
};

const loadWhatsAppConfig = async () => {
  try {
    const res = await crmStore.getWhatsAppConfig();
    if (res?.code === 0 && res.data) {
      const data = res.data;
      whatsAppStatus.phoneNumberId = data.phoneNumberId || '';
      whatsAppStatus.wabaId = data.wabaId || '';
      whatsAppStatus.displayPhoneNumber = data.displayPhoneNumber || '';
      whatsAppStatus.verifiedName = data.verifiedName || '';
      isWhatsAppConnected.value = !!data.hasToken;
    } else {
      whatsAppStatus.phoneNumberId = '';
      whatsAppStatus.wabaId = '';
      whatsAppStatus.displayPhoneNumber = '';
      whatsAppStatus.verifiedName = '';
      isWhatsAppConnected.value = false;
    }
  } catch (e) {
    whatsAppStatus.phoneNumberId = '';
    whatsAppStatus.wabaId = '';
    whatsAppStatus.displayPhoneNumber = '';
    whatsAppStatus.verifiedName = '';
    isWhatsAppConnected.value = false;
  }
};

const loadFacebookSdk = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.FB) return resolve(window.FB)
    const scriptId = 'facebook-jssdk'
    if (document.getElementById(scriptId)) {
      const check = () => (window.FB ? resolve(window.FB) : setTimeout(check, 50))
      check()
      return
    }
    const js = document.createElement('script')
    js.id = scriptId
    js.src = 'https://connect.facebook.net/en_US/sdk.js'
    js.async = true
    js.defer = true
    js.onerror = reject
    document.body.appendChild(js)
    window.fbAsyncInit = () => resolve(window.FB)
  })
}

const connectWhatsAppEmbedded = async () => {
  const config = useRuntimeConfig()
  const appId = config.public?.META_APP_ID || config.public?.META_APPID || ''
  const configId = config.public?.META_WA_EMBEDDED_CONFIG_ID || ''

  if (!appId || !configId) {
    mainStore?.setSnackbar?.({ title: 'Meta app config is missing', type: 'error' })
    return
  }

  try {
    whatsAppSaving.value = true
    const fb = await loadFacebookSdk()
    fb.init({ appId, xfbml: false, version: 'v24.0' })

    let pending = { wabaId: null, phoneNumberId: null, displayPhoneNumber: null, verifiedName: null }
    const onMessage = (event) => {
      if (!event?.origin?.includes('facebook.com')) return
      const data = event.data || {}
      if (data?.type !== 'WA_EMBEDDED_SIGNUP') return
      if (data?.event === 'FINISH' || data?.event === 'FINISH_ONLY_WABA') {
        pending = {
          wabaId: data?.waba_id || data?.wabaId || pending.wabaId,
          phoneNumberId: data?.phone_number_id || data?.phoneNumberId || pending.phoneNumberId,
          displayPhoneNumber: data?.display_phone_number || data?.displayPhoneNumber || pending.displayPhoneNumber,
          verifiedName: data?.verified_name || data?.verifiedName || pending.verifiedName,
        }
      }
    }
    window.addEventListener('message', onMessage)

    fb.login(async (response) => {
      window.removeEventListener('message', onMessage)
      if (!response?.authResponse) {
        mainStore?.setSnackbar?.({ title: 'Meta login cancelled', type: 'error' })
        return
      }
      const accessToken = response.authResponse.accessToken || null
      const code = response.authResponse.code || null
      const payload = {
        accessToken,
        code,
        wabaId: pending.wabaId,
        phoneNumberId: pending.phoneNumberId,
        displayPhoneNumber: pending.displayPhoneNumber,
        verifiedName: pending.verifiedName,
      }
      const res = await crmStore.completeWhatsAppEmbedded(payload)
      if (res?.code === 0) {
        await loadWhatsAppConfig()
        whatsAppDialog.value = false
        mainStore?.setSnackbar?.({ title: 'WhatsApp connected', type: 'success' })
      } else {
        const msg = res?.error || res?.message || 'Failed to connect WhatsApp'
        mainStore?.setSnackbar?.({ title: msg, type: 'error' })
      }
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
    })
  } catch (e) {
    const msg = e?.message || 'Failed to connect WhatsApp'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    whatsAppSaving.value = false
  }
}

const normalizeMetaMessage = (message) => {
  if (!message) return '';
  const raw = Array.isArray(message) ? message[0] : message;
  try {
    return decodeURIComponent(String(raw));
  } catch (e) {
    return String(raw);
  }
};
const clearMetaQuery = () => {
  const nextQuery = { ...route.query };
  delete nextQuery.meta;
  delete nextQuery.pages;
  delete nextQuery.user;
  delete nextQuery.error;
  delete nextQuery.warning;
  router.replace({ query: nextQuery });
};
const handleMetaQuery = (metaConnected, metaError) => {
  if (metaError) {
    metaErrorMessage.value =
      normalizeMetaMessage(metaError) || 'Meta connection failed. Please try again.';
    metaErrorDialog.value = true;
  } else if (metaConnected && mainStore?.setSnackbar) {
    mainStore.setSnackbar({ title: 'Meta connected successfully', type: 'success' });
  }
  if (metaConnected || metaError) clearMetaQuery();
};

const onSelect = (selection) => {
  if (selection === "all") {
    console.log("all");
  } else {
    console.log("Selected:", selection);
  }
};
onMounted(() => {
  const metaConnected = route.query.meta === "connected";
  const metaError = route.query.error;
  initLeads(metaConnected);
  checkConnection();
  loadWhatsAppConfig();
  initOptions();
  loadBookingDentists();
  loadBookingPatients();
  handleMetaQuery(metaConnected, metaError);
});
onBeforeUnmount(() => {
  stopMetaStream();
});
const initOptions = async () => {
  try {
    const [src, tr] = await Promise.all([
      crmStore.listOptions('lead_source'),
      crmStore.listOptions('treatment'),
    ])
    if (src?.code === 0) leadSources.value = (src.data || []).map(o => ({ id: o.id, name: o.name }))
    if (tr?.code === 0) treatmentSources.value = (tr.data || []).map(o => ({ id: o.id, name: o.name }))
  } catch (e) {}
}

const normalizeDateInput = (value) => {
  if (!value) return bookingDateInput.value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return bookingDateInput.value;
};
const normalizeTimeInput = (value) => {
  if (!value) return bookingTime.value || nextSlotTime();
  if (typeof value === 'string') {
    const [match, hh, mm] = value.trim().match(/^(\d{1,2}):(\d{2})/) || [];
    if (match) return `${pad(Number(hh) % 24)}:${pad(Number(mm) % 60)}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  return bookingTime.value || nextSlotTime();
};
const deriveTimeFromValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const [match, hh, mm] = value.trim().match(/(\d{1,2}):(\d{2})/) || [];
    if (match) return `${pad(Number(hh) % 24)}:${pad(Number(mm) % 60)}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  return null;
};
const loadBookingDentists = async () => {
  try {
    const res = await diaryStore.listDentists(new Date().toISOString().slice(0, 10));
    if (res?.code === 0) {
      bookingDentists.value = (res.data || []).map((d) => ({
        id: d.id,
        name: d.name || d.fullName || `Dentist ${d.id}`,
      }));
    }
  } catch (e) {}
};
const loadBookingPatients = async () => {
  try {
    const res = await diaryStore.listPatients('');
    if (res?.code === 0) {
      bookingPatientOptions.value = (res.data || [])
        .map((p) => ({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        }))
        .filter((p) => p.name);
    }
  } catch (e) {}
};
const matchingDentistName = (lead) => {
  const assignedNames = (lead?.assigned || []).map((a) => a.fullName).filter(Boolean);
  for (const name of assignedNames) {
    if (bookingPractitionerOptions.value.includes(name)) return name;
  }
  return bookingPractitionerOptions.value[0] || '';
};
const onBookLeads = (selection) => {
  const picked = Array.isArray(selection) ? selection : [];
  if (!picked.length) return;
  if (picked.length > 1) {
    mainStore?.setSnackbar?.({ title: 'Select only one lead to book an appointment', type: 'error' });
    return;
  }
  bookingLead.value = picked[0];
  bookingDateInput.value = normalizeDateInput(picked[0]?.followUpDate || new Date());
  bookingTime.value = deriveTimeFromValue(picked[0]?.followUpDate) || nextSlotTime();
  bookingInitialPractitioner.value = matchingDentistName(picked[0]);
  showBookingDrawer.value = true;
};
const onSaveBookedAppointment = async (appt) => {
  if (!bookingLead.value) return;
  const dentistName =
    appt.practitioner ||
    bookingInitialPractitioner.value ||
    bookingPractitionerOptions.value[0];
  const dentist = bookingDentists.value.find(
    (d) => (d.name || d.fullName) === dentistName
  );
  if (!dentist) {
    mainStore?.setSnackbar?.({ title: 'Select a practitioner to continue', type: 'error' });
    showBookingDrawer.value = true;
    return;
  }
  const appointmentDate = normalizeDateInput(appt.date);
  const appointmentTime = normalizeTimeInput(appt.time);
  const payload = {
    dentistId: dentist.id,
    patientId: appt.patientId || bookingLeadPatientId.value || null,
    patientName: appt.patient || bookingLeadName.value || bookingLead.value.email || 'CRM Lead',
    date: appointmentDate,
    time: appointmentTime,
    duration: appt.duration || 15,
    treatmentId: appt.treatmentId || null,
    treatmentName: appt.treatmentName || bookingLead.value?.treatment?.name || null,
    status: appt.status || 'Pending',
    notes: appt.notes || bookingLead.value?.comments || '',
  };
  try {
    const res = await diaryStore.createAppointment(payload);
    if (res?.code === 0) {
      try {
        await crmStore.updateLead({ id: bookingLead.value.id, leadStatus: 'Converted' });
        const existing = leads.value.find((l) => l.id === bookingLead.value.id);
        if (existing) existing.leadStatus = 'Converted';
      } catch (e) {}
      mainStore?.setSnackbar?.({ title: 'Appointment booked and lead converted', type: 'success' });
      bookingLead.value = null;
      bookingInitialPractitioner.value = bookingPractitionerOptions.value[0] || '';
      fetchLeads(activeFilters.value);
    }
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Unable to book appointment';
    mainStore?.setSnackbar?.({ title: msg, type: 'error' });
    showBookingDrawer.value = true;
  }
};
// TODO: this needs to be enhanced. there should be a registered chatbots model in DB to store information of each practice creating chatbot
const onConnectChatbot = async () => {
  authStore.createShortToken().then((res) => {
    if (res.code === 0 && res.data) {
      const config = useRuntimeConfig();
      window.open(
        config.public.CHATBOT_URL + `/botbuilder/auth?token=${res.data}`,
        "_blank"
      );
    }
  });
};

const updateLeads = (newLead) => {
  leads.value.push(newLead);
};

const handleAddLeadClick = () => {
 
  addLeadDrawer.value = true;
};

const resolveLeadSource = (source) => {
  if (source && typeof source === "object") {
    if (source.name) return source;
    const id = source.id ?? source.leadSourceId;
    if (id != null) {
      const match = leadSources.value.find((s) => s.id === id);
      if (match) return match;
    }
  }
  if (typeof source === "number") {
    const match = leadSources.value.find((s) => s.id === source);
    if (match) return match;
    return { id: source, name: String(source) };
  }
  if (typeof source === "string" && source.trim()) {
    const match = leadSources.value.find(
      (s) => s.name?.trim()?.toLowerCase() === source.trim().toLowerCase()
    );
    if (match) return match;
    return { id: null, name: source.trim() };
  }
  return { id: 99, name: "Meta Leadgen" };
};

const handleSuccess = (newLead) => {
  addLeadDrawer.value = false;
  const mapped = {
    id: newLead.id,
    alert: newLead.alert || '',
    name: newLead.name,
    email: newLead.email,
    telephone: newLead.telephone,
    inquiryDate: newLead.inquiryDate,
    rawData: newLead.rawData || null,
    dob: newLead.dob || null,
    occupation: newLead.occupation || "",
    location: newLead.location || "",
    leadSource: resolveLeadSource(newLead.leadSource ?? newLead.leadSourceId),
    metaPage: newLead.pageName || newLead.pageId || '',
    leadStatus: newLead.leadStatus || 'New',
    treatment: newLead.treatment || { id: null, name: '' },
    assigned: newLead.assigned || [],
    followUpDate: newLead.followUpDate || '',
    comments: newLead.comments || '',
    softDeleted: false,
  };
  leads.value.unshift(mapped);
};
const handleBulkUploadComplete = async () => {
  bulkLeadUploadDialog.value = false;
  await fetchLeads(activeFilters.value);
};

const fetchLeads = async (filters = {}) => {
  isLoading.value = true
  try {
    const payload = { ...filters, search: search.value || '', includeArchived: true }
    const res = await crmStore.listLeads(payload)
    if (res && res.code === 0) {
      const mapped = (res.data || []).map((l) => ({
        alert: l.alert || "",
        name: l.name || "",
        email: l.email || "",
        telephone: l.telephone || "",
        inquiryDate: l.inquiryDate || "",
        rawData: l.rawData || null,
        dob: l.dob || null,
        occupation: l.occupation || "",
        location: l.location || "",
        leadSource: l.leadSource?.name ? l.leadSource : { id: 99, name: l.leadSource || "Meta Leadgen" },
        metaPage: l.pageName || l.pageId || "",
        leadStatus: l.leadStatus || "New",
        treatment: l.treatment || { id: null, name: "" },
        assigned: l.assigned || [],
        followUpDate: l.followUpDate || "",
        comments: l.comments || "",
        id: l.id,
        softDeleted: !!l.softDeleted,
      }))
      leads.value = mapped;
    }
  } finally {
    isLoading.value = false
  }
}

const initLeads = async (metaConnected = false) => {
  if (metaConnected) {
    try {
      await crmStore.fetchLeadsNow();
    } catch (e) {}
  }
  await fetchLeads()
};

const integrateMeta = async () => {
  const res = await crmStore.startMetaAuth();
  if (res && res.code === 0 && res.data?.url) {
    window.location.href = res.data.url;
  }
};

const onReconnectMeta = () => {
  metaMenu.value = false;
  integrateMeta();
};

const openMetaHealth = async () => {
  metaHealthDialog.value = true;
  metaHealthLoading.value = true;
  try {
    const res = await crmStore.metaHealth();
    if (res?.code === 0) {
      metaHealthData.value = res.data || null;
    } else {
      metaHealthData.value = { error: res?.error || res?.message || 'Failed to load health status' };
    }
  } catch (e) {
    metaHealthData.value = { error: e?.data?.message || e?.message || 'Failed to load health status' };
  } finally {
    metaHealthLoading.value = false;
  }
};

const isConnected = ref(false);
const connection = ref({ count: 0, pages: [], lastConnectedAt: null });
let leadsPollTimer = null;
let metaEventSource = null;
const startLeadsPolling = () => {
  if (leadsPollTimer) return;
  leadsPollTimer = setInterval(async () => {
    if (!isConnected.value || isLoading.value) return;
    await fetchLeads(activeFilters.value);
  }, 20000);
};
const stopLeadsPolling = () => {
  if (leadsPollTimer) {
    clearInterval(leadsPollTimer);
    leadsPollTimer = null;
  }
};
const startMetaStream = () => {
  if (metaEventSource || typeof window === 'undefined') return;
  if (!('EventSource' in window)) {
    startLeadsPolling();
    return;
  }

  metaEventSource = new EventSource('/api/meta/stream');
  metaEventSource.addEventListener('lead', async () => {
    if (isLoading.value) return;
    await fetchLeads(activeFilters.value);
  });
  metaEventSource.onerror = () => {
    stopMetaStream();
    startLeadsPolling();
  };
};
const stopMetaStream = () => {
  if (metaEventSource) {
    metaEventSource.close();
    metaEventSource = null;
  }
  stopLeadsPolling();
};
const checkConnection = async () => {
  try {
    const res = await crmStore.connectionStatus();
    if (res && res.code === 0) {
      connection.value = res.data || { count: 0, pages: [] };
      isConnected.value = (connection.value.count || 0) > 0;
    }
  } catch (e) {
    isConnected.value = false;
  }
};

const disconnectMeta = async () => {
  try {
    disconnecting.value = true;
    const res = await crmStore.disconnectMeta();
    if (res?.code === 0) {
      await checkConnection();
      mainStore?.setSnackbar?.({ title: 'Meta disconnected', type: 'success' });
    } else {
      const msg = res?.error || res?.message || 'Failed to disconnect Meta';
      mainStore?.setSnackbar?.({ title: msg, type: 'error' });
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to disconnect Meta';
    mainStore?.setSnackbar?.({ title: msg, type: 'error' });
  } finally {
    disconnecting.value = false;
    confirmDisconnect.value = false;
    metaMenu.value = false;
  }
};

watch(search, async () => {
  await fetchLeads(activeFilters.value)
})

const onDeleteSelected = async (ids) => {
  try {
    const res = await crmStore.deleteLeads(ids)
    if (res && res.code === 0) {
      leads.value = leads.value.filter(l => !ids.includes(l.id))
    }
  } catch (e) {}
}

watch(isConnected, (val) => {
  if (val) startMetaStream();
  else stopMetaStream();
});
</script>

<style scoped lang="scss">

.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}
:deep(.v-breadcrumbs) {
  font-weight: 400;
  font-size: 14px;
}

/* Stats Container - Fill available space */
.stats-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 0; /* Allows flex items to shrink below their content size */
}

/* Responsive behavior */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    gap: 8px;
  }
}

/* Loading State - Blank */
.loading-blank {
  min-height: 400px;
  /* Just empty space while loading */
}

</style>
