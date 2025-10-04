<template>
  <v-card class="pa-2 border-none" rounded="lg" :elevation="0">
    <v-form>
      <v-row dense>
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center">
            <label class="fld-lbl">Question</label>
            <v-btn
              v-if="index > 0"
              icon
              variant="text"
              color="#8B8B8B"
              style="width: 20px; height: 20px; min-width: 20px"
              @click="$emit('remove', index)"
            >
              <v-icon size="14">mdi-close</v-icon>
            </v-btn>
          </div>

          <v-text-field
            v-model="checklist.question"
            variant="solo"
            density="compact"
            class="mb-1 input-bordered"
            bg-color="white"
            flat
            single-line
            hide-details
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="4">
          <label class="fld-lbl">Category</label>
          <v-text-field
            v-model="checklist.category"
            variant="solo"
            density="compact"
            class="mb-1 input-bordered"
            bg-color="white"
            flat
            single-line
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <label class="fld-lbl">Field 1</label>
          <v-text-field
            v-model="checklist.fieldOneTitle"
            variant="solo"
            density="compact"
            class="mb-1 input-bordered align-content-center"
            bg-color="white"
            flat
            single-line
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <label class="fld-lbl">Field 2</label>
          <v-text-field
            v-model="checklist.fieldTwoTitle"
            variant="solo"
            density="compact"
            class="mb-1 input-bordered"
            bg-color="white"
            flat
            single-line
            hide-details
          ></v-text-field>
        </v-col>
      </v-row>
      <div class="d-flex align-center flex-wrap" style="gap: 12px">
        <v-checkbox
          v-model="checklist.showDate"
          color="primary"
          label="Date"
          :value="true"
          hide-details
        />

        <v-checkbox
          v-model="checklist.showTime"
          color="primary"
          label="Time"
          :value="true"
          hide-details
        />

        <v-checkbox
          v-model="checklist.showRadio"
          color="primary"
          label="Yes/No"
          :value="true"
          hide-details
        />
      </div>
    </v-form>
  </v-card>
</template>
<script setup>
const { checklist, index } = defineProps({
  checklist: Object,
  index: Number,
});
const emit = defineEmits(["remove"]);
</script>
<style lang="scss" scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 12px !important;
  background-color: white !important;
  min-height: 52px;
  font-size: 14px;
}
.fld-lbl {
  color: #737373;
}
/* Target the actual checkbox box (the square) */
:deep(.v-checkbox .v-selection-control__input .v-icon) {
  color: #dbdbdb !important; // sets the stroke/border color for unchecked state
}
/* Center text inside text fields */
.input-bordered :deep(.v-field__input),
.input-bordered :deep(.v-field__input input),
.input-bordered :deep(.v-field__input textarea) {
  text-align: center !important;
}
</style>
