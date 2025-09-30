<template>
  <div class="d-flex justify-space-between align-center mx-2">
    <!-- Avatars triggers -->
    <div class="d-flex align-center">
      <div
        v-for="(user, index) in assignedUsers"
        :key="user.id || index"
        class="avatar-trigger me-n2"
        @mouseenter="onTriggerEnter($event, user)"
        @mouseleave="onTriggerLeave"
      >
        <CommonAvatar :user="user" />
      </div>
    </div>

    <!-- Plus button trigger -->
    <div>
      <v-btn
        icon
        size="18"
        style="background-color: black; color: white"
        @mouseenter="onTriggerEnter($event, 'plus')"
        @mouseleave="onTriggerLeave"
      >
        <v-icon size="16">mdi-plus</v-icon>
      </v-btn>
    </div>

    <!-- Single shared menu, positioned using :activator -->
    <v-menu
      v-model="menu"
      :activator="currentActivator"
      location="bottom"
      transition="scale-transition"
      :close-on-content-click="false"
      max-width="320"
    >
      <!-- menu content -->
      <v-card
        width="320"
        class="pa-3 rounded-lg"
        :elevation="0"
        flat
        @mouseenter="cancelClose"   
        @mouseleave="onTriggerLeave" 
      >
        <template v-if="hoveredItem && hoveredItem !== 'plus'">
          <div class="d-flex flex-wrap mb-3">
  <v-chip
    v-for="(a, index) in assignedUsers"
    :key="index"
    color="#1E1E1E"
    class="me-1 mb-1 py-5 d-flex align-center rounded-lg"
    style=" font-weight: 500; font-size: 14px; background-color: #d0e1e2;"
    label
      closable
    @click:close="emit('unassign', a)"
  >
    <CommonAvatar :user="a" class="me-2" :size="30" />

    {{ a.id === currentUser?.id ? "Me" : a.fullName }}

 
  </v-chip>
</div>
        </template>

        <template v-else-if="hoveredItem === 'plus'">
          <!-- Content for plus menu (you can change this) -->
          <div class="mb-3">Add new assignment</div>
        </template>

        <!-- Search -->
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search people, role"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          class="mb-3 input-bordered"
          flat
        />

        <div class="text-subtitle-2 text-grey-darken-1 mb-1">Suggested People</div>

        <!-- Suggestions -->
        <v-list v-if="filteredSuggestions.length" density="compact" class="suggested-list">
          <v-list-item
            v-for="suggested in filteredSuggestions"
            :key="suggested.id"
            @click="selectUser(suggested)"
            class="pl-0"
          >
            <template #prepend>
              <CommonAvatar :user="suggested" />
            </template>
            <v-list-item-title class="ms-2">{{ suggested.fullName }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-list v-else density="compact" class="suggested-list">
          <v-list-item class="pl-0">
            <v-list-item-title class="ms-2">No user available for this task</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
const emit = defineEmits(["assign", "unassign"]);
const props = defineProps({
  assignedUsers: { type: Array, required: true },
  allUsers: { type: Array, required: true },
  currentUser: { type: Object, required: true },
});

const menu = ref(false);
const currentActivator = ref(null); // DOM element the menu should anchor to
const hoveredItem = ref(null); // either a user object or 'plus'

// timers to prevent flicker and to close/reopen safely
let openTimeout = null;
let closeTimeout = null;
const OPEN_REOPEN_DELAY = 0; // ms — when switching activator
const CLOSE_DELAY = 0; // ms — delay before actually closing menu

const search = ref("");

// called when user or plus is hovered
const onTriggerEnter = (event, item) => {
  // stop any scheduled close
  clearTimeout(closeTimeout);

  const el = event.currentTarget;
  hoveredItem.value = item;

  // if menu already open and activator is different -> force reopen to reposition
  if (menu.value && currentActivator.value !== el) {
    menu.value = false; // close first so Vuetify can rebind activator
    clearTimeout(openTimeout);
    openTimeout = setTimeout(() => {
      currentActivator.value = el;
      menu.value = true;
    }, OPEN_REOPEN_DELAY);
  } else {
    // normal open
    currentActivator.value = el;
    menu.value = true;
  }
};

// schedule menu to close (when leaving trigger or menu)
const onTriggerLeave = () => {
  clearTimeout(openTimeout);
  clearTimeout(closeTimeout);
  closeTimeout = setTimeout(() => {
    menu.value = false;
    currentActivator.value = null;
    hoveredItem.value = null;
  }, CLOSE_DELAY);
};

// called when mouse enters the menu itself — cancel any scheduled close
const cancelClose = () => {
  clearTimeout(closeTimeout);
};

const filteredSuggestions = computed(() => {
  const q = (search.value || "").toLowerCase();
  const assignedIds = props.assignedUsers.map((u) => u?.id);
  return props.allUsers.filter((u) => {
    const matchText = `${u.fullName} ${u.role?.title || ""}`.toLowerCase();
    return !assignedIds.includes(u.id) && matchText.includes(q);
  });
});

const selectUser = (user) => {
  emit("assign", user);
  // close after assigning
  menu.value = false;
};
</script>

<style scoped>
.suggested-list {
  max-height: 200px;
  overflow-y: auto;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
/* make trigger elements inline-block so event.currentTarget is that wrapper */
.avatar-trigger {
  display: inline-block;
}
</style>
