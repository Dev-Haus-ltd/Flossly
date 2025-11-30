<!-- Add Group Dialog Component -->
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
        "
      >
        Add Group
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

      <!-- Group Form -->
      <v-card-text class="group-form">
        <!-- Name -->
        <div class="form-group">
          <label class="field-label">Name</label>
          <v-text-field
            v-model="group.name"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="field-label">Description</label>
          <v-text-field
            v-model="group.description"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Users -->
        <div class="form-group">
          <label class="field-label">Users</label>
          <v-select
            v-model="group.userIds"
            hide-details
            multiple
            item-title="fullName"
            item-value="id"
            :items="usersList"
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end pa-4">
        <v-btn text @click="close" variant="text">
          Cancel
        </v-btn>
        <v-btn color="primary" @click="save" variant="flat">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  users: Array,
});

const orgStore = useOrgStore();
const mainStore = useMainStore();
const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);
const usersList = ref([]);
const group = ref({
  name: "",
  description: "",
  userIds: [],
});

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
    usersList.value = props.users;
  }
);

watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
};

const save = () => {
  if (!group.value.name || !group.value.userIds.length) return;

  orgStore.addGroup(group.value).then((res) => {
    if (res.code === 0) {
      mainStore.setSnackbar({
        title: "Group added successfully",
        type: "success",
      });
      emit("update:modelValue", false);
      emit("onUpdate");
      // Reset form
      group.value = {
        name: "",
        description: "",
        userIds: [],
      };
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to add Group",
        type: "error",
      });
    }
  });
};
</script>

<style scoped>
.group-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #737373;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

/* Responsive padding for small screens */
@media (max-width: 600px) {
  .group-form {
    gap: 0.75rem;
  }

  .form-group {
    gap: 0.4rem;
  }
}
</style>