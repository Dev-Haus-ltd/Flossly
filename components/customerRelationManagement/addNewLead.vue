<template>
  <v-navigation-drawer
    :model-value="props.modelValue"
    @update:model-value="handleDrawerClose"
    location="right"
    temporary
    :width="600"
  >
    <!-- Header -->
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text"> Add New Lead </v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        variant="outlined"
        color="#8B8B8B"
        @click="closeDrawer"
        class="mr-4"
        style="
          width: 20px;
          height: 20px;
          min-width: 20px;
          border-radius: 50%;
          padding: 0;
        "
      >
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Body -->
    <div
      class="pa-4"
      style="
        background-color: #f5f5f5;
        height: calc(100% - 64px - 64px);
        overflow-y: auto;
      "
    >
      <v-card class="pa-4" color="white" elevation="0">
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-row>
            <!-- Lead Status (12 cols) -->
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Lead Status</label>
              <v-select
                v-model="form.leadStatus"
                :items="leadStatuses"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                bg-color="white"
              />
            </v-col>

            <!-- Name -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Name <span class="req">*</span></label>
              <v-text-field
                v-model="form.name"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="requiredRule"
              />
            </v-col>

            <!-- Email -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Email <span class="req">*</span></label>
              <v-text-field
                v-model="form.email"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="emailRules"
                type="email"
              />
            </v-col>

            <!-- Telephone -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Telephone <span class="req">*</span></label>
              <v-text-field
                v-model="form.telephone"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                :rules="requiredRule"
              />
            </v-col>

            <!-- Inquiry Date -->
            <v-col cols="6">
              <label class="fld-lbl">Inquiry Date</label>
              <v-menu
                v-model="inquiryMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-model="formattedInquiryDate"
                    v-bind="props"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    readonly
                  >
                    <template #append-inner>
                      <v-icon
                        class="cursor-pointer"
                        @click.stop="inquiryMenu = true"
                        >mdi-calendar</v-icon
                      >
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="form.inquiryDate"
                  @update:modelValue="onInquiryDateSelected"
                />
              </v-menu>
            </v-col>

            <!-- Lead Source -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Lead Source</label>
              <v-select
                v-model="form.leadSource"
                :items="leadSources"
                item-title="name"
                item-value="id"
                return-object
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Preferred Contact Method -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Preferred Contact Method</label>
              <v-select
                v-model="form.contactMethod"
                :items="contactMethods"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Treatment -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Treatment</label>
              <v-select
                v-model="form.treatment"
                :items="treatmentSources"
                item-title="name"
                item-value="id"
                return-object
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Assign To -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Assign To</label>
              <v-select
                v-model="form.assigned"
                :items="activeStaffList"
                item-title="fullName"
                item-value="id"
                multiple
                return-object
                chips
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Follow Up Date -->
            <v-col cols="6">
              <label class="fld-lbl">Follow Up Date</label>
              <v-menu
                v-model="followUpMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-model="formattedFollowUpDate"
                    v-bind="props"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    readonly
                  >
                    <template #append-inner>
                      <v-icon
                        class="cursor-pointer"
                        @click.stop="followUpMenu = true"
                        >mdi-calendar</v-icon
                      >
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="form.followUpDate"
                  @update:modelValue="onFollowUpDateSelected"
                />
              </v-menu>
            </v-col>

            <!-- Date of Birth -->
            <v-col cols="6">
              <label class="fld-lbl">Date of Birth</label>
              <v-menu
                v-model="dobMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-model="formattedDob"
                    v-bind="props"
                    variant="solo"
                    density="compact"
                    class="mb-1 input-bordered"
                    flat
                    readonly
                    :error="dobError"
                    :error-messages="dobError ? 'Date of birth cannot be in the future' : ''"
                  >
                    <template #append-inner>
                      <v-icon
                        class="cursor-pointer"
                        @click.stop="dobMenu = true"
                        >mdi-calendar</v-icon
                      >
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="form.dob"
                  :max="maxDobDate"
                  @update:modelValue="onDobSelected"
                />
              </v-menu>
            </v-col>

            <!-- Occupation -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Occupation</label>
              <v-text-field
                v-model="form.occupation"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Location/Postcode -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Location / Postcode</label>
              <v-text-field
                v-model="form.location"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>

            <!-- Comments -->
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Comments</label>
              <v-textarea
                v-model="form.comments"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                auto-grow
                flat
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <!-- Footer -->
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
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
import { useCrmStore } from '@/stores/crm';
import { useMainStore } from '@/stores/index';

const crmStore = useCrmStore();
const props = defineProps({
  modelValue: Boolean,
  leadSources: Array,
  treatmentSources: Array,
  staffList: Array,
});

const emit = defineEmits(["close", "success", "update:modelValue"]);
const formRef = ref(null);
const saving = ref(false)

const requiredRule = [(v) => !!v || "This field is required"];
const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /^(?:[a-zA-Z0-9_'^&+\-]+(?:\.[a-zA-Z0-9_'^&+\-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(v) || "Enter a valid email",
];

const form = ref({
  name: "",
  email: "",
  telephone: "",
  inquiryDate: null,
  leadSource: null,
  leadStatus: null,
  contactMethod: null,
  treatment: null,
  assigned: [],
  followUpDate: null,
  dob: null,
  occupation: "",
  location: "",
  comments: "",
});

// Dropdown lists
const leadStatuses = ["New", "In Progress", "Converted", "Lost"];
const contactMethods = ["Email", "Phone", "SMS", "In-Person"];

// Date menus
const inquiryMenu = ref(false);
const followUpMenu = ref(false);
const dobMenu = ref(false);
const dobError = ref(false);

// Maximum date for date of birth (today)
const maxDobDate = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// formatted date helpers
const formattedInquiryDate = computed(() =>
  form.value.inquiryDate
    ? formatDateDDMMYYYY(form.value.inquiryDate)
    : ""
);
const formattedFollowUpDate = computed(() =>
  form.value.followUpDate
    ? formatDateDDMMYYYY(form.value.followUpDate)
    : ""
);
const formattedDob = computed(() =>
  form.value.dob ? formatDateDDMMYYYY(form.value.dob) : ""
);

const onInquiryDateSelected = (val) => {
  form.value.inquiryDate = val;
  inquiryMenu.value = false;
};
const onFollowUpDateSelected = (val) => {
  form.value.followUpDate = val;
  followUpMenu.value = false;
};
const onDobSelected = (val) => {
  if (val) {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      dobError.value = true;
      form.value.dob = null;
      mainStore.setSnackbar({
        title: "Date of birth cannot be in the future",
        type: "error",
      });
    } else {
      dobError.value = false;
      form.value.dob = val;
    }
  } else {
    dobError.value = false;
    form.value.dob = null;
  }
  dobMenu.value = false;
};

const mainStore = useMainStore();
const activeStaffList = computed(() => {
  return (props.staffList || []).filter((user) => {
    const status = String(user?.orgStatus || user?.status || "").toLowerCase();
    return status === "active";
  });
});

// Reset form to initial state
const resetForm = () => {
  form.value = {
    name: "",
    email: "",
    telephone: "",
    inquiryDate: null,
    leadSource: null,
    leadStatus: null,
    contactMethod: null,
    treatment: null,
    assigned: [],
    followUpDate: null,
    dob: null,
    occupation: "",
    location: "",
    comments: "",
  };
  // Reset form validation state
  if (formRef.value) {
    formRef.value.resetValidation();
  }
  // Reset date of birth error
  dobError.value = false;
  // Close date picker menus
  inquiryMenu.value = false;
  followUpMenu.value = false;
  dobMenu.value = false;
};

// Handle drawer close - emit close event and reset form
const closeDrawer = () => {
  emit("close");
  emit("update:modelValue", false);
  resetForm();
};

// Handle model value change (when drawer is closed externally)
const handleDrawerClose = (newValue) => {
  if (!newValue) {
    resetForm();
  }
  emit("update:modelValue", newValue);
};

// Watch for modelValue changes to reset form when drawer closes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

const onSubmit = async () => {
  // Validate date of birth before form submission
  if (form.value.dob) {
    const selectedDate = new Date(form.value.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      dobError.value = true;
      mainStore.setSnackbar({
        title: "Date of birth cannot be in the future",
        type: "error",
      });
      return;
    }
  }
  
  const validation = await formRef.value.validate();
  if (!validation.valid || dobError.value) return;
  try {
    saving.value = true
    const payload = { ...form.value };
    const res = await crmStore.createLead(payload);
    if (res.code === 0) {
      mainStore.setSnackbar({ title: "Lead created", type: "success" });
      emit("success", res.data);
      closeDrawer(); // Close and reset after successful save
    } else {
      mainStore.setSnackbar({ title: res.message || "Failed to create lead", type: "error" });
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e.message || "Failed to create lead", type: "error" });
  } finally { saving.value = false }
};
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
</style>

