<template>
  <div style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: hidden">
    <!-- Header -->
    <div
      style="border-bottom: 1px solid #dbdbdb"
      class="d-flex align-center justify-space-between px-4 py-2 files-card"
    >
      <h3
        style="
          
          font-weight: 600;
          font-size: 14px;
          margin: 0;
        "
      >
        {{ folder && folder.name ? folder.name : " All Files" }}
      </h3>
      <div class="d-flex align-center gap-3">
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search files"
          hide-details
          variant="solo"
          class="input-bordered"
          flat
          append-inner-icon="mdi-magnify"
        />
        <v-btn
          v-if="!hideAddFileButton"
          class="py-2 ml-2 file-btn"
          color="primary"
          flat
          @click="$emit('addFileHandle')"
        >
          <v-icon start>mdi-plus-circle-outline</v-icon>
          Add File
        </v-btn>
      </div>
    </div>

    <!-- Table -->
    <v-table class="custom-table" density="comfortable">
      <thead>
        <tr>
          <th style="width: 600px">Name of Document</th>
          <th v-if="!folder">Folder</th>
          <th>Modified Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(file, index) in filteredFiles" :key="index">
          <td>
            <div class="px-4" style="width: 60%">
              <p
                contenteditable="true"
                @blur="updateValueRow(file, 'name', $event)"
                class="editable-text"
              >
                {{ file.name }}
              </p>
            </div>
          </td>
          <td v-if="!folder">
            <div class="px-4">{{ file.folder?.name }}</div>
          </td>
          <td>
            <div class="px-4">{{ getParsedDate(file.updatedAt) }}</div>
          </td>
          <td>
            <div class="px-4 d-flex align-center gap-2">
              <!-- View -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/view.svg"
                    alt="View"
                    width="20"
                    height="20"
                    class="mr-2"
                    style="cursor: pointer"
                    @click="$emit('view-file', file)"
                  />
                </template>
                <span>View</span>
              </v-tooltip>

              <!-- Copy Link -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/copy.svg"
                    alt="Copy link"
                    width="20"
                    height="20"
                    class="mr-2"
                    style="cursor: pointer"
                    @click="copyLink(file)"
                  />
                </template>
                <span>Copy link</span>
              </v-tooltip>

              <!-- Download -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/download.svg"
                    alt="Download"
                    width="20"
                    height="20"
                    class="mr-2"
                    style="cursor: pointer"
                    @click="$emit('download-file', file)"
                  />
                </template>
                <span>Download</span>
              </v-tooltip>

              <!-- Move -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/move.svg"
                    alt="Move to folder"
                    width="20"
                    height="20"
                    class="mr-2"
                    style="cursor: pointer"
                    @click="$emit('move-file', { file, event: $event })"
                  />
                </template>
                <span>Move to folder</span>
              </v-tooltip>

              <!-- Delete -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <img
                    v-bind="props"
                    src="@/assets/icons/delete_1.svg"
                    alt="Delete"
                    width="20"
                    height="20"
                    style="cursor: pointer"
                    @click="$emit('delete-file', file)"
                  />
                </template>
                <span>Delete</span>
              </v-tooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { parsedDate } from "~/lib/dateFormatter";
import { buildAbsoluteLink } from "~/lib/misc";

const props = defineProps({
  files: {
    type: Array,
    default: () => [],
  },
  hideAddFileButton: {
    type: Boolean,
    default: false,
  },
  folder: {
    type: Object,
    default: null,
  },
});

const search = ref("");
const runtimeConfig = useRuntimeConfig();
const mainStore = useMainStore();

const filteredFiles = computed(() =>
  props.files.filter(
    (file) =>
      file.name.toLowerCase().includes(search.value.toLowerCase()) ||
      file.folder?.name?.toLowerCase().includes(search.value.toLowerCase())
  )
);

const getParsedDate = (date) => {
  return parsedDate(date);
};

const updateValueRow = (file, field, event) => {
  console.log(file);
  const newValue = event.target.innerText.trim();
  console.log("Updated value:", newValue);
  file[field] = newValue;
};

const copyLink = async (file) => {
  const url = buildAbsoluteLink(file?.link || "", runtimeConfig.public?.BASE_URL);
  if (!url) {
    mainStore.setSnackbar({ title: "Document link unavailable", type: "error" });
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    mainStore.setSnackbar({ title: "Document link copied", type: "success" });
  } catch (e) {
    mainStore.setSnackbar({ title: "Failed to copy link", type: "error" });
  }
};
</script>

<style scoped>
:deep(.v-table__wrapper table) {
  width: 100% !important;
  border-collapse: collapse;
  table-layout: fixed; /* Ensures columns align */
}

.custom-table th,
.custom-table td {
  height: 48px;
  font-weight: 400;
  font-size: 14px;
  font-style: normal;
  line-height: 100%;
  color: #1E1E1E;
  padding: 8px 12px; /* same for both */
  border: 1px solid #dbdbdb;
  text-align: left;
  vertical-align: middle;
}

.custom-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.custom-table tbody tr:hover {
  background-color: #f9f9f9;
}

/* Remove borders overlapping with parent container */
.custom-table th:first-child,
.custom-table td:first-child {
  border-left: none;
}

.custom-table th:last-child,
.custom-table td:last-child {
  border-right: none;
}

.custom-table thead tr:first-child th {
  border-top: none;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #FAFAFA !important;
  border-radius: 8px !important;
  min-height: 46px;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  color: #737373;
  font-style: normal;
  width: 105px;
}
::v-deep(.small-input input) {
  font-size: 14px !important;
  
}
.files-card {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.file-btn {
  font-weight: 400;
  font-size: 14px;
  color: #1E1E1E;
  font-style: normal;
  font-family: Inter, sans-serif;
  line-height: 130%;
  align-items: center;
  border-radius: 8px;
  height: 46px;
  min-height: 46px;
  width: 135px;
}
</style>
