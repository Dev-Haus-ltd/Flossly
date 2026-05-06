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

      <!-- Uploaded File Preview (before processing) -->
      <div v-if="uploadedFiles.length && !isProcessing && !parsedLeads.length" class="pa-5">
        <div class="file-preview-card">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center" style="flex: 1">
              <v-icon size="40" color="primary" class="mr-3">
                {{ getFileIcon(uploadedFiles[0].name) }}
              </v-icon>
              <div>
                <div style="font-weight: 600; font-size: 14px">{{ uploadedFiles[0].name }}</div>
                <div style="font-size: 12px; color: #737373">{{ formatFileSize(uploadedFiles[0].size) }}</div>
              </div>
            </div>
            <v-btn icon variant="text" size="small" color="error" @click="removeUploadedFile">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Processing Progress Bar (replaces old spinner) -->
      <div v-if="isProcessing" class="pa-5 pb-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <div style="font-size: 13px; color: #737373">
            Processing {{ processedCount.toLocaleString() }} / {{ totalRows.toLocaleString() }} leads...
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #0061FB">{{ progress }}%</div>
        </div>
        <v-progress-linear :model-value="progress" color="primary" rounded height="6" />
      </div>

      <!-- Table Preview - visible during and after processing for real-time streaming -->
      <div v-if="parsedLeads.length" class="pa-5" :class="{ 'pt-2': isProcessing }">
        <div class="d-flex align-center justify-space-between mb-3">
          <div style="font-weight: 600; font-size: 14px">
            {{ isProcessing ? 'Loading:' : 'Preview:' }}
            {{ parsedLeads.length.toLocaleString() }}
            <span v-if="isProcessing && totalRows > parsedLeads.length"> / {{ totalRows.toLocaleString() }}</span>
            leads
            <span v-if="errorCount" style="font-size: 12px; font-weight: 400; color: #d32f2f; margin-left: 8px">
              - {{ errorCount }} error{{ errorCount !== 1 ? 's' : '' }}
            </span>
            <span v-else-if="warningCount" style="font-size: 12px; font-weight: 400; color: #f57c00; margin-left: 8px">
              - {{ warningCount }} warning{{ warningCount !== 1 ? 's' : '' }}
            </span>
          </div>
          <v-btn size="small" variant="text" color="error" @click="clearParsedData" :disabled="isProcessing">
            <img src="@/assets/tasks/delete.svg" alt="Delete" width="18" height="18" class="mr-1" style="vertical-align: middle;" />
            Clear
          </v-btn>
        </div>

        <!-- Validation summary (only after processing finishes) -->
        <div v-if="validationErrors.length && !isProcessing" class="mb-3">
          <v-alert
            :type="validationErrors.some(e => !e.isWarning) ? 'error' : 'warning'"
            variant="tonal"
            density="compact"
          >
            <div style="font-size: 13px">
              <strong>{{ validationErrors.length }} issues found:</strong>
              <ul class="ml-4 mt-1">
                <li v-for="(issue, idx) in validationErrors.slice(0, 5)" :key="idx">{{ issue.text }}</li>
                <li v-if="validationErrors.length > 5">...and {{ validationErrors.length - 5 }} more</li>
              </ul>
            </div>
          </v-alert>
        </div>

        <!-- Pagination header -->
        <div v-if="totalPages > 1" class="d-flex align-center justify-space-between mb-2">
          <div style="font-size: 12px; color: #737373">
            Rows {{ pageStart + 1 }}-{{ pageEnd }} of {{ parsedLeads.length.toLocaleString() }}
          </div>
          <div class="d-flex align-center" style="gap: 4px">
            <v-btn icon variant="text" size="x-small" :disabled="currentPage === 1" @click="currentPage--">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <span style="font-size: 13px; min-width: 64px; text-align: center">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <v-btn icon variant="text" size="x-small" :disabled="currentPage >= totalPages" @click="currentPage++">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(lead, pageIdx) in paginatedLeads"
                :key="pageStart + pageIdx"
                :class="{ 'row-error': lead.hasErrors }"
              >
                <td>{{ pageStart + pageIdx + 1 }}</td>

                <td :class="{ 'cell-error': lead.errors?.name, 'cell-warning': lead.warnings?.name }">
                  <div class="cell-wrap">
                    <v-text-field
                      v-model="lead.name"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.name || lead.warnings?.name" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.name || lead.warnings?.name }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.email, 'cell-warning': lead.warnings?.email }">
                  <div class="cell-wrap">
                    <v-text-field
                      v-model="lead.email"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.email || lead.warnings?.email" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.email || lead.warnings?.email }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.telephone, 'cell-warning': lead.warnings?.telephone }">
                  <div class="cell-wrap">
                    <v-text-field
                      v-model="lead.telephone"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @input="validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.telephone || lead.warnings?.telephone" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.telephone || lead.warnings?.telephone }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.inquiryDate, 'cell-warning': lead.warnings?.inquiryDate }">
                  <div class="cell-wrap">
                    <v-text-field
                      v-model="lead.inquiryDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @change="validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.inquiryDate || lead.warnings?.inquiryDate" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.inquiryDate || lead.warnings?.inquiryDate }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.leadSource, 'cell-warning': lead.warnings?.leadSource }">
                  <div class="cell-wrap">
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
                      @update:modelValue="(val) => onSourceChange(pageStart + pageIdx, val)"
                    />
                    <v-tooltip v-if="lead.errors?.leadSource || lead.warnings?.leadSource" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.leadSource || lead.warnings?.leadSource }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.leadStatus, 'cell-warning': lead.warnings?.leadStatus }">
                  <div class="cell-wrap">
                    <v-select
                      v-model="lead.leadStatus"
                      :items="leadStatusOptions"
                      item-title="label"
                      item-value="label"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @update:modelValue="() => validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.leadStatus || lead.warnings?.leadStatus" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.leadStatus || lead.warnings?.leadStatus }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.treatment, 'cell-warning': lead.warnings?.treatment }">
                  <div class="cell-wrap">
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
                      @update:modelValue="(val) => onTreatmentChange(pageStart + pageIdx, val)"
                    />
                    <v-tooltip v-if="lead.errors?.treatment || lead.warnings?.treatment" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.treatment || lead.warnings?.treatment }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.user, 'cell-warning': lead.warnings?.user }">
                  <div class="cell-wrap">
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
                      @update:modelValue="() => validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.user || lead.warnings?.user" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.user || lead.warnings?.user }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td :class="{ 'cell-error': lead.errors?.followUpDate, 'cell-warning': lead.warnings?.followUpDate }">
                  <div class="cell-wrap">
                    <v-text-field
                      v-model="lead.followUpDate"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @change="validateLead(pageStart + pageIdx)"
                    />
                    <v-tooltip v-if="lead.errors?.followUpDate || lead.warnings?.followUpDate" location="top">
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="cell-overlay"></div>
                      </template>
                      <span>{{ lead.errors?.followUpDate || lead.warnings?.followUpDate }}</span>
                    </v-tooltip>
                  </div>
                </td>

                <td>
                  <v-text-field
                    v-model="lead.comments"
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </td>

                <td>
                  <v-chip
                    :color="lead.hasErrors ? 'error' : lead.hasWarnings ? 'warning' : 'success'"
                    size="small"
                    variant="flat"
                  >
                    {{ lead.hasErrors ? 'Invalid' : lead.hasWarnings ? 'Warning' : 'Valid' }}
                  </v-chip>
                </td>

                <td>
                  <v-btn
                    v-if="lead.hasErrors || lead.hasWarnings"
                    icon
                    variant="text"
                    :color="lead.hasErrors ? 'error' : 'warning'"
                    size="small"
                    @click="removeInvalidLead(pageStart + pageIdx)"
                    aria-label="Remove lead"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom pagination (only after processing so it doesn't jump around) -->
        <div v-if="totalPages > 1 && !isProcessing" class="d-flex justify-center mt-3">
          <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7" density="compact" />
        </div>
      </div>

      <div v-if="excelError" class="text-red ml-6 mb-3" style="font-size: 14px">
        {{ excelError }}
      </div>

      <v-card-actions class="justify-end">
        <v-btn text @click="close" style="font-weight: 500; text-transform: none">Cancel</v-btn>
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
          :disabled="hasValidationErrors || isUploading || isProcessing"
          class="mr-3"
          style="font-weight: 500; text-transform: none"
          variant="flat"
        >
          Upload {{ parsedLeads.length.toLocaleString() }} Leads
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
const progress = ref(0);
const totalRows = ref(0);
const processedCount = ref(0);
const currentPage = ref(1);
let processingAborted = false;

const PAGE_SIZE = 50;
const CHUNK_SIZE = 50;

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
  { key: "uploaded", label: "Uploaded" },
];

const statusLookup = computed(() => {
  const map = new Map();
  leadStatusOptions.forEach((s) => map.set(s.label.toLowerCase(), s.label));
  return map;
});

const activeUsers = computed(() =>
  (props.users || []).filter(
    (u) => u?.orgStatus === "Active" && !u?.isAccountDeactivated
  )
);

// Pagination computeds
const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE);
const pageEnd = computed(() =>
  Math.min(pageStart.value + PAGE_SIZE, parsedLeads.value.length)
);
const paginatedLeads = computed(() =>
  parsedLeads.value.slice(pageStart.value, pageEnd.value)
);
const totalPages = computed(() =>
  Math.ceil(parsedLeads.value.length / PAGE_SIZE)
);

const errorCount = computed(() =>
  parsedLeads.value.filter((l) => l.hasErrors).length
);
const warningCount = computed(() =>
  parsedLeads.value.filter((l) => l.hasWarnings).length
);

watch(() => props.modelValue, (val) => (isOpen.value = val));
watch(isOpen, (val) => emit("update:modelValue", val));

const validationErrors = computed(() => {
  const issues = [];
  parsedLeads.value.forEach((lead, index) => {
    if (lead.errors) {
      Object.entries(lead.errors).forEach(([, message]) => {
        issues.push({ text: `Row ${index + 1}: ${message}`, isWarning: false });
      });
    }
    if (lead.warnings) {
      Object.entries(lead.warnings).forEach(([, message]) => {
        issues.push({ text: `Row ${index + 1}: ${message}`, isWarning: true });
      });
    }
  });
  return issues;
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
  processingAborted = true;
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
  parsedLeads.value = [];
  isProcessing.value = false;
  progress.value = 0;
  totalRows.value = 0;
  processedCount.value = 0;
  currentPage.value = 1;
};

const processUploadedFile = () => {
  if (uploadedFiles.value.length) processFile(uploadedFiles.value[0]);
};

const getFileIcon = (filename) => getFileIconUtil(filename);
const formatFileSize = (bytes) => formatFileSizeUtil(bytes);

// Yield execution back to the browser between chunks
const yield_ = () => new Promise((resolve) => setTimeout(resolve, 0));

const processFile = async (file) => {
  excelError.value = null;
  isProcessing.value = true;
  progress.value = 0;
  totalRows.value = 0;
  processedCount.value = 0;
  parsedLeads.value = [];
  currentPage.value = 1;
  processingAborted = false;

  const validationError = validateFileBasics(file, MAX_FILE_SIZE);
  if (validationError) {
    excelError.value = validationError;
    isProcessing.value = false;
    return;
  }

  const fileExtension = extractExtension(file.name);
  const reader = new FileReader();

  reader.onload = async (e) => {
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
        const headers = (sheetRows[0] || []).map((h) => String(h || "").trim());
        if (!headers.some((h) => h)) {
          excelError.value = "Invalid file - header row is empty.";
          isProcessing.value = false;
          return;
        }
        json = sheetRows.slice(1).map((row) => {
          const obj = {};
          headers.forEach((header, i) => {
            if (!header) return;
            obj[header] = row?.[i] ?? "";
          });
          return obj;
        });
      }

      // Strip phantom rows - Excel stores formatting for empty rows below real data
      json = json.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").trim() !== "")
      );

      if (!json.length) {
        excelError.value = "No data rows found in the file.";
        isProcessing.value = false;
        return;
      }

      // Missing name/email/telephone columns are allowed.
      // Rows will still be imported and row-level warnings will flag missing values.

      totalRows.value = json.length;

      // Pre-build email frequency map in one O(n) pass so duplicate detection is O(1) per row
      const emailMap = new Map();
      json.forEach((row) => {
        const norm = {};
        Object.entries(row).forEach(([k, v]) => {
          norm[normalizeLeadColumnHeader(k)] = v ?? "";
        });
        const email = cleanQuotedValue(norm["email"] || "").trim().toLowerCase();
        if (email) emailMap.set(email, (emailMap.get(email) || 0) + 1);
      });

      // Process in CHUNK_SIZE chunks, yielding between each so the browser stays responsive.
      // Leads are pushed to parsedLeads per chunk - the table streams in real time.
      for (let i = 0; i < json.length; i += CHUNK_SIZE) {
        if (processingAborted) break;

        const chunk = json.slice(i, i + CHUNK_SIZE);
        const normalized = chunk.map((row) => normalizeRow(row));
        // index arg is unused when emailMap is provided, so 0 is fine
        normalized.forEach((lead) => validateLead(0, lead, emailMap));
        parsedLeads.value.push(...normalized);

        processedCount.value = parsedLeads.value.length;
        progress.value = Math.round(
          (parsedLeads.value.length / totalRows.value) * 100
        );

        await yield_();
      }

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

  // Combine "first name" / "last name" columns into name if no explicit "name" column
  const firstName = normalized["first name"] || normalized["firstname"] || "";
  const lastName = normalized["last name"] || normalized["lastname"] || "";
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const resolvedName = normalized["name"] || combinedName || "";

  const leadSourceName = normalized["leadsource"] || "";
  const treatmentName = normalized["treatment"] || "";
  const assignedUser = normalized["assigned"] || "";
  const cleanedEmail = cleanQuotedValue(normalized["email"]);

  let cleanedTelephone = normalizePhoneValue(normalized["telephone"]);
  if (!cleanedTelephone) {
    const fallbackKey = Object.keys(row || {}).find((key) => {
      const nk = normalizeLeadColumnHeader(key);
      return (
        nk === "telephone" ||
        ["phone", "mobile", "tel", "whatsapp", "cell"].some((k) =>
          nk.includes(k)
        )
      );
    });
    if (fallbackKey) cleanedTelephone = normalizePhoneValue(row[fallbackKey]);
  }

  return {
    name: resolvedName,
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
    leadStatus:
      statusLookup.value.get(
        (normalized["leadstatus"] || "").trim().toLowerCase()
      ) || "Uploaded",
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
    warnings: {},
    hasWarnings: false,
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
      return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const validateLead = (index, existingLead, emailMap = null) => {
  const lead = existingLead || parsedLeads.value[index];
  if (!lead) return;

  lead.errors = {};
  lead.hasErrors = false;
  lead.warnings = {};
  lead.hasWarnings = false;

  const cleanedEmail =
    typeof lead.email === "string"
      ? lead.email.trim().replace(/^['"]+|['"]+$/g, "")
      : "";
  lead.email = cleanedEmail;
  lead.telephone = normalizePhoneValue(lead.telephone);

  if (!lead.name?.trim()) {
    lead.warnings.name = "Name is missing";
    lead.hasWarnings = true;
  }

  if (!cleanedEmail) {
    lead.warnings.email = "Email is missing";
    lead.hasWarnings = true;
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      lead.warnings.email = "Invalid email format";
      lead.hasWarnings = true;
    } else {
      const emailKey = cleanedEmail.toLowerCase();
      const isDuplicate = emailMap
        ? (emailMap.get(emailKey) || 0) > 1
        : parsedLeads.value.some(
            (l, i) =>
              i !== index && (l.email || "").trim().toLowerCase() === emailKey
          );
      if (isDuplicate) {
        lead.warnings.email = "Duplicate email in upload";
        lead.hasWarnings = true;
      }
    }
  }

  if (!lead.telephone?.trim()) {
    lead.warnings.telephone = "Telephone is missing";
    lead.hasWarnings = true;
  }

  if (lead.originalLeadSource?.trim() && !lead.leadSourceId) {
    lead.warnings.leadSource = `Lead source "${lead.originalLeadSource}" not matched - select from dropdown.`;
    lead.hasWarnings = true;
  }

  if (lead.originalTreatment?.trim() && !lead.treatmentId) {
    lead.warnings.treatment = `Treatment "${lead.originalTreatment}" not matched - select from dropdown.`;
    lead.hasWarnings = true;
  }

  if (lead.leadStatus) {
    const status = statusLookup.value.get(lead.leadStatus.trim().toLowerCase());
    if (!status) {
      lead.warnings.leadStatus = "Unrecognised lead status - will default to Uploaded.";
      lead.hasWarnings = true;
      lead.leadStatus = "Uploaded";
    } else {
      lead.leadStatus = status;
    }
  } else {
    lead.leadStatus = "Uploaded";
  }

  if (lead.assignedUser?.trim() && !lead.userId) {
    lead.warnings.user = `User "${lead.assignedUser}" not found - select from dropdown.`;
    lead.hasWarnings = true;
  }

  if (lead.inquiryDate === null && lead.originalInquiryDate) {
    lead.warnings.inquiryDate = "Could not parse inquiry date - clear or correct it.";
    lead.hasWarnings = true;
  }

  if (lead.followUpDate === null && lead.originalFollowUpDate) {
    lead.warnings.followUpDate = "Could not parse follow-up date - clear or correct it.";
    lead.hasWarnings = true;
  }
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
  processingAborted = true;
  parsedLeads.value = [];
  uploadedFiles.value = [];
  fileUploader.value?.clearFiles?.();
  excelError.value = null;
  isProcessing.value = false;
  progress.value = 0;
  totalRows.value = 0;
  processedCount.value = 0;
  currentPage.value = 1;
};

const removeInvalidLead = (index) => {
  const lead = parsedLeads.value[index];
  if (!lead || (!lead.hasErrors && !lead.hasWarnings)) return;
  parsedLeads.value.splice(index, 1);
  // Clamp page if the last item on the current page was removed
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
  parsedLeads.value.forEach((_, i) => validateLead(i));
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
      leadSource: lead.leadSourceId
        ? props.leadSources.find((s) => s.id === lead.leadSourceId)?.name ||
          lead.originalLeadSource ||
          null
        : lead.originalLeadSource || null,
      leadStatus: lead.leadStatus || "Uploaded",
      treatment: lead.treatmentId
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
  processingAborted = true;
  fileUploader.value?.clearFiles?.();
  uploadedFiles.value = [];
  parsedLeads.value = [];
  excelError.value = null;
  isProcessing.value = false;
  isUploading.value = false;
  progress.value = 0;
  totalRows.value = 0;
  processedCount.value = 0;
  currentPage.value = 1;
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

.cell-warning {
  background-color: #fff8e1 !important;
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

.cell-wrap {
  position: relative;
}

.cell-overlay {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}
</style>

