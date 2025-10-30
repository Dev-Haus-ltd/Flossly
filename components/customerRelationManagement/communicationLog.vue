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
      <v-col cols="12" md="5">
        <div class="pa-4 notes-form">
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
                />
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
                />
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
                />
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

      <!-- RIGHT: Notes List -->
      <v-col cols="12" md="7">
        <v-row>
          <v-col
            cols="12"
            md="4"
            v-for="(note, i) in notes"
            :key="note.id || note._id || i"
          >
            <v-card class="pa-3 note-card" :elevation="0">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="note-title">{{ note.title }}</span>
                <v-icon
                  size="18"
                  color="#000000"
                  class="cursor-pointer"
                  @click="onDeleteNote(note, i)"
                >
                  mdi-delete
                </v-icon>
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
import { ref, onMounted } from "vue";
import { parsedDate } from "@/lib/dateFormatter";
import crmService from "@/services/crmService";

const emit = defineEmits(["save", "update:preferences"]);

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
};

const onNoteDateSelected = (val) => {
  form.value.date = val;
  formattedNoteDate.value = val ? new Date(val).toLocaleDateString() : "";
  noteDateMenu.value = false;
};

// Save preferences
const prefSaving = ref(false);
const onPrefChange = async () => {
  emit("update:preferences", { ...preferences.value });
  try {
    prefSaving.value = true;
    await crmService.saveLeadCommunication({
      leadId: Number(leadId),
      ...preferences.value,
    });
  } finally {
    prefSaving.value = false;
  }
};

// Add note
const onAddNote = async () => {
  if (!form.value.title || !form.value.date || !form.value.time || !form.value.channel || !form.value.summary)
    return;

  try {
    saving.value = true;
    const payload = { leadId: Number(leadId), ...form.value };
    const res = await crmService.addLeadNote(payload);
    if (res?.code === 0) {
      notes.value.unshift(res.data);
      emit("save", notes.value);
      form.value = { title: "", date: "", time: "", channel: null, summary: "" };
      formattedNoteDate.value = "";
    }
  } finally {
    saving.value = false;
  }
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
      const res = await crmService.deleteLeadNote(note.id);
      if (res && res.code !== 0) return;
    }
    notes.value.splice(index, 1);
    emit("save", notes.value);
  } finally {
    deleting.value = false;
    showDelete.value = false;
  }
};

// Load notes and preferences
onMounted(async () => {
  try {
    const res = await crmService.getLeadNotes(Number(leadId));
    if (res?.code === 0 && Array.isArray(res.data)) notes.value = res.data;
  } catch {}

  try {
    const comm = await crmService.getLeadCommunication(Number(leadId));
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
});
</script>

<style scoped>
.notes-form {
  border: 1px solid #dfdfdf;
  background-color: #fcfcfc;
  border-radius: 8px;
}
.notes-title {
  font-weight: 600;
  font-size: 14px;
  color: #000;
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
  color: #000;
}
.note-summary {
  font-size: 13px;
  color: #000;
  margin-top: 6px;
}
.fld-lbl {
  font-size: 14px;
  color: #737373;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>
