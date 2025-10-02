<template>
  <v-dialog v-model="isOpen" max-width="500px" class="rounded-lg">
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
        Feedback Submission
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
        <!-- Full Name -->
        <div>
          <v-label class="mb-1 field-label">Full Name</v-label>
          <v-text-field
            v-model="name"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Email -->
        <div class="mt-3">
          <v-label class="mb-1 field-label">Email Address</v-label>
          <v-text-field
            v-model="email"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
          />
        </div>

        <!-- Message -->
        <div class="mt-3">
          <v-label class="mb-1 field-label">Your Message</v-label>
          <v-textarea
            v-model="message"
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered"
            flat
            rows="4"
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
const mainStore = useMainStore();
const pointStore = usePointStore();
const emit = defineEmits(["update:modelValue", "onSubmit"]);

const isOpen = ref(props.modelValue);
const name = ref("");
const email = ref("");
const message = ref("");

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
  name.value = "";
  email.value = "";
  message.value = "";
};

const submit = async () => {
  if (!name.value || !email.value || !message.value) return;

  const data = {
    name: name.value,
    email: email.value,
    message: message.value,
  };

  try {
    const res = await pointStore.feedback(data);

    if (res.code === 0) {
      if (user.value.id) {
        // Add 50 points
        user.value.userPoints.balance =
          (user.value.userPoints?.balance ?? 0) + 50;

        // Optionally also update `totalPointsRewarded`
        user.value.userPoints.totalPointsRewarded =
          (user.value.userPoints?.totalPointsRewarded ?? 0) + 50;

        // Save updated object back to localStorage
        localStorage.setItem("user", JSON.stringify(user));
      }

      mainStore.setSnackbar({
        title: res?.data?.message || "Feedback submitted successfully",
        type: "success",
      });

      emit("onSubmit", data);
      close();
    } else {
      mainStore.setSnackbar({
        title:
          res?.data?.message || res?.message || "Failed to submit feedback",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err?.message || "Something went wrong",
      type: "error",
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
.field-label {
  
  font-size: 13px;
  font-weight: 500;
  color: #1e1e1e;
  display: block;
}
</style>
