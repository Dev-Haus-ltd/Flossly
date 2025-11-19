<template>
  <v-dialog v-model="isOpen" max-width="900px" class="rounded-lg">
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

      <!-- Upload area (hidden when file is uploaded or processed) -->
      <div v-if="!uploadedFiles.length && !parsedTasks.length" class="pa-5">
        <CommonFileUpload
          @onFiles="getFiles"
          :isSingle="true"
          ref="fileUploader"
          :acceptedFormats="'.xlsx,.xls,.csv'"
        />
      </div>

      <!-- Uploaded File Preview (before processing) -->
      <div v-if="uploadedFiles.length && !isProcessing && !parsedTasks.length" class="pa-5">
        <div class="file-preview-card">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center" style="flex: 1">
              <v-icon size="40" color="primary" class="mr-3">
                {{ getFileIcon(uploadedFiles[0].name) }}
              </v-icon>
              <div>
                <div style="font-weight: 600; font-size: 14px">
                  {{ uploadedFiles[0].name }}
                </div>
                <div style="font-size: 12px; color: #737373">
                  {{ formatFileSize(uploadedFiles[0].size) }}
                </div>
              </div>
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="removeUploadedFile"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isProcessing" class="pa-10 text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4" style="font-size: 14px; color: #737373">
          Processing file...
        </div>
      </div>

      <!-- Excel Table Preview -->
      <div v-if="parsedTasks.length && !isProcessing" class="pa-5">
        <div class="d-flex align-center justify-space-between mb-3">
          <div style="font-weight: 600; font-size: 14px">
            Preview: {{ parsedTasks.length }} tasks found
          </div>
          <v-btn
            size="small"
            variant="text"
            color="error"
            @click="clearParsedData"
          >
            <v-icon left>mdi-delete</v-icon>
            Clear
          </v-btn>
        </div>

        <!-- Validation Summary -->
        <div v-if="validationErrors.length" class="mb-3">
          <v-alert type="warning" variant="tonal" density="compact">
            <div style="font-size: 13px">
              <strong>{{ validationErrors.length }} issues found:</strong>
              <ul class="ml-4 mt-1">
                <li v-for="(error, idx) in validationErrors.slice(0, 5)" :key="idx">
                  {{ error }}
                </li>
                <li v-if="validationErrors.length > 5">
                  ...and {{ validationErrors.length - 5 }} more
                </li>
              </ul>
            </div>
          </v-alert>
        </div>

        <!-- Excel Table -->
        <div style="overflow-x: auto; max-height: 400px; overflow-y: auto">
          <table class="excel-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Description</th>
                <th>Frequency</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Role</th>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(task, index) in parsedTasks"
                :key="index"
                :class="{ 'row-error': task.hasErrors }"
              >
                <td>{{ index + 1 }}</td>

                <!-- Title -->
                <td :class="{ 'cell-error': task.errors?.title }">
                  <div class="relative">
                    <v-text-field
                      v-model="task.title"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateTask(index)"
                    ></v-text-field>
                    <v-tooltip v-show="task.errors?.title" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.title }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Description -->
                <td :class="{ 'cell-error': task.errors?.description }">
                  <div class="relative">
                    <v-text-field
                      v-model="task.description"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateTask(index)"
                    ></v-text-field>
                    <v-tooltip v-show="task.errors?.description" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.description }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Frequency -->
                <td :class="{ 'cell-error': task.errors?.frequency }">
                  <div class="relative">
                    <v-select
                      v-model="task.defaultFrequency"
                      :items="frequencies"
                      item-title="name"
                      item-value="name"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="validateTask(index)"
                    ></v-select>
                    <v-tooltip v-show="task.errors?.frequency" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.frequency }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Category -->
                <td :class="{ 'cell-error': task.errors?.category }">
                  <div class="relative">
                    <v-select
                      v-model="task.categoryId"
                      :items="categories"
                      item-title="name"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="validateTask(index)"
                    ></v-select>
                    <v-tooltip v-show="task.errors?.category" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.category }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Priority -->
                <td :class="{ 'cell-error': task.errors?.priority }">
                  <div class="relative">
                    <v-select
                      v-model="task.priorityId"
                      :items="priorities"
                      item-title="name"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="validateTask(index)"
                    ></v-select>
                    <v-tooltip v-show="task.errors?.priority" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.priority }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Role -->
                <td :class="{ 'cell-error': task.errors?.role }">
                  <div class="relative">
                    <v-select
                      v-model="task.roleId"
                      :items="roles"
                      item-title="title"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="validateTask(index)"
                    ></v-select>
                    <v-tooltip v-show="task.errors?.role" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.role }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- User -->
                <td :class="{ 'cell-error': task.errors?.user }">
                  <div class="relative">
                    <v-select
                      v-model="task.userId"
                      :items="users"
                      item-title="fullName"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="validateTask(index)"
                    ></v-select>
                    <v-tooltip v-show="task.errors?.user" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ task.errors.user }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <!-- Status -->
                <td>
                  <v-chip
                    :color="task.hasErrors ? 'error' : 'success'"
                    size="small"
                    variant="flat"
                  >
                    {{ task.hasErrors ? "Invalid" : "Valid" }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error messages -->
      <div v-if="excelError" class="text-red ml-6 mb-3" style="font-size: 14px">
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
          color="secondary"
          style="font-weight: 500; text-transform: none"
          variant="flat"
          @click="downloadSample"
        >
          Download sample
        </v-btn>
        <v-btn
          v-if="uploadedFiles.length && !parsedTasks.length"
          color="primary"
          @click="processUploadedFile"
          :disabled="isProcessing"
          class="mr-3"
          style="font-weight: 500; text-transform: none"
          variant="flat"
        >
          Process File
        </v-btn>
        <v-btn
          v-if="parsedTasks.length"
          color="primary"
          @click="uploadTasks"
          :disabled="hasValidationErrors || isUploading"
          class="mr-3"
          style="font-weight: 500; text-transform: none"
          variant="flat"
        >
          Upload {{ parsedTasks.length }} Tasks
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import * as XLSX from "xlsx";

const props = defineProps({
  modelValue: Boolean,
  categories: Array,
  priorities: Array,
  roles: Array,
  users: Array,
});

const emit = defineEmits(["update:modelValue", "onUpdate"]);

// State
const excelError = ref(null);
const isOpen = ref(props.modelValue);
const uploadedFiles = ref([]);
const fileUploader = ref(null);
const parsedTasks = ref([]);
const isProcessing = ref(false);
const isUploading = ref(false);

const taskStore = useTaskStore();
const mainStore = useMainStore();
const config = useRuntimeConfig();

// Environment variable for max file size (5MB)
const MAX_FILE_SIZE = parseInt(config.public.MAX_FILE_SIZE_FOR_TASK_SHEET) || 5 * 1024 * 1024

// Computed - Use props directly for dropdowns
const categories = computed(() => props.categories || []);
const priorities = computed(() => props.priorities || []);
const roles = computed(() => props.roles || []);
const users = computed(() => props.users || []);

const frequencies = ref([
  { id: 1, name: "Daily" },
  { id: 2, name: "Weekly" },
  { id: 3, name: "Fortnightly" },
  { id: 4, name: "Monthly" },
  { id: 5, name: "6 Monthly" },
  { id: 6, name: "Yearly" },
]);

// Computed
const validationErrors = computed(() => {
  const errors = [];
  parsedTasks.value.forEach((task, index) => {
    if (task.errors) {
      Object.entries(task.errors).forEach(([field, message]) => {
        errors.push(`Row ${index + 1}: ${message}`);
      });
    }
  });
  return errors;
});

const hasValidationErrors = computed(() => {
  return parsedTasks.value.some((task) => task.hasErrors);
});

// Sync prop with local state
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

// Get uploaded files
const getFiles = (files) => {
  excelError.value = null;
  
  // Only allow single file
  if (files.length > 1) {
    excelError.value = "Only one file can be uploaded at a time";
    return;
  }
  
  uploadedFiles.value = files;
};

// Remove uploaded file
const removeUploadedFile = () => {
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
};

// Process uploaded file (triggered by button click)
const processUploadedFile = () => {
  if (uploadedFiles.value.length > 0) {
    processFile(uploadedFiles.value[0]);
  }
};

// Get file icon based on extension
const getFileIcon = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "csv":
      return "mdi-file-delimited";
    case "xlsx":
    case "xls":
      return "mdi-file-excel";
    default:
      return "mdi-file-document";
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

// Process file (Excel or CSV)
const processFile = async (file) => {
  excelError.value = null;
  isProcessing.value = true;

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    excelError.value = `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    isProcessing.value = false;
    return;
  }

  const fileExtension = file.name.split(".").pop().toLowerCase();

  // Validate file type
  if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
    excelError.value = "Invalid file format. Only .xlsx, .xls, and .csv are supported.";
    isProcessing.value = false;
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      let json;

      if (fileExtension === "csv") {
        // Parse CSV
        const text = e.target.result;
        json = parseCSV(text);
      } else {
        // Parse Excel
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames?.length) {
          excelError.value = "Invalid file — no sheets found.";
          isProcessing.value = false;
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }

      // Validate required columns
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
        excelError.value = "Invalid file structure — missing required columns: " + requiredColumns.join(", ");
        isProcessing.value = false;
        return;
      }

      // Map and validate tasks
      const formatted = json.map((row, index) => {
        const task = {
          defaultFrequency: row["frequency"] ?? "",
          description: row["description"] ?? "",
          title: row["title"] ?? "",
          originalCategory: row["category"] ?? "",
          originalPriority: row["priority"] ?? "",
          originalRole: row["role"] ?? "",
          originalUser: row["user"] ?? "",
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
          errors: {},
          hasErrors: false,
        };

        return task;
      });

      // Store all parsed tasks first
      parsedTasks.value = formatted;
      
      // Then validate each task (needed for duplicate detection)
      parsedTasks.value.forEach((task, index) => {
        validateTaskRow(task, index);
      });

      isProcessing.value = false;
    } catch (err) {
      console.error("❌ Error reading file:", err);
      excelError.value = "Error reading file — please check the format.";
      isProcessing.value = false;
    }
  };

  if (fileExtension === "csv") {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
};

// Parse CSV manually
const parseCSV = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
};

// Validate individual task row
const validateTaskRow = (task, index) => {
  // Reset without replacing the reference
  if (!task.errors) task.errors = {};
  Object.keys(task.errors).forEach((k) => delete task.errors[k]);
  task.hasErrors = false;

  // Required text fields
  if (!task.title?.trim()) {
    task.errors.title = "Title is required";
    task.hasErrors = true;
  }

  if (!task.description?.trim()) {
    task.errors.description = "Description is required";
    task.hasErrors = true;
  }

  if (!task.defaultFrequency?.trim()) {
    task.errors.frequency = "Frequency is required";
    task.hasErrors = true;
  }

  // --- Category Validation ---
  if (!task.categoryId) {
    // If user hasn’t selected yet but has originalCategory value
    if (!task.originalCategory?.trim()) {
      task.errors.category = "Category is missing. Please select from dropdown.";
    } else {
      const matched = props.categories?.find(
        c => c.name?.trim()?.toLowerCase() === task.originalCategory.trim().toLowerCase()
      );
      if (!matched) {
        task.errors.category = `Category "${task.originalCategory}" is invalid. Please select from dropdown.`;
      }
    }
    if (task.errors.category) task.hasErrors = true;
  } else {
    delete task.errors.category;
  }

  // --- Priority Validation ---
  if (!task.priorityId) {
    if (!task.originalPriority?.trim()) {
      task.errors.priority = "Priority is missing. Please select from dropdown.";
    } else {
      const matched = props.priorities?.find(
        p => p.name?.trim()?.toLowerCase() === task.originalPriority.trim().toLowerCase()
      );
      if (!matched) {
        task.errors.priority = `Priority "${task.originalPriority}" is invalid. Please select from dropdown.`;
      }
    }
    if (task.errors.priority) task.hasErrors = true;
  } else {
    delete task.errors.priority;
  }

  // --- Role Validation ---
  if (!task.roleId) {
    if (!task.originalRole?.trim()) {
      task.errors.role = "Role is missing. Please select from dropdown.";
    } else {
      const matched = props.roles?.find(
        r => r.title?.trim()?.toLowerCase() === task.originalRole.trim().toLowerCase()
      );
      if (!matched) {
        task.errors.role = `Role "${task.originalRole}" is invalid. Please select from dropdown.`;
      }
    }
    if (task.errors.role) task.hasErrors = true;
  } else {
    delete task.errors.role;
  }

  // --- User Validation ---
  if (!task.userId) {
    if (!task.originalUser?.trim()) {
      task.errors.user = "User is missing. Please select from dropdown.";
    } else {
      const matched = props.users?.find(
        u => u.fullName?.trim()?.toLowerCase() === task.originalUser.trim().toLowerCase()
      );
      if (!matched) {
        task.errors.user = `User "${task.originalUser}" is invalid. Please select from dropdown.`;
      }
    }
    if (task.errors.user) task.hasErrors = true;
  } else {
    delete task.errors.user;
  }

  // --- Duplicate Detection ---
  const titleKey = task.title?.trim()?.toLowerCase();
  const userKey = task.userId;
  const duplicates = parsedTasks.value.filter(
    (t, i) => i !== index &&
      t.title?.trim()?.toLowerCase() === titleKey &&
      t.userId === userKey
  );

  if (duplicates.length > 0 && titleKey && userKey) {
    task.errors.title = "Duplicate task: Same title and user combination already exists";
    task.hasErrors = true;
  }
};

// Validate specific task on edit
const validateTask = (index) => {
  const task = parsedTasks.value[index];
  validateTaskRow(task, index);

  // Identify all other rows sharing title+user combo
  const titleKey = task.title?.trim()?.toLowerCase();
  const userKey = task.userId;

  parsedTasks.value.forEach((t, i) => {
    if (i !== index) {
      const samePair =
        t.title?.trim()?.toLowerCase() === titleKey && t.userId === userKey;
      // Revalidate only those that share the combination or previously shared it
      if (samePair || t.errors?.title?.includes("Duplicate")) {
        validateTaskRow(t, i);
      }
    }
  });
};


// Clear parsed data and reset
const clearParsedData = () => {
  parsedTasks.value = [];
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
};

// Upload tasks to backend
const uploadTasks = async () => {
  if (hasValidationErrors.value) {
    mainStore.setSnackbar({
      type: "error",
      title: "Please fix all validation errors before uploading",
    });
    return;
  }

  isUploading.value = true;

  try {
    const tasks = parsedTasks.value.map((task) => ({
      defaultFrequency: task.defaultFrequency,
      description: task.description,
      title: task.title,
      categoryId: task.categoryId,
      priorityId: task.priorityId,
      roleId: task.roleId,
      userId: task.userId,
    }));

    const res = await taskStore.addBulkTasks({ tasks });

    if (res.code === 0) {
      // Check if there are any successful uploads
      const results = res.data?.results || res.results || [];
      const successCount = results.filter((r) => r.status === "success").length || 0;
      const failCount = results.filter((r) => r.status === "failed").length || 0;
      
      // If all tasks failed or no tasks were uploaded, show error
      if (successCount === 0 && failCount > 0) {
        mainStore.setSnackbar({
          type: "error",
          title: res.data?.message || res.message || "Failed to upload tasks. Please check the errors and try again.",
        });
      } else if (failCount > 0) {
        // Some tasks succeeded, some failed - show warning
        mainStore.setSnackbar({
          type: "warning",
          title: res.data?.message || res.message || "Some tasks failed to upload",
        });
        emit("onUpdate");
        close();
      } else {
        // All tasks succeeded
        emit("onUpdate");
        close();
        mainStore.setSnackbar({
          type: "success",
          title: res.data?.message || res.message || "Bulk upload completed successfully",
        });
      }
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res.data?.message || res.message || "Failed to upload tasks",
      });
    }
  } catch (err) {
    console.error("❌ Bulk upload error:", err);
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "Failed to upload tasks",
    });
  } finally {
    isUploading.value = false;
  }
};

// Close dialog and reset
const close = () => {
  fileUploader.value?.clearFiles?.();
  uploadedFiles.value = [];
  parsedTasks.value = [];
  excelError.value = null;
  isProcessing.value = false;
  isUploading.value = false;
  isOpen.value = false;
};

// Download sample file
const downloadSample = () => {
  const link = document.createElement("a");
  link.href = "/samples/task-sample.xlsx";
  link.download = "task-sample.xlsx";
  link.click();
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.excel-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  border: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table td {
  padding: 8px;
  border: 1px solid #e0e0e0;
  min-width: 150px;
}

.excel-table tbody tr:hover {
  background-color: #fafafa;
}

.cell-error {
  background-color: #ffebee !important;
}

.row-error {
  background-color: #fff3f3;
}

.text-red {
  color: #d32f2f;
}

.file-preview-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.file-preview-card:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>