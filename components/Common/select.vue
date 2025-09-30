<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    max-height="400"
    width="350"
  >
    <template #activator="{ props }">
      <div class="editable role-field" v-bind="props">
        {{ modelValue?.title || "Select Role" }}
      </div>
    </template>

    <v-card class="role-menu rounded-lg">
      <!-- Fixed Search -->
      <div class="search-wrapper">
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search people, role"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          class="input-bordered"
          flat
        />
      </div>

      <!-- Scrollable List -->
      <div class="list-wrapper">
        <v-list>
          <v-list-item
            v-for="role in filteredRoles"
            :key="role.id"
            @click="selectRole(role)"
          >
            <template #prepend v-if="role.icon">
              <v-icon>{{ role.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ role.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ role.roleType }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: Object,
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "select"]);

const menu = ref(false);
const search = ref("");

const filteredRoles = computed(() => {
  if (!search.value) return props.items;
  const q = search.value.toLowerCase();
  return props.items.filter(
    (r) =>
      r.title?.toLowerCase().includes(q) ||
      r.roleType?.toLowerCase().includes(q)
  );
});

function selectRole(role) {
  emit("update:modelValue", role);
  emit("select", role);
  menu.value = false;
}
</script>

<style scoped>
.role-field {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  min-height: 40px;
  font-size: 14px;
  
  cursor: pointer;
  color: #101010;
}
.role-field:hover {
  border: 1px solid #dfdfdf;
}

.role-menu {
  display: flex;
  flex-direction: column;
  max-height: 400px; /* same as v-menu */
  overflow: hidden;
  padding: 0;
}

.search-wrapper {
  padding: 12px;
  border-bottom: 1px solid #eee;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-wrapper {
  overflow-y: auto;
  flex: 1;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important; 
  min-height: 40px;
  font-size: 14px;
  
}
</style>
