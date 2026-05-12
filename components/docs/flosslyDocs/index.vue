<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p
        class="mr-1"
        @click="goToRoot"
        :style="folderStack.length > 0 ? 'color: blue; cursor: pointer;' : ''"
      >
        Flossly docs
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

    <div v-if="folderStack.length === 0">
      <!-- recently accessed -->
      <div class="py-2 px-5" v-if="recentFiles.length">
        <div style="font-weight: 600; font-size: 14px;" class="my-4">
          Recently Accessed Files
        </div>
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
      <!-- root folders -->
      <div class="mt-5 px-5">
        <DocsMyDocsFolders
          :folders="foldersList"
          :hideAddFolderButton="true"
          @open-folder="handleOpenFolder"
        />
      </div>
      <!-- root files -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :hideAddFileButton="true"
          :is-system="true"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
        />
      </div>
    </div>

    <div v-else>
      <!-- subfolders (only when depth < 3) -->
      <div class="mt-5 px-5" v-if="folderStack.length < 3">
        <DocsMyDocsFolders
          :folders="foldersList"
          :hideAddFolderButton="true"
          @open-folder="handleOpenFolder"
        />
      </div>
      <!-- files inside current folder -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :folder="selectedFolder"
          :hideAddFileButton="true"
          :is-system="true"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
        />
      </div>
    </div>

    <DocsMyDocsViewFileDialog v-model="viewFileDialog" :doc="selectedDoc" :is-system="true" />
  </div>
</template>

<script setup>
import { downloadFile } from "~/lib/misc";

const viewFileDialog = ref(false);
const selectedDoc = ref(null);
const docStore = useDocStore();

const recentFiles = ref([]);
const files = ref([]);
const foldersList = ref([]);
const folderStack = ref([]);

const selectedFolder = computed(() => folderStack.value[folderStack.value.length - 1] ?? null);

onMounted(() => {
  getSystemFolders();
  getRecentDocs();
  getSystemDocs({ folderId: null });
});

const getSystemFolders = (parentId = null) => {
  docStore
    .getSystemFolders({ parentId })
    .then((res) => {
      if (res.code === 0) foldersList.value = res.data;
    })
    .catch(() => {});
};

const getRecentDocs = () => {
  docStore
    .recentDocs()
    .then((res) => {
      if (res.code === 0) recentFiles.value = res.data;
    })
    .catch(() => {});
};

const getSystemDocs = (data) => {
  docStore
    .listSystemDocs(data)
    .then((res) => {
      if (res.code === 0) files.value = res.data;
    })
    .catch(() => {});
};

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
  getSystemFolders(folder.id);
  getSystemDocs({ folderId: folder.id });
};

const goToRoot = () => {
  folderStack.value = [];
  getSystemFolders();
  getSystemDocs({ folderId: null });
};

const goToFolder = (index) => {
  if (index < folderStack.value.length - 1) {
    const target = folderStack.value[index];
    folderStack.value = folderStack.value.slice(0, index + 1);
    getSystemFolders(target.id);
    getSystemDocs({ folderId: target.id });
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
</style>
