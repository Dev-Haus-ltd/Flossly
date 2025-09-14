<template>
  <div class="mt-6">
    <v-row align="stretch" class="video-row">
      <!-- Left Side: Video -->
      <v-col cols="9" class="d-flex">
        <video
          controls
          :src="course?.link"
          autoplay
          class="course-video flex-grow-1"
        >
          Your browser does not support the video tag.
        </video>
      </v-col>

      <!-- Right Side: Course Content Card -->
      <v-col cols="3" class="d-flex">
        <v-card class="course-card flex-grow-1" :elevation="0">
          <!-- Header -->
          <v-card-title class="course-card-header">
            Course Content
          </v-card-title>

          <v-card-text class="course-card-body">
            <p class="placeholder-text pa-3">Title: {{ course?.title }}</p>
            <p class="placeholder-text pa-3">Mode: {{ course?.mode }}</p>
            <p class="placeholder-text pa-3">Outcome: {{ course?.outcome }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Below rows -->
    <v-row class="mt-4" align="stretch">
      <!-- Overview Card -->
      <v-col cols="9">
        <v-card class="course-card" :elevation="0">
          <v-card-title class="course-card-header"> Overview </v-card-title>

          <v-card-text class="pa-4">
            <!-- Aim -->
            <h4 class="section-title">Aim:</h4>
            <p class="section-text">{{ course?.aim }}</p>

            <!-- Objectives -->
            <h4 class="section-title">Objectives:</h4>
            <div
              v-html="course?.objectives"
              class="pa-5"
              style="line-height: 30px"
            ></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row
      class="mt-4"
      align="stretch"
      v-if="!quizStarted && !notification.message"
    >
      <!-- Quiz Card -->
      <v-col cols="9">
        <v-card
          class="course-card d-flex flex-column justify-center align-center text-center"
          :elevation="0"
        >
          <v-card-title class="course-card-header w-100"> Quiz </v-card-title>

          <v-card-text class="quiz-text">
            <template v-if="!toggleStartQuizButton">
              <v-btn
                variant="text"
                class="quiz-btn"
                @click="toggleStartQuizButton = true"
              >
                <v-icon start color="#737373" class="mr-1 mb-1"
                  >mdi-lightbulb-on-outline</v-icon
                >
                Complete the course to Start Quiz
              </v-btn>
            </template>

            <template v-else>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-help-circle-outline"
                class="quiz-start-btn"
                @click="startQuiz"
              >
                Start Quiz
              </v-btn>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row
      class="mt-4"
      align="stretch"
      v-if="quizStarted && !notification.message"
    >
      <!-- Quiz Card -->
      <v-col cols="9">
        <v-card class="course-card" :elevation="0">
          <!-- Quiz Header -->
          <v-card-title class="course-card-header w-100"> Quiz </v-card-title>

          <v-card-text class="pa-4">
            <!-- Map questions -->
            <div
              v-for="(question, index) in questions"
              :key="question.id"
              class="question-card"
            >
              <!-- Question Header -->
              <div class="question-header">Question {{ index + 1 }}</div>
              <div class="px-3">
                <!-- Question Text -->
                <p class="question-text">{{ question.question }}</p>

                <!-- Options -->
                <v-radio-group
                  v-model="answers[question.id]"
                  class="options-group"
                >
                  <v-radio
                    :label="question.optionA"
                    :value="question.optionA"
                    class="option-item"
                  />
                  <v-radio
                    :label="question.optionB"
                    :value="question.optionB"
                    class="option-item"
                  />
                  <v-radio
                    :label="question.optionC"
                    :value="question.optionC"
                    class="option-item"
                  />
                  <v-radio
                    :label="question.optionD"
                    :value="question.optionD"
                    class="option-item"
                  />
                </v-radio-group>
              </div>
            </div>

            <!-- Submit button -->
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="primary"
                variant="flat"
                class="submit-btn"
                @click="submitQuiz"
              >
                Submit Quiz
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4" align="stretch" v-if="notification.message">
      <!-- Quiz Card -->
      <v-col cols="9">
        <v-card
          class="course-card d-flex flex-column justify-center align-center text-center"
          :elevation="0"
        >
          <v-card-title class="course-card-header w-100"> Quiz </v-card-title>

          <v-card-text class="w-70 mt-4 quiz-text">
            <v-alert
              v-if="notification.message"
              :type="notification.type"
              variant="tonal"
              border="start"
              border-color="primary"
              closable
              density="compact"
              width="600"
              @click:close="initialState"
            >
              <template #prepend>
                <v-icon size="20"></v-icon>
                <!-- smaller icon -->
              </template>

              <v-alert-title style="font-size: 16px">
                {{ notification.message }}
              </v-alert-title>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  course: {
    type: Object,
    default: {}, // dummy video
  },
});

const cpdStore = useCpdStore();
const toggleStartQuizButton = ref(false);
const quizStarted = ref(false);
const quizResult = ref(null);

// Dummy API response
const questions = ref([]);

// Store selected answers keyed by question id
const answers = ref({});
const store = useMainStore();
const notification = ref({
  message: "",
  type: "", // 'success' | 'error' | 'info' | 'warning'
});

const submitQuiz = async () => {
  try {
    const res = await cpdStore.submitQuiz({
      courseId: props.course.id,
      answers: answers.value,
    });
    if (res.code === 0) {
      quizResult.value = res.data;

      notification.value = {
        message:
          res.data?.message || res?.message || "Quiz submitted successfully",
        type: "Success",
      };
    } else {
      store.setSnackbar({
        title: res.data?.message || res?.message || "Failed to submit quiz",
        type: "Error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "Something went wrong while submitting the quiz",
      type: "Error",
    });
  }
};

const startQuiz = async () => {
  try {
    const res = await cpdStore.startQuiz({ courseId: props.course.id });

    if (res.code === 0) {
      questions.value = res.data;
      store.setSnackbar({
        title: res.data?.message || res?.message || "Quiz started successfully",
        type: "Success",
      });
      quizStarted.value = true;
    } else {
      notification.value = {
        message: res.data?.message || res?.message || "Failed to start quiz",
        type: "error",
      };
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "Something went wrong while starting the quiz",
      type: "Error",
    });
  }
};
const initialState = () => {
  notification.value = {
    message: "",
    type: "",
  };
  quizStarted.value = false;
  toggleStartQuizButton.value = false;
};
</script>

<style scoped>
.course-video {
  width: 100%;
  height: 100%; /* match column height */
  object-fit: cover;
  border: 1px solid #dbdbdb;
}

.course-card {
  border: 1px solid #dbdbdb;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

.course-card-header {
  background: #eff5f5;
  border-bottom: 1px solid #dbdbdb;
  font-family: Poppins;
  font-weight: 600;
  font-size: 16px;
  height: 62px;
  display: flex;
  align-items: center;
}

.course-card-body {
  background: #ffffff;
  padding: 0px 0px 40px 0px;
}

.placeholder-text {
  color: #1e1e1e;
  font-size: 14px;
  font-family: Poppins;
  border-bottom: 1px solid #dbdbdb;
}

.section-title {
  font-family: Poppins;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 6px;
}

.section-text {
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  margin-bottom: 12px;
}

.objectives-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.quiz-text {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.quiz-btn {
  color: #737373;
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
}

.quiz-start-btn {
  color: #1e1e1e;
  font-family: Poppins;
  font-weight: 500;
  font-size: 14px;
}
.question-card {
  border: 1px solid #3adf8d;
  margin-bottom: 16px;
  border-radius: 6px;
  border-radius: 12px;
}

.question-header {
  background: #213536;
  color: #ffffff;
  font-family: Poppins;
  font-weight: 600;
  font-size: 14px;
  padding: 8px;
  border-bottom: 1px solid #3adf8d;
  height: 53px;
  display: flex;
  align-items: center;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 8px 26px;
}

.question-text {
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  color: #000000;
  margin: 12px;
}

.options-group {
  display: flex;
  flex-direction: column;
}

.option-item {
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  color: #000000;
}

.submit-btn {
  font-family: Poppins;
  font-weight: 500;
  font-size: 14px;
  color: #1e1e1e;
}
</style>
