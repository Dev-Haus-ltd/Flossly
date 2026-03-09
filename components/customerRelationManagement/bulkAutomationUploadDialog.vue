<template>
  <v-dialog v-model="isOpen" max-width="1100px" class="rounded-lg">
    <v-card>
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="font-weight: 600; font-size: 16px; border-bottom: 1px solid #dbdbdb;"
      >
        Upload Automations File
        <v-btn icon variant="text" size="small" @click="close" style="color: #737373">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div v-if="!uploadedFiles.length && !parsedRows.length" class="pa-5">
        <CommonFileUpload
          @onFiles="getFiles"
          :isSingle="true"
          ref="fileUploader"
          :acceptedFormats="'.xlsx,.xls,.csv'"
        />
        <div v-if="excelError" class="text-red mt-3" style="font-size: 14px">
          {{ excelError }}
        </div>
      </div>

      <div v-if="uploadedFiles.length && !isProcessing && !parsedRows.length" class="pa-5">
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
            <v-btn icon variant="text" size="small" color="error" @click="removeUploadedFile">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <div v-if="isProcessing" class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4" style="font-size: 14px; color: #737373">
          Processing file...
        </div>
      </div>

      <div v-if="parsedRows.length && !isProcessing" class="pa-5">
        <div class="d-flex align-center justify-space-between mb-3">
          <div style="font-weight: 600; font-size: 14px">
            Preview: {{ parsedRows.length }} automations found
          </div>
          <div class="d-flex align-center">
            <v-btn size="small" variant="text" color="primary" @click="downloadSample" class="mr-2">
              <v-icon size="16" class="mr-1">mdi-download</v-icon>
              Download Template
            </v-btn>
            <v-btn size="small" variant="text" color="error" @click="clearParsedData">
              <img src="@/assets/tasks/delete.svg" alt="Delete" width="18" height="18" class="mr-1" style="vertical-align: middle;" />
              Clear
            </v-btn>
          </div>
        </div>

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

        <div style="overflow-x: auto; max-height: 420px; overflow-y: auto">
          <table class="excel-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Group</th>
                <th>Type</th>
                <th>Name</th>
                <th>Subject</th>
                <th>Content</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in parsedRows"
                :key="index"
                :class="{ 'row-error': row.hasErrors }"
              >
                <td>{{ index + 1 }}</td>
                <td :class="{ 'cell-error': row.errors?.groupName }">
                  <v-text-field
                    v-model="row.groupName"
                    density="compact"
                    variant="outlined"
                    hide-details
                    @input="validateRow(index)"
                  />
                </td>
                <td :class="{ 'cell-error': row.errors?.type }">
                  <v-select
                    v-model="row.type"
                    :items="typeOptions"
                    density="compact"
                    variant="outlined"
                    hide-details
                    @update:model-value="() => validateRow(index)"
                  />
                </td>
                <td :class="{ 'cell-error': row.errors?.name }">
                  <v-text-field
                    v-model="row.name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    @input="validateRow(index)"
                  />
                </td>
                <td :class="{ 'cell-error': row.errors?.subject }">
                  <v-text-field
                    v-model="row.subject"
                    density="compact"
                    variant="outlined"
                    hide-details
                    @input="validateRow(index)"
                  />
                </td>
                <td :class="{ 'cell-error': row.errors?.content }">
                  <v-textarea
                    v-model="row.content"
                    density="compact"
                    variant="outlined"
                    hide-details
                    rows="2"
                    @input="validateRow(index)"
                  />
                </td>
                <td>
                  <v-chip size="x-small" :color="row.hasErrors ? 'error' : 'success'" variant="flat">
                    {{ row.hasErrors ? 'Invalid' : 'Valid' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <v-divider />
      <v-card-actions class="d-flex justify-end pa-4">
        <v-btn variant="text" @click="downloadSample" class="mr-auto">
          Download Template
        </v-btn>
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isUploading"
          :disabled="!parsedRows.length"
          @click="uploadAutomations"
        >
          Upload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import * as XLSX from "xlsx";
import {
  extractExtension,
  formatFileSize as formatFileSizeUtil,
  getFileIcon as getFileIconUtil,
  validateFileBasics,
} from "~/lib/fileImportUtils";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "onUpdate", "close"]);

const excelError = ref(null);
const isOpen = ref(props.modelValue);
const uploadedFiles = ref([]);
const fileUploader = ref(null);
const parsedRows = ref([]);
const isProcessing = ref(false);
const isUploading = ref(false);

const crmStore = useCrmStore();
const mainStore = useMainStore();
const config = useRuntimeConfig();

const MAX_FILE_SIZE =
  parseInt(config.public.MAX_FILE_SIZE_FOR_TASK_SHEET) || 5 * 1024 * 1024;

const typeOptions = ["Email", "WhatsApp"];

watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const validationErrors = computed(() => {
  const errors = [];
  parsedRows.value.forEach((row, index) => {
    if (row.errors) {
      Object.values(row.errors).forEach((msg) => {
        if (msg) errors.push(`Row ${index + 1}: ${msg}`);
      });
    }
  });
  return errors;
});

const hasValidationErrors = computed(() =>
  parsedRows.value.some((row) => row.hasErrors)
);

const normalizeHeaderKey = (key) =>
  String(key || "")
    .toLowerCase()
    .replace(/[\u200B\uFEFF]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const COLUMN_ALIASES = {
  group_name: [
    "group",
    "group name",
    "automation group",
    "category",
    "automation category",
    "group name",
    "group_name",
    "groupname",
  ],
  type: ["type", "automation type"],
  name: ["name", "automation name", "title"],
  subject: ["subject", "email subject"],
  content: ["content", "message", "body", "template", "automation content"],
};

const resolveHeaderKey = (header) => {
  const normalized = normalizeHeaderKey(header);
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return normalized;
};

const getFiles = (files) => {
  excelError.value = null;
  if (files.length > 1) {
    excelError.value = "Only one file can be uploaded at a time";
    return;
  }
  uploadedFiles.value = files;
};

const removeUploadedFile = () => {
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
};

const processUploadedFile = () => {
  if (uploadedFiles.value.length) {
    processFile(uploadedFiles.value[0]);
  }
};

const getFileIcon = (filename) => getFileIconUtil(filename);
const formatFileSize = (bytes) => formatFileSizeUtil(bytes);

const normalizeType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "Email";
  if (raw.includes("whatsapp") || raw === "wa" || raw === "whats app") return "WhatsApp";
  return "Email";
};

const hasHtml = (value) => /<\s*\/?.+?>/.test(String(value || ""));

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const canonical = resolveHeaderKey(key);
    if (!canonical) return;
    normalized[canonical] = value ?? "";
  });

  const groupName = String(normalized.group_name || "").trim();
  const type = normalizeType(normalized.type);
  const name = String(normalized.name || "").trim();
  const subject = String(normalized.subject || "").trim();
  const content = String(normalized.content || "").trim();

  return {
    groupName,
    type,
    name,
    subject: type === "Email" ? (subject || name) : "",
    content,
    errors: {},
    hasErrors: false,
  };
};

const validateRow = (index) => {
  const row = parsedRows.value[index];
  if (!row) return;
  const errors = {};

  if (!row.groupName?.trim()) errors.groupName = "Group name is required";
  if (!row.name?.trim()) errors.name = "Name is required";
  if (!row.content?.trim()) errors.content = "Content is required";
  if (hasHtml(row.content)) errors.content = "Content must be plain text (no HTML)";
  if (!typeOptions.includes(row.type)) errors.type = "Invalid type";

  row.errors = errors;
  row.hasErrors = Object.keys(errors).length > 0;
};

const processFile = async (file) => {
  excelError.value = null;
  isProcessing.value = true;

  const validationError = validateFileBasics(file, MAX_FILE_SIZE);
  if (validationError) {
    excelError.value = validationError;
    isProcessing.value = false;
    return;
  }

  const fileExtension = extractExtension(file.name);
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let json;
      const workbook =
        fileExtension === "csv"
          ? XLSX.read(e.target.result, { type: "string" })
          : XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      if (!workbook.SheetNames?.length) {
        excelError.value = "Invalid file - no sheets found.";
        isProcessing.value = false;
        return;
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetRows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (!sheetRows.length) {
        excelError.value = "No rows found in the file.";
        isProcessing.value = false;
        return;
      }

      const headers = (sheetRows[0] || []).map((h) => String(h || "").trim());
      if (!headers.some((h) => h)) {
        excelError.value = "Invalid file - header row is empty.";
        isProcessing.value = false;
        return;
      }

      json = sheetRows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          if (!header) return;
          obj[header] = row?.[index] ?? "";
        });
        return obj;
      });

      if (!json.length) {
        excelError.value = "No rows found in the file.";
        isProcessing.value = false;
        return;
      }

      const normalizedKeys = Object.keys(json[0] || {}).map((k) => resolveHeaderKey(k));
      const required = ["group_name", "type", "name", "content"];
      const hasRequired = required.every((key) => normalizedKeys.includes(key));

      if (!hasRequired) {
        excelError.value =
          "Invalid file structure - missing required columns: " +
          required.join(", ");
        isProcessing.value = false;
        return;
      }

      parsedRows.value = json.map((row) => normalizeRow(row));
      parsedRows.value.forEach((_, index) => validateRow(index));
      isProcessing.value = false;
    } catch (err) {
      console.error("Error reading file:", err);
      excelError.value = "Error reading file - please check the format.";
      isProcessing.value = false;
    }
  };

  if (fileExtension === "csv") {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
};

const clearParsedData = () => {
  parsedRows.value = [];
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
};

const uploadAutomations = async () => {
  if (hasValidationErrors.value) {
    mainStore.setSnackbar({
      type: "error",
      title: "Please fix all validation errors before uploading",
    });
    return;
  }

  isUploading.value = true;
  try {
    const items = parsedRows.value.map((row) => ({
      groupName: row.groupName?.trim(),
      type: row.type,
      name: row.name?.trim(),
      subject: row.subject?.trim(),
      content: row.content?.trim(),
    }));

    const res = await crmStore.bulkUploadAutomations({ items });

    if (res?.code === 0) {
      emit("onUpdate");
      close();
      mainStore.setSnackbar({
        type: "success",
        title: res.data?.message || res.message || "Automations uploaded successfully",
      });
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res?.data?.message || res?.message || "Failed to upload automations",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "Failed to upload automations",
    });
  } finally {
    isUploading.value = false;
  }
};

const close = () => {
  fileUploader.value?.clearFiles?.();
  uploadedFiles.value = [];
  parsedRows.value = [];
  excelError.value = null;
  isProcessing.value = false;
  isUploading.value = false;
  isOpen.value = false;
  emit("close");
};

const downloadSample = () => {
  const link = document.createElement("a");
  link.href = "/samples/automation-sample.csv";
  link.download = "automation-sample.csv";
  link.click();
};

watch(uploadedFiles, processUploadedFile);
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
  border-bottom: 1px solid #e5e7eb;
}

.excel-table td {
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.row-error {
  background-color: #fff7f7;
}

.cell-error :deep(.v-field) {
  border-color: #f44336 !important;
}

.file-preview-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
</style>
