<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    fullscreen
    transition="dialog-bottom-transition"
    scrollable
  >
    <v-card style="background: #f5f7fa;">
      <!-- Top toolbar -->
      <v-toolbar color="white" elevation="1" style="z-index:2;">
        <v-btn icon @click="confirmClose">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-text-field
          v-model="formName"
          variant="plain"
          density="compact"
          hide-details
          class="ml-2 font-weight-medium"
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

      <v-card-text class="pa-0" style="overflow: hidden;">
        <v-row no-gutters style="height: calc(100vh - 64px);">
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
      </v-card-text>
    </v-card>

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
  </v-dialog>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  modelValue: Boolean,
  form: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const crmStore = useCrmStore()
const mainStore = useMainStore()

const formName = ref(props.form?.name || 'New Form')
const canvasFields = ref(JSON.parse(JSON.stringify(props.form?.fields || [])))
const availableFields = ref([])
const selectedFieldKey = ref(null)
const rightTab = ref('editor')
const saving = ref(false)
const shareOpen = ref(false)
const savedForm = ref(null)
const discardDialog = ref(false)

// Dirty tracking — only set to true after initial setup completes
let initialized = false
const isDirty = ref(false)

const canvasKeys = computed(() => canvasFields.value.map((f) => f.key))
const selectedField = computed(() => canvasFields.value.find((f) => f.key === selectedFieldKey.value) || null)
const canPublish = computed(() => formName.value.trim() && canvasFields.value.length >= 1)

// Watch for user changes AFTER initialization
watch(formName, () => { if (initialized) isDirty.value = true })
watch(canvasFields, () => { if (initialized) isDirty.value = true }, { deep: true })

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
    if (props.form?.id) {
      res = await crmStore.updateForm({ id: props.form.id, name, fields: canvasFields.value })
    } else {
      res = await crmStore.createForm({ name, fields: canvasFields.value })
    }
    if (res?.code === 0) {
      isDirty.value = false  // reset — changes are now saved
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
    emit('update:modelValue', false)
    return
  }
  discardDialog.value = true
}

const forceClose = () => {
  discardDialog.value = false
  isDirty.value = false
  emit('update:modelValue', false)
}

onMounted(async () => {
  const res = await crmStore.getAvailableFields()
  if (res?.code === 0) availableFields.value = res.data || []

  if (!canvasFields.value.length) {
    const defaults = ['name', 'email', 'telephone', 'treatment', 'comments']
    canvasFields.value = availableFields.value.filter((f) => defaults.includes(f.key))
  }
  if (canvasFields.value.length) selectedFieldKey.value = canvasFields.value[0].key

  // Mark as initialized AFTER setup — changes from here on are user-driven
  await nextTick()
  initialized = true
})
</script>
