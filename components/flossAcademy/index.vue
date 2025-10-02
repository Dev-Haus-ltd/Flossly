<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1"
      :style="step === 2 ? 'color: blue; cursor: pointer;' : ''"
      @click="step = 1"
      
      >Floss academy</p>
      <p
        v-if="step === 2"
     
      >
        {{ "/Course Details" }}
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
                @handleCourseClick="showCourse"
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
    <div class="px-5" v-if="step === 2">
      <FlossAcademyCourseDetail :course="selectedCourse" />
    </div>
    <FlossAcademyAssignedToDialog
      v-model="assignToDialogOpen"
      :employees="employees"
      :selectedUsers="[]"
      :course="selectedCourse"
    />
  </div>
</template>
<script setup>
const user = useUser();
const step = ref(1);
const cpdStore = useCpdStore();
const userStore = useUserStore();
const courses = ref([]);
const categories = ref([]);
const selectedCourse = ref(null);
const assignToDialogOpen = ref(false);
const employees = ref([]);
const currentLoggedInOrgId = computed(
  () => user.value?.currentLoggedInOrgId || null
);
const completedHours = computed(() => {
  return Number(cpdStore.courseHistory?.summary?.totalCredits || 0);
});

const totalCpdHours = computed(() => user.value?.requiredCpdHours || 50);

const cards = computed(() => [
  {
    title: "Required CPD Hours",
    points: 200,
    icon: "https://cdn.lordicon.com/odxsdugo.json",
    totalHours: totalCpdHours.value,
  },
  {
    title: "Completed CPD Hours",
    points: 150,
    icon: "https://cdn.lordicon.com/itlfjzxp.json",
    totalHours: completedHours.value,
  },
  {
    title: "Remaining CPD Hours",
    points: 100,
    icon: "https://cdn.lordicon.com/amdfceua.json",
    totalHours: totalCpdHours.value - completedHours.value,
  },
]);

const tab = ref("All"); // "All" by default (id = 0)

// Filtering logic
function filteredCards(category) {
  if (!category) return courses.value;
  return courses.value[category];
}
const showCourse = (payload) => {
  selectedCourse.value = payload.course;
  if (payload.type === "learnMore") {
    step.value = 2;
  } else if (payload.type === "assign") {
    assignToDialogOpen.value = true;
  }
};

const getAllUsers = () => {
  userStore
    .getUserList({ roleId: null, orgId: currentLoggedInOrgId.value })
    .then((res) => {
      if (res.code === 0) {
        employees.value = res.data;
      }
    });
};
onMounted(() => {
  getCourses();

  getAllUsers();
  getUserCourseHistory();
});

const getCourses = () => {
  cpdStore.getCourses().then((res) => {
    if (res.code === 0) {
      courses.value = res.data;
      categories.value = Object.keys(res.data);
    }
  });
};
const getUserCourseHistory = () => {
  cpdStore.getUserCourseHistory().then((res) => {
    if (res.code === 0) {
    }
  });
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
.tab-text {
  
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
