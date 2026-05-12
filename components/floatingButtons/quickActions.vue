<template>
  <div class="text-center">
    <v-menu v-model="menu" location="top" offset="10">
      <!-- Activator Button -->
      <template #activator="{ props }">
        <img
          v-bind="props"
          src="@/assets/icons/floatButton/quick-action.svg"
          alt="Support Menu Icon"
          class="support-icon"
          draggable="false"
        />
      </template>

      <!-- Menu Items -->
      <v-list class="custom-menu rounded-lg bg-secondary">
        <!-- Create Task -->
        <v-list-item @click="emitAction('create-task')">
          <template #prepend>
            <img
              src="@/assets/icons/floatButton/task.svg"
              width="20"
              height="20"
              class="mr-3"
              draggable="false"
            />
          </template>
          <v-list-item-title>Create Task</v-list-item-title>
        </v-list-item>

        <!-- Add Staff -->
        <v-list-item @click="emitAction('add-staff')">
          <template #prepend>
            <img
              src="@/assets/icons/floatButton/staff.svg"
              width="20"
              height="20"
              class="mr-3"
              draggable="false"
            />
          </template>
          <v-list-item-title>Add Staff</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
const menu = ref(false);

// Emits event to parent
const emit = defineEmits(["create-task", "add-staff"]);

const emitAction = (action) => {
  emit(action); // emit the event
  menu.value = false; // close menu
};
</script>
<style scoped>
.custom-menu {
  min-width: 220px; /* adjust as needed */
}
.support-icon {
  width: 60px;
  height: 60px;
  cursor: pointer;
  transition: transform 0.25s ease;
}

.support-icon:hover {
  transform: scale(1.05);
}
</style>
