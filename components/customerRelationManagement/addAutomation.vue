<template>
  <v-navigation-drawer
    :model-value="props.modelValue"
    @update:model-value="handleDrawerClose"
    location="right"
    temporary
    :width="720"
  >
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text">Add Automation</v-toolbar-title>
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
            <v-col cols="12" md="6">
              <label class="mb-1 fld-lbl">Automation Group <span class="req">*</span></label>
              <v-select
                v-model="form.groupKey"
                :items="groups"
                item-title="title"
                item-value="key"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="requiredRule"
              />
            </v-col>

            <v-col cols="12" md="6">
              <label class="mb-1 fld-lbl">Automation Type</label>
              <v-select
                v-model="form.type"
                :items="types"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6">
              <label class="mb-1 fld-lbl">Automation Name <span class="req">*</span></label>
              <v-text-field
                v-model="form.name"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="requiredRule"
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.type === 'Email'">
              <label class="mb-1 fld-lbl">Automation Subject</label>
              <v-text-field
                v-model="form.subject"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6">
              <label class="mb-1 fld-lbl">Automation Trigger Type</label>
              <v-select
                v-model="form.triggerType"
                :items="triggerTypes"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              v-if="form.triggerType && form.triggerType !== 'black_friday' && form.triggerType !== 'month_day' && form.triggerType !== 'weekday_of_month' && form.triggerType !== 'birthday_month_start' && form.triggerType !== 'practice_anniversary'"
            >
              <label class="mb-1 fld-lbl">Days Offset</label>
              <v-text-field
                v-model="form.triggerDays"
                type="number"
                min="0"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.triggerType === 'black_friday' || form.triggerType === 'month_day' || form.triggerType === 'weekday_of_month' || form.triggerType === 'birthday_month_start' || form.triggerType === 'practice_anniversary'">
              <label class="mb-1 fld-lbl">Offset Days (before/after)</label>
              <v-text-field
                v-model="form.triggerOffsetDays"
                type="number"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.triggerType === 'month_day' || form.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Month (1-12)</label>
              <v-text-field
                v-model="form.triggerMonth"
                type="number"
                min="1"
                max="12"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.triggerType === 'month_day'">
              <label class="mb-1 fld-lbl">Day of Month</label>
              <v-text-field
                v-model="form.triggerDay"
                type="number"
                min="1"
                max="31"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Weekday</label>
              <v-select
                v-model="form.triggerWeekday"
                :items="weekdayOptions"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="6" v-if="form.triggerType === 'weekday_of_month'">
              <label class="mb-1 fld-lbl">Week in Month</label>
              <v-select
                v-model="form.triggerWeekIndex"
                :items="weekIndexOptions"
                item-title="label"
                item-value="value"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12">
              <div class="trigger-preview">
                <span class="trigger-label">Sending preview:</span>
                <span>{{ sendingPreview }}</span>
              </div>
            </v-col>

            <v-col cols="12">
              <label class="mb-1 fld-lbl">{{ form.type === 'WhatsApp' ? 'WhatsApp Message' : 'Email Content' }}</label>
              <div ref="editorEl" class="editor"></div>
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
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'
import { formatCrmTriggerPreview } from '@/lib/misc'
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  modelValue: Boolean,
  groups: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'success', 'update:modelValue'])
const crmStore = useCrmStore()
const mainStore = useMainStore()
const formRef = ref(null)
const saving = ref(false)
const requiredRule = [(v) => !!v || 'This field is required']
const types = ['Email', 'WhatsApp']
const triggerTypes = [
  { label: '— Select trigger type —', value: null },
  { label: 'After enquiry', value: 'inquiry_days' },
  { label: 'Birthday offset', value: 'birthday_offset' },
  { label: 'Birthday month start', value: 'birthday_month_start' },
  { label: 'Black Friday', value: 'black_friday' },
  { label: 'Fixed date (annual)', value: 'month_day' },
  { label: 'Nth weekday (annual)', value: 'weekday_of_month' },
  { label: 'Practice anniversary', value: 'practice_anniversary' },
]

const weekdayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const weekIndexOptions = [
  { label: '1st', value: 1 },
  { label: '2nd', value: 2 },
  { label: '3rd', value: 3 },
  { label: '4th', value: 4 },
  { label: '5th', value: 5 },
]

const form = ref({
  groupKey: '',
  type: 'Email',
  name: '',
  subject: '',
  template: '',
  triggerType: null,
  triggerDays: 0,
  triggerOffsetDays: 0,
  triggerMonth: 1,
  triggerDay: 1,
  triggerWeekday: 1,
  triggerWeekIndex: 1,
})

const editorEl = ref(null)
let ej = null
let EditorCtor = null
let Header = null
let List = null

const resetForm = () => {
  form.value = {
    groupKey: '',
    type: 'Email',
    name: '',
    subject: '',
    template: '',
    triggerType: null,
    triggerDays: 0,
    triggerOffsetDays: 0,
    triggerMonth: 1,
    triggerDay: 1,
    triggerWeekday: 1,
    triggerWeekIndex: 1,
  }
  if (formRef.value) formRef.value.resetValidation()
}

const initEditor = async () => {
  if (typeof window === 'undefined') return
  if (!EditorCtor || !Header || !List) {
    const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
    ])
    EditorCtor = E
    Header = H
    List = L
  }
  if (ej) { ej.destroy(); ej = null }
  ej = new EditorCtor({
    holder: editorEl.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(form.value.template || ''),
    onChange: async (api) => {
      const saved = await api.saver.save()
      form.value.template = blocksToHtml(saved)
    }
  })
}

const closeDrawer = () => {
  emit('close')
  emit('update:modelValue', false)
  resetForm()
  if (ej) { ej.destroy(); ej = null }
}

const handleDrawerClose = async (newValue) => {
  if (!newValue) {
    resetForm()
    if (ej) { ej.destroy(); ej = null }
  } else {
    await nextTick()
    await initEditor()
  }
  emit('update:modelValue', newValue)
}

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    if (!form.value.groupKey && props.groups?.length) {
      form.value.groupKey = props.groups[0]?.key || ''
    }
    await nextTick()
    await initEditor()
  }
})

const buildKey = (name) => {
  const base = String(name || 'automation')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-|-$|^_+|_+$/g, '') || 'automation'
  return `${base}_${Date.now().toString(36)}`
}

const sanitizeNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const buildTriggerFromForm = () => {
  const triggerType = form.value.triggerType
  if (!triggerType) return null
  if (triggerType === 'black_friday') {
    return {
      type: 'black_friday',
      offsetDays: sanitizeNumber(form.value.triggerOffsetDays, 0),
    }
  }
  if (triggerType === 'birthday_month_start') {
    return {
      type: 'birthday_month_start',
      offsetDays: sanitizeNumber(form.value.triggerOffsetDays, 0),
    }
  }
  if (triggerType === 'month_day') {
    return {
      type: 'month_day',
      month: sanitizeNumber(form.value.triggerMonth, 1),
      day: sanitizeNumber(form.value.triggerDay, 1),
      offsetDays: sanitizeNumber(form.value.triggerOffsetDays, 0),
    }
  }
  if (triggerType === 'weekday_of_month') {
    return {
      type: 'weekday_of_month',
      month: sanitizeNumber(form.value.triggerMonth, 1),
      weekday: sanitizeNumber(form.value.triggerWeekday, 1),
      weekIndex: sanitizeNumber(form.value.triggerWeekIndex, 1),
      offsetDays: sanitizeNumber(form.value.triggerOffsetDays, 0),
    }
  }
  if (triggerType === 'practice_anniversary') {
    return {
      type: 'practice_anniversary',
      offsetDays: sanitizeNumber(form.value.triggerOffsetDays, 0),
    }
  }
  return {
    type: triggerType,
    days: sanitizeNumber(form.value.triggerDays, 0),
  }
}

const sendingPreview = computed(() => {
  const trigger = buildTriggerFromForm()
  if (!trigger) return 'No trigger set — automation will not fire automatically'
  return formatCrmTriggerPreview(trigger)
})


const onSubmit = async () => {
  const validation = await formRef.value.validate()
  if (!validation.valid) return
  try {
    saving.value = true
    if (ej) {
      const saved = await ej.save()
      form.value.template = blocksToHtml(saved)
    }
    const key = buildKey(form.value.name)
    const trigger = buildTriggerFromForm()

    const payload = {
      key,
      groupKey: form.value.groupKey,
      type: form.value.type || 'Email',
      name: form.value.name,
      subject: form.value.type === 'Email' ? (form.value.subject || form.value.name) : '',
      sending: trigger ? formatCrmTriggerPreview(trigger) : '',
      enabled: false,
      template: form.value.template,
      ...(trigger ? { trigger } : {}),
    }
    const res = await crmStore.saveAutomation(payload)
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'Automation created', type: 'success' })
      emit('success', res.data)
      closeDrawer()
      return
    }
    mainStore.setSnackbar({ title: res?.message || 'Failed to create automation', type: 'error' })
  } catch (e) {
    mainStore.setSnackbar({ title: e.message || 'Failed to create automation', type: 'error' })
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
.editor {
  min-height: 320px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
.editor :deep(.ce-block__content) {
  max-width: 100%;
}
.trigger-preview {
  font-size: 12px;
  color: #6b7280;
}
.trigger-label {
  font-weight: 600;
  margin-right: 6px;
}

.whatsapp-preview {
  background: #e5ddd5;
  border-radius: 12px;
  padding: 16px;
  min-height: 160px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.whatsapp-preview__bubble {
  background: #dcf8c6;
  border-radius: 10px;
  padding: 12px 14px;
  max-width: 520px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
