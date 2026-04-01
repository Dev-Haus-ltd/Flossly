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
            <v-tab value="preview">Preview</v-tab>
          </v-tabs>

          <v-window v-model="rightTab">
            <v-window-item value="editor">
              <CustomerRelationManagementFormsFormBuilderFieldEditor
                :field="selectedField"
                @update="updateField"
              />
            </v-window-item>
            <v-window-item value="preview">
              <CustomerRelationManagementFormsFormPreviewPanel
                :form-name="formName"
                :fields="canvasFields"
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
  return JSON.stringify({ name: formName.value, fields: canvasFields.value }) !== cleanSnapshot
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
      res = await crmStore.updateForm({ id: formId.value, name, fields: canvasFields.value })
    } else {
      res = await crmStore.createForm({ name, fields: canvasFields.value })
    }
    if (res?.code === 0) {
      if (res.data?.id) formId.value = res.data.id
      cleanSnapshot = JSON.stringify({ name: formName.value, fields: canvasFields.value })
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
  cleanSnapshot = JSON.stringify({ name: formName.value, fields: canvasFields.value })

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
