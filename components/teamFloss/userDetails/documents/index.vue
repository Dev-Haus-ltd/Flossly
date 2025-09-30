<template>
  <div>
    <!-- Toolbar: right = search + upload -->
    <div class="d-flex align-center justify-end my-4" style="gap: 12px">
      <!-- Search -->
      <v-text-field
        v-model="search"
        placeholder="Search documents"
        density="compact"
        hide-details
        append-inner-icon="mdi-magnify"
        class="rounded-lg input-bordered"
        max-width="200"
        variant="solo"
        flat
      />

      <!-- Upload -->
      <!-- <v-btn color="primary" class="rounded-lg" flat >
        Upload Document
      </v-btn> -->
    </div>

    <!-- Expansion panels -->
    <v-expansion-panels v-model="openedPanels" multiple flat>
      <!-- Recruitment -->
      <v-expansion-panel class="border-sm">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <h3 class="expan-title mr-3">Recruitment Folder</h3>
            <v-chip class="rounded-lg" size="large">
              <span style="color: #b9308a">
                {{ recruitmentDocs.length + " files" }}
              </span>
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="filteredRecruitment"
            item-value="id"
            hover
            class="rota-table"
          >
            <!-- Header slot -->
            <template v-slot:headers="{ columns, getSortIcon, toggleSort }">
              <tr>
                <template v-for="column in columns" :key="column.key">
                  <th
                    :style="{
                      padding: '6px 12px',
                      backgroundColor: '#F6F6F6',
                      fontSize: '14px',
                    }"
                  >
                    <div
                      class="d-flex align-center justify-space-between"
                      v-if="column.sortable"
                    >
                      <span>{{ column.title }}</span>
                      <v-icon
                        size="14"
                        class="ml-1"
                        @click="toggleSort(column)"
                      >
                        {{ getSortIcon(column) }}
                      </v-icon>
                    </div>
                    <div v-else>{{ column.title }}</div>
                  </th>
                </template>
              </tr>
            </template>

            <!-- Cells -->
            <template v-slot:[`item.name`]="{ item }">
              <div class="px-3">{{ item.name }}</div>
            </template>

            <template v-slot:[`item.uploadedDate`]="{ item }">
              <div class="px-3">
                {{ item.uploadedDate ? parsedDate(item.uploadedDate) : "—" }}
              </div>
            </template>

            <template v-slot:[`item.status`]="{ item }">
              <div class="px-3">
                <v-chip :color="getStatusColor(item.status)" label size="small">
                  {{ item.status }}
                </v-chip>
              </div>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <div class="px-3 d-flex align-center">
                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/teamfloss/userDetails/view.svg"
                  alt="View"
                  class="action-icon"
                  @click.stop="onView(item)"
                />

                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/download.svg"
                  alt="Edit"
                  class="action-icon ml-3"
                  @click.stop="onDownload(item)"
                />
                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/delete.svg"
                  alt="delete"
                  class="action-icon ml-3"
                  @click.stop="onDelete(item)"
                />
                <v-btn
                  v-if="item.status === 'Pending'"
                  variant="text"
                  color="#266DF0"
                  prepend-icon="mdi-upload"
                  class="px-0"
                  @click="onUpload(item)"
                >
                  Upload Document
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Training -->
      <v-expansion-panel class="border-sm">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <h3 class="expan-title mr-3">Training Folder</h3>

            <v-chip class="rounded-lg" size="large">
              <span style="color: #b9308a">
                {{ trainingDocs.length + " files" }}
              </span>
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="filteredTraining"
            item-value="id"
            hover
            class="rota-table"
          >
            <!-- Reuse same slots -->
            <template v-slot:headers="{ columns, getSortIcon, toggleSort }">
              <tr>
                <template v-for="column in columns" :key="column.key">
                  <th
                    :style="{
                      padding: '6px 12px',
                      backgroundColor: '#F6F6F6',
                      fontSize: '14px',
                    }"
                  >
                    <div
                      class="d-flex align-center justify-space-between"
                      v-if="column.sortable"
                    >
                      <span>{{ column.title }}</span>
                      <v-icon
                        size="14"
                        class="ml-1"
                        @click="toggleSort(column)"
                      >
                        {{ getSortIcon(column) }}
                      </v-icon>
                    </div>
                    <div v-else>{{ column.title }}</div>
                  </th>
                </template>
              </tr>
            </template>

            <!-- Reuse cell slots -->
            <template v-slot:[`item.name`]="{ item }">
              <div class="px-3">{{ item.name }}</div>
            </template>

            <template v-slot:[`item.uploadedDate`]="{ item }">
              <div class="px-3">
                {{ item.uploadedDate ? parsedDate(item.uploadedDate) : "—" }}
              </div>
            </template>

            <template v-slot:[`item.status`]="{ item }">
              <div class="px-3">
                <v-chip :color="getStatusColor(item.status)" label size="small">
                  {{ item.status }}
                </v-chip>
              </div>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <div class="px-3 d-flex align-center">
                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/teamfloss/userDetails/view.svg"
                  alt="View"
                  class="action-icon"
                  @click.stop="onView(item)"
                />
                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/download.svg"
                  alt="Edit"
                  class="action-icon ml-3"
                  @click.stop="onDownload(item)"
                />
                <img
                  v-if="item.status === 'Completed'"
                  src="@/assets/icons/delete.svg"
                  alt="Edit"
                  class="action-icon ml-3"
                  @click.stop="onDelete(item)"
                />
                <v-btn
                  v-if="item.status === 'Pending'"
                  variant="text"
                  color="#266DF0"
                  prepend-icon="mdi-upload"
                  @click="onUpload(item)"
                >
                  Upload Document
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <DocsMyDocsViewFileDialog v-model="viewFileDialog" :doc="selectedDoc" />
    <TeamFlossUserDetailsDocumentsUploadDocument
      v-model="isDialogOpen"
      :doc="selectedDoc"
      @onUpdate="handleUpdate"
      :user="user"
    />
  </div>
</template>

<script setup>
import { parsedDate } from "~/lib/dateFormatter";
import { downloadFile } from "~/lib/misc";
const { user } = defineProps({ user: Object });
const authStore = useAuthStore();
const store = useMainStore();
const userDocs = ref([]);
const search = ref("");
const openedPanels = ref([0]);
const viewFileDialog = ref(false);
const selectedDoc = ref(null);

const isDialogOpen = ref(false);
const headers = [
  { title: "Name of Document", key: "name", sortable: true },
  { title: "Upload Date", key: "uploadedDate", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

onMounted(() => {
  getUserDocs();
});

const getUserDocs = () => {
  authStore.getUserHrDocuments({ userId: user.id }).then((res) => {
    if (res.code === 0) {
      userDocs.value = res.data;
    }
  });
};

const recruitmentDocs = computed(() =>
  userDocs.value.filter((doc) => doc.type === "Recruitment")
);
const trainingDocs = computed(() =>
  userDocs.value.filter((doc) => doc.type === "Training")
);

const matchesSearch = (item) => {
  if (!search.value) return true;
  const q = search.value.toLowerCase();
  return (
    (item.name && item.name.toLowerCase().includes(q)) ||
    (item.status && item.status.toLowerCase().includes(q))
  );
};

const filteredRecruitment = computed(() =>
  recruitmentDocs.value.filter((it) => matchesSearch(it))
);
const filteredTraining = computed(() =>
  trainingDocs.value.filter((it) => matchesSearch(it))
);

function getStatusColor(status) {
  switch (status) {
    case "Pending":
      return "#FF7C00"; // orange
    case "Completed":
      return "#33B93C"; // green
    default:
      return "#6D6D6D"; // gray
  }
}

function onUpload(file) {
  selectedDoc.value = file;
  isDialogOpen.value = true;
  console.log("Upload button clicked");
}
function onDownload(file) {
  downloadFile(file);
}
async function onDelete(file) {
  try {
    const res = await authStore.removeUserDoc({ id: file.id });

    if (res.code === 0) {
      store.setSnackbar({
        title:
          res.data?.message || res.message || "Document deleted successfully",
        type: "Success",
      });
      getUserDocs();
      // Optional: refresh docs list
      // await authStore.getUserDocs()
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Failed to delete document",
        type: "Error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "Something went wrong while deleting",
      type: "Error",
    });
  }
}

function onView(file) {
  selectedDoc.value = file;
  viewFileDialog.value = true;
  console.log("Viewing doc:", file);
}

//   function onEdit(item) {
//     console.log("Editing doc:", item);
//   }

const handleUpdate = () => {
  // Re-fetch documents OR update list
  getUserDocs();
};
</script>
<style scoped>
/* Expansion table styles (same as rota) */
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

/* First column double width */
:deep(.v-table__wrapper table th:first-child),
:deep(.v-table__wrapper table td:first-child) {
  width: 40% !important;
}

/* Other columns share remaining space */
:deep(.v-table__wrapper table th:not(:first-child)),
:deep(.v-table__wrapper table td:not(:first-child)) {
  width: 20% !important;
}

/* Keep rest of your styling (borders, hover, chips, etc.) */
:deep(.v-table .v-table__wrapper > table > thead > tr > th) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep(.v-table .v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep(.v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child)),
.v-table .v-table__wrapper > table > tbody > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

/* Chips */
.chip-recruitment {
  background-color: #8c3bc51a !important;
  color: #8c3bc5 !important;
}
.chip-training {
  background-color: #0165b91a !important;
  color: #0165b9 !important;
}
.chip-count {
  background-color: #f3f3f3 !important;
  color: #333 !important;
}

/* Status chips */
.chip-approved {
  background-color: #33b93c1a !important;
  color: #33b93c !important;
}
.chip-pending {
  background-color: #ff7c001a !important;
  color: #ff7c00 !important;
}
.chip-rejected {
  background-color: #d32f2f1a !important;
  color: #d32f2f !important;
}

/* Search input */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}

/* Action icons */
.action-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}
.action-icon:hover {
  opacity: 1;
}
.expan-title {
  
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;

  color: #1e1e1e;
}
</style>
