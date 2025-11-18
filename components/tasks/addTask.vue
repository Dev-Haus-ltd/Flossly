// Watch roleId to filter users<!-- TasksAddTask.vue - Updated -->
<template>
  <teleport to="body">
    <v-navigation-drawer
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      location="right"
      temporary
      :width="600"
    >
      <v-toolbar flat color="white">
        <v-toolbar-title class="title-text"> Add New Task </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="outlined"
          color="#8B8B8B"
          @click="handleCancel"
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
            <v-row dense>
              <v-col cols="6">
                <label class="fld-lbl">Task Title <span style="color: red">*</span></label>
                <v-text-field
                  v-model="form.title"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  :rules="requiredRule"
                  required
                  flat
                />
              </v-col>
              
              <!-- Enhanced Category Field with Autocomplete -->
              <v-col cols="6">
                <label class="fld-lbl">Task Category <span style="color: red">*</span></label>
                <v-autocomplete
                  ref="categoryAutocomplete"
                  v-model="form.categoryId"
                  :items="taskCategories"
                  item-title="name"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  :rules="requiredRule"
                  required
                  flat
                  clearable
                  no-data-text="No categories found"
                  @update:search="searchCategory"
                  :menu-props="{ closeOnContentClick: true }"
                >
                  <!-- Add New Category Option -->
                  <template #append-item>
                    <v-divider class="my-2" />
                    <v-list-item @click="openCategoryDialog">
                      <v-icon start color="primary">mdi-plus</v-icon>
                      <v-list-item-title class="text-primary">
                        Add New Category
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">Due Date</label>
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="formattedDate"
                      v-bind="props"
                      variant="solo"
                      density="compact"
                      class="input-bordered mb-0"
                      bg-color="white"
                      flat
                      readonly
                    >
                    <!-- 👇 Custom icon slot instead of append-inner-icon -->
                      <template #append-inner>
                        <v-icon class="cursor-pointer" @click.stop="menu = true">
                          mdi-calendar
                        </v-icon>
                      </template>
                    </v-text-field>
                  </template>

                  <v-date-picker
                    v-model="form.dueDate"
                    @update:modelValue="onDateSelected"
                  />
                </v-menu>
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">Role</label>
                <v-select
                  v-model="form.roleId"
                  :items="rolesList"
                  item-title="title"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  flat
                  clearable
                />
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">Assign to Team Member</label>
                <v-select
                  v-model="form.userId"
                  :items="userList"
                  item-title="fullName"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  flat
                  clearable
                />
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">Frequency</label>
                <v-select
                  v-model="form.defaultFrequency"
                  :items="frequencies"
                  item-title="name"
                  item-value="name"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  flat
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <label class="fld-lbl">Priority</label>
                <v-select
                  v-model="form.priorityId"
                  :items="taskPriorities"
                  item-title="name"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  item-color="color"
                  bg-color="white"
                  flat
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <label class="fld-lbl">Status</label>
                <v-select
                  v-model="form.statusId"
                  :items="taskStatuses"
                  item-title="name"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  flat
                  clearable
                >
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :style="{ borderLeft: `4px solid ${item.raw.color || '#ccc'}` }"
                    />
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12">
                <label class="fld-lbl">Description</label>
                <v-textarea
                  v-model="form.description"
                  variant="solo"
                  density="compact"
                  bg-color="white"
                  class="input-bordered mb-0"
                  flat
                />
              </v-col>

              <v-col cols="12">
                <v-card :elevation="0" rounded="lg" class="border-sm pb-2">
                  <v-card-title class="border-b py-3 checklist">
                    Add Custom Questions
                  </v-card-title>

                <!-- Container with rounded edges for checklists -->
                  <div class="mx-3 mt-8">
                    <v-card
                      v-for="(cl, index) in form.checklist"
                      :key="cl._id || index"
                      class="mb-4 pa-2"
                      elevation="0"
                      style="border: 1px solid #dfdfdf; border-radius: 12px;"
                    >
                      <TasksCreateChecklist
                        :checklist="cl"
                        :index="index"
                        @remove="removeChecklist"
                      />
                    </v-card>
                  </div>
                <!-- Add More Questions Button -->
                  <div class="mx-3">
                    <v-btn
                      @click="addNewChecklist"
                      class="w-100 justify-center add-qs-btn mt-8 mb-3"
                      variant="outlined"
                      flat
                    >
                      <v-icon
                        start
                        class="me-2"
                        color="primary"
                        style="
                          border: 1px solid #DFDFDF !important;
                          border-radius: 12px !important;
                          padding: 4px;
                        "
                      >
                        mdi-plus
                      </v-icon>
                      Add More Questions
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </div>

      <!-- Footer -->
      <div
        class="d-flex justify-space-between align-center px-4 py-2"
        style="background-color: white; padding: 12px 16px;"
      >
        <v-btn
          color="white"
          class="text-primary"
          style="width: 48%; border-radius: 8px; border: 1px solid #DFDFDF !important; min-height: 40px;"
          @click="handleCancel"
          flat
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          class="text-white"
          style="width: 48%; border-radius: 8px; border: 1px solid #DFDFDF !important; min-height: 40px;"
          @click="onSubmit()"
          flat
        >
          Save
        </v-btn>
      </div>

      <!-- Add Category Sidebar - CommonAddCategorySideBar -->
      <CommonAddCategorySideBar
        v-model="addCategoryDialog"
        @close="handleCategoryDialogClose"
        @success="handleCategorySuccess"
        :categories="taskCategories"
      />
    </v-navigation-drawer>
  </teleport>
</template>

<script setup>
import { TasksCreateChecklist } from "#components";
import { format } from "date-fns";

const { modelValue } = defineProps({
  modelValue: Boolean,
});

const mainStore = useMainStore();
const taskStore = useTaskStore();
const orgStore = useOrgStore();
const userStore = useUserStore();

const formRef = ref(null);
const categoryAutocomplete = ref(null);
const menu = ref(false);
const emit = defineEmits(["close", "success", "update:modelValue"]);
const requiredRule = [(v) => !!v || "This field is required"];

const form = ref({
  title: "",
  description: "",
  categoryId: null,
  dueDate: "",
  roleId: null,
  userId: null,
  defaultFrequency: "",
  priorityId: null,
  statusId: null,
  checklist: [
    {
      question: "",
      category: "",
      fieldOneTitle: "",
      fieldTwoTitle: "",
      showDate: false,
      showTime: false,
      showRadio: false,
    },
  ],
});

const taskPriorities = ref([]);
const taskStatuses = ref([]);
const rolesList = ref([]);
const userList = ref([]);
const users = ref([]);
const taskCategories = ref([]);
const addCategoryDialog = ref(false);
const searchQuery = ref("");

const frequencies = ref([
  { id: 1, name: "Daily" },
  { id: 2, name: "Weekly" },
  { id: 3, name: "Fortnightly" },
  { id: 4, name: "Monthly" },
  { id: 5, name: "6 Monthly" },
  { id: 6, name: "Yearly" },
]);

// Filter categories based on search query
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return taskCategories.value;
  }
  return taskCategories.value.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Watch only roleId to filter userList, not the entire form
watch(
  () => form.value.roleId,
  (newRoleId, oldRoleId) => {
    if (newRoleId) {
      const filteredUsers = users.value.filter(
        (x) => x.roleId === newRoleId && x.status === "Active"
      );
      userList.value = filteredUsers;

      // If the currently selected userId is not in the filtered list, clear it
      if (form.value.userId) {
        const userStillValid = filteredUsers.some(
          (u) => u.id === form.value.userId
        );
        if (!userStillValid) {
          form.value.userId = null;
        }
      }
    } else {
      // If no role is selected, show all active users
      userList.value = users.value.filter((x) => x.status === "Active");
      // Clear userId if role is cleared
      if (oldRoleId && form.value.userId) {
        form.value.userId = null;
      }
    }
  }
);

const getRoles = () => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data;
      }
    })
    .catch((err) => console.error(err));
};

const getTaskPriorities = () => {
  orgStore
    .getTaskPriorities()
    .then((res) => {
      if (res.code === 0) {
        taskPriorities.value = res.data;
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};

const getTaskStatuses = () => {
  orgStore
    .getTaskStatuses()
    .then((res) => {
      if (res.code === 0) {
        taskStatuses.value = res.data;
      } else {
        // set snack
      }
    })
    .catch((err) => {
      return err;
      // set snack
    });
};

const getCategories = () => {
  taskStore.listCategories().then((res) => {
    if (res.code === 0) {
      taskCategories.value = res.data;
    }
  });
};

const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) {
      users.value = res.data;
      // Initialize userList with all active users if no role is selected
      if (!form.value.roleId) {
        userList.value = res.data.filter((x) => x.status === "Active");
      }
    }
  });
};

const searchCategory = (searchValue) => {
  searchQuery.value = searchValue;
};

const openCategoryDialog = () => {
  // Close the autocomplete dropdown before opening the category dialog
  if (categoryAutocomplete.value) {
    categoryAutocomplete.value.isOpen = false;
  }
  addCategoryDialog.value = true;
};

const handleCategoryDialogClose = () => {
  addCategoryDialog.value = false;
  searchQuery.value = "";
};

// Handle newly created category from CommonAddCategorySideBar
const handleCategorySuccess = (newCategory) => {
  if (newCategory && newCategory.id) {
    // Add new category to the list
    taskCategories.value.push(newCategory);

    // Auto-select the newly created category
    form.value.categoryId = newCategory.id;

    // Close the category dialog
    addCategoryDialog.value = false;
    searchQuery.value = "";

    // Show success message
    mainStore.setSnackbar({
      type: "success",
      title: "Category created and selected successfully",
    });
  }
};

const addNewChecklist = () => {
  form.value.checklist.push({
    question: "",
    category: "",
    fieldOneTitle: "",
    fieldTwoTitle: "",
    showDate: false,
    showTime: false,
    showRadio: false,
  });
};

const removeChecklist = (index) => {
  if (form.value.checklist.length === 1) {
    form.value.checklist[0] = {
      _id: Date.now(),
      question: "",
      category: "",
      fieldOneTitle: "",
      fieldTwoTitle: "",
      showDate: false,
      showTime: false,
      showRadio: false,
    };
    return;
  }
  form.value.checklist.splice(index, 1);
};

const modelValueRef = toRef(() => modelValue);
watch(
  modelValueRef,
  (newValue) => {
    if (newValue) {
      getRoles();
      getUsers();
      getTaskPriorities();
      getTaskStatuses();
      getCategories();
    }
    // modelValue = newValue;
  },
  { immediate: true }
);

const formattedDate = computed({
  get() {
    if (!form.value.dueDate) return "";
    const date = new Date(form.value.dueDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
  set(val) {
    form.value.dueDate = val;
  },
});

const onDateSelected = (val) => {
  form.value.dueDate = format(val, "yyyy-MM-dd");
  menu.value = false;
};

const onSubmit = async () => {
  const formValidation = await formRef.value.validate();
  if (formValidation.valid) {
    const unfilledChecklist = form.value.checklist.findIndex((x) => !x.question);
    if (unfilledChecklist >= 0) {
      form.value.checklist.splice(unfilledChecklist, 1);
    }

    taskStore
      .addNewTask(form.value)
      .then((res) => {
        if (res.code === 0) {
          emit("update:modelValue", false);
          emit("success");
          mainStore.setSnackbar({
            type: "success",
            title: "Task Added Successfully",
          });
          resetForm();
        } else {
          mainStore.setSnackbar({
            type: "error",
            title: res.data?.message || res.message,
          });
        }
      })
      .catch((err) => {
        mainStore.setSnackbar({
          type: "error",
          title: err.message,
        });
      });
  }
};

const resetForm = () => {
  form.value = {
    title: "",
    description: "",
    categoryId: null,
    dueDate: "",
    roleId: null,
    userId: null,
    defaultFrequency: "",
    priorityId: null,
    statusId: null,
    checklist: [
      {
        question: "",
        category: "",
        fieldOneTitle: "",
        fieldTwoTitle: "",
        showDate: false,
        showTime: false,
        showRadio: false,
      },
    ],
  };
  if (formRef.value) {
    formRef.value.resetValidation();
  }
  menu.value = false;
  searchQuery.value = "";
};

const handleCancel = () => {
  resetForm();
  emit("update:modelValue", false);
  emit("close");
};
</script>

<style scoped>
.title-text {
  font-weight: 600;
  font-size: 16px;
}

.fld-lbl {
  font-weight: 400;
  font-style: "Regular";
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

.checklist {
  font-weight: 600;
  font-size: 16px;
  background-color: #f6f7fb;
}

.add-qs-btn {
  border: 1px solid #dfdfdf;
  height: 52px;
}

.v-row > .v-col {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.category-field-wrapper {
  position: relative;
}
</style>