<template>
  <div class="main">
    <div class="d-flex align-center justify-space-between my-2">
      <div class="d-flex align-center">
        <TeamFlossHolidayTrackerFilters @update:filters="onFiltersUpdated" />
      </div>
      <v-btn @click="addLeaveDrawer = true" color="primary" variant="flat" rounded="lg" class="add-task-btn">
        <template #prepend>
          <v-icon size="18">mdi-plus-circle-outline</v-icon>
        </template>
        Add Time off
      </v-btn>
    </div>

    <v-card :elevation="0" flat class="rounded-lg border-sm py-3">
      <v-sheet height="64">
      <v-toolbar class="px-7" flat style="background-color: #fff">
        <v-btn
          class="mr-4"
          color="grey-darken-2"
          variant="outlined"
          @click="setToday"
        >
          Today
        </v-btn>
        <v-btn
          color="grey-darken-2"
          size="small"
          variant="text"
          icon
          @click="prev"
        >
          <v-icon size="small"> mdi-chevron-left </v-icon>
        </v-btn>
        <v-btn
          color="grey-darken-2"
          size="small"
          variant="text"
          icon
          @click="next"
        >
          <v-icon size="small"> mdi-chevron-right </v-icon>
        </v-btn>
        <v-toolbar-title v-if="calender">
          {{ calender.title }}
        </v-toolbar-title>
      </v-toolbar>
    </v-sheet>
      <v-calendar
        v-model="selectedDate"
        ref="calender"
        :events="events"
        :event-color="getEventColor"
        hide-week-number
        color="primary"
        type="month"
        :event-more="false"
        class="team-holidays-calender"
      >
      <template v-slot:day="{ date }">
        <div 
          @click="onDayClick({ date })" 
          style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; cursor: pointer;"
        >
        </div>
      </template>
      <template v-slot:event="{ event }">
        <v-menu open-on-hover location="right">
          <template v-slot:activator="{ props }">
            <div
              class="d-flex align-center px-1"
              :style="{
                border: '1px solid',
                borderLeft: '4px solid',
                borderRadius: '4px',
                width: '95%',
                margin: 'auto',
                cursor: 'pointer',
                borderColor: getColor(event.status),
              }"
              v-bind="props"
            >
              <CommonAvatar class="mr-2" :size="16" :user="event.user" />
              <p style="font-size: 10px">{{ event.user.fullName }}</p>
            </div>
        </template>

              <v-card class="rounded-lg pa-4" width="200">
                <div class="d-flex flex-column">
                  <CommonAvatar :user="event.user" :size="40" />
                  <h3>{{ event.user.fullName }}</h3>
                  <p>{{ formatDate(event.start) }}</p>
                  <p>{{ getTotalDays(event) + ' Days' }}</p>
                  <p :style="{color: getColor(event.status)}" >{{ event.title + ' Leave/s' }}</p>
                  <p>{{ 'Notes: '+ event.reason }}</p>
                </div>
        </v-card>
      </v-menu>
    </template>
      </v-calendar>
    </v-card>
    
    <!-- Add Leave Panel - Only render after page loads -->
    <ClientOnly>
      <template v-if="events !== undefined">
        <TeamFlossUserDetailsLeaveManagementHolidayRequestDrawer
          v-model="addLeaveDrawer"
          origin="holidays"
          :initial-date="selectedDate"
          @close="addLeaveDrawer = false"
          @success="handleSuccess"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { CommonAvatar } from "#components";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter";
import { differenceInCalendarDays } from "date-fns";

const { events } = defineProps({
  events: Array,
});
const emit = defineEmits(["onUpdate"]);
const calender = ref(null)
const addLeaveDrawer = ref(false)
const selectedDate = ref(null)
const focus = ref('')

const onFiltersUpdated = (filters) => {
  emit("onUpdate", filters);
};

const onDayClick = (day) => {
  console.log('Day clicked:', day);
  console.log('Date value:', day.date);
  selectedDate.value = day.date;
  console.log('selectedDate after set:', selectedDate.value);
  addLeaveDrawer.value = true;
};

const formatDate = (date) => {
    return formatDateDDMMYYYY(date)
}
const getTotalDays = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return differenceInCalendarDays(end, start) + 1;
}
function setToday() {
  focus.value = "";
}
const prev = () => {
  calender.value.prev();
};
const next = () => {
  calender.value.next();
};
const getColor = (status) => {
  if (status === "Pending") return "red";
};
const handleSuccess = () => {
  addLeaveDrawer.value = false;
  emit("onUpdate");
};
const getEventColor = (event) => {
  return "#ffffff";
};
</script>
<style lang="scss" scoped>
.tooltip-wrapper {
  position: relative;
}

.tooltip-content {
  position: absolute;
  top: 50%; /* show below the target */
  left: 100%;
  transform: translateX(-50%);
  display: none;
  z-index: 1000;
  p {
    font-size: 12px;
  }
}

.tooltip-wrapper:hover .tooltip-content {
  display: block;
}

:deep(.v-calendar-day) {
  position: relative;
}

:deep(.v-calendar-weekly__day-content) {
  position: relative;
  z-index: 2;
}

:deep(.v-calendar-event) {
  position: relative;
  z-index: 2;
}
</style>
