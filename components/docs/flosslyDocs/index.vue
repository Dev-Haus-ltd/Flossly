<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Flossly docs</p>
      <p
        v-if="selectedFolder?.name"
        @click="goBack"
        style="color: blue !important; cursor: pointer"
      >
        {{ " / " + selectedFolder.name }}
      </p>
    </div>
    <div v-if="!showFolderDetails">
      <!-- recently assessed  -->
      <div class="py-2 px-5" v-if="recentFiles.length">
        <!-- Heading -->
        <div
          style="
            font-family: Poppins;
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
          :hideAddFolderButton="true"
          @open-folder="handleOpenFolder"
        />
      </div>
      <!-- all files table -->
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :files="files"
          :hideAddFileButton="true"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
        />
      </div>
    </div>
    <div v-else>
      <div class="my-5 px-5">
        <DocsMyDocsAllFiles
          :hideAddFileButton="true"
          :files="files.filter((x) => x.folderId === selectedFolder.id)"
          :folder="selectedFolder"
          @view-file="openFile"
          @edit-file="handleEdit"
          @download-file="handleDownload"
        />
      </div>
    </div>

    <DocsMyDocsViewFileDialog v-model="viewFileDialog" :doc="selectedDoc" />
  </div>
</template>

<script setup>
import { downloadFile } from "~/lib/misc";

const showFolderDetails = ref(false);

const viewFileDialog = ref(false);
const selectedFolder = ref(null);
const selectedDoc = ref(null);
const docStore = useDocStore();

const recentFiles = ref([]);
const files = ref([]);
const foldersList = ref([]);
onMounted(() => {
  getFolders();
  getRecentDocs();
  getDocs({ folderId: null });
});

const getFolders = () => {
  docStore
    .getSystemFolders()
    .then((res) => {
      if (res.code === 0) {
        foldersList.value = res.data;
      } else {
        //snack
      }
    })
    .catch((err) => {
      //snack
    });
};

const getRecentDocs = () => {
  docStore
    .recentDocs()
    .then((res) => {
      if (res.code === 0) {
        recentFiles.value = res.data;
      } else {
        //snack
      }
    })
    .catch((err) => {
      //snack
    });
};

const getDocs = (data) => {
  docStore
    .listSystemDocs(data)
    .then((res) => {
      if (res.code === 0) {
        files.value = res.data;
      } else {
        //snack
      }
    })
    .catch((err) => {
      //snack
    });
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
  selectedFolder.value = folder;
  showFolderDetails.value = true;
};

const goBack = () => {
  selectedFolder.value = null;
  showFolderDetails.value = false;
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
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #8a8a8a;
}
</style>
