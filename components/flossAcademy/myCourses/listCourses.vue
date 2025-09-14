<!-- MyCoursesTable.vue -->
<template>
  <div
    style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: auto"
    class="my-2"
  >
    <!-- Header -->
    <div
      style="border-bottom: 1px solid #dbdbdb"
      class="d-flex align-center justify-space-between px-4 py-2"
    >
      <h3 class="table-title">My Courses</h3>

      <!-- Search -->
      <v-text-field
        v-model="search"
        density="compact"
        placeholder="Search courses"
        hide-details
        variant="solo"
        class="input-bordered"
        flat
        append-inner-icon="mdi-magnify"
        style="max-width: 220px"
      />
    </div>

    <!-- Table -->
    <v-table class="course-table" density="comfortable">
      <thead>
        <tr>
          <th>Course Name</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(course, index) in filteredCourses" :key="index">
          <!-- Course Name -->
          <td>
            <div class="px-3">
              <p class="course-text">{{ course.name }}</p>
            </div>
          </td>

          <!-- Date -->
          <td>
            <div class="px-3">
              <p class="course-text">{{ parsedDate(course.date) }}</p>
            </div>
          </td>

          <!-- Status -->
          <td>
            <div class="px-3">
              <v-chip
                v-if="course.status === 'Completed'"
                color="#33B93C"
                class="status-chip"
              >
                Completed
              </v-chip>
              <v-chip
                v-else-if="course.status === 'In Progress'"
                color="#FF7C00"
                class="status-chip"
              >
                In Progress
              </v-chip>
              <v-chip v-else color="#FF2531" class="status-chip">
                Expired
              </v-chip>
            </div>
          </td>

          <!-- Actions -->
          <td>
            <div class="d-flex gap-3 px-3">
              <!-- Download -->
              <img
                src="@/assets/icons/download.svg"
                alt="Download"
                width="20"
                height="20"
                style="cursor: pointer"
                class="mr-2"
                @click="downloadCourse(course)"
              />

              <!-- Print -->
              <img
                src="@/assets/icons/print.svg"
                alt="Print"
                width="20"
                height="20"
                style="cursor: pointer"
                @click="printCourse(course)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { parsedDate } from '~/lib/dateFormatter';
const props = defineProps({
  courses: {
    type: Array,
    required: true,
  },
});

const search = ref("");

// Filter courses based on search
const filteredCourses = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.courses;
  return props.courses.filter(
    (course) =>
      (course.name || "").toLowerCase().includes(q) ||
      (course.status || "").toLowerCase().includes(q)
  );
});

// Action handlers
const downloadCourse = (course) => {
  console.log("Downloading:", course.name);
};
const printCourse = (course) => {
  console.log("Printing:", course.name);
};
</script>

<style scoped>
.table-title {
  font-family: Poppins;
  font-weight: 600;
  font-size: 14px;
  color: #1e1e1e;
  margin: 0;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.course-table th,
.course-table td {
  font-family: Poppins;
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
  width: 25%;
}

.course-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

/* Remove outer borders */
.course-table th:first-child,
.course-table td:first-child {
  border-left: none;
}
.course-table th:last-child,
.course-table td:last-child {
  border-right: none;
}
.course-table thead tr:first-child th {
  border-top: none;
}
.course-table tbody tr:last-child td {
  border-bottom: none;
}

.course-text {
  font-family: "Poppins";
  font-size: 14px;
  color: #101010;
  margin: 0;
}

.status-chip {
  font-family: "Poppins";
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
}

/* Search field styling */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
</style>
