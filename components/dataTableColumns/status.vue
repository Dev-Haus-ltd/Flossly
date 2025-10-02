<template>
  <div
    :style="`background-color: ${selected.status.color}; height: 100%;`"
    class="pa-1 d-flex align-center"
  >
    <v-menu
      v-model="selected.statusMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p v-bind="props" style="width: 100%;">
          {{ selected.status.name }}
        </p>
      </template>

      <v-card width="250" class="pa-4">
        <v-list>
          <template v-if="!toggleStatusEdit">
            <v-list-item
              v-for="(s, i) in statuses"
              :key="i"
              :style="`background-color: ${s.color}; color:#fff; margin-bottom: 6px; min-height: 30px;`"
              class="rounded-sm"
              @click="
                () => {
                  selected.statusId = s.id;
                  selected.status = s;
                  selected.statusMenu = false;
                  emit('update');
                }
              "
            >
              <v-list-item-title>{{ s.name }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item
              v-for="(s, i) in statuses"
              :key="i"
              class="py-1"
            >
            <v-text-field
                v-model="s.name"
                density="compact"
                variant="solo"
                hide-details
                class="w-100 input-bordered"
                flat
              >
                <template #prepend-inner>
                 <CommonColorPickerInput :item="s" />
                </template>
              </v-text-field>
            </v-list-item>

            <v-list-item style="cursor: pointer">
              <v-btn
                class="add-label-btn"
                density="default"
                variant="plain"
                @click="addStatusAndEdit"
                >+ New Label</v-btn
              >
            </v-list-item>
          </template>
        </v-list>
        <br />
        <v-divider class="mb-2"></v-divider>
        <div class="pa-2 d-flex justify-center">
          <v-btn
            @click="toggleStatusEdit = !toggleStatusEdit"
            variant="flat"
            color="primary"
            >{{ toggleStatusEdit ? "Apply" : "Edit Labels" }}</v-btn
          >
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
const { selected, column, statuses } = defineProps([
  "selected",
  "column",
  "statuses",
]);
const emit = defineEmits(["update"]);
const toggleStatusEdit = ref(false);

const addStatusAndEdit = () => {
  if (!toggleStatusEdit.value) {
    toggleStatusEdit.value = true;
  }
  statuses.push({
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
