<template>
  <v-form ref="formRef" @submit.prevent="onSave">
    <v-row>
      <!-- Primary Treatment of Interest -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Primary Treatment of Interest</label>
        <v-select
          v-model="localForm.primaryTreatment"
          :items="treatmentsList"
          item-title="name"
          item-value="id"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          bg-color="white"
          flat
        />
      </v-col>

      <!-- Secondary Treatments -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Secondary Treatments</label>
        <v-select
          v-model="localForm.secondaryTreatments"
          :items="treatmentsList"
          item-title="name"
          item-value="id"
          multiple
          :rules="[(v) => v.length > 0 || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          bg-color="white"
          flat
        />
      </v-col>

      <!-- Dental Concerns -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Specific Dental Concerns</label>
        <v-select
          v-model="localForm.concerns"
          :items="concernsList"
          item-title="name"
          item-value="id"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          bg-color="white"
          flat
        />
      </v-col>

      <!-- Treatment Areas -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Treatment Areas</label>
        <v-select
          v-model="localForm.treatmentAreas"
          :items="areasList"
          item-title="name"
          item-value="id"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          bg-color="white"
          flat
        />
      </v-col>

      <!-- Previous Dental Experiences -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Previous Dental Experiences</label>
        <v-text-field
          v-model="localForm.previousExperience"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
        />
      </v-col>

      <!-- Financial Budget -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Financial Budget</label>
        <v-text-field
          v-model="localForm.budget"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
        />
      </v-col>

      <!-- Special Occasion -->
      <v-col cols="12" md="4">
        <label class="mb-1 fld-lbl">Special Occasion</label>
        <v-text-field
          v-model="localForm.specialOccasion"
          :rules="[(v) => !!v || 'Required']"
          variant="solo"
          density="compact"
          class="mb-1 input-bordered"
          flat
        />
      </v-col>

      <!-- Save button -->
      <v-col cols="12" md="4" class="d-flex align-center">
        <v-btn color="primary" class="px-6" flat @click="onSave">Save</v-btn>
      </v-col>
      <v-col cols="12" md="6">
        <!-- Summary Table -->
        <v-table class="room-table mt-6" density="comfortable">
          <tbody>
            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Primary treatment of interest
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.primaryTreatment || "N/A" }}
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Secondary treatments mentioned
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  <span
                    v-if="Array.isArray(selectedTreatment.secondaryTreatments)"
                  >
                    {{
                      selectedTreatment.secondaryTreatments.join(", ") || "N/A"
                    }}
                  </span>
                  <span v-else>
                    {{ selectedTreatment.secondaryTreatments || "N/A" }}
                  </span>
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Specific dental concerns/pain points
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.concerns || "N/A" }}
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Treatment areas (front teeth, molars, etc.)
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.treatmentAreas || "N/A" }}
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Previous dental experiences
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.previousExperience || "N/A" }}
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Financial Budget
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.budget || "N/A" }}
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div class="h-100 d-flex align-center px-2 left-col">
                  Special Occasion
                </div>
              </td>
              <td>
                <div class="h-100 d-flex align-center px-2">
                  {{ selectedTreatment.specialOccasion || "N/A" }}
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
const { selectedTreatment } = defineProps({
  selectedTreatment: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["save"]);

const localForm = ref({
  primaryTreatment: selectedTreatment.primaryTreatment || null,
  secondaryTreatments: selectedTreatment.secondaryTreatments || [],
  concerns: selectedTreatment.concerns || null,
  treatmentAreas: selectedTreatment.treatmentAreas || null,
  previousExperience: selectedTreatment.previousExperience || "",
  budget: selectedTreatment.budget || "",
  specialOccasion: selectedTreatment.specialOccasion || "",
});

// Dummy dropdown data
const treatmentsList = [
  { id: 1, name: "Consultation" },
  { id: 2, name: "Root Canal" },
  { id: 3, name: "Braces" },
  { id: 4, name: "Teeth Whitening" },
];

const concernsList = [
  { id: 1, name: "Tooth Pain" },
  { id: 2, name: "Gum Issues" },
  { id: 3, name: "Cosmetic Appearance" },
];

const areasList = [
  { id: 1, name: "Front Teeth" },
  { id: 2, name: "Molars" },
  { id: 3, name: "Full Mouth" },
];

const onSave = () => {
  emit("save", localForm.value);
};
</script>

<style scoped>
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

/* Summary table styling */
.bordered-row {
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  overflow: hidden;
}

.table-key {
  background-color: #dbdbdb;
  padding: 10px;
  flex: 1;
  border-right: 1px solid #dbdbdb;
  font-weight: 500;
  font-size: 14px;
}

.table-value {
  background-color: white;
  padding: 10px;
  flex: 1;
  border-right: 1px solid #dbdbdb;
  border-left: none;
  font-size: 14px;
}
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.room-table td {
  
  font-weight: 400;
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  vertical-align: middle;
  text-align: left;
  word-break: break-word;
}

.room-table td:first-child {
  font-weight: 500;
  width: 50%; /* key column wider */
}
.room-table td:last-child {
  background-color: #fff;
  width: 50%; /* value column */
}
.left-col {
  background-color: #f6f6f6;
}
</style>
