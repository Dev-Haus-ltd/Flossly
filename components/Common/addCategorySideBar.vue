<!-- CommonAddCategorySideBar.vue -->
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="handleModelValueUpdate"
    location="right"
    temporary
    :width="600"
  >
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text">
        {{ drawerTitle }}
      </v-toolbar-title>
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
                :disabled="isSystemCategory"
                :hint="isSystemCategory ? 'System category names cannot be changed' : ''"
                persistent-hint
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
                clearable
                :disabled="isSystemCategory"
              />
            </v-col>

            <v-col cols="12">
              <label class="mb-1 fld-lbl">Color</label>
              <div class="color-swatches">
                <button
                  v-for="color in defaultColors"
                  :key="color"
                  type="button"
                  class="color-swatch"
                  :class="{ 'is-selected': form.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="form.color = color"
                />
              </div>
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
        {{ isEditMode ? "Update" : "Save" }}
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  categories: Array,
  editCategory: {
    type: Object,
    default: null,
  },
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
const defaultColors = [
  "#7e22ce",
  "#a855f7",
  "#d946ef",
  "#1e40af",
  "#1d4ed8",
  "#14b8a6",
  "#a3a600",
  "#65a30d",
  "#f59e0b",
  "#f97316",
  "#dc2626",
];

const modelValueRef = toRef(props, "modelValue");
const editCategoryRef = toRef(props, "editCategory");
const isEditMode = computed(() => !!editCategoryRef.value);
const isSystemCategory = computed(() => editCategoryRef.value?.organisationId === null);
const drawerTitle = computed(() =>
  isEditMode.value ? "Edit Category" : "Add New Category"
);

const populateForm = (category = null) => {
  const source = category || editCategoryRef.value;
  form.value = {
    id: source?.id || null,
    name: source?.name || "",
    description: source?.description || "",
    parentId: source?.parentId || null,
    color: source?.color || defaultColors[0],
  };
  if (formRef.value) {
    formRef.value.resetValidation();
  }
    
};

watch(
  modelValueRef,
  (newValue) => {
    if (newValue) {
        const list = props.categories || [];
        const currentId = editCategoryRef.value?.id;
        mainCategories.value = list.filter((x) => !x.parentId && x.id !== currentId);
      resetForm();
    }
  },
  { immediate: true }
);

watch(
  editCategoryRef,
  (updated) => {
    if (modelValueRef.value && updated) {
      populateForm(updated);
    }
  },
  { deep: true }
);

const onSubmit = async () => {
  const formValidation = await formRef.value.validate();
  if (formValidation.valid) {
    const payload = { ...form.value };
    if (isEditMode.value && editCategoryRef.value?.id) {
      payload.id = editCategoryRef.value.id;
    }

    taskStore
      .addCategory(payload)
      .then((res) => {
        if (res.code === 0) {
          // Extract the newly created category from API response
          const newCategory = res.data.category;

          // Emit the new category data to parent component
          emit("success", newCategory);

          // Reset form
          resetForm();

          // Close drawer
          emit("update:modelValue", false);
          emit("close");

          // Show success message
          mainStore.setSnackbar({
            type: "success",
            title: isEditMode.value
              ? "Category updated successfully"
              : "Category created successfully",
          });
        } else {
          mainStore.setSnackbar({
            type: "error",
            title: res.data?.message || res.message || "Failed to create category",
          });
        }
      })
      .catch((err) => {
        mainStore.setSnackbar({
          type: "error",
          title: err.message || "An error occurred while creating category",
        });
      });
  }
};

const resetForm = () => {
  populateForm();
};

const handleModelValueUpdate = (value) => {
  if (!value && props.modelValue) {
    resetForm();
    emit("close");
  }
  emit("update:modelValue", value);
};

const onClose = () => {
  emit("update:modelValue", false);
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
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 4px;
}
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.color-swatch.is-selected {
  border-color: #DFDFDF;
}
</style>
