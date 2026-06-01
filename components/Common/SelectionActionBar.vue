<template>
  <v-card
    class="selection-action-bar rounded-lg"
    :class="{
      'selection-action-bar--fixed': fixed,
      'selection-action-bar--inline': !fixed,
    }"
    :elevation="5"
    flat
  >
    <div class="selection-action-bar__count">
      <span class="selection-action-bar__count-badge">
        {{ count }}
      </span>
      <p class="selection-action-bar__count-text">
        <span class="selection-action-bar__count-label selection-action-bar__count-label--desktop">
          {{ countLabelDesktop }}
        </span>
        <span class="selection-action-bar__count-label selection-action-bar__count-label--mobile">
          {{ countLabelMobile }}
        </span>
      </p>
    </div>

    <div class="selection-action-bar__desktop">
      <div class="selection-action-bar__actions">
        <button
          v-for="action in visibleActions"
          :key="action.key"
          type="button"
          class="selection-action-bar__item selection-action-bar__item--desktop"
          :class="{ 'selection-action-bar__item--disabled': action.disabled }"
          :disabled="action.disabled"
          @click="emit('action', action.key)"
        >
          <img
            v-if="action.icon"
            :src="action.icon"
            :alt="action.label"
            class="selection-action-bar__icon"
          />
          <v-icon
            v-else-if="action.mdiIcon"
            :size="action.desktopIconSize || 22"
            :color="action.color || '#6d6d6d'"
          >
            {{ action.mdiIcon }}
          </v-icon>
          <span
            class="selection-action-bar__label"
            :style="action.color ? { color: action.color } : undefined"
          >
            {{ action.label }}
          </span>
        </button>

        <v-divider vertical class="selection-action-bar__divider" />

        <button
          type="button"
          class="selection-action-bar__item selection-action-bar__item--desktop"
          @click="emit('close')"
        >
          <v-icon size="20" color="#6d6d6d">mdi-close</v-icon>
          <span class="selection-action-bar__label">{{ closeLabel }}</span>
        </button>
      </div>
    </div>

    <div class="selection-action-bar__mobile">
      <div class="selection-action-bar__mobile-primary">
        <button
          v-for="action in mobilePrimaryActions"
          :key="action.key"
          type="button"
          class="selection-action-bar__item selection-action-bar__item--mobile"
          :class="{ 'selection-action-bar__item--disabled': action.disabled }"
          :disabled="action.disabled"
          @click="emit('action', action.key)"
        >
          <img
            v-if="action.icon"
            :src="action.icon"
            :alt="action.label"
            class="selection-action-bar__icon selection-action-bar__icon--mobile"
          />
          <v-icon
            v-else-if="action.mdiIcon"
            :size="action.mobileIconSize || 18"
            :color="action.color || '#3b3b3b'"
          >
            {{ action.mdiIcon }}
          </v-icon>
          <span
            class="selection-action-bar__label selection-action-bar__label--mobile"
            :style="action.color ? { color: action.color } : undefined"
          >
            {{ action.mobileLabel || action.label }}
          </span>
        </button>
      </div>

      <div class="selection-action-bar__mobile-secondary">
        <v-menu
          v-if="mobileOverflowActions.length"
          location="top end"
          content-class="selection-action-bar__menu-content"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              variant="text"
              class="selection-action-bar__menu-btn"
              size="small"
            >
              <v-icon size="18">mdi-dots-horizontal</v-icon>
            </v-btn>
          </template>

          <v-list density="compact" class="selection-action-bar__menu-list">
            <v-list-item
              v-for="action in mobileOverflowActions"
              :key="action.key"
              :disabled="action.disabled"
              rounded="lg"
              @click="emit('action', action.key)"
            >
              <template #prepend>
                <span class="selection-action-bar__menu-icon-slot">
                  <img
                    v-if="action.icon"
                    :src="action.icon"
                    :alt="action.label"
                    class="selection-action-bar__menu-icon"
                  />
                  <v-icon
                    v-else-if="action.mdiIcon"
                    class="selection-action-bar__menu-mdi"
                    :size="action.mobileIconSize || 18"
                    :color="action.color || '#3b3b3b'"
                  >
                    {{ action.mdiIcon }}
                  </v-icon>
                </span>
              </template>
              <v-list-item-title class="selection-action-bar__menu-title">
                {{ action.label }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          icon
          variant="text"
          class="selection-action-bar__menu-btn"
          size="small"
          @click="emit('close')"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
const props = defineProps({
  count: { type: Number, required: true },
  countLabelDesktop: { type: String, default: 'Items Selected' },
  countLabelMobile: { type: String, default: 'Selected' },
  closeLabel: { type: String, default: 'Close' },
  actions: {
    type: Array,
    default: () => [],
  },
  mobilePrimaryKeys: {
    type: Array,
    default: () => [],
  },
  fixed: { type: Boolean, default: false },
});

const emit = defineEmits(['action', 'close']);

const visibleActions = computed(() =>
  (props.actions || []).filter((action) => action && !action.hidden)
);

const mobilePrimaryActions = computed(() => {
  const keys = new Set(props.mobilePrimaryKeys || []);
  return visibleActions.value.filter((action) => keys.has(action.key) && !action.menuOnly);
});

const mobileOverflowActions = computed(() => {
  const keys = new Set(props.mobilePrimaryKeys || []);
  return visibleActions.value.filter((action) => !keys.has(action.key) || action.menuOnly);
});
</script>

<style scoped>
.selection-action-bar {
  display: flex;
  gap: 40px;
  align-items: center;
  justify-content: space-between;
  width: max-content;
  max-width: calc(100vw - 32px);
  min-height: 68px;
  padding: 10px 50px;
  border: 1px solid #e7e7e7;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
}

.selection-action-bar--fixed {
  position: fixed;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  z-index: 1000;
}

.selection-action-bar--inline {
  margin-top: 16px;
  margin-inline: auto;
}

.selection-action-bar__count {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
}

.selection-action-bar__count-badge {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #3b3b3b;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}

.selection-action-bar__count-text {
  margin: 0;
  color: #3b3b3b;
  font-size: 13px;
  white-space: nowrap;
}

.selection-action-bar__count-label--mobile,
.selection-action-bar__mobile {
  display: none;
}

.selection-action-bar__desktop {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
}

.selection-action-bar__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-width: 0;
}

.selection-action-bar__item {
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: #3b3b3b;
}

.selection-action-bar__item--desktop {
  min-width: 60px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.selection-action-bar__item--desktop:hover,
.selection-action-bar__item--mobile:hover {
  background: rgba(0, 0, 0, 0.04);
}

.selection-action-bar__item--desktop:hover {
  transform: translateY(-1px);
}

.selection-action-bar__item--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.selection-action-bar__item--disabled:hover {
  background: transparent;
  transform: none;
}

.selection-action-bar__icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.selection-action-bar__item--disabled .selection-action-bar__icon {
  filter: grayscale(1) opacity(0.5);
}

.selection-action-bar__label {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 400;
  color: #6d6d6d;
  white-space: nowrap;
}

.selection-action-bar__divider {
  height: 40px;
  margin: 0 8px;
}

.selection-action-bar__item--mobile {
  min-width: 0;
  height: 36px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #ececec;
  border-radius: 10px;
  background: #f8f8f8;
  overflow: hidden;
}

.selection-action-bar__icon--mobile {
  width: 18px;
  height: 18px;
}

.selection-action-bar__label--mobile {
  margin-top: 0;
  font-weight: 500;
  line-height: 1;
  color: inherit;
}

.selection-action-bar__mobile-primary {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 auto;
  min-width: 0;
}

.selection-action-bar__mobile-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.selection-action-bar__menu-btn {
  min-width: 36px !important;
  width: 36px !important;
  height: 36px !important;
  border: 1px solid #ececec;
  border-radius: 10px;
  background: #f8f8f8;
  color: #3b3b3b;
}

.selection-action-bar__menu-list {
  min-width: 220px;
  padding: 8px;
  border: 1px solid #ececec;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.selection-action-bar__menu-list :deep(.v-list-item) {
  min-height: 42px;
  padding-inline: 12px;
}

.selection-action-bar__menu-list :deep(.v-list-item__prepend) {
  align-self: center;
  width: 20px;
  min-width: 20px;
  margin-inline-end: 12px;
}

.selection-action-bar__menu-list :deep(.v-list-item__content) {
  align-self: center;
}

.selection-action-bar__menu-icon-slot {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.selection-action-bar__menu-icon {
  width: 18px;
  height: 18px;
  display: block;
  object-fit: contain;
}

.selection-action-bar__menu-mdi {
  width: 18px;
  height: 18px;
  line-height: 18px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.selection-action-bar__menu-title {
  font-size: 14px;
  font-weight: 500;
  color: #252525;
}

:global(.selection-action-bar__menu-content) {
  border-radius: 16px;
}

:global(.selection-action-bar__menu-content .v-overlay__content),
:global(.selection-action-bar__menu-content .v-card),
:global(.selection-action-bar__menu-content .v-list) {
  border-radius: 16px !important;
  overflow: hidden;
}

@media (max-width: 960px) {
  .selection-action-bar {
    min-height: 0;
    gap: 12px;
    width: auto;
    max-width: none;
    padding: 12px 14px;
  }

  .selection-action-bar--fixed {
    left: 16px;
    right: 16px;
    bottom: 16px;
    transform: none;
  }

  .selection-action-bar__desktop,
  .selection-action-bar__count-label--desktop {
    display: none;
  }

  .selection-action-bar__count-label--mobile,
  .selection-action-bar__mobile {
    display: flex;
  }

  .selection-action-bar__count {
    flex: 1 1 auto;
  }

  .selection-action-bar__count-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .selection-action-bar__mobile {
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .selection-action-bar {
    gap: 10px;
    padding: 10px 12px;
  }

  .selection-action-bar__count {
    flex: 0 1 auto;
  }

  .selection-action-bar__count-text {
    font-size: 12px;
  }

  .selection-action-bar__mobile {
    gap: 8px;
    flex: 0 0 auto;
  }

  .selection-action-bar__mobile-primary,
  .selection-action-bar__mobile-secondary {
    gap: 6px;
  }

  .selection-action-bar__item--mobile {
    width: 36px;
    min-width: 36px;
    padding: 0;
    gap: 0;
  }

  .selection-action-bar__label--mobile {
    display: none;
  }
}
</style>
