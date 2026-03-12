<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="960px">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex justify-space-between align-center mb-2">
        <div class="text-subtitle-1 font-weight-600">Notes for {{ dentistName }} — {{ formattedDate }}</div>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </div>

      <v-row>
        <!-- Left: Add note form -->
        <v-col cols="12" md="5">
          <div class="pa-4 notes-form">
            <h5 class="notes-title mb-4">Add Notes</h5>
            <v-form @submit.prevent="onAddNote">
              <v-row dense>
                <v-col cols="12">
                  <label class="mb-1 fld-lbl">Title</label>
                  <v-text-field
                    v-model="form.title"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    :error="!!errors.title"
                    :error-messages="errors.title ? [errors.title] : []"
                    hide-details="auto"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="mb-1 fld-lbl">Select Date</label>
                  <v-text-field :model-value="formattedFormDate" variant="solo" density="compact" class="mb-1 input-bordered" flat readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="mb-1 fld-lbl">Select time</label>
                  <v-text-field
                    v-model="form.time"
                    type="time"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    :error="!!errors.time"
                    :error-messages="errors.time ? [errors.time] : []"
                    hide-details="auto"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <label class="mb-1 fld-lbl">Channel used</label>
                  <v-select
                    v-model="form.channel"
                    :items="channelOptions"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    :error="!!errors.channel"
                    :error-messages="errors.channel ? [errors.channel] : []"
                    hide-details="auto"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <label class="mb-1 fld-lbl">Summary of conversation</label>
                  <v-textarea
                    v-model="form.summary"
                    rows="4"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    :error="!!errors.summary"
                    :error-messages="errors.summary ? [errors.summary] : []"
                    hide-details="auto"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-btn
                    :loading="saving"
                    :disabled="saving || !canSubmit"
                    color="primary"
                    variant="flat"
                    @click="onAddNote"
                  >
                    Add notes
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-col>

        <!-- Right: notes list -->
        <v-col cols="12" md="7">
          <v-row>
            <v-col v-for="(n, i) in notes" :key="n.id || i" cols="12" md="6">
              <v-card class="pa-4 note-card">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="note-title">{{ n.title }}</div>
                  <v-btn icon size="small" variant="text" @click="onDeleteNote(n, i)"><v-icon size="18">mdi-trash-can-outline</v-icon></v-btn>
                </div>
                <div class="mb-2">
                  <span class="note-label">Date</span>
                  <span class="note-value">{{ formatDisplayDate(n.date) || 'N/A' }}</span>
                </div>
                <div class="mb-2">
                  <span class="note-label">Time</span>
                  <span class="note-value">{{ formatDisplayTime(n.time) || 'N/A' }}</span>
                </div>
                <div class="mb-2">
                  <span class="note-label">Channel</span>
                  <span class="note-value">{{ n.channel }}</span>
                </div>
                <div class="text-body-2">{{ n.summary }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-dialog v-model="showDelete" max-width="420">
        <v-card class="pa-4">
          <div class="text-subtitle-1 mb-3">Delete this note?</div>
          <div class="d-flex justify-end" style="gap: 8px">
            <v-btn variant="text" @click="showDelete = false">Cancel</v-btn>
            <v-btn color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
          </div>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
  
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useMainStore } from '@/stores/index'
import diaryService from '@/services/diaryService'
import { formatDateDDMMYYYY, formatDisplayDate, formatDisplayTime } from '@/lib/dateFormatter'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  date: { type: String, required: true },
  dentistId: { type: [Number, String], required: true },
  dentistName: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const diaryStore = useDiaryStore()
const mainStore = typeof useMainStore === 'function' ? useMainStore() : null

const notes = ref([])
const saving = ref(false)
const deleting = ref(false)
const showDelete = ref(false)
const toDelete = ref({ index: -1, note: null })

const form = ref({ title: '', date: '', time: '', channel: '', summary: '' })
const errors = reactive({ title: '', time: '', channel: '', summary: '' })
const canSubmit = computed(() => {
  return Boolean(
    (form.value.title || '').trim() &&
    (form.value.date || '').trim() &&
    (form.value.time || '').trim() &&
    (form.value.channel || '').trim() &&
    (form.value.summary || '').trim()
  )
})
const channelOptions = ['Phone','Email','WhatsApp','SMS','In-person']

// Format dates to DD/MM/YYYY
const formattedDate = computed(() => {
  return formatDateDDMMYYYY(props.date)
})

const formattedFormDate = computed(() => {
  return formatDateDDMMYYYY(form.value.date)
})

const notify = (message, type = 'success') => {
  if (mainStore?.setSnackbar) mainStore.setSnackbar({ title: message, type })
}

const resetForm = () => {
  form.value = {
    title: '',
    date: props.date || '',
    time: '09:00',
    channel: channelOptions[0] || '',
    summary: '',
  }
  Object.keys(errors).forEach(key => { errors[key] = '' })
}

const validateForm = () => {
  errors.title = form.value.title ? '' : 'Title is required'
  errors.time = form.value.time ? '' : 'Time is required'
  errors.channel = form.value.channel ? '' : 'Channel is required'
  errors.summary = form.value.summary ? '' : 'Summary is required'
  return !errors.title && !errors.time && !errors.channel && !errors.summary
}

watch(() => props.modelValue, (open) => {
  if (open) {
    resetForm()
    loadNotes()
  } else {
    showDelete.value = false
  }
})
watch([() => props.date, () => props.dentistId], () => {
  if (!props.modelValue) return
  form.value.date = props.date
  loadNotes()
})
watch(() => form.value.title, (val) => { if (val) errors.title = '' })
watch(() => form.value.time, (val) => { if (val) errors.time = '' })
watch(() => form.value.channel, (val) => { if (val) errors.channel = '' })
watch(() => form.value.summary, (val) => { if (val) errors.summary = '' })

async function loadNotes() {
  if (!props.dentistId || !props.date) {
    notes.value = []
    return
  }
  try {
    const res = await (diaryStore?.listNotes ? diaryStore.listNotes({ dentistId: props.dentistId, date: props.date }) : diaryService.listNotes({ dentistId: props.dentistId, date: props.date }))
    if (res?.code === 0) notes.value = res.data || []
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Failed to load notes'
    notify(msg, 'error')
  }
}

async function onAddNote() {
  if (!validateForm()) return
  try {
    saving.value = true
    const payload = { dentistId: Number(props.dentistId), ...form.value }
    const res = await (diaryStore?.createNote ? diaryStore.createNote(payload) : diaryService.createNote(payload))
    if (res?.code === 0) {
      const created = res?.data ? { ...res.data } : { ...payload, id: Date.now() }
      notes.value.unshift(created)
      notify('Note added successfully', 'success')
      resetForm()
    }
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Failed to add note'
    notify(msg, 'error')
  } finally { saving.value = false }
}

function onDeleteNote(note, index) { toDelete.value = { index, note }; showDelete.value = true }
async function confirmDelete() {
  const { index, note } = toDelete.value
  try {
    deleting.value = true
    if (note?.id) {
      const deleter = diaryStore?.deleteNote ? diaryStore.deleteNote : (id) => diaryService.deleteNote(id)
      await deleter(note.id)
    }
    if (index > -1) notes.value.splice(index, 1)
    notify('Note deleted', 'success')
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Failed to delete note'
    notify(msg, 'error')
  } finally { deleting.value = false; showDelete.value = false }
}
</script>

<style scoped>
.notes-form { border: 1px solid #dfdfdf; border-radius: 8px; }
.notes-title { font-weight: 600; font-size: 14px; }
.note-card { border-radius: 8px; background: #f8fafc }
.note-title { font-weight: 700; font-size: 14px; }
.note-label { font-size: 14px; color: #737373; margin-right: 6px; }
.note-value { font-size: 14px; }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; background-color: white !important; min-height: 40px; border-radius: 8px; }
</style>
