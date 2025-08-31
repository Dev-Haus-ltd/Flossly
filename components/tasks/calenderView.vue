<template>
  <v-card
    :elevation="0"
    class="rounded-lg border-sm"
  >
    <v-calendar
      v-model="selectedItem"
      :events="tasks"
      hide-week-number
      color="primary"
      type="month"
      class="team-holidays-calender"
    >
      <template v-slot:day-event="{ event }">
        <div class="tooltip-wrapper">
          <div
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
            v-bind="tooltipProps"
          >
            <p style="font-size: 10px">{{ event.title }}</p>
          </div>
          <div class="tooltip-content">
            <v-card class="rounded-lg pa-4" width="200">
              <div class="d-flex flex-column">
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
              </div>
            </v-card>
          </div>
        </div>
      </template>
      <template v-slot:day-title="{ title }">
        <span style="font-size: 12px">{{ title }}</span>
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
const emit = defineEmits(["onOpen"]);
const detailsDialog = ref(false);
const selectedItem = ref(null);
const { tasks } = defineProps({
  tasks: Array,
});

const openTaskDetails = (task) => {
  detailsDialog.value = true;
  selectedItem.value = task;
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
