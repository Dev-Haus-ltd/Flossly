<template>
  <v-dialog v-model="isOpen" max-width="800px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-family: Poppins;
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Add or Create a Shift
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Scrollable content -->
      <v-card-text style="max-height: 60vh; overflow-y: auto">
        <v-form ref="formRef" v-model="isValid">
          <!-- Add shift from library -->
          <h3
            style="
              font-family: Poppins;
              font-weight: 600;
              font-size: 14px;
              color: #1e1e1e;
            "
          >
            Add a shift from the current library
          </h3>

          <v-row class="mt-4" no-gutters>
            <v-col cols="3">
              <label class="field-label">Select Shift</label>
            </v-col>
            <v-col cols="9">
              <v-select
                v-model="form.shiftLibrary"
                :items="shiftLibrary.map((s) => s.name)"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                @update:modelValue="prefillForm"
              />
            </v-col>
          </v-row>

          <!-- Create new shift -->
          <h3
            class="mb-5"
            style="
              font-family: Poppins;
              font-weight: 600;
              font-size: 14px;
              color: #1e1e1e;
            "
          >
            Create a new shift
          </h3>

          <v-row no-gutters>
            <!-- Shift Name -->
            <v-col cols="3"
              ><label class="field-label">Shift Name</label></v-col
            >
            <v-col cols="9">
              <v-text-field
                v-model="form.shiftName"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <v-col cols="3"
              ><label class="field-label">Select Surgery</label></v-col
            >
            <v-col cols="9">
              <v-select
                v-model="form.surgery"
                :items="surgeryOptions"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <v-col cols="3"
              ><label class="field-label">Select Dentist</label></v-col
            >
            <v-col cols="9">
              <v-select
                v-model="form.dentist"
                :items="dentistOptions"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <v-col cols="3"
              ><label class="field-label">Select Nurse</label></v-col
            >
            <v-col cols="9">
              <v-select
                v-model="form.nurse"
                :items="nurseOptions"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <!-- Start Shift -->
            <v-col cols="3"
              ><label class="field-label">Start Shift</label></v-col
            >
            <v-col cols="9">
              <v-menu v-model="startMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-model="form.startTime"
                    readonly
                    v-bind="props"
                    variant="solo"
                    flat
                    density="compact"
                    class="input-bordered"
                    :rules="[requiredRule]"
                    append-inner-icon="mdi-clock-outline"
                  />
                </template>
                <v-time-picker
                  v-model="form.startTime"
                  @update:modelValue="startMenu = false"
                />
              </v-menu>
            </v-col>

            <!-- End Shift -->
            <v-col cols="3"><label class="field-label">End Shift</label></v-col>
            <v-col cols="9">
              <v-menu v-model="endMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-model="form.endTime"
                    readonly
                    v-bind="props"
                    variant="solo"
                    flat
                    density="compact"
                    class="input-bordered"
                    :rules="[requiredRule]"
                    append-inner-icon="mdi-clock-outline"
                  />
                </template>
                <v-time-picker
                  v-model="form.endTime"
                  @update:modelValue="endMenu = false"
                />
              </v-menu>
            </v-col>

            <!-- Break -->
            <v-col cols="3">
              <label class="field-label">Break</label>
            </v-col>

            <v-col cols="9">
              <div
                class="d-flex"
                style="justify-content: space-between; gap: 4%"
              >
                <!-- Hours -->
                <v-text-field
                  v-model="form.breakHrs"
                  variant="solo"
                  flat
                  density="compact"
                  class="input-bordered"
                  :rules="[requiredRule]"
                  style="flex: 0 0 48%"
                >
                  <template #append-inner>
                    <span style="font-size: 13px; color: #737373">hrs</span>
                  </template>
                </v-text-field>

                <!-- Minutes -->
                <v-text-field
                  v-model="form.breakMins"
                  variant="solo"
                  flat
                  density="compact"
                  class="input-bordered"
                  :rules="[requiredRule]"
                  style="flex: 0 0 48%"
                >
                  <template #append-inner>
                    <span style="font-size: 13px; color: #737373">mins</span>
                  </template>
                </v-text-field>
              </div>
            </v-col>

            <!-- Notes -->
            <v-col cols="3"><label class="field-label">Add Notes</label></v-col>
            <v-col cols="9">
              <v-textarea
                v-model="form.notes"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                rows="3"
                :rules="[requiredRule]"
              />
            </v-col>

            <!-- Colors -->
            <v-col cols="3"
              ><label class="field-label">Add Shift Colour</label></v-col
            >
            <v-col cols="9">
  <div class="mb-5">
    <div class="d-flex flex-wrap gap-2 mt-2">
      <div
        v-for="color in colors"
        :key="color"
        :style="{
          backgroundColor: color,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border:
            form.shiftColor === color
              ? '2px solid black'
              : '1px solid #ccc',
          cursor: 'pointer',
          marginRight: '10px',
        }"
        @click="form.shiftColor = color"
      ></div>
    </div>

    <!-- Error message -->
    <small v-if="!form.shiftColor && showErrors" class="error-text">
      Shift color is required
    </small>
  </div>
</v-col>

            <!-- Label -->
            <v-col cols="3"
              ><label class="field-label">Add Shift Label</label></v-col
            >
            <v-col cols="9">
              <v-text-field
                v-model="form.shiftLabel"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Fixed footer -->
      <v-card-actions class="justify-end" style="border-top: 1px solid #dbdbdb">
        <v-btn
          text
          @click="resetForm"
          style="font-weight: 500; text-transform: none"
        >
          Reset Form
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          width="100"
          @click="submitForm"
          style="font-weight: 500; text-transform: none"
        >
          Add Shift
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(["update:modelValue", "onSubmit"]);

const isOpen = ref(props.modelValue);
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => (isOpen.value = false);

const form = ref({
  shiftLibrary: null,
  shiftName: "",
  surgery: null,
  dentist: null,
  nurse: null,
  startTime: "",
  endTime: "",
  breakHrs: "",
  breakMins: "",
  notes: "",
  shiftColor: "",
  shiftLabel: "",
});

// Example shift templates
const shiftLibrary = [
  {
    name: "Morning Shift",
    shiftName: "Morning Shift",
    surgery: "Surgery A",
    dentist: "Dentist X",
    nurse: "Nurse A",
    startTime: "08:00",
    endTime: "12:00",
    breakHrs: "0",
    breakMins: "30",
    notes: "Regular morning duty",
    shiftColor: "#B9308A",
    shiftLabel: "Morning",
  },
  {
    name: "Evening Shift",
    shiftName: "Evening Shift",
    surgery: "Surgery B",
    dentist: "Dentist Y",
    nurse: "Nurse B",
    startTime: "14:00",
    endTime: "20:00",
    breakHrs: "1",
    breakMins: "0",
    notes: "Evening coverage",
    shiftColor: "#1B3D9F",
    shiftLabel: "Evening",
  },
];

const surgeryOptions = ["Surgery A", "Surgery B"];
const dentistOptions = ["Dentist X", "Dentist Y"];
const nurseOptions = ["Nurse A", "Nurse B"];

const colors = [
  "#B9308A",
  "#892E88",
  "#5D2684",
  "#1B3D9F",
  "#0165B9",
  "#02AFAE",
  "#00A856",
  "#56C222",
  "#FECC16",
  "#FF7C00",
  "#FF2531",
];

// Time pickers
const startMenu = ref(false);
const endMenu = ref(false);

// Validation
const formRef = ref();
const isValid = ref(false);
const requiredRule = (v) => !!v || "Field is required";

const prefillForm = (selectedName) => {
  const template = shiftLibrary.find((s) => s.name === selectedName);
  if (template) {
    form.value = { ...template, shiftLibrary: selectedName };
  }
};

const resetForm = () => {
  form.value = {
    shiftLibrary: null,
    shiftName: "",
    surgery: null,
    dentist: null,
    nurse: null,
    startTime: "",
    endTime: "",
    breakHrs: "",
    breakMins: "",
    notes: "",
    shiftColor: "",
    shiftLabel: "",
  };
};

const showErrors = ref(false);

const submitForm = async () => {
  const { valid } = await formRef.value.validate();

  // force error messages for color
  showErrors.value = true;

  if (!valid || !form.value.shiftColor) return; // ⛔ don’t close if invalid

  emit("onSubmit", form.value);
  close();
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
.field-label {
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
.error-text {
  color: #b00020;
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  margin-top: 4px;
  display: block;
}

</style>
