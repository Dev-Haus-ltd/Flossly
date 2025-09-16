<template>
  <v-card class="course-card pa-1 h-100" flat>
    <!-- Image -->
    <v-img
      :src="getImage()"
      height="240px"
      cover
      class="card-image rounded-lg"
    ></v-img>

    <!-- Content -->
    <div class="card-content">
      <!-- Time + Verified -->
      <div class="d-flex justify-space-between align-center mb-4">
        <!-- Time -->
        <div class="d-flex align-center">
          <v-icon size="16" color="#737373" class="mr-1"
            >mdi-clock-outline</v-icon
          >
          <span class="time-text">{{ course?.creditHours }} hrs</span>
        </div>

        <!-- Verified -->
        <div v-if="course?.isVerified" class="d-flex align-center">
          <v-icon size="16" color="#33B93C" class="mr-1"
            >mdi-check-circle-outline</v-icon
          >
          <span class="verified-text">Verified CPD</span>
        </div>
      </div>

      <!-- Title -->
      <div class="title-text mb-4">
        {{ course?.title }}
      </div>
      <!-- Actions -->
      <div v-if="isMyCourses">
        <!-- start course -->
        <v-btn
        v-if="course.status==='Pending'"
          variant="outlined"
          size="default"
          class="learn-more-btn"
          append-icon="mdi-arrow-right"
          @click="onLearnMore"
          flat
        >
          Start course
        </v-btn>

        <!-- continue -->
        <v-btn
          v-if="course.status==='In Progress'"
            variant="flat"
            size="default"
            color="primary"
            append-icon="mdi-arrow-top-right"
            @click="onLearnMore"
          >
           Continue
          </v-btn>
          <div  v-if="course.status==='Completed'" class="d-flex align-center">
          <v-icon size="16" color="#33B93C" class="mr-1"
            >mdi-check-circle-outline</v-icon
          >
          <span class="verified-text">Completed</span>
        </div>

      </div>
      <!-- Actions -->
      <div
        class="d-flex justify-space-between align-center"
        v-if="!isMyCourses"
      >
        <!-- Learn More -->
        <v-btn
          variant="outlined"
          size="default"
          class="learn-more-btn"
          append-icon="mdi-arrow-right"
          @click="onLearnMore"
          flat
        >
          Start course
        </v-btn>

        <!-- Assign To -->
        <v-btn
        v-if="isManager"
          variant="text"
          size="default"
          class="assign-btn"
          append-icon="mdi-arrow-top-right"
          @click="onAssign"
          flat
        >
          Assign To
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import safeGuard from '@/assets/images/courses/safeguard.png'
import act from '@/assets/images/courses/act.png'
import health from '@/assets/images/courses/health.png'
import infection from '@/assets/images/courses/infection.png'
const emit = defineEmits(["handleCourseClick"]);
const { isManager } = useUser();
const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
  isMyCourses: {
    type: Boolean,
    required: false,
  },
});

const getImage = () => {
  if (!props.course) return
  if (props.course.title === 'Safeguarding Level 1' || props.course.title === 'Safeguarding Level 2')
  return safeGuard
else if (props.course.title === 'Infection Control for Infection Control Leads')
return infection
else if (props.course.title === 'Health and Safety Awareness')
return health
else return act
}

const onLearnMore = () => {
  emit("handleCourseClick", { course: props.course, type: "learnMore" });
}

const onAssign = () => {
  emit("handleCourseClick", { course: props.course, type: "assign" });
}
</script>

<style scoped>
.course-card {
  border: 1px solid #dbdbdb;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-content {
  padding: 12px 12px 16px 12px; /* more padding on bottom */
}

.time-text {
  font-family: Poppins, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #737373;
}

.verified-text {
  font-family: Poppins, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #33b93c;
}

.title-text {
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1e1e1e;
  line-height: 1.4;
}

.learn-more-btn {
  border: 1px solid #3adf8d !important;
  color: #1e1e1e !important;
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
}

.learn-more-btn .v-icon {
  color: #1e1e1e !important;
}

.assign-btn {
  color: #3adf8d !important;
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
}

.assign-btn .v-icon {
  color: #3adf8d !important;
}
</style>
