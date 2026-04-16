<template>
  <div class="text-center">
    <v-menu v-model="menu" location="top" offset="10">
      <!-- Activator Button -->
      <template #activator="{ props }">
        <img
          v-bind="props"
          src="@/assets/icons/floatButton/support.svg"
          alt="Support Menu Icon"
          class="support-icon"
          draggable="false"
        />
      </template>

      <!-- Menu Items -->
      <v-list class="custom-menu rounded-lg bg-secondary">
        <!-- Chat Support -->
        <v-list-item @click="emitAction('chat-support')">
          <template #prepend>
            <img
              src=""
              alt="img"
              width="18"
              height="18"
              class="mr-3"
            />
          </template>
          <v-list-item-title>Chat with Support</v-list-item-title>
        </v-list-item>

        <!-- Call Support -->
        <v-list-item @click="emitAction('call-support')">
          <template #prepend>
            <img
              src=""
              alt=""
              width="18"
              height="18"
              class="mr-3"
            />
          </template>
          <v-list-item-title>Request a Call</v-list-item-title>
        </v-list-item>

        <!-- Email Support -->
        <v-list-item @click="emitAction('email-support')">
          <template #prepend>
            <img
              src=""
              alt="img"
              width="18"
              height="18"
              class="mr-3"
            />
          </template>
          <v-list-item-title>Email Support</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { ref } from "vue";

const menu = ref(false);

  // Emits event to parent
const emit = defineEmits(["chat-support", "call-support", "email-support"]);

const emitAction = (action) => {
    emit(action); // emit event to parent
    menu.value = false; // close menu
};
</script>

<style scoped>
.custom-menu {
  min-width: 220px;
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
