<template>
  <v-dialog v-model="isOpen" max-width="600px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-family: Poppins;
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
          padding-left: 24px;
          padding-bottom: 4px;
        "
      >
        Assigned to
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Form -->
      <v-card-text>
        <v-form ref="formRef" v-model="isValid">
          <TeamFlossRotaManagementEmployeeSelect
            v-model="localSelectedUsers"
            :employees="employees"
            :rules="[rules.required]"
          />
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions
        class="justify-end px-5"
        style="border-top: 1px solid #dbdbdb"
      >
        <v-btn text @click="close" variant="text">Cancel</v-btn>
        <v-btn color="primary" @click="save" variant="flat">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  employees: { type: Array, required: true },
  selectedUsers: { type: Array, default: () => [] },
  course: { type: Object },
});

const emit = defineEmits(["update:modelValue", "onAddUser"]);

const isOpen = ref(props.modelValue);
const localSelectedUsers = ref([...props.selectedUsers]);
const mainStore = useMainStore();
const cpdStore = useCpdStore();
const formRef = ref(null);
const isValid = ref(false);

const rules = {
  required: (v) =>
    (Array.isArray(v) ? v.length > 0 : !!v) || "This field is required",
};

// sync dialog state
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

// sync selected users
watch(
  () => props.selectedUsers,
  (val) => (localSelectedUsers.value = [...val]),
  { deep: true }
);

const close = () => {
  isOpen.value = false;
};

const save = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    // const Users = localSelectedUsers.value.map((el) => {
    //   return { userId: el };
    // });
    const res = await cpdStore.assignCourseToUser({
      courseId: props.course.id,
      userId: localSelectedUsers.value[0],
    });
    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title:
          res.data?.message || res?.message || "Course assigned successfully",
      });

      close();
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res?.data?.message || res?.message || "Something went wrong",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "An error occurred",
    });
  }
};
</script>
