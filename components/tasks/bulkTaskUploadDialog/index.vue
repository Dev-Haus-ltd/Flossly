<template>
  <v-dialog v-model="isOpen" max-width="700px" class="rounded-lg">
    <v-card>
      <!-- Header -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Upload Tasks File
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Upload area -->
      <div class="pa-5">
        <CommonFileUpload
          @onFiles="getFiles"
          :isSingle="true"
          ref="fileUploader"
        />
      </div>

      <!-- Uploaded files preview -->
      <div v-if="uploadedFiles.length" class="pa-5">
        <v-row>
          <v-col
            v-for="(file, index) in uploadedFiles"
            :key="index"
            cols="12"
            sm="6"
            md="6"
          >
            <DocsMyDocsRecentlyAccessed
              class="mb-2"
              :file="file"
              :folder="null"
              :isExcel="true"
            />
          </v-col>
        </v-row>
      </div>
      <div v-if="excelError" class="text-red ml-6" style="font-size: 14px">
        {{ excelError }}
      </div>
      <!-- Footer actions -->
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
          @click="uploadTasks"
          style="font-weight: 500; text-transform: none"
        >
          Upload Tasks
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import * as XLSX from "xlsx";

const props = defineProps({
  modelValue: Boolean,
  categories: Array,
  priorities: Array,
  roles: Array,
  users: Array,
});

const emit = defineEmits(["update:modelValue","onUpdate"]);
const excelError = ref(null);
const isOpen = ref(props.modelValue);
const uploadedFiles = ref([]);
const fileUploader = ref(null);
const taskStore = useTaskStore();
const mainStore = useMainStore();
// Sync prop with local state
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

// Get uploaded files
const getFiles = (files) => {
  excelError.value = null; // reset each time
  uploadedFiles.value = files;
};

const uploadTasks = async () => {
  excelError.value = null; // reset each time

  if (!uploadedFiles.value.length) {
    console.warn("⚠️ No file uploaded.");
    excelError.value = "No Excel file uploaded.";
    return;
  }

  const file = uploadedFiles.value[0]; // assuming single file
  console.log("Reading:", file.name);

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Check workbook validity
      if (!workbook.SheetNames?.length) {
        excelError.value = "Invalid Excel file — no sheets found.";
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Validate required columns (added "user")
      const requiredColumns = [
        "frequency",
        "description",
        "title",
        "category",
        "priority",
        "role",
        "user",
      ];
      const hasRequiredColumns = requiredColumns.every((col) =>
        Object.keys(json[0] || {}).includes(col)
      );

      if (!hasRequiredColumns) {
        excelError.value =
          "Invalid Excel structure — missing required columns.";
        return;
      }

      // ✅ Map Excel rows to app format
      const formatted = json.map((row) => ({
        defaultFrequency: row["frequency"] ?? "",
        description: row["description"] ?? "",
        title: row["title"] ?? "",
        categoryId:
          props.categories?.find(
            (c) =>
              c.name?.trim()?.toLowerCase() ===
              row["category"]?.trim()?.toLowerCase()
          )?.id ?? null,
        priorityId:
          props.priorities?.find(
            (p) =>
              p.name?.trim()?.toLowerCase() ===
              row["priority"]?.trim()?.toLowerCase()
          )?.id ?? null,
        roleId:
          props.roles?.find(
            (r) =>
              r.title?.trim()?.toLowerCase() ===
              row["role"]?.trim()?.toLowerCase()
          )?.id ?? null,
        userId:
          props.users?.find(
            (u) =>
              u.fullName?.trim()?.toLowerCase() ===
              row["user"]?.trim()?.toLowerCase()
          )?.id ?? null,
      }));

      console.log("✅ Parsed and Mapped Tasks JSON:", formatted);
      if (formatted.length) {
        uploadBulkTask(formatted);
      }
    } catch (err) {
      console.error("❌ Error reading Excel file:", err);
      excelError.value = "Error reading Excel file — please check the format.";
    }
  };

  reader.readAsArrayBuffer(file);
};
const uploadBulkTask = async (tasks) => {
  if (!Array.isArray(tasks) || !tasks.length) {
    console.warn("⚠️ No tasks to upload.");
    mainStore.setSnackbar({
      type: "Error",
      title: "No tasks to upload.",
    });
    return;
  }

  console.log(`📦 Uploading ${tasks.length} tasks...`);
  const results = [];

  for (const [index, task] of tasks.entries()) {
    try {
      console.log(
        `🚀 Uploading task ${index + 1}/${tasks.length}:`,
        task.title
      );

      const res = await taskStore.addNewTask(task);

      if (res.code === 0) {
        mainStore.setSnackbar({
          type: "Success",
          title: `Task ${index + 1}: Added successfully`,
        });
        results.push({ task, status: "success" });
      } else {
        mainStore.setSnackbar({
          type: "Error",
          title: res.data?.message || res.message || "Unknown error",
        });
        results.push({
          task,
          status: "failed",
          message: res.data?.message || res.message,
        });
      }
    } catch (err) {
      console.error(`❌ Error uploading task ${index + 1}:`, err);
      mainStore.setSnackbar({
        type: "Error",
        title: err.message || "Task upload failed",
      });
      results.push({ task, status: "error", message: err.message });
    }
  }

  console.log("📊 Bulk upload completed:", results);

  // Optional: summary snackbar
  const successCount = results.filter((r) => r.status === "success").length;
  const failCount = results.length - successCount;

  if (successCount && !failCount) {
    mainStore.setSnackbar({
      type: "Success",
      title: `All ${successCount} tasks uploaded successfully`,
    });
    emit("onUpdate");
    close();
  } else if (successCount && failCount) {
    mainStore.setSnackbar({
      type: "Warning",
      title: `${successCount} tasks uploaded, ${failCount} failed`,
    });
    emit("onUpdate");
  } else {
    mainStore.setSnackbar({
      type: "Error",
      title: "All task uploads failed",
    });

  }

  return results;
};

// Close dialog and reset
const close = () => {
  fileUploader.value?.clearFiles?.();
  uploadedFiles.value = [];
  isOpen.value = false;
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>
