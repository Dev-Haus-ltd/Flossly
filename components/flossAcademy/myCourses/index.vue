<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1"
      :style="step === 2 ? 'color: blue; cursor: pointer;' : ''"
      @click="step = 1"
      
      >My Courses</p>
      <p
        v-if="step === 2"
      
      >
        {{ "/Course Details" }}
      </p>
    </div>
    <div class="px-5" v-if="step === 1">
      <v-row v-if="cards && cards.length" class="py-6" align="stretch">
        <v-col
          v-for="(card, index) in cards"
          :key="index"
          cols="12"
          sm="6"
          md="3"
        >
          <FlossAcademyCourseCard
            :course="card"
            @handleCourseClick="showCourse"
            :isMyCourses="true"
          />
        </v-col>
      </v-row>
      <FlossAcademyMyCoursesListCourses :courses="myCourses" />
    </div>
    <div class="px-5" v-if="step === 2">
      <FlossAcademyCourseDetail :course="selectedCourse" />
    </div>
  </div>
</template>
<script setup>
const step = ref(1);
const selectedCourse = ref(null); 
const cpdStore = useCpdStore();
const cards = computed(() => {
  return (cpdStore.courseHistory?.courseHistory || [])?.map(crd => ({
    ...crd.course,   
    status: crd.status 
  }))
})

const myCourses = computed(() =>
  cpdStore.courseHistory?.courseHistory?.map((item) => ({
    name: item.course?.title || "Untitled",
    date: item.createdAt,
    status: item.status,
  }))
);
const showCourse = (payload) => {
  selectedCourse.value = payload.course;
  if (payload.type === "learnMore") {
    step.value = 2;
  }
};
onMounted(()=>{
  getUserCourseHistory()
})
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
</style>
