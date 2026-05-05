<template>
  <div class="cell-wrap">
    <v-menu
      v-model="selected.treatmentMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p v-bind="props" class="mb-0 ml-2 cell-text">
          {{ getTreatmentDisplay() }}
        </p>
      </template>

      <v-card class="dropdown-card">
        <v-list class="dropdown-list">
          <v-list-item
            v-for="(t, i) in localSources"
            :key="i"
            class="dropdown-item"
            :class="{ 'dropdown-item--active': selected.treatmentId === t.id || selected.treatment?.id === t.id }"
            @click="handleTreatmentSelect(t)"
          >
            <v-list-item-title class="dropdown-item-title">{{ t.name }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="!localSources || localSources.length === 0" class="dropdown-item" style="pointer-events: none">
            <v-list-item-title class="dropdown-item-title" style="color: #9ca3af">No treatments available</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <img
      src="~/assets/icons/edit.svg"
      width="13"
      height="13"
      class="edit-icon"
      @click.stop="panelOpen = true"
    />

    <CustomerRelationManagementManageOptionsPanel
      v-model="panelOpen"
      title="Manage Treatments"
      category="treatment"
      :options="localSources"
      @updated="onOptionsUpdated"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  selected: { type: Object, required: true },
  column: { type: Object },
  treatmentSources: { type: Array, default: () => [] }
})
const emit = defineEmits(["update", "options-updated"])

const localSources = ref([...(props.treatmentSources || [])])
watch(() => props.treatmentSources, (v) => { localSources.value = [...(v || [])] }, { deep: true })

const panelOpen = ref(false)

const onOptionsUpdated = (options) => {
  localSources.value = options
  emit('options-updated', { category: 'treatment', options })
}

const getTreatmentDisplay = () => {
  const treatment = props.selected?.treatment;
  if (!treatment) return 'N/A';
  if (typeof treatment === 'object') return treatment.name?.trim() || 'N/A';
  if (typeof treatment === 'string') return treatment.trim() || 'N/A';
  return 'N/A';
};

const handleTreatmentSelect = (t) => {
  props.selected.treatmentId = t.id;
  props.selected.treatment = t;
  props.selected.treatmentMenu = false;
  emit('update');
}
</script>

<style scoped>
.cell-wrap {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 4px;
  gap: 4px;
}
.cell-text {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.edit-icon {
  flex-shrink: 0;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}
.cell-wrap:hover .edit-icon { opacity: 0.6; }
.edit-icon:hover { opacity: 1 !important; }
.dropdown-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
  padding: 6px;
  min-width: 200px;
}
.dropdown-list {
  padding: 0 !important;
  background: #ffffff !important;
}
.dropdown-item {
  border-radius: 8px !important;
  min-height: 36px !important;
  padding: 0 12px !important;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.dropdown-item:last-child { margin-bottom: 0; }
.dropdown-item:hover { background-color: #f0f4ff !important; }
.dropdown-item--active { background-color: #e8f1ff !important; }
.dropdown-item--active .dropdown-item-title {
  color: #0061FB !important;
  font-weight: 500;
}
.dropdown-item-title { font-size: 13px !important; color: #1f2937; }
</style>
