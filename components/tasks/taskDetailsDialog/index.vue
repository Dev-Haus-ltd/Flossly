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
                      <v-icon size="18" class="mr-2">mdi-pencil</v-icon>
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
                      taskDetails.dueDate ? taskDetails.dueDate : "No due date"
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
                    :rules="requiredRule"
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
                      <v-icon size="18">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="24"
                      variant="text"
                      class="comment-action-btn"
                      @click="deleteComment(comment)"
                    >
                      <v-icon size="18" color="error">mdi-delete</v-icon>
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
                <v-row class="mt-5" dense>
                  <v-col
                    cols="3"
                    v-for="file in taskDetails.attachments"
                    :key="file.id"
                  >
                    <v-card
                      class="d-flex flex-column justify-space-between pa-3"
                      style="
                        border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
                        border-radius: 8px;
                        position: relative;
                        min-height: 150px;
                      "
                      elevation="0"
                    >
                      <!-- Top Right Icons -->
                      <div
                        class="d-flex flex-column align-center"
                        style="
                          position: absolute;
                          top: 8px;
                          right: 8px;
                          z-index: 1;
                        "
                      >
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          :href="file.link"
                          target="_blank"
                        >
                          <v-icon size="16">mdi-download</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          @click="deleteFile(file)"
                        >
                          <v-icon size="16" color="error">mdi-delete</v-icon>
                        </v-btn>
                      </div>

                      <!-- Center File Icon or Preview -->
                      <div
                        class="d-flex align-center justify-center"
                        style="margin-top: 30px"
                      >
                        <v-icon size="60">mdi-file</v-icon>
                      </div>

                      <!-- Divider -->
                      <v-divider class="mt-4 mb-1"></v-divider>

                      <!-- Footer: Name and Meta -->
                      <div class="text-center">
                        <div class="text-body-2 font-weight-medium">
                          {{ file.title }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ formatFileSize(file.size) }} |
                          {{ formatDate(file.createdAt) }}
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <!-- Footer -->
        <div
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
import { parsedDate } from "@/lib/dateFormatter";
import Avatar from "~/components/Common/avatar.vue";
import { useBus } from "@/composables/useBus";
import { startTaskEvents } from "@/composables/useTaskEvents";

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
const comments = ref([]);
const newComment = ref("");
const editingCommentId = ref(null);
const editCommentText = ref("");
const submitDisabled = computed(() => !isDirty.value);
const commentsPage = ref(0);
const commentsLimit = ref(10);
const commentsEnd = ref(false);
const isLoadingComments = ref(false);
const commentListRef = ref(null);
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

const fetchTaskDetails = async () => {
  if (isDirty.value) return; // don't overwrite local edits while typing
  let userTaskId;
  if (props.selectedItem.id) {
    userTaskId = props.selectedItem.id;
  } else {
    const users = props.selectedItem.assignedUsers;
    props.selectedItem.assignedUser = users[0];
    userTaskId = users[0].userTaskId;
  }
  try {
    const res = await taskStore.getTaskDetails({
      userTaskId,
    });
    if (res.code === 0) {
      taskDetails.value = res.data;
      currentUserTaskId.value = userTaskId;
      await fetchComments(userTaskId);
      isDirty.value = false;
      console.log(taskDetails.value);
    } else {
      console.error("Failed to fetch task details:", res.message);
    }
  } catch (err) {
    console.error("Error fetching task details:", err);
  }
};

watch(
  () => props.modelValue,
  async (newValue) => {
    modelValue.value = newValue;
    if (newValue) {
      await fetchTaskDetails();
    } else {
      taskDetails.value = {}; // Optional: reset on close
      isDirty.value = false;
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

const handleStorageUpdate = (event) => {
  if (event.key !== "task-updated") return;
  try {
    const payload = JSON.parse(event.newValue);
    handleExternalUpdate(payload);
  } catch (err) {
    // ignore malformed payload
  }
};

onMounted(() => {
  startTaskEvents();
  bus.on("task-updated", handleExternalUpdate);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageUpdate);
  }
});

onBeforeUnmount(() => {
  bus.off("task-updated", handleExternalUpdate);
  if (typeof window !== "undefined") {
    window.removeEventListener("storage", handleStorageUpdate);
  }
});

const touchDirty = () => {
  isDirty.value = true;
};

const fetchComments = async (userTaskId, reset = false) => {
  if (!userTaskId) return;
  if (isLoadingComments.value) return;
  if (reset) {
    commentsPage.value = 0;
    commentsEnd.value = false;
    comments.value = [];
  }
  try {
    isLoadingComments.value = true;
    const res = await taskStore.listTaskComments({
      userTaskId,
      limit: commentsLimit.value,
      offset: commentsPage.value * commentsLimit.value,
    });
    if (res.code === 0) {
      const payload = res.data || [];
      if (payload.length < commentsLimit.value) {
        commentsEnd.value = true;
      }
      const ordered = [...payload].reverse(); // backend returns newest first
      if (commentsPage.value === 0 || reset) {
        comments.value = ordered;
        nextTick(() => scrollCommentsToBottom());
      } else {
        comments.value = ordered.concat(comments.value);
      }
      commentsPage.value += 1;
    }
  } catch (err) {
    console.error("Failed to fetch comments", err);
  } finally {
    isLoadingComments.value = false;
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  try {
    const res = await taskStore.addTaskComment({
      userTaskId: currentUserTaskId.value,
      comment: newComment.value.trim(),
    });
    if (res.code === 0) {
      newComment.value = "";
      await fetchComments(currentUserTaskId.value, true);
    }
  } catch (err) {
    console.error("Failed to add comment", err);
  }
};

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
    const res = await taskStore.updateTaskComment({
      commentId: comment.id,
      comment: editCommentText.value.trim(),
    });
    if (res.code === 0) {
      cancelEdit();
      await fetchComments(currentUserTaskId.value, true);
    }
  } catch (err) {
    console.error("Failed to update comment", err);
  }
};

const deleteComment = async (comment) => {
  try {
    const res = await taskStore.deleteTaskComment({ commentId: comment.id });
    if (res.code === 0) {
      await fetchComments(currentUserTaskId.value, true);
    }
  } catch (err) {
    console.error("Failed to delete comment", err);
  }
};

const onCommentsScroll = () => {
  const el = commentListRef.value;
  if (!el || isLoadingComments.value || commentsEnd.value) return;
  if (el.scrollTop === 0) {
    fetchComments(currentUserTaskId.value);
  }
};

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
      fetchTaskDetails();
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

const deleteFile = async (file) => {
  if (!file?.id) return;
  try {
    const res = await taskStore.deleteAttachment({ attachmentId: file.id });
    if (res.code === 0) {
      await fetchTaskDetails();
      store.setSnackbar({
        title: "File deleted successfully",
        type: "success",
      });
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Delete failed",
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
