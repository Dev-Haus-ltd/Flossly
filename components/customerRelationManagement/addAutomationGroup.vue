<template>
  <v-navigation-drawer
    :model-value="props.modelValue"
    @update:model-value="handleDrawerClose"
    location="right"
    temporary
    :width="520"
  >
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text">Add Automation Group</v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        variant="outlined"
        color="#8B8B8B"
        @click="closeDrawer"
        class="mr-4"
        style="width: 20px; height: 20px; min-width: 20px; border-radius: 50%; padding: 0;"
      >
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div
      class="pa-4"
      style="background-color: #f5f5f5; height: calc(100% - 64px - 64px); overflow-y: auto;"
    >
      <v-card class="pa-4" color="white" elevation="0">
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-row>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Automation Group Name <span class="req">*</span></label>
              <v-text-field
                v-model="form.title"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="requiredRule"
              />
            </v-col>

            <v-col cols="12">
              <label class="mb-1 fld-lbl">Description</label>
              <v-textarea
                v-model="form.description"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                auto-grow
                flat
              />
            </v-col>

          </v-row>
        </v-form>
      </v-card>
    </div>

    <div
      class="d-flex justify-space-between align-center px-4 py-2"
      style="background-color: white; height: 64px"
    >
      <v-btn
        color="white"
        class="text-primary"
        style="width: 48%; border-radius: 8px; border: 1px solid #dfdfdf"
        @click="closeDrawer"
        flat
      >
        Back
      </v-btn>

      <v-btn
        color="primary"
        class="text-white"
        style="width: 48%; border-radius: 8px"
        :loading="saving"
        :disabled="saving"
        @click="onSubmit()"
        flat
      >
        Save
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['close', 'success', 'update:modelValue'])
const crmStore = useCrmStore()
const mainStore = useMainStore()
const formRef = ref(null)
const saving = ref(false)
const requiredRule = [(v) => !!v || 'This field is required']

const form = ref({
  title: '',
  description: '',
})

const resetForm = () => {
  form.value = { title: '', description: '' }
  if (formRef.value) formRef.value.resetValidation()
}

const closeDrawer = () => {
  emit('close')
  emit('update:modelValue', false)
  resetForm()
}

const handleDrawerClose = (newValue) => {
  if (!newValue) resetForm()
  emit('update:modelValue', newValue)
}

watch(() => props.modelValue, (newValue) => {
  if (!newValue) resetForm()
})

const onSubmit = async () => {
  const validation = await formRef.value.validate()
  if (!validation.valid) return
  try {
    saving.value = true
    const res = await crmStore.saveAutomationGroup({
      title: form.value.title,
      description: form.value.description,
    })
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Automation group created', type: 'success' })
      emit('success', res.data)
      closeDrawer()
      return
    }
    mainStore.setSnackbar({ title: res?.message || 'Failed to create group', type: 'error' })
  } catch (e) {
    mainStore.setSnackbar({ title: e.message || 'Failed to create group', type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.title-text {
  font-weight: 600;
  font-size: 16px;
}
.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
.req { color: rgb(var(--v-theme-error)); }
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>
