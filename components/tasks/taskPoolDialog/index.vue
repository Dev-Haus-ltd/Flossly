<template>
  <v-dialog :model-value="props.modelValue" max-width="1500px" persistent>
    <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
      <!-- Header -->
      <div class="pa-4 d-flex justify-space-between align-center">
        <h3 class="title m-0">Task pool</h3>
        <div class="d-flex align-center">
          <v-btn flat icon size="32" class="ml-2" @click="$emit('close')">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Content -->
      <div
        class="flex-grow-1 px-4 py-2"
        style="overflow-y: auto;"
      >
        <v-tabs v-model="tab" class="custom-tabs px-4" slider-color="primary">
          <v-tab
            v-for="category in categoryList.filter((x) => !x.parentId)"
            :key="category.id"
            :value="category.id"
            class="tab-text"
          >
            {{ category.name }}
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item :value="tab">
            <div>
              <v-text-field
              v-if="subCategoryView"
              v-model="searchSubCategory"
              placeholder="Search"
              append-inner-icon="mdi-magnify"
              variant="solo"
              density="compact"
              hide-details
              flat
              class="input-bordered mt-5 mr-8 ml-auto"
              width="300"
            />
              <v-row v-if="subCategoryView" class="mx-5 mt-2" align="stretch">
                <v-col
                  v-for="(card, index) in subCategories?.filter((x) => x?.name?.toLowerCase().includes(searchSubCategory))"
                  :key="index"
                  cols="12"
                  sm="6" 
                  md="3"
                >
                  <TasksTaskPoolDialogTaskCards 
                    :title="card.name"
                    :description="card.description"
                    :count="card.taskCount"
                    @click="fetchGeneralTasks(card)"
                  />
                </v-col>
              </v-row>
              <v-card
                v-else
                class="rounded-xl ma-5"
                border
                style="border-color: rgba(var(--v-theme-on-surface), 0.12)"
                :elevation="0"
              >
                <v-card-title
                  class="px-2 py-4"
                  v-if="subCategories.length"
                  style="
                    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
                  "
                >
             
                  <div class="d-flex align-center">
                    <v-icon
                      @click="subCategoryView = true"
                      size="24"
                      class="mr-3"
                      >mdi-arrow-left</v-icon
                    >
                    <p style="font-size: 16px">{{ selectedSubCategory.name }}</p>
                  </div>
                </v-card-title>
                <v-text-field
              v-model="search"
              placeholder="Search"
              append-inner-icon="mdi-magnify"
              variant="solo"
              density="compact"
              hide-details
              flat
              class="input-bordered ma-2 ml-auto"
              width="300"
            />
                <v-list v-if="tasks.length" class="pa-0">
                  <div class="checklist-row has-border">
                    <div class="table-cell checkbox-cell">
                      <v-checkbox
                        v-model="selectAll"
                        hide-details
                        density="compact"
                        class="ma-0 pa-0"
                        @change="toggleAll"
                        color="primary"
                      />
                    </div>
                    <div class="table-cell title-cell font-weight-bold">
                      Tasks
                    </div>
                  </div>
                  <TasksTaskPoolDialogTaskRow
                    v-for="item in tasks.filter((x) => x?.title?.toLowerCase().includes(search))"
                    :key="item.id"
                    :id="item.id"
                    :title="item.title"
                    v-model:checked="item.checked"
                 @checked="(data) => handleCheck( data)"
                  />
                </v-list>
                <h3 v-else class="ma-6">No Tasks Found.</h3>
              </v-card>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>

      <!-- Footer -->
      <div
        class="d-flex justify-end pa-6"
        style="border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12)"
      >
        <v-btn
          color="primary"
          flat
          rounded="lg"
          class="px-7"
          style="height: 44px"
          @click="addTaskToBoard"
        >
          <v-icon start>mdi-plus-circle-outline</v-icon>
          Add to board
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
const taskStore = useTaskStore();
const mainStore = useMainStore();
const tab = ref(0);
const tasks = ref([]);
const categoryList = ref([]);
const subCategories = ref();
const subCategoryView = ref(true);
const selectedTasks = ref([]);
const selectedSubCategory = ref(null);
const search = ref("");
const searchSubCategory = ref("")
const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["onUpdate"]);
const fetchGeneralTasks = (category) => {
  selectedSubCategory.value = category;
  taskStore
    .generalTasks({ categoryId: category.id })
    .then((res) => {
      if (res.code === 0) {
        subCategoryView.value = false;
        tasks.value = res.data;
      } else {
        mainStore.setSnackbar({
          title: res.data.message || res.message,
          type: "Error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message,
        type: "Error",
      });
    });
};
const fetchListCategories = () => {
  taskStore
    .listCategoriesForPool()
    .then((res) => {
      if (res.code === 0) {
        categoryList.value = res.data;
        const firstCat = categoryList.value[0];
        const firstCatSubCat = categoryList.value.filter(
          (x) => x.parentId === firstCat.id
        );
        if (firstCatSubCat.length) {
          subCategories.value = firstCatSubCat;
          subCategoryView.value = true;
        } else {
          fetchGeneralTasks(categoryList.value[0]);
        }
      } else {
        mainStore.setSnackbar({
          title: res.data.message || res.message,
          type: "Error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message,
        type: "Error",
      });
    });
};
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      fetchListCategories();
    }
  }
);
watch(tab, async (newId) => {
  if (newId) {
    subCategories.value = categoryList.value.filter(
      (x) => x.parentId === newId
    );
    if (subCategories.value.length) {
      subCategoryView.value = true;
    } else {
      subCategories.value = [];
      subCategoryView.value = true;
      const category = categoryList.value.find((x) => x.id === newId);
      fetchGeneralTasks(category);
    }
  }
});
const addTaskToBoard = async () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  const user = JSON.parse(userStr);
  try {
    const res = await taskStore.assignTask({
      userId: user.id,
      tasks: selectedTasks.value,
    });

    if (res.code === 0) {
      emit("onUpdate");
      mainStore.setSnackbar({
        title: "Task assigned successfully",
        type: "success",
      });
    } else {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Task assigned failed",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};

const handleCheck = ( data ) => {
  const task = tasks.value.find((task) => task.id === data.id);
  if (!task) return;
  if (data.checked) {
    if (!selectedTasks.value.some((t) => t.id === data.id)) {
      selectedTasks.value.push(task);
    }
  } else {
    selectedTasks.value = selectedTasks.value.filter((t) => t.id !== data.id);
  }
};

const selectAll = computed({
  get: () => tasks.value.every((i) => i.checked),
  set: (val) => {
    tasks.value.forEach((i) => (i.checked = val));
  },
});

function toggleAll() {
  const value = selectAll.value;
  tasks.value.forEach((i) => (i.checked = value));
}

function goBack() {
  // Handle back navigation
}
</script>

<style scoped>
.title {
  
  font-weight: 600;
  font-size: 16px;
}
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.custom-tabs .v-tab {
  color: inherit !important;
}
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
.checklist-row {
  display: flex;
  min-height: 48px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.checklist-row.has-border {
  border-bottom: 1px solid #e0e0e0;
}

.checklist-row:hover {
  background-color: #f5f5f5;
}

.table-cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.checkbox-cell {
  width: 60px;
  justify-content: center;
  border-right: 1px solid #e0e0e0;

}

.title-cell {
  flex: 1;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
