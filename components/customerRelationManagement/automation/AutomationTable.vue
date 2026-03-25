<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3" v-if="showHeader">
      <div class="d-flex align-center gap-2">
        <v-btn icon variant="text" @click="$emit('back')">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div>
          <div class="field-label mb-1">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">{{ description }}</div>
        </div>
      </div>
    </div>

    <v-alert
      v-if="infoText"
      type="info"
      variant="tonal"
      class="mb-3"
      density="compact"
    >
      {{ infoText }}
    </v-alert>

    <div class="d-flex flex-wrap justify-space-between align-center mb-3 automation-toolbar">
      <div class="d-flex align-center gap-2">
        <v-text-field
          :model-value="search"
          placeholder="Search automations..."
          append-inner-icon="mdi-magnify"
          variant="solo"
          :elevation="0"
          density="compact"
          hide-details
          bg-color="#FFFFFF"
          flat
          class="custom-search"
          style="width: 280px"
          @update:model-value="$emit('update:search', $event)"
        />

        <v-menu :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="flat"
              density="compact"
              class="filter-btn"
            >
              <v-icon class="mr-2" size="18">mdi-filter-variant</v-icon>
              Filter
              <v-badge
                v-if="activeFilters > 0"
                :content="activeFilters"
                color="primary"
                inline
                class="ml-2"
              />
            </v-btn>
          </template>
          <v-card class="pa-4" min-width="280">
            <p class="text-subtitle-2 font-weight-bold mb-3">Filter by Status</p>
            <v-checkbox
              :model-value="filterEnabled"
              label="Enabled only"
              density="compact"
              hide-details
              class="mb-2"
              @update:model-value="$emit('update:filterEnabled', $event)"
            />
            <v-checkbox
              :model-value="filterDisabled"
              label="Disabled only"
              density="compact"
              hide-details
              @update:model-value="$emit('update:filterDisabled', $event)"
            />
            <v-divider class="my-3" />
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="$emit('clearFilters')"
            >
              Clear filters
            </v-btn>
          </v-card>
        </v-menu>
      </div>
    </div>

    <v-card class="with-border rounded-lg elevation-0">
      <v-divider />

      <v-data-table
        :items="rows"
        :headers="headers"
        :search="search"
        item-value="key"
        class="automation-data-table full-width-table"
        density="comfortable"
        hover
        :items-per-page="15"
      >
        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
            <v-icon size="14" class="mr-1">
              {{ String(item.type || 'Email').toLowerCase() === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-email-outline' }}
            </v-icon>
            {{ item.type }}
          </v-chip>
        </template>

        <template #item.name="{ item }">
          <div class="name-text">
            {{ item.name || item.key }}
          </div>
        </template>

        <template #item.sending="{ item }">
          <div class="d-flex  align-center justify-space-between trigger-cell">
            <div class="d-flex align-center">
              <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-body-2 text-medium-emphasis trigger-text">{{ item.sending }}</span>
            </div>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <img
                  v-bind="props"
                  src="@/assets/icons/edit.svg"
                  alt="Edit trigger"
                  width="18"
                  height="18"
                  class="action-icon-btn"
                  @click="$emit('openTrigger', item)"
                />
              </template>
              <span>Edit trigger</span>
            </v-tooltip>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center" style="gap: 16px;">
            <v-tooltip v-if="showPreviewAction" location="top">
              <template #activator="{ props }">
                <img
                  v-bind="props"
                  src="@/assets/icons/view.svg"
                  alt="Preview automation"
                  width="18"
                  height="18"
                  class="action-icon-btn"
                  @click="$emit('openPreview', item)"
                />
              </template>
              <span>Preview</span>
            </v-tooltip>

            <v-tooltip location="top">
              <template #activator="{ props }">
                <img
                  v-bind="props"
                  src="@/assets/icons/edit.svg"
                  alt="Edit automation"
                  width="18"
                  height="18"
                  class="action-icon-btn"
                  @click="$emit('openEdit', item)"
                />
              </template>
              <span>Edit</span>
            </v-tooltip>

            <v-tooltip location="top">
              <template #activator="{ props }">
                <img
                  v-bind="props"
                  src="@/assets/icons/delete.svg"
                  alt="Delete automation"
                  width="18"
                  height="18"
                  class="action-icon-btn"
                  :class="{ 'action-icon-disabled': defaultAutomationKeySet.has(item.key) }"
                  @click="defaultAutomationKeySet.has(item.key) ? null : $emit('deleteRow', item)"
                />
              </template>
              <span>Delete</span>
            </v-tooltip>
          </div>
        </template>

        <template #item.enabled="{ item }">
          <div class="d-flex align-center justify-center">
            <v-switch
              v-model="item.enabled"
              inset
              hide-details
              color="success"
              density="compact"
              :class="{ 'switch-active': item.enabled }"
              :disabled="disableToggle"
              @update:model-value="$emit('toggleEnabled', item, $event)"
            />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-email-off-outline</v-icon>
            <p class="text-h6 mt-4 mb-2">No automations found</p>
            <p class="text-body-2 text-medium-emphasis">
              Try adjusting your search or filters
            </p>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  showHeader: {
    type: Boolean,
    default: false,
  },
  infoText: {
    type: String,
    default: '',
  },
  rows: {
    type: Array,
    default: () => [],
  },
  headers: {
    type: Array,
    default: () => [],
  },
  search: {
    type: String,
    default: '',
  },
  filterEnabled: {
    type: Boolean,
    default: false,
  },
  filterDisabled: {
    type: Boolean,
    default: false,
  },
  activeFilters: {
    type: Number,
    default: 0,
  },
  showPreviewAction: {
    type: Boolean,
    default: false,
  },
  defaultAutomationKeySet: {
    type: Object,
    default: () => new Set(),
  },
  disableToggle: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'update:search',
  'update:filterEnabled',
  'update:filterDisabled',
  'clearFilters',
  'back',
  'openTrigger',
  'openPreview',
  'openEdit',
  'deleteRow',
  'toggleEnabled',
])
</script>

<style scoped>
.field-label {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.automation-toolbar {
  background: #f6f6f6;
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: 10px;
  padding: 10px 12px;
}

.with-border {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.custom-search {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: none;
}

.filter-btn,
.action-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: none;
}

.automation-data-table {
  background: transparent;
}

/* ================= GRID TABLE FIX ================= */

.automation-data-table :deep(table) {
  border-collapse: collapse !important;
  width: 100%;
}

.automation-data-table :deep(th),
.automation-data-table :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

/* Remove wrapper border to avoid doubles */

.automation-data-table :deep(.v-table__wrapper) {
  border: none !important;
  border-radius: 12px;
  overflow: auto;
  background: #fff;
  max-height: 60vh;
}

/* ================================================= */

.full-width-table :deep(.v-table__wrapper) {
  width: 100%;
}

.full-width-table :deep(table) {
  width: 100% !important;
  table-layout: fixed;
}

.full-width-table :deep(th:nth-child(1)) { width: 120px; }
.full-width-table :deep(th:nth-child(2)) { width: auto; min-width: 260px; }
.full-width-table :deep(th:nth-child(3)) { width: 260px; }
.full-width-table :deep(th:nth-child(4)) { width: 140px; }
.full-width-table :deep(th:nth-child(5)) { width: 120px; }

.automation-data-table :deep(thead) {
  background: #f6f6f6;
}

.automation-data-table :deep(thead th) {
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #4b5563 !important;
  padding: 8px 12px !important;
}

.automation-data-table :deep(.v-data-table-header__content) {
  color: #4b5563;
  font-weight: 600;
}

.automation-data-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
  height: 48px;
}

.automation-data-table :deep(tbody tr:hover) {
  background: #f5f5f5 !important;
}

.automation-data-table :deep(tbody td) {
  padding: 4px 8px !important;
  font-size: 14px;
  vertical-align: middle !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.automation-data-table :deep(tbody tr:nth-child(2n)) {
  background: #fcfcfc;
}

.name-text {
  font-weight: 500;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-cell {
  min-width: 0;
  gap: 8px;
}

.trigger-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  display: inline-block;
}

.switch-active :deep(.v-selection-control__input) {
  transform: scale(1.05);
}

.action-icon-btn {
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.action-icon-btn:hover {
  transform: translateY(-1px);
}

.action-icon-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
</style>
