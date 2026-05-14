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
      <!-- subfolders (only when depth < 6) -->
      <div class="mt-5 px-5" v-if="folderStack.length < 6">
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
import { resetUsageState } from "~/composables/useUsageSummary";

const viewFileDialog = ref(false);
const selectedDoc = ref(null);
const docStore = useDocStore();
const { usage, isLite, fetchUsage } = useUsageSummary()

const recentFiles = ref([]);
const files = ref([]);
const foldersList = ref([]);
const folderStack = ref([]);
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

const selectedFolder = computed(() => folderStack.value[folderStack.value.length - 1] ?? null);

onMounted(() => {
  resetUsageState();
  fetchUsage();
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
