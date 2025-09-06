<template>
  <div class="pa-5 bg-white">
    <div class="rota-section">
      <!-- First block -->
      <div>
        <h3 class="rota-title">Create a Rota</h3>
        <p class="rota-subtitle">
          Create and manage staggered shift patterns to support your back to
          work plans and manage shift rotas for employees who regularly change
          their hours of work.
        </p>
      </div>

      <!-- ✅ Wrap everything in v-form -->
      <v-form ref="rotaForm" class="mt-4" @submit.prevent="submitForm">
        <!-- Select Practice -->
        <div class="mt-4">
          <h3 class="rota-title">Select Practice</h3>
          <p class="rota-subtitle">
            Choose the practice for which you would like to create a rota.
          </p>
        </div>

        <v-row cols="2" class="d-flex flex-wrap mt-5">
          <v-col
            v-for="(practice, index) in practices"
            :key="index"
            cols="12"
            sm="6"
            md="2"
          >
            <v-card
              class="practice-card"
              :class="{ selected: form.orgId === practice.value }"
              :elevation="0"
              :style="{
                border: '1px solid #3ADF8D',
                position: 'relative',
                cursor: 'pointer',
                height: '100%',
              }"
              @click="selectPractice(practice.value)"
            >
              <!-- Radio at top-right -->
              <v-radio
                :value="practice.value"
                :model-value="form.orgId"
                color="#3ADF8D"
                class="practice-radio"
              />

              <!-- Center content -->
              <div
                class="content-wrapper d-flex flex-column align-center justify-center"
              >
                <p class="practice-title">
                  {{ practice.label }}
                </p>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Validation error under practice selection -->
        <div
          v-if="practiceError"
          class="text-caption mt-1"
          style="color: #b00020"
        >
          {{ practiceError }}
        </div>

        <!-- Rota Options -->
        <div>
          <h3 class="rota-title my-4">What would you like to do?</h3>
          <v-row>
            <v-col cols="2" v-for="option in rotaOptions" :key="option.value">
              <v-card
                class="d-flex flex-column align-center justify-center pa-6 option-card"
                :class="{ 'selected-card': selectedOption === option.value }"
                @click="selectedOptionHandle(option.value)"
                :elevation="0"
              >
                <v-radio
                  :value="option.value"
                  v-model="selectedOption"
                  color="#3ADF8D"
                  class="option-radio"
                />

                <div
                  class="d-flex flex-column align-center justify-center text-center flex-1"
                >
                  <v-icon
                    size="40"
                    :color="
                      selectedOption === option.value ? '#FFFFFF' : '#1E1E1E'
                    "
                    class="mb-4"
                  >
                    {{ option.icon }}
                  </v-icon>
                  <p
                    class="option-title"
                    :class="{
                      'selected-text': selectedOption === option.value,
                    }"
                  >
                    {{ option.label }}
                  </p>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Create Rota block -->
        <div class="mt-2" v-if="isCreateRota">
          <v-row>
            <v-col cols="4">
              <!-- Title -->
              <h2 class="rota-title">Create a new rota</h2>

              <!-- Rota Name -->
              <label class="field-label">
                Rota name<span class="required">*</span>
              </label>
              <v-text-field
                v-model="form.name"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[rules.required]"
              />

              <!-- Rota Duration -->
              <label class="field-label">
                Rota duration<span class="required">*</span>
              </label>
              <v-text-field
                v-model="form.duration"
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :rules="[rules.required]"
              />

              <!-- Rota Start Date -->
              <label class="field-label">
                Rota start date<span class="required">*</span>
              </label>
              <v-menu
                v-model="menuStartDateCreaterota"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="
                      form.startDate ? parsedDate(form.startDate) : ''
                    "
                    readonly
                    variant="solo"
                    flat
                    density="compact"
                    class="input-bordered"
                    :rules="[rules.required]"
                    append-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker
                  v-model="form.startDate"
                  color="primary"
                  @update:model-value="menuStartDateCreaterota = false"
                />
              </v-menu>

              <!-- Rota End Date -->
              <label class="field-label">
                Rota End date<span class="required">*</span>
              </label>
              <v-menu
                v-model="menuEndDateCreaterota"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="form.endDate ? parsedDate(form.endDate) : ''"
                    readonly
                    variant="solo"
                    flat
                    density="compact"
                    class="input-bordered"
                    :rules="[rules.required]"
                    append-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker
                  v-model="form.endDate"
                  color="primary"
                  @update:model-value="menuEndDateCreaterota = false"
                />
              </v-menu>

              <!-- Employees -->
              <h2 class="rota-title mb-1">Add Employee</h2>
              <label class="field-label">
                Employee<span class="required">*</span>
              </label>
              <v-autocomplete
                v-model="form.employees"
                :items="employees"
                item-title="fullName"
                item-value="id"
                multiple
                chips
                closable-chips
                variant="solo"
                flat
                density="compact"
                class="input-bordered"
                :menu-props="{ eager: true }"
              />

              <!-- Submit -->
              <div class="mt-6 text-right">
                <v-btn color="primary" type="submit"> Create Rota </v-btn>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-form>
    </div>
  </div>
</template>

<script setup>
import { parsedDate } from "~/lib/dateFormatter";
const mainStore = useMainStore();
const rotaStore = useRotaStore();
const userStore = useUserStore();
const user = process.client
  ? JSON.parse(localStorage.getItem("user") || "{}")
  : {};

const isCreateRota = ref(false);
const form = ref({
  orgId: null,
  name: "",
  duration: "",
  startDate: "",
  endDate: "",
  notes: "",
  employees: [],
});
const practiceError = ref("");
const rotaForm = ref(null);
const menuStartDateCreaterota = ref(false);
const menuEndDateCreaterota = ref(false);
const rules = {
  required: (v) =>
    (Array.isArray(v) ? v.length > 0 : !!v) || "This field is required",
};
const employees = ref([]);
const practices = computed(
  () =>
    user?.userOrganisations?.map((uo) => ({
      label: uo.organisation.name,
      value: uo.organisation.id,
    })) || []
);
const selectedOption = ref(null);
const rotaOptions = [
  { value: "new", label: "Create a new rota", icon: "mdi-calendar-plus" },
  { value: "copy", label: "Copy an existing rota", icon: "mdi-content-copy" },
];
const selectedOptionHandle = (value) => {
  selectedOption.value = value;
  isCreateRota.value = value === "new";
};
const getUsers = (orgId) => {
  userStore.getUserList({ roleId: null, orgId }).then((res) => {
    if (res.code === 0) {
      employees.value = res.data;
    }
  });
};
const selectPractice = (value) => {
  form.value.orgId = value;
  practiceError.value = "";
  getUsers(form.value.orgId);
};
const submitForm = async () => {
  practiceError.value = "";
  if (!form.value.orgId) {
    practiceError.value = "Please select a practice";
    return;
  }
  const { valid } = await rotaForm.value.validate();
  if (!valid) return;
  try {
    const res = await rotaStore.addRota(form.value);
    if (res.code === 0) {
      handleAddRotaUser(res.data.id, form.value.employees);
    }
  } catch (err) {
    console.log(err);
  }
};

const handleAddRotaUser = async (rotaId, users) => {
  try {
   const rotaUsers = users.map((el) => {
    return { userId: el }
   })
    const res = await rotaStore.addRotaUsers({ rotaId, users: rotaUsers });
    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title: res?.message || "Rota added successfully",
      });
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res.message || "Something went wrong",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "An error occurred",
    });
  }
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
/* create rota screen */
.rota-title {
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-style: SemiBold;
  font-size: 14px;
  margin-bottom: 4px;
}

.rota-subtitle {
  font-family: Poppins, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #737373;
  margin: 0;
}
.practice-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 180px;
}

.practice-card.selected {
  background-color: #1e1e1e !important;
}

.practice-card.selected .practice-title {
  color: white !important;
}

.practice-radio {
  position: absolute;
  top: 8px;
  right: 8px;
}
::v-deep(.practice-radio .v-selection-control__input .v-icon) {
  color: #3adf8d !important;
}

.practice-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 200px; /* adjust as needed */
  display: flex; /* make card a flex container */
}

.content-wrapper {
  flex: 1; /* take full height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* centers vertically */
}

.option-card {
  border: 1px solid #3adf8d;
  border-radius: 12px;
  background-color: #f3f6fa;
  cursor: pointer;
  position: relative;
  min-height: 200px;
}

.selected-card {
  background-color: #1e1e1e !important;
}

.option-radio {
  position: absolute;
  top: 8px;
  right: 8px;
}

.option-title {
  font-family: Poppins, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 130%;
  text-align: center;
  color: #1e1e1e;
}

.selected-text {
  color: #ffffff;
}

/* radio border color */
::v-deep(.option-radio .v-selection-control__input .v-icon) {
  color: #3adf8d !important;
}
/* create rota form */
.field-label {
  display: block;
  margin-bottom: 4px;
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.required {
  color: red !important;
  margin-left: 2px;
}

/* calender view */

.filter-label {
  font-family: Poppins;
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
</style>
