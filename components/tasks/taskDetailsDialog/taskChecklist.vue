<template>
  <!-- Title -->
  <div v-if="!isEditing && item.id">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <span class="card-title" style="font-weight: 600;">{{ item.question }}</span>
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
          <img src="@/assets/tasks/delete.svg" alt="Delete" width="18" height="18" style="filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);" />
        </v-btn>
        <v-btn
          icon
          size="18"
          color="info"
          variant="text"
          @click="isEditing = true"
          class="ml-2 action-btn"
        >
          <img src="@/assets/tasks/edit.svg" alt="Edit" width="18" height="18" />
        </v-btn>
      </div>
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
          :model-value="formattedDate"
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
            :model-value="datePickerValue"
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
import { format, parseISO, isValid } from "date-fns";
const { item, index } = defineProps(["item", "index"]);
const taskStore = useTaskStore();
const emit = defineEmits(["deleteItem"]);
const showDatePickers = ref([]);
const showTimePickers = ref([]);
const mainStore = useMainStore();
const isEditing = ref(false);
const initialItem = ref({...item})
const isDirty = computed(() => JSON.stringify(item || {}) !== JSON.stringify(initialItem.value || {}))


const formattedDate = computed(() => {
  if (!item.dateValue) return '';
  
  // If it's already formatted (dd/MM/yyyy), return as is
  if (typeof item.dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(item.dateValue)) {
    return item.dateValue;
  }
  

  try {
    let date;
    if (typeof item.dateValue === 'string') {
      date = parseISO(item.dateValue);
    } else if (item.dateValue instanceof Date) {
      date = item.dateValue;
    } else {
      return '';
    }
    
    
    if (isValid(date) && date.getTime() > 0) {
      return format(date, 'dd/MM/yyyy');
    }
    return '';
  } catch (error) {
    return '';
  }
});


const datePickerValue = computed(() => {
  if (!item.dateValue) return null;

 
  if (typeof item.dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(item.dateValue)) {
    const [day, month, year] = item.dateValue.split('/');
    return `${year}-${month}-${day}`;
  }
  

  try {
    let date;
    if (typeof item.dateValue === 'string') {
      date = parseISO(item.dateValue);
    } else if (item.dateValue instanceof Date) {
      date = item.dateValue;
    } else {
      return null;
    }
    
  
    if (isValid(date) && date.getTime() > 0) {
      return format(date, 'yyyy-MM-dd');
    }
    return null;
  } catch (error) {
    return null;
  }
});

const updateChecklist = () => {
  if (isEditing.value) {
    isEditing.value = false;
  }
  const data = { ...item };
  
  
  if (data.dateValue) {
    if (typeof data.dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data.dateValue)) {
      
      const [day, month, year] = data.dateValue.split('/');
      data.dateValue = new Date(year, month - 1, day);
    } else if (typeof data.dateValue === 'string') {
     
      data.dateValue = parseISO(data.dateValue);
    } else if (!(data.dateValue instanceof Date)) {
     
      data.dateValue = new Date(data.dateValue);
    }
  }
  
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
  
  font-weight: 400;
  font-size: 14px;
}

.card-subtitle {
  
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
  
}
</style>
