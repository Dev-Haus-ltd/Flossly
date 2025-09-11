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
          padding-left: 24px;
        "
      >
        {{ currentShift.id ? "Update shift" : "Add or Create a Shift" }}
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
                :items="props.shifts"
                variant="solo"
                item-title="label"
                placeholder="select"
                item-value="id"
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
                v-model="form.label"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <v-col
              v-if="selectedUserRole === 5 || selectedUserRole === 6"
              cols="3"
              ><label class="field-label">Select Surgery</label></v-col
            >
            <v-col
              v-if="selectedUserRole === 5 || selectedUserRole === 6"
              cols="9"
            >
              <v-select
                v-model="form.surgeryId"
                :items="surgries"
                item-title="name"
                item-value="id"
                variant="solo"
                placeholder="Select"
                flat
                density="compact"
                class="input-bordered"
              />
            </v-col>

            <v-col v-if="selectedUserRole === 6" cols="3"
              ><label class="field-label">Select Dentist</label></v-col
            >
            <v-col v-if="selectedUserRole === 6" cols="9">
              <v-select
                v-model="form.dentistId"
                :items="dentistOptions"
                item-title="fullName"
                item-value="id"
                variant="solo"
                placeholder="Select"
                flat
                density="compact"
                class="input-bordered"
              />
            </v-col>

            <v-col v-if="selectedUserRole === 5" cols="3"
              ><label class="field-label">Select Nurse</label></v-col
            >
            <v-col v-if="selectedUserRole === 5" cols="9">
              <v-select
                v-model="form.nurseId"
                :items="nurseOptions"
                item-title="fullName"
                item-value="id"
                variant="solo"
                placeholder="Select"
                flat
                density="compact"
                class="input-bordered"
              />
            </v-col>

            <!-- Start Shift -->
            <v-col cols="3"
              ><label class="field-label">Start Shift</label></v-col
            >
            <v-col cols="9">
              <v-select
                v-model="form.startDate"
                :items="timeOptions"
                variant="solo"
                flat
                placeholder="Select"
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>

            <!-- End Shift -->
            <v-col cols="3"><label class="field-label">End Shift</label></v-col>
            <v-col cols="9">
              <v-select
                v-model="form.endDate"
                :items="endTimeOptions"
                variant="solo"
                flat
                placeholder="Select"
                :disabled="!form.startDate"
                density="compact"
                class="input-bordered"
                :rules="[requiredRule]"
              />
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
                  v-model="breakHrs"
                  variant="solo"
                  flat
                  density="compact"
                  class="input-bordered"
                  style="flex: 0 0 48%"
                >
                  <template #append-inner>
                    <span style="font-size: 13px; color: #737373">hrs</span>
                  </template>
                </v-text-field>

                <!-- Minutes -->
                <v-text-field
                  v-model="breakMins"
                  variant="solo"
                  flat
                  density="compact"
                  class="input-bordered"
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
                        form.color === color
                          ? '2px solid black'
                          : '1px solid #ccc',
                      cursor: 'pointer',
                      marginRight: '10px',
                    }"
                    @click="form.color = color"
                  ></div>
                </div>
              </div>
            </v-col>

            <!-- Label -->
            <v-col cols="3"
              ><label class="field-label">Add Shift Label</label></v-col
            >
            <v-col cols="9">
              <v-text-field
                v-model="form.label"
                variant="solo"
                flat
                density="compact"
                placeholder="Max. 20 chrs"
                class="input-bordered"
                :rules="[requiredRule]"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Fixed footer -->
      <v-card-actions
        class="justify-end px-5"
        style="border-top: 1px solid #dbdbdb"
      >
        <v-btn
          text
          @click="resetForm"
          style="font-weight: 500; text-transform: none"
          flat
        >
          Reset Form
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          width="100"
          @click="submitForm"
          style="font-weight: 500; text-transform: none"
          flat
        >
          {{ currentShift.id ? "Update" : "Add" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { format } from "date-fns";
import { getRandomHexColor } from "~/lib/misc";

const props = defineProps({
  modelValue: Boolean,
  rota: Object,
  users: Array,
  shifts: Array,
  shiftData: Object,
  currentShift: Object,
});

const emit = defineEmits(["update:modelValue", "onUpdate", "updateShifts"]);
const rotaStore = useRotaStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const isOpen = ref(props.modelValue);
const breakHrs = ref("");
const breakMins = ref("");
const selectedUserRole = ref(null);
watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
    getSurgeries();
    handleShiftData();
  }
);
watch(isOpen, (val) => emit("update:modelValue", val));
const form = ref({
  rotaId: props?.rota?.id,
  shiftLibrary: null,
  label: "",
  surgeryId: null,
  dentistId: null,
  nurseId: null,
  startDate: null,
  endDate: null,
  breakTime: 0,
  notes: "",
  color: "",
  label: "",
  userId: null,
});

const surgries = ref([]);
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
const formRef = ref();
const isValid = ref(false);
const requiredRule = (v) => !!v || "Field is required";

const dentistOptions = computed(() => {
  const dentist =
    props?.users?.filter((x) => !x.isTempUser && x.user.roleId === 5) || [];
  const dentistUsers = dentist.map((el) => el.user);
  return dentistUsers;
});
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const isEndTimeValid = (end) => {
  if (!form.value.startDate) return false;
  let diff = toMinutes(end) - toMinutes(form.value.startDate);
  if (diff < 0) diff += 24 * 60;
  return diff >= 240; // 4 hours = 240 mins
};

const endTimeOptions = computed(() => {
  if (!form.value.startDate) return timeOptions;
  return timeOptions.map((t) => ({
    title: t,
    value: t,
    props: { disabled: !isEndTimeValid(t) },
  }));
});
const nurseOptions = computed(() => {
  const nurses =
    props?.users?.filter((x) => !x.isTempUser && x.user.roleId === 6) || [];
  const nurseUsers = nurses.map((el) => el.user);
  return nurseUsers;
});

const handleShiftData = () => {
  const data = props.shiftData;
  // const currentShift= props.shifts.find(s=> s.userId===data.user.id && format(s.startDate, "yyyy-MM-dd") === format(data.day, "yyyy-MM-dd"))
  form.value.userId = data.user.id;
  selectedUserRole.value = data.user.role.id;
};
const close = () => {
  isOpen.value = false;
  resetForm();
};
const prefillForm = (id) => {
  const template = props.shifts.find((s) => s.id === id);

  if (template) {
    form.value = { ...template, shiftLibrary: id };
  }
};
const getSurgeries = () => {
  orgStore
    .getSurgeries({ organisationId: props?.rota.organisationId })
    .then((res) => {
      if (res.code === 0) {
        surgries.value = res.data;
      }
    });
};
const resetForm = () => {
  form.value = {
    rotaId: props?.rota?.id,
    shiftLibrary: null,
    label: "",
    surgeryId: null,
    dentistId: null,
    nurseId: null,
    startDate: null,
    endDate: null,
    breakTime: 0,
    notes: "",
    color: "",
    label: "",
    userId: null,
  };
  breakHrs.value = "";
  breakMins.value = "";
};
const buildDateTime = (date, timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  try {
    const breakTime =
      (Number(breakHrs.value) || 0) * 60 + (Number(breakMins.value) || 0);
    const startDateObj = buildDateTime(
      props.shiftData.day,
      form.value.startDate
    );
    let endDateObj = buildDateTime(props.shiftData.day, form.value.endDate);
    if (endDateObj <= startDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }
    form.value.startDate = startDateObj;
    form.value.endDate = endDateObj;
    const color = form.value.color ? form.value.color : getRandomHexColor();
    const payload = {
      ...form.value,
      breakTime,
      color,
    };
    let res;
    if (props.currentShift?.id) {
      // update existing shift
      res = await rotaStore.updateShift(payload);
    } else {
      // add new shift
      res = await rotaStore.addRotaShift(payload);
    }
    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title:
          res?.message ||
          (props.currentShift?.id
            ? "Shift updated successfully"
            : "Shift added successfully"),
      });
      emit("updateShifts", props?.rota);
      close();
    } else {
      mainStore.setSnackbar({
        type: "error",
        title:
          res?.message ||
          (props.currentShift?.id
            ? "Failed to update shift"
            : "Failed to add shift"),
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: props.currentShift?.id
        ? "Something went wrong while updating shift"
        : "Something went wrong while adding shift",
    });
  }
};
const safeFormat = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? val : format(d, "HH:mm"); // if it's not a valid date, keep it as-is
};
watch(
  () => props.currentShift,
  (newShift) => {
    if (newShift?.id) {
      const breakTime = newShift.breakTime || 0;

      form.value = {
        ...newShift,
        rotaId: props?.rota?.id,
        startDate: safeFormat(newShift.startDate),
        endDate: safeFormat(newShift.endDate),
      };

      breakHrs.value = Math.floor(breakTime / 60);
      breakMins.value = breakTime % 60;
    }
  },
  { immediate: true, deep: true } // also run the first time when component mounts
);
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
