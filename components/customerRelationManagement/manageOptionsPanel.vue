<template>
  <v-dialog v-model="open" max-width="360" :close-on-content-click="false">
    <v-card class="pa-4" style="border-radius: 12px">
      <div class="d-flex justify-space-between align-center mb-3">
        <span class="text-subtitle-1 font-weight-semibold">{{ title }}</span>
        <v-btn icon size="x-small" variant="text" @click="open = false">
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Existing options — inline editable, scrollable -->
      <div class="options-list options-scroll">
        <div
          v-for="opt in rows"
          :key="opt.id"
          class="option-row"
        >
          <v-text-field
            v-model="opt.name"
            density="compact"
            variant="solo"
            hide-details
            flat
            class="option-input"
          />
          <v-progress-circular v-if="deletingId === opt.id" indeterminate size="14" width="2" color="error" class="ml-1" />
          <img
            v-else
            src="~/assets/icons/delete.svg"
            width="14"
            height="14"
            class="delete-icon"
            @click="deleteRow(opt)"
          />
        </div>
      </div>

      <!-- Always visible add row -->
      <div class="option-row add-row mt-2" @click="addRow">
        + New {{ singularTitle }}
      </div>

      <v-divider class="my-3" />

      <div class="d-flex justify-center">
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          style="width: 100%; border-radius: 8px"
          @click="applyChanges"
        >
          Apply
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import crmService from '@/services/crmService'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Manage Options' },
  category: { type: String, required: true },
  options: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'updated'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Deep-clone options into local rows so edits don't mutate the prop
const rows = ref([])
watch(() => props.options, (v) => {
  rows.value = v.map(o => ({ ...o }))
}, { immediate: true })

const singularTitle = computed(() =>
  props.title.replace(/^Manage\s+/i, '').replace(/s$/i, '')
)

const saving = ref(false)
const deletingId = ref(null)
const mainStore = useMainStore()

const addRow = () => {
  rows.value.push({ id: `new_${Date.now()}`, name: '' })
}

const deleteRow = async (opt) => {
  // New unsaved row — just remove locally
  if (String(opt.id).startsWith('new_')) {
    rows.value = rows.value.filter(r => r.id !== opt.id)
    return
  }
  deletingId.value = opt.id
  try {
    const res = await crmService.deleteOption(opt.id)
    if (res?.code === 0) {
      rows.value = rows.value.filter(r => r.id !== opt.id)
      emit('updated', rows.value.filter(r => !String(r.id).startsWith('new_')))
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to delete', type: 'error' })
    }
  } catch {
    mainStore.setSnackbar({ title: 'Failed to delete', type: 'error' })
  } finally {
    deletingId.value = null
  }
}

const applyChanges = async () => {
  saving.value = true
  try {
    const original = new Map(props.options.map(o => [o.id, o.name]))

    for (const row of rows.value) {
      const trimmed = (row.name || '').trim()
      if (!trimmed) continue

      if (String(row.id).startsWith('new_')) {
        const res = await crmService.addOption(props.category, trimmed)
        if (res?.code === 0) {
          row.id = res.data.id
        } else {
          mainStore.setSnackbar({ title: res?.message || 'Failed to add option', type: 'error' })
        }
      } else if (original.get(row.id) !== trimmed) {
        const res = await crmService.updateOption(row.id, trimmed)
        if (res?.code !== 0) {
          mainStore.setSnackbar({ title: res?.message || 'Failed to update option', type: 'error' })
        }
      }
    }

    const saved = rows.value.filter(r => !String(r.id).startsWith('new_') && (r.name || '').trim())
    emit('updated', saved)
    open.value = false
  } catch {
    mainStore.setSnackbar({ title: 'Failed to save changes', type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.options-scroll {
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}
.options-scroll::-webkit-scrollbar { width: 4px; }
.options-scroll::-webkit-scrollbar-track { background: transparent; }
.options-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.option-input {
  flex: 1;
}
.option-input :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
.delete-icon {
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.delete-icon:hover { opacity: 1; }
.add-row {
  cursor: pointer;
  border: 1px solid #dfdfdf;
  border-radius: 8px;
  min-height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: #737373;
  justify-content: center;
  transition: background-color 0.15s;
}
.add-row:hover { background-color: #f0f4ff; color: #0061FB; }
</style>
