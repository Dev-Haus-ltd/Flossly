<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p
        class="mr-1"
        @click="goToRoot"
        :style="folderStack.length > 0 ? 'color: blue; cursor: pointer;' : ''"
      >
        My docs
      </p>
      <template v-for="(folder, index) in folderStack" :key="folder.id">
        <p class="mr-1">/</p>
        <p
          class="mr-1"
          @click="goToFolder(index)"
          :style="index < folderStack.length - 1 ? 'color: blue; cursor: pointer;' : ''"
        >
          {{ folder.name }}
        </p>
      </template>
    </div>
    <div v-if="isLite && storageMB" class="px-5 pt-4">
      <v-card rounded="lg" elevation="0" border class="usage-card">
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-2">
            <div>
              <p class="text-subtitle-2 font-weight-semibold mb-0">Lite storage usage</p>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ storageUsedLabel }} of {{ storageLimitLabel }} used
              </p>
            </div>
            <v-chip size="small" :color="storageTone" variant="tonal">
              {{ storageRemainingLabel }} left
            </v-chip>
          </div>
          <v-progress-linear
            :model-value="storagePct"
            :color="storageTone"
            bg-color="#e8eefc"
            rounded
            height="8"
          />
        </v-card-text>
      </v-card>
    </div>

    <div v-if="!showFolderDetails">
      <!-- recently assessed  -->
      <div class="py-2 px-5" v-if="recentFiles.length">
        <!-- Heading -->
        <div
          style="

            font-weight: 600;
            font-size: 14px;
            font-style: SemiBold;
          "
          class="my-4"
        >
          Recently Accessed Files
        </div>

        <!-- Grid -->
        <v-row>
          <v-col
            v-for="(file, index) in recentFiles"
            :key="index"
            cols="12"
            sm="6"
            md="3"
          >
            <DocsMyDocsRecentlyAccessed :file="file" @open="openFile" />
          </v-col>
        </v-row>
      </div>
      <!-- folders -->
      <div class="mt-5 px-5">
        <DocsMyDocsFolders
          :folders="foldersList"
          :hideAddFolderButton="!canCreateSubfolder"
          @open-folder="handleOpenFolder"
          @add-folder="showAddFolderDialog = true"
          @move-folder="handleMoveFolder"
          @edit-folder="handleEditFolder"
          @delete-folder="handleDeleteFolder"
        />
      </div>
      <!-- all files table -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :is-system="false"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
          @addFileHandle="showAddFileDialog = true"
          @move-file="handleMoveFile"
          @delete-file="handleDeleteFile"
        />
      </div>
    </div>
    <div v-else>
      <!-- Show folders section when inside a folder (up to 6 nested levels) -->
      <div class="mt-5 px-5" v-if="canCreateSubfolder">
        <DocsMyDocsFolders
          :folders="foldersList"
          :hideAddFolderButton="false"
          @open-folder="handleOpenFolder"
          @add-folder="showAddFolderDialog = true"
          @move-folder="handleMoveFolder"
          @edit-folder="handleEditFolder"
          @delete-folder="handleDeleteFolder"
        />
      </div>
      <!-- Show files section -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :folder="selectedFolder"
          :is-system="false"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
          @addFileHandle="showAddFileDialog = true"
          @move-file="handleMoveFile"
          @delete-file="handleDeleteFile"
        />
      </div>
    </div>
    <DocsMyDocsAddFolderDialog
      v-model="showAddFolderDialog"
      :parentId="selectedFolder?.id"
      @onUpdate="updateView"
    />
    <DocsMyDocsAddFileDialog
      v-model="showAddFileDialog"
      :foldersList="foldersList"
      :folder="selectedFolder"
      @onUpdate="updateView"
    />
    <!-- Custom dialog for DOCX files -->
    <DocsMyDocsDocxEditorDialog
      v-if="selectedDoc && isDocxFile(selectedDoc)"
      v-model="viewFileDialog"
      :doc="selectedDoc"
      :is-system="false"
      @onUpdate="updateView"
    />
    <!-- Vuetify dialog for other file types -->
    <DocsMyDocsViewFileDialog
      v-else
      v-model="viewFileDialog"
      :doc="selectedDoc"
      :is-system="false"
    />
    <!-- Move To Folder Dialog -->
    <DocsMyDocsMoveToFolderDialog
      v-model="moveMenuOpen"
      :activator="moveMenuActivator"
      :item="itemToMove"
      :isFolder="isMoveFolder"
      :currentFolderId="selectedFolder?.id"
      @moved="handleMoved"
    />
    <!-- Edit Folder Dialog -->
    <DocsMyDocsEditFolderDialog
      v-model="showEditFolderDialog"
      :folder="folderToEdit"
      @updated="handleFolderUpdated"
    />
    <!-- Delete Confirmation Dialog -->
    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      icon="mdi-information-outline"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      confirm-text="Delete"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { downloadFile } from "~/lib/misc";
import { resetUsageState } from "~/composables/useUsageSummary";

const route = useRoute();
const router = useRouter();
const showFolderDetails = ref(false);

const { usage, isLite, fetchUsage } = useUsageSummary()
const storageMB = computed(() => usage.value?.storageMB || null)
const storagePct = computed(() => {
  const current = Number(storageMB.value?.current || 0)
  const max = Number(storageMB.value?.max || 0)
  if (!max) return 0
  return Math.min(100, Math.round((current / max) * 100))
})
const formatStorage = (value) => {
  const mb = Number(value || 0)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}
const storageUsedLabel = computed(() => formatStorage(storageMB.value?.current))
const storageLimitLabel = computed(() => formatStorage(storageMB.value?.max))
const storageRemainingLabel = computed(() => {
  const remaining = Math.max(0, Number(storageMB.value?.max || 0) - Number(storageMB.value?.current || 0))
  return formatStorage(remaining)
})
const storageTone = computed(() => {
  if (storagePct.value >= 100) return 'error'
  if (storagePct.value >= 80) return 'warning'
  return 'primary'
})
const showAddFolderDialog = ref(false);
const showAddFileDialog = ref(false);
const viewFileDialog = ref(false);
const selectedFolder = ref(null);
const selectedDoc = ref(null);
const docStore = useDocStore();
const mainStore = useMainStore();

const recentFiles = ref([]);
const files = ref([]);
const foldersList = ref([]);

// Move dialog state
const moveMenuOpen = ref(false);
const moveMenuActivator = ref(null);
const itemToMove = ref(null);
const isMoveFolder = ref(false);


// Edit folder dialog state
const showEditFolderDialog = ref(false);
const folderToEdit = ref(null);

// Delete confirmation state
const showDeleteConfirm = ref(false);
const deleteConfirmTitle = ref("");
const deleteConfirmMessage = ref("");
const deleteLoading = ref(false);
const itemToDelete = ref(null);
const isDeleteFolder = ref(false);

// Track folder navigation stack for breadcrumb and depth (max 6 levels)
const folderStack = ref([]);

// Computed property for current depth (0 = root, 1 = first level, etc.)
const currentDepth = computed(() => folderStack.value.length);

// Check if we can create more subfolders (allow nesting through level 6)
const canCreateSubfolder = computed(() => currentDepth.value < 6);

onMounted(async () => {
  fetchUsage();
  await Promise.all([
    getFolders(),
    getRecentDocs(),
    getDocs({ folderId: null }),
  ]);
  await tryOpenDocFromQuery();
});

const updateView = () => {
  const parentId = selectedFolder.value?.id || null;
  getFolders(parentId);
  getDocs({ folderId: parentId });
  resetUsageState();
  fetchUsage();
};

const getFolders = (parentId = null) => {
  return docStore
    .getFolders({ parentId })
    .then((res) => {
      if (res.code === 0) {
        foldersList.value = res.data;
      }
    })
    .catch(() => {});
};

const getRecentDocs = () => {
  return docStore
    .recentDocs()
    .then((res) => {
      if (res.code === 0) {
        recentFiles.value = res.data;
      }
    })
    .catch(() => {});
};

const getDocs = (data) => {
  return docStore
    .listDocs(data)
    .then((res) => {
      if (res.code === 0) {
        files.value = res.data;
      }
    })
    .catch(() => {});
};

// Check if file is DOCX (editor supports .docx only)
const isDocxFile = (doc) => {
  if (!doc) return false
  const fileName = doc.name?.toLowerCase() || doc.link?.toLowerCase() || ''
  return fileName.endsWith('.docx')
}

const isXlsxFile = (file) => {
  const name = (file?.name || '').toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.xls')
}

const openFile = (file) => {
  if (isXlsxFile(file)) {
    handleDownload(file)
    return
  }
  selectedDoc.value = file;
  viewFileDialog.value = true;
};

const clearDocQueryParams = async () => {
  const nextQuery = { ...route.query };
  delete nextQuery.docId;
  delete nextQuery.folderId;
  await router.replace({ path: route.path, query: nextQuery });
};

const tryOpenDocFromQuery = async () => {
  const docId = Number(route.query?.docId);
  if (!docId) return;

  try {
    let doc =
      recentFiles.value.find((x) => Number(x?.id) === docId) ||
      files.value.find((x) => Number(x?.id) === docId);

    if (!doc) {
      const recentRes = await docStore.recentDocs();
      if (recentRes?.code === 0) {
        recentFiles.value = recentRes.data || [];
        doc = recentFiles.value.find((x) => Number(x?.id) === docId);
      }
    }

    if (!doc) {
      const folderId = Number(route.query?.folderId);
      if (folderId) {
        const folderDocsRes = await docStore.listDocs({ folderId });
        if (folderDocsRes?.code === 0) {
          doc = (folderDocsRes.data || []).find((x) => Number(x?.id) === docId);
        }
      }
    }

    if (!doc) {
      const rootDocsRes = await docStore.listDocs({ folderId: null });
      if (rootDocsRes?.code === 0) {
        doc = (rootDocsRes.data || []).find((x) => Number(x?.id) === docId);
      }
    }

    if (doc) {
      openFile(doc);
    }
  } finally {
    await clearDocQueryParams();
  }
};

const handleEdit = (file) => {
  console.log("Opening file:", file);
};

const handleDownload = (file) => {
  downloadFile(file);
};

const handleOpenFolder = (folder) => {
  folderStack.value.push(folder);
  selectedFolder.value = folder;
  showFolderDetails.value = true;
  // Load subfolders and files for the selected folder
  getFolders(folder.id);
  getDocs({ folderId: folder.id });
};

const goToRoot = () => {
  folderStack.value = [];
  selectedFolder.value = null;
  showFolderDetails.value = false;
  getFolders();
  getDocs({ folderId: null });
};

const goToFolder = (index) => {
  // Navigate to specific folder in breadcrumb
  if (index < folderStack.value.length - 1) {
    const targetFolder = folderStack.value[index];
    folderStack.value = folderStack.value.slice(0, index + 1);
    selectedFolder.value = targetFolder;
    getFolders(targetFolder.id);
    getDocs({ folderId: targetFolder.id });
  }
};

// Move file handler
const handleMoveFile = ({ file, event }) => {
  itemToMove.value = file;
  isMoveFolder.value = false;
  moveMenuActivator.value = event.currentTarget;
  moveMenuOpen.value = true;
};

// Move folder handler
const handleMoveFolder = ({ folder, event }) => {
  itemToMove.value = folder;
  isMoveFolder.value = true;
  moveMenuActivator.value = event.currentTarget;
  moveMenuOpen.value = true;
};

// Handle move completion
const handleMoved = () => {
  // Menu is already closed by the MoveToFolderDialog component
  // Just need to clean up the state and refresh the view

  // Use setTimeout to ensure DOM has settled after menu close animation
  setTimeout(() => {
    moveMenuActivator.value = null;
    itemToMove.value = null;
    isMoveFolder.value = false;
  }, 100);

  updateView();
  getRecentDocs();
};


// Edit folder handler
const handleEditFolder = (folder) => {
  folderToEdit.value = folder;
  showEditFolderDialog.value = true;
};

// Handle folder updated
const handleFolderUpdated = () => {
  showEditFolderDialog.value = false;
  folderToEdit.value = null;
  updateView();
};

// Delete file handler
const handleDeleteFile = (file) => {
  itemToDelete.value = file;
  isDeleteFolder.value = false;
  deleteConfirmTitle.value = "Delete File";
  deleteConfirmMessage.value = `Are you sure you want to delete "${file.name}"? This action cannot be undone.`;
  showDeleteConfirm.value = true;
};

// Delete folder handler
const handleDeleteFolder = (folder) => {
  itemToDelete.value = folder;
  isDeleteFolder.value = true;
  deleteConfirmTitle.value = "Delete Folder";
  deleteConfirmMessage.value = `Are you sure you want to delete "${folder.name}" and all its contents? This action cannot be undone.`;
  showDeleteConfirm.value = true;
};

// Confirm delete
const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  deleteLoading.value = true;
  try {
    let res;
    if (isDeleteFolder.value) {
      res = await docStore.deleteFolder({ id: itemToDelete.value.id });
    } else {
      res = await docStore.deleteDoc({ id: itemToDelete.value.id });
    }

    if (res.code === 0) {
      mainStore.setSnackbar({
        title: `${isDeleteFolder.value ? 'Folder' : 'File'} deleted successfully`,
        type: "success",
      });
      resetUsageState();
      await fetchUsage();
      updateView();
      getRecentDocs();
    } else {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Failed to delete",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An error occurred",
      type: "error",
    });
  } finally {
    deleteLoading.value = false;
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
  }
};
</script>

<style scoped lang="scss">
.parent {
  background-color: white;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}
.head {
  
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #8a8a8a;
}
</style>
