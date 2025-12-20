<template>
  <v-card :elevation="0" class="rounded-lg border-sm">
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
        <v-toolbar-title v-if="calender" :class="xs ? 'text-caption' : 'text-body-1'">
          {{ calender.title }}
        </v-toolbar-title>
      </v-toolbar>
    </v-sheet>
    <v-calendar
      ref="calender"
      v-model="focus"
      :event-color="getEventColor"
      event-overlap-mode="column"
      :event-overlap-threshold="1"
      :event-more="false"
      :events="tasks"
      type="month"
      class="team-holidays-calender"
    >
      <template v-slot:event="{ event }">
        <v-menu open-on-hover location="right">
          <template v-slot:activator="{ props }">
            <div
              v-bind="props"
              @click="openTaskDetails(event)"
              class="d-flex align-center px-1 mb-1"
              :style="{
                border: '1px solid',
                borderLeft: '4px solid',
                borderRadius: '4px',
                width: '95%',
                margin: 'auto',
                cursor: 'pointer',
                borderColor: event.color,
              }"
            >
              <p style="font-size: 10px; overflow: hidden">{{ event.title }}</p>
            </div>
          </template>

          <v-card class="rounded-lg pa-4" width="250">
            <h4>{{ "Task: " + event.title }}</h4>
            <p>Assigned To:</p>
            <CommonAvatar
              v-for="(user, index) in event.assignedUsers"
              :user="user"
              :key="index"
              :size="24"
            />
            <p :style="{ color: event.status.color }">
              {{ "Status: " + event.status.name }}
            </p>
            <p :style="{ color: event.priority.color }">
              {{ "Priority: " + event.priority.name }}
            </p>
            <p v-if="event.frequency">
              {{ "Frequency: " + event.frequency }}
            </p>
            
            <!-- Quick Action Buttons -->
            <div class="d-flex flex-column mt-3" style="gap: 8px;">
              <v-btn
                v-if="event.status.key !== 'completed' && !event.isVirtualInstance"
                size="small"
                color="success"
                variant="flat"
                @click="completeTask(event)"
                :loading="completingTask === event.id"
              >
                <v-icon size="16" class="mr-1">mdi-check-circle</v-icon>
                Mark Complete
              </v-btn>
              
              <v-btn
                v-if="!event.isVirtualInstance"
                size="small"
                color="primary"
                variant="outlined"
                @click="openTaskDetails(event)"
              >
                <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
                Edit Details
              </v-btn>

              <v-chip 
                v-if="event.isVirtualInstance"
                size="small"
                color="info"
                variant="outlined"
              >
                <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                Future Instance
              </v-chip>
            </div>
          </v-card>
        </v-menu>
      </template>
    </v-calendar>
    <TasksTaskDetailsDialog
      v-model="detailsDialog"
      :selectedItem="selectedItem"
      @close="detailsDialog = false"
    />
  </v-card>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()
const emit = defineEmits(["onOpen", "onTaskCompleted"]);
const detailsDialog = ref(false);
const selectedItem = ref(null);
const calender = ref(null);
const focus = ref("");
const { tasks } = defineProps({
  tasks: Array,
});
const showingAllTasks = ref(false);
const completingTask = ref(null);

// Composables and stores
const taskStore = useTaskStore();
const mainStore = useMainStore();

const openTaskDetails = (task) => {
  detailsDialog.value = true;
  selectedItem.value = task;
};

const completeTask = async (task) => {
  if (!task.id || task.isVirtualInstance) {
    mainStore.setSnackbar({
      title: "Cannot complete virtual future instances. Please wait for the actual due date.",
      type: "warning",
    });
    return;
  }
  
  completingTask.value = task.id;
  
  try {
    const completedStatusId = await getCompletedStatusId();
    if (!completedStatusId) {
      throw new Error("Completed status not found");
    }

    const response = await taskStore.updateUserTask({
      id: task.id,
      taskId: task.taskId || task.originalTaskId || task.id,
      statusId: completedStatusId,
    });

    if (response.code === 0) {
      mainStore.setSnackbar({
        title: `Task "${task.title}" completed successfully!${task.frequency && task.frequency !== 'One off' ? ' Next instance has been generated.' : ''}`,
        type: "success",
      });
      
      emit("onTaskCompleted");
    } else {
      throw new Error(response.message || "Failed to complete task");
    }
  } catch (error) {
    mainStore.setSnackbar({
      title: error.message || "Failed to complete task. Please try again.",
      type: "error",
    });
  } finally {
    completingTask.value = null;
  }
};

const getCompletedStatusId = async () => {
  try {
    const orgStore = useOrgStore();
    const statuses = await orgStore.getTaskStatuses();
    if (statuses.code === 0) {
      const completedStatus = statuses.data.find(s => s.key === "completed");
      return completedStatus?.id;
    }
    return null;
  } catch (error) {
    return null;
  }
};
function setToday() {
  focus.value = "";
}
const prev = () => {
  calender.value.prev();
};
const next = () => {
  calender.value.next();
};
const toggleAllTasks = () => {
  showingAllTasks.value = !showingAllTasks.value;
};
const limitedEvents = (events) => {
  if (showingAllTasks.value) return events;
  else return events?.slice(0, 3) || [];
};

const extraEventsCount = (events) => {
  const total = events?.length || 0;
  return total > 3 ? total - 3 : 0;
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
.more-tasks-label {
  font-size: 12px;
  color: blue;
}
</style>
