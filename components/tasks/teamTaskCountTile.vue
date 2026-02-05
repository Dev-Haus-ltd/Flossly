<template>
  <v-card class="pa-4 d-flex flex-column justify-space-around user-card" flat @click="$emit('openUserDialog', userStat)" style="cursor: pointer;">
    <div v-if="userStat.user.photo" class="mx-auto">
      <img :src="userStat.user.photo" alt="User" class="user-photo" />
    </div>
    <div v-else class="mx-auto">
      <CommonAvatar :user="userStat.user" :size="40" />
    </div>

    <!-- Name -->
    <p class="user-name mt-2 text-center">{{ userStat.user.fullName }}</p>

    <!-- Role Chip -->
    <v-chip
      class="role-chip mt-1 d-flex align-center justify-center mx-auto"
      size="small"
      :color="userStat.user.role.color"
      label
      style="
        height: 22px;
        border-radius: 6px;
      "
    >
      {{userStat.user.role.title }}
    </v-chip>

    <!-- Stats Section -->
    <div class="stats d-flex justify-space-between mt-4">
      <div class="stat-item text-center">
        <div class="stat-count">{{ userStat.taskStats.completed }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="divider"></div>
      <div class="stat-item text-center">
        <div class="stat-count">{{ userStat.taskStats.pending }}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="divider"></div>
      <div class="stat-item text-center">
        <div class="stat-count">{{ userStat.taskStats.todo }}</div>
        <div class="stat-label">To Do</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
const { userStat } = defineProps(["userStat"]);
defineEmits(["openUserDialog"]);
</script>

<style scoped lang="scss">
.user-card {
  border: 1px solid #dbdbdb;
  height: 200px;
  border-radius: 20px;
}

.user-photo {
  width: 62px;
  height: 62px;
  border-radius: 12px;
  object-fit: cover;
}

.user-name {
  
  font-weight: 600;
  font-size: 14px;
  color: #1e1e1e;
}

.stats {
  position: relative;
  .stat-item {
    flex: 1;
  }

  .stat-count {
    
    font-weight: 600;
    font-size: 14px;
    color: #1e1e1e;
  }

  .stat-label {
    
    font-weight: 400;
    font-size: 10px;
    color: #737373;
  }

  .divider {
    width: 1px;
    background-color: #dbdbdb;
    margin: 0 12px;
  }
}
</style>
