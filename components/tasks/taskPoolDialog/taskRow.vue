<template>
  <div
    class="checklist-row d-flex align-center"
    :class="{ 'has-border': hasBorder }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- Checkbox Cell -->
    <div class="table-cell checkbox-cell">
      <v-checkbox
        v-model="localChecked"
        hide-details
        density="compact"
        class="ma-0 pa-0"
        color="primary"
      />
    </div>

    <!-- Title Cell -->
    <div class="table-cell title-cell">
      {{ title }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  id: [String, Number],
  hasBorder: { type: Boolean, default: true },
  checked: { type: Boolean, default: false },
})

const emit = defineEmits(['checked'])

const hover = ref(false)
const localChecked = ref(props.checked)

watch(
  () => props.checked,
  (val) => { localChecked.value = val }
)

watch(localChecked, (val) => {
 // Child
emit('checked', { id: props.id, checked: val })

})

</script>
<style scoped>
.checklist-row {
  display: flex;
  min-height: 48px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.checklist-row.has-border {
  border-bottom: 1px solid #e0e0e0;
}

.checklist-row:hover {
  background-color: #f5f5f5;
}

.table-cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.checkbox-cell {
  width: 60px;
  justify-content: center;
  border-right: 1px solid #e0e0e0;

}

.title-cell {
  flex: 1;
}
</style>