<template>
  <div>
    <div class="d-flex align-center mb-1" style="gap: 5px">
      <label class="fld-lbl">{{ label }}</label>
      <img
        v-if="category"
        src="~/assets/icons/edit.svg"
        width="13"
        height="13"
        style="cursor: pointer; flex-shrink: 0"
        @click="panelOpen = true"
      />
    </div>

    <v-select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :items="localOptions"
      item-title="name"
      item-value="id"
      return-object
      variant="solo"
      density="compact"
      hide-details
      class="mb-1 input-bordered"
      flat
    />

    <CustomerRelationManagementManageOptionsPanel
      v-if="category"
      v-model="panelOpen"
      :title="`Manage ${label}`"
      :category="category"
      :options="localOptions"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { default: null },
  label: { type: String, required: true },
  options: { type: Array, default: () => [] },
  category: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'options-updated'])

const panelOpen = ref(false)
const localOptions = ref([...props.options])
watch(() => props.options, (v) => { localOptions.value = [...v] }, { deep: true })

const onUpdated = (opts) => {
  localOptions.value = opts
  emit('options-updated', opts)
}
</script>

<style scoped>
.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>
