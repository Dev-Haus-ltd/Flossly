<template>
  <v-dialog v-model="isOpen" max-width="500px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-family: Poppins;
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Recommend a Practice
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

      <!-- Text Fields -->
      <v-card-text class="mt-4 d-flex flex-column">
        <!-- Company Name -->
        <div>
          <v-label class="mb-1 field-label">Practice Name</v-label>
          <v-text-field
            v-model="organisation.practiceName"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <div>
          <v-label class="mb-1 field-label">Manager Name</v-label>
          <v-text-field
            v-model="organisation.managerName"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Email -->
        <div class="mt-3">
          <v-label class="mb-1 field-label">Manager Email Address</v-label>
          <v-text-field
            v-model="organisation.managerEmail"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Phone -->
        <div class="mt-3">
          <v-label class="mb-1 field-label">Phone Number</v-label>
          <v-text-field
            v-model="organisation.contact"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>
        <!-- Address -->
        <div class="mt-3">
          <v-label class="mb-1 field-label">Address</v-label>
          <v-text-field
            v-model="organisation.address"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          text
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="submit"
          style="font-weight: 500; text-transform: none"
          variant="flat"
          class="px-4"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
const { user } = useUser();

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "onSubmit"]);
const mainStore = useMainStore();
const isOpen = ref(props.modelValue);
const pointStore = usePointStore();
const organisation = ref({
  practiceName: "",
  managerName: "",
  managerEmail: "",
  contact: "",
  address: "",
});

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
  organisation.value = {
    practiceName: "",
    managerName: "",
    managerEmail: "",
    contact: "",
    address: "",
  };
};

const submit = () => {
  if (!organisation.value.practiceName || !organisation.value.managerEmail)
    return;

  pointStore
    .referPractice(organisation.value)
    .then((res) => {
    
      if (res.code === 0) {
        if (user.value.id) {
        // Add 50 points
        user.value.userPoints.balance =
          (user.value.userPoints?.balance ?? 0) + 2000;

        // Optionally also update `totalPointsRewarded`
        user.value.userPoints.totalPointsRewarded =
          (user.value.userPoints?.totalPointsRewarded ?? 0) + 2000;

        // Save updated object back to localStorage
        localStorage.setItem("user", JSON.stringify(user));
      }
        mainStore.setSnackbar({
          title: res?.data?.message || "Practice referred successfully",
          type: "success",
        });

        const data = { ...organisation.value };
        emit("onSubmit", data);
        close();
      } else {
        mainStore.setSnackbar({
          title:
            res?.data?.message || res?.message || "Failed to refer practice",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err?.message || "Something went wrong",
        type: "error",
      });
    });
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
.field-label {
  font-family: "Poppins", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1e1e1e;
  display: block;
}
</style>
