<template>
  <v-card class="pa-4 rounded-lg">
    <!-- Header controls -->
    <div class="d-flex justify-space-between align-center mb-2">
      <v-btn icon @click="prevWeek" :disabled="weekStartIndex === 0">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <div class="text-h6">
        {{ rota?.name }} ({{ formatDate(rota?.startDate, "dd MMM") }} -
        {{ formatDate(rota?.endDate, "dd MMM") }})
      </div>
      <v-btn
        icon
        @click="nextWeek"
        :disabled="weekStartIndex + 7 >= allDays.length"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Header (dates of current visible week) -->
    <div class="rota-grid header" :style="gridStyle">
      <div class="staff-col">Staff</div>
      <div v-for="day in visibleDays" :key="day.date" class="day-col">
        <div>{{ formatDate(day.date, "dd MMM") }}</div>
        <small>{{ formatDate(day.date, "EEE") }}</small>
      </div>
      <div class="total-col">Total Hours</div>
    </div>

    <!-- Rows: staff × days -->
    <div
      v-for="user in users"
      :key="user.id"
      class="rota-grid row"
      :style="gridStyle"
    >
      <!-- Staff Info -->
      <div class="staff-col d-flex align-center">
        <CommonAvatar :user="user?.user" />
        <div>
          <div>{{ user?.user.fullName }}</div>
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
      <div class="staff-col">Daily total</div>
      <div v-for="day in visibleDays" :key="day.date" class="day-col">
        {{ getDayTotalHours(day.date) }} hrs
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
  gridTemplateColumns: `200px repeat(${visibleDays.value.length}, 1fr) 120px`,
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
  console.log(shift)
}

const getShiftDuration = (shift) => {
  if (!shift.startDate || !shift.endDate) return 0;

  const diffMs = new Date(shift.endDate).getTime() - new Date(shift.startDate).getTime();
  const diffHours = diffMs / (1000 * 60 * 60); // convert ms → hours

  return diffHours;
};
</script>

<style scoped>
.rota-grid.header,
.rota-grid.footer {
  background: #f9f9f9;
  font-weight: bold;
}

.rota-grid.row {
  min-height: 64px;
  align-items: center;
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
