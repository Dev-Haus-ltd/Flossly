<template>
  <div
    :style="`background-color: ${selected.priority.color}; height: 100%;`"
    class="pa-1 d-flex align-center"
  >
    <v-menu
      v-model="selected.priorityMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p v-bind="props" style="width: 100%;">
          {{ selected.priority.name }}
        </p>
      </template>

      <v-card width="250" class="pa-4">
        <v-list class="pa-0">
          <template v-if="!togglePriorityEdit">
            <v-list-item
              v-for="(p, i) in priorities"
              :key="i"
              :style="`background-color: ${p.color}; color:#fff; margin-bottom: 6px; min-height: 30px;`"
              class="rounded-sm"
              @click="
                () => {
                  selected.priorityId = p.id;
                  selected.priority = p;
                  selected.priorityMenu = false;
                  emit('update');
                }
              "
            >
              <v-list-item-title>{{ p.name }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item v-for="(p, i) in priorities" :key="i">
              <v-text-field
                v-model="p.name"
                density="compact"
                variant="solo"
                hide-details
                class="w-100 input-bordered"
                flat
              >
                <!-- 👇 Append custom brush icon with dynamic background color -->
                <template #prepend-inner>
                 <CommonColorPickerInput :item="p" />
                </template>
              </v-text-field>
            </v-list-item>
            <v-list-item style="cursor: pointer">
              <v-btn
                class="add-label-btn"
                density="default"
                variant="plain"
                @click="addPriorityAndEdit"
                >+ New Label</v-btn
              >
            </v-list-item>
          </template>

          <!-- + Add Status Button -->
        </v-list>
        <br />
        <v-divider class="mb-2"></v-divider>
        <div class="pa-2 d-flex justify-center">
          <v-btn
            @click="togglePriorityEdit = !togglePriorityEdit"
            variant="flat"
            color="primary"
            >{{ togglePriorityEdit ? "Apply" : "Edit Labels" }}</v-btn
          >
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { CommonColorPickerInput } from '#components';

const { selected, column, priorities } = defineProps([
  "selected",
  "column",
  "priorities",
]);
const emit = defineEmits(["update"]);
const togglePriorityEdit = ref(false);
const addPriorityAndEdit = () => {
  if (!togglePriorityEdit.value) {
    togglePriorityEdit.value = true;
  }
  priorities.push({
    key: "",
    name: "",
    color: "",
  });
};
</script>
<style scoped>
.add-label-btn {
  width: 100%;
  border: 1px solid #dfdfdf !important;
  min-height: 40px;
  border-radius: 8px;

}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
  border-radius: 8px;
}
</style>
