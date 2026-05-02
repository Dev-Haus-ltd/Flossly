<template>
    <div class="cell-wrap">
      <v-menu
        v-model="selected.leadSourceMenu"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{ props }">
          <p v-bind="props" class="mb-0 ml-2 cell-text">
            {{ displayLeadSource }}
          </p>
        </template>

        <v-card class="dropdown-card">
          <v-list class="dropdown-list">
            <v-list-item
              v-for="(s, i) in localSources"
              :key="i"
              class="dropdown-item"
              :class="{ 'dropdown-item--active': selected.leadSourceId === s.id }"
              @click="() => {
                selected.leadSourceId = s.id;
                selected.leadSource = s;
                selected.leadSourceMenu = false;
                emit('update');
              }"
            >
              <v-list-item-title class="dropdown-item-title">{{ s.name }}</v-list-item-title>
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
        title="Manage Sources"
        category="lead_source"
        :options="localSources"
        @updated="onOptionsUpdated"
      />
    </div>
  </template>

  <script setup>
  const props = defineProps({
    selected: { type: Object, required: true },
    column: { type: Object },
    leadSources: { type: Array, default: () => [] },
  });
  const emit = defineEmits(["update", "options-updated"]);

  // expose selected as plain ref for template mutations (object reference stays reactive)
  const selected = props.selected

  const localSources = ref([...(props.leadSources || [])])
  watch(() => props.leadSources, (v) => { localSources.value = [...(v || [])] }, { deep: true })

  const panelOpen = ref(false)

  const onOptionsUpdated = (options) => {
    localSources.value = options
    emit('options-updated', { category: 'lead_source', options })
  }

  const displayLeadSource = computed(() => {
    const s = props.selected;
    if (s?.leadSource?.name) return s.leadSource.name;
    const raw = s?.leadSource;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    const rawId = s?.leadSourceId ?? (typeof raw === "number" ? raw : null);
    if (rawId != null) {
      const match = localSources.value.find((o) => o.id === rawId);
      if (match?.name) return match.name;
    }
    if (s?.leadSourceName?.trim) {
      const name = s.leadSourceName.trim();
      if (name) return name;
    }
    return "N/A";
  });
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
