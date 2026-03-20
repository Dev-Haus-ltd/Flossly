<template>
  <div class="pa-1 d-flex align-center" style="height:100%">
    <v-menu v-model="props.selected.alertMenu" :close-on-content-click="false" offset-y>
      <template #activator="{ props: menuProps }">
        <div v-bind="menuProps" class="d-flex align-center px-2" style="width:100%; cursor:pointer">
          <span class="emoji mr-1">{{ current?.emoji || '➕' }}</span>
        </div>
      </template>

      <v-card width="280" class="pa-2" style="border-radius:12px; display:flex; flex-direction:column; max-height:420px">
        <!-- Scrollable list area -->
        <div class="alert-list-scroll">
        <v-list density="compact" class="pa-0">
          <!-- View mode: pick an alert -->
          <template v-if="!editMode">
            <v-list-item
              v-for="(opt, i) in options"
              :key="i"
              class="opt-item"
              style="cursor:pointer"
              @click="apply(opt)"
            >
              <template #prepend>
                <span class="emoji mr-2">{{ opt.emoji }}</span>
              </template>
              <v-list-item-title>{{ opt.label }}</v-list-item-title>
            </v-list-item>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <v-list-item v-for="(opt, i) in editableOptions" :key="i" class="px-1 py-1">
              <div class="d-flex align-center" style="gap:6px">
                <!-- Emoji picker using emoji-picker-element -->
                <v-menu
                  v-model="emojiMenuOpen[i]"
                  :close-on-content-click="false"
                >
                  <template #activator="{ props: ep }">
                    <v-btn v-bind="ep" variant="outlined" size="x-small" min-width="32" height="32" class="emoji-btn">
                      {{ opt.emoji }}
                    </v-btn>
                  </template>
                  <!-- @pointerdown.stop prevents the outer menu's overlay from seeing this click -->
                  <v-card style="border-radius:12px; overflow:hidden" @pointerdown.stop>
                    <ClientOnly>
                      <emoji-picker
                        class="alert-emoji-picker"
                        @emoji-click="(e) => selectEmoji(e, i, opt)"
                      />
                    </ClientOnly>
                  </v-card>
                </v-menu>

                <!-- Label -->
                <v-text-field
                  v-model="opt.label"
                  density="compact"
                  variant="solo"
                  hide-details
                  flat
                  class="flex-grow-1 input-bordered"
                  style="font-size:13px"
                />

                <!-- Delete -->
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  color="error"
                  :disabled="editableOptions.length <= 1"
                  @click="editableOptions.splice(i, 1)"
                >
                  <v-icon size="15">mdi-close</v-icon>
                </v-btn>
              </div>
            </v-list-item>

            <!-- Add new -->
            <v-list-item style="cursor:pointer" class="px-1">
              <v-btn class="add-label-btn" density="default" variant="plain" @click="addOption">
                + New Alert
              </v-btn>
            </v-list-item>
          </template>
        </v-list>
        </div>

        <!-- Divider + Edit / Apply button -->
        <div class="edit-button-divider"></div>
        <div class="edit-button-container">
          <v-btn class="edit-button" variant="flat" :loading="saving" @click="toggleEdit">
            <img
              v-if="!editMode"
              src="@/assets/tasks/edit.svg"
              alt="Edit"
              width="16"
              height="16"
              class="edit-icon"
            />
            <v-icon v-else size="16" class="edit-icon">mdi-check</v-icon>
            <span class="edit-text">{{ editMode ? 'Apply' : 'Edit Labels' }}</span>
          </v-btn>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import crmService from '@/services/crmService'
import { useMainStore } from '@/stores/index'

if (process.client) {
  import('emoji-picker-element')
}

const props = defineProps({
  selected: { type: Object, required: true },
  alertOptions: { type: Array, default: null },
})
const emit = defineEmits(['update', 'options-saved'])

const mainStore = useMainStore()
const saving = ref(false)
const editMode = ref(false)
const editableOptions = ref([])
const emojiMenuOpen = reactive({})

const DEFAULT_OPTIONS = [
  { key: 'hot',      label: 'Hot lead alerts',          emoji: '🔥', color: 'error' },
  { key: 'time',     label: 'Time-sensitive deadlines',  emoji: '⏰', color: 'warning' },
  { key: 'value',    label: 'High-value opportunity',    emoji: '💸', color: 'tertiary' },
  { key: 'follow',   label: 'Follow-up reminders',       emoji: '🔄', color: 'info' },
  { key: 'callback', label: 'Callback scheduled',        emoji: '📞', color: 'success' },
  { key: 'none',     label: 'No response warnings',      emoji: '🚨', color: 'on-surface' },
]

const options = computed(() => props.alertOptions?.length ? props.alertOptions : DEFAULT_OPTIONS)
const current = computed(() => options.value.find(o => o.key === props.selected.alert))

// Fix 1: only update local state + emit — let updateValueRow in listView handle the API
const apply = (opt) => {
  props.selected.alert = opt.key
  props.selected.alertMenu = false
  emit('update')
}

// Fix 2 & 3: close emoji picker after selection, @pointerdown.stop on card prevents outer menu close
const selectEmoji = (e, index, opt) => {
  const unicode = e?.detail?.unicode || e?.detail?.emoji?.unicode
  if (unicode) opt.emoji = unicode
  emojiMenuOpen[index] = false
}

const addOption = () => {
  const i = editableOptions.value.length
  editableOptions.value.push({ key: `custom_${Date.now()}`, label: '', emoji: '⭐', color: 'primary' })
  emojiMenuOpen[i] = false
}

const toggleEdit = async () => {
  if (!editMode.value) {
    editableOptions.value = options.value.map(o => ({ ...o }))
    Object.keys(emojiMenuOpen).forEach(k => { emojiMenuOpen[k] = false })
    editMode.value = true
    return
  }
  const valid = editableOptions.value.filter(o => o.label.trim())
  if (!valid.length) return
  try {
    saving.value = true
    const res = await crmService.saveAlertOptions(valid)
    if (res?.code === 0) {
      emit('options-saved', valid)
      editMode.value = false
      props.selected.alertMenu = false
      mainStore?.setSnackbar?.({ title: 'Alert options saved', type: 'success' })
    } else {
      const msg = res?.error || res?.message || 'Failed to save alert options'
      mainStore?.setSnackbar?.({ title: msg, type: 'error' })
    }
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Failed to save alert options'
    mainStore?.setSnackbar?.({ title: msg, type: 'error' })
  } finally {
    saving.value = false
  }
}

watch(() => props.selected.alertMenu, (open) => {
  if (!open) editMode.value = false
})
</script>

<style scoped>
.opt-item:hover { background: rgba(0,0,0,0.04); border-radius: 6px; }
.emoji { font-size: 18px; width: 22px; display: inline-flex; justify-content: center; }
.emoji-btn { font-size: 16px; padding: 0 !important; }

.alert-emoji-picker {
  --emoji-picker-height: 300px;
  --emoji-picker-width: 300px;
  --emoji-size: 20px;
  --emoji-padding: 0.4rem;
  --num-columns: 8;
}

.add-label-btn {
  width: 100%;
  border: 1px solid #dfdfdf !important;
  min-height: 36px;
  border-radius: 8px;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  background-color: white !important;
  min-height: 36px;
  font-size: 13px;
  border-radius: 8px;
}

.alert-list-scroll {
  overflow-y: auto;
  max-height: 280px;
  flex: 1;
}

.edit-button-divider {
  width: 160px;
  height: 1px;
  background-color: hsla(0, 0%, 86%, 1);
  margin: 10px auto 0;
  flex-shrink: 0;
}
.edit-button-container {
  display: flex;
  justify-content: center;
  padding: 10px 16px 0;
  flex-shrink: 0;
}
.edit-button {
  border-radius: 6px;
  padding: 6px 16px;
  background-color: hsla(180, 11%, 98%, 1) !important;
  box-shadow: none;
  text-transform: none;
  min-width: auto;
  height: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.edit-icon { color: hsla(0, 0%, 43%, 1) !important; }
.edit-text { color: hsla(0, 0%, 43%, 1); font-size: 14px; }
</style>
