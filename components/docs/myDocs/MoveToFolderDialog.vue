<template>
  <!-- Backdrop for click-outside detection -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="move-overlay-backdrop"
      @click="close"
    />
    <!-- Custom dropdown overlay -->
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="move-dropdown-overlay"
      :style="dropdownStyle"
      @click.stop
    >
      <v-card class="rounded-lg" style="width: 360px; max-height: 480px;">

        <!-- Search Field -->
        <div class="px-3 pt-3 pb-0">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search folders..."
            hide-details
            variant="solo"
            density="compact"
            class="input-bordered mb-2"
            flat
            prepend-inner-icon="mdi-magnify"
          />
        </div>
        <div class="px-3 pt-1 pb-1">
          <div class="custom-heading">
            Folders
          </div>
        </div>

        <!-- Folder List -->
        <div class="px-3 pt-2 pb-2 folder-list">
          <!-- Root option -->
          <div
            v-if="canMoveToRoot"
            class="pa-2 mb-1 d-flex align-center rounded folder-item"
            :class="{ 'selected-folder': selectedFolderId === null }"
            @click="moveToFolder(null)"
          >
            <v-icon class="mr-2" size="20" color="primary">mdi-folder-home</v-icon>
            <span style="font-size: 13px;">Root (My Docs)</span>
            <v-spacer />
          </div>

          <!-- Folders -->
          <template v-for="folder in filteredFolders" :key="folder.id">
            <div
              class="pa-2 mb-1 d-flex align-center rounded folder-item"
              :class="{
                'selected-folder': selectedFolderId === folder.id,
                'disabled-folder': isDisabledFolder(folder)
              }"
              @click="!isDisabledFolder(folder) && moveToFolder(folder.id)"
            >
              <img
                src="@/assets/images/flosslydocs/folder.svg"
                style="height: 24px; width: 24px"
                class="mr-2"
              />
              <div class="flex-grow-1" style="min-width: 0;">
                <div style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ getFolderPath(folder) }}
                </div>
                <div
                  v-if="folder.documentCount"
                  style="font-size: 11px; color: #737373;"
                >
                  {{ folder.documentCount }} file(s)
                </div>
              </div>
              <v-chip
                v-if="isDisabledFolder(folder)"
                size="x-small"
                color="grey"
                class="ml-1"
                style="font-size: 10px;"
              >
                {{ getDisabledReason(folder) }}
              </v-chip>
            </div>
          </template>

          <!-- No folders -->
          <div
            v-if="filteredFolders.length === 0 && !canMoveToRoot"
            class="text-center py-4"
          >
            <v-icon size="36" color="grey">mdi-folder-off-outline</v-icon>
            <p class="mt-2" style="color: #737373; font-size: 12px;">No folders available</p>
          </div>
        </div>
      </v-card>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: Boolean,
  activator: {
    type: Object,
    default: null,
  },
  item: {
    type: Object,
    default: null,
  },
  isFolder: {
    type: Boolean,
    default: false,
  },
  currentFolderId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "moved"]);

const docStore = useDocStore();
const mainStore = useMainStore();

const isOpen = ref(props.modelValue);
const searchQuery = ref("");
const selectedFolderId = ref(undefined);
const allFolders = ref([]);
const loading = ref(false);
const dropdownRef = ref(null);
const dropdownStyle = ref({});

// Calculate dropdown position based on activator element
const calculatePosition = () => {
  if (!props.activator || typeof window === 'undefined') {
    dropdownStyle.value = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    return;
  }

  try {
    const rect = props.activator.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 360;
    const dropdownHeight = 400; // Approximate max height

    // Position below the activator by default
    let top = rect.bottom + 4;
    let left = rect.left;

    // Check if dropdown would go off the bottom of the viewport
    if (top + dropdownHeight > viewportHeight) {
      // Position above the activator instead
      top = rect.top - dropdownHeight - 4;
      if (top < 0) {
        // If still doesn't fit, position at top with some margin
        top = 8;
      }
    }

    // Check if dropdown would go off the right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 8;
    }

    // Ensure left is not negative
    if (left < 8) left = 8;

    dropdownStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 2000,
    };
  } catch (e) {
    // Fallback to center if getBoundingClientRect fails
    dropdownStyle.value = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2000,
    };
  }
};

// Sync isOpen with modelValue and calculate position
watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val) {
    fetchAllFolders();
    selectedFolderId.value = undefined;
    searchQuery.value = "";
    // Calculate position on next tick when DOM is ready
    nextTick(() => {
      calculatePosition();
    });
  }
});

watch(isOpen, (val) => {
  emit("update:modelValue", val);
  if (!val) {
    // Reset state when closing
    searchQuery.value = "";
    selectedFolderId.value = undefined;
    loading.value = false;
  }
});

// Handle escape key to close
const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    close();
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
});

const fetchAllFolders = async () => {
  try {
    const res = await docStore.getAllFolders();
    if (res.code === 0) {
      allFolders.value = res.data || [];
    }
  } catch (err) {
    console.error(err);
  }
};

const canMoveToRoot = computed(() => {
  if (!props.item) return false;
  return props.isFolder
    ? props.item.parentId !== null
    : props.item.folderId !== null;
});

const filteredFolders = computed(() => {
  if (!searchQuery.value) return allFolders.value;
  return allFolders.value.filter(f =>
    f.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const isDisabledFolder = (folder) => {
  if (!props.item) return false;

  if (props.isFolder) {
    if (folder.id === props.item.id) return true;
    if (folder.id === props.item.parentId) return true;
    if (folder.parentId === props.item.id) return true;
    const hasSubfolders = allFolders.value.some(
      f => f.parentId === props.item.id
    );
    if (hasSubfolders && folder.parentId !== null) return true;
    if (folder.parentId !== null) return true;
  } else {
    if (folder.id === props.item.folderId) return true;
  }
  return false;
};

const getDisabledReason = (folder) => {
  if (props.isFolder) {
    if (folder.id === props.item.id) return "Same folder";
    if (folder.id === props.item.parentId) return "Current location";
    if (folder.parentId === props.item.id) return "Subfolder";
    if (folder.parentId !== null) return "Max depth";
  } else {
    if (folder.id === props.item.folderId) return "Current location";
  }
  return "";
};

const getFolderPath = (folder) =>
  folder.parent?.name
    ? `${folder.parent.name} / ${folder.name}`
    : folder.name;

const close = () => {
  isOpen.value = false;
  searchQuery.value = "";
  selectedFolderId.value = undefined;
  loading.value = false;
};

// Move to folder immediately on click (menu-style UX)
const moveToFolder = async (targetId) => {
  if (!props.item || loading.value) return;

  selectedFolderId.value = targetId;
  loading.value = true;

  try {
    const res = props.isFolder
      ? await docStore.moveFolder({
          folderId: props.item.id,
          targetParentId: targetId,
        })
      : await docStore.moveDocument({
          documentId: props.item.id,
          targetFolderId: targetId,
        });

    if (res.code === 0) {
      mainStore.setSnackbar({
        title: `${props.isFolder ? "Folder" : "File"} moved successfully`,
        type: "success",
      });
      // Close menu first, then emit moved event
      isOpen.value = false;
      // Use nextTick to ensure menu closes before parent cleanup
      nextTick(() => {
        emit("moved");
      });
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to move item",
        type: "error",
      });
      loading.value = false;
      selectedFolderId.value = undefined;
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "An error occurred",
      type: "error",
    });
    loading.value = false;
    selectedFolderId.value = undefined;
  }
};
</script>

<style scoped>
/* Backdrop for click-outside detection */
.move-overlay-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
  background: transparent;
}

/* Dropdown overlay container */
.move-dropdown-overlay {
  position: fixed;
  z-index: 2000;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.move-dropdown-overlay :deep(.v-card) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.folder-list {
  max-height: 280px;
  overflow-y: auto;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 36px;
  font-size: 13px;
}

.folder-item {
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.folder-item:hover:not(.disabled-folder) {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.selected-folder {
  background-color: #e3f2fd !important;
  border-color: #1976d2 !important;
}

.disabled-folder {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.custom-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0;
}

</style>

