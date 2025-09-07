<template>
  <v-card class="rounded-lg parent-card mt-6" :elevation="0">
    <!-- Header controls -->
    <div class="d-flex align-center head pa-4">
      <v-btn
        icon
        variant="text"
        class="no-bg-btn"
        density="comfortable"
        @click="prevWeek"
        :disabled="weekStartIndex === 0"
      >
        <v-icon color="#000000">mdi-chevron-left</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        class="no-bg-btn"
        density="comfortable"
        @click="nextWeek"
        :disabled="weekStartIndex + 7 >= allDays.length"
      >
        <v-icon color="#000000">mdi-chevron-right</v-icon>
      </v-btn>
      <div class="date-text">
        {{ rota?.name }} ({{ formatDate(rota?.startDate, "dd MMM") }} -
        {{ formatDate(rota?.endDate, "dd MMM") }})
      </div>
    </div>

    <!-- Header (dates of current visible week) -->
    <div class="rota-grid" :style="gridStyle">
      <div class="staff-col first-col-color d-flex align-center pa-4">
        <div class="d-flex flex-column align-center ml-2">
          <v-icon color="#000000" size="small" style="cursor: pointer"
            >mdi-chevron-up</v-icon
          >
          <v-icon color="#000000" size="small" style="cursor: pointer"
            >mdi-chevron-down</v-icon
          >
        </div>
        <h3 class="fst-col-title ml-2">Staff custom order</h3>
      </div>
      <div
        v-for="day in visibleDays"
        :key="day.date"
        class="day-col d-flex align-center justify-center"
      >
        <div>
          <h3 class="head-date text-center">
            {{ formatDate(day.date, "dd MMM") }}
          </h3>
          <h3 class="head-date text-center mt-2">
            {{ formatDate(day.date, "EEE") }}
          </h3>
        </div>
      </div>
      <div class="total-col d-flex align-center justify-center">
        <h3 class="head-date">Total Hours</h3>
      </div>
    </div>

    <!-- Rows: staff × days -->
    <div
      v-for="user in users"
      :key="user.id"
      class="rota-grid row"
      :style="gridStyle"
    >
      <!-- Staff Info -->
      <div class="staff-col first-col-color d-flex align-center pa-4">
        <CommonAvatar :user="user?.user" class="mr-2" size="45" />
        <div>
          <h3 class="fst-col-title">{{ user?.user.fullName }}</h3>
          <small class="text-grey">{{ user?.user.role.title }}</small>
        </div>
      </div>

      <!-- Days Cells -->
      <div
        v-for="day in visibleDays"
        :key="day.date + '-' + user.id"
        class="day-col shift-cell"
        @click="addShift(user, day)"
      >
        <div
          v-for="shift in getShifts(user.user.id, day.date)"
          :key="shift.id"
          @click="viewShift(shift)"
          class="shift-chip"
        >
          {{ shift.label }} ({{ getShiftDuration(shift) }}h)
        </div>
      </div>

      <!-- Weekly total per user -->
      <div class="total-col">
        {{ getUserTotalHours(user.user.id, visibleDays) }} hrs
      </div>
    </div>

    <!-- Footer daily totals -->
    <div class="rota-grid footer" :style="gridStyle">
      <div class="staff-col d-flex align-center justify-center">
        <h3 class="day-total-row">Daily total</h3>
      </div>
      <div
        v-for="day in visibleDays"
        :key="day.date"
        class="day-col d-flex justify-center align-center"
      >
        <h3 class="day-total-row">{{ getDayTotalHours(day.date) }} hrs</h3>
      </div>
      <div class="total-col"></div>
    </div>
  </v-card>
</template>

<script setup>
import { CommonAvatar } from "#components";
import { differenceInCalendarDays, addDays, parseISO, format } from "date-fns";

const { shifts, rota, users } = defineProps({
  shifts: Array,
  rota: Object,
  users: Array,
});

onMounted(() => {
  console.log(users, shifts);
});

const emit = defineEmits(["onAddShift"]);

// Build full day list
const start = parseISO(rota.startDate);
const end = parseISO(rota.endDate);
const totalDays = differenceInCalendarDays(end, start) + 1;
const allDays = Array.from({ length: totalDays }).map((_, i) => ({
  date: addDays(start, i),
}));

// Track visible range
const weekStartIndex = ref(0);
const visibleDays = computed(() =>
  allDays.slice(weekStartIndex.value, weekStartIndex.value + 7)
);

// Slide navigation
const prevWeek = () => {
  if (weekStartIndex.value > 0) weekStartIndex.value -= 7;
};
const nextWeek = () => {
  if (weekStartIndex.value + 7 < allDays.length) weekStartIndex.value += 7;
};

function formatDate(date, pattern) {
  return format(typeof date === "string" ? parseISO(date) : date, pattern);
}

// Dynamic grid style (200px staff + N days + 120px total col)
const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `280px repeat(${visibleDays.value.length}, 1fr) 147px`,
  height: "90px",
  borderBottom: "1px solid #eee",
}));

// Helpers
const getShifts = (userId, date) =>
  shifts.filter(
    (s) =>
      s.userId === userId &&
      format(s.startDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );

const getUserTotalHours = (userId, days) =>
  shifts
    .filter(
      (s) =>
        s.userId === userId &&
        days.some(
          (d) =>
            format(new Date(s.startDate), "yyyy-MM-dd") ===
            format(new Date(d.date), "yyyy-MM-dd")
        )
    )
    .reduce((acc, s) => acc + getShiftDuration(s), 0);

// total hours per day across all users
const getDayTotalHours = (date) =>
  shifts
    .filter(
      (s) =>
        format(new Date(s.startDate), "yyyy-MM-dd") ===
        format(new Date(date), "yyyy-MM-dd")
    )
    .reduce((acc, s) => acc + getShiftDuration(s), 0);

const addShift = (user, day) => {
  emit("onAddShift", { user, day });
};

const viewShift = (shift) => {
  console.log(shift);
};

const getShiftDuration = (shift) => {
  if (!shift.startDate || !shift.endDate) return 0;

  const diffMs =
    new Date(shift.endDate).getTime() - new Date(shift.startDate).getTime();
  const diffHours = diffMs / (1000 * 60 * 60); // convert ms → hours

  return diffHours;
};
</script>

<style scoped>
.parent-card {
  border: 1px solid #dbdbdb;
}
.head {
  border-bottom: 1px solid #dbdbdb;
}
.date-text {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
}
.fst-col-title {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
  color: #1e1e1e;
}
.head-date {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #737373;
}
.day-total-row {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #000000;
}
.rota-grid.header,
.rota-grid.footer {
  background: #f9f9f9;
}

.rota-grid.row {
  min-height: 64px;
  align-items: center;
}
.first-col-color {
  background-color: #f3f6fa;
}
.staff-col {
  height: 100%;
}
.staff-col,
.day-col,
.total-col {
  padding: 8px;
  border-right: 1px solid #eee;
}

.shift-cell {
  cursor: pointer;
  min-height: 48px;
}

.shift-chip {
  font-size: 12px;
  background: #e3f2fd;
  border-radius: 4px;
  padding: 2px 6px;
  position: relative;
  margin-bottom: 4px;
  z-index: 99999999;
  display: inline-block;
}
</style>
