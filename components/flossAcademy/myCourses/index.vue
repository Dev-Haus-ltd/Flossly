<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">My Courses</p>
      <p
        v-if="step === 2"
        @click="step = 1"
        style="color: blue !important; cursor: pointer"
      >
        {{ "/Course Details" }}
      </p>
    </div>
    <div class="px-5" v-if="step === 1">
      <v-row class="py-6" align="stretch">
        <v-col
          v-for="(card, index) in cards"
          :key="index"
          cols="12"
          sm="6"
          md="3"
        >
          <FlossAcademyCourseCard
            :course="card"
            @showCourse="showCourse"
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
const cards = ref([
  {
    id: 2,
    title: "Safeguarding Level 1",
    category: "All",
    creditHours: "5.00",
    mode: "eLearning",
    isVerified: true,
    thumbnail: "Training",
    objectives:
      "<p>By the end of this course, learners will:</p><ul><li>Understand what safeguarding means and why it is important.</li><li>Recognise key signs and types of abuse and neglect.</li><li>Know their individual role and responsibility for safeguarding.</li><li>Know how to respond to safeguarding concerns.</li><li>Understand how and when to report concerns using the correct procedures.</li><li>Value their duty to “whistleblow” in case of unsafe or poor practice.</li></ul>",
    aim: "To provide all staff and volunteers with the fundamental knowledge and confidence to recognise and report abuse or neglect, fulfilling statutory and ethical duties to safeguard children, young people, and adults at risk.",
    outcome: "Certificate",
    description:
      "It's Safeguarding level 1 course which is basic and first part of the Safeguarding course series",
    link: "https://www.youtube.com/watch?v=DMENM_KA0wA&ab_channel=CharlottePerospero",
    metaData: {},
    createdAt: "2025-09-12T20:31:41.473Z",
    updatedAt: "2025-09-12T20:31:41.473Z",
  },
  {
    id: 2,
    title: "Safeguarding Level 2",
    category: "All",
    creditHours: "5.00",
    mode: "eLearning",
    isVerified: true,
    thumbnail: "Training",
    objectives:
      "<p>By the end of this course, learners will:</p><ul><li>Understand what safeguarding means and why it is important.</li><li>Recognise key signs and types of abuse and neglect.</li><li>Know their individual role and responsibility for safeguarding.</li><li>Know how to respond to safeguarding concerns.</li><li>Understand how and when to report concerns using the correct procedures.</li><li>Value their duty to “whistleblow” in case of unsafe or poor practice.</li></ul>",
    aim: "To provide all staff and volunteers with the fundamental knowledge and confidence to recognise and report abuse or neglect, fulfilling statutory and ethical duties to safeguard children, young people, and adults at risk.",
    outcome: "Certificate",
    description:
      "It's Safeguarding level 1 course which is basic and first part of the Safeguarding course series",
    link: "https://www.youtube.com/watch?v=DMENM_KA0wA&ab_channel=CharlottePerospero",
    metaData: {},
    createdAt: "2025-09-12T20:31:41.473Z",
    updatedAt: "2025-09-12T20:31:41.473Z",
  },
]);
const myCourses = ref([
  { name: "Course A", date: "2025-09-10", status: "Completed" },
  { name: "Course B", date: "2025-09-05", status: "In Progress" },
  { name: "Course C", date: "2025-08-28", status: "Pending" },
]);
const showCourse = (course) => {
  selectedCourse.value = course;
  step.value = 2;
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
