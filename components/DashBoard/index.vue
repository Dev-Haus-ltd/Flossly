<template>
  <v-container fluid class="pa-4 bg-white">

    <!-- Dashboard Content -->
    <div>
      <CommonFeatureCard
        subheading="Watch the Flossly Demo Video"
        @close="showCard = false"
        v-if="showCard"
        class="my-4"
      />
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

    <v-row class="d-flex align-stretch">
      <v-col cols="12" sm="12" md="8" class="pr-md-0 d-flex flex-column">
        <v-card
          class="card flex-grow-1"
          elevation="0"
          rounded="lg"
        >
          <h4 class="mb-4 card-head">Activity Tasks by Category</h4>
          <div class="mx-4">
            <!-- Tabs -->
            <v-tabs
              v-model="tab"
              class="custom-tabs px-4"
              slider-color="primary"
            >
              <v-tab
                v-for="(category, index) in filteredCategories"
                :key="category.id"
                :value="index + 1"
                class="tab-text"
              >
                {{ category.name }}
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

        <!-- ✅ Quick Actions under Recent + CPD -->
        <v-card
          v-if="recentFiles && recentFiles.length"
          class="mt-3 card flex-grow-1"
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
                <DashBoardRecentlyAccessed :file="file" @open="openFile" />
              </v-col>
            </v-row>
          </div>
        </v-card>
        <!-- Refer & Earn Card -->
        <v-card
          class="mt-3 refer-card card pa-5 flex-grow-1"
          elevation="0"
          rounded="lg"
        >
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
                >
                  Refer a business
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="4" class="d-flex">
        <v-card
          class="card flex-grow-1"
          elevation="0"
          rounded="lg"
          v-if="user?.roleId === 8 || user?.roleId === 1"
        >
          <h4 class="card-head mb-4">Lead Conversion</h4>
          <div class="ma-5">
            <DashBoardRevenueCard title="This Week" subtitle="£ 29,985" />

            <v-row no-gutters class="performance-grid mt-5">
              <v-col
                v-for="(stat, index) in performaces"
                :key="index"
                cols="4"
                class="perform-col"
                :class="{
                  'no-right-border': (index + 1) % 3 === 0, // last in row
                  'no-bottom-border': index >= performaces.length - 2, // last row
                }"
              >
                <DashBoardPerformaceCard
                  :count="stat.count"
                  :title="stat.title"
                  :percentage="stat.percentage"
                  :color="stat.color"
                  :trend="stat.trend"
                />
              </v-col>
            </v-row>

            <div
              v-for="source in inquirySources"
              :key="source.label"
              class="d-flex justify-space-between align-center text-body-2 font-weight-medium mb-1 mt-5 mx-1"
            >
              <span>{{ source.label }}</span>
              <div class="d-flex align-center" style="gap: 70px">
                <span>{{ source.count }}</span>
                <span>{{ source.percent }}%</span>
              </div>
            </div>
          </div>
        </v-card>
        <v-card
          class="card flex-grow-1"
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
      </v-col>
    </v-row>
    <v-row class="d-flex align-stretch justify-end">
      <v-col cols="12" sm="12" md="4" class="pt-0">
        <v-card
          class="review-card pa-5"
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
              src="@/assets/dashBoard/review-card-logo.svg"
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
    <DashBoardToolBoxDialog v-model="showToolboxDialog" @close="showToolboxDialog = false" />
    </div>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";

const { mdAndDown } = useDisplay();
const showToolboxDialog = ref(false);
const showCard = ref(true);
const isLoading = ref(true);
const taskStore = useTaskStore();
const mainStore = useMainStore();
const docStore = useDocStore();
const recentFiles = ref([]);
const user = ref({});
const value = ref(null);
const inquirySources = ref([
  { label: "Meta Adverts", count: 16, percent: 35 },
  { label: "Google Ads", count: 13, percent: 28 },
  { label: "Organic Search", count: 18, percent: 18 },
  { label: "Calls", count: 16, percent: 12 },
  { label: "Walk-ins", count: 14, percent: 17 },
]);

const performaces = ref([
  {
    count: 47,
    title: "Inquiry",
    percentage: "+15.9%",
    color: "#60E5A3",
    trend: "up",
  },
  {
    count: 32,
    title: "Inquiry",
    percentage: "-8.4%",
    color: "#FF5C5C",
    trend: "down",
  },
  {
    count: 58,
    title: "Consultation",
    percentage: "+4.3%",
    color: "#60E5A3",
    trend: "up",
  },
  {
    count: 21,
    title: "Booked",
    percentage: "-12.1%",
    color: "#FF5C5C",
    trend: "down",
  },
  {
    count: 22,
    title: "Treated",
    percentage: "-12.1%",
    color: "#FF5C5C",
    trend: "down",
  },
]);
const flosslyItems = ref([
  {
    title: "Flossly Tasks",
    img: "https://cdn.lordicon.com/wwcdwkaf.json",
    isToolBox: false,
    route: "/tasks",
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
const tab = ref(1);
const categoryList = ref([]);
const stats = ref([]);

// Filtered categories excluding Compliance
const filteredCategories = computed(() => {
  const filtered = categoryList.value.filter((x) => {
    if (x.parentId) return false;
    const name = (x.name || '').trim().toLowerCase();
    return name !== 'compliance';
  });

  return filtered;
});
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
    const res = await taskStore.listCategories();
    if (res.code === 0) {
      categoryList.value = res.data;
      if (categoryList.value.length > 0) {
        tab.value = 1; // Set to first tab index
        await fetchDummyStats();
      }
    } else {
      mainStore.setSnackbar({
        title: res.data.message || res.message,
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
const openFile = async (file) => {
  await docStore.viewDoc({ id: file.id });
  const config = useRuntimeConfig();
  if (file.name.split(".")[1] === "pdf") {
    pdfurl.value = `${config.public.BASE_URL}${file.link}`;
    showPdf.value = true;
  }
};
const fetchDummyStats = async () => {
  try {
    // Filter to only parent categories (same as tabs), excluding Compliance
    const parentCategories = filteredCategories.value;
    // Find the selected category based on tab index
    const selectedCategory = parentCategories[tab.value - 1];
    const categoryId = selectedCategory?.id || null;
    
    const res = await taskStore.getTeamTaskStatsByStatusAndCategory(categoryId);
    if (res && res.code === 0) {
      const data = res.data || {};
      stats.value = [
        {
          status: "Completed",
          key: "completed",
          total: data.completed || 0,
          link: "/tasks/teamtasks",
          image: "/images/open-icon.svg",
        },
        {
          status: "Overdue Tasks",
          key: "overdue",
          total: data.overdue || 0,
          link: "/tasks/teamtasks",
          image: "/images/inprogress-icon.svg",
        },
        {
          status: "In Progress Tasks",
          key: "progress",
          total: data.progress || 0,
          link: "/tasks/teamtasks",
          image: "/images/completed-icon.svg",
        },
        {
          status: "Upcoming Tasks",
          key: "upcoming",
          total: data.upcoming || 0,
          link: "/tasks/teamtasks",
          image: "/images/completed-icon.svg",
        },
      ];
    } else {
      // Fallback to zeros if API fails
      stats.value = [
        {
          status: "Completed",
          key: "completed",
          total: 0,
          link: "/tasks/teamtasks",
          image: "/images/open-icon.svg",
        },
        {
          status: "Overdue Tasks",
          key: "overdue",
          total: 0,
          link: "/tasks/teamtasks",
          image: "/images/inprogress-icon.svg",
        },
        {
          status: "In Progress Tasks",
          key: "progress",
          total: 0,
          link: "/tasks/teamtasks",
          image: "/images/completed-icon.svg",
        },
        {
          status: "Upcoming Tasks",
          key: "upcoming",
          total: 0,
          link: "/tasks/teamtasks",
          image: "/images/completed-icon.svg",
        },
      ];
    }
  } catch (err) {
    console.error("Error fetching task stats:", err);
    // Fallback to zeros on error
    stats.value = [
      {
        status: "Completed",
        key: "completed",
        total: 0,
        link: "/tasks/teamtasks",
        image: "/images/open-icon.svg",
      },
      {
        status: "Overdue Tasks",
        key: "overdue",
        total: 0,
        link: "/tasks/teamtasks",
        image: "/images/inprogress-icon.svg",
      },
      {
        status: "In Progress Tasks",
        key: "progress",
        total: 0,
        link: "/tasks/teamtasks",
        image: "/images/completed-icon.svg",
      },
      {
        status: "Upcoming Tasks",
        key: "upcoming",
        total: 0,
        link: "/tasks/teamtasks",
        image: "/images/completed-icon.svg",
      },
    ];
  }
};

watch(tab, async (newId) => {
  if (newId && categoryList.value.length > 0) {
    await fetchDummyStats();
  }
});
onMounted(async () => {
  try {
    // Load user data first
    if (localStorage.getItem("user")) {
      user.value = JSON.parse(localStorage.getItem("user"));
    }
    
    // Fetch all data in parallel
    await Promise.all([
      fetchListCategories(),
      getRecentDocs(),
      user.value.roleId === 8 || user.value.roleId === 1 ? getMyTasks() : Promise.resolve()
    ]);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    // Always hide loading state after data is loaded
    isLoading.value = false;
  }
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

/* Style the Vuetify slider to be thicker and green */
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
.review-card {
  position: relative;
  height: 100%; /* optional if you want it to stretch */
  max-width: 525px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  /* ✅ Background image */
  background-image: url('/assets/dashboard/review-card-bg.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.review-card {
  width: 100%;
  max-width: 525px;
}

@media (max-width: 960px) {
  .review-card {
    max-width: 100%;
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
  gap: 16px; /* space between icon and text */
  text-align: center;
}

.review-text {
  font-size: 24px;
  color: #FFFFFF;
  
}

.review-text .highlight {
  font-weight: 700; /* Bold */
}

.review-text .normal {
  font-weight: 400; /* Regular */
}
.refer-card {
  position: relative;
  overflow: hidden;
}

/* Left side background */
.left-side {
  background-image: url("@/assets/images/dashboard/stars-bg.svg"); /* replace with your image */
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

/* Chip inside left side */
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

/* Deep icon color */
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
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
  
  font-weight: 600; /* SemiBold */
  font-size: 24px;
  color: #1e1e1e;
}

.refer-point {
  
  font-weight: 400; /* Regular */
  font-size: 14px;
  color: #1e1e1e;
}

/* Tablet: 3 per row */
@media (max-width: 960px) {
  .flossly-col {
    flex: 0 0 calc(100% / 3);
    max-width: calc(100% / 3);
  }
}

/* Mobile: 1 per row */
@media (max-width: 600px) {
  .flossly-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>
