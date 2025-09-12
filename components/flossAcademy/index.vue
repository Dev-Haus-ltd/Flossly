<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Team CPD</p>
      <p
        v-if="step===2"
        @click="step=1"
        style="color: blue !important; cursor: pointer"
      >
        {{ "/Course Details"  }}
      </p>
    </div>
    <div class="mt-5 px-5" v-if="step === 1">
      <v-row>
        <v-col v-for="(item, i) in cards" :key="i" cols="3">
          <FlossAcademyStatCard
            :title="item.title"
            :points="item.points"
            :icon="item.icon"
            :total-hours="item.totalHours"
          />
        </v-col>
      </v-row>
    </div>

    <div class="cpd-tabs px-5" v-if="step === 1">
      <!-- Tabs -->
      <v-tabs v-model="tab" class="custom-tabs mt-5" slider-color="primary">
        <v-tab
          v-for="category in categories"
          :key="category"
          :value="category"
          class="tab-text"
        >
          {{ category }}
        </v-tab>
      </v-tabs>

      <!-- Cards Grid -->
      <v-tabs-window v-model="tab">
        <v-tabs-window-item
          v-for="category in categories"
          :key="category + 'ss'"
          :value="category"
        >
          <v-row class="py-6" align="stretch">
            <v-col
              v-for="(card, index) in filteredCards(category)"
              :key="index"
              cols="12"
              sm="6"
              md="3"
            >
              <FlossAcademyCourseCard
                :course="card"
                @showCourse="showCourse"
              />
            </v-col>

            <!-- No cards -->
            <v-col v-if="!filteredCards(category).length" cols="12">
              <div class="text-center py-10 text-grey">No cards available</div>
            </v-col>
          </v-row>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
    <div class="px-5" v-if="step===2">
      <FlossAcademyCourseDetail
      :course="selectedCourse"
    />

    </div>
  </div>
</template>
<script setup>
const step = ref(1);
const cpdStore = useCpdStore()
const courses = ref([])
const categories = ref([])
const selectedCourse = ref(null)
const cards = [
  {
    title: "Required CPD Hours",
    points: 200,
    icon: "https://cdn.lordicon.com/odxsdugo.json",
    totalHours: 12,
  },
  {
    title: "Completed CPD Hours",
    points: 150,
    icon: "https://cdn.lordicon.com/itlfjzxp.json",
    totalHours: 8,
  },
  {
    title: "Remaining CPD Hours",
    points: 100,
    icon: "https://cdn.lordicon.com/amdfceua.json",
    totalHours: 5,
  },
];
const tab = ref(0); // "All" by default (id = 0)

// Dummy cards with categoryId
const allCards = [
  {
    id: 1,
    title: "Safeguarding Adults and Children Level 1",
    categoryId: 2,
    img: "https://picsum.photos/400/240?random=1",
    totalTime: "2h 30m",
    isVerified: true,
  },
  {
    id: 2,
    title: "Safeguarding Adults and Children Level 2",
    categoryId: 3,
    img: "https://picsum.photos/400/240?random=2",
    totalTime: "1h 45m",
    isVerified: false,
  },
  {
    id: 3,
    title: "Safeguarding Adults and Children Level 3",
    categoryId: 4,
    img: "https://picsum.photos/400/240?random=3",
    totalTime: "3h 10m",
    isVerified: true,
  },
  {
    id: 4,
    title: "Safeguarding Adults and Children Level 4",
    categoryId: 5,
    img: "https://picsum.photos/400/240?random=4",
    totalTime: "4h 00m",
    isVerified: false,
  },
  {
    id: 5,
    title: "Course E",
    categoryId: 1,
    img: "https://picsum.photos/400/240?random=5",
    totalTime: "2h 15m",
    isVerified: true,
  },
];

// Filtering logic
function filteredCards(category) {
  if (!category) return courses.value;
  return courses.value[category]
}
const showCourse = (course) => {
  selectedCourse.value = course
  step.value = 2;
};

onMounted(() => {
  getCourses()
})

const getCourses = () => {
  cpdStore.getCourses().then((res) => {
    if (res.code === 0) {
      courses.value = res.data
      categories.value = Object.keys(res.data)
    }
  })
}
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
.tab-text {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #1e1e1e;
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
</style>
