<template>
  <div class="automation-group-cell d-flex justify-space-between align-center mx-2">
    <div class="d-flex align-center">
      <div
        v-for="group in display.visible"
        :key="group.key"
        class="avatar-trigger me-n2"
      >
        <div class="group-avatar" :title="group.title || group.key">
          {{ groupInitials(group) }}
        </div>
      </div>

      <v-tooltip
        v-if="display.overflow.length"
        location="top"
        content-class="automation-tooltip-content"
      >
        <template #activator="{ props: tooltipProps }">
          <div
            v-bind="tooltipProps"
            class="avatar-trigger me-n2"
          >
            <div class="group-avatar group-avatar--overflow">
              +{{ display.overflow.length }}
            </div>
          </div>
        </template>
        <div class="automation-tooltip">
          <div
            v-for="group in display.overflow"
            :key="group.key"
            class="automation-tooltip-item"
          >
            {{ group.title || group.key }}
          </div>
        </div>
      </v-tooltip>
    </div>

    <div
      v-if="!readonly"
      class="plus-trigger d-flex align-center justify-center"
      @click.stop="onTriggerClick($event, 'plus')"
    >
      <div class="circle-add">
        <v-icon size="14" color="white">mdi-plus</v-icon>
      </div>
    </div>

    <v-menu
      v-if="!readonly"
      v-model="menu"
      :activator="currentActivator"
      location="bottom"
      transition="scale-transition"
      :open-on-click="false"
      :open-on-hover="false"
      :close-on-content-click="false"
      :close-on-click="false"
      max-width="360"
      offset="4"
    >
      <v-card
        width="360"
        class="pa-3 rounded-lg menu-card"
        :elevation="0"
        flat
        style="pointer-events: auto;"
      >
        <div class="text-subtitle-2 text-grey-darken-1 mb-2">
          Automation Groups
        </div>

        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search Groups"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          class="mb-3 input-bordered"
          flat
        />

        <div class="automation-list">
          <div
            v-for="group in filteredGroups"
            :key="group.key"
            class="automation-option"
          >
            <div class="automation-option-label">
              <div class="automation-group-title">
                {{ group.title || group.key }}
              </div>
              <div v-if="group.description" class="automation-group-desc">
                {{ group.description }}
              </div>
            </div>
            <v-switch
              inset
              density="compact"
              hide-details
              color="primary"
              class="automation-group-switch"
              :disabled="saving || groupsLoading"
              :model-value="isGroupEnabled(lead, group)"
              @update:model-value="(val) => toggleGroup(lead, group, val)"
            />
          </div>
          <div
            v-if="!filteredGroups.length"
            class="text-caption text-medium-emphasis py-2"
          >
            No automation groups found.
          </div>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  lead: { type: Object, required: true },
  groups: { type: Array, default: () => [] },
  getDisplay: { type: Function, required: true },
  isGroupEnabled: { type: Function, required: true },
  toggleGroup: { type: Function, required: true },
  onOpenMenu: { type: Function, required: true },
  saving: { type: Boolean, default: false },
  groupsLoading: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
})

const menu = ref(false)
const currentActivator = ref(null)
const search = ref('')

const display = computed(() => props.getDisplay(props.lead))

const groupInitials = (group) => {
  const label = String(group?.title || group?.key || '').trim()
  if (!label) return '?'
  const parts = label.split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]).join('')
  return letters.toUpperCase()
}

const filteredGroups = computed(() => {
  const q = String(search.value || '').trim().toLowerCase()
  if (!q) return props.groups || []
  return (props.groups || []).filter((group) =>
    `${group?.title || ''} ${group?.key || ''} ${group?.description || ''}`
      .toLowerCase()
      .includes(q)
  )
})

const openMenuFor = (event, item) => {
  if (props.readonly) return
  const el = event.currentTarget
  if (menu.value && currentActivator.value !== el) {
    menu.value = false
    currentActivator.value = el
    menu.value = true
    props.onOpenMenu(props.lead)
  } else if (!menu.value) {
    currentActivator.value = el
    menu.value = true
    props.onOpenMenu(props.lead)
  } else {
    currentActivator.value = el
  }
}

const onTriggerClick = (event, item) => {
  openMenuFor(event, item)
}
</script>

<style scoped>
.menu-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

.avatar-trigger {
  display: inline-block;
}

.plus-trigger {
  display: inline-block;
  padding: 2px;
}

.circle-add {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: hsla(183, 24%, 17%, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.group-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e4eeff;
  color: #1f4bc7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #cfe0ff;
}

.group-avatar--overflow {
  background: #f0f0f0;
  color: #555;
  border-color: #e0e0e0;
}

.automation-list {
  max-height: 260px;
  overflow-y: auto;
}

.automation-option {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  padding: 6px 0;
}

.automation-option-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
  flex: 1 1 auto;
  min-width: 0;
}

.automation-group-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.automation-group-desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
  line-height: 1.2;
}

.automation-group-switch :deep(.v-selection-control) {
  margin: 0;
}

.automation-group-switch {
  flex: 0 0 auto;
  margin-left: 8px;
}

.automation-tooltip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

.automation-tooltip-item {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 4px 8px;
}

:deep(.automation-tooltip-content) {
  background: #ffffff !important;
  color: rgba(0, 0, 0, 0.87) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  pointer-events: auto !important;
}
</style>
