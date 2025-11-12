<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="960px">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex justify-space-between align-center mb-2">
        <div class="text-subtitle-1 font-weight-600">Notes for {{ dentistName }} — {{ date }}</div>
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
                  <v-text-field v-model="form.title" variant="solo" density="compact" class="mb-1 input-bordered" flat required />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="mb-1 fld-lbl">Select Date</label>
                  <v-text-field v-model="form.date" variant="solo" density="compact" class="mb-1 input-bordered" flat readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="mb-1 fld-lbl">Select time</label>
                  <v-select v-model="form.time" :items="timeOptions" variant="solo" density="compact" class="mb-1 input-bordered" flat required />
                </v-col>
                <v-col cols="12">
                  <label class="mb-1 fld-lbl">Channel used</label>
                  <v-select v-model="form.channel" :items="channelOptions" variant="solo" density="compact" class="mb-1 input-bordered" flat required />
                </v-col>
                <v-col cols="12">
                  <label class="mb-1 fld-lbl">Summary of conversation</label>
                  <v-textarea v-model="form.summary" rows="4" variant="solo" density="compact" class="mb-1 input-bordered" flat required />
                </v-col>
                <v-col cols="12">
                  <v-btn :loading="saving" color="primary" variant="flat" @click="onAddNote">Add notes</v-btn>
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
                  <span class="note-value">{{ n.date }}</span>
                </div>
                <div class="mb-2">
                  <span class="note-label">Time</span>
                  <span class="note-value">{{ n.time }}</span>
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
import { ref, computed, watch } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import diaryService from '@/services/diaryService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  date: { type: String, required: true },
  dentistId: { type: [Number, String], required: true },
  dentistName: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const diaryStore = useDiaryStore()

const notes = ref([])
const saving = ref(false)
const deleting = ref(false)
const showDelete = ref(false)
const toDelete = ref({ index: -1, note: null })

const form = ref({ title: '', date: '', time: '', channel: null, summary: '' })
const WORK_START = 9
const WORK_END = 17
const SLOT_MINUTES = 15
const toHM = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
const timeOptions = computed(() => {
  const options = []
  for (let mins=WORK_START*60; mins<=WORK_END*60; mins+=SLOT_MINUTES) {
    const h = Math.floor(mins/60); const m = mins%60
    if (mins <= WORK_END*60) options.push(toHM(h,m))
  }
  return options
})
const channelOptions = ['Phone','Email','WhatsApp','SMS','In-person']

async function loadNotes() {
  const loader = typeof diaryStore.listNotes === 'function' ? diaryStore.listNotes : (p) => diaryService.listNotes(p)
  const res = await loader({ dentistId: props.dentistId, date: props.date })
  if (res?.code === 0) notes.value = res.data || []
}

watch(() => props.modelValue, (open) => {
  if (open) {
    form.value = { title: '', date: props.date, time: timeOptions.value[0] || '09:00', channel: null, summary: '' }
    loadNotes()
  }
})

async function onAddNote() {
  if (!form.value.title || !form.value.date || !form.value.time || !form.value.channel || !form.value.summary) return
  try {
    saving.value = true
    const payload = { dentistId: Number(props.dentistId), ...form.value }
    const creator = typeof diaryStore.createNote === 'function' ? diaryStore.createNote : (p) => diaryService.createNote(p)
    const res = await creator(payload)
    if (res?.code === 0) {
      notes.value.unshift(res.data)
      form.value = { title: '', date: props.date, time: timeOptions.value[0] || '09:00', channel: null, summary: '' }
    }
  } finally { saving.value = false }
}

function onDeleteNote(note, index) { toDelete.value = { index, note }; showDelete.value = true }
async function confirmDelete() {
  const { index, note } = toDelete.value
  try {
    deleting.value = true
    const deleter = typeof diaryStore.deleteNote === 'function' ? diaryStore.deleteNote : (id) => diaryService.deleteNote(id)
    if (note?.id) await deleter(note.id)
    notes.value.splice(index, 1)
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
