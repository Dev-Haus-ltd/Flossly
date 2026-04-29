<!-- In components/diary/addAppointment.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    scrollable
    :persistent="isSaving"
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          {{ isEditing ? "Edit Appointment" : "New Appointment" }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
          class="mr-2"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <!-- Summary chip -->
        <div class="summary-row mb-4">
          <div
            class="summary-dot"
            :style="{ background: statusColor.chip }"
          ></div>
          <div>
            <div class="text-body-2 font-weight-medium">{{ headerText }}</div>
            <div class="text-caption text-grey">
              {{ exam || "No treatment selected" }}
            </div>
          </div>
        </div>

        <v-card elevation="0" rounded="lg" class="pa-4" color="white">
          <v-row dense>
            <!-- Patient -->
            <v-col cols="12">
              <label class="fld-lbl"
                >Patient <span class="req-star">*</span></label
              >
              <v-Autocomplete
                v-model="selectedPatientId"
                :items="patientOptions"
                item-title="name"
                item-value="id"
                clearable
                density="compact"
                variant="outlined"
                class="mt-1"
                :placeholder="'Search patient...'"
                :error="!!errors.patient"
                :error-messages="errors.patient ? [errors.patient] : []"
                hide-details="auto"
              >
                <template #append v-if="!hideAddPatient">
                  <v-btn
                    icon
                    size="28"
                    variant="text"
                    @click="$emit('add-patient')"
                  >
                    <v-icon size="18">mdi-account-plus</v-icon>
                  </v-btn>
                </template>
              </v-Autocomplete>
            </v-col>

            <!-- Date -->
            <v-col cols="6">
              <label class="fld-lbl">Date</label>
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                offset-y
              >
                <template #activator="{ props: dp }">
                  <v-text-field
                    v-bind="dp"
                    :model-value="date ? formatDateDDMMYYYY(date) : ''"
                    variant="outlined"
                    density="compact"
                    class="mt-1"
                    hide-details
                    readonly
                  >
                    <template #append-inner>
                      <v-icon size="16" @click.stop="dateMenu = true"
                        >mdi-calendar</v-icon
                      >
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="date"
                  @update:model-value="dateMenu = false"
                  color="primary"
                />
              </v-menu>
            </v-col>

            <!-- Time -->
            <v-col cols="6">
              <label class="fld-lbl"
                >Time <span class="req-star">*</span></label
              >
              <v-select
                v-model="time"
                :items="displayTimeOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.time"
                :error-messages="errors.time ? [errors.time] : []"
                hide-details="auto"
                :placeholder="'Select time'"
              />
            </v-col>

            <!-- Duration -->
            <v-col cols="4">
              <label class="fld-lbl">Duration (min)</label>
              <v-select
                v-model="duration"
                :items="durations"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.duration"
                :error-messages="errors.duration ? [errors.duration] : []"
                hide-details="auto"
              />
            </v-col>

            <!-- Status -->
            <v-col cols="4">
              <label class="fld-lbl">Status</label>
              <v-select
                v-model="status"
                :items="statuses"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
                :error="!!errors.status"
                :error-messages="errors.status ? [errors.status] : []"
              />
            </v-col>

            <!-- Practitioner -->
            <v-col cols="4">
              <label class="fld-lbl"
                >Practitioner <span class="req-star">*</span></label
              >
              <v-select
                v-model="practitioner"
                :items="practitionerOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
                :error="!!errors.practitioner"
                :error-messages="
                  errors.practitioner ? [errors.practitioner] : []
                "
              />
            </v-col>

            <!-- Treatment with Add Option -->
            <v-col cols="12">
              <label class="fld-lbl">Treatment / Exam <span class="req-star">*</span></label>
              <v-combobox
                v-model="exam"
                :items="exams"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
                placeholder="Search or type treatment"
                :filter="customFilter"
                @keydown.enter="handleAddTreatment"
                :error="!!errors.exam"
                :error-messages="
                  errors.exam ? [errors.exam] : []
                "
              >
                <template #no-data>
                  <v-list-item @click="handleAddTreatment">
                    <v-list-item-title class="text-primary text-center">
                      <v-icon start size="16">mdi-plus</v-icon>
                      Add "{{ exam }}"
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-combobox>
              <div class="text-caption text-grey mt-1">
                Type new treatment name and press Enter to add
              </div>
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <label class="fld-lbl">Notes</label>
              <v-textarea
                v-model="notes"
                auto-grow
                variant="outlined"
                density="compact"
                class="mt-1"
                rows="2"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer actions -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          color="#6d4aff"
          variant="tonal"
          style="flex: 1; border-radius: 10px"
          @click="onSaveToClipboard"
        >
          <v-icon start size="18">mdi-clipboard-outline</v-icon>
          Save as Draft
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          @click="onSave"
          :loading="isSaving"
          :disabled="isSaving"
        >
          {{ isEditing ? "Update" : "Schedule" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from "vue";
import {
  formatDateDDMMYYYY,
  clinicDateToYMD,
  formatTime12Hour,
} from "@/lib/dateFormatter";
import { useOrgStore } from "@/stores/organisation";
import { useDentistAvailability } from "@/composables/useDentistAvailability";
import { useUser } from "@/composables/useUser";
import { useMainStore } from "@/stores/index";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialDate: { type: String, default: "" },
  initialTime: { type: String, default: "" },
  initialDuration: { type: Number, default: 15 },
  initialPractitioner: { type: [String, Number], default: "" },
  practitionerOptions: { type: Array, default: () => [] },
  patientOptions: { type: Array, default: () => [] },
  preselectedPatientId: { type: [Number, String], default: null },
  preselectedPatient: { type: String, default: "" },
  editAppointment: { type: Object, default: () => null },
  hideAddPatient: { type: Boolean, default: false },
  ignoreAvailability: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "save",
  "add-patient",
  "save-to-clipboard",
  "treatment-added",
  "date-change",
]);

const selectedPatientId = ref(null);
const date = ref("");
const time = ref("");
const exam = ref("");
const status = ref("Pending");
const duration = ref(15);
const practitioner = ref("");
const notes = ref("");
const dateMenu = ref(false);
const isSaving = ref(false);
const addTreatmentDialog = ref(false);
const newTreatmentName = ref("");
const newTreatmentPrice = ref("");
const newTreatmentDuration = ref("");
const isAddingTreatment = ref(false);
const errors = reactive({
  patient: "",
  date: "",
  time: "",
  exam: "",
  status: "",
  duration: "",
  practitioner: "",
});

const organisationStore = useOrgStore();
const { user } = useUser();
const mainStore = useMainStore();
const {
  loadDentistSchedules,
  getTimeRangeAvailability,
  getAvailableTimeSlots,
  getAvailabilityMessage,
} = useDentistAvailability();
const treatmentOptions = ref([]);
const exams = computed(() => treatmentOptions.value.map((t) => t.name));

const statuses = [
  "Pending",
  "Confirmed",
  "Arrived",
  "Cancelled",
  "In Surgery",
  "Complete",
  "Did not attend",
];
const durations = [10, 15, 20, 30, 45, 60, 90, 120];

const isEditing = computed(() => !!props.editAppointment?.id);

const WORK_START = 9;
const WORK_END = 17;
const SLOT_MIN = 15;
const fallbackTimeOptions = computed(() => {
  const dur = Number(duration.value || 15);
  const opts = [];
  const last = WORK_END * 60 - dur;
  for (let m = WORK_START * 60; m <= last; m += SLOT_MIN) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    opts.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return opts;
});
const timeOptions = computed(() => {
  if (props.ignoreAvailability) {
    return fallbackTimeOptions.value;
  }

  if (date.value && practitioner.value) {
    return getAvailableTimeSlots(
      clinicDateToYMD(date.value),
      Number(duration.value || 15),
      SLOT_MIN,
    );
  }

  return fallbackTimeOptions.value;
});

const displayTimeOptions = computed(() =>
  timeOptions.value.map((value) => ({
    title: formatTime12Hour(value) || value,
    value,
  })),
);

const practitionerLabel = computed(() => {
  const selected = props.practitionerOptions.find(
    (option) => String(option.value) === String(practitioner.value),
  );
  return selected?.title || "";
});

const hasPatient = computed(() =>
  Boolean(
    selectedPatientId.value ||
    props.preselectedPatientId ||
    (props.preselectedPatient && String(props.preselectedPatient).trim()),
  ),
);

const headerText = computed(() => {
  const parts = [];
  if (date.value) parts.push(formatDateDDMMYYYY(date.value));
  if (time.value) parts.push(formatTime12Hour(time.value) || time.value);
  if (duration.value) parts.push(`${duration.value} min`);
  if (practitionerLabel.value) parts.push(practitionerLabel.value);
  return parts.join(" | ") || "Fill in the details below";
});

const customFilter = (item, queryText, itemText) => {
  const text = itemText.toLowerCase();
  const query = queryText.toLowerCase();
  return text.includes(query);
};

const applyIncomingAppointmentState = () => {
  if (isEditing.value && props.editAppointment) {
    const a = props.editAppointment;
    date.value = a.date || props.initialDate || "";
    time.value = a.start || a.time || props.initialTime || "";
    duration.value = a.duration || props.initialDuration || 15;
    status.value = a.status || "Pending";
    exam.value = a.treatmentName || a.exam || "";
    practitioner.value =
      a.practitionerId || a.practitioner || props.initialPractitioner || "";
    selectedPatientId.value = a.patientId || props.preselectedPatientId || null;
    notes.value = a.notes || "";
  } else {
    date.value = props.initialDate || "";
    time.value = props.initialTime || "";
    duration.value = props.initialDuration || 15;
    practitioner.value = props.initialPractitioner || "";
    status.value = "Pending";
    exam.value = "";
    notes.value = "";
    selectedPatientId.value = props.preselectedPatientId || null;
  }

  if (
    timeOptions.value.length &&
    (!time.value || !timeOptions.value.includes(time.value))
  ) {
    time.value = timeOptions.value[0] || "";
  }
};

const handleAddTreatment = async () => {
  const value = (exam.value || "").trim();

  if (!value) {
    errors.exam = "Please enter a treatment name";

    mainStore.setSnackbar({
      title: "Please enter a treatment name",
      type: "error",
    });

    return;
  }

  const exists = treatmentOptions.value.find(
    (t) => t.name.toLowerCase() === value.toLowerCase()
  );

  // Agar already exist karta hai → kuch na karo
  if (exists) {
    exam.value = exists.name;
    duration.value = exists.defaultDuration || duration.value;

    mainStore.setSnackbar({
      title: `"${exists.name}" is already available as a treatment`,
      type: "info",
    });

    return;
  }

  try {
    const payload = {
      name: value,
      defaultDuration: duration.value || 15,
      price: 0,
    };

    const res = await organisationStore.addTreatment(payload);

    if (res?.code === 0) {
      const newItem = {
        id: res.data.id,
        name: res.data.name,
        code: res.data.code,
        defaultDuration: res.data.defaultDuration || 15,
        amount: res.data.price || 0,
        color: res.data.color || "#0061FB",
        active: res.data.active,
      };

      treatmentOptions.value.push(newItem);
      exam.value = newItem.name;
      duration.value = newItem.defaultDuration;
      emit("treatment-added", newItem);

      mainStore.setSnackbar({
        title: `Treatment "${newItem.name}" created successfully`,
        type: "success",
      });

      return;
    }

    mainStore.setSnackbar({
      title: res?.message || "Failed to create treatment",
      type: "error",
    });
  } catch (err) {
    console.error(err);

    mainStore.setSnackbar({
      title: err?.message || "Failed to create treatment",
      type: "error",
    });
  }
};

const openAddTreatmentDialog = () => {
  newTreatmentName.value = exam.value || "";
  newTreatmentPrice.value = "";
  newTreatmentDuration.value = "";
  addTreatmentDialog.value = true;
};

const statusColor = computed(() => {
  const map = {
    Pending: { bg: "#fceaf6", chip: "#d948a8" },
    Confirmed: { bg: "#ede8ff", chip: "#6d4aff" },
    Arrived: { bg: "#e8f0ff", chip: "#397bff" },
    "In Surgery": { bg: "#e5fbf8", chip: "#00b2a5" },
    Complete: { bg: "#e5fbea", chip: "#23b96d" },
    Cancelled: { bg: "#ffeaea", chip: "#ff5353" },
    "Did not attend": { bg: "#fff2e0", chip: "#ffa12e" },
  };
  return map[status.value] || { bg: "#ede8ff", chip: "#6366f1" };
});

const closeAddTreatmentDialog = () => {
  addTreatmentDialog.value = false;
  newTreatmentName.value = "";
  newTreatmentPrice.value = "";
  newTreatmentDuration.value = "";
  isAddingTreatment.value = false;
};

const saveNewTreatment = async () => {
  if (!newTreatmentName.value.trim()) return;

  isAddingTreatment.value = true;
  try {
    const treatmentData = {
      name: newTreatmentName.value.trim(),
      price: newTreatmentPrice.value ? parseFloat(newTreatmentPrice.value) : 0,
      defaultDuration: newTreatmentDuration.value
        ? parseInt(newTreatmentDuration.value)
        : duration.value,
    };

    const response = await organisationStore.addTreatment(treatmentData);
    if (response?.code === 0) {
      const newTreatment = {
        id: response.data.id,
        name: treatmentData.name,
        defaultDuration: treatmentData.defaultDuration,
        amount: treatmentData.price,
      };
      treatmentOptions.value.push(newTreatment);
      exam.value = treatmentData.name;

      if (treatmentData.defaultDuration) {
        duration.value = treatmentData.defaultDuration;
      }

      emit("treatment-added", newTreatment);
      closeAddTreatmentDialog();
    } else {
      console.error("Failed to add treatment:", response);
    }
  } catch (error) {
    console.error("Error adding treatment:", error);
  } finally {
    isAddingTreatment.value = false;
  }
};

watch(duration, () => {
  if (
    timeOptions.value.length &&
    (!time.value || !timeOptions.value.includes(time.value))
  ) {
    time.value = timeOptions.value[0] || "";
  }
});
watch(hasPatient, (v) => {
  if (v) errors.patient = "";
});
watch(date, (v) => {
  if (v) errors.date = "";
});
watch(time, (v) => {
  if (v) errors.time = "";
});
watch(exam, (v) => {
  if (v) errors.exam = "";
});
watch(status, (v) => {
  if (v) errors.status = "";
});
watch(duration, (v) => {
  if (v) errors.duration = "";
});
watch(practitioner, (v) => {
  if (v) errors.practitioner = "";
});
watch(date, (val) => {
  if (!val) return;
  emit("date-change", clinicDateToYMD(val));
});
watch(
  [date, practitioner, duration, () => props.modelValue],
  async ([nextDate, nextPractitioner, _nextDuration, open]) => {
    if (!open) return;
    const orgId = user.value?.currentLoggedInOrgId || user.value?.organisationId;
    if (!orgId || !nextDate || !nextPractitioner) return;
    try {
      await loadDentistSchedules(orgId, Number(nextPractitioner));
      if (
        timeOptions.value.length &&
        time.value &&
        !timeOptions.value.includes(time.value)
      ) {
        time.value = timeOptions.value[0] || "";
      }
    } catch (error) {
      console.error("Could not load dentist schedule", error);
    }
  },
);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      isSaving.value = false;
      return;
    }

    if (!treatmentOptions.value.length) {
      const res = await organisationStore.listTreatments();
      if (res?.code === 0) {
        treatmentOptions.value = (res.data || []).map((r) => ({
          id: r.id,
          name: r.name,
          defaultDuration: r.defaultDuration || 15,
          amount: r.price ?? r.amount ?? 0,
        }));
      }
    }

    applyIncomingAppointmentState();
  },
);

watch(
  [
    () => props.initialDate,
    () => props.initialTime,
    () => props.initialDuration,
    () => props.initialPractitioner,
    () => props.preselectedPatientId,
    () => props.editAppointment,
  ],
  () => {
    if (!props.modelValue) return;
    applyIncomingAppointmentState();
  },
);

const validate = () => {
  let ok = true;
  if (!hasPatient.value) {
    errors.patient = "Patient is required";
    ok = false;
  } else errors.patient = "";
  if (!date.value) {
    errors.date = "Date is required";
    ok = false;
  } else errors.date = "";
  if (!time.value) {
    errors.time = "Time is required";
    ok = false;
  } else errors.time = "";
  if (!exam.value) {
    errors.exam = "Exam is required";
    ok = false;
  } else errors.exam = "";
  if (!status.value) {
    errors.status = "Status is required";
    ok = false;
  } else errors.status = "";
  if (!duration.value) {
    errors.duration = "Duration is required";
    ok = false;
  } else errors.duration = "";
  if (!practitioner.value) {
    errors.practitioner = "Practitioner required";
    ok = false;
  } else errors.practitioner = "";
  if (!ok) {
    const firstError =
      errors.patient ||
      errors.date ||
      errors.time ||
      errors.exam ||
      errors.status ||
      errors.duration ||
      errors.practitioner ||
      "Complete the required appointment fields";
    mainStore?.setSnackbar?.({ title: firstError, type: "error" });
  }
  return ok;
};

const onSave = async () => {
  if (!validate()) return;

  const orgId =
    user.value?.currentLoggedInOrgId || user.value?.organisationId;

  // ✅ Only run availability check if NOT CRM mode
  if (
    !props.ignoreAvailability &&
    orgId &&
    practitioner.value &&
    date.value &&
    time.value
  ) {
    try {
      await loadDentistSchedules(orgId, Number(practitioner.value));

      const bookingDate = clinicDateToYMD(date.value);

      const [hours, minutes] = String(time.value)
        .split(":")
        .map(Number);

      const startMinutes = hours * 60 + (minutes || 0);
      const endMinutes = startMinutes + Number(duration.value || 15);

      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(
        2,
        "0"
      )}:${String(endMinutes % 60).padStart(2, "0")}`;

      const availability = getTimeRangeAvailability(
        bookingDate,
        time.value,
        endTime,
        {
          name: practitionerLabel.value || "This practitioner",
        }
      );

      if (!availability.available) {
        errors.time =
          availability.message ||
          getAvailabilityMessage(bookingDate, {
            name: practitionerLabel.value || "This practitioner",
          });

        mainStore?.setSnackbar?.({
          title: errors.time,
          type: "error",
        });

        return;
      }
    } catch (error) {
      console.warn("Could not validate availability:", error);
    }
  }

  isSaving.value = true;

  const selectedTreatment = treatmentOptions.value.find(
    (t) =>
      t.name.toLowerCase() === (exam.value || "").toLowerCase()
  );

  emit("save", {
    id: props.editAppointment?.id || null,
    patientId:
      selectedPatientId.value || props.preselectedPatientId || null,
    patient: "",
    date: clinicDateToYMD(date.value),
    time: time.value,
    duration: duration.value,
    exam: exam.value,
    treatmentId: selectedTreatment?.id || null,
    treatmentName:
      selectedTreatment?.name || exam.value || null,
    status: status.value,
    practitioner: practitioner.value,
    practitionerName: practitionerLabel.value || null,
    dentistId: practitioner.value,
    notes: notes.value,
  });

  emit("update:modelValue", false);
};

const onSaveToClipboard = () => {
  if (!validate()) return;

  const selectedTreatment = treatmentOptions.value.find(
    (t) => t.name === exam.value,
  );

  const selectedPatient = props.patientOptions.find(
    (p) => p.id === (selectedPatientId.value || props.preselectedPatientId),
  );

  const draftData = {
    patientId: selectedPatientId.value || props.preselectedPatientId || null,
    patient: selectedPatient?.name || props.preselectedPatient || "",
    date: clinicDateToYMD(date.value),
    time: time.value,
    duration: duration.value,
    exam: exam.value,
    treatmentId: selectedTreatment?.id || null,
    treatmentName: selectedTreatment?.name || null,
    status: "Draft",
    practitioner: practitioner.value,
    notes: notes.value,
  };

  emit("save-to-clipboard", draftData);
  emit("update:modelValue", false);
};
</script>

<style scoped>
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}
.req-star {
  color: #ef4444;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
}
.summary-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c7b8ff, #a78bfa);
  flex-shrink: 0;
}

:deep(.v-field) {
  border-radius: 8px !important;
}
</style>
