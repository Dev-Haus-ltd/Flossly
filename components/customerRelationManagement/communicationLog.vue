<template>
  <div>
    <!-- ░░░ Top Row: Preferences ░░░ -->
    <v-row>
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Preferred contact method</label>
        <v-select
          v-model="preferences.preferredContactMethod"
          :items="contactMethods"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
          @update:model-value="onPrefChange"
        />
      </v-col>

      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Preferred Appointment Day</label>
        <v-select
          v-model="preferences.preferredAppointmentDay"
          :items="appointmentDays"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
          @update:model-value="onPrefChange"
        />
      </v-col>

      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Best times to contact</label>
        <v-select
          v-model="preferences.bestTimesToContact"
          :items="bestTimes"
          multiple
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
          @update:model-value="onPrefChange"
        />
      </v-col>
    </v-row>

    <!-- ░░░ Main Content ░░░ -->
    <v-row>
      <!-- LEFT: Add Notes Form -->
      <v-col cols="12" md="4">
        <div class="pa-4 notes-form" ref="notesFormEl">
          <h5 class="notes-title mb-4">Add Notes</h5>

          <v-form ref="formRef" @submit.prevent="onAddNote">
            <v-row dense>
              <!-- Title -->
              <v-col cols="12">
                <label class="mb-1 fld-lbl">Title</label>
                <v-text-field
                  v-model="form.title"
                  variant="solo"
                  density="compact"
                  class="mb-1 input-bordered"
                  flat
                  required
                  :error="validationErrors.title"
                  @input="clearValidationError('title')"
                />
                <div v-if="validationErrors.title" class="validation-error">
                  Title is required
                </div>
              </v-col>

              <!-- Date -->
              <v-col cols="12" md="6">
                <label class="mb-1 fld-lbl">Select Date</label>
                <v-menu
                  v-model="noteDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="formattedNoteDate"
                      v-bind="props"
                      variant="solo"
                      density="compact"
                      class="mb-1 input-bordered"
                      flat
                      readonly
                      :error="validationErrors.date"
                    >
                      <template #append-inner>
                        <v-icon class="cursor-pointer" @click.stop="noteDateMenu = true">
                          mdi-calendar
                        </v-icon>
                      </template>
                    </v-text-field>
                  </template>

                  <v-date-picker
                    v-model="form.date"
                    @update:modelValue="onNoteDateSelected"
                  />
                </v-menu>
                <div v-if="validationErrors.date" class="validation-error">
                  Date is required
                </div>
              </v-col>

              <!-- Time -->
              <v-col cols="12" md="6">
                <label class="mb-1 fld-lbl">Select Time</label>
                <v-menu
                  v-model="timeMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="form.time"
                      v-bind="props"
                      variant="solo"
                      density="compact"
                      class="mb-1 input-bordered"
                      flat
                      readonly
                      required
                      :error="validationErrors.time"
                    >
                      <template #append-inner>
                        <v-icon class="cursor-pointer" @click.stop="timeMenu = true">
                          mdi-clock-outline
                        </v-icon>
                      </template>
                    </v-text-field>
                  </template>

                  <v-time-picker
                    v-model="form.time"
                    format="24hr"
                    @update:modelValue="onTimeSelected"
                  />
                </v-menu>
                <div v-if="validationErrors.time" class="validation-error">
                  Time is required
                </div>
              </v-col>

              <!-- Channel -->
              <v-col cols="12">
                <label class="mb-1 fld-lbl">Channel used</label>
                <v-select
                  v-model="form.channel"
                  :items="channelOptions"
                  variant="solo"
                  density="compact"
                  class="mb-1 input-bordered"
                  flat
                  required
                  :error="validationErrors.channel"
                  @update:model-value="clearValidationError('channel')"
                />
                <div v-if="validationErrors.channel" class="validation-error">
                  Channel is required
                </div>
              </v-col>

              <!-- Summary -->
              <v-col cols="12">
                <label class="mb-1 fld-lbl">Summary of conversation</label>
                <v-textarea
                  v-model="form.summary"
                  variant="solo"
                  density="compact"
                  class="mb-1 input-bordered"
                  flat
                  required
                  :error="validationErrors.summary"
                  @input="clearValidationError('summary')"
                />
                <div v-if="validationErrors.summary" class="validation-error">
                  Summary is required
                </div>
              </v-col>

              <!-- Add Note -->
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  color="primary"
                  flat
                  :loading="saving"
                  :disabled="saving"
                  @click="onAddNote"
                >
                  Add Note
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-col>

      <!-- RIGHT: container 1 -->
      <v-col cols="12" md="4">
        <div class="pa-4 voice-container">
          <div class="d-flex align-center justify-space-between mb-6">
            <div class="section-header">Voice Transcript</div>
            <v-btn
              v-if="isRecording"
              color="error"
              size="small"
              flat
              @click="stopRecording"
            >
              Stop
            </v-btn>
          </div>
          
          <!-- Error message -->
          <div v-if="error" class="voice-center">
            <v-alert type="error" variant="tonal" class="mb-4">
              {{ error }}
            </v-alert>
          </div>
          
          <!-- Idle state: Show microphone button -->
          <div v-else-if="!isRecording && !transcribedText && !isSummarizing" class="voice-center">
            <div class="mic-circle" @click="toggleRecording">
              <v-icon size="36" color="#ffffff">mdi-microphone</v-icon>
            </div>
            <div v-if="!isSupported" class="mt-3 text-caption text-error">
              Speech recognition not supported in this browser
            </div>
          </div>
          
          <!-- Recording or has transcript -->
          <div v-else class="transcript-wrapper">
            <!-- Summarizing overlay -->
            <div v-if="isSummarizing" class="loader-overlay">
              <v-progress-circular indeterminate color="primary" size="56" width="6" />
              <div class="mt-3 text-caption">Summarizing with AI...</div>
            </div>
            
            <!-- Simple read-only transcript viewer -->
            <div v-else class="transcript-viewer">
              {{ transcribedText || 'Listening...' }}
            </div>
          </div>
        </div>
      </v-col>

      <!-- RIGHT: container 2 -->
      <v-col cols="12" md="4">
        <div class="pa-4 voice-container">
          <div class="scripts-scroll" ref="scriptsScrollEl">
            <ScriptsPool />
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Notes List -->
    <v-row class="mt-4">
      <v-col
        cols="12"
        md="4"
        v-for="(note, i) in notes"
        :key="note.id || note._id || i"
      >
        <v-card class="pa-3 note-card" :elevation="0">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="note-title">{{ note.title }}</span>
            <img
              src="@/assets/tasks/delete.svg"
              alt="Delete"
              width="18"
              height="18"
              class="cursor-pointer"
              @click="onDeleteNote(note, i)"
            />
          </div>

          <div class="mb-1">
            <span class="note-label">Date:</span>
            <span class="note-value">{{ parsedDate(note.date) || "N/A" }}</span>
          </div>

          <div class="mb-1">
            <span class="note-label">Time:</span>
            <span class="note-value">{{ note.time || "N/A" }}</span>
          </div>

          <div class="mb-1">
            <span class="note-label">Channel:</span>
            <span class="note-value">{{ note.channel || "N/A" }}</span>
          </div>

          <div class="note-summary">{{ note.summary }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ✅ Confirm Delete Dialog -->
    <CommonConfirmDialog
      v-model="showDelete"
      title="Delete note?"
      message="Are you sure you want to delete this note?"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="showDelete = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { parsedDate, formatDateDDMMYYYY } from "@/lib/dateFormatter";
import { useWebSpeechTranscription } from "@/composables/useWebSpeechTranscription";
import ScriptsPool from "./ScriptsPool.vue";
const crmStore = useCrmStore();

const emit = defineEmits(["save", "update:preferences", "open-transcription"]);

const { leadId, initialNotes, initialPreferences } = defineProps({
  leadId: { type: [Number, String], required: true },
  initialNotes: { type: Array, default: () => [] },
  initialPreferences: { type: Object, default: () => ({}) },
});

// Notes
const notes = ref([...initialNotes]);
const saving = ref(false);
const deleting = ref(false);
const timeMenu = ref(false);
const noteDateMenu = ref(false);
const formattedNoteDate = ref("");

// Form
const form = ref({
  title: "",
  date: "",
  time: "",
  channel: null,
  summary: "",
});

// Validation errors
const validationErrors = ref({
  title: false,
  date: false,
  time: false,
  channel: false,
  summary: false,
});

// Preferences
const preferences = ref({
  preferredContactMethod: initialPreferences.preferredContactMethod || null,
  preferredAppointmentDay: initialPreferences.preferredAppointmentDay || null,
  bestTimesToContact: initialPreferences.bestTimesToContact || [],
});

const contactMethods = ["Phone", "Email", "WhatsApp", "SMS", "In-person"];
const appointmentDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const bestTimes = ["Morning", "Afternoon", "Evening"];
const channelOptions = ["Phone", "Email", "WhatsApp", "SMS", "In-person"];

// Date/time handlers
const onTimeSelected = (val) => {
  form.value.time = val;
  timeMenu.value = false;
  clearValidationError('time');
};

const onNoteDateSelected = (val) => {
  form.value.date = val;
  formattedNoteDate.value = val ? formatDateDDMMYYYY(val) : "";
  noteDateMenu.value = false;
  clearValidationError('date');
};

// Save preferences
const prefSaving = ref(false);
const onPrefChange = async () => {
  emit("update:preferences", { ...preferences.value });
  try {
    prefSaving.value = true;
    await crmStore.saveLeadCommunication({
      leadId: Number(leadId),
      ...preferences.value,
    });
  } finally {
    prefSaving.value = false;
  }
};

// Add note
const onAddNote = async () => {
  console.log('onAddNote called');
  
  // Validate all required fields
  validationErrors.value.title = !form.value.title;
  validationErrors.value.date = !form.value.date;
  validationErrors.value.time = !form.value.time;
  validationErrors.value.channel = !form.value.channel;
  validationErrors.value.summary = !form.value.summary;

  // If any validation errors, don't proceed
  if (validationErrors.value.title || validationErrors.value.date || validationErrors.value.time || 
      validationErrors.value.channel || validationErrors.value.summary) {
    return;
  }

  try {
    saving.value = true;
    const payload = { leadId: Number(leadId), ...form.value };
    const res = await crmStore.addLeadNote(payload);
    if (res?.code === 0) {
      notes.value.unshift(res.data);
      emit("save", notes.value);
      form.value = { title: "", date: "", time: "", channel: null, summary: "" };
      formattedNoteDate.value = "";
      clearEditor();
      // Clear validation errors after successful save
      validationErrors.value = {
        title: false,
        date: false,
        time: false,
        channel: false,
        summary: false,
      };
    }
  } finally {
    saving.value = false;
  }
};

// Clear validation error when field is filled
const clearValidationError = (field) => {
  validationErrors.value[field] = false;
};

// Delete note
const showDelete = ref(false);
const toDelete = ref({ index: -1, note: null });

const onDeleteNote = (note, index) => {
  toDelete.value = { index, note };
  showDelete.value = true;
};

const confirmDelete = async () => {
  const { index, note } = toDelete.value;
  try {
    deleting.value = true;
    if (note?.id) {
      const res = await crmStore.deleteLeadNote(note.id);
      if (res && res.code !== 0) return;
    }
    notes.value.splice(index, 1);
    emit("save", notes.value);
  } finally {
    deleting.value = false;
    showDelete.value = false;
  }
};

// Transcription integration
const notesFormEl = ref(null);
const scriptsScrollEl = ref(null);
let notesFormResizeObserver = null;
const {
  isRecording,
  isSummarizing,
  transcribedText,
  summarizedText,
  toggleRecording,
  stopRecording,
  clearTranscription,
  isSupported,
  error,
} = useWebSpeechTranscription();

// Keep scripts container height capped to notes form height
const syncScriptsMaxHeight = () => {
  try {
    const formEl = notesFormEl?.value;
    const scriptsEl = scriptsScrollEl?.value;
    if (!formEl || !scriptsEl) return;
    const height = formEl.offsetHeight;
    if (height && Number.isFinite(height)) {
      scriptsEl.style.maxHeight = `${height}px`;
      scriptsEl.style.overflow = "auto";
    }
  } catch {}
};

// Load notes and preferences
onMounted(async () => {
  try {
    const res = await crmStore.getLeadNotes(Number(leadId));
    if (res?.code === 0 && Array.isArray(res.data)) notes.value = res.data;
  } catch {}

  try {
    const comm = await crmStore.getLeadCommunication(Number(leadId));
    if (comm?.code === 0 && comm.data) {
      preferences.value = {
        preferredContactMethod: comm.data.preferredContactMethod || null,
        preferredAppointmentDay: comm.data.preferredAppointmentDay || null,
        bestTimesToContact: Array.isArray(comm.data.bestTimesToContact)
          ? comm.data.bestTimesToContact
          : [],
      };
    }
  } catch {}

  // Wait for DOM, then sync heights and observe future changes
  await nextTick();
  syncScriptsMaxHeight();
  if (window && "ResizeObserver" in window && notesFormEl?.value) {
    notesFormResizeObserver = new ResizeObserver(() => {
      syncScriptsMaxHeight();
    });
    notesFormResizeObserver.observe(notesFormEl.value);
  } else {
    // Fallback: resync on window resize
    window.addEventListener("resize", syncScriptsMaxHeight);
  }
});

// When AI summary becomes available, populate the notes form's summary
watch(
  () => summarizedText.value,
  (val) => {
    if (val && typeof val === "string") {
      form.value.summary = val;
      clearTranscription();
    }
  },
);

onBeforeUnmount(() => {
  if (notesFormResizeObserver) {
    try {
      notesFormResizeObserver.disconnect();
    } catch {}
    notesFormResizeObserver = null;
  }
  window.removeEventListener("resize", syncScriptsMaxHeight);
});
</script>

<style scoped>
.notes-form {
  border: 1px solid #dfdfdf;
  border-radius: 8px;
}
.notes-title {
  font-weight: 600;
  font-size: 14px;
}
.note-card {
  background-color: color-mix(in oklab, rgb(var(--v-theme-warning)) 12%, transparent);
  border-radius: 8px;
}
.note-title {
  font-weight: 700;
  font-size: 14px;
}
.note-label {
  font-size: 14px;
  color: #737373;
  margin-right: 6px;
}
.note-value {
  font-size: 14px;
}
.note-summary {
  font-size: 13px;
  margin-top: 6px;
}
.fld-lbl {
  font-size: 14px;
  color: #737373;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  min-height: 40px;
  font-size: 14px;
}
.section-header {
  font-weight: 600;
  font-size: 14px;
}
.voice-container,
.text-container {
  border: 1px solid #dfdfdf;
  border-radius: 8px;
  height: 100%;
  background-color: #ffffff;
}
.voice-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 220px;
}
.mic-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}
.mic-circle:hover {
  transform: scale(1.04);
  box-shadow: 0 10px 22px rgba(0,0,0,0.12);
}
.mic-hint {
  font-size: 12px;
  color: #737373;
}
.text-placeholder {
  font-size: 14px;
  color: #4b4b4b;
}
.transcript-wrapper {
  position: relative;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.transcript-viewer {
  width: 100%;
  min-height: 260px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}
.loader-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  z-index: 10;
}
.scripts-scroll {
  
  
  min-height: 260px;
  overflow: auto;
}
.validation-error {
  color: rgb(var(--v-theme-error));
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 8px;
}
</style>
