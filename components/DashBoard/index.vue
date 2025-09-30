<template>
  <v-container fluid class="pa-4 bg-white">
    <CommonFeatureCard
      heading="Updated Features"
      subheading="Flossly — finally, a platform built for dental practices, handling everything from rotas to compliance in one smart space."
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
          :isLocked="item.isLocked"
          :route="item.route"
          :uid="index"
        />
      </v-col>
    </v-row>

    <v-row class="d-flex align-stretch">
      <v-col cols="12" sm="12" md="8" class="pr-md-0 d-flex flex-column">
        <v-card
          class="card flex-grow-1"
          color="white"
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
                v-for="(category, index) in categoryList.filter(
                  (x) => !x.parentId
                )"
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
          class="mt-3 card flex-grow-1"
          color="white"
          elevation="0"
          rounded="lg"
        >
          <h4 class="card-head mb-4">Recently Accessed Files</h4>
          <div
            :class="
              recentFiles && recentFiles.length
                ? ''
                : 'd-flex align-center justify-center'
            "
          >
            <v-row class="ma-5" v-if="recentFiles && recentFiles.length">
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
            <div v-else class="text-center pa-5">
              <v-icon size="48" color="grey">mdi-file-clock-outline</v-icon>
              <p class="mt-3 text-grey">No recently accessed files</p>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="4" class="d-flex">
        <v-card
          class="card flex-grow-1"
          color="white"
          elevation="0"
          rounded="lg"
          v-if="user?.roleId === 8 || user?.roleId === 1"
        >
          <h4 class="card-head mb-4">Leads Conversion</h4>
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
                <span class="text-grey-darken-1">{{ source.percent }}%</span>
              </div>
            </div>
          </div>
        </v-card>
        <v-card
          class="card flex-grow-1"
          color="white"
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
    <v-row class="d-flex align-stretch">
      <v-col cols="12" sm="12" md="8" class="pr-md-0 pt-0">
        <v-card
          class="refer-card card pa-5"
          color="white"
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
                    >Refer, Share and Review to earn flossly loyalty
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
                    >Redeem your loyalty point for exclusive prizes</span
                  >
                </div>

                <!-- Button -->
                <v-btn
                  class="mt-6 align-self-start px-6 custom-btn"
                  variant="flat"
                  append-icon="mdi-open-in-new"
                  color="primary"
                >
                  Refer a business
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="4" class="pt-0">
        <v-card
          class="review-card card pa-5"
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

          <!-- 📦 Content -->
          <div class="card-content">
            <lord-icon
              src="https://cdn.lordicon.com/wstfgfud.json"
              trigger="hover"
              :style="{
                width: mdAndDown ? '100px' : '150px',
                height: mdAndDown ? '100px' : '150px',
              }"
            ></lord-icon>

            <p class="review-text">
              <span class="highlight">Happy with Flossly</span>,
              <span class="normal">give us a google review</span>
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";

const { mdAndDown } = useDisplay();

const showCard = ref(true);
const taskStore = useTaskStore();
const mainStore = useMainStore();
const docStore = useDocStore();
const recentFiles = ref([]);
const user = ref({});
const value = ref(null);
const inquirySources = ref([
  { label: "Meta Adverts", count: 16, percent: 35 },
  { label: "Google Adverts", count: 13, percent: 28 },
  { label: "Organic Search", count: 18, percent: 18 },
  { label: "Calls", count: 16, percent: 12 },
  { label: "Walk In", count: 14, percent: 17 },
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
    img: "https://cdn.lordicon.com/qtdtmioh.json",
    isLocked: false,
    route: "/tasks",
  },
  {
    title: "Flossly Team",
    img: "https://cdn.lordicon.com/umvndfds.json",
    colors:
      "primary:#121331,secondary:#f9c9c0,tertiary:#b26836,quaternary:#ffc738,quinary:#646e78,senary:#ebe6ef,septenary:#f24c00,octonary:#f28ba8,nonary:#92140c,denary:#60e5a3,undenary:#3a3347",
    isLocked: false,
    route: "/teams",
  },
  {
    title: "Flossly CPD",
    img: "https://cdn.lordicon.com/kfjxtwnh.json",
    colors:
      "primary:#121331,secondary:#3a3347,tertiary:#ebe6ef,quaternary:#60e5a3",
    isLocked: true,
  },
  {
    title: "Flossly CRM",
    img: "https://cdn.lordicon.com/nhekwutf.json",
    isLocked: true,
  },
  {
    title: "Flossly Social",
    img: "https://cdn.lordicon.com/qbkxnzyi.json",
    colors:
      "primary:#121331,secondary:#ffc738,tertiary:#2ca58d,quaternary:#ebe6ef,quinary:#f9c9c0,senary:#60e5a3,septenary:#f24c00,octonary:#3a3347",
    isLocked: true,
  },
  {
    title: "Flossly Diary",
    img: "https://cdn.lordicon.com/mjpqfjjs.json",
    colors:
      "primary:#121331,secondary:#60e5a3,tertiary:#3a3347,quaternary:#ebe6ef,quinary:#60e5a3",
    isLocked: true,
  },
  {
    title: "Flossly Reports",
    img: "https://cdn.lordicon.com/hbeigkvk.json",
    isLocked: true,
  },
]);
const tab = ref(1);
const categoryList = ref([]);
const stats = ref([]);
const getRecentDocs = () => {
  docStore
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
const fetchListCategories = () => {
  taskStore
    .listCategories()
    .then((res) => {
      if (res.code === 0) {
        categoryList.value = res.data;
        if (categoryList.value.length > 0) {
          tab.value = categoryList.value[0].id;
          fetchDummyStats();
        }
      } else {
        mainStore.setSnackbar({
          title: res.data.message || res.message,
          type: "Error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message,
        type: "Error",
      });
    });
};
const openFile = async (file) => {
  await docStore.viewDoc({ id: file.id });
  const config = useRuntimeConfig();
  if (file.name.split(".")[1] === "pdf") {
    pdfurl.value = `${config.public.BASE_URL}${file.link}`;
    showPdf.value = true;
  }
};
const fetchDummyStats = () => {
  stats.value = [
    {
      status: "Completed",
      key: "complted",
      total: 12,
      link: "/tasks/teamtasks",
      image: "/images/open-icon.svg",
    },
    {
      status: "Overdue Tasks",
      key: "overdue",
      total: 5,
      link: "/tasks/teamtasks",
      image: "/images/inprogress-icon.svg",
    },
    {
      status: "In Progress Tasks",
      key: "progress",
      total: 8,
      link: "/tasks/teamtasks",
      image: "/images/completed-icon.svg",
    },
    {
      status: "Up Coming Tasks",
      key: "upcoming",
      total: 8,
      link: "/tasks/teamtasks",
      image: "/images/completed-icon.svg",
    },
  ];
};

watch(tab, (newId) => {
  if (newId) {
    fetchDummyStats();
  }
});
onMounted(() => {
  fetchListCategories();
  getRecentDocs();
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
  }
  if (user.value.roleId === 8 || user.value.roleId === 1) {
    getMyTasks();
  }
});
const getMyTasks = () => {};
</script>

<style scoped>
.font-weight-semi {
  font-weight: 600 !important;
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
  flex: 0 0 calc(100% / 7);
  max-width: calc(100% / 7);
}
.review-card {
  position: relative;
  height: 100%; /* optional if you want it to stretch */
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px; /* space between icon and text */
  text-align: center;
}

.review-text {
  font-size: 24px;
  color: #1e1e1e;
  font-family: "Poppins", sans-serif;
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
  border-radius: 6px;
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
}

.custom-btn .v-icon {
  color: #1e1e1e;
}
/* Right side */
.refer-heading {
  font-family: "Poppins", sans-serif;
  font-weight: 600; /* SemiBold */
  font-size: 24px;
  color: #1e1e1e;
}

.refer-point {
  font-family: "Poppins", sans-serif;
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
