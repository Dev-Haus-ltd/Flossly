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

      <!-- List View (child) -->
      <CustomerRelationManagementListView
        v-if="leads.length"
        :leads="filteredLeads"
        :headers="headers"
        :search="search"
        :leadSources="leadSources"
        :treatmentSources="treatmentSources"
        :users="userList"
        @select="onSelect"
        @delete="onDeleteSelected"
      />

      <!-- Sidebar drawer for add -->
      <CustomerRelationManagementAddNewLead
        v-model="addLeadDrawer"
        :lead-sources="leadSources"
        :treatment-sources="treatmentSources"
        :staff-list="userList"
        @close="addLeadDrawer = false"
        @success="handleSuccess"
      />
    </div>
  </v-sheet>
</template>

<script setup>
import crmService from "@/services/crmService";
const userStore = useUserStore();
const authStore = useAuthStore();
const userList = ref([]);
const addLeadDrawer = ref(false);


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

const leads = ref([
  {
    id: 1,
    alert: "🔥",
    name: "John Doe",
    email: "john@demo.com",
    telephone: "1234567890",
    inquiryDate: "2025-09-01",
    leadSource: { id: 1, name: "Website" },
    leadStatus: "New",
    treatment: { id: 1, name: "Consultation" },
    assigned: [
      { id: 1, fullName: "john doe" },
      { id: 2, fullName: "Usama Naeem" },
    ],
    followUpDate: "2025-09-15",
    comments: "Interested in product A",
  },
  {
    id: 2,
    alert: "🔥",
    name: "Jane Smith",
    email: "jane@demo.com",
    telephone: "9876543210",
    inquiryDate: "2025-09-05",
    leadSource: { id: 2, name: "Referral" },
    leadStatus: "In Progress",
    treatment: { id: 2, name: "Demo" },
    assigned: [
      { id: 1, fullName: "Bob" },
      { id: 2, fullName: "john" },
    ],
    followUpDate: "2025-09-18",
    comments: "Asked for discount",
  },
]);

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
const filteredLeads = computed(() => {
  const q = (search.value || "").toLowerCase();
  const f = activeFilters.value || {};
  return leads.value.filter((l) => {
    const matchesText = (l.name || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q) || (l.telephone || "").includes(q);
    if (!matchesText) return false;
    if (f.inquiryDate) {
      const d = new Date(l.inquiryDate);
      const fd = new Date(f.inquiryDate);
      if (d.toDateString() !== fd.toDateString()) return false;
    }
    if (f.leadSourceId) {
      const srcId = (l.leadSource && l.leadSource.id) ? l.leadSource.id : null;
      if (String(srcId) !== String(f.leadSourceId)) return false;
    }
    if (f.leadStatus) {
      if (String((l.leadStatus || "")).toLowerCase() !== String(f.leadStatus).toLowerCase()) return false;
    }
    if (f.treatmentId) {
      const trId = (l.treatment && l.treatment.id) ? l.treatment.id : null;
      if (String(trId) !== String(f.treatmentId)) return false;
    }
    return true;
  });
});

const activeFilters = ref({});
const onLeadsFilterUpdate = (filters) => {
  activeFilters.value = filters || {};
};

const onSelect = (selection) => {
  if (selection === "all") {
    console.log("all");
  } else {
    console.log("Selected:", selection);
  }
};
onMounted(() => {
  getUsers();
  initLeads();
  checkConnection();
  initOptions();
});
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) userList.value = res.data;
  });
};
const initOptions = async () => {
  try {
    const [src, tr] = await Promise.all([
      crmService.listOptions('lead_source'),
      crmService.listOptions('treatment'),
    ])
    if (src?.code === 0) leadSources.value = (src.data || []).map(o => ({ id: o.id, name: o.name }))
    if (tr?.code === 0) treatmentSources.value = (tr.data || []).map(o => ({ id: o.id, name: o.name }))
  } catch (e) {}
}
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
const initLeads = async () => {
  if (route.query.meta === "connected") {
    try {
      await crmService.fetchLeadsNow();
    } catch (e) {}
  }
  // Show all leads from our database (which also stores Meta imports)
  const res = await crmService.listLeads();
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
    }));
  }
};

const integrateMeta = async () => {
  const res = await crmService.startMetaAuth();
  if (res && res.code === 0 && res.data?.url) {
    window.location.href = res.data.url;
  }
};

const isConnected = ref(false);
const connection = ref({ count: 0, pages: [], lastConnectedAt: null });
const checkConnection = async () => {
  try {
    const res = await crmService.connectionStatus();
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
    await crmService.fetchLeadsNow();
    await initLeads();
  } catch (e) {}
};

const onDeleteSelected = async (ids) => {
  try {
    const res = await crmService.deleteLeads(ids)
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
</style>
