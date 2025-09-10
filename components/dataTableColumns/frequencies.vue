<template>
  <div
    :style="`background-color: ${getHexColor()}; height: 100%;color:#fff;`"
    class="pa-1 d-flex align-center"
  >
    <v-menu
      v-model="selected.frequencyMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p
          v-bind="props"
        style="width: 100%;"> {{ selected?.frequency }}</p>
      </template>

      <v-card width="250" class="pa-4">
        <v-list>
          <v-list-item
            v-for="(s, i) in frequencyStatuses"
            :key="i"
            :style="`background-color: ${s.color}; color:#fff; margin-bottom: 6px; min-height: 30px;`"
            @click="
              () => {
                selected.frequency = s.name;
                emit('update');
                selected.frequencyMenu = false; // Optional: close menu on select
              }
            "
          >
            <v-list-item-title>{{ s.name }}</v-list-item-title>
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
  { key: "daily", name: "Daily", color: "#B9308A" }, // Green
  { key: "weekly", name: "Weekly", color: "#892E88" }, // Blue
  { key: "biweekly", name: "Biweekly", color: "#5D2684" }, // Indigo
  { key: "monthly", name: "Monthly", color: "#1B3D9F" }, // Purple
  { key: "quarterly", name: "Quarterly", color: "#0165B9" }, // Orange
  { key: "yearly", name: "Yearly", color: "#02AFAE" }, // Brown
  { key: "adhoc", name: "Ad Hoc", color: "#00A856" }, // Blue Grey
]);

const getHexColor = () => {
  return frequencyStatuses.value.find((x) => x.name === selected.frequency)?.color
}
</script>
