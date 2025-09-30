<template>
  <div class="reward-item">
    <!-- Loop through tasks -->
    <div v-for="task in tasks" :key="task.id">
      <div class="date-label mb-2 ml-2">
        {{ parsedDate(task?.createdAt) }}
      </div>

      <div class="task-row mb-3">
        <!-- Left side: image + lordicon -->
        <div class="task-image">
          <img
            src="@/assets/images/myProfile/rewards.svg"
            alt="task-bg"
            class="img-bg"
          />
          <lord-icon
            src="https://cdn.lordicon.com/ypagsvdy.json"
            trigger="hover"
            colors="primary:#ffffff,secondary:#ffffff"
            style="width: 40px; height: 40px"
          />
        </div>

        <!-- Task name -->
        <div class="task-name ml-5">{{ task?.rewardPoint?.name }}</div>

        <!-- Points chip -->
        <v-chip
          class="bonus-chip ml-auto"
          variant="flat"
          size="small"
          prepend-icon="mdi-star"
          label
        >
          {{ task?.rewardPoint?.points }} Points
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";

defineProps({
  tasks: Array,
});
</script>

<style scoped>
.reward-item {
  padding-bottom: 20px;
}

.date-label {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.task-row {
  display: flex;
  align-items: center;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding-right: 12px;
  position: relative;
}

.task-image {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-bg {
  height: 80px;
  width: 100px;
  object-fit: cover;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.task-image lord-icon {
  position: absolute;
}

.task-name {
  
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}

.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
</style>
