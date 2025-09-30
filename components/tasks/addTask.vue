<template>
  <v-navigation-drawer
    :model-value="modelValue"
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
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Task Title</label>
              <v-text-field
                v-model="form.title"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                :rules="requiredRule"
                required
                flat
              />
            </v-col>
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Task Category</label>
              <v-select
                v-model="form.categoryId"
                :items="taskCategories"
                item-title="name"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                :rules="requiredRule"
                bg-color="white"
                required
                flat
              />
            </v-col>
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Due Date</label>
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
                    class="mb-1 input-bordered"
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
              <label class="mb-1 fld-lbl">Role</label>
              <v-select
                v-model="form.roleId"
                :items="rolesList"
                item-title="title"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
              />
            </v-col>
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Assign to Team Member</label>
              <v-select
                v-model="form.userId"
                :items="userList"
                item-title="fullName"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
              />
            </v-col>
            <v-col cols="6">
              <label class="mb-1 fld-lbl">Frequency</label>
              <v-select
                v-model="form.defaultFrequency"
                :items="frequencies"
                item-title="name"
                item-value="name"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
              />
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Priority</label>
              <v-select
                v-model="form.priorityId"
                :items="taskPriorities"
                item-title="name"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                item-color="color"
                bg-color="white"
                flat
              >
              </v-select>
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Description</label>
              <v-textarea
                v-model="form.description"
                variant="solo"
                density="compact"
                bg-color="white"
                class="mb-1 input-bordered"
                flat
              />
            </v-col>
            <v-col cols="12">
              <v-card :elevation="0" rounded="lg" class="border-sm px-2 pb-2">
                <v-card-title class="border-b py-3 checklist"
                  >Add Custom Questions</v-card-title
                >
                <TasksCreateChecklist
                  v-for="(cl, index) in form.checklist"
                  :checklist="cl"
                  :key="index"
                />
                <v-btn
                  @click="addNewChecklist"
                  class="w-100 justify-center add-qs-btn"
                  variant="outlined"
                  flat
                >
                  <v-icon
                    start
                    class="me-2"
                    color="primary"
                    style="
                      border: 1px solid currentColor;
                      border-radius: 50%;
                      padding: 4px;
                    "
                  >
                    mdi-plus
                  </v-icon>
                  Add More Questions
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <!-- Footer -->
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
const menu = ref(false);
const emit = defineEmits(["close", "success"]);
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
const rolesList = ref([]);
const userList = ref([]);
const users = ref([])
const frequencies = ref([
  { id: 1, name: "Daily" },
  { id: 2, name: "Weekly" },
  { id: 3, name: "Monthly" },
]);
const taskCategories = ref([]);

watch(form.value, (newVal) => {
  if (newVal.roleId) {
    userList.value = users.value.filter((x) => x.roleId === newVal.roleId);
  }
});
const getRoles = () => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data;
      }
    })
    .catch((err) => {
      return err;
    });
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
const getCategories = () => {
  taskStore.listCategories().then((res) => {
    if (res.code === 0) {
      taskCategories.value = res.data;
    }
  });
};
const getUsers = () => {
  userStore.getUserList({ roleId: null }).then((res) => {
    if (res.code === 0) users.value = res.data;
  });
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

const modelValueRef = toRef(() => modelValue);
watch(
  modelValueRef,
  (newValue) => {
    if (newValue) {
      getRoles();
      getUsers();
      getTaskPriorities();
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
    const unfilledChecklist = form.value.checklist.findIndex(
      (x) => !x.question
    );
    if (unfilledChecklist >= 0) {
      form.value.checklist.splice(unfilledChecklist, 1);
    }
    taskStore
      .addNewTask(form.value)
      .then((res) => {
        if (res.code === 0) {
          emit("success");
          setSnack("success", "Task Added Successfully");
        } else {
          setSnack("error", res.message || res.data.message);
        }
      })
      .catch((err) => {
        setSnack("error", err.message);
        return err;
      });
  }
};
function deleteItem() {
  item.value = {};
}

const setSnack = (type, title) => {
  mainStore.setSnackbar({
    type,
    title,
  });
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
</style>
