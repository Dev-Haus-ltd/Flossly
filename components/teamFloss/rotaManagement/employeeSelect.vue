<template>
    <div>
      <v-autocomplete
        v-model="internalValue"
        :items="employees"
        item-title="fullName"
        item-value="id"
        multiple
        variant="solo"
        flat
        density="compact"
        class="input-bordered"
        :menu-props="{ eager: true }"
        :rules="rules"
      >
        <!-- hide chips inside field -->
        <template #selection="{ index }">
          <span v-if="index === -1"></span>
        </template>
  
        <!-- custom dropdown item -->
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #prepend>
              <v-checkbox-btn
                :model-value="isSelected(item)"
                density="compact"
                readonly
                tabindex="-1"
              />
            </template>
            <template #title>
              <div class="d-flex align-center">
                <CommonAvatar
                  :user="{ fullName: item.raw.fullName }"
                  class="mx-2"
                  size="32"
                />
                {{ item.raw.fullName }}
              </div>
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
  
      <!-- chips below field -->
      <div class="d-flex flex-wrap">
        <v-chip
          v-for="id in internalValue"
          :key="id"
          closable
          close-icon="mdi-close"
          class="ma-1 py-5 rounded-lg"
          style="background-color: #d0e1e2"
          @click:close="removeChip(id)"
        >
          <CommonAvatar
            :user="{
              fullName: employees.find((e) => e.id === id)?.fullName,
            }"
            class="mr-2"
            size="30"
          />
          <span class="chip-content">
            {{ employees.find((e) => e.id === id)?.fullName }}
          </span>
        </v-chip>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from "vue";
  import { CommonAvatar } from "#components";
  
  const props = defineProps({
    modelValue: {
      type: Array,
      default: () => [],
    },
    employees: {
      type: Array,
      default: () => [],
    },
    rules: {
      type: Array,
      default: () => [],
    },
  });
  console.log(props.employees)
  const emit = defineEmits(["update:modelValue"]);
  
  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit("update:modelValue", val),
  });
  
  function isSelected(item) {
    // console.log(item,'usam')
    const id = item?.raw?.id ?? item?.id;
    return internalValue.value.includes(id);
  }
  
  function removeChip(id) {
    emit(
      "update:modelValue",
      internalValue.value.filter((e) => e !== id)
    );
  }
  </script>
<style scoped>

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}

.chip-content {
  
  font-weight: 500;
  font-style: Medium;
  font-size: 14px;
}
:deep(.v-chip .v-chip__close .mdi-close:before) {
  color: #000 !important;
  font-size: 18px; /* make it bigger */
  font-weight: 600; /* adds visual boldness */
}
</style>  