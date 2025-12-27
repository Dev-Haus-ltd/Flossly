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

        <v-row cols="2" class="d-flex flex-wrap mt-1">
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
              }"
              @click="selectPractice(practice.value)"
            >
              <!-- Radio at top-right -->
              <v-radio
                :value="practice.value"
                :model-value="form.orgId"
                color="#3ADF8D"
                class="practice-radio"
                true-icon="mdi-check-circle"
              />

              <!-- Center content -->
              <div
                class="content-wrapper d-flex flex-column align-center justify-center"
              >
                <CommonAvatar 
                  :user="{ name: practice.label, logo: practice.logo }"
                  size="40"
                  class="mb-2"
                />
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
                  class="option-radio"
                  true-icon="mdi-check-circle"
                />

                <div
                  class="d-flex flex-column align-center justify-center text-center flex-1"
                >
                  <v-icon
                    size="30"
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
                      form.startDate ? formatDateDDMMYYYY(form.startDate) : ''
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
                    :model-value="form.endDate ? formatDateDDMMYYYY(form.endDate) : ''"
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
                :disabled="form.endDate"
                :rules="[rules.required]"
              />

              <!-- Employees -->
              <h2 class="rota-title mb-1">Add Employee</h2>
              <label class="field-label">
                Employee<span class="required">*</span>
              </label>
              <TeamFlossRotaManagementEmployeeSelect
                v-model="form.employees"
                :employees="employees"
                :rules="[rules.required]"
              />

              <!-- Submit -->
              <div class="mt-6 text-right">
                <v-btn color="primary" variant="flat" type="submit">
                  Create Rota
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </div>

       
       <div class="mt-2" v-if="selectedOption === 'copy'">
         <v-row>
           <v-col cols="4">
             <h2 class="rota-title">Copy an existing rota</h2>

             
             <label class="field-label">Select a rota to copy<span class="required">*</span></label>
             <v-select
               v-model="copyForm.selectedRotaId"
               :items="existingRotas.map(r => ({ title: r.name + ' (' + formatDateDDMMYYYY(r.startDate) + ' - ' + formatDateDDMMYYYY(r.endDate) + ')', value: r.id }))"
               variant="solo"
               flat
               density="compact"
               class="input-bordered"
               :rules="[rules.required]"
               placeholder="Choose a rota"
             />

            
             <label class="field-label">Copy the notes for this rota?</label>
             <v-radio-group v-model="copyForm.copyNotes" inline>
               <v-radio :value="true" label="Yes" />
               <v-radio :value="false" label="No" />
             </v-radio-group>

           
             <label class="field-label">Rota name<span class="required">*</span></label>
             <v-text-field
               v-model="form.name"
               variant="solo"
               flat
               density="compact"
               class="input-bordered"
               :rules="[rules.required]"
             />

             
             <label class="field-label">Rota start date<span class="required">*</span></label>
             <v-menu v-model="menuStartDateCreaterota" :close-on-content-click="false" transition="scale-transition" offset-y>
               <template #activator="{ props }">
                 <v-text-field
                   v-bind="props"
                   :model-value="form.startDate ? formatDateDDMMYYYY(form.startDate) : ''"
                   readonly
                   variant="solo"
                   flat
                   density="compact"
                   class="input-bordered"
                   :rules="[rules.required]"
                   append-inner-icon="mdi-calendar"
                 />
               </template>
               <v-date-picker v-model="form.startDate" color="primary" @update:model-value="menuStartDateCreaterota = false" />
             </v-menu>

           
             <label class="field-label">Rota End date<span class="required">*</span></label>
             <v-menu v-model="menuEndDateCreaterota" :close-on-content-click="false" transition="scale-transition" offset-y>
               <template #activator="{ props }">
                 <v-text-field
                   v-bind="props"
                   :model-value="form.endDate ? formatDateDDMMYYYY(form.endDate) : ''"
                   readonly
                   variant="solo"
                   flat
                   density="compact"
                   class="input-bordered"
                   :rules="[rules.required]"
                   append-inner-icon="mdi-calendar"
                 />
               </template>
               <v-date-picker v-model="form.endDate" color="primary" @update:model-value="menuEndDateCreaterota = false" />
             </v-menu>

             
             <label class="field-label">Rota duration<span class="required">*</span></label>
             <v-text-field
               v-model="form.duration"
               variant="solo"
               flat
               density="compact"
               class="input-bordered"
               :disabled="form.endDate"
               :rules="[rules.required]"
             />

             
             <div class="mt-6 text-right">
               <v-btn color="primary" variant="flat" @click="submitCopyForm">
                 Create Rota
               </v-btn>
             </div>
           </v-col>
         </v-row>
       </div>
      </v-form>
    </div>
  </div>
</template>

<script setup>
import { formatDateDDMMYYYY } from "~/lib/dateFormatter";
import { differenceInDays, differenceInCalendarDays, addDays } from "date-fns";
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
  duration: null,
  startDate: null,
  endDate: null,
  notes: "",
  employees: [],
});
const emit= defineEmits(['onAddRota'])
const practiceError = ref("");
const rotaForm = ref(null);
const menuStartDateCreaterota = ref(false);
const menuEndDateCreaterota = ref(false);
const copyForm = ref({ selectedRotaId: null, copyNotes: true });
const rules = { 
  required: (v) =>
    (Array.isArray(v) ? v.length > 0 : !!v) || "This field is required",
};
const employees = ref([]);

// Helper function to get organization data consistently (same as sidebar)
const getOrgData = (orgWrapper) => {
  // Check if org has nested organisation object
  if (orgWrapper?.organisation?.id && orgWrapper?.organisation?.name) {
    return orgWrapper.organisation;
  }
  
  // Check if org is the organisation object itself
  if (orgWrapper?.id && orgWrapper?.name) {
    return orgWrapper;
  }
  
  return null;
};

const practices = computed(
  () =>
    user?.userOrganisations
      ?.filter((uo) => uo.status === 'Active') // Only show active organizations
      ?.map((uo) => {
      const orgData = getOrgData(uo);
      const logo = orgData?.logo;
      // Only set logo if it's a valid non-empty string
      const validLogo = logo && typeof logo === 'string' && logo.trim() !== '' ? logo : null;
      return {
        label: orgData?.name || '',
        value: orgData?.id || null,
        logo: validLogo,
      };
    }).filter(p => p.value) || []
);
const selectedOption = ref(null);
const existingRotas = ref([]);
const allRotaOptions = [
  { value: "new", label: "Create a new rota", icon: "mdi-calendar-plus" },
  { value: "copy", label: "Copy an existing rota", icon: "mdi-content-copy" },
];
const rotaOptions = computed(() => {
  
  if (existingRotas.value.length === 0) {
    return allRotaOptions.filter(opt => opt.value !== "copy");
  }
  return allRotaOptions;
});

watch(
  () => [form.value.startDate, form.value.endDate],
  ([start, end]) => {
    if (start && end) {
      const days = differenceInDays(new Date(end), new Date(start)) + 1;
      form.value.duration = days > 0 ? days.toString() : "";
    }
  }
);

watch(
  () => [form.value.startDate, form.value.duration],
  ([start, duration]) => {
    if (start && duration) {
      const end = addDays(new Date(start), parseInt(duration) - 1);
      form.value.endDate = end;
    }
  }
);

watch(
  () => existingRotas.value.length,
  (count) => {
    // Reset selection if "copy" is selected but no rotas exist
    if (count === 0 && selectedOption.value === "copy") {
      selectedOption.value = null;
      isCreateRota.value = false;
    }
  }
);
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
  checkExistingRotas();
};

const checkExistingRotas = async () => {
  try {
    const res = await rotaStore.getRotas();
    if (res?.code === 0) {
      existingRotas.value = res.data || [];
    } else {
      existingRotas.value = [];
    }
  } catch (err) {
    existingRotas.value = [];
  }
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
      handleAddRotaUser(res.data, form.value.employees);
    } else{
      mainStore.setSnackbar({
        type: "error",
        title: res.message || res?.data?.message || "Something went wrong",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "An error occurred",
    });
  }
};

const handleAddRotaUser = async (rota, users) => {
  try {
    const rotaUsers = users.map((el) => {
      return { userId: el };
    });
    const res = await rotaStore.addRotaUsers({ rotaId: rota.id, users: rotaUsers });
    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title: "Rota added successfully",
      });
      resetForm();
      // Refresh rotas list so "copy" option becomes available
      await checkExistingRotas();
      emit('onAddRota', rota)
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res?.data?.message || res.message || "Something went wrong",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err?.data?.message || err.message || "Something went wrong",
    });
  }
};

async function submitCopyForm() {
  practiceError.value = "";
  if (!form.value.orgId) {
    practiceError.value = "Please select a practice";
    return;
  }

  if (!copyForm.value.selectedRotaId) {
    mainStore.setSnackbar({ type: 'error', title: 'Please select a rota to copy' });
    return;
  }
  if (!form.value.name || !form.value.startDate || !form.value.endDate) {
    mainStore.setSnackbar({ type: 'error', title: 'Please complete the required fields' });
    return;
  }
  try {
  
    const res = await rotaStore.addRota({
      orgId: form.value.orgId,
      name: form.value.name,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      duration: form.value.duration,
      notes: copyForm.value.copyNotes ? undefined : "",
    });
    if (res.code !== 0) {
      mainStore.setSnackbar({ type: 'error', title: res?.data?.message || res.message || 'Failed to create rota' });
      return;
    }

    const newRota = res.data;

   
    const selected = existingRotas.value.find(r => r.id === copyForm.value.selectedRotaId);

    try {
      const usersRes = await rotaStore.getRotaUsers({ rotaId: selected.id });
      if (usersRes.code === 0) {
        const rotaUsers = (usersRes.data || []).map(u => ({ userId: u.userId ?? u.user?.id, roleId: u.roleId }));
        // Filter undefined ids
        const cleanUsers = rotaUsers.filter(u => !!u.userId);
        if (cleanUsers.length > 0) {
          await rotaStore.addRotaUsers({ rotaId: newRota.id, users: cleanUsers });
        }
      }
    } catch (_) {}


    try {
      const shiftsRes = await rotaStore.getAllShifts({ rotaId: selected.id });
      if (shiftsRes.code === 0) {
        const shifts = shiftsRes.data || [];
        for (const s of shifts) {
          const offsetDays = differenceInCalendarDays(new Date(form.value.startDate), new Date(selected.startDate));
          const shiftedStart = addDays(new Date(s.startDate), offsetDays);
          const shiftedEnd = addDays(new Date(s.endDate), offsetDays);
          await rotaStore.addRotaShift({
            rotaId: newRota.id,
            label: s.label,
            color: copyForm.value.copyNotes ? s.color : null,
            startDate: shiftedStart,
            endDate: shiftedEnd,
            breakTime: s.breakTime,
            notes: copyForm.value.copyNotes ? s.notes : undefined,
            userId: s.userId,
            dentistId: s.dentistId,
            nurseId: s.nurseId,
            surgeryId: s.surgeryId,
            isLocumShift: s.isLocumShift,
            locumUserId: s.locumUserId,
          });
        }
      }
    } catch (_) {}

    mainStore.setSnackbar({ type: 'success', title: 'Rota copied successfully' });
    resetForm();
    await checkExistingRotas();
    emit('onAddRota', newRota);
  } catch (err) {
    mainStore.setSnackbar({ type: 'error', title: err?.data?.message || err.message || 'Something went wrong' });
  }
}

function resetForm() {
  form.value = {
    orgId: null,
    name: "",
    duration: "",
    startDate: "",
    endDate: "",
    notes: "",
    employees: [],
  };
  isCreateRota.value = false;
  selectedOption.value = null;
  existingRotas.value = [];
}

// Auto-select practice on mount
onMounted(() => {
  checkExistingRotas();
  
  // Auto-select practice based on rules
  const practiceList = practices.value;
  
  if (practiceList.length === 0) {
    return; // No practices available
  }
  
  // If only one practice, select it automatically
  if (practiceList.length === 1) {
    const practiceId = practiceList[0].value;
    if (practiceId) {
      selectPractice(practiceId);
    }
    return;
  }
  
  // If multiple practices, select the current one (from sidebar)
  if (user?.currentLoggedInOrgId) {
    const currentOrgId = user.currentLoggedInOrgId;
    
    // Try to find practice matching currentLoggedInOrgId (only active organizations)
    // First try by organisationId
    const orgWrapper = user.userOrganisations?.find(
      (org) => org.organisationId === currentOrgId && org.status === 'Active'
    );
    
    if (orgWrapper) {
      const orgData = getOrgData(orgWrapper);
      if (orgData?.id) {
        const practiceId = orgData.id;
        selectPractice(practiceId);
        return;
      }
    }
    
    // If not found, try by id
    const matchingPractice = practiceList.find(
      (p) => Number(p.value) === Number(currentOrgId)
    );
    
    if (matchingPractice) {
      selectPractice(matchingPractice.value);
      return;
    }
  }
  
  // Fallback: select first practice if no current org found
  if (practiceList.length > 0 && practiceList[0].value) {
    selectPractice(practiceList[0].value);
  }
});
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
/* create rota screen */
.rota-title {
  
  font-weight: 600;
  font-style: SemiBold;
  font-size: 14px;
  margin-bottom: 4px;
}

.rota-subtitle {
  
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #737373;
  margin: 0;
}
.practice-card {
  border-radius: 20px;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 124px; /* adjust as needed */
  display: flex; /* make card a flex container */
}

.practice-card.selected {
  background-color: #213536;
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

.content-wrapper {
  flex: 1; /* take full height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* centers vertically */
}

.option-card {
  border: 1px solid #3adf8d;
  border-radius: 20px;
  background-color: linear-gradient(to bottom, #f3f6fa, #ffffff);
  cursor: pointer;
  position: relative;
  min-height: 124px;
}

.selected-card {
  background-color: #213536;
}

.option-radio {
  position: absolute;
  top: 8px;
  right: 8px;
}

.option-title {
  
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
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.chip-content {
  
  font-weight: 500;
  font-style: Medium;
  font-size: 14px;
}
:deep(.v-chip .v-chip__close .mdi-close:before) {
  color: #000 !important;
  font-size: 18px; /* make it bigger */
  font-weight: 600; /* adds visual boldness */
}
</style>
