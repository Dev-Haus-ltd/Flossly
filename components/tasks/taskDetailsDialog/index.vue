<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1000px" persistent>
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header -->
        <div
          class="pa-4 d-flex justify-space-between align-center"
          style="background-color: white"
        >
          <h3 class="title m-0">{{ taskDetails.title }}</h3>
          <div class="d-flex align-center">
            <v-tooltip text="You will get 10 points on completion of each task">
              <template #activator="{ props }">
                <v-chip
                  v-bind="props"
                  class="bonus-chip"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-star"
                  label
                >
                  +10
                </v-chip>
              </template>
            </v-tooltip>
            <!-- <v-menu location="bottom right">
              <template #activator="{ props }">
                <v-btn
                  icon
                  v-bind="props"
                  size="32"
                  variant="text"
                  class="ml-2 mr-1"
                >
                  <v-icon size="18">mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>

              <v-card style="min-width: 130px">
                <v-list density="compact">
                  <v-list-item @click="editItem" class="menu-item" rounded="lg">
                    <template #prepend>
                      <v-icon size="18" class="mr-2">mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    @click="anotherAction"
                    class="menu-item"
                    rounded="lg"
                  >
                    <template #prepend>
                      <v-icon size="18" class="mr-2">mdi-eye</v-icon>
                    </template>
                    <v-list-item-title>View</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-menu> -->

            <v-btn flat icon size="32" @click="$emit('close')">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Scrollable content -->
        <div
          class="flex-grow-1 px-4 py-2"
          style="overflow-y: auto; background-color: #f9f9f9"
        >
          <v-tabs v-model="tab" class="custom-tabs px-4" slider-color="primary">
            <v-tab value="overview" class="tab-text">
              <img
                src="@/assets/icons/overview.svg"
                alt="Overview"
                width="18"
                height="18"
                class="mr-2"
              />
              Overview
            </v-tab>

            <v-tab value="checklist" class="tab-text">
              <img
                src="@/assets/icons/checklist.svg"
                alt="Checklist"
                width="18"
                height="18"
                class="mr-2"
              />
              Checklist
            </v-tab>

            <v-tab value="files" class="tab-text">
              <img
                src="@/assets/icons/files.svg"
                alt="Files"
                width="18"
                height="18"
                class="mr-2"
              />
              Files
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="overview">
              <div
                class="px-9 py-4 mt-6"
                v-if="taskDetails && taskDetails.status && taskDetails.priority"
              >
                <v-row>
                  <!-- Created Time -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/created.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Created Time</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{
                      formatDate(taskDetails.createdAt)
                    }}</span>
                  </v-col>

                  <!-- Category -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/category.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Category</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text"> {{ taskDetails.taskDetails?.category?.name }}</span>
                  </v-col>

                  <!-- Priority -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/priority.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Priority</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-chip
                      :color="taskDetails.priority.color"
                      size="small"
                      label
                    >
                   {{  taskDetails.priority.name }}
                   
                    </v-chip>
                  </v-col>

                  <!-- Frequency -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/frequency.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Frequency</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{ taskDetails.frequency }}</span>
                  </v-col>

                  <!-- Status -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/status.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Status</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-chip
                      class="px-3"
                      :color="taskDetails.status.color"
                      size="small"
                      label
                    >
                      {{
                        taskDetails.status.name
                      }}
                    </v-chip>
                  </v-col>

                  <!-- Due Date -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Due Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{
                      taskDetails.dueDate ? taskDetails.dueDate : "No due date"
                    }}</span>
                  </v-col>

                  <!-- Assignee -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Assignee</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <Avatar
                      :user="{ fullName: taskDetails.assignedUser.fullName }"
                    />
                  </v-col>
                </v-row>

                <!-- Task Description -->
                <v-card class="mt-6 pa-4" elevation="0">
                  <h4 class="mb-2 cust-lbl">
                   Task Description
                  </h4>
                  <p class="value-text">
                    {{ taskDetails.taskDetails.description }}
                  </p>
                </v-card>
                <div class="mt-3">
                  <label class="cust-lbl">Comments</label>
                  <v-textarea
                  v-model="taskDetails.comments"
                    variant="solo"
                    placeholder="Type here"
                    density="compact"
                    :rules="requiredRule"
                    bg-color="white"
                    elevation="0"
                    class="mt-1"
                    flat
                  />
                </div>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="checklist"> 
           

              <TasksTaskDetailsDialogChecklistTabDetails
                :checklist="taskDetails.userTaskChecklist"
                :userTaskId="taskDetails.id" 
                :title="taskDetails?.taskDetails?.title"
              />
            </v-tabs-window-item>
            <v-tabs-window-item value="files">
              <div class="pa-4">
                <CommonDirectFileUpload @upload="uploadFile"  />
                <v-row class="mt-5" dense>
                  <v-col
                    cols="3"
                    v-for="file in taskDetails.attachments"
                    :key="file.id"
                  >
                    <v-card
                      class="d-flex flex-column justify-space-between pa-3"
                      style="
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        position: relative;
                        min-height: 150px;
                      "
                      elevation="0"
                    >
                      <!-- Top Right Icons -->
                      <div
                        class="d-flex flex-column align-center"
                        style="
                          position: absolute;
                          top: 8px;
                          right: 8px;
                          z-index: 1;
                        "
                      >
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          :href="file.link"
                          target="_blank"
                        >
                          <v-icon size="16">mdi-download</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          @click="deleteFile(file)"
                        >
                          <v-icon size="16" color="red">mdi-delete</v-icon>
                        </v-btn>
                      </div>

                      <!-- Center File Icon or Preview -->
                      <div
                        class="d-flex align-center justify-center"
                        style="margin-top: 30px"
                      >
                        <v-icon size="60" color="#9e9e9e">mdi-file</v-icon>
                      </div>

                      <!-- Divider -->
                      <v-divider class="mt-4 mb-1"></v-divider>

                      <!-- Footer: Name and Meta -->
                      <div class="text-center">
                        <div class="text-body-2 font-weight-medium">
                          {{ file.title }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ formatFileSize(file.size) }} •
                          {{ formatDate(file.createdAt) }}
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <!-- Footer -->
        <div
          class="d-flex justify-end pa-6"
          style="background-color: white; border-top: 1px solid #eee"
        >
        

          <v-btn
            color="primary"
            style=" height: 44px"
            @click="$emit('save', taskDetails)"
            flat
            :elevation="0"
            rounded="lg"
            class="px-7"
          >
            Submit Information
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { parsedDate } from "@/lib/dateFormatter";
import Avatar from "~/components/Common/avatar.vue";
const modelValue = ref(false);
const props = defineProps({
  selectedItem: Object,
  modelValue: Boolean,
});
const taskStore = useTaskStore();
const store= useMainStore();
const tab = ref("overview");
const taskDetails = ref("");

const fetchTaskDetails = async () => {
  let userTaskId;
  if (props.selectedItem.id) {
    userTaskId = props.selectedItem.id;
  } else {
    const users = props.selectedItem.assignedUsers;
    props.selectedItem.assignedUser = users[0];
    userTaskId = users[0].userTaskId;
  }
  try {
    const res = await taskStore.getTaskDetails({
      userTaskId,
    });
    if (res.code === 0) { 
      taskDetails.value = res.data;
      console.log(taskDetails.value)
    } else {
      console.error("Failed to fetch task details:", res.message);
    }
  } catch (err) {
    console.error("Error fetching task details:", err);
  }
};
watch(
  () => props.modelValue,
  async (newValue) => {
    modelValue.value = newValue;
    if (newValue) {
      await fetchTaskDetails();
    } else {
      taskDetails.value = ""; // Optional: reset on close
    }
  },
  { immediate: true }
);

const formatFileSize = (size) => {
  if (!size) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(1) * 1 +
    " " +
    ["B", "KB", "MB", "GB", "TB"][i]
  );
};

const formatDate = (date) => {
  return parsedDate(date);
};
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("userTaskId", props.selectedItem.id);
    formData.append("files", file);

    const res = await taskStore.addAttachments(formData);

    if (res.code === 0) {
      fetchTaskDetails()
      store.setSnackbar({
        title: "File upload successful",
        type: "success",
      });
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Upload failed",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};

</script>

<style scoped>
/* Keep text color default, even when tab is active */
.title {
  font-family: "Poppins";
  font-weight: 600;
  font-size: 16px;
}
.custom-tabs{
  border-bottom: 1px solid #dbdbdb;

}
.custom-tabs .v-tab {
  color: inherit !important;
}

/* Optional: Add subtle weight on active tab */
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.key-text {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #737373;
  margin-top: 4px;
}

.value-text {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.menu-item:hover {
  background-color: #f5f5f5 !important;
  cursor: pointer;
}
.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e; /* Text color */
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}

/* Deep selector to target the icon inside the chip */
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
.cust-lbl {
  font-family: "Poppins";
  font-weight: bold;
  font-size: 14px;
}
</style>
