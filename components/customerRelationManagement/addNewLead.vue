<template>
  <v-navigation-drawer
    :model-value="modelValue"
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
        @click="emit('close')"
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
                :rules="requiredRule"
              />
            </v-col>

            <!-- Name -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Name</label>
              <v-text-field
                v-model="form.name"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                required
              />
            </v-col>

            <!-- Email -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Email</label>
              <v-text-field
                v-model="form.email"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                required
              />
            </v-col>

            <!-- Telephone -->
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Telephone</label>
              <v-text-field
                v-model="form.telephone"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                flat
                required
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
                :items="staffList"
                item-title="name"
                item-value="id"
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
        @click="emit('close')"
        flat
      >
        Back
      </v-btn>

      <v-btn
        color="primary"
        class="text-white"
        style="width: 48%; border-radius: 8px"
        @click="onSubmit()"
        flat
      >
        Save
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
const { modelValue, leadSources, treatmentSources, staffList } = defineProps({
  modelValue: Boolean,
  leadSources: Array,
  treatmentSources: Array,
  staffList: Array,
});

const emit = defineEmits(["close", "success"]);
const formRef = ref(null);

const requiredRule = [(v) => !!v || "This field is required"];

const form = ref({
  name: "",
  email: "",
  telephone: "",
  inquiryDate: null,
  leadSource: null,
  leadStatus: null,
  contactMethod: null,
  treatment: null,
  assigned: null,
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

// formatted date helpers
const formattedInquiryDate = computed(() =>
  form.value.inquiryDate
    ? new Date(form.value.inquiryDate).toLocaleDateString()
    : ""
);
const formattedFollowUpDate = computed(() =>
  form.value.followUpDate
    ? new Date(form.value.followUpDate).toLocaleDateString()
    : ""
);
const formattedDob = computed(() =>
  form.value.dob ? new Date(form.value.dob).toLocaleDateString() : ""
);

const onInquiryDateSelected = (val) => {
  form.value.inquiryDate = val;
};
const onFollowUpDateSelected = (val) => {
  form.value.followUpDate = val;
};
const onDobSelected = (val) => {
  form.value.dob = val;
};

import crmService from "@/services/crmService";
const mainStore = useMainStore();
const onSubmit = async () => {
  const validation = await formRef.value.validate();
  if (!validation.valid) return;
  try {
    const payload = { ...form.value };
    const res = await crmService.createLead(payload);
    if (res.code === 0) {
      mainStore.setSnackbar({ title: "Lead created", type: "success" });
      emit("success", res.data);
    } else {
      mainStore.setSnackbar({ title: res.message || "Failed to create lead", type: "error" });
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e.message || "Failed to create lead", type: "error" });
  }
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
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
