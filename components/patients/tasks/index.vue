<template>
  <div class="patient-tasks">
    <section class="tasks-card">
      <div class="tasks-card__header">
        <h2>Tasks</h2>

        <button type="button" class="add-btn">
          <v-icon start>mdi-plus-circle-outline</v-icon>
          <span>Add Tasks</span>
        </button>
      </div>

      <div class="tasks-empty-state">
        <div class="tasks-empty-state__icon">
          <v-icon size="30" color="#2F72FF">mdi-clipboard-text-outline</v-icon>
        </div>
        <div class="tasks-empty-state__title">Add Task</div>
        <div class="tasks-empty-state__subtitle">No Task</div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.patient-tasks {
  margin-top: 18px;
}

.tasks-card {
  min-height: 535px;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tasks-card__header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f5;
}

.tasks-card__header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #242424;
}

.add-btn {
  height: 38px;
  border: 0;
  border-radius: 8px;
  padding: 0 18px;
  background: #0061fb;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.tasks-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 50px;
  text-align: center;
}

.tasks-empty-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #edf4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.tasks-empty-state__title {
  font-size: 29px;
  font-weight: 700;
  color: #2b2b2b;
  line-height: 1.1;
}

.tasks-empty-state__subtitle {
  margin-top: 6px;
  font-size: 18px;
  color: #9aa2af;
}

@media (max-width: 900px) {
  .tasks-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tasks-card__header h2 {
    font-size: 24px;
  }

  .tasks-empty-state__title {
    font-size: 24px;
  }

  .tasks-empty-state__subtitle {
    font-size: 16px;
  }
}
</style>
