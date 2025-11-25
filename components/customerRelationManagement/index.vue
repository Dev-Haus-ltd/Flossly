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
      <div class="d-flex justify-space-between align-center mb-4">
        <!-- Left: Search + Filters -->
        <div class="d-flex align-center">
          <div style="width: 150px">
            <v-text-field
              v-model="search"
              placeholder="Search"
              append-inner-icon="mdi-magnify"
              variant="solo"
              density="compact"
              hide-details
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
        <div class="d-flex align-center" style="gap: 12px">
          <div class="d-flex align-center" style="gap: 12px">
  <template v-if="isConnected">
    <v-chip
      color="success"
      size="small"
      variant="flat"
    >
      Meta Connected
    </v-chip>

    <v-btn
      size="small"
      variant="text"
      @click="fetchNow"
      :disabled="!isConnected"
    >
      <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
      Fetch Leads Now
    </v-btn>
  </template>

  <v-btn
    color="primary"
    variant="flat"
    rounded="lg"
    class="add-task-btn"
    @click="integrateMeta"
  >
    <template #prepend>
      <v-icon size="18">mdi-link-variant</v-icon>
    </template>
    {{ isConnected ? 'Reconnect Meta' : 'Integrate Meta' }}
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

        </div>
      </div>

      <!-- Loading State - Blank -->
      <div v-if="isLoading" class="loading-blank">
        <!-- Empty space while loading -->
      </div>

      <!-- List View (child) -->
      <CustomerRelationManagementListView
        v-else-if="!isLoading && leads.length"
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

   

    

      <!-- Sidebar drawer for add - Only render after page loads -->
      <ClientOnly>
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
    </div>
  </v-sheet>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import AddAppointment from '@/components/diary/addAppointment.vue'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
const crmStore = useCrmStore();
const userStore = useUserStore();
const { users: storeUsers } = storeToRefs(userStore);
const userList = computed(() => storeUsers.value || []);
const authStore = useAuthStore();
const diaryStore = useDiaryStore();
const mainStore = useMainStore();
const addLeadDrawer = ref(false);
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
  const total = leads.value.length;
  const byStatus = (s) =>
    leads.value.filter((l) => (l.leadStatus || "").toLowerCase() === s).length;
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

const onSelect = (selection) => {
  if (selection === "all") {
    console.log("all");
  } else {
    console.log("Selected:", selection);
  }
};
onMounted(() => {
  initLeads();
  checkConnection();
  initOptions();
  loadBookingDentists();
  loadBookingPatients();
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

const handleSuccess = (newLead) => {
  addLeadDrawer.value = false;
  const mapped = {
    id: newLead.id,
    alert: newLead.alert || '',
    name: newLead.name,
    email: newLead.email,
    telephone: newLead.telephone,
    inquiryDate: newLead.inquiryDate,
    dob: newLead.dob || null,
    occupation: newLead.occupation || "",
    location: newLead.location || "",
    leadSource: newLead.leadSource || { id: 99, name: 'Meta Leadgen' },
    leadStatus: newLead.leadStatus || 'New',
    treatment: newLead.treatment || { id: null, name: '' },
    assigned: newLead.assigned || [],
    followUpDate: newLead.followUpDate || '',
    comments: newLead.comments || '',
  };
  leads.value.unshift(mapped);
};

const route = useRoute();
const fetchLeads = async (filters = {}) => {
  isLoading.value = true
  try {
    const payload = { ...filters, search: search.value || '' }
    const res = await crmStore.listLeads(payload)
    if (res && res.code === 0) {
      leads.value = (res.data || []).map((l) => ({
        alert: l.alert || "",
        name: l.name || "",
        email: l.email || "",
        telephone: l.telephone || "",
        inquiryDate: l.inquiryDate || "",
        dob: l.dob || null,
        occupation: l.occupation || "",
        location: l.location || "",
        leadSource: l.leadSource?.name ? l.leadSource : { id: 99, name: l.leadSource || "Meta Leadgen" },
        leadStatus: l.leadStatus || "New",
        treatment: l.treatment || { id: null, name: "" },
        assigned: l.assigned || [],
        followUpDate: l.followUpDate || "",
        comments: l.comments || "",
        id: l.id,
      }))
    }
  } finally {
    isLoading.value = false
  }
}

const initLeads = async () => {
  if (route.query.meta === "connected") {
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

const isConnected = ref(false);
const connection = ref({ count: 0, pages: [], lastConnectedAt: null });
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

const fetchNow = async () => {
  try {
    await crmStore.fetchLeadsNow();
    await initLeads();
  } catch (e) {
    isLoading.value = false;
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
