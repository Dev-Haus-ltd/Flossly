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
        Add folder
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

      <!-- Text Field -->
      <v-card-text class="mt-2">
        <v-text-field
          v-model="name"
          placeholder="Enter name"
          hide-details
          variant="solo"
          density="compact"
          class="input-bordered"
          flat
        />
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          variant="flat"
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="save"
          style="font-weight: 500; text-transform: none"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { getRandomHexColor } from "~/lib/misc";

const props = defineProps({
  modelValue: Boolean,
  parentId: {
    type: Number,
    default: null,
  },
});
const mainStore = useMainStore();
const docStore = useDocStore();

const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);
const name = ref("");

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
  name.value = "";
};

const save = () => {
  const data = {
    name: name.value,
    color: getRandomHexColor(),
    description: "",
    parentId: props.parentId || null,
  };
  docStore
    .craeteFolder(data)
    .then((res) => {
      if (res.code === 0) {
        name.value = "";
        emit("update:modelValue", false);
        emit("onUpdate");
        mainStore.setSnackbar({
          title: "Folder created successfully",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res.data?.message || res.message || "Unable to create folder. Please try again.",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message || "An unexpected error occurred. Please try again later.",
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
  
}
</style>
