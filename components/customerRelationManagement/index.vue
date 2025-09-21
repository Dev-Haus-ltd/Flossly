<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">CRM</p>
    </div>
    <div class="mt-5 px-5">
      <v-row>
        <CommonStatCard
          v-for="(stat, i) in leadStats"
          :key="i"
          :icon="stat.icon"
          :label="stat.label"
          :value="stat.value"
          :cols="2"
          hide-chip
        />
      </v-row>
    </div>
    <div class="mt-5 px-5">

      <div class="d-flex justify-space-between align-center mb-4">
        <!-- Left: Search + Filters -->
        <div class="d-flex align-center">
          <div style="width: 150px" > 
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
          <TeamFlossMyLeadsFilterMenu @update:filters="onFiltersUpdated" />
        </div>

        <!-- Right: Add Button -->
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
      </div>

      <!-- List View (child) -->
      <CustomerRelationManagementListView
        v-if="leads.length"
        :leads="filteredLeads"
        :headers="headers"
        :search="search"
        :leadSources="leadSources"
        :treatmentSources="treatmentSources"
        @select="onSelect"
        @openLead="openLeadDialog"
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
const addLeadDrawer = ref(false);
const leadStats = ref([
  {
    icon: "https://cdn.lordicon.com/pfvaixkr.json",
    label: "Total Lead",
    value: 10,
  },
  {
    icon: "https://cdn.lordicon.com/oymjxfrg.json",
    label: "New",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/ugzybkbe.json",
    label: "Converted",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/ojbonimq.json",
    label: "Contacted",
    value: 2,
  },
  {
    icon: "https://cdn.lordicon.com/thsuumsm.json",
    label: "Lost",
    value: 2,
  },
]);
const search = ref("");

const leads = ref([
  {
    id: 1,
    alert:"🔥",
    name: "John Doe",
    email: "john@demo.com",
    telephone: "1234567890",
    inquiryDate: "2025-09-01",
    leadSource: { id: 1, name: "Website" },
    leadStatus: "New",
    treatment: { id: 1, name: "Consultation" }, 
    assigned: "Alice",
    followUpDate: "2025-09-15",
    comments: "Interested in product A",
  },
  {
    id: 2,
    alert:"🔥",
    name: "Jane Smith",
    email: "jane@demo.com",
    telephone: "9876543210",
    inquiryDate: "2025-09-05",
    leadSource: { id: 2, name: "Referral" },
    leadStatus: "In Progress",
    treatment: { id: 2, name: "Demo" },
    assigned: "Bob",
    followUpDate: "2025-09-18",
    comments: "Asked for discount",
  },
]);

const headers = [
{ key: "alert", title: "Alert",  width: 70 },
  { key: "name", title: "Name",  width: 200 },
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

const onFiltersUpdated = (filters) => {
  console.log("Filters applied:", filters);
};

const onSelect = (selection) => {
  if (selection === "all") {
    console.log("all");
  } else {
    console.log("Selected:", selection);
  }
};

const openLeadDialog = (lead) => {
  console.log("Open lead dialog:", lead);
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
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
}
</style>
