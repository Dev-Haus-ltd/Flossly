<template>
  <v-card class="pa-2 border-none" rounded="lg" :elevation="0">
    <v-form>
      <v-row dense>
        <v-col cols="12">
          <label>Question</label>
          <v-text-field
            v-model="checklist.question"
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
      <v-row dense>
        <v-col cols="4">
          <label>Category</label>
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
          <label>Field 1</label>
          <v-text-field
            v-model="checklist.fieldOneTitle"
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
          <label>Field 2</label>
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
      <v-row dense>
        <v-col>
          <v-checkbox
            v-model="checklist.showDate"
            color="primary"
            label="Date"
            :value="true"
            hide-details
          ></v-checkbox>
        </v-col>
        <v-col>
          <v-checkbox
            v-model="checklist.showTime"
            color="primary"
            label="Time"
            :value="true"
            hide-details
          ></v-checkbox>
        </v-col>
        <v-col>
          <v-checkbox
            v-model="checklist.showRadio"
            color="primary"
            label="Yes/No"
            :value="true"
            hide-details
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-form>
  </v-card>
</template>
<script setup>
const { checklist } = defineProps({
  checklist: Object,
});
</script>
<style lang="scss" scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
