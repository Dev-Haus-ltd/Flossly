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
        
        <!-- Border line above edit button -->
        <div class="edit-button-divider"></div>
        
        <!-- Edit/Apply button -->
        <div class="edit-button-container">
          <v-btn
            class="edit-button"
            variant="flat"
            @click="togglePriorityEdit = !togglePriorityEdit"
          >
            <v-icon 
              size="16" 
              class="edit-icon"
            >
              {{ togglePriorityEdit ? "mdi-check" : "mdi-pencil-outline" }}
            </v-icon>
            <span class="edit-text">{{ togglePriorityEdit ? "Apply" : "Edit Labels" }}</span>
          </v-btn>
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

.edit-button-divider {
  width: 160px;
  height: 1px;
  background-color: hsla(0, 0%, 86%, 1);
  margin: 10px auto;
}

.edit-button-container {
  display: flex;
  justify-content: center;
  padding: 0 16px 16px;
}

.edit-button {
  opacity: 1;
  border-bottom-width: 1px;
  border-radius: 6px;
  padding: 6px 16px;
  background-color: hsla(180, 11%, 98%, 1) !important;
  box-shadow: none;
  text-transform: none;
  min-width: auto;
  height: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-icon {
  color: hsla(0, 0%, 43%, 1) !important;
}

.edit-text {
  color: hsla(0, 0%, 43%, 1);
  font-size: 14px;
}
</style>
