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

    <div class="d-flex align-center mb-2" style="flex-wrap: nowrap; justify-content: space-between; overflow-x: auto;">
      <div class="d-inline-flex align-center toolbar-wrapper" style="flex-wrap: nowrap;">
        <div style="width: 180px">
          <v-text-field
            :model-value="search"
            placeholder="Search"
            clearable
            variant="solo"
            :elevation="0"
            density="compact"
            hide-details
            bg-color="#F3F4F6"
            flat
            class="custom-search"
            @update:model-value="$emit('update:search', $event)"
          >
            <template #append-inner>
              <img
                :src="searchicon"
                alt="search icon"
                width="14"
                height="14"
              />
            </template>
          </v-text-field>
        </div>

        <v-menu v-if="hasStatusColumn" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="flat"
              density="compact"
              class="tbl-top-btn ml-2"
              style="width: 110px"
            >
              <span>Filter</span>
              <img
                :src="filtericon"
                alt="filter icon"
                class="ml-2"
                width="14"
                height="14"
              />
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
            <template v-if="hasLastSentColumn">
              <v-divider class="my-3" />
              <p class="text-subtitle-2 font-weight-bold mb-3">Filter by Sent Status</p>
              <v-radio-group
                :model-value="filterSent"
                density="compact"
                hide-details
                @update:model-value="$emit('update:filterSent', $event)"
              >
                <v-radio label="All" value="all" density="compact" />
                <v-radio label="Sent at least once" value="sent" density="compact" />
                <v-radio label="Never sent" value="never" density="compact" />
              </v-radio-group>
            </template>
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
        :elevation="0"
        density="compact"
        hover
        :items-per-page="15"
      >
        <template #headers="{ columns }">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{
                backgroundColor: '#F6F6F6',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#4b5563',
                padding: '0px 10px',
                height: '40px',
                width: col.width || undefined,
                minWidth: col.width || undefined,
                textAlign: col.align === 'center' ? 'center' : 'left',
                whiteSpace: 'nowrap',
              }"
            >
              {{ col.title }}
            </th>
          </tr>
        </template>
        <template #item.type="{ item }">
          <v-chip
            size="small"
            variant="tonal"
            :color="String(item.type || 'Email').toLowerCase() === 'whatsapp' && !whatsappEnabled ? 'warning' : 'primary'"
            class="font-weight-medium"
          >
            <v-icon size="14" class="mr-1">
              {{ String(item.type || 'Email').toLowerCase() === 'whatsapp'
                ? (!whatsappEnabled ? 'mdi-wifi-off' : 'mdi-whatsapp')
                : 'mdi-email-outline' }}
            </v-icon>
            {{ item.type }}
          </v-chip>
        </template>

        <template #item.name="{ item }">
          <div class="name-text">
            {{ item.name || item.key }}
          </div>
        </template>

        <template v-if="hasTriggerColumn" #item.sending="{ item }">
          <div class="d-flex  align-center justify-space-between trigger-cell">
            <div class="d-flex align-center">
              <v-icon size="16" :color="item.sending ? 'grey-darken-1' : 'warning'" class="mr-2">
                {{ item.sending ? 'mdi-clock-outline' : 'mdi-alert-circle-outline' }}
              </v-icon>
              <span v-if="item.sending" class="text-body-2 text-medium-emphasis trigger-text">{{ item.sending }}</span>
              <span v-else class="text-body-2 trigger-text trigger-text--unset">Set trigger</span>
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
          <div class="d-flex align-center justify-center" style="gap: 10px;">
            <v-tooltip v-if="showResendAction && String(item.type || 'Email').toLowerCase() !== 'whatsapp'" location="top">
              <template #activator="{ props }">
                <v-progress-circular
                  v-if="resendingKey === item.key"
                  v-bind="props"
                  size="16"
                  width="2"
                  indeterminate
                  color="primary"
                  class="action-icon-btn"
                />
                <v-icon
                  v-else
                  v-bind="props"
                  size="18"
                  color="primary"
                  class="action-icon-btn"
                  :class="{ 'action-icon-disabled': !!resendingKey }"
                  @click="resendingKey ? null : $emit('resend', item)"
                >mdi-email-sync-outline</v-icon>
              </template>
              <span>{{ item.lastSentAt ? 'Resend' : 'Send now' }}</span>
            </v-tooltip>

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

        <template v-if="hasStatusColumn" #item.enabled="{ item }">
          <div class="d-flex align-center justify-center flex-column" style="gap:4px;">
            <v-tooltip
              v-if="String(item.type || 'Email').toLowerCase() === 'whatsapp' && !whatsappEnabled"
              location="top"
            >
              <template #activator="{ props: tp }">
                <div v-bind="tp" class="d-flex align-center" style="gap:6px;">
                  <v-switch
                    v-model="item.enabled"
                    inset
                    hide-details
                    color="success"
                    density="compact"
                    :disabled="true"
                    @update:model-value="$emit('toggleEnabled', item, $event)"
                  />
                  <v-icon size="16" color="warning">mdi-wifi-off</v-icon>
                </div>
              </template>
              <span>WhatsApp not connected — automation will not fire</span>
            </v-tooltip>
            <v-switch
              v-else
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

        <template v-if="hasLastSentColumn" #item.lastSentAt="{ item }">
          <span v-if="item.lastSentAt" class="text-caption text-medium-emphasis">
            {{ formatRelativeTime(item.lastSentAt) }}
          </span>
          <v-chip v-else size="x-small" variant="tonal" color="grey">Never sent</v-chip>
        </template>

        <template v-if="hasSentStatusColumn" #item.sentStatus="{ item }">
          <v-chip
            v-if="item.lastSentAt"
            size="x-small"
            variant="tonal"
            color="success"
            class="font-weight-medium"
          >
            <v-icon size="11" class="mr-1">mdi-check-circle-outline</v-icon>
            Sent
          </v-chip>
          <v-chip
            v-else
            size="x-small"
            variant="tonal"
            color="grey"
            class="font-weight-medium"
          >
            <v-icon size="11" class="mr-1">mdi-clock-outline</v-icon>
            Pending
          </v-chip>
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
const props = defineProps({
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
  filterSent: {
    type: String,
    default: 'all',
  },
  whatsappEnabled: {
    type: Boolean,
    default: true,
  },
  showResendAction: {
    type: Boolean,
    default: false,
  },
  resendingKey: {
    type: String,
    default: null,
  },
})

import searchicon from "@/assets/icons/listView/serach-icon.svg"
import filtericon from "@/assets/icons/listView/filter-icon.svg"

const hasHeaderKey = (key) =>
  Array.isArray(props.headers) && props.headers.some((h) => h?.key === key)

const hasTriggerColumn = computed(() => hasHeaderKey('sending'))
const hasStatusColumn = computed(() => hasHeaderKey('enabled'))
const hasLastSentColumn = computed(() => hasHeaderKey('lastSentAt'))
const hasSentStatusColumn = computed(() => hasHeaderKey('sentStatus'))

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

defineEmits([
  'update:search',
  'update:filterEnabled',
  'update:filterDisabled',
  'update:filterSent',
  'clearFilters',
  'back',
  'openTrigger',
  'openPreview',
  'openEdit',
  'deleteRow',
  'toggleEnabled',
  'resend',
])
</script>

<style scoped>
.field-label {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.toolbar-wrapper {
  height: 46px;
  display: inline-flex;
  align-items: center;
}

.with-border {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.custom-search,
.tbl-top-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
}

.tbl-top-btn {
  margin-left: 16px !important;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
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
  table-layout: auto;
}

.automation-data-table :deep(tbody tr) {
  transition: background-color 0.15s ease;
  height: 44px;
}

.automation-data-table :deep(tbody tr:hover) {
  background: #f5f5f5 !important;
}

.automation-data-table :deep(tbody td) {
  padding: 0 10px !important;
  font-size: 13px;
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

.trigger-text--unset {
  color: #f59e0b;
  font-style: italic;
  font-weight: 500;
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
