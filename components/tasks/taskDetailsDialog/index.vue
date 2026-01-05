<template>
  <div>
    <v-dialog :model-value="props.modelValue" max-width="1000px" persistent>
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 75vh">
        <!-- Header -->
        <div
          class="pa-4 d-flex justify-space-between align-center"
        >
          <h3 class="title m-0">{{ taskDetails.title }}</h3>
          <div class="d-flex align-center">
            <v-tooltip text="You will get 10 points on completion of each task">
              <template #activator="{ props }">
                <v-chip
                  v-bind="props"
                  class="bonus-chip"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-star"
                  label
                >
                  +10
                </v-chip>
              </template>
            </v-tooltip>
            <!-- <v-menu location="bottom right">
              <template #activator="{ props }">
                <v-btn
                  icon
                  v-bind="props"
                  size="32"
                  variant="text"
                  class="ml-2 mr-1"
                >
                  <v-icon size="18">mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>

              <v-card style="min-width: 130px">
                <v-list density="compact">
                  <v-list-item @click="editItem" class="menu-item" rounded="lg">
                    <template #prepend>
                      <img src="@/assets/tasks/edit.svg" alt="Edit" width="18" height="18" class="mr-2" />
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                    @click="anotherAction"
                    class="menu-item"
                    rounded="lg"
                  >
                    <template #prepend>
                      <v-icon size="18" class="mr-2">mdi-eye</v-icon>
                    </template>
                    <v-list-item-title>View</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-menu> -->

            <v-btn flat icon size="32" @click="$emit('close')">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Scrollable content -->
        <div
          class="flex-grow-1 px-4 py-2"
          style="overflow-y: auto;"
        >
          <v-tabs v-model="tab" class="custom-tabs px-4" slider-color="primary">
          <v-tab value="overview" class="tab-text">
            <img
              src="@/assets/icons/overview.svg"
              alt="Overview"
              width="18"
              height="18"
              class="mr-2"
            />
            Overview
          </v-tab>

          <v-tab value="comments" class="tab-text">
            <v-icon size="18" class="mr-2">mdi-comment-text</v-icon>
            Comments
          </v-tab>

          <v-tab value="checklist" class="tab-text">
            <img
              src="@/assets/icons/checklist.svg"
              alt="Checklist"
              width="18"
              height="18"
              class="mr-2"
              />
              Checklist
            </v-tab>

            <v-tab value="files" class="tab-text">
              <img
                src="@/assets/icons/files.svg"
                alt="Files"
                width="18"
                height="18"
                class="mr-2"
              />
              Files
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
          <div
            class="px-9 py-4 mt-6"
            v-if="taskDetails && taskDetails.status && taskDetails.priority"
          >
                <v-row>
                  <!-- Created Time -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/created.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Created Time</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{
                      formatDate(taskDetails.createdAt)
                    }}</span>
                  </v-col>

                  <!-- Category -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/category.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Category</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text"> {{ taskDetails.taskDetails?.category?.name }}</span>
                  </v-col>

                  <!-- Priority -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/priority.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Priority</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-chip
                      :color="taskDetails.priority.color"
                      size="small"
                      label
                    >
                   {{  taskDetails.priority.name }}
                   
                    </v-chip>
                  </v-col>

                  <!-- Frequency -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/frequency.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Frequency</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{ taskDetails.frequency }}</span>
                  </v-col>

                  <!-- Status -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/status.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Status</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-chip
                      class="px-3"
                      :color="taskDetails.status.color"
                      size="small"
                      label
                    >
                      {{
                        taskDetails.status.name
                      }}
                    </v-chip>
                  </v-col>

                  <!-- Due Date -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/due-date.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Due Date</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <span class="value-text">{{
                      taskDetails.dueDate ? formatDateDDMMYYYY(taskDetails.dueDate) : "No due date"
                    }}</span>
                  </v-col>

                  <!-- Assignee -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <img
                        src="@/assets/icons/assignee.svg"
                        width="20"
                        class="mr-2"
                      />
                      <span class="key-text">Assignee</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <Avatar
                      :user="{ fullName: taskDetails.assignedUser.fullName }"
                    />
                  </v-col>
                </v-row>

                <!-- Task Description -->
                <v-card class="mt-6 pa-4" elevation="0">
                  <h4 class="mb-2 cust-lbl">
                   Task Description
                  </h4>
                  <v-textarea
                    v-model="taskDescription"
                    variant="solo"
                    placeholder="Type here"
                    density="compact"
                    elevation="0"
                    class="mt-1"
                    flat
                    rows="2"
                    @update:model-value="touchDirty"
                  />
                </v-card>
          </div>
        </v-tabs-window-item>

        <v-tabs-window-item value="comments">
          <div class="px-9 py-4 mt-4 comments-wrap">
            <div
              class="comment-list"
              ref="commentListRef"
              @scroll.passive="onCommentsScroll"
            >
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-header">
                  <div class="comment-author">
                    <Avatar :user="{ fullName: comment.author?.fullName }" />
                    <div class="author-meta">
                      <div class="name">{{ comment.author?.fullName || 'Unknown' }}</div>
                      <div class="timestamp">{{ formatDate(comment.createdAt) }}</div>
                    </div>
                  </div>
                  <div class="comment-actions">
                    <v-btn
                      icon
                      size="24"
                      variant="text"
                      class="comment-action-btn"
                      @click="startEditComment(comment)"
                    >
                      <img src="@/assets/tasks/edit.svg" alt="Edit" width="18" height="18" />
                    </v-btn>
                    <v-btn
                      icon
                      size="24"
                      variant="text"
                      class="comment-action-btn"
                      @click="deleteComment(comment)"
                    >
                      <img src="@/assets/tasks/delete.svg" alt="Delete" width="18" height="18" style="filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);" />
                    </v-btn>
                  </div>
                </div>
                <div class="comment-body" v-if="editingCommentId !== comment.id">
                  {{ comment.comment }}
                </div>
                <div v-else class="mt-2">
                  <v-textarea
                    v-model="editCommentText"
                    variant="outlined"
                    density="compact"
                    auto-grow
                    rows="2"
                  />
                  <div class="d-flex justify-end mt-2" style="gap: 8px;">
                    <v-btn size="small" variant="text" @click="cancelEdit">Cancel</v-btn>
                    <v-btn size="small" color="primary" flat @click="saveEditComment(comment)">Save</v-btn>
                  </div>
                </div>
              </div>
              <div v-if="!comments.length" class="text-caption text-grey mt-1">
                No comments yet. Be the first to add one.
              </div>
            </div>
            <v-textarea
              v-model="newComment"
              placeholder="Add a comment"
              density="compact"
              elevation="0"
              class="mt-3 sticky-composer"
              rows="2"
            />
            <div class="d-flex justify-end mt-2">
              <v-btn
                color="primary"
                size="small"
                flat
                rounded="lg"
                @click="addComment"
              >
                Add Comment
              </v-btn>
            </div>
          </div>
        </v-tabs-window-item>

            <v-tabs-window-item value="checklist"> 
           

              <TasksTaskDetailsDialogChecklistTabDetails
                :checklist="taskDetails.userTaskChecklist"
                :userTaskId="taskDetails.id" 
                :title="taskDetails?.taskDetails?.title"
              />
            </v-tabs-window-item>
            <v-tabs-window-item value="files">
              <div class="pa-4">
                <CommonDirectFileUpload @upload="uploadFile"  />
                <v-progress-linear
                  v-if="isUploading"
                  class="mt-3"
                  :model-value="uploadProgress"
                  height="6"
                  color="primary"
                  rounded
                  striped
                />
                <div class="mt-5 attachments-grid">
                  <div
                    v-for="file in taskDetails.attachments"
                    :key="file.id"
                    class="attachment-item"
                  >
                    <v-card
                      class="d-flex flex-column justify-space-between pa-3 card-equal"
                      elevation="0"
                    >
                      <!-- Top Right Icons -->
                      <div
                        class="d-flex flex-row align-center"
                        style="
                          position: absolute;
                          top: 8px;
                          right: 8px;
                          z-index: 1;
                          gap: 4px;
                        "
                      >
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          @click="viewFile(file)"
                        >
                          <img src="@/assets/icons/view.svg" alt="View" width="16" height="16" />
                        </v-btn>
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          :href="file.link"
                          target="_blank"
                        >
                          <img src="@/assets/tasks/download.svg" alt="Download" width="16" height="16" />
                        </v-btn>
                        <v-btn icon size="x-small" variant="text" @click="deleteFile(file)">
                          <img src="@/assets/tasks/delete.svg" alt="Delete" width="16" height="16" style="filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);" />
                        </v-btn>
                      </div>

                      <!-- Center File Icon or Preview -->
                      <div class="image-preview-wrapper">
                        <img
                          v-if="isImageFile(file) && file.link && !imageLoadErrors[file.id]"
                          :src="getImageUrl(file.link)"
                          :alt="file.title"
                          class="file-preview-image"
                          @error="handleImageError($event, file)"
                          @click="openImageInNewTab(file)"
                        />
                        <img
                          v-else-if="isImageFile(file) && (!file.link || imageLoadErrors[file.id])"
                          src="@/assets/icons/taskFiles/image.svg"
                          :alt="file.title"
                          class="file-type-icon"
                        />
                        <img
                          v-else-if="isWordFile(file)"
                          src="@/assets/icons/taskFiles/word.svg"
                          :alt="file.title"
                          class="file-type-icon"
                        />
                        <img
                          v-else-if="isPdfFile(file)"
                          src="@/assets/icons/taskFiles/pdf.svg"
                          :alt="file.title"
                          class="file-type-icon"
                        />
                        <v-icon v-else size="60" class="fallback-icon">mdi-file</v-icon>
                      </div>

                      <v-divider class="mt-4 mb-1"></v-divider>

                      <div class="text-center">
                        <div class="text-body-2 font-weight-medium">{{ file.title }}</div>
                        <div class="text-caption text-grey">{{ formatFileSize(file.size) }} | {{ formatDate(file.createdAt) }}</div>
                      </div>
                    </v-card>
                  </div>
                </div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <!-- Footer -->
        <div
          v-if="tab === 'overview'"
          class="d-flex justify-end pa-6"
          style="border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12)"
        >


          <v-btn
            color="primary"
            style=" height: 44px"
            @click="$emit('save', taskDetails)"
            flat
            :elevation="0"
            rounded="lg"
            class="px-7"
            :disabled="submitDisabled"
          >
            Submit Information
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { parsedDate, formatDateDDMMYYYY } from "@/lib/dateFormatter";
import Avatar from "~/components/Common/avatar.vue";
import { useBus } from "@/composables/useBus";

const modelValue = ref(false);
const props = defineProps({
  selectedItem: Object,
  modelValue: Boolean,
});
const taskStore = useTaskStore();
const store = useMainStore();
const bus = useBus();
const tab = ref("overview");
const taskDetails = ref({});
const isDirty = ref(false);
const currentUserTaskId = ref(null);

// ==================== NEW COMMENT STATE MANAGEMENT ====================
// Replace old pagination state with normalized store
const commentMap = ref({});              // { [id]: comment } - O(1) lookups
const commentIds = ref([]);              // [id1, id2, id3] - ordered list
const hasMoreComments = ref(true);       // Simple flag: more to load?
const isLoadingComments = ref(false);    // Single loading state
let commentsCursor = 0;                  // Private pagination cursor

// Derived: Current visible comments from normalized state
const comments = computed(() =>
  commentIds.value.map(id => commentMap.value[id]).filter(Boolean)
);

// For adding new comments
const newComment = ref("");
const editingCommentId = ref(null);
const editCommentText = ref("");
// ========================================================================

const submitDisabled = computed(() => !isDirty.value);
const commentListRef = ref(null);
const imageLoadErrors = ref({});
const uploadProgress = ref(0);
const isUploading = ref(false);
const MAX_FILE_SIZE_MB = 20;
const allowedExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const taskDescription = computed({
  get: () => taskDetails.value?.taskDetails?.description || "",
  set: (val) => {
    if (!taskDetails.value) taskDetails.value = {};
    if (!taskDetails.value.taskDetails) taskDetails.value.taskDetails = {};
    taskDetails.value.taskDetails.description = val;
    isDirty.value = true;
  },
});

const fetchTaskDetails = async (force = false) => {
  if (isDirty.value && !force) return;

  let userTaskId;
  if (props.selectedItem.id) {
    userTaskId = props.selectedItem.id;
  } else {
    const users = props.selectedItem.assignedUsers;
    props.selectedItem.assignedUser = users[0];
    userTaskId = users[0].userTaskId;
  }

  imageLoadErrors.value = {};

  try {
    const res = await taskStore.getTaskDetails({ userTaskId });
    if (res.code === 0) {
      taskDetails.value = res.data;
      currentUserTaskId.value = userTaskId;
      await fetchComments(true);
      isDirty.value = false;
    }
  } catch (err) {
    console.error(err);
  }
};

watch(
  () => props.modelValue,
  async (newValue) => {
    modelValue.value = newValue;
    if (newValue) {
      // Reset normalized comment state
      commentMap.value = {};
      commentIds.value = [];
      hasMoreComments.value = true;
      commentsCursor = 0;
      await fetchTaskDetails();
    } else {
      taskDetails.value = {};
      // Reset normalized comment state
      commentMap.value = {};
      commentIds.value = [];
      hasMoreComments.value = true;
      commentsCursor = 0;
      isDirty.value = false;
      tab.value = "overview"; // Reset to overview tab
    }
  },
  { immediate: true }
);

const handleExternalUpdate = (payload = {}) => {
  if (!modelValue.value) return;
  const matches =
    payload.userTaskId === currentUserTaskId.value ||
    payload.taskId === taskDetails.value?.taskDetails?.id;
  if (matches && !isDirty.value) {
    fetchTaskDetails();
  }
};

onMounted(() => {
  bus.on("task-updated", handleExternalUpdate);
});

onBeforeUnmount(() => {
  bus.off("task-updated", handleExternalUpdate);
});

const touchDirty = () => {
  isDirty.value = true;
};

// ==================== NEW FETCH COMMENTS WITH NORMALIZED STATE ====================
const fetchComments = async (reset = false) => {
  if (!currentUserTaskId.value) return;
  if (isLoadingComments.value) return;
  
  try {
    isLoadingComments.value = true;
    
    // Calculate offset based on already loaded comments
    const offset = reset ? 0 : Object.keys(commentMap.value).length;
    
    if (reset) {
      // Clear normalized state on reset
      commentMap.value = {};
      commentIds.value = [];
      commentsCursor = 0;
      hasMoreComments.value = true;
    }
    
    const res = await taskStore.listTaskComments({
      userTaskId: currentUserTaskId.value,
      limit: 10,
      offset,
    });
    
    if (res.code === 0) {
      const newComments = res.data || [];
      
      // Add new comments to normalized store
      newComments.forEach(comment => {
        commentMap.value[comment.id] = comment;
        if (!commentIds.value.includes(comment.id)) {
          // Prepend newer comments at start (for infinite scroll)
          commentIds.value.unshift(comment.id);
        }
      });
      
      // Update flag: if we got fewer than requested, no more to load
      hasMoreComments.value = newComments.length >= 10;
      
      // Scroll to bottom after first load
      if (reset) {
        nextTick(() => scrollCommentsToBottom());
      }
    }
  } catch (err) {
    console.error("Failed to fetch comments", err);
  } finally {
    isLoadingComments.value = false;
  }
};
// ==============================================================================

// ==================== OPTIMISTIC ADD COMMENT ====================
const addComment = async () => {
  if (!newComment.value.trim()) return;
  
  const tempId = 'temp_' + Date.now();
  const tempComment = {
    id: tempId,
    comment: newComment.value.trim(),
    author: { fullName: store.currentUser?.fullName || 'You' },
    createdAt: new Date().toISOString(),
  };
  
  try {
    // OPTIMISTIC: Add to UI immediately
    commentMap.value[tempId] = tempComment;
    commentIds.value.unshift(tempId);
    const userInput = newComment.value;
    newComment.value = "";
    
    // API call
    const res = await taskStore.addTaskComment({
      userTaskId: currentUserTaskId.value,
      comment: userInput,
    });
    
    if (res.code === 0) {
      const actualComment = res.data;
      const commentWithAuthor = {
        ...actualComment,
        author: {
          fullName: store.currentUser?.fullName || 'You',
          id: actualComment.userId,
        },
      };
      // Replace temp comment with real one
      delete commentMap.value[tempId];
      commentMap.value[commentWithAuthor.id] = commentWithAuthor;
      
      const idx = commentIds.value.indexOf(tempId);
      if (idx !== -1) {
        commentIds.value[idx] = commentWithAuthor.id;
      }
      
      store.setSnackbar({
        title: "Comment added successfully",
        type: "success",
      });
    } else {
      // ROLLBACK: Remove temp comment on API failure
      delete commentMap.value[tempId];
      commentIds.value = commentIds.value.filter(id => id !== tempId);
      newComment.value = userInput; // Restore text
      
      store.setSnackbar({
        title: res.message || "Failed to add comment",
        type: "error",
      });
    }
  } catch (err) {
    // ROLLBACK: Remove temp comment on error
    delete commentMap.value[tempId];
    commentIds.value = commentIds.value.filter(id => id !== tempId);
    
    console.error("Failed to add comment", err);
    store.setSnackbar({
      title: err.message || "Failed to add comment",
      type: "error",
    });
  }
};
// =================================================================

// ==================== OPTIMISTIC DELETE COMMENT ====================
const deleteComment = async (comment) => {
  try {
    // OPTIMISTIC: Remove from UI immediately
    const backup = commentMap.value[comment.id];
    delete commentMap.value[comment.id];
    commentIds.value = commentIds.value.filter(id => id !== comment.id);
    
    // API call
    const res = await taskStore.deleteTaskComment({ commentId: comment.id });
    
    if (res.code === 0) {
      store.setSnackbar({
        title: "Comment deleted successfully",
        type: "success",
      });
    } else {
      // ROLLBACK: Restore comment if API fails
      commentMap.value[comment.id] = backup;
      commentIds.value.push(comment.id);
      
      store.setSnackbar({
        title: res.message || "Failed to delete comment",
        type: "error",
      });
    }
  } catch (err) {
    // ROLLBACK: Restore comment on error
    commentMap.value[comment.id] = comment;
    commentIds.value.push(comment.id);
    
    console.error("Failed to delete comment", err);
    store.setSnackbar({
      title: err.message || "Failed to delete comment",
      type: "error",
    });
  }
};
// =====================================================================

// ==================== EDIT COMMENT WITH OPTIMISM ====================
const startEditComment = (comment) => {
  editingCommentId.value = comment.id;
  editCommentText.value = comment.comment;
};

const cancelEdit = () => {
  editingCommentId.value = null;
  editCommentText.value = "";
};

const saveEditComment = async (comment) => {
  if (!editCommentText.value.trim()) return;
  
  try {
    const original = { ...commentMap.value[comment.id] };
    
    // OPTIMISTIC: Update UI immediately
    commentMap.value[comment.id].comment = editCommentText.value.trim();
    editingCommentId.value = null;
    
    // API call
    const res = await taskStore.updateTaskComment({
      commentId: comment.id,
      comment: editCommentText.value.trim(),
    });
    
    if (res.code === 0) {
      store.setSnackbar({
        title: "Comment updated successfully",
        type: "success",
      });
    } else {
      // ROLLBACK: Restore original comment if API fails
      commentMap.value[comment.id] = original;
      editingCommentId.value = comment.id;
      editCommentText.value = original.comment;
      
      store.setSnackbar({
        title: res.message || "Failed to update comment",
        type: "error",
      });
    }
  } catch (err) {
    // ROLLBACK on error
    commentMap.value[comment.id].comment = comment.comment;
    editingCommentId.value = null;
    
    console.error("Failed to update comment", err);
    store.setSnackbar({
      title: err.message || "Failed to update comment",
      type: "error",
    });
  }
};
// =====================================================================

// ==================== SMART SCROLL LOADING ====================
const onCommentsScroll = () => {
  const el = commentListRef.value;
  if (!el) return;
  
  // Load when scrolled to top (with buffer) AND more comments exist AND not already loading
  const isAtTop = el.scrollTop < 50;
  
  if (isAtTop && hasMoreComments.value && !isLoadingComments.value) {
    fetchComments(false);
  }
};
// ==============================================================

const scrollCommentsToBottom = () => {
  const el = commentListRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

const formatFileSize = (size) => {
  if (!size) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(1) * 1 +
    " " +
    ["B", "KB", "MB", "GB", "TB"][i]
  );
};

const formatDate = (date) => {
  return parsedDate(date);
};

const config = useRuntimeConfig();

// Check if file is an image
const isImageFile = (file) => {
  if (!file || !file.type) return false;
  return file.type.startsWith('image/');
};

// Check if file is a Word document
const isWordFile = (file) => {
  if (!file) return false;
  if (file.type) {
    return file.type === 'application/msword' || 
           file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (file.title) {
    const ext = file.title.split('.').pop()?.toLowerCase();
    return ext === 'doc' || ext === 'docx';
  }
  return false;
};

// Check if file is a PDF
const isPdfFile = (file) => {
  if (!file) return false;
  if (file.type) {
    return file.type === 'application/pdf';
  }
  if (file.title) {
    const ext = file.title.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  }
  return false;
};

// Get full image URL
const getImageUrl = (link) => {
  if (!link) return '';
  // If link already starts with http, return as is
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  // Otherwise, prepend BASE_URL
  const baseUrl = config.public.BASE_URL || '';
  return `${baseUrl}${link}`;
};

// Handle image load errors
const handleImageError = (event, file) => {
  // Mark this file as having a load error
  if (file && file.id) {
    imageLoadErrors.value[file.id] = true;
  }
};

// Open image in new tab
const openImageInNewTab = (file) => {
  if (file && file.link) {
    const fullUrl = getImageUrl(file.link);
    window.open(fullUrl, '_blank');
  }
};

// Get full file URL
const getFileUrl = (link) => {
  if (!link) return '';
  // If link already starts with http, return as is
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  // Otherwise, prepend BASE_URL
  const baseUrl = config.public.BASE_URL || '';
  return `${baseUrl}${link}`;
};

// View file - opens Word docs in Google Docs Viewer, others normally
const viewFile = (file) => {
  if (!file || !file.link) return;
  
  const fullUrl = getFileUrl(file.link);
  
  if (isWordFile(file)) {
    // Open Word documents in Google Docs Viewer
    const encodedUrl = encodeURIComponent(fullUrl);
    const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    window.open(viewerUrl, '_blank');
  } else {
    // Open other files normally
    window.open(fullUrl, '_blank');
  }
};

// Delete file function
const deleteFile = async (file) => {
  if (!file || !file.id) {
    store.setSnackbar({
      title: "Invalid file",
      type: "error",
    });
    return;
  }

  try {
    const res = await taskStore.deleteAttachment({
      id: file.id,
    });

    if (res.code === 0) {
      // Refresh task details to update the attachments list
      const wasDirty = isDirty.value;
      await fetchTaskDetails(true);
      // Restore dirty state or set to true if file was deleted
      isDirty.value = wasDirty || true;
      store.setSnackbar({
        title: res.data || "File removed from task",
        type: "success",
      });
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Failed to delete file",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  }
};

const isAllowedFile = (file) => {
  const ext = (file.name || "").split(".").pop()?.toLowerCase();
  return (
    (ext && allowedExtensions.includes(ext)) ||
    (file.type && allowedMimeTypes.includes(file.type))
  );
};

const isWithinSize = (file) => {
  return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
};

const uploadFile = async (files) => {
  try {
    const fileArray = Array.isArray(files) ? files : [files].filter(Boolean);
    if (!fileArray.length) return;

    const disallowed = fileArray.filter((file) => !isAllowedFile(file));
    if (disallowed.length) {
      store.setSnackbar({
        title: `File type not allowed: ${disallowed.map((f) => f.name).join(", ")}`,
        type: "error",
      });
    }
    const tooLarge = fileArray.filter((file) => !isWithinSize(file));
    if (tooLarge.length) {
      store.setSnackbar({
        title: `File size exceeds ${MAX_FILE_SIZE_MB}MB: ${tooLarge
          .map((f) => f.name)
          .join(", ")}`,
        type: "error",
      });
    }

    const validFiles = fileArray.filter(
      (file) => isAllowedFile(file) && isWithinSize(file)
    );
    if (!validFiles.length) return;

    const formData = new FormData();
    formData.append("userTaskId", props.selectedItem.id);
    validFiles.forEach((file) => formData.append("files", file));

    uploadProgress.value = 0;
    isUploading.value = true;

    const res = await taskStore.addAttachments(formData, {
      onProgress: (percent) => {
        uploadProgress.value = percent;
      },
    });
    uploadProgress.value = 100;

    if (res.code === 0) {
      // Store the current dirty state before refreshing
      const wasDirty = isDirty.value;
      await fetchTaskDetails(true);
      // Restore dirty state or set to true if file was uploaded
      isDirty.value = wasDirty || true;
      store.setSnackbar({
        title: "File upload successful",
        type: "success",
      });
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Upload failed",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message || "An unexpected error occurred",
      type: "error",
    });
  } finally {
    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
    }, 400);
  }
};

</script>

<style scoped>
/* Keep text color default, even when tab is active */
.title {
  
  font-weight: 600;
  font-size: 16px;
}
.custom-tabs{
  border-bottom: 1px solid #dbdbdb;

}
.custom-tabs .v-tab {
  color: inherit !important;
}

/* Optional: Add subtle weight on active tab */
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
.key-text {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
  margin-top: 4px;
}

.value-text {
  
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.menu-item:hover {
  background-color: #f5f5f5 !important;
  cursor: pointer;
}
.bonus-chip {
  border: 1px solid #fea200;
  background-color: #fff0d5;
  color: #1e1e1e; /* Text color */
  font-weight: 500;
  font-size: 13px;
  border-radius: 16px;
}

/* Deep selector to target the icon inside the chip */
::v-deep(.bonus-chip .v-icon) {
  color: #fea200;
}
.cust-lbl {
  
  font-weight: bold;
  font-size: 14px;
}
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* each card min 220px; grows to fill row */
  gap: 18px; /* uniform horizontal + vertical gap */
  align-items: start; /* don't stretch grid items vertically */
}
.attachment-item {
  display: flex;
}
.card-equal {
  width: 100%;
  min-height: 260px; /* ensures uniform height for all cards */
  box-sizing: border-box;
}
.top-icons {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: flex;
  flex-direction: row;
  gap: 6px;
}

/* ensure card uses relative positioning for absolute top-icons */
.card-equal { position: relative; }

.image-preview-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.file-preview-image {
  width: 100%;
  height: 140px;         /* consistent preview height */
  object-fit: cover;     /* fill box, crop if needed */
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.file-preview-image:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.fallback-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.file-type-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 12px;
}
.comment-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafbff;
  position: relative;
}
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.comment-actions {
  opacity: 0;
  display: flex;
  gap: 4px;
  transition: opacity 0.15s ease;
}
.comment-item:hover .comment-actions {
  opacity: 1;
}
.author-meta .name {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
}
.author-meta .timestamp {
  font-size: 12px;
  color: #6b7280;
}
.comment-body {
  font-size: 13px;
  color: #1f2937;
  line-height: 1.4;
  white-space: pre-wrap;
}
.comments-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sticky-composer {
  position: sticky;
  bottom: 0;
  background: #fff;
  z-index: 1;
}
</style>
