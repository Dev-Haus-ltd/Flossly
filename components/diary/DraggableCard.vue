<!-- components/diary/DraggableCard.vue -->
<template>
  <div
    class="appointment-card full draggable-draft"
    draggable="true"
    :style="cardStyle"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    
  >
    <div class="card-inner full">
      <div class="full-header">
        <div class="full-left">
          <img :src="statusIcon" alt="status" class="status-icon full-icon" />
          
          <div class="full-details">
            <div class="patient-name full-name">
              {{ draft.patient || 'No Patient' }}
            </div>
            <div class="appointment-time">
              {{ draft.time }} • {{ draft.duration }} min
            </div>
          </div>
        </div>

        <div class="status-badge full-badge">
          <span class="status-dot"></span>
          <span class="status-label">{{ draft.status || 'Draft' }}</span>
        </div>
      </div>

      <div class="full-meta">
        <div class="meta-chip treatment-chip" :style="treatmentChipStyle">
          {{ draft.exam || draft.treatmentName || 'No treatment' }}
        </div>
        
        <div class="draft-actions">
          <!-- <v-btn
            icon="mdi-pencil"
            size="x-small"
            variant="text"
            density="comfortable"
            @click.stop="onEdit"
          /> -->
          <v-btn
            icon="mdi-delete"
            size="x-small"
            variant="text"
            color="error"
            density="comfortable"
            @click.stop="onDeleteClick"
          />
        </div>
      </div>

      <div class="practitioner-info">
        <v-icon size="12" class="mr-1">mdi-account-tie</v-icon>
        <span>{{ draft.practitioner }}</span>
        <span class="ml-auto text-caption">{{ formatDate(draft.date) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateDDMMYYYY } from '@/lib/dateFormatter';

// Import icons
import pendingIcon from '@/assets/diary/appointment/pending.svg'
import confirmedIcon from '@/assets/diary/appointment/confirmed.svg'
import arrivedIcon from '@/assets/diary/appointment/arrived.svg'
import inSurgeryIcon from '@/assets/diary/appointment/inSurgery.svg'
import completeIcon from '@/assets/diary/appointment/complete.svg'
import cancelledIcon from '@/assets/diary/appointment/cancelled.svg'
import dnaIcon from '@/assets/diary/appointment/didNotAttend.svg'
import draftIcon from '@/assets/icons/mainDrawerIcons/dashboard.svg'
const props = defineProps({
  draft: { type: Object, required: true }
});

const emit = defineEmits(['remove', 'edit', 'drag-start', 'drag-end']);

// Matching the statusColors from AppointmentCard logic
const statusColors = {
  'Draft': { bg: '#f5f5f5', chip: '#9e9e9e' },
  'Pending': { bg: '#fceaf6', chip: '#d948a8' },
  'Confirmed': { bg: '#ede8ff', chip: '#6d4aff' },
  'Arrived': { bg: '#e8f0ff', chip: '#397bff' },
  'In Surgery': { bg: '#e5fbf8', chip: '#00b2a5' },
  'Complete': { bg: '#e5fbea', chip: '#23b96d' },
  'Cancelled': { bg: '#ffeaea', chip: '#ff5353' },
  'Did not attend': { bg: '#fff2e0', chip: '#ffa12e' }
};

const iconMap = {
  'draft': draftIcon,
  'pending': pendingIcon,
  'confirmed': confirmedIcon,
  'arrived': arrivedIcon,
  'in surgery': inSurgeryIcon,
  'complete': completeIcon,
  'cancelled': cancelledIcon,
  'did not attend': dnaIcon,
};

const statusIcon = computed(() => {
  const key = String(props.draft?.status || 'draft').trim().toLowerCase();
  return iconMap[key]?.icon || pendingIcon;
});


const cardStyle = computed(() => {
  const status = props.draft.status || 'Draft';
  const colors = statusColors[status] || statusColors.Draft;
  return {
    '--status-bg': colors.bg,
    '--status-chip': colors.chip,
    backgroundColor: colors.bg,
    borderLeftColor: colors.chip
  };
});

const treatmentChipStyle = computed(() => {
  return {
    background: 'var(--status-chip)',
    color: '#fff'
  };
});

const formatDate = (date) => {
  if (!date) return '';
  return formatDateDDMMYYYY(date);
};

const onDragStart = (event) => {
  const dragData = { 
    type: 'clipboard-draft', 
    draft: { ...props.draft, isDraft: true } // Ensure isDraft flag is set
  };
  const payload = JSON.stringify(dragData);
  
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/x-flossly-draft', payload);
    event.dataTransfer.setData('text/plain', payload);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setDragImage(new Image(), 0, 0);
  }
  
  emit('drag-start', props.draft);
};

const onDragEnd = () => {
  console.log('Clipboard drag end', { draftId: props.draft.id });
  emit('drag-end');
};

const onEdit = () => emit('edit', props.draft);
const onDeleteClick = () => emit('remove', props.draft.id);
</script>

<style scoped lang="scss">
.appointment-card {
  border-radius: 7px;
  border-left: 3px solid var(--status-chip);
  cursor: grab;
  transition: all 0.15s ease;
  position: relative;
  box-sizing: border-box;
  user-select: none;
  margin-bottom: 8px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  &:active {
    cursor: grabbing;
  }
}

.appointment-card.full {
  padding: 10px;
  min-height: 80px;
}

.card-inner.full {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.full-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.full-icon {
  width: 28px;
  height: 28px;
}

.full-name {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
}

.appointment-time {
  font-size: 11px;
  color: #6b7280;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--status-chip);
  color: #fff;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 500;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.full-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.treatment-chip {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.practitioner-info {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 6px;
}

.draft-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.appointment-card:hover .draft-actions {
  opacity: 1;
}
</style>