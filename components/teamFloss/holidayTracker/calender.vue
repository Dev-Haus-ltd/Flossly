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
        v-model="selectedLeave"
        ref="calender"
        :events="events"
        :event-color="getEventColor"
        hide-week-number
        color="primary"
        type="month"
        :event-more="false"
        class="team-holidays-calender"
      >
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
        <template v-slot:day-title="{ title }">
          <span style="font-size: 12px">{{ title }}</span>
        </template>
      </v-calendar>
    </v-card>
    
    <!-- Add Leave Panel - Only render after page loads -->
    <ClientOnly>
      <template v-if="events !== undefined">
        <TeamFlossUserDetailsLeaveManagementHolidayRequestDrawer
          v-model="addLeaveDrawer"
          origin="holidays"
          @close="addLeaveDrawer = false"
          @success="handleSuccess"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { CommonAvatar } from "#components";
import { parsedDate } from "~/lib/dateFormatter";
import { differenceInCalendarDays } from "date-fns";

const { events } = defineProps({
  events: Array,
});
const emit = defineEmits(["onUpdate"]);
const selectedLeave = ref(null);
const calender = ref(null)
const addLeaveDrawer = ref(false)
const onFiltersUpdated = (filters) => {
  emit("onUpdate", filters);
};

const formatDate = (date) => {
    return parsedDate(date)
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
</style>
