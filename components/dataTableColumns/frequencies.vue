<template>
  <div
    :style="`background-color: ${getHexColor()}; height: 100%;color:#fff;`"
    class="pa-1 d-flex align-center"
  >
    <v-menu
      v-model="selected.frequencyMenu"
      :close-on-content-click="false"
      location="bottom center"
      offset="8"
      :max-width="250"
    >
      <template #activator="{ props }">
        <p
          v-bind="props"
          style="width: 100%; cursor: pointer;"
        >
          {{ selected?.frequency || 'N/A' }}
        </p>
      </template>

      <v-card 
        width="250" 
        class="frequency-menu-card"
        elevation="4"
        rounded="lg"
      >
        <!-- Cornered arrow -->
        <div class="frequency-arrow"></div>
        
        <v-list class="pa-2">
          <v-list-item
            v-for="(s, i) in frequencyStatuses"
            :key="i"
            :style="`background-color: ${s.color}; color:#fff; margin-bottom: 6px; min-height: 40px; border-radius: 8px;`"
            class="frequency-item"
            @click="
              () => {
                selected.frequency = s.name;
                emit('update');
                selected.frequencyMenu = false;
              }
            "
          >
            <v-list-item-title class="text-center">{{ s.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>
<script setup>

const { selected, column } = defineProps(["selected", "column"]);
const emit = defineEmits(["update"]);
const frequencyStatuses = ref([
  { key: "daily", name: "Daily", color: "#B9308A" },
  { key: "weekly", name: "Weekly", color: "#892E88" },
  { key: "fortnightly", name: "Fortnightly", color: "#5D2684" },
  { key: "monthly", name: "Monthly", color: "#1B3D9F" },
  { key: "6monthly", name: "6 Monthly", color: "#0165B9" },
  { key: "yearly", name: "Yearly", color: "#02AFAE" },
]);

const getHexColor = () => {
  return frequencyStatuses.value.find((x) => x.name === selected.frequency)?.color || '#6c757d';
}
</script>
<style scoped>
.frequency-menu-card {
  position: relative;
  margin-top: 8px;
}

.frequency-arrow {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
  filter: drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1));
}

.frequency-item {
  cursor: pointer;
  transition: opacity 0.2s;
}

.frequency-item:hover {
  opacity: 0.9;
}
</style>
