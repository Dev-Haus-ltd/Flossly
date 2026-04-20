<template>
  <v-card class="schedule-card pa-4 mb-3" elevation="0">
    <!-- Header -->
    <div class="d-flex justify-space-between align-start mb-3">
      <!-- Left -->
      <div>
        <h4 class="schedule-title">{{ schedule.scheduleName }}</h4>
        <div class="text-caption text-grey">
          {{ formatDate(schedule.startDate) }}
          -
          {{ schedule.endDate ? formatDate(schedule.endDate) : "Present" }}
        </div>
        <div class="text-caption text-grey mt-1">
          Repeated Pattern: {{ schedule.repeatPattern }}
        </div>
      </div>

      <!-- Right Actions -->
      <div class="d-flex align-center gap-1">
        <!-- Status -->
        <v-chip
          size="x-small"
          :color="schedule.isActive ? '#10B981' : '#9CA3AF'"
          text-color="white"
        >
          {{ schedule.isActive ? "Active" : "Inactive" }}
        </v-chip>

        <!-- Edit -->
        <v-tooltip text="Edit" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              class="action-btn"
              @click="$emit('edit', schedule.id)"
            >
              <img :src="editIcon" width="16" height="16" />
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Toggle -->
        <v-tooltip
          :text="schedule.isActive ? 'Deactivate' : 'Activate'"
          location="top"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              :color="schedule.isActive ? 'warning' : 'success'"
              class="action-btn"
              @click="$emit('toggle', schedule.id)"
            >
              <v-icon size="18">
                {{ schedule.isActive ? "mdi-pause" : "mdi-play" }}
              </v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Delete -->
        <v-tooltip text="Delete" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              class="action-btn"
              @click="$emit('delete', schedule)"
            >
              <img :src="deleteIcon" width="16" height="16" />
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Days -->
    <div class="days-row">
      <div
        v-for="day in sortedDays"
        :key="day.id"
        class="day-box"
        :class="{ working: day.isWorkingDay }"
      >
        <div class="day-name">{{ day.dayName.slice(0, 3) }}</div>

        <div v-if="day.isWorkingDay" class="day-time">
{{ formatTimeTo12Hour(day.startTime) }} - {{ formatTimeTo12Hour(day.endTime) }}
        </div>

        <div v-else class="off-text">Off</div>

        <!-- Breaks -->
        <div v-if="day.breaks?.length" class="breaks">
          <!-- Label -->
          <div class="break-title">
            <v-icon size="10" class="mr-1" color="#F59E0B"> mdi-coffee </v-icon>
            Break Time
          </div>

          <!-- Break List -->
          <div v-for="(b, i) in day.breaks" :key="i" class="break-item">
            {{ formatTimeTo12Hour(b.startTime) }} - {{ formatTimeTo12Hour(b.endTime) }}
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/delete_1.svg";
import { formatTimeTo12Hour } from "@/lib/timeFormatters"

const props = defineProps({
  schedule: Object,
});

const sortedDays = computed(() => {
  return [...(props.schedule.days || [])].sort((a, b) => a.order - b.order);
});

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>

<style scoped>
.schedule-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.schedule-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.days-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-box {
  padding: 8px;
  border-radius: 8px;
  background: #f9fafb;
  text-align: center;
  font-size: 11px;
}

.day-box.working {
  background: #ecfdf5;
  border: 1px solid #10b981;
}

.day-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.day-time {
  font-size: 10px;
}

.off-text {
  font-size: 10px;
  color: #9ca3af;
}

.breaks {
  margin-top: 6px;
  padding: 6px;
  border-radius: 6px;
  background: #fff7ed; /* soft orange background */
  border: 1px dashed #f59e0b;
}

.break-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.break-item {
  font-size: 9px;
  font-weight: 500;
  color: #9a3412;
  text-align: center;
  padding: 2px 0;
  background: #ffedd5;
  border-radius: 4px;
  margin-bottom: 2px;
}
/* Actions */
.action-btn {
  width: 28px;
  height: 28px;
}
</style>
