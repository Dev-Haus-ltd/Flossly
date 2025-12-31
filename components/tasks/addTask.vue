// TasksAddTask.vue - Updated to accept and use preSelectedCategory prop
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
                  :rules="titleRules"
                  :maxlength="titleMaxLength"
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
                <label class="fld-lbl">Assign to Team Members</label>
                <v-select
                  v-model="form.userIds"
                  :items="userList"
                  item-title="fullName"
                  item-value="id"
                  variant="solo"
                  density="compact"
                  class="input-bordered mb-0"
                  bg-color="white"
                  flat
                  clearable
                  multiple
                  chips
                  closable-chips
                  hide-selected
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

              <!-- Status Field - Pre-selected based on which section button was clicked -->
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
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";

// Add preSelectedStatus and preSelectedCategory props
const props = defineProps({
  modelValue: Boolean,
  preSelectedStatus: {
    type: String,
    default: null,
  },
  preSelectedCategory: {
    type: Number,
    default: null,
  },
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
const titleMaxLength = 150;
const titleRules = [
  (v) => !!v || "This field is required",
  (v) => (v && v.trim().length > 0) || "Task title cannot be empty or only spaces",
  (v) => (v && v.trim().length <= titleMaxLength) || `Title must be ${titleMaxLength} characters or less`,
];

const form = ref({
  title: "",
  description: "",
  categoryId: null,
  dueDate: "",
  roleId: null,
  userIds: [],
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
  { id: 0, name: "One off"},
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

// Watch preSelectedStatus to update form.statusId when it changes
watch(
  () => props.preSelectedStatus,
  (newStatus) => {
    if (newStatus) {
      const matchingStatus = taskStatuses.value.find(
        (s) => s.key === newStatus || s.name?.toLowerCase() === newStatus?.toLowerCase()
      );
      if (matchingStatus) {
        form.value.statusId = matchingStatus.id;
      }
    }
  }
);

// Watch preSelectedCategory to update form.categoryId when it changes
watch(
  () => props.preSelectedCategory,
  (newCategoryId) => {
    if (newCategoryId) {
      form.value.categoryId = newCategoryId;
    }
  }
);

// Watch only roleId to filter userList, not the entire form
watch(
  () => form.value.roleId,
  (newRoleId) => {
    const activeUsers = users.value.filter((x) => x.status === "Active");
    if (newRoleId) {
      const filteredUsers = activeUsers.filter((x) => x.roleId === newRoleId);
      userList.value = filteredUsers;
      form.value.userIds = form.value.userIds.filter((id) =>
        filteredUsers.some((u) => u.id === id)
      );
    } else {
      // If no role is selected, show all active users
      userList.value = activeUsers;
      // Keep only active users when the role filter is cleared
      form.value.userIds = form.value.userIds.filter((id) =>
        activeUsers.some((u) => u.id === id)
      );
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
        // After loading statuses, apply pre-selected status if provided
        if (props.preSelectedStatus) {
          const matchingStatus = res.data.find(
            (s) => s.key === props.preSelectedStatus || s.name?.toLowerCase() === props.preSelectedStatus?.toLowerCase()
          );
          if (matchingStatus) {
            form.value.statusId = matchingStatus.id;
          }
        }
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
      // After loading categories, apply pre-selected category if provided
      if (props.preSelectedCategory) {
        const matchingCategory = res.data.find(
          (c) => c.id === props.preSelectedCategory
        );
        if (matchingCategory) {
          form.value.categoryId = props.preSelectedCategory;
        }
      }
    }
  });
};

const getUsers = () => {
  // Force refresh the user list to get the latest active users
  userStore.getUserList({ roleId: null, force: true }).then((res) => {
    if (res.code === 0) {
      users.value = res.data;
      // Initialize userList with all active users if no role is selected
      if (!form.value.roleId) {
        const activeUsers = res.data.filter((x) => (x.orgStatus || x.status) === 'Active');
        userList.value = activeUsers;
        form.value.userIds = form.value.userIds.filter((id) =>
          activeUsers.some((u) => u.id === id)
        );
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

const modelValueRef = toRef(() => props.modelValue);
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
    return formatDateDDMMYYYY(form.value.dueDate);
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
    // Trim the title to remove leading/trailing spaces
    if (form.value.title) {
      form.value.title = form.value.title.trim();
    }
    
    const filteredChecklist = form.value.checklist.filter((x) => x.question);
    const uniqueUserIds = [...new Set((form.value.userIds || []).filter(Boolean))];
    const payload = {
      ...form.value,
      userIds: uniqueUserIds,
      userId: uniqueUserIds.length === 1 ? uniqueUserIds[0] : null, // backward compatibility
      checklist: filteredChecklist,
      defaultFrequency:
        form.value.defaultFrequency === "One off" ? "" : form.value.defaultFrequency,
    };

    taskStore
      .addNewTask(payload)
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
    userIds: [],
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
