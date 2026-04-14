<!-- components/diary/ClipboardPanel.vue -->
<template>
  <div class="clipboard-panel" :class="{ open: modelValue }">
    <div class="drawer-content">
      <div class="panel-header">
        <div class="header-title">
          <v-icon size="20" color="#6d4aff">mdi-clipboard-outline</v-icon>
          <span class="title-text">Draft</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-2">
            {{ drafts.length }}
          </v-chip>
        </div>
        <div class="header-actions">
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="onClose"
            title="Close clipboard"
          />
          <v-btn
            v-if="drafts.length"
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            color="error"
            @click="showClearAllConfirm = true"
            title="Clear all drafts"
          />
        </div>
      </div>

      <v-divider />

      <div class="clipboard-content" :class="{ empty: drafts.length === 0 }">
        <div v-if="drafts.length === 0" class="empty-state">
          <v-icon size="48" color="#d1d5db">mdi-clipboard-text-outline</v-icon>
          <p class="empty-text">No draft appointments</p>
          <p class="empty-hint">
            Save appointments to clipboard from the modal
          </p>
        </div>

        <div v-else class="drafts-list">
          <DraggableCard
            v-for="draft in drafts"
            :key="draft.id"
            :draft="draft"
            @remove="onRemoveDraft"
            @edit="editDraft"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
          />
        </div>
      </div>
    </div>

    <CommonConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete draft appointment?"
      :message="`Are you sure you want to delete draft for ${deleteTarget?.draft?.patient || 'this patient'}?`"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <CommonConfirmDialog
      v-model="showClearAllConfirm"
      title="Clear all drafts?"
      message="Are you sure you want to clear all draft appointments? This action cannot be undone."
      :loading="clearingAll"
      @confirm="confirmClearAll"
      @cancel="cancelClearAll"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import DraggableCard from "./DraggableCard.vue";
import CommonConfirmDialog from "@/components/Common/ConfirmDialog.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "use-draft",
  "close",
  "drag-start",
  "drag-end",
  "update-count",
]);

// Drafts storage
const drafts = ref([]);

// Delete state
const showDeleteConfirm = ref(false);
const showClearAllConfirm = ref(false);
const deleting = ref(false);
const clearingAll = ref(false);
const deleteTarget = ref({ index: -1, draft: null });

// Emit count update to parent
const emitCountUpdate = () => {
  emit("update-count", drafts.value.length);
};

// Load drafts from localStorage
const loadDrafts = () => {
  try {
    const saved = localStorage.getItem("flossly_appointment_drafts");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const unique = [];
        const seen = new Set();
        parsed.forEach((d) => {
          if (!d) return;
          const key =
            d.id ||
            `${String(d.patientId || d.patient || "")}:${String(d.date || "")}:${String(d.time || "")}:${String(d.practitioner || "")}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(d);
          }
        });
        drafts.value = unique;
      }
    }
  } catch (e) {
    console.error("Failed to load drafts:", e);
  }
  emitCountUpdate();
};

// Save drafts to localStorage
const saveDrafts = () => {
  try {
    localStorage.setItem(
      "flossly_appointment_drafts",
      JSON.stringify(drafts.value),
    );
  } catch (e) {
    console.error("Failed to save drafts:", e);
  }
  emitCountUpdate();
};

// Add a new draft appointment
const addDraft = (appointmentData) => {
  if (!appointmentData) return;

  const duplicateKey = appointmentData.id
    ? String(appointmentData.id)
    : `${String(appointmentData.patientId || appointmentData.patient || "")}:${String(appointmentData.date || "")}:${String(appointmentData.time || "")}:${String(appointmentData.practitioner || "")}`;

  const existing = drafts.value.some((d) => {
    const existingKey =
      d.id ||
      `${String(d.patientId || d.patient || "")}:${String(d.date || "")}:${String(d.time || "")}:${String(d.practitioner || "")}`;
    return existingKey === duplicateKey;
  });

  if (existing) {
    return;
  }

  const draft = {
    id: appointmentData.id
      ? String(appointmentData.id)
      : `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...appointmentData,
    createdAt: new Date().toISOString(),
    isDraft: true,
  };
  drafts.value.unshift(draft);
  saveDrafts();
};

// Handle remove draft (show confirmation)
const onRemoveDraft = (draftId) => {
  const index = drafts.value.findIndex((d) => d.id === draftId);
  if (index !== -1) {
    deleteTarget.value = { index, draft: drafts.value[index] };
    showDeleteConfirm.value = true;
  }
};

// Confirm delete single draft
const confirmDelete = async () => {
  try {
    deleting.value = true;
    const { index } = deleteTarget.value;
    if (index !== -1) {
      drafts.value.splice(index, 1);
      saveDrafts();
    }
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
    deleteTarget.value = { index: -1, draft: null };
  }
};

// Cancel delete
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteTarget.value = { index: -1, draft: null };
};

// Confirm clear all drafts
const confirmClearAll = async () => {
  try {
    clearingAll.value = true;
    drafts.value = [];
    saveDrafts();
  } finally {
    clearingAll.value = false;
    showClearAllConfirm.value = false;
  }
};

// Cancel clear all
const cancelClearAll = () => {
  showClearAllConfirm.value = false;
};

// Edit draft (re-open modal with draft data)
const editDraft = (draft) => {
  emit("use-draft", draft);
  // Don't remove draft here - it will be removed after edit/save
  // removeDraft(draft.id);
};

const onDragStart = (draft) => {
  emit("drag-start", draft);
};

const onDragEnd = () => {
  emit("drag-end");
};

const onClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

// Watch drafts for changes and emit count update
watch(
  drafts,
  () => {
    emitCountUpdate();
  },
  { deep: true },
);

// Expose methods for parent component
defineExpose({
  addDraft,
  drafts,
  loadDrafts,
  getDraftCount: () => drafts.value.length,
  removeDraft: (draftId) => {
    const index = drafts.value.findIndex((d) => d.id === draftId);
    if (index !== -1) {
      drafts.value.splice(index, 1);
      saveDrafts();
    }
  },
});

onMounted(() => {
  loadDrafts();
});
</script>

<style scoped lang="scss">
.clipboard-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  max-width: 100%;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 20px rgba(15, 23, 42, 0.08);
  transform: translateX(100%);
  transition: transform 0.25s ease;
  z-index: 1050;
  display: flex;
  flex-direction: column;
}

.clipboard-panel.open {
  transform: translateX(0);
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.clipboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.clipboard-content.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
  margin-top: 12px;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.drafts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
