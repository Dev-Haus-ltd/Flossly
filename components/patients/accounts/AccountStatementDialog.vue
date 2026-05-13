<template>
  <v-dialog v-model="dialogVisible" max-width="560" scrollable :persistent="false">
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          Generate Statement of Account
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close" class="mr-2">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <v-card elevation="0" rounded="lg" class="pa-4" color="white">
          <v-row dense>
            <!-- Statement Type -->
            <v-col cols="12">
              <label class="fld-lbl">
                Statement Type <span class="req-star">*</span>
              </label>
              <v-select
                v-model="form.type"
                :items="types"
                placeholder="Select type"
                variant="outlined"
                density="compact"
                class="mt-1"
                hide-details="auto"
              />
            </v-col>

            <!-- Start Date -->
            <v-col cols="6">
              <label class="fld-lbl">Start From</label>
              <v-menu v-model="dateMenu" :close-on-content-click="false">
                <template #activator="{ props: dp }">
                  <v-text-field
                    v-bind="dp"
                    :model-value="formattedDate"
                    variant="outlined"
                    density="compact"
                    class="mt-1"
                    readonly
                    hide-details
                    placeholder="Select date"
                  >
                    <template #append-inner>
                      <v-icon size="16" @click.stop="dateMenu = true">
                        mdi-calendar
                      </v-icon>
                    </template>
                  </v-text-field>
                </template>

                <v-date-picker
                  v-model="form.startDate"
                  @update:model-value="dateMenu = false"
                  color="primary"
                />
              </v-menu>
            </v-col>

            <!-- End Date (Optional) -->
            <v-col cols="6">
              <label class="fld-lbl">End Date (Optional)</label>
              <v-menu v-model="endDateMenu" :close-on-content-click="false">
                <template #activator="{ props: dp }">
                  <v-text-field
                    v-bind="dp"
                    :model-value="formattedEndDate"
                    variant="outlined"
                    density="compact"
                    class="mt-1"
                    readonly
                    hide-details
                    placeholder="Select end date"
                  >
                    <template #append-inner>
                      <v-icon size="16" @click.stop="endDateMenu = true">
                        mdi-calendar
                      </v-icon>
                    </template>
                  </v-text-field>
                </template>

                <v-date-picker
                  v-model="form.endDate"
                  @update:model-value="endDateMenu = false"
                  color="primary"
                />
              </v-menu>
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="close"
        >
          Cancel
        </v-btn>

<v-btn
  class="mail-btn"
  style="flex: 1"
  @click="handleMail"
>
  <!-- <v-icon size="16" class="mr-1">mdi-email</v-icon> -->
  Mail
</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          @click="handlePrint"
        >
          <!-- <v-icon left size="16" class="mr-1">mdi-printer</v-icon> -->
          Print
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue"]);

// Dialog visibility with proper v-model binding
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

const form = reactive({
  type: null,
  startDate: null,
  endDate: null,
});

const types = [
  { title: "Full Statement", value: "full" },
  { title: "Outstanding Only", value: "outstanding" },
  { title: "Payments Only", value: "payments" },
];

const dateMenu = ref(false);
const endDateMenu = ref(false);

const formattedDate = computed(() => {
  if (!form.startDate) return "";
  return new Date(form.startDate).toLocaleDateString("en-GB");
});

const formattedEndDate = computed(() => {
  if (!form.endDate) return "";
  return new Date(form.endDate).toLocaleDateString("en-GB");
});

// Reset form when dialog opens
watch(dialogVisible, (isOpen) => {
  if (isOpen) {
    // Reset form values when dialog opens
    form.type = null;
    form.startDate = null;
    form.endDate = null;
  }
});

const close = () => {
  dialogVisible.value = false;
};

const handleMail = () => {
  // Handle mail action
  console.log("Mail statement", {
    type: form.type,
    startDate: form.startDate,
    endDate: form.endDate
  });
  
  // You can emit an event to parent or call an API here
  // For now, just close the dialog
  dialogVisible.value = false;
  
  // Show success message (optional)
  // mainStore.setSnackbar({
  //   message: "Statement sent via email",
  //   color: "success"
  // });
};

const handlePrint = () => {
  // Handle print action
  console.log("Print statement", {
    type: form.type,
    startDate: form.startDate,
    endDate: form.endDate
  });
  
  // You can emit an event to parent or call an API here
  // For now, just close the dialog
  dialogVisible.value = false;
  
  // Show success message (optional)
  // mainStore.setSnackbar({
  //   message: "Statement printed successfully",
  //   color: "success"
  // });
};
</script>

<style scoped lang="scss">
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
.mail-btn {
  background-color: #7d77ff !important;
  color: #fff !important;
  border-radius: 10px;
}
:deep(.v-field) {
  border-radius: 8px !important;
}

:deep(.v-picker) {
  border-radius: 12px !important;
}

:deep(.v-btn--variant-outlined) {
  border-color: #e5e7eb !important;
}

:deep(.v-btn--variant-outlined:hover) {
  background-color: #f9fafb !important;
}

/* Optional: Style the date picker buttons */
:deep(.v-date-picker-header) {
  padding: 8px 12px !important;
}

:deep(.v-date-picker-header .v-btn) {
  color: #0061fb !important;
}

:deep(.v-date-picker-nav) {
  color: #0061fb !important;
}

:deep(.v-date-picker-nav__prev, .v-date-picker-nav__next) {
  color: #0061fb !important;
}

:deep(.v-date-picker-month__day) {
  color: #1f2937 !important;
}

:deep(.v-date-picker-month__day--selected) {
  background-color: #0061fb !important;
  color: white !important;
}

:deep(.v-date-picker-month__day--selected.v-date-picker-month__day--adjacent) {
  background-color: #0061fb20 !important;
  color: #1f2937 !important;
}
</style>