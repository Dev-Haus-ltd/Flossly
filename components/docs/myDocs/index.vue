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
        />
      </div>
      <!-- all files table -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
          @addFileHandle="showAddFileDialog = true"
        />
      </div>
    </div>
    <div v-else>
      <!-- Show folders section when inside a folder (at depth < 2 for subfolder creation) -->
      <div class="mt-5 px-5" v-if="canCreateSubfolder">
        <DocsMyDocsFolders
          :folders="foldersList"
          :hideAddFolderButton="false"
          @open-folder="handleOpenFolder"
          @add-folder="showAddFolderDialog = true"
        />
      </div>
      <!-- Show files section -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :folder="selectedFolder"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
          @addFileHandle="showAddFileDialog = true"
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
      @onUpdate="updateView"
    />
    <!-- Vuetify dialog for other file types -->
    <DocsMyDocsViewFileDialog 
      v-else
      v-model="viewFileDialog" 
      :doc="selectedDoc" 
    />
  </div>
</template>

<script setup>
import { downloadFile } from "~/lib/misc";

const showFolderDetails = ref(false);
const showAddFolderDialog = ref(false);
const showAddFileDialog = ref(false);
const viewFileDialog = ref(false);
const selectedFolder = ref(null);
const selectedDoc = ref(null);
const docStore = useDocStore();

const recentFiles = ref([]);
const files = ref([]);
const foldersList = ref([]);

// Track folder navigation stack for breadcrumb and depth (max 2 levels)
const folderStack = ref([]);

// Computed property for current depth (0 = root, 1 = first level, 2 = second level)
const currentDepth = computed(() => folderStack.value.length);

// Check if we can create more subfolders (only allowed at depth 0 and 1)
const canCreateSubfolder = computed(() => currentDepth.value < 2);

onMounted(() => {
  getFolders();
  getRecentDocs();
  getDocs({ folderId: null });
});

const updateView = () => {
  const parentId = selectedFolder.value?.id || null;
  getFolders(parentId);
  getDocs({ folderId: parentId });
};

const getFolders = (parentId = null) => {
  docStore
    .getFolders({ parentId })
    .then((res) => {
      if (res.code === 0) {
        foldersList.value = res.data;
      }
    })
    .catch(() => {});
};

const getRecentDocs = () => {
  docStore
    .recentDocs()
    .then((res) => {
      if (res.code === 0) {
        recentFiles.value = res.data;
      }
    })
    .catch(() => {});
};

const getDocs = (data) => {
  docStore
    .listDocs(data)
    .then((res) => {
      if (res.code === 0) {
        files.value = res.data;
      }
    })
    .catch(() => {});
};

// Check if file is DOCX/DOC
const isDocxFile = (doc) => {
  if (!doc) return false
  const fileName = doc.name?.toLowerCase() || doc.link?.toLowerCase() || ''
  return fileName.endsWith('.docx') || fileName.endsWith('.doc')
}

const openFile = (file) => {
  selectedDoc.value = file;
  viewFileDialog.value = true;
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
