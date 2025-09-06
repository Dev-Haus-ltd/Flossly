<template>
    <v-card class="pa-4 rounded-lg">
      <!-- Header controls -->
      <div class="d-flex justify-space-between align-center mb-2">
        <v-btn icon @click="prevWeek" :disabled="weekStartIndex === 0">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <div class="text-h6">{{ rota.name }} ({{ formatDate(rota.startDate, 'dd MMM') }} - {{ formatDate(rota.endDate, 'dd MMM') }})</div>
        <v-btn icon @click="nextWeek" :disabled="weekStartIndex + 7 >= allDays.length">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
  
      <!-- Header (dates of current visible week) -->
      <div class="rota-grid header" :style="gridStyle">
        <div class="staff-col">Staff</div>
        <div v-for="day in visibleDays" :key="day.date" class="day-col">
          <div>{{ formatDate(day.date, 'dd MMM') }}</div>
          <small>{{ formatDate(day.date, 'EEE') }}</small>
        </div>
        <div class="total-col">Total Hours</div>
      </div>
  
      <!-- Rows: staff × days -->
      <div
        v-for="user in staff"
        :key="user.id"
        class="rota-grid row"
        :style="gridStyle"
      >
        <!-- Staff Info -->
        <div class="staff-col d-flex align-center">
          <v-avatar size="32" class="mr-2">
            <v-img :src="user.avatar" />
          </v-avatar>
          <div>
            <div>{{ user.name }}</div>
            <small class="text-grey">{{ user.role }}</small>
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
            v-for="shift in getShifts(user.id, day.date)"
            :key="shift.id"
            class="shift-chip"
          >
            {{ shift.label }} ({{ shift.hours }}h)
          </div>
        </div>
  
        <!-- Weekly total per user -->
        <div class="total-col">
          {{ getUserTotalHours(user.id, visibleDays) }} hrs
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
  import {
    differenceInCalendarDays,
    addDays,
    parseISO,
    format,
  } from 'date-fns'

  const props = defineProps({
  shifts: Array,
  rota: Object,
  users: Array,
});
  
  // Example rota object
  const rota = ref({
    id: 14,
    name: 'Test Users',
    startDate: '2025-09-04',
    endDate: '2025-09-20',
  })
  
  // Build full day list
  const start = parseISO(rota.value.startDate)
  const end = parseISO(rota.value.endDate)
  const totalDays = differenceInCalendarDays(end, start) + 1
  const allDays = Array.from({ length: totalDays }).map((_, i) => ({
    date: addDays(start, i),
  }))
  
  // Track visible range
  const weekStartIndex = ref(0)
  const visibleDays = computed(() =>
    allDays.slice(weekStartIndex.value, weekStartIndex.value + 7)
  )
  
  // Slide navigation
  const prevWeek = () => {
    if (weekStartIndex.value > 0) weekStartIndex.value -= 7
  }
  const nextWeek = () => {
    if (weekStartIndex.value + 7 < allDays.length) weekStartIndex.value += 7
  }
  
  function formatDate(date, pattern) {
    return format(typeof date === 'string' ? parseISO(date) : date, pattern)
  }
  
  // Dynamic grid style (200px staff + N days + 120px total col)
  const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `200px repeat(${visibleDays.value.length}, 1fr) 120px`,
    borderBottom: '1px solid #eee',
  }))
  
  // Dummy staff
  const staff = ref([
    { id: 1, name: 'John Doe', role: 'Dentist', avatar: '/dummy1.png' },
    { id: 2, name: 'Sarah', role: 'Dental Nurse', avatar: '/dummy2.png' },
    { id: 3, name: 'Aneela', role: 'Receptionist', avatar: '/dummy3.png' },
  ])
  
  // Dummy shifts
  const shifts = ref([
    { id: 1, userId: 1, date: parseISO('2025-09-04'), label: 'Morning', hours: 4 },
    { id: 2, userId: 1, date: parseISO('2025-09-05'), label: 'Evening', hours: 4 },
    { id: 3, userId: 2, date: parseISO('2025-09-07'), label: 'Day Shift', hours: 8 },
    { id: 4, userId: 3, date: parseISO('2025-09-10'), label: 'Late Shift', hours: 6 },
  ])
  
  // Helpers
  const getShifts = (userId, date) =>
    shifts.value.filter(
      (s) =>
        s.userId === userId &&
        format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  
  const getUserTotalHours = (userId, days) =>
    shifts.value
      .filter(
        (s) =>
          s.userId === userId &&
          days.some((d) => format(s.date, 'yyyy-MM-dd') === format(d.date, 'yyyy-MM-dd'))
      )
      .reduce((acc, s) => acc + s.hours, 0)
  
  const getDayTotalHours = (date) =>
    shifts.value
      .filter((s) => format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      .reduce((acc, s) => acc + s.hours, 0)
  
  const addShift = (user, day) => {
    console.log('Add shift for', user.name, 'on', format(day.date, 'dd MMM yyyy'))
  }
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
    margin-bottom: 4px;
    display: inline-block;
  }
  </style>
  