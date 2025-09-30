<template>
  <v-menu
    v-model="item.showPicker"
    :close-on-content-click="false"
    location="bottom"
    offset-y
  >
    <template #activator="{ props }">
      <div
        v-bind="props"
        class="icon-wrapper"
        :style="{
          backgroundColor: item.color || '#607D8B',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '6px'
        }"
      >
        <v-icon color="white" size="18px">mdi mdi-brush-variant</v-icon>
      </div>
    </template>

    <v-color-picker
      v-model="item.color"
      mode="hex"
      hide-inputs
      width="185"
      @update:modelValue="emitColor"
    />
  </v-menu>
</template>

<script setup>
const { item } = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update"]);

function emitColor(newColor) {
  item.showPicker = false
  emit("update", { color: newColor });
  }
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
