<template>
  <v-dialog v-model="isOpen" max-width="600px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
          padding-left: 24px;
          padding-bottom: 4px;
        "
      >
        Manage Rota Users
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

      <!-- Radio Switch -->
      <v-card-text>
        <v-radio-group v-model="mode" inline>
          <v-radio label="Add/Remove employees from rota" value="employee" />
          <v-radio label="Add locum staff" value="locum" />
        </v-radio-group>

        <!-- Employee form -->
        <v-form v-if="mode === 'employee'" ref="formRef" v-model="isValid">
          <TeamFlossRotaManagementEmployeeSelect
            v-model="localSelectedUsers"
            :employees="employees"
            :rules="[rules.required]"
          />
        </v-form>

        <!-- Locum form -->
        <v-form v-else ref="formRef" v-model="isValid">
          <label class="fld-lbl">Name</label>
          <v-text-field
            v-model="form.name"
            variant="solo"
            density="compact"
            :rules="[rules.required]"
            class="input-bordered"
            flat
          />

          <label class="fld-lbl">Role</label>
          <v-select
            v-model="form.roleId"
            :items="rolesList"
            item-title="title"
            item-value="id"
            variant="solo"
            density="compact"
            class="input-bordered"
            :rules="[rules.required]"
            bg-color="white"
            flat
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
  rota: { type: Object },
  rolesList: { type: Array, required: true },
});

const emit = defineEmits(["update:modelValue", "onAddUser"]);

const isOpen = ref(props.modelValue);
const localSelectedUsers = ref([]);
const mainStore = useMainStore();
const rotaStore = useRotaStore();
const formRef = ref(null);
const isValid = ref(false);

// which form is active
const mode = ref("employee");

// form data for locum
const form = reactive({
  name: "",
  roleId: null,
});

const rules = {
  required: (v) =>
    (Array.isArray(v) ? v.length > 0 : !!v) || "This field is required",
};

// sync dialog state
watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
    // Reset form and initialize selected users when dialog opens
    if (val) {
      // Filter out any invalid values (null, undefined) and ensure we have valid IDs
      const validUsers = (props.selectedUsers || []).filter(
        (id) => id != null && id !== undefined
      );
      localSelectedUsers.value = [...validUsers];
      // Reset mode to employee when dialog opens
      mode.value = "employee";
      // Reset locum form
      form.name = "";
      form.roleId = null;
    }
  }
);
watch(isOpen, (val) => emit("update:modelValue", val));

watch(
  () => props.selectedUsers,
  (val) => {
    // Only update if dialog is open and we have valid user IDs
    if (isOpen.value && val) {
      const validUsers = val.filter((id) => id != null && id !== undefined);
      localSelectedUsers.value = [...validUsers];
    }
  },
  { deep: true }
);

const close = () => {
  isOpen.value = false;
};

const save = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    let res;

    if (mode.value === "employee") {
      // Employee flow
      const rotaUsers = localSelectedUsers.value.map((el) => {
        return { userId: el };
      });
      res = await rotaStore.addRotaUsers({
        rotaId: props.rota.id,
        users: rotaUsers,
      });
    } else {
      // Locum flow - preserve existing employees when adding locum
      const existingEmployees = props.selectedUsers || [];
      const employeeUsers = existingEmployees
        .filter((id) => id != null && id !== undefined)
        .map((userId) => ({ userId }));
      
      const payload = {
        rotaId: props?.rota?.id,
        users: [
          ...employeeUsers, // Preserve existing employees
          {
            isTempUser: true,
            tempUserName: form.name,
            tempUserRoleId: form.roleId,
          },
        ],
      };
      res = await rotaStore.addRotaUsers(payload);
    }

    if (res.code === 0) {
      mainStore.setSnackbar({
        type: "success",
        title:
          res?.message ||
          res?.data?.message ||
          (mode.value === "employee"
            ? "Users updated successfully"
            : "Locum staff added successfully"),
      });
      emit("onAddUser");
      close();
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res.message || res?.data?.message || "Something went wrong",
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

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
.fld-lbl {
  
  font-weight: 400;
  font-size: 14px;
  margin-left: 5px;
  color: #737373;
}
</style>
