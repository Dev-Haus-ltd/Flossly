<template>
  <v-dialog v-model="isOpen" max-width="1100px" class="rounded-lg">
    <v-card>
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="font-weight: 600; font-size: 16px; border-bottom: 1px solid #dbdbdb;"
      >
        Upload Leads File
        <v-btn icon variant="text" size="small" @click="close" style="color: #737373">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Upload area -->
      <div v-if="!uploadedFiles.length && !parsedLeads.length" class="pa-5">
        <CommonFileUpload
          @onFiles="getFiles"
          :isSingle="true"
          ref="fileUploader"
          :acceptedFormats="'.xlsx,.xls,.csv'"
        />
      </div>

      <!-- Uploaded File Preview -->
      <div v-if="uploadedFiles.length && !isProcessing && !parsedLeads.length" class="pa-5">
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

      <!-- Loading State -->
      <div v-if="isProcessing" class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4" style="font-size: 14px; color: #737373">
          Processing file...
        </div>
      </div>

      <!-- Table Preview -->
      <div v-if="parsedLeads.length && !isProcessing" class="pa-5">
        <div class="d-flex align-center justify-space-between mb-3">
          <div style="font-weight: 600; font-size: 14px">
            Preview: {{ parsedLeads.length }} leads found
          </div>
          <v-btn size="small" variant="text" color="error" @click="clearParsedData">
            <img src="@/assets/tasks/delete.svg" alt="Delete" width="18" height="18" class="mr-1" style="vertical-align: middle;" />
            Clear
          </v-btn>
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
                <th>Name</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Inquiry Date</th>
                <th>Lead Source</th>
                <th>Lead Status</th>
                <th>Treatment</th>
                <th>Assigned To</th>
                <th>Follow-up Date</th>
                <th>Comments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(lead, index) in parsedLeads"
                :key="index"
                :class="{ 'row-error': lead.hasErrors }"
              >
                <td>{{ index + 1 }}</td>
                <td :class="{ 'cell-error': lead.errors?.name }">
                  <div class="relative">
                    <v-text-field
                      v-model="lead.name"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.name" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.name }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.email }">
                  <div class="relative">
                    <v-text-field
                      v-model="lead.email"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.email" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.email }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.telephone }">
                  <div class="relative">
                    <v-text-field
                      v-model="lead.telephone"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.telephone" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.telephone }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.inquiryDate }">
                  <div class="relative">
                    <v-text-field
                      v-model="lead.inquiryDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @change="validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.inquiryDate" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.inquiryDate }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.leadSource }">
                  <div class="relative">
                    <v-select
                      v-model="lead.leadSourceId"
                      :items="leadSources"
                      item-title="name"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      placeholder="Select"
                      @update:modelValue="(val) => onSourceChange(index, val)"
                    />
                    <v-tooltip v-show="lead.errors?.leadSource" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.leadSource }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.leadStatus }">
                  <div class="relative">
                    <v-select
                      v-model="lead.leadStatus"
                      :items="leadStatusOptions"
                      item-title="label"
                      item-value="label"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="() => validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.leadStatus" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.leadStatus }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.treatment }">
                  <div class="relative">
                    <v-select
                      v-model="lead.treatmentId"
                      :items="treatmentSources"
                      item-title="name"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      placeholder="Select"
                      @update:modelValue="(val) => onTreatmentChange(index, val)"
                    />
                    <v-tooltip v-show="lead.errors?.treatment" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.treatment }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.user }">
                  <div class="relative">
                    <v-select
                      v-model="lead.userId"
                      :items="activeUsers"
                      item-title="fullName"
                      item-value="id"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      placeholder="Select"
                      @update:modelValue="() => validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.user" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.user }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.followUpDate }">
                  <div class="relative">
                    <v-text-field
                      v-model="lead.followUpDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @change="validateLead(index)"
                    />
                    <v-tooltip v-show="lead.errors?.followUpDate" location="top">
                      <template #activator="{ props: tooltipProps }">
                        <div v-bind="tooltipProps" class="absolute inset-0"></div>
                      </template>
                      <span>{{ lead.errors.followUpDate }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td>
                  <v-text-field
                    v-model="lead.comments"
                    density="compact"
                    variant="outlined"
                    hide-details
                    @input="validateLead(index)"
                  />
                </td>

                <td>
                  <v-chip :color="lead.hasErrors ? 'error' : 'success'" size="small" variant="flat">
                    {{ lead.hasErrors ? "Invalid" : "Valid" }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="excelError" class="text-red ml-6 mb-3" style="font-size: 14px">
        {{ excelError }}
      </div>

      <v-card-actions class="justify-end">
        <v-btn text @click="close" style="font-weight: 500; text-transform: none">
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
          v-if="uploadedFiles.length && !parsedLeads.length"
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
          v-if="parsedLeads.length"
          color="primary"
          @click="uploadLeads"
          :disabled="hasValidationErrors || isUploading"
          class="mr-3"
          style="font-weight: 500; text-transform: none"
          variant="flat"
        >
          Upload {{ parsedLeads.length }} Leads
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
  cleanQuotedValue,
  normalizeLeadColumnHeader,
  normalizePhoneValue,
  parseCSV as parseCSVUtil,
  validateFileBasics,
} from "~/lib/fileImportUtils";

const props = defineProps({
  modelValue: Boolean,
  leadSources: { type: Array, default: () => [] },
  treatmentSources: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "onUpdate", "close"]);

const excelError = ref(null);
const isOpen = ref(props.modelValue);
const uploadedFiles = ref([]);
const fileUploader = ref(null);
const parsedLeads = ref([]);
const isProcessing = ref(false);
const isUploading = ref(false);

const crmStore = useCrmStore();
const mainStore = useMainStore();
const config = useRuntimeConfig();

const MAX_FILE_SIZE =
  parseInt(config.public.MAX_FILE_SIZE_FOR_TASK_SHEET) || 5 * 1024 * 1024;

const leadStatusOptions = [
  { key: "new", label: "New" },
  { key: "converted", label: "Converted" },
  { key: "contacted", label: "Contacted" },
  { key: "lost", label: "Lost" },
  { key: "archived", label: "Archived" },
];
const statusLookup = computed(() => {
  const map = new Map();
  leadStatusOptions.forEach((s) => map.set(s.label.toLowerCase(), s.label));
  return map;
});
const activeUsers = computed(() =>
  (props.users || []).filter((u) => {
    // Only show active users (not invited, disabled, or expired)
    return u?.orgStatus === "Active" && !u?.isAccountDeactivated;
  })
);
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const validationErrors = computed(() => {
  const errors = [];
  parsedLeads.value.forEach((lead, index) => {
    if (lead.errors) {
      Object.entries(lead.errors).forEach(([field, message]) => {
        errors.push(`Row ${index + 1}: ${message}`);
      });
    }
  });
  return errors;
});

const hasValidationErrors = computed(() =>
  parsedLeads.value.some((lead) => lead.hasErrors)
);

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
      if (fileExtension === "csv") {
        json = parseCSVUtil(e.target.result);
      } else {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
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

        const headers = (sheetRows[0] || []).map((h) =>
          String(h || "").trim()
        );
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
      }

      if (!json.length) {
        excelError.value = "No rows found in the file.";
        isProcessing.value = false;
        return;
      }

      const requiredColumns = ["name", "email", "telephone"];
      const normalizedKeys = Object.keys(json[0] || {}).map((k) =>
        normalizeLeadColumnHeader(k)
      );
      const hasName = normalizedKeys.includes("name");
      const hasEmail = normalizedKeys.includes("email");
      const hasPhone = normalizedKeys.includes("telephone");
      const hasRequiredColumns = hasName && hasEmail && hasPhone;

      if (!hasRequiredColumns) {
        excelError.value =
          "Invalid file structure - missing required columns: " +
          requiredColumns.join(", ");
        isProcessing.value = false;
        return;
      }

      const formatted = json.map((row) => normalizeRow(row));
      parsedLeads.value = formatted;
      parsedLeads.value.forEach((lead, index) => validateLead(index, lead));
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

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeLeadColumnHeader(key)] = value ?? "";
  });

  const cleanQuoted = (val) => cleanQuotedValue(val);

  const leadSourceName = normalized["leadsource"] || "";
  const treatmentName = normalized["treatment"] || "";
  const assignedUser = normalized["assigned"] || "";
  const cleanedEmail = cleanQuoted(normalized["email"]);
  let cleanedTelephone = normalizePhoneValue(normalized["telephone"]);
  if (!cleanedTelephone) {
    const fallbackKey = Object.keys(row || {}).find((key) => {
      const normalizedKey = normalizeLeadColumnHeader(key);
      return (
        normalizedKey === "telephone" ||
        ["phone", "mobile", "telephone", "tel", "whatsapp", "cell"].some((k) =>
          normalizedKey.includes(k)
        )
      );
    });
    if (fallbackKey) {
      cleanedTelephone = normalizePhoneValue(row[fallbackKey]);
    }
  }

  return {
    name: normalized["name"] || "",
    email: cleanedEmail,
    telephone: cleanedTelephone,
    leadSourceId:
      props.leadSources.find(
        (s) =>
          s.name?.trim()?.toLowerCase() === leadSourceName?.trim()?.toLowerCase()
      )?.id || null,
    leadSourceName,
    treatmentId:
      props.treatmentSources.find(
        (t) =>
          t.name?.trim()?.toLowerCase() === treatmentName?.trim()?.toLowerCase()
      )?.id || null,
    treatmentName,
    leadStatus: statusLookup.value.get(
      (normalized["leadstatus"] || "").trim().toLowerCase()
    ) || "New",
    userId:
      activeUsers.value.find((u) => {
        const fullName = u.fullName?.trim()?.toLowerCase();
        const email = u.email?.trim()?.toLowerCase();
        const assigned = assignedUser?.trim()?.toLowerCase();
        return assigned && (fullName === assigned || email === assigned);
      })?.id || null,
    assignedUser,
    inquiryDate: normalizeDate(normalized["inquirydate"]),
    followUpDate: normalizeDate(normalized["followupdate"]),
    originalInquiryDate: normalized["inquirydate"] || "",
    originalFollowUpDate: normalized["followupdate"] || "",
    comments: normalized["comments"] || "",
    errors: {},
    hasErrors: false,
    originalLeadSource: leadSourceName,
    originalTreatment: treatmentName,
  };
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const d = XLSX.SSF ? XLSX.SSF.parse_date_code(value) : null;
    if (d) {
      const date = new Date(Date.UTC(d.y, d.m - 1, d.d));
      return date.toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
};

const validateLead = (index, existingLead) => {
  const lead = existingLead || parsedLeads.value[index];
  if (!lead) return;
  if (!lead.errors) lead.errors = {};
  Object.keys(lead.errors).forEach((k) => delete lead.errors[k]);
  lead.hasErrors = false;

  const cleanedEmail =
    typeof lead.email === "string"
      ? lead.email.trim().replace(/^['"]+|['"]+$/g, "")
      : "";
    lead.email = cleanedEmail;
  const cleanedTelephone = normalizePhoneValue(lead.telephone);
  lead.telephone = cleanedTelephone;

  if (!lead.name?.trim()) {
    lead.errors.name = "Name is required";
    lead.hasErrors = true;
  }
  const email = cleanedEmail;
  if (!email) {
    lead.errors.email = "Email is required";
    lead.hasErrors = true;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      lead.errors.email = "Invalid email format";
      lead.hasErrors = true;
    }
    const duplicate = parsedLeads.value.find(
      (l, i) =>
        i !== index && (l.email || "").trim().toLowerCase() === email.toLowerCase()
    );
    if (duplicate) {
      lead.errors.email = "Duplicate email in upload";
      lead.hasErrors = true;
    }
  }

  if (!lead.telephone?.trim()) {
    lead.errors.telephone = "Telephone is required";
    lead.hasErrors = true;
  }

  // if (lead.originalLeadSource?.trim() && !lead.leadSourceId) {
  //   lead.errors.leadSource = `Lead source "${lead.originalLeadSource}" is invalid. Select from dropdown.`;
  //   lead.hasErrors = true;
  // }

  // if (lead.originalTreatment?.trim() && !lead.treatmentId) {
  //   lead.errors.treatment = `Treatment "${lead.originalTreatment}" is invalid. Select from dropdown.`;
  //   lead.hasErrors = true;
  // }

  // if (lead.leadStatus) {
  //   const status = statusLookup.value.get(lead.leadStatus.trim().toLowerCase());
  //   if (!status) {
  //     lead.errors.leadStatus = "Invalid lead status";
  //     lead.hasErrors = true;
  //   } else {
  //     lead.leadStatus = status;
  //   }
  // } else {
  //   lead.leadStatus = "New";
  // }

  // if (lead.assignedUser?.trim() && !lead.userId) {
  //   lead.errors.user = `User "${lead.assignedUser}" not found. Select from dropdown.`;
  //   lead.hasErrors = true;
  // }

  // if (lead.inquiryDate === null && lead.originalInquiryDate) {
  //   lead.errors.inquiryDate = "Invalid inquiry date";
  //   lead.hasErrors = true;
  // }
  // if (lead.followUpDate === null && lead.originalFollowUpDate) {
  //   lead.errors.followUpDate = "Invalid follow-up date";
  //   lead.hasErrors = true;
  // }
};

const onSourceChange = (index, val) => {
  const lead = parsedLeads.value[index];
  if (!lead) return;
  lead.leadSourceId = val;
  lead.originalLeadSource = "";
  validateLead(index, lead);
};

const onTreatmentChange = (index, val) => {
  const lead = parsedLeads.value[index];
  if (!lead) return;
  lead.treatmentId = val;
  lead.originalTreatment = "";
  validateLead(index, lead);
};

const clearParsedData = () => {
  parsedLeads.value = [];
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
};

const uploadLeads = async () => {
  if (hasValidationErrors.value) {
    mainStore.setSnackbar({
      type: "error",
      title: "Please fix all validation errors before uploading",
    });
    return;
  }

  isUploading.value = true;
  try {
    const leadsPayload = parsedLeads.value.map((lead) => ({
      name: lead.name?.trim(),
      email: lead.email?.trim(),
      telephone: lead.telephone?.trim(),
      leadSource:
        lead.leadSourceId && props.leadSources.length
          ? props.leadSources.find((s) => s.id === lead.leadSourceId)?.name ||
            lead.originalLeadSource ||
            null
          : lead.originalLeadSource || null,
      leadStatus: lead.leadStatus || "New",
      treatment:
        lead.treatmentId && props.treatmentSources.length
          ? props.treatmentSources.find((t) => t.id === lead.treatmentId)?.name ||
            lead.originalTreatment ||
            null
          : lead.originalTreatment || null,
      assignedUserId: lead.userId || null,
      inquiryDate: lead.inquiryDate || null,
      followUpDate: lead.followUpDate || null,
      comments: lead.comments || "",
    }));

    const res = await crmStore.bulkUploadLeads({ leads: leadsPayload });

    if (res?.code === 0) {
      emit("onUpdate");
      close();
      mainStore.setSnackbar({
        type: "success",
        title: res.data?.message || res.message || "Leads uploaded successfully",
      });
    } else {
      mainStore.setSnackbar({
        type: "error",
        title: res?.data?.message || res?.message || "Failed to upload leads",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: "error",
      title: err.message || "Failed to upload leads",
    });
  } finally {
    isUploading.value = false;
  }
};

const close = () => {
  fileUploader.value?.clearFiles?.();
  uploadedFiles.value = [];
  parsedLeads.value = [];
  excelError.value = null;
  isProcessing.value = false;
  isUploading.value = false;
  isOpen.value = false;
  emit("close");
};

const downloadSample = () => {
  const link = document.createElement("a");
  link.href = "/samples/lead-sample.csv";
  link.download = "lead-sample.csv";
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
  min-width: 140px;
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
.alert-select :deep(.v-field__input) {
  padding-left: 10px;
}
.emoji-small {
  font-size: 16px;
  width: 18px;
  display: inline-flex;
  justify-content: center;
}
</style>
