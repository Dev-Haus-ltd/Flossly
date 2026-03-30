<template>
  <v-container fluid class="pa-4 bg-white">
    <!-- Dashboard Content -->
    <div>
      <CommonEventCard
        v-if="showCard"
        class="my-4"
        subheading="Watch the Flossly Demo Video"
        @close="showCard = false"
      />

      <!-- Flossly Products Row -->
      <v-row>
        <v-col
          v-for="(item, index) in flosslyItems"
          :key="index"
          class="flossly-col"
        >
          <DashBoardProductCard
            :title="item.title"
            :img="item.img"
            :colors="item.colors"
            :isToolBox="item.isToolBox"
            :route="item.route"
            :uid="index"
            @handleClick="handleClickProductCard"
          />
        </v-col>
      </v-row>

      <!-- Main Dashboard Grid: 2 Columns -->
      <v-row class="mt-3">
        <!-- LEFT COLUMN (8) -->
        <v-col cols="12" sm="12" md="8" class="d-flex flex-column dashboard-left-col pr-md-3">
          
          <!-- ROW 1: Activity Tasks Card -->
          <v-card class="card" elevation="0" rounded="lg">
            <h4 class="mb-4 card-head">Activity Tasks by Category</h4>
            <div class="mx-4">
              <!-- Tabs -->
              <v-tabs
                v-model="tab"
                class="custom-tabs px-4"
                slider-color="primary"
              >
                <v-tab
                  v-for="category in filteredCategories"
                  :key="category.categoryId"
                  :value="category.categoryId"
                  class="tab-text"
                >
                  {{ category.categoryName }}
                </v-tab>
              </v-tabs>

              <!-- Tab content -->
              <v-tabs-window v-model="tab">
                <v-tabs-window-item :value="tab">
                  <v-row class="my-2 mx-1">
                    <v-col
                      v-for="stat in stats"
                      :key="stat.status"
                      cols="12"
                      sm="6"
                      md="4"
                      lg="3"
                    >
                      <DashBoardStatCard
                        :image="stat.image"
                        :label="stat.status"
                        :value="stat.total"
                        :link="stat.link"
                        :keyName="stat.key"
                      />
                    </v-col>
                  </v-row>
                </v-tabs-window-item>
              </v-tabs-window>
            </div>
          </v-card>

          <!-- ROW 2: Recently Accessed Card (Conditional) -->
          <v-card
            v-if="recentFiles && recentFiles.length"
            class="card mt-3"
            color="white"
            elevation="0"
            rounded="lg"
          >
            <h4 class="mb-4 card-head">Recently Accessed</h4>
            <div>
              <v-row class="ma-5">
                <v-col
                  v-for="(file, index) in recentFiles"
                  :key="index"
                  cols="12"
                  md="4"
                  xl="3"
                >
                  <DashBoardRecentlyAccessed :file="file" @open="openFile" @action="openFileInDocs" />
                </v-col>
              </v-row>
            </div>
          </v-card>

          <!-- ROW 2 or 3: Refer & Earn Card (Dynamic Position) -->
          <v-card class="refer-card card pa-5 mt-3" elevation="0" rounded="lg">
            <v-row no-gutters>
              <v-col cols="12" xs="12" sm="5" class="left-side">
                <v-chip
                  class="bonus-chip"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-star"
                  label
                >
                  Earn +50 Points
                </v-chip>

                <div class="left-content">
                  <lord-icon
                    src="https://cdn.lordicon.com/pbkbjgyv.json"
                    colors="primary:#e8b730,secondary:#ffc738,tertiary:#2ca58d"
                    trigger="hover"
                    :style="{
                      width: mdAndDown ? '100px' : '150px',
                      height: mdAndDown ? '100px' : '150px',
                    }"
                  ></lord-icon>
                </div>
              </v-col>

              <v-col
                cols="12"
                xs="12"
                sm="7"
                class="right-side d-flex flex-column justify-center"
              >
                <div class="ml-5">
                  <!-- Heading -->
                  <h3 class="refer-heading mb-4 mt-2 mt-sm-0">
                    Refer & Earn with Flossly
                  </h3>

                  <!-- Points -->
                  <div class="refer-point d-flex align-center mb-3">
                    <lord-icon
                      src="https://cdn.lordicon.com/vumnblwp.json"
                      trigger="hover"
                      colors="primary:#1e1e1e"
                      style="width: 40px; height: 40px"
                    >
                    </lord-icon>
                    <span class="ml-3">Enter details</span>
                  </div>
                  <div class="refer-point d-flex align-center mb-3">
                    <lord-icon
                      src="https://cdn.lordicon.com/fozsorqm.json"
                      trigger="hover"
                      colors="primary:#121331,secondary:#1e1e1e"
                      style="width: 40px; height: 40px"
                    >
                    </lord-icon>
                    <span class="ml-3"
                      >Refer, share, and review to earn flossly loyalty
                      points</span
                    >
                  </div>
                  <div class="refer-point d-flex align-center mb-3">
                    <lord-icon
                      src="https://cdn.lordicon.com/hpjdqzlq.json"
                      trigger="hover"
                      colors="primary:#121331,secondary:#1e1e1e"
                      style="width: 40px; height: 40px"
                    >
                    </lord-icon>
                    <span class="ml-3"
                      >Redeem your loyalty points for exclusive prizes</span
                    >
                  </div>

                  <!-- Button -->
                  <v-btn
                    class="mt-6 align-self-start px-6 custom-btn"
                    variant="flat"
                    append-icon="mdi-open-in-new"
                    color="primary"
                    height="46"
                    @click="showReferralDialog = true"
                  >
                    Refer a business
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <!-- RIGHT COLUMN (4) -->
        <v-col cols="12" sm="12" md="4" class="d-flex flex-column dashboard-right-col pl-md-3">
          
          <!-- ROW 1-2: Lead Conversion Card (for admin/manager roles) - Spans 2 rows -->
          <v-card
            class="card"
            elevation="0"
            rounded="lg"
            v-if="user?.roleId === 8 || user?.roleId === 1"
          >
            <h4 class="card-head mb-4">Lead Conversion</h4>
            <div class="ma-5">
              <DashBoardRevenueCard
                title="Total Leads"
                :subtitle="leadSummary.total"
                label=""
              />

              <v-row no-gutters class="performance-grid mt-5">
                <v-col
                  v-for="(stat, index) in performaces"
                  :key="index"
                  cols="6"
                  class="perform-col"
                  :class="{
                    'no-right-border': (index + 1) % 2 === 0,
                    'no-bottom-border': index >= performaces.length - 2,
                  }"
                >
                  <DashBoardPerformaceCard
                    :count="stat.count"
                    :title="stat.title"
                  />
                </v-col>
              </v-row>

              <div
                v-for="source in inquirySources"
                :key="source.label"
                class="d-flex justify-space-between align-center text-body-2 font-weight-medium mb-1 mt-5 mx-1"
              >
                <span>{{ source.label }}</span>
                <div class="d-flex align-center" style="gap: 24px">
                  <span>{{ source.count }}</span>
                  <span v-if="source.percent != null">{{ source.percent }}%</span>
                </div>
              </div>
            </div>
          </v-card>

          <!-- ROW 1-2: Calendar Card (for regular users) - Spans 2 rows -->
          <v-card
            class="card"
            elevation="0"
            rounded="lg"
            v-else
          >
            <h4 class="card-head mb-4">Calender</h4>

            <v-calendar
              v-model="value"
              :events="[]"
              hide-day-header
              hide-week-number
              hide-header
              color="primary"
              type="month"
              class="user-dashboard-calender"
            >
              <template v-slot:day-event="{ event }">
                <v-tooltip>
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      class="mx-auto"
                      :color="event.color"
                      size="8"
                    >
                      mdi-circle
                    </v-icon>
                  </template>
                  <span>{{ event.title }}</span>
                </v-tooltip>
              </template>
              <template v-slot:day-title="{ title }">
                <span style="font-size: 10px">{{ title }}</span>
              </template>
            </v-calendar>
          </v-card>

          <!-- ROW 3: Brand Ambassador Card (Always Row 3) -->
          <v-card
            class="review-card pa-5 mt-3"
            color="white"
            elevation="0"
            rounded="lg"
          >
            <!-- ⭐ Chip (absolute top-left) -->
            <v-chip
              class="bonus-chip"
              variant="flat"
              size="small"
              prepend-icon="mdi-star"
              label
            >
              Earn +50 Points
            </v-chip>

            <!-- 📦 Content (on top of background) -->
            <div class="card-content pt-5">
              <!-- ✅ Custom Image (replaces lord-icon) -->
              <img
                src="@/assets/dashboard/review-card-logo.svg"
                alt="Review Icon"
                class="review-logo"
              />

              <p class="review-text">
                <span class="normal">Want to Become </span>
                <span class="highlight">FlosslyOS</span>
                <br />
                <span class="highlight">Brand Ambassador,</span>
              </p>
              <v-btn
                class="align-center"
                variant="flat"
                append-icon="mdi-arrow-top-right"
                href="https://www.flossly.ai/brand-ambasaddor-info"
                target="_blank"
                color="primary"
                height="46"
                rounded="lg"
              >
                View more
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- File viewer dialogs for Recently Accessed -->
      <template v-if="selectedDoc">
        <DocsMyDocsDocxEditorDialog
          v-if="isDocxFile(selectedDoc)"
          v-model="viewDocDialog"
          :doc="selectedDoc"
          :is-system="false"
        />
        <DocsMyDocsViewFileDialog
          v-else
          v-model="viewDocDialog"
          :doc="selectedDoc"
          :is-system="false"
        />
      </template>

      <!-- Toolbox Dialog -->
      <DashBoardToolBoxDialog v-model="showToolboxDialog" @close="showToolboxDialog = false" />
      <MyProfileLoyaltyPointsRewardsContentRecommendPracticeDialog
        v-model="showReferralDialog"
      />
    </div>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { downloadFile } from "~/lib/misc";

const { mdAndDown } = useDisplay();
const router = useRouter();
const showToolboxDialog = ref(false);
const showCard = ref(true);
const isLoading = ref(true);
const taskStore = useTaskStore();
const mainStore = useMainStore();

const crmStore = useCrmStore();
const orgStore = useOrgStore();
const showReferralDialog = ref(false);
const docStore = useDocStore();
const recentFiles = ref([]);
const selectedDoc = ref(null);
const viewDocDialog = ref(false);
const user = ref({});
const value = ref(null);
const crmLeads = ref([]);
const leadSources = ref([]);
const activeCrmLeads = computed(() =>
  (crmLeads.value || []).filter((lead) => !lead?.softDeleted)
);
const leadSummary = computed(() => {
  const active = activeCrmLeads.value;
  const byStatus = (status) =>
    active.filter((lead) => (lead.leadStatus || "").toLowerCase() === status)
      .length;
  return {
    total: active.length,
    new: byStatus("new"),
    converted: byStatus("converted"),
    contacted: byStatus("contacted"),
    lost: byStatus("lost"),
  };
});
const performaces = computed(() => [
  { title: "New", count: leadSummary.value.new },
  { title: "Converted", count: leadSummary.value.converted },
  { title: "Contacted", count: leadSummary.value.contacted },
  { title: "Lost", count: leadSummary.value.lost },
]);
const normalizeLeadSource = (lead) => {
  const source = lead?.leadSource;
  if (source && typeof source === "object") {
    return source.name || source.label || "Unknown";
  }
  if (typeof source === "string" && source.trim()) return source.trim();
  if (source == null) return "Unknown";
  return String(source);
};
const inquirySources = computed(() => {
  const counts = new Map();
  activeCrmLeads.value.forEach((lead) => {
    const label = normalizeLeadSource(lead);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  const baseLabels = (leadSources.value || [])
    .map((source) => {
      if (typeof source === "string") return source.trim();
      if (source?.name) return String(source.name).trim();
      return "";
    })
    .filter((label) => label);
  const baseSet = new Set(baseLabels);
  const baseRows = baseLabels.map((label) => ({
    label,
    count: counts.get(label) || 0,
  }));
  const extraRows = Array.from(counts.entries())
    .filter(([label]) => !baseSet.has(label))
    .map(([label, count]) => ({ label, count }));
  return [...baseRows, ...extraRows];
});
const flosslyItems = ref([
  {
    title: "Flossly Tasks",
    img: "https://cdn.lordicon.com/wwcdwkaf.json",
    isToolBox: false,
    route: "/tasks/mytasks",
    colors:"#008AFE"
  },
  {
    title: "Flossly Team",
    img: "https://cdn.lordicon.com/kphwxuxr.json",
    isToolBox: false,
    route: "/teams",
    colors:"#7D77FF"
  },
  {
    title: "Flossly CRM",
    img: "https://cdn.lordicon.com/gcmzyunj.json",
    isToolBox: false,
    route: "/crm",
    colors:"#FF85DA"
  },
  {
    title: "Flossly Diary",
    img: "https://cdn.lordicon.com/uoljexdg.json",
    route: "/diary",
    isToolBox: false,
    colors:"#FFA977"
  },
  {
    title: "Toolbox",
    img: "https://cdn.lordicon.com/ajcbrren.json",
    isToolBox: true,
    colors:"rgba(255, 255, 255, 0.2);"
  },
]);
const tab = ref(null);
const categoryList = ref([]);
const stats = ref([]);
const DASHBOARD_PRIVILEGED_ROLE_IDS = [1, 8];
const isPrivilegedUser = computed(() =>
  DASHBOARD_PRIVILEGED_ROLE_IDS.includes(Number(user.value?.roleId))
);
const taskListLink = computed(() =>
  "/tasks/mytasks"
);

// Filtered categories excluding Compliance and child categories — mirrors tasks page visibility
const filteredCategories = computed(() => {
  return categoryList.value.filter((x) => {
    if (x.parentId) return false;
    const name = (x.categoryName || '').trim().toLowerCase();
    return name !== 'compliance';
  });
});
const syncDashboardTaskRoutes = () => {
  const route = taskListLink.value;
  const taskCard = flosslyItems.value.find((item) => item.title === "Flossly Tasks");
  if (taskCard) {
    taskCard.route = route;
  }
  if (Array.isArray(stats.value) && stats.value.length) {
    stats.value = stats.value.map((item) => ({ ...item, link: route }));
  }
};
const getRecentDocs = () => {
  return docStore
    .recentDocs()
    .then((res) => {
      if (res.code === 0) {
        recentFiles.value = res.data;
      } else {
        //snack
      }
    })
    .catch((err) => {
      //snack
    });
};
const fetchListCategories = async () => {
  try {
    const res = isPrivilegedUser.value
      ? await taskStore.getTeamTaskStatsByCategory()
      : await taskStore.getMyTaskStatsByCategory();
    if (res.code === 0) {
      categoryList.value = res.data || [];
      if (filteredCategories.value.length > 0) {
        tab.value = filteredCategories.value[0].categoryId;
        await fetchDummyStats();
      }
    } else {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Failed to load categories",
        type: "Error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message,
      type: "Error",
    });
  }
};
const isDocxFile = (file) => (file?.name || '').toLowerCase().endsWith('.docx')
const isXlsxFile = (file) => {
  const name = (file?.name || '').toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.xls')
}

const openFile = async (file) => {
  await docStore.viewDoc({ id: file.id }).catch(() => {})
  if (isXlsxFile(file)) {
    downloadFile(file)
    return
  }
  selectedDoc.value = file
  viewDocDialog.value = true
};
const openFileInDocs = async (file) => {
  await docStore.viewDoc({ id: file.id }).catch(() => {});
  const query = {};
  if (file?.id) query.docId = String(file.id);
  if (file?.folderId) query.folderId = String(file.folderId);
  await router.push({ path: "/docs/mydocs", query });
};
const buildZeroStats = () => [
  { status: "Completed",       key: "completed", total: 0, link: taskListLink.value, image: "/images/open-icon.svg" },
  { status: "Overdue Tasks",   key: "overdue",   total: 0, link: taskListLink.value, image: "/images/inprogress-icon.svg" },
  { status: "In Progress Tasks", key: "progress", total: 0, link: taskListLink.value, image: "/images/completed-icon.svg" },
  { status: "To do",           key: "todo",      total: 0, link: taskListLink.value, image: "/images/completed-icon.svg" },
];

const fetchDummyStats = async () => {
  try {
    const categoryId = tab.value || null;
    if (isPrivilegedUser.value) {
      const res = await taskStore.getTeamTaskStatsByStatusAndCategory(categoryId);
      if (res && res.code === 0) {
        const data = res.data || {};
        stats.value = [
          { status: "Completed",         key: "completed", total: data.completed || 0, link: taskListLink.value, image: "/images/open-icon.svg" },
          { status: "Overdue Tasks",     key: "overdue",   total: data.overdue || 0,   link: taskListLink.value, image: "/images/inprogress-icon.svg" },
          { status: "In Progress Tasks", key: "progress",  total: data.progress || 0,  link: taskListLink.value, image: "/images/completed-icon.svg" },
          { status: "To do",             key: "todo",      total: data.todo || data.upcoming || 0, link: taskListLink.value, image: "/images/completed-icon.svg" },
        ];
        return;
      }
      stats.value = buildZeroStats();
      mainStore.setSnackbar({
        title: res?.data?.message || res?.message || "Failed to load task stats",
        type: "Error",
      });
      return;
    }

    const [statusRes, overdueRes] = await Promise.all([
      taskStore.tasksGroupedByStatus({
        categoryId,
        page: 1,
        pageSize: 1,
      }),
      taskStore.tasksGroupedByStatus({
        categoryId,
        dueDateFilter: "overdue",
        page: 1,
        pageSize: 1,
      }),
    ]);

    if (statusRes?.code !== 0 || overdueRes?.code !== 0) {
      stats.value = buildZeroStats();
      mainStore.setSnackbar({
        title:
          statusRes?.data?.message ||
          statusRes?.message ||
          overdueRes?.data?.message ||
          overdueRes?.message ||
          "Failed to load task stats",
        type: "Error",
      });
      return;
    } else {
      const statuses = statusRes?.data?.statuses || [];
      const overdueStatuses = overdueRes?.data?.statuses || [];

      const totalByStatus = statuses.reduce((acc, item) => {
        const key = String(item?.status || "").toLowerCase();
        acc[key] = Number(item?.total || 0);
        return acc;
      }, {});

      const overdueTotal = overdueStatuses.reduce((sum, item) => {
        const key = String(item?.status || "").toLowerCase();
        if (key === "completed" || key === "archived") return sum;
        return sum + Number(item?.total || 0);
      }, 0);

      stats.value = [
        { status: "Completed",         key: "completed", total: totalByStatus.completed || 0, link: taskListLink.value, image: "/images/open-icon.svg" },
        { status: "Overdue Tasks",     key: "overdue",   total: overdueTotal, link: taskListLink.value, image: "/images/inprogress-icon.svg" },
        { status: "In Progress Tasks", key: "progress",  total: totalByStatus.progress || 0, link: taskListLink.value, image: "/images/completed-icon.svg" },
        { status: "To do",             key: "todo",      total: totalByStatus.todo || totalByStatus.upcoming || 0, link: taskListLink.value, image: "/images/completed-icon.svg" },
      ];
    }
  } catch (err) {
    stats.value = buildZeroStats();
    mainStore.setSnackbar({
      title: err.message || "Failed to load task stats",
      type: "Error",
    });
  }
};
const loadCrmLeads = async () => {
  try {
    const res = await crmStore.listLeads({ includeArchived: true });
    if (res?.code === 0) {
      crmLeads.value = res.data || [];
    } else {
      crmLeads.value = [];
    }
  } catch (err) {
    crmLeads.value = [];
  }
};
const loadLeadSources = async () => {
  try {
    const res = await crmStore.listOptions("lead_source");
    if (res?.code === 0) {
      leadSources.value = (res.data || []).map((o) => ({
        id: o.id,
        name: o.name,
      }));
      return;
    }
    leadSources.value = [];
  } catch (err) {
    leadSources.value = [];
  }
};

const referralForm = ref({
  fullName: "",
  email: "",
  phoneNumber: "",
  practiceName: "",
});

const submitReferral = async () => {
  try {
    await orgStore.createOrganisationReferral({
      managerName: referralForm.value.fullName,
      orgEmail: referralForm.value.email,
      phoneNumber: referralForm.value.phoneNumber,
      orgName: referralForm.value.practiceName,
    });

    mainStore.setSnackbar({
      title: "Referral submitted successfully",
      type: "Success",
    });

    referralForm.value = {
      fullName: "",
      email: "",
      phoneNumber: "",
      practiceName: "",
    };

    showReferralDialog.value = false; // ✅ CLOSE MODAL

  } catch (err) {
    mainStore.setSnackbar({
      title: err?.message || "Failed to submit referral",
      type: "Error",
    });
  }
};
watch(showReferralDialog, (isOpen) => {
  if (!isOpen) {
    referralForm.value = {
      fullName: "",
      email: "",
      phoneNumber: "",
      practiceName: "",
    };
  }
});


watch(tab, async (newId) => {
  if (newId) {
    await fetchDummyStats();
  }
});
onMounted(async () => {
  try {
    // Load user data first
    if (localStorage.getItem("user")) {
      user.value = JSON.parse(localStorage.getItem("user"));
    }
    syncDashboardTaskRoutes();
    
    // Fetch all data in parallel
    await Promise.all([
      fetchListCategories(),
      getRecentDocs(),
      isPrivilegedUser.value ? getMyTasks() : Promise.resolve(),
      isPrivilegedUser.value ? loadCrmLeads() : Promise.resolve(),
      isPrivilegedUser.value ? loadLeadSources() : Promise.resolve()
    ]);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    // Always hide loading state after data is loaded
    isLoading.value = false;
  }
});
watch(taskListLink, () => {
  syncDashboardTaskRoutes();
});
const getMyTasks = () => {
  return;
};
const handleClickProductCard = (uid) => {
  console.log(uid);
  if(uid === 4){
    showToolboxDialog.value = true;
  }
};
</script>

<style scoped>
.font-weight-semi {
  font-weight: 600 !important;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.card {
  border: 1px solid #dbdbdb;
}

.card-head {
  font-weight: 600;
  font-size: 16px;
  padding: 24px;
  border-bottom: 1px solid #dbdbdb;
}

.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}

.custom-tabs .v-tab {
  color: inherit !important;
}

.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}

/* Style the Vuetify slider to be thicker and primary color */
.custom-tabs :deep(.v-tabs-slider) {
  height: 8px !important;
  background-color: var(--v-theme-primary) !important;
}

.stat-status {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-total {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-link {
  font-size: 13px;
  color: var(--v-theme-primary);
  text-decoration: none;
}

.performance-grid {
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  overflow: hidden;
}

.perform-col {
  border-right: 1px solid #dbdbdb;
  border-bottom: 1px solid #dbdbdb;
}

/* Remove right border from last in each row */
.no-right-border {
  border-right: none;
}

/* Remove bottom border from last row */
.no-bottom-border {
  border-bottom: none;
}

.flossly-col {
  flex: 0 0 calc(100% / 5);
  max-width: calc(100% / 5);
}

/* Dashboard Grid Spacing - CRITICAL FOR GAPS */
.dashboard-left-col {
  row-gap: 24px;
}

.dashboard-right-col {
  row-gap: 24px;
}

/* Review Card */
.review-card {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: auto;
  padding: 20px;
  
  /* Background image */
  background-image: url('/assets/dashboard/review-card-bg.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

@media (max-width: 960px) {
  .review-card {
    width: 100%;
  }
}

.review-logo {
  width: 72px;
  height: 72px;
}

.bonus-chip {
  position: absolute;
  top: 16px;
  left: 16px;
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}

/* icon inside chip */
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}

.card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.review-text {
  font-size: 24px;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
}

.review-text .highlight {
  font-weight: 700;
}

.review-text .normal {
  font-weight: 400;
}

.refer-card {
  position: relative;
  overflow: hidden;
}

/* Left side background */
.left-side {
  background-image: url("@/assets/images/dashboard/stars-bg.svg");
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.left-side::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  padding: 4px;
  background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
}

/* Lordicon centering */
.left-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.custom-btn {
  color: #1e1e1e;
  font-weight: 400;
  border-radius: 12px !important;
}

.custom-btn .v-icon {
  color: #1e1e1e;
}

/* Right side */
.refer-heading {
  font-weight: 600;
  font-size: 24px;
  color: #1e1e1e;
}

.refer-point {
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}

/* Responsive - Tablet: 3 per row */
@media (max-width: 960px) {
  .flossly-col {
    flex: 0 0 calc(100% / 3);
    max-width: calc(100% / 3);
  }
}

/* Responsive - Mobile: 1 per row */
@media (max-width: 600px) {
  .flossly-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.custom-text {
  color: #1E1E1E !important;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 1;
  letter-spacing: 0;
}

.cust-border {
  border-bottom: 1px solid #DBDBDB;
  padding: 17px;
}

.form-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.3;
  letter-spacing: 0;
  color: #1E1E1E;
}

.v-field--variant-outlined .v-field__outline {
  --v-field-border-opacity: 1;
  border-color: #DFDFDF;
}

.form-container {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
}
</style>
