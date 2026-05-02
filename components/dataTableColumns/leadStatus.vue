<template>
    <div
      :style="`background-color: ${getHexColor()}; height: 100%; color: #fff;`"
      class="pa-1 d-flex align-center"
    >
      <v-menu
        v-model="selected.statusMenu"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{ props }">
          <p v-bind="props" class="px-2" style="width: 100%;">
            {{ selected?.leadStatus || 'N/A' }}
          </p>
        </template>
  
        <v-card width="250" class="pa-4">
          <v-list>
            <v-list-item
              v-for="(s, i) in leadStatuses"
              :key="i"
              :style="`background-color: ${s.color}; color: #fff; margin-bottom: 6px; min-height: 30px; text-align:center; border-radius:4px`"
              @click="
                () => {
                  selected.leadStatus = s.name;
                  emit('update');
                  selected.statusMenu = false;
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
  
  const leadStatuses = ref([
    { key: "new", name: "New", color: "#00A856" },
    { key: "converted", name: "Converted", color: "#0155B9" },
    { key: "contacted", name: "Contacted", color: "#ffc107" },
    { key: "lost", name: "Lost", color: "#dc3545" },
    { key: "uploaded", name: "Uploaded", color: "#8B5CF6" },
  ]);
  
  const getHexColor = () => {
    return (
      leadStatuses.value.find((x) => x.name === selected.leadStatus)?.color ||
      "#6c757d" // default gray
    );
  };
  </script>
  