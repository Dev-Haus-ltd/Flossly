<template>
  <v-card
    class="automation-card rounded-xl"
    :class="{ 'automation-card--active': selected }"
    variant="text"
    @click="$emit('select')"
  >
    <div class="automation-illustration mb-3">
      <img src="@/assets/images/taskpool/operational.svg" alt="automation" class="illustration-img" />
    </div>
    <div class="automation-title-row">
      <CommonTruncatedText
        :text="title"
        :max-width="160"
        text-class="automation-title"
      />
      <div v-if="showActions" class="automation-actions">
        <v-btn
          icon
          variant="text"
          size="x-small"
          class="action-btn"
          :disabled="disableActions"
          @click.stop="$emit('edit')"
        >
          <img :src="editIcon" alt="Edit" width="15" height="15" />
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="x-small"
          class="action-btn"
          :disabled="disableActions"
          @click.stop="$emit('delete')"
        >
          <img :src="deleteIcon" alt="Delete" width="15" height="15" />
        </v-btn>
      </div>
    </div>
    <span class="automation-sub mb-1 d-block">by {{ authorLabel }}</span>
    <span v-if="createdAt" class="automation-created d-block mb-1">Created {{ formattedDate }}</span>
    <div class="automation-desc clamp-2">{{ description }}</div>
    <div class="wa-warning-chip mt-2" :style="{ visibility: whatsappWarning ? 'visible' : 'hidden' }">
      <v-icon size="13" class="mr-1">mdi-wifi-off</v-icon>
      WhatsApp not connected
    </div>
    <div class="d-flex align-center justify-space-between mt-3">
      <div class="d-flex align-center text-grey">
        <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
        <span class="count">{{ count }}</span>
      </div>
      <div class="d-flex align-center" style="gap: 6px;">
        <span
          v-if="bulkState && bulkState.totalCount > 0"
          class="bulk-pill"
          :class="{
            'bulk-pill--full': isBulkFullyEnabled,
            'bulk-pill--mixed': isBulkMixed,
            'bulk-pill--none': !isBulkFullyEnabled && !isBulkMixed,
          }"
        >{{ bulkState.enabledCount }}/{{ bulkState.totalCount }}</span>
        <v-switch
          v-if="showToggle"
          density="compact"
          inset
          hide-details
          :color="bulkState ? bulkToggleColor : 'primary'"
          :model-value="bulkState ? isBulkFullyEnabled : enabled"
          :disabled="disableToggle"
          @click.stop="disableToggle ? null : $emit('toggle', bulkState ? !isBulkFullyEnabled : !enabled)"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import CommonTruncatedText from '@/components/Common/TruncatedText.vue'
import { formatDateTime } from '@/lib/dateFormatter'
import editIcon from '@/assets/icons/edit.svg'
import deleteIcon from '@/assets/crm/delete.svg'

const props = defineProps({
  title: String,
  description: String,
  count: [Number, String],
  enabled: Boolean,
  selected: Boolean,
  author: {
    type: String,
    default: '',
  },
  showToggle: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
  disableActions: {
    type: Boolean,
    default: false,
  },
  whatsappWarning: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    default: null,
  },
  bulkState: {
    type: Object,
    default: null,
  },
  disableToggle: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select', 'toggle', 'edit', 'delete'])

const authorLabel = computed(() => {
  const raw = typeof props.author === 'string' ? props.author.trim() : ''
  return raw || 'Flossly'
})

const formattedDate = computed(() => formatDateTime(props.createdAt))

const isBulkFullyEnabled = computed(() =>
  !!props.bulkState && props.bulkState.enabledCount > 0 && props.bulkState.enabledCount === props.bulkState.totalCount
)
const isBulkMixed = computed(() =>
  !!props.bulkState && props.bulkState.enabledCount > 0 && props.bulkState.enabledCount < props.bulkState.totalCount
)
const bulkToggleColor = computed(() => {
  if (isBulkFullyEnabled.value) return 'primary'
  if (isBulkMixed.value) return 'warning'
  return undefined
})
</script>

<style scoped>
.automation-card { border:1px solid #dfdfdf; padding:16px; cursor:pointer; transition: all .2s ease; min-height: 260px; display:flex; flex-direction:column; position: relative; }
.automation-card:hover { box-shadow:0 6px 22px rgba(0,0,0,0.06); }
.automation-card--active { border-color:#5a3fc0; box-shadow:0 6px 24px rgba(90,63,192,0.12); }
.automation-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.automation-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.action-btn { color: #6b7280; }
.action-btn:hover { color: #111827; }
.automation-illustration { height: 110px; border-radius: 10px; background: linear-gradient(135deg, #f3f4ff, #eef2ff); display:flex; align-items:center; justify-content:center; }
.illustration-img { max-height: 90px; object-fit: contain; }
.automation-title { font-weight:600; font-size:14px; }
.automation-desc { font-size:12px; color:#636363; }
.automation-sub { font-size:11px; color:#8b8b8b; }
.automation-created { font-size:10px; color:#b0b0b0; }
.count { color:#737373; font-size:14px; }
.wa-warning-chip {
  display: inline-flex;
  align-items: center;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #c2410c;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
}
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}
.bulk-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  min-width: 32px;
  line-height: 1.4;
}
.bulk-pill--full  { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.bulk-pill--mixed { background: #fff8e1; color: #e65100; border: 1px solid #ffe082; }
.bulk-pill--none  { background: #f5f5f5; color: #757575; border: 1px solid #e0e0e0; }
</style>
