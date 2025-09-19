<template>
  <!-- Title -->
  <div v-if="!isEditing && item.id">
    <div class="d-flex align-center justify-space-between mb-1">
      <div class="d-flex align-center">
        <img
          src="@/assets/icons/category.svg"
          alt="Category"
          width="20"
          class="mr-2"
        />
        <span class="card-title">{{ item.category }}</span>
      </div>

      <!-- Delete Button with Icon -->
      <div>
        <v-btn
          icon
          size="18"
          color="error"
          variant="text"
          @click="emit('deleteItem', item)"
          class="mr-2 action-btn"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-btn
          icon
          size="18"
          color="info"
          variant="text"
          @click="isEditing = true"
          class="ml-2 action-btn"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Subtitle -->
    <div class="card-subtitle mb-4">
      {{ item.question }}
    </div>

    <v-row class="mb-4" dense>
      <!-- Radio Buttons -->
      <v-col cols="4" v-if="item.showRadio">
        <div>
          <v-radio-group v-model="item.radioValue" hide-details inline>
            <v-radio
              class="radio-bg pa-2 mr-1 rounded"
              label="Yes"
              value="Yes"
              density="compact"
            />
            <v-radio
              class="radio-bg pa-2 rounded"
              label="No"
              value="No"
              density="compact"
            />
          </v-radio-group>
        </div>
      </v-col>

      <!-- Date Picker -->
      <v-col cols="4" v-if="item.showDate">
        <v-text-field
          v-model="item.dateValue"
          density="compact"
          label="Select Date"
          variant="solo"
          flat
          bg-color="white"
          readonly
          append-inner-icon="mdi-calendar"
          class="input-bordered"
          hide-details
          @click:append-inner="showDatePickers[index] = true"
        />
        <v-dialog v-model="showDatePickers[index]" width="auto">
          <v-date-picker
            @update:modelValue="
              (val) => {
                item.dateValue = format(new Date(val), 'dd/MM/yyyy');
                showDatePickers[index] = false;
              }
            "
          />
        </v-dialog>
      </v-col>

      <!-- Time Picker -->
      <v-col cols="4" v-if="item.showTime">
        <v-dialog
          v-model="showTimePickers[index]"
          width="auto"
          scroll-strategy="none"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="item.timeValue"
              density="compact"
              label="Select Time"
              variant="solo"
              flat
              bg-color="white"
              readonly
              append-inner-icon="mdi-clock-outline"
              class="input-bordered"
              hide-details
              v-bind="props"
            />
          </template>

          <v-card>
            <v-time-picker
              v-model="item.timeValue"
              @update:modelValue="showTimePickers[index] = false"
            />
          </v-card>
        </v-dialog>
      </v-col>

  
    </v-row>
    <v-row class="mb-4" dense>
    <!-- Field One -->
    <v-col cols="6">
        <v-label> {{ item.fieldOneTitle }}</v-label>
        <v-text-field
          v-model="item.fieldOneValue"
          density="compact"
          variant="solo"
          flat
          bg-color="white"
          class="input-bordered"
          hide-details
        />
      </v-col>

      <!-- Field Two -->
      <v-col cols="6">
        <v-label>{{ item.fieldTwoTitle }}</v-label>

        <v-text-field
          v-model="item.fieldTwoValue"
          density="compact"
          variant="solo"
          flat
          bg-color="white"
          class="input-bordered"
          hide-details
        />
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <TasksCreateChecklist :checklist="item" />
  </div>
  <v-row align="center" justify="end" class="pa-2">
    <v-btn
      v-if="isEditing"
      @click="isEditing = false"
      flat
      variant="text"
      color="secondary"
      >Cancel</v-btn
    >
    <v-btn v-if="isDirty" @click="updateChecklist" flat color="primary">Save</v-btn>
  </v-row>
</template>

<script setup>
import { TasksCreateChecklist } from "#components";
import { format } from "date-fns";
const { item, index } = defineProps(["item", "index"]);
const taskStore = useTaskStore();
const emit = defineEmits(["deleteItem"]);
const showDatePickers = ref([]);
const showTimePickers = ref([]);
const mainStore = useMainStore();
const isEditing = ref(false);
const initialItem = ref({...item})
const isDirty = computed(() => JSON.stringify(item || {}) !== JSON.stringify(initialItem.value || {}))

const updateChecklist = () => {
  if (isEditing.value) {
    isEditing.value = false;
  }
  const data = item;
  data.dateValue = new Date(data.dateValue);
  if (item.id) {
    taskStore.updateChecklist(data).then((res) => {
      if (res.code === 0) {
        mainStore.setSnackbar({
          title: "Checklist saved",
          type: "success",
        });
      }
    });
  } else {
    taskStore.addChecklist(data).then((res) => {
      if (res.code === 0) {
        mainStore.setSnackbar({
          title: "Checklist saved",
          type: "success",
        });
      }
    });
  }
};
</script>
<style scoped>
.border-card {
  border: 1px solid #dbdbdb;
  background-color: white;
}

.card-title {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
}

.card-subtitle {
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-size: 14px;
}

.radio-bg {
  background-color: #f6f7fb;
  width: 130px;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
</style>
