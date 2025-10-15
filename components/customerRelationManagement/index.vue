<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>
    <div class="mt-5 px-5">
      <v-row>
        <v-col cols="12" sm="4"  md="2" v-for="(stat, i) in leadStats" :key="i">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
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

        <!-- Right: Buttons inline -->
        <div class="d-flex align-center">
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            @click="addLeadDrawer = true"
            class="add-task-btn"
          >
            <template #prepend>
              <v-icon size="18">mdi-plus-circle-outline</v-icon>
            </template>
            Add New Lead
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="add-task-btn ml-2"
            @click="onConnectChatbot"
          >
            <template #prepend>
              <v-icon size="18">mdi-robot-outline</v-icon>
            </template>
            Connect to Chatbot
          </v-btn>
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
      />

      <!-- Sidebar drawer for add -->
      <CustomerRelationManagementAddNewLead
        v-model="addLeadDrawer"
        :lead-sources="leadSources"
        :treatment-sources="treatmentSources"
        :staff-list="staffList"
        @close="addLeadDrawer = false"
        @success="handleSuccess"
      />
    </div>
  </div>
</template>

<script setup>
const userStore = useUserStore();
const userList = ref([]);
const addLeadDrawer = ref(false);

const leadStats = ref([
  {
    icon: "https://cdn.lordicon.com/asyunleq.json",
    label: "Total Lead",
    value: 10,
  },
  {
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
    label: "New",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/qlpudrww.json",
    label: "Converted",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/excswhey.json",
    label: "Contacted",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/tzynxkwl.json",
    label: "Lost",
    value: 2,
  },
]);
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
const leadSources = ref([
  { id: 1, name: "Website" },
  { id: 2, name: "Referral" },
  { id: 3, name: "Social Media" },
  { id: 4, name: "Cold Call" },
  { id: 5, name: "Email Campaign" },
  { id: 6, name: "Event / Conference" },
  { id: 7, name: "Advertisement" },
  { id: 8, name: "Partner" },
]);
const treatmentSources = ref([
  { id: 1, name: "Consultation" },
  { id: 2, name: "Demo" },
  { id: 3, name: "Follow-up" },
  { id: 4, name: "Proposal Sent" },
  { id: 5, name: "Negotiation" },
  { id: 6, name: "Trial" },
  { id: 7, name: "Onboarding" },
]);
const filteredLeads = computed(() =>
  leads.value.filter((l) =>
    l.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const onLeadsFilterUpdate = (filters) => {
  console.log("Filters applied:", filters);
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
});
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) userList.value = res.data;
  });
};

const chatbotToken = ref(null);
const onConnectChatbot = async () => {
  try {
    const res = await $fetch('/api/auth/createShortToken', { method: 'POST' });
    const token = res && res.code === 0 ? res.data : null;
    if (!token) {
      console.error('Failed to get short token');
      return;
    }
    chatbotToken.value = token;
    console.log('Short-lived chatbot token:', token);
  } catch (err) {
    console.error('Chatbot connect failed', err);
  }
};

const updateLeads = (newLead) => {
  leads.value.push(newLead);
};
</script>

<style scoped lang="scss">
.parent {
  background-color: white;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}
:deep(.v-breadcrumbs) {
  
  font-weight: 400;
  font-size: 14px;
}
</style>
