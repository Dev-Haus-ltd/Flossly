<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="handleModelValueUpdate"
    location="right"
    temporary
    :width="600"
  >
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text"> Add New Category </v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        variant="outlined"
        color="#8B8B8B"
        @click="onClose"
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
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Category Title</label>
              <v-text-field
                v-model="form.name"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                :rules="requiredRule"
                required
                flat
              />
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Description</label>
              <v-text-field
                v-model="form.description"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
              />
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Parent Category</label>
              <v-select
                v-model="form.parentId"
                :items="mainCategories"
                item-title="name"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
              />
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl"> Color </label>
              <v-text-field
              
                density="compact"
                variant="solo"
                hide-details
                class="w-100 input-bordered"
                flat
              >
                <template #prepend-inner>
                  <CommonColorPickerInput :item="form" />
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>
    <div
      class="d-flex justify-space-between align-center px-4 py-2"
      style="background-color: white; height: 64px"
    >
      <v-btn
        color="white"
        class="text-primary"
        style="width: 48%; border-radius: 8px; border: 1px solid #dfdfdf"
        @click="onClose"
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
const { modelValue, categories } = defineProps({
  modelValue: Boolean,
  categories: Array,
});
const mainStore = useMainStore();
const taskStore = useTaskStore();
const mainCategories = ref([]);
const formRef = ref(null);
const emit = defineEmits(["close", "success", "update:modelValue"]);
const requiredRule = [(v) => !!v || "This field is required"];
const form = ref({
  name: "",
  description: "",
  parentId: null,
  color: "",
});
const modelValueRef = toRef(() => modelValue);
watch(
  modelValueRef,
  (newValue) => {
    if (newValue) {
      mainCategories.value = categories.filter((x) => !x.parentId);
      // Reset form when opening
      form.value = {
        name: "",
        description: "",
        parentId: null,
        color: "",
      };
      // Reset form validation
      nextTick(() => {
        if (formRef.value) {
          formRef.value.reset();
          formRef.value.resetValidation();
        }
      });
    }
  },
  { immediate: true }
);
const onSubmit = async () => {
  const formValidation = await formRef.value.validate();
  if (formValidation.valid) {
    taskStore
      .addCategory(form.value)
      .then((res) => {
        if (res.code === 0) {
          form.value = {
            name: "",
            description: "",
            parentId: null,
            color: "",
          };
          // Reset form validation
          if (formRef.value) {
            formRef.value.reset();
            formRef.value.resetValidation();
          }
          //set snack
          emit("close");
          emit("update:modelValue", false);
          emit("success");
        } else {
          mainStore.setSnackbar({
    type: 'Error',
    title: res.data.message || res.data,
  });
        }
      })
      .catch((err) => {
        return err;
      });
  }
};
const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    parentId: null,
    color: "",
  };
  // Reset form validation
  if (formRef.value) {
    formRef.value.reset();
    formRef.value.resetValidation();
  }
};

const handleModelValueUpdate = (value) => {
  // When drawer is being closed (either via close button or outside click)
  if (!value && modelValue) {
    // Only reset if we're transitioning from open to closed
    resetForm();
    emit("close");
  }
  emit("update:modelValue", value);
};

const onClose = () => {
  // Close the drawer by updating model value
  // This will trigger handleModelValueUpdate which will reset the form
  emit("update:modelValue", false);
};
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
