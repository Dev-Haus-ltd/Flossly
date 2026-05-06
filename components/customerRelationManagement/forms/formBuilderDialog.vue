<template>
  <div style="background: #f5f7fa; display: flex; flex-direction: column; height: calc(100vh - 160px);">
    <!-- Standalone toolbar — only shown when not embedded via CRM index (no bridge available) -->
    <v-toolbar v-if="!bridge" color="white" elevation="1" style="z-index:2; flex-shrink: 0;">
      <v-btn icon variant="text" @click="confirmClose">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-text-field
        v-model="formName"
        variant="plain"
        density="compact"
        hide-details
        class="font-weight-medium ml-1"
        style="max-width: 300px; font-size: 15px;"
        placeholder="Form name..."
      />
      <v-spacer />
      <v-btn variant="text" :loading="saving" @click="saveOnly">
        <v-icon start>mdi-content-save-outline</v-icon>
        Save
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        class="mr-3"
        :loading="saving"
        :disabled="!canPublish"
        @click="saveAndShare"
      >
        <v-icon start>mdi-share-variant</v-icon>
        Save & Share
      </v-btn>
    </v-toolbar>

    <div style="flex: 1; overflow: hidden; min-height: 0;">
      <v-row no-gutters style="height: 100%;">
        <!-- Left: Field Palette -->
        <v-col
          cols="12"
          sm="3"
          style="background: white; border-right: 1px solid #e5e7eb; overflow-y: auto; height: 100%;"
        >
          <CustomerRelationManagementFormsFormBuilderFieldPalette
            :available-fields="availableFields"
            :canvas-keys="canvasKeys"
            @add-field="addField"
          />
        </v-col>

        <!-- Centre: Canvas -->
        <v-col
          cols="12"
          sm="5"
          style="overflow-y: auto; height: 100%;"
          class="pa-4"
        >
          <div class="text-caption text-medium-emphasis mb-3 text-center">
            Drag to reorder • Click to configure • Remove with ✕
          </div>
          <CustomerRelationManagementFormsFormBuilderCanvas
            v-model="canvasFields"
            :selected-key="selectedFieldKey"
            @select="selectedFieldKey = $event"
            @remove="removeField"
          />
        </v-col>

        <!-- Right: Field Editor + Preview toggle -->
        <v-col
          cols="12"
          sm="4"
          style="border-left: 1px solid #e5e7eb; overflow-y: auto; height: 100%; background: white;"
        >
          <v-tabs v-model="rightTab" color="primary" density="compact" class="border-b">
            <v-tab value="editor">Configure</v-tab>
            <v-tab value="settings">Settings</v-tab>
            <v-tab value="preview">Preview</v-tab>
          </v-tabs>

          <v-window v-model="rightTab">
            <v-window-item value="editor">
              <CustomerRelationManagementFormsFormBuilderFieldEditor
                :field="selectedField"
                @update="updateField"
              />
            </v-window-item>
            <v-window-item value="settings">
              <div class="pa-4">
                <p class="text-caption font-weight-medium text-uppercase text-medium-emphasis mb-4" style="letter-spacing:0.05em;">
                  Form Settings
                </p>

                <label class="settings-lbl d-block mb-1">Form Name</label>
                <v-text-field
                  v-model="formName"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-5"
                  placeholder="Form name..."
                />

                <label class="settings-lbl d-block mb-2">Brand Colour</label>
                <div class="d-flex flex-wrap mb-3" style="gap: 8px;">
                  <div
                    v-for="swatch in settingsPresetColors"
                    :key="swatch"
                    class="settings-swatch"
                    :style="{ background: swatch, outline: formColor === swatch ? '2px solid #111' : '2px solid transparent' }"
                    @click="formColor = swatch"
                  />
                </div>
                <div class="d-flex align-center" style="gap: 10px;">
                  <div class="settings-swatch" :style="{ background: formColor, outline: '2px solid #e5e7eb', cursor: 'default', flexShrink: 0 }" />
                  <v-text-field
                    :model-value="formColor"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="#0061FB"
                    style="font-family: monospace; font-size: 13px;"
                    @update:model-value="onSettingsHexInput"
                  />
                  <input
                    type="color"
                    :value="formColor"
                    class="settings-color-btn"
                    title="Open colour picker"
                    @input="formColor = $event.target.value"
                  />
                </div>

                <div class="mt-4 pa-3 rounded-lg" style="background:#f9fafb; border:1px solid #e5e7eb;">
                  <p class="text-caption text-medium-emphasis mb-0">
                    <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
                    Applied to the form header and submit button on the public page.
                  </p>
                </div>
              </div>
            </v-window-item>
            <v-window-item value="preview">
              <CustomerRelationManagementFormsFormPreviewPanel
                :form-name="formName"
                :fields="canvasFields"
                :color="formColor"
              />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </div>

    <!-- Share panel after save -->
    <v-dialog v-model="shareOpen" max-width="560">
      <CustomerRelationManagementFormsFormSharePanel
        v-if="savedForm"
        :form="savedForm"
        @close="shareOpen = false; $emit('saved')"
        @regenerated="onRegenerated"
      />
    </v-dialog>

    <!-- Discard confirmation — only shown when there are unsaved changes -->
    <CommonConfirmDialog
      v-model="discardDialog"
      title="Discard changes?"
      message="You have unsaved changes. Leave anyway and discard them?"
      confirm-text="Discard"
      confirm-color="error"
      icon="mdi-alert-outline"
      @confirm="forceClose"
      @cancel="discardDialog = false"
    />
  </div>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  form: { type: Object, default: null },
})
const emit = defineEmits(['go-back', 'saved'])

const crmStore = useCrmStore()
const mainStore = useMainStore()

// Inject the breadcrumb bridge provided by CustomerRelationManagement/index.vue
// If null, the component is being used standalone and renders its own toolbar
const bridge = inject('crm-builder-bridge', null)

const formName = ref(props.form?.name || 'New Form')
const formColor = ref(props.form?.color || '#0061FB')

const settingsPresetColors = [
  '#0061FB', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6',
  '#F97316', '#6366F1', '#374151', '#111827',
]
const onSettingsHexInput = (val) => {
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) formColor.value = val
}
const canvasFields = ref(JSON.parse(JSON.stringify(props.form?.fields || [])))
const availableFields = ref([])
const selectedFieldKey = ref(null)
const rightTab = ref('editor')
const saving = ref(false)
const shareOpen = ref(false)
const savedForm = ref(null)
const discardDialog = ref(false)

// Track the saved form ID internally so repeated "Save" calls update rather than create duplicates
const formId = ref(props.form?.id || null)

// Snapshot of state at the point of last save (or initial load) — used for dirty detection
let cleanSnapshot = ''

const isDirty = computed(() => {
  if (!cleanSnapshot) return false
  return JSON.stringify({ name: formName.value, color: formColor.value, fields: canvasFields.value }) !== cleanSnapshot
})

const canvasKeys = computed(() => canvasFields.value.map((f) => f.key))
const selectedField = computed(() => canvasFields.value.find((f) => f.key === selectedFieldKey.value) || null)
const canPublish = computed(() => formName.value.trim() && canvasFields.value.length >= 1)

// Keep bridge state in sync when bridge is available
if (bridge) {
  watch(saving, v => { bridge.saving = v })
  watch(canPublish, v => { bridge.canPublish = v })
  // When user edits form name in the breadcrumb, reflect it here
  watch(() => bridge.formName, (v) => {
    if (v !== undefined && v !== formName.value) formName.value = v
  })
}

const addField = (field) => {
  canvasFields.value.push({ ...field })
  selectedFieldKey.value = field.key
}

const removeField = (key) => {
  canvasFields.value = canvasFields.value.filter((f) => f.key !== key)
  if (selectedFieldKey.value === key) selectedFieldKey.value = null
}

const updateField = (updated) => {
  const idx = canvasFields.value.findIndex((f) => f.key === updated.key)
  if (idx !== -1) canvasFields.value[idx] = { ...updated }
}

const doSave = async () => {
  const name = formName.value.trim()
  if (!name) {
    mainStore.setSnackbar({ title: 'Form name is required', type: 'error' })
    return null
  }
  saving.value = true
  try {
    let res
    if (formId.value) {
      res = await crmStore.updateForm({ id: formId.value, name, color: formColor.value, fields: canvasFields.value })
    } else {
      res = await crmStore.createForm({ name, color: formColor.value, fields: canvasFields.value })
    }
    if (res?.code === 0) {
      if (res.data?.id) formId.value = res.data.id
      cleanSnapshot = JSON.stringify({ name: formName.value, color: formColor.value, fields: canvasFields.value })
      mainStore.setSnackbar({ title: 'Form saved', type: 'success' })
      emit('saved')
      return res.data
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to save form', type: 'error' })
      return null
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to save form', type: 'error' })
    return null
  } finally {
    saving.value = false
  }
}

const saveOnly = async () => {
  await doSave()
}

const saveAndShare = async () => {
  const saved = await doSave()
  if (saved) {
    savedForm.value = saved
    shareOpen.value = true
  }
}

const onRegenerated = (updated) => {
  if (updated) savedForm.value = updated
  emit('saved')
}

const confirmClose = () => {
  if (!isDirty.value) {
    emit('go-back')
    return
  }
  discardDialog.value = true
}

const forceClose = () => {
  discardDialog.value = false
  emit('go-back')
}

onMounted(async () => {
  const res = await crmStore.getAvailableFields()
  if (res?.code === 0) availableFields.value = res.data || []

  if (!canvasFields.value.length) {
    const defaults = ['name', 'email', 'telephone', 'treatment', 'comments']
    canvasFields.value = availableFields.value.filter((f) => defaults.includes(f.key))
  }
  if (canvasFields.value.length) selectedFieldKey.value = canvasFields.value[0].key

  await nextTick()
  cleanSnapshot = JSON.stringify({ name: formName.value, color: formColor.value, fields: canvasFields.value })

  // Register with the breadcrumb bridge
  if (bridge) {
    bridge.active = true
    bridge.formName = formName.value
    bridge.canPublish = canPublish.value
    bridge.saving = false
    bridge.saveOnly = saveOnly
    bridge.saveAndShare = saveAndShare
    bridge.confirmClose = confirmClose
  }
})

onUnmounted(() => {
  if (bridge) {
    Object.assign(bridge, {
      active: false,
      formName: '',
      canPublish: false,
      saving: false,
      saveOnly: null,
      saveAndShare: null,
      confirmClose: null,
    })
  }
})
</script>

<style scoped>
.settings-lbl { font-size: 13px; font-weight: 500; color: #374151; }

.settings-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.1s;
  outline-offset: 2px;
}
.settings-swatch:hover { transform: scale(1.15); }

.settings-color-btn {
  width: 32px;
  height: 32px;
  padding: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  background: none;
}
</style>
